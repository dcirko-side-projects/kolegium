import { describe, it, expect } from 'vitest';
import {
  eurosToCents,
  installmentInput,
  calculateCourse,
  rulesInput,
  units,
  formatUnits,
} from './grading';
import { ScoreActivity, ScoreAttempt } from './work.models';
import { GradingRulesInput } from './planning.models';
const activity = {
  id: 'lecture_c1_a',
  courseId: 'c1',
  name: 'Sintetička aktivnost',
  source: { type: 'lecture', id: null },
  componentKey: 'all',
  maxPoints: '100',
  minimumPoints: '0',
} as ScoreActivity;
const attempt = {
  id: 'lecture_c1_a_1',
  activityId: activity.id,
  attemptNumber: 1,
  points: '0.1',
  grade: null,
  takenOn: null,
} as ScoreAttempt;
const rules: GradingRulesInput = {
  components: [
    { key: 'all', label: 'Sintetička komponenta', maxPoints: '100', minimumPoints: '0' },
  ],
  scale: [
    { grade: 'X', minInclusive: '0', maxExclusive: '0.3' },
    { grade: 'Y', minInclusive: '0.3', maxExclusive: null },
  ],
  countedAttemptIds: [attempt.id],
  isConfirmed: true,
  projectPointsIncluded: false,
  roundingPolicy: 'none',
};
describe('Exact grading and installment contracts', () => {
  it('stores money as integer cents, accepts Croatian decimal comma and rejects precision/zero/overflow', () => {
    expect(eurosToCents('12,34')).toBe(1234);
    expect(eurosToCents('0.01')).toBe(1);
    for (const value of ['0', '1.001', '-1', '1e3', '10000000.01'])
      expect(() => eurosToCents(value)).toThrow();
    expect(() =>
      installmentInput({ name: 'R', amountCents: 1.2, dueOn: '2026-02-30', isPaid: false }),
    ).toThrow();
  });
  it('adds exact decimals and respects inclusive/exclusive grade boundaries', () => {
    const a2 = {
      ...activity,
      id: 'exercise_c1_b',
      name: 'Druga',
      source: { type: 'exercise', id: null },
    } as ScoreActivity;
    const t2 = { ...attempt, id: 'exercise_c1_b_1', activityId: a2.id, points: '0.2' };
    const result = calculateCourse(
      'c1',
      [activity, a2],
      [attempt, t2],
      { ...rules, countedAttemptIds: [attempt.id, t2.id] },
      new Set(),
    );
    expect(result).toMatchObject({ total: '0.3', grade: 'Y', complete: true });
    expect(formatUnits(units('7.1250'))).toBe('7.125');
  });
  it('preserves unknown separately from an entered zero and never invents missing rules', () => {
    expect(calculateCourse('c1', [activity], [attempt], null, new Set()).total).toBeNull();
    expect(
      calculateCourse('c1', [activity], [{ ...attempt, points: null }], rules, new Set()),
    ).toMatchObject({ total: null, grade: null, complete: false });
    expect(
      calculateCourse('c1', [activity], [{ ...attempt, points: '0' }], rules, new Set()),
    ).toMatchObject({ total: '0', grade: 'X' });
  });
  it('rejects two attempts of one activity, a foreign selection and repeated canonical records', () => {
    const t2 = { ...attempt, id: activity.id + '_2', attemptNumber: 2 };
    expect(() =>
      calculateCourse(
        'c1',
        [activity],
        [attempt, t2],
        { ...rules, countedAttemptIds: [attempt.id, t2.id] },
        new Set(),
      ),
    ).toThrow();
    expect(() => calculateCourse('other', [activity], [attempt], rules, new Set())).toThrow();
    expect(() =>
      calculateCourse('c1', [activity, activity], [attempt], rules, new Set()),
    ).toThrow();
  });
  it('leaves multi-attempt selection unresolved and unsupported rounding/unconfirmed config incomplete', () => {
    expect(
      calculateCourse(
        'c1',
        [activity],
        [attempt],
        { ...rules, countedAttemptIds: [], roundingPolicy: null, isConfirmed: false },
        new Set(),
      ),
    ).toMatchObject({ total: null, grade: null, complete: false });
  });
  it('excludes project points only explicitly and blocks non-completed sources', () => {
    const project = {
      ...activity,
      id: 'project_p1',
      source: { type: 'project', id: 'p1' },
    } as ScoreActivity;
    const t = { ...attempt, id: 'project_p1_1', activityId: project.id, points: '50' };
    expect(
      calculateCourse(
        'c1',
        [project],
        [t],
        { ...rules, projectPointsIncluded: true, countedAttemptIds: [t.id] },
        new Set(),
      ).grade,
    ).toBeNull();
    expect(
      calculateCourse(
        'c1',
        [project],
        [t],
        { ...rules, projectPointsIncluded: true, countedAttemptIds: [t.id] },
        new Set([project.id]),
      ).grade,
    ).toBe('Y');
  });
  it('validates overlaps, component maxima/minima, bounds and unknown thresholds', () => {
    expect(() =>
      rulesInput({
        ...rules,
        scale: [...rules.scale, { grade: 'Z', minInclusive: '1', maxExclusive: null }],
      }),
    ).toThrow();
    expect(() =>
      calculateCourse('c1', [activity], [{ ...attempt, points: '101' }], rules, new Set()),
    ).toThrow();
    expect(
      calculateCourse(
        'c1',
        [activity],
        [attempt],
        { ...rules, components: [{ ...rules.components[0], minimumPoints: '1' }] },
        new Set(),
      ).grade,
    ).toBeNull();
    expect(
      calculateCourse(
        'c1',
        [activity],
        [attempt],
        { ...rules, components: [{ ...rules.components[0], maxPoints: null }] },
        new Set(),
      ).grade,
    ).toBeNull();
  });
});
