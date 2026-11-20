import { describe, expect, it } from 'vitest';
import { BattleState } from '../src/core/battle-state';
import { applyVictory, buildStageUnits, newCampaign } from '../src/core/campaign';
import { MAX_ITEMS } from '../src/core/party';
import { DB } from '../src/data';
import { STAGE_3 } from '../src/data/chapter1/stage3';
import type { StageDef } from '../src/data/types';
import { makeStage } from './helpers';

function village(): BattleState {
  const stage: StageDef = makeStage(['.H.H', '.F..'], [
    { characterId: 'aren', faction: 'player', x: 1, y: 0 },
    { characterId: 'mira', faction: 'player', x: 3, y: 0 },
    { classId: 'bandit', weaponId: 'iron_axe', faction: 'enemy', x: 1, y: 1 },
  ]);
  stage.caches = [
    { x: 1, y: 0, itemId: 'potion', armorId: 'chainmail' },
    { x: 1, y: 1, weaponId: 'steel_sword' },
  ];
  return new BattleState(stage, DB, { seed: 1 });
}

describe('investigar construções', () => {
  it('acha item e armadura uma única vez e consome a ação', () => {
    const s = village();
    const aren = s.units[0];
    const before = aren.items.length;
    expect(s.canInvestigate(aren)).toBe(true);
    const out = s.investigate(aren);
    expect(out.gained).toEqual(['Poção', 'Cota de Malha (baú)']);
    expect(aren.items).toHaveLength(before + 1);
    expect(s.found.armors).toEqual(['chainmail']);
    expect(aren.hasActed).toBe(true);
    expect(s.canInvestigate(aren)).toBe(false);
    expect(() => s.investigate(aren)).toThrow();
  });

  it('construção sem esconderijo dá só uma fala', () => {
    const s = village();
    const mira = s.units[1];
    const out = s.investigate(mira);
    expect(out.gained).toEqual([]);
    expect(out.text.length).toBeGreaterThan(5);
    expect(s.found).toEqual({ items: [], weapons: [], armors: [] });
  });

  it('inventário cheio manda o item para o baú; armas sempre vão para o baú', () => {
    const s = village();
    const aren = s.units[0];
    while (aren.items.length < MAX_ITEMS) aren.items.push({ def: DB.items.potion, uses: 3 });
    expect(s.investigate(aren).gained).toEqual(['Poção (baú)', 'Cota de Malha (baú)']);
    expect(s.found.items).toEqual([{ itemId: 'potion', uses: 3 }]);
  });

  it('inimigos não investigam e terreno comum não é construção', () => {
    const s = village();
    s.phase = 'enemy';
    expect(s.canInvestigate(s.units[2])).toBe(false); // bandido sobre a fortaleza
    const aren = s.units[0];
    aren.moveTo({ x: 0, y: 0 });
    expect(s.canInvestigate(aren)).toBe(false);
  });

  it('a vitória leva os achados ao save (baú)', () => {
    const save = { ...newCampaign('classic'), nextStageIndex: 2 };
    const s = new BattleState(STAGE_3, DB, { units: buildStageUnits(STAGE_3, save, DB) });
    const hadric = s.units.find((u) => u.characterId === 'hadric')!;
    hadric.moveTo({ x: 5, y: 4 }); // ruínas do bosque
    s.investigate(hadric);
    s.found.weapons.push('steel_sword');
    const after = applyVictory(save, s);
    expect(after.convoy.armors).toEqual(['runic_mantle']);
    expect(after.convoy.weapons).toEqual(['steel_sword']);
  });
});

describe('esconderijos das fases', () => {
  it('ficam em construções, apontam para itens/armas/armaduras existentes, sem duplicatas', () => {
    let armors = 0;
    for (const stage of Object.values(DB.stages)) {
      const s = new BattleState(stage, DB, { seed: 1 });
      const keys = new Set<string>();
      const caches = stage.caches ?? [];
      expect(caches.length, `${stage.id}: poucos esconderijos`).toBeGreaterThanOrEqual(3);
      for (const c of caches) {
        expect(s.map.terrainAt({ x: c.x, y: c.y }).searchable, `${stage.id} (${c.x},${c.y})`).toBe(true);
        if (c.itemId) expect(DB.items[c.itemId], c.itemId).toBeDefined();
        if (c.weaponId) expect(DB.weapons[c.weaponId], c.weaponId).toBeDefined();
        if (c.armorId) expect(DB.armors[c.armorId], c.armorId).toBeDefined();
        expect(c.itemId || c.weaponId || c.armorId, `${stage.id} vazio`).toBeTruthy();
        keys.add(`${c.x},${c.y}`);
        if (c.armorId) armors++;
      }
      expect(keys.size, `${stage.id}: esconderijos duplicados`).toBe(caches.length);
    }
    expect(armors).toBeGreaterThanOrEqual(10);
  });

  it('o terreno de ruínas existe nos mapas e é investigável', () => {
    expect(DB.terrain.ruins.searchable).toBe(true);
    const withRuins = Object.values(DB.stages).filter((st) => st.map.rows.some((r) => r.includes('R')));
    expect(withRuins.length).toBeGreaterThanOrEqual(8);
  });
});
