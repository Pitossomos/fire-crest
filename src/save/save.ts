import type { SaveData } from '../data/types';
import { SAVE_VERSION } from '../core/campaign';

export const SAVE_KEY = 'fire-crest-save-v1';

/** Subconjunto de `Storage` (permite testar com um armazenamento em memória). */
export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/** Armazenamento padrão: localStorage, ou nada se indisponível (modo privado, etc.). */
export function defaultStore(): KeyValueStore | undefined {
  try {
    return typeof localStorage === 'undefined' ? undefined : localStorage;
  } catch {
    return undefined;
  }
}

export function loadSave(store: KeyValueStore | undefined = defaultStore()): SaveData | undefined {
  try {
    const raw = store?.getItem(SAVE_KEY);
    if (!raw) return undefined;
    const data = JSON.parse(raw) as SaveData;
    // v1 → v2 ganhou os Selos da Brasa; v2 → v3 ganhou o baú do grupo. O resto é compatível.
    const legacy = data as Partial<SaveData> & { version: number };
    if (legacy.version === 1 || legacy.version === 2) {
      return { ...data, version: SAVE_VERSION, seals: legacy.seals ?? 0, convoy: legacy.convoy ?? { items: [], weapons: [] } };
    }
    return data.version === SAVE_VERSION ? data : undefined;
  } catch {
    return undefined;
  }
}

export function writeSave(data: SaveData, store: KeyValueStore | undefined = defaultStore()): boolean {
  try {
    store?.setItem(SAVE_KEY, JSON.stringify(data));
    return store !== undefined;
  } catch {
    return false;
  }
}

export function clearSave(store: KeyValueStore | undefined = defaultStore()): void {
  try {
    store?.removeItem(SAVE_KEY);
  } catch {
    /* sem armazenamento: nada a apagar */
  }
}
