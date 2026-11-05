import Phaser from 'phaser';
import type { BattleMap } from '../core/battle-map';
import type { Point } from '../core/grid';
import { hash2 } from './pixel-canvas';
import { BOTTOM_BAR, COLORS, MAP_AREA, SCALE, SIDE_PANEL, TILE } from './layout';
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
    // Mapas maiores que a área visível rolam com a câmera. Os painéis cobrem a
    // faixa da direita e a de baixo, então os limites somam essas faixas para
    // que a última coluna/linha do mapa ainda possa aparecer na área visível.
    const cam = scene.cameras.main;
    cam.setBounds(0, 0, Math.max(map.width * TILE, MAP_AREA.width) + SIDE_PANEL.width,
      Math.max(map.height * TILE, MAP_AREA.height) + BOTTOM_BAR.height);
    cam.setScroll(0, 0);
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

  /** Rola a câmera para que o tile fique visível com uma margem de tiles. */
  ensureVisible(p: Point, margin = 2, animate = true): void {
    if (!this.scrolls) return;
    const cam = this.scene.cameras.main;
    const maxX = Math.max(0, this.map.width * TILE - MAP_AREA.width);
    const maxY = Math.max(0, this.map.height * TILE - MAP_AREA.height);
    const m = margin * TILE;
    let { scrollX: x, scrollY: y } = cam;
    if (p.x * TILE - m < x) x = p.x * TILE - m;
    if ((p.x + 1) * TILE + m > x + MAP_AREA.width) x = (p.x + 1) * TILE + m - MAP_AREA.width;
    if (p.y * TILE - m < y) y = p.y * TILE - m;
    if ((p.y + 1) * TILE + m > y + MAP_AREA.height) y = (p.y + 1) * TILE + m - MAP_AREA.height;
    x = Phaser.Math.Clamp(x, 0, maxX);
    y = Phaser.Math.Clamp(y, 0, maxY);
    if (x === cam.scrollX && y === cam.scrollY) return;
    this.scrollTween?.stop();
    if (!animate) {
      cam.setScroll(x, y);
      return;
    }
    this.scrollTween = this.scene.tweens.add({ targets: cam, scrollX: x, scrollY: y, duration: 140, ease: 'Sine.easeOut' });
  }

  /** Centraliza a câmera no tile (início da fase). */
  centerOn(p: Point): void {
    if (!this.scrolls) return;
    const cam = this.scene.cameras.main;
    const maxX = Math.max(0, this.map.width * TILE - MAP_AREA.width);
    const maxY = Math.max(0, this.map.height * TILE - MAP_AREA.height);
    cam.setScroll(
      Phaser.Math.Clamp(p.x * TILE + TILE / 2 - MAP_AREA.width / 2, 0, maxX),
      Phaser.Math.Clamp(p.y * TILE + TILE / 2 - MAP_AREA.height / 2, 0, maxY),
    );
  }

  static toPixel(p: Point): { x: number; y: number } {
    return { x: p.x * TILE, y: p.y * TILE };
  }

  /** Converte coordenadas de tela em tile (ou null fora da área do mapa ou do mapa). */
  toTile(screenX: number, screenY: number): Point | null {
    if (screenX < MAP_AREA.x || screenY < MAP_AREA.y || screenX >= MAP_AREA.x + MAP_AREA.width || screenY >= MAP_AREA.y + MAP_AREA.height) {
      return null;
    }
    const cam = this.scene.cameras.main;
    const p = { x: Math.floor((screenX + cam.scrollX) / TILE), y: Math.floor((screenY + cam.scrollY) / TILE) };
    return this.map.inBounds(p) ? p : null;
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
