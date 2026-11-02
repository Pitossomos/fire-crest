import { describe, expect, it } from 'vitest';
import { actionOrder, planAction } from '../src/core/ai';
import { BattleState } from '../src/core/battle-state';
import { pointKey } from '../src/core/grid';
import { evaluate } from '../src/core/objectives';
import { distanceField } from '../src/core/pathfinding';
import { DB } from '../src/data';
import type { ObjectiveDef } from '../src/data/types';
import { makeStage } from './helpers';

const bandit = (x: number, y: number, ai: 'aggressive' | 'guard' | 'stationary' = 'aggressive') =>
  ({ classId: 'bandit', weaponId: 'iron_axe', faction: 'enemy' as const, x, y, ai });

describe('distanceField', () => {
  it('contorna o rio pela ponte', () => {
    const s = new BattleState(makeStage([
      '.....',
      '~~b~~',
      '.....',
    ], []), DB);
    const f = distanceField(s.map, [{ x: 0, y: 2 }]);
    // De (0,0) até (0,2): precisa passar pela ponte em (2,1) → 2 + 1 + 1 + 2 = 6
    expect(f.get(pointKey({ x: 0, y: 0 }))).toBe(6);
    expect(f.has(pointKey({ x: 0, y: 1 }))).toBe(false); // rio
  });
});

describe('IA', () => {
  it('prefere o alvo que consegue abater', () => {
    const s = new BattleState(makeStage(['.....'], [
      { characterId: 'hadric', faction: 'player', x: 0, y: 0 },
      { characterId: 'mira', faction: 'player', x: 4, y: 0 },
      bandit(2, 0),
    ]), DB);
    const [, mira] = s.units;
    mira.hp = 3;
    s.phase = 'enemy';
    const plan = planAction(s, s.units[2]);
    expect(plan.target).toBe(mira);
  });

  it('agressivo se aproxima quando não alcança ninguém', () => {
    const s = new BattleState(makeStage(['..............'], [
      { characterId: 'aren', faction: 'player', x: 0, y: 0 },
      bandit(13, 0),
    ]), DB);
    s.phase = 'enemy';
    const plan = planAction(s, s.units[1]);
    expect(plan.target).toBeUndefined();
    expect(plan.moveTo.x).toBe(8); // andou 5 tiles para a esquerda
  });

  it('guarda fica parado se ninguém está ao alcance', () => {
    const s = new BattleState(makeStage(['..............'], [
      { characterId: 'aren', faction: 'player', x: 0, y: 0 },
      bandit(13, 0, 'guard'),
    ]), DB);
    s.phase = 'enemy';
    const plan = planAction(s, s.units[1]);
    expect(plan.moveTo).toEqual({ x: 13, y: 0 });
    expect(plan.target).toBeUndefined();
  });

  it('guarda ataca quando o alvo entra no alcance', () => {
    const s = new BattleState(makeStage(['.......'], [
      { characterId: 'aren', faction: 'player', x: 0, y: 0 },
      bandit(5, 0, 'guard'),
    ]), DB);
    s.phase = 'enemy';
    const plan = planAction(s, s.units[1]);
    expect(plan.target?.characterId).toBe('aren');
    expect(plan.moveTo).toEqual({ x: 1, y: 0 });
  });

  it('estacionário ataca só de onde está', () => {
    const s = new BattleState(makeStage(['....'], [
      { characterId: 'aren', faction: 'player', x: 0, y: 0 },
      bandit(2, 0, 'stationary'),
    ]), DB);
    s.phase = 'enemy';
    expect(planAction(s, s.units[1]).target).toBeUndefined();
    s.units[0].moveTo({ x: 1, y: 0 });
    const plan = planAction(s, s.units[1]);
    expect(plan.moveTo).toEqual({ x: 2, y: 0 });
    expect(plan.target?.characterId).toBe('aren');
  });

  it('ordem de ação: mais perto primeiro', () => {
    const s = new BattleState(makeStage(['..........'], [
      { characterId: 'aren', faction: 'player', x: 0, y: 0 },
      bandit(9, 0),
      bandit(2, 0),
    ]), DB);
    expect(actionOrder(s, s.unitsOf('enemy')).map((u) => u.x)).toEqual([2, 9]);
  });
});

function stageWith(objective: ObjectiveDef) {
  const st = makeStage(['....'], [
    { characterId: 'aren', faction: 'player', x: 0, y: 0 },
    { characterId: 'grull', faction: 'enemy', x: 3, y: 0, boss: true },
  ]);
  st.objective = objective;
  return new BattleState(st, DB);
}

describe('objetivos', () => {
  it('rout: vence quando não há inimigos', () => {
    const s = stageWith({ kind: 'rout', description: '' });
    expect(evaluate(s)).toBe('ongoing');
    s.units[1].hp = 0;
    expect(evaluate(s)).toBe('victory');
  });

  it('boss: vence ao derrotar o alvo', () => {
    const s = stageWith({ kind: 'boss', description: '', targetId: 'grull' });
    s.units[1].hp = 0;
    expect(evaluate(s)).toBe('victory');
  });

  it('seize: só o lorde no ponto certo', () => {
    const s = stageWith({ kind: 'seize', description: '', x: 2, y: 0 });
    const aren = s.units[0];
    expect(s.canSeize(aren)).toBe(false);
    aren.moveTo({ x: 2, y: 0 });
    expect(s.canSeize(aren)).toBe(true);
    s.seize(aren);
    expect(evaluate(s)).toBe('victory');
  });

  it('survive: vence ao passar do turno limite', () => {
    const s = stageWith({ kind: 'survive', description: '', turns: 2 });
    s.endPhase(); s.endPhase(); // turno 2
    expect(evaluate(s)).toBe('ongoing');
    s.endPhase(); s.endPhase(); // turno 3
    expect(evaluate(s)).toBe('victory');
  });

  it('derrota se o lorde cair (mesmo com o objetivo cumprido)', () => {
    const s = stageWith({ kind: 'rout', description: '' });
    s.units[1].hp = 0;
    s.units[0].hp = 0;
    expect(evaluate(s)).toBe('defeat');
  });
});

describe('cura de terreno', () => {
  it('fortaleza cura 10% no início da fase da unidade', () => {
    const s = new BattleState(makeStage(['F.'], [
      { characterId: 'hadric', faction: 'player', x: 0, y: 0 },
      bandit(1, 0),
    ]), DB);
    const h = s.units[0];
    h.hp = 10;
    s.endPhase(); // inimigo
    expect(h.hp).toBe(10);
    s.endPhase(); // jogador, turno 2
    expect(h.hp).toBe(12); // 10% de 28 = 2
    expect(s.phaseHeals).toEqual([{ unit: h, amount: 2 }]);
  });
});
