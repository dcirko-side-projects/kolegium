import type { AppEnvironment } from './app-environment.model';
export const appEnvironment: AppEnvironment = {
  mode: 'emulator',
  approvedUid: 'local-owner',
  emulators: { authPort: 9099, firestorePort: 8080 },
  firebase: {
    apiKey: 'demo-api-key',
    projectId: 'demo-kolegium',
    authDomain: 'demo-kolegium.firebaseapp.com',
    appId: 'demo-kolegium-web',
  },
};
