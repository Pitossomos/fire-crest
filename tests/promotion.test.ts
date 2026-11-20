import { describe, expect, it } from 'vitest';
import { BattleState } from '../src/core/battle-state';
import {
  PROMOTION_LEVEL, buildStageUnits, canPromote, newCampaign, premadeEntry, promote, promotionOptions,
} from '../src/core/campaign';
import { combatExp, effectiveLevel } from '../src/core/leveling';
import { pointKey } from '../src/core/grid';
import { DB } from '../src/data';
import { STAGE_3 } from '../src/data/chapter1/stage3';
import type { SaveData } from '../src/data/types';
import { SAVE_KEY, loadSave } from '../src/save/save';
import { makeStage } from './helpers';

function saveWith(level: number): SaveData {
  return {
    ...newCampaign('classic'),
    nextStageIndex: 2,
    roster: ['aren', 'mira', 'hadric', 'kaira'].map((id) => premadeEntry(id, level, DB)),
  };
}

/** Save com Aren já no tier 2 (Lorde Solar) e no nível pedido. */
function tier2Save(level: number): SaveData {
  const s = promote(saveWith(6), 'aren', DB);
  return { ...s, roster: s.roster.map((r) => (r.characterId === 'aren' ? { ...r, level } : r)) };
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
  it(`exige só nível ${PROMOTION_LEVEL} e classe com promoção (sem selos)`, () => {
    expect(canPromote(premadeEntry('aren', PROMOTION_LEVEL - 1, DB), DB)).toBe(false);
    expect(canPromote(premadeEntry('aren', PROMOTION_LEVEL, DB), DB)).toBe(true);
    expect(() => promote(saveWith(PROMOTION_LEVEL - 1), 'aren', DB)).toThrow();
    expect(() => promote(saveWith(PROMOTION_LEVEL), 'aren', DB)).not.toThrow();
  });

  it('troca a classe, soma o bônus e volta ao nível 1', () => {
    const save = saveWith(6);
    const before = save.roster.find((r) => r.characterId === 'aren')!;
    const after = promote(save, 'aren', DB);
    const aren = after.roster.find((r) => r.characterId === 'aren')!;
    expect(aren.classId).toBe('sunlord');
    expect(aren.level).toBe(1);
    expect(aren.exp).toBe(0);
    expect(aren.stats.str).toBe(before.stats.str + DB.classes.sunlord.promotionBonus!.str);
    expect(promotionOptions(aren, DB)).toEqual(['solar_king', 'crest_avatar']);
    expect(canPromote(aren, DB)).toBe(false); // nível 1 de novo
  });

  it('no tier 3 o jogador escolhe o caminho; destino inválido é recusado', () => {
    const save = tier2Save(PROMOTION_LEVEL);
    expect(canPromote(save.roster.find((r) => r.characterId === 'aren')!, DB)).toBe(true);
    expect(() => promote(save, 'aren', DB)).toThrow(/caminho/);
    expect(() => promote(save, 'aren', DB, 'red_fury')).toThrow();
    const a = promote(save, 'aren', DB, 'solar_king').roster.find((r) => r.characterId === 'aren')!;
    const b = promote(save, 'aren', DB, 'crest_avatar').roster.find((r) => r.characterId === 'aren')!;
    expect(a.classId).toBe('solar_king');
    expect(b.classId).toBe('crest_avatar');
    expect(DB.classes.solar_king.weaponTypes).toContain('lance');
    expect(DB.classes.crest_avatar.weaponTypes).toContain('light');
    expect(canPromote({ ...a, level: 20 }, DB)).toBe(false); // tier 3 é o topo
  });

  it('a unidade promovida entra na fase com a classe nova (mov e lorde mantidos)', () => {
    const save = promote(saveWith(6), 'aren', DB);
    const aren = buildStageUnits(STAGE_3, save, DB).find((u) => u.characterId === 'aren')!;
    expect(aren.classDef.id).toBe('sunlord');
    expect(aren.move).toBe(6);
    expect(aren.isLord).toBe(true);
    const king = buildStageUnits(STAGE_3, promote(tier2Save(5), 'aren', DB, 'solar_king'), DB)
      .find((u) => u.characterId === 'aren')!;
    expect(king.isLord).toBe(true);
    expect(king.classDef.tier).toBe(3);
  });

  it('árvore: tier 1 → um tier 2 → dois tier 3, que aceitam as armas da classe anterior', () => {
    let tier3 = 0;
    for (const cls of Object.values(DB.classes)) {
      for (const toId of cls.promotesTo ?? []) {
        const to = DB.classes[toId];
        expect(to, toId).toBeDefined();
        expect(to.tier, toId).toBe((cls.tier ?? 1) + 1);
        for (const t of cls.weaponTypes) expect(to.weaponTypes, `${cls.id} → ${toId}`).toContain(t);
        if (to.tier === 3) tier3++;
      }
      if (cls.tier === 1 && cls.promotesTo) expect(cls.promotesTo).toHaveLength(1);
      if (cls.tier === 2) expect(cls.promotesTo, cls.id).toHaveLength(2);
      if (cls.tier === 3) expect(cls.promotesTo).toBeUndefined();
    }
    expect(tier3).toBe(20);
  });

  it('todo herói tem promoção', () => {
    for (const ch of Object.values(DB.characters).filter((c) => !c.villain)) {
      const cls = DB.classes[ch.classId];
      if (['bandit', 'hollow', 'dusk_monk', 'inquisitor'].includes(cls.id)) continue;
      expect(cls.promotesTo?.length, ch.id).toBeGreaterThan(0);
    }
  });

  it('classe promovida conta como nível mais alto no cálculo de EXP', () => {
    const save = promote(saveWith(6), 'aren', DB);
    const s = new BattleState(STAGE_3, DB, { units: buildStageUnits(STAGE_3, save, DB) });
    const aren = s.units.find((u) => u.characterId === 'aren')!;
    const hollow = s.units.find((u) => u.classDef.id === 'hollow' && !u.boss)!;
    // Esvaído nível 2 contra Lorde Solar nível 1 (efetivo 11): abate rende o mínimo.
    expect(combatExp(aren, hollow, true, true)).toBe(10);
    const king = buildStageUnits(STAGE_3, promote(tier2Save(5), 'aren', DB, 'solar_king'), DB)
      .find((u) => u.characterId === 'aren')!;
    expect(effectiveLevel(king)).toBe(21);
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

describe('migração de saves antigos', () => {
  const memory = () => {
    const store = new Map<string, string>();
    return { getItem: (k: string) => store.get(k) ?? null, setItem: (k: string, v: string) => void store.set(k, v), removeItem: (k: string) => void store.delete(k) };
  };

  it('v1 (sem baú) → v4 sem perder o progresso', () => {
    const kv = memory();
    const { convoy: _c, ...v1 } = { ...newCampaign('casual'), nextStageIndex: 3 };
    kv.setItem(SAVE_KEY, JSON.stringify({ ...v1, version: 1, seals: 2 }));
    const loaded = loadSave(kv)!;
    expect(loaded.nextStageIndex).toBe(3);
    expect(loaded.version).toBe(4);
    expect('seals' in loaded).toBe(false);
    expect(loaded.convoy).toEqual({ items: [], weapons: [], armors: [] });
  });

  it('v3 (com selos e baú sem armaduras) → v4 descarta os selos e mantém o baú', () => {
    const kv = memory();
    const v3 = { ...newCampaign('classic'), version: 3, seals: 1, convoy: { items: [{ itemId: 'potion', uses: 3 }], weapons: ['steel_sword'] } };
    kv.setItem(SAVE_KEY, JSON.stringify(v3));
    const loaded = loadSave(kv)!;
    expect(loaded.version).toBe(4);
    expect('seals' in loaded).toBe(false);
    expect(loaded.convoy).toEqual({ items: [{ itemId: 'potion', uses: 3 }], weapons: ['steel_sword'], armors: [] });
  });
});
