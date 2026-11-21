import Phaser from 'phaser';
import type { Forecast, StrikeStats } from '../core/combat';
import type { Unit } from '../core/unit';
import { COLORS, FONT_UI, MAP_AREA, fs, fsize } from './layout';


/** Caixa de previsão de combate (atacante à esquerda, defensor à direita). */
export class ForecastPanel {
  private readonly scene: Phaser.Scene;
  private container?: Phaser.GameObjects.Container;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /** Mostra a previsão; fica no topo, ou embaixo se os combatentes estiverem na metade de cima da tela. */
  show(f: Forecast, unitsOnTop = false): void {
    this.hide();
    const W = Math.min(fsize(340), MAP_AREA.width - 16);
    const H = fsize(132);
    const top = MAP_AREA.y + (unitsOnTop ? MAP_AREA.height - H - 8 : 8);
    const left = MAP_AREA.x + (MAP_AREA.width - W) / 2;
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x24418a, 0.94).fillRect(0, 0, W / 2, H);
    bg.fillStyle(0x7a2420, 0.94).fillRect(W / 2, 0, W / 2, H);
    bg.lineStyle(2, COLORS.panelBorder, 1).strokeRect(0, 0, W, H);
    const parts: Phaser.GameObjects.GameObject[] = [bg];
    parts.push(...this.column(f.attacker, f.attackerStats, f.defender, 10, W / 2 - 14));
    parts.push(...this.column(f.defender, f.defenderStats, f.attacker, W / 2 + 10, W / 2 - 14));
    this.container = this.scene.add.container(left, top, parts).setDepth(70).setScrollFactor(0, 0, true);
  }

  hide(): void {
    this.container?.destroy();
    this.container = undefined;
  }

  private column(u: Unit, s: StrikeStats, foe: Unit, x: number, width: number): Phaser.GameObjects.Text[] {
    const style = { fontFamily: FONT_UI, fontSize: fs(13), color: COLORS.text, lineSpacing: 3 };
    const title = this.scene.add.text(x, 8, u.name, { ...style, fontSize: fs(14), color: COLORS.accent });
    for (let size = fsize(14); title.width > width && size > 9; size--) title.setFontSize(size);
    const can = s.strikes > 0;
    const killThreat = can && s.damage * s.strikes >= foe.hp ? ' ☠' : '';
    const lines = [
      `${u.weapon.name}`,
      `HP     ${u.hp}/${u.maxHp}`,
      `Dano   ${can ? s.damage : '—'}${s.strikes > 1 ? ' ×2' : ''}${killThreat}`,
      `Acerto ${can ? `${s.hit}%` : '—'}`,
      `Crit   ${can ? `${s.crit}%` : '—'}`,
    ];
    return [title, this.scene.add.text(x, 12 + fsize(18), lines.join('\n'), style)];
  }
}
