import { Deadline } from './planning.models';
import { Occurrence } from './schedule.models';
import { addDays, localNow, timeOnly } from './schedule';
import { dateOnly } from './academic.validation';
import { ApplicationError } from '../core/errors/application-error';

export interface Reminder {
  id: string;
  name: string;
  date: string;
  time: string | null;
  endsAt: string | null;
  route: string;
  kind: 'task' | 'project' | 'assessment' | 'installment' | 'session';
  label: string;
  location: string | null;
}
export function reminderItems(
  deadlines: Deadline[],
  sessions: Occurrence[],
  names: Record<string, string>,
): Reminder[] {
  const items: Reminder[] = deadlines.map((row) => ({
    id: row.id,
    name: row.name,
    date: row.date,
    time: row.scheduledAt ?? null,
    endsAt: null,
    route: row.route,
    kind: row.id.startsWith('installments/')
      ? 'installment'
      : row.id.startsWith('assessments/')
        ? 'assessment'
        : row.id.startsWith('projects/')
          ? 'project'
          : 'task',
    label: row.kind,
    location: null,
  }));
  for (const row of sessions) {
    if (row.isCancelled || !names[row.courseId]) continue;
    items.push({
      id: 'sessions/' + row.id,
      name: names[row.courseId],
      date: row.scheduledOn,
      time: row.startsAt,
      endsAt: row.endsAt,
      route: '/schedule',
      kind: 'session',
      label: row.kind === 'lecture' ? 'Predavanje' : 'Vježbe',
      location: row.location,
    });
  }
  return items.sort(
    (a, b) =>
      a.date.localeCompare(b.date) ||
      (a.time ?? '09:00').localeCompare(b.time ?? '09:00') ||
      a.id.localeCompare(b.id),
  );
}
export function reminderMessage(row: Reminder, now = localNow()): string {
  if (row.date < now.date) return 'Rok je prošao';
  if (row.date === now.date) {
    if (row.kind === 'session' && row.endsAt && row.endsAt <= now.time)
      return 'Današnja nastava je završila';
    if (row.time && row.time <= now.time)
      return row.kind === 'session' ? 'Nastava je u tijeku' : 'Današnji termin je započeo';
    return row.time ? 'Danas u ' + row.time : 'Rok je danas';
  }
  const days = Math.round(
    (Date.parse(row.date + 'T12:00:00Z') - Date.parse(now.date + 'T12:00:00Z')) / 86400000,
  );
  return days === 1 ? 'Sutra' : 'Za ' + days + ' dana';
}
export function isActiveReminder(row: Reminder, today: string): boolean {
  return row.kind === 'session'
    ? row.date === today
    : row.date <= addDays(today, row.kind === 'installment' ? 30 : 7);
}
export function zagrebInstant(date: string, time: string): Date {
  dateOnly(date);
  timeOnly(time);
  const target = Date.parse(date + 'T' + time + ':00Z');
  let instant = target;
  for (let i = 0; i < 3; i++) {
    const local = localNow(new Date(instant));
    const delta = target - Date.parse(local.date + 'T' + local.time + ':00Z');
    if (!delta) return new Date(instant);
    instant += delta;
  }
  throw new ApplicationError(
    'validation',
    'Vrijeme podsjetnika nije valjano u zoni Europe/Zagreb.',
  );
}
const utc = (date: Date) => date.toISOString().replace(/[-:]/g, '').slice(0, 15) + 'Z';
const escapeText = (text: string) =>
  text
    .replace(/\\/g, '\\\\')
    .replace(/\r\n|\r|\n/g, '\\n')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,');
function fold(line: string): string {
  const encoder = new TextEncoder();
  let result = '',
    length = 0;
  for (const character of line) {
    const size = encoder.encode(character).length;
    if (length + size > 75) {
      result += '\r\n ';
      length = 1;
    }
    result += character;
    length += size;
  }
  return result;
}
export function reminderCalendar(
  items: Reminder[],
  datasetId: string,
  now = new Date(),
  dailyTime = '09:00',
): { text: string; count: number } {
  timeOnly(dailyTime);
  const today = localNow(now).date;
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Kolegium//Podsjetnici//HR',
    'CALSCALE:GREGORIAN',
    'X-WR-CALNAME:Kolegium podsjetnici',
  ];
  let count = 0;
  for (const row of items) {
    if (row.date < today) continue;
    const start = row.time ? zagrebInstant(row.date, row.time) : null;
    const end = row.endsAt ? zagrebInstant(row.date, row.endsAt) : null;
    const finishedAt = end ?? start;
    if (finishedAt && finishedAt.getTime() <= now.getTime()) continue;
    const alarms: Date[] =
      row.kind === 'session' && start
        ? [new Date(start.getTime() - 3600000)]
        : row.kind === 'assessment' && start
          ? [new Date(start.getTime() - 86400000), new Date(start.getTime() - 3600000)]
          : (row.kind === 'installment' ? [30, 7, 0] : [1, 0]).map((days) =>
              zagrebInstant(addDays(row.date, -days), dailyTime),
            );
    lines.push(
      'BEGIN:VEVENT',
      'UID:' + encodeURIComponent(datasetId) + '-' + encodeURIComponent(row.id) + '@kolegium',
      'DTSTAMP:' + utc(now),
      'SUMMARY:' + escapeText(row.label + ': ' + row.name),
    );
    if (start) {
      lines.push('DTSTART:' + utc(start));
      if (end) lines.push('DTEND:' + utc(end));
    } else
      lines.push(
        'DTSTART;VALUE=DATE:' + row.date.replace(/-/g, ''),
        'DTEND;VALUE=DATE:' + addDays(row.date, 1).replace(/-/g, ''),
      );
    lines.push(
      'DESCRIPTION:' +
        escapeText(
          'Izvoz iz Kolegiuma. Promjene u aplikaciji ne ažuriraju ovaj kalendar automatski.',
        ),
      'URL:https://kolegium-c8970.firebaseapp.com' + row.route,
    );
    if (row.location) lines.push('LOCATION:' + escapeText(row.location));
    for (const alarm of alarms.filter((a) => a.getTime() > now.getTime()))
      lines.push(
        'BEGIN:VALARM',
        'ACTION:DISPLAY',
        'DESCRIPTION:Kolegium podsjetnik',
        'TRIGGER;VALUE=DATE-TIME:' + utc(alarm),
        'END:VALARM',
      );
    lines.push('END:VEVENT');
    count++;
  }
  lines.push('END:VCALENDAR');
  return { text: lines.map(fold).join('\r\n') + '\r\n', count };
}
