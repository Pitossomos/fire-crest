import Phaser from 'phaser';
import { DB } from '../data';
import { generateTextures } from '../render/textures';

/** Gera as texturas procedurais e segue para a tela de título. */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  create(): void {
    generateTextures(this, DB);
    this.scene.start('Title');
  }
}
