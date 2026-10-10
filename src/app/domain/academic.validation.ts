import { ApplicationError } from '../core/errors/application-error';
import { AttendanceRule, CourseInput, CourseLink, SemesterInput } from './academic.models';

function invalid(message: string): never {
  throw new ApplicationError('validation', message);
}
export function recordId(value: unknown): string {
  if (typeof value !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(value))
    invalid('Identifikator zapisa nije valjan.');
  return value;
}
export function plainText(value: unknown, max: number, required = false): string {
  if (typeof value !== 'string') invalid('Tekst nije valjan.');
  const text = value.trim();
  if (text.length > max || (required && !text))
    invalid(`Tekst mora imati ${required ? '1–' : 'najviše '}${max} znakova.`);
  return text;
}
export function dateOnly(value: unknown): string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    invalid('Datum nije valjan.');
  const date = new Date(`${value}T00:00:00.000Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value)
    invalid('Datum ne postoji u kalendaru.');
  return value;
}
export function semesterInput(value: SemesterInput): SemesterInput {
  const startsOn = dateOnly(value.startsOn),
    endsOn = dateOnly(value.endsOn);
  if (startsOn > endsOn) invalid('Završetak semestra mora biti nakon početka.');
  if (typeof value.isArchived !== 'boolean') invalid('Stanje arhive nije valjano.');
  return { name: plainText(value.name, 200, true), startsOn, endsOn, isArchived: value.isArchived };
}
export function courseLinks(value: CourseLink[]): CourseLink[] {
  if (!Array.isArray(value) || value.length > 20)
    invalid('Kolegij može imati najviše 20 poveznica.');
  return value.map((link) => {
    if (!link || typeof link !== 'object') invalid('Poveznica nije valjana.');
    const label = plainText(link.label, 200, true),
      url = plainText(link.url, 2000, true);
    try {
      const parsed = new URL(url);
      if (
        !['http:', 'https:'].includes(parsed.protocol) ||
        !parsed.hostname ||
        parsed.username ||
        parsed.password
      )
        invalid('Poveznice moraju biti HTTP/HTTPS adrese bez prijavnih podataka.');
    } catch {
      invalid('Poveznica mora biti valjana HTTP/HTTPS adresa.');
    }
    return { label, url };
  });
}
export function attendanceRule(rule: AttendanceRule): AttendanceRule {
  if (!rule || typeof rule !== 'object') invalid('Uvjeti dolaznosti nisu valjani.');
  for (const value of [rule.total, rule.minimum])
    if (value !== null && (!Number.isSafeInteger(value) || value < 0))
      invalid('Brojevi dolazaka moraju biti nenegativni cijeli brojevi.');
  if (rule.total !== null && rule.minimum !== null && rule.minimum > rule.total)
    invalid('Minimum dolazaka ne može biti veći od ukupnog broja.');
  return { total: rule.total, minimum: rule.minimum };
}
export function courseInput(value: CourseInput): CourseInput {
  if (typeof value.isArchived !== 'boolean' || !value.attendanceRules)
    invalid('Stanje kolegija nije valjano.');
  return {
    semesterId: recordId(value.semesterId),
    name: plainText(value.name, 200, true),
    information: plainText(value.information, 10000),
    links: courseLinks(value.links),
    isArchived: value.isArchived,
    attendanceRules: {
      lecture: attendanceRule(value.attendanceRules.lecture),
      exercise: attendanceRule(value.attendanceRules.exercise),
    },
  };
}
