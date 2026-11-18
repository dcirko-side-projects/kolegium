import { Component, DestroyRef, effect, inject, input, signal, untracked } from '@angular/core';
import { RouterLink } from '@angular/router';
import type { CourseResultsCursor } from '../../data/work.repository';
import { WorkStoreService } from '../../core/academic/work-store.service';
import { ApplicationError, asApplicationError } from '../../core/errors/application-error';
import { Assessment, Project, ResultSource, ScoreAttempt } from '../../domain/work.models';
@Component({
  selector: 'app-course-work',
  imports: [RouterLink],
  providers: [WorkStoreService],
  template: ` <section class="panel">
    <h2>Povezane obaveze i rezultati</h2>
    <div class="actions">
      <a routerLink="/assessments" [queryParams]="{ courseId: courseId() }"
        >Provjere ovog kolegija</a
      ><a routerLink="/projects" [queryParams]="{ courseId: courseId() }">Projekti ovog kolegija</a
      ><a routerLink="/todo" [queryParams]="{ courseId: courseId() }">Zadaci ovog kolegija</a>
    </div>
    <p>
      Rezultati dolaze iz istih pokušaja kao na provjeri ili projektu. Pravila i osobni izračun
      uređuju se u panelu Bodovanje i ocjena kolegija.
    </p>
    <button
      (click)="opened.set(true); refresh()"
      [disabled]="loading() || !store.academic.online()"
    >
      Prikaži / osvježi rezultate
    </button>
    @if (loading()) {
      <p role="status">Učitavam rezultate kolegija…</p>
    }
    @if (error()) {
      <p role="alert">{{ error()?.message }}</p>
    }
    @if (opened()) {
      @for (row of rows(); track row.source.id) {
        <article>
          <h3>
            <a
              [routerLink]="
                (row.type === 'assessment' ? '/assessments/' : '/projects/') + row.source.id
              "
              >{{ row.source.name }}</a
            >
          </h3>
          @for (attempt of row.attempts; track attempt.id) {
            <p>
              Pokušaj {{ attempt.attemptNumber }} · Bodovi: {{ attempt.points ?? 'nisu poznati' }} ·
              Ocjena: {{ attempt.grade ?? 'nije poznata' }}
            </p>
          } @empty {
            <p>Rezultat nije unesen.</p>
          }
        </article>
      } @empty {
        @if (!loading()) {
          <p>Nema povezanih provjera ili projekata.</p>
        }
      }
      @if (more()) {
        <button (click)="count.update(increase); refresh(true)" [disabled]="loading()">
          Učitaj još izvora rezultata
        </button>
      }
    }
  </section>`,
})
export class CourseWorkComponent {
  readonly courseId = input.required<string>();
  protected readonly store = inject(WorkStoreService);
  protected readonly opened = signal(false);
  protected readonly loading = signal(false);
  protected readonly error = signal<ApplicationError | null>(null);
  protected readonly rows = signal<
    { source: Assessment | Project; type: ResultSource; attempts: ScoreAttempt[] }[]
  >([]);
  protected readonly more = signal(false);
  protected readonly count = signal(50);
  protected readonly increase = (n: number) => n + 50;
  private cursor?: CourseResultsCursor;
  private request = 0;
  constructor() {
    this.store.kind.set('results');
    inject(DestroyRef).onDestroy(() => this.request++);
    effect(() => {
      const ready = this.store.academic.ready(),
        scope = this.store.academic.scope();
      this.store.academic.control();
      this.courseId();
      untracked(() => {
        if (ready && scope && this.opened()) void this.refresh();
        else if (!scope) {
          this.request++;
          this.rows.set([]);
        }
      });
    });
  }
  protected async refresh(next = false) {
    const scope = this.store.academic.scope();
    if (!scope || !this.store.academic.online()) return;
    const request = ++this.request;
    this.loading.set(true);
    try {
      const data = await this.store
        .repository()
        .courseResults(scope, this.courseId(), this.count(), next ? this.cursor : undefined);
      if (request !== this.request) return;
      this.cursor = data.cursor;
      this.rows.set(data.append ? [...this.rows(), ...data.rows] : data.rows);
      this.more.set(data.more);
      this.error.set(null);
    } catch (e) {
      if (request === this.request) this.error.set(asApplicationError(e));
    } finally {
      if (request === this.request) this.loading.set(false);
    }
  }
}
