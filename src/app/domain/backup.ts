import { ApplicationError } from '../core/errors/application-error';
import { courseInput, semesterInput, recordId } from './academic.validation';
import { sessionInput, templateInput } from './schedule';
import {
  assessmentInput,
  projectInput,
  taskInput,
  thesisInput,
  scoreActivityInput,
  scoreAttemptInput,
  attemptId,
  activityId,
} from './work.validation';
import { installmentInput, rulesInput, outcomeInput, calculateCourse, units } from './grading';
import { CourseInput, SemesterInput } from './academic.models';
import { SessionInput, TemplateInput } from './schedule.models';
import {
  AssessmentInput,
  ProjectInput,
  TaskInput,
  ThesisInput,
  ScoreActivityInput,
  ScoreAttemptInput,
  ScoreActivity,
  ScoreAttempt,
} from './work.models';
import { InstallmentInput, GradingRulesInput, CourseOutcomeInput } from './planning.models';

export const backupCollections = [
  'semesters',
  'courses',
  'scheduleTemplates',
  'sessions',
  'assessments',
  'projects',
  'thesis',
  'scoreActivities',
  'scoreAttempts',
  'gradingRules',
  'courseOutcomes',
  'tasks',
  'installments',
  'preferences',
] as const;
export type BackupCollection = (typeof backupCollections)[number];
export type BackupRow = Record<string, unknown> & { id: string };
export interface BackupEnvelope {
  format: 'kolegium-backup';
  schemaVersion: 1;
  exportedAt: string;
  collections: Record<BackupCollection, BackupRow[]>;
}
export const backupBytes = 5 * 1024 * 1024,
  backupRecords = 10000;
