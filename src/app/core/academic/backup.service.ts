import { DestroyRef, Injectable, effect, inject, signal } from '@angular/core';
import { FirebaseContextService } from '../../data/firebase-context.service';
import { AuthService } from '../../data/auth.service';
import { BackupRepository } from '../../data/backup.repository';
import { BackupEnvelope, backupBytes, parseBackup, serializeBackup } from '../../domain/backup';
import { AcademicStoreService } from './academic-store.service';
import { UnsavedChangesService } from '../forms/unsaved-changes.service';
import { ApplicationError, asApplicationError } from '../errors/application-error';
@Injectable({ providedIn: 'root' })
export class BackupService {
  readonly academic = inject(AcademicStoreService);
  private readonly auth = inject(AuthService);
  private readonly context = inject(FirebaseContextService);
  private readonly changes = inject(UnsavedChangesService);
  readonly busy = signal(false);
  readonly preview = signal<BackupEnvelope | null>(null);
  readonly progress = signal('');
  readonly error = signal<ApplicationError | null>(null);
  readonly success = signal<string | null>(null);
  readonly orphans = signal<string[]>([]);
  constructor() {
    inject(DestroyRef).onDestroy(this.changes.registerPending(() => this.busy()));
    effect(() => {
      if (this.auth.status() !== 'allowed') {
        this.preview.set(null);
        this.orphans.set([]);
        this.error.set(null);
        this.success.set(null);
      }
    });
  }
  private repo() {
    return new BackupRepository(this.context.firestore, () => this.academic.online());
  }
  async choose(file: File) {
    const uid = this.auth.requireUid();
    this.preview.set(null);
    this.error.set(null);
    this.success.set(null);
    try {
      if (file.size > backupBytes)
        throw new ApplicationError('invalidBackup', 'Kopija prelazi 5 MiB.');
      const text = await file.text();
      if (this.auth.status() !== 'allowed' || this.auth.user()?.uid !== uid) return;
      this.preview.set(parseBackup(text));
    } catch (e) {
      this.error.set(asApplicationError(e));
    }
  }
  async run(action: () => Promise<void>) {
    if (this.busy()) return;
    this.busy.set(true);
    this.error.set(null);
    this.success.set(null);
    try {
      await action();
    } catch (e) {
      this.error.set(asApplicationError(e));
    } finally {
      this.busy.set(false);
    }
  }
  async export(previous = false) {
    await this.run(async () => {
      const envelope = await this.repo().export(this.auth.requireUid(), previous),
        url = URL.createObjectURL(
          new Blob([serializeBackup(envelope)], { type: 'application/json' }),
        ),
        link = document.createElement('a');
      link.href = url;
      link.download = 'kolegium-backup-' + envelope.exportedAt.slice(0, 10) + '.json';
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      this.success.set('Sigurnosna kopija je preuzeta. Sadrži osobne podatke; čuvaj je privatno.');
    });
  }
  async restore() {
    const input = this.preview(),
      control = this.academic.control();
    if (!input || !control || this.changes.hasUnsafeChanges()) return;
    if (
      !window.confirm(
        'Povrat će zamijeniti cijelu evidenciju podacima iz datoteke. Prethodna kopija ostaje dostupna. Jesi li prethodno preuzeo aktualnu sigurnosnu kopiju i želiš nastaviti?',
      )
    )
      return;
    await this.run(async () => {
      await this.academic.recoveryMutation(() =>
        this.repo()
          .restore(this.auth.requireUid(), input, control.dataRevision, (done, total) =>
            this.progress.set(`Spremam izoliranu kopiju: ${done} / ${total}`),
          )
          .then(() => {}),
      );
      this.preview.set(null);
      this.progress.set('');
      this.changes.discardDrafts();
      this.success.set('Povrat je dovršen i potvrđen. Učitaj obnovljene podatke.');
    });
  }
  async abort() {
    if (!window.confirm('Prekinuti povrat? Aktivna evidencija ostaje ista.')) return;
    await this.run(async () => {
      await this.academic.recoveryMutation(() => this.repo().abort(this.auth.requireUid()));
      this.progress.set('');
      this.success.set('Povrat je prekinut. Aktivna evidencija nije zamijenjena.');
    });
  }
  async findOrphans() {
    await this.run(async () => this.orphans.set(await this.repo().orphans(this.auth.requireUid())));
  }
  async cleanup(id: string) {
    if (
      !window.confirm(
        'Obrisati ovu napuštenu kopiju? Aktivna i prethodna kopija ostaju zaštićene. Za stare zadržane kopije najprije preuzmi aktualni backup.',
      )
    )
      return;
    await this.run(async () => {
      await this.academic.recoveryMutation(() => this.repo().cleanup(this.auth.requireUid(), id));
      this.orphans.update((rows) => rows.filter((r) => r !== id));
      this.success.set('Napuštena kopija je uklonjena.');
    });
  }
}
