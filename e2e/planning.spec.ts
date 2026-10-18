import { test, expect, Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { prepare, addSemester, addCourse, login } from './support';
import { localNow, addDays } from '../src/app/domain/schedule';
test.beforeEach(async ({ page }) => prepare(page));
async function saved(page: Page) {
  await expect(
    page.getByRole('status').filter({ hasText: 'Izmjena je spremljena' }).last(),
  ).toBeVisible();
}
async function installment(page: Page) {
  await page.goto('/installments');
  await page.getByRole('button', { name: 'Dodaj ratu', exact: true }).click();
  await page.getByLabel('Naziv rate', { exact: true }).fill('Sintetička rata');
  await page.getByLabel('Iznos EUR', { exact: true }).fill('12,34');
  await page.getByLabel('Rok plaćanja', { exact: true }).fill(addDays(localNow().date, -1));
  await page.getByRole('button', { name: 'Spremi ratu', exact: true }).click();
  await saved(page);
}
test('installment cents/overdue/home visibility and paid/reopen survive reload; invalid money preserves input', async ({
  page,
}) => {
  await installment(page);
  await page.reload();
  await expect(page.getByRole('article', { name: 'Sintetička rata' })).toContainText('12,34');
  await page.goto('/');
  await expect(page.getByRole('article', { name: 'Sintetička rata' })).toContainText('Zakašnjelo');
  await page.goto('/installments');
  await page.getByRole('button', { name: 'Označi plaćeno', exact: true }).click();
  await saved(page);
  await page.goto('/');
  await expect(page.getByRole('article', { name: 'Sintetička rata' })).toHaveCount(0);
  await page.goto('/installments');
  await page.getByRole('button', { name: 'Označi neplaćeno', exact: true }).click();
  await saved(page);
  await page.getByRole('button', { name: 'Uredi ratu', exact: true }).click();
  await page.getByLabel('Iznos EUR', { exact: true }).fill('1.001');
  await page.getByRole('button', { name: 'Spremi ratu', exact: true }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'dvije decimale' })).toBeVisible();
  await expect(page.getByLabel('Iznos EUR', { exact: true })).toHaveValue('1.001');
});
test('unpaid installment reminder appears 30 days ahead and disappears after payment', async ({
  page,
}) => {
  await page.goto('/installments');
  await page.getByRole('button', { name: 'Dodaj ratu', exact: true }).click();
  await page.getByLabel('Naziv rate', { exact: true }).fill('Sintetički podsjetnik');
  await page.getByLabel('Iznos EUR', { exact: true }).fill('10');
  await page.getByLabel('Rok plaćanja', { exact: true }).fill(addDays(localNow().date, 30));
  await page.getByRole('button', { name: 'Spremi ratu', exact: true }).click();
  await saved(page);
  await page.goto('/');
  const reminders = page.getByRole('region', { name: 'Podsjetnici za rate', exact: true });
  await expect(reminders.getByRole('article', { name: 'Sintetički podsjetnik' })).toContainText(
    '30 dana',
  );
  await expect(
    page
      .getByRole('region', { name: 'Nadolazeće obaveze' })
      .getByRole('article', { name: 'Sintetički podsjetnik' }),
  ).toHaveCount(0);
  expect(
    (
      await new AxeBuilder({ page })
        .include('[aria-labelledby="installment-reminders-title"]')
        .analyze()
    ).violations,
  ).toEqual([]);
  await page.setViewportSize({ width: 320, height: 800 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await page.goto('/installments');
  await page.getByRole('button', { name: 'Označi plaćeno', exact: true }).click();
  await saved(page);
  await page.goto('/');
  await expect(reminders.getByRole('article', { name: 'Sintetički podsjetnik' })).toHaveCount(0);
  await expect(reminders).toContainText('Nema neplaćenih rata');
});
test('manual canonical activity, exact personal grade, explicit selection and separate official outcome', async ({
  page,
}) => {
  await addSemester(page);
  await addCourse(page);
  await page.getByRole('button', { name: 'Prikaži / osvježi bodovanje', exact: true }).click();
  await expect(
    page.getByText('Pravila ocjenjivanja još nisu unesena.', { exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Dodaj bodovanu aktivnost', exact: true }).click();
  await page.getByLabel('Naziv bodovane aktivnosti', { exact: true }).fill('Sintetička vježba');
  await page.getByLabel('Ključ komponente (opcionalno)', { exact: true }).fill('all');
  await page.getByLabel('Maksimalni bodovi aktivnosti (opcionalno)', { exact: true }).fill('100');
  await page.getByLabel('Minimalni bodovi aktivnosti (opcionalno)', { exact: true }).fill('0');
  await page.getByRole('button', { name: 'Spremi aktivnost', exact: true }).click();
  const activity = page.getByRole('article', { name: 'Sintetička vježba', exact: true });
  await expect(activity).toBeVisible();
  await activity.getByRole('button', { name: 'Pokušaji aktivnosti', exact: true }).click();
  await activity.getByRole('button', { name: 'Dodaj pokušaj', exact: true }).click();
  await activity.getByLabel('Bodovi (opcionalno)', { exact: true }).fill('7.1250');
  await activity.getByRole('button', { name: 'Spremi pokušaj', exact: true }).click();
  await expect(activity.getByRole('article', { name: 'Pokušaj 1', exact: true })).toContainText(
    '7.1250',
  );
  await page.getByRole('button', { name: 'Uredi pravila bodovanja', exact: true }).click();
  await page.getByLabel('Ulaze li projekti u zbroj?', { exact: true }).selectOption('false');
  await page.getByLabel('Zaokruživanje', { exact: true }).selectOption('none');
  await page.getByLabel('Pravila i popis aktivnosti potvrđeni su prema izvoru kolegija').check();
  await page.getByRole('button', { name: 'Dodaj komponentu', exact: true }).click();
  await page.getByLabel('Ključ komponente 1', { exact: true }).fill('all');
  await page.getByLabel('Naziv komponente 1', { exact: true }).fill('Sintetička komponenta');
  await page.getByLabel('Maksimum komponente 1', { exact: true }).fill('100');
  await page.getByLabel('Minimum komponente 1', { exact: true }).fill('0');
  await page.getByRole('button', { name: 'Dodaj interval ocjene', exact: true }).click();
  await page.getByLabel('Ocjena intervala 1', { exact: true }).fill('Sintetička A');
  await page.getByLabel('Od bodova 1', { exact: true }).fill('0');
  await page
    .getByLabel('Obračunski pokušaj — Sintetička vježba', { exact: true })
    .selectOption({ index: 1 });
  await page.getByRole('button', { name: 'Spremi pravila bodovanja', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Osobni izračun' })).toContainText(
    'Izračunata ocjena: Sintetička A',
  );
  await page.getByRole('button', { name: 'Uredi službeni rezultat', exact: true }).click();
  await page.getByLabel('Službeni bodovi (opcionalno)', { exact: true }).fill('8');
  await page.getByLabel('Službena ocjena (opcionalno)', { exact: true }).fill('Sintetička B');
  await page.getByRole('button', { name: 'Spremi službeni rezultat', exact: true }).click();
  await expect(
    page.getByText('Unesena službena i izračunata ocjena razlikuju se.', { exact: true }),
  ).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: 'Prikaži / osvježi bodovanje', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Službeni rezultat' })).toContainText(
    'Sintetička B',
  );
  await expect(page.getByRole('region', { name: 'Osobni izračun' })).toContainText('7.125');
  await page.getByRole('button', { name: 'Uredi pravila bodovanja', exact: true }).click();
  await page.getByLabel('Obračunski pokušaj — Sintetička vježba', { exact: true }).selectOption('');
  await page.getByRole('button', { name: 'Spremi pravila bodovanja', exact: true }).click();
  await expect(page.getByRole('region', { name: 'Osobni izračun' })).toContainText(
    'Obračun je nepotpun.',
  );
  await expect(page.getByRole('region', { name: 'Osobni izračun' })).toContainText(
    'Izračunata ocjena: nije određena',
  );
});
test('installment stale form/offline preserves draft and new forms/home have no serious accessibility or narrow overflow', async ({
  page,
  browser,
}) => {
  await installment(page);
  await page.getByRole('button', { name: 'Uredi ratu', exact: true }).click();
  await page.getByLabel('Naziv rate', { exact: true }).fill('Lokalni unos');
  const second = await browser.newContext();
  const other = await second.newPage();
  await login(other);
  await other.goto('/installments');
  await other.getByRole('button', { name: 'Označi plaćeno', exact: true }).click();
  await saved(other);
  await page.getByRole('button', { name: 'Spremi ratu', exact: true }).click();
  await expect(page.getByText(/Nova server verzija:.*Plaćeno/)).toBeVisible();
  await expect(page.getByLabel('Naziv rate', { exact: true })).toHaveValue('Lokalni unos');
  await page.context().setOffline(true);
  await expect(page.getByRole('button', { name: 'Spremi ratu', exact: true })).toBeDisabled();
  await expect(page.getByLabel('Naziv rate', { exact: true })).toHaveValue('Lokalni unos');
  await page.context().setOffline(false);
  await page.setViewportSize({ width: 320, height: 800 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  expect(
    (await new AxeBuilder({ page }).analyze()).violations.filter((v) =>
      ['serious', 'critical'].includes(v.impact ?? ''),
    ),
  ).toEqual([]);
  await second.close();
  page.on('dialog', (dialog) => dialog.accept());
  await addSemester(page);
  await addCourse(page);
  await page.getByRole('button', { name: 'Prikaži / osvježi bodovanje', exact: true }).click();
  await page.getByRole('button', { name: 'Uredi pravila bodovanja', exact: true }).click();
  await page.getByRole('button', { name: 'Dodaj komponentu', exact: true }).click();
  await page.getByRole('button', { name: 'Dodaj interval ocjene', exact: true }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  expect(
    (await new AxeBuilder({ page }).analyze()).violations.filter((v) =>
      ['serious', 'critical'].includes(v.impact ?? ''),
    ),
  ).toEqual([]);
});
