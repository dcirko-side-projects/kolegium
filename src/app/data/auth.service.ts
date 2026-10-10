import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import {
  GoogleAuthProvider,
  User,
  browserLocalPersistence,
  getRedirectResult,
  onAuthStateChanged,
  setPersistence,
  signInWithCredential,
  signInWithPopup,
  signInWithRedirect,
  signOut,
} from 'firebase/auth';
import { FirebaseContextService } from './firebase-context.service';
import { ApplicationError, asApplicationError } from '../core/errors/application-error';
import { UnsavedChangesService } from '../core/forms/unsaved-changes.service';

export type AuthStatus =
  'loading' | 'signedOut' | 'allowed' | 'forbidden' | 'unconfigured' | 'error';
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly context = inject(FirebaseContextService);
  private readonly destroy = inject(DestroyRef);
  private readonly changes = inject(UnsavedChangesService);
  readonly status = signal<AuthStatus>(this.context.configured ? 'loading' : 'unconfigured');
  readonly user = signal<Pick<User, 'uid' | 'displayName' | 'email'> | null>(null);
  readonly error = signal<string | null>(null);
  readonly busy = signal(false);
  readonly isLocal = this.context.environment.mode === 'emulator';
  readonly projectId = this.context.environment.firebase.projectId;
  readonly ready: Promise<void>;
  constructor() {
    this.ready = this.initialize();
  }
  private async initialize(): Promise<void> {
    if (!this.context.configured) return;
    try {
      const auth = this.context.auth;
      try {
        await setPersistence(auth, browserLocalPersistence);
        await getRedirectResult(auth);
      } catch (error) {
        // A failed redirect/persistence setup must not prevent observing a later login.
        this.error.set(asApplicationError(error).message);
      }
      await new Promise<void>((resolve) => {
        const stop = onAuthStateChanged(
          auth,
          (user) => {
            this.user.set(
              user ? { uid: user.uid, displayName: user.displayName, email: user.email } : null,
            );
            this.status.set(
              !user
                ? 'signedOut'
                : user.uid === this.context.environment.approvedUid
                  ? 'allowed'
                  : 'forbidden',
            );
            if (user && user.uid === this.context.environment.approvedUid)
              this.changes.beginSession(user.uid);
            else if (user) this.changes.discardDrafts();
            resolve();
          },
          (error) => {
            this.error.set(asApplicationError(error).message);
            this.status.set('error');
            resolve();
          },
        );
        this.destroy.onDestroy(stop);
      });
    } catch (error) {
      this.error.set(asApplicationError(error).message);
      this.status.set('error');
    }
  }
  async login(): Promise<void> {
    this.busy.set(true);
    this.error.set(null);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      if (this.isLocal) {
        await signInWithCredential(
          this.context.auth,
          GoogleAuthProvider.credential(
            JSON.stringify({
              sub: 'local-owner-google',
              email: 'owner@example.test',
              email_verified: true,
              name: 'Lokalni testni račun',
            }),
          ),
        );
      } else if (matchMedia('(max-width: 767px)').matches)
        await signInWithRedirect(this.context.auth, provider);
      else await signInWithPopup(this.context.auth, provider);
    } catch (error) {
      this.error.set(asApplicationError(error).message);
    } finally {
      this.busy.set(false);
    }
  }
  async logout(): Promise<void> {
    this.changes.discardDrafts();
    try {
      await signOut(this.context.auth);
      this.error.set(null);
    } catch (error) {
      this.error.set(asApplicationError(error).message);
      throw asApplicationError(error);
    }
  }
  requireUid(): string {
    if (this.status() !== 'allowed' || !this.user())
      throw new ApplicationError(
        this.status() === 'forbidden' ? 'forbidden' : 'unauthenticated',
        'Za pristup podacima potrebna je odobrena prijava.',
      );
    return this.user()!.uid;
  }
}
