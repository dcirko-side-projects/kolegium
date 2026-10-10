import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import AxeBuilder from '@axe-core/playwright';
import { prepare, addSemester, addCourse, login } from './support';
test.beforeEach(async ({ page }) => prepare(page));
test('export/preview/restore/reload retains canonical data and blocks a stale form on another client', async ({
  page,
  browser,
}) => {
  await addSemester(page);
  await addCourse(page);
  const courseUrl = page.url();
  await page.goto('/settings');
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Preuzmi sigurnosnu kopiju', exact: true }).click();
  const file = await download,
    path = await file.path();
  expect(path).not.toBeNull();
  const bytes = await readFile(path!);
  expect(bytes.toString()).not.toMatch(/restoreToken|local-owner|updatedAt|revision/);
  const context = await browser.newContext(),
    second = await context.newPage();
  try {
    await login(second);
    await second.goto(courseUrl);
    await second.getByRole('button', { name: 'Uredi kolegij', exact: true }).click();
    await second
      .getByLabel('Informacije o kolegiju (opcionalno)')
      .fill('Nespremljen unos prije povrata');
    await page
      .getByLabel('Odaberi sigurnosnu kopiju (JSON, do 5 MiB)')
      .setInputFiles({ name: 'backup.json', mimeType: 'application/json', buffer: bytes });
    await expect(page.getByRole('heading', { name: 'Pregled odabrane kopije' })).toBeVisible();
    page.once('dialog', (d) => d.accept());
    await page.getByRole('button', { name: 'Potvrdi povrat cijele evidencije' }).click();
    await expect(
      page.getByText('Povrat je dovršen i potvrđen. Učitaj obnovljene podatke.', { exact: true }),
    ).toBeVisible();
    await expect(
      second.getByRole('heading', { name: 'Podatkovna kopija je promijenjena' }),
    ).toBeVisible();
    await expect(
      second.getByRole('button', { name: 'Spremi promjene', exact: true }),
    ).toBeDisabled();
    await expect(second.getByLabel('Informacije o kolegiju (opcionalno)')).toHaveValue(
      'Nespremljen unos prije povrata',
    );
    await page.getByRole('button', { name: 'Učitaj obnovljene podatke' }).click();
    await expect(page.getByRole('button', { name: 'Preuzmi prethodnu kopiju' })).toBeEnabled();
    await page.goto(courseUrl);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Sintetički kolegij');
  } finally {
    await context.close();
  }
});
test('malformed backup has no success or lock; accessible preview and offline controls', async ({
  page,
  context,
}) => {
  await page.goto('/settings');
  const input = page.getByLabel('Odaberi sigurnosnu kopiju (JSON, do 5 MiB)');
  await input.setInputFiles({
    name: 'bad.json',
    mimeType: 'application/json',
    buffer: Buffer.from('{"format":"wrong"}'),
  });
  await expect(
    page.getByRole('alert').filter({ hasText: 'Sigurnosna kopija nije valjana' }),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Prekini povrat' })).toHaveCount(0);
  const result = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  expect(result.violations).toEqual([]);
  await page.setViewportSize({ width: 320, height: 740 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await context.setOffline(true);
  await expect(
    page.getByRole('button', { name: 'Preuzmi sigurnosnu kopiju', exact: true }),
  ).toBeDisabled();
  await context.setOffline(false);
  await expect(
    page.getByRole('button', { name: 'Preuzmi sigurnosnu kopiju', exact: true }),
  ).toBeEnabled();
});
