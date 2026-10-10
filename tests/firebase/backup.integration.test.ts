import { afterAll, beforeAll, beforeEach, describe, it, expect } from 'vitest';
import { RulesTestEnvironment, assertFails } from '@firebase/rules-unit-testing';
import {
  Firestore,
  doc,
  getDoc,
  getDocs,
  collection,
  updateDoc,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { environment, bootstrap, uid, scope, semester } from './support';
import { BackupRepository, RestorePhase } from '../../src/app/data/backup.repository';
import { AcademicRepository } from '../../src/app/data/academic.repository';
import {
  BackupEnvelope,
  backupCollections,
  canonical,
  validateBackup,
} from '../../src/app/domain/backup';
function fixture(): BackupEnvelope {
  const collections = Object.fromEntries(
    backupCollections.map((n) => [n, []]),
  ) as BackupEnvelope['collections'];
  collections.semesters = [
    { id: 's1', ...semester },
    { id: 's2', ...semester, name: 'Sintetička arhiva', isArchived: true },
  ];
  collections.courses = [
    {
      id: 'c1',
      semesterId: 's1',
      name: 'C',
      information: '',
      links: [],
      isArchived: false,
      attendanceRules: {
        lecture: { total: null, minimum: null },
        exercise: { total: 15, minimum: 10 },
      },
    },
  ];
  collections.scheduleTemplates = [
    {
      id: 't1',
      courseId: 'c1',
      kind: 'lecture',
      weekday: 4,
      startsAt: '10:00',
      endsAt: '11:00',
      location: null,
      validFrom: '2026-10-01',
      validUntil: '2027-02-01',
    },
  ];
  // Recorded time intentionally differs from the currently edited template: preserve history.
  collections.sessions = [
    {
      id: 't1_2026-10-01',
      courseId: 'c1',
      templateId: 't1',
      scheduledOn: '2026-10-01',
      startsAt: '08:00',
      endsAt: '09:00',
      kind: 'lecture',
      location: null,
      isCancelled: false,
      attendance: 'present',
      replacementForId: null,
    },
  ];
  collections.assessments = [
    {
      id: 'a1',
      courseId: 'c1',
      name: 'Kolokvij',
      type: 'quiz',
      scheduledOn: '2026-10-15',
      scheduledAt: null,
      isCompleted: true,
    },
  ];
  collections.projects = [
    {
      id: 'p1',
      courseId: 'c1',
      name: 'Projekt',
      dueOn: null,
      isCompleted: false,
      isArchived: false,
    },
  ];
  collections.thesis = [{ id: 'main', topic: null, mentor: null, information: '' }];
  collections.tasks = [
    {
      id: 'task1',
      title: 'Sintetički zadatak',
      dueOn: null,
      isCompleted: false,
      context: { type: 'thesis', id: 'main' },
    },
  ];
  collections.scoreActivities = [
    {
      id: 'assessment_a1',
      courseId: 'c1',
      name: 'Kolokvij',
      source: { type: 'assessment', id: 'a1' },
      componentKey: 'all',
      maxPoints: '100',
      minimumPoints: '0',
    },
  ];
  collections.scoreAttempts = [
    {
      id: 'assessment_a1_1',
      activityId: 'assessment_a1',
      attemptNumber: 1,
      takenOn: null,
      points: '0',
      grade: null,
    },
    {
      id: 'assessment_a1_2',
      activityId: 'assessment_a1',
      attemptNumber: 2,
      takenOn: null,
      points: null,
      grade: null,
    },
  ];
  collections.gradingRules = [
    {
      id: 'c1',
      components: [{ key: 'all', label: 'Sve', maxPoints: '100', minimumPoints: '0' }],
      scale: [{ grade: 'Sintetička', minInclusive: '0', maxExclusive: null }],
      countedAttemptIds: ['assessment_a1_1'],
      projectPointsIncluded: false,
      roundingPolicy: 'none',
      isConfirmed: false,
    },
  ];
  collections.courseOutcomes = [{ id: 'c1', officialGrade: null, officialPoints: null }];
  collections.installments = [
    { id: 'r1', name: 'Rata', amountCents: 1234, dueOn: '2026-10-15', isPaid: false },
  ];
  collections.preferences = [{ id: 'app', activeSemesterId: 's1' }];
  return validateBackup({
    format: 'kolegium-backup',
    schemaVersion: 1,
    exportedAt: '2026-10-10T00:00:00.000Z',
    collections,
  });
}
describe('Frozen staged backup and recovery', () => {
  let env: RulesTestEnvironment, firestore: Firestore;
  beforeAll(async () => {
    env = await environment();
  });
  afterAll(async () => env?.cleanup());
  beforeEach(async () => {
    await env.clearFirestore();
    await bootstrap(env);
    firestore = env.authenticatedContext(uid).firestore();
  });
  const db = () => firestore;
  it('restores maximum six-component configuration with one hundred explicit selections within Rules budget', async () => {
    const input = fixture();
    const selected: string[] = [];
    for (let i = 0; i < 100; i++) {
      const id = 'exercise_c1_max' + i;
      input.collections.scoreActivities.push({
        id,
        courseId: 'c1',
        name: 'Synthetic maximum ' + i,
        source: { type: 'exercise', id: null },
        componentKey: 'k0',
        maxPoints: '100000.0000',
        minimumPoints: '0.0000',
      });
      input.collections.scoreAttempts.push({
        id: id + '_1',
        activityId: id,
        attemptNumber: 1,
        takenOn: null,
        points: '0.0000',
        grade: null,
      });
      selected.push(id + '_1');
    }
    input.collections.gradingRules = [
      {
        id: 'c1',
        components: Array.from({ length: 6 }, (_, i) => ({
          key: 'k' + i,
          label: 'Component ' + i,
          maxPoints: '100000.0000',
          minimumPoints: '0.0000',
        })),
        scale: [],
        countedAttemptIds: selected,
        projectPointsIncluded: false,
        roundingPolicy: 'none',
        isConfirmed: false,
      },
    ];
    const repo = new BackupRepository(db());
    await repo.restore(uid, input, 0);
    expect(canonical((await repo.export(uid)).collections)).toBe(
      canonical(validateBackup(input).collections),
    );
  });
  it('restores all collections/archived semesters/unknown and zero attempts, retains old copy and exports without credentials', async () => {
    const repo = new BackupRepository(db()),
      input = fixture();
    await repo.restore(uid, input, 0);
    const result = await repo.export(uid);
    expect(canonical(result.collections)).toBe(canonical(input.collections));
    expect(JSON.stringify(result)).not.toMatch(/updatedAt|revision|local-owner|restoreToken/);
    expect((await repo.export(uid, true)).collections.courses).toEqual([]);
    const root = await new AcademicRepository(db()).readControl(uid);
    expect(root.previousDatasetId).toBe(scope.datasetId);
    expect(root.restoreToken).toBeNull();
    await assertFails(
      updateDoc(doc(db(), 'users', uid, 'datasets', scope.datasetId, 'semesters', 'illegal'), {
        name: 'old',
      }),
    );
    await expect(repo.cleanup(uid, root.activeDatasetId)).rejects.toMatchObject({
      category: 'forbidden',
    });
    await expect(repo.cleanup(uid, root.previousDatasetId!)).rejects.toMatchObject({
      category: 'forbidden',
    });
  });
  it('rejects malformed graph and stale approval before lock; export race gives conflict', async () => {
    const repo = new BackupRepository(db()),
      bad = fixture();
    bad.collections.courses[0]['semesterId'] = 'missing';
    await expect(repo.restore(uid, bad, 0)).rejects.toMatchObject({ category: 'invalidBackup' });
    expect((await new AcademicRepository(db()).readControl(uid)).restoreToken).toBeNull();
    await expect(repo.start(uid, 99)).rejects.toMatchObject({ category: 'conflict' });
    const racing = new BackupRepository(
      db(),
      () => true,
      async (p) => {
        if (p === 'exportRead')
          await new AcademicRepository(db()).save(scope, 'semesters', 's1', semester, null);
      },
    );
    await expect(racing.export(uid)).rejects.toMatchObject({ category: 'conflict' });
  });
  for (const phase of [
    'locked',
    'uploaded',
    'frozen',
    'verified',
    'beforeCommit',
  ] as RestorePhase[])
    it(
      'interruption at ' +
        phase +
        ' leaves old active; another device can abort and cleanup safely',
      async () => {
        const repo = new BackupRepository(
          db(),
          () => true,
          async (p) => {
            if (p === phase) throw new Error('Synthetic interruption');
          },
        );
        await expect(repo.restore(uid, fixture(), 0)).rejects.toThrow();
        const other = new BackupRepository(db()),
          control = await new AcademicRepository(db()).readControl(uid);
        expect(control.activeDatasetId).toBe(scope.datasetId);
        expect(control.restoreToken).not.toBeNull();
        await expect(
          new AcademicRepository(db()).save(scope, 'semesters', 'blocked', semester, null),
        ).rejects.toThrow();
        await other.abort(uid);
        expect((await new AcademicRepository(db()).readControl(uid)).restoreToken).toBeNull();
        expect(await other.orphans(uid)).toContain(control.stagingDatasetId);
        await other.cleanup(uid, control.stagingDatasetId!);
        expect(
          (await getDoc(doc(db(), 'users', uid, 'datasets', control.stagingDatasetId!))).exists(),
        ).toBe(false);
        expect(
          (await getDocs(collection(db(), 'users', uid, 'datasets', scope.datasetId, 'semesters')))
            .empty,
        ).toBe(true);
      },
    );
  it('freezes staging writes, detects readback difference and treats lost final response as successful activation', async () => {
    const repo = new BackupRepository(db()),
      ticket = await repo.start(uid, 0),
      input = fixture();
    await repo.upload(ticket, input);
    await repo.freeze(ticket);
    const batch = writeBatch(db());
    batch.set(doc(db(), 'users', uid, 'datasets', ticket.newId, 'installments', 'late'), {
      id: 'late',
      name: 'Late',
      amountCents: 1,
      dueOn: '2026-10-15',
      isPaid: false,
      revision: 1,
      updatedAt: serverTimestamp(),
    });
    await assertFails(batch.commit());
    const mismatch = fixture();
    mismatch.collections.installments[0]['amountCents'] = 5;
    await expect(repo.verify(ticket, mismatch)).rejects.toMatchObject({
      category: 'invalidBackup',
    });
    await repo.abort(uid);
    const revision = (await new AcademicRepository(db()).readControl(uid)).dataRevision;
    const lost = new BackupRepository(
      db(),
      () => true,
      async (p) => {
        if (p === 'committed') throw new Error('Response lost');
      },
    );
    await lost.restore(uid, input, revision);
    expect(canonical((await lost.export(uid)).collections)).toBe(canonical(input.collections));
    for (const client of [env.unauthenticatedContext(), env.authenticatedContext('other')])
      await assertFails(getDoc(doc(client.firestore(), 'users', uid)));
  });
});
