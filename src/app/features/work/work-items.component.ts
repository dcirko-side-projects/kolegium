import { IconComponent } from '../../shared/ui/icon/icon.component';
import { EditorDialogComponent } from '../../shared/ui/editor-dialog/editor-dialog.component';
import { Component, DestroyRef, computed, effect, inject, signal, untracked } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { WorkStoreService } from '../../core/academic/work-store.service';
import { UnsavedChangesService } from '../../core/forms/unsaved-changes.service';
import { ApplicationError, asApplicationError } from '../../core/errors/application-error';
import { Assessment, AssessmentType, Project } from '../../domain/work.models';
import { assessmentInput, projectInput } from '../../domain/work.validation';
import { ResultHistoryComponent } from '../../shared/ui/results/result-history.component';
import { TasksComponent } from '../todo/tasks.component';
@Component({
  selector: 'app-work-items',
  imports: [
    IconComponent,
    EditorDialogComponent,
    ReactiveFormsModule,
    RouterLink,
    ResultHistoryComponent,
    TasksComponent,
  ],
  providers: [WorkStoreService],
  templateUrl: './work-items.component.html',
})
export class WorkItemsComponent {
  protected readonly store = inject(WorkStoreService);
  private readonly changes = inject(UnsavedChangesService);
  private readonly route = inject(ActivatedRoute);
  private readonly params = toSignal(this.route.paramMap);
  private readonly query = toSignal(this.route.queryParamMap);
  protected readonly isAssessment = this.route.snapshot.data['workKind'] === 'assessments';
  protected readonly heading = this.isAssessment ? 'Kolokviji i ispiti' : 'Projekti';
  protected readonly rows = computed(
    () =>
      (this.isAssessment ? this.store.assessments() : this.store.projects()) as (
        Assessment | Project
      )[],
  );
  protected readonly detail = signal<Assessment | Project | null>(null);
  protected readonly detailArchived = signal(false);
  protected readonly detailCourseName = signal('');
  protected missingCourseOption(id: string): boolean {
    return !!id && !this.store.academic.courses().some((c) => c.id === id);
  }
  protected readonly editing = signal(false);
  protected readonly old = signal<Assessment | Project | null>(null);
  protected readonly error = signal<ApplicationError | null>(null);
  protected readonly showArchived = signal(false);
  protected readonly filters = inject(FormBuilder).nonNullable.group({
    courseId: '',
    status: 'all',
    search: '',
  });
  protected readonly appliedStatus = signal('all');
  protected readonly appliedSearch = signal('');
  protected readonly hasArchive = computed(
    () => this.store.archivedIds().size > 0 || this.detailArchived(),
  );
  protected readonly form = inject(FormBuilder).nonNullable.group({
    name: '',
    courseId: '',
    type: 'quiz',
    scheduledOn: '',
    scheduledAt: '',
    dueOn: '',
  });
  private id: string = crypto.randomUUID();
  private request = 0;
  private restored = false;
  private courseInitialized = false;
  private lastCourseQuery: string | null | undefined;
  private lastSemester: string | null | undefined;
  protected readonly detailId = computed(() => this.params()?.get('id') ?? null);
  protected readonly displayRows = computed(() =>
    this.rows()
      .filter(
        (r) =>
          (this.showArchived() || !this.store.archivedIds().has(r.id)) &&
          (this.appliedStatus() === 'all' || r.isCompleted === (this.appliedStatus() === 'done')) &&
          r.name.toLocaleLowerCase('hr').includes(this.appliedSearch().toLocaleLowerCase('hr')),
      )
      .sort((a, b) => this.date(a).localeCompare(this.date(b)) || a.name.localeCompare(b.name)),
  );
  protected readonly canEditDetail = computed(
    () => this.store.canWrite() && (!this.detailArchived() || this.store.archiveEditing()),
  );
  constructor() {
    this.store.kind.set(this.isAssessment ? 'assessments' : 'projects');
    const destroy = inject(DestroyRef);
    destroy.onDestroy(this.changes.register(() => this.form.dirty));
    destroy.onDestroy(() => {
      this.request++;
      if (this.form.dirty)
        this.changes.keepDraft(this.draftKey(), {
          id: this.id,
          old: this.old(),
          values: this.form.getRawValue(),
        });
    });
    effect(() => {
      const filter = this.query()?.get('courseId'),
        ready = this.store.academic.ready(),
        semester = this.store.academic.selectedSemesterId();
      untracked(() => {
        if (
          ready &&
          (!this.courseInitialized ||
            filter !== this.lastCourseQuery ||
            semester !== this.lastSemester)
        ) {
          this.courseInitialized = true;
          this.lastCourseQuery = filter;
          this.lastSemester = semester;
          this.store.courseId.set(filter ?? null);
          this.filters.controls.courseId.setValue(filter ?? '');
        }
      });
    });
    effect(() => {
      const id = this.detailId(),
        scope = this.store.academic.scope(),
        ready = this.store.academic.ready();
      this.store.academic.control();
      untracked(() => {
        if (ready && scope) {
          if (id) void this.loadDetail(id);
          if (!this.restored) {
            this.restored = true;
            const draft = this.changes.takeDraft<{
              id: string;
              old: Assessment | Project | null;
              values: {
                name: string;
                courseId: string;
                type: string;
                scheduledOn: string;
                scheduledAt: string;
                dueOn: string;
              };
            }>(this.draftKey());
            if (draft) {
              this.id = draft.id;
              this.old.set(draft.old);
              this.form.reset(draft.values);
              this.form.markAsDirty();
              this.editing.set(true);
            }
          }
        }
      });
    });
  }
  private draftKey() {
    return (this.isAssessment ? 'assessments' : 'projects') + '-' + (this.detailId() ?? 'list');
  }
  canLeave() {
    const allowed = this.changes.canLeave();
    if (allowed) this.form.markAsPristine();
    return allowed;
  }
  protected path(id?: string) {
    return '/' + (this.isAssessment ? 'assessments' : 'projects') + (id ? '/' + id : '');
  }
  protected date(row: Assessment | Project) {
    return 'scheduledOn' in row ? row.scheduledOn : (row.dueOn ?? '9999-12-31');
  }
  protected dateLabel(row: Assessment | Project) {
    return 'scheduledOn' in row
      ? row.scheduledOn + (row.scheduledAt ? ' · ' + row.scheduledAt : '')
      : (row.dueOn ?? 'nije zadan');
  }
  protected typeLabel(row: Assessment | Project) {
    return 'type' in row
      ? { quiz: 'Kolokvij', exam: 'Ispit', oral: 'Usmeni', defense: 'Obrana', other: 'Drugo' }[
          row.type
        ]
      : 'Projekt';
  }
  protected async loadDetail(id: string) {
    const request = ++this.request;
    try {
      const row = (await this.store
        .repository()
        .get(this.store.academic.scope()!, this.isAssessment ? 'assessments' : 'projects', id)) as
        Assessment | Project | null;
      if (!row) throw new ApplicationError('notFound', 'Stavka nije pronađena.');
      let archived = 'isArchived' in row && row.isArchived;
      if (row.courseId) {
        const c = await this.store.academic.getCourse(row.courseId),
          s = await this.store.academic.getSemester(c.semesterId);
        archived = archived || c.isArchived || s.isArchived;
        if (request === this.request) this.detailCourseName.set(c.name);
      }
      if (request !== this.request) return;
      this.detail.set(row);
      this.detailArchived.set(archived);
    } catch (e) {
      if (request === this.request) this.error.set(asApplicationError(e));
    }
  }
  protected applyFilters(reset = false) {
    if (!this.changes.confirm()) return;
    if (reset) this.filters.reset();
    const value = this.filters.getRawValue();
    this.store.courseId.set(value.courseId || null);
    this.store.count.set(50);
    this.appliedStatus.set(value.status);
    this.appliedSearch.set(value.search.trim());
    this.store.archiveEditing.set(false);
  }
  protected start(row: Assessment | Project | null = null) {
    if (!this.changes.confirm()) return;
    this.old.set(row);
    this.id = row?.id ?? crypto.randomUUID();
    this.form.reset({
      name: row?.name ?? '',
      courseId: row
        ? (row.courseId ?? '')
        : (this.store.courseId() ??
          (this.isAssessment
            ? (this.store.academic.courses().find((c) => !c.isArchived)?.id ?? '')
            : '')),
      type: row && 'type' in row ? row.type : 'quiz',
      scheduledOn: row && 'scheduledOn' in row ? row.scheduledOn : '',
      scheduledAt: row && 'scheduledAt' in row ? (row.scheduledAt ?? '') : '',
      dueOn: row && 'dueOn' in row ? (row.dueOn ?? '') : '',
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
  protected async submit() {
    this.error.set(null);
    this.store.success.set(null);
    try {
      const v = this.form.getRawValue(),
        old = this.old();
      if (
        old &&
        (('isArchived' in old && old.isArchived) ||
          this.store.archivedIds().has(old.id) ||
          this.detailArchived()) &&
        !this.store.archiveEditing()
      )
        throw new ApplicationError('validation', 'Za korekciju arhive uključi Uredi arhivu.');
      await this.store.checkCourse(v.courseId || null);
      const payload = this.isAssessment
        ? assessmentInput({
            courseId: v.courseId,
            name: v.name,
            type: v.type as AssessmentType,
            scheduledOn: v.scheduledOn,
            scheduledAt: v.scheduledAt || null,
            isCompleted: old?.isCompleted ?? false,
          })
        : projectInput({
            courseId: v.courseId || null,
            name: v.name,
            dueOn: v.dueOn || null,
            isCompleted: old?.isCompleted ?? false,
            isArchived: old && 'isArchived' in old ? old.isArchived : false,
          });
      await this.store.write((repo) =>
        repo.save(
          this.store.academic.scope()!,
          this.isAssessment ? 'assessments' : 'projects',
          this.id,
          payload,
          old?.revision ?? null,
        ),
      );
      this.form.reset();
      this.editing.set(false);
      if (this.detailId()) await this.loadDetail(this.detailId()!);
    } catch (e) {
      this.error.set(asApplicationError(e));
    }
  }
  protected async toggle(row: Assessment | Project) {
    if (!this.changes.confirm()) return;
    this.error.set(null);
    this.store.success.set(null);
    try {
      await this.store.checkCourse(row.courseId);
      if (
        (('isArchived' in row && row.isArchived) ||
          this.detailArchived() ||
          this.store.archivedIds().has(row.id)) &&
        !this.store.archiveEditing()
      )
        throw new ApplicationError('validation', 'Za korekciju arhive uključi Uredi arhivu.');
      const payload = this.isAssessment
        ? { ...assessmentInput(row as Assessment), isCompleted: !row.isCompleted }
        : { ...projectInput(row as Project), isCompleted: !row.isCompleted };
      await this.store.write((repo) =>
        repo.save(
          this.store.academic.scope()!,
          this.isAssessment ? 'assessments' : 'projects',
          row.id,
          payload,
          row.revision,
        ),
      );
      if (this.detailId()) await this.loadDetail(this.detailId()!);
    } catch (e) {
      this.error.set(asApplicationError(e));
    }
  }
  protected async archive(row: Assessment | Project) {
    if (
      !('isArchived' in row) ||
      !this.changes.confirm() ||
      !window.confirm(
        row.isArchived
          ? 'Vrati projekt iz arhive?'
          : 'Arhiviraj projekt? Zadaci i rezultati ostaju sačuvani.',
      )
    )
      return;
    try {
      await this.store.checkCourse(row.courseId);
      await this.store.write((repo) =>
        repo.save(
          this.store.academic.scope()!,
          'projects',
          row.id,
          { ...projectInput(row), isArchived: !row.isArchived },
          row.revision,
        ),
      );
      if (this.detailId()) await this.loadDetail(this.detailId()!);
    } catch (e) {
      this.error.set(asApplicationError(e));
    }
  }
  protected serverDescription() {
    const r = this.error()?.serverRecord as Assessment | Project | undefined;
    return r
      ? r.name + ' · ' + (r.isCompleted ? 'obavljeno' : 'otvoreno')
      : 'Osvježi za usporedbu.';
  }
  protected async replaceWithServer() {
    if (!this.changes.confirm()) return;
    this.form.reset();
    this.editing.set(false);
    this.error.set(null);
    this.store.success.set(null);
    await this.store.refresh();
    if (this.detailId()) await this.loadDetail(this.detailId()!);
  }
}
