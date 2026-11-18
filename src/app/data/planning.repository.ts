import {
  Firestore,
  Timestamp,
  collection,
  doc,
  getDocFromServer,
  getDocsFromServer,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  runTransaction,
  serverTimestamp,
  QueryConstraint,
  QueryDocumentSnapshot,
} from 'firebase/firestore';
import { ActiveScope } from '../domain/academic.models';
import { AcademicRepository } from './academic.repository';
import { WorkRepository } from './work.repository';
import { ScoreActivity, ScoreAttempt, Task } from '../domain/work.models';
import {
  Deadline,
  Installment,
  InstallmentInput,
  GradingRules,
  GradingRulesInput,
  CourseOutcome,
  CourseOutcomeInput,
} from '../domain/planning.models';
import { installmentInput, rulesInput, outcomeInput, calculateCourse } from '../domain/grading';
import { dateOnly, recordId } from '../domain/academic.validation';
import { ApplicationError, asApplicationError } from '../core/errors/application-error';
export interface InstallmentCursor {
  datasetId: string;
  uid: string;
  row: QueryDocumentSnapshot;
  revision: number;
}
export interface OverviewCursor {
  queryKey: string;
  revision: number;
  streams: Map<string, QueryDocumentSnapshot | null>;
}
type Name = 'installments' | 'gradingRules' | 'courseOutcomes';
type RecordValue = Installment | GradingRules | CourseOutcome;
type Input = InstallmentInput | GradingRulesInput | CourseOutcomeInput;
export class PlanningRepository {
  constructor(
    private readonly db: Firestore,
    private readonly online: () => boolean = () => true,
  ) {}
  private connected() {
    if (!this.online()) throw new ApplicationError('offline', 'Nema internetske veze.');
  }
  private ref(scope: ActiveScope, name: string, id: string) {
    return doc(
      this.db,
      'users',
      recordId(scope.uid),
      'datasets',
      recordId(scope.datasetId),
      name,
      recordId(id),
    );
  }
  private parse(name: Name, value: Input): Input {
    return name === 'installments'
      ? installmentInput(value as InstallmentInput)
      : name === 'gradingRules'
        ? rulesInput(value as GradingRulesInput)
        : outcomeInput(value as CourseOutcomeInput);
  }
  private decode(name: Name, id: string, raw: Record<string, unknown>): RecordValue {
    if (
      raw['id'] !== id ||
      !Number.isSafeInteger(raw['revision']) ||
      Number(raw['revision']) < 1 ||
      !(raw['updatedAt'] instanceof Timestamp)
    )
      throw new ApplicationError('validation', 'Zapis nije valjan.');
    return {
      ...this.parse(name, raw as unknown as Input),
      id,
      revision: Number(raw['revision']),
      updatedAt: raw['updatedAt'],
    } as RecordValue;
  }
  async get(scope: ActiveScope, name: Name, id: string): Promise<RecordValue | null> {
    this.connected();
    try {
      const row = await getDocFromServer(this.ref(scope, name, id));
      return row.exists() ? this.decode(name, id, row.data()) : null;
    } catch (e) {
      throw asApplicationError(e);
    }
  }
  async installments(scope: ActiveScope, count = 50, previous?: InstallmentCursor) {
    this.connected();
    const rows: Installment[] = [];
    const academic = new AcademicRepository(this.db, this.online);
    const before = await academic.readControl(scope.uid);
    const append =
      previous?.revision === before.dataRevision &&
      previous.datasetId === scope.datasetId &&
      previous.uid === scope.uid;
    let cursor = append ? previous.row : undefined;
    let more: boolean;
    do {
      const snap = await getDocsFromServer(
        query(
          collection(this.db, 'users', scope.uid, 'datasets', scope.datasetId, 'installments'),
          orderBy('dueOn'),
          orderBy('__name__'),
          ...(cursor ? [startAfter(cursor)] : []),
          limit(50),
        ),
      );
      rows.push(
        ...snap.docs.map((d) => this.decode('installments', d.id, d.data()) as Installment),
      );
      more = snap.size === 50;
      cursor = snap.docs.at(-1);
      if (!more) break;
    } while (cursor && rows.length < (append ? 50 : count));
    const after = await academic.readControl(scope.uid);
    if (
      after.activeDatasetId !== scope.datasetId ||
      after.dataRevision !== before.dataRevision ||
      after.restoreToken !== before.restoreToken
    ) {
      throw new ApplicationError(
        'conflict',
        'Rate su promijenjene tijekom čitanja. Osvježi pregled.',
      );
    }
    return {
      rows,
      more,
      append,
      cursor: cursor && { ...scope, row: cursor, revision: after.dataRevision },
    };
  }
  async save(scope: ActiveScope, name: Name, id: string, input: Input, revision: number | null) {
    this.connected();
    const payload = this.parse(name, input),
      academic = new AcademicRepository(this.db, this.online);
    const baseline = await academic.readControl(scope.uid);
    if (name === 'gradingRules') {
      const data = await this.grading(scope, id);
      // Validation covers selection graph without interpreting unavailable real-world rules.
      calculateCourse(
        id,
        data.activities,
        data.attempts,
        payload as GradingRulesInput,
        data.completed,
      );
    }
    try {
      await runTransaction(this.db, async (tx) => {
        this.connected();
        const root = await tx.get(doc(this.db, 'users', scope.uid)),
          ref = this.ref(scope, name, id),
          old = await tx.get(ref),
          control = root.data();
        if (!control || control['activeDatasetId'] !== scope.datasetId)
          throw new ApplicationError('conflict', 'Podatkovni prostor je promijenjen.');
        if (control['restoreToken'] !== null)
          throw new ApplicationError('restoreInProgress', 'Povrat podataka je u tijeku.');
        if (name !== 'installments' && !(await tx.get(this.ref(scope, 'courses', id))).exists())
          throw new ApplicationError('notFound', 'Kolegij više ne postoji.');
        if (
          old.exists() &&
          JSON.stringify(this.parse(name, old.data() as Input)) === JSON.stringify(payload)
        )
          return;
        if ((old.exists() ? old.data()['revision'] : null) !== revision)
          throw new ApplicationError(
            'conflict',
            'Zapis je promijenjen na drugom uređaju; unos ostaje sačuvan.',
            old.exists() ? this.decode(name, id, old.data()) : null,
          );
        if (name === 'gradingRules' && baseline.dataRevision !== control['dataRevision'])
          throw new ApplicationError(
            'conflict',
            'Rezultati su promijenjeni tijekom provjere pravila. Osvježi pregled.',
          );
        tx.set(ref, {
          ...payload,
          id,
          revision: (revision ?? 0) + 1,
          updatedAt: serverTimestamp(),
        });
        tx.update(root.ref, {
          dataRevision: control['dataRevision'] + 1,
          updatedAt: serverTimestamp(),
        });
      });
    } catch (e) {
      throw asApplicationError(e);
    }
  }
  async grading(scope: ActiveScope, courseId: string) {
    this.connected();
    const academic = new AcademicRepository(this.db, this.online),
      before = await academic.readControl(scope.uid),
      work = new WorkRepository(this.db, this.online);
    const activities: ScoreActivity[] = [],
      attempts: ScoreAttempt[] = [];
    const completed = new Set<string>();
    let cursor: QueryDocumentSnapshot | undefined;
    do {
      const page = await getDocsFromServer(
        query(
          collection(this.db, 'users', scope.uid, 'datasets', scope.datasetId, 'scoreActivities'),
          where('courseId', '==', courseId),
          orderBy('__name__'),
          ...(cursor ? [startAfter(cursor)] : []),
          limit(50),
        ),
      );
      for (const row of page.docs) {
        const activity = work.decode('scoreActivities', row.id, row.data()) as ScoreActivity;
        activities.push(activity);
        attempts.push(...(await work.attemptHistory(scope, activity.id)));
        if (activity.source.type === 'assessment' || activity.source.type === 'project') {
          const source = await work.get(
            scope,
            activity.source.type === 'assessment' ? 'assessments' : 'projects',
            activity.source.id!,
          );
          if (source && 'isCompleted' in source && source.isCompleted) completed.add(activity.id);
        } else completed.add(activity.id);
      }
      if (activities.length > 500 || attempts.length > 2000)
        throw new ApplicationError(
          'validation',
          'Rezultati prelaze sigurnosni limit; zbroj nije skraćen.',
        );
      if (page.size < 50) break;
      cursor = page.docs.at(-1);
    } while (cursor);
    const rules = (await this.get(scope, 'gradingRules', courseId)) as GradingRules | null,
      outcome = (await this.get(scope, 'courseOutcomes', courseId)) as CourseOutcome | null;
    const after = await academic.readControl(scope.uid);
    if (
      before.dataRevision !== after.dataRevision ||
      scope.datasetId !== after.activeDatasetId ||
      after.restoreToken !== null
    )
      throw new ApplicationError(
        'conflict',
        'Podaci su promijenjeni tijekom čitanja. Osvježi pregled.',
      );
    return { activities, attempts, completed, rules, outcome };
  }
  async overview(
    scope: ActiveScope,
    until: string,
    count = 50,
    installmentsUntil = until,
    previous?: OverviewCursor,
  ) {
    this.connected();
    dateOnly(until);
    dateOnly(installmentsUntil);
    const installmentReminders: Installment[] = [];
    const academic = new AcademicRepository(this.db, this.online),
      before = await academic.readControl(scope.uid),
      deadlines: Deadline[] = [];
    const queryKey = JSON.stringify([scope.uid, scope.datasetId, until, installmentsUntil]);
    const append = previous?.queryKey === queryKey && previous.revision === before.dataRevision;
    const streams = new Map(append ? previous.streams : []);
    const pageLimit = append ? 50 : count;
    const parents = new Map<string, Record<string, unknown> | undefined>();
    const parent = async (name: string, id: string) => {
      const key = name + '/' + id;
      if (!parents.has(key))
        parents.set(key, (await getDocFromServer(this.ref(scope, name, id))).data());
      return parents.get(key);
    };
    let more = false;
    const specs = [
      ['assessments', 'scheduledOn', 'isCompleted', 'Kolokvij / ispit'],
      ['projects', 'dueOn', 'isCompleted', 'Projekt'],
      ['tasks', 'dueOn', 'isCompleted', 'Zadatak'],
      ['installments', 'dueOn', 'isPaid', 'Rata'],
    ] as const;
    for (const [name, date, status, label] of specs) {
      if (streams.get(name) === null) continue;
      let cursor = streams.get(name) ?? undefined;
      let loaded = 0;
      do {
        const constraints: QueryConstraint[] = [
          where(status, '==', false),
          where(date, '!=', null),
          where(date, '<=', name === 'installments' ? installmentsUntil : until),
          orderBy(date),
          orderBy('__name__'),
          ...(cursor ? [startAfter(cursor)] : []),
          limit(50),
        ];
        const page = await getDocsFromServer(
          query(
            collection(this.db, 'users', scope.uid, 'datasets', scope.datasetId, name),
            ...constraints,
          ),
        );
        for (const d of page.docs) {
          const v = d.data();
          if (name === 'installments')
            installmentReminders.push(this.decode('installments', d.id, v) as Installment);
          if (dateOnly(v[date]) > until) continue;
          if (await this.visible(parent, v))
            deadlines.push({
              id: name + '/' + d.id,
              name: String(v['name'] ?? v['title']),
              date: dateOnly(v[date]),
              route: '/' + (name === 'tasks' ? 'todo' : name) + '/' + d.id,
              kind: label,
              ...(name === 'assessments' ? { scheduledAt: v['scheduledAt'] as string | null } : {}),
            });
        }
        streams.set(name, page.size === 50 ? page.docs.at(-1)! : null);
        loaded += page.size;
        cursor = page.docs.at(-1);
        if (page.size < 50) break;
        if (loaded >= pageLimit) {
          more = true;
          break;
        }
      } while (cursor);
    }
    const tasks: Task[] = [];
    let cursor = streams.get('openTasks') ?? undefined;
    let loaded = 0;
    if (streams.get('openTasks') !== null)
      do {
        const page = await getDocsFromServer(
          query(
            collection(this.db, 'users', scope.uid, 'datasets', scope.datasetId, 'tasks'),
            where('isCompleted', '==', false),
            orderBy('__name__'),
            ...(cursor ? [startAfter(cursor)] : []),
            limit(50),
          ),
        );
        const work = new WorkRepository(this.db, this.online);
        for (const d of page.docs)
          if (await this.visible(parent, d.data()))
            tasks.push(work.decode('tasks', d.id, d.data()) as Task);
        streams.set('openTasks', page.size === 50 ? page.docs.at(-1)! : null);
        loaded += page.size;
        cursor = page.docs.at(-1);
        if (page.size < 50) break;
        if (loaded >= pageLimit) {
          more = true;
          break;
        }
      } while (cursor);
    const after = await academic.readControl(scope.uid);
    if (
      before.dataRevision !== after.dataRevision ||
      scope.datasetId !== after.activeDatasetId ||
      after.restoreToken !== null
    )
      throw new ApplicationError(
        'conflict',
        'Obaveze su promijenjene tijekom čitanja. Osvježi pregled.',
      );
    return {
      cursor: { queryKey, revision: after.dataRevision, streams },
      append,
      installmentReminders,
      dataRevision: after.dataRevision,
      deadlines: deadlines.sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id)),
      tasks,
      more,
    };
  }
  private async visible(
    parent: (name: string, id: string) => Promise<Record<string, unknown> | undefined>,
    v: Record<string, unknown>,
  ) {
    if (v['isArchived']) return false;
    let course = v['courseId'] as string | null | undefined;
    const context = v['context'] as Task['context'] | undefined;
    if (context?.type === 'course') course = context.id;
    if (context?.type === 'project') {
      const p = await parent('projects', context.id!);
      if (!p || p['isArchived']) return false;
      course = p['courseId'] as string;
    }
    if (course) {
      const c = await parent('courses', course);
      if (!c || c['isArchived']) return false;
      const semester = await parent('semesters', c['semesterId'] as string);
      if (!semester || semester['isArchived']) return false;
    }
    return true;
  }
}
