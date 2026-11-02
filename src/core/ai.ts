import type { BattleState } from './battle-state';
import { canAttackWith, forecast, inWeaponRange } from './combat';
import { areHostile } from './faction';
import { type Point, pointKey } from './grid';
import { distanceField } from './pathfinding';
import type { Unit } from './unit';

/** Decisão da IA para uma unidade neste turno. */
export interface AiPlan {
  unit: Unit;
  moveTo: Point;
  target?: Unit;
  score: number;
}

/** Pesos da pontuação de ataque. */
export const AI_WEIGHTS = {
  kill: 60,
  lord: 15,
  counter: 0.5,
  terrainDef: 2,
  terrainAvoid: 0.1,
} as const;

/** Pontua atacar `target` estando em `from`. Maior é melhor. */
export function scoreAttack(state: BattleState, unit: Unit, from: Point, target: Unit): number {
  const f = forecast(state.map, unit, target, from);
  const a = f.attackerStats;
  const d = f.defenderStats;
  const expected = (a.hit / 100) * a.damage * a.strikes;
  const lethal = a.damage * a.strikes >= target.hp ? AI_WEIGHTS.kill * (a.hit / 100) : 0;
  const lord = target.isLord ? AI_WEIGHTS.lord : 0;
  const counter = (d.hit / 100) * d.damage * d.strikes;
  const terrain = state.map.terrainAt(from);
  return expected + lethal + lord - AI_WEIGHTS.counter * counter
    + terrain.def * AI_WEIGHTS.terrainDef + terrain.avoid * AI_WEIGHTS.terrainAvoid;
}

/**
 * Escolhe o que a unidade faz:
 * - `stationary`: ataca sem se mover, se houver alvo no alcance;
 * - `guard`: só se move se puder atacar neste turno;
 * - `aggressive`: ataca o melhor alvo ou se aproxima do inimigo mais próximo.
 */
export function planAction(state: BattleState, unit: Unit): AiPlan {
  const stay: AiPlan = { unit, moveTo: unit.position, score: 0 };
  const range = state.rangeFor(unit);
  const destinations = unit.ai === 'stationary' ? [unit.position] : range.move;
  const hostiles = state.livingUnits.filter((t) => areHostile(unit.faction, t.faction));
  if (hostiles.length === 0) return stay;

  let best: AiPlan | undefined;
  if (canAttackWith(unit)) {
    for (const from of destinations) {
      for (const t of hostiles) {
        if (!inWeaponRange(unit, from, t.position)) continue;
        const cost = range.reach.get(pointKey(from))?.cost ?? 0;
        const score = scoreAttack(state, unit, from, t) - cost * 0.01; // empate: anda menos
        if (!best || score > best.score) best = { unit, moveTo: from, target: t, score };
      }
    }
  }
  if (best) return best;
  if (unit.ai !== 'aggressive') return stay;

  const field = distanceField(state.map, hostiles.map((h) => h.position));
  let moveTo = unit.position;
  let bestDist = field.get(pointKey(unit.position)) ?? Infinity;
  for (const p of destinations) {
    const d = field.get(pointKey(p)) ?? Infinity;
    const better = d < bestDist
      || (d === bestDist && state.map.terrainAt(p).def > state.map.terrainAt(moveTo).def);
    if (better) {
      bestDist = d;
      moveTo = p;
    }
  }
  return { unit, moveTo, score: 0 };
}

/** Ordem de ação: quem está mais perto de um inimigo age primeiro. */
export function actionOrder(state: BattleState, units: Unit[]): Unit[] {
  const hostilesOf = (u: Unit) => state.livingUnits.filter((t) => areHostile(u.faction, t.faction));
  const nearest = (u: Unit) => Math.min(...hostilesOf(u).map((h) => Math.abs(h.x - u.x) + Math.abs(h.y - u.y)), Infinity);
  return [...units].sort((a, b) => nearest(a) - nearest(b) || a.id.localeCompare(b.id));
}
