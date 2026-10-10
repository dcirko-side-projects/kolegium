import { spawn } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { resolve, join } from 'node:path';

const testing = process.argv[2] === 'test';
const env = {
  ...process.env,
  FIREBASE_EMULATORS_PATH: resolve('.emulator-cache'),
  XDG_CONFIG_HOME: resolve('.firebase-cli'),
  FIREBASE_CLI_DISABLE_USAGE_REPORTING: 'true',
  CI: 'true',
  NO_UPDATE_NOTIFIER: '1',
};
const javaHome =
  env.JAVA_HOME ??
  (process.platform === 'win32' && existsSync('C:/Program Files/Java/jdk-21')
    ? 'C:/Program Files/Java/jdk-21'
    : undefined);
if (javaHome) {
  env.JAVA_HOME = javaHome;
  env.PATH = join(javaHome, 'bin') + (process.platform === 'win32' ? ';' : ':') + env.PATH;
}
mkdirSync('.emulator-cache', { recursive: true });
const args = [
  'node_modules/firebase-tools/lib/bin/firebase.js',
  'emulators:start',
  '--only',
  'auth,firestore',
  '--config',
  testing ? 'firebase.test.json' : 'firebase.emulator.json',
  '--project',
  testing ? 'demo-kolegium-tests' : 'demo-kolegium',
];
if (!testing) {
  if (existsSync('.emulator-data/firebase-export-metadata.json'))
    args.push('--import', '.emulator-data');
  args.push('--export-on-exit', '.emulator-data');
}
const child = spawn(process.execPath, args, { stdio: 'inherit', env, windowsHide: true });
child.on('error', (error) => {
  console.error(error.message);
  process.exitCode = 1;
});
child.on('exit', (code) => {
  process.exitCode = code ?? 1;
});
