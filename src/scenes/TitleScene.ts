import Phaser from 'phaser';
import { newCampaign } from '../core/campaign';
import { CHAPTER_1 } from '../data/chapter1';
import type { GameMode, SaveData } from '../data/types';
import { COLORS, FONT_TITLE, FONT_UI, GAME_HEIGHT, GAME_WIDTH } from '../render/layout';
import { TextMenu, type TextMenuOption } from '../render/TextMenu';
import { isMuted, toggleMute } from '../render/sfx';
import { clearSave, loadSave, writeSave } from '../save/save';

/** Lê parâmetros de desenvolvimento da URL (?stage=c1s3&seed=42). */
export function urlParams(): { stage?: string; seed?: number } {
  try {
    const q = new URLSearchParams(window.location.search);
    const seed = q.get('seed');
    return { stage: q.get('stage') ?? undefined, seed: seed ? Number(seed) : undefined };
  } catch {
    return {};
  }
}

/** Tela de título: novo jogo (Clássico/Casual), continuar e brasas subindo. */
export class TitleScene extends Phaser.Scene {
  /** Menu atual (lido por testes de ponta a ponta). */
  menu?: TextMenu;

  constructor() {
    super('Title');
  }

  create(): void {
    const cx = GAME_WIDTH / 2;
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0d0b12, 0x0d0b12, 0x3a1410, 0x3a1410, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    this.cameras.main.fadeIn(400);

    for (let i = 0; i < 40; i++) this.spawnEmber(true);
    this.time.addEvent({ delay: 180, loop: true, callback: () => this.spawnEmber(false) });

    this.add.text(cx, 120, 'FIRE CREST', {
      fontFamily: FONT_TITLE, fontSize: '72px', color: '#ffb347', fontStyle: 'bold',
      stroke: '#3a1410', strokeThickness: 8,
    }).setOrigin(0.5);
    this.add.text(cx, 184, 'A Crista de Fogo', {
      fontFamily: FONT_TITLE, fontSize: '26px', color: COLORS.text, fontStyle: 'italic',
    }).setOrigin(0.5);
    this.add.text(cx, 226, 'Capítulo 1 — Brasas no Vale', {
      fontFamily: FONT_UI, fontSize: '16px', color: COLORS.textDim,
    }).setOrigin(0.5);

    // Atalho de desenvolvimento: ?stage=c1s4 abre a fase direto (roster novo, modo Casual).
    const params = urlParams();
    if (params.stage && CHAPTER_1.stageIds.includes(params.stage)) {
      const save: SaveData = { ...newCampaign('casual'), nextStageIndex: CHAPTER_1.stageIds.indexOf(params.stage) };
      this.time.delayedCall(50, () => this.scene.start('Battle', { save, seed: params.seed }));
      return;
    }

    const save = loadSave();
    const canContinue = !!save && save.nextStageIndex < CHAPTER_1.stageIds.length;
    const options: TextMenuOption[] = [];
    if (canContinue) options.push({ id: 'continue', label: `Continuar (Fase ${save!.nextStageIndex + 1} · ${save!.mode === 'classic' ? 'Clássico' : 'Casual'})` });
    options.push({ id: 'classic', label: 'Novo jogo — Clássico (permadeath)' });
    options.push({ id: 'casual', label: 'Novo jogo — Casual (caídos voltam)' });

    this.menu = new TextMenu(this, cx, 300, options, (id) => {
      if (id === 'continue' && save) this.startBattle(save);
      else this.startBattle(this.newGame(id as GameMode));
    });

    const help = this.add.text(cx, GAME_HEIGHT - 28,
      `↑/↓ e Enter, ou clique · M: som ${isMuted() ? 'desligado' : 'ligado'}`, {
        fontFamily: FONT_UI, fontSize: '13px', color: COLORS.textDim,
      }).setOrigin(0.5);
    this.input.keyboard?.on('keydown-M', () => help.setText(`↑/↓ e Enter, ou clique · M: som ${toggleMute() ? 'desligado' : 'ligado'}`));
  }

  private newGame(mode: GameMode): SaveData {
    clearSave();
    const save = newCampaign(mode);
    writeSave(save);
    return save;
  }

  private startBattle(save: SaveData): void {
    this.cameras.main.fadeOut(300);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
      this.scene.start('Battle', { save, seed: urlParams().seed });
    });
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
