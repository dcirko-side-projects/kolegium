import { test, expect, Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { readFile } from 'node:fs/promises';
import { prepare, addSemester, addCourse } from './support';
import { addDays, localNow } from '../src/app/domain/schedule';
import { zagrebInstant } from '../src/app/domain/reminders';

async function task(page: Page, title: string, dueOn?: string) {
  await page.goto('/todo');
  await page.getByRole('button', { name: 'Dodaj zadatak', exact: true }).click();
  await page.getByLabel('Naziv zadatka', { exact: true }).fill(title);
  if (dueOn) await page.getByLabel('Rok zadatka (opcionalno)').fill(dueOn);
  await page.getByRole('button', { name: 'Spremi zadatak', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('article', { name: title, exact: true })).toBeVisible();
}
async function calendar(page: Page) {
  await page.goto('/reminders');
  const download = page.waitForEvent('download');
  await page
    .getByRole('button', { name: 'Preuzmi podsjetnike za mobitel (.ics)', exact: true })
    .click();
  return readFile((await (await download).path())!, 'utf8');
}

test('modal retains dirty input on rejected Escape, traps focus, restores trigger and groups completed tasks', async ({
  page,
}) => {
  await prepare(page);
  await task(page, 'Aktivna obaveza');
  const row = page.getByRole('article', { name: 'Aktivna obaveza', exact: true });
  await row.getByRole('button', { name: 'Uredi zadatak', exact: true }).click();
  const modal = page.getByRole('dialog', { name: 'Zadatak', exact: true });
  await expect(modal).toBeVisible();
  await page.getByLabel('Naziv zadatka', { exact: true }).fill('Nespremljen naziv');
  page.once('dialog', (dialog) => dialog.dismiss());
  await page.keyboard.press('Escape');
  await expect(modal).toBeVisible();
  await expect(page.getByLabel('Naziv zadatka', { exact: true })).toHaveValue('Nespremljen naziv');
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 800 });
    expect(await modal.evaluate((el) => el.scrollWidth <= el.clientWidth)).toBe(true);
    expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
  }
  await modal.getByRole('button', { name: 'Odustani od zadatka', exact: true }).focus();
  await page.keyboard.press('Tab');
  expect(await modal.evaluate((el) => el.contains(document.activeElement))).toBe(true);
  page.once('dialog', (dialog) => dialog.accept());
  await modal.getByRole('button', { name: 'Zatvori obrazac', exact: true }).click();
  await expect(modal).toHaveCount(0);
  await expect(row.getByRole('button', { name: 'Uredi zadatak', exact: true })).toBeFocused();
  await row.getByRole('button', { name: 'Dovrši zadatak', exact: true }).click();
  await expect(row).toHaveCount(0);
  await page.getByRole('button', { name: /Dovršeni zadaci/ }).click();
  await expect(row).toContainText('Dovršeno');
  await expect(row).toHaveClass(/is-complete/);
  await row.getByRole('button', { name: 'Ponovno otvori zadatak', exact: true }).click();
  await expect(row.getByRole('button', { name: 'Dovrši zadatak', exact: true })).toBeEnabled();
  await page.reload();
  await expect(row).toContainText('Otvoreno');
});

test('today and calendar share cancellations and refresh the Zagreb date after midnight on focus', async ({
  page,
}) => {
  const today = localNow().date,
    tomorrow = addDays(today, 1);
  await page.clock.setFixedTime(zagrebInstant(today, '23:55'));
  await prepare(page);
  await addSemester(page);
  await addCourse(page);
  await page.goto('/schedule');
  await page.getByText('Upravljanje rasporedom', { exact: true }).click();
  for (const date of [today, tomorrow]) {
    await page.getByRole('button', { name: 'Dodaj pojedinačni termin', exact: true }).click();
    await page.getByLabel('Datum termina', { exact: true }).fill(date);
    await page.getByRole('button', { name: 'Spremi termin', exact: true }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
  }
  const lesson = page.getByRole('article', {
    name: `Sintetički kolegij ${today} 08:00`,
    exact: true,
  });
  page.once('dialog', (dialog) => dialog.accept());
  await lesson.getByRole('button', { name: 'Otkaži termin', exact: true }).click();
  await expect(lesson).toHaveCount(0);
  await page.goto('/');
  const classes = page.getByRole('region', { name: 'Današnja nastava', exact: true });
  await expect(classes.getByRole('article')).toHaveCount(0);
  await expect(classes.getByText('Dan još nema raspored', { exact: true })).toBeVisible();
  await page.clock.setFixedTime(zagrebInstant(tomorrow, '00:05'));
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await expect(
    classes.getByRole('article', { name: `Sintetički kolegij ${tomorrow} 08:00`, exact: true }),
  ).toBeVisible();
  await page.goto('/schedule');
  await page.getByRole('button', { name: 'Dan', exact: true }).click();
  await expect(
    page.getByRole('article', { name: `Sintetički kolegij ${tomorrow} 08:00`, exact: true }),
  ).toBeVisible();
});

test('manual calendar exports reflect edited deadlines with stable IDs and exclude completed tasks', async ({
  page,
}) => {
  await prepare(page);
  const original = addDays(localNow().date, 2),
    changed = addDays(original, 3);
  await task(page, 'Pomaknuti rok', original);
  const first = await calendar(page);
  const uid = first.match(/^UID:.*$/m)?.[0];
  expect(uid).toBeTruthy();
  expect(first).toContain('DTSTART;VALUE=DATE:' + original.replaceAll('-', ''));
  await page.goto('/todo');
  const row = page.getByRole('article', { name: 'Pomaknuti rok', exact: true });
  await row.getByRole('button', { name: 'Uredi zadatak', exact: true }).click();
  await page.getByLabel('Rok zadatka (opcionalno)').fill(changed);
  await page.getByRole('button', { name: 'Spremi zadatak', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  const second = await calendar(page);
  expect(second.match(/^UID:.*$/m)?.[0]).toBe(uid);
  expect(second).toContain('DTSTART;VALUE=DATE:' + changed.replaceAll('-', ''));
  expect(second).not.toContain('DTSTART;VALUE=DATE:' + original.replaceAll('-', ''));
  await expect(
    page.getByRole('complementary', { name: 'Status kalendarske sinkronizacije' }),
  ).toContainText('Outlook nije povezan');
  await page.goto('/todo');
  await row.getByRole('button', { name: 'Dovrši zadatak', exact: true }).click();
  await expect(row).toHaveCount(0);
  // An additional active event allows downloading the snapshot after completion.
  await task(page, 'Drugi podsjetnik', changed);
  expect(await calendar(page)).not.toContain(uid!);
});
