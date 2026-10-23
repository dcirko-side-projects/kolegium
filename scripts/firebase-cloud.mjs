import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';

// Keep CLI credentials in the ignored workspace store, never in source or command arguments.
const configHome = resolve('.firebase-cli');
mkdirSync(configHome, { recursive: true });
const env = {
  ...process.env,
  XDG_CONFIG_HOME: configHome,
  FIREBASE_CLI_DISABLE_USAGE_REPORTING: 'true',
  NO_UPDATE_NOTIFIER: '1',
};
delete env.CI;
const args = process.argv.slice(2);
const approvedDeploy =
  args[0] === 'deploy' &&
  args.includes('--project') &&
  args[args.indexOf('--project') + 1] === 'kolegium-c8970' &&
  args.includes('--config') &&
  args[args.indexOf('--config') + 1] === 'firebase.release.json' &&
  args.includes('--only') &&
  ['firestore:rules', 'firestore:rules,firestore:indexes', 'hosting'].includes(
    args[args.indexOf('--only') + 1],
  );
if (
  ![
    'login',
    'login:list',
    'projects:list',
    'firestore:databases:list',
    'firestore:indexes',
  ].includes(args[0]) &&
  !approvedDeploy
)
  throw new Error('This preparation wrapper permits only account login and project inspection.');
const child = spawn(
  process.execPath,
  ['node_modules/firebase-tools/lib/bin/firebase.js', ...args],
  {
    stdio: 'inherit',
    windowsHide: true,
    env,
  },
);
child.on('error', () => {
  console.error('Firebase alat nije moguće pokrenuti.');
  process.exitCode = 1;
});
child.on('exit', (code) => {
  process.exitCode = code ?? 1;
});
