import Phaser from 'phaser';
import { COLORS, FONT_UI } from './layout';
import { type MenuRows, menuHitTest } from './menu-geometry';
import { playSfx } from './sfx';

export interface TextMenuOption {
  id: string;
  label: string;
  enabled?: boolean;
}

export interface TextMenuStyle {
  /** 'center': x é o centro das linhas; 'left': x é a borda esquerda. */
  align?: 'center' | 'left';
  fontSize?: number;
  /** Largura da faixa clicável (padrão: texto mais largo + margem). */
  width?: number;
  /** Chamado quando outra opção fica destacada (teclado ou ponteiro). */
  onHover?: (id: string) => void;
  /** Esc/X/Backspace: voltar. Sem isso, essas teclas são ignoradas. */
  onCancel?: () => void;
}

/**
 * Lista vertical (título, resultado, gerenciar time): ↑/↓ + Enter/Z, ou
 * mouse/toque. A linha inteira é clicável (faixa larga em coordenadas de
 * tela), não só o texto.
 */
export class TextMenu {
  private readonly scene: Phaser.Scene;
  private readonly items: Phaser.GameObjects.Text[];
  private readonly options: TextMenuOption[];
  private readonly rows: MenuRows;
  private readonly style: TextMenuStyle;
  private index: number;
  private readonly onPick: (id: string) => void;
  private done = false;

  constructor(
    scene: Phaser.Scene, x: number, y: number, options: TextMenuOption[], onPick: (id: string) => void,
    spacing = 38, style: TextMenuStyle = {},
  ) {
    this.scene = scene;
    this.options = options;
    this.onPick = onPick;
    this.style = style;
    const align = style.align ?? 'center';
    this.index = Math.max(0, options.findIndex((o) => o.enabled !== false));
    this.items = options.map((o, i) => scene.add.text(x, y + i * spacing, `  ${o.label}`, {
      fontFamily: FONT_UI, fontSize: `${style.fontSize ?? 20}px`, color: o.enabled === false ? '#6b6070' : COLORS.text,
    }).setOrigin(align === 'center' ? 0.5 : 0, 0.5));
    const textWidth = Math.max(...this.items.map((t) => t.width), 120);
    const width = style.width ?? textWidth + 60;
    this.rows = {
      x: align === 'center' ? x - width / 2 : x - 10,
      y: y - spacing / 2,
      width,
      rowHeight: spacing,
      count: options.length,
    };
    scene.input.keyboard?.on('keydown', this.onKey, this);
    scene.input.on('pointermove', this.onPointerMove, this);
    scene.input.on('pointerdown', this.onPointerDown, this);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.detach());
    this.select(this.index, true);
  }

  /** Opção atualmente destacada (usada por testes). */
  get selectedId(): string {
    return this.options[this.index].id;
  }

  /** Remove os textos e os ouvintes (para trocar de menu na mesma cena). */
  destroy(): void {
    this.done = true;
    this.detach();
    for (const t of this.items) t.destroy();
  }

  private detach(): void {
    this.scene.input.keyboard?.off('keydown', this.onKey, this);
    this.scene.input.off('pointermove', this.onPointerMove, this);
    this.scene.input.off('pointerdown', this.onPointerDown, this);
  }

  private onKey(ev: KeyboardEvent): void {
    if (this.done) return;
    if (ev.code === 'ArrowUp' || ev.code === 'KeyW') this.move(-1);
    else if (ev.code === 'ArrowDown' || ev.code === 'KeyS') this.move(1);
    else if (['Enter', 'KeyZ', 'Space'].includes(ev.code)) this.confirm();
    else if (['Escape', 'KeyX', 'Backspace'].includes(ev.code) && this.style.onCancel) {
      this.done = true;
      playSfx(this.scene, 'cancel');
      this.style.onCancel();
    }
  }

  private onPointerMove(pointer: Phaser.Input.Pointer): void {
    if (this.done) return;
    const hit = menuHitTest(this.rows, pointer.x, pointer.y);
    if (typeof hit === 'number') this.select(hit);
  }

  private onPointerDown(pointer: Phaser.Input.Pointer): void {
    if (this.done) return;
    const hit = menuHitTest(this.rows, pointer.x, pointer.y);
    if (typeof hit !== 'number' || this.options[hit]?.enabled === false) return;
    this.select(hit, true);
    this.confirm();
  }

  private move(delta: number): void {
    const n = this.options.length;
    let i = this.index;
    for (let k = 0; k < n; k++) {
      i = (i + delta + n) % n;
      if (this.options[i].enabled !== false) break;
    }
    this.select(i);
  }

  private select(i: number, silent = false): void {
    if (this.options[i]?.enabled === false) return;
    const changed = i !== this.index;
    if (!silent && changed) playSfx(this.scene, 'cursor');
    this.index = i;
    this.items.forEach((t, k) => {
      const enabled = this.options[k].enabled !== false;
      t.setText(`${k === i ? '▶ ' : '  '}${this.options[k].label}`);
      t.setColor(!enabled ? '#6b6070' : k === i ? COLORS.accent : COLORS.text);
    });
    if (changed || silent) this.style.onHover?.(this.options[i].id);
  }

  private confirm(): void {
    if (this.done) return;
    this.done = true;
    playSfx(this.scene, 'select');
    this.onPick(this.options[this.index].id);
  }
}
