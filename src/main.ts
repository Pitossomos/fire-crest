import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { TitleScene } from './scenes/TitleScene';
import { BattleScene } from './scenes/BattleScene';
import { DialogueScene } from './scenes/DialogueScene';
import { ResultScene } from './scenes/ResultScene';
import { PartyScene } from './scenes/PartyScene';
import { COLORS, GAME_HEIGHT, GAME_WIDTH, SCALE, TILE, VIEW, ZOOM_LEVELS } from './render/layout';
import { ScreenManager } from './render/screen';
import { detectTouch, installTouchControls, placeControls, positionTouchControls } from './ui/touch-controls';
import { installViewOptions } from './ui/view-options';

function storage(): Storage | undefined {
  try {
    return window.localStorage;
  } catch {
    return undefined;
  }
}

// O layout (paisagem, paisagem de toque ou retrato) é escolhido antes de criar o jogo.
const touch = detectTouch();
const screen = new ScreenManager(window, touch, storage());

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: COLORS.background,
  pixelArt: true,
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [BootScene, TitleScene, BattleScene, DialogueScene, ResultScene, PartyScene],
});
screen.attach(game);

// Botões virtuais (W/A/S/D, Enter, Esc) só em aparelhos de toque, encaixados
// nas faixas que o layout reserva (margens na paisagem; sobre o mapa no retrato).
if (installTouchControls()) {
  const place = () => {
    const zones = game.scene.isActive('Battle') ? VIEW.touchZones : VIEW.menuZones;
    const canvas = game.canvas;
    if (!zones || !canvas) return;
    const r = canvas.getBoundingClientRect();
    const sx = r.width / GAME_WIDTH;
    const sy = r.height / GAME_HEIGHT;
    const toScreen = (z: { x: number; y: number; width: number; height: number }) => ({
      left: r.left + z.x * sx, top: r.top + z.y * sy, width: z.width * sx, height: z.height * sy,
    });
    positionTouchControls(placeControls(toScreen(zones.pad), toScreen(zones.buttons), zones.stacked));
  };
  screen.onChange(() => requestAnimationFrame(place));
  game.events.once(Phaser.Core.Events.READY, () => {
    requestAnimationFrame(place);
    // A posição muda entre batalha (sobre o mapa) e menus (faixa no pé da tela).
    for (const s of game.scene.scenes) {
      s.events.on(Phaser.Scenes.Events.CREATE, () => requestAnimationFrame(place));
      s.events.on(Phaser.Scenes.Events.SHUTDOWN, () => requestAnimationFrame(place));
    }
  });
  window.addEventListener('resize', () => setTimeout(place, 50));
}

// Opções de tela: orientação, zoom do mapa e tela cheia.
const options = installViewOptions({
  state: () => ({
    screen: screen.preferences.screen,
    zoom: SCALE,
    canZoomIn: SCALE < ZOOM_LEVELS[ZOOM_LEVELS.length - 1],
    canZoomOut: SCALE > ZOOM_LEVELS[0],
  }),
  setScreen: (pref) => screen.setScreen(pref),
  zoom: (delta) => {
    screen.zoom(delta);
  },
});
game.registry.set('openViewOptions', () => options.open());

// Exposto em desenvolvimento para depuração e testes automatizados (Playwright).
if (import.meta.env.DEV) {
  (window as unknown as { __FIRE_CREST__: Phaser.Game }).__FIRE_CREST__ = game;
  (window as unknown as { __FIRE_CREST_LAYOUT__: unknown }).__FIRE_CREST_LAYOUT__ = {
    get tile() { return TILE; },
    get layout() { return screen.current; },
  };
}
