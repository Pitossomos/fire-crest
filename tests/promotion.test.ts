import { describe, expect, it } from 'vitest';
import { BattleState } from '../src/core/battle-state';
import {
  PROMOTION_LEVEL, buildStageUnits, canPromote, newCampaign, premadeEntry, promote,
} from '../src/core/campaign';
import { combatExp } from '../src/core/leveling';
import { pointKey } from '../src/core/grid';
import { DB } from '../src/data';
import { STAGE_3 } from '../src/data/chapter1/stage3';
import type { SaveData } from '../src/data/types';
import { SAVE_KEY, loadSave } from '../src/save/save';
import { makeStage } from './helpers';

function saveWith(level: number, seals = 1): SaveData {
  return {
    ...newCampaign('classic'),
    nextStageIndex: 2,
    seals,
    roster: ['aren', 'mira', 'hadric', 'kaira'].map((id) => premadeEntry(id, level, DB)),
  };
}

describe('time pré-montado', () => {
  it('projeta atributos pelo crescimento médio e respeita o nível inicial do herói', () => {
    const aren = premadeEntry('aren', 6, DB);
    const ch = DB.characters.aren;
    expect(aren.level).toBe(6);
    expect(aren.stats.hp).toBe(ch.stats.hp + Math.floor((5 * ch.growths.hp) / 100));
    expect(premadeEntry('hadric', 2, DB).level).toBe(ch.level === 1 ? 5 : DB.characters.hadric.level);
  });
});

describe('promoção', () => {
  it(`exige nível ${PROMOTION_LEVEL}, selo e classe com promoção`, () => {
    expect(canPromote(premadeEntry('aren', PROMOTION_LEVEL - 1, DB), DB)).toBe(false);
    expect(canPromote(premadeEntry('aren', PROMOTION_LEVEL, DB), DB)).toBe(true);
    expect(() => promote(saveWith(PROMOTION_LEVEL, 0), 'aren', DB)).toThrow();
  });

  it('troca a classe, soma o bônus, volta ao nível 1 e gasta o selo', () => {
    const save = saveWith(6, 2);
    const before = save.roster.find((r) => r.characterId === 'aren')!;
    const after = promote(save, 'aren', DB);
    const aren = after.roster.find((r) => r.characterId === 'aren')!;
    expect(aren.classId).toBe('sunlord');
    expect(aren.level).toBe(1);
    expect(aren.stats.str).toBe(before.stats.str + DB.classes.sunlord.promotionBonus!.str);
    expect(after.seals).toBe(1);
    expect(canPromote(aren, DB)).toBe(false); // já é tier 2
  });

  it('a unidade promovida entra na fase com a classe nova (mov e lorde mantidos)', () => {
    const save = promote(saveWith(6), 'aren', DB);
    const aren = buildStageUnits(STAGE_3, save, DB).find((u) => u.characterId === 'aren')!;
    expect(aren.classDef.id).toBe('sunlord');
    expect(aren.move).toBe(6);
    expect(aren.isLord).toBe(true);
  });

  it('todo herói tem promoção e toda classe promovida aceita a arma original', () => {
    for (const ch of Object.values(DB.characters).filter((c) => !c.villain && DB.classes[c.classId].tier !== 2)) {
      const cls = DB.classes[ch.classId];
      if (['bandit', 'hollow', 'dusk_monk', 'inquisitor'].includes(cls.id)) continue;
      expect(cls.promotesTo, ch.id).toBeDefined();
      const to = DB.classes[cls.promotesTo!];
      expect(to.weaponTypes).toContain(DB.weapons[ch.weaponId].type);
      expect(to.tier).toBe(2);
    }
  });

  it('classe promovida conta como nível mais alto no cálculo de EXP', () => {
    const save = promote(saveWith(6), 'aren', DB);
    const s = new BattleState(STAGE_3, DB, { units: buildStageUnits(STAGE_3, save, DB) });
    const aren = s.units.find((u) => u.characterId === 'aren')!;
    const hollow = s.units.find((u) => u.classDef.id === 'hollow' && !u.boss)!;
    // Esvaído nível 2 contra Lorde Solar nível 1 (efetivo 11): abate rende o mínimo.
    expect(combatExp(aren, hollow, true, true)).toBe(10);
  });
});

describe('movimento por tipo', () => {
  it('montados pagam mais na floresta e na colina; a pé, não', () => {
    const s = new BattleState(makeStage(['.fffff', '.hhhhh'], [
      { classId: 'dusk_knight', weaponId: 'iron_lance', faction: 'enemy', x: 0, y: 0 },
      { classId: 'bandit', weaponId: 'iron_axe', faction: 'enemy', x: 0, y: 1 },
    ]), DB);
    s.phase = 'enemy';
    const knight = new Set(s.rangeFor(s.units[0]).move.map(pointKey));
    // Floresta custa 3 para montados: com mov 7 chega a (2,0), não a (3,0).
    expect(knight.has('2,0')).toBe(true);
    expect(knight.has('3,0')).toBe(false);
    expect(s.map.moveCost({ x: 1, y: 1 }, 'mounted')).toBe(5);
    expect(s.map.moveCost({ x: 1, y: 1 }, 'foot')).toBe(3);
  });

  it('pântano atrasa todo mundo e mais ainda os blindados', () => {
    const s = new BattleState(makeStage(['.p'], []), DB);
    expect(s.map.moveCost({ x: 1, y: 0 }, 'foot')).toBe(2);
    expect(s.map.moveCost({ x: 1, y: 0 }, 'armored')).toBe(4);
  });
});

describe('save v1 → v2', () => {
  it('migra saves antigos sem perder o progresso', () => {
    const store = new Map<string, string>();
    const kv = { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v), removeItem: (k: string) => void store.delete(k) };
    const { seals: _s, ...v1 } = { ...newCampaign('casual'), nextStageIndex: 3 };
    kv.setItem(SAVE_KEY, JSON.stringify({ ...v1, version: 1 }));
    const loaded = loadSave(kv)!;
    expect(loaded.nextStageIndex).toBe(3);
    expect(loaded.seals).toBe(0);
    expect(loaded.version).toBe(2);
  });
});
