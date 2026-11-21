/**
 * Painel "Opções de tela" (DOM puro, sem Phaser): orientação automática ou
 * fixa, zoom do mapa e tela cheia. Abre pelo botão ⚙, pela tecla O ou pelo
 * título; + e − mudam o zoom. As ações chegam ao jogo pelos `handlers`.
 */
import type { ScreenPreference } from '../save/view-prefs';

export interface ViewOptionsState {
  screen: ScreenPreference;
  zoom: number;
  canZoomIn: boolean;
  canZoomOut: boolean;
}

export interface ViewOptionsHandlers {
  state(): ViewOptionsState;
  setScreen(pref: ScreenPreference): void;
  zoom(delta: 1 | -1): void;
}

export interface ViewOptionsHandle {
  open(): void;
  close(): void;
  isOpen(): boolean;
  refresh(): void;
}

const STYLE = `
#view-options-toggle { position: fixed; z-index: 20; width: 34px; height: 34px; padding: 0; border-radius: 8px;
  left: calc(6px + env(safe-area-inset-left)); top: calc(6px + env(safe-area-inset-top));
  border: 1px solid rgba(255, 179, 71, 0.6); background: rgba(27, 22, 34, 0.6); color: #f2e6d0;
  font: 18px/1 system-ui, sans-serif; touch-action: manipulation; -webkit-tap-highlight-color: transparent; }
#view-options { position: fixed; inset: 0; z-index: 30; display: none; align-items: center; justify-content: center;
  background: rgba(0, 0, 0, 0.5); font: 16px/1.3 system-ui, sans-serif; color: #f2e6d0; }
#view-options.open { display: flex; }
#view-options .box { background: #1b1622; border: 2px solid #5c4630; border-radius: 10px; padding: 16px 18px;
  min-width: 260px; max-width: calc(100vw - 32px); box-shadow: 0 8px 30px rgba(0, 0, 0, 0.6); }
#view-options h2 { margin: 0 0 12px; font: bold 20px Georgia, serif; color: #ffb347; }
#view-options .row { margin: 10px 0; }
#view-options .label { font-size: 13px; color: #a89c88; margin-bottom: 6px; }
#view-options .group { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }
#view-options button { min-height: 40px; min-width: 44px; padding: 6px 12px; border-radius: 8px; cursor: pointer;
  border: 1px solid #5c4630; background: #2a2230; color: #f2e6d0; font: inherit; touch-action: manipulation; }
#view-options button[aria-pressed="true"] { background: #ffb347; color: #1a1420; border-color: #ffb347; font-weight: bold; }
#view-options button:disabled { opacity: 0.4; cursor: default; }
#view-options .zoom-value { min-width: 64px; text-align: center; }
#view-options .close { width: 100%; margin-top: 8px; }
`;

const SCREEN_LABELS: [ScreenPreference, string][] = [['auto', 'Automática'], ['landscape', 'Paisagem'], ['portrait', 'Retrato']];
const ZOOM_LABEL: Record<number, string> = { 2: 'Pequeno', 3: 'Normal', 4: 'Grande' };

/** Pode alternar a tela cheia? (o iPhone não deixa páginas usarem a API). */
function fullscreenSupported(doc: Document): boolean {
  return !!doc.fullscreenEnabled && typeof doc.documentElement.requestFullscreen === 'function';
}

