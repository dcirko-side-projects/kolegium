import { IconComponent } from '../../shared/ui/icon/icon.component';
import { EditorDialogComponent } from '../../shared/ui/editor-dialog/editor-dialog.component';
import { Component, DestroyRef, effect, inject, signal, untracked } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { WorkStoreService } from '../../core/academic/work-store.service';
import { UnsavedChangesService } from '../../core/forms/unsaved-changes.service';
import { ApplicationError, asApplicationError } from '../../core/errors/application-error';
import { Thesis } from '../../domain/work.models';
import { thesisInput } from '../../domain/work.validation';
import { TasksComponent } from '../todo/tasks.component';
@Component({
  selector: 'app-thesis',
  imports: [IconComponent, EditorDialogComponent, ReactiveFormsModule, RouterLink, TasksComponent],
  providers: [WorkStoreService],
  template: `
    <div class="page-heading">
      <h1><app-icon name="cap" /> Diplomski</h1>
      <a routerLink="/sections">Pogledaj sve sekcije</a>
    </div>
    <p>Tema i mentor mogu ostati prazni. Ovdje su osnovne informacije i zadaci diplomskog.</p>
    @if (store.loading()) {
      <p role="status">Učitavam diplomski…</p>
    }
    @if (store.error()) {
      <p role="alert">{{ store.error()?.message }}</p>
      <button (click)="store.refresh()">Osvježi diplomski</button>
    }
    @if (error() && !editing()) {
      <p role="alert" class="error-message">{{ error()?.message }}</p>
      @if (error()?.category === 'conflict') {
        <p>Server verzija: {{ serverDescription() }}</p>
        <button (click)="replaceWithServer()">Učitaj novu verziju diplomskog</button>
      }
    }
    @if (store.success()) {
      <p role="status" class="success-message">{{ store.success() }}</p>
    }
    @if (store.academic.busy()) {
      <p role="status">Spremam promjenu…</p>
    }
    @if (!editing()) {
      <section class="panel">
        <h2>Osnovne informacije</h2>
        <dl class="metadata-grid">
          <div>
            <dt>Tema</dt>
            <dd>{{ store.thesis()?.topic ?? 'još nije poznata' }}</dd>
          </div>
          <div>
            <dt>Mentor</dt>
            <dd>{{ store.thesis()?.mentor ?? 'još nije poznat' }}</dd>
          </div>
        </dl>
        <p class="information">{{ store.thesis()?.information ?? 'Nema bilješki.' }}</p>
        <button (click)="start()" [disabled]="!store.canWrite()">
          {{ store.thesis() ? 'Uredi diplomski' : 'Dodaj osnovnu evidenciju' }}
        </button>
      </section>
    } @else {
      <app-editor-dialog
        title="Diplomski"
        (dismiss)="cancel()"
        [error]="error()"
        [conflictDescription]="serverDescription()"
        (restore)="replaceWithServer()"
        restoreLabel="Učitaj novu verziju diplomskog"
      >
        <form class="panel" [formGroup]="form" (ngSubmit)="submit()">
          <div class="form-field">
            <label for="thesis-topic">Tema diplomskog (opcionalno)</label
            ><input id="thesis-topic" maxlength="500" formControlName="topic" />
          </div>
          <div class="form-field">
            <label for="thesis-mentor">Mentor (opcionalno)</label
            ><input id="thesis-mentor" maxlength="500" formControlName="mentor" />
          </div>
          <div class="form-field">
            <label for="thesis-information">Informacije o diplomskom</label
            ><textarea
              id="thesis-information"
              maxlength="10000"
              formControlName="information"
            ></textarea>
          </div>
          <div class="actions">
            <button class="primary" [disabled]="!store.canWrite()">Spremi diplomski</button
            ><button type="button" (click)="cancel()">Odustani od diplomskog</button>
          </div>
        </form>
      </app-editor-dialog>
    }
    @if (store.thesis()) {
      <app-tasks [embedded]="true" fixedType="thesis" fixedId="main" />
    } @else {
      <p>Spremi osnovnu evidenciju, pa dodaj zadatke. Tema i mentor nisu obvezni.</p>
    }
  `,
  styles: `
    .information {
      white-space: pre-wrap;
      overflow-wrap: anywhere;
    }
  `,
})
export class ThesisComponent {
  protected readonly store = inject(WorkStoreService);
  private readonly changes = inject(UnsavedChangesService);
  protected readonly form = inject(FormBuilder).nonNullable.group({
    topic: '',
    mentor: '',
    information: '',
  });
  protected readonly editing = signal(false);
  protected readonly old = signal<Thesis | null>(null);
  protected readonly error = signal<ApplicationError | null>(null);
  private restored = false;
  constructor() {
    this.store.kind.set('thesis');
    const destroy = inject(DestroyRef);
    destroy.onDestroy(this.changes.register(() => this.form.dirty));
    destroy.onDestroy(() => {
      if (this.form.dirty)
        this.changes.keepDraft('thesis', { values: this.form.getRawValue(), old: this.old() });
    });
    effect(() => {
      const ready = this.store.academic.ready();
      untracked(() => {
        if (ready && !this.restored) {
          this.restored = true;
          const draft = this.changes.takeDraft<{
            values: { topic: string; mentor: string; information: string };
            old: Thesis | null;
          }>('thesis');
          if (draft) {
            this.old.set(draft.old);
            this.form.reset(draft.values);
            this.form.markAsDirty();
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
  protected start() {
    if (!this.changes.confirm()) return;
    const row = this.store.thesis();
    this.old.set(row);
    this.form.reset({
      topic: row?.topic ?? '',
      mentor: row?.mentor ?? '',
      information: row?.information ?? '',
    });
    this.editing.set(true);
  }
  protected cancel() {
    if (this.changes.confirm()) {
      this.form.reset();
      this.editing.set(false);
      this.error.set(null);
      this.store.success.set(null);
    }
  }
  protected async submit() {
    this.error.set(null);
    this.store.success.set(null);
    try {
      const v = this.form.getRawValue();
      await this.store.write((repo) =>
        repo.save(
          this.store.academic.scope()!,
          'thesis',
          'main',
          thesisInput({
            topic: v.topic || null,
            mentor: v.mentor || null,
            information: v.information,
          }),
          this.old()?.revision ?? null,
        ),
      );
      this.form.reset();
      this.editing.set(false);
    } catch (e) {
      this.error.set(asApplicationError(e));
    }
  }
  protected serverDescription() {
    const row = this.error()?.serverRecord as Thesis | undefined;
    return row
      ? (row.topic ?? 'Tema nije poznata') + ' · ' + (row.mentor ?? 'Mentor nije poznat')
      : 'Osvježi za usporedbu.';
  }
  protected async replaceWithServer() {
    if (!this.changes.confirm()) return;
    this.form.reset();
    this.editing.set(false);
    this.error.set(null);
    this.store.success.set(null);
    await this.store.refresh();
  }
}
