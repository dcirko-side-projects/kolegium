import { readFile } from 'node:fs/promises';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { RulesTestEnvironment } from '@firebase/rules-unit-testing';
import { AcademicRepository } from '../../src/app/data/academic.repository';
import { BackupRepository } from '../../src/app/data/backup.repository';
import { BackupEnvelope, canonical, validateBackup } from '../../src/app/domain/backup';
import { bootstrap, environment, uid } from './support';

// Explicit opt-in: private contents stay on the disposable loopback emulator.
// Validation happens before initializing or clearing that fixed test project.
const inputPath = process.env['KOLEGIUM_BACKUP_VERIFY_FILE'];
describe.skipIf(!inputPath)('private backup file on isolated test emulator', () => {
  let env: RulesTestEnvironment;
  let input: BackupEnvelope;
  beforeAll(async () => {
    input = validateBackup(JSON.parse(await readFile(inputPath!, 'utf8')));
    env = await environment();
  });
  afterAll(async () => {
    if (env) {
      try {
        await env.clearFirestore();
      } finally {
        await env.cleanup();
      }
    }
  });
  beforeEach(async () => {
    await env.clearFirestore();
    await bootstrap(env);
  });
  it('restores and re-exports every payload while preserving the previous generation', async () => {
    const db = env.authenticatedContext(uid).firestore();
    const repo = new BackupRepository(db);
    await repo.restore(uid, input, 0);
    // Avoid printing private payloads in assertion diffs or test reports.
    expect(canonical((await repo.export(uid)).collections) === canonical(input.collections)).toBe(
      true,
    );
    const previous = await repo.export(uid, true);
    expect(Object.values(previous.collections).every((rows) => rows.length === 0)).toBe(true);
    expect((await new AcademicRepository(db).readControl(uid)).restoreToken).toBeNull();
  }, 120000);
  it('interruption before activation preserves active data and permits abort and staging cleanup', async () => {
    const db = env.authenticatedContext(uid).firestore();
    const repo = new BackupRepository(
      db,
      () => true,
      async (phase) => {
        if (phase === 'beforeCommit') throw new Error('Synthetic interruption');
      },
    );
    await expect(repo.restore(uid, input, 0)).rejects.toThrow('Synthetic interruption');
    const control = new AcademicRepository(db);
    const locked = await control.readControl(uid);
    expect(locked.activeDatasetId).toBe('initial');
    expect(locked.restoreToken).not.toBeNull();
    const abandoned = locked.stagingDatasetId!;
    await repo.abort(uid);
    const after = await repo.export(uid);
    expect(Object.values(after.collections).every((rows) => rows.length === 0)).toBe(true);
    await repo.cleanup(uid, abandoned);
    expect(await repo.orphans(uid)).toEqual([]);
    expect((await control.readControl(uid)).restoreToken).toBeNull();
  }, 120000);
});
