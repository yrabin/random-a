// Shared singletons: the local store and the AI helper.
import { createStore } from './lib/store.js';
import { chat, isConfigured, AIError } from './lib/ai.js';
import { sound } from './ui.js';

function safeStorage() {
  try {
    const s = window.localStorage;
    s.setItem('__t', '1'); s.removeItem('__t');
    return s;
  } catch {
    const m = new Map();
    return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => m.set(k, v), removeItem: (k) => m.delete(k), volatile: true };
  }
}

export const storage = safeStorage();
export const store = createStore(storage);
sound.enabled = store.settings.sound !== false;

export const aiReady = () => isConfigured(store.settings.ai);

/** Call the configured AI. Counts usage for the "AI explorer" badge. */
export async function askAI(opts, extra) {
  const out = await chat(store.settings.ai, opts, extra);
  store.bump('aiUses');
  return out;
}

export { AIError };

export const LEVELS = [4, 5, 6];
export const levelLabel = (l) => `P${l}`;
