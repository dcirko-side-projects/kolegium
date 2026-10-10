import { Component, effect, inject, untracked } from '@angular/core';
import { ScheduleStoreService } from '../../core/academic/schedule-store.service';
import { SessionRowComponent } from '../../shared/ui/session-row/session-row.component';
import { UnsavedChangesService } from '../../core/forms/unsaved-changes.service';
import { PlanningStoreService } from '../../core/academic/planning-store.service';
import { addDays } from '../../domain/schedule';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-overview',
  imports: [RouterLink, SessionRowComponent],
  providers: [ScheduleStoreService, PlanningStoreService],
  template: `
    <p class="eyebrow">{{ today }}</p>
    <h1>Tvoj fakultet.<br /><span>Na jednom mjestu.</span></h1>
    <p class="intro">Nastava, zadaci i rokovi — pregled koji prati tvoj dan.</p>
    @if (store.courses().length === 0) {
      <section class="hero" aria-labelledby="start-title">
        <div>
          <span class="label">DOBRO DOŠAO U KOLEGIUM</span>
          <h2 id="start-title">Prostor za lakši studentski dan</h2>
          <p>Dodaj semestar i kolegije kako bi informacije ostale na jednom mjestu.</p>
        </div>
        <a class="button-link" routerLink="/sections"
          >Istraži sve sekcije <span aria-hidden="true">→</span></a
        >
      </section>
    }
    <div class="cards">
      <section class="card" aria-labelledby="classes-title">
        <div class="card-heading">
          <h2 id="classes-title">Današnja nastava</h2>
          <a routerLink="/schedule">Raspored</a>
        </div>
        @if (store.loading()) {
          <p role="status">Učitavam današnju nastavu…</p>
        }
        @if (store.error()) {
          <p role="alert">{{ store.error()?.message }}</p>
          <button (click)="store.refresh()">Osvježi nastavu</button>
        }
        @if (store.success()) {
          <p role="status">{{ store.success() }}</p>
        }
        @for (row of store.rows(); track row.id) {
          <app-session-row [row]="row" [name]="courseName(row.courseId)" />
        } @empty {
          <div class="empty">
            <span aria-hidden="true">◷</span>
            <h3>Dan još nema raspored</h3>
            <p>Ovdje će biti nastava iz tvog tjednog rasporeda.</p>
          </div>
        }
      </section>
      <section class="card" aria-labelledby="tasks-title">
        <div class="card-heading">
          <h2 id="tasks-title">Nadolazeće obaveze</h2>
          <a routerLink="/todo">To-do</a>
        </div>
        <p>Sve zakašnjele obaveze i sljedećih 14 dana, do {{ until() }}.</p>
        @if (planning.loading()) {
          <p role="status">Učitavam obaveze…</p>
        }
        @if (planning.error()) {
          <p role="alert">{{ planning.error()?.message }}</p>
          <button (click)="planning.refresh()">Osvježi obaveze</button>
        }
        @for (item of planning.deadlines(); track item.id) {
          <article [attr.aria-label]="item.name">
            <h3>
              <a [routerLink]="item.route">{{ item.name }}</a>
            </h3>
            <p>
              {{ item.kind }} · {{ item.date }} ·
              {{ item.date < planning.today() ? 'Zakašnjelo' : 'Nadolazeće' }}
            </p>
          </article>
        } @empty {
          @if (!planning.loading() && !planning.error()) {
            <p>Nema rokova u ovom rasponu.</p>
          }
        }
        @if (planning.more()) {
          <button (click)="planning.count.update(increase)" [disabled]="planning.loading()">
            Učitaj još obaveza
          </button>
        }
      </section>
    </div>
    <section class="panel">
      <h2>Otvoreni zadaci</h2>
      <a routerLink="/todo">Otvori To-do</a>
      @for (task of planning.tasks(); track task.id) {
        <article [attr.aria-label]="task.title">
          <h3>
            <a routerLink="/todo">{{ task.title }}</a>
          </h3>
          <p>Rok: {{ task.dueOn ?? 'nije zadan' }}</p>
        </article>
      } @empty {
        @if (!planning.loading() && !planning.error()) {
          <p>Nema otvorenih zadataka.</p>
        }
      }
    </section>
  `,
  styles: `
    .eyebrow {
      color: var(--color-text-muted);
      text-transform: capitalize;
      font-size: 14px;
      margin: 0 0 16px;
    }
    h1 {
      line-height: 1.12;
      margin: 0;
      letter-spacing: -1.5px;
    }
    h1 span {
      color: var(--color-primary);
    }
    .intro {
      color: var(--color-text-muted);
      margin: 16px 0 32px;
    }
    .hero {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 24px;
      background: var(--color-ice);
      border-radius: 16px;
      padding: 32px;
      margin-bottom: 32px;
    }
    .label {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 1px;
      color: var(--color-primary);
    }
    .hero h2 {
      margin: 12px 0;
      font-size: 22px;
    }
    .hero p {
      color: var(--color-text-muted);
      max-width: 480px;
      margin: 0;
      line-height: 1.6;
    }
    .button-link {
      white-space: nowrap;
    }
    .cards {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 24px;
    }
    .card {
      border: 1px solid var(--color-border);
      border-radius: 16px;
      background: var(--color-surface);
      padding: 24px;
    }
    .card-heading {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
    }
    .card h2 {
      font-size: 17px;
      margin: 0;
    }
    .card a {
      font-size: 13px;
      display: inline-flex;
      align-items: center;
      min-height: 44px;
    }
    .empty {
      text-align: center;
      padding: 40px 8px 24px;
    }
    .empty > span {
      font-size: 30px;
      color: var(--color-primary);
      background: var(--color-background);
      display: inline-grid;
      place-items: center;
      width: 56px;
      height: 56px;
      border-radius: 16px;
    }
    .empty h3 {
      font-size: 15px;
      margin: 20px 0 8px;
    }
    .empty p {
      color: var(--color-text-muted);
      font-size: 14px;
      line-height: 1.6;
      margin: 0;
    }
    .footnote {
      color: var(--color-text-muted);
      font-size: 12px;
      margin-top: 24px;
    }
    @media (max-width: 1000px) {
      .hero {
        flex-direction: column;
        align-items: flex-start;
      }
    }
    @media (max-width: 767px) {
      .hero {
        padding: 24px;
      }
      .cards {
        grid-template-columns: 1fr;
      }
      h1 {
        letter-spacing: -1px;
      }
    }
  `,
})
export class OverviewComponent {
  private readonly changes = inject(UnsavedChangesService);
  canLeave(): boolean {
    return this.changes.canLeave();
  }
  protected readonly store = inject(ScheduleStoreService);
  protected readonly planning = inject(PlanningStoreService);
  protected until() {
    return addDays(this.planning.today(), 14);
  }
  protected readonly increase = (n: number) => n + 50;
  constructor() {
    this.planning.kind.set('overview');
    effect(() => {
      const today = this.store.today();
      untracked(() => {
        this.store.from.set(today);
        this.store.until.set(today);
      });
    });
  }
  protected courseName(id: string): string {
    return this.store.courses().find((c) => c.id === id)?.name ?? 'Kolegij';
  }
  protected get today() {
    return new Intl.DateTimeFormat('hr-HR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      timeZone: 'Europe/Zagreb',
    }).format(new Date(this.store.today() + 'T12:00:00Z'));
  }
}
