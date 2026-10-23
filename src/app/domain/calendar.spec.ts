import { describe, expect, it } from 'vitest';
import { calendarWindow, moveCalendar } from './calendar';

describe('calendar navigation', () => {
  it('includes complete Monday–Sunday weeks across year boundaries', () => {
    expect(calendarWindow('2027-01-15', 'month')).toEqual({
      from: '2026-12-28',
      until: '2027-01-31',
    });
    expect(calendarWindow('2026-03-29', 'week')).toEqual({
      from: '2026-03-23',
      until: '2026-03-29',
    });
    expect(calendarWindow('2026-10-25', 'day')).toEqual({
      from: '2026-10-25',
      until: '2026-10-25',
    });
  });
  it('clamps month-end dates and handles leap years and DST without shifting days', () => {
    expect(moveCalendar('2027-01-31', 'month', 1)).toBe('2027-02-28');
    expect(moveCalendar('2028-03-31', 'month', -1)).toBe('2028-02-29');
    expect(moveCalendar('2026-12-31', 'month', 1)).toBe('2027-01-31');
    expect(moveCalendar('2026-03-29', 'day', 1)).toBe('2026-03-30');
    expect(moveCalendar('2026-10-25', 'week', 1)).toBe('2026-11-01');
  });
});
