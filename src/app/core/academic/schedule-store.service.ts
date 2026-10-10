import { DestroyRef, Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { AcademicStoreService } from './academic-store.service';
import { FirebaseContextService } from '../../data/firebase-context.service';
import { ScheduleRepository } from '../../data/schedule.repository';
import { AcademicRepository } from '../../data/academic.repository';
import {
  Attendance,
  Occurrence,
  ScheduleTemplate,
  TemplateInput,
  SessionInput,
} from '../../domain/schedule.models';
import { localNow, occurrences } from '../../domain/schedule';
import { ApplicationError, asApplicationError } from '../errors/application-error';
import { Course } from '../../domain/academic.models';

@Injectable()
export class ScheduleStoreService {
  readonly academic = inject(AcademicStoreService);
  private readonly context = inject(FirebaseContextService);
  private request = 0;
  readonly from = signal(localNow().date);
  readonly now = signal(localNow());
  readonly today = computed(() => this.now().date);
  readonly until = signal(localNow().date);
  readonly courseId = signal<string | null>(null);
  readonly fullCourseHistory = signal(false);
  readonly rows = signal<Occurrence[]>([]);
  readonly templates = signal<ScheduleTemplate[]>([]);
  readonly loading = signal(false);
  readonly busy = signal(false);
  readonly error = signal<ApplicationError | null>(null);
  readonly success = signal<string | null>(null);
  readonly archiveEditing = signal(false);
  readonly courses = computed(() => this.academic.courses());
  readonly hasArchive = computed(
    () =>
      !!this.academic.selectedSemester()?.isArchived || this.courses().some((c) => c.isArchived),
  );
  readonly canWrite = computed(
    () => this.academic.canWrite() && !this.loading() && !this.busy() && !this.error(),
  );
  constructor() {
    const clock = setInterval(() => this.now.set(localNow()), 60000);
    inject(DestroyRef).onDestroy(() => {
      this.request++;
      clearInterval(clock);
    });
    effect(() => {
      const scope = this.academic.scope(),
        ready = this.academic.ready(),
        online = this.academic.online();
      this.academic.control();
      this.courses();
      this.from();
      this.until();
      this.courseId();
      this.fullCourseHistory();
      untracked(() => {
        if (scope && ready && online) void this.refresh();
        else {
          this.request++;
          this.rows.set([]);
          this.templates.set([]);
          this.loading.set(false);
        }
      });
    });
  }
  async refresh(): Promise<void> {
    const scope = this.academic.scope();
    if (!scope || !this.academic.ready() || !this.academic.online()) return;
    const request = ++this.request,
      from = this.from(),
      until = this.until();
    this.loading.set(true);
    try {
      const academic = new AcademicRepository(this.context.firestore, () => this.academic.online());
      const control = await academic.readControl(scope.uid);
      const courses = this.courses().filter((c) => !this.courseId() || c.id === this.courseId());
      const repo = new ScheduleRepository(this.context.firestore, () => this.academic.online());
      const data = await Promise.all(
        courses.map((c) => repo.window(scope, c.id, from, until, this.fullCourseHistory())),
      );
      const after = await academic.readControl(scope.uid);
      if (request !== this.request) return;
      if (
        after.dataRevision !== control.dataRevision ||
        after.activeDatasetId !== scope.datasetId
      ) {
        void this.refresh();
        return;
      }
      const templates = data.flatMap((d) => d.templates);
      this.templates.set(templates);
      this.rows.set(
        occurrences(
          templates,
          data.flatMap((d) => d.sessions),
          from,
          until,
          this.fullCourseHistory(),
        ),
      );
      this.error.set(null);
    } catch (error) {
      if (request === this.request) this.error.set(asApplicationError(error));
    } finally {
      if (request === this.request) this.loading.set(false);
    }
  }
  canEditCourse(id: string): boolean {
    const course = this.courses().find((c) => c.id === id);
    return (
      this.canWrite() &&
      !!course &&
      (!(course.isArchived || this.academic.selectedSemester()?.isArchived) ||
        this.archiveEditing())
    );
  }
  private courseAllowed(id: string): void {
    const course = this.courses().find((c) => c.id === id);
    if (!course) throw new ApplicationError('notFound', 'Kolegij nije u učitanom semestru.');
    if (
      (course.isArchived || this.academic.selectedSemester()?.isArchived) &&
      !this.archiveEditing()
    )
      throw new ApplicationError('validation', 'Za korekciju arhive prvo odaberi Uredi arhivu.');
  }
  private async write(
    courseId: string,
    action: (repo: ScheduleRepository) => Promise<void>,
  ): Promise<void> {
    if (!this.canWrite())
      throw new ApplicationError('unavailable', 'Provjeri vezu i osvježi podatke prije izmjene.');
    this.courseAllowed(courseId);
    this.busy.set(true);
    this.success.set(null);
    try {
      await this.academic.externalMutation(() =>
        action(new ScheduleRepository(this.context.firestore, () => this.academic.online())),
      );
      await this.refresh();
      this.success.set('Izmjena je spremljena i potvrđena na poslužitelju.');
    } catch (error) {
      this.error.set(asApplicationError(error));
      throw asApplicationError(error);
    } finally {
      this.busy.set(false);
    }
  }
  saveTemplate(
    id: string,
    input: TemplateInput,
    old: ScheduleTemplate | null,
    effective?: string,
  ): Promise<void> {
    return this.write(input.courseId, (repo) =>
      repo.saveTemplate(this.academic.scope()!, id, input, old, effective),
    );
  }
  mark(row: Occurrence, attendance: Attendance): Promise<void> {
    if (row.scheduledOn > localNow().date)
      return Promise.reject(
        new ApplicationError('validation', 'Dolaznost se unosi za današnje i prošle termine.'),
      );
    return this.saveSession(row, { ...row, attendance });
  }
  saveSession(row: Occurrence, values: SessionInput): Promise<void> {
    return this.write(values.courseId, (repo) =>
      repo.saveSession(this.academic.scope()!, row, values),
    );
  }
  saveRules(course: Course, rules: Course['attendanceRules']): Promise<void> {
    return this.write(course.id, (repo) => repo.saveRules(this.academic.scope()!, course, rules));
  }
}
