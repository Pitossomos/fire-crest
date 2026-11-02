import Phaser from 'phaser';
import type { Point } from '../core/grid';
import type { Unit } from '../core/unit';
import { COLORS, SCALE, TILE } from './layout';
import { unitTextureKey } from './textures';

const HP_COLOR = { player: COLORS.hpPlayer, enemy: COLORS.hpEnemy, ally: COLORS.hpAlly } as const;

/** Representação visual de uma unidade: sprite, barra de HP e marcador de chefe. */
export class UnitSprite {
  readonly unit: Unit;
  private readonly container: Phaser.GameObjects.Container;
  private readonly sprite: Phaser.GameObjects.Image;
  private readonly hpBar: Phaser.GameObjects.Graphics;
  private readonly scene: Phaser.Scene;

  constructor(scene: Phaser.Scene, unit: Unit) {
    this.scene = scene;
    this.unit = unit;
    this.sprite = scene.add.image(TILE / 2, TILE / 2, '__DEFAULT').setScale(SCALE);
    this.applyTexture();
    this.hpBar = scene.add.graphics();
    const parts: Phaser.GameObjects.GameObject[] = [this.sprite, this.hpBar];
    if (unit.boss) {
      parts.push(
        scene.add.text(TILE - 4, 2, '★', { fontFamily: 'monospace', fontSize: '14px', color: '#ffd34d' }).setOrigin(1, 0),
      );
    }
    this.container = scene.add.container(unit.x * TILE, unit.y * TILE, parts).setDepth(10);
    this.refresh();
  }

  /** Textura conforme classe, arma e facção (muda quando a unidade é recrutada). */
  applyTexture(): void {
    const u = this.unit;
    this.sprite.setTexture(unitTextureKey(u.classDef.sprite, u.weapon.type, u.faction));
    this.sprite.setFlipX(u.faction === 'enemy');
  }

  /** Surge (reforços). */
  fadeIn(): Promise<void> {
    this.container.setAlpha(0);
    return new Promise((resolve) => {
      this.scene.tweens.add({ targets: this.container, alpha: 1, duration: 400, onComplete: () => resolve() });
    });
  }

  /** Atualiza HP e o tom acinzentado de "já agiu". */
  refresh(): void {
    const u = this.unit;
    if (u.hasActed) this.sprite.setTint(0x7a7a7a);
    else this.sprite.clearTint();
    const g = this.hpBar;
    g.clear();
    const w = TILE - 12;
    const ratio = Math.max(0, u.hp / u.maxHp);
    g.fillStyle(COLORS.hpBack, 0.9);
    g.fillRect(6, TILE - 6, w, 4);
    g.fillStyle(HP_COLOR[u.faction], 1);
    g.fillRect(6, TILE - 6, Math.round(w * ratio), 4);
  }

  /** Coloca o sprite na posição atual da unidade, sem animação. */
  snap(): void {
    this.container.setPosition(this.unit.x * TILE, this.unit.y * TILE);
  }

  /** Anima o deslocamento tile a tile ao longo do caminho. */
  async walk(path: Point[], msPerTile = 90): Promise<void> {
    for (const p of path.slice(1)) {
      await new Promise<void>((resolve) => {
        this.scene.tweens.add({
          targets: this.container, x: p.x * TILE, y: p.y * TILE,
          duration: msPerTile, ease: 'Linear', onComplete: () => resolve(),
        });
      });
    }
  }

  /** Investida curta em direção a um tile (golpe). */
  lunge(toward: Point): Promise<void> {
    const dx = Math.sign(toward.x - this.unit.x) * 12;
    const dy = Math.sign(toward.y - this.unit.y) * 12;
    return new Promise((resolve) => {
      this.scene.tweens.add({
        targets: this.sprite, x: TILE / 2 + dx, y: TILE / 2 + dy, duration: 110, yoyo: true, ease: 'Quad.easeOut',
        onComplete: () => resolve(),
      });
    });
  }

  /** Pisca em branco ao receber dano. */
  flash(): void {
    this.sprite.setTintFill(0xffffff);
    this.scene.time.delayedCall(90, () => this.refresh());
  }

  /** Treme sem tomar dano (golpe errado). */
  dodge(): void {
    this.scene.tweens.add({ targets: this.sprite, x: TILE / 2 + 6, duration: 70, yoyo: true });
  }

  /** Some ao morrer. */
  fadeOut(): Promise<void> {
    return new Promise((resolve) => {
      this.scene.tweens.add({
        targets: this.container, alpha: 0, duration: 450,
        onComplete: () => { this.container.setVisible(false); this.container.setAlpha(1); resolve(); },
      });
    });
  }

  setSelected(selected: boolean): void {
    this.scene.tweens.killTweensOf(this.sprite);
    this.sprite.setY(TILE / 2);
    if (selected) {
      this.scene.tweens.add({ targets: this.sprite, y: TILE / 2 - 3, duration: 260, yoyo: true, repeat: -1 });
    }
  }

  destroy(): void {
    this.container.destroy();
  }
}
