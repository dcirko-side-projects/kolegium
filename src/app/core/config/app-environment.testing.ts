import type { AppEnvironment } from './app-environment.model';
export const appEnvironment: AppEnvironment = {
  mode: 'emulator',
  approvedUid: 'local-owner',
  emulators: { authPort: 19099, firestorePort: 18080 },
  firebase: {
    apiKey: 'demo-api-key',
    projectId: 'demo-kolegium-tests',
    authDomain: 'demo-kolegium-tests.firebaseapp.com',
    appId: 'demo-kolegium-tests-web',
  },
};
