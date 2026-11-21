/**
 * Layout da tela. A resolução muda com a orientação do aparelho (paisagem,
 * paisagem de toque com margens para os botões, retrato) e com o zoom do
 * mapa, então os valores abaixo são *vinculações vivas* (`export let`) e
 * objetos mutáveis: quem os importa sempre lê o layout atual. Puro, sem
 * Phaser (testável).
 */

/** Tamanho do pixel-art base. */
export const BASE_TILE = 16;
/** Zooms permitidos do mapa (escala do pixel-art: tiles de 32, 48 ou 64 px). */
export const ZOOM_LEVELS = [2, 3, 4] as const;
export const DEFAULT_ZOOM = 3;

export interface Rect { x: number; y: number; width: number; height: number }

export type ScreenMode = 'landscape' | 'portrait';
/** Preferência do jogador: seguir a orientação do aparelho ou fixar uma. */
export type ScreenPref = 'auto' | ScreenMode;

export interface TouchZones {
  /** Faixa do direcional. */
  pad: Rect;
  /** Faixa de Confirmar/Voltar. */
  buttons: Rect;
  /** Confirmar e Voltar empilhados (margem estreita) ou lado a lado. */
  stacked: boolean;
}

export interface Layout {
  mode: ScreenMode;
  touch: boolean;
  width: number;
  height: number;
  map: Rect;
  side: Rect;
  bottom: Rect;
  /** Área livre dos botões virtuais, para centralizar as telas de menu. */
  content: Rect;
  /** Botões na batalha. */
  touchZones: TouchZones | null;
  /** Botões nas telas de menu (no retrato, numa faixa no pé da tela, fora do `content`). */
  menuZones: TouchZones | null;
  fontScale: number;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Margens da paisagem de toque: direcional à esquerda, ✓/✕ à direita. */
export const TOUCH_GUTTER = { left: 190, right: 120 } as const;
const SIDE_W = 240;
const TOUCH_SIDE_W = 250;
const PORTRAIT_W = 540;
const PORTRAIT_PANEL_H = 300;
const PORTRAIT_HELP_H = 48;
const TOUCH_FONT_SCALE = 1.2;

/**
 * Calcula o layout. `aspect` é largura/altura da janela (usado para encher a
 * tela do celular sem tarjas).
 */
export function computeLayout(mode: ScreenMode, opts: { touch: boolean; aspect: number }): Layout {
  const { touch } = opts;
  const fontScale = touch ? TOUCH_FONT_SCALE : 1;
  if (mode === 'portrait') {
    const width = PORTRAIT_W;
    const aspect = opts.aspect > 0 && opts.aspect < 1 ? opts.aspect : 9 / 16;
    const height = clamp(Math.round(width / aspect), 900, 1170);
    const mapH = height - PORTRAIT_PANEL_H - PORTRAIT_HELP_H;
    const map = { x: 0, y: 0, width, height: mapH };
    const zoneH = 200;
    return {
      mode, touch, width, height, fontScale, map,
      side: { x: 0, y: mapH, width, height: PORTRAIT_PANEL_H },
      bottom: { x: 0, y: mapH + PORTRAIT_PANEL_H, width, height: PORTRAIT_HELP_H },
      content: { x: 0, y: 0, width, height: touch ? height - zoneH : height },
      menuZones: touch
        ? {
          pad: { x: 0, y: height - zoneH, width: 200, height: zoneH },
          buttons: { x: width - 200, y: height - zoneH, width: 200, height: zoneH },
          stacked: false,
        }
        : null,
      // No retrato os botões flutuam sobre a parte de baixo do mapa.
      touchZones: touch
        ? {
          pad: { x: 0, y: mapH - zoneH, width: 200, height: zoneH },
          buttons: { x: width - 200, y: mapH - zoneH, width: 200, height: zoneH },
          stacked: false,
        }
        : null,
    };
  }
  const height = 540;
  if (!touch) {
    return {
      mode, touch, width: 960, height, fontScale,
      map: { x: 0, y: 0, width: 720, height: 480 },
      side: { x: 720, y: 0, width: SIDE_W, height },
      bottom: { x: 0, y: 480, width: 720, height: 60 },
      content: { x: 0, y: 0, width: 960, height },
      touchZones: null,
      menuZones: null,
    };
  }
  // Paisagem de toque: margens laterais só para os botões, sem cobrir o mapa.
  const width = clamp(Math.round(height * (opts.aspect || 16 / 9)), 1100, 1280);
  const { left, right } = TOUCH_GUTTER;
  const mapW = width - left - right - TOUCH_SIDE_W;
  const gutters: TouchZones = {
    pad: { x: 0, y: height - 220, width: left, height: 220 },
    buttons: { x: width - right, y: height - 260, width: right, height: 260 },
    stacked: true,
  };
  return {
    mode, touch, width, height, fontScale,
    map: { x: left, y: 0, width: mapW, height: 480 },
    side: { x: left + mapW, y: 0, width: TOUCH_SIDE_W, height },
    bottom: { x: left, y: 480, width: mapW, height: 60 },
    content: { x: left, y: 0, width: width - left - right, height },
    touchZones: gutters,
    menuZones: gutters,
  };
}

/** Modo efetivo: a preferência fixa, ou a orientação da janela. */
export function resolveMode(pref: ScreenPref, viewport: { width: number; height: number }): ScreenMode {
  if (pref !== 'auto') return pref;
  return viewport.height > viewport.width ? 'portrait' : 'landscape';
}

// ---------------------------------------------------------------------------
// Layout atual (vinculações vivas)
// ---------------------------------------------------------------------------

export let SCALE: number = DEFAULT_ZOOM;
export let TILE = BASE_TILE * SCALE;
export let GAME_WIDTH = 960;
export let GAME_HEIGHT = 540;
export let FONT_SCALE = 1;

export const MAP_AREA: Rect = { x: 0, y: 0, width: 720, height: 480 };
export const SIDE_PANEL: Rect = { x: 720, y: 0, width: 240, height: 540 };
export const BOTTOM_BAR: Rect = { x: 0, y: 480, width: 720, height: 60 };
export const CONTENT: Rect = { x: 0, y: 0, width: 960, height: 540 };
export const VIEW: { mode: ScreenMode; touch: boolean; touchZones: TouchZones | null; menuZones: TouchZones | null } = {
  mode: 'landscape', touch: false, touchZones: null, menuZones: null,
};

/** Aplica um layout calculado aos valores vivos acima. */
export function applyLayout(l: Layout): void {
  GAME_WIDTH = l.width;
  GAME_HEIGHT = l.height;
  FONT_SCALE = l.fontScale;
  Object.assign(MAP_AREA, l.map);
  Object.assign(SIDE_PANEL, l.side);
  Object.assign(BOTTOM_BAR, l.bottom);
  Object.assign(CONTENT, l.content);
  VIEW.mode = l.mode;
  VIEW.touch = l.touch;
  VIEW.touchZones = l.touchZones;
  VIEW.menuZones = l.menuZones;
}

/** Troca o zoom do mapa (escala do pixel-art). Retorna o zoom aplicado. */
export function setZoom(scale: number): number {
  const z = ZOOM_LEVELS.includes(scale as (typeof ZOOM_LEVELS)[number]) ? scale : DEFAULT_ZOOM;
  SCALE = z;
  TILE = BASE_TILE * z;
  return z;
}

/** Tamanho de fonte ajustado ao aparelho (maior no toque), em px. */
export function fsize(px: number): number {
  return Math.round(px * FONT_SCALE);
}

/** Igual a `fsize`, já como string CSS (`'16px'`). */
export function fs(px: number): string {
  return `${fsize(px)}px`;
}

export const FONT_UI = 'monospace';
export const FONT_TITLE = 'Georgia, "Times New Roman", serif';

export const COLORS = {
  background: 0x0d0b12,
  panel: 0x1b1622,
  panelBorder: 0x5c4630,
  text: '#f2e6d0',
  textDim: '#a89c88',
  accent: '#ffb347',
  move: 0x3b82f6,
  attack: 0xef4444,
  heal: 0x22c55e,
  cursor: 0xffd34d,
  hpPlayer: 0x4ade80,
  hpEnemy: 0xf87171,
  hpAlly: 0x86efac,
  hpBack: 0x2a2230,
};
