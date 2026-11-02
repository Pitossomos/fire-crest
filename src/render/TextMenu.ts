import Phaser from 'phaser';
import { COLORS, FONT_UI } from './layout';
import { playSfx } from './sfx';

export interface TextMenuOption {
  id: string;
  label: string;
  enabled?: boolean;
}

/** Lista vertical centralizada (título/resultado): ↑/↓ + Enter/Z, ou mouse. */
export class TextMenu {
  private readonly scene: Phaser.Scene;
  private readonly items: Phaser.GameObjects.Text[];
  private readonly options: TextMenuOption[];
  private index: number;
  private readonly onPick: (id: string) => void;
  private done = false;

  constructor(scene: Phaser.Scene, x: number, y: number, options: TextMenuOption[], onPick: (id: string) => void, spacing = 38) {
    this.scene = scene;
    this.options = options;
    this.onPick = onPick;
    this.index = Math.max(0, options.findIndex((o) => o.enabled !== false));
    this.items = options.map((o, i) => {
      const t = scene.add.text(x, y + i * spacing, o.label, {
        fontFamily: FONT_UI, fontSize: '20px', color: o.enabled === false ? '#6b6070' : COLORS.text,
      }).setOrigin(0.5);
      if (o.enabled !== false) {
        t.setInteractive({ useHandCursor: true });
        t.on('pointerover', () => this.select(i));
        t.on('pointerdown', () => { this.select(i); this.confirm(); });
      }
      return t;
    });
    scene.input.keyboard?.on('keydown', this.onKey, this);
    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => scene.input.keyboard?.off('keydown', this.onKey, this));
    this.select(this.index, true);
  }

  /** Opção atualmente destacada (usada por testes). */
  get selectedId(): string {
    return this.options[this.index].id;
  }

  private onKey(ev: KeyboardEvent): void {
    if (this.done) return;
    if (ev.code === 'ArrowUp' || ev.code === 'KeyW') this.move(-1);
    else if (ev.code === 'ArrowDown' || ev.code === 'KeyS') this.move(1);
    else if (['Enter', 'KeyZ', 'Space'].includes(ev.code)) this.confirm();
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
    if (!silent && i !== this.index) playSfx(this.scene, 'cursor');
    this.index = i;
    this.items.forEach((t, k) => {
      const enabled = this.options[k].enabled !== false;
      t.setText(`${k === i ? '▶ ' : '  '}${this.options[k].label}`);
      t.setColor(!enabled ? '#6b6070' : k === i ? COLORS.accent : COLORS.text);
    });
  }

  private confirm(): void {
    if (this.done) return;
    this.done = true;
    playSfx(this.scene, 'select');
    this.onPick(this.options[this.index].id);
  }
}
