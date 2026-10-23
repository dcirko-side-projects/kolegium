import { AttendanceRule } from './academic.models';
import { dateOnly, plainText, recordId } from './academic.validation';
import { ApplicationError } from '../core/errors/application-error';
import {
  Occurrence,
  ScheduleTemplate,
  Session,
  SessionInput,
  TemplateInput,
  TeachingKind,
} from './schedule.models';

export function localNow(now = new Date()): { date: string; time: string } {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Zagreb',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)!.value;
  return {
    date: `${get('year')}-${get('month')}-${get('day')}`,
    time: `${get('hour')}:${get('minute')}`,
  };
}
export function addDays(value: string, count: number): string {
  const date = new Date(`${dateOnly(value)}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + count);
  return date.toISOString().slice(0, 10);
}
export function weekday(value: string): number {
  return new Date(`${dateOnly(value)}T12:00:00Z`).getUTCDay() || 7;
}
export function weekStart(value: string): string {
  return addDays(value, 1 - weekday(value));
}
export function timeOnly(value: string): string {
  if (typeof value !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(value))
    throw new ApplicationError('validation', 'Vrijeme mora biti valjano u obliku HH:mm.');
  return value;
}
function times<
  T extends { startsAt: string; endsAt: string; location: string | null; kind: TeachingKind },
>(v: T) {
  const startsAt = timeOnly(v.startsAt),
    endsAt = timeOnly(v.endsAt);
  if (startsAt >= endsAt)
    throw new ApplicationError('validation', 'Završetak mora biti nakon početka nastave.');
  if (!['lecture', 'exercise'].includes(v.kind))
    throw new ApplicationError('validation', 'Odaberi predavanja ili vježbe.');
  return {
    startsAt,
    endsAt,
    kind: v.kind,
    location: v.location === null ? null : plainText(v.location, 200, false) || null,
  };
}
export function templateInput(v: TemplateInput): TemplateInput {
  const validFrom = dateOnly(v.validFrom),
    validUntil = dateOnly(v.validUntil);
  if (validFrom > validUntil || !Number.isInteger(v.weekday) || v.weekday < 1 || v.weekday > 7)
    throw new ApplicationError('validation', 'Provjeri razdoblje i dan u tjednu.');
  return { courseId: recordId(v.courseId), ...times(v), weekday: v.weekday, validFrom, validUntil };
}
export function sessionInput(v: SessionInput): SessionInput {
  if (
    typeof v.isCancelled !== 'boolean' ||
    !['unmarked', 'present', 'absent', 'excused'].includes(v.attendance) ||
    (v.isCancelled && v.attendance !== 'unmarked')
  )
    throw new ApplicationError(
      'validation',
      'Otkazani termin ne može imati evidentiranu dolaznost.',
    );
  const absenceNote = v.absenceNote == null ? null : plainText(v.absenceNote, 500);
  if (absenceNote && v.attendance !== 'excused')
    throw new ApplicationError(
      'validation',
      'Napomena ispričnice pripada samo ispričanom izostanku.',
    );
  return {
    courseId: recordId(v.courseId),
    templateId: v.templateId === null ? null : recordId(v.templateId),
    scheduledOn: dateOnly(v.scheduledOn),
    ...times(v),
    isCancelled: v.isCancelled,
    attendance: v.attendance,
    ...(absenceNote ? { absenceNote } : {}),
    replacementForId: v.replacementForId === null ? null : recordId(v.replacementForId),
  };
}
export function sessionId(templateId: string, date: string): string {
  return recordId(`${recordId(templateId)}_${dateOnly(date)}`);
}
export function occurrences(
  templates: ScheduleTemplate[],
  recorded: Session[],
  from: string,
  until: string,
  includeOutsideRecords = false,
): Occurrence[] {
  dateOnly(from);
  dateOnly(until);
  if (from > until || until > addDays(from, 1095))
    throw new ApplicationError('validation', 'Prikaz podržava najviše tri godine po upitu.');
  const rows = new Map<string, Occurrence>();
  for (const t of templates) {
    const first = t.validFrom > from ? t.validFrom : from,
      last = t.validUntil < until ? t.validUntil : until;
    for (let date = first; date <= last; date = addDays(date, 1)) {
      if (weekday(date) !== t.weekday) continue;
      const id = sessionId(t.id, date);
      rows.set(id, {
        id,
        revision: null,
        courseId: t.courseId,
        templateId: t.id,
        scheduledOn: date,
        startsAt: t.startsAt,
        endsAt: t.endsAt,
        location: t.location,
        kind: t.kind,
        isCancelled: false,
        attendance: 'unmarked',
        replacementForId: null,
      });
    }
  }
  for (const s of recorded)
    if (includeOutsideRecords || (s.scheduledOn >= from && s.scheduledOn <= until))
      rows.set(s.id, s);
  return [...rows.values()].sort(
    (a, b) =>
      a.scheduledOn.localeCompare(b.scheduledOn) ||
      a.startsAt.localeCompare(b.startsAt) ||
      a.id.localeCompare(b.id),
  );
}
export function attendanceSummary(
  rows: Occurrence[],
  kind: TeachingKind,
  rule: AttendanceRule,
  now = localNow(),
) {
  const relevant = rows.filter(
    (r) =>
      r.kind === kind &&
      !r.isCancelled &&
      (r.scheduledOn < now.date ||
        (r.scheduledOn === now.date && r.endsAt <= now.time) ||
        r.attendance !== 'unmarked'),
  );
  const present = relevant.filter((r) => r.attendance === 'present').length,
    absent = relevant.filter((r) => r.attendance === 'absent').length,
    excused = relevant.filter((r) => r.attendance === 'excused').length,
    unmarked = relevant.filter((r) => r.attendance === 'unmarked').length;
  return {
    present,
    absent,
    excused,
    unmarked,
    remaining: rule.minimum === null ? null : Math.max(0, rule.minimum - present),
    percentOfOfficial:
      rule.total === null || rule.total === 0 ? null : (100 * present) / rule.total,
  };
}
