import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
process.env.PLAYWRIGHT_BROWSERS_PATH ??= '.playwright-browsers';
process.env.TEMP = process.env.TMP = process.env.TMPDIR = resolve('.angular/tmp');
await mkdir(process.env.TEMP, { recursive: true });
const { chromium } = await import('@playwright/test');
const root = resolve('dist/kolegium/browser');
let nextVersion = false;
const server = createServer(async (req, res) => {
  const path = new URL(req.url, 'http://127.0.0.1').pathname;
  if (path === '/private-data' || path.startsWith('/__/auth/')) {
    res.setHeader('Content-Type', 'application/json');
    res.end('{"private":"synthetic"}');
    return;
  }
  const safe =
    /^\/(?:[A-Za-z0-9_-]+\.(?:js|css|html|webmanifest)|icons\/[A-Za-z0-9_-]+\.(?:svg|png))$/.test(
      path,
    );
  try {
    let bytes = await readFile(resolve(root, '.' + (safe ? path : '/index.html')));
    if (path === '/service-worker.js' && nextVersion)
      bytes = Buffer.from(
        bytes.toString().replace(/const version = "([^"]+)"/, 'const version = "$1-update-test"'),
      );
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader(
      'Content-Type',
      path.endsWith('.js')
        ? 'application/javascript'
        : path.endsWith('.css')
          ? 'text/css'
          : path.endsWith('.png')
            ? 'image/png'
            : path.endsWith('.svg')
              ? 'image/svg+xml'
              : path.endsWith('.webmanifest')
                ? 'application/manifest+json'
                : 'text/html',
    );
    res.end(bytes);
  } catch {
    res.statusCode = 404;
    res.end();
  }
});
await new Promise((ok) => server.listen(4401, '127.0.0.1', ok));
const browser = await chromium.launch();
try {
  const context = await browser.newContext(),
    page = await context.newPage();
  await page.goto('http://127.0.0.1:4401/login');
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);
  if (process.argv.includes('--release')) {
    await page.getByRole('button', { name: 'Prijava Google računom', exact: true }).waitFor();
    assert.equal(await page.locator('main').getAttribute('data-project-id'), 'kolegium-c8970');
    assert.doesNotMatch(await page.locator('main').innerText(), /Produkcijska konfiguracija/);
  } else assert.match(await page.locator('main').innerText(), /Produkcijska konfiguracija/);
  await page.evaluate(async () => {
    await fetch('/private-data');
    await fetch('/__/auth/handler');
  });
  const cached = await page.evaluate(async () =>
    (
      await Promise.all(
        (await caches.keys())
          .filter((n) => n.startsWith('kolegium-shell-'))
          .map(async (n) =>
            (await (await caches.open(n)).keys()).map((r) => new URL(r.url).pathname),
          ),
      )
    ).flat(),
  );
  assert(cached.includes('/index.html'));
  assert(
    cached.every((p) =>
      /^\/(?:index\.html|manifest\.webmanifest|[A-Za-z0-9_-]+\.(?:js|css)|icons\/[A-Za-z0-9_-]+\.(?:png|svg))$/.test(
        p,
      ),
    ),
  );
  await context.setOffline(true);
  await page.goto('http://127.0.0.1:4401/login');
  assert.match(await page.locator('main').innerText(), /Tvoj studentski prostor/);
  assert.equal(
    await page.evaluate(async () => {
      try {
        await fetch('/private-data');
        return false;
      } catch {
        return true;
      }
    }),
    true,
  );
  await context.setOffline(false);
  const other = await context.newPage();
  await other.goto('http://127.0.0.1:4401/login');
  await other.evaluate(() => {
    window.unsavedMarker = 'unsaved';
  });
  nextVersion = true;
  await page.evaluate(async () => {
    await (await navigator.serviceWorker.ready).update();
  });
  await page.getByRole('button', { name: 'Učitaj novu verziju' }).waitFor();
  await page.getByRole('button', { name: 'Učitaj novu verziju' }).click();
  await page.waitForFunction(
    () => !document.body.innerText.includes('Nova verzija aplikacije je spremna.'),
  );
  await other.getByRole('button', { name: 'Učitaj novu verziju' }).waitFor();
  assert.equal(await other.evaluate(() => window.unsavedMarker), 'unsaved'); // Another tab is never auto-reloaded.
  await page.evaluate(() => {
    const event = new Event('beforeinstallprompt', { cancelable: true });
    event.prompt = async () => {};
    event.userChoice = Promise.resolve({ outcome: 'accepted' });
    dispatchEvent(event);
  });
  await page.getByRole('button', { name: 'Instaliraj Kolegium' }).click();
  await page.waitForFunction(() => !document.body.innerText.includes('Instaliraj Kolegium'));
  console.log(
    'PASS: production shell/register/cache privacy/offline shell/waiting update/no second-tab reload/install prompt adapter. Native installation and real OAuth NOT RUN.',
  );
  await context.close();
} finally {
  await browser.close();
  await new Promise((ok) => server.close(ok));
}
