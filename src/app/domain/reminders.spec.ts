import { describe, expect, it } from 'vitest';
import {
  Reminder,
  isActiveReminder,
  reminderCalendar,
  reminderItems,
  reminderMessage,
  zagrebInstant,
} from './reminders';

const due: Reminder = {
  id: 'tasks/t1',
  name: 'Predaja',
  date: '2026-10-25',
  time: null,
  endsAt: null,
  route: '/todo',
  kind: 'task',
  label: 'Zadatak',
  location: null,
};
describe('reminders and private calendar export', () => {
  it('uses Zagreb wall time across summer/winter DST and rejects nonexistent times', () => {
    expect(zagrebInstant('2026-10-24', '09:00').toISOString()).toBe('2026-10-24T07:00:00.000Z');
    expect(zagrebInstant('2026-10-25', '09:00').toISOString()).toBe('2026-10-25T08:00:00.000Z');
    expect(zagrebInstant('2026-03-29', '09:00').toISOString()).toBe('2026-03-29T07:00:00.000Z');
    expect(() => zagrebInstant('2026-03-29', '02:30')).toThrow();
  });
  it('keeps due dates all-day, emits correct absolute alarms, and excludes past/ended events', () => {
    const event = {
      ...due,
      id: 'sessions/s1',
      date: '2026-10-24',
      time: '10:00',
      endsAt: '11:00',
      kind: 'session' as const,
    };
    const result = reminderCalendar(
      [due, event, { ...due, date: '2026-10-19' }],
      'ds1',
      new Date('2026-10-20T06:00:00Z'),
    );
    expect(result.count).toBe(2);
    expect(result.text).toContain('DTSTART;VALUE=DATE:20261025\r\nDTEND;VALUE=DATE:20261026');
    expect(result.text).toContain('TRIGGER;VALUE=DATE-TIME:20261024T070000Z');
    expect(result.text).toContain('TRIGGER;VALUE=DATE-TIME:20261025T080000Z');
    expect(result.text).toContain('DTSTART:20261024T080000Z');
    expect(result.text).toContain('DTEND:20261024T090000Z');
    expect(reminderCalendar([event], 'ds1', new Date('2026-10-24T09:01:00Z')).count).toBe(0);
  });
  it('exports installment 30/7/day alarms and exam day/hour alarms, skipping elapsed alerts', () => {
    const installment = {
      ...due,
      id: 'installments/r1',
      date: '2026-12-01',
      kind: 'installment' as const,
    };
    const text = reminderCalendar([installment], 'ds1', new Date('2026-10-01T00:00:00Z')).text;
    for (const date of ['20261101T080000Z', '20261124T080000Z', '20261201T080000Z'])
      expect(text).toContain('TRIGGER;VALUE=DATE-TIME:' + date);
    const exam = { ...due, id: 'assessments/a1', kind: 'assessment' as const, time: '14:00' };
    const calendar = reminderCalendar([exam], 'ds1', new Date('2026-10-25T11:30:00Z')).text;
    expect(calendar.match(/BEGIN:VALARM/g)).toHaveLength(1);
    expect(calendar).toContain('TRIGGER;VALUE=DATE-TIME:20261025T120000Z');
  });
  it('escapes text injection, folds UTF-8 at 75 octets and preserves stable namespaced IDs', () => {
    const row = { ...due, name: 'Ž'.repeat(100) + '\r\nBEGIN:VEVENT;X,Y\\Z' };
    const result = reminderCalendar([row], 'ds1', new Date('2026-10-20T06:00:00Z'));
    expect(result.text.match(/BEGIN:VEVENT\r\n/g)).toHaveLength(1);
    expect(result.text).toContain('UID:ds1-tasks%2Ft1@kolegium');
    for (const line of result.text.split('\r\n'))
      expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
    expect(result.text.replace(/\r\n /g, '')).toContain('\\nBEGIN:VEVENT\\;X\\,Y\\\\Z');
  });
  it('separates today/overdue/ranges and does not fabricate a time for undated-hour exams', () => {
    const now = { date: '2026-10-20', time: '12:00' };
    expect(reminderMessage({ ...due, date: '2026-10-19' }, now)).toBe('Rok je prošao');
    expect(reminderMessage({ ...due, date: '2026-10-20' }, now)).toBe('Rok je danas');
    expect(isActiveReminder({ ...due, date: '2026-10-27' }, now.date)).toBe(true);
    expect(isActiveReminder({ ...due, date: '2026-10-28' }, now.date)).toBe(false);
    expect(isActiveReminder({ ...due, date: '2026-11-19', kind: 'installment' }, now.date)).toBe(
      true,
    );
    const [item] = reminderItems(
      [
        {
          id: 'assessments/a1',
          name: 'Kolokvij',
          date: '2026-10-21',
          route: '/assessments/a1',
          kind: 'Kolokvij / ispit',
          scheduledAt: null,
        },
      ],
      [],
      {},
    );
    expect(item.time).toBeNull();
  });
});
