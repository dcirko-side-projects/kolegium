import { test, expect, Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { prepare, addSemester, addCourse } from './support';

async function search(page: Page) {
  await page.getByRole('button', { name: 'Pretraži', exact: true }).click();
  await expect(page.getByText(/^Učitavam/)).toHaveCount(0);
}
async function work(page: Page, kind: 'projects' | 'assessments', name: string, course: string) {
  await page.goto('/' + kind);
  await page
    .getByRole('button', {
      name: kind === 'projects' ? 'Dodaj projekt' : 'Dodaj provjeru',
      exact: true,
    })
    .click();
  await page
    .getByLabel(kind === 'projects' ? 'Naziv projekta' : 'Naziv provjere', { exact: true })
    .fill(name);
  await page.locator('#work-course').selectOption({ label: course });
  if (kind === 'assessments')
    await page.getByLabel('Datum provjere', { exact: true }).fill('2026-11-02');
  await page
    .getByRole('button', {
      name: kind === 'projects' ? 'Spremi projekt' : 'Spremi provjeru',
      exact: true,
    })
    .click();
  await expect(page.getByRole('article', { name, exact: true })).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  await prepare(page);
  await addSemester(page);
  await addCourse(page, 'Analiza');
  await addCourse(page, 'Programiranje');
});

for (const kind of ['assessments', 'projects'] as const) {
  test(`${kind}: course, status and name apply on search, reset restores all, archives stay protected`, async ({
    page,
  }) => {
    await work(page, kind, 'Prvi rad', 'Analiza');
    await work(page, kind, 'Drugi rad', 'Programiranje');
    await expect(page.getByRole('article')).toHaveCount(2);
    await expect(page.getByRole('button', { name: 'Uredi arhivu', exact: true })).toHaveCount(0);
    await page.locator('#assessment-filter').selectOption({ label: 'Programiranje' });
    await expect(page.getByRole('article', { name: 'Prvi rad', exact: true })).toBeVisible();
    await search(page);
    await expect(page.getByRole('article')).toHaveCount(1);
    await expect(page.getByRole('article', { name: 'Drugi rad', exact: true })).toBeVisible();
    await page.getByLabel('Naziv sadrži').fill('nema takvog naziva');
    await search(page);
    await expect(page.getByRole('article')).toHaveCount(0);
    await page.getByRole('button', { name: 'Poništi filtre' }).click();
    await expect(page.getByRole('article')).toHaveCount(2);
    await page
      .getByRole('article', { name: 'Drugi rad', exact: true })
      .getByRole('button', { name: 'Označi obavljeno', exact: true })
      .click();
    await expect(page.getByRole('button', { name: 'Ponovno otvori stavku' })).toBeEnabled();
    await page.getByLabel('Status obaveza').selectOption('done');
    await search(page);
    await expect(page.getByRole('article')).toHaveCount(1);
    await page.reload();
    await expect(page.getByRole('article')).toHaveCount(2);
    if (kind === 'projects') {
      await page.getByRole('link', { name: 'Prvi rad', exact: true }).click();
      page.once('dialog', (d) => d.accept());
      await page.getByRole('button', { name: 'Arhiviraj projekt', exact: true }).click();
      await expect(page.getByRole('button', { name: 'Uredi stavku', exact: true })).toBeDisabled();
      await page.getByRole('button', { name: 'Uredi arhivu', exact: true }).first().click();
      await expect(page.getByRole('button', { name: 'Uredi stavku', exact: true })).toBeEnabled();
      await page.getByRole('button', { name: 'Zaključaj arhivu', exact: true }).first().click();
      await expect(page.getByRole('button', { name: 'Uredi stavku', exact: true })).toBeDisabled();
      await page.goto('/projects');
      await expect(page.getByRole('link', { name: 'Prvi rad', exact: true })).toHaveCount(0);
      await page.getByRole('button', { name: 'Prikaži arhivu', exact: true }).click();
      await expect(page.getByRole('link', { name: 'Prvi rad', exact: true })).toBeVisible();
      await page.getByRole('button', { name: 'Sakrij arhivu', exact: true }).click();
      await expect(page.getByRole('link', { name: 'Prvi rad', exact: true })).toHaveCount(0);
    }
  });
}

