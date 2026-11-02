import { describe, expect, it } from 'vitest';
import { BattleState } from '../src/core/battle-state';
import { genericStats } from '../src/core/unit-factory';
import { DB } from '../src/data';
import { STAGE_1 } from '../src/data/chapter1/stage1';
import { makeStage } from './helpers';

describe('BattleState', () => {
  it('carrega a Fase 1 com 3 heróis e 5 inimigos', () => {
    const s = new BattleState(STAGE_1, DB);
    expect(s.map.width).toBe(15);
    expect(s.map.height).toBe(10);
    expect(s.unitsOf('player')).toHaveLength(3);
    expect(s.unitsOf('enemy')).toHaveLength(5);
    expect(s.unitsOf('player').some((u) => u.isLord)).toBe(true);
  });

  it('ciclo de fases: jogador → inimigo → jogador (turno 2), pulando aliados ausentes', () => {
    const s = new BattleState(STAGE_1, DB);
    for (const u of s.unitsOf('player')) s.wait(u);
    expect(s.phaseExhausted()).toBe(true);
    expect(s.endPhase()).toBe('enemy');
    expect(s.turn).toBe(1);
    expect(s.endPhase()).toBe('player');
    expect(s.turn).toBe(2);
    expect(s.unitsOf('player').every((u) => u.canAct())).toBe(true);
  });

  it('impede mover fora da própria fase ou duas vezes', () => {
    const s = new BattleState(makeStage(['.....'], [
      { characterId: 'aren', faction: 'player', x: 0, y: 0 },
      { classId: 'bandit', weaponId: 'iron_axe', faction: 'enemy', x: 4, y: 0 },
    ]), DB);
    expect(() => s.moveUnit(s.units[1], { x: 3, y: 0 })).toThrow();
    s.moveUnit(s.units[0], { x: 1, y: 0 });
    s.wait(s.units[0]);
    expect(() => s.moveUnit(s.units[0], { x: 2, y: 0 })).toThrow();
  });

  it('genéricos crescem pela média das taxas', () => {
    const c = DB.classes.bandit;
    expect(genericStats(c.baseStats, c.growths, 1)).toEqual(c.baseStats);
    expect(genericStats(c.baseStats, c.growths, 3).hp).toBe(c.baseStats.hp + 1); // 2·80% = 1.6 → 1
  });

  it('rejeita mapa com linhas de tamanhos diferentes ou terreno desconhecido', () => {
    expect(() => new BattleState(makeStage(['...', '..'], []), DB)).toThrow();
    expect(() => new BattleState(makeStage(['.?.'], []), DB)).toThrow();
  });
});
