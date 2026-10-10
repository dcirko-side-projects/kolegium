import { Component, inject } from '@angular/core';
import { PwaService } from '../../../core/pwa/pwa.service';
@Component({
  selector: 'app-pwa-status',
  template: `
    @if (pwa.installable()) {
      <button (click)="pwa.install()" [disabled]="pwa.busy()">Instaliraj Kolegium</button>
    }
    @if (pwa.updateReady() || pwa.activated()) {
      <section class="panel" aria-label="Ažuriranje aplikacije">
        <p role="status">Nova verzija aplikacije je spremna. Prvo spremi otvoreni unos.</p>
        <button (click)="pwa.update()" [disabled]="!pwa.canUpdate() || pwa.busy()">
          Učitaj novu verziju
        </button>
      </section>
    }
    @if (pwa.error()) {
      <p role="status">{{ pwa.error() }}</p>
    }
  `,
})
export class PwaStatusComponent {
  readonly pwa = inject(PwaService);
}
