import { describe, expect, it } from 'vitest';
import { BattleState } from '../src/core/battle-state';
import { applyVictory, buildStageUnits, newCampaign, premadeEntry } from '../src/core/campaign';
import { applyArmor, armorBonusLabel, canWear } from '../src/core/equipment';
import { canEquipArmor, equipArmor, removeArmor } from '../src/core/party';
import { DB } from '../src/data';
import { STAGE_3 } from '../src/data/chapter1/stage3';
import type { SaveData } from '../src/data/types';

function team(armors: string[]): SaveData {
  return {
    ...newCampaign('classic'),
    nextStageIndex: 2,
    roster: ['aren', 'mira', 'hadric', 'kaira'].map((id) => premadeEntry(id, 5, DB)),
    convoy: { items: [], weapons: [], armors },
  };
}
const hero = (s: SaveData, id: string) => s.roster.find((r) => r.characterId === id)!;

describe('armaduras', () => {
  it('somam e descontam o bônus nos atributos', () => {
    const base = DB.characters.aren.stats;
    const plate = DB.armors.plate;
    const worn = applyArmor(base, plate, 1);
    expect(worn.def).toBe(base.def + 4);
    expect(worn.hp).toBe(base.hp + 2);
    expect(worn.spd).toBe(base.spd - 2);
    expect(applyArmor(worn, plate, -1)).toEqual(base);
    expect(applyArmor(base, undefined, 1)).toEqual(base);
    expect(armorBonusLabel(plate)).toBe('+4 DEF, +2 HP, −2 VEL · pesada');
  });

  it('pesadas só para classes com armadura pesada (e suas promoções)', () => {
    expect(canWear(DB.classes.lancer, DB.armors.plate)).toBe(true);
    expect(canWear(DB.classes.bastion, DB.armors.bulwark)).toBe(true);
    expect(canWear(DB.classes.living_wall, DB.armors.bulwark)).toBe(true);
    expect(canWear(DB.classes.pyromancer, DB.armors.plate)).toBe(false);
    expect(canWear(DB.classes.pyromancer, DB.armors.runic_mantle)).toBe(true);
  });

  it('equipar troca com o baú; tirar devolve ao baú', () => {
    let s = team(['chainmail', 'plate']);
    expect(canEquipArmor(s, 'mira', 'plate', DB)).toBe(false);
    expect(() => equipArmor(s, 'mira', 1, DB)).toThrow();
    s = equipArmor(s, 'mira', 0, DB);
    expect(hero(s, 'mira').armorId).toBe('chainmail');
    expect(s.convoy.armors).toEqual(['plate']);
    s = equipArmor(s, 'hadric', 0, DB); // Hadric é lanceiro: placas servem
    expect(hero(s, 'hadric').armorId).toBe('plate');
    expect(s.convoy.armors).toEqual([]);
    s = removeArmor(s, 'mira');
    expect(hero(s, 'mira').armorId).toBeUndefined();
    expect(s.convoy.armors).toEqual(['chainmail']);
    expect(() => removeArmor(s, 'mira')).toThrow();
  });

  it('na batalha o bônus vale; no roster ficam os atributos de base (crescimento intacto)', () => {
    const save = equipArmor(team(['runic_mantle']), 'aren', 0, DB);
    const baseRes = hero(save, 'aren').stats.res;
    const state = new BattleState(STAGE_3, DB, { units: buildStageUnits(STAGE_3, save, DB) });
    const aren = state.units.find((u) => u.characterId === 'aren')!;
    expect(aren.stats.res).toBe(baseRes + 3);
    expect(aren.armor?.id).toBe('runic_mantle');
    const after = applyVictory(save, state);
    expect(hero(after, 'aren').stats.res).toBe(baseRes);
    expect(hero(after, 'aren').armorId).toBe('runic_mantle');
  });
});
