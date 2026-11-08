import { describe, expect, it } from 'vitest';
import { newCampaign, premadeEntry } from '../src/core/campaign';
import { MAX_ITEMS, canEquip, equipWeapon, giveItem, storeItem, takeItem } from '../src/core/party';
import { DB } from '../src/data';
import type { SaveData } from '../src/data/types';

function team(): SaveData {
  return {
    ...newCampaign('classic'),
    roster: ['aren', 'mira', 'hadric', 'corvin'].map((id) => premadeEntry(id, 5, DB)),
    convoy: { items: [{ itemId: 'elixir', uses: 1 }], weapons: ['steel_sword', 'steel_lance'] },
  };
}
const items = (s: SaveData, id: string) => s.roster.find((r) => r.characterId === id)!.items.map((i) => i.itemId);

describe('gerenciar o time', () => {
  it('dar item move de um herói para outro', () => {
    const s = giveItem(team(), 'aren', 0, 'mira');
    expect(items(s, 'aren')).toEqual([]);
    expect(items(s, 'mira')).toEqual(['potion', 'potion']);
    expect(() => giveItem(s, 'aren', 0, 'mira')).toThrow(); // Aren não tem mais nada
    expect(() => giveItem(s, 'mira', 0, 'mira')).toThrow();
  });

  it(`ninguém carrega mais que ${MAX_ITEMS} itens`, () => {
    let s = team();
    const full = Array.from({ length: MAX_ITEMS }, () => ({ itemId: 'potion', uses: 3 }));
    s = { ...s, roster: s.roster.map((r) => (r.characterId === 'mira' ? { ...r, items: full } : r)) };
    expect(() => giveItem(s, 'aren', 0, 'mira')).toThrow();
    expect(() => takeItem(s, 0, 'mira')).toThrow();
  });

  it('guardar e pegar do baú', () => {
    let s = storeItem(team(), 'aren', 0);
    expect(items(s, 'aren')).toEqual([]);
    expect(s.convoy.items.map((i) => i.itemId)).toEqual(['elixir', 'potion']);
    s = takeItem(s, 0, 'aren');
    expect(items(s, 'aren')).toEqual(['elixir']);
    expect(s.convoy.items.map((i) => i.itemId)).toEqual(['potion']);
  });

  it('equipar arma do baú: a antiga volta para o baú; tipo errado é recusado', () => {
    const s0 = team();
    expect(canEquip(s0, 'mira', 'steel_sword', DB)).toBe(true);
    expect(canEquip(s0, 'corvin', 'steel_sword', DB)).toBe(false);
    const s = equipWeapon(s0, 'mira', 0, DB);
    expect(s.roster.find((r) => r.characterId === 'mira')!.weaponId).toBe('steel_sword');
    expect(s.convoy.weapons).toEqual(['steel_lance', 'iron_sword']);
    expect(() => equipWeapon(s, 'corvin', 0, DB)).toThrow(); // Lança de Aço para um piromante
    const h = equipWeapon(s, 'hadric', 0, DB);
    expect(h.roster.find((r) => r.characterId === 'hadric')!.weaponId).toBe('steel_lance');
  });
});
