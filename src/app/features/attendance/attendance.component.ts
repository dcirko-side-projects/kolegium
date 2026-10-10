import { Component, DestroyRef, computed, effect, inject, signal, untracked } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ScheduleStoreService } from '../../core/academic/schedule-store.service';
import { UnsavedChangesService } from '../../core/forms/unsaved-changes.service';
import { ApplicationError, asApplicationError } from '../../core/errors/application-error';
import { Course } from '../../domain/academic.models';
import { attendanceRule } from '../../domain/academic.validation';
import { attendanceSummary } from '../../domain/schedule';
import { TeachingKind } from '../../domain/schedule.models';
import { SessionRowComponent } from '../../shared/ui/session-row/session-row.component';

@Component({
  selector: 'app-attendance',
  imports: [ReactiveFormsModule, RouterLink, SessionRowComponent],
  providers: [ScheduleStoreService],
  templateUrl: './attendance.component.html',
})
export class AttendanceComponent {
  protected readonly store = inject(ScheduleStoreService);
  private readonly changes = inject(UnsavedChangesService);
  private readonly fb = inject(FormBuilder);
  protected readonly course = computed(
    () => this.store.courses().find((c) => c.id === this.store.courseId()) ?? null,
  );
  protected readonly kind = signal<'all' | TeachingKind>('all');
  protected readonly displayRows = computed(() =>
    this.store
      .rows()
      .filter(
        (r) =>
          r.scheduledOn <= this.store.today() && (this.kind() === 'all' || r.kind === this.kind()),
      )
      .reverse(),
  );
  protected readonly shown = signal(50);
  protected readonly editing = signal<Course | null>(null);
  protected readonly error = signal<ApplicationError | null>(null);
  protected readonly form = this.fb.nonNullable.group({
    lectureTotal: [''],
    lectureMinimum: [''],
    exerciseTotal: [''],
    exerciseMinimum: [''],
  });
  protected readonly kinds: TeachingKind[] = ['lecture', 'exercise'];
  constructor() {
    this.store.fullCourseHistory.set(true);
    const destroy = inject(DestroyRef);
    destroy.onDestroy(this.changes.register(() => this.form.dirty));
    const draft = this.changes.takeDraft<{
      course: Course;
      values: ReturnType<AttendanceComponent['form']['getRawValue']>;
    }>('attendance-rules');
    if (draft) {
      this.editing.set(draft.course);
      this.store.courseId.set(draft.course.id);
      this.form.reset(draft.values);
      this.form.markAsDirty();
    }
    destroy.onDestroy(() => {
      if (this.form.dirty && this.editing())
        this.changes.keepDraft('attendance-rules', {
          course: this.editing(),
          values: this.form.getRawValue(),
        });
    });
    effect(() => {
      const semester = this.store.academic.selectedSemester(),
        courses = this.store.courses(),
        id = this.store.courseId();
      untracked(() => {
        if (semester) {
          this.store.from.set(semester.startsOn);
          this.store.until.set(semester.endsOn);
        }
        if (!id && courses.length) this.store.courseId.set(courses[0].id);
      });
    });
  }
  canLeave(): boolean {
    const yes = this.changes.canLeave();
    if (yes) this.form.markAsPristine();
    return yes;
  }
  protected select(select: HTMLSelectElement): void {
    if (!this.changes.confirm()) {
      select.value = this.store.courseId() ?? '';
      return;
    }
    this.store.courseId.set(select.value || null);
    this.editing.set(null);
    this.form.markAsPristine();
    this.error.set(null);
    this.shown.set(50);
  }
  protected summary(kind: TeachingKind) {
    return attendanceSummary(
      this.store.rows(),
      kind,
      this.course()!.attendanceRules[kind],
      this.store.now(),
    );
  }
  protected editRules(): void {
    const c = this.course();
    if (!c || !this.changes.confirm()) return;
    this.editing.set(c);
    this.form.reset({
      lectureTotal: c.attendanceRules.lecture.total?.toString() ?? '',
      lectureMinimum: c.attendanceRules.lecture.minimum?.toString() ?? '',
      exerciseTotal: c.attendanceRules.exercise.total?.toString() ?? '',
      exerciseMinimum: c.attendanceRules.exercise.minimum?.toString() ?? '',
    });
    this.error.set(null);
  }
  protected cancel(): void {
    if (this.changes.confirm()) {
      this.editing.set(null);
      this.form.markAsPristine();
      this.error.set(null);
    }
  }
  private count(text: string): number | null {
    if (text.trim() === '') return null;
    if (!/^\d+$/.test(text.trim()) || !Number.isSafeInteger(Number(text)))
      throw new ApplicationError(
        'validation',
        'Broj dolazaka mora biti nenegativan cijeli broj ili prazno ako nije poznat.',
      );
    return Number(text);
  }
  protected async save(): Promise<void> {
    const c = this.editing();
    if (!c) return;
    try {
      const v = this.form.getRawValue();
      await this.store.saveRules(c, {
        lecture: attendanceRule({
          total: this.count(v.lectureTotal),
          minimum: this.count(v.lectureMinimum),
        }),
        exercise: attendanceRule({
          total: this.count(v.exerciseTotal),
          minimum: this.count(v.exerciseMinimum),
        }),
      });
      this.form.markAsPristine();
      this.editing.set(null);
      this.error.set(null);
    } catch (error) {
      this.error.set(asApplicationError(error));
    }
  }
  protected serverRules(): string {
    const c = this.course();
    return c
      ? `Predavanja: ${c.attendanceRules.lecture.total ?? 'nepoznato'} / minimum ${c.attendanceRules.lecture.minimum ?? 'nepoznato'}; vježbe: ${c.attendanceRules.exercise.total ?? 'nepoznato'} / minimum ${c.attendanceRules.exercise.minimum ?? 'nepoznato'}.`
      : '';
  }
  protected async replaceRules(): Promise<void> {
    if (!window.confirm('Odbaci lokalni unos uvjeta i učitaj aktualnu verziju?')) return;
    await this.store.academic.refresh();
    await this.store.refresh();
    this.form.markAsPristine();
    this.editRules();
  }
}
