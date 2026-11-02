import Phaser from 'phaser';
import type { LevelUp } from '../core/leveling';
import type { Unit } from '../core/unit';
import { COLORS, FONT_TITLE, FONT_UI, MAP_AREA, TILE } from './layout';

/** Texto que sobe e some (dano, "Errou", EXP). */
export function floatText(scene: Phaser.Scene, tileX: number, tileY: number, text: string, color: string, size = 20): Promise<void> {
  const t = scene.add
    .text(tileX * TILE + TILE / 2, tileY * TILE + 4, text, {
      fontFamily: FONT_UI, fontSize: `${size}px`, color, fontStyle: 'bold', stroke: '#1a1420', strokeThickness: 4,
    })
    .setOrigin(0.5, 1)
    .setDepth(75);
  return new Promise((resolve) => {
    scene.tweens.add({
      targets: t, y: t.y - 26, alpha: { from: 1, to: 0 }, duration: 750, ease: 'Cubic.easeOut',
      onComplete: () => { t.destroy(); resolve(); },
    });
  });
}

const STAT_NAMES: [keyof Unit['stats'], string][] = [
  ['hp', 'HP'], ['str', 'FOR'], ['mag', 'MAG'], ['skl', 'HAB'],
  ['spd', 'VEL'], ['lck', 'SOR'], ['def', 'DEF'], ['res', 'RES'],
];

/** Painel de level-up; some após um tempo ou com clique/tecla. */
export function levelUpPopup(scene: Phaser.Scene, unit: Unit, up: LevelUp): Promise<void> {
  const w = 300;
  const h = 170;
  const x = (MAP_AREA.width - w) / 2;
  const y = (MAP_AREA.height - h) / 2;
  const bg = scene.add.rectangle(0, 0, w, h, COLORS.panel, 0.97).setOrigin(0).setStrokeStyle(3, 0xffb347);
  const title = scene.add.text(w / 2, 12, `${unit.name} — Nível ${up.level}!`, {
    fontFamily: FONT_TITLE, fontSize: '20px', color: COLORS.accent, fontStyle: 'bold',
  }).setOrigin(0.5, 0);
  const cells = STAT_NAMES.map(([k, label], i) => {
    const gained = up.gains[k] > 0;
    return scene.add.text(24 + (i % 2) * 140, 50 + Math.floor(i / 2) * 26, `${label} ${String(unit.stats[k]).padStart(2)}${gained ? '  +1' : ''}`, {
      fontFamily: FONT_UI, fontSize: '16px', color: gained ? '#7CFC9A' : COLORS.textDim,
    });
  });
  const box = scene.add.container(x, y, [bg, title, ...cells]).setDepth(90).setAlpha(0);
  return new Promise((resolve) => {
    let done = false;
    const close = () => {
      if (done) return;
      done = true;
      scene.input.keyboard?.off('keydown', close);
      scene.input.off('pointerdown', close);
      scene.tweens.add({ targets: box, alpha: 0, duration: 150, onComplete: () => { box.destroy(); resolve(); } });
    };
    scene.tweens.add({ targets: box, alpha: 1, duration: 150 });
    scene.time.delayedCall(350, () => {
      scene.input.keyboard?.on('keydown', close);
      scene.input.on('pointerdown', close);
    });
    scene.time.delayedCall(2200, close);
  });
}

/** Faixa central de vitória/derrota. */
export function outcomeBanner(scene: Phaser.Scene, text: string, color: number): Phaser.GameObjects.Container {
  const band = scene.add.rectangle(0, 0, MAP_AREA.width, 110, color, 0.92).setOrigin(0, 0.5);
  const label = scene.add.text(MAP_AREA.width / 2, 0, text, {
    fontFamily: FONT_TITLE, fontSize: '44px', color: '#f2e6d0', fontStyle: 'bold',
  }).setOrigin(0.5);
  return scene.add.container(0, MAP_AREA.height / 2, [band, label]).setDepth(95);
}
