/** Tamanho do pixel-art base e escala de exibição. */
export const BASE_TILE = 16;
export const SCALE = 3;
export const TILE = BASE_TILE * SCALE;

export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 540;

/** Área do mapa (15×10 tiles) e painéis. */
export const MAP_AREA = { x: 0, y: 0, width: 720, height: 480 };
export const SIDE_PANEL = { x: 720, y: 0, width: 240, height: 540 };
export const BOTTOM_BAR = { x: 0, y: 480, width: 720, height: 60 };

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
