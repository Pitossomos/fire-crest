import Phaser from 'phaser';
import type { BattleMap } from '../core/battle-map';
import type { Point } from '../core/grid';
import { hash2 } from './pixel-canvas';
import { COLORS, SCALE, TILE } from './layout';
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
  }

  static toPixel(p: Point): { x: number; y: number } {
    return { x: p.x * TILE, y: p.y * TILE };
  }

  /** Converte coordenadas de tela em tile (ou null fora do mapa). */
  toTile(px: number, py: number): Point | null {
    const p = { x: Math.floor(px / TILE), y: Math.floor(py / TILE) };
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
  }
}
