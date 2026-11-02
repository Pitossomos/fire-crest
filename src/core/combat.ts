import type { TerrainDef, WeaponType } from '../data/types';
import type { BattleMap } from './battle-map';
import { type Point, manhattan } from './grid';
import type { Rng } from './rng';
import type { Unit } from './unit';

/** Ataca duas vezes quem tiver VEL ≥ VEL do alvo + este valor. */
export const DOUBLE_ATTACK_SPEED = 4;
/** Bônus do triângulo de armas para quem leva vantagem. */
export const TRIANGLE_HIT = 15;
export const TRIANGLE_DAMAGE = 1;
export const CRIT_MULTIPLIER = 3;

const BEATS: Partial<Record<WeaponType, WeaponType>> = { sword: 'axe', axe: 'lance', lance: 'sword' };

/** +1 se `a` vence `b` no triângulo, −1 se perde, 0 caso contrário. */
export function weaponTriangle(a: WeaponType, b: WeaponType): -1 | 0 | 1 {
  if (BEATS[a] === b) return 1;
  if (BEATS[b] === a) return -1;
  return 0;
}

/** A unidade pode atacar com a arma equipada (cajados não atacam)? */
export function canAttackWith(unit: Unit): boolean {
  return unit.weapon.type !== 'staff' && unit.weapon.might > 0;
}

/** O alvo está no alcance da arma a partir de `from`? */
export function inWeaponRange(unit: Unit, from: Point, target: Point): boolean {
  const d = manhattan(from, target);
  return d >= unit.weapon.minRange && d <= unit.weapon.maxRange;
}

/** Números de um lado do combate. */
export interface StrikeStats {
  damage: number;
  hit: number;
  crit: number;
  /** Quantos golpes (0 = não pode atacar/contra-atacar, 2 = ataque duplo). */
  strikes: number;
}

export interface Forecast {
  attacker: Unit;
  defender: Unit;
  attackerStats: StrikeStats;
  defenderStats: StrikeStats;
}

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** Dano, acerto e crítico de `a` contra `d`, com `d` sobre `dTerrain`. */
export function strikeStats(a: Unit, d: Unit, dTerrain: TerrainDef): Omit<StrikeStats, 'strikes'> {
  const tri = weaponTriangle(a.weapon.type, d.weapon.type);
  const w = a.weapon;
  const power = (w.magic ? a.stats.mag : a.stats.str) + w.might + tri * TRIANGLE_DAMAGE;
  const guard = (w.magic ? d.stats.res : d.stats.def) + dTerrain.def;
  const damage = Math.max(0, power - guard);
  const accuracy = w.hit + a.stats.skl * 2 + Math.floor(a.stats.lck / 2) + tri * TRIANGLE_HIT;
  const avoid = d.stats.spd * 2 + d.stats.lck + dTerrain.avoid;
  const hit = clamp(accuracy - avoid, 0, 100);
  const crit = clamp(w.crit + Math.floor(a.stats.skl / 2) - d.stats.lck, 0, 100);
  return { damage, hit, crit };
}

/**
 * Previsão de combate com o atacante em `from` (padrão: posição atual)
 * e o defensor na posição atual.
 */
export function forecast(map: BattleMap, attacker: Unit, defender: Unit, from: Point = attacker.position): Forecast {
  const aTerrain = map.terrainAt(from);
  const dTerrain = map.terrainAt(defender.position);
  const a = strikeStats(attacker, defender, dTerrain);
  const d = strikeStats(defender, attacker, aTerrain);
  const aCan = canAttackWith(attacker) && inWeaponRange(attacker, from, defender.position);
  const dCan = canAttackWith(defender) && inWeaponRange(defender, defender.position, from);
  const aDouble = attacker.stats.spd >= defender.stats.spd + DOUBLE_ATTACK_SPEED;
  const dDouble = defender.stats.spd >= attacker.stats.spd + DOUBLE_ATTACK_SPEED;
  return {
    attacker,
    defender,
    attackerStats: { ...a, strikes: aCan ? (aDouble ? 2 : 1) : 0 },
    defenderStats: { ...d, strikes: dCan ? (dDouble ? 2 : 1) : 0 },
  };
}

/** Um golpe resolvido. */
export interface Strike {
  attackerId: string;
  targetId: string;
  hit: boolean;
  crit: boolean;
  damage: number;
  targetHpAfter: number;
}

export interface CombatResult {
  strikes: Strike[];
  attackerDied: boolean;
  defenderDied: boolean;
}

/**
 * Resolve o combate e aplica o dano. Ordem: atacante, contra-ataque,
 * segundo golpe de quem dobra. Para assim que alguém cai.
 */
export function resolveCombat(map: BattleMap, attacker: Unit, defender: Unit, rng: Rng): CombatResult {
  const f = forecast(map, attacker, defender);
  const order: [Unit, Unit, StrikeStats][] = [];
  if (f.attackerStats.strikes > 0) order.push([attacker, defender, f.attackerStats]);
  if (f.defenderStats.strikes > 0) order.push([defender, attacker, f.defenderStats]);
  if (f.attackerStats.strikes > 1) order.push([attacker, defender, f.attackerStats]);
  if (f.defenderStats.strikes > 1) order.push([defender, attacker, f.defenderStats]);

  const strikes: Strike[] = [];
  for (const [a, d, s] of order) {
    if (!a.isAlive() || !d.isAlive()) break;
    const hit = rng.roll(s.hit);
    const crit = hit && rng.roll(s.crit);
    const damage = hit ? s.damage * (crit ? CRIT_MULTIPLIER : 1) : 0;
    d.takeDamage(damage);
    strikes.push({ attackerId: a.id, targetId: d.id, hit, crit, damage, targetHpAfter: d.hp });
  }
  return { strikes, attackerDied: !attacker.isAlive(), defenderDied: !defender.isAlive() };
}
