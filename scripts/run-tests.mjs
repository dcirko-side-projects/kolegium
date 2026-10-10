import { mkdirSync } from 'node:fs';
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
};
if (!commands[target]) throw new Error('Unknown test target.');
const child = spawn(process.execPath, commands[target], {
  stdio: 'inherit',
  windowsHide: true,
  env: { ...process.env, TEMP: temporary, TMP: temporary, TMPDIR: temporary },
});
child.on('error', (error) => {
  console.error(error.message);
  process.exitCode = 1;
});
child.on('exit', (code) => {
  process.exitCode = code ?? 1;
});
