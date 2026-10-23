import {
  Component,
  DestroyRef,
  computed,
  effect,
  inject,
  input,
  signal,
  untracked,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { WorkStoreService } from '../../core/academic/work-store.service';
import { UnsavedChangesService } from '../../core/forms/unsaved-changes.service';
import { ApplicationError, asApplicationError } from '../../core/errors/application-error';
import { Task, TaskContext, Project } from '../../domain/work.models';
import { taskInput } from '../../domain/work.validation';
@Component({
  selector: 'app-tasks',
  imports: [ReactiveFormsModule, RouterLink],
  providers: [WorkStoreService],
  templateUrl: './tasks.component.html',
})
export class TasksComponent {
  readonly embedded = input(false);
  readonly fixedType = input<'project' | 'thesis' | null>(null);
  readonly fixedId = input<string | null>(null);
  protected readonly store = inject(WorkStoreService);
  private readonly changes = inject(UnsavedChangesService);
  protected readonly form = inject(FormBuilder).nonNullable.group({
    title: '',
    dueOn: '',
    contextType: 'none',
    contextId: '',
  });
  protected readonly editing = signal(false);
  protected readonly old = signal<Task | null>(null);
  protected readonly error = signal<ApplicationError | null>(null);
  protected readonly filterType = signal('all');
  protected readonly filterId = signal('');
  protected readonly filterStatus = signal('all');
  protected readonly appliedFilters = signal({ type: 'all', id: '', status: 'all' });
  protected readonly visible = computed(() => this.store.tasks());
  private id: string = crypto.randomUUID();
  private draftRestored = false;
  protected missingContextOption(): boolean {
    const id = this.form.controls.contextId.value;
    return (
      !!id &&
      (this.form.controls.contextType.value === 'course'
        ? !this.store.academic.courses().some((c) => c.id === id)
        : !this.store.projects().some((p) => p.id === id))
    );
  }
  constructor() {
    const courseId = inject(ActivatedRoute).snapshot.queryParamMap.get('courseId');
    if (courseId) {
      this.filterType.set('course');
      this.filterId.set(courseId);
      this.appliedFilters.set({ type: 'course', id: courseId, status: 'all' });
    }
    const destroy = inject(DestroyRef);
    destroy.onDestroy(this.changes.register(() => this.form.dirty));
    destroy.onDestroy(() => {
      if (this.form.dirty)
        this.changes.keepDraft(this.draftKey(), {
          id: this.id,
          old: this.old(),
          values: this.form.getRawValue(),
        });
    });
    effect(() => {
      const fixed = this.fixedType(),
        id = this.fixedId(),
        { type, id: filterId, status } = this.appliedFilters();
      untracked(() => {
        this.store.contextFilter.set(
          fixed
            ? { type: fixed, id: id ?? undefined }
            : type === 'all'
              ? null
              : { type, id: filterId || undefined },
        );
        this.store.completedFilter.set(status === 'all' ? undefined : status === 'done');
        this.store.count.set(50);
      });
    });
    effect(() => {
      const ready = this.store.academic.ready();
      untracked(() => {
        if (ready && !this.draftRestored) {
          this.draftRestored = true;
          const draft = this.changes.takeDraft<{
            id: string;
            old: Task | null;
            values: { title: string; dueOn: string; contextType: string; contextId: string };
          }>(this.draftKey());
          if (draft) {
            this.id = draft.id;
            this.old.set(draft.old);
            this.form.reset(draft.values);
            this.form.markAsDirty();
            this.editing.set(true);
          }
        }
      });
    });
  }
  private draftKey() {
    return 'tasks-' + (this.fixedType() ?? 'all') + '-' + (this.fixedId() ?? '');
  }
  canLeave() {
    const allowed = this.changes.canLeave();
    if (allowed) this.form.markAsPristine();
    return allowed;
  }
  protected contextChanged() {
    this.form.controls.contextId.setValue(
      this.form.controls.contextType.value === 'thesis' ? 'main' : '',
    );
  }
  protected changeFilters(type: string, id: string, status: string) {
    this.filterType.set(type);
    this.filterId.set(id);
    this.filterStatus.set(status);
  }
  protected applyFilters(reset = false) {
    if (!this.changes.confirm()) return;
    if (reset) this.changeFilters('all', '', 'all');
    this.appliedFilters.set({
      type: this.filterType(),
      id: this.filterId(),
      status: this.filterStatus(),
    });
    this.store.archiveEditing.set(false);
  }
  protected start(row: Task | null = null) {
    if (!this.changes.confirm()) return;
    this.old.set(row);
    this.id = row?.id ?? crypto.randomUUID();
    this.form.reset({
      title: row?.title ?? '',
      dueOn: row?.dueOn ?? '',
      contextType: row?.context.type ?? this.fixedType() ?? 'none',
      contextId: row?.context.id ?? this.fixedId() ?? '',
    });
    this.editing.set(true);
    this.error.set(null);
    this.store.success.set(null);
  }
  protected cancel() {
    if (this.changes.confirm()) {
      this.form.reset();
      this.editing.set(false);
      this.error.set(null);
      this.store.success.set(null);
    }
  }
  protected description(row: Task): string {
    const c = row.context;
    if (c.type === 'none') return 'Samostalni zadatak';
    if (c.type === 'thesis') return 'Diplomski';
    if (c.type === 'course') return this.store.courseNames()[c.id!] ?? 'Kolegij';
    const p = this.store.projects().find((p) => p.id === c.id);
    return (
      'Projekt: ' +
      (p?.name ?? '') +
      (p?.courseId ? ' · ' + (this.store.courseNames()[p.courseId] ?? 'Kolegij') : '')
    );
  }
  private async checkContext(context: TaskContext, old: Task | null) {
    if (old && !this.store.canEdit(old.id))
      throw new ApplicationError('validation', 'Za korekciju arhive uključi Uredi arhivu.');
    if (context.type === 'course') await this.store.checkCourse(context.id);
    if (context.type === 'project') {
      const project = (await this.store
        .repository()
        .get(this.store.academic.scope()!, 'projects', context.id!)) as Project | null;
      if (project?.isArchived && !this.store.archiveEditing())
        throw new ApplicationError('validation', 'Projekt je arhiviran. Uključi Uredi arhivu.');
      await this.store.checkCourse(project?.courseId ?? null);
    }
  }
  protected async submit() {
    this.error.set(null);
    this.store.success.set(null);
    try {
      const v = this.form.getRawValue(),
        payload = taskInput({
          title: v.title,
          dueOn: v.dueOn || null,
          isCompleted: this.old()?.isCompleted ?? false,
          context: {
            type: v.contextType as TaskContext['type'],
            id: v.contextType === 'none' ? null : v.contextType === 'thesis' ? 'main' : v.contextId,
          },
        });
      await this.checkContext(payload.context, this.old());
      await this.store.write((repo) =>
        repo.save(
          this.store.academic.scope()!,
          'tasks',
          this.id,
          payload,
          this.old()?.revision ?? null,
        ),
      );
      this.form.reset();
      this.editing.set(false);
    } catch (e) {
      this.error.set(asApplicationError(e));
    }
  }
  protected async toggle(row: Task) {
    if (!this.changes.confirm()) return;
    this.error.set(null);
    this.store.success.set(null);
    try {
      await this.checkContext(row.context, row);
      await this.store.write((repo) =>
        repo.save(
          this.store.academic.scope()!,
          'tasks',
          row.id,
          { ...taskInput(row), isCompleted: !row.isCompleted },
          row.revision,
        ),
      );
    } catch (e) {
      this.error.set(asApplicationError(e));
    }
  }
  protected serverDescription() {
    const row = this.error()?.serverRecord as Task | undefined;
    return row
      ? row.title + ' · ' + (row.isCompleted ? 'dovršeno' : 'otvoreno')
      : 'Osvježi za usporedbu.';
  }
  protected async replaceWithServer() {
    if (!this.changes.confirm()) return;
    this.form.reset();
    this.editing.set(false);
    this.error.set(null);
    this.store.success.set(null);
    await this.store.refresh();
  }
}
