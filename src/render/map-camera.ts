import type { Point } from '../core/grid';
import type { Rect } from './layout';

/**
 * Contas da câmera do mapa (puras, testáveis). A área do mapa pode começar
 * fora da origem da tela (margem dos botões na paisagem de toque); o tile
 * (0,0) aparece no canto da área quando a rolagem é `-area.x, -area.y`.
 */
export interface Scroll { x: number; y: number }

/** Limites da rolagem em um eixo: do início do mapa até a última coluna/linha visível. */
export function scrollLimits(mapPx: number, areaStart: number, areaSize: number): { min: number; max: number } {
  const min = 0 - areaStart + 0; // "+ 0" evita -0
  return { min, max: Math.max(min, mapPx - areaStart - areaSize) };
}

export function clampScroll(s: Scroll, mapW: number, mapH: number, area: Rect): Scroll {
  const lx = scrollLimits(mapW, area.x, area.width);
  const ly = scrollLimits(mapH, area.y, area.height);
  return { x: Math.min(lx.max, Math.max(lx.min, s.x)), y: Math.min(ly.max, Math.max(ly.min, s.y)) };
}

/** Tile sob um ponto da tela, ou null fora da área do mapa. */
export function screenToTile(sx: number, sy: number, scroll: Scroll, area: Rect, tile: number): Point | null {
  if (sx < area.x || sy < area.y || sx >= area.x + area.width || sy >= area.y + area.height) return null;
  return { x: Math.floor((sx + scroll.x) / tile), y: Math.floor((sy + scroll.y) / tile) };
}

/** Rolagem mínima para o tile ficar visível com `margin` px de folga. */
export function scrollToShow(p: Point, s: Scroll, area: Rect, tile: number, margin: number): Scroll {
  let { x, y } = s;
  const left = p.x * tile - margin;
  const right = (p.x + 1) * tile + margin;
  const top = p.y * tile - margin;
  const bottom = (p.y + 1) * tile + margin;
  if (left < x + area.x) x = left - area.x;
  if (right > x + area.x + area.width) x = right - area.x - area.width;
  if (top < y + area.y) y = top - area.y;
  if (bottom > y + area.y + area.height) y = bottom - area.y - area.height;
  return { x, y };
}

/** Rolagem que centraliza o tile na área. */
export function scrollToCenter(p: Point, area: Rect, tile: number): Scroll {
  return {
    x: p.x * tile + tile / 2 - area.width / 2 - area.x,
    y: p.y * tile + tile / 2 - area.height / 2 - area.y,
  };
}
