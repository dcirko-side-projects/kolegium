import { ApplicationError } from '../core/errors/application-error';
import { dateOnly, plainText, recordId } from './academic.validation';
import {
  AssessmentInput,
  ProjectInput,
  TaskInput,
  ThesisInput,
  ScoreAttemptInput,
  ScoreActivityInput,
  ResultSource,
} from './work.models';
function invalid(message: string): never {
  throw new ApplicationError('validation', message);
}
function bool(value: unknown): boolean {
  if (typeof value !== 'boolean') invalid('Status nije valjan.');
  return value;
}
export function optionalText(value: unknown, max: number): string | null {
  return value === null || value === '' ? null : plainText(value, max, true);
}
export function optionalDate(value: unknown): string | null {
  return value === null || value === '' ? null : dateOnly(value);
}
export function decimalPoints(value: unknown): string | null {
  if (value === null || value === '') return null;
  if (typeof value !== 'string' || !/^(0|[1-9][0-9]{0,5})(\.[0-9]{1,4})?$/.test(value))
    invalid('Bodovi moraju biti nenegativni, s najviše četiri decimalna mjesta.');
  const [whole, fraction = ''] = value.split('.');
  const units = Number(whole) * 10000 + Number(fraction.padEnd(4, '0'));
  if (units > 1000000000) invalid('Bodovi ne mogu biti veći od 100.000.');
  return fraction ? whole + '.' + fraction : whole;
}
export function assessmentInput(v: AssessmentInput): AssessmentInput {
  if (!['quiz', 'exam', 'oral', 'defense', 'other'].includes(v.type))
    invalid('Vrsta provjere nije valjana.');
  const time = optionalText(v.scheduledAt, 5);
  if (time !== null && !/^([01][0-9]|2[0-3]):[0-5][0-9]$/.test(time))
    invalid('Vrijeme nije valjano.');
  return {
    courseId: recordId(v.courseId),
    name: plainText(v.name, 200, true),
    type: v.type,
    scheduledOn: dateOnly(v.scheduledOn),
    scheduledAt: time,
    isCompleted: bool(v.isCompleted),
  };
}
export function projectInput(v: ProjectInput): ProjectInput {
  return {
    courseId: v.courseId === null ? null : recordId(v.courseId),
    name: plainText(v.name, 200, true),
    dueOn: optionalDate(v.dueOn),
    isCompleted: bool(v.isCompleted),
    isArchived: bool(v.isArchived),
  };
}
export function taskInput(v: TaskInput): TaskInput {
  if (!v.context || !['none', 'course', 'project', 'thesis'].includes(v.context.type))
    invalid('Kontekst zadatka nije valjan.');
  if (v.context.type === 'none' && v.context.id !== null)
    invalid('Samostalni zadatak nema povezani ID.');
  if (v.context.type === 'thesis' && v.context.id !== 'main')
    invalid('Diplomski koristi osnovnu evidenciju.');
  return {
    title: plainText(v.title, 200, true),
    dueOn: optionalDate(v.dueOn),
    isCompleted: bool(v.isCompleted),
    context: {
      type: v.context.type,
      id: v.context.type === 'none' ? null : recordId(v.context.id),
    },
  };
}
export function thesisInput(v: ThesisInput): ThesisInput {
  return {
    topic: optionalText(v.topic, 500),
    mentor: optionalText(v.mentor, 500),
    information: plainText(v.information, 10000),
  };
}
export function activityId(type: ResultSource, id: string): string {
  return type === 'lecture' || type === 'exercise'
    ? recordId(id)
    : recordId(type + '_' + recordId(id));
}
export function scoreActivityInput(v: ScoreActivityInput): ScoreActivityInput {
  if (!v.source || !['assessment', 'project', 'lecture', 'exercise'].includes(v.source.type))
    invalid('Izvor rezultata nije valjan.');
  const maxPoints = decimalPoints(v.maxPoints),
    minimumPoints = decimalPoints(v.minimumPoints);
  if (maxPoints !== null && minimumPoints !== null && Number(minimumPoints) > Number(maxPoints))
    invalid('Minimalni bodovi prelaze maksimalne.');
  return {
    courseId: v.courseId === null ? null : recordId(v.courseId),
    name: plainText(v.name, 200, true),
    source: {
      type: v.source.type,
      id:
        v.source.type === 'lecture' || v.source.type === 'exercise' ? null : recordId(v.source.id),
    },
    componentKey: optionalText(v.componentKey, 200),
    maxPoints,
    minimumPoints,
  };
}
export function scoreAttemptInput(v: ScoreAttemptInput): ScoreAttemptInput {
  if (!Number.isSafeInteger(v.attemptNumber) || v.attemptNumber < 1 || v.attemptNumber > 10000)
    invalid('Broj pokušaja mora biti između 1 i 10.000.');
  return {
    activityId: recordId(v.activityId),
    attemptNumber: v.attemptNumber,
    takenOn: optionalDate(v.takenOn),
    points: decimalPoints(v.points),
    grade: optionalText(v.grade, 200),
  };
}
export function attemptId(v: Pick<ScoreAttemptInput, 'activityId' | 'attemptNumber'>): string {
  return recordId(v.activityId + '_' + v.attemptNumber);
}
