import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { environment, semester, uid } from './support';
import { AcademicRepository } from '../../src/app/data/academic.repository';
import { ScheduleRepository } from '../../src/app/data/schedule.repository';
import { unknownAttendanceRules, ActiveScope } from '../../src/app/domain/academic.models';
import { occurrences } from '../../src/app/domain/schedule';
import { TemplateInput } from '../../src/app/domain/schedule.models';
import { importCalendar } from '../../src/app/data/calendar-import';
export const template: TemplateInput = {
  courseId: 'c1',
  kind: 'lecture',
  weekday: 5,
  startsAt: '08:00',
  endsAt: '10:00',
  location: 'Sintetička učionica',
  validFrom: '2026-10-01',
  validUntil: '2027-02-01',
};
describe('Schedule SDK transactions', () => {
  let env: RulesTestEnvironment,
    academic: AcademicRepository,
    repo: ScheduleRepository,
    scope: ActiveScope;
  beforeAll(async () => {
    env = await environment();
  });
  afterAll(async () => {
    await env.cleanup();
  });
  beforeEach(async () => {
    await env.clearFirestore();
    const db = env.authenticatedContext(uid).firestore();
    academic = new AcademicRepository(db);
    repo = new ScheduleRepository(
      db,
      () => true,
      () => '2026-10-09',
    );
    scope = { uid, datasetId: (await academic.initialize(uid)).activeDatasetId };
    await academic.save(scope, 'semesters', 's1', semester, null);
    await academic.save(
      scope,
      'courses',
      'c1',
      {
        semesterId: 's1',
        name: 'Sintetički kolegij',
        information: '',
        links: [],
        isArchived: false,
        attendanceRules: unknownAttendanceRules(),
      },
      null,
    );
    await repo.saveTemplate(scope, 't1', template);
  });
  async function rows() {
    const d = await repo.window(scope, 'c1', '2026-10-01', '2027-02-01');
    return occurrences(d.templates, d.sessions, '2026-10-01', '2027-02-01');
  }
  it('calendar import preserves recorded/cancelled history, skips virtual duplicates and retries a partial import', async () => {
    const term = await academic.semester(scope, 's1');
    const original = (await rows())[0];
    await repo.saveSession(scope, original, { ...original, isCancelled: true });
    const common = {
      courseName: 'Sintetički kolegij',
      teachingLabel: 'Predavanja',
      kind: 'lecture' as const,
      scheduledOn: original.scheduledOn,
      startsAt: original.startsAt,
      endsAt: original.endsAt,
      location: original.location,
    };
    const fresh = {
      ...common,
      courseName: 'Novi sintetički kolegij',
      startsAt: '12:00',
      endsAt: '13:00',
    };
    // A readback interruption after the first new server-confirmed lesson mimics a partial run.
    await expect(
      importCalendar(
        academic,
        repo,
        scope,
        term,
        [common, fresh, { ...fresh, scheduledOn: '2026-10-12' }],
        (done) => {
          if (done === 2) throw new Error('Synthetic interruption');
        },
      ),
    ).rejects.toThrow('Synthetic interruption');
    const result = await importCalendar(
      academic,
      repo,
      scope,
      term,
      [common, fresh, { ...fresh, scheduledOn: '2026-10-12' }],
      () => undefined,
    );
    expect(result).toEqual({ added: 1, skipped: 2 });
    expect((await repo.session(scope, original.id)).isCancelled).toBe(true);
    expect((await academic.page(scope, 'courses', 's1')).records).toHaveLength(2);
    const control = await academic.readControl(uid);
    await expect(
      importCalendar(
        academic,
        repo,
        scope,
        term,
        [{ ...fresh, scheduledOn: '2027-02-02' }],
        () => undefined,
      ),
    ).rejects.toMatchObject({ category: 'validation' });
    expect((await academic.readControl(uid)).dataRevision).toBe(control.dataRevision);
  });
  it('marks one deterministic session and repeat/lost-response retry does not duplicate or increment', async () => {
    const row = (await rows())[0],
      before = (await academic.readControl(uid)).dataRevision;
    await repo.saveSession(scope, row, { ...row, attendance: 'present' });
    await repo.saveSession(scope, row, { ...row, attendance: 'present' });
    const saved = await repo.session(scope, row.id);
    expect(saved.revision).toBe(1);
    expect((await academic.readControl(uid)).dataRevision).toBe(before + 1);
    await repo.saveSession(scope, saved, { ...saved, attendance: 'absent' });
    expect((await repo.session(scope, row.id)).revision).toBe(2);
  });
  it('stale conflicting marks preserve the winning record; a fresh client reads it', async () => {
    const row = (await rows())[0];
    await repo.saveSession(scope, row, { ...row, attendance: 'present' });
    const other = new ScheduleRepository(env.authenticatedContext(uid).firestore());
    await expect(
      other.saveSession(scope, row, { ...row, attendance: 'absent' }),
    ).rejects.toMatchObject({ category: 'conflict', serverRecord: { attendance: 'present' } });
    expect((await other.session(scope, row.id)).attendance).toBe('present');
  });
  it('future split preserves past snapshots and updates only future virtual units', async () => {
    const row = (await rows())[0];
    await repo.saveSession(scope, row, { ...row, attendance: 'present' });
    const old = (await repo.window(scope, 'c1', '2026-10-01', '2027-02-01')).templates[0];
    await repo.saveTemplate(
      scope,
      't2',
      { ...template, startsAt: '12:00', endsAt: '14:00' },
      old,
      '2026-10-12',
    );
    expect((await repo.session(scope, row.id)).startsAt).toBe('08:00');
    expect((await rows()).find((r) => r.scheduledOn === '2026-10-16')?.startsAt).toBe('12:00');
  });
  it('stored future exception blocks a split without partial changes', async () => {
    const row = (await rows()).find((r) => r.scheduledOn === '2026-10-16')!;
    await repo.saveSession(scope, row, { ...row, isCancelled: true });
    const old = (await repo.window(scope, 'c1', '2026-10-01', '2027-02-01')).templates[0],
      revision = (await academic.readControl(uid)).dataRevision;
    await expect(
      repo.saveTemplate(
        scope,
        't2',
        { ...template, startsAt: '12:00', endsAt: '14:00' },
        old,
        '2026-10-12',
      ),
    ).rejects.toMatchObject({ category: 'conflict' });
    expect((await academic.readControl(uid)).dataRevision).toBe(revision);
    expect((await repo.window(scope, 'c1', '2026-10-01', '2027-02-01')).templates).toHaveLength(1);
  });
  it('cancellation clears attendance, replacement is separate and snapshots cannot move', async () => {
    const row = (await rows())[0];
    await repo.saveSession(scope, row, { ...row, attendance: 'present' });
    const saved = await repo.session(scope, row.id);
    await repo.saveSession(scope, saved, { ...saved, isCancelled: true, attendance: 'unmarked' });
    const replacement = {
      ...row,
      id: 'replacement',
      revision: null,
      templateId: null,
      replacementForId: row.id,
      scheduledOn: '2026-10-06',
    };
    await repo.saveSession(scope, replacement, replacement);
    expect((await repo.session(scope, 'replacement')).replacementForId).toBe(row.id);
    const outside = { ...replacement, id: 'after-semester', scheduledOn: '2027-02-03' };
    await repo.saveSession(scope, outside, outside);
    expect(
      (await repo.window(scope, 'c1', '2026-10-01', '2027-02-01', true)).sessions.some(
        (s) => s.id === 'after-semester',
      ),
    ).toBe(true);
    const canceled = await repo.session(scope, row.id);
    await expect(
      repo.saveSession(scope, canceled, { ...canceled, startsAt: '07:00' }),
    ).rejects.toMatchObject({ category: 'validation' });
    expect(canceled.attendance).toBe('unmarked');
  });
});
