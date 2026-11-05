import Phaser from 'phaser';
import type { Forecast, StrikeStats } from '../core/combat';
import type { Unit } from '../core/unit';
import { COLORS, FONT_UI, MAP_AREA } from './layout';

const W = 340;
const H = 132;

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
    const top = unitsOnTop ? MAP_AREA.height - H - 8 : 8;
    const left = (MAP_AREA.width - W) / 2;
    const bg = this.scene.add.graphics();
    bg.fillStyle(0x24418a, 0.94).fillRect(0, 0, W / 2, H);
    bg.fillStyle(0x7a2420, 0.94).fillRect(W / 2, 0, W / 2, H);
    bg.lineStyle(2, COLORS.panelBorder, 1).strokeRect(0, 0, W, H);
    const parts: Phaser.GameObjects.GameObject[] = [bg];
    parts.push(...this.column(f.attacker, f.attackerStats, f.defender, 10));
    parts.push(...this.column(f.defender, f.defenderStats, f.attacker, W / 2 + 10));
    this.container = this.scene.add.container(left, top, parts).setDepth(70).setScrollFactor(0, 0, true);
  }

  hide(): void {
    this.container?.destroy();
    this.container = undefined;
  }

  private column(u: Unit, s: StrikeStats, foe: Unit, x: number): Phaser.GameObjects.Text[] {
    const style = { fontFamily: FONT_UI, fontSize: '13px', color: COLORS.text, lineSpacing: 3 };
    const title = this.scene.add.text(x, 8, u.name, { ...style, fontSize: '14px', color: COLORS.accent });
    const can = s.strikes > 0;
    const killThreat = can && s.damage * s.strikes >= foe.hp ? ' ☠' : '';
    const lines = [
      `${u.weapon.name}`,
      `HP     ${u.hp}/${u.maxHp}`,
      `Dano   ${can ? s.damage : '—'}${s.strikes > 1 ? ' ×2' : ''}${killThreat}`,
      `Acerto ${can ? `${s.hit}%` : '—'}`,
      `Crit   ${can ? `${s.crit}%` : '—'}`,
    ];
    return [title, this.scene.add.text(x, 30, lines.join('\n'), style)];
  }
}
