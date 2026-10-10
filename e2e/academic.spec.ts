import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { addCourse, addSemester, login, prepare, seedAccount } from './support';
test.beforeEach(async ({ page }) => {
  await prepare(page);
});

test('semester and course with links survive reload, archive and explicit edit', async ({
  page,
}) => {
  await addSemester(page);
  await addCourse(page);
  await page.getByRole('button', { name: 'Uredi kolegij' }).click();
  await page.getByRole('button', { name: 'Dodaj poveznicu' }).click();
  await page.getByLabel('Naziv poveznice 1').fill('Sintetički izvor');
  await page.getByLabel('URL poveznice 1').fill('https://example.test/course');
  await page.getByRole('button', { name: 'Spremi promjene' }).click();
  await expect(page.getByRole('link', { name: /Sintetički izvor/ })).toHaveAttribute(
    'rel',
    'noopener noreferrer',
  );
  await page.reload();
  await expect(
    page.getByText('Sintetički sadržaj, nije stvarni TVZ kolegij.', { exact: true }),
  ).toBeVisible();
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Arhiviraj kolegij' }).click();
  await expect(page.getByRole('button', { name: 'Uredi arhivu' })).toBeVisible();
  await page.getByRole('button', { name: 'Uredi arhivu' }).click();
  await page.getByLabel('Informacije o kolegiju (opcionalno)').fill('Izričita korekcija arhive.');
  await page.getByRole('button', { name: 'Spremi promjene' }).click();
  await expect(
    page.getByText('Kolegij je spremljen i potvrđen na poslužitelju.', { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(page.getByText('Izričita korekcija arhive.', { exact: true })).toBeVisible();
  await page.goto('/settings');
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Arhiviraj', exact: true }).click();
  await expect(
    page.getByText('Aktualni semestar još nije postavljen.', { exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Pregled kolegija' }).click();
  await page.getByLabel('Prikaži arhivirane kolegije').check();
  await expect(page.getByRole('link', { name: /Sintetički kolegij/ })).toBeVisible();
});

test('unsafe links fail visibly without losing input and without claiming a save', async ({
  page,
}) => {
  await addSemester(page);
  await page.goto('/courses');
  await page.getByRole('button', { name: 'Dodaj kolegij' }).click();
  await page.getByLabel('Naziv kolegija', { exact: true }).fill('Nevaljana poveznica');
  await page.getByRole('button', { name: 'Dodaj poveznicu' }).click();
  await page.getByLabel('Naziv poveznice 1').fill('Opasni link');
  await page.getByLabel('URL poveznice 1').fill('javascript:alert(1)');
  await page.getByRole('button', { name: 'Spremi kolegij' }).click();
  await expect(page.getByRole('alert')).toContainText('HTTP/HTTPS');
  await expect(page.getByLabel('Naziv kolegija', { exact: true })).toHaveValue(
    'Nevaljana poveznica',
  );
  await expect(
    page.getByText('Kolegij je spremljen i potvrđen na poslužitelju.', { exact: true }),
  ).not.toBeVisible();
});

test('two clients preserve a stale local edit and offer the server version', async ({
  page,
  browser,
}) => {
  await addSemester(page);
  await addCourse(page);
  const url = page.url();
  await page.getByRole('button', { name: 'Uredi kolegij' }).click();
  await page.getByLabel('Informacije o kolegiju (opcionalno)').fill('Lokalni unos prvog klijenta.');
  const context = await browser.newContext();
  const second = await context.newPage();
  try {
    await login(second);
    await second.goto(url);
    await second.getByRole('button', { name: 'Uredi kolegij' }).click();
    await second
      .getByLabel('Informacije o kolegiju (opcionalno)')
      .fill('Potvrđen unos drugog klijenta.');
    await second.getByRole('button', { name: 'Spremi promjene' }).click();
    await expect(
      second.getByText('Kolegij je spremljen i potvrđen na poslužitelju.', { exact: true }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Spremi promjene' }).click();
    await expect(page.getByRole('alert')).toContainText('Potvrđen unos drugog klijenta.');
    await expect(page.getByLabel('Informacije o kolegiju (opcionalno)')).toHaveValue(
      'Lokalni unos prvog klijenta.',
    );
    page.once('dialog', (dialog) => dialog.accept());
    await page.getByRole('button', { name: 'Učitaj novu verziju' }).click();
    await expect(page.getByLabel('Informacije o kolegiju (opcionalno)')).toHaveValue(
      'Potvrđen unos drugog klijenta.',
    );
  } finally {
    await context.close();
  }
});

test('offline disables mutation, keeps draft and refreshes before continuing; logout requires confirmation', async ({
  page,
  context,
}) => {
  await addSemester(page);
  await page.goto('/courses');
  await page.getByRole('button', { name: 'Dodaj kolegij' }).click();
  await page.getByLabel('Naziv kolegija', { exact: true }).fill('Nespremljen unos');
  await context.setOffline(true);
  await expect(page.getByText(/Nema internetske veze/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Spremi kolegij' })).toBeDisabled();
  await expect(page.getByLabel('Naziv kolegija', { exact: true })).toHaveValue('Nespremljen unos');
  await context.setOffline(false);
  await expect(page.getByRole('button', { name: 'Spremi kolegij' })).toBeEnabled();
  page.once('dialog', (dialog) => dialog.dismiss());
  await page.getByRole('button', { name: 'Odjava', exact: true }).click();
  await expect(page.getByLabel('Naziv kolegija', { exact: true })).toHaveValue('Nespremljen unos');
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Odjava', exact: true }).click();
  await expect(page).toHaveTitle('Prijava | Kolegium');
  await page.goto('/courses');
  await expect(page).toHaveTitle('Prijava | Kolegium');
});

test('forbidden Google identity cannot enter the private shell', async ({ page }) => {
  await page.getByRole('button', { name: 'Odjava', exact: true }).click();
  await expect(page).toHaveTitle('Prijava | Kolegium');
  await seedAccount(page, 'other-user');
  await page.getByRole('button', { name: 'Prijava testnim Google računom' }).click();
  await expect(page.getByRole('alert')).toContainText('Ovaj račun nema dopušten pristup');
  await page.goto('/courses');
  await expect(page).toHaveTitle('Prijava | Kolegium');
  await expect(page.getByRole('navigation', { name: 'Glavna navigacija' })).not.toBeVisible();
});

test('academic forms have accessible labels, keyboard focus and no narrow overflow', async ({
  page,
}) => {
  await page.goto('/settings');
  await page.getByRole('button', { name: 'Dodaj semestar' }).click();
  let results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  expect(results.violations).toEqual([]);
  await page.getByRole('button', { name: 'Odustani' }).click();
  await addSemester(page);
  await addCourse(page);
  await page.getByRole('button', { name: 'Uredi kolegij' }).click();
  results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  expect(results.violations).toEqual([]);
  await page.setViewportSize({ width: 320, height: 740 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
