import Phaser from 'phaser';
import type { TerrainDef } from '../data/types';
import { DB } from '../data';
import type { Unit } from '../core/unit';
import { BOTTOM_BAR, COLORS, FONT_UI, GAME_HEIGHT, GAME_WIDTH, MAP_AREA, SIDE_PANEL, fsize } from './layout';

const PHASE_LABEL = { player: 'Fase do Jogador', enemy: 'Fase Inimiga', ally: 'Fase Aliada' } as const;
const FACTION_LABEL = { player: 'Aliado', enemy: 'Inimigo', ally: 'NPC aliado' } as const;
const STAT_LABELS: [keyof Unit['stats'], string][] = [
  ['str', 'FOR'], ['mag', 'MAG'], ['skl', 'HAB'], ['spd', 'VEL'],
  ['lck', 'SOR'], ['def', 'DEF'], ['res', 'RES'],
];

function text(scene: Phaser.Scene, x: number, y: number, size = 14, color: string = COLORS.text): Phaser.GameObjects.Text {
  return scene.add.text(x, y, '', { fontFamily: FONT_UI, fontSize: `${fsize(size)}px`, color, lineSpacing: 4 }).setDepth(51).setScrollFactor(0);
}

/**
 * Painel da batalha (turno, objetivo, terreno, unidade) e barra de ajuda.
 * Na paisagem é uma coluna à direita; no retrato, uma faixa em duas colunas
 * embaixo do mapa. Também cobre as margens fora da área do mapa.
 */
export class SidePanel {
  private readonly turnText: Phaser.GameObjects.Text;
  private readonly terrainText: Phaser.GameObjects.Text;
  private readonly unitTitle: Phaser.GameObjects.Text;
  private readonly unitText: Phaser.GameObjects.Text;
  private readonly hpBar: Phaser.GameObjects.Graphics;
  private readonly helpText: Phaser.GameObjects.Text;
  private readonly hpBarAt: { x: number; width: number };
  private readonly colW: number;

  constructor(scene: Phaser.Scene, stageName: string, objective: string) {
    const { x, y, width, height } = SIDE_PANEL;
    const column = height >= width;
    const bg = scene.add.graphics().setDepth(50).setScrollFactor(0);
    // Margens fora da área do mapa (o mapa rola por baixo delas).
    bg.fillStyle(COLORS.background, 1);
    bg.fillRect(0, 0, GAME_WIDTH, MAP_AREA.y);
    bg.fillRect(0, MAP_AREA.y + MAP_AREA.height, GAME_WIDTH, GAME_HEIGHT - MAP_AREA.y - MAP_AREA.height);
    bg.fillRect(0, 0, MAP_AREA.x, GAME_HEIGHT);
    bg.fillRect(MAP_AREA.x + MAP_AREA.width, 0, GAME_WIDTH - MAP_AREA.x - MAP_AREA.width, GAME_HEIGHT);
    bg.fillStyle(COLORS.panel, 1).fillRect(x, y, width, height);
    bg.lineStyle(2, COLORS.panelBorder, 1).strokeRect(x + 1, y + 1, width - 2, height - 2);
    bg.fillStyle(COLORS.panel, 1).fillRect(BOTTOM_BAR.x, BOTTOM_BAR.y, BOTTOM_BAR.width, BOTTOM_BAR.height);
    bg.lineStyle(2, COLORS.panelBorder, 1).strokeRect(BOTTOM_BAR.x + 1, BOTTOM_BAR.y + 1, BOTTOM_BAR.width - 2, BOTTOM_BAR.height - 2);

    const lh = fsize(13) + 4;
    const colW = column ? width - 28 : width / 2 - 28;
    this.colW = colW;
    const px = x + 14;
    const title = text(scene, px, y + 12, 16, COLORS.accent).setText(stageName);
    // Nomes longos ("A Fortaleza de Cinzaforte") diminuem a fonte até caber no painel.
    for (let size = fsize(16); title.width > colW && size > 10; size--) title.setFontSize(size);
    const turnY = y + 12 + fsize(16) + 8;
    this.turnText = text(scene, px, turnY, 13);
    const objY = turnY + lh + 2;
    text(scene, px, objY, 12, COLORS.textDim).setText(`Objetivo: ${objective}`).setWordWrapWidth(colW);
    const div1 = objY + 3 * lh;
    const terrainY = div1 + 10;
    this.terrainText = text(scene, px, terrainY, 13).setWordWrapWidth(colW);

    bg.lineStyle(1, COLORS.panelBorder, 0.7);
    let ux: number;
    let uy: number;
    if (column) {
      const div2 = terrainY + 5 * lh;
      bg.lineBetween(x + 12, div1, x + width - 12, div1);
      bg.lineBetween(x + 12, div2, x + width - 12, div2);
      ux = px;
      uy = div2 + 10;
    } else {
      bg.lineBetween(x + 12, div1, x + width / 2 - 8, div1);
      bg.lineBetween(x + width / 2, y + 12, x + width / 2, y + height - 12);
      ux = x + width / 2 + 14;
      uy = y + 12;
    }
    this.unitTitle = text(scene, ux, uy, 15, COLORS.accent);
    this.unitText = text(scene, ux, uy + 2 * (fsize(15) + 4) + 4, 13).setWordWrapWidth(colW);
    this.hpBarAt = { x: ux + Math.round(colW * 0.45), width: Math.round(colW * 0.5) };
    this.hpBar = scene.add.graphics().setDepth(51).setScrollFactor(0);
    this.helpText = text(scene, BOTTOM_BAR.x + 14, BOTTOM_BAR.y + 8, 12, COLORS.textDim).setWordWrapWidth(BOTTOM_BAR.width - 28);
  }

