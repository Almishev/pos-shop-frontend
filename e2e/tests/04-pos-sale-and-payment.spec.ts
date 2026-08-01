import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../fixtures/auth';
import { forceEndAllSessions, startWorkDay } from '../fixtures/cashDrawer';
import { acceptConfirms } from '../helpers/dialogs';
import { loadState } from '../helpers/state';
import { restockItemByName } from '../helpers/inventory';

async function addQaItemToCart(page: import('@playwright/test').Page) {
  const { itemName } = loadState();
  test.skip(!itemName, 'Run 02-category-and-item.spec.ts first');

  await page.getByRole('link', { name: 'Продажби' }).click();
  await expect(page).toHaveURL(/\/explore/);

  const search = page.getByPlaceholder('Търси по име или баркод...');
  await search.fill(itemName!);

  const itemCard = page.locator('.item-card').filter({ hasText: itemName! });
  await expect(itemCard).toBeVisible({ timeout: 15_000 });
  await itemCard.locator('button.btn-success').click();

  // Confirm line appears in cart area (right column)
  await expect(page.locator('.explore-container').getByText(itemName!).first()).toBeVisible();
  await expect(page.getByText('Количката е празна')).toHaveCount(0);
}

async function expectReceipt(page: import('@playwright/test').Page) {
  await expect(page.getByRole('heading', { name: 'Касова бележка' })).toBeVisible({
    timeout: 15_000,
  });
}

test.describe('04 POS sale and payment', () => {
  test.beforeEach(async ({ page, request }) => {
    const { itemName } = loadState();
    if (itemName) {
      await restockItemByName(request, itemName, 50);
    }
    await forceEndAllSessions(request);
    await loginAsAdmin(page);
    await startWorkDay(page, { amount: '100', registerId: 'E2E-POS' });
  });

  test('cash payment for QA item', async ({ page }) => {
    acceptConfirms(page);
    await addQaItemToCart(page);

    const orderResp = page.waitForResponse(
      (r) => r.url().includes('/orders') && r.request().method() === 'POST' && !r.url().includes('archive'),
      { timeout: 20_000 },
    );
    await page.getByRole('button', { name: 'В брой', exact: true }).click();
    const res = await orderResp;
    expect(res.ok(), `createOrder ${res.status()} ${await res.text()}`).toBeTruthy();
    await expect(page.getByText('Плащане в брой прието').first()).toBeVisible({ timeout: 15_000 });
    await expectReceipt(page);
  });

  test('card payment (mock approve)', async ({ page }) => {
    acceptConfirms(page);
    await addQaItemToCart(page);

    await page.getByRole('button', { name: 'Карта', exact: true }).click();
    await expect(page.getByText('Картово плащане одобрено').first()).toBeVisible({
      timeout: 20_000,
    });
    await expectReceipt(page);
  });

  test('split payment with prompt', async ({ page }) => {
    acceptConfirms(page, '1.00');
    await addQaItemToCart(page);

    await page.getByRole('button', { name: 'Съвместно', exact: true }).click();
    await expect(
      page.getByText(/Прието в брой|Картова част: одобрена/).first(),
    ).toBeVisible({ timeout: 20_000 });
  });
});
