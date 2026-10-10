import {
  collection,
  doc,
  Firestore,
  getDocFromServer,
  getDocsFromServer,
  limit,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  startAfter,
  Timestamp,
  where,
  DocumentData,
  QueryDocumentSnapshot,
} from 'firebase/firestore';
import { AcademicRepository } from './academic.repository';
import { ActiveScope, Course } from '../domain/academic.models';
import {
  Occurrence,
  ScheduleTemplate,
  Session,
  SessionInput,
  TemplateInput,
} from '../domain/schedule.models';
import {
  addDays,
  localNow,
  sessionId,
  sessionInput,
  templateInput,
  weekday,
} from '../domain/schedule';
import { dateOnly, recordId } from '../domain/academic.validation';
import { ApplicationError, asApplicationError } from '../core/errors/application-error';

type ScheduleCollection = 'scheduleTemplates' | 'sessions';
export class ScheduleRepository {
  constructor(
    private readonly db: Firestore,
    private readonly online: () => boolean = () => true,
    private readonly today: () => string = () => localNow().date,
  ) {}
  private checkOnline() {
    if (!this.online())
      throw new ApplicationError('offline', 'Nema internetske veze. Unos nije poslan.');
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
  private root(scope: ActiveScope) {
    return doc(this.db, 'users', recordId(scope.uid));
  }
  private control(scope: ActiveScope, d: DocumentData | undefined): number {
    this.checkOnline();
    if (!d || d['schemaVersion'] !== 1)
      throw new ApplicationError('unsupportedSchema', 'Podaci nisu podržani.');
    if (d['restoreToken'] !== null)
      throw new ApplicationError('restoreInProgress', 'Povrat podataka je u tijeku.');
    if (d['activeDatasetId'] !== scope.datasetId || !Number.isSafeInteger(d['dataRevision']))
      throw new ApplicationError('conflict', 'Podatkovni prostor se promijenio. Osvježi pregled.');
    return d['dataRevision'];
  }
  private decode<T extends Session | ScheduleTemplate>(
    name: ScheduleCollection,
    id: string,
    d: DocumentData,
  ): T {
    if (
      d['id'] !== id ||
      !Number.isSafeInteger(d['revision']) ||
      d['revision'] < 1 ||
      !(d['updatedAt'] instanceof Timestamp)
    )
      throw new ApplicationError('validation', 'Zapis nastave nije valjan.');
    const input =
      name === 'sessions' ? sessionInput(d as SessionInput) : templateInput(d as TemplateInput);
    return { ...input, id, revision: d['revision'], updatedAt: d['updatedAt'] } as unknown as T;
  }
  async window(
    scope: ActiveScope,
    courseId: string,
    from: string,
    until: string,
    fullCourseHistory = false,
  ): Promise<{ templates: ScheduleTemplate[]; sessions: Session[] }> {
    this.checkOnline();
    dateOnly(from);
    dateOnly(until);
    if (from > until || until > addDays(from, 1095))
      throw new ApplicationError('validation', 'Suzi prikaz na najviše tri godine.');
    try {
      const load = async <T extends Session | ScheduleTemplate>(
        name: ScheduleCollection,
      ): Promise<T[]> => {
        const result: T[] = [];
        let cursor: QueryDocumentSnapshot | undefined;
        do {
          const constraints = [
            where('courseId', '==', recordId(courseId)),
            ...(name === 'sessions'
              ? [
                  ...(fullCourseHistory
                    ? []
                    : [where('scheduledOn', '>=', from), where('scheduledOn', '<=', until)]),
                  orderBy('scheduledOn'),
                ]
              : [
                  where('validUntil', '>=', from),
                  where('validFrom', '<=', until),
                  orderBy('validUntil'),
                  orderBy('validFrom'),
                ]),
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
          result.push(...page.docs.map((r) => this.decode<T>(name, r.id, r.data())));
          if (result.length > 2000)
            throw new ApplicationError(
              'validation',
              'Prikaz je prevelik. Suzi datume prije nastavka.',
            );
          cursor = page.size === 50 ? page.docs.at(-1) : undefined;
        } while (cursor);
        return result;
      };
      const [templates, sessions] = await Promise.all([
        load<ScheduleTemplate>('scheduleTemplates'),
        load<Session>('sessions'),
      ]);
      return { templates, sessions };
    } catch (error) {
      throw asApplicationError(error);
    }
  }
  async saveTemplate(
    scope: ActiveScope,
    id: string,
    values: TemplateInput,
    old: ScheduleTemplate | null = null,
    effectiveOn?: string,
  ): Promise<void> {
    this.checkOnline();
    let input = templateInput(values);
    const effective = dateOnly(effectiveOn ?? input.validFrom);
    let preparedRevision: number | undefined;
    if (old) {
      if (
        effective < this.today() ||
        effective < old.validFrom ||
        effective > old.validUntil ||
        input.courseId !== old.courseId
      )
        throw new ApplicationError(
          'validation',
          'Buduća promjena mora počinjati danas ili kasnije unutar izvornog razdoblja. Kolegij se ne mijenja.',
        );
      input = templateInput({ ...input, validFrom: effective });
      const before = await new AcademicRepository(this.db, this.online).readControl(scope.uid);
      const recorded = await this.window(scope, old.courseId, effective, old.validUntil);
      if (recorded.sessions.some((s) => s.templateId === old.id))
        throw new ApplicationError(
          'conflict',
          'U promijenjenom razdoblju već postoji spremljen termin. Promjena rasporeda ga ne prepisuje; potrebna je izričita korekcija.',
        );
      preparedRevision = before.dataRevision;
    }
    // Same first day can be corrected in place only when the affected range has no records.
    const targetId = old && effective === old.validFrom ? old.id : id;
    try {
      await runTransaction(this.db, async (tx) => {
        const root = await tx.get(this.root(scope)),
          revision = this.control(scope, root.data());
        if (preparedRevision !== undefined && revision !== preparedRevision)
          throw new ApplicationError(
            'conflict',
            'Podaci su promijenjeni tijekom pripreme. Osvježi pregled i potvrdi promjenu ponovno.',
          );
        const current = await tx.get(this.ref(scope, 'scheduleTemplates', targetId));
        const previous =
          old && old.id !== targetId
            ? await tx.get(this.ref(scope, 'scheduleTemplates', old.id))
            : current;
        const course = await tx.get(this.ref(scope, 'courses', input.courseId));
        if (!course.exists()) throw new ApplicationError('notFound', 'Kolegij više ne postoji.');
        const semester = await tx.get(this.ref(scope, 'semesters', course.data()['semesterId']));
        if (
          !semester.exists() ||
          input.validFrom < semester.data()['startsOn'] ||
          input.validUntil > semester.data()['endsOn']
        )
          throw new ApplicationError(
            'validation',
            'Ponavljanje mora biti unutar datuma nastave semestra.',
          );
        if (old && (!previous.exists() || previous.data()['revision'] !== old.revision))
          throw new ApplicationError(
            'conflict',
            'Ponavljanje je promijenjeno na drugom uređaju. Osvježi podatke.',
            previous.exists()
              ? this.decode('scheduleTemplates', previous.id, previous.data())
              : null,
          );
        if (!old && current.exists()) {
          if (
            JSON.stringify(templateInput(current.data() as TemplateInput)) === JSON.stringify(input)
          )
            return;
          throw new ApplicationError('conflict', 'Ponavljanje s ovim ID-em već postoji.');
        }
        if (old && targetId !== old.id && current.exists())
          throw new ApplicationError('conflict', 'Nova verzija već postoji. Osvježi pregled.');
        if (old && targetId !== old.id)
          tx.update(previous.ref, {
            validUntil: addDays(effective, -1),
            revision: old.revision + 1,
            updatedAt: serverTimestamp(),
          });
        tx.set(current.ref, {
          ...input,
          id: targetId,
          revision: targetId === old?.id ? old.revision + 1 : 1,
          updatedAt: serverTimestamp(),
        });
        tx.update(root.ref, { dataRevision: revision + 1, updatedAt: serverTimestamp() });
      });
    } catch (error) {
      throw asApplicationError(error);
    }
  }
  async saveSession(scope: ActiveScope, row: Occurrence, values: SessionInput): Promise<void> {
    this.checkOnline();
    const input = sessionInput(values);
    try {
      await runTransaction(this.db, async (tx) => {
        const root = await tx.get(this.root(scope)),
          revision = this.control(scope, root.data()),
          current = await tx.get(this.ref(scope, 'sessions', row.id)),
          course = await tx.get(this.ref(scope, 'courses', input.courseId));
        if (!course.exists()) throw new ApplicationError('notFound', 'Kolegij više ne postoji.');
        const template = input.templateId
          ? await tx.get(this.ref(scope, 'scheduleTemplates', input.templateId))
          : null;
        const replacement = input.replacementForId
          ? await tx.get(this.ref(scope, 'sessions', input.replacementForId))
          : null;
        if (
          input.replacementForId &&
          (input.replacementForId === row.id ||
            !replacement?.exists() ||
            replacement.data()['courseId'] !== input.courseId ||
            replacement.data()['kind'] !== input.kind ||
            input.templateId !== null)
        )
          throw new ApplicationError(
            'validation',
            'Nadoknada mora upućivati na drugi termin istog kolegija i vrste.',
          );
        if (!current.exists() && input.templateId) {
          if (!template?.exists())
            throw new ApplicationError('notFound', 'Predložak više ne postoji.');
          const t = this.decode<ScheduleTemplate>(
            'scheduleTemplates',
            template.id,
            template.data(),
          );
          if (
            row.id !== sessionId(t.id, input.scheduledOn) ||
            input.scheduledOn < t.validFrom ||
            input.scheduledOn > t.validUntil ||
            weekday(input.scheduledOn) !== t.weekday ||
            t.courseId !== input.courseId ||
            t.kind !== input.kind ||
            t.startsAt !== input.startsAt ||
            t.endsAt !== input.endsAt ||
            t.location !== input.location ||
            input.replacementForId !== null
          )
            throw new ApplicationError(
              'conflict',
              'Raspored se promijenio. Osvježi termin prije spremanja.',
            );
        }
        if (
          current.exists() &&
          JSON.stringify(sessionInput(current.data() as SessionInput)) === JSON.stringify(input)
        )
          return;
        if ((current.exists() ? current.data()['revision'] : null) !== row.revision)
          throw new ApplicationError(
            'conflict',
            'Termin je promijenjen na drugom uređaju. Lokalni izbor nije poslan; usporedi novi zapis.',
            current.exists() ? this.decode('sessions', current.id, current.data()) : null,
          );
        if (current.exists()) {
          const previous = sessionInput(current.data() as SessionInput);
          for (const key of [
            'courseId',
            'templateId',
            'scheduledOn',
            'startsAt',
            'endsAt',
            'kind',
            'location',
            'replacementForId',
          ] as const)
            if (previous[key] !== input[key])
              throw new ApplicationError(
                'validation',
                'Spremljeni snapshot vremena i veza ostaje sačuvan. Ispravi dolaznost ili dodaj nadoknadu.',
              );
        }
        tx.set(current.ref, {
          ...input,
          id: row.id,
          revision: (row.revision ?? 0) + 1,
          updatedAt: serverTimestamp(),
        });
        tx.update(root.ref, { dataRevision: revision + 1, updatedAt: serverTimestamp() });
      });
    } catch (error) {
      throw asApplicationError(error);
    }
  }
  async saveRules(
    scope: ActiveScope,
    course: Course,
    rules: Course['attendanceRules'],
  ): Promise<void> {
    await new AcademicRepository(this.db, this.online).save(
      scope,
      'courses',
      course.id,
      { ...course, attendanceRules: rules },
      course.revision,
    );
  }
  async session(scope: ActiveScope, id: string): Promise<Session> {
    this.checkOnline();
    try {
      const r = await getDocFromServer(this.ref(scope, 'sessions', id));
      if (!r.exists()) throw new ApplicationError('notFound', 'Termin nije pronađen.');
      return this.decode<Session>('sessions', r.id, r.data());
    } catch (error) {
      throw asApplicationError(error);
    }
  }
}
