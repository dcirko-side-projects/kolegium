import { readFile } from 'node:fs/promises';
import { initializeTestEnvironment, RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, serverTimestamp, writeBatch } from 'firebase/firestore';
export const uid = 'local-owner',
  datasetId = 'initial';
export const scope = { uid, datasetId };
export async function environment(): Promise<RulesTestEnvironment> {
  return initializeTestEnvironment({
    projectId: 'demo-kolegium-tests',
    firestore: {
      host: '127.0.0.1',
      port: 18080,
      rules: await readFile('firebase/firestore.rules', 'utf8'),
    },
  });
}
export async function bootstrap(env: RulesTestEnvironment): Promise<void> {
  const db = env.authenticatedContext(uid).firestore();
  const batch = writeBatch(db);
  batch.set(doc(db, 'users', uid), {
    activeDatasetId: datasetId,
    previousDatasetId: null,
    stagingDatasetId: null,
    restoreToken: null,
    dataRevision: 0,
    schemaVersion: 1,
    updatedAt: serverTimestamp(),
  });
  batch.set(doc(db, 'users', uid, 'datasets', datasetId), {
    schemaVersion: 1,
    state: 'active',
    createdAt: serverTimestamp(),
  });
  await batch.commit();
}
export const semester = {
  name: 'Sintetički semestar',
  startsOn: '2026-10-01',
  endsOn: '2027-02-01',
  isArchived: false,
};
