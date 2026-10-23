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
    <div class="overview-heading">
      <div>
        <p class="eyebrow">{{ today }}</p>
        <h1>Tvoj dan u Kolegiumu</h1>
        <p class="intro">Nastava, zadaci i rokovi na jednom mjestu.</p>
      </div>
      <a class="text-link" routerLink="/schedule"
        >Otvori raspored <span aria-hidden="true">→</span></a
      >
    </div>
    <section class="panel">
      <h2>Podsjetnici za tvoje obaveze</h2>
      <p>
        Zadaci, projekti, rate, predavanja/vježbe i kolokviji/ispiti — pregled na jednom mjestu i
        besplatni izvoz u kalendar mobitela.
      </p>
      <a class="button-link" routerLink="/reminders">Otvori podsjetnike i preuzimanje za mobitel</a>
    </section>
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
      <section class="panel overview-section" aria-labelledby="classes-title">
        <div class="section-heading">
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
            <h3>Dan još nema raspored</h3>
            <p>Ovdje će biti nastava iz tvog tjednog rasporeda.</p>
          </div>
        }
      </section>
      <section class="panel overview-section" aria-labelledby="tasks-title">
        <div class="section-heading">
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
    <section class="panel" aria-labelledby="installment-reminders-title">
      <h2 id="installment-reminders-title">Podsjetnici za rate</h2>
      <p>Neplaćene rate prikazuju se 30 dana prije roka, uz upozorenje u zadnjih 7 dana.</p>
      <a class="text-link" routerLink="/installments">Otvori rate fakulteta</a>
      @if (planning.loading()) {
        <p role="status">Učitavam podsjetnike…</p>
      }
      @if (planning.error()) {
        <p role="alert">Podsjetnici nisu osvježeni. {{ planning.error()?.message }}</p>
        <button (click)="planning.refresh()">Osvježi podsjetnike</button>
      }
      @if (!planning.academic.online()) {
        <p>Nema internetske veze — prikazani podsjetnici su zadnje učitani podaci.</p>
      }
      @for (row of planning.installmentReminders(); track row.id) {
        <article [attr.aria-label]="row.name">
          <h3>{{ row.name }}</h3>
          <p>{{ row.message }} Rok: {{ row.dueOn }} · {{ money(row.amountCents) }}</p>
        </article>
      } @empty {
        @if (!planning.loading() && !planning.error() && planning.academic.online()) {
          <p>Nema neplaćenih rata s rokom u idućih 30 dana u učitanom prikazu.</p>
        }
      }
      @if (planning.more()) {
        <p>Pregled ima dodatne stranice. Učitaj ih za potpuni prikaz podsjetnika.</p>
        <button (click)="planning.count.update(increase)" [disabled]="planning.loading()">
          Učitaj još podsjetnika
        </button>
      }
    </section>
    <section class="panel">
      <h2>Otvoreni zadaci</h2>
      <a class="text-link" routerLink="/todo">Otvori To-do</a>
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
  styleUrl: './overview.component.scss',
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
  protected money(cents: number) {
    return new Intl.NumberFormat('hr-HR', { style: 'currency', currency: 'EUR' }).format(
      cents / 100,
    );
  }
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
