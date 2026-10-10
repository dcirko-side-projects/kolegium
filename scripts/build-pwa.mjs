import { readdir, readFile, writeFile } from 'node:fs/promises';
import { resolve, relative } from 'node:path';
import { createHash } from 'node:crypto';
const root = resolve('dist/kolegium/browser');
async function walk(dir) {
  const rows = await readdir(dir, { withFileTypes: true });
  return (
    await Promise.all(
      rows.map(async (r) =>
        r.isDirectory() ? walk(resolve(dir, r.name)) : [resolve(dir, r.name)],
      ),
    )
  ).flat();
}
const assets = (await walk(root))
  .map((p) => '/' + relative(root, p).replaceAll('\\', '/'))
  .filter((p) => p !== '/service-worker.js')
  .filter(
    (p) =>
      p === '/index.html' ||
      p === '/manifest.webmanifest' ||
      /^\/(?:[A-Za-z0-9_-]+\.(?:js|css)|icons\/[A-Za-z0-9_-]+\.(?:png|svg))$/.test(p),
  )
  .sort();
if (!assets.includes('/index.html') || !assets.some((p) => p.startsWith('/main-')))
  throw new Error('Production build missing.');
const hash = createHash('sha256');
for (const path of assets) hash.update(path).update(await readFile(resolve(root, '.' + path)));
const version = hash.digest('hex').slice(0, 20);
const template = await readFile('scripts/service-worker.template.js', 'utf8');
await writeFile(
  resolve(root, 'service-worker.js'),
  template
    .replace('__VERSION__', JSON.stringify(version))
    .replace('__ASSETS__', JSON.stringify(assets)),
);
console.log(`PWA public shell ${version}: ${assets.length} static files; no API/data cache.`);