export function serializeBackup(input: BackupEnvelope): string {
  // Pretty-printing can push a valid near-limit backup beyond the import byte limit.
  return JSON.stringify(validateBackup(input));
}
function fail(): never {
  throw new ApplicationError(
    'invalidBackup',
    'Sigurnosna kopija nije valjana. Provjeri format, podatke i njihove veze.',
  );
}
function object(v: unknown): Record<string, unknown> {
  if (!v || typeof v !== 'object' || Array.isArray(v)) fail();
  return v as Record<string, unknown>;
}
function keys(v: Record<string, unknown>, names: readonly string[]) {
  if (Object.keys(v).length !== names.length || names.some((n) => !Object.hasOwn(v, n))) fail();
}
export function canonical(value: unknown): string {
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  if (value && typeof value === 'object')
    return (
      '{' +
      Object.keys(value)
        .sort()
        .map((k) => JSON.stringify(k) + ':' + canonical((value as Record<string, unknown>)[k]))
        .join(',') +
      '}'
    );
  return JSON.stringify(value);
}
function payload(name: BackupCollection, v: Record<string, unknown>): Record<string, unknown> {
  switch (name) {
    case 'semesters':
      return { ...semesterInput(v as unknown as SemesterInput) };
    case 'courses':
      return { ...courseInput(v as unknown as CourseInput) };
    case 'scheduleTemplates':
      return { ...templateInput(v as unknown as TemplateInput) };
    case 'sessions':
      return { ...sessionInput(v as unknown as SessionInput) };
    case 'assessments':
      return { ...assessmentInput(v as unknown as AssessmentInput) };
    case 'projects':
      return { ...projectInput(v as unknown as ProjectInput) };
    case 'tasks':
      return { ...taskInput(v as unknown as TaskInput) };
    case 'thesis':
      return { ...thesisInput(v as unknown as ThesisInput) };
    case 'scoreActivities':
      return { ...scoreActivityInput(v as unknown as ScoreActivityInput) };
    case 'scoreAttempts':
      return { ...scoreAttemptInput(v as unknown as ScoreAttemptInput) };
    case 'installments':
      return { ...installmentInput(v as unknown as InstallmentInput) };
    case 'gradingRules':
      return { ...rulesInput(v as unknown as GradingRulesInput) };
    case 'courseOutcomes':
      return { ...outcomeInput(v as unknown as CourseOutcomeInput) };
    case 'preferences':
      return {
        activeSemesterId: v['activeSemesterId'] === null ? null : recordId(v['activeSemesterId']),
      };
  }
}
export function parseBackup(text: string): BackupEnvelope {
  if (new TextEncoder().encode(text).byteLength > backupBytes)
    throw new ApplicationError('invalidBackup', 'Kopija prelazi ograničenje od 5 MiB.');
  try {
    return validateBackup(JSON.parse(text));
  } catch (e) {
    if (e instanceof ApplicationError && e.category === 'unsupportedSchema') throw e;
    fail();
  }
}
export function validateBackup(value: unknown): BackupEnvelope {
  try {
    const envelope = object(value);
    keys(envelope, ['format', 'schemaVersion', 'exportedAt', 'collections']);
    if (envelope['format'] !== 'kolegium-backup') fail();
    if (envelope['schemaVersion'] !== 1)
      throw new ApplicationError('unsupportedSchema', 'Verzija sigurnosne kopije nije podržana.');
    const exportedAt = envelope['exportedAt'];
    if (
      typeof exportedAt !== 'string' ||
      !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(exportedAt) ||
      new Date(exportedAt).toISOString() !== exportedAt
    )
      fail();
    const raw = object(envelope['collections']);
    keys(raw, backupCollections);
    const collections = {} as BackupEnvelope['collections'];
    let total = 0;
    for (const name of backupCollections) {
      const rows = raw[name];
      if (!Array.isArray(rows) || (total += rows.length) > backupRecords) fail();
      const ids = new Set<string>();
      collections[name] = rows
        .map((row) => {
          const r = object(row),
            id = recordId(r['id']);
          if (ids.has(id)) fail();
          ids.add(id);
          const input = payload(name, r),
            normalized = { id, ...input };
          keys(r, Object.keys(normalized));
          if (canonical(r) !== canonical(normalized)) fail();
          return normalized;
        })
        .sort((a, b) => a.id.localeCompare(b.id));
    }
    const maps = Object.fromEntries(
      backupCollections.map((n) => [n, new Map(collections[n].map((r) => [r.id, r]))]),
    ) as Record<BackupCollection, Map<string, BackupRow>>;
    const ref = (n: BackupCollection, id: unknown) => {
      if (typeof id !== 'string' || !maps[n].has(id)) fail();
      return maps[n].get(id)!;
    };
    for (const c of collections.courses) ref('semesters', c['semesterId']);
    for (const t of collections.scheduleTemplates) {
      const c = ref('courses', t['courseId']),
        s = ref('semesters', c['semesterId']);
      if (
        String(t['validFrom']) < String(s['startsOn']) ||
        String(t['validUntil']) > String(s['endsOn'])
      )
        fail();
    }
    for (const s of collections.sessions) {
      ref('courses', s['courseId']);
      if (s['templateId'] !== null) {
        const t = ref('scheduleTemplates', s['templateId']);
        if (t['courseId'] !== s['courseId'] || s.id !== s['templateId'] + '_' + s['scheduledOn'])
          fail();
      }
      if (s['replacementForId'] !== null) {
        const old = ref('sessions', s['replacementForId']);
        if (
          old.id === s.id ||
          old['courseId'] !== s['courseId'] ||
          old['kind'] !== s['kind'] ||
          s['templateId'] !== null
        )
          fail();
      }
    }
    for (const s of collections.sessions) {
      const seen = new Set<string>();
      let current = s;
      while (current['replacementForId'] !== null) {
        if (seen.has(current.id)) fail();
        seen.add(current.id);
        current = ref('sessions', current['replacementForId']);
      }
    }
    for (const a of collections.assessments) ref('courses', a['courseId']);
    for (const p of collections.projects) if (p['courseId'] !== null) ref('courses', p['courseId']);
    if (collections.thesis.length > 1 || collections.thesis.some((r) => r.id !== 'main')) fail();
    for (const t of collections.tasks) {
      const ctx = object(t['context']);
      if (ctx['type'] !== 'none')
        ref(
          ctx['type'] === 'course' ? 'courses' : ctx['type'] === 'project' ? 'projects' : 'thesis',
          ctx['id'],
        );
    }
    for (const a of collections.scoreActivities) {
      const source = object(a['source']),
        type = source['type'] as ScoreActivityInput['source']['type'];
      if (a['courseId'] !== null) ref('courses', a['courseId']);
      if (type === 'lecture' || type === 'exercise') {
        if (
          a['courseId'] === null ||
          source['id'] !== null ||
          !a.id.startsWith(type + '_' + a['courseId'] + '_')
        )
          fail();
      } else {
        const original = ref(type === 'assessment' ? 'assessments' : 'projects', source['id']);
        if (
          original['courseId'] !== a['courseId'] ||
          a.id !== activityId(type, String(source['id']))
        )
          fail();
      }
    }
    for (const a of collections.scoreAttempts) {
      const activity = ref('scoreActivities', a['activityId']);
      if (
        a.id !== attemptId(a as unknown as ScoreAttemptInput) ||
        (a['points'] !== null &&
          activity['maxPoints'] !== null &&
          units(a['points'] as string) > units(activity['maxPoints'] as string))
      )
        fail();
    }
    for (const r of collections.gradingRules) {
      ref('courses', r.id);
      calculateCourse(
        r.id,
        collections.scoreActivities.filter(
          (a) => a['courseId'] === r.id,
        ) as unknown as ScoreActivity[],
        collections.scoreAttempts as unknown as ScoreAttempt[],
        r as unknown as GradingRulesInput,
        new Set(
          collections.scoreActivities
            .filter((a) => {
              const src = object(a['source']);
              return (
                (src['type'] === 'assessment' || src['type'] === 'project') &&
                ref(src['type'] === 'assessment' ? 'assessments' : 'projects', src['id'])[
                  'isCompleted'
                ] === true
              );
            })
            .map((a) => a.id),
        ),
      );
    }
    for (const r of collections.courseOutcomes) ref('courses', r.id);
    if (collections.preferences.length > 1 || collections.preferences.some((r) => r.id !== 'app'))
      fail();
    for (const p of collections.preferences)
      if (
        p['activeSemesterId'] !== null &&
        ref('semesters', p['activeSemesterId'])['isArchived'] !== false
      )
        fail();
    const result: BackupEnvelope = {
      format: 'kolegium-backup',
      schemaVersion: 1,
      exportedAt,
      collections,
    };
    if (new TextEncoder().encode(JSON.stringify(result)).byteLength > backupBytes) fail();
    return result;
  } catch (e) {
    if (e instanceof ApplicationError && e.category === 'unsupportedSchema') throw e;
    fail();
  }
}
