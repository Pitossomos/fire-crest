import type { KeyValueStore } from './save';

/**
 * Preferências de tela do aparelho (não fazem parte do save da campanha):
 * orientação forçada ou automática e zoom do mapa.
 */
export type ScreenPreference = 'auto' | 'landscape' | 'portrait';

export interface ViewPrefs {
  screen: ScreenPreference;
  /** Escala do pixel-art no mapa (2, 3 ou 4). */
  zoom: number;
}

export const VIEW_PREFS_KEY = 'fire-crest-view';
export const DEFAULT_VIEW_PREFS: ViewPrefs = { screen: 'auto', zoom: 3 };

const SCREENS: ScreenPreference[] = ['auto', 'landscape', 'portrait'];

/** Lê as preferências; qualquer valor inválido volta ao padrão. Nunca lança. */
export function loadViewPrefs(kv?: KeyValueStore): ViewPrefs {
  try {
    const raw = kv?.getItem(VIEW_PREFS_KEY);
    if (!raw) return { ...DEFAULT_VIEW_PREFS };
    const data = JSON.parse(raw) as Partial<ViewPrefs>;
    return {
      screen: SCREENS.includes(data.screen as ScreenPreference) ? data.screen as ScreenPreference : DEFAULT_VIEW_PREFS.screen,
      zoom: [2, 3, 4].includes(Number(data.zoom)) ? Number(data.zoom) : DEFAULT_VIEW_PREFS.zoom,
    };
  } catch {
    return { ...DEFAULT_VIEW_PREFS };
  }
}

/** Grava as preferências (silencioso se o armazenamento estiver bloqueado). */
export function writeViewPrefs(prefs: ViewPrefs, kv?: KeyValueStore): void {
  try {
    kv?.setItem(VIEW_PREFS_KEY, JSON.stringify(prefs));
  } catch {
    // modo privado / armazenamento cheio: as preferências valem só nesta sessão
  }
}
