/** Unique suffix for category/item names in E2E runs. */
export function uniqueSuffix(): string {
  return `${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}
