import { afterAll, beforeAll, beforeEach, describe, it, expect } from 'vitest';
import { RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { environment, semester, uid } from './support';
import { AcademicRepository } from '../../src/app/data/academic.repository';
import { PlanningRepository } from '../../src/app/data/planning.repository';
import { WorkRepository } from '../../src/app/data/work.repository';
import { ActiveScope, unknownAttendanceRules } from '../../src/app/domain/academic.models';
import { ScoreActivity } from '../../src/app/domain/work.models';
import { calculateCourse } from '../../src/app/domain/grading';
describe('Planning SDK invariants', () => {
  let env: RulesTestEnvironment,
    academic: AcademicRepository,
    repo: PlanningRepository,
    work: WorkRepository,
    scope: ActiveScope;
  beforeAll(async () => {
    env = await environment();
  });
  afterAll(async () => env.cleanup());
  beforeEach(async () => {
    await env.clearFirestore();
    const db = env.authenticatedContext(uid).firestore();
    academic = new AcademicRepository(db);
    repo = new PlanningRepository(db);
    work = new WorkRepository(db);
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
  it('preserves cents/paid state, retries without duplicates and rejects stale edits/offline', async () => {
    const input = { name: 'Rata', amountCents: 1234, dueOn: '2026-10-01', isPaid: false };
    await repo.save(scope, 'installments', 'r1', input, null);
    const rev = (await academic.readControl(uid)).dataRevision;
    await repo.save(scope, 'installments', 'r1', input, null);
    expect((await academic.readControl(uid)).dataRevision).toBe(rev);
    await repo.save(scope, 'installments', 'r1', { ...input, isPaid: true }, 1);
    await expect(
      repo.save(scope, 'installments', 'r1', { ...input, name: 'Stale' }, 1),
    ).rejects.toMatchObject({ category: 'conflict', serverRecord: { isPaid: true } });
    expect((await repo.installments(scope)).rows[0]).toMatchObject({
      amountCents: 1234,
      isPaid: true,
    });
    await expect(
      new PlanningRepository(env.authenticatedContext(uid).firestore(), () => false).save(
        scope,
        'installments',
        'r2',
        input,
        null,
      ),
    ).rejects.toMatchObject({ category: 'offline' });
  });
  it('queries all overdue and 14-day bounds, excludes paid/completed/archived, includes undated open tasks', async () => {
    for (const [id, dueOn, isPaid] of [
      ['old', '2025-01-01', false],
      ['edge', '2026-10-23', false],
      ['later', '2026-10-24', false],
      ['paid', '2026-10-10', true],
    ] as const)
      await repo.save(scope, 'installments', id, { name: id, amountCents: 1, dueOn, isPaid }, null);
    await work.save(
      scope,
      'tasks',
      't1',
      { title: 'Bez roka', dueOn: null, isCompleted: false, context: { type: 'none', id: null } },
      null,
    );
    await work.save(
      scope,
      'projects',
      'p1',
      { name: 'Arhiva', courseId: 'c1', dueOn: '2026-10-10', isCompleted: false, isArchived: true },
      null,
    );
    await work.save(
      scope,
      'tasks',
      't2',
      {
        title: 'Arhivirani projekt',
        dueOn: '2026-10-10',
        isCompleted: false,
        context: { type: 'project', id: 'p1' },
      },
      null,
    );
    const data = await repo.overview(scope, '2026-10-23');
    expect(data.deadlines.map((r) => r.name)).toEqual(['old', 'edge']);
    expect(data.tasks.map((t) => t.title)).toEqual(['Bez roka']);
  });
  it('paginates 51 deadlines without hiding late records', async () => {
    for (let n = 0; n < 51; n++)
      await repo.save(
        scope,
        'installments',
        'r' + String(n).padStart(2, '0'),
        { name: 'R' + n, amountCents: 1, dueOn: '2026-10-01', isPaid: false },
        null,
      );
    expect((await repo.overview(scope, '2026-10-23')).more).toBe(true);
    const full = await repo.overview(scope, '2026-10-23', 100);
    expect(full.deadlines).toHaveLength(51);
    expect(new Set(full.deadlines.map((r) => r.id)).size).toBe(51);
    expect(full.more).toBe(false);
  });
  it('stores canonical manual activity/history and config/outcome separately with exact calculation', async () => {
    const activity = {
      name: 'Sintetičke vježbe',
      courseId: 'c1',
      source: { type: 'exercise', id: null },
      componentKey: 'all',
      maxPoints: '100',
      minimumPoints: '0',
    } as ScoreActivity;
    await work.saveActivity(scope, 'exercise_c1_a', activity, null);
    await work.saveAttempt(
      scope,
      'exercise',
      'exercise_c1_a',
      {
        activityId: 'exercise_c1_a',
        attemptNumber: 1,
        points: '7.1250',
        grade: null,
        takenOn: null,
      },
      null,
    );
    const config = {
      components: [{ key: 'all', label: 'Sve', maxPoints: '100', minimumPoints: '0' }],
      scale: [{ grade: 'Sintetička A', minInclusive: '0', maxExclusive: null }],
      countedAttemptIds: ['exercise_c1_a_1'],
      projectPointsIncluded: false,
      roundingPolicy: 'none',
      isConfirmed: true,
    };
    await repo.save(scope, 'gradingRules', 'c1', config, null);
    await repo.save(
      scope,
      'courseOutcomes',
      'c1',
      { officialPoints: '8', officialGrade: 'Sintetička B' },
      null,
    );
    const data = await repo.grading(scope, 'c1');
    expect(
      calculateCourse('c1', data.activities, data.attempts, data.rules, data.completed),
    ).toMatchObject({ total: '7.125', grade: 'Sintetička A' });
    expect(data.outcome).toMatchObject({ officialPoints: '8', officialGrade: 'Sintetička B' });
    await expect(
      work.saveActivity(
        scope,
        'exercise_c1_a',
        { ...activity, maxPoints: '7' } as ScoreActivity,
        1,
      ),
    ).rejects.toMatchObject({ category: 'validation' });
    await expect(
      repo.save(scope, 'gradingRules', 'c1', { ...config, countedAttemptIds: ['missing'] }, 1),
    ).rejects.toMatchObject({ category: 'validation' });
    await repo.save(scope, 'gradingRules', 'c1', { ...config, isConfirmed: false }, 1);
    await expect(
      repo.save(scope, 'gradingRules', 'c1', { ...config, roundingPolicy: null }, 1),
    ).rejects.toMatchObject({ category: 'conflict' });
  });
});
