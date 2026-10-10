import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { environment, semester, uid } from './support';
import { AcademicRepository } from '../../src/app/data/academic.repository';
import { unknownAttendanceRules } from '../../src/app/domain/academic.models';
describe('Real SDK transactions against Rules emulator', () => {
  let env: RulesTestEnvironment;
  beforeAll(async () => {
    env = await environment();
  });
  beforeEach(async () => {
    await env.clearFirestore();
  });
  afterAll(async () => {
    await env.cleanup();
  });
  function client() {
    return new AcademicRepository(env.authenticatedContext(uid).firestore());
  }
  it('simultaneous initialization creates one empty dataset and survives a new client', async () => {
    const first = client(),
      second = client();
    const [a, b] = await Promise.all([first.initialize(uid), second.initialize(uid)]);
    expect(a.activeDatasetId).toBe(b.activeDatasetId);
    expect(a.dataRevision).toBe(0);
    const page = await second.page({ uid, datasetId: a.activeDatasetId }, 'semesters');
    expect(page.records).toEqual([]);
  });
  it('initialization recovery never grants a second identity access to the owner root', async () => {
    await client().initialize(uid);
    const forbidden = new AcademicRepository(env.authenticatedContext('other-user').firestore());
    await expect(forbidden.initialize(uid)).rejects.toMatchObject({ category: 'forbidden' });
  });
  it('keeps semester/course history through switching, archive, explicit correction and fresh client', async () => {
    const repo = client(),
      root = await repo.initialize(uid),
      scope = { uid, datasetId: root.activeDatasetId };
    await repo.save(scope, 'semesters', 'old', semester, null);
    await repo.save(
      scope,
      'semesters',
      'new',
      { ...semester, name: 'Drugi sintetički semestar' },
      null,
    );
    await repo.save(
      scope,
      'courses',
      'course',
      {
        semesterId: 'old',
        name: 'Sintetički kolegij',
        information: 'Sačuvane informacije',
        links: [{ label: 'Izvor', url: 'https://example.test/course' }],
        isArchived: false,
        attendanceRules: unknownAttendanceRules(),
      },
      null,
    );
    await repo.selectSemester(scope, 'old', null);
    await repo.save(scope, 'semesters', 'old', { ...semester, isArchived: true }, 1);
    await repo.selectSemester(scope, 'new', 2);
    const fresh = client();
    expect((await fresh.preferences(scope))?.activeSemesterId).toBe('new');
    expect((await fresh.course(scope, 'course')).information).toBe('Sačuvane informacije');
    const course = await fresh.course(scope, 'course');
    await fresh.save(
      scope,
      'courses',
      'course',
      { ...course, information: 'Izričita korekcija arhive' },
      course.revision,
    );
    expect((await repo.course(scope, 'course')).information).toBe('Izričita korekcija arhive');
    expect((await repo.semester(scope, 'old')).isArchived).toBe(true);
  });
  it('stale edit does not overwrite, returns current server record; idempotent create is not duplicated', async () => {
    const a = client(),
      b = client(),
      root = await a.initialize(uid),
      scope = { uid, datasetId: root.activeDatasetId };
    await a.save(scope, 'semesters', 'semester', semester, null);
    await a.save(scope, 'semesters', 'semester', semester, null);
    expect((await a.readControl(uid)).dataRevision).toBe(1);
    await a.save(scope, 'semesters', 'semester', { ...semester, name: 'Prvi klijent' }, 1);
    await expect(
      b.save(
        scope,
        'semesters',
        'semester',
        { ...semester, name: 'Stari unos drugog klijenta' },
        1,
      ),
    ).rejects.toMatchObject({
      category: 'conflict',
      serverRecord: { name: 'Prvi klijent', revision: 2 },
    });
    expect((await b.semester(scope, 'semester')).name).toBe('Prvi klijent');
    expect((await b.readControl(uid)).dataRevision).toBe(2);
  });
  it('two concurrent edits of one revision produce exactly one success', async () => {
    const a = client(),
      b = client(),
      root = await a.initialize(uid),
      scope = { uid, datasetId: root.activeDatasetId };
    await a.save(scope, 'semesters', 's1', semester, null);
    const results = await Promise.allSettled([
      a.save(scope, 'semesters', 's1', { ...semester, name: 'A' }, 1),
      b.save(scope, 'semesters', 's1', { ...semester, name: 'B' }, 1),
    ]);
    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter((result) => result.status === 'rejected')).toHaveLength(1);
    expect((await a.semester(scope, 's1')).revision).toBe(2);
  });
  it('offline mutation fails before writing, unknown attendance remains null', async () => {
    const repo = client(),
      root = await repo.initialize(uid),
      scope = { uid, datasetId: root.activeDatasetId };
    await repo.save(scope, 'semesters', 's1', semester, null);
    const offline = new AcademicRepository(env.authenticatedContext(uid).firestore(), () => false);
    await expect(offline.save(scope, 'semesters', 's2', semester, null)).rejects.toMatchObject({
      category: 'offline',
    });
    await repo.save(
      scope,
      'courses',
      'c1',
      {
        semesterId: 's1',
        name: 'Nepoznati uvjeti',
        information: '',
        links: [],
        isArchived: false,
        attendanceRules: unknownAttendanceRules(),
      },
      null,
    );
    expect((await repo.course(scope, 'c1')).attendanceRules.lecture.total).toBeNull();
    expect((await repo.readControl(uid)).dataRevision).toBe(2);
  });
});
