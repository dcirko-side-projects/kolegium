import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { assertFails, RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { environment, semester, uid } from './support';
import { AcademicRepository } from '../../src/app/data/academic.repository';
import { ScheduleRepository } from '../../src/app/data/schedule.repository';
import { ActiveScope, unknownAttendanceRules } from '../../src/app/domain/academic.models';
import { TemplateInput } from '../../src/app/domain/schedule.models';
import { occurrences } from '../../src/app/domain/schedule';
const input: TemplateInput = {
  courseId: 'c1',
  kind: 'lecture',
  weekday: 5,
  startsAt: '08:00',
  endsAt: '10:00',
  location: null,
  validFrom: '2026-10-01',
  validUntil: '2027-02-01',
};
describe('Schedule Rules boundary', () => {
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
    repo = new ScheduleRepository(db);
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
  });
  async function raw(name: string, id: string, payload: object) {
    const db = env.authenticatedContext(uid).firestore(),
      root = await academic.readControl(uid),
      batch = writeBatch(db);
    batch.set(doc(db, 'users', uid, 'datasets', scope.datasetId, name, id), {
      ...payload,
      id,
      revision: 1,
      updatedAt: serverTimestamp(),
    });
    batch.update(doc(db, 'users', uid), {
      dataRevision: root.dataRevision + 1,
      updatedAt: serverTimestamp(),
    });
    return batch.commit();
  }
  it('rejects missing parent, invalid times, date bounds and unknown fields', async () => {
    await assertFails(raw('scheduleTemplates', 't1', { ...input, courseId: 'missing' }));
    await assertFails(raw('scheduleTemplates', 't1', { ...input, startsAt: '25:00' }));
    await assertFails(raw('scheduleTemplates', 't1', { ...input, validFrom: '2026-09-30' }));
    await assertFails(raw('scheduleTemplates', 't1', { ...input, extra: true }));
    await assertFails(raw('scheduleTemplates', 't1', { ...input, weekday: 0 }));
    await repo.saveTemplate(scope, 't1', input);
    expect(
      (await repo.window(scope, 'c1', input.validFrom, input.validUntil)).templates,
    ).toHaveLength(1);
  });
  it('requires deterministic template snapshot and rejects canceled/present and foreign replacements', async () => {
    await repo.saveTemplate(scope, 't1', input);
    const d = await repo.window(scope, 'c1', input.validFrom, input.validUntil),
      row = occurrences(d.templates, [], input.validFrom, input.validUntil)[0];
    await assertFails(raw('sessions', 'wrong-id', row));
    await assertFails(raw('sessions', row.id, { ...row, startsAt: '07:00' }));
    await assertFails(raw('sessions', row.id, { ...row, scheduledOn: '2026-10-03' }));
    await assertFails(
      raw('sessions', row.id, { ...row, isCancelled: true, attendance: 'present' }),
    );
    await assertFails(
      raw('sessions', 'replacement', { ...row, templateId: null, replacementForId: 'missing' }),
    );
    await repo.saveSession(scope, row, { ...row, attendance: 'present' });
    const db = env.authenticatedContext(uid).firestore(),
      batch = writeBatch(db),
      root = await academic.readControl(uid);
    batch.update(doc(db, 'users', uid, 'datasets', scope.datasetId, 'sessions', row.id), {
      scheduledOn: '2026-10-09',
      revision: 2,
      updatedAt: serverTimestamp(),
    });
    batch.update(doc(db, 'users', uid), {
      dataRevision: root.dataRevision + 1,
      updatedAt: serverTimestamp(),
    });
    await assertFails(batch.commit());
  });
  it('rejects another UID and normal writes under restore lock', async () => {
    await repo.saveTemplate(scope, 't1', input);
    const other = new ScheduleRepository(env.authenticatedContext('other').firestore());
    await expect(
      other.window(scope, 'c1', input.validFrom, input.validUntil),
    ).rejects.toMatchObject({ category: 'forbidden' });
    await env.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore(),
        batch = writeBatch(db);
      batch.update(doc(db, 'users', uid), { restoreToken: 'lock' });
      await batch.commit();
    });
    await expect(repo.saveTemplate(scope, 't2', input)).rejects.toMatchObject({
      category: 'restoreInProgress',
    });
  });
  it('permits bounded excused notes and rejects notes attached to present/cancelled sessions', async () => {
    const row = {
      courseId: 'c1',
      templateId: null,
      scheduledOn: '2026-10-09',
      startsAt: '08:00',
      endsAt: '09:00',
      kind: 'lecture',
      location: null,
      isCancelled: false,
      attendance: 'excused',
      absenceNote: 'Potvrda',
      replacementForId: null,
    };
    await raw('sessions', 'excused', row);
    await assertFails(raw('sessions', 'invalid-present', { ...row, attendance: 'present' }));
    await assertFails(raw('sessions', 'invalid-cancelled', { ...row, isCancelled: true }));
    await assertFails(raw('sessions', 'invalid-long', { ...row, absenceNote: 'x'.repeat(501) }));
    await assertFails(raw('sessions', 'invalid-empty', { ...row, absenceNote: '   ' }));
    await assertFails(raw('sessions', 'invalid-state', { ...row, attendance: 'approved' }));
  });
});