export function installViewOptions(handlers: ViewOptionsHandlers, win: Window = window): ViewOptionsHandle {
  const doc = win.document;
  const style = doc.createElement('style');
  style.textContent = STYLE;
  doc.head.appendChild(style);

  const toggle = doc.createElement('button');
  toggle.id = 'view-options-toggle';
  toggle.type = 'button';
  toggle.textContent = '⚙';
  toggle.title = 'Opções de tela (O)';
  toggle.setAttribute('aria-label', 'Opções de tela');

  const overlay = doc.createElement('div');
  overlay.id = 'view-options';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-label', 'Opções de tela');
  const box = doc.createElement('div');
  box.className = 'box';
  overlay.appendChild(box);

  const button = (label: string, onClick: () => void, attrs: Record<string, string> = {}) => {
    const b = doc.createElement('button');
    b.type = 'button';
    b.textContent = label;
    for (const [k, v] of Object.entries(attrs)) b.setAttribute(k, v);
    b.addEventListener('click', (ev) => {
      ev.stopPropagation();
      onClick();
      refresh();
    });
    return b;
  };
  const row = (label: string, ...children: HTMLElement[]) => {
    const r = doc.createElement('div');
    r.className = 'row';
    const l = doc.createElement('div');
    l.className = 'label';
    l.textContent = label;
    const g = doc.createElement('div');
    g.className = 'group';
    g.append(...children);
    r.append(l, g);
    return r;
  };

  const title = doc.createElement('h2');
  title.textContent = 'Opções de tela';
  const screenButtons = SCREEN_LABELS.map(([pref, label]) => button(label, () => handlers.setScreen(pref), { 'data-screen': pref }));
  const zoomOut = button('−', () => handlers.zoom(-1), { 'data-zoom': '-', 'aria-label': 'Diminuir zoom' });
  const zoomValue = doc.createElement('span');
  zoomValue.className = 'zoom-value';
  const zoomIn = button('+', () => handlers.zoom(1), { 'data-zoom': '+', 'aria-label': 'Aumentar zoom' });
  box.append(
    title,
    row('Tela (girar o celular troca sozinho no modo Automática)', ...screenButtons),
    row('Zoom do mapa (teclas + e −)', zoomOut, zoomValue, zoomIn),
  );
  let fullscreenButton: HTMLButtonElement | undefined;
  if (fullscreenSupported(doc)) {
    fullscreenButton = button('Tela cheia', () => {
      if (doc.fullscreenElement) void doc.exitFullscreen?.();
      else void doc.documentElement.requestFullscreen?.().catch(() => undefined);
    }, { 'data-fullscreen': '' });
    box.append(row('Esconde a barra do navegador', fullscreenButton));
  }
  box.append(button('Fechar', () => close(), { class: 'close', 'data-close': '' }));

  function refresh(): void {
    const st = handlers.state();
    for (const b of screenButtons) b.setAttribute('aria-pressed', String(b.dataset.screen === st.screen));
    zoomValue.textContent = ZOOM_LABEL[st.zoom] ?? String(st.zoom);
    zoomIn.disabled = !st.canZoomIn;
    zoomOut.disabled = !st.canZoomOut;
    if (fullscreenButton) fullscreenButton.textContent = doc.fullscreenElement ? 'Sair da tela cheia' : 'Tela cheia';
  }
  function open(): void {
    refresh();
    overlay.classList.add('open');
  }
  function close(): void {
    overlay.classList.remove('open');
  }
  const isOpen = () => overlay.classList.contains('open');

  toggle.addEventListener('click', (ev) => {
    ev.stopPropagation();
    if (isOpen()) close();
    else open();
  });
  overlay.addEventListener('click', (ev) => {
    if (ev.target === overlay) close();
  });
  // Ouvinte de captura: com o painel aberto, as teclas não chegam ao jogo.
  win.addEventListener('keydown', (ev) => {
    if (isOpen()) {
      if (ev.code === 'Escape' || ev.code === 'KeyO') close();
      ev.stopImmediatePropagation();
      return;
    }
    if (ev.code === 'KeyO') {
      open();
      ev.stopImmediatePropagation();
    } else if (['Equal', 'NumpadAdd'].includes(ev.code)) {
      handlers.zoom(1);
    } else if (['Minus', 'NumpadSubtract'].includes(ev.code)) {
      handlers.zoom(-1);
    }
  }, true);
  doc.addEventListener('fullscreenchange', refresh);

  doc.body.append(toggle, overlay);
  return { open, close, isOpen, refresh };
}
