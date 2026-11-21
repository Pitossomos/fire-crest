import type Phaser from 'phaser';
import type { KeyValueStore } from '../save/save';
import { type ViewPrefs, loadViewPrefs, writeViewPrefs } from '../save/view-prefs';
import {
  GAME_HEIGHT, GAME_WIDTH, type Layout, SCALE, type ScreenPref, ZOOM_LEVELS,
  applyLayout, computeLayout, resolveMode, setZoom,
} from './layout';

/** Cena que sabe se redesenhar quando a resolução ou o zoom mudam. */
interface Relayoutable { relayout(): void }

const hasRelayout = (s: unknown): s is Relayoutable => typeof (s as Relayoutable)?.relayout === 'function';

/** Diferença mínima (px do jogo) para trocar o tamanho sem mudar de modo (ex.: barra do navegador). */
const SIZE_TOLERANCE = 60;

/**
 * Mantém a resolução do jogo de acordo com a orientação do aparelho e as
 * preferências (Automática / Paisagem / Retrato, zoom). Ao trocar, ajusta o
 * tamanho do canvas e pede às cenas ativas que se reorganizem.
 */
export class ScreenManager {
  private game?: Phaser.Game;
  private prefs: ViewPrefs;
  private layout!: Layout;
  private readonly listeners: (() => void)[] = [];
  private timer?: number;

  constructor(private readonly win: Window, private readonly touch: boolean, private readonly kv?: KeyValueStore) {
    this.prefs = loadViewPrefs(kv);
    setZoom(this.prefs.zoom);
    this.layout = this.compute();
    applyLayout(this.layout);
  }

  /** Liga ao jogo já criado (o primeiro layout é aplicado antes, no construtor). */
  attach(game: Phaser.Game): void {
    this.game = game;
    const onResize = () => {
      if (this.timer !== undefined) this.win.clearTimeout(this.timer);
      this.timer = this.win.setTimeout(() => this.update(false), 150);
    };
    this.win.addEventListener('resize', onResize);
    this.win.addEventListener('orientationchange', onResize);
    game.scale.on('resize', () => this.notify());
    game.registry.set('screenManager', this);
  }

  get current(): Layout {
    return this.layout;
  }

  get preferences(): ViewPrefs {
    return { ...this.prefs, zoom: SCALE };
  }

  /** Chamado depois de cada troca (e de cada redimensionamento da janela). */
  onChange(fn: () => void): void {
    this.listeners.push(fn);
  }

  setScreen(screen: ScreenPref): void {
    this.prefs = { ...this.prefs, screen };
    writeViewPrefs(this.prefs, this.kv);
    this.update(true);
  }

  /** Aumenta (+1) ou diminui (−1) o zoom do mapa. Retorna o zoom novo. */
  zoom(delta: 1 | -1): number {
    const i = ZOOM_LEVELS.indexOf(SCALE as (typeof ZOOM_LEVELS)[number]);
    const next = ZOOM_LEVELS[Math.min(ZOOM_LEVELS.length - 1, Math.max(0, i + delta))];
    if (next === SCALE) return SCALE;
    setZoom(next);
    this.prefs = { ...this.prefs, zoom: next };
    writeViewPrefs(this.prefs, this.kv);
    this.relayoutScenes();
    this.notify();
    return next;
  }

  private compute(): Layout {
    const vw = this.win.innerWidth || 960;
    const vh = this.win.innerHeight || 540;
    const mode = resolveMode(this.prefs.screen, { width: vw, height: vh });
    return computeLayout(mode, { touch: this.touch, aspect: vw / vh });
  }

  /** Recalcula; troca a resolução se o modo mudou (ou o tamanho mudou bastante). */
  update(force: boolean): void {
    const next = this.compute();
    const changed = force || next.mode !== this.layout.mode
      || Math.abs(next.width - this.layout.width) > SIZE_TOLERANCE
      || Math.abs(next.height - this.layout.height) > SIZE_TOLERANCE;
    if (changed && (next.width !== GAME_WIDTH || next.height !== GAME_HEIGHT || next.mode !== this.layout.mode || force)) {
      this.layout = next;
      applyLayout(next);
      this.game?.scale.setGameSize(next.width, next.height);
      this.relayoutScenes();
    }
    this.notify();
  }

  private relayoutScenes(): void {
    if (!this.game) return;
    for (const scene of this.game.scene.getScenes(true)) {
      if (hasRelayout(scene)) scene.relayout();
    }
  }

  private notify(): void {
    for (const fn of this.listeners) fn();
  }
}

/** Abre o painel "Opções de tela" (instalado pelo main.ts). */
export function openViewOptions(game: Phaser.Game): void {
  (game.registry.get('openViewOptions') as (() => void) | undefined)?.();
}
