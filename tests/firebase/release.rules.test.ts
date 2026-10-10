import { readFile } from 'node:fs/promises';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
  RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { doc, getDoc, serverTimestamp, setDoc, updateDoc, writeBatch } from 'firebase/firestore';
import { appEnvironment } from '../../src/app/core/config/app-environment';

describe('Prepared release authorization on isolated emulator', () => {
  let env: RulesTestEnvironment;
  const uid = appEnvironment.approvedUid;
  beforeAll(async () => {
    const rules = await readFile('firebase/firestore.release.rules', 'utf8');
    const source = await readFile('firebase/firestore.rules', 'utf8');
    expect(rules).toBe(source.replace("uid == 'local-owner'", `uid == '${uid}'`));
    const config = JSON.parse(await readFile('firebase.json', 'utf8'));
    expect(config.firestore.rules).toBe('firebase/firestore.production.rules');
    env = await initializeTestEnvironment({
      projectId: 'demo-kolegium-tests',
      firestore: { host: '127.0.0.1', port: 18080, rules },
    });
  });
  beforeEach(async () => {
    await env.clearFirestore();
  });
  afterAll(async () => {
    await env?.cleanup();
  });
  it('permits owner atomic initialization and rejects anonymous, other and emulator identities', async () => {
    const db = env.authenticatedContext(uid).firestore();
    const batch = writeBatch(db);
    batch.set(doc(db, 'users', uid), {
      activeDatasetId: 'initial',
      previousDatasetId: null,
      stagingDatasetId: null,
      restoreToken: null,
      dataRevision: 0,
      schemaVersion: 1,
      updatedAt: serverTimestamp(),
    });
    batch.set(doc(db, 'users', uid, 'datasets', 'initial'), {
      schemaVersion: 1,
      state: 'active',
      createdAt: serverTimestamp(),
    });
    await assertSucceeds(batch.commit());
    await assertSucceeds(getDoc(doc(db, 'users', uid)));
    for (const client of [
      env.unauthenticatedContext(),
      env.authenticatedContext('other-user'),
      env.authenticatedContext('local-owner'),
    ]) {
      await assertFails(getDoc(doc(client.firestore(), 'users', uid)));
      await assertFails(
        setDoc(doc(client.firestore(), 'users', uid, 'datasets', 'initial', 'tasks', 'forged'), {
          title: 'forged',
        }),
      );
    }
    await assertFails(getDoc(doc(db, 'users', 'other-user')));
    await assertFails(updateDoc(doc(db, 'users', uid), { activeDatasetId: 'forged' }));
    await assertFails(setDoc(doc(db, 'allowlist', uid), { allowed: true }));
  });
  it('default deployment Rules stay closed even for the real owner', async () => {
    await env.cleanup();
    env = await initializeTestEnvironment({
      projectId: 'demo-kolegium-tests',
      firestore: {
        host: '127.0.0.1',
        port: 18080,
        rules: await readFile('firebase/firestore.production.rules', 'utf8'),
      },
    });
    await assertFails(getDoc(doc(env.authenticatedContext(uid).firestore(), 'users', uid)));
    await assertFails(
      setDoc(doc(env.authenticatedContext(uid).firestore(), 'users', uid), { schemaVersion: 1 }),
    );
  });
});
