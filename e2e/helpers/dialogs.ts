import type { Page, Dialog } from '@playwright/test';

/**
 * Auto-accept browser dialogs. For prompt(), returns promptValue when provided.
 */
export function acceptConfirms(page: Page, promptValue?: string): void {
  page.on('dialog', async (dialog: Dialog) => {
    if (dialog.type() === 'prompt') {
      await dialog.accept(promptValue ?? dialog.defaultValue());
      return;
    }
    await dialog.accept();
  });
}

/** Stub window.print and expose a flag for assertions. */
export async function stubPrint(page: Page): Promise<void> {
  await page.addInitScript(() => {
    // @ts-expect-error test flag
    window.__printCalled = false;
    window.print = () => {
      // @ts-expect-error test flag
      window.__printCalled = true;
    };
  });
}

export async function wasPrintCalled(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    // @ts-expect-error test flag
    return Boolean(window.__printCalled);
  });
}
