import { test, expect, Page } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { prepare, addSemester, addCourse, login } from './support';
async function saved(page: Page) {
  await expect(
    page.getByRole('status').filter({ hasText: 'Izmjena je spremljena' }).last(),
  ).toBeVisible();
}
async function project(page: Page, name = 'Sintetički projekt') {
  await page.goto('/projects');
  await page.getByRole('button', { name: 'Dodaj projekt', exact: true }).click();
  await page.getByLabel('Naziv projekta', { exact: true }).fill(name);
  await page.getByRole('button', { name: 'Spremi projekt', exact: true }).click();
  await saved(page);
  await page.getByRole('link', { name, exact: true }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(name);
}
async function task(page: Page, title: string) {
  await page.getByRole('button', { name: 'Dodaj zadatak', exact: true }).click();
  await page.getByLabel('Naziv zadatka', { exact: true }).fill(title);
  await page.getByRole('button', { name: 'Spremi zadatak', exact: true }).click();
  await expect(page.getByRole('article', { name: title, exact: true })).toBeVisible();
  await saved(page);
}
test.beforeEach(async ({ page }) => {
  await prepare(page);
});
test('assessment attempts retain zero, unknown and all history; correction does not create another attempt', async ({
  page,
}) => {
  await addSemester(page);
  await addCourse(page);
  await page.goto('/assessments');
  await page.getByRole('button', { name: 'Dodaj provjeru', exact: true }).click();
  await page.getByLabel('Naziv provjere', { exact: true }).fill('Sintetički ispit');
  await page.getByLabel('Datum provjere', { exact: true }).fill('2026-10-15');
  await page.getByRole('button', { name: 'Spremi provjeru', exact: true }).click();
  await saved(page);
  await page.getByRole('link', { name: 'Sintetički ispit', exact: true }).click();
  await page.getByRole('button', { name: 'Dodaj pokušaj', exact: true }).click();
  await page.getByLabel('Bodovi (opcionalno)', { exact: true }).fill('0');
  await page.getByRole('button', { name: 'Spremi pokušaj', exact: true }).click();
  await expect(
    page.getByText('Pokušaj je spremljen i potvrđen na poslužitelju.', { exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Dodaj pokušaj', exact: true }).click();
  await page.getByLabel('Ocjena (opcionalno)', { exact: true }).fill('B+');
  await page.getByRole('button', { name: 'Spremi pokušaj', exact: true }).click();
  await expect(page.getByRole('article', { name: 'Pokušaj 2', exact: true })).toContainText(
    'nisu poznati',
  );
  await page.getByRole('button', { name: 'Ispravi pokušaj 1', exact: true }).click();
  await page.getByLabel('Bodovi (opcionalno)', { exact: true }).fill('7.1250');
  await page.getByRole('button', { name: 'Spremi pokušaj', exact: true }).click();
  await expect(page.getByRole('article', { name: 'Pokušaj 1', exact: true })).toContainText(
    '7.1250',
  );
  await page.reload();
  await expect(page.getByRole('article', { name: /Pokušaj [12]/ })).toHaveCount(2);
  await expect(page.getByRole('article', { name: 'Pokušaj 1', exact: true })).toContainText(
    '7.1250',
  );
  await expect(page.getByRole('button', { name: 'Označi obavljeno', exact: true })).toBeVisible();
  await page.goto('/courses');
  await page
    .getByRole('link')
    .filter({ has: page.getByRole('heading', { name: 'Sintetički kolegij', exact: true }) })
    .click();
  await page.getByRole('button', { name: 'Prikaži / osvježi rezultate', exact: true }).click();
  await expect(
    page
      .getByRole('article')
      .filter({ has: page.getByRole('link', { name: 'Sintetički ispit', exact: true }) }),
  ).toContainText('7.1250');
});
test('project and global To-do share one task; project completion and archive preserve tasks/results', async ({
  page,
}) => {
  await project(page);
  await page.getByRole('button', { name: 'Dodaj pokušaj', exact: true }).click();
  await page.getByLabel('Ocjena (opcionalno)', { exact: true }).fill('B+');
  await page.getByRole('button', { name: 'Spremi pokušaj', exact: true }).click();
  await expect(
    page.getByText('Pokušaj je spremljen i potvrđen na poslužitelju.', { exact: true }),
  ).toBeVisible();
  await task(page, 'Dio projekta');
  await page.getByRole('button', { name: 'Označi obavljeno', exact: true }).click();
  await expect(
    page.getByRole('button', { name: 'Ponovno otvori stavku', exact: true }),
  ).toBeVisible();
  await saved(page);
  await expect(page.getByRole('article', { name: 'Dio projekta', exact: true })).toContainText(
    'Otvoreno',
  );
  await page.goto('/todo');
  await expect(page.getByRole('article', { name: 'Dio projekta', exact: true })).toHaveCount(1);
  await page
    .getByRole('article', { name: 'Dio projekta', exact: true })
    .getByRole('button', { name: 'Dovrši zadatak', exact: true })
    .click();
  await saved(page);
  await page.goto('/projects');
  await page.getByRole('link', { name: 'Sintetički projekt', exact: true }).click();
  await expect(page.getByRole('article', { name: 'Dio projekta', exact: true })).toContainText(
    'Dovršeno',
  );
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Arhiviraj projekt', exact: true }).click();
  await saved(page);
  await expect(page.getByRole('button', { name: 'Dodaj pokušaj', exact: true })).toBeDisabled();
  await expect(page.getByRole('article', { name: 'Pokušaj 1', exact: true })).toContainText('B+');
  await expect(page.getByRole('article', { name: 'Dio projekta', exact: true })).toBeVisible();
  await page.goto('/todo');
  await expect(
    page
      .getByRole('article', { name: 'Dio projekta', exact: true })
      .getByRole('button', { name: 'Ponovno otvori zadatak', exact: true }),
  ).toBeDisabled();
  await page.getByRole('button', { name: 'Uredi arhivu', exact: true }).click();
  await page
    .getByRole('article', { name: 'Dio projekta', exact: true })
    .getByRole('button', { name: 'Ponovno otvori zadatak', exact: true })
    .click();
  await saved(page);
});
test('thesis starts without topic/mentor and its tasks appear in the same To-do with context/status filters', async ({
  page,
}) => {
  await page.goto('/thesis');
  await page.getByRole('button', { name: 'Dodaj osnovnu evidenciju', exact: true }).click();
  await page.getByRole('button', { name: 'Spremi diplomski', exact: true }).click();
  await saved(page);
  await expect(page.getByText('Tema: još nije poznata', { exact: true })).toBeVisible();
  await task(page, 'Pronađi temu');
  await page.goto('/todo');
  await task(page, 'Samostalna obaveza');
  await page.getByLabel('Filtriraj kontekst', { exact: true }).selectOption('thesis');
  await expect(page.getByRole('article', { name: 'Pronađi temu', exact: true })).toBeVisible();
  await expect(
    page.getByRole('article', { name: 'Samostalna obaveza', exact: true }),
  ).not.toBeVisible();
  await page
    .getByRole('article', { name: 'Pronađi temu', exact: true })
    .getByRole('button', { name: 'Dovrši zadatak', exact: true })
    .click();
  await saved(page);
  await page.getByLabel('Status zadataka', { exact: true }).selectOption('open');
  await expect(page.getByRole('article', { name: 'Pronađi temu', exact: true })).not.toBeVisible();
  await page.reload();
  await page.getByLabel('Filtriraj kontekst', { exact: true }).selectOption('thesis');
  await expect(page.getByRole('article', { name: 'Pronađi temu', exact: true })).toContainText(
    'Dovršeno',
  );
});
test('two clients preserve stale project form and show the new server version', async ({
  page,
  browser,
}) => {
  await project(page);
  const url = page.url();
  await page.getByRole('button', { name: 'Uredi stavku', exact: true }).click();
  await page.getByLabel('Naziv projekta', { exact: true }).fill('Lokalni naziv');
  const context = await browser.newContext();
  try {
    const other = await context.newPage();
    await other.goto('http://127.0.0.1:4300');
    await login(other);
    await other.goto(url);
    await other.getByRole('button', { name: 'Uredi stavku', exact: true }).click();
    await other.getByLabel('Naziv projekta', { exact: true }).fill('Server naziv');
    await other.getByRole('button', { name: 'Spremi projekt', exact: true }).click();
    await saved(other);
    await page.getByRole('button', { name: 'Spremi projekt', exact: true }).click();
    await expect(page.getByRole('alert').filter({ hasText: 'drugom uređaju' })).toBeVisible();
    await expect(page.getByLabel('Naziv projekta', { exact: true })).toHaveValue('Lokalni naziv');
    await expect(
      page.getByText('Server verzija: Server naziv · otvoreno', { exact: true }),
    ).toBeVisible();
  } finally {
    await context.close();
  }
});
test('work forms have labels, no axe violations, narrow layout and keep offline draft', async ({
  page,
  context,
}) => {
  await page.goto('/todo');
  await page.getByRole('button', { name: 'Dodaj zadatak', exact: true }).click();
  await page.getByLabel('Naziv zadatka', { exact: true }).fill('Offline unos');
  await context.setOffline(true);
  await expect(page.getByRole('button', { name: 'Spremi zadatak', exact: true })).toBeDisabled();
  await expect(page.getByLabel('Naziv zadatka', { exact: true })).toHaveValue('Offline unos');
  await context.setOffline(false);
  await expect(page.getByRole('button', { name: 'Spremi zadatak', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: 'Spremi zadatak', exact: true }).click();
  await saved(page);
  for (const path of ['/todo', '/projects', '/thesis']) {
    await page.goto(path);
    const button = page.getByRole('button', {
      name:
        path === '/todo'
          ? 'Dodaj zadatak'
          : path === '/projects'
            ? 'Dodaj projekt'
            : 'Dodaj osnovnu evidenciju',
      exact: true,
    });
    await button.click();
    const axe = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    expect(axe.violations).toEqual([]);
    await page.setViewportSize({ width: 320, height: 900 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  }
});
