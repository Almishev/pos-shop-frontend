import { test, expect } from '@playwright/test';
import { loginAsAdmin } from '../fixtures/auth';
import { uniqueSuffix } from '../helpers/unique';
import { saveState } from '../helpers/state';
import { restockItemByName } from '../helpers/inventory';

test.describe('02 Category and item', () => {
  test('admin creates category then product', async ({ page, request }) => {
    const suffix = uniqueSuffix();
    const categoryName = `QA Cat ${suffix}`;
    const itemName = `QA Item ${suffix}`;

    await loginAsAdmin(page);

    await page.getByRole('link', { name: 'Категории' }).click();
    await expect(page).toHaveURL(/\/category/);
    await page.locator('#name').fill(categoryName);
    await page.locator('#description').fill('E2E category');
    await page.getByRole('button', { name: 'Запази' }).click();
    await expect(page.getByText('Категорията е добавена').first()).toBeVisible();
    await expect(page.getByText(categoryName).first()).toBeVisible({ timeout: 10_000 });

    await page.getByRole('link', { name: 'Артикули' }).click();
    await expect(page).toHaveURL(/\/items/);
    await page.locator('#name').fill(itemName);
    await page.locator('#category').selectOption({ label: categoryName });
    await page.locator('#price').fill('2.50');
    await page.locator('#vatRate').selectOption('0.2');
    await page.getByRole('button', { name: 'Запази' }).click();
    await expect(page.getByText('Артикулът е добавен').first()).toBeVisible({ timeout: 20_000 });

    const itemId = await restockItemByName(request, itemName, 100);
    saveState({ categoryName, itemName, itemId });
  });
});
