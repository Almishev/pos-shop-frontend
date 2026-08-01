import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../fixtures/auth';
import { forceEndAllSessions, startWorkDay } from '../fixtures/cashDrawer';
import { acceptConfirms, stubPrint, wasPrintCalled } from '../helpers/dialogs';
import { loadState } from '../helpers/state';
import { restockItemByName } from '../helpers/inventory';

test.describe('05 Receipt print', () => {
  test('receipt modal print stubs window.print', async ({ page, request }) => {
    const { itemName } = loadState();
    test.skip(!itemName, 'Run 02-category-and-item.spec.ts first');

    await stubPrint(page);
    await restockItemByName(request, itemName!, 20);
    await forceEndAllSessions(request);
    await loginAsAdmin(page);
    await startWorkDay(page, { amount: '100', registerId: 'E2E-PRINT' });
    acceptConfirms(page);

    await page.getByRole('link', { name: 'Продажби' }).click();
    await page.getByPlaceholder('Търси по име или баркод...').fill(itemName!);
    const itemCard = page.locator('.item-card').filter({ hasText: itemName! });
    await expect(itemCard).toBeVisible({ timeout: 15_000 });
    await itemCard.locator('button.btn-success').click();
    await expect(page.getByText('Количката е празна')).toHaveCount(0);

    const orderResp = page.waitForResponse(
      (r) => r.url().includes('/orders') && r.request().method() === 'POST' && !r.url().includes('archive'),
      { timeout: 20_000 },
    );
    await page.getByRole('button', { name: 'В брой', exact: true }).click();
    expect((await orderResp).ok()).toBeTruthy();
    await expect(page.getByText('Плащане в брой прието').first()).toBeVisible({ timeout: 15_000 });

    await expect(page.getByRole('heading', { name: 'Касова бележка' })).toBeVisible({
      timeout: 15_000,
    });
    await page.getByRole('button', { name: 'Печат', exact: true }).click();
    expect(await wasPrintCalled(page)).toBeTruthy();
    await expect(page.getByRole('heading', { name: 'Касова бележка' })).toHaveCount(0);
  });
});
