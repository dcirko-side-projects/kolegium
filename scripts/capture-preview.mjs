import { mkdir } from 'node:fs/promises';

process.env.PLAYWRIGHT_BROWSERS_PATH ??= '.playwright-browsers';
const { chromium } = await import('@playwright/test');
const browser = await chromium.launch();
await mkdir('artifacts/foundation', { recursive: true });
try {
  const page = await browser.newPage();
  const origin = process.argv[2] ?? 'http://127.0.0.1:4301';
  for (const [name, width, height, path] of [
    ['desktop', 1440, 1000, '/'],
    ['mobile', 390, 844, '/'],
    ['mobile-sections', 390, 844, '/sections'],
  ]) {
    await page.setViewportSize({ width, height });
    await page.goto(`${origin}${path}`);
    await page.locator('h1').waitFor();
    await page.screenshot({ path: `artifacts/foundation/${name}.png`, fullPage: true });
  }
  for (const path of ['/manifest.webmanifest', '/icons/icon-192.png', '/icons/icon-512.png']) {
    const response = await page.request.get(`${origin}${path}`);
    if (!response.ok()) throw new Error(`Missing static asset: ${path}`);
  }
  console.log('Preview captures and manifest/icon HTTP checks passed.');
} finally {
  await browser.close();
}
