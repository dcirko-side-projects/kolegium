import { ApplicationError } from '../core/errors/application-error';
import { dateOnly, plainText } from './academic.validation';
import { sessionInput } from './schedule';
import { TeachingKind } from './schedule.models';

export interface CalendarLesson {
  courseName: string;
  teachingLabel: string;
  kind: TeachingKind;
  scheduledOn: string;
  startsAt: string;
  endsAt: string;
  location: string | null;
}
export const excludedCourse = 'Modeliranje i administracija baza podataka';
export const calendarLimit = 1024 * 1024;
export function lessonKey(lesson: CalendarLesson): string {
  return JSON.stringify([
    lesson.courseName,
    lesson.kind,
    lesson.scheduledOn,
    lesson.startsAt,
    lesson.endsAt,
    lesson.location,
  ]);
}
export function seriesKey(lesson: CalendarLesson): string {
  return JSON.stringify([lesson.courseName, lesson.teachingLabel, lesson.startsAt, lesson.endsAt]);
}
function fail(): never {
  throw new ApplicationError(
    'validation',
    'Datoteka nije podržani TVZ raspored. Potrebni su pojedinačni termini s datumom, vremenom i vrstom nastave; ponavljanja i druge vremenske zone nisu podržani.',
  );
}
function text(value: string): string {
  return value.replace(/\\([nN,;\\])/g, (_, character: string) =>
    character.toLowerCase() === 'n' ? '\n' : character,
  );
}
function calendarDate(value: string): { date: string; time: string } {
  if (!/^\d{8}T\d{4}00$/.test(value)) fail();
  return {
    date: dateOnly(`${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}`),
    time: `${value.slice(9, 11)}:${value.slice(11, 13)}`,
  };
}
/** Floating TVZ times are explicitly interpreted as Europe/Zagreb in the import preview. */
export function parseTvzCalendar(source: string): { lessons: CalendarLesson[]; excluded: number } {
  if (new TextEncoder().encode(source).byteLength > calendarLimit) fail();
  const lines = source
    .replace(/^\uFEFF/, '')
    .replace(/\r?\n[ \t]/g, '')
    .split(/\r?\n/)
    .filter(Boolean);
  if (lines[0] !== 'BEGIN:VCALENDAR' || lines.at(-1) !== 'END:VCALENDAR') fail();
  let event: Map<string, string> | null = null;
  const lessons = new Map<string, CalendarLesson>();
  let excluded = 0,
    count = 0;
  for (const line of lines.slice(1, -1)) {
    if (line === 'BEGIN:VEVENT') {
      if (event) fail();
      event = new Map();
    } else if (line === 'END:VEVENT') {
      if (!event || ++count > 1000) fail();
      const description = text(event.get('DESCRIPTION') ?? '').split('\n')[0];
      const match =
        /^(.*?) - (Predavanja|Laboratorijske vježbe|Auditorne vježbe|Seminarske vježbe)$/.exec(
          description,
        );
      if (!match) fail();
      const courseName = plainText(match[1], 120, true);
      const start = calendarDate(event.get('DTSTART') ?? ''),
        end = calendarDate(event.get('DTEND') ?? '');
      if (start.date !== end.date) fail();
      const kind = match[2] === 'Predavanja' ? 'lecture' : 'exercise';
      const validated = sessionInput({
        courseId: 'preview',
        templateId: null,
        scheduledOn: start.date,
        startsAt: start.time,
        endsAt: end.time,
        kind,
        location: text(event.get('LOCATION') ?? '') || null,
        isCancelled: false,
        attendance: 'unmarked',
        replacementForId: null,
      });
      if (courseName.toLocaleLowerCase('hr') === excludedCourse.toLocaleLowerCase('hr')) excluded++;
      else {
        const lesson: CalendarLesson = {
          courseName,
          teachingLabel: match[2],
          kind,
          scheduledOn: validated.scheduledOn,
          startsAt: validated.startsAt,
          endsAt: validated.endsAt,
          location: validated.location,
        };
        lessons.set(lessonKey(lesson), lesson);
      }
      event = null;
    } else if (event) {
      const colon = line.indexOf(':');
      if (colon < 0) fail();
      const property = line.slice(0, colon),
        value = line.slice(colon + 1);
      if (/^(RRULE|RDATE|EXDATE|RECURRENCE-ID|STATUS|DURATION)(;|$)/.test(property)) fail();
      const [name, ...parameters] = property.split(';');
      if (
        ['DTSTART', 'DTEND'].includes(name) &&
        parameters.length &&
        parameters.join(';') !== 'TZID=Europe/Zagreb'
      )
        fail();
      if (event.has(name)) fail();
      event.set(name, value);
    } else if (line.startsWith('BEGIN:') || line.startsWith('END:')) fail();
  }
  if (event || !count) fail();
  return {
    lessons: [...lessons.values()].sort(
      (a, b) => a.scheduledOn.localeCompare(b.scheduledOn) || a.startsAt.localeCompare(b.startsAt),
    ),
    excluded,
  };
}
