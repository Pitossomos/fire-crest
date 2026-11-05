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
    // v1 → v2: o save ganhou os Selos da Brasa; o resto é compatível.
    if (data.version === 1) return { ...data, version: SAVE_VERSION, seals: 0 };
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
