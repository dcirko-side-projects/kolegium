import { Component, DestroyRef, input, output, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { UnsavedChangesService } from '../../../core/forms/unsaved-changes.service';
import { ScheduleStoreService } from '../../../core/academic/schedule-store.service';
import { Attendance, Occurrence } from '../../../domain/schedule.models';
import { asApplicationError } from '../../../core/errors/application-error';

@Component({
  selector: 'app-session-row',
  imports: [ReactiveFormsModule],
  template: `<article
    class="panel session"
    [class.exercise]="row().kind === 'exercise'"
    [class.cancelled]="row().isCancelled"
    [attr.aria-label]="name() + ' ' + row().scheduledOn + ' ' + row().startsAt"
  >
    <div class="session-time" aria-hidden="true">
      <strong>{{ row().startsAt }}</strong
      ><span>{{ row().endsAt }}</span>
    </div>
    <div class="session-content">
      <h3>{{ name() }}</h3>
      <p>
        {{ row().scheduledOn }} · {{ row().startsAt }}–{{ row().endsAt }} ·
        {{ row().kind === 'lecture' ? 'Predavanja' : 'Vježbe' }}
      </p>
      @if (row().location) {
        <p>{{ row().location }}</p>
      }
      <p
        class="status-badge"
        [class.is-complete]="row().attendance === 'present' && !row().isCancelled"
      >
        {{
          row().isCancelled
            ? 'Otkazano'
            : row().attendance === 'present'
              ? 'Prisutan'
              : row().attendance === 'absent'
                ? 'Odsutan'
                : row().attendance === 'excused'
                  ? 'Ispričani izostanak'
                  : 'Neoznačeno'
        }}{{ row().replacementForId ? ' · Nadoknada' : '' }}
      </p>
      @if (row().absenceNote) {
        <p>Ispričnica: {{ row().absenceNote }}</p>
      }
    </div>
    @if (!row().isCancelled) {
      <div class="actions attendance-actions">
        <button
          (click)="mark('present')"
          [disabled]="disabled()"
          [attr.aria-pressed]="row().attendance === 'present'"
        >
          Prisutan
        </button>
        <button
          (click)="openExcuse()"
          [disabled]="disabled()"
          [attr.aria-pressed]="row().attendance === 'excused'"
        >
          {{ row().attendance === 'excused' ? 'Uredi ispričnicu' : 'Ispričaj izostanak' }}
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
      @if (excusing()) {
        <form [formGroup]="excuseForm" (ngSubmit)="saveExcuse()">
          <label [for]="'absence-note-' + row().id">Napomena ispričnice (opcionalno)</label>
          <input [id]="'absence-note-' + row().id" formControlName="note" maxlength="500" />
          <p class="hint">
            Ispričani izostanak vodi se zasebno. Ne povećava broj dolazaka niti mijenja službeni
            fond ili minimum.
          </p>
          <div class="actions">
            <button type="submit" [disabled]="disabled() || excuseForm.invalid">
              Spremi ispričnicu</button
            ><button type="button" (click)="closeExcuse()" [disabled]="store.busy()">
              Odustani od ispričnice
            </button>
          </div>
        </form>
      }
    }
    @if (details()) {
      <div class="actions secondary-actions">
        <button (click)="cancel()" [disabled]="!store.canEditCourse(row().courseId)">
          {{ row().isCancelled ? 'Vrati u održano' : 'Otkaži termin' }}
        </button>
        <button (click)="requestReplacement()" [disabled]="!store.canEditCourse(row().courseId)">
          Dodaj nadoknadu
        </button>
      </div>
    }
    @if (message()) {
      <p role="alert" class="error-message">{{ message() }}</p>
      <button (click)="reload()">Osvježi termin</button>
    }
  </article>`,
  styleUrl: './session-row.component.scss',
})
export class SessionRowComponent {
  readonly row = input.required<Occurrence>();
  readonly name = input.required<string>();
  readonly details = input(false);
  readonly replacement = output<Occurrence>();
  protected readonly store = inject(ScheduleStoreService);
  protected readonly message = signal<string | null>(null);
  protected readonly excusing = signal(false);
  private excuseOriginal: Occurrence | null = null;
  protected readonly excuseForm = inject(FormBuilder).nonNullable.group({
    note: ['', Validators.maxLength(500)],
  });
  private readonly changes = inject(UnsavedChangesService);
  constructor() {
    inject(DestroyRef).onDestroy(
      this.changes.register(() => this.excusing() && this.excuseForm.dirty),
    );
  }
  protected openExcuse(): void {
    if (this.excusing()) return;
    this.excuseOriginal = this.row();
    this.excuseForm.reset({ note: this.row().absenceNote ?? '' });
    this.excusing.set(true);
  }
  protected closeExcuse(): void {
    if (!this.changes.confirm()) return;
    this.excuseForm.markAsPristine();
    this.excusing.set(false);
  }
  protected async saveExcuse(): Promise<void> {
    this.message.set(null);
    try {
      await this.store.mark(
        this.excuseOriginal ?? this.row(),
        'excused',
        this.excuseForm.controls.note.value.trim() || null,
      );
      this.excuseForm.markAsPristine();
      this.excusing.set(false);
    } catch (error) {
      this.message.set(asApplicationError(error).message);
    }
  }
  protected disabled(): boolean {
    return (
      !this.store.canEditCourse(this.row().courseId) || this.row().scheduledOn > this.store.today()
    );
  }
  protected async mark(value: Attendance): Promise<void> {
    if (this.excusing() && this.excuseForm.dirty && !this.changes.confirm()) return;
    this.message.set(null);
    try {
      await this.store.mark(this.row(), value);
      this.excuseForm.markAsPristine();
      this.excusing.set(false);
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
        absenceNote: null,
      });
      this.excuseForm.markAsPristine();
      this.excusing.set(false);
    } catch (error) {
      this.message.set(asApplicationError(error).message);
    }
  }
  protected requestReplacement(): void {
    if (this.excusing() && this.excuseForm.dirty && !this.changes.confirm()) return;
    this.excuseForm.markAsPristine();
    this.excusing.set(false);
    this.replacement.emit(this.row());
  }
  protected async reload(): Promise<void> {
    await this.store.refresh();
    this.message.set(null);
  }
}
