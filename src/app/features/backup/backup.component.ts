import { Component, computed, inject } from '@angular/core';
import { BackupService } from '../../core/academic/backup.service';
import { UnsavedChangesService } from '../../core/forms/unsaved-changes.service';
import { backupCollections } from '../../domain/backup';
@Component({
  selector: 'app-backup',
  template: `
    <section class="panel" aria-labelledby="backup-heading">
      <h2 id="backup-heading">Sigurnosna kopija i povrat</h2>
      <p>
        Preuzmi sve semestre, obaveze i rezultate u privatnu datoteku. Za preuzimanje i povrat
        potrebna je internetska veza.
      </p>
      <div class="actions">
        <button (click)="backup.export()" [disabled]="!backup.academic.canWrite() || backup.busy()">
          Preuzmi sigurnosnu kopiju
        </button>
        @if (backup.academic.control()?.previousDatasetId) {
          <button
            (click)="backup.export(true)"
            [disabled]="!backup.academic.canWrite() || backup.busy()"
          >
            Preuzmi prethodnu kopiju
          </button>
        }
      </div>
      @if (backup.busy()) {
        <p role="status">{{ backup.progress() || 'Provjeravam sigurnosnu kopiju…' }}</p>
      }
      @if (backup.error()) {
        <p role="alert" class="error-message">{{ backup.error()?.message }}</p>
      }
      @if (backup.success()) {
        <p role="status" class="success-message">{{ backup.success() }}</p>
      }
      @if (backup.academic.locked()) {
        <p>
          Povrat je u tijeku ili je prekinut prije dovršetka. Aktivna evidencija ostaje sačuvana;
          normalne izmjene su zaključane.
        </p>
        <button (click)="backup.abort()" [disabled]="backup.busy() || !backup.academic.online()">
          Prekini povrat
        </button>
      } @else {
        <div class="detail-section">
          <label for="backup-file">Odaberi sigurnosnu kopiju (JSON, do 5 MiB)</label>
          <input
            id="backup-file"
            type="file"
            accept="application/json,.json"
            (change)="choose($event)"
            [disabled]="!backup.academic.canWrite() || backup.busy()"
          />
          @if (backup.preview(); as file) {
            <h3>Pregled odabrane kopije</h3>
            <p>Datum izvoza: {{ file.exportedAt }}. Ukupno zapisa: {{ count() }}.</p>
            <p>
              Semestri: {{ file.collections.semesters.length }} · Kolegiji:
              {{ file.collections.courses.length }} · Pokušaji:
              {{ file.collections.scoreAttempts.length }}
            </p>
            <p>Povrat obuhvaća cijelu evidenciju. Najprije preuzmi aktualnu sigurnosnu kopiju.</p>
            <button
              class="primary"
              (click)="backup.restore()"
              [disabled]="
                !backup.academic.canWrite() || backup.busy() || changes.hasUnsafeChanges()
              "
            >
              Potvrdi povrat cijele evidencije
            </button>
          }
        </div>
      }
      @if (changes.hasUnsafeChanges() && !backup.busy()) {
        <p>Prije povrata spremi ili odbaci otvorene izmjene.</p>
      }
      <p>
        <button
          (click)="backup.findOrphans()"
          [disabled]="backup.busy() || !backup.academic.canWrite()"
        >
          Pronađi napuštene kopije
        </button>
      </p>
      @for (id of backup.orphans(); track id) {
        <p>
          Napuštena kopija {{ id }}
          <button
            (click)="backup.cleanup(id)"
            [disabled]="backup.busy() || !backup.academic.canWrite()"
          >
            Ukloni napuštenu kopiju
          </button>
        </p>
      }
    </section>
  `,
})
export class BackupComponent {
  protected readonly backup = inject(BackupService);
  protected readonly changes = inject(UnsavedChangesService);
  protected readonly count = computed(() => {
    const file = this.backup.preview();
    return file ? backupCollections.reduce((n, c) => n + file.collections[c].length, 0) : 0;
  });
  protected choose(event: Event) {
    const input = event.target as HTMLInputElement,
      file = input.files?.[0];
    if (file) void this.backup.choose(file);
    input.value = '';
  }
}
