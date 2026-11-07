/**
 * Controles virtuais para celular: direcional (W/A/S/D), Confirmar (Enter) e
 * Voltar (Esc). Cada toque simula a tecla correspondente em `window`, então
 * todas as cenas (título, batalha, diálogos, menus, resultado) funcionam sem
 * mudanças. DOM puro, sem Phaser.
 */

/** Tecla simulada por um botão. */
export interface VirtualKey {
  code: string;
  key: string;
  keyCode: number;
}

export const VIRTUAL_KEYS = {
  up: { code: 'KeyW', key: 'w', keyCode: 87 },
  left: { code: 'KeyA', key: 'a', keyCode: 65 },
  down: { code: 'KeyS', key: 's', keyCode: 83 },
  right: { code: 'KeyD', key: 'd', keyCode: 68 },
  confirm: { code: 'Enter', key: 'Enter', keyCode: 13 },
  cancel: { code: 'Escape', key: 'Escape', keyCode: 27 },
} as const satisfies Record<string, VirtualKey>;

export type VirtualButton = keyof typeof VIRTUAL_KEYS;

/** Atraso até a primeira repetição e intervalo das seguintes, ao segurar o direcional. */
export const REPEAT_DELAY_MS = 280;
export const REPEAT_INTERVAL_MS = 110;

export interface TouchEnvironment {
  /** Parâmetros da URL (`?touch=1` força, `?touch=0` desliga). */
  search: string;
  /** `matchMedia('(pointer: coarse)').matches` */
  coarsePointer: boolean;
  /** `matchMedia('(hover: hover)').matches` */
  canHover: boolean;
  maxTouchPoints: number;
}

/** Mostrar os controles? Só em aparelhos de toque (ou se a URL forçar). */
export function shouldShowTouchControls(env: TouchEnvironment): boolean {
  const flag = new URLSearchParams(env.search).get('touch');
  if (flag === '1') return true;
  if (flag === '0') return false;
  return env.coarsePointer || (env.maxTouchPoints > 0 && !env.canHover);
}

/** Temporizadores injetáveis (para testar a repetição sem esperar). */
export interface Timers {
  setTimeout(fn: () => void, ms: number): unknown;
  setInterval(fn: () => void, ms: number): unknown;
  clearTimeout(id: unknown): void;
  clearInterval(id: unknown): void;
}

/**
 * Segurar um botão: dispara na hora e, se `repeat`, repete enquanto estiver
 * pressionado. `release()` para a repetição.
 */
export class HoldRepeater {
  private delayId: unknown;
  private intervalId: unknown;

  constructor(private readonly fire: () => void, private readonly timers: Timers, private readonly repeat: boolean) {}

  press(): void {
    this.release();
    this.fire();
    if (!this.repeat) return;
    this.delayId = this.timers.setTimeout(() => {
      this.intervalId = this.timers.setInterval(() => this.fire(), REPEAT_INTERVAL_MS);
    }, REPEAT_DELAY_MS);
  }

  release(): void {
    if (this.delayId !== undefined) this.timers.clearTimeout(this.delayId);
    if (this.intervalId !== undefined) this.timers.clearInterval(this.intervalId);
    this.delayId = undefined;
    this.intervalId = undefined;
  }
}

/** Cria um evento de teclado com `keyCode` (o construtor padrão ignora esse campo, que o Phaser usa). */
export function makeKeyEvent(type: 'keydown' | 'keyup', k: VirtualKey): KeyboardEvent {
  const ev = new KeyboardEvent(type, { code: k.code, key: k.key, bubbles: true, cancelable: true });
  Object.defineProperty(ev, 'keyCode', { get: () => k.keyCode });
  Object.defineProperty(ev, 'which', { get: () => k.keyCode });
  return ev;
}

