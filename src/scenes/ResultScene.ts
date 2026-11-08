import Phaser from 'phaser';
import {
  canPromote, currentChapter, currentStageId, isChapterDone, rosterClassId, startNextChapter,
} from '../core/campaign';
import { DB } from '../data';
import type { SaveData } from '../data/types';
import { COLORS, FONT_TITLE, FONT_UI, GAME_HEIGHT, GAME_WIDTH } from '../render/layout';
import { TextMenu, type TextMenuOption } from '../render/TextMenu';
import { playSfx } from '../render/sfx';
import { writeSave } from '../save/save';
import type { PartyData, ResultData } from './scene-data';

export type { ResultData } from './scene-data';


/** Tela entre fases: resumo do time, promoções com Selos da Brasa e próxima fase/capítulo. */
export class ResultScene extends Phaser.Scene {
  /** Menu atual (lido por testes de ponta a ponta). */
  menu?: TextMenu;

  constructor() {
    super('Result');
  }

  create(data: ResultData): void {
    this.cameras.main.fadeIn(250);
    const save = data.save;
    const victory = data.result === 'victory';
    const chapter = currentChapter(save, DB);
    const chapterDone = victory && isChapterDone(save, DB);
    const cx = GAME_WIDTH / 2;
    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, victory ? 0x1d1410 : 0x120f18).setOrigin(0);
    if (!data.message && !data.fromParty) playSfx(this, victory ? 'victory' : 'defeat');

    const title = chapterDone ? `Fim do Capítulo ${chapter.order}` : victory ? 'Vitória!' : 'Derrota...';
    this.add.text(cx, 34, title, {
      fontFamily: FONT_TITLE, fontSize: '38px', color: victory ? '#ffb347' : '#c8a2a2', fontStyle: 'bold',
    }).setOrigin(0.5);
    const subtitle = chapterDone ? `${chapter.name} — mais um Farol voltou a arder.` : data.stageName;
    this.add.text(cx, 72, `${subtitle}${victory ? `   ·   Selos da Brasa: ${save.seals}` : ''}`, {
      fontFamily: FONT_UI, fontSize: '15px', color: COLORS.textDim,
    }).setOrigin(0.5);
    if (data.message) {
      this.add.text(cx, 96, data.message, { fontFamily: FONT_UI, fontSize: '15px', color: '#7CFC9A' }).setOrigin(0.5);
    }

    if (victory) {
      this.drawRoster(save);
    } else {
      this.add.text(cx, 200, 'Aren caiu, e a Crista se apagou.\nMas toda brasa pode ser reacesa.', {
        fontFamily: FONT_UI, fontSize: '18px', color: COLORS.text, align: 'center', lineSpacing: 10,
      }).setOrigin(0.5);
    }

    this.mainMenu(data, chapterDone);
  }

  private go(target: () => void): void {
    this.cameras.main.fadeOut(220);
    this.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, target);
  }

  private mainMenu(data: ResultData, chapterDone: boolean): void {
    const save = data.save;
    const victory = data.result === 'victory';
    const options: TextMenuOption[] = [];
    const nextChapter = chapterDone ? startNextChapter(save, DB) : undefined;
    if (victory && !chapterDone) {
      options.push({ id: 'next', label: `Próxima fase: ${DB.stages[currentStageId(save, DB)!]?.name ?? '—'}` });
    } else if (nextChapter) {
      options.push({ id: 'chapter', label: `Próximo capítulo: ${DB.chapters[nextChapter.chapterId].name}` });
    }
    if (!victory) options.push({ id: 'retry', label: 'Tentar de novo' });
    if (victory) {
      const ready = save.seals > 0 && save.roster.some((r) => canPromote(r, DB));
      options.push({ id: 'manage', label: `Gerenciar time (itens, armas${ready ? ', promover ✦' : ''})` });
    }
    options.push({ id: 'title', label: victory && !(chapterDone && !nextChapter) ? 'Salvar e voltar ao título' : 'Voltar ao título' });

    this.menu = new TextMenu(this, GAME_WIDTH / 2, GAME_HEIGHT - 22 - options.length * 32, options, (id) => {
      if (id === 'manage') {
        this.go(() => this.scene.start('Party', { save, result: { ...data, message: undefined } } satisfies PartyData));
        return;
      }
      if (id === 'chapter' && nextChapter) {
        writeSave(nextChapter);
        this.go(() => this.scene.start('Battle', { save: nextChapter }));
        return;
      }
      if (id === 'title') {
        this.go(() => this.scene.start('Title'));
        return;
      }
      this.go(() => this.scene.start('Battle', { save }));
    }, 32);
  }

  private drawRoster(save: SaveData): void {
    const cols = 4;
    const rows = Math.ceil(save.roster.length / cols);
    if (save.roster.some((r) => canPromote(r, DB))) {
      this.add.text(GAME_WIDTH - 16, 112 + rows * 78, 'Borda verde: pode ser promovido (nível 5+) · ★ classe avançada', {
        fontFamily: FONT_UI, fontSize: '11px', color: '#7CFC9A',
      }).setOrigin(1, 0);
    }
    const cardW = 222;
    const cardH = 70;
    save.roster.forEach((r, i) => {
      const ch = DB.characters[r.characterId];
      const cls = DB.classes[rosterClassId(r, DB)];
      const x = 16 + (i % cols) * (cardW + 10);
      const y = 112 + Math.floor(i / cols) * (cardH + 8);
      const ready = canPromote(r, DB);
      this.add.rectangle(x, y, cardW, cardH, COLORS.panel, 1).setOrigin(0)
        .setStrokeStyle(2, !r.alive ? 0x4a2a2a : ready ? 0x7cfc9a : COLORS.panelBorder);
      const star = (cls.tier ?? 1) > 1 ? ' ★' : '';
      this.add.text(x + 8, y + 6, `${ch.name}${star}`, { fontFamily: FONT_UI, fontSize: '13px', color: r.alive ? COLORS.accent : '#8a6a6a' });
      const s = r.stats;
      const lines = r.alive
        ? [`${cls.name}  Nv ${r.level}`, `HP ${s.hp} FOR ${s.str} MAG ${s.mag} HAB ${s.skl}`, `VEL ${s.spd} SOR ${s.lck} DEF ${s.def} RES ${s.res}`]
        : ['Caiu em batalha.', 'Sua chama não será esquecida.'];
      this.add.text(x + 8, y + 24, lines.join('\n'), { fontFamily: FONT_UI, fontSize: '11px', color: COLORS.text, lineSpacing: 3 });
    });
  }
}
