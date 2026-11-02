import { describe, expect, it } from 'vitest';
import { BattleState } from '../src/core/battle-state';
import { pointKey } from '../src/core/grid';
import { DB } from '../src/data';
import { makeStage } from './helpers';

const keys = (ps: { x: number; y: number }[]) => new Set(ps.map(pointKey));

describe('pathfinding', () => {
  it('lanceiro (mov 4) alcança 41 tiles em planície aberta', () => {
    const rows = Array(11).fill('.'.repeat(11));
    const s = new BattleState(makeStage(rows, [{ characterId: 'hadric', faction: 'player', x: 5, y: 5 }]), DB);
    // Losango de raio 4: 2·4·5 + 1 = 41
    expect(s.rangeFor(s.units[0]).move).toHaveLength(41);
  });

  it('floresta custa 2 e água bloqueia', () => {
    const s = new BattleState(makeStage(['.ff..', '~~~~~', '.....'], [
      { characterId: 'hadric', faction: 'player', x: 0, y: 0 },
    ]), DB);
    const move = keys(s.rangeFor(s.units[0]).move);
    expect(move.has('1,0')).toBe(true);  // custo 2
    expect(move.has('2,0')).toBe(true);  // custo 4
    expect(move.has('3,0')).toBe(false); // custo 5 > 4
    expect(move.has('0,2')).toBe(false); // rio no caminho
  });

  it('atravessa aliados mas não para em cima deles; inimigos bloqueiam', () => {
    const s = new BattleState(makeStage(['.....'], [
      { characterId: 'hadric', faction: 'player', x: 0, y: 0 },
      { characterId: 'mira', faction: 'player', x: 1, y: 0 },
    ]), DB);
    const move = keys(s.rangeFor(s.units[0]).move);
    expect(move.has('1,0')).toBe(false);
    expect(move.has('2,0')).toBe(true);

    const blocked = new BattleState(makeStage(['.....'], [
      { characterId: 'hadric', faction: 'player', x: 0, y: 0 },
      { classId: 'bandit', weaponId: 'iron_axe', faction: 'enemy', x: 1, y: 0 },
    ]), DB);
    const r = blocked.rangeFor(blocked.units[0]);
    expect(keys(r.move).has('2,0')).toBe(false);
    expect(keys(r.attack).has('1,0')).toBe(true);
  });

  it('arqueiro ataca apenas a distância 2', () => {
    const s = new BattleState(makeStage(['~~~~~', '~~.~~', '~~~~~'], [
      { characterId: 'wren', faction: 'player', x: 2, y: 1 },
    ]), DB);
    const attack = keys(s.rangeFor(s.units[0]).attack);
    expect(attack.has('2,0')).toBe(false); // distância 1
    expect(attack.has('0,1')).toBe(true);  // distância 2
    expect(attack.has('4,1')).toBe(true);
  });

  it('moveUnit retorna caminho e rejeita destino inválido', () => {
    const s = new BattleState(makeStage(['.....'], [{ characterId: 'hadric', faction: 'player', x: 0, y: 0 }]), DB);
    const u = s.units[0];
    expect(s.moveUnit(u, { x: 3, y: 0 })).toEqual([
      { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 },
    ]);
    s.undoMove(u, { x: 0, y: 0 });
    expect(() => s.moveUnit(u, { x: 9, y: 0 })).toThrow();
  });
});