const STYLE = `
#touch-controls { position: fixed; inset: 0; pointer-events: none; z-index: 10;
  -webkit-user-select: none; user-select: none; -webkit-touch-callout: none; }
#touch-controls button { position: absolute; pointer-events: auto; touch-action: none;
  -webkit-tap-highlight-color: transparent; border-radius: 50%; border: 2px solid rgba(255, 179, 71, 0.75);
  background: rgba(27, 22, 34, 0.55); color: #f2e6d0; font: bold 22px/1 system-ui, sans-serif;
  display: flex; align-items: center; justify-content: center; padding: 0; margin: 0; }
#touch-controls button.pressed { background: rgba(255, 179, 71, 0.55); color: #1a1420; transform: scale(0.94); }
#touch-controls .pad { position: absolute; width: 168px; height: 168px; pointer-events: none;
  left: calc(14px + env(safe-area-inset-left)); bottom: calc(14px + env(safe-area-inset-bottom)); }
#touch-controls .pad button { width: 56px; height: 56px; }
#touch-controls .up { left: 56px; top: 0; }
#touch-controls .down { left: 56px; bottom: 0; }
#touch-controls .left { left: 0; top: 56px; }
#touch-controls .right { right: 0; top: 56px; }
#touch-controls .confirm { width: 72px; height: 72px; font-size: 26px;
  right: calc(18px + env(safe-area-inset-right)); bottom: calc(30px + env(safe-area-inset-bottom)); }
#touch-controls .cancel { width: 52px; height: 52px; font-size: 20px;
  right: calc(104px + env(safe-area-inset-right)); bottom: calc(14px + env(safe-area-inset-bottom)); }
`;

const LAYOUT: { button: VirtualButton; label: string; title: string; inPad: boolean }[] = [
  { button: 'up', label: '▲', title: 'Cima (W)', inPad: true },
  { button: 'left', label: '◀', title: 'Esquerda (A)', inPad: true },
  { button: 'down', label: '▼', title: 'Baixo (S)', inPad: true },
  { button: 'right', label: '▶', title: 'Direita (D)', inPad: true },
  { button: 'confirm', label: '✓', title: 'Confirmar (Enter)', inPad: false },
  { button: 'cancel', label: '✕', title: 'Voltar (Esc)', inPad: false },
];

/** Instala os controles virtuais se o aparelho for de toque. Retorna se instalou. */
export function installTouchControls(win: Window = window): boolean {
  const env: TouchEnvironment = {
    search: win.location.search,
    coarsePointer: win.matchMedia?.('(pointer: coarse)').matches ?? false,
    canHover: win.matchMedia?.('(hover: hover)').matches ?? true,
    maxTouchPoints: win.navigator.maxTouchPoints ?? 0,
  };
  if (!shouldShowTouchControls(env)) return false;
  const doc = win.document;
  if (doc.getElementById('touch-controls')) return true;

  const style = doc.createElement('style');
  style.textContent = STYLE;
  doc.head.appendChild(style);

  const root = doc.createElement('div');
  root.id = 'touch-controls';
  const pad = doc.createElement('div');
  pad.className = 'pad';
  root.appendChild(pad);

  const timers: Timers = {
    setTimeout: (fn, ms) => win.setTimeout(fn, ms),
    setInterval: (fn, ms) => win.setInterval(fn, ms),
    clearTimeout: (id) => win.clearTimeout(id as number),
    clearInterval: (id) => win.clearInterval(id as number),
  };

  for (const item of LAYOUT) {
    const el = doc.createElement('button');
    el.type = 'button';
    el.className = item.button;
    el.dataset.key = item.button;
    el.textContent = item.label;
    el.title = item.title;
    el.setAttribute('aria-label', item.title);
    const key = VIRTUAL_KEYS[item.button];
    const repeater = new HoldRepeater(() => win.dispatchEvent(makeKeyEvent('keydown', key)), timers, item.inPad);
    const down = (ev: Event) => {
      ev.preventDefault();
      el.classList.add('pressed');
      repeater.press();
    };
    const up = (ev: Event) => {
      ev.preventDefault();
      if (!el.classList.contains('pressed')) return;
      el.classList.remove('pressed');
      repeater.release();
      win.dispatchEvent(makeKeyEvent('keyup', key));
    };
    el.addEventListener('pointerdown', down);
    el.addEventListener('pointerup', up);
    el.addEventListener('pointercancel', up);
    el.addEventListener('pointerleave', up);
    el.addEventListener('contextmenu', (ev) => ev.preventDefault());
    (item.inPad ? pad : root).appendChild(el);
  }
  doc.body.appendChild(root);
  return true;
}
