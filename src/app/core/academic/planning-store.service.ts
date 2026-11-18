import { DestroyRef, Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import { AcademicStoreService } from './academic-store.service';
import { FirestoreContextService } from '../../data/firestore-context.service';
import {
  PlanningRepository,
  OverviewCursor,
  InstallmentCursor,
} from '../../data/planning.repository';
import { WorkRepository } from '../../data/work.repository';
import { ApplicationError, asApplicationError } from '../errors/application-error';
import { Deadline, Installment } from '../../domain/planning.models';
import { addDays, localNow } from '../../domain/schedule';
import { installmentReminder } from '../../domain/installment-reminders';
@Injectable()
export class PlanningStoreService {
  readonly academic = inject(AcademicStoreService);
  private readonly context = inject(FirestoreContextService);
  readonly kind = signal<'installments' | 'overview' | 'grading'>('installments');
  readonly recordId = signal<string | null>(null);
  private overviewCursor?: OverviewCursor;
  private installmentCursor?: InstallmentCursor;
  private pageKey = '';
  readonly count = signal(50);
  readonly daysAhead = signal(14);
  readonly installmentDaysAhead = signal(30);
  readonly rows = signal<Installment[]>([]);
  readonly deadlines = signal<Deadline[]>([]);
  readonly tasks = signal<import('../../domain/work.models').Task[]>([]);
  readonly more = signal(false);
  readonly loading = signal(false);
  readonly dataRevision = signal<number | null>(null);
  readonly loadedDatasetId = signal<string | null>(null);
  readonly error = signal<ApplicationError | null>(null);
  readonly success = signal<string | null>(null);
  readonly today = signal(localNow().date);
  private readonly reminderRows = signal<Installment[]>([]);
  readonly installmentReminders = computed(() =>
    this.reminderRows().flatMap((row) => {
      const message = installmentReminder(row, this.today());
      return message ? [{ ...row, message }] : [];
    }),
  );
  private request = 0;
  repository() {
    return new PlanningRepository(this.context.firestore, () => this.academic.online());
  }
  work() {
    return new WorkRepository(this.context.firestore, () => this.academic.online());
  }
  constructor() {
    const destroy = inject(DestroyRef),
      timer = setInterval(() => this.today.set(localNow().date), 60000);
    destroy.onDestroy(() => {
      clearInterval(timer);
      this.request++;
    });
    effect(() => {
      const scope = this.academic.scope(),
        ready = this.academic.ready(),
        online = this.academic.online();
      this.academic.control();
      this.kind();
      this.recordId();
      this.today();
      this.daysAhead();
      this.installmentDaysAhead();
      untracked(() => {
        if (scope && ready && online && this.kind() !== 'grading') void this.refresh();
        else if (!scope) {
          this.request++;
          this.rows.set([]);
          this.deadlines.set([]);
          this.tasks.set([]);
          this.overviewCursor = undefined;
          this.installmentCursor = undefined;
          this.pageKey = '';
          this.reminderRows.set([]);
          this.loading.set(false);
        }
      });
    });
  }
  loadMore() {
    if (this.loading() || !this.more()) return;
    this.count.update((n) => n + 50);
    void this.refresh(true);
  }
  async refresh(next = false) {
    if (this.kind() === 'grading') return;
    const scope = this.academic.scope();
    if (!scope || !this.academic.ready() || !this.academic.online()) return;
    const request = ++this.request;
    this.loading.set(true);
    try {
      const key = JSON.stringify([
        scope,
        this.kind(),
        this.today(),
        this.daysAhead(),
        this.installmentDaysAhead(),
        this.academic.control()?.dataRevision,
        this.recordId(),
      ]);
      const append = next && this.pageKey === key;
      if (this.kind() === 'overview') {
        const data = await this.repository().overview(
          scope,
          addDays(this.today(), this.daysAhead()),
          this.count(),
          addDays(this.today(), this.installmentDaysAhead()),
          append ? this.overviewCursor : undefined,
        );
        if (request !== this.request) return;
        this.overviewCursor = data.cursor;
        this.deadlines.set(
          data.append
            ? [...this.deadlines(), ...data.deadlines].sort(
                (a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id),
              )
            : data.deadlines,
        );
        this.dataRevision.set(data.dataRevision);
        this.loadedDatasetId.set(scope.datasetId);
        this.tasks.set(data.append ? [...this.tasks(), ...data.tasks] : data.tasks);
        this.reminderRows.set(
          data.append
            ? [...this.reminderRows(), ...data.installmentReminders]
            : data.installmentReminders,
        );
        this.more.set(data.more);
      } else if (this.recordId()) {
        const row = (await this.repository().get(
          scope,
          'installments',
          this.recordId()!,
        )) as Installment | null;
        if (request !== this.request) return;
        this.rows.set(row ? [row] : []);
        this.more.set(false);
      } else {
        const data = await this.repository().installments(
          scope,
          this.count(),
          append ? this.installmentCursor : undefined,
        );
        if (request !== this.request) return;
        this.installmentCursor = data.cursor;
        this.rows.set(data.append ? [...this.rows(), ...data.rows] : data.rows);
        this.more.set(data.more);
      }
      this.pageKey = key;
      this.error.set(null);
    } catch (e) {
      if (request === this.request) this.error.set(asApplicationError(e));
    } finally {
      if (request === this.request) this.loading.set(false);
    }
  }
  canWrite() {
    return this.academic.canWrite() && !this.loading() && !this.error();
  }
  async write(action: () => Promise<void>) {
    if (!this.canWrite())
      throw new ApplicationError('unavailable', 'Najprije osvježi podatke i provjeri vezu.');
    this.success.set(null);
    await this.academic.externalMutation(action);
    this.success.set('Izmjena je spremljena i potvrđena na poslužitelju.');
    await this.refresh();
  }
}
