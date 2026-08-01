/** Display currency for the shop (Bulgaria uses EUR). */
export const SHOP_CURRENCY = 'EUR';
export const SHOP_LOCALE = 'bg-BG';

export function formatMoney(amount) {
  return new Intl.NumberFormat(SHOP_LOCALE, {
    style: 'currency',
    currency: SHOP_CURRENCY,
  }).format(amount || 0);
}
