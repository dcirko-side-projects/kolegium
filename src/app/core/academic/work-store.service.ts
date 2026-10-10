import { DestroyRef, Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { AcademicStoreService } from './academic-store.service';
import { FirebaseContextService } from '../../data/firebase-context.service';
import { WorkRepository } from '../../data/work.repository';
import { AcademicRepository } from '../../data/academic.repository';
import { Assessment, Project, Task, Thesis } from '../../domain/work.models';
import { ApplicationError, asApplicationError } from '../errors/application-error';

@Injectable()
export class WorkStoreService {
  readonly academic = inject(AcademicStoreService);
  private readonly context = inject(FirebaseContextService);
  readonly assessments = signal<Assessment[]>([]);
  readonly projects = signal<Project[]>([]);
  readonly tasks = signal<Task[]>([]);
  readonly thesis = signal<Thesis | null>(null);
  readonly courseId = signal<string | null>(null);
  readonly kind = signal<'assessments' | 'projects' | 'tasks' | 'thesis' | 'results'>('tasks');
  readonly contextFilter = signal<{ type: string; id?: string } | null>(null);
  readonly completedFilter = signal<boolean | undefined>(undefined);
  readonly count = signal(50);
  readonly more = signal(false);
  readonly moreProjects = signal(false);
  readonly loading = signal(false);
  readonly error = signal<ApplicationError | null>(null);
  readonly success = signal<string | null>(null);
  readonly archiveEditing = signal(false);
  readonly archivedIds = signal<Set<string>>(new Set());
  readonly courseNames = signal<Record<string, string | undefined>>({});
  private request = 0;
  readonly canWrite = computed(() => this.academic.canWrite() && !this.loading() && !this.error());
  constructor() {
    inject(DestroyRef).onDestroy(() => this.request++);
    effect(() => {
      const scope = this.academic.scope(),
        ready = this.academic.ready(),
        online = this.academic.online();
      this.academic.control();
      this.academic.courses();
      this.kind();
      this.courseId();
      this.count();
      this.contextFilter();
      this.completedFilter();
      untracked(() => {
        if (scope && ready && online && this.kind() !== 'results') void this.refresh();
        else if (!scope) {
          this.request++;
          this.assessments.set([]);
          this.projects.set([]);
          this.tasks.set([]);
          this.thesis.set(null);
          this.loading.set(false);
          this.courseNames.set({});
          this.archivedIds.set(new Set());
        }
      });
    });
  }
  repository(): WorkRepository {
    return new WorkRepository(this.context.firestore, () => this.academic.online());
  }
  async refresh(): Promise<void> {
    if (this.kind() === 'results') return;
    const scope = this.academic.scope();
    if (!scope || !this.academic.ready() || !this.academic.online()) return;
    const request = ++this.request;
    this.loading.set(true);
    try {
      const repo = this.repository(),
        controlRepo = new AcademicRepository(this.context.firestore, () => this.academic.online()),
        before = await controlRepo.readControl(scope.uid);
      const kind = this.kind(),
        filter = this.contextFilter();
      const rows: (Assessment | Project | Task)[] = [];
      let cursor = null,
        more = false;
      if (kind !== 'thesis' && kind !== 'results') {
        do {
          const page = await repo.page(
            scope,
            kind,
            {
              ...((kind === 'assessments' || kind === 'projects') && this.courseId()
                ? { courseId: this.courseId()! }
                : {}),
              ...(kind === 'tasks'
                ? {
                    contextType: filter?.type,
                    contextId: filter?.id,
                    completed: this.completedFilter(),
                  }
                : {}),
            },
            cursor,
          );
          rows.push(...page.records);
          cursor = page.cursor;
          more = page.hasMore;
        } while (more && rows.length < this.count());
      }
      const thesis = (await repo.get(scope, 'thesis', 'main')) as Thesis | null;
      const projects =
        kind === 'projects'
          ? (rows as Project[])
          : ((await repo.page(scope, 'projects')).records as Project[]);
      const projectMap = new Map(projects.map((p) => [p.id, p]));
      for (const task of rows.filter((r): r is Task => 'context' in r)) {
        if (task.context.type === 'project' && !projectMap.has(task.context.id!)) {
          const project = (await repo.get(scope, 'projects', task.context.id!)) as Project | null;
          if (project) projectMap.set(project.id, project);
        }
      }
      const courseIds = new Set<string>();
      const courseNames: Record<string, string> = {};
      for (const row of [...rows, ...projectMap.values()]) {
        const id =
          'courseId' in row
            ? row.courseId
            : 'context' in row && row.context.type === 'course'
              ? row.context.id
              : null;
        if (id) courseIds.add(id);
      }
      const archivedCourses = new Set<string>();
      for (const id of courseIds) {
        const course = await this.academic.getCourse(id),
          semester = await this.academic.getSemester(course.semesterId);
        courseNames[id] = course.name;
        if (course.isArchived || semester.isArchived) archivedCourses.add(id);
      }
      const archived = new Set<string>();
      for (const row of [...rows, ...projectMap.values()]) {
        let id = 'courseId' in row ? row.courseId : null,
          own = false;
        if ('context' in row) {
          if (row.context.type === 'course') id = row.context.id;
          if (row.context.type === 'project') {
            const p = projectMap.get(row.context.id!);
            id = p?.courseId ?? null;
            own = !!p?.isArchived;
          }
        }
        if ((id && archivedCourses.has(id)) || ('isArchived' in row && row.isArchived) || own)
          archived.add(row.id);
      }
      const after = await controlRepo.readControl(scope.uid);
      if (request !== this.request) return;
      if (before.dataRevision !== after.dataRevision || scope.datasetId !== after.activeDatasetId) {
        void this.refresh();
        return;
      }
      this.assessments.set(kind === 'assessments' ? (rows as Assessment[]) : []);
      this.tasks.set(kind === 'tasks' ? (rows as Task[]) : []);
      this.projects.set([...projectMap.values()]);
      this.thesis.set(thesis);
      this.more.set(more);
      this.moreProjects.set(kind !== 'projects' && projects.length === 50);
      this.archivedIds.set(archived);
      this.courseNames.set(courseNames);
      this.error.set(null);
    } catch (e) {
      if (request === this.request) this.error.set(asApplicationError(e));
    } finally {
      if (request === this.request) this.loading.set(false);
    }
  }
  canEdit(id?: string): boolean {
    return this.canWrite() && (!id || !this.archivedIds().has(id) || this.archiveEditing());
  }
  async checkCourse(id: string | null): Promise<void> {
    if (!id) return;
    const course = await this.academic.getCourse(id),
      semester = await this.academic.getSemester(course.semesterId);
    if ((course.isArchived || semester.isArchived) && !this.archiveEditing())
      throw new ApplicationError('validation', 'Za korekciju arhive prvo uključi Uredi arhivu.');
  }
  async checkSource(
    type: 'assessment' | 'project' | 'lecture' | 'exercise',
    id: string,
  ): Promise<void> {
    const source = (await this.repository().get(
      this.academic.scope()!,
      type === 'lecture' || type === 'exercise'
        ? 'scoreActivities'
        : type === 'assessment'
          ? 'assessments'
          : 'projects',
      id,
    )) as Assessment | Project | null;
    if (!source) throw new ApplicationError('notFound', 'Izvor rezultata više ne postoji.');
    if ('isArchived' in source && source.isArchived && !this.archiveEditing())
      throw new ApplicationError('validation', 'Za korekciju arhive uključi Uredi arhivu.');
    await this.checkCourse(source.courseId);
  }
  async write(action: (repo: WorkRepository) => Promise<void>): Promise<void> {
    if (!this.canWrite())
      throw new ApplicationError('unavailable', 'Najprije provjeri vezu i osvježi podatke.');
    this.success.set(null);
    try {
      await this.academic.externalMutation(() => action(this.repository()));
      await this.refresh();
      this.success.set('Izmjena je spremljena i potvrđena na poslužitelju.');
    } catch (e) {
      throw asApplicationError(e);
    }
  }
  loadMore(): void {
    this.count.update((n) => n + 50);
  }
}
