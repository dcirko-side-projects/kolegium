import { Injectable, inject } from '@angular/core';
import {
  Firestore,
  connectFirestoreEmulator,
  disableNetwork,
  enableNetwork,
  initializeFirestore,
  memoryLocalCache,
} from 'firebase/firestore';
import { FirebaseContextService } from './firebase-context.service';

// Loaded with the private routes; signing in does not load the database SDK.
@Injectable({ providedIn: 'root' })
export class FirestoreContextService {
  private readonly context = inject(FirebaseContextService);
  private instance?: Firestore;

  get firestore(): Firestore {
    if (!this.instance) {
      this.instance = initializeFirestore(this.context.firebaseApp, {
        localCache: memoryLocalCache(),
        // WebKit on Windows can buffer the emulator's open HTTP stream after a
        // reload. Close each response promptly on the loopback test transport.
        ...(this.context.environment.mode === 'emulator'
          ? {
              experimentalForceLongPolling: true,
              experimentalLongPollingOptions: { timeoutSeconds: 5 },
            }
          : {}),
      });
      if (this.context.environment.mode === 'emulator') {
        const ports = this.context.environment.emulators!;
        connectFirestoreEmulator(this.instance, '127.0.0.1', ports.firestorePort);
      }
    }
    return this.instance;
  }

  async setOnline(online: boolean): Promise<void> {
    if (!this.instance) return;
    if (online) await enableNetwork(this.instance);
    else await disableNetwork(this.instance);
  }
}
