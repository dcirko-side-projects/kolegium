import { Component, DestroyRef, effect, inject, signal, untracked } from '@angular/core';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { PlanningStoreService } from '../../core/academic/planning-store.service';
import { UnsavedChangesService } from '../../core/forms/unsaved-changes.service';
import { ApplicationError, asApplicationError } from '../../core/errors/application-error';
import { Installment } from '../../domain/planning.models';
import { eurosToCents, installmentInput } from '../../domain/grading';
@Component({
  selector: 'app-installments',
  imports: [ReactiveFormsModule],
  providers: [PlanningStoreService],
  template: `
    <h1>Rate fakulteta</h1>
    <p>Iznos u EUR, rok i evidencija plaćanja.</p>
    <button class="primary" (click)="start()" [disabled]="!store.canWrite()">Dodaj ratu</button>
    @if (store.loading()) {
      <p role="status">Učitavam rate…</p>
    }
    @if (store.error()) {
      <p role="alert">{{ store.error()?.message }}</p>
      <button (click)="store.refresh()">Osvježi rate</button>
    }
    @if (store.success()) {
      <p role="status" class="success-message">{{ store.success() }}</p>
    }
    @if (error()) {
      <p role="alert" class="error-message">{{ error()?.message }}</p>
      @if (error()?.category === 'conflict') {
        <p>Nova server verzija: {{ serverDescription() }}</p>
        <button (click)="discard()">Učitaj novu verziju rate</button>
      }
    }
    @if (editing()) {
      <form class="panel form-grid" [formGroup]="form" (ngSubmit)="submit()">
        <h2>{{ old() ? 'Uredi ratu' : 'Nova rata' }}</h2>
        <div class="field">
          <label for="installment-name">Naziv rate</label
          ><input id="installment-name" maxlength="200" formControlName="name" />
        </div>
        <div class="field">
          <label for="installment-amount">Iznos EUR</label
          ><input id="installment-amount" inputmode="decimal" formControlName="amount" />
        </div>
        <div class="field">
          <label for="installment-date">Rok plaćanja</label
          ><input id="installment-date" type="date" formControlName="dueOn" />
        </div>
        <label class="checkbox"><input type="checkbox" formControlName="isPaid" />Plaćeno</label>
        <div class="actions">
          <button class="primary" [disabled]="!store.canWrite()">Spremi ratu</button
          ><button type="button" (click)="cancel()">Odustani od rate</button>
        </div>
      </form>
    }
    @for (row of store.rows(); track row.id) {
      <article class="panel" [attr.aria-label]="row.name">
        <h2>{{ row.name }}</h2>
        <p>
          {{ money(row.amountCents) }} · Rok: {{ row.dueOn }} ·
          {{
            row.isPaid
              ? 'Plaćeno'
              : row.dueOn < store.today()
                ? 'Zakašnjelo — neplaćeno'
                : 'Neplaćeno'
          }}
        </p>
        <div class="actions">
          <button (click)="toggle(row)" [disabled]="!store.canWrite()">
            {{ row.isPaid ? 'Označi neplaćeno' : 'Označi plaćeno' }}</button
          ><button (click)="start(row)" [disabled]="!store.canWrite()">Uredi ratu</button>
        </div>
      </article>
    } @empty {
      @if (!store.loading() && !store.error()) {
        <p>Nema unesenih rata.</p>
      }
    }
    @if (store.more()) {
      <button (click)="store.count.update(increase)" [disabled]="store.loading()">
        Učitaj još rata
      </button>
    }
  `,
})
export class InstallmentsComponent {
  protected readonly store = inject(PlanningStoreService);
  private readonly changes = inject(UnsavedChangesService);
  protected readonly form = inject(FormBuilder).nonNullable.group({
    name: '',
    amount: '',
    dueOn: '',
    isPaid: false,
  });
  protected readonly editing = signal(false);
  protected readonly old = signal<Installment | null>(null);
  protected readonly error = signal<ApplicationError | null>(null);
  private id = '';
  private restored = false;
  protected readonly increase = (n: number) => n + 50;
  constructor() {
    const destroy = inject(DestroyRef);
    destroy.onDestroy(this.changes.register(() => this.form.dirty));
    destroy.onDestroy(() => {
      if (this.form.dirty)
        this.changes.keepDraft('installments', {
          values: this.form.getRawValue(),
          old: this.old(),
          id: this.id,
        });
    });
    effect(() => {
      const ready = this.store.academic.ready();
      untracked(() => {
        if (ready && !this.restored) {
          this.restored = true;
          const draft = this.changes.takeDraft<{
            values: { name: string; amount: string; dueOn: string; isPaid: boolean };
            old: Installment | null;
            id: string;
          }>('installments');
          if (draft) {
            this.form.reset(draft.values);
            this.form.markAsDirty();
            this.old.set(draft.old);
            this.id = draft.id;
            this.editing.set(true);
          }
        }
      });
    });
  }
  canLeave() {
    const allowed = this.changes.canLeave();
    if (allowed) this.form.markAsPristine();
    return allowed;
  }
  protected money(cents: number) {
    return new Intl.NumberFormat('hr-HR', { style: 'currency', currency: 'EUR' }).format(
      cents / 100,
    );
  }
  protected start(row: Installment | null = null) {
    if (!this.changes.confirm()) return;
    this.error.set(null);
    this.store.success.set(null);
    this.old.set(row);
    this.id = row?.id ?? crypto.randomUUID();
    this.form.reset({
      name: row?.name ?? '',
      amount: row ? (row.amountCents / 100).toFixed(2) : '',
      dueOn: row?.dueOn ?? this.store.today(),
      isPaid: row?.isPaid ?? false,
    });
    this.editing.set(true);
  }
  protected cancel() {
    if (this.changes.confirm()) {
      this.form.reset();
      this.editing.set(false);
      this.error.set(null);
    }
  }
  protected async discard() {
    if (!this.changes.confirm()) return;
    this.form.reset();
    this.editing.set(false);
    this.error.set(null);
    await this.store.refresh();
  }
  protected serverDescription() {
    const row = this.error()?.serverRecord as Installment | undefined;
    return row
      ? row.name +
          ' · ' +
          this.money(row.amountCents) +
          ' · ' +
          row.dueOn +
          ' · ' +
          (row.isPaid ? 'Plaćeno' : 'Neplaćeno')
      : 'Osvježi za usporedbu.';
  }
  protected async submit() {
    this.error.set(null);
    this.store.success.set(null);
    try {
      const v = this.form.getRawValue(),
        payload = installmentInput({
          name: v.name,
          amountCents: eurosToCents(v.amount),
          dueOn: v.dueOn,
          isPaid: v.isPaid,
        });
      await this.store.write(() =>
        this.store
          .repository()
          .save(
            this.store.academic.scope()!,
            'installments',
            this.id,
            payload,
            this.old()?.revision ?? null,
          ),
      );
      this.form.reset();
      this.editing.set(false);
    } catch (e) {
      this.error.set(asApplicationError(e));
    }
  }
  protected async toggle(row: Installment) {
    this.error.set(null);
    this.store.success.set(null);
    try {
      await this.store.write(() =>
        this.store
          .repository()
          .save(
            this.store.academic.scope()!,
            'installments',
            row.id,
            { ...row, isPaid: !row.isPaid },
            row.revision,
          ),
      );
    } catch (e) {
      this.error.set(asApplicationError(e));
    }
  }
}
