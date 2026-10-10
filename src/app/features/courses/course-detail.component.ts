import { CourseGradingComponent } from '../grading/course-grading.component';
import { Component, DestroyRef, effect, inject, signal, untracked } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { AcademicStoreService } from '../../core/academic/academic-store.service';
import { UnsavedChangesService } from '../../core/forms/unsaved-changes.service';
import { ApplicationError, asApplicationError } from '../../core/errors/application-error';
import { Course, CourseLink, Semester } from '../../domain/academic.models';
import { courseInput } from '../../domain/academic.validation';
import { CourseWorkComponent } from './course-work.component';

@Component({
  selector: 'app-course-detail',
  imports: [CourseGradingComponent, ReactiveFormsModule, RouterLink, CourseWorkComponent],
  templateUrl: './course-detail.component.html',
  styleUrl: './courses.component.scss',
})
export class CourseDetailComponent {
  protected readonly store = inject(AcademicStoreService);
  private readonly fb = inject(FormBuilder);
  private readonly changes = inject(UnsavedChangesService);
  private readonly parameters = toSignal(inject(ActivatedRoute).paramMap);
  protected readonly course = signal<Course | null>(null);
  protected readonly semester = signal<Semester | null>(null);
  protected readonly editing = signal(false);
  protected readonly loading = signal(false);
  protected readonly error = signal<ApplicationError | null>(null);
  protected readonly success = signal<string | null>(null);
  protected readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.maxLength(200)]],
    information: ['', Validators.maxLength(10000)],
    links: this.fb.array<ReturnType<CourseDetailComponent['linkGroup']>>([]),
  });
  private loadedId: string | null = null;
  private request = 0;
  private pendingDraft = this.changes.takeDraft<{
    row: Course;
    values: { name: string; information: string; links: CourseLink[] };
  }>('course-detail');
  constructor() {
    const destroy = inject(DestroyRef);
    destroy.onDestroy(this.changes.register(() => this.form.dirty));
    destroy.onDestroy(() => this.request++);
    destroy.onDestroy(() => {
      if (this.form.dirty && this.course())
        this.changes.keepDraft('course-detail', {
          row: this.course(),
          values: this.form.getRawValue(),
        });
    });
    effect(() => {
      const id = this.parameters()?.get('id');
      const ready = this.store.ready();
      untracked(() => {
        if (ready && id && this.loadedId !== id) {
          this.loadedId = id;
          void this.load();
        }
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
  protected async load(): Promise<void> {
    const id = this.loadedId;
    if (!id) return;
    const request = ++this.request;
    this.loading.set(true);
    try {
      const course = await this.store.getCourse(id),
        semester = await this.store.getSemester(course.semesterId);
      if (request !== this.request) return;
      this.course.set(course);
      this.semester.set(semester);
      this.error.set(null);
      this.populate(course);
      const draft = this.pendingDraft;
      this.pendingDraft = undefined;
      if (draft?.row.id === id) {
        this.course.set(draft.row);
        this.form.reset({ name: draft.values.name, information: draft.values.information });
        this.form.controls.links.clear();
        for (const link of draft.values.links)
          this.form.controls.links.push(this.linkGroup(link.label, link.url));
        this.form.markAsDirty();
        this.editing.set(true);
        if (course.revision !== draft.row.revision)
          this.error.set(
            new ApplicationError(
              'conflict',
              'Zapis je promijenjen tijekom ponovne prijave. Lokalni unos je sačuvan.',
              course,
            ),
          );
      }
    } catch (error) {
      if (request === this.request) this.error.set(asApplicationError(error));
    } finally {
      if (request === this.request) this.loading.set(false);
    }
  }
  private populate(course: Course): void {
    this.form.reset({ name: course.name, information: course.information });
    this.form.controls.links.clear();
    for (const link of course.links)
      this.form.controls.links.push(this.linkGroup(link.label, link.url));
    this.form.markAsPristine();
  }
  protected startEditing(): void {
    this.editing.set(true);
    this.success.set(null);
  }
  protected cancel(): void {
    if (this.changes.confirm()) {
      this.populate(this.course()!);
      this.editing.set(false);
      this.error.set(null);
    }
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
  protected async submit(): Promise<void> {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.error.set(new ApplicationError('validation', 'Ispuni naziv i sve dodane poveznice.'));
      return;
    }
    const course = this.course();
    if (!course) return;
    this.error.set(null);
    this.success.set(null);
    try {
      await this.store.saveCourse(
        course.id,
        { ...courseInput(course), ...this.form.getRawValue() },
        course.revision,
      );
      this.form.markAsPristine();
      this.editing.set(false);
      await this.load();
      this.success.set('Kolegij je spremljen i potvrđen na poslužitelju.');
    } catch (error) {
      this.error.set(asApplicationError(error));
    }
  }
  protected async archive(): Promise<void> {
    const course = this.course();
    if (
      !course ||
      !this.changes.confirm() ||
      !window.confirm(
        course.isArchived
          ? 'Vrati kolegij iz arhive? Sve veze ostaju sačuvane.'
          : 'Arhiviraj kolegij? Podaci i povezane obaveze ostaju sačuvani.',
      )
    )
      return;
    try {
      await this.store.saveCourse(
        course.id,
        { ...courseInput(course), isArchived: !course.isArchived },
        course.revision,
      );
      this.form.markAsPristine();
      this.editing.set(false);
      await this.load();
      this.success.set('Stanje arhive je spremljeno.');
    } catch (error) {
      this.error.set(asApplicationError(error));
    }
  }
  protected async replaceWithServer(): Promise<void> {
    if (!window.confirm('Odbaci lokalni unos i učitaj novu verziju kolegija?')) return;
    this.form.markAsPristine();
    await this.load();
  }
  protected serverDescription(): string {
    const value = this.error()?.serverRecord;
    return value &&
      typeof value === 'object' &&
      'name' in value &&
      'information' in value &&
      typeof value.name === 'string' &&
      typeof value.information === 'string'
      ? `${value.name}\n${value.information}`
      : 'Za usporedbu učitaj novu verziju zapisa.';
  }
}
