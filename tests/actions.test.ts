import { describe, expect, it } from 'vitest';
import { BattleState } from '../src/core/battle-state';
import { HEAL_EXP } from '../src/core/leveling';
import { DB } from '../src/data';
import { makeStage } from './helpers';

function party() {
  const s = new BattleState(makeStage(['....'], [
    { characterId: 'lys', faction: 'player', x: 0, y: 0 },
    { characterId: 'hadric', faction: 'player', x: 1, y: 0 },
    { characterId: 'mira', faction: 'player', x: 3, y: 0 },
  ]), DB, { seed: 3 });
  return { s, lys: s.units[0], hadric: s.units[1], mira: s.units[2] };
}

describe('cura com cajado', () => {
  it('só aliados adjacentes e feridos', () => {
    const { s, lys, hadric, mira } = party();
    expect(s.healTargets(lys)).toEqual([]);
    hadric.hp = 10;
    mira.hp = 5;
    expect(s.healTargets(lys)).toEqual([hadric]);
  });

  it('cura cajado + MAG/2, limitado ao HP máximo, e dá EXP', () => {
    const { s, lys, hadric } = party();
    hadric.hp = 10;
    const out = s.healUnit(lys, hadric);
    // Cajado 10 + MAG 6/2 = 13
    expect(out.amount).toBe(13);
    expect(hadric.hp).toBe(23);
    expect(out.exp?.amount).toBe(HEAL_EXP);
    expect(lys.hasActed).toBe(true);
    hadric.hp = hadric.maxHp - 2;
    lys.hasActed = false;
    expect(s.healUnit(lys, hadric).amount).toBe(2);
  });

  it('quem não tem cajado não cura', () => {
    const { s, hadric, lys } = party();
    lys.hp = 1;
    expect(s.healTargets(hadric)).toEqual([]);
  });
});

describe('itens', () => {
  it('heróis começam com seus itens', () => {
    const { mira } = party();
    expect(mira.items.map((i) => [i.def.id, i.uses])).toEqual([['potion', 3]]);
  });

  it('poção cura 10, gasta um uso e some ao acabar', () => {
    const { s, mira } = party();
    mira.hp = 2;
    expect(s.useItem(mira, 0)).toBe(10);
    expect(mira.hp).toBe(12);
    expect(mira.items[0].uses).toBe(2);
    s.useItem(mira, 0);
    s.useItem(mira, 0);
    expect(mira.items).toEqual([]);
    expect(() => s.useItem(mira, 0)).toThrow();
  });
});