  setTurn(turn: number, phase: keyof typeof PHASE_LABEL): void {
    this.turnText.setText(`Turno ${turn} — ${PHASE_LABEL[phase]}`).setFontSize(fsize(13));
    for (let size = fsize(13); this.turnText.width > this.colW && size > 9; size--) this.turnText.setFontSize(size);
  }

  setTerrain(t: TerrainDef): void {
    const cost = t.moveCost === null ? '—' : String(t.moveCost);
    const signed = (n: number) => (n >= 0 ? `+${n}` : `${n}`);
    const lines = [`Terreno: ${t.name}`, `DEF ${signed(t.def)}   EVA ${signed(t.avoid)}`, `Custo de mov.: ${cost}`];
    if (t.costs) {
      const c = (v: number | null | undefined) => (v === undefined ? cost : v === null ? '—' : String(v));
      lines.push(`Montados ${c(t.costs.mounted)} · Blind. ${c(t.costs.armored)}`);
    }
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
    stats.push(`MOV ${String(u.move).padStart(2)}`);
    const rows: string[] = [];
    for (let i = 0; i < stats.length; i += 3) rows.push(stats.slice(i, i + 3).join('  '));
    const w = u.weapon;
    const range = w.minRange === w.maxRange ? `${w.minRange}` : `${w.minRange}–${w.maxRange}`;
    this.unitText.setText([
      `HP ${u.hp}/${u.maxHp}`,
      ...rows,
      `${w.name}${u.armor ? ` · ${u.armor.name}` : ''}`,
      w.heal ? `Cura ${w.heal}  Alc ${range}` : `Pod ${w.might} Pre ${w.hit} Crit ${w.crit}`,
      w.heal ? '' : `Alcance ${range}`,
      ...(w.effective?.length ? [`Eficaz: ${w.effective.map((id) => DB.classes[id]?.name ?? id).join(', ')}`] : []),
      `${FACTION_LABEL[u.faction]}${u.hasActed ? ' (já agiu)' : ''}`,
    ].join('\n'));
    const by = this.unitText.y + fsize(13) / 2 - 3;
    const { x: bx, width: bw } = this.hpBarAt;
    this.hpBar.fillStyle(COLORS.hpBack, 1).fillRect(bx, by, bw, 8);
    const color = u.faction === 'enemy' ? COLORS.hpEnemy : COLORS.hpPlayer;
    this.hpBar.fillStyle(color, 1).fillRect(bx, by, Math.round((bw * u.hp) / u.maxHp), 8);
  }

  setHelp(message: string): void {
    this.helpText.setText(message);
  }
}
