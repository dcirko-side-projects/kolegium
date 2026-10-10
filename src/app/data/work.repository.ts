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
  DocumentData,
} from 'firebase/firestore';
import { ActiveScope } from '../domain/academic.models';
import {
  Assessment,
  AssessmentInput,
  Project,
  ProjectInput,
  Task,
  TaskInput,
  Thesis,
  ThesisInput,
  ResultSource,
  ScoreActivity,
  ScoreAttempt,
  ScoreAttemptInput,
} from '../domain/work.models';
import {
  assessmentInput,
  projectInput,
  taskInput,
  thesisInput,
  scoreActivityInput,
  scoreAttemptInput,
  activityId,
  attemptId,
} from '../domain/work.validation';
import { recordId } from '../domain/academic.validation';
import { Page, AcademicRepository } from './academic.repository';
import { ApplicationError, asApplicationError } from '../core/errors/application-error';
type WorkCollection =
  'assessments' | 'projects' | 'tasks' | 'thesis' | 'scoreActivities' | 'scoreAttempts';
type WorkRecord = Assessment | Project | Task | Thesis | ScoreActivity | ScoreAttempt;
type WorkInput = AssessmentInput | ProjectInput | TaskInput | ThesisInput;
export class WorkRepository {
  async courseResults(
    scope: ActiveScope,
    courseId: string,
    count = 50,
  ): Promise<{
    rows: { source: Assessment | Project; type: ResultSource; attempts: ScoreAttempt[] }[];
    more: boolean;
  }> {
    const academic = new AcademicRepository(this.db, this.isOnline),
      before = await academic.readControl(scope.uid);
    const rows: { source: Assessment | Project; type: ResultSource; attempts: ScoreAttempt[] }[] =
      [];
    let more = false;
    for (const name of ['assessments', 'projects'] as const) {
      let cursor: QueryDocumentSnapshot | null = null,
        loaded = 0,
        collectionMore: boolean;
      do {
        const page = await this.page(scope, name, { courseId }, cursor);
        for (const source of page.records as (Assessment | Project)[]) {
          const type = name === 'assessments' ? 'assessment' : 'project';
          rows.push({
            source,
            type,
            attempts: (await this.attempts(scope, type, source.id)).attempts,
          });
        }
        loaded += page.records.length;
        cursor = page.cursor;
        collectionMore = page.hasMore;
        if (!page.hasMore || loaded >= count) break;
      } while (cursor);
      more = more || collectionMore;
    }
    const after = await academic.readControl(scope.uid);
    if (
      before.dataRevision !== after.dataRevision ||
      scope.datasetId !== after.activeDatasetId ||
      before.restoreToken !== after.restoreToken
    )
      throw new ApplicationError(
        'conflict',
        'Podaci su promijenjeni tijekom čitanja. Osvježi rezultate.',
      );
    return { rows, more };
  }
  constructor(
    private readonly db: Firestore,
    private readonly isOnline: () => boolean = () => true,
  ) {}
  private online() {
    if (!this.isOnline())
      throw new ApplicationError('offline', 'Nema internetske veze. Unos nije poslan.');
  }
  private ref(scope: ActiveScope, collectionName: WorkCollection | 'courses', id: string) {
    return doc(
      this.db,
      'users',
      recordId(scope.uid),
      'datasets',
      recordId(scope.datasetId),
      collectionName,
      recordId(id),
    );
  }
  private decode(name: WorkCollection, id: string, raw: DocumentData | undefined): WorkRecord {
    if (
      !raw ||
      raw['id'] !== id ||
      !Number.isSafeInteger(raw['revision']) ||
      raw['revision'] < 1 ||
      !(raw['updatedAt'] instanceof Timestamp)
    )
      throw new ApplicationError('validation', 'Zapis obaveze nije valjan.');
    const payload =
      name === 'assessments'
        ? assessmentInput(raw as AssessmentInput)
        : name === 'projects'
          ? projectInput(raw as ProjectInput)
          : name === 'tasks'
            ? taskInput(raw as TaskInput)
            : name === 'thesis'
              ? thesisInput(raw as ThesisInput)
              : name === 'scoreActivities'
                ? scoreActivityInput(raw as ScoreActivity)
                : scoreAttemptInput(raw as ScoreAttemptInput);
    return { ...payload, id, revision: raw['revision'], updatedAt: raw['updatedAt'] } as WorkRecord;
  }
  async get(scope: ActiveScope, name: WorkCollection, id: string): Promise<WorkRecord | null> {
    this.online();
    try {
      const snap = await getDocFromServer(this.ref(scope, name, id));
      return snap.exists() ? this.decode(name, id, snap.data()) : null;
    } catch (e) {
      throw asApplicationError(e);
    }
  }
  async page(
    scope: ActiveScope,
    name: 'assessments' | 'projects' | 'tasks',
    filters: {
      courseId?: string;
      contextType?: string;
      contextId?: string;
      completed?: boolean;
    } = {},
    cursor: QueryDocumentSnapshot | null = null,
  ): Promise<Page<Assessment | Project | Task>> {
    this.online();
    const constraints: QueryConstraint[] = [];
    if (filters.courseId) constraints.push(where('courseId', '==', recordId(filters.courseId)));
    if (filters.contextType) constraints.push(where('context.type', '==', filters.contextType));
    if (filters.contextId) constraints.push(where('context.id', '==', recordId(filters.contextId)));
    if (filters.completed !== undefined)
      constraints.push(where('isCompleted', '==', filters.completed));
    constraints.push(orderBy('__name__'));
    if (cursor) constraints.push(startAfter(cursor));
    constraints.push(limit(50));
    try {
      const snap = await getDocsFromServer(
        query(
          collection(this.db, 'users', scope.uid, 'datasets', scope.datasetId, name),
          ...constraints,
        ),
      );
      return {
        records: snap.docs.map(
          (d) => this.decode(name, d.id, d.data()) as Assessment | Project | Task,
        ),
        cursor: snap.docs.at(-1) ?? null,
        hasMore: snap.size === 50,
      };
    } catch (e) {
      throw asApplicationError(e);
    }
  }
  async attempts(
    scope: ActiveScope,
    type: ResultSource,
    sourceId: string,
  ): Promise<{ activity: ScoreActivity | null; attempts: ScoreAttempt[] }> {
    this.online();
    const id = activityId(type, sourceId);
    const activity = (await this.get(scope, 'scoreActivities', id)) as ScoreActivity | null;
    if (!activity) return { activity: null, attempts: [] };
    try {
      let cursor: QueryDocumentSnapshot | undefined;
      const rows: ScoreAttempt[] = [];
      do {
        const snap = await getDocsFromServer(
          query(
            collection(this.db, 'users', scope.uid, 'datasets', scope.datasetId, 'scoreAttempts'),
            where('activityId', '==', id),
            orderBy('attemptNumber'),
            ...(cursor ? [startAfter(cursor)] : []),
            limit(50),
          ),
        );
        rows.push(
          ...snap.docs.map((d) => this.decode('scoreAttempts', d.id, d.data()) as ScoreAttempt),
        );
        if (rows.length > 2000)
          throw new ApplicationError(
            'validation',
            'Povijest pokušaja prelazi sigurnosni limit; prikaz nije skraćen.',
          );
        if (snap.size < 50) break;
        cursor = snap.docs.at(-1);
      } while (cursor);
      return { activity, attempts: rows };
    } catch (e) {
      throw asApplicationError(e);
    }
  }
  async save(
    scope: ActiveScope,
    name: 'assessments' | 'projects' | 'tasks' | 'thesis',
    id: string,
    input: WorkInput,
    expectedRevision: number | null,
  ): Promise<void> {
    this.online();
    const payload =
      name === 'assessments'
        ? assessmentInput(input as AssessmentInput)
        : name === 'projects'
          ? projectInput(input as ProjectInput)
          : name === 'tasks'
            ? taskInput(input as TaskInput)
            : thesisInput(input as ThesisInput);
    if (name === 'thesis' && id !== 'main')
      throw new ApplicationError('validation', 'Diplomski koristi jednu osnovnu evidenciju.');
    const rootRef = doc(this.db, 'users', scope.uid),
      ref = this.ref(scope, name, id);
    try {
      await runTransaction(this.db, async (tx) => {
        this.online();
        const root = await tx.get(rootRef),
          current = await tx.get(ref),
          control = root.data();
        this.checkControl(scope, control);
        if (name === 'assessments' || name === 'projects') {
          const courseId = (payload as AssessmentInput | ProjectInput).courseId;
          if (courseId !== null && !(await tx.get(this.ref(scope, 'courses', courseId))).exists())
            throw new ApplicationError('notFound', 'Kolegij više ne postoji.');
          const scoring = await tx.get(
            this.ref(
              scope,
              'scoreActivities',
              activityId(name === 'assessments' ? 'assessment' : 'project', id),
            ),
          );
          if (scoring.exists() && scoring.data()['courseId'] !== courseId)
            throw new ApplicationError(
              'validation',
              'Kolegij izvora s rezultatima ne može se promijeniti. Povijest ostaje uz izvorni kolegij.',
            );
        }
        if (name === 'tasks') {
          const context = (payload as TaskInput).context;
          if (context.type !== 'none') {
            const parent = await tx.get(
              this.ref(
                scope,
                context.type === 'course'
                  ? 'courses'
                  : context.type === 'project'
                    ? 'projects'
                    : 'thesis',
                context.id!,
              ),
            );
            if (!parent.exists())
              throw new ApplicationError('notFound', 'Odabrani kontekst više ne postoji.');
          }
        }
        if (current.exists()) {
          const actual = this.decode(name, id, current.data());
          if (this.samePayload(name, actual, payload)) return;
        }
        if ((current.exists() ? current.data()['revision'] : null) !== expectedRevision)
          throw new ApplicationError(
            'conflict',
            'Zapis je promijenjen na drugom uređaju. Lokalni unos ostaje sačuvan.',
            current.exists() ? this.decode(name, id, current.data()) : null,
          );
        tx.set(ref, {
          ...payload,
          id,
          revision: (expectedRevision ?? 0) + 1,
          updatedAt: serverTimestamp(),
        });
        tx.update(rootRef, {
          dataRevision: control!['dataRevision'] + 1,
          updatedAt: serverTimestamp(),
        });
      });
    } catch (e) {
      throw asApplicationError(e);
    }
  }
  private samePayload(
    name: 'assessments' | 'projects' | 'tasks' | 'thesis',
    raw: WorkRecord,
    payload: WorkInput,
  ): boolean {
    const parsed =
      name === 'assessments'
        ? assessmentInput(raw as Assessment)
        : name === 'projects'
          ? projectInput(raw as Project)
          : name === 'tasks'
            ? taskInput(raw as Task)
            : thesisInput(raw as Thesis);
    return JSON.stringify(parsed) === JSON.stringify(payload);
  }
  private checkControl(scope: ActiveScope, c: DocumentData | undefined) {
    if (!c || c['activeDatasetId'] !== scope.datasetId)
      throw new ApplicationError('conflict', 'Podatkovni prostor je promijenjen. Osvježi pregled.');
    if (c['restoreToken'] !== null)
      throw new ApplicationError('restoreInProgress', 'Povrat podataka je u tijeku.');
  }
  async saveActivity(
    scope: ActiveScope,
    id: string,
    input: ScoreActivity,
    revision: number | null,
  ): Promise<void> {
    this.online();
    const payload = scoreActivityInput(input);
    const manual = payload.source.type === 'lecture' || payload.source.type === 'exercise';
    if (
      manual &&
      (!payload.courseId || !id.startsWith(payload.source.type + '_' + payload.courseId + '_'))
    )
      throw new ApplicationError('validation', 'Identitet aktivnosti nije valjan.');
    if (!manual && id !== activityId(payload.source.type, payload.source.id!))
      throw new ApplicationError('validation', 'Izvor već ima jedan canonical rezultat.');
    const academic = new AcademicRepository(this.db, this.isOnline),
      before = await academic.readControl(scope.uid);
    const attempts = (await this.attempts(scope, payload.source.type, payload.source.id ?? id))
      .attempts;
    if (
      payload.maxPoints !== null &&
      attempts.some((a) => a.points !== null && Number(a.points) > Number(payload.maxPoints))
    )
      throw new ApplicationError('validation', 'Maksimum je manji od postojećeg rezultata.');
    try {
      await runTransaction(this.db, async (tx) => {
        this.online();
        const root = await tx.get(doc(this.db, 'users', scope.uid)),
          ref = this.ref(scope, 'scoreActivities', id),
          old = await tx.get(ref);
        this.checkControl(scope, root.data());
        if (
          payload.courseId &&
          !(await tx.get(this.ref(scope, 'courses', payload.courseId))).exists()
        )
          throw new ApplicationError('notFound', 'Kolegij ne postoji.');
        if (!manual) {
          const source = await tx.get(
            this.ref(
              scope,
              payload.source.type === 'assessment' ? 'assessments' : 'projects',
              payload.source.id!,
            ),
          );
          if (!source.exists() || source.data()['courseId'] !== payload.courseId)
            throw new ApplicationError('validation', 'Kolegij izvora nije isti.');
        }
        if (
          old.exists() &&
          (old.data()['courseId'] !== payload.courseId ||
            JSON.stringify(old.data()['source']) !== JSON.stringify(payload.source))
        )
          throw new ApplicationError('validation', 'Izvor aktivnosti se ne mijenja.');
        if (
          old.exists() &&
          JSON.stringify(scoreActivityInput(old.data() as ScoreActivity)) ===
            JSON.stringify(payload)
        )
          return;
        if ((old.exists() ? old.data()['revision'] : null) !== revision)
          throw new ApplicationError(
            'conflict',
            'Aktivnost je promijenjena na drugom uređaju.',
            old.exists() ? this.decode('scoreActivities', id, old.data()) : null,
          );
        if (root.data()!['dataRevision'] !== before.dataRevision)
          throw new ApplicationError(
            'conflict',
            'Rezultati su promijenjeni tijekom validacije aktivnosti. Osvježi pregled.',
          );
        tx.set(ref, {
          ...payload,
          id,
          revision: (revision ?? 0) + 1,
          updatedAt: serverTimestamp(),
        });
        tx.update(root.ref, {
          dataRevision: root.data()!['dataRevision'] + 1,
          updatedAt: serverTimestamp(),
        });
      });
    } catch (e) {
      throw asApplicationError(e);
    }
  }
  async saveAttempt(
    scope: ActiveScope,
    type: ResultSource,
    sourceId: string,
    input: ScoreAttemptInput,
    expectedRevision: number | null,
  ): Promise<void> {
    this.online();
    const payload = scoreAttemptInput(input),
      aid = activityId(type, sourceId);
    if (payload.activityId !== aid)
      throw new ApplicationError('validation', 'Pokušaj mora pripadati odabranom izvoru.');
    const id = attemptId(payload),
      rootRef = doc(this.db, 'users', scope.uid),
      ref = this.ref(scope, 'scoreAttempts', id),
      activityRef = this.ref(scope, 'scoreActivities', aid);
    try {
      await runTransaction(this.db, async (tx) => {
        this.online();
        const root = await tx.get(rootRef),
          source = await tx.get(
            this.ref(
              scope,
              type === 'lecture' || type === 'exercise'
                ? 'scoreActivities'
                : type === 'assessment'
                  ? 'assessments'
                  : 'projects',
              sourceId,
            ),
          ),
          activity = await tx.get(activityRef),
          current = await tx.get(ref);
        this.checkControl(scope, root.data());
        if (!source.exists())
          throw new ApplicationError('notFound', 'Izvor rezultata više ne postoji.');
        if (
          current.exists() &&
          JSON.stringify(scoreAttemptInput(current.data() as ScoreAttemptInput)) ===
            JSON.stringify(payload)
        )
          return;
        if ((current.exists() ? current.data()['revision'] : null) !== expectedRevision)
          throw new ApplicationError(
            'conflict',
            'Pokušaj je promijenjen na drugom uređaju; lokalni unos ostaje sačuvan.',
            current.exists() ? this.decode('scoreAttempts', id, current.data()) : null,
          );
        const max = activity.exists() ? activity.data()['maxPoints'] : null;
        if (max !== null && payload.points !== null && Number(payload.points) > Number(max))
          throw new ApplicationError(
            'validation',
            'Uneseni bodovi prelaze poznati maksimum aktivnosti.',
          );
        if (!activity.exists())
          tx.set(activityRef, {
            courseId: source.data()['courseId'],
            name: source.data()['name'],
            source: { type, id: sourceId },
            componentKey: null,
            maxPoints: null,
            minimumPoints: null,
            id: aid,
            revision: 1,
            updatedAt: serverTimestamp(),
          });
        tx.set(ref, {
          ...payload,
          id,
          revision: (expectedRevision ?? 0) + 1,
          updatedAt: serverTimestamp(),
        });
        tx.update(rootRef, {
          dataRevision: root.data()!['dataRevision'] + 1,
          updatedAt: serverTimestamp(),
        });
      });
    } catch (e) {
      throw asApplicationError(e);
    }
  }
}
