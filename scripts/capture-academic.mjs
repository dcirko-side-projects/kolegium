import { mkdir } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { resolve } from 'node:path';

process.env.PLAYWRIGHT_BROWSERS_PATH ??= resolve('.playwright-browsers');
const { chromium, devices, expect } = await import('@playwright/test');
async function capture(page, options) {
  await expect(page.getByText(/^Učitavam/)).toHaveCount(0);
  await page.evaluate(() => document.activeElement?.blur());
  if (options.fullPage) await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot(options);
}
const browser = await chromium.launch();
await mkdir('artifacts/academic', { recursive: true });
try {
  for (const [name, options] of [
    ['desktop', { viewport: { width: 1440, height: 1000 } }],
    ['mobile', devices['Pixel 7']],
    ['tablet', { viewport: { width: 768, height: 1024 } }],
  ]) {
    const context = await browser.newContext(options);
    const page = await context.newPage();
    await page.goto('http://127.0.0.1:4300/login');
    // Never clear data until the target app proves it is the disposable test project.
    await expect(page.locator('[data-project-id]')).toHaveAttribute(
      'data-project-id',
      'demo-kolegium-tests',
    );
    execFileSync(process.execPath, ['scripts/seed-local-auth.mjs', 'test']);
    const response = await page.request.delete(
      'http://127.0.0.1:18080/emulator/v1/projects/demo-kolegium-tests/databases/(default)/documents',
    );
    if (!response.ok()) throw new Error('Test dataset reset failed.');
    await capture(page, { path: `artifacts/academic/${name}-login.png`, fullPage: true });
    await page.getByRole('button', { name: 'Prijava testnim Google računom' }).click();
    await expect(page).toHaveTitle('Početna | Kolegium');
    await page.goto('http://127.0.0.1:4300/settings');
    await page.getByRole('button', { name: 'Dodaj semestar' }).click();
    await page.getByLabel('Naziv semestra', { exact: true }).fill('Sintetički semestar');
    await page.getByLabel('Početak nastave').fill('2026-10-01');
    await page.getByLabel('Završetak nastave').fill('2027-02-01');
    await page.getByRole('button', { name: 'Spremi semestar' }).click();
    await expect(
      page.getByRole('status').filter({ hasText: 'Semestar je spremljen' }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Postavi aktualnim' }).click();
    await expect(page.getByText('Aktualni semestar je postavljen.', { exact: true })).toBeVisible();
    await capture(page, { path: `artifacts/academic/${name}-semesters.png`, fullPage: true });
    await page.goto('http://127.0.0.1:4300/courses');
    await page.getByRole('button', { name: 'Dodaj kolegij' }).click();
    await page.getByLabel('Naziv kolegija', { exact: true }).fill('Sintetički kolegij');
    await page
      .getByLabel('Informacije o kolegiju (opcionalno)')
      .fill('Primjer za vizualni pregled. Nije stvarni TVZ kolegij.');
    await capture(page, { path: `artifacts/academic/${name}-course-form.png`, fullPage: true });
    await page.getByRole('button', { name: 'Spremi kolegij' }).click();
    await expect(
      page.getByText('Kolegij je spremljen i potvrđen na poslužitelju.', { exact: true }),
    ).toBeVisible();
    await page.getByRole('link', { name: /Sintetički kolegij/ }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Sintetički kolegij');
    await capture(page, { path: `artifacts/academic/${name}-course.png`, fullPage: true });
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Europe/Zagreb',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(new Date());
    const part = (key) => parts.find((p) => p.type === key).value;
    const today = `${part('year')}-${part('month')}-${part('day')}`;
    const weekday = new Date(`${today}T12:00:00Z`).getUTCDay() || 7;
    await page.goto('http://127.0.0.1:4300/schedule');
    await page.getByRole('button', { name: 'Dodaj ponavljanje' }).click();
    await page.getByLabel('Dan u tjednu').selectOption({ index: weekday - 1 });
    await capture(page, { path: `artifacts/academic/${name}-schedule-form.png`, fullPage: true });
    await page.getByRole('button', { name: 'Pregledaj termine' }).click();
    await page.getByRole('button', { name: 'Potvrdi raspored' }).click();
    await expect(
      page.getByRole('status').filter({ hasText: 'Izmjena je spremljena' }),
    ).toBeVisible();
    await capture(page, { path: `artifacts/academic/${name}-schedule.png`, fullPage: true });
    await page
      .getByRole('article', { name: `Sintetički kolegij ${today} 08:00`, exact: true })
      .getByRole('button', { name: 'Prisutan', exact: true })
      .click();
    await expect(
      page
        .getByRole('article', { name: `Sintetički kolegij ${today} 08:00`, exact: true })
        .getByRole('button', { name: 'Prisutan', exact: true }),
    ).toHaveAttribute('aria-pressed', 'true');
    await expect(
      page.getByRole('status').filter({ hasText: 'Izmjena je spremljena' }),
    ).toBeVisible();
    await page.goto('http://127.0.0.1:4300/attendance');
    await page
      .getByLabel('Kolegij za pregled dolaznosti', { exact: true })
      .selectOption({ index: 1 });
    await page.getByRole('button', { name: 'Pretraži', exact: true }).click();
    await expect(
      page
        .locator('section')
        .filter({ has: page.getByRole('heading', { name: 'Predavanja', exact: true }) }),
    ).toContainText('Prisutni: 1');
    await capture(page, { path: `artifacts/academic/${name}-attendance.png`, fullPage: true });
    await page.goto('http://127.0.0.1:4300/');
    await expect(
      page.getByRole('article', { name: `Sintetički kolegij ${today} 08:00`, exact: true }),
    ).toBeVisible();
    await capture(page, { path: `artifacts/academic/${name}-today.png`, fullPage: true });
    await page.goto('http://127.0.0.1:4300/assessments');
    await page.getByRole('button', { name: 'Dodaj provjeru', exact: true }).click();
    await page.getByLabel('Naziv provjere', { exact: true }).fill('Sintetički kolokvij');
    await page.getByLabel('Datum provjere', { exact: true }).fill(today);
    await page.getByRole('button', { name: 'Spremi provjeru', exact: true }).click();
    await expect(
      page.getByRole('link', { name: 'Sintetički kolokvij', exact: true }),
    ).toBeVisible();
    await page.getByRole('link', { name: 'Sintetički kolokvij', exact: true }).click();
    await page.getByRole('button', { name: 'Dodaj pokušaj', exact: true }).click();
    await page.getByLabel('Bodovi (opcionalno)', { exact: true }).fill('7.1250');
    await page.getByLabel('Ocjena (opcionalno)', { exact: true }).fill('B+');
    await page.getByRole('button', { name: 'Spremi pokušaj', exact: true }).click();
    await expect(page.getByRole('article', { name: 'Pokušaj 1', exact: true })).toContainText(
      '7.1250',
    );
    await capture(page, { path: `artifacts/academic/${name}-assessment.png`, fullPage: true });
    await page.goto('http://127.0.0.1:4300/projects');
    await page.getByRole('button', { name: 'Dodaj projekt', exact: true }).click();
    await page.getByLabel('Naziv projekta', { exact: true }).fill('Sintetički projekt');
    await page.getByRole('button', { name: 'Spremi projekt', exact: true }).click();
    await expect(page.getByRole('link', { name: 'Sintetički projekt', exact: true })).toBeVisible();
    await page.getByRole('link', { name: 'Sintetički projekt', exact: true }).click();
    await page.getByRole('button', { name: 'Dodaj zadatak', exact: true }).click();
    await page.getByLabel('Naziv zadatka', { exact: true }).fill('Pripremi prezentaciju');
    await page.getByRole('button', { name: 'Spremi zadatak', exact: true }).click();
    await expect(
      page.getByRole('article', { name: 'Pripremi prezentaciju', exact: true }),
    ).toBeVisible();
    await capture(page, { path: `artifacts/academic/${name}-project.png`, fullPage: true });
    await page.goto('http://127.0.0.1:4300/thesis');
    await page.getByRole('button', { name: 'Dodaj osnovnu evidenciju', exact: true }).click();
    await page.getByRole('button', { name: 'Spremi diplomski', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Uredi diplomski', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Dodaj zadatak', exact: true }).click();
    await page.getByLabel('Naziv zadatka', { exact: true }).fill('Dogovori temu s mentorom');
    await page.getByRole('button', { name: 'Spremi zadatak', exact: true }).click();
    await expect(
      page.getByRole('article', { name: 'Dogovori temu s mentorom', exact: true }),
    ).toBeVisible();
    await capture(page, { path: `artifacts/academic/${name}-thesis.png`, fullPage: true });
    await page.goto('http://127.0.0.1:4300/todo');
    await expect(
      page.getByRole('article', { name: 'Pripremi prezentaciju', exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole('article', { name: 'Dogovori temu s mentorom', exact: true }),
    ).toBeVisible();
    await capture(page, { path: `artifacts/academic/${name}-todo.png`, fullPage: true });
    await page.getByRole('button', { name: 'Dodaj zadatak', exact: true }).click();
    await capture(page, { path: `artifacts/academic/${name}-task-dialog.png`, fullPage: false });
    await page.getByRole('button', { name: 'Zatvori obrazac', exact: true }).click();
    await page.goto('http://127.0.0.1:4300/reminders');
    await capture(page, { path: `artifacts/academic/${name}-reminders.png`, fullPage: true });
    await page.goto('http://127.0.0.1:4300/installments');
    await page.getByRole('button', { name: 'Dodaj ratu', exact: true }).click();
    await page.getByLabel('Naziv rate', { exact: true }).fill('Sintetička rata');
    await page.getByLabel('Iznos EUR', { exact: true }).fill('123,45');
    await page.getByLabel('Rok plaćanja', { exact: true }).fill(today);
    await page.getByRole('button', { name: 'Spremi ratu', exact: true }).click();
    await expect(page.getByRole('article', { name: 'Sintetička rata', exact: true })).toContainText(
      '123,45',
    );
    await capture(page, { path: `artifacts/academic/${name}-installments.png`, fullPage: false });
    await page.goto('http://127.0.0.1:4300/');
    await expect(
      page.locator('[aria-labelledby="installment-reminders-title"]').getByRole('article', {
        name: 'Sintetička rata',
        exact: true,
      }),
    ).toBeVisible();
    await capture(page, { path: `artifacts/academic/${name}-overview.png`, fullPage: false });
    await page.goto('http://127.0.0.1:4300/courses');
    await page
      .getByRole('link')
      .filter({ has: page.getByRole('heading', { name: 'Sintetički kolegij', exact: true }) })
      .click();
    await page.getByRole('button', { name: 'Prikaži / osvježi bodovanje', exact: true }).click();
    await expect(page.getByRole('region', { name: 'Osobni izračun' })).toContainText(
      'Pravila ocjenjivanja još nisu unesena.',
    );
    await page
      .getByRole('heading', { name: 'Bodovanje i ocjena kolegija', exact: true })
      .scrollIntoViewIfNeeded();
    await capture(page, { path: `artifacts/academic/${name}-grading.png`, fullPage: false });
    await page.getByRole('button', { name: 'Uredi pravila bodovanja', exact: true }).click();
    await page.getByRole('button', { name: 'Dodaj komponentu', exact: true }).click();
    await page.getByRole('button', { name: 'Dodaj interval ocjene', exact: true }).click();
    await page
      .getByRole('heading', { name: 'Pravila prema izvoru kolegija', exact: true })
      .evaluate((node) => node.scrollIntoView({ block: 'start' }));
    await capture(page, { path: `artifacts/academic/${name}-grading-form.png`, fullPage: false });
    page.once('dialog', (dialog) => dialog.accept());
    await page.getByRole('button', { name: 'Odustani od bodovanja', exact: true }).click();
    await page.goto('http://127.0.0.1:4300/settings');
    await page
      .getByRole('heading', { name: 'Sigurnosna kopija i povrat', exact: true })
      .evaluate((node) => node.scrollIntoView({ block: 'start' }));
    await capture(page, { path: `artifacts/academic/${name}-backup.png`, fullPage: false });
    await context.close();
  }
} finally {
  await browser.close();
}
console.log('Synthetic screenshots saved to artifacts/academic; development data was not touched.');
