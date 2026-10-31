import { EditorDialogComponent } from '../editor-dialog/editor-dialog.component';
import { Component, DestroyRef, effect, inject, input, signal, untracked } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { AcademicStoreService } from '../../../core/academic/academic-store.service';
import { WorkStoreService } from '../../../core/academic/work-store.service';
import { ScoreAttempt, ResultSource } from '../../../domain/work.models';
import { scoreAttemptInput, activityId } from '../../../domain/work.validation';
import { ApplicationError, asApplicationError } from '../../../core/errors/application-error';
import { UnsavedChangesService } from '../../../core/forms/unsaved-changes.service';
@Component({
  selector: 'app-result-history',
  imports: [EditorDialogComponent, ReactiveFormsModule],
  template: ` <section class="panel" aria-label="Pokusaji i rezultati">
    <h2>Pokušaji i rezultati</h2>
    <p class="hint">
      Svi pokušaji ostaju sačuvani. Bodovi se ovdje ne zbrajaju i ne biramo obračunski pokušaj bez
      pravila kolegija.
    </p>
    @if (loading()) {
      <p role="status">Učitavam pokušaje…</p>
    }
    @if (error() && !editing()) {
      <p role="alert" class="error-message">{{ error()?.message }}</p>
      <button (click)="refresh()">Osvježi pokušaje</button>
      @if (error()?.category === 'conflict') {
        <p>Nova server verzija: {{ serverDescription() }}</p>
        <button (click)="discard()">Učitaj novu verziju pokušaja</button>
      }
    }
    @if (success()) {
      <p role="status" class="success-message">{{ success() }}</p>
    }
    @for (row of rows(); track row.id) {
      <article [attr.aria-label]="'Pokušaj ' + row.attemptNumber">
        <h3>Pokušaj {{ row.attemptNumber }}</h3>
        <p>
          Datum: {{ row.takenOn ?? 'nije poznat' }} · Bodovi: {{ row.points ?? 'nisu poznati' }} ·
          Ocjena: {{ row.grade ?? 'nije poznata' }}
        </p>
        <button (click)="edit(row)" [disabled]="!canEdit() || loading()">
          Ispravi pokušaj {{ row.attemptNumber }}
        </button>
      </article>
    } @empty {
      @if (!loading()) {
        <p>Nema unesenih pokušaja.</p>
      }
    }
    <button (click)="add()" [disabled]="!canEdit() || loading()">Dodaj pokušaj</button>
    @if (editing()) {
      <app-editor-dialog
        title="Pokušaj i rezultat"
        (dismiss)="discard()"
        [error]="error()"
        [conflictDescription]="serverDescription()"
        (restore)="discard()"
        restoreLabel="Učitaj novu verziju pokušaja"
      >
        <form [formGroup]="form" (ngSubmit)="submit()">
          <h3>{{ old() ? 'Ispravak pokušaja' : 'Novi pokušaj' }} {{ number() }}</h3>
          <div class="form-grid">
            <div class="form-field">
              <label [attr.for]="prefix() + 'date'">Datum pokušaja (opcionalno)</label
              ><input [id]="prefix() + 'date'" type="date" formControlName="takenOn" />
            </div>
            <div class="form-field">
              <label [attr.for]="prefix() + 'points'">Bodovi (opcionalno)</label
              ><input [id]="prefix() + 'points'" inputmode="decimal" formControlName="points" />
              <p class="hint">
                Decimalna točka, najviše četiri decimalna mjesta. Prazno je nepoznato; 0 je unesena
                nula.
              </p>
            </div>
          </div>
          <div class="form-field">
            <label [attr.for]="prefix() + 'grade'">Ocjena (opcionalno)</label
            ><input [id]="prefix() + 'grade'" maxlength="200" formControlName="grade" />
          </div>
          <div class="actions">
            <button class="primary" [disabled]="!canEdit() || academic.busy() || loading()">
              Spremi pokušaj</button
            ><button type="button" (click)="discard()">Odustani od pokušaja</button>
          </div>
        </form>
      </app-editor-dialog>
    }
  </section>`,
})
export class ResultHistoryComponent {
  readonly sourceType = input.required<ResultSource>();
  readonly sourceId = input.required<string>();
  readonly editable = input(false);
  protected readonly academic = inject(AcademicStoreService);
  private readonly page = inject(WorkStoreService);
  private readonly changes = inject(UnsavedChangesService);
  protected readonly rows = signal<ScoreAttempt[]>([]);
  protected readonly old = signal<ScoreAttempt | null>(null);
  protected readonly number = signal(1);
  protected readonly editing = signal(false);
  protected readonly loading = signal(false);
  protected readonly error = signal<ApplicationError | null>(null);
  protected readonly success = signal<string | null>(null);
  protected readonly form = inject(FormBuilder).nonNullable.group({
    takenOn: '',
    points: '',
    grade: '',
  });
  private request = 0;
  private lastSource = '';
  private restored = false;
  protected prefix() {
    return this.sourceType() + '-' + this.sourceId() + '-';
  }
  protected canEdit() {
    return this.editable() && this.academic.canWrite();
  }
  constructor() {
    const destroy = inject(DestroyRef);
    destroy.onDestroy(this.changes.register(() => this.form.dirty));
    destroy.onDestroy(() => {
      this.request++;
      if (this.form.dirty)
        this.changes.keepDraft(this.prefix(), {
          values: this.form.getRawValue(),
          old: this.old(),
          number: this.number(),
        });
    });
    effect(() => {
      const id = this.sourceId(),
        type = this.sourceType(),
        scope = this.academic.scope(),
        ready = this.academic.ready();
      this.academic.control();
      untracked(() => {
        if (scope && ready) {
          if (this.lastSource !== type + id) {
            this.lastSource = type + id;
            this.form.reset();
            this.editing.set(false);
            this.restored = false;
          }
          void this.refresh();
        } else {
          this.request++;
          this.rows.set([]);
        }
      });
    });
  }
  protected async refresh(): Promise<void> {
    const scope = this.academic.scope();
    if (!scope || !this.academic.online()) return;
    const request = ++this.request;
    this.loading.set(true);
    try {
      const data = await this.page.repository().attempts(scope, this.sourceType(), this.sourceId());
      if (request !== this.request) return;
      this.rows.set(data.attempts);
      this.error.set(null);
      if (!this.restored) {
        this.restored = true;
        const draft = this.changes.takeDraft<{
          values: { takenOn: string; points: string; grade: string };
          old: ScoreAttempt | null;
          number: number;
        }>(this.prefix());
        if (draft) {
          this.form.reset(draft.values);
          this.form.markAsDirty();
          this.old.set(draft.old);
          this.number.set(draft.number);
          this.editing.set(true);
        }
      }
    } catch (e) {
      if (request === this.request) this.error.set(asApplicationError(e));
    } finally {
      if (request === this.request) this.loading.set(false);
    }
  }
  protected add() {
    if (!this.changes.confirm()) return;
    this.old.set(null);
    this.number.set(Math.max(0, ...this.rows().map((r) => r.attemptNumber)) + 1);
    this.form.reset();
    this.editing.set(true);
    this.error.set(null);
    this.success.set(null);
  }
  protected edit(row: ScoreAttempt) {
    if (!this.changes.confirm()) return;
    this.old.set(row);
    this.number.set(row.attemptNumber);
    this.form.reset({
      takenOn: row.takenOn ?? '',
      points: row.points ?? '',
      grade: row.grade ?? '',
    });
    this.editing.set(true);
    this.error.set(null);
    this.success.set(null);
  }
  protected discard() {
    if (!this.changes.confirm()) return;
    this.form.reset();
    this.editing.set(false);
    this.old.set(null);
    void this.refresh();
  }
  protected serverDescription() {
    const record = this.error()?.serverRecord as ScoreAttempt | undefined;
    return record
      ? 'Bodovi: ' + (record.points ?? 'nepoznati') + ', ocjena: ' + (record.grade ?? 'nepoznata')
      : 'Osvježi za usporedbu.';
  }
  protected async submit() {
    this.error.set(null);
    this.success.set(null);
    try {
      if (!this.canEdit()) throw new ApplicationError('unavailable', 'Spremanje nije dostupno.');
      await this.page.checkSource(this.sourceType(), this.sourceId());
      const values = this.form.getRawValue(),
        payload = scoreAttemptInput({
          activityId: activityId(this.sourceType(), this.sourceId()),
          attemptNumber: this.number(),
          takenOn: values.takenOn || null,
          points: values.points || null,
          grade: values.grade || null,
        });
      await this.page.write((repo) =>
        repo.saveAttempt(
          this.academic.scope()!,
          this.sourceType(),
          this.sourceId(),
          payload,
          this.old()?.revision ?? null,
        ),
      );
      this.form.reset();
      this.editing.set(false);
      await this.refresh();
      this.success.set('Pokušaj je spremljen i potvrđen na poslužitelju.');
    } catch (e) {
      this.error.set(asApplicationError(e));
    }
  }
}
