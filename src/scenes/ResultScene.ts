import Phaser from 'phaser';
import { DB } from '../data';
import { CHAPTER_1 } from '../data/chapter1';
import type { SaveData } from '../data/types';
import { COLORS, FONT_TITLE, FONT_UI, GAME_HEIGHT, GAME_WIDTH } from '../render/layout';
import { TextMenu } from '../render/TextMenu';
import { playSfx } from '../render/sfx';

export interface ResultData {
  result: 'victory' | 'defeat';
  stageName: string;
  /** Save já atualizado (vitória) ou o save do início da fase (derrota). */
  save: SaveData;
}

/** Tela entre fases: resumo do time após a vitória, ou opções após a derrota. */
export class ResultScene extends Phaser.Scene {
  /** Menu atual (lido por testes de ponta a ponta). */
  menu?: TextMenu;

  constructor() {
    super('Result');
  }

  create(data: ResultData): void {
    this.cameras.main.fadeIn(300);
    const victory = data.result === 'victory';
    const chapterDone = victory && data.save.nextStageIndex >= CHAPTER_1.stageIds.length;
    const cx = GAME_WIDTH / 2;
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, victory ? 0x1d1410 : 0x120f18).setOrigin(0);
    playSfx(this, victory ? 'victory' : 'defeat');

    const title = chapterDone ? 'Fim do Capítulo 1' : victory ? 'Vitória!' : 'Derrota...';
    this.add.text(cx, 44, title, {
      fontFamily: FONT_TITLE, fontSize: '42px', color: victory ? '#ffb347' : '#c8a2a2', fontStyle: 'bold',
    }).setOrigin(0.5);
    this.add.text(cx, 88, chapterDone ? 'Brasas no Vale — o Farol de Brasalva voltou a arder.' : data.stageName, {
      fontFamily: FONT_UI, fontSize: '16px', color: COLORS.textDim,
    }).setOrigin(0.5);

    if (victory) this.drawRoster(data.save);
    else {
      this.add.text(cx, 200, 'Aren caiu, e a Crista se apagou.\nMas toda brasa pode ser reacesa.', {
        fontFamily: FONT_UI, fontSize: '18px', color: COLORS.text, align: 'center', lineSpacing: 10,
      }).setOrigin(0.5);
    }

    const next = DB.stages[CHAPTER_1.stageIds[data.save.nextStageIndex]];
    const options = chapterDone
      ? [{ id: 'title', label: 'Voltar ao título' }]
      : victory
        ? [{ id: 'next', label: `Próxima fase: ${next?.name ?? '—'}` }, { id: 'title', label: 'Salvar e voltar ao título' }]
        : [{ id: 'retry', label: 'Tentar de novo' }, { id: 'title', label: 'Voltar ao título' }];
    this.menu = new TextMenu(this, cx, GAME_HEIGHT - 96, options, (id) => {
      this.cameras.main.fadeOut(250);
      this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
        if (id === 'title') this.scene.start('Title');
        else this.scene.start('Battle', { save: data.save });
      });
    });
  }

  private drawRoster(save: SaveData): void {
    const cardW = 290;
    const cardH = 92;
    save.roster.forEach((r, i) => {
      const ch = DB.characters[r.characterId];
      const cls = DB.classes[ch.classId];
      const x = 30 + (i % 3) * (cardW + 15);
      const y = 120 + Math.floor(i / 3) * (cardH + 12);
      this.add.rectangle(x, y, cardW, cardH, COLORS.panel, 1).setOrigin(0).setStrokeStyle(2, r.alive ? COLORS.panelBorder : 0x4a2a2a);
      this.add.text(x + 12, y + 8, `${ch.name}`, { fontFamily: FONT_UI, fontSize: '15px', color: r.alive ? COLORS.accent : '#8a6a6a' });
      const s = r.stats;
      const lines = r.alive
        ? [`${cls.name}  Nv ${r.level}  EXP ${r.exp}`, `HP ${s.hp}  FOR ${s.str}  MAG ${s.mag}  HAB ${s.skl}`, `VEL ${s.spd}  SOR ${s.lck}  DEF ${s.def}  RES ${s.res}`]
        : ['Caiu em batalha.', 'Sua chama não será esquecida.'];
      this.add.text(x + 12, y + 30, lines.join('\n'), { fontFamily: FONT_UI, fontSize: '12px', color: COLORS.text, lineSpacing: 4 });
    });
  }
}
