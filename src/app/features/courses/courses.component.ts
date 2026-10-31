import { IconComponent } from '../../shared/ui/icon/icon.component';
import { EditorDialogComponent } from '../../shared/ui/editor-dialog/editor-dialog.component';
import { Component, DestroyRef, computed, effect, inject, signal, untracked } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AcademicStoreService } from '../../core/academic/academic-store.service';
import { UnsavedChangesService } from '../../core/forms/unsaved-changes.service';
import { ApplicationError, asApplicationError } from '../../core/errors/application-error';
import { CourseLink, unknownAttendanceRules } from '../../domain/academic.models';

@Component({
  selector: 'app-courses',
  imports: [IconComponent, EditorDialogComponent, ReactiveFormsModule, RouterLink],
  templateUrl: './courses.component.html',
  styleUrl: './courses.component.scss',
})
export class CoursesComponent {
  protected readonly store = inject(AcademicStoreService);
  private readonly changes = inject(UnsavedChangesService);
  private readonly fb = inject(FormBuilder);
  protected readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(200)]],
    information: ['', Validators.maxLength(10000)],
    links: this.fb.array<ReturnType<CoursesComponent['linkGroup']>>([]),
  });
  protected readonly showArchived = signal(false);
  protected readonly visibleCourses = computed(() =>
    this.store.courses().filter((row) => this.showArchived() || !row.isArchived),
  );
  protected readonly formOpen = signal(false);
  protected readonly archiveEditing = signal(false);
  protected readonly error = signal<ApplicationError | null>(null);
  protected readonly success = signal<string | null>(null);
  private createId = crypto.randomUUID();
  private formSemesterId: string | null = null;
  constructor() {
    const destroy = inject(DestroyRef);
    const draft = this.changes.takeDraft<{
      semesterId: string | null;
      values: { name: string; information: string; links: CourseLink[] };
      id: ReturnType<typeof crypto.randomUUID>;
      archive: boolean;
    }>('new-course');
    if (draft) {
      this.formSemesterId = draft.semesterId;
      this.createId = draft.id;
      this.archiveEditing.set(draft.archive);
      this.form.reset({ name: draft.values.name, information: draft.values.information });
      for (const link of draft.values.links)
        this.form.controls.links.push(this.linkGroup(link.label, link.url));
      this.form.markAsDirty();
      this.formOpen.set(true);
    }
    let restoreView = !!draft;
    effect(() => {
      const ready = this.store.ready();
      if (ready && restoreView) {
        restoreView = false;
        untracked(() => {
          if (this.formSemesterId) void this.store.viewSemester(this.formSemesterId);
        });
      }
    });
    destroy.onDestroy(this.changes.register(() => this.form.dirty));
    destroy.onDestroy(() => {
      if (this.form.dirty)
        this.changes.keepDraft('new-course', {
          semesterId: this.formSemesterId,
          values: this.form.getRawValue(),
          id: this.createId,
          archive: this.archiveEditing(),
        });
    });
  }
  private linkGroup(label = '', url = '') {
    return this.fb.nonNullable.group({
      label: [label, [Validators.required, Validators.maxLength(200)]],
      url: [url, [Validators.required, Validators.maxLength(2000)]],
    });
  }
  canLeave(): boolean {
    const allowed = this.changes.canLeave();
    if (allowed) this.form.markAsPristine();
    return allowed;
  }
  protected addLink(): void {
    if (this.form.controls.links.length < 20) {
      this.form.controls.links.push(this.linkGroup());
      this.form.markAsDirty();
    }
  }
  protected removeLink(index: number): void {
    this.form.controls.links.removeAt(index);
    this.form.markAsDirty();
  }
  protected async changeSemester(select: HTMLSelectElement): Promise<void> {
    if (!this.changes.confirm()) {
      select.value = this.store.selectedSemesterId() ?? '';
      return;
    }
    this.clearForm();
    this.archiveEditing.set(false);
    await this.store.viewSemester(select.value || null);
  }
  protected allowArchive(): void {
    this.archiveEditing.set(true);
  }
  protected open(): void {
    this.clearForm();
    this.createId = crypto.randomUUID();
    this.formSemesterId = this.store.selectedSemesterId();
    this.formOpen.set(true);
  }
  protected cancel(): void {
    if (this.changes.confirm()) this.clearForm();
  }
  private clearForm(): void {
    this.form.reset();
    this.form.controls.links.clear();
    this.form.markAsPristine();
    this.formOpen.set(false);
    this.error.set(null);
    this.success.set(null);
  }
  protected async submit(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid || !this.store.selectedSemesterId()) {
      this.error.set(
        new ApplicationError(
          'validation',
          'Odaberi semestar i ispuni naziv te sve dodane poveznice.',
        ),
      );
      return;
    }
    this.error.set(null);
    this.success.set(null);
    try {
      if (this.formSemesterId !== this.store.selectedSemesterId())
        throw new ApplicationError(
          'conflict',
          'Kontekst semestra promijenjen je. Odaberi izvorni semestar prije spremanja.',
        );
      await this.store.saveCourse(
        this.createId,
        {
          ...this.form.getRawValue(),
          semesterId: this.formSemesterId!,
          isArchived: false,
          attendanceRules: unknownAttendanceRules(),
        },
        null,
      );
      this.clearForm();
      this.success.set('Kolegij je spremljen i potvrđen na poslužitelju.');
    } catch (error) {
      this.error.set(asApplicationError(error));
    }
  }
}
