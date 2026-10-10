import { describe, expect, it } from 'vitest';
import { courseInput, courseLinks, dateOnly, recordId, semesterInput } from './academic.validation';
import { unknownAttendanceRules } from './academic.models';
describe('Academic input invariants', () => {
  it('accepts a leap day but rejects impossible and non-date-only values', () => {
    expect(dateOnly('2028-02-29')).toBe('2028-02-29');
    for (const value of ['2026-02-29', '2026-04-31', '2026-10-01T00:00:00Z', '01.10.2026.'])
      expect(() => dateOnly(value)).toThrow();
  });
  it('rejects reversed semester range and blank names', () => {
    expect(() =>
      semesterInput({
        name: '   ',
        startsOn: '2026-10-01',
        endsOn: '2026-11-01',
        isArchived: false,
      }),
    ).toThrow();
    expect(() =>
      semesterInput({
        name: 'Semestar',
        startsOn: '2026-11-01',
        endsOn: '2026-10-01',
        isArchived: false,
      }),
    ).toThrow();
  });
  it('keeps unknown attendance distinct from zero and rejects minimum above total', () => {
    const base = {
      name: 'Kolegij',
      semesterId: 's1',
      information: '',
      links: [],
      isArchived: false,
      attendanceRules: unknownAttendanceRules(),
    };
    expect(courseInput(base).attendanceRules.lecture.total).toBeNull();
    expect(
      courseInput({
        ...base,
        attendanceRules: {
          lecture: { total: 0, minimum: 0 },
          exercise: { total: null, minimum: null },
        },
      }).attendanceRules.lecture.total,
    ).toBe(0);
    expect(() =>
      courseInput({
        ...base,
        attendanceRules: {
          lecture: { total: 2, minimum: 3 },
          exercise: { total: null, minimum: null },
        },
      }),
    ).toThrow();
  });
  it('rejects executable protocols, credential URLs and oversized link lists', () => {
    for (const url of [
      'javascript:alert(1)',
      'data:text/html,hello',
      'https://user:password@example.test',
      'not-a-url',
    ])
      expect(() => courseLinks([{ label: 'Link', url }])).toThrow();
    expect(() =>
      courseLinks(
        Array.from({ length: 21 }, () => ({ label: 'Link', url: 'https://example.test' })),
      ),
    ).toThrow();
    expect(courseLinks([{ label: ' Izvor ', url: 'https://example.test/path' }])).toEqual([
      { label: 'Izvor', url: 'https://example.test/path' },
    ]);
  });
  it('rejects IDs that can escape a collection path', () => {
    for (const id of ['../root', 'a/b', '', 'x'.repeat(129)]) expect(() => recordId(id)).toThrow();
  });
});
