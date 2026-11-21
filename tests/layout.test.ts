import { describe, expect, it } from 'vitest';
import {
  type Layout, type Rect, CONTENT, GAME_WIDTH, MAP_AREA, TILE, applyLayout, computeLayout, fsize, resolveMode, setZoom,
} from '../src/render/layout';
import { clampScroll, screenToTile, scrollToCenter, scrollToShow } from '../src/render/map-camera';
import { placeControls } from '../src/ui/touch-controls';
import { DEFAULT_VIEW_PREFS, VIEW_PREFS_KEY, loadViewPrefs, writeViewPrefs } from '../src/save/view-prefs';

const inside = (r: Rect, l: Layout) => r.x >= 0 && r.y >= 0 && r.x + r.width <= l.width && r.y + r.height <= l.height;
const overlap = (a: Rect, b: Rect) => a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;

describe('layout por orientação', () => {
  const cases: [string, Layout][] = [
    ['paisagem (desktop)', computeLayout('landscape', { touch: false, aspect: 16 / 9 })],
    ['paisagem de toque', computeLayout('landscape', { touch: true, aspect: 844 / 390 })],
    ['retrato de toque', computeLayout('portrait', { touch: true, aspect: 390 / 844 })],
    ['retrato (desktop)', computeLayout('portrait', { touch: false, aspect: 9 / 16 })],
  ];

  it.each(cases)('%s: áreas dentro da tela e sem sobreposição', (_n, l) => {
    for (const r of [l.map, l.side, l.bottom, l.content]) expect(inside(r, l)).toBe(true);
    expect(overlap(l.map, l.side)).toBe(false);
    expect(overlap(l.map, l.bottom)).toBe(false);
    expect(overlap(l.side, l.bottom)).toBe(false);
  });

  it('desktop continua 960×540 como antes', () => {
    const l = cases[0][1];
    expect([l.width, l.height]).toEqual([960, 540]);
    expect(l.map).toEqual({ x: 0, y: 0, width: 720, height: 480 });
    expect(l.touchZones).toBeNull();
    expect(l.fontScale).toBe(1);
  });

  it('paisagem de toque: botões nas margens, fora do mapa e do painel; fontes maiores', () => {
    const l = cases[1][1];
    expect(l.width).toBeGreaterThan(1000);
    const z = l.touchZones!;
    for (const zone of [z.pad, z.buttons]) {
      expect(inside(zone, l)).toBe(true);
      expect(overlap(zone, l.map)).toBe(false);
      expect(overlap(zone, l.side)).toBe(false);
      expect(overlap(zone, l.content)).toBe(false);
    }
    expect(z.stacked).toBe(true);
    expect(l.fontScale).toBeGreaterThan(1);
  });

  it('retrato: mapa com a largura toda (≥ 11 tiles), painel embaixo, botões sobre o mapa e fora dos menus', () => {
    const l = cases[2][1];
    expect(l.width).toBe(540);
    expect(l.height).toBeGreaterThan(l.width);
    expect(l.map.width).toBe(540);
    expect(Math.floor(l.map.width / 48)).toBeGreaterThanOrEqual(11);
    expect(l.side.y).toBe(l.map.y + l.map.height);
    const z = l.touchZones!;
    expect(overlap(z.pad, l.map) && overlap(z.buttons, l.map)).toBe(true);
    expect(overlap(z.pad, l.side)).toBe(false);
    const m = l.menuZones!;
    expect(overlap(m.pad, l.content)).toBe(false);
    expect(overlap(m.buttons, l.content)).toBe(false);
  });

  it('altura do retrato acompanha a proporção, com limites', () => {
    expect(computeLayout('portrait', { touch: true, aspect: 0.2 }).height).toBe(1170);
    expect(computeLayout('portrait', { touch: true, aspect: 0.75 }).height).toBe(900);
  });

  it('modo automático segue a orientação; preferência fixa vence', () => {
    expect(resolveMode('auto', { width: 390, height: 844 })).toBe('portrait');
    expect(resolveMode('auto', { width: 844, height: 390 })).toBe('landscape');
    expect(resolveMode('portrait', { width: 844, height: 390 })).toBe('portrait');
    expect(resolveMode('landscape', { width: 390, height: 844 })).toBe('landscape');
  });

  it('aplicar o layout atualiza os valores vivos; zoom muda o tile', () => {
    applyLayout(cases[2][1]);
    expect(GAME_WIDTH).toBe(540);
    expect(MAP_AREA.width).toBe(540);
    expect(CONTENT.height).toBe(cases[2][1].content.height);
    expect(fsize(10)).toBe(12);
    expect(setZoom(4)).toBe(4);
    expect(TILE).toBe(64);
    expect(setZoom(7)).toBe(3);
    expect(TILE).toBe(48);
    applyLayout(cases[0][1]);
    expect(GAME_WIDTH).toBe(960);
    expect(fsize(10)).toBe(10);
  });
});

