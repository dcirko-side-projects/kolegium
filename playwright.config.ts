import { mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig, devices } from '@playwright/test';

const temporary = resolve('.angular/tmp');
mkdirSync(temporary, { recursive: true });
process.env['TEMP'] = temporary;
process.env['TMP'] = temporary;
process.env['TMPDIR'] = temporary;
process.env['PLAYWRIGHT_BROWSERS_PATH'] ??= '.playwright-browsers';
const externalUrl = process.env['KOLEGIUM_E2E_URL'];

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: { baseURL: externalUrl ?? 'http://127.0.0.1:4300', trace: 'retain-on-failure' },
  projects: [
    { name: 'desktop-chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile-chromium', use: { ...devices['Pixel 7'] } },
  ],
});
