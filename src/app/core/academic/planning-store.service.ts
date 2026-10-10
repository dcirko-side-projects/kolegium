import { DestroyRef, Injectable, effect, inject, signal, untracked } from '@angular/core';
import { AcademicStoreService } from './academic-store.service';
import { FirebaseContextService } from '../../data/firebase-context.service';
import { PlanningRepository } from '../../data/planning.repository';
import { WorkRepository } from '../../data/work.repository';
import { ApplicationError, asApplicationError } from '../errors/application-error';
import { Deadline, Installment } from '../../domain/planning.models';
import { addDays, localNow } from '../../domain/schedule';
@Injectable()
export class PlanningStoreService {
  readonly academic = inject(AcademicStoreService);
  private readonly context = inject(FirebaseContextService);
  readonly kind = signal<'installments' | 'overview' | 'grading'>('installments');
  readonly count = signal(50);
  readonly rows = signal<Installment[]>([]);
  readonly deadlines = signal<Deadline[]>([]);
  readonly tasks = signal<import('../../domain/work.models').Task[]>([]);
  readonly more = signal(false);
  readonly loading = signal(false);
  readonly error = signal<ApplicationError | null>(null);
  readonly success = signal<string | null>(null);
  readonly today = signal(localNow().date);
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
      this.count();
      this.today();
      untracked(() => {
        if (scope && ready && online && this.kind() !== 'grading') void this.refresh();
        else if (!scope) {
          this.request++;
          this.rows.set([]);
          this.deadlines.set([]);
          this.tasks.set([]);
          this.loading.set(false);
        }
      });
    });
  }
  async refresh() {
    if (this.kind() === 'grading') return;
    const scope = this.academic.scope();
    if (!scope || !this.academic.ready() || !this.academic.online()) return;
    const request = ++this.request;
    this.loading.set(true);
    try {
      if (this.kind() === 'overview') {
        const data = await this.repository().overview(
          scope,
          addDays(this.today(), 14),
          this.count(),
        );
        if (request !== this.request) return;
        this.deadlines.set(data.deadlines);
        this.tasks.set(data.tasks);
        this.more.set(data.more);
      } else {
        const data = await this.repository().installments(scope, this.count());
        if (request !== this.request) return;
        this.rows.set(data.rows);
        this.more.set(data.more);
      }
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
