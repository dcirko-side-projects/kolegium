import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PlanningStoreService } from '../../core/academic/planning-store.service';
import { ScheduleStoreService } from '../../core/academic/schedule-store.service';
import { addDays, localNow } from '../../domain/schedule';
import {
  isActiveReminder,
  Reminder,
  reminderCalendar,
  reminderItems,
  reminderMessage,
} from '../../domain/reminders';
import { asApplicationError } from '../../core/errors/application-error';

@Component({
  selector: 'app-reminders',
  imports: [RouterLink, ReactiveFormsModule],
  providers: [PlanningStoreService, ScheduleStoreService],
  templateUrl: './reminders.component.html',
  styles: `
    .reminder-heading {
      display: flex;
      gap: var(--space-3);
      align-items: center;
      flex-wrap: wrap;
    }
    .reminder-heading h2 {
      margin: 0;
      font-size: 1.125rem;
    }
    .reminder-meta {
      color: var(--color-text-muted);
    }
    .overdue {
      border-left: 3px solid var(--color-error);
    }
    .today {
      border-left: 3px solid var(--color-primary);
    }
    .reminder-status {
      font-weight: 700;
      color: var(--color-blue-dark);
    }
    .export-settings {
      display: flex;
      gap: var(--space-5);
      flex-wrap: wrap;
      align-items: end;
    }
    .export-settings .field {
      flex: 1 1 180px;
      margin: 0;
    }
    .export-settings button {
      flex: 0 1 auto;
    }
    summary {
      cursor: pointer;
      font-weight: 600;
      padding-block: var(--space-3);
    }
    li {
      margin-bottom: var(--space-2);
    }
  `,
})
export class RemindersComponent {
  protected readonly planning = inject(PlanningStoreService);
  protected readonly schedule = inject(ScheduleStoreService);
  protected readonly academic = this.planning.academic;
  protected readonly settings = inject(FormBuilder).nonNullable.group({
    days: '90',
    dailyTime: '09:00',
  });
  protected readonly days = signal(90);
  protected readonly increase = (n: number) => n + 50;
  protected readonly category = signal('all');
  protected readonly message = signal<string | null>(null);
  protected readonly error = signal<string | null>(null);
  protected readonly allItems = computed(() => {
    const names: Record<string, string> = {};
    if (!this.academic.selectedSemester()?.isArchived)
      for (const c of this.schedule.courses()) if (!c.isArchived) names[c.id] = c.name;
    return reminderItems(this.planning.deadlines(), this.schedule.rows(), names);
  });
  protected readonly activeItems = computed(() =>
    this.allItems().filter(
      (r) =>
        isActiveReminder(r, this.schedule.today()) &&
        (this.category() === 'all' || r.kind === this.category()),
    ),
  );
  protected readonly futureCount = computed(
    () => this.allItems().filter((r) => r.date >= this.schedule.today()).length,
  );
  protected readonly canExport = computed(
    () =>
      this.academic.canWrite() &&
      !this.planning.loading() &&
      !this.schedule.loading() &&
      !this.planning.error() &&
      !this.schedule.error() &&
      !this.planning.more() &&
      !this.academic.moreCourses() &&
      this.planning.dataRevision() === this.academic.control()?.dataRevision &&
      this.schedule.dataRevision() === this.planning.dataRevision() &&
      this.schedule.loadedDatasetId() === this.academic.scope()?.datasetId &&
      this.planning.loadedDatasetId() === this.academic.scope()?.datasetId,
  );
  constructor() {
    this.planning.kind.set('overview');
    effect(() => {
      const today = this.schedule.today(),
        days = this.days();
      untracked(() => {
        this.planning.daysAhead.set(days);
        this.planning.installmentDaysAhead.set(days);
        this.schedule.from.set(today);
        this.schedule.until.set(addDays(today, days));
      });
    });
  }
  protected applySettings(): void {
    this.days.set(Number(this.settings.controls.days.value));
    this.message.set(null);
    this.error.set(null);
  }
  protected description(row: Reminder): string {
    return reminderMessage(row, this.schedule.now());
  }
  protected async refresh(): Promise<void> {
    await Promise.all([this.schedule.refresh(), this.planning.refresh()]);
  }
  protected download(): void {
    if (!this.canExport()) return;
    this.error.set(null);
    this.message.set(null);
    try {
      const { text, count } = reminderCalendar(
        this.allItems(),
        this.academic.scope()!.datasetId,
        new Date(),
        this.settings.controls.dailyTime.value,
      );
      if (!count) {
        this.message.set('Nema budućih obaveza s datumom u odabranom rasponu.');
        return;
      }
      const url = URL.createObjectURL(new Blob([text], { type: 'text/calendar;charset=utf-8' }));
      const link = document.createElement('a');
      link.href = url;
      link.download = 'kolegium-podsjetnici-' + localNow().date + '.ics';
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60000);
      this.message.set(
        'Preuzeto ' +
          count +
          ' događaja. Uvezi datoteku u zaseban kalendar Kolegium i provjeri barem jedan alarm na mobitelu.',
      );
    } catch (error) {
      this.error.set(asApplicationError(error).message);
    }
  }
}
