import {
  Firestore,
  Timestamp,
  collection,
  doc,
  getDocFromServer,
  getDocsFromServer,
  limit,
  onSnapshot,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  startAfter,
  where,
  QueryDocumentSnapshot,
  DocumentData,
} from 'firebase/firestore';
import {
  ActiveScope,
  Control,
  Course,
  CourseInput,
  Preferences,
  Semester,
  SemesterInput,
  VersionedRecord,
} from '../domain/academic.models';
import { courseInput, recordId, semesterInput } from '../domain/academic.validation';
import { ApplicationError, asApplicationError } from '../core/errors/application-error';

export interface Page<T> {
  records: T[];
  cursor: QueryDocumentSnapshot | null;
  hasMore: boolean;
}
type AcademicCollection = 'semesters' | 'courses' | 'preferences';
type AcademicInput = SemesterInput | CourseInput | { activeSemesterId: string | null };
export class AcademicRepository {
  constructor(
    private readonly db: Firestore,
    private readonly isOnline: () => boolean = () => true,
  ) {}
  private online(): void {
    if (!this.isOnline())
      throw new ApplicationError(
        'offline',
        'Nema internetske veze. Izmjene nisu poslane; unos ostaje sačuvan.',
      );
  }
  private rootRef(uid: string) {
    return doc(this.db, 'users', recordId(uid));
  }
  private entityRef(scope: ActiveScope, name: AcademicCollection, id: string) {
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
  private control(raw: DocumentData | undefined): Control {
    if (!raw) throw new ApplicationError('notFound', 'Podatkovni prostor nije pronađen.');
    if (raw['schemaVersion'] !== 1)
      throw new ApplicationError('unsupportedSchema', 'Ova verzija podataka nije podržana.');
    if (
      !Number.isSafeInteger(raw['dataRevision']) ||
      raw['dataRevision'] < 0 ||
      !(raw['updatedAt'] instanceof Timestamp)
    )
      throw new ApplicationError('validation', 'Kontrolni podaci nisu valjani.');
    return {
      activeDatasetId: recordId(raw['activeDatasetId']),
      previousDatasetId:
        raw['previousDatasetId'] === null ? null : recordId(raw['previousDatasetId']),
      stagingDatasetId: raw['stagingDatasetId'] === null ? null : recordId(raw['stagingDatasetId']),
      restoreToken: raw['restoreToken'] === null ? null : recordId(raw['restoreToken']),
      dataRevision: raw['dataRevision'],
      schemaVersion: 1,
      updatedAt: raw['updatedAt'],
    };
  }
  private decode<T extends VersionedRecord>(
    name: AcademicCollection,
    id: string,
    raw: DocumentData | undefined,
  ): T {
    if (
      !raw ||
      raw['id'] !== id ||
      !Number.isSafeInteger(raw['revision']) ||
      raw['revision'] < 1 ||
      !(raw['updatedAt'] instanceof Timestamp)
    )
      throw new ApplicationError('validation', 'Zapis nije valjan.');
    let payload: AcademicInput;
    if (name === 'semesters') payload = semesterInput(raw as SemesterInput);
    else if (name === 'courses') payload = courseInput(raw as CourseInput);
    else
      payload = {
        activeSemesterId:
          raw['activeSemesterId'] === null ? null : recordId(raw['activeSemesterId']),
      };
    // The collection-specific payload has been validated above at the SDK boundary.
    return {
      ...payload,
      id,
      revision: raw['revision'],
      updatedAt: raw['updatedAt'],
    } as unknown as T;
  }
  async initialize(uid: string): Promise<Control> {
    this.online();
    const datasetId = crypto.randomUUID(),
      rootRef = this.rootRef(uid);
    try {
      await runTransaction(this.db, async (tx) => {
        const root = await tx.get(rootRef);
        if (root.exists()) {
          this.control(root.data());
          return;
        }
        tx.set(rootRef, {
          activeDatasetId: datasetId,
          previousDatasetId: null,
          stagingDatasetId: null,
          restoreToken: null,
          dataRevision: 0,
          schemaVersion: 1,
          updatedAt: serverTimestamp(),
        });
        tx.set(doc(this.db, 'users', uid, 'datasets', datasetId), {
          schemaVersion: 1,
          state: 'active',
          createdAt: serverTimestamp(),
        });
      });
      return await this.readControl(uid);
    } catch (error) {
      // A competing bootstrap may win between the read and Rules evaluation.
      // Accept only its complete, authorized, server-confirmed active dataset.
      if (asApplicationError(error).category === 'forbidden') {
        try {
          const control = await this.readControl(uid);
          const dataset = await getDocFromServer(
            doc(this.db, 'users', uid, 'datasets', control.activeDatasetId),
          );
          if (
            dataset.exists() &&
            dataset.data()['schemaVersion'] === 1 &&
            dataset.data()['state'] === 'active' &&
            dataset.data()['createdAt'] instanceof Timestamp
          )
            return control;
        } catch {
          // Keep the original failure if the winner cannot be verified.
        }
      }
      throw asApplicationError(error);
    }
  }
  async readControl(uid: string): Promise<Control> {
    this.online();
    try {
      return this.control((await getDocFromServer(this.rootRef(uid))).data());
    } catch (error) {
      throw asApplicationError(error);
    }
  }
  watchControl(
    uid: string,
    changed: (control: Control) => void,
    failed: (error: ApplicationError) => void,
  ): () => void {
    return onSnapshot(
      this.rootRef(uid),
      { includeMetadataChanges: true },
      (snapshot) => {
        if (snapshot.metadata.fromCache || snapshot.metadata.hasPendingWrites || !snapshot.exists())
          return;
        try {
          changed(this.control(snapshot.data()));
        } catch (error) {
          failed(asApplicationError(error));
        }
      },
      (error) => failed(asApplicationError(error)),
    );
  }
  async preferences(scope: ActiveScope): Promise<Preferences | null> {
    this.online();
    try {
      const snapshot = await getDocFromServer(this.entityRef(scope, 'preferences', 'app'));
      return snapshot.exists()
        ? this.decode<Preferences>('preferences', 'app', snapshot.data())
        : null;
    } catch (error) {
      throw asApplicationError(error);
    }
  }
  async page<T extends Semester | Course>(
    scope: ActiveScope,
    name: 'semesters' | 'courses',
    semesterId?: string,
    cursor?: QueryDocumentSnapshot | null,
  ): Promise<Page<T>> {
    this.online();
    const ref = collection(this.db, 'users', scope.uid, 'datasets', scope.datasetId, name);
    const constraints = [
      ...(name === 'courses' ? [where('semesterId', '==', recordId(semesterId))] : []),
      orderBy('__name__'),
      ...(cursor ? [startAfter(cursor)] : []),
      limit(50),
    ];
    try {
      const snapshot = await getDocsFromServer(query(ref, ...constraints));
      return {
        records: snapshot.docs.map((row) => this.decode<T>(name, row.id, row.data())),
        cursor: snapshot.docs.at(-1) ?? null,
        hasMore: snapshot.size === 50,
      };
    } catch (error) {
      throw asApplicationError(error);
    }
  }
  async semester(scope: ActiveScope, id: string): Promise<Semester> {
    return this.get<Semester>(scope, 'semesters', id);
  }
  async course(scope: ActiveScope, id: string): Promise<Course> {
    return this.get<Course>(scope, 'courses', id);
  }
  private async get<T extends VersionedRecord>(
    scope: ActiveScope,
    name: AcademicCollection,
    id: string,
  ): Promise<T> {
    this.online();
    try {
      const snapshot = await getDocFromServer(this.entityRef(scope, name, id));
      if (!snapshot.exists()) throw new ApplicationError('notFound', 'Zapis više ne postoji.');
      return this.decode<T>(name, id, snapshot.data());
    } catch (error) {
      throw asApplicationError(error);
    }
  }
  async save(
    scope: ActiveScope,
    name: 'semesters' | 'courses',
    id: string,
    input: SemesterInput | CourseInput,
    expectedRevision: number | null,
  ): Promise<void> {
    const payload =
      name === 'semesters'
        ? semesterInput(input as SemesterInput)
        : courseInput(input as CourseInput);
    await this.mutate(scope, name, id, payload, expectedRevision);
  }
  async selectSemester(
    scope: ActiveScope,
    semesterId: string | null,
    expectedRevision: number | null,
  ): Promise<void> {
    await this.mutate(
      scope,
      'preferences',
      'app',
      { activeSemesterId: semesterId === null ? null : recordId(semesterId) },
      expectedRevision,
    );
  }
  private async mutate(
    scope: ActiveScope,
    name: AcademicCollection,
    id: string,
    payload: AcademicInput,
    expectedRevision: number | null,
  ): Promise<void> {
    this.online();
    const rootRef = this.rootRef(scope.uid),
      ref = this.entityRef(scope, name, id);
    try {
      await runTransaction(this.db, async (tx) => {
        this.online();
        const rootSnapshot = await tx.get(rootRef),
          current = await tx.get(ref),
          control = this.control(rootSnapshot.data());
        if (control.activeDatasetId !== scope.datasetId)
          throw new ApplicationError(
            'conflict',
            'Podatkovni prostor promijenjen je na drugom uređaju. Osvježi pregled; tvoj unos ostaje sačuvan.',
          );
        if (control.restoreToken !== null)
          throw new ApplicationError(
            'restoreInProgress',
            'Povrat podataka je u tijeku. Izmjene trenutačno nisu dopuštene.',
          );
        let prefSnapshot;
        if (name === 'semesters' && (payload as SemesterInput).isArchived)
          prefSnapshot = await tx.get(this.entityRef(scope, 'preferences', 'app'));
        if (
          name === 'courses' ||
          (name === 'preferences' &&
            (payload as { activeSemesterId: string | null }).activeSemesterId !== null)
        ) {
          const parentId =
            name === 'courses'
              ? (payload as CourseInput).semesterId
              : (payload as { activeSemesterId: string }).activeSemesterId;
          const parent = await tx.get(this.entityRef(scope, 'semesters', parentId));
          if (!parent.exists())
            throw new ApplicationError('notFound', 'Odabrani semestar više ne postoji.');
          if (name === 'preferences' && parent.data()['isArchived'])
            throw new ApplicationError(
              'validation',
              'Arhivirani semestar ne može biti aktivni kontekst.',
            );
        }
        if (current.exists() && expectedRevision === null) {
          const data = current.data();
          const actualPayload =
            name === 'semesters'
              ? semesterInput(data as SemesterInput)
              : name === 'courses'
                ? courseInput(data as CourseInput)
                : { activeSemesterId: data['activeSemesterId'] };
          if (JSON.stringify(actualPayload) === JSON.stringify(payload)) return;
        }
        if ((current.exists() ? current.data()['revision'] : null) !== expectedRevision)
          throw new ApplicationError(
            'conflict',
            'Zapis je promijenjen na drugom uređaju. Usporedi novi zapis prije ponovnog spremanja.',
            current.exists() ? this.decode(name, id, current.data()) : null,
          );
        if (
          name === 'courses' &&
          current.exists() &&
          current.data()['semesterId'] !== (payload as CourseInput).semesterId
        )
          throw new ApplicationError(
            'validation',
            'Upis kolegija ostaje vezan uz izvorni semestar.',
          );
        tx.set(ref, {
          ...payload,
          id,
          revision: (expectedRevision ?? 0) + 1,
          updatedAt: serverTimestamp(),
        });
        if (prefSnapshot?.exists() && prefSnapshot.data()['activeSemesterId'] === id)
          tx.update(prefSnapshot.ref, {
            activeSemesterId: null,
            revision: prefSnapshot.data()['revision'] + 1,
            updatedAt: serverTimestamp(),
          });
        tx.update(rootRef, {
          dataRevision: control.dataRevision + 1,
          updatedAt: serverTimestamp(),
        });
      });
    } catch (error) {
      throw asApplicationError(error);
    }
  }
}
