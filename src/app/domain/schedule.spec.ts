import {
  addDays,
  attendanceSummary,
  localNow,
  occurrences,
  sessionInput,
  templateInput,
  weekStart,
} from './schedule';
import { ScheduleTemplate } from './schedule.models';
const t: ScheduleTemplate = {
  id: 't1',
  revision: 1,
  updatedAt: null,
  courseId: 'c1',
  kind: 'lecture',
  weekday: 1,
  startsAt: '08:00',
  endsAt: '10:00',
  location: null,
  validFrom: '2026-10-01',
  validUntil: '2026-10-31',
};
describe('Schedule and attendance invariants', () => {
  it('uses Zagreb date across UTC midnight and DST without shifting calendar recurrence', () => {
    expect(localNow(new Date('2026-03-28T23:30:00Z'))).toEqual({
      date: '2026-03-29',
      time: '00:30',
    });
    expect(localNow(new Date('2026-03-29T01:30:00Z'))).toEqual({
      date: '2026-03-29',
      time: '03:30',
    });
    expect(addDays('2026-10-25', 1)).toBe('2026-10-26');
    expect(weekStart('2026-10-25')).toBe('2026-10-19');
  });
  it('creates deterministic virtual units only on the selected weekday and bounds', () => {
    const a = occurrences([t], [], '2026-10-01', '2026-10-31');
    expect(a.map((r) => r.scheduledOn)).toEqual([
      '2026-10-05',
      '2026-10-12',
      '2026-10-19',
      '2026-10-26',
    ]);
    expect(occurrences([t], [], '2026-10-01', '2026-10-31')).toEqual(a);
    expect(a.every((r) => r.revision === null)).toBe(true);
  });
  it('recorded snapshot wins even after old recurrence is shortened', () => {
    const row = occurrences([t], [], '2026-10-01', '2026-10-31')[0];
    const saved = { ...row, revision: 1, updatedAt: null, attendance: 'present' as const };
    const result = occurrences(
      [{ ...t, validUntil: '2026-10-04' }],
      [saved],
      '2026-10-01',
      '2026-10-31',
    );
    expect(result).toHaveLength(1);
    expect(result[0].startsAt).toBe('08:00');
    expect(result[0].attendance).toBe('present');
  });
  it('separates present/absent/unmarked, kinds, cancellations, unknown and zero', () => {
    const rows = occurrences([t], [], '2026-10-01', '2026-10-31');
    rows[0].attendance = 'present';
    rows[1].attendance = 'absent';
    rows[2].isCancelled = true;
    const summary = attendanceSummary(
      rows,
      'lecture',
      { total: null, minimum: null },
      { date: '2026-10-27', time: '12:00' },
    );
    expect(summary).toEqual({
      present: 1,
      absent: 1,
      excused: 0,
      unmarked: 1,
      remaining: null,
      percentOfOfficial: null,
    });
    expect(
      attendanceSummary(
        rows,
        'exercise',
        { total: 0, minimum: 0 },
        { date: '2026-10-27', time: '12:00' },
      ).remaining,
    ).toBe(0);
    expect(
      attendanceSummary(
        rows,
        'lecture',
        { total: 4, minimum: 3 },
        { date: '2026-10-27', time: '12:00' },
      ).percentOfOfficial,
    ).toBe(25);
  });
  it('does not count future or unfinished unmarked classes as missed', () => {
    const rows = occurrences([t], [], '2026-10-01', '2026-10-31');
    expect(
      attendanceSummary(
        rows,
        'lecture',
        { total: 4, minimum: 3 },
        { date: '2026-10-05', time: '09:00' },
      ).unmarked,
    ).toBe(0);
    expect(
      attendanceSummary(
        rows,
        'lecture',
        { total: 4, minimum: 3 },
        { date: '2026-10-05', time: '10:00' },
      ).unmarked,
    ).toBe(1);
  });
  it('rejects impossible time/date/range/kind and canceled attendance', () => {
    expect(() => templateInput({ ...t, startsAt: '25:00' })).toThrow();
    expect(() => templateInput({ ...t, endsAt: '08:00' })).toThrow();
    expect(() => templateInput({ ...t, weekday: 0 })).toThrow();
    const row = occurrences([t], [], '2026-10-01', '2026-10-31')[0];
    expect(() => sessionInput({ ...row, isCancelled: true, attendance: 'present' })).toThrow();
  });
  it('records excused absence separately, preserves the official denominator and validates its note', () => {
    const rows = occurrences([t], [], '2026-10-01', '2026-10-31');
    rows[0].attendance = 'excused';
    rows[1].attendance = 'present';
    const result = attendanceSummary(
      rows,
      'lecture',
      { total: 4, minimum: 3 },
      { date: '2026-11-01', time: '12:00' },
    );
    expect(result.excused).toBe(1);
    expect(result.present).toBe(1);
    expect(result.absent).toBe(0);
    expect(result.remaining).toBe(2);
    expect(result.percentOfOfficial).toBe(25);
    expect(sessionInput({ ...rows[0], absenceNote: ' Liječnička potvrda ' }).absenceNote).toBe(
      'Liječnička potvrda',
    );
    expect(() => sessionInput({ ...rows[0], isCancelled: true })).toThrow();
    expect(() => sessionInput({ ...rows[0], absenceNote: 'x'.repeat(501) })).toThrow();
    expect(() =>
      sessionInput({ ...rows[0], attendance: 'present', absenceNote: 'razlog' }),
    ).toThrow();
  });
});
