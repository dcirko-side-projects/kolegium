import { DestroyRef, Injectable, inject } from '@angular/core';
import { CanDeactivateFn } from '@angular/router';
@Injectable({ providedIn: 'root' })
export class UnsavedChangesService {
  private readonly forms = new Set<() => boolean>();
  private allowUnload = false;
  private readonly pending = new Set<() => boolean>();
  constructor() {
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (!this.allowUnload && this.hasUnsafeChanges()) {
        event.preventDefault();
        event.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', beforeUnload);
    inject(DestroyRef).onDestroy(() => window.removeEventListener('beforeunload', beforeUnload));
  }
  registerPending(check: () => boolean): () => void {
    this.pending.add(check);
    return () => this.pending.delete(check);
  }
  private permitNext = false;
  private draftUid: string | null = null;
  private draftsEnabled = false;
  private readonly drafts = new Map<string, unknown>();
  beginSession(uid: string): void {
    if (this.draftUid !== uid) this.drafts.clear();
    this.draftUid = uid;
    this.draftsEnabled = true;
  }
  discardDrafts(): void {
    this.draftsEnabled = false;
    this.drafts.clear();
  }
  keepDraft(key: string, value: unknown): void {
    if (this.draftsEnabled) this.drafts.set(key, value);
  }
  takeDraft<T>(key: string): T | undefined {
    const value = this.drafts.get(key);
    this.drafts.delete(key);
    return value as T | undefined;
  }
  register(dirty: () => boolean): () => void {
    this.forms.add(dirty);
    return () => this.forms.delete(dirty);
  }
  hasUnsafeChanges(): boolean {
    return [...this.forms, ...this.pending].some((check) => check());
  }
  reload(): void {
    if (!this.confirm()) return;
    this.discardDrafts();
    this.allowUnload = true;
    window.location.reload();
  }
  confirm(): boolean {
    if ([...this.pending].some((check) => check())) return false;
    return (
      ![...this.forms].some((dirty) => dirty()) ||
      window.confirm('Postoje nespremljene izmjene. Želiš li ih odbaciti?')
    );
  }
  permitNavigation(): void {
    this.permitNext = true;
  }
  canLeave(): boolean {
    if (this.permitNext) {
      this.permitNext = false;
      return true;
    }
    return this.confirm();
  }
}
export interface EditablePage {
  canLeave(): boolean;
}
export const unsavedChangesGuard: CanDeactivateFn<EditablePage> = (component) =>
  component.canLeave();
