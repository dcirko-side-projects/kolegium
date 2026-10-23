import { Page, expect } from '@playwright/test';
export const firestoreUrl = 'http://127.0.0.1:18080';
export const authUrl = 'http://127.0.0.1:19099';
export const project = 'demo-kolegium-tests';
export async function seedAccount(page: Page, uid = 'local-owner'): Promise<void> {
  const clear = await page.request.delete(`${authUrl}/emulator/v1/projects/${project}/accounts`);
  expect(clear.ok()).toBe(true);
  const response = await page.request.post(
    `${authUrl}/identitytoolkit.googleapis.com/v1/projects/${project}/accounts:batchCreate`,
    {
      headers: { Authorization: 'Bearer owner' },
      data: {
        users: [
          {
            localId: uid,
            email: 'owner@example.test',
            emailVerified: true,
            displayName: 'Lokalni testni račun',
            providerUserInfo: [
              {
                providerId: 'google.com',
                rawId: 'local-owner-google',
                email: 'owner@example.test',
                displayName: 'Lokalni testni račun',
              },
            ],
          },
        ],
      },
    },
  );
  expect(response.ok()).toBe(true);
}
export async function prepare(page: Page): Promise<void> {
  await page.goto('/login');
  await expect(page.locator('[data-project-id]')).toHaveAttribute('data-project-id', project);
  await seedAccount(page);
  const clear = await page.request.delete(
    `${firestoreUrl}/emulator/v1/projects/${project}/databases/(default)/documents`,
  );
  expect(clear.ok()).toBe(true);
  await login(page);
}
export async function login(page: Page): Promise<void> {
  await page.goto('/login');
  await page.getByRole('button', { name: 'Prijava testnim Google računom' }).click();
  await expect(page).toHaveTitle('Početna | Kolegium');
  await expect(page.getByRole('main')).toHaveAttribute('aria-busy', 'false');
  await expect(page.getByText('Učitavam podatke…', { exact: true })).not.toBeVisible();
}
export async function addSemester(page: Page, name = 'Sintetički semestar'): Promise<void> {
  await page.goto('/settings');
  await page.getByRole('button', { name: 'Dodaj semestar' }).click();
  await page.getByLabel('Naziv semestra', { exact: true }).fill(name);
  await page.getByLabel('Početak nastave').fill('2026-10-01');
  await page.getByLabel('Završetak nastave').fill('2027-02-01');
  await page.getByRole('button', { name: 'Spremi semestar' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Semestar je spremljen' })).toBeVisible();
  await page
    .locator('article')
    .filter({ has: page.getByRole('heading', { name, exact: true }) })
    .getByRole('button', { name: 'Postavi aktualnim' })
    .click();
  await expect(page.getByText('Aktualni semestar je postavljen.', { exact: true })).toBeVisible();
}
export async function addCourse(page: Page, name = 'Sintetički kolegij'): Promise<void> {
  await page.goto('/courses');
  await expect(page.locator('#course-semester option:checked')).not.toHaveText('Odaberi semestar');
  await page.getByRole('button', { name: 'Dodaj kolegij' }).click();
  await page.getByLabel('Naziv kolegija', { exact: true }).fill(name);
  await page
    .getByLabel('Informacije o kolegiju (opcionalno)')
    .fill('Sintetički sadržaj, nije stvarni TVZ kolegij.');
  await page.getByRole('button', { name: 'Spremi kolegij' }).click();
  await expect(
    page.getByText('Kolegij je spremljen i potvrđen na poslužitelju.', { exact: true }),
  ).toBeVisible();
  await page.getByRole('link', { name: new RegExp(name) }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(name);
}
