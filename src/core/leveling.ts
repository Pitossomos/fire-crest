import type { StatKey, Stats } from '../data/types';
import type { Rng } from './rng';
import type { Unit } from './unit';

export const EXP_PER_LEVEL = 100;
export const MAX_LEVEL = 10;
export const HEAL_EXP = 12;
export const BOSS_KILL_BONUS = 40;

const STAT_KEYS: StatKey[] = ['hp', 'str', 'mag', 'skl', 'spd', 'lck', 'def', 'res'];

/** EXP ganha por uma unidade após um combate. */
export function combatExp(unit: Unit, enemy: Unit, dealtDamage: boolean, killed: boolean): number {
  const diff = enemy.level - unit.level;
  if (killed) return Math.max(10, 30 + diff * 3) + (enemy.boss ? BOSS_KILL_BONUS : 0);
  if (dealtDamage) return Math.max(3, 10 + diff);
  return 1;
}

export interface LevelUp {
  level: number;
  gains: Stats;
}

/** Soma EXP, sobe de nível rolando as taxas de crescimento. Retorna os level-ups ocorridos. */
export function gainExp(unit: Unit, amount: number, rng: Rng): LevelUp[] {
  const ups: LevelUp[] = [];
  if (unit.level >= MAX_LEVEL) return ups;
  unit.exp += amount;
  while (unit.exp >= EXP_PER_LEVEL && unit.level < MAX_LEVEL) {
    unit.exp -= EXP_PER_LEVEL;
    unit.level++;
    const gains = Object.fromEntries(STAT_KEYS.map((k) => [k, 0])) as Stats;
    for (const k of STAT_KEYS) {
      if (rng.roll(unit.growths[k])) {
        gains[k] = 1;
        unit.stats[k]++;
      }
    }
    if (gains.hp) unit.hp++;
    ups.push({ level: unit.level, gains });
  }
  if (unit.level >= MAX_LEVEL) unit.exp = 0;
  return ups;
}
