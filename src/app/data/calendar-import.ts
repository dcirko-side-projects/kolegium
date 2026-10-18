import { AcademicRepository, Page } from './academic.repository';
import { ScheduleRepository } from './schedule.repository';
import { ActiveScope, Course, Semester, unknownAttendanceRules } from '../domain/academic.models';
import { CalendarLesson, lessonKey } from '../domain/tvz-calendar';
import { occurrences } from '../domain/schedule';
import { ApplicationError } from '../core/errors/application-error';

async function stableId(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return (
    'calendar-' +
    [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
  );
}
/** Additive import: existing attendance/cancellations and unrelated data are never rewritten. */
export async function importCalendar(
  academic: AcademicRepository,
  schedule: ScheduleRepository,
  scope: ActiveScope,
  semester: Semester,
  lessons: CalendarLesson[],
  progress: (done: number, total: number) => void,
): Promise<{ added: number; skipped: number }> {
  if (
    !lessons.length ||
    lessons.length > 1000 ||
    semester.isArchived ||
    lessons.some((l) => l.scheduledOn < semester.startsOn || l.scheduledOn > semester.endsOn)
  )
    throw new ApplicationError(
      'validation',
      'Odaberi aktivan semestar čiji datumi obuhvaćaju sve odabrane termine.',
    );
  const courses: Course[] = [];
  let cursor: Page<Course>['cursor'] = null;
  do {
    const page: Page<Course> = await academic.page<Course>(scope, 'courses', semester.id, cursor);
    courses.push(...page.records);
    cursor = page.hasMore ? page.cursor : null;
    if (courses.length > 500)
      throw new ApplicationError('validation', 'Previše kolegija za ovaj uvoz.');
  } while (cursor);
  const plan = new Map<string, { course: Course | null; id: string; existing: Set<string> }>();
  for (const name of new Set(lessons.map((l) => l.courseName))) {
    const matches = courses.filter(
      (c) => c.name.trim().toLocaleLowerCase('hr') === name.toLocaleLowerCase('hr'),
    );
    if (matches.length > 1 || matches[0]?.isArchived)
      throw new ApplicationError(
        'validation',
        `Kolegij ${name} je arhiviran ili ima više podudarnih upisa. Prvo provjeri kolegije.`,
      );
    const course = matches[0] ?? null,
      id = course?.id ?? (await stableId(JSON.stringify([semester.id, name])));
    const existing = new Set<string>();
    if (course) {
      const data = await schedule.window(scope, id, semester.startsOn, semester.endsOn);
      for (const row of occurrences(
        data.templates,
        data.sessions,
        semester.startsOn,
        semester.endsOn,
      ))
        existing.add(lessonKey({ ...row, courseName: name, teachingLabel: '' }));
    }
    plan.set(name, { course, id, existing });
  }
  let added = 0,
    skipped = 0,
    done = 0;
  progress(0, lessons.length);
  for (const lesson of lessons) {
    const entry = plan.get(lesson.courseName)!;
    if (!entry.course) {
      await academic.save(
        scope,
        'courses',
        entry.id,
        {
          semesterId: semester.id,
          name: lesson.courseName,
          information: '',
          links: [],
          isArchived: false,
          attendanceRules: unknownAttendanceRules(),
        },
        null,
      );
      entry.course = await academic.course(scope, entry.id);
    }
    const key = lessonKey(lesson);
    if (entry.existing.has(key)) skipped++;
    else {
      const id = await stableId(JSON.stringify([semester.id, key]));
      const row = {
        ...lesson,
        id,
        revision: null,
        courseId: entry.id,
        templateId: null,
        isCancelled: false,
        attendance: 'unmarked' as const,
        replacementForId: null,
      };
      await schedule.saveSession(scope, row, row);
      entry.existing.add(key);
      added++;
    }
    progress(++done, lessons.length);
  }
  return { added, skipped };
}
