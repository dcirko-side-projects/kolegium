import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { environment, semester, uid } from './support';
import { AcademicRepository } from '../../src/app/data/academic.repository';
import { WorkRepository } from '../../src/app/data/work.repository';
import { ActiveScope, unknownAttendanceRules } from '../../src/app/domain/academic.models';
import {
  AssessmentInput,
  ProjectInput,
  Task,
  ScoreAttempt,
} from '../../src/app/domain/work.models';
import { activityId } from '../../src/app/domain/work.validation';
export const assessment: AssessmentInput = {
  courseId: 'c1',
  name: 'Sintetički ispit',
  type: 'exam',
  scheduledOn: '2026-10-15',
  scheduledAt: null,
  isCompleted: false,
};
export const projectInput: ProjectInput = {
  courseId: 'c1',
  name: 'Sintetički projekt',
  dueOn: null,
  isCompleted: false,
  isArchived: false,
};
describe('Work SDK invariants', () => {
  let env: RulesTestEnvironment,
    academic: AcademicRepository,
    repo: WorkRepository,
    scope: ActiveScope;
  beforeAll(async () => {
    env = await environment();
  });
  afterAll(async () => env.cleanup());
  beforeEach(async () => {
    await env.clearFirestore();
    const db = env.authenticatedContext(uid).firestore();
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
        name: 'Sintetički kolegij',
        information: '',
        links: [],
        isArchived: false,
        attendanceRules: unknownAttendanceRules(),
      },
      null,
    );
  });
  it('preserves all attempts, corrects one and retries a lost ack without another revision', async () => {
    await repo.save(scope, 'assessments', 'a1', assessment, null);
    const id = activityId('assessment', 'a1');
    const first = {
      activityId: id,
      attemptNumber: 1,
      takenOn: '2026-10-15',
      points: '0',
      grade: null,
    };
    await repo.saveAttempt(scope, 'assessment', 'a1', first, null);
    const root = await academic.readControl(uid);
    await repo.saveAttempt(scope, 'assessment', 'a1', first, null);
    expect((await academic.readControl(uid)).dataRevision).toBe(root.dataRevision);
    await repo.saveAttempt(
      scope,
      'assessment',
      'a1',
      { ...first, attemptNumber: 2, points: '7.1250', grade: 'B' },
      null,
    );
    await repo.saveAttempt(scope, 'assessment', 'a1', { ...first, points: '1.25' }, 1);
    const data = await repo.attempts(scope, 'assessment', 'a1');
    expect(data.attempts.map((a) => a.points)).toEqual(['1.25', '7.1250']);
    expect(data.attempts[0].revision).toBe(2);
    expect(await repo.get(scope, 'assessments', 'a1')).toMatchObject({ isCompleted: false });
  });
  it('conflicts retain canonical server attempt instead of silently taking latest revision', async () => {
    await repo.save(scope, 'assessments', 'a1', assessment, null);
    const payload = {
      activityId: activityId('assessment', 'a1'),
      attemptNumber: 1,
      takenOn: null,
      points: null,
      grade: null,
    };
    await repo.saveAttempt(scope, 'assessment', 'a1', payload, null);
    await repo.saveAttempt(scope, 'assessment', 'a1', { ...payload, points: '4' }, 1);
    await expect(
      repo.saveAttempt(scope, 'assessment', 'a1', { ...payload, points: '5' }, 1),
    ).rejects.toMatchObject({ category: 'conflict', serverRecord: { points: '4' } });
    expect(
      ((await repo.get(scope, 'scoreAttempts', 'assessment_a1_1')) as ScoreAttempt).points,
    ).toBe('4');
  });
  it('one project task is the same in global and project views; completion/archive do not cascade', async () => {
    await repo.save(scope, 'projects', 'p1', projectInput, null);
    const task = {
      title: 'Dio projekta',
      dueOn: null,
      isCompleted: false,
      context: { type: 'project' as const, id: 'p1' },
    };
    await repo.save(scope, 'tasks', 't1', task, null);
    await repo.save(
      scope,
      'projects',
      'p1',
      { ...projectInput, isCompleted: true, isArchived: true },
      1,
    );
    const global = await repo.page(scope, 'tasks'),
      linked = await repo.page(scope, 'tasks', { contextType: 'project', contextId: 'p1' });
    expect(global.records).toEqual(linked.records);
    expect(((await repo.get(scope, 'tasks', 't1')) as Task).isCompleted).toBe(false);
    await repo.save(scope, 'tasks', 't1', { ...task, isCompleted: true }, 1);
    await repo.save(scope, 'tasks', 't1', { ...task, isCompleted: false }, 2);
    expect(await repo.get(scope, 'tasks', 't1')).toMatchObject({ revision: 3, isCompleted: false });
  });
  it('creates thesis without topic and enforces refs/offline and recorded source course consistency', async () => {
    await repo.save(scope, 'thesis', 'main', { topic: null, mentor: null, information: '' }, null);
    await repo.save(
      scope,
      'tasks',
      'th',
      {
        title: 'Pronađi temu',
        dueOn: null,
        isCompleted: false,
        context: { type: 'thesis', id: 'main' },
      },
      null,
    );
    await expect(
      repo.save(
        scope,
        'tasks',
        'missing',
        {
          title: 'T',
          dueOn: null,
          isCompleted: false,
          context: { type: 'project', id: 'missing' },
        },
        null,
      ),
    ).rejects.toMatchObject({ category: 'notFound' });
    await repo.save(scope, 'projects', 'p1', projectInput, null);
    await repo.saveAttempt(
      scope,
      'project',
      'p1',
      { activityId: 'project_p1', attemptNumber: 1, takenOn: null, points: null, grade: 'Odlično' },
      null,
    );
    await expect(
      repo.save(scope, 'projects', 'p1', { ...projectInput, courseId: null }, 1),
    ).rejects.toMatchObject({ category: 'validation' });
    const offline = new WorkRepository(env.authenticatedContext(uid).firestore(), () => false);
    await expect(
      offline.save(scope, 'thesis', 'main', { topic: 'T', mentor: null, information: '' }, 1),
    ).rejects.toMatchObject({ category: 'offline' });
  });
  it('reads the same canonical attempts from a course without copying results', async () => {
    await repo.save(scope, 'assessments', 'a1', assessment, null);
    await repo.save(scope, 'projects', 'p1', projectInput, null);
    await repo.saveAttempt(
      scope,
      'assessment',
      'a1',
      { activityId: 'assessment_a1', attemptNumber: 1, takenOn: null, points: '3.25', grade: null },
      null,
    );
    await repo.saveAttempt(
      scope,
      'project',
      'p1',
      { activityId: 'project_p1', attemptNumber: 1, takenOn: null, points: null, grade: 'B' },
      null,
    );
    const data = await repo.courseResults(scope, 'c1');
    expect(data.rows.map((row) => row.attempts[0].id)).toEqual(['assessment_a1_1', 'project_p1_1']);
    expect(data.more).toBe(false);
  });
  it('pages beyond fifty tasks without dropping or duplicating records', async () => {
    for (let i = 0; i < 51; i++)
      await repo.save(
        scope,
        'tasks',
        't' + String(i).padStart(2, '0'),
        { title: 'T' + i, dueOn: null, isCompleted: false, context: { type: 'none', id: null } },
        null,
      );
    const first = await repo.page(scope, 'tasks', { contextType: 'none', completed: false });
    const second = await repo.page(
      scope,
      'tasks',
      { contextType: 'none', completed: false },
      first.cursor,
    );
    expect(first.records.length).toBe(50);
    expect(first.hasMore).toBe(true);
    expect(second.records.length).toBe(1);
    expect(second.hasMore).toBe(false);
    expect(new Set([...first.records, ...second.records].map((r) => r.id)).size).toBe(51);
  });
  it('uses expected revisions for task stale writes and offers paged filters', async () => {
    const input = {
      title: 'T',
      dueOn: null,
      isCompleted: false,
      context: { type: 'none' as const, id: null },
    };
    await repo.save(scope, 'tasks', 't1', input, null);
    await repo.save(scope, 'tasks', 't1', { ...input, title: 'Server' }, 1);
    await expect(
      repo.save(scope, 'tasks', 't1', { ...input, title: 'Local' }, 1),
    ).rejects.toMatchObject({ category: 'conflict', serverRecord: { title: 'Server' } });
    expect(
      (await repo.page(scope, 'tasks', { contextType: 'none', completed: false })).records,
    ).toHaveLength(1);
  });
});
