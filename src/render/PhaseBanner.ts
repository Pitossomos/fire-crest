import Phaser from 'phaser';
import { FONT_TITLE, MAP_AREA } from './layout';

const BANNER_COLOR = { player: 0x24418a, enemy: 0x7a2420, ally: 0x226b37 } as const;

/** Faixa animada anunciando a troca de fase. */
export function showPhaseBanner(scene: Phaser.Scene, label: string, faction: keyof typeof BANNER_COLOR): Promise<void> {
  const cy = MAP_AREA.height / 2;
  const band = scene.add.rectangle(MAP_AREA.width / 2, cy, MAP_AREA.width, 72, BANNER_COLOR[faction], 0.88).setDepth(80).setScale(1, 0).setScrollFactor(0);
  const txt = scene.add
    .text(-200, cy, label, { fontFamily: FONT_TITLE, fontSize: '34px', color: '#f2e6d0', fontStyle: 'bold' })
    .setOrigin(0.5)
    .setDepth(81)
    .setScrollFactor(0);
  return new Promise((resolve) => {
    scene.tweens.chain({
      tweens: [
        { targets: band, scaleY: 1, duration: 160, ease: 'Quad.easeOut' },
        { targets: txt, x: MAP_AREA.width / 2, duration: 260, ease: 'Back.easeOut' },
        { targets: txt, alpha: 1, duration: 520 },
        { targets: [txt, band], alpha: 0, duration: 220 },
      ],
      onComplete: () => {
        band.destroy();
        txt.destroy();
        resolve();
      },
    });
  });
}
