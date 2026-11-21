import Phaser from 'phaser';
import {
  currentChapter, devSaveForStage, isChapterDone, newCampaign, newCampaignAt, startNextChapter,
} from '../core/campaign';
import { DB } from '../data';
import type { GameMode, SaveData } from '../data/types';
import { COLORS, CONTENT, FONT_TITLE, FONT_UI, GAME_HEIGHT, GAME_WIDTH, fs } from '../render/layout';
import { openViewOptions } from '../render/screen';
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

  /** Troca de orientação: redesenha a tela no tamanho novo. */
  relayout(): void {
    this.scene.restart();
  }

  create(): void {
    const cx = CONTENT.x + CONTENT.width / 2;
    // O bloco foi desenhado para 540 de altura; em telas mais altas (retrato) fica centralizado.
    const dy = Math.max(0, Math.round((CONTENT.height - 560) / 2)) + CONTENT.y;
    const narrow = CONTENT.width < 700;
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x0d0b12, 0x0d0b12, 0x3a1410, 0x3a1410, 1);
    bg.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    this.cameras.main.fadeIn(400);

    for (let i = 0; i < 40; i++) this.spawnEmber(true);
    this.time.addEvent({ delay: 180, loop: true, callback: () => this.spawnEmber(false) });

    this.add.text(cx, dy + 120, 'FIRE CREST', {
      fontFamily: FONT_TITLE, fontSize: narrow ? '64px' : '72px', color: '#ffb347', fontStyle: 'bold',
      stroke: '#3a1410', strokeThickness: 8,
    }).setOrigin(0.5);
    this.add.text(cx, dy + 184, 'A Crista de Fogo', {
      fontFamily: FONT_TITLE, fontSize: '26px', color: COLORS.text, fontStyle: 'italic',
    }).setOrigin(0.5);
    this.add.text(cx, dy + 226, narrow
      ? 'Cap. 1 — Brasas no Vale\nCap. 2 — O Caminho dos Faróis'
      : 'Cap. 1 — Brasas no Vale · Cap. 2 — O Caminho dos Faróis', {
      fontFamily: FONT_UI, fontSize: fs(16), color: COLORS.textDim, align: 'center',
    }).setOrigin(0.5);

    // Atalho de desenvolvimento: ?stage=c1s4 abre a fase direto (roster novo, modo Casual).
    const params = urlParams();
    if (params.stage && DB.stages[params.stage]) {
      const save = devSaveForStage(params.stage, DB);
      this.time.delayedCall(50, () => this.scene.start('Battle', { save, seed: params.seed }));
      return;
    }

    // Save com o capítulo concluído segue direto para o próximo capítulo.
    const loaded = loadSave();
    const save = loaded && DB.chapters[loaded.chapterId]
      ? (isChapterDone(loaded, DB) ? startNextChapter(loaded, DB) : loaded)
      : undefined;
    const mode = (m: GameMode) => (m === 'classic' ? 'Clássico' : 'Casual');
    const options: TextMenuOption[] = [];
    if (save) {
      const ch = currentChapter(save, DB);
      options.push({ id: 'continue', label: `Continuar (Cap. ${ch.order}, Fase ${save.nextStageIndex + 1} · ${mode(save.mode)})` });
    }
    options.push({ id: 'classic', label: 'Novo jogo — Clássico (permadeath)' });
    options.push({ id: 'casual', label: 'Novo jogo — Casual (caídos voltam)' });
    options.push({ id: 'c2-classic', label: 'Capítulo 2 com time pronto — Clássico' });
    options.push({ id: 'c2-casual', label: 'Capítulo 2 com time pronto — Casual' });
    options.push({ id: 'view', label: 'Opções de tela' });

    this.menu = new TextMenu(this, cx, dy + (narrow ? 290 : 280), options, (id) => {
      if (id === 'view') {
        openViewOptions(this.game);
        this.menu?.rearm();
      } else if (id === 'continue' && save) {
        writeSave(save);
        this.startBattle(save);
      } else if (id.startsWith('c2-')) {
        this.startBattle(this.newGame(id.slice(3) as GameMode, 'c2'));
      } else {
        this.startBattle(this.newGame(id as GameMode));
      }
    }, narrow ? 44 : 38, { fontSize: narrow ? 17 : 20 });

    const help = this.add.text(cx, CONTENT.y + CONTENT.height - 28,
      `↑/↓ e Enter, ou clique · M: som ${isMuted() ? 'desligado' : 'ligado'}`, {
        fontFamily: FONT_UI, fontSize: fs(13), color: COLORS.textDim,
      }).setOrigin(0.5);
    this.input.keyboard?.on('keydown-M', () => help.setText(`↑/↓ e Enter, ou clique · M: som ${toggleMute() ? 'desligado' : 'ligado'}`));
  }

  private newGame(mode: GameMode, chapterId = 'c1'): SaveData {
    clearSave();
    const save = chapterId === 'c1' ? newCampaign(mode) : newCampaignAt(mode, chapterId, DB);
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
