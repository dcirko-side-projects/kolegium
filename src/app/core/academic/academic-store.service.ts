import { DestroyRef, Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { QueryDocumentSnapshot } from 'firebase/firestore';
import { AuthService } from '../../data/auth.service';
import { FirestoreContextService } from '../../data/firestore-context.service';
import { AcademicRepository } from '../../data/academic.repository';
import {
  ActiveScope,
  Control,
  Course,
  CourseInput,
  Preferences,
  Semester,
  SemesterInput,
} from '../../domain/academic.models';
import { ApplicationError, asApplicationError } from '../errors/application-error';
import { UnsavedChangesService } from '../forms/unsaved-changes.service';
import { PwaService } from '../pwa/pwa.service';

@Injectable({ providedIn: 'root' })
export class AcademicStoreService {
  private readonly auth = inject(AuthService);
  private readonly context = inject(FirestoreContextService);
  private readonly destroy = inject(DestroyRef);
  private repository?: AcademicRepository;
  private stopWatching?: () => void;
  private session = 0;
  private refreshing = false;
  private refreshAgain = false;
  private semesterCursor: QueryDocumentSnapshot | null = null;
  private courseCursor: QueryDocumentSnapshot | null = null;
  readonly datasetChanged = signal(false);
  readonly control = signal<Control | null>(null);
  readonly scope = signal<ActiveScope | null>(null);
  readonly semesters = signal<Semester[]>([]);
  readonly courses = signal<Course[]>([]);
  readonly preferences = signal<Preferences | null>(null);
  readonly selectedSemesterId = signal<string | null>(null);
  readonly selectedSemester = computed(
    () => this.semesters().find((row) => row.id === this.selectedSemesterId()) ?? null,
  );
  readonly activeSemester = computed(
    () => this.semesters().find((row) => row.id === this.preferences()?.activeSemesterId) ?? null,
  );
  readonly online = signal(navigator.onLine);
  readonly ready = signal(false);
  readonly loading = signal(false);
  readonly busy = signal(false);
  readonly error = signal<ApplicationError | null>(null);
  readonly stale = signal(false);
  readonly moreSemesters = signal(false);
  readonly moreCourses = signal(false);
  readonly locked = computed(() => this.control()?.restoreToken != null);
  readonly canWrite = computed(
    () =>
      this.online() &&
      this.ready() &&
      !this.busy() &&
      !this.loading() &&
      !this.stale() &&
      !this.locked() &&
      !this.datasetChanged(),
  );
  constructor() {
    this.destroy.onDestroy(inject(UnsavedChangesService).registerPending(() => this.busy()));
    this.destroy.onDestroy(
      inject(PwaService).registerUpdateBlocker(
        () => this.busy() || this.locked() || this.datasetChanged(),
      ),
    );
    const offline = () => {
      this.online.set(false);
      this.stale.set(true);
      void this.context
        .setOnline(false)
        .catch((error) => this.error.set(asApplicationError(error)));
    };
    const online = async () => {
      this.online.set(true);
      this.stale.set(true);
      try {
        await this.context.setOnline(true);
        await this.refresh();
      } catch (error) {
        this.error.set(asApplicationError(error));
      }
    };
    const focus = () => {
      if (this.online() && this.auth.status() === 'allowed') void this.refresh();
    };
    window.addEventListener('offline', offline);
    window.addEventListener('online', online);
    window.addEventListener('focus', focus);
    this.destroy.onDestroy(() => {
      this.stopWatching?.();
      window.removeEventListener('offline', offline);
      window.removeEventListener('online', online);
      window.removeEventListener('focus', focus);
    });
    effect(() => {
      const status = this.auth.status(),
        uid = this.auth.user()?.uid;
      untracked(() => {
        this.reset();
        if (status === 'allowed' && uid) void this.open(uid);
      });
    });
  }
  private reset(): void {
    this.datasetChanged.set(false);
    this.session++;
    this.stopWatching?.();
    this.stopWatching = undefined;
    this.repository = undefined;
    this.scope.set(null);
    this.control.set(null);
    this.semesters.set([]);
    this.courses.set([]);
    this.preferences.set(null);
    this.selectedSemesterId.set(null);
    this.ready.set(false);
    this.error.set(null);
    this.busy.set(false);
    this.loading.set(false);
    this.stale.set(false);
    this.moreSemesters.set(false);
    this.moreCourses.set(false);
    this.semesterCursor = null;
    this.courseCursor = null;
  }
  private async open(uid: string): Promise<void> {
    const session = this.session;
    this.loading.set(true);
    try {
      const repo = new AcademicRepository(this.context.firestore, () => this.online());
      this.repository = repo;
      const root = await repo.initialize(uid);
      if (session !== this.session) return;
      this.control.set(root);
      this.scope.set({ uid, datasetId: root.activeDatasetId });
      await this.refresh();
      if (session !== this.session) return;
      this.stopWatching = repo.watchControl(
        uid,
        (control) => {
          if (session !== this.session) return;
          const changed =
            control.dataRevision !== this.control()?.dataRevision ||
            control.activeDatasetId !== this.control()?.activeDatasetId ||
            control.restoreToken !== this.control()?.restoreToken;
          if (control.activeDatasetId !== this.scope()?.datasetId) {
            this.control.set(control);
            this.datasetChanged.set(true);
            this.stale.set(true);
            return;
          }
          this.control.set(control);
          if (changed) void this.refresh();
        },
        (error) => {
          if (session === this.session) {
            this.error.set(error);
            this.stale.set(true);
          }
        },
      );
    } catch (error) {
      if (session === this.session) this.error.set(asApplicationError(error));
    } finally {
      if (session === this.session) this.loading.set(false);
    }
  }
  async refresh(): Promise<void> {
    if (this.auth.status() !== 'allowed' || this.datasetChanged()) return;
    if (!this.repository) {
      await this.open(this.auth.requireUid());
      return;
    }
    if (this.refreshing) {
      this.refreshAgain = true;
      return;
    }
    this.refreshing = true;
    this.loading.set(true);
    const session = this.session,
      repo = this.repository;
    try {
      const uid = this.auth.requireUid();
      const control = await repo.readControl(uid),
        scope = { uid, datasetId: control.activeDatasetId };
      if (this.scope() && this.scope()!.datasetId !== control.activeDatasetId) {
        this.datasetChanged.set(true);
        this.stale.set(true);
        return;
      }
      const [page, preferences] = await Promise.all([
        repo.page<Semester>(scope, 'semesters'),
        repo.preferences(scope),
      ]);
      const semesters = page.records;
      const preferenceId = preferences?.activeSemesterId;
      const selectedId = this.selectedSemesterId() ?? preferenceId ?? null;
      for (const id of new Set([selectedId, preferenceId].filter((id): id is string => !!id)))
        if (!semesters.some((row) => row.id === id)) semesters.push(await repo.semester(scope, id));
      const coursePage = selectedId ? await repo.page<Course>(scope, 'courses', selectedId) : null;
      const finalControl = await repo.readControl(uid);
      if (session !== this.session) return;
      if (
        finalControl.activeDatasetId !== scope.datasetId ||
        finalControl.dataRevision !== control.dataRevision ||
        finalControl.restoreToken !== control.restoreToken
      ) {
        this.refreshAgain = true;
        this.stale.set(true);
        return;
      }
      this.scope.set(scope);
      this.control.set(control);
      this.semesters.set(semesters);
      this.preferences.set(preferences);
      this.selectedSemesterId.set(selectedId);
      this.courses.set(coursePage?.records ?? []);
      this.semesterCursor = page.cursor;
      this.courseCursor = coursePage?.cursor ?? null;
      this.moreSemesters.set(page.hasMore);
      this.moreCourses.set(coursePage?.hasMore ?? false);
      this.ready.set(true);
      this.stale.set(false);
      this.error.set(null);
    } catch (error) {
      if (session === this.session) {
        this.error.set(asApplicationError(error));
        this.stale.set(true);
      }
    } finally {
      this.refreshing = false;
      if (session === this.session) this.loading.set(false);
      if (this.refreshAgain) {
        this.refreshAgain = false;
        if (this.online() && this.auth.status() === 'allowed') void this.refresh();
      }
    }
  }
  async viewSemester(id: string | null): Promise<void> {
    this.selectedSemesterId.set(id);
    await this.refresh();
  }
  async loadMore(name: 'semesters' | 'courses'): Promise<void> {
    const scope = this.scope(),
      repo = this.repository;
    if (!scope || !repo || this.loading()) return;
    const session = this.session;
    this.loading.set(true);
    try {
      const page = await repo.page<Semester | Course>(
        scope,
        name,
        this.selectedSemesterId() ?? undefined,
        name === 'semesters' ? this.semesterCursor : this.courseCursor,
      );
      if (session !== this.session) return;
      if (name === 'semesters') {
        this.semesters.update((rows) => [
          ...rows,
          ...(page.records as Semester[]).filter((row) => !rows.some((old) => old.id === row.id)),
        ]);
        this.semesterCursor = page.cursor;
        this.moreSemesters.set(page.hasMore);
      } else {
        this.courses.update((rows) => [...rows, ...(page.records as Course[])]);
        this.courseCursor = page.cursor;
        this.moreCourses.set(page.hasMore);
      }
    } catch (error) {
      if (session === this.session) this.error.set(asApplicationError(error));
    } finally {
      if (session === this.session) this.loading.set(false);
    }
  }
  private async mutation(
    action: (repo: AcademicRepository, scope: ActiveScope) => Promise<void>,
  ): Promise<void> {
    if (!this.canWrite() || !this.repository || !this.scope())
      throw new ApplicationError(
        this.locked() ? 'restoreInProgress' : !this.online() ? 'offline' : 'unavailable',
        'Najprije osvježi podatke i provjeri vezu prije spremanja.',
      );
    const session = this.session;
    this.busy.set(true);
    try {
      await action(this.repository, this.scope()!);
      if (session === this.session) await this.refresh();
    } catch (error) {
      if (session === this.session) {
        this.error.set(asApplicationError(error));
        await this.refresh();
      }
      throw asApplicationError(error);
    } finally {
      if (session === this.session) this.busy.set(false);
    }
  }
  saveSemester(id: string, input: SemesterInput, revision: number | null): Promise<void> {
    return this.mutation((repo, scope) => repo.save(scope, 'semesters', id, input, revision));
  }
  async recoveryMutation(action: () => Promise<void>): Promise<void> {
    if (!this.ready() || !this.online() || this.busy() || this.datasetChanged())
      throw new ApplicationError('unavailable', 'Pričekaj osvježavanje i provjeri vezu.');
    this.busy.set(true);
    try {
      await action();
    } finally {
      this.busy.set(false);
      await this.refresh();
    }
  }
  externalMutation(action: () => Promise<void>): Promise<void> {
    return this.mutation(() => action());
  }
  saveCourse(id: string, input: CourseInput, revision: number | null): Promise<void> {
    return this.mutation((repo, scope) => repo.save(scope, 'courses', id, input, revision));
  }
  activateSemester(id: string | null): Promise<void> {
    const revision = this.preferences()?.revision ?? null;
    return this.mutation((repo, scope) => repo.selectSemester(scope, id, revision));
  }
  async getCourse(id: string): Promise<Course> {
    if (!this.repository || !this.scope())
      throw new ApplicationError('unavailable', 'Pričekaj učitavanje podataka.');
    return this.repository.course(this.scope()!, id);
  }
  async getSemester(id: string): Promise<Semester> {
    if (!this.repository || !this.scope())
      throw new ApplicationError('unavailable', 'Pričekaj učitavanje podataka.');
    return this.repository.semester(this.scope()!, id);
  }
}
