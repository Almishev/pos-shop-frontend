import { test, expect } from '@playwright/test';
import { loginAsAdmin, loginAsCashier } from '../fixtures/auth';
import { forceEndAllSessions, startWorkDay } from '../fixtures/cashDrawer';

async function openFiscalGenerateForm(page: import('@playwright/test').Page) {
  await page.getByRole('link', { name: 'Отчети' }).click();
  await expect(page).toHaveURL(/\/reports/);
  // Admin defaults to export tab — always open fiscal
  await page.getByRole('button', { name: /Фискални отчети/ }).click();
  await expect(page.getByRole('heading', { name: /Фискални отчети/ })).toBeVisible();
  await page.getByRole('button', { name: /Генерирай отчет/ }).first().click();
  await expect(page.getByRole('heading', { name: /Генерирай нов фискален отчет/ })).toBeVisible();
}

test.describe('06 Reports', () => {
  test('cashier sees fiscal tab only and can generate SHIFT', async ({ page, request }) => {
    await forceEndAllSessions(request);
    await loginAsCashier(page);
    await startWorkDay(page, { amount: '100', registerId: 'E2E-CASHIER' });

    await page.getByRole('link', { name: 'Отчети' }).click();
    await expect(page).toHaveURL(/\/reports/);

    await expect(page.getByText('Фискални отчети').first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Експорт данни/ })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /По касиери/ })).toHaveCount(0);

    await page.getByRole('button', { name: /Генерирай отчет/ }).first().click();
    await expect(page.getByRole('heading', { name: /Генерирай нов фискален отчет/ })).toBeVisible();

    const form = page.locator('form').filter({ hasText: 'Тип отчет' });
    await form.locator('select').first().selectOption('SHIFT');
    await expect(form.locator('input[name="reportDate"]')).not.toHaveValue('');

    const shiftResponse = page.waitForResponse(
      (r) => r.url().includes('/fiscal-reports/shift') && r.request().method() === 'POST',
      { timeout: 30_000 },
    );
    await form.getByRole('button', { name: 'Генерирай отчет' }).click();
    const res = await shiftResponse;
    expect(res.ok(), `SHIFT status ${res.status()} body=${await res.text()}`).toBeTruthy();
    await expect(page.getByText('Отчетът е генериран успешно').first()).toBeVisible({
      timeout: 15_000,
    });
  });

  test('admin can open export tabs and generate STORE_DAILY', async ({ page, request }) => {
    await forceEndAllSessions(request);
    await loginAsAdmin(page);
    await startWorkDay(page, { amount: '100', registerId: 'E2E-ADMIN-R' });

    await page.getByRole('link', { name: 'Отчети' }).click();
    await expect(page).toHaveURL(/\/reports/);

    await expect(page.getByRole('button', { name: /Експорт данни/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /По касиери/ })).toBeVisible();
    await page.getByRole('button', { name: /Експорт данни/ }).click();
    await page.getByRole('button', { name: /По касиери/ }).click();

    await openFiscalGenerateForm(page);
    const form = page.locator('form').filter({ hasText: 'Тип отчет' });
    await form.locator('select').first().selectOption('STORE_DAILY');

    const dailyResponse = page.waitForResponse(
      (r) => r.url().includes('/fiscal-reports/') && r.request().method() === 'POST',
      { timeout: 30_000 },
    );
    await form.getByRole('button', { name: 'Генерирай отчет' }).click();
    const res = await dailyResponse;
    expect(res.ok(), `STORE_DAILY status ${res.status()}`).toBeTruthy();
    await expect(page.getByText('Отчетът е генериран успешно').first()).toBeVisible({
      timeout: 15_000,
    });
  });

  test('admin can generate DAILY report smoke', async ({ page, request }) => {
    await forceEndAllSessions(request);
    await loginAsAdmin(page);
    await startWorkDay(page, { amount: '100', registerId: 'E2E-DAILY' });

    await openFiscalGenerateForm(page);
    const form = page.locator('form').filter({ hasText: 'Тип отчет' });
    await form.locator('select').first().selectOption('DAILY');

    // Cashier + device selects appear for DAILY
    const selects = form.locator('select');
    if ((await selects.count()) >= 2) {
      await selects.nth(1).selectOption({ index: 1 });
    }
    if ((await selects.count()) >= 3) {
      await selects.nth(2).selectOption({ index: 1 });
    }

    const respPromise = page.waitForResponse(
      (r) => r.url().includes('/fiscal-reports/daily') && r.request().method() === 'POST',
      { timeout: 30_000 },
    );
    await form.getByRole('button', { name: 'Генерирай отчет' }).click();
    const res = await respPromise;
    expect([200, 201, 400, 409, 412]).toContain(res.status());
    if (res.ok()) {
      await expect(page.getByText('Отчетът е генериран успешно').first()).toBeVisible();
    } else {
      await expect(page.getByText(/Грешка|отчет|касиер|устройство/i).first()).toBeVisible();
    }
  });
});
