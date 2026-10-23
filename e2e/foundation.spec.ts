import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { prepare } from './support';
test.beforeEach(async ({ page }) => {
  await prepare(page);
});

test('all sections are accessible, including thesis and installments', async ({
  page,
  isMobile,
}) => {
  await page.goto('/');
  await expect(page).toHaveTitle('Početna | Kolegium');
  if (isMobile)
    await page
      .getByRole('navigation', { name: 'Mobilna navigacija' })
      .getByRole('link', { name: 'Sve sekcije' })
      .click();
  else await page.getByRole('link', { name: 'Istraži sve sekcije' }).click();
  await page
    .getByRole('main')
    .getByRole('link', { name: /Diplomski/ })
    .click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Diplomski');
  await page.getByRole('link', { name: 'Pogledaj sve sekcije' }).click();
  await page
    .getByRole('main')
    .getByRole('link', { name: /Rate fakulteta/ })
    .click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Rate fakulteta');
});

test('deep links survive reload and unknown paths offer recovery', async ({ page }) => {
  await page.goto('/attendance');
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Dolaznost');
  await page.goto('/unknown');
  await page.getByRole('link', { name: 'Povratak na početnu' }).click();
  await expect(page).toHaveTitle('Početna | Kolegium');
});

test('home and section directory have no serious accessibility violations or horizontal overflow', async ({
  page,
}) => {
  for (const path of ['/', '/sections', '/thesis']) {
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    expect(results.violations).toEqual([]);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
  }
});

test('keyboard skip link reaches the main content', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Desktop keyboard scenario');
  await page.goto('/');
  await expect(page.getByRole('link', { name: 'Preskoči na sadržaj' })).toBeAttached();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Preskoči na sadržaj' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('main')).toBeFocused();
});

test('narrow screens retain all section links', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto('/sections');
  await expect(page.getByRole('main').getByRole('link')).toHaveCount(11);
  await expect(page.getByRole('main').getByRole('link', { name: /Podsjetnici/ })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
});
