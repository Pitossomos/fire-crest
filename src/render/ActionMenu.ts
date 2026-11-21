import Phaser from 'phaser';
import { COLORS, FONT_UI, MAP_AREA, fs, fsize } from './layout';
import { type MenuHit, type MenuRows, menuHitTest } from './menu-geometry';

export interface MenuOption {
  id: string;
  label: string;
  enabled?: boolean;
}

/** Altura da linha e largura (crescem junto com a fonte no toque). */
const itemH = () => fsize(34);
const menuWidth = () => fsize(172);
const PAD = 6;

/**
 * Menu vertical de ações (teclado: ↑/↓ + confirmar; mouse/toque: passar e
 * clicar). Não usa objetos interativos do Phaser: a cena repassa o ponteiro
 * em coordenadas de tela para `hitTest`/`hoverAt`, com a linha inteira como
 * área clicável — confiável mesmo com a câmera rolada.
 */
export class ActionMenu {
  private readonly scene: Phaser.Scene;
  private container?: Phaser.GameObjects.Container;
  private options: MenuOption[] = [];
  private index = 0;
  private itemH = 34;
  private items: Phaser.GameObjects.Text[] = [];
  private highlight?: Phaser.GameObjects.Rectangle;
  private onPick?: (id: string) => void;
  private rows?: MenuRows;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  get isOpen(): boolean {
    return this.container !== undefined;
  }

  /** Abre o menu perto de (x, y) em coordenadas de tela, sem sair da área do mapa. */
  open(x: number, y: number, options: MenuOption[], onPick: (id: string) => void): void {
    this.close();
    this.options = options;
    this.onPick = onPick;
    this.index = Math.max(0, options.findIndex((o) => o.enabled !== false));
    const ITEM_H = itemH();
    const WIDTH = menuWidth();
    this.itemH = ITEM_H;
    const h = options.length * ITEM_H + PAD * 2;
    const left = Phaser.Math.Clamp(x, MAP_AREA.x + 4, MAP_AREA.x + MAP_AREA.width - WIDTH - 4);
    const top = Phaser.Math.Clamp(y, MAP_AREA.y + 4, MAP_AREA.y + MAP_AREA.height - h - 4);
    this.rows = { x: left, y: top + PAD, width: WIDTH, rowHeight: ITEM_H, count: options.length, padding: PAD };

    const bg = this.scene.add.rectangle(0, 0, WIDTH, h, COLORS.panel, 0.97).setOrigin(0).setStrokeStyle(2, COLORS.panelBorder);
    this.highlight = this.scene.add.rectangle(4, PAD, WIDTH - 8, ITEM_H, 0x5c4630, 0.9).setOrigin(0);
    this.items = options.map((o, i) => this.scene.add.text(16, PAD + i * ITEM_H + ITEM_H / 2, o.label, {
      fontFamily: FONT_UI, fontSize: fs(16), color: o.enabled === false ? COLORS.textDim : COLORS.text,
    }).setOrigin(0, 0.5));
    this.container = this.scene.add.container(left, top, [bg, this.highlight, ...this.items]).setDepth(60).setScrollFactor(0, 0, true);
    this.select(this.index);
  }

  /** Onde está o ponto (tela): índice da linha, borda do menu ou fora. */
  hitTest(screenX: number, screenY: number): MenuHit {
    return this.rows ? menuHitTest(this.rows, screenX, screenY) : 'outside';
  }

  /** Destaca a linha sob o ponteiro. */
  hoverAt(screenX: number, screenY: number): void {
    const hit = this.hitTest(screenX, screenY);
    if (typeof hit === 'number') this.select(hit);
  }

  /** Clique/toque na linha: seleciona e confirma. Retorna se havia uma linha ali. */
  clickAt(screenX: number, screenY: number): MenuHit {
    const hit = this.hitTest(screenX, screenY);
    if (typeof hit === 'number' && this.options[hit]?.enabled !== false) {
      this.select(hit);
      this.confirm();
    }
    return hit;
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
    this.rows = undefined;
  }

  private select(i: number): void {
    if (this.options[i]?.enabled === false) return;
    this.index = i;
    this.highlight?.setY(PAD + i * this.itemH);
  }
}
