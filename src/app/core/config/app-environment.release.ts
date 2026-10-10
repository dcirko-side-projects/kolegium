import { firebaseProject } from './firebase-project';
import type { AppEnvironment } from './app-environment.model';

export const appEnvironment: AppEnvironment = {
  ...firebaseProject,
  mode: 'production',
};
