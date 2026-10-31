import { IconComponent } from '../../shared/ui/icon/icon.component';
import { EditorDialogComponent } from '../../shared/ui/editor-dialog/editor-dialog.component';
import { BackupComponent } from '../backup/backup.component';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AcademicStoreService } from '../../core/academic/academic-store.service';
import { UnsavedChangesService } from '../../core/forms/unsaved-changes.service';
import { ApplicationError, asApplicationError } from '../../core/errors/application-error';
import { Semester } from '../../domain/academic.models';
import { semesterInput } from '../../domain/academic.validation';

@Component({
  selector: 'app-semesters',
  imports: [IconComponent, EditorDialogComponent, ReactiveFormsModule, BackupComponent],
  templateUrl: './semesters.component.html',
  styleUrl: './semesters.component.scss',
})
export class SemestersComponent {
  protected readonly store = inject(AcademicStoreService);
  private readonly fb = inject(FormBuilder);
  private readonly changes = inject(UnsavedChangesService);
  private readonly router = inject(Router);
  protected readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(200)]],
    startsOn: ['', Validators.required],
    endsOn: ['', Validators.required],
  });
  protected readonly editing = signal<Semester | null>(null);
  protected readonly formOpen = signal(false);
  protected readonly error = signal<ApplicationError | null>(null);
  protected readonly success = signal<string | null>(null);
  protected readonly serverName = computed(
    () =>
      this.store.semesters().find((row) => row.id === this.editing()?.id)?.name ??
      'Zapis više nije dostupan',
  );
  private createId = crypto.randomUUID();
  constructor() {
    const destroy = inject(DestroyRef);
    const draft = this.changes.takeDraft<{
      row: Semester | null;
      values: { name: string; startsOn: string; endsOn: string };
      id: ReturnType<typeof crypto.randomUUID>;
    }>('semesters');
    if (draft) {
      this.editing.set(draft.row);
      this.createId = draft.id;
      this.form.reset(draft.values);
      this.form.markAsDirty();
      this.formOpen.set(true);
    }
    destroy.onDestroy(this.changes.register(() => this.form.dirty));
    destroy.onDestroy(() => {
      if (this.form.dirty)
        this.changes.keepDraft('semesters', {
          row: this.editing(),
          values: this.form.getRawValue(),
          id: this.createId,
        });
    });
  }
  canLeave(): boolean {
    const allowed = this.changes.canLeave();
    if (allowed) this.form.markAsPristine();
    return allowed;
  }
  protected open(row?: Semester): void {
    if (!this.changes.confirm()) return;
    this.editing.set(row ?? null);
    this.createId = crypto.randomUUID();
    this.form.reset({
      name: row?.name ?? '',
      startsOn: row?.startsOn ?? '',
      endsOn: row?.endsOn ?? '',
    });
    this.formOpen.set(true);
    this.error.set(null);
    this.success.set(null);
  }
  protected cancel(): void {
    if (!this.changes.confirm()) return;
    this.form.reset();
    this.formOpen.set(false);
    this.editing.set(null);
    this.error.set(null);
  }
  protected async submit(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.error.set(new ApplicationError('validation', 'Ispuni naziv i oba datuma semestra.'));
      return;
    }
    this.error.set(null);
    this.success.set(null);
    try {
      const row = this.editing();
      await this.store.saveSemester(
        row?.id ?? this.createId,
        { ...this.form.getRawValue(), isArchived: row?.isArchived ?? false },
        row?.revision ?? null,
      );
      this.form.markAsPristine();
      this.formOpen.set(false);
      this.editing.set(null);
      this.success.set('Semestar je spremljen i potvrđen na poslužitelju.');
    } catch (error) {
      this.error.set(asApplicationError(error));
    }
  }
  protected async activate(row: Semester): Promise<void> {
    try {
      await this.store.activateSemester(row.id);
      await this.store.viewSemester(row.id);
      this.success.set('Aktualni semestar je postavljen.');
      this.error.set(null);
    } catch (error) {
      this.error.set(asApplicationError(error));
    }
  }
  protected async archive(row: Semester): Promise<void> {
    if (
      !window.confirm(
        row.isArchived
          ? `Vrati semestar „${row.name}” iz arhive?`
          : `Arhiviraj semestar „${row.name}”? Podaci ostaju sačuvani. Ako je aktualan, prestat će biti aktualni kontekst.`,
      )
    )
      return;
    try {
      await this.store.saveSemester(
        row.id,
        { ...semesterInput(row), isArchived: !row.isArchived },
        row.revision,
      );
      this.success.set('Stanje arhive je spremljeno.');
      this.error.set(null);
    } catch (error) {
      this.error.set(asApplicationError(error));
    }
  }
  protected async view(row: Semester): Promise<void> {
    if (!this.changes.confirm()) return;
    this.form.markAsPristine();
    await this.store.viewSemester(row.id);
    await this.router.navigateByUrl('/courses');
  }
  protected replaceWithServer(): void {
    const row =
      this.editing() && this.store.semesters().find((item) => item.id === this.editing()?.id);
    if (row && window.confirm('Odbaci lokalni unos i učitaj novu verziju semestra?')) {
      this.form.markAsPristine();
      this.open(row);
    }
  }
}
