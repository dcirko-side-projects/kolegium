import { DestroyRef, Injectable, inject, isDevMode, signal } from '@angular/core';
import { UnsavedChangesService } from '../forms/unsaved-changes.service';
import { AcademicStoreService } from '../academic/academic-store.service';
interface InstallPrompt extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}
@Injectable({ providedIn: 'root' })
export class PwaService {
  private readonly changes = inject(UnsavedChangesService);
  private readonly academic = inject(AcademicStoreService);
  readonly installable = signal(false);
  readonly updateReady = signal(false);
  readonly activated = signal(false);
  readonly busy = signal(false);
  readonly error = signal<string | null>(null);
  private prompt?: InstallPrompt;
  private registration?: ServiceWorkerRegistration;
  private requested = false;
  constructor() {
    const destroy = inject(DestroyRef);
    if (isDevMode() || !('serviceWorker' in navigator) || !window.isSecureContext) return;
    const install = (event: Event) => {
      event.preventDefault();
      this.prompt = event as InstallPrompt;
      this.installable.set(true);
    };
    const installed = () => {
      this.prompt = undefined;
      this.installable.set(false);
    };
    let controlled = !!navigator.serviceWorker.controller;
    const changed = () => {
      if (controlled) {
        this.activated.set(true);
        this.updateReady.set(false);
        const shouldReload = this.requested && this.canUpdate();
        this.requested = false;
        if (shouldReload) this.changes.reload();
      }
      controlled = true;
      this.busy.set(false);
    };
    const check = () => {
      if (navigator.onLine) void this.registration?.update().catch(() => {});
    };
    window.addEventListener('beforeinstallprompt', install);
    window.addEventListener('appinstalled', installed);
    window.addEventListener('focus', check);
    navigator.serviceWorker.addEventListener('controllerchange', changed);
    destroy.onDestroy(() => {
      window.removeEventListener('beforeinstallprompt', install);
      window.removeEventListener('appinstalled', installed);
      window.removeEventListener('focus', check);
      navigator.serviceWorker.removeEventListener('controllerchange', changed);
    });
    void navigator.serviceWorker
      .register('/service-worker.js', { updateViaCache: 'none' })
      .then((reg) => {
        this.registration = reg;
        this.updateReady.set(!!reg.waiting);
        reg.addEventListener('updatefound', () => {
          const worker = reg.installing;
          worker?.addEventListener('statechange', () => {
            if (worker.state === 'installed' && navigator.serviceWorker.controller)
              this.updateReady.set(!!reg.waiting);
          });
        });
      })
      .catch(() =>
        this.error.set(
          'Instalacijski prikaz nije spreman. Aplikaciju možeš koristiti u pregledniku.',
        ),
      );
  }
  canUpdate(): boolean {
    return (
      navigator.onLine &&
      !this.changes.hasUnsafeChanges() &&
      !this.academic.busy() &&
      !this.academic.control()?.restoreToken &&
      !this.academic.datasetChanged()
    );
  }
  async install(): Promise<void> {
    const prompt = this.prompt;
    if (!prompt || this.busy()) return;
    this.busy.set(true);
    try {
      await prompt.prompt();
      await prompt.userChoice;
    } catch {
      this.error.set('Instalaciju ponovi kroz izbornik preglednika.');
    } finally {
      this.prompt = undefined;
      this.installable.set(false);
      this.busy.set(false);
    }
  }
  update(): void {
    if (!this.canUpdate() || this.busy()) return;
    if (this.activated()) {
      this.changes.reload();
      return;
    }
    const waiting = this.registration?.waiting;
    if (!waiting) return;
    this.requested = true;
    this.busy.set(true);
    waiting.postMessage({ type: 'ACTIVATE_UPDATE' });
    // A failed worker never forces a reload; the user can retry after a timeout.
    setTimeout(() => this.busy.set(false), 10000);
  }
}
