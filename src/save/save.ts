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
    // v1–v3 → v4: os Selos da Brasa saíram (promoção virou por nível) e o baú
    // ganhou armaduras. O resto é compatível.
    const legacy = data as Partial<SaveData> & { version: number; seals?: number };
    if (legacy.version >= 1 && legacy.version <= 3) {
      const { seals: _dropped, ...rest } = legacy;
      const convoy = legacy.convoy ?? { items: [], weapons: [], armors: [] };
      return { ...(rest as SaveData), version: SAVE_VERSION, convoy: { items: convoy.items ?? [], weapons: convoy.weapons ?? [], armors: convoy.armors ?? [] } };
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
