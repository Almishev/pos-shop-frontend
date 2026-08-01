import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STATE_PATH = path.join(__dirname, '..', '.runtime', 'state.json');

export type E2EState = {
  categoryName?: string;
  itemName?: string;
  itemBarcode?: string;
  itemId?: string;
};

export function saveState(partial: E2EState): void {
  const dir = path.dirname(STATE_PATH);
  fs.mkdirSync(dir, { recursive: true });
  const current = loadState();
  fs.writeFileSync(STATE_PATH, JSON.stringify({ ...current, ...partial }, null, 2), 'utf8');
}

export function loadState(): E2EState {
  try {
    if (!fs.existsSync(STATE_PATH)) return {};
    return JSON.parse(fs.readFileSync(STATE_PATH, 'utf8')) as E2EState;
  } catch {
    return {};
  }
}
