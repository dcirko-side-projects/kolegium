import { Component, DestroyRef, computed, effect, inject, signal, untracked } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ScheduleStoreService } from '../../core/academic/schedule-store.service';
import { UnsavedChangesService } from '../../core/forms/unsaved-changes.service';
import { ApplicationError, asApplicationError } from '../../core/errors/application-error';
import { addDays, localNow, occurrences, templateInput, weekStart } from '../../domain/schedule';
import { Occurrence, ScheduleTemplate, TeachingKind } from '../../domain/schedule.models';
import { SessionRowComponent } from '../../shared/ui/session-row/session-row.component';
import { CalendarImportComponent } from './calendar-import.component';

@Component({
  selector: 'app-schedule',
  imports: [ReactiveFormsModule, RouterLink, SessionRowComponent, CalendarImportComponent],
  providers: [ScheduleStoreService],
  templateUrl: './schedule.component.html',
})
export class ScheduleComponent {
  protected readonly store = inject(ScheduleStoreService);
  private readonly changes = inject(UnsavedChangesService);
  private readonly fb = inject(FormBuilder);
  protected readonly selectedDate = signal(localNow().date);
  protected readonly dayOnly = signal(false);
  protected readonly hideCancelled = signal(false);
  protected readonly importing = signal(false);
  protected readonly single = signal(false);
  protected readonly rows = computed(() =>
    this.store
      .rows()
      .filter(
        (r) =>
          (!this.dayOnly() || r.scheduledOn === this.selectedDate()) &&
          (!this.hideCancelled() || !r.isCancelled),
      ),
  );
  protected readonly formOpen = signal(false);
  protected readonly editing = signal<ScheduleTemplate | null>(null);
  protected readonly preview = signal<Occurrence[] | null>(null);
  protected readonly replacement = signal<Occurrence | null>(null);
  protected readonly error = signal<ApplicationError | null>(null);
  protected readonly days = [
    'Ponedjeljak',
    'Utorak',
    'Srijeda',
    'Četvrtak',
    'Petak',
    'Subota',
    'Nedjelja',
  ];
  protected readonly form = this.fb.nonNullable.group({
    courseId: ['', Validators.required],
    kind: ['lecture' as TeachingKind],
    weekday: [1],
    startsAt: ['08:00', Validators.required],
    endsAt: ['09:00', Validators.required],
    location: [''],
    validFrom: ['', Validators.required],
    validUntil: ['', Validators.required],
    effectiveOn: [''],
    scheduledOn: [localNow().date, Validators.required],
  });
  protected readonly replacementForm = this.fb.nonNullable.group({
    scheduledOn: ['', Validators.required],
    startsAt: ['', Validators.required],
    endsAt: ['', Validators.required],
    location: [''],
  });
  private createId = crypto.randomUUID();
  constructor() {
    const destroy = inject(DestroyRef);
    const draft = this.changes.takeDraft<{
      id: ReturnType<typeof crypto.randomUUID>;
      date: string;
      single: boolean;
      old: ScheduleTemplate | null;
      form: ReturnType<ScheduleComponent['form']['getRawValue']>;
      replacement: Occurrence | null;
      replacementForm: ReturnType<ScheduleComponent['replacementForm']['getRawValue']>;
    }>('schedule');
    if (draft) {
      this.createId = draft.id;
      this.selectedDate.set(draft.date);
      this.single.set(draft.single);
      this.editing.set(draft.old);
      this.form.reset(draft.form);
      this.replacement.set(draft.replacement);
      this.replacementForm.reset(draft.replacementForm);
      this.formOpen.set(!draft.replacement);
      if (draft.replacement) this.replacementForm.markAsDirty();
      else this.form.markAsDirty();
    }
    destroy.onDestroy(this.changes.register(() => this.form.dirty || this.replacementForm.dirty));
    effect(() => {
      const date = this.selectedDate();
      untracked(() => {
        this.store.from.set(weekStart(date));
        this.store.until.set(addDays(weekStart(date), 6));
      });
    });
    const changed = this.form.valueChanges.subscribe(() => this.preview.set(null));
    destroy.onDestroy(() => changed.unsubscribe());
    destroy.onDestroy(() => {
      if (this.form.dirty || this.replacementForm.dirty)
        this.changes.keepDraft('schedule', {
          id: this.createId,
          date: this.selectedDate(),
          single: this.single(),
          old: this.editing(),
          form: this.form.getRawValue(),
          replacement: this.replacement(),
          replacementForm: this.replacementForm.getRawValue(),
        });
    });
  }
  canLeave(): boolean {
    const yes = this.changes.canLeave();
    if (yes) {
      this.form.markAsPristine();
      this.replacementForm.markAsPristine();
    }
    return yes;
  }
  protected name(id: string): string {
    return this.store.courses().find((c) => c.id === id)?.name ?? 'Kolegij';
  }
  protected changeDate(value: string): void {
    if (value && this.changes.confirm()) this.selectedDate.set(value);
  }
  protected moveWeek(count: number): void {
    this.changeDate(addDays(this.selectedDate(), count * 7));
  }
  protected open(old: ScheduleTemplate | null = null, single = false): void {
    if (!this.changes.confirm()) return;
    const semester = this.store.academic.selectedSemester();
    if (!semester) return;
    this.createId = crypto.randomUUID();
    this.editing.set(old);
    this.single.set(single);
    this.replacement.set(null);
    this.form.reset({
      courseId: old?.courseId ?? this.store.courses().find((c) => !c.isArchived)?.id ?? '',
      kind: old?.kind ?? 'lecture',
      weekday: old?.weekday ?? 1,
      startsAt: old?.startsAt ?? '08:00',
      endsAt: old?.endsAt ?? '09:00',
      location: old?.location ?? '',
      validFrom: old?.validFrom ?? semester.startsOn,
      validUntil: old?.validUntil ?? semester.endsOn,
      effectiveOn:
        localNow().date > (old?.validFrom ?? '') ? localNow().date : (old?.validFrom ?? ''),
      scheduledOn: this.selectedDate(),
    });
    this.formOpen.set(true);
    this.preview.set(null);
    this.error.set(null);
  }
  protected async saveSingle(): Promise<void> {
    try {
      const value = this.form.getRawValue(),
        semester = this.store.academic.selectedSemester();
      if (!semester || value.scheduledOn < semester.startsOn || value.scheduledOn > semester.endsOn)
        throw new ApplicationError('validation', 'Datum termina mora biti unutar semestra.');
      const row: Occurrence = {
        id: this.createId,
        revision: null,
        courseId: value.courseId,
        kind: value.kind,
        scheduledOn: value.scheduledOn,
        startsAt: value.startsAt,
        endsAt: value.endsAt,
        location: value.location || null,
        templateId: null,
        replacementForId: null,
        isCancelled: false,
        attendance: 'unmarked',
      };
      await this.store.saveSession(row, row);
      this.form.markAsPristine();
      this.formOpen.set(false);
    } catch (error) {
      this.error.set(asApplicationError(error));
    }
  }
  protected cancelForm(): void {
    if (this.changes.confirm()) {
      this.formOpen.set(false);
      this.replacement.set(null);
      this.form.markAsPristine();
      this.replacementForm.markAsPristine();
      this.preview.set(null);
      this.error.set(null);
    }
  }
  private input() {
    const value = this.form.getRawValue();
    return templateInput({
      ...value,
      validFrom: this.editing() ? value.effectiveOn : value.validFrom,
      location: value.location || null,
    });
  }
  protected prepare(): void {
    this.form.markAllAsTouched();
    this.error.set(null);
    try {
      if (this.form.invalid)
        throw new ApplicationError('validation', 'Ispuni kolegij, razdoblje i vrijeme nastave.');
      const input = this.input(),
        semester = this.store.academic.selectedSemester();
      if (!semester || input.validFrom < semester.startsOn || input.validUntil > semester.endsOn)
        throw new ApplicationError('validation', 'Razdoblje mora biti unutar semestra.');
      this.preview.set(
        occurrences(
          [{ ...input, id: this.createId, revision: 1, updatedAt: null }],
          [],
          input.validFrom,
          input.validUntil,
        ),
      );
    } catch (error) {
      this.error.set(asApplicationError(error));
    }
  }
  protected async save(): Promise<void> {
    if (!this.preview()) return;
    try {
      await this.store.saveTemplate(
        this.createId,
        this.input(),
        this.editing(),
        this.editing() ? this.form.controls.effectiveOn.value : undefined,
      );
      this.form.markAsPristine();
      this.formOpen.set(false);
      this.preview.set(null);
    } catch (error) {
      this.error.set(asApplicationError(error));
    }
  }
  protected async openReplacement(row: Occurrence): Promise<void> {
    if (!this.changes.confirm()) return;
    try {
      if (row.revision === null) await this.store.saveSession(row, row);
      this.createId = crypto.randomUUID();
      this.formOpen.set(false);
      this.replacement.set(row);
      this.replacementForm.reset({
        scheduledOn: row.scheduledOn,
        startsAt: row.startsAt,
        endsAt: row.endsAt,
        location: row.location ?? '',
      });
      this.error.set(null);
    } catch (error) {
      this.error.set(asApplicationError(error));
    }
  }
  protected async saveReplacement(): Promise<void> {
    const source = this.replacement();
    if (!source) return;
    try {
      const v = this.replacementForm.getRawValue();
      const row: Occurrence = {
        ...source,
        ...v,
        location: v.location || null,
        id: this.createId,
        revision: null,
        templateId: null,
        isCancelled: false,
        attendance: 'unmarked',
        replacementForId: source.id,
      };
      await this.store.saveSession(row, row);
      this.replacementForm.markAsPristine();
      this.replacement.set(null);
    } catch (error) {
      this.error.set(asApplicationError(error));
    }
  }
}
