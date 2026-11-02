import { planAction } from '../src/core/ai';
import { actionOrder } from '../src/core/ai';
import { BattleState } from '../src/core/battle-state';
import { forecast } from '../src/core/combat';
import { EventEngine } from '../src/core/events';
import { type Point, pointKey, samePoint } from '../src/core/grid';
import { evaluate } from '../src/core/objectives';
import { distanceField } from '../src/core/pathfinding';
import type { Unit } from '../src/core/unit';

/** Joga como o "jogador" de forma simples: lorde cauteloso, curandeira cura, poções quando fraco. */
function playerTurn(s: BattleState, ev: EventEngine, u: Unit): void {
  const range = s.rangeFor(u);
  const o = s.stage.objective;
  // Tomar o objetivo quando possível.
  if (u.isLord && o.kind === 'seize') {
    const goal = { x: o.x!, y: o.y! };
    if (range.move.some((p) => samePoint(p, goal))) {
      s.moveUnit(u, goal);
      s.seize(u);
      return;
    }
  }
  // Curandeira: vai até o aliado mais ferido e cura.
  if (u.weapon.type === 'staff') {
    const hurt = s.unitsOf(u.faction).filter((a) => a !== u && a.hp < a.maxHp).sort((a, b) => a.hp / a.maxHp - b.hp / b.maxHp)[0];
    if (hurt) {
      const spot = range.move.find((p) => Math.abs(p.x - hurt.x) + Math.abs(p.y - hurt.y) === 1);
      if (spot) {
        s.moveUnit(u, spot);
        ev.tileReached(u);
        if (s.healTargets(u).includes(hurt)) s.healUnit(u, hurt);
        return;
      }
    }
    approach(s, u, range.move, s.unitsOf(u.faction).filter((a) => a !== u).map((a) => a.position));
    return;
  }
  // Poção quando está fraco.
  if (u.hp < u.maxHp * 0.4 && u.items.length > 0) {
    s.useItem(u, 0);
    return;
  }
  const plan = planAction(s, u);
  if (u.isLord && plan.target) {
    const f = forecast(s.map, u, plan.target, plan.moveTo);
    const counter = f.defenderStats.damage * f.defenderStats.strikes;
    const kills = f.attackerStats.damage * f.attackerStats.strikes >= plan.target.hp;
    if (counter >= u.hp || (!kills && (counter > u.maxHp * 0.3 || u.hp < u.maxHp * 0.6))) return; // não arrisca o lorde
  }
  if (u.isLord && o.kind === 'seize' && !plan.target && !s.unitAt({ x: o.x!, y: o.y! })) {
    approach(s, u, range.move, [{ x: o.x!, y: o.y! }]);
    return;
  }
  if (u.isLord && !plan.target) return; // o lorde não avança sozinho
  if (!samePoint(plan.moveTo, u.position)) s.moveUnit(u, plan.moveTo);
  ev.tileReached(u);
  if (plan.target) {
    s.attack(u, plan.target);
    for (const x of [u, plan.target]) if (!x.isAlive()) ev.unitDefeated(x);
  }
}

function approach(s: BattleState, u: Unit, moves: Point[], goals: Point[]): void {
  const field = distanceField(s.map, goals);
  const best = [...moves].sort((a, b) => (field.get(pointKey(a)) ?? 99) - (field.get(pointKey(b)) ?? 99))[0];
  if (best && !samePoint(best, u.position)) s.moveUnit(u, best);
}

export type SimResult = { result: 'victory' | 'defeat' | 'timeout'; turn: number; state: BattleState };

/** Simula a fase inteira (IA dos dois lados). */
export function simulate(s: BattleState, maxTurns = 25): SimResult {
  const ev = new EventEngine(s);
  ev.turnStart();
  for (;;) {
    for (const u of actionOrder(s, s.unitsOf(s.phase))) {
      if (!u.isAlive() || !u.canAct()) continue;
      if (u.faction === 'player') {
        playerTurn(s, ev, u);
      } else {
        const plan = planAction(s, u);
        if (!samePoint(plan.moveTo, u.position)) s.moveUnit(u, plan.moveTo);
        if (plan.target) {
          s.attack(u, plan.target);
          for (const x of [u, plan.target]) if (!x.isAlive()) ev.unitDefeated(x);
        }
      }
      s.wait(u);
      const r = evaluate(s);
      if (r !== 'ongoing') return { result: r, turn: s.turn, state: s };
    }
    s.endPhase();
    if (s.phase === 'player') ev.turnStart();
    const r = evaluate(s);
    if (r !== 'ongoing') return { result: r, turn: s.turn, state: s };
    if (s.turn > maxTurns) return { result: 'timeout', turn: s.turn, state: s };
  }
}
