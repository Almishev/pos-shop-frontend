import { expect, type APIRequestContext, type Page } from '@playwright/test';
import { API_BASE } from '../helpers/constants';
import { apiLogin } from './auth';
import { USERS } from '../helpers/constants';

/** Force-end all ACTIVE cash drawer sessions (admin). */
export async function forceEndAllSessions(request: APIRequestContext): Promise<void> {
  const token = await apiLogin(request, USERS.admin.email, USERS.admin.password);
  const headers = { Authorization: `Bearer ${token}` };
  const res = await request.get(`${API_BASE}/cash-drawer/active-sessions`, { headers });
  if (!res.ok()) return;
  const sessions = await res.json();
  for (const s of sessions || []) {
    await request.post(`${API_BASE}/cash-drawer/force-end/${s.id}`, {
      headers,
      data: {},
    });
  }
}

export type StartWorkDayOptions = {
  amount?: string;
  registerId?: string;
};

/**
 * Open cash drawer modal and start work day on first free device.
 */
export async function startWorkDay(
  page: Page,
  options: StartWorkDayOptions = {},
): Promise<void> {
  const amount = options.amount ?? '100';
  const registerId = options.registerId ?? 'E2E1';

  await page.getByRole('button', { name: /Контрол на касата/ }).click();
  const modal = page.locator('.modal.show').filter({ hasText: 'Контрол на касата' });
  await expect(modal).toBeVisible();

  // Already active?
  if (await modal.getByText('Активна сесия').isVisible().catch(() => false)) {
    await modal.getByRole('button', { name: 'Затвори' }).click();
    return;
  }

  await modal.getByRole('button', { name: /Започни работен ден/ }).click();

  const startModal = page.locator('.modal.show').filter({ hasText: 'Започни работен ден' }).last();
  await expect(startModal).toBeVisible();
  await startModal.locator('input[name="startAmount"]').fill(amount);

  const deviceSelect = startModal.locator('select[name="deviceSerialNumber"]');
  await expect(deviceSelect.locator('option')).not.toHaveCount(1, { timeout: 10_000 }); // more than placeholder
  const optionsCount = await deviceSelect.locator('option').count();
  expect(optionsCount).toBeGreaterThan(1);
  // select first non-empty option
  const value = await deviceSelect.locator('option').nth(1).getAttribute('value');
  await deviceSelect.selectOption(value!);

  await startModal.locator('input[name="registerId"]').fill(registerId);
  await startModal.getByRole('button', { name: /Започни деня/ }).click();

  await expect(page.getByText('Работният ден е започнат успешно!').first()).toBeVisible({
    timeout: 15_000,
  });
  await expect(modal.getByText('Активна сесия')).toBeVisible({ timeout: 10_000 });
  await modal.getByRole('button', { name: 'Затвори' }).click();
}
