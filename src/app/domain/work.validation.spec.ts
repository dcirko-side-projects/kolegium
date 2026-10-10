import {
  assessmentInput,
  decimalPoints,
  projectInput,
  scoreAttemptInput,
  taskInput,
  thesisInput,
  activityId,
  attemptId,
} from './work.validation';
describe('Work domain contracts', () => {
  it('keeps unknown distinct from a genuine zero and preserves decimal precision', () => {
    expect(decimalPoints(null)).toBeNull();
    expect(decimalPoints('0')).toBe('0');
    expect(decimalPoints('7.5000')).toBe('7.5000');
    expect(decimalPoints('100000.0000')).toBe('100000.0000');
    for (const value of ['-1', 'NaN', '1e2', '1,5', '01', '0.00001', '100000.0001'])
      expect(() => decimalPoints(value)).toThrow();
  });
  it('has exactly one context and allows standalone undated tasks', () => {
    expect(
      taskInput({
        title: ' Zadatak ',
        dueOn: null,
        isCompleted: false,
        context: { type: 'none', id: null },
      }).context,
    ).toEqual({ type: 'none', id: null });
    expect(() =>
      taskInput({
        title: 'T',
        dueOn: null,
        isCompleted: false,
        context: { type: 'none', id: 'p' },
      }),
    ).toThrow();
    expect(() =>
      taskInput({
        title: 'T',
        dueOn: null,
        isCompleted: false,
        context: { type: 'thesis', id: 'other' },
      }),
    ).toThrow();
  });
  it('allows thesis without topic/mentor and project without course/date', () => {
    expect(thesisInput({ topic: null, mentor: null, information: '' })).toEqual({
      topic: null,
      mentor: null,
      information: '',
    });
    expect(
      projectInput({
        name: 'P',
        courseId: null,
        dueOn: null,
        isCompleted: false,
        isArchived: false,
      }).courseId,
    ).toBeNull();
  });
  it('requires a real assessment date and optional real time without inferring completion', () => {
    const input = {
      name: 'Ispit',
      courseId: 'c1',
      type: 'exam' as const,
      scheduledOn: '2026-10-01',
      scheduledAt: null,
      isCompleted: false,
    };
    expect(assessmentInput(input).isCompleted).toBe(false);
    expect(() => assessmentInput({ ...input, scheduledOn: '2026-02-30' })).toThrow();
    expect(() => assessmentInput({ ...input, scheduledAt: '24:00' })).toThrow();
  });
  it('preserves attempt identity on correction and does not impose a grade scale', () => {
    const id = activityId('assessment', 'a1'),
      v = { activityId: id, attemptNumber: 2, takenOn: null, points: '0', grade: 'B+' };
    expect(scoreAttemptInput(v).grade).toBe('B+');
    expect(attemptId(v)).toBe('assessment_a1_2');
    expect(() => scoreAttemptInput({ ...v, attemptNumber: 0 })).toThrow();
  });
});
