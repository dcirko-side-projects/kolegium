import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { UnsavedChangesService } from '../../core/forms/unsaved-changes.service';
import { ScheduleStoreService } from '../../core/academic/schedule-store.service';
import { asApplicationError } from '../../core/errors/application-error';
import {
  CalendarLesson,
  calendarLimit,
  parseTvzCalendar,
  seriesKey,
} from '../../domain/tvz-calendar';

@Component({
  selector: 'app-calendar-import',
  template: `<section class="panel">
    <h2>Uvoz TVZ rasporeda</h2>
    <p>
      Odaberi ICS datoteku. Prvo pregledaj kolegije i odaberi svoje grupe vježbi. Modeliranje i
      administracija baza podataka automatski se izostavlja.
    </p>
    <label for="calendar-file">Datoteka rasporeda (.ics)</label>
    <input
      id="calendar-file"
      type="file"
      accept=".ics,text/calendar"
      [disabled]="store.busy() || store.academic.busy()"
      (change)="read($event)"
    />
    @if (groups().length) {
      <p>
        Europe/Zagreb · {{ firstDate() }} — {{ lastDate() }}. Izostavljeno termina baza:
        {{ excluded() }}.
      </p>
      <p>
        Odabrani semestar: {{ store.academic.selectedSemester()?.name ?? 'nije odabran' }}. Ako
        nedostaje, prvo ga dodaj u Postavkama, s datumima koji obuhvaćaju raspored.
      </p>
      <p>
        Svaki blok ostaje zasebna jedinica dolaznosti. Predavanja i vježbe su odvojeni; službeni
        fond i minimum se ne postavljaju iz broja termina.
      </p>
      @for (group of groups(); track group.key; let i = $index) {
        <div class="panel">
          <label class="checkbox-field" [for]="'calendar-group-' + i">
            <input
              type="checkbox"
              [id]="'calendar-group-' + i"
              [checked]="selected().has(group.key)"
              [disabled]="store.busy() || store.academic.busy()"
              (change)="toggle(group.key)"
            />
            {{ group.lesson.courseName }} · {{ group.lesson.teachingLabel }} ·
            {{ group.lesson.startsAt }}–{{ group.lesson.endsAt }} · {{ group.count }} termina
          </label>
          <details>
            <summary>Datumi i učionice</summary>
            @for (lesson of group.lessons; track lesson.scheduledOn + lesson.location) {
              <p>{{ lesson.scheduledOn }} · {{ lesson.location ?? 'bez lokacije' }}</p>
            }
          </details>
        </div>
      }
      <p>
        {{ chosen().length }} odabranih termina. Dodaju se samo novi kolegiji i termini; postojeća
        dolaznost i otkazivanja ostaju.
      </p>
      <button
        class="primary"
        [disabled]="!store.canWrite() || !store.academic.selectedSemester() || !chosen().length"
        (click)="save()"
      >
        Potvrdi uvoz odabranih termina
      </button>
    }
    @if (progress()) {
      <p role="status">{{ progress() }}</p>
    }
    @if (error()) {
      <p role="alert" class="error-message">{{ error() }}</p>
    }
  </section>`,
})
export class CalendarImportComponent {
  private readonly imported = signal(false);
  constructor() {
    inject(DestroyRef).onDestroy(
      inject(UnsavedChangesService).register(() => this.lessons().length > 0 && !this.imported()),
    );
  }
  protected readonly store = inject(ScheduleStoreService);
  protected readonly lessons = signal<CalendarLesson[]>([]);
  protected readonly selected = signal(new Set<string>());
  protected readonly excluded = signal(0);
  protected readonly error = signal<string | null>(null);
  protected readonly progress = signal<string | null>(null);
  protected readonly firstDate = computed(() => this.lessons()[0]?.scheduledOn ?? '');
  protected readonly lastDate = computed(() => this.lessons().at(-1)?.scheduledOn ?? '');
  protected readonly groups = computed(() => {
    const groups = new Map<
      string,
      { key: string; lesson: CalendarLesson; count: number; lessons: CalendarLesson[] }
    >();
    for (const lesson of this.lessons()) {
      const key = seriesKey(lesson),
        group = groups.get(key) ?? { key, lesson, count: 0, lessons: [] };
      group.count++;
      group.lessons.push(lesson);
      groups.set(key, group);
    }
    return [...groups.values()];
  });
  protected readonly chosen = computed(() =>
    this.lessons().filter((l) => this.selected().has(seriesKey(l))),
  );
  protected toggle(key: string): void {
    this.imported.set(false);
    this.selected.update((value) => {
      const next = new Set(value);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }
  protected async read(event: Event): Promise<void> {
    this.imported.set(false);
    this.error.set(null);
    this.progress.set(null);
    this.lessons.set([]);
    this.selected.set(new Set());
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    try {
      if (file.size > calendarLimit) throw new Error('Raspored smije imati najviše 1 MiB.');
      const parsed = parseTvzCalendar(await file.text());
      this.lessons.set(parsed.lessons);
      this.excluded.set(parsed.excluded);
      // Exercises start unchecked: a source may contain several student groups.
      this.selected.set(new Set(parsed.lessons.filter((l) => l.kind === 'lecture').map(seriesKey)));
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Datoteka nije valjana.');
    }
  }
  protected async save(): Promise<void> {
    this.error.set(null);
    try {
      await this.store.importLessons(this.chosen(), (done, total) =>
        this.progress.set(`Potvrđeno ${done} od ${total} termina.`),
      );
      this.imported.set(true);
    } catch (error) {
      this.error.set(
        `${asApplicationError(error).message} Uvoz može biti djelomičan. Osvježi podatke i ponovi isti odabir; postojeći termini se preskaču.`,
      );
    }
  }
}
