import { readFile, writeFile } from 'node:fs/promises';
import { transform } from 'esbuild';
import { format } from 'prettier';

// Read the public deployment identity without importing or executing application code.
const config = await readFile('src/app/core/config/firebase-project.ts', 'utf8');
await transform(config, { loader: 'ts' });
const uid = config.match(/approvedUid:\s*'([A-Za-z0-9_-]{1,128})'/)?.[1];
const projectId = config.match(/projectId:\s*'([a-z0-9-]+)'/)?.[1];
if (!uid || uid === 'local-owner' || !projectId || projectId.startsWith('demo-'))
  throw new Error('Release requires a real approved UID and project ID.');
const source = await readFile('firebase/firestore.rules', 'utf8');
const marker = "uid == 'local-owner'";
if (source.split(marker).length !== 2)
  throw new Error('Expected exactly one local owner authorization marker.');
await writeFile(
  'firebase/firestore.release.rules',
  source.replace(marker, `uid == '${uid}'`),
  'utf8',
);
console.log('Release Rules prepared. firebase.json still selects deny-all production Rules.');
const deployment = JSON.parse(await readFile('firebase.json', 'utf8'));
deployment.firestore.rules = 'firebase/firestore.release.rules';
await writeFile(
  'firebase.release.json',
  await format(JSON.stringify(deployment), { parser: 'json' }),
  'utf8',
);
console.log('Separate firebase.release.json prepared for review; no deploy performed.');
