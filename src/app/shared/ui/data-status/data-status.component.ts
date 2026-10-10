import { Component, inject } from '@angular/core';
import { AcademicStoreService } from '../../../core/academic/academic-store.service';
@Component({
  selector: 'app-data-status',
  template: `
    @if (!store.online()) {
      <div class="warning" role="status">
        Nema internetske veze. Prikaz je zadnje učitan; izmjene su onemogućene.
      </div>
    } @else if (store.stale()) {
      <div class="warning" role="status">
        Podaci još nisu osvježeni s poslužitelja.
        <button (click)="store.refresh()" [disabled]="store.loading()">Pokušaj ponovno</button>
      </div>
    }
    @if (store.locked()) {
      <div class="warning" role="status">
        Povrat podataka je u tijeku. Trenutačno možeš pregledavati podatke.
      </div>
    }
    @if (store.loading()) {
      <p role="status">Učitavam podatke…</p>
    }
    @if (store.error()) {
      <div class="error" role="alert">
        {{ store.error()?.message }}
        <button (click)="store.refresh()" [disabled]="!store.online() || store.loading()">
          Osvježi pregled
        </button>
      </div>
    }
  `,
  styles: `
    .warning,
    .error {
      padding: var(--space-4);
      margin-bottom: var(--space-4);
      border-radius: var(--radius-sm);
      background: var(--color-surface);
      border: 1px solid currentColor;
    }
    .warning {
      color: var(--color-warning);
    }
    .error {
      color: var(--color-error);
    }
    button {
      margin-left: var(--space-2);
    }
  `,
})
export class DataStatusComponent {
  protected readonly store = inject(AcademicStoreService);
}
