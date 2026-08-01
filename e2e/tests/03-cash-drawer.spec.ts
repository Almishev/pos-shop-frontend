import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../fixtures/auth';
import { forceEndAllSessions, startWorkDay } from '../fixtures/cashDrawer';

test.describe('03 Cash drawer', () => {
  test('start work day creates active session', async ({ page, request }) => {
    await forceEndAllSessions(request);
    await loginAsAdmin(page);
    await startWorkDay(page, { amount: '100', registerId: 'E2E1' });

    await page.getByRole('button', { name: /Контрол на касата/ }).click();
    await expect(page.getByText('Активна сесия').first()).toBeVisible();
    await page.getByRole('button', { name: 'Затвори' }).click();
  });
});
