import { expect, type APIRequestContext } from '@playwright/test';
import { API_BASE, USERS } from '../helpers/constants';
import { apiLogin } from '../fixtures/auth';

/** Add stock for an item by name (admin API). */
export async function restockItemByName(
  request: APIRequestContext,
  itemName: string,
  quantity = 100,
): Promise<string> {
  const token = await apiLogin(request, USERS.admin.email, USERS.admin.password);
  const headers = { Authorization: `Bearer ${token}` };
  const itemsRes = await request.get(`${API_BASE}/items`, { headers });
  expect(itemsRes.ok()).toBeTruthy();
  const items = await itemsRes.json();
  const item = (items as Array<{ name: string; itemId: string }>).find((i) => i.name === itemName);
  expect(item, `Item not found: ${itemName}`).toBeTruthy();

  const addRes = await request.post(`${API_BASE}/inventory/stock/add`, {
    headers,
    data: {
      itemId: item!.itemId,
      quantity,
      notes: 'E2E restock',
      createdBy: 'E2E',
      referenceType: 'PURCHASE',
      referenceNumber: `E2E-${Date.now()}`,
    },
  });
  expect(addRes.ok(), await addRes.text()).toBeTruthy();
  return item!.itemId;
}
