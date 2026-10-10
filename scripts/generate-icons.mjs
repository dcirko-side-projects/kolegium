import { readFile } from 'node:fs/promises';

process.env.PLAYWRIGHT_BROWSERS_PATH ??= '.playwright-browsers';
const { chromium } = await import('@playwright/test');
const svg = await readFile(new URL('../public/icons/kolegium.svg', import.meta.url), 'utf8');
const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  for (const size of [192, 512]) {
    await page.setViewportSize({ width: size, height: size });
    await page.setContent(
      `<style>body{margin:0}svg{width:100vw;height:100vh;display:block}</style>${svg}`,
    );
    await page.screenshot({ path: `public/icons/icon-${size}.png`, omitBackground: true });
  }
} finally {
  await browser.close();
}
