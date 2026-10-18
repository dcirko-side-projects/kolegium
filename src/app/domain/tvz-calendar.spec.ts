import { describe, expect, it } from 'vitest';
import { excludedCourse, parseTvzCalendar } from './tvz-calendar';

function event(name = 'Sintetički kolegij', kind = 'Predavanja', extra = '') {
  return `BEGIN:VEVENT\r\nDESCRIPTION:${name} - ${kind}\\nProfesor\r\nDTSTART:20261012T163000\r\nDTEND:20261012T180000\r\nLOCATION:Borongaj\\, Učionica\\; 1\r\n${extra}END:VEVENT\r\n`;
}
function calendar(events: string) {
  return `BEGIN:VCALENDAR\r\nVERSION:2.0\r\n${events}END:VCALENDAR\r\n`;
}
describe('Explicit TVZ calendar boundary', () => {
  it('unfolds UTF-8 lines and escaped text without generating extra recurring dates', () => {
    const parsed = parseTvzCalendar(
      calendar(
        event('Sintetički kolegij (open source\\, php)').replace(
          'Sintetički kolegij',
          'Sintetički \r\n kolegij',
        ),
      ),
    );
    expect(parsed.lessons).toHaveLength(1);
    expect(parsed.lessons[0]).toMatchObject({
      courseName: 'Sintetički kolegij (open source, php)',
      scheduledOn: '2026-10-12',
      startsAt: '16:30',
      endsAt: '18:00',
      location: 'Borongaj, Učionica; 1',
      kind: 'lecture',
    });
  });
  it('excludes the requested course, maps exercise types and collapses identical events', () => {
    const parsed = parseTvzCalendar(
      calendar(
        event(excludedCourse) +
          event('Drugi', 'Seminarske vježbe') +
          event('Drugi', 'Seminarske vježbe'),
      ),
    );
    expect(parsed.excluded).toBe(1);
    expect(parsed.lessons).toHaveLength(1);
    expect(parsed.lessons[0].kind).toBe('exercise');
  });
  it('rejects recurrence, UTC/other zones, invalid dates, overnight lessons and ambiguous types', () => {
    for (const source of [
      event('Drugi', 'Predavanja', 'RRULE:FREQ=WEEKLY\r\n'),
      event().replace('DTSTART:', 'DTSTART;TZID=America/New_York:'),
      event().replace('163000', '163000Z'),
      event().replace('20261012T180000', '20261013T180000'),
      event().replaceAll('20261012', '20260230'),
      event('Drugi', 'Nepoznato'),
    ]) {
      expect(() => parseTvzCalendar(calendar(source))).toThrow();
    }
  });
});
