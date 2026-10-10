import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { RulesTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { environment, bootstrap, scope, uid, datasetId, semester } from './support';
import { AcademicRepository } from '../../src/app/data/academic.repository';
import { unknownAttendanceRules } from '../../src/app/domain/academic.models';
import { readFile } from 'node:fs/promises';
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';

it('unconfigured production Rules deny even the local approved identity', async () => {
  const env = await initializeTestEnvironment({
    projectId: 'demo-kolegium-production-tests',
    firestore: {
      host: '127.0.0.1',
      port: 18080,
      rules: await readFile('firebase/firestore.production.rules', 'utf8'),
    },
  });
  try {
    const db = env.authenticatedContext(uid).firestore();
    await assertFails(getDoc(doc(db, 'users', uid)));
    await assertFails(setDoc(doc(db, 'users', uid), { schemaVersion: 1 }));
  } finally {
    await env.cleanup();
  }
});

describe('Default deny and academic Rules', () => {
  let env: RulesTestEnvironment;
  beforeAll(async () => {
    env = await environment();
  });
  beforeEach(async () => {
    await env.clearFirestore();
  });
  afterAll(async () => {
    await env.cleanup();
  });
  it('only approved UID can initialize and read, anonymous/other UID cannot', async () => {
    await bootstrap(env);
    await assertSucceeds(getDoc(doc(env.authenticatedContext(uid).firestore(), 'users', uid)));
    for (const db of [
      env.unauthenticatedContext().firestore(),
      env.authenticatedContext('other-user').firestore(),
    ]) {
      await assertFails(getDoc(doc(db, 'users', uid)));
      await assertFails(setDoc(doc(db, 'users', 'other-user'), { activeDatasetId: 'new' }));
      await assertFails(
        getDocs(query(collection(db, 'users', uid, 'datasets', datasetId, 'semesters'), limit(50))),
      );
    }
  });
  it('root and dataset initialization must be atomic and cannot be overwritten', async () => {
    const db = env.authenticatedContext(uid).firestore();
    await assertFails(
      setDoc(doc(db, 'users', uid), {
        activeDatasetId: datasetId,
        previousDatasetId: null,
        stagingDatasetId: null,
        restoreToken: null,
        dataRevision: 0,
        schemaVersion: 1,
        updatedAt: serverTimestamp(),
      }),
    );
    await bootstrap(env);
    await assertFails(
      updateDoc(doc(db, 'users', uid), {
        activeDatasetId: 'forged',
        dataRevision: 1,
        updatedAt: serverTimestamp(),
      }),
    );
    await assertFails(
      setDoc(doc(db, 'users', uid, 'datasets', 'forged'), {
        schemaVersion: 1,
        state: 'active',
        createdAt: serverTimestamp(),
      }),
    );
    await assertFails(deleteDoc(doc(db, 'users', uid)));
  });
  it('requires record revision, root increment, strict fields and actual calendar dates', async () => {
    await bootstrap(env);
    const db = env.authenticatedContext(uid).firestore(),
      root = doc(db, 'users', uid),
      ref = doc(db, 'users', uid, 'datasets', datasetId, 'semesters', 's1');
    const payload = { ...semester, id: 's1', revision: 1, updatedAt: serverTimestamp() };
    await assertFails(setDoc(ref, payload));
    for (const change of [
      { revision: 2 },
      { id: 'wrong' },
      { extra: true },
      { startsOn: '2026-02-30' },
      { startsOn: '2026-02-29' },
      { name: '   ' },
      { endsOn: '2026-09-01' },
    ]) {
      const batch = writeBatch(db);
      batch.set(ref, { ...payload, ...change });
      batch.update(root, { dataRevision: 1, updatedAt: serverTimestamp() });
      await assertFails(batch.commit());
    }
    const repo = new AcademicRepository(db);
    await repo.save(scope, 'semesters', 's1', semester, null);
    const batch = writeBatch(db);
    batch.update(ref, { revision: 1, name: 'stale', updatedAt: serverTimestamp() });
    batch.update(root, { dataRevision: 2, updatedAt: serverTimestamp() });
    await assertFails(batch.commit());
    await assertFails(deleteDoc(ref));
    expect((await getDoc(root)).data()?.['dataRevision']).toBe(1);
  });
  it('rejects invalid course references, nested rules and unsafe/unknown link fields including last link', async () => {
    await bootstrap(env);
    const db = env.authenticatedContext(uid).firestore(),
      repo = new AcademicRepository(db);
    await repo.save(scope, 'semesters', 's1', semester, null);
    const base = {
      id: 'c1',
      revision: 1,
      updatedAt: serverTimestamp(),
      semesterId: 's1',
      name: 'Sintetički kolegij',
      information: '',
      links: [],
      isArchived: false,
      attendanceRules: unknownAttendanceRules(),
    };
    const corrupt = [
      { semesterId: 'missing' },
      { semesterId: '../s1' },
      { attendanceRules: { ...unknownAttendanceRules(), extra: true } },
      {
        attendanceRules: {
          lecture: { total: 5, minimum: 6 },
          exercise: { total: null, minimum: null },
        },
      },
      { links: [{ label: 'Unsafe', url: 'javascript:alert(1)' }] },
      {
        links: [
          ...Array.from({ length: 19 }, () => ({ label: 'Sigurna', url: 'https://example.test' })),
          { label: 'Zadnja', url: 'https://example.test', extra: 'forged' },
        ],
      },
      { links: Array.from({ length: 21 }, () => ({ label: 'Link', url: 'https://example.test' })) },
    ];
    for (const changes of corrupt) {
      const batch = writeBatch(db);
      batch.set(doc(db, 'users', uid, 'datasets', datasetId, 'courses', 'c1'), {
        ...base,
        ...changes,
      });
      batch.update(doc(db, 'users', uid), { dataRevision: 2, updatedAt: serverTimestamp() });
      await assertFails(batch.commit());
    }
    await assertSucceeds(
      repo.save(
        scope,
        'courses',
        'c1',
        { ...base, links: [{ label: 'Sigurno', url: 'https://example.test/path' }] },
        null,
      ),
    );
  });
  it('active pointer cannot reference missing/archived semester and archive clears active atomically', async () => {
    await bootstrap(env);
    const db = env.authenticatedContext(uid).firestore(),
      repo = new AcademicRepository(db);
    await repo.save(scope, 'semesters', 's1', semester, null);
    await repo.selectSemester(scope, 's1', null);
    const batch = writeBatch(db);
    batch.update(doc(db, 'users', uid, 'datasets', datasetId, 'semesters', 's1'), {
      isArchived: true,
      revision: 2,
      updatedAt: serverTimestamp(),
    });
    batch.update(doc(db, 'users', uid), { dataRevision: 3, updatedAt: serverTimestamp() });
    await assertFails(batch.commit());
    await repo.save(scope, 'semesters', 's1', { ...semester, isArchived: true }, 1);
    expect((await repo.preferences(scope))?.activeSemesterId).toBeNull();
    await expect(repo.selectSemester(scope, 's1', 2)).rejects.toMatchObject({
      category: 'validation',
    });
    const forged = writeBatch(db);
    forged.update(doc(db, 'users', uid, 'datasets', datasetId, 'preferences', 'app'), {
      activeSemesterId: 'missing',
      revision: 3,
      updatedAt: serverTimestamp(),
    });
    forged.update(doc(db, 'users', uid), { dataRevision: 4, updatedAt: serverTimestamp() });
    await assertFails(forged.commit());
  });
  it('restore lock and stale dataset forbid normal writes, unrelated collections remain denied', async () => {
    await bootstrap(env);
    const db = env.authenticatedContext(uid).firestore(),
      repo = new AcademicRepository(db);
    await env.withSecurityRulesDisabled(async (context) => {
      await updateDoc(doc(context.firestore(), 'users', uid), {
        restoreToken: 'restore-1',
        stagingDatasetId: 'staging',
      });
    });
    await expect(repo.save(scope, 'semesters', 's1', semester, null)).rejects.toMatchObject({
      category: 'restoreInProgress',
    });
    const locked = writeBatch(db);
    locked.set(doc(db, 'users', uid, 'datasets', datasetId, 'semesters', 's1'), {
      ...semester,
      id: 's1',
      revision: 1,
      updatedAt: serverTimestamp(),
    });
    locked.update(doc(db, 'users', uid), { dataRevision: 1, updatedAt: serverTimestamp() });
    await assertFails(locked.commit());
    await env.withSecurityRulesDisabled(async (context) => {
      await updateDoc(doc(context.firestore(), 'users', uid), {
        restoreToken: null,
        stagingDatasetId: null,
        activeDatasetId: 'different',
      });
    });
    await assertFails(getDoc(doc(db, 'users', uid, 'datasets', datasetId, 'semesters', 's1')));
    await assertFails(
      setDoc(doc(db, 'users', uid, 'datasets', 'different', 'tasks', 'fake'), {
        title: 'not implemented',
      }),
    );
    await assertFails(setDoc(doc(db, 'allowlist', 'owner'), { uid }));
  });
});
