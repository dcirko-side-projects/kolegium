import { test, expect, Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import AxeBuilder from '@axe-core/playwright';
import { prepare, addSemester, addCourse, login } from './support';
import { addDays, localNow } from '../src/app/domain/schedule';

const today = localNow().date;
async function single(page: Page, date = today) {
  await page.goto('/schedule');
  await page.getByText('Upravljanje rasporedom', { exact: true }).click();
  await page.getByRole('button', { name: 'Dodaj pojedinačni termin', exact: true }).click();
  await page.getByLabel('Datum termina', { exact: true }).fill(date);
  await page.getByLabel('Početak nastave', { exact: true }).fill('08:00');
  await page.getByLabel('Završetak nastave', { exact: true }).fill('09:00');
  await page.getByRole('button', { name: 'Spremi termin', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Novi pojedinačni termin' })).toHaveCount(0);
}
function row(page: Page, date = today) {
  return page.getByRole('article', { name: `Sintetički kolegij ${date} 08:00`, exact: true });
}
test.beforeEach(async ({ page }) => {
  await prepare(page);
  await addSemester(page);
  await addCourse(page);
});

test('excused absence persists separately, retains offline draft, clears its note and protects stale edits', async ({
  page,
  context,
  browser,
}) => {
  await single(page);
  await row(page).getByRole('button', { name: 'Ispričaj izostanak' }).click();
  await row(page).getByLabel('Napomena ispričnice (opcionalno)').fill('Liječnička potvrda');
  await context.setOffline(true);
  await expect(page.getByLabel('Datum pregleda')).toBeDisabled();
  await expect(row(page).getByLabel('Napomena ispričnice (opcionalno)')).toHaveValue(
    'Liječnička potvrda',
  );
  await expect(row(page).getByRole('button', { name: 'Spremi ispričnicu' })).toBeDisabled();
  await context.setOffline(false);
  await row(page).getByRole('button', { name: 'Spremi ispričnicu' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(row(page).getByRole('button', { name: 'Uredi ispričnicu' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.reload();
  await expect(row(page)).toContainText('Ispričnica: Liječnička potvrda');
  await page.goto('/attendance');
  await expect(page.getByText(/Prisutni: 0 · Odsutni: 0 · Ispričani: 1/)).toBeVisible();
  await page.goto('/schedule');
  await row(page).getByRole('button', { name: 'Uredi ispričnicu' }).click();
  await row(page).getByLabel('Napomena ispričnice (opcionalno)').fill('Lokalna izmjena');
  const second = await browser.newContext();
  try {
    const other = await second.newPage();
    await login(other);
    await other.goto('/schedule');
    await row(other).getByRole('button', { name: 'Odsutan', exact: true }).click();
    await expect(row(other).getByRole('button', { name: 'Odsutan', exact: true })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(row(other).getByRole('button', { name: 'Odsutan', exact: true })).toBeEnabled();
    await page.bringToFront();
    await row(page).getByRole('button', { name: 'Spremi ispričnicu' }).click();
    await expect(row(page).getByRole('alert')).toContainText('drugom uređaju');
    await expect(row(page).getByLabel('Napomena ispričnice (opcionalno)')).toHaveValue(
      'Lokalna izmjena',
    );
    page.once('dialog', (d) => d.accept());
    await row(page).getByRole('button', { name: 'Odustani od ispričnice' }).click();
    await page.reload();
    await expect(row(page).getByRole('button', { name: 'Odsutan', exact: true })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(row(page)).not.toContainText('Liječnička potvrda');
  } finally {
    await second.close();
  }
});

test('all reminder sources export a private calendar with alarms, category search and offline protection', async ({
  page,
  context,
}, info) => {
  await single(page);
  await single(page, addDays(today, 1));
  await page.goto('/todo');
  await page.getByRole('button', { name: 'Dodaj zadatak', exact: true }).click();
  await page.getByLabel('Naziv zadatka', { exact: true }).fill('Predaja zadatka');
  await page.getByLabel('Rok zadatka (opcionalno)').fill(addDays(today, 2));
  await page.getByRole('button', { name: 'Spremi zadatak', exact: true }).click();
  await expect(page.getByRole('article', { name: 'Predaja zadatka' })).toBeVisible();
  await page.goto('/projects');
  await page.getByRole('button', { name: 'Dodaj projekt', exact: true }).click();
  await page.getByLabel('Naziv projekta', { exact: true }).fill('Predaja projekta');
  await page.getByLabel('Rok projekta (opcionalno)').fill(addDays(today, 3));
  await page.getByRole('button', { name: 'Spremi projekt', exact: true }).click();
  await expect(page.getByRole('article', { name: 'Predaja projekta' })).toBeVisible();
  await page.goto('/assessments');
  await page.getByRole('button', { name: 'Dodaj provjeru', exact: true }).click();
  await page.getByLabel('Naziv provjere', { exact: true }).fill('Prvi kolokvij');
  await page.getByLabel('Datum provjere', { exact: true }).fill(addDays(today, 4));
  await page.getByLabel('Vrijeme provjere (opcionalno)').fill('13:00');
  await page.getByRole('button', { name: 'Spremi provjeru', exact: true }).click();
  await expect(page.getByRole('article', { name: 'Prvi kolokvij' })).toBeVisible();
  for (const paid of [false, true]) {
    await page.goto('/installments');
    await page.getByRole('button', { name: 'Dodaj ratu', exact: true }).click();
    await page.getByLabel('Naziv rate', { exact: true }).fill(paid ? 'Plaćena rata' : 'Druga rata');
    await page.getByLabel('Iznos EUR', { exact: true }).fill('100');
    await page.getByLabel('Rok plaćanja', { exact: true }).fill(addDays(today, 25));
    if (paid) await page.getByLabel('Plaćeno', { exact: true }).check();
    await page.getByRole('button', { name: 'Spremi ratu', exact: true }).click();
    await expect(
      page.getByRole('article', { name: paid ? 'Plaćena rata' : 'Druga rata' }),
    ).toBeVisible();
  }
  await page.goto('/reminders');
  for (const name of ['Predaja zadatka', 'Predaja projekta', 'Prvi kolokvij', 'Druga rata'])
    await expect(page.getByRole('article', { name, exact: true })).toBeVisible();
  await expect(page.getByRole('article', { name: 'Plaćena rata', exact: true })).toHaveCount(0);
  await page.getByLabel('Vrsta podsjetnika').selectOption('project');
  await expect(page.getByRole('article', { name: 'Predaja zadatka' })).toBeVisible();
  await page.getByRole('button', { name: 'Pretraži', exact: true }).click();
  await expect(page.getByRole('article', { name: 'Predaja zadatka' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Poništi filtre' }).click();
  const button = page.getByRole('button', {
    name: 'Preuzmi podsjetnike za mobitel (.ics)',
    exact: true,
  });
  await expect(button).toBeEnabled();
  const download = page.waitForEvent('download');
  await button.click();
  const file = await download;
  const text = await readFile((await file.path())!, 'utf8');
  expect(file.suggestedFilename()).toMatch(/^kolegium-podsjetnici-.*\.ics$/);
  for (const name of [
    'Predaja zadatka',
    'Predaja projekta',
    'Prvi kolokvij',
    'Druga rata',
    'Sintetički kolegij',
  ])
    expect(text.replace(/\r\n /g, '')).toContain(name);
  expect(text).toContain('BEGIN:VALARM');
  expect(text).toContain('DTSTART;VALUE=DATE:');
  expect(text).not.toContain('Plaćena rata');
  expect(text).not.toContain('local-owner');
  expect(text).not.toContain('absenceNote');
  await context.setOffline(true);
  await expect(button).toBeDisabled();
  await context.setOffline(false);
  await expect(button).toBeEnabled();
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    expect(
      (
        await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
          .analyze()
      ).violations,
    ).toEqual([]);
  }
  await page.screenshot({
    path: `artifacts/reminders-attendance-2026-10-20/${info.project.name}-reminders.png`,
    fullPage: true,
  });
});

test('course information groups headings, keeps the complete source and provides working section links', async ({
  page,
}, info) => {
  const source =
    'MOJ PROJEKT: FoodLoop\nCijeli opis projekta.\n\nDodatni odlomak.\n\nBODOVANJE\nMinimum: \nBez izmišljanja pravila.\n\nIZVOR\nSlužbene upute.';
  await page.getByRole('button', { name: 'Uredi kolegij', exact: true }).click();
  await page.getByLabel('Informacije o kolegiju (opcionalno)').fill(source);
  await page.getByRole('button', { name: 'Spremi promjene', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'MOJ PROJEKT: FoodLoop', exact: true }),
  ).toBeVisible();
  await page
    .getByRole('navigation', { name: 'Sadržaj informacija o kolegiju' })
    .getByRole('link', { name: 'BODOVANJE', exact: true })
    .click();
  await expect(page).toHaveURL(/#course-info-1$/);
  await expect(page.getByText('Dodatni odlomak.', { exact: true })).toBeVisible();
  await page.getByText('Cjelovit izvorni tekst', { exact: true }).click();
  await expect(page.locator('details[open] .information')).toHaveText(source);
  await page.reload();
  await page.getByRole('button', { name: 'Uredi kolegij', exact: true }).click();
  await expect(page.getByLabel('Informacije o kolegiju (opcionalno)')).toHaveValue(source);
  await page.getByRole('button', { name: 'Odustani', exact: true }).click();
  await page.setViewportSize({ width: 390, height: 900 });
  expect(
    (
      await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze()
    ).violations,
  ).toEqual([]);
  await page.screenshot({
    path: `artifacts/reminders-attendance-2026-10-20/${info.project.name}-course-info.png`,
    fullPage: true,
  });
});
