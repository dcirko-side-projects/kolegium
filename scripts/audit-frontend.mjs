import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
process.env.PLAYWRIGHT_BROWSERS_PATH ??= resolve('.playwright-browsers');
const { chromium, expect } = await import('@playwright/test');
const { default: AxeBuilder } = await import('@axe-core/playwright');
const browser = await chromium.launch();
const results = [];
await mkdir('artifacts/ui-review', { recursive: true });
try {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:4300/login');
  await expect(page.locator('[data-project-id]')).toHaveAttribute(
    'data-project-id',
    'demo-kolegium-tests',
  );
  await page.getByRole('button', { name: 'Prijava testnim Google računom' }).click();
  await expect(page).toHaveTitle('Početna | Kolegium');
  await page.goto('http://127.0.0.1:4300/courses');
  const course = await page.locator('.course-card').first().getAttribute('href');
  await page.goto('http://127.0.0.1:4300/assessments');
  const assessment = await page.locator('article h2 a').first().getAttribute('href');
  await page.goto('http://127.0.0.1:4300/projects');
  const project = await page.locator('article h2 a').first().getAttribute('href');
  const routes = [
    '/',
    '/sections',
    '/courses',
    course,
    '/schedule',
    '/attendance',
    '/assessments',
    assessment,
    '/projects',
    project,
    '/todo',
    '/thesis',
    '/installments',
    '/reminders',
    '/settings',
  ];
  for (const width of [320, 390, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const route of routes) {
      await page.goto('http://127.0.0.1:4300' + route);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await expect(page.getByText(/^Učitavam/)).toHaveCount(0);
      if (route === '/attendance') {
        await page.locator('#attendance-course').selectOption({ index: 1 });
        await page.getByRole('button', { name: 'Pretraži', exact: true }).click();
        await expect(page.getByRole('heading', { name: 'Predavanja', exact: true })).toBeVisible();
      }
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        `${route} overflows at ${width}px`,
      ).toBe(true);
      const axe = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();
      expect(axe.violations, `${route} accessibility at ${width}px`).toEqual([]);
      results.push({ width, route, overflow: false, violations: 0 });
    }
    for (const [route, button] of [
      ['/schedule', 'Dodaj ponavljanje'],
      ['/todo', 'Dodaj zadatak'],
      ['/installments', 'Dodaj ratu'],
      ['/settings', 'Dodaj semestar'],
      ['/courses', 'Dodaj kolegij'],
    ]) {
      await page.goto('http://127.0.0.1:4300' + route);
      await page.getByRole('button', { name: button, exact: true }).click();
      const modal = page.getByRole('dialog');
      await expect(modal.locator('form').first()).toBeVisible();
      expect(await modal.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
        `${route} form overflows at ${width}px`,
      ).toBe(true);
      const axe = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();
      expect(axe.violations, `${route} form accessibility at ${width}px`).toEqual([]);
      results.push({ width, route: route + ' form', overflow: false, violations: 0 });
    }
  }
  await writeFile('artifacts/ui-review/audit.json', JSON.stringify(results, null, 2));
  console.log(
    `PASS ${results.length} route/form and viewport checks; no horizontal overflow or axe violations. Synthetic local browser evidence only.`,
  );
} finally {
  await browser.close();
}
