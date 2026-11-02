import Phaser from 'phaser';
import { COLORS, FONT_TITLE, FONT_UI, GAME_HEIGHT, GAME_WIDTH } from '../render/layout';

/** Tela de título com brasas subindo. */
export class TitleScene extends Phaser.Scene {
  constructor() {
    super('Title');
  }

  create(): void {
    const cx = GAME_WIDTH / 2;
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0d0b12, 0x0d0b12, 0x3a1410, 0x3a1410, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);

    // Brasas
    for (let i = 0; i < 40; i++) this.spawnEmber(true);
    this.time.addEvent({ delay: 180, loop: true, callback: () => this.spawnEmber(false) });

    this.add.text(cx, 150, 'FIRE CREST', {
      fontFamily: FONT_TITLE, fontSize: '72px', color: '#ffb347', fontStyle: 'bold',
      stroke: '#3a1410', strokeThickness: 8,
    }).setOrigin(0.5);
    this.add.text(cx, 214, 'A Crista de Fogo', {
      fontFamily: FONT_TITLE, fontSize: '26px', color: COLORS.text, fontStyle: 'italic',
    }).setOrigin(0.5);
    this.add.text(cx, 262, 'Capítulo 1 — Brasas no Vale', {
      fontFamily: FONT_UI, fontSize: '16px', color: COLORS.textDim,
    }).setOrigin(0.5);

    const prompt = this.add.text(cx, 380, 'Pressione Enter ou clique para começar', {
      fontFamily: FONT_UI, fontSize: '18px', color: COLORS.text,
    }).setOrigin(0.5);
    this.tweens.add({ targets: prompt, alpha: 0.35, duration: 800, yoyo: true, repeat: -1 });

    this.add.text(cx, GAME_HEIGHT - 28,
      'Ano 300 do Longo Crepúsculo. O sol enfraquece; só a Crista ainda arde.', {
        fontFamily: FONT_UI, fontSize: '13px', color: COLORS.textDim,
      }).setOrigin(0.5);

    const start = () => this.scene.start('Battle', { stageId: 'c1s1' });
    this.input.keyboard?.once('keydown-ENTER', start);
    this.input.keyboard?.once('keydown-Z', start);
    this.input.keyboard?.once('keydown-SPACE', start);
    this.input.once('pointerdown', start);
  }

  private spawnEmber(anywhere: boolean): void {
    const x = Phaser.Math.Between(0, GAME_WIDTH);
    const y = anywhere ? Phaser.Math.Between(0, GAME_HEIGHT) : GAME_HEIGHT + 10;
    const size = Phaser.Math.Between(2, 4);
    const color = Phaser.Utils.Array.GetRandom([0xff8a1f, 0xffb347, 0xffd34d, 0xc8433a]);
    const ember = this.add.rectangle(x, y, size, size, color, 0.9);
    this.tweens.add({
      targets: ember,
      y: y - Phaser.Math.Between(200, 500),
      x: x + Phaser.Math.Between(-60, 60),
      alpha: 0,
      duration: Phaser.Math.Between(2500, 5500),
      onComplete: () => ember.destroy(),
    });
  }
}
