import type { AppEnvironment } from './app-environment.model';
import { firebaseProject } from './firebase-project';
export const appEnvironment: AppEnvironment = {
  ...firebaseProject,
  mode: 'unconfigured',
};
