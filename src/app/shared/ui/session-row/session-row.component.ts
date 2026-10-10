import { Component, input, output, inject, signal } from '@angular/core';
import { ScheduleStoreService } from '../../../core/academic/schedule-store.service';
import { Attendance, Occurrence } from '../../../domain/schedule.models';
import { asApplicationError } from '../../../core/errors/application-error';

@Component({
  selector: 'app-session-row',
  template: `<article
    class="panel session"
    [attr.aria-label]="name() + ' ' + row().scheduledOn + ' ' + row().startsAt"
  >
    <div>
      <h3>{{ name() }}</h3>
      <p>
        {{ row().scheduledOn }} · {{ row().startsAt }}–{{ row().endsAt }} ·
        {{ row().kind === 'lecture' ? 'Predavanja' : 'Vježbe' }}
      </p>
      @if (row().location) {
        <p>{{ row().location }}</p>
      }
      <p class="hint">
        {{
          row().isCancelled
            ? 'Otkazano'
            : row().attendance === 'present'
              ? 'Prisutan'
              : row().attendance === 'absent'
                ? 'Odsutan'
                : 'Neoznačeno'
        }}{{ row().replacementForId ? ' · Nadoknada' : '' }}
      </p>
    </div>
    @if (!row().isCancelled) {
      <div class="actions">
        <button
          (click)="mark('present')"
          [disabled]="disabled()"
          [attr.aria-pressed]="row().attendance === 'present'"
        >
          Prisutan
        </button>
        <button
          (click)="mark('absent')"
          [disabled]="disabled()"
          [attr.aria-pressed]="row().attendance === 'absent'"
        >
          Odsutan
        </button>
        @if (row().attendance !== 'unmarked') {
          <button (click)="mark('unmarked')" [disabled]="disabled()">Poništi oznaku</button>
        }
      </div>
    }
    @if (details()) {
      <div class="actions secondary-actions">
        <button (click)="cancel()" [disabled]="!store.canEditCourse(row().courseId)">
          {{ row().isCancelled ? 'Vrati u održano' : 'Otkaži termin' }}
        </button>
        <button (click)="replacement.emit(row())" [disabled]="!store.canEditCourse(row().courseId)">
          Dodaj nadoknadu
        </button>
      </div>
    }
    @if (message()) {
      <p role="alert" class="error-message">{{ message() }}</p>
      <button (click)="reload()">Osvježi termin</button>
    }
  </article>`,
  styles: `
    .session {
      margin-block: 12px;
    }
    h3 {
      margin: 0 0 8px;
    }
    p {
      margin: 8px 0;
    }
    button[aria-pressed='true'] {
      background: var(--color-primary);
      color: white;
      border-color: var(--color-primary);
    }
    .secondary-actions {
      margin-top: 12px;
    }
  `,
})
export class SessionRowComponent {
  readonly row = input.required<Occurrence>();
  readonly name = input.required<string>();
  readonly details = input(false);
  readonly replacement = output<Occurrence>();
  protected readonly store = inject(ScheduleStoreService);
  protected readonly message = signal<string | null>(null);
  protected disabled(): boolean {
    return (
      !this.store.canEditCourse(this.row().courseId) || this.row().scheduledOn > this.store.today()
    );
  }
  protected async mark(value: Attendance): Promise<void> {
    this.message.set(null);
    try {
      await this.store.mark(this.row(), value);
    } catch (error) {
      const e = asApplicationError(error);
      this.message.set(
        e.category === 'conflict'
          ? `${e.message} Tvoj izbor (${value === 'present' ? 'prisutan' : value === 'absent' ? 'odsutan' : 'neoznačeno'}) nije prepisao drugi zapis.`
          : e.message,
      );
    }
  }
  protected async cancel(): Promise<void> {
    const row = this.row();
    if (
      !window.confirm(
        row.isCancelled
          ? 'Vrati termin u održano? Dolaznost ostaje neoznačena.'
          : 'Otkaži ovaj termin? Postojeća oznaka dolaznosti bit će poništena; službeni fond ostaje isti.',
      )
    )
      return;
    this.message.set(null);
    try {
      await this.store.saveSession(row, {
        ...row,
        isCancelled: !row.isCancelled,
        attendance: 'unmarked',
      });
    } catch (error) {
      this.message.set(asApplicationError(error).message);
    }
  }
  protected async reload(): Promise<void> {
    await this.store.refresh();
    this.message.set(null);
  }
}
