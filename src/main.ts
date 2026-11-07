import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { TitleScene } from './scenes/TitleScene';
import { BattleScene } from './scenes/BattleScene';
import { DialogueScene } from './scenes/DialogueScene';
import { ResultScene } from './scenes/ResultScene';
import { COLORS, GAME_HEIGHT, GAME_WIDTH } from './render/layout';
import { installTouchControls } from './ui/touch-controls';

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: COLORS.background,
  pixelArt: true,
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [BootScene, TitleScene, BattleScene, DialogueScene, ResultScene],
});

// Botões virtuais (W/A/S/D, Enter, Esc) só em aparelhos de toque.
installTouchControls();

// Exposto em desenvolvimento para depuração e testes automatizados (Playwright).
if (import.meta.env.DEV) {
  (window as unknown as { __FIRE_CREST__: Phaser.Game }).__FIRE_CREST__ = game;
}
