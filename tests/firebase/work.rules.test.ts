import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { RulesTestEnvironment, assertFails } from '@firebase/rules-unit-testing';
import { doc, getDoc, serverTimestamp, writeBatch, updateDoc } from 'firebase/firestore';
import { environment, semester, uid } from './support';
import { AcademicRepository } from '../../src/app/data/academic.repository';
import { WorkRepository } from '../../src/app/data/work.repository';
import { ActiveScope, unknownAttendanceRules } from '../../src/app/domain/academic.models';
describe('Work Rules boundaries', () => {
  let env: RulesTestEnvironment, scope: ActiveScope, repo: WorkRepository;
  beforeAll(async () => {
    env = await environment();
  });
  afterAll(async () => env.cleanup());
  beforeEach(async () => {
    await env.clearFirestore();
    const db = env.authenticatedContext(uid).firestore(),
      academic = new AcademicRepository(db);
    repo = new WorkRepository(db);
    scope = { uid, datasetId: (await academic.initialize(uid)).activeDatasetId };
    await academic.save(scope, 'semesters', 's1', semester, null);
    await academic.save(
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
  async function raw(name: string, id: string, payload: Record<string, unknown>) {
    const db = env.authenticatedContext(uid).firestore(),
      root = await getDoc(doc(db, 'users', uid)),
      batch = writeBatch(db);
    batch.set(doc(db, 'users', uid, 'datasets', scope.datasetId, name, id), {
      id,
      revision: 1,
      updatedAt: serverTimestamp(),
      ...payload,
    });
    batch.update(root.ref, {
      dataRevision: root.data()!['dataRevision'] + 1,
      updatedAt: serverTimestamp(),
    });
    return batch.commit();
  }
  it('rejects invalid dates/parent refs/unknown fields and multiple context links', async () => {
    await assertFails(
      raw('assessments', 'a1', {
        courseId: 'c1',
        name: 'A',
        type: 'exam',
        scheduledOn: '2026-02-30',
        scheduledAt: null,
        isCompleted: false,
      }),
    );
    await assertFails(
      raw('projects', 'p1', {
        courseId: 'missing',
        name: 'P',
        dueOn: null,
        isCompleted: false,
        isArchived: false,
      }),
    );
    await assertFails(
      raw('tasks', 't1', {
        title: 'T',
        dueOn: null,
        isCompleted: false,
        context: { type: 'none', id: 'c1' },
      }),
    );
    await assertFails(
      raw('tasks', 't2', {
        title: 'T',
        dueOn: null,
        isCompleted: false,
        context: { type: 'none', id: null, courseId: 'c1' },
      }),
    );
    await assertFails(raw('thesis', 'other', { topic: null, mentor: null, information: '' }));
    await assertFails(
      raw('thesis', 'main', { topic: null, mentor: null, information: '', secret: 'unexpected' }),
    );
  });
  it('requires canonical source identity, deterministic attempts and valid decimal/null/grade shapes', async () => {
    await repo.save(
      scope,
      'projects',
      'p1',
      { courseId: null, name: 'P', dueOn: null, isCompleted: false, isArchived: false },
      null,
    );
    const activity = {
      courseId: null,
      name: 'P',
      source: { type: 'project', id: 'p1' },
      componentKey: null,
      maxPoints: null,
      minimumPoints: null,
    };
    await assertFails(raw('scoreActivities', 'duplicate', activity));
    await repo.saveAttempt(
      scope,
      'project',
      'p1',
      { activityId: 'project_p1', attemptNumber: 1, takenOn: null, points: '0', grade: 'B+' },
      null,
    );
    await assertFails(
      raw('scoreAttempts', 'wrong', {
        activityId: 'project_p1',
        attemptNumber: 2,
        takenOn: null,
        points: '4',
        grade: null,
      }),
    );
    await assertFails(
      raw('scoreAttempts', 'project_p1_2', {
        activityId: 'project_p1',
        attemptNumber: 2,
        takenOn: null,
        points: '100000.0001',
        grade: null,
      }),
    );
    await assertFails(
      raw('scoreAttempts', 'project_p1_2', {
        activityId: 'project_p1',
        attemptNumber: 2,
        takenOn: null,
        points: 4,
        grade: null,
      }),
    );
    expect((await repo.attempts(scope, 'project', 'p1')).attempts[0].points).toBe('0');
  });
  it('denies other/anonymous identities, untransactional writes, lock and hard deletes', async () => {
    await repo.save(scope, 'thesis', 'main', { topic: null, mentor: null, information: '' }, null);
    for (const context of [env.authenticatedContext('other'), env.unauthenticatedContext()])
      await assertFails(
        getDoc(
          doc(context.firestore(), 'users', uid, 'datasets', scope.datasetId, 'thesis', 'main'),
        ),
      );
    const db = env.authenticatedContext(uid).firestore();
    await assertFails(
      updateDoc(doc(db, 'users', uid, 'datasets', scope.datasetId, 'thesis', 'main'), {
        topic: 'T',
        revision: 2,
        updatedAt: serverTimestamp(),
      }),
    );
    const batch = writeBatch(db);
    batch.delete(doc(db, 'users', uid, 'datasets', scope.datasetId, 'thesis', 'main'));
    await assertFails(batch.commit());
    await env.withSecurityRulesDisabled(async (context) => {
      await updateDoc(doc(context.firestore(), 'users', uid), { restoreToken: 'locked' });
    });
    await expect(
      repo.save(scope, 'thesis', 'main', { topic: 'T', mentor: null, information: '' }, 1),
    ).rejects.toMatchObject({ category: 'restoreInProgress' });
    await assertFails(
      raw('tasks', 't1', {
        title: 'T',
        dueOn: null,
        isCompleted: false,
        context: { type: 'none', id: null },
      }),
    );
  });
});
