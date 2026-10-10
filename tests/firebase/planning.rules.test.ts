import { afterAll, beforeAll, beforeEach, describe, it, expect } from 'vitest';
import { RulesTestEnvironment, assertFails } from '@firebase/rules-unit-testing';
import { doc, getDoc, writeBatch, serverTimestamp, updateDoc } from 'firebase/firestore';
import { environment, semester, uid } from './support';
import { AcademicRepository } from '../../src/app/data/academic.repository';
import { PlanningRepository } from '../../src/app/data/planning.repository';
import { WorkRepository } from '../../src/app/data/work.repository';
import { ActiveScope, unknownAttendanceRules } from '../../src/app/domain/academic.models';
import { ScoreActivity } from '../../src/app/domain/work.models';
describe('Planning Rules boundaries', () => {
  let env: RulesTestEnvironment, scope: ActiveScope;
  beforeAll(async () => {
    env = await environment();
  });
  afterAll(async () => env?.cleanup());
  beforeEach(async () => {
    await env.clearFirestore();
    const db = env.authenticatedContext(uid).firestore(),
      repo = new AcademicRepository(db);
    scope = { uid, datasetId: (await repo.initialize(uid)).activeDatasetId };
    await repo.save(scope, 'semesters', 's1', semester, null);
    await repo.save(
      scope,
      'courses',
      'c1',
      {
        semesterId: 's1',
        name: 'C',
        information: '',
        links: [],
        isArchived: false,
        attendanceRules: unknownAttendanceRules(),
      },
      null,
    );
  });
  async function raw(name: string, id: string, payload: Record<string, unknown>, revision = 1) {
    const db = env.authenticatedContext(uid).firestore(),
      root = await getDoc(doc(db, 'users', uid)),
      batch = writeBatch(db);
    batch.set(doc(db, 'users', uid, 'datasets', scope.datasetId, name, id), {
      ...payload,
      id,
      revision,
      updatedAt: serverTimestamp(),
    });
    batch.update(root.ref, {
      dataRevision: root.data()!['dataRevision'] + 1,
      updatedAt: serverTimestamp(),
    });
    return batch.commit();
  }
  it('enforces cents/date/status/closed shapes and rejects foreign identity and lock', async () => {
    const v = { name: 'Rata', amountCents: 1234, dueOn: '2026-10-10', isPaid: false };
    for (const patch of [
      { amountCents: 1.1 },
      { amountCents: 0 },
      { amountCents: 1000000001 },
      { dueOn: '2026-02-30' },
      { isPaid: 'yes' },
      { extra: true },
    ])
      await assertFails(raw('installments', 'r1', { ...v, ...patch }));
    await raw('installments', 'r1', v);
    for (const c of [env.unauthenticatedContext(), env.authenticatedContext('other')])
      await assertFails(
        getDoc(doc(c.firestore(), 'users', uid, 'datasets', scope.datasetId, 'installments', 'r1')),
      );
    await env.withSecurityRulesDisabled((c) =>
      updateDoc(doc(c.firestore(), 'users', uid), { restoreToken: 'lock' }),
    );
    await assertFails(raw('installments', 'r1', { ...v, isPaid: true }, 2));
  });
  it('enforces activity source/course immutability and maximum on attempts', async () => {
    const db = env.authenticatedContext(uid).firestore(),
      repo = new WorkRepository(db);
    const v = {
      name: 'Vježba',
      courseId: 'c1',
      source: { type: 'exercise', id: null },
      componentKey: null,
      maxPoints: '5',
      minimumPoints: null,
    };
    await assertFails(raw('scoreActivities', 'wrong', v));
    await assertFails(
      raw('scoreActivities', 'exercise_c1_a', { ...v, source: { type: 'exercise', id: 'fake' } }),
    );
    await repo.saveActivity(scope, 'exercise_c1_a', v as ScoreActivity, null);
    await assertFails(
      raw('scoreAttempts', 'exercise_c1_a_1', {
        activityId: 'exercise_c1_a',
        attemptNumber: 1,
        takenOn: null,
        points: '5.0001',
        grade: null,
      }),
    );
    await repo.saveAttempt(
      scope,
      'exercise',
      'exercise_c1_a',
      { activityId: 'exercise_c1_a', attemptNumber: 1, takenOn: null, points: '0', grade: null },
      null,
    );
    await assertFails(
      raw('scoreActivities', 'exercise_c1_a', { ...v, source: { type: 'lecture', id: null } }, 2),
    );
  });
  it('validates all selected ID types and maximum nested configuration within Rules limits', async () => {
    const countedAttemptIds = Array.from({ length: 100 }, (_, i) => 'attempt_' + i);
    let revision = 1;
    for (let count = 0; count <= 6; count++) {
      const input = {
        components: Array.from({ length: count }, (_, i) => ({
          key: 'k' + i,
          label: 'C' + i,
          maxPoints: '100000.0000',
          minimumPoints: '0.0000',
        })),
        scale: Array.from({ length: 6 - count }, (_, i) => ({
          grade: 'G' + i,
          minInclusive: String(i),
          maxExclusive: String(i + 1),
        })),
        countedAttemptIds,
        projectPointsIncluded: false,
        roundingPolicy: 'none',
        isConfirmed: false,
      };
      await raw('gradingRules', 'c1', input, revision++);
    }
    await assertFails(
      raw(
        'gradingRules',
        'c1',
        {
          components: [],
          scale: [],
          countedAttemptIds: [...countedAttemptIds.slice(0, 99), 42],
          projectPointsIncluded: false,
          roundingPolicy: 'none',
          isConfirmed: false,
        },
        revision,
      ),
    );
  });
  it('closes nested config/outcome fields, checks parent and retains independent official result', async () => {
    const config = {
      components: [{ key: 'all', label: 'Sve', maxPoints: '100', minimumPoints: '0' }],
      scale: [{ grade: 'X', minInclusive: '0', maxExclusive: null }],
      countedAttemptIds: [],
      projectPointsIncluded: null,
      roundingPolicy: null,
      isConfirmed: false,
    };
    await assertFails(raw('gradingRules', 'missing', config));
    await assertFails(
      raw('gradingRules', 'c1', {
        ...config,
        components: [{ ...config.components[0], extra: true }],
      }),
    );
    await assertFails(
      raw('gradingRules', 'c1', {
        ...config,
        scale: [{ grade: 'X', minInclusive: '2', maxExclusive: '1' }],
      }),
    );
    await assertFails(raw('courseOutcomes', 'c1', { officialGrade: null, officialPoints: 0 }));
    const repo = new PlanningRepository(env.authenticatedContext(uid).firestore());
    await repo.save(scope, 'gradingRules', 'c1', config, null);
    await repo.save(
      scope,
      'courseOutcomes',
      'c1',
      { officialGrade: 'X', officialPoints: '0' },
      null,
    );
    expect(await repo.get(scope, 'courseOutcomes', 'c1')).toMatchObject({
      officialPoints: '0',
      officialGrade: 'X',
    });
  });
});
