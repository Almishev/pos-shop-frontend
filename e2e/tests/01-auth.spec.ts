import { test, expect } from '@playwright/test';
import { loginAsAdmin, loginAsCashier, loginAs } from '../fixtures/auth';
import { USERS } from '../helpers/constants';

test.describe('01 Auth', () => {
  test('admin login succeeds and lands on dashboard', async ({ page }) => {
    await loginAsAdmin(page);
    await expect(page.getByRole('link', { name: 'Табло' })).toBeVisible();
  });

  test('bad password shows error toast', async ({ page }) => {
    await page.goto('/login');
    await page.locator('#email').fill(USERS.admin.email);
    await page.locator('#password').fill('wrong-password');
    await page.getByRole('button', { name: 'Вход' }).click();
    await expect(page.getByText('Невалиден имейл/парола').first()).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test('cashier cannot open admin category/items routes', async ({ page }) => {
    await loginAsCashier(page);
    await page.goto('/category');
    await expect(page).toHaveURL(/\/dashboard/);
    await page.goto('/items');
    await expect(page).toHaveURL(/\/dashboard/);
  });
});
