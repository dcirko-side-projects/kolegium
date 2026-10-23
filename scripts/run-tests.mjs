import { mkdirSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { spawn } from 'node:child_process';
const target = process.argv[2];
const temporary = resolve('.angular/tmp');
mkdirSync(temporary, { recursive: true });
const commands = {
  unit: ['node_modules/@angular/cli/bin/ng.js', 'test', '--watch=false'],
  watch: ['node_modules/@angular/cli/bin/ng.js', 'test'],
  'release-rules': [
    'node_modules/vitest/vitest.mjs',
    'run',
    '--config',
    'vitest.firebase.config.ts',
    'tests/firebase/release.rules.test.ts',
  ],
  rules: [
    'node_modules/vitest/vitest.mjs',
    'run',
    '--config',
    'vitest.firebase.config.ts',
    'tests/firebase/rules.test.ts',
    'tests/firebase/schedule.rules.test.ts',
    'tests/firebase/work.rules.test.ts',
    'tests/firebase/planning.rules.test.ts',
  ],
  integration: [
    'node_modules/vitest/vitest.mjs',
    'run',
    '--config',
    'vitest.firebase.config.ts',
    'tests/firebase/integration.test.ts',
    'tests/firebase/schedule.integration.test.ts',
    'tests/firebase/work.integration.test.ts',
    'tests/firebase/planning.integration.test.ts',
    'tests/firebase/backup.integration.test.ts',
  ],
  'backup-file': [
    'node_modules/vitest/vitest.mjs',
    'run',
    '--config',
    'vitest.firebase.config.ts',
    'tests/firebase/backup-file.integration.test.ts',
  ],
};
if (!commands[target]) throw new Error('Unknown test target.');
if (target === 'backup-file' && !process.env.KOLEGIUM_BACKUP_VERIFY_FILE)
  throw new Error('Set KOLEGIUM_BACKUP_VERIFY_FILE to a private backup JSON file.');
const child = spawn(process.execPath, commands[target], {
  stdio: 'inherit',
  windowsHide: true,
  env: { ...process.env, TEMP: temporary, TMP: temporary, TMPDIR: temporary },
});
child.on('error', (error) => {
  console.error(error.message);
  process.exitCode = 1;
});
child.on('exit', async (code) => {
  if (target === 'release-rules') {
    try {
      // Release authorization is tested on the same disposable emulator. Restore
      // its local-owner rules before another SDK/browser suite uses it.
      const { initializeTestEnvironment } = await import('@firebase/rules-unit-testing');
      const environment = await initializeTestEnvironment({
        projectId: 'demo-kolegium-tests',
        firestore: {
          host: '127.0.0.1',
          port: 18080,
          rules: await readFile('firebase/firestore.rules', 'utf8'),
        },
      });
      await environment.cleanup();
      console.log('Test emulator local-owner Rules restored.');
    } catch {
      console.error('Test emulator Rules restoration failed. Restart it before the next suite.');
      process.exitCode = 1;
      return;
    }
  }
  process.exitCode = code ?? 1;
});
