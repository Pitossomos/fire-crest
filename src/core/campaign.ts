import type { GameDatabase } from '../data';
import { lookup } from '../data';
import type { GameMode, RosterEntry, SaveData, StageDef } from '../data/types';
import type { BattleState } from './battle-state';
import { Unit } from './unit';
import { createUnit } from './unit-factory';

export const SAVE_VERSION = 1;

/** Novo save no início do capítulo 1. */
export function newCampaign(mode: GameMode, chapterId = 'c1'): SaveData {
  return { version: SAVE_VERSION, mode, chapterId, nextStageIndex: 0, roster: [] };
}

/**
 * Monta as unidades da fase aplicando o roster:
 * - heróis do roster entram com nível, EXP, atributos e itens salvos;
 * - heróis mortos (modo Clássico) ficam de fora;
 * - heróis fora do roster só entram na primeira fase ou se `joins: true`;
 * - inimigos e aliados NPC vêm direto da fase.
 */
export function buildStageUnits(stage: StageDef, save: SaveData, db: GameDatabase): Unit[] {
  const firstStage = save.roster.length === 0;
  const units: Unit[] = [];
  stage.units.forEach((p, i) => {
    if (p.faction !== 'player' || !p.characterId) {
      units.push(createUnit(p, db, i));
      return;
    }
    const entry = save.roster.find((r) => r.characterId === p.characterId);
    if (!entry) {
      if (firstStage || p.joins) units.push(createUnit(p, db, i));
      return;
    }
    if (!entry.alive) return;
    const base = createUnit(p, db, i);
    units.push(new Unit({
      id: base.id,
      name: base.name,
      faction: 'player',
      classDef: base.classDef,
      weapon: lookup(db.weapons, p.weaponId ?? entry.weaponId, 'Arma'),
      level: entry.level,
      exp: entry.exp,
      stats: entry.stats,
      growths: base.growths,
      position: base.position,
      characterId: entry.characterId,
      items: entry.items.map((slot) => ({ def: lookup(db.items, slot.itemId, 'Item'), uses: slot.uses })),
    }));
  });
  return units;
}

function toEntry(u: Unit, alive: boolean): RosterEntry {
  return {
    characterId: u.characterId!,
    level: u.level,
    exp: u.exp,
    stats: { ...u.stats },
    weaponId: u.weapon.id,
    items: u.items.map((i) => ({ itemId: i.def.id, uses: i.uses })),
    alive,
  };
}

/**
 * Atualiza o save após vencer a fase: grava o estado dos heróis (no Casual,
 * os caídos voltam), adiciona recrutas e NPCs de `recruitOnClear` vivos, e
 * avança para a próxima fase.
 */
export function applyVictory(save: SaveData, state: BattleState): SaveData {
  const roster = new Map(save.roster.map((r) => [r.characterId, r]));
  const recruitOnClear = new Set(state.stage.recruitOnClear ?? []);
  for (const u of state.units) {
    if (!u.characterId) continue;
    const isMember = u.faction === 'player';
    const clearRecruit = !isMember && recruitOnClear.has(u.characterId) && u.isAlive();
    if (!isMember && !clearRecruit) continue;
    roster.set(u.characterId, toEntry(u, u.isAlive() || save.mode === 'casual'));
  }
  return { ...save, roster: [...roster.values()], nextStageIndex: save.nextStageIndex + 1 };
}

/** Membros vivos do roster (para a tela de resultado). */
export function livingRoster(save: SaveData): RosterEntry[] {
  return save.roster.filter((r) => r.alive);
}
