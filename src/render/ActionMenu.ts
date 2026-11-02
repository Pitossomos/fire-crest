import Phaser from 'phaser';
import { COLORS, FONT_UI, MAP_AREA } from './layout';

export interface MenuOption {
  id: string;
  label: string;
  enabled?: boolean;
}

const ITEM_H = 26;
const WIDTH = 140;

/** Menu vertical de ações (teclado: ↑/↓ + confirmar; mouse: passar e clicar). */
export class ActionMenu {
  private readonly scene: Phaser.Scene;
  private container?: Phaser.GameObjects.Container;
  private options: MenuOption[] = [];
  private index = 0;
  private items: Phaser.GameObjects.Text[] = [];
  private highlight?: Phaser.GameObjects.Rectangle;
  private onPick?: (id: string) => void;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  get isOpen(): boolean {
    return this.container !== undefined;
  }

  /** Abre o menu perto de (x, y), sem sair da área do mapa. */
  open(x: number, y: number, options: MenuOption[], onPick: (id: string) => void): void {
    this.close();
    this.options = options;
    this.onPick = onPick;
    this.index = Math.max(0, options.findIndex((o) => o.enabled !== false));
    const h = options.length * ITEM_H + 12;
    const left = Phaser.Math.Clamp(x, 4, MAP_AREA.width - WIDTH - 4);
    const top = Phaser.Math.Clamp(y, 4, MAP_AREA.height - h - 4);

    const bg = this.scene.add.rectangle(0, 0, WIDTH, h, COLORS.panel, 0.96).setOrigin(0).setStrokeStyle(2, COLORS.panelBorder);
    this.highlight = this.scene.add.rectangle(4, 6, WIDTH - 8, ITEM_H, 0x5c4630, 0.9).setOrigin(0);
    this.items = options.map((o, i) => {
      const t = this.scene.add.text(14, 6 + i * ITEM_H + 5, o.label, {
        fontFamily: FONT_UI, fontSize: '15px', color: o.enabled === false ? COLORS.textDim : COLORS.text,
      });
      t.setInteractive({ useHandCursor: true });
      t.on('pointerover', () => this.select(i));
      t.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
        if (pointer.leftButtonDown()) {
          this.select(i);
          this.confirm();
        }
      });
      return t;
    });
    this.container = this.scene.add.container(left, top, [bg, this.highlight, ...this.items]).setDepth(60);
    this.select(this.index);
  }

  moveSelection(delta: number): void {
    if (!this.isOpen) return;
    const n = this.options.length;
    let i = this.index;
    for (let step = 0; step < n; step++) {
      i = (i + delta + n) % n;
      if (this.options[i].enabled !== false) break;
    }
    this.select(i);
  }

  confirm(): void {
    const option = this.options[this.index];
    if (!option || option.enabled === false) return;
    const pick = this.onPick;
    this.close();
    pick?.(option.id);
  }

  close(): void {
    this.container?.destroy();
    this.container = undefined;
    this.items = [];
    this.onPick = undefined;
  }

  private select(i: number): void {
    if (this.options[i]?.enabled === false) return;
    this.index = i;
    this.highlight?.setY(6 + i * ITEM_H);
  }
}
