import Phaser from 'phaser';
import { DB } from '../data';
import { NARRATOR_ID } from '../data/characters';
import type { DialogueLine } from '../data/types';
import { COLORS, FONT_TITLE, FONT_UI, GAME_HEIGHT, GAME_WIDTH } from '../render/layout';
import { unitTextureKey } from '../render/textures';

interface DialogueData {
  lines: DialogueLine[];
  onDone: () => void;
}

const BOX = { x: 20, y: 384, w: GAME_WIDTH - 40, h: 140 };
const PORTRAIT = 152;
const CHARS_PER_SECOND = 55;

/**
 * Cena sobreposta de diálogo: retrato, nome, texto com efeito de máquina de
 * escrever. Z/Enter/Espaço/clique avança; Esc pula tudo.
 */
export class DialogueScene extends Phaser.Scene {
  private lines: DialogueLine[] = [];
  private index = 0;
  private onDone: () => void = () => {};
  private body!: Phaser.GameObjects.Text;
  private nameText!: Phaser.GameObjects.Text;
  private namePlate!: Phaser.GameObjects.Rectangle;
  private portrait!: Phaser.GameObjects.Image;
  private portraitFrame!: Phaser.GameObjects.Rectangle;
  private hint!: Phaser.GameObjects.Text;
  private typing?: Phaser.Time.TimerEvent;
  private fullText = '';
  private finished = false;

  constructor() {
    super('Dialogue');
  }

  create(data: DialogueData): void {
    this.lines = data.lines;
    this.onDone = data.onDone;
    this.index = 0;
    this.finished = false;

    this.add.rectangle(0, 0, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.35).setOrigin(0);
    this.portraitFrame = this.add.rectangle(0, BOX.y - PORTRAIT - 8, PORTRAIT, PORTRAIT, COLORS.panel, 0.95)
      .setOrigin(0).setStrokeStyle(3, COLORS.panelBorder);
    this.portrait = this.add.image(0, BOX.y - PORTRAIT / 2 - 8, '__DEFAULT').setScale(8);
    this.add.rectangle(BOX.x, BOX.y, BOX.w, BOX.h, COLORS.panel, 0.96).setOrigin(0).setStrokeStyle(3, COLORS.panelBorder);
    this.namePlate = this.add.rectangle(0, BOX.y - 18, 220, 30, 0x5c4630, 1).setOrigin(0, 0).setStrokeStyle(2, 0xffb347);
    this.nameText = this.add.text(0, BOX.y - 13, '', { fontFamily: FONT_TITLE, fontSize: '18px', color: COLORS.accent, fontStyle: 'bold' });
    this.body = this.add.text(BOX.x + 22, BOX.y + 24, '', {
      fontFamily: FONT_UI, fontSize: '18px', color: COLORS.text, lineSpacing: 8,
      wordWrap: { width: BOX.w - 44 },
    });
    this.hint = this.add.text(BOX.x + BOX.w - 16, BOX.y + BOX.h - 10, '▼  Z/Enter/clique · Esc pula', {
      fontFamily: FONT_UI, fontSize: '12px', color: COLORS.textDim,
    }).setOrigin(1, 1);

    this.input.keyboard?.on('keydown', (ev: KeyboardEvent) => {
      if (['Enter', 'KeyZ', 'Space'].includes(ev.code)) this.advance();
      else if (ev.code === 'Escape') this.finish();
    });
    this.input.on('pointerdown', () => this.advance());
    this.showLine();
  }

  private showLine(): void {
    const line = this.lines[this.index];
    if (!line) {
      this.finish();
      return;
    }
    const narrator = line.speakerId === NARRATOR_ID;
    const ch = DB.characters[line.speakerId];
    const left = line.side === 'left';

    this.portrait.setVisible(!narrator && !!ch);
    this.portraitFrame.setVisible(!narrator && !!ch);
    this.namePlate.setVisible(!narrator);
    this.nameText.setVisible(!narrator);
    if (!narrator && ch) {
      const cls = DB.classes[ch.classId];
      const weapon = DB.weapons[ch.weaponId];
      const px = left ? BOX.x + 16 : BOX.x + BOX.w - PORTRAIT - 16;
      this.portraitFrame.setX(px);
      this.portrait.setTexture(unitTextureKey(cls.sprite, weapon.type, ch.villain ? 'enemy' : 'player'));
      this.portrait.setPosition(px + PORTRAIT / 2, BOX.y - PORTRAIT / 2 - 8).setFlipX(!left);
      const nx = left ? BOX.x + 16 : BOX.x + BOX.w - 236;
      this.namePlate.setX(nx);
      this.nameText.setX(nx + 12).setText(ch.name);
    } else if (!narrator) {
      this.nameText.setText(line.speakerId);
    }
    this.body.setFontStyle(narrator ? 'italic' : 'normal').setColor(narrator ? '#e6d3a8' : COLORS.text);

    this.fullText = line.text;
    this.body.setText('');
    this.hint.setVisible(false);
    this.typing?.remove();
    let shown = 0;
    this.typing = this.time.addEvent({
      delay: 1000 / CHARS_PER_SECOND,
      repeat: this.fullText.length - 1,
      callback: () => {
        shown++;
        this.body.setText(this.fullText.slice(0, shown));
        if (shown >= this.fullText.length) this.hint.setVisible(true);
      },
    });
  }

  private advance(): void {
    if (this.finished) return;
    if (this.body.text.length < this.fullText.length) {
      this.typing?.remove();
      this.body.setText(this.fullText);
      this.hint.setVisible(true);
      return;
    }
    this.index++;
    this.showLine();
  }

  private finish(): void {
    if (this.finished) return;
    this.finished = true;
    this.typing?.remove();
    const done = this.onDone;
    this.scene.stop();
    done();
  }
}

/** Mostra um diálogo por cima da cena atual e resolve quando terminar. */
export function runDialogue(scene: Phaser.Scene, lines: DialogueLine[]): Promise<void> {
  if (lines.length === 0) return Promise.resolve();
  return new Promise((resolve) => {
    scene.scene.launch('Dialogue', { lines, onDone: resolve } satisfies DialogueData);
    scene.scene.bringToTop('Dialogue');
  });
}
