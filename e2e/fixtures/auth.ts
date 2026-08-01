import { expect, type Page, type APIRequestContext } from '@playwright/test';
import { API_BASE, USERS } from '../helpers/constants';

export async function loginAs(
  page: Page,
  email: string,
  password: string,
): Promise<void> {
  await page.goto('/login');
  await page.locator('#email').fill(email);
  await page.locator('#password').fill(password);
  await page.getByRole('button', { name: 'Вход' }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 20_000 });
  await expect(page.getByText('Успешен вход').first()).toBeVisible({ timeout: 10_000 });
  // Full reload so axios modules (e.g. ItemService) pick up the JWT from localStorage
  await page.reload();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 20_000 });
  await expect(page.getByRole('link', { name: 'Табло' })).toBeVisible();
}

export async function loginAsAdmin(page: Page): Promise<void> {
  await loginAs(page, USERS.admin.email, USERS.admin.password);
}

export async function loginAsCashier(page: Page): Promise<void> {
  await loginAs(page, USERS.cashier.email, USERS.cashier.password);
}

export async function logout(page: Page): Promise<void> {
  await page.locator('#navbarDropdown').click();
  await page.getByRole('link', { name: 'Изход' }).click();
  await expect(page).toHaveURL(/\/login/);
}

/** API login — returns JWT for cleanup helpers. */
export async function apiLogin(
  request: APIRequestContext,
  email: string,
  password: string,
): Promise<string> {
  const res = await request.post(`${API_BASE}/login`, {
    data: { email, password },
  });
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  return body.token as string;
}
