import Phaser from 'phaser';
import type { TerrainDef } from '../data/types';
import type { Unit } from '../core/unit';
import { BOTTOM_BAR, COLORS, FONT_UI, SIDE_PANEL } from './layout';

const PHASE_LABEL = { player: 'Fase do Jogador', enemy: 'Fase Inimiga', ally: 'Fase Aliada' } as const;
const FACTION_LABEL = { player: 'Aliado', enemy: 'Inimigo', ally: 'NPC aliado' } as const;
const STAT_LABELS: [keyof Unit['stats'], string][] = [
  ['str', 'FOR'], ['mag', 'MAG'], ['skl', 'HAB'], ['spd', 'VEL'],
  ['lck', 'SOR'], ['def', 'DEF'], ['res', 'RES'],
];

function text(scene: Phaser.Scene, x: number, y: number, size = 14, color: string = COLORS.text): Phaser.GameObjects.Text {
  return scene.add.text(x, y, '', { fontFamily: FONT_UI, fontSize: `${size}px`, color, lineSpacing: 4 }).setDepth(51);
}

/** Painel lateral (turno, objetivo, terreno, unidade) e barra de ajuda inferior. */
export class SidePanel {
  private readonly turnText: Phaser.GameObjects.Text;
  private readonly terrainText: Phaser.GameObjects.Text;
  private readonly unitTitle: Phaser.GameObjects.Text;
  private readonly unitText: Phaser.GameObjects.Text;
  private readonly hpBar: Phaser.GameObjects.Graphics;
  private readonly helpText: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, stageName: string, objective: string) {
    const { x, y, width, height } = SIDE_PANEL;
    const bg = scene.add.graphics().setDepth(50);
    bg.fillStyle(COLORS.panel, 1).fillRect(x, y, width, height);
    bg.lineStyle(2, COLORS.panelBorder, 1).strokeRect(x + 1, y + 1, width - 2, height - 2);
    bg.fillStyle(COLORS.panel, 1).fillRect(BOTTOM_BAR.x, BOTTOM_BAR.y, BOTTOM_BAR.width, BOTTOM_BAR.height);
    bg.lineStyle(2, COLORS.panelBorder, 1).strokeRect(BOTTOM_BAR.x + 1, BOTTOM_BAR.y + 1, BOTTOM_BAR.width - 2, BOTTOM_BAR.height - 2);
    bg.lineStyle(1, COLORS.panelBorder, 0.7);
    for (const ly of [96, 196]) bg.lineBetween(x + 12, ly, x + width - 12, ly);

    const px = x + 14;
    const title = text(scene, px, 12, 16, COLORS.accent).setText(stageName);
    // Nomes longos ("A Fortaleza de Cinzaforte") diminuem a fonte até caber no painel.
    for (let size = 16; title.width > width - 24 && size > 11; size--) title.setFontSize(size);
    this.turnText = text(scene, px, 36, 13);
    text(scene, px, 58, 12, COLORS.textDim).setText(`Objetivo: ${objective}`).setWordWrapWidth(width - 28);
    this.terrainText = text(scene, px, 106, 13);
    this.unitTitle = text(scene, px, 206, 15, COLORS.accent);
    this.unitText = text(scene, px, 254, 13);
    this.hpBar = scene.add.graphics().setDepth(51);
    this.helpText = text(scene, 14, BOTTOM_BAR.y + 10, 13, COLORS.textDim).setWordWrapWidth(BOTTOM_BAR.width - 28);
  }

  setTurn(turn: number, phase: keyof typeof PHASE_LABEL): void {
    this.turnText.setText(`Turno ${turn} — ${PHASE_LABEL[phase]}`);
  }

  setTerrain(t: TerrainDef): void {
    const cost = t.moveCost === null ? '—' : String(t.moveCost);
    const lines = [`Terreno: ${t.name}`, `DEF +${t.def}   EVA +${t.avoid}`, `Custo de mov.: ${cost}`];
    if (t.heal > 0) lines.push(`Cura ${t.heal}% por turno`);
    this.terrainText.setText(lines.join('\n'));
  }

  setUnit(u: Unit | undefined): void {
    this.hpBar.clear();
    if (!u) {
      this.unitTitle.setText('');
      this.unitText.setText('');
      return;
    }
    const header = u.name === u.classDef.name ? u.name : `${u.name}\n${u.classDef.name}`;
    this.unitTitle.setText(`${header}  Nv ${u.level}`);
    const stats = STAT_LABELS.map(([k, label]) => `${label} ${String(u.stats[k]).padStart(2)}`);
    const rows: string[] = [];
    for (let i = 0; i < stats.length; i += 2) rows.push(stats.slice(i, i + 2).join('   '));
    const w = u.weapon;
    const range = w.minRange === w.maxRange ? `${w.minRange}` : `${w.minRange}–${w.maxRange}`;
    this.unitText.setText([
      `HP ${u.hp}/${u.maxHp}`,
      '',
      ...rows,
      `MOV ${u.move}`,
      '',
      `${w.name}`,
      w.heal ? `Cura ${w.heal}  Alc ${range}` : `Pod ${w.might}  Pre ${w.hit}  Crit ${w.crit}`,
      w.heal ? '' : `Alcance ${range}`,
      '',
      `${FACTION_LABEL[u.faction]}${u.hasActed ? ' (já agiu)' : ''}`,
    ].join('\n'));
    const bx = SIDE_PANEL.x + 110;
    const by = 260;
    this.hpBar.fillStyle(COLORS.hpBack, 1).fillRect(bx, by, 110, 8);
    const color = u.faction === 'enemy' ? COLORS.hpEnemy : COLORS.hpPlayer;
    this.hpBar.fillStyle(color, 1).fillRect(bx, by, Math.round((110 * u.hp) / u.maxHp), 8);
  }

  setHelp(message: string): void {
    this.helpText.setText(message);
  }
}