describe('câmera do mapa com a área deslocada', () => {
  const area = { x: 190, y: 0, width: 610, height: 480 };

  it('a coluna 0 aparece no começo da área; tela → tile considera a origem', () => {
    const s = clampScroll({ x: -9999, y: -9999 }, 15 * 48, 10 * 48, area);
    expect(s).toEqual({ x: -190, y: 0 });
    expect(screenToTile(190, 0, s, area, 48)).toEqual({ x: 0, y: 0 });
    expect(screenToTile(190 + 48 * 3 + 5, 100, s, area, 48)).toEqual({ x: 3, y: 2 });
    expect(screenToTile(100, 100, s, area, 48)).toBeNull(); // na margem dos botões
  });

  it('rolagem máxima mostra a última coluna no fim da área', () => {
    const s = clampScroll({ x: 9999, y: 9999 }, 15 * 48, 10 * 48, area);
    expect(s.x + area.x + area.width).toBe(15 * 48);
    expect(s.y).toBe(0); // 10 linhas cabem na altura
  });

  it('mostrar e centralizar um tile', () => {
    const s = scrollToShow({ x: 14, y: 0 }, { x: -190, y: 0 }, area, 48, 0);
    expect(15 * 48 - s.x).toBe(area.x + area.width);
    const c = scrollToCenter({ x: 7, y: 5 }, area, 48);
    expect(7 * 48 + 24 - c.x).toBe(area.x + area.width / 2);
  });
});

describe('botões virtuais encaixados', () => {
  it('na margem estreita, Voltar fica acima de Confirmar e tudo cabe na faixa', () => {
    const pad = { left: 0, top: 230, width: 137, height: 160 };
    const btn = { left: 757, top: 200, width: 87, height: 190 };
    const p = placeControls(pad, btn, true);
    expect(p.pad.size).toBeGreaterThanOrEqual(40);
    expect(p.pad.left + p.pad.size * 3).toBeLessThanOrEqual(pad.left + pad.width + 4);
    expect(p.cancel.top + p.cancel.size).toBeLessThan(p.confirm.top);
    expect(p.confirm.left).toBeGreaterThanOrEqual(btn.left);
    expect(p.confirm.left + p.confirm.size).toBeLessThanOrEqual(btn.left + btn.width);
  });

  it('no retrato, lado a lado no canto direito', () => {
    const p = placeControls({ left: 0, top: 450, width: 144, height: 144 }, { left: 246, top: 450, width: 144, height: 144 }, false);
    expect(p.cancel.left + p.cancel.size).toBeLessThan(p.confirm.left);
    expect(p.confirm.left + p.confirm.size).toBeLessThanOrEqual(390);
    expect(p.confirm.top + p.confirm.size).toBeLessThanOrEqual(594);
  });
});

describe('preferências de tela', () => {
  const memory = () => {
    const store = new Map<string, string>();
    return { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v), removeItem: (k: string) => void store.delete(k) };
  };

  it('salva e lê; valores inválidos voltam ao padrão', () => {
    const kv = memory();
    expect(loadViewPrefs(kv)).toEqual(DEFAULT_VIEW_PREFS);
    writeViewPrefs({ screen: 'portrait', zoom: 4 }, kv);
    expect(loadViewPrefs(kv)).toEqual({ screen: 'portrait', zoom: 4 });
    kv.setItem(VIEW_PREFS_KEY, JSON.stringify({ screen: 'diagonal', zoom: 9 }));
    expect(loadViewPrefs(kv)).toEqual(DEFAULT_VIEW_PREFS);
    kv.setItem(VIEW_PREFS_KEY, '{quebrado');
    expect(loadViewPrefs(kv)).toEqual(DEFAULT_VIEW_PREFS);
  });

  it('armazenamento bloqueado não quebra', () => {
    const broken = { getItem: () => { throw new Error('bloqueado'); }, setItem: () => { throw new Error('bloqueado'); }, removeItem: () => undefined };
    expect(loadViewPrefs(broken)).toEqual(DEFAULT_VIEW_PREFS);
    expect(() => writeViewPrefs(DEFAULT_VIEW_PREFS, broken)).not.toThrow();
    expect(loadViewPrefs(undefined)).toEqual(DEFAULT_VIEW_PREFS);
  });
});
