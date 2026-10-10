export interface AppEnvironment {
  mode: 'unconfigured' | 'emulator' | 'production';
  approvedUid: string;
  emulators?: { authPort: number; firestorePort: number };
  firebase: { apiKey: string; projectId: string; authDomain: string; appId: string };
}
