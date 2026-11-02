import type { Stats, UnitPlacement } from '../data/types';
import { type GameDatabase, lookup } from '../data';
import { Unit } from './unit';

/** Atributos de um genérico no nível N: base da classe + crescimento médio. */
export function genericStats(base: Stats, growths: Stats, level: number): Stats {
  const out = { ...base };
  for (const k of Object.keys(out) as (keyof Stats)[]) {
    out[k] = base[k] + Math.floor(((level - 1) * growths[k]) / 100);
  }
  return out;
}

/** Cria a unidade de batalha a partir da posição definida na fase. */
export function createUnit(p: UnitPlacement, db: GameDatabase, index: number): Unit {
  if (p.characterId) {
    const ch = lookup(db.characters, p.characterId, 'Personagem');
    const classDef = lookup(db.classes, ch.classId, 'Classe');
    return new Unit({
      id: `${ch.id}#${index}`,
      name: ch.name,
      faction: p.faction,
      classDef,
      weapon: lookup(db.weapons, p.weaponId ?? ch.weaponId, 'Arma'),
      level: p.level ?? ch.level,
      stats: ch.stats,
      growths: ch.growths,
      position: { x: p.x, y: p.y },
      characterId: ch.id,
      ai: p.ai,
      boss: p.boss,
    });
  }
  if (!p.classId) throw new Error(`Unidade ${index} sem characterId nem classId`);
  const classDef = lookup(db.classes, p.classId, 'Classe');
  const level = p.level ?? 1;
  const weaponId = p.weaponId;
  if (!weaponId) throw new Error(`Unidade genérica ${index} (${p.classId}) sem arma`);
  return new Unit({
    id: `${classDef.id}#${index}`,
    name: p.name ?? classDef.name,
    faction: p.faction,
    classDef,
    weapon: lookup(db.weapons, weaponId, 'Arma'),
    level,
    stats: genericStats(classDef.baseStats, classDef.growths, level),
    growths: classDef.growths,
    position: { x: p.x, y: p.y },
    ai: p.ai,
    boss: p.boss,
  });
}
