import { describe, it, expect } from 'vitest';
import {
  BackupEnvelope,
  backupCollections,
  parseBackup,
  validateBackup,
  backupBytes,
  serializeBackup,
} from './backup';
export function sampleBackup(): BackupEnvelope {
  const collections = Object.fromEntries(
    backupCollections.map((n) => [n, []]),
  ) as unknown as BackupEnvelope['collections'];
  collections.semesters = [
    {
      id: 's1',
      name: 'Sintetički semestar',
      startsOn: '2026-10-01',
      endsOn: '2027-02-01',
      isArchived: false,
    },
  ];
  collections.courses = [
    {
      id: 'c1',
      semesterId: 's1',
      name: 'Sintetički kolegij',
      information: '',
      links: [],
      isArchived: false,
      attendanceRules: {
        lecture: { total: null, minimum: null },
        exercise: { total: null, minimum: null },
      },
    },
  ];
  collections.preferences = [{ id: 'app', activeSemesterId: 's1' }];
  collections.installments = [
    { id: 'r1', name: 'Sintetička rata', amountCents: 1234, dueOn: '2026-10-15', isPaid: false },
  ];
  return {
    format: 'kolegium-backup',
    schemaVersion: 1,
    exportedAt: '2026-10-10T00:00:00.000Z',
    collections,
  };
}
describe('Complete backup envelope and graph', () => {
  it('roundtrips optional excused notes while accepting legacy sessions and rejecting foreign metadata', () => {
    const b = sampleBackup();
    b.collections.sessions = [
      {
        id: 's1',
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
      },
    ];
    expect(parseBackup(serializeBackup(b)).collections.sessions[0]['absenceNote']).toBe('Potvrda');
    delete b.collections.sessions[0]['absenceNote'];
    b.collections.sessions[0]['attendance'] = 'absent';
    expect(parseBackup(serializeBackup(b)).collections.sessions[0]['attendance']).toBe('absent');
    b.collections.sessions[0]['absenceNote'] = 'Ne pripada običnom izostanku';
    expect(() => validateBackup(b)).toThrow();
  });
  it('exports a valid near-limit UTF-8 file that can be imported again without whitespace overhead', () => {
    const b = sampleBackup();
    b.collections.courses = Array.from({ length: 505 }, (_, i) => ({
      ...b.collections.courses[0],
      id: 'c' + i,
      name: 'C',
      information: 'x'.repeat(10000),
    }));
    expect(new TextEncoder().encode(JSON.stringify(b, null, 2)).byteLength).toBeGreaterThan(
      backupBytes,
    );
    const text = serializeBackup(b);
    expect(new TextEncoder().encode(text).byteLength).toBeLessThanOrEqual(backupBytes);
    expect(parseBackup(text).collections.courses).toHaveLength(505);
  });
  it('rejects circular replacement sessions even when each individual reference exists', () => {
    const b = sampleBackup();
    b.collections.sessions = ['r_a', 'r_b'].map((id, i) => ({
      id,
      courseId: 'c1',
      templateId: null,
      scheduledOn: '2026-10-10',
      startsAt: '08:00',
      endsAt: '09:00',
      kind: 'lecture',
      location: null,
      isCancelled: true,
      attendance: 'unmarked',
      replacementForId: i === 0 ? 'r_b' : 'r_a',
    }));
    expect(() => validateBackup(b)).toThrow();
  });
  it('roundtrips canonical payloads and rejects unknown versions, metadata/secrets and oversized files', () => {
    const b = sampleBackup();
    expect(parseBackup(JSON.stringify(b))).toEqual(b);
    for (const v of [
      { ...b, uid: 'other' },
      { ...b, schemaVersion: 2 },
      {
        ...b,
        collections: { ...b.collections, courses: [{ ...b.collections.courses[0], revision: 1 }] },
      },
      {
        ...b,
        collections: {
          ...b.collections,
          thesis: [{ id: 'main', topic: null, mentor: null, information: '', token: 'secret' }],
        },
      },
    ])
      expect(() => validateBackup(v)).toThrow();
    expect(() => parseBackup(' '.repeat(backupBytes + 1))).toThrow();
  });
  it('rejects duplicates, missing references before any write while preserving unknown and zero', () => {
    const b = sampleBackup();
    expect(() =>
      validateBackup({
        ...b,
        collections: {
          ...b.collections,
          semesters: [...b.collections.semesters, ...b.collections.semesters],
        },
      }),
    ).toThrow();
    expect(() =>
      validateBackup({ ...b, collections: { ...b.collections, semesters: [] } }),
    ).toThrow();
    b.collections.scoreActivities = [
      {
        id: 'exercise_c1_a',
        courseId: 'c1',
        name: 'Sintetička vježba',
        source: { type: 'exercise', id: null },
        componentKey: null,
        maxPoints: '10',
        minimumPoints: null,
      },
    ];
    b.collections.scoreAttempts = [
      {
        id: 'exercise_c1_a_1',
        activityId: 'exercise_c1_a',
        attemptNumber: 1,
        takenOn: null,
        points: '0',
        grade: null,
      },
      {
        id: 'exercise_c1_a_2',
        activityId: 'exercise_c1_a',
        attemptNumber: 2,
        takenOn: null,
        points: null,
        grade: null,
      },
    ];
    expect(validateBackup(b).collections.scoreAttempts.map((a) => a['points'])).toEqual([
      '0',
      null,
    ]);
    b.collections.scoreAttempts[0]['points'] = '11';
    expect(() => validateBackup(b)).toThrow();
  });
});
