import { Injectable } from '@angular/core';
import { FirebaseApp, initializeApp } from 'firebase/app';
import { Auth, connectAuthEmulator, getAuth } from 'firebase/auth';
import {
  Firestore,
  connectFirestoreEmulator,
  initializeFirestore,
  memoryLocalCache,
  disableNetwork,
  enableNetwork,
} from 'firebase/firestore';
import { appEnvironment } from '../core/config/app-environment';
import { ApplicationError } from '../core/errors/application-error';

@Injectable({ providedIn: 'root' })
export class FirebaseContextService {
  readonly environment = appEnvironment;
  private app?: FirebaseApp;
  private authInstance?: Auth;
  private firestoreInstance?: Firestore;
  get configured(): boolean {
    return this.environment.mode !== 'unconfigured';
  }
  private initialize(): void {
    if (this.app) return;
    if (!this.configured || !this.environment.approvedUid)
      throw new ApplicationError('unavailable', 'Aplikacija još nema produkcijsku konfiguraciju.');
    if (
      this.environment.mode === 'emulator' &&
      (!this.environment.firebase.projectId.startsWith('demo-') ||
        !['127.0.0.1', 'localhost'].includes(location.hostname))
    )
      throw new ApplicationError(
        'forbidden',
        'Lokalna konfiguracija dopuštena je samo na ovom računalu.',
      );
    if (
      this.environment.mode === 'production' &&
      this.environment.firebase.projectId.startsWith('demo-')
    )
      throw new ApplicationError('validation', 'Produkcijska konfiguracija nije valjana.');
    this.app = initializeApp(this.environment.firebase);
    this.authInstance = getAuth(this.app);
    this.firestoreInstance = initializeFirestore(this.app, { localCache: memoryLocalCache() });
    if (this.environment.mode === 'emulator') {
      const ports = this.environment.emulators;
      if (!ports)
        throw new ApplicationError('validation', 'Lokalni emulator portovi nisu postavljeni.');
      connectAuthEmulator(this.authInstance, `http://127.0.0.1:${ports.authPort}`, {
        disableWarnings: true,
      });
      connectFirestoreEmulator(this.firestoreInstance, '127.0.0.1', ports.firestorePort);
    }
  }
  get auth(): Auth {
    this.initialize();
    return this.authInstance!;
  }
  get firestore(): Firestore {
    this.initialize();
    return this.firestoreInstance!;
  }
  async setOnline(online: boolean): Promise<void> {
    if (!this.firestoreInstance) return;
    if (online) await enableNetwork(this.firestoreInstance);
    else await disableNetwork(this.firestoreInstance);
  }
}
