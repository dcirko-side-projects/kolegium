import { test, expect, Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { prepare, addSemester, addCourse } from './support';
import { addDays, localNow, weekday } from '../src/app/domain/schedule';
const today = localNow().date;
async function addTemplate(page: Page, kind = 'lecture', startsAt = '08:00', endsAt = '09:00') {
  await page.goto('/schedule');
  await page.getByRole('button', { name: 'Dodaj ponavljanje' }).click();
  await page.getByLabel('Vrsta nastave', { exact: true }).selectOption(kind);
  await page.getByLabel('Dan u tjednu').selectOption({ index: weekday(today) - 1 });
  await page.getByLabel('Početak nastave', { exact: true }).fill(startsAt);
  await page.getByLabel('Završetak nastave', { exact: true }).fill(endsAt);
  await page.getByRole('button', { name: 'Pregledaj termine' }).click();
  await page.getByRole('button', { name: 'Potvrdi raspored' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Izmjena je spremljena' })).toBeVisible();
}
function session(page: Page, date = today, time = '08:00') {
  return page.getByRole('article', { name: `Sintetički kolegij ${date} ${time}`, exact: true });
}
test.beforeEach(async ({ page }) => {
  await prepare(page);
  await addSemester(page);
  await addCourse(page);
});
test('today quick marks persist with separate lecture/exercise counts and unknown conditions', async ({
  page,
}) => {
  await addTemplate(page);
  await addTemplate(page, 'exercise', '10:00', '11:00');
  await page.goto('/');
  await session(page).getByRole('button', { name: 'Prisutan', exact: true }).click();
  await expect(
    session(page).getByRole('button', { name: 'Prisutan', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await session(page, today, '10:00').getByRole('button', { name: 'Odsutan', exact: true }).click();
  await expect(
    session(page, today, '10:00').getByRole('button', { name: 'Odsutan', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('status').filter({ hasText: 'Izmjena je spremljena' })).toBeVisible();
  await page.reload();
  await expect(
    session(page).getByRole('button', { name: 'Prisutan', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await page.goto('/attendance');
  await expect(
    page
      .locator('section')
      .filter({ has: page.getByRole('heading', { name: 'Predavanja', exact: true }) }),
  ).toContainText('Prisutni: 1');
  await expect(
    page
      .locator('section')
      .filter({ has: page.getByRole('heading', { name: 'Vježbe', exact: true }) }),
  ).toContainText('Odsutni: 1');
  await expect(
    page.getByText('Službeni ukupan broj: nije poznat; minimum: nije poznat.', { exact: true }),
  ).toHaveCount(2);
});
test('cancel and replacement preserve original and official totals; invalid rules keep input', async ({
  page,
}) => {
  await addTemplate(page);
  await session(page).getByRole('button', { name: 'Prisutan', exact: true }).click();
  page.once('dialog', (d) => d.accept());
  await session(page).getByRole('button', { name: 'Otkaži termin' }).click();
  await expect(session(page)).toContainText('Otkazano');
  await session(page).getByRole('button', { name: 'Dodaj nadoknadu' }).click();
  await page.getByLabel('Početak nadoknade').fill('12:00');
  await page.getByLabel('Završetak nadoknade').fill('13:00');
  await page.getByRole('button', { name: 'Spremi nadoknadu' }).click();
  await expect(session(page, today, '12:00')).toContainText('Nadoknada');
  await session(page, today, '12:00')
    .getByRole('button', { name: 'Prisutan', exact: true })
    .click();
  await expect(
    session(page, today, '12:00').getByRole('button', { name: 'Prisutan', exact: true }),
  ).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('status').filter({ hasText: 'Izmjena je spremljena' })).toBeVisible();
  await page.goto('/attendance');
  await page.getByRole('button', { name: 'Uredi uvjete dolaznosti' }).click();
  await page.getByLabel('Predavanja — ukupan broj', { exact: true }).fill('10');
  await page.getByLabel('Predavanja — minimum', { exact: true }).fill('11');
  await page.getByRole('button', { name: 'Spremi uvjete' }).click();
  await expect(page.getByRole('alert')).toContainText('Minimum dolazaka');
  await expect(page.getByLabel('Predavanja — minimum', { exact: true })).toHaveValue('11');
  await page.getByLabel('Predavanja — minimum', { exact: true }).fill('7');
  await page.getByRole('button', { name: 'Spremi uvjete' }).click();
  const lectures = page
    .locator('section')
    .filter({ has: page.getByRole('heading', { name: 'Predavanja', exact: true }) });
  await expect(lectures).toContainText('Prisutni: 1');
  await expect(lectures).toContainText('Preostalo do minimuma: 6');
  await expect(lectures).toContainText('10.0%');
  await page.reload();
  await expect(lectures).toContainText('minimum: 7');
});
test('future recurrence change preserves recorded time and displays new future time', async ({
  page,
}) => {
  await addTemplate(page);
  await session(page).getByRole('button', { name: 'Prisutan', exact: true }).click();
  await page.getByRole('button', { name: 'Promijeni budući raspored' }).click();
  await page.getByLabel('Datum primjene promjene').fill(addDays(today, 1));
  await page.getByLabel('Početak nastave', { exact: true }).fill('12:00');
  await page.getByLabel('Završetak nastave', { exact: true }).fill('13:00');
  await page.getByRole('button', { name: 'Pregledaj termine' }).click();
  await page.getByRole('button', { name: 'Potvrdi raspored' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Izmjena je spremljena' })).toBeVisible();
  await expect(session(page)).toContainText('Prisutan');
  await page.getByRole('button', { name: 'Sljedeći tjedan' }).click();
  await expect(session(page, addDays(today, 7), '12:00')).toBeVisible();
  await expect(
    session(page, addDays(today, 7), '12:00').getByRole('button', {
      name: 'Prisutan',
      exact: true,
    }),
  ).toBeDisabled();
});
test('schedule and attendance forms are accessible and offline preserves unsaved values', async ({
  page,
  context,
}) => {
  await page.goto('/schedule');
  await page.getByRole('button', { name: 'Dodaj ponavljanje' }).click();
  await page.getByLabel('Lokacija / učionica (opcionalno)').fill('Nespremljena učionica');
  let result = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  expect(result.violations).toEqual([]);
  await context.setOffline(true);
  await expect(page.getByRole('button', { name: 'Pregledaj termine' })).toBeDisabled();
  await context.setOffline(false);
  await expect(page.getByRole('button', { name: 'Pregledaj termine' })).toBeEnabled();
  await expect(page.getByLabel('Lokacija / učionica (opcionalno)')).toHaveValue(
    'Nespremljena učionica',
  );
  page.once('dialog', (d) => d.accept());
  await page.getByRole('button', { name: 'Odustani', exact: true }).click();
  await page.goto('/attendance');
  await page.getByRole('button', { name: 'Uredi uvjete dolaznosti' }).click();
  result = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  expect(result.violations).toEqual([]);
  await page.setViewportSize({ width: 320, height: 740 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