test('calendar day/week/month navigation, explicit filters and accessible responsive views preserve sessions', async ({
  page,
}, info) => {
  await page.goto('/schedule');
  await page.getByText('Upravljanje rasporedom', { exact: true }).click();
  for (const [date, course, kind] of [
    ['2026-10-19', 'Analiza', 'lecture'],
    ['2026-10-20', 'Programiranje', 'exercise'],
    ['2026-11-02', 'Analiza', 'lecture'],
  ]) {
    await page.getByRole('button', { name: 'Dodaj pojedinačni termin' }).click();
    await page.getByLabel('Kolegij', { exact: true }).selectOption({ label: course });
    await page.getByLabel('Vrsta nastave', { exact: true }).selectOption(kind);
    await page.getByLabel('Datum termina', { exact: true }).fill(date);
    await page.getByLabel('Početak nastave', { exact: true }).fill('16:30');
    await page.getByLabel('Završetak nastave', { exact: true }).fill('18:00');
    await page.getByRole('button', { name: 'Spremi termin', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Novi pojedinačni termin' })).toHaveCount(0);
  }
  await page.getByText('Upravljanje rasporedom', { exact: true }).click();
  await page.getByLabel('Datum pregleda').fill('2026-10-19');
  await expect(page.getByRole('article')).toHaveCount(2);
  await expect(page.locator('.calendar-cell')).toHaveCount(7);
  await page.screenshot({
    path: `artifacts/calendar-2026-10-20/${info.project.name}-week.png`,
    fullPage: true,
  });
  await page.getByRole('button', { name: 'Mjesec', exact: true }).click();
  await expect(page.locator('.calendar-cell')).toHaveCount(35);
  await page.getByRole('button', { name: 'Sljedeći mjesec' }).click();
  await expect(page.getByLabel('Datum pregleda')).toHaveValue('2026-11-19');
  await expect(page.locator('.calendar-event')).toHaveCount(1);
  await page.getByRole('button', { name: 'Prethodni mjesec' }).click();
  await page.getByLabel('Kolegij u rasporedu').selectOption({ label: 'Programiranje' });
  await expect(page.locator('.calendar-event')).toHaveCount(2);
  await search(page);
  await expect(page.locator('.calendar-event')).toHaveCount(1);
  await page.getByRole('button', { name: 'Poništi filtre' }).click();
  await expect(page.locator('.calendar-event')).toHaveCount(2);
  await page.getByLabel('Vrsta nastave u rasporedu').selectOption('exercise');
  await search(page);
  await expect(page.locator('.calendar-event')).toHaveCount(1);
  await page.getByRole('button', { name: 'Poništi filtre' }).click();
  const originalSize = page.viewportSize()!;
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    for (const view of ['Dan', 'Tjedan', 'Mjesec']) {
      await page.getByRole('button', { name: view, exact: true }).click();
      await expect(page.getByText(/^Učitavam/)).toHaveCount(0);
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
  }
  await page.setViewportSize(originalSize);
  await page.screenshot({
    path: `artifacts/calendar-2026-10-20/${info.project.name}-month.png`,
    fullPage: true,
  });
  await page.getByRole('button', { name: 'Otvori dan 2026-10-19', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Dan', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(
    page.getByRole('article', { name: 'Analiza 2026-10-19 16:30', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Sljedeći dan', exact: true }).click();
  await expect(
    page.getByRole('article', { name: 'Programiranje 2026-10-20 16:30', exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Danas', exact: true }).click();
  await page.screenshot({
    path: `artifacts/calendar-2026-10-20/${info.project.name}-day.png`,
    fullPage: true,
  });
  await page.reload();
  await page.getByLabel('Datum pregleda').fill('2026-10-19');
  await expect(page.getByRole('article')).toHaveCount(2);
  await page.goto('/attendance');
  await page.getByLabel('Kolegij za pregled dolaznosti').selectOption({ label: 'Analiza' });
  await search(page);
  const analysis = page.getByRole('article', { name: 'Analiza 2026-10-19 16:30', exact: true });
  await expect(analysis).toBeVisible();
  await page.getByLabel('Kolegij za pregled dolaznosti').selectOption({ label: 'Programiranje' });
  await expect(analysis).toBeVisible();
  await search(page);
  await expect(analysis).toHaveCount(0);
  await expect(
    page.getByRole('article', { name: 'Programiranje 2026-10-20 16:30', exact: true }),
  ).toBeVisible();
});
