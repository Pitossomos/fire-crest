import Phaser from 'phaser';
import type { BattleMap } from '../core/battle-map';
import type { Point } from '../core/grid';
import { hash2 } from './pixel-canvas';
import { COLORS, MAP_AREA, SCALE, TILE } from './layout';
import { type Scroll, clampScroll, screenToTile, scrollToCenter, scrollToShow } from './map-camera';
import { terrainTextureKey } from './textures';

export type HighlightKind = 'move' | 'attack' | 'heal';

const HIGHLIGHT_COLOR: Record<HighlightKind, number> = {
  move: COLORS.move,
  attack: COLORS.attack,
  heal: COLORS.heal,
};

/** Desenha os tiles, os destaques de alcance, a prévia de caminho e o cursor. */
export class MapView {
  private readonly scene: Phaser.Scene;
  private readonly map: BattleMap;
  private readonly highlights: Phaser.GameObjects.Graphics;
  private readonly pathLayer: Phaser.GameObjects.Graphics;
  private readonly cursor: Phaser.GameObjects.Graphics;
  private cursorTween?: Phaser.Tweens.Tween;
  private scrollTween?: Phaser.Tweens.Tween;

  constructor(scene: Phaser.Scene, map: BattleMap) {
    this.scene = scene;
    this.map = map;
    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        const t = map.terrainAt({ x, y });
        const variant = Math.floor(hash2(x, y, 11) * 1000);
        scene.add
          .image(x * TILE, y * TILE, terrainTextureKey(t.id, variant))
          .setOrigin(0)
          .setScale(SCALE)
          .setDepth(0);
      }
    }
    this.highlights = scene.add.graphics().setDepth(1);
    this.pathLayer = scene.add.graphics().setDepth(2);
    this.cursor = scene.add.graphics().setDepth(20);
    this.drawCursor();
    // A câmera rola livremente (os limites são calculados aqui, já que a
    // área do mapa pode começar depois da margem dos botões). Os painéis e as
    // margens ficam por cima, com scrollFactor 0.
    const cam = scene.cameras.main;
    cam.removeBounds();
    this.applyScroll({ x: cam.scrollX, y: cam.scrollY }, false);
  }

  private get pixelSize(): { w: number; h: number } {
    return { w: this.map.width * TILE, h: this.map.height * TILE };
  }

  /** O mapa é maior que a área visível (precisa de câmera)? */
  get scrolls(): boolean {
    return this.map.width * TILE > MAP_AREA.width || this.map.height * TILE > MAP_AREA.height;
  }

  /** Posição na tela (canto superior esquerdo do tile), considerando a rolagem. */
  toScreen(p: Point): { x: number; y: number } {
    const cam = this.scene.cameras.main;
    return { x: p.x * TILE - cam.scrollX, y: p.y * TILE - cam.scrollY };
  }

  private applyScroll(target: Scroll, animate: boolean): void {
    const cam = this.scene.cameras.main;
    const { w, h } = this.pixelSize;
    const s = clampScroll(target, w, h, MAP_AREA);
    if (s.x === cam.scrollX && s.y === cam.scrollY) return;
    this.scrollTween?.stop();
    if (!animate) {
      cam.setScroll(s.x, s.y);
      return;
    }
    this.scrollTween = this.scene.tweens.add({ targets: cam, scrollX: s.x, scrollY: s.y, duration: 140, ease: 'Sine.easeOut' });
  }

  /** Rola a câmera para que o tile fique visível com uma margem de tiles. */
  ensureVisible(p: Point, margin = 2, animate = true): void {
    const cam = this.scene.cameras.main;
    this.applyScroll(scrollToShow(p, { x: cam.scrollX, y: cam.scrollY }, MAP_AREA, TILE, margin * TILE), animate);
  }

  /** Centraliza a câmera no tile (início da fase, troca de layout ou zoom). */
  centerOn(p: Point): void {
    this.applyScroll(scrollToCenter(p, MAP_AREA, TILE), false);
  }

  static toPixel(p: Point): { x: number; y: number } {
    return { x: p.x * TILE, y: p.y * TILE };
  }

  /** Converte coordenadas de tela em tile (ou null fora da área do mapa ou do mapa). */
  toTile(screenX: number, screenY: number): Point | null {
    const cam = this.scene.cameras.main;
    const p = screenToTile(screenX, screenY, { x: cam.scrollX, y: cam.scrollY }, MAP_AREA, TILE);
    return p && this.map.inBounds(p) ? p : null;
  }

  showRanges(move: Point[], attack: Point[], attackKind: HighlightKind = 'attack'): void {
    this.highlights.clear();
    this.fillTiles(attack, HIGHLIGHT_COLOR[attackKind], 0.38);
    this.fillTiles(move, HIGHLIGHT_COLOR.move, 0.42);
  }

  clearRanges(): void {
    this.highlights.clear();
    this.pathLayer.clear();
  }

  showPath(path: Point[]): void {
    this.pathLayer.clear();
    if (path.length < 2) return;
    this.pathLayer.lineStyle(6, 0xffffff, 0.85);
    this.pathLayer.beginPath();
    path.forEach((p, i) => {
      const cx = p.x * TILE + TILE / 2;
      const cy = p.y * TILE + TILE / 2;
      if (i === 0) this.pathLayer.moveTo(cx, cy);
      else this.pathLayer.lineTo(cx, cy);
    });
    this.pathLayer.strokePath();
    const end = path[path.length - 1];
    this.pathLayer.fillStyle(0xffffff, 0.95);
    this.pathLayer.fillCircle(end.x * TILE + TILE / 2, end.y * TILE + TILE / 2, 7);
  }

  clearPath(): void {
    this.pathLayer.clear();
  }

  moveCursor(p: Point): void {
    this.cursor.setPosition(p.x * TILE, p.y * TILE);
  }

  setCursorVisible(visible: boolean): void {
    this.cursor.setVisible(visible);
  }

  private fillTiles(tiles: Point[], color: number, alpha: number): void {
    this.highlights.fillStyle(color, alpha);
    this.highlights.lineStyle(1, color, Math.min(1, alpha + 0.35));
    for (const t of tiles) {
      this.highlights.fillRect(t.x * TILE + 1, t.y * TILE + 1, TILE - 2, TILE - 2);
      this.highlights.strokeRect(t.x * TILE + 1, t.y * TILE + 1, TILE - 2, TILE - 2);
    }
  }

  /** Cursor: quatro cantos dourados pulsando. */
  private drawCursor(): void {
    const g = this.cursor;
    const len = 12;
    const w = 4;
    g.fillStyle(COLORS.cursor, 1);
    for (const [cx, cy] of [[0, 0], [TILE, 0], [0, TILE], [TILE, TILE]]) {
      const sx = cx === 0 ? 0 : -len;
      const sy = cy === 0 ? 0 : -w;
      g.fillRect(cx + sx, cy + sy, len, w);
      g.fillRect(cx + (cx === 0 ? 0 : -w), cy + (cy === 0 ? 0 : -len), w, len);
    }
    this.cursorTween = this.scene.tweens.add({
      targets: g, alpha: 0.55, duration: 550, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
    });
  }

  destroy(): void {
    this.cursorTween?.stop();
    this.scrollTween?.stop();
  }
}
