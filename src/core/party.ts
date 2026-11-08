import type { GameDatabase } from '../data';
import { lookup } from '../data';
import type { InventorySlot, RosterEntry, SaveData } from '../data/types';

/** Itens que cada herói pode carregar; o resto fica no baú do grupo. */
export const MAX_ITEMS = 5;

function hero(save: SaveData, id: string): RosterEntry {
  const r = save.roster.find((e) => e.characterId === id);
  if (!r) throw new Error(`${id} não está no time`);
  return r;
}

function withHero(save: SaveData, id: string, change: (r: RosterEntry) => RosterEntry): SaveData {
  return { ...save, roster: save.roster.map((r) => (r.characterId === id ? change(r) : r)) };
}

/** Passa um item de um herói para outro (se o outro tiver espaço). */
export function giveItem(save: SaveData, fromId: string, slotIndex: number, toId: string): SaveData {
  if (fromId === toId) throw new Error('Escolha outro herói');
  const from = hero(save, fromId);
  const to = hero(save, toId);
  const slot = from.items[slotIndex];
  if (!slot) throw new Error('Item inexistente');
  if (to.items.length >= MAX_ITEMS) throw new Error(`${toId} já carrega ${MAX_ITEMS} itens`);
  const moved = withHero(save, fromId, (r) => ({ ...r, items: r.items.filter((_, i) => i !== slotIndex) }));
  return withHero(moved, toId, (r) => ({ ...r, items: [...r.items, { ...slot }] }));
}

/** Guarda um item do herói no baú. */
export function storeItem(save: SaveData, heroId: string, slotIndex: number): SaveData {
  const slot = hero(save, heroId).items[slotIndex];
  if (!slot) throw new Error('Item inexistente');
  const next = withHero(save, heroId, (r) => ({ ...r, items: r.items.filter((_, i) => i !== slotIndex) }));
  return { ...next, convoy: { ...next.convoy, items: [...next.convoy.items, { ...slot }] } };
}

/** Pega um item do baú para o herói. */
export function takeItem(save: SaveData, convoyIndex: number, heroId: string): SaveData {
  const slot = save.convoy.items[convoyIndex];
  if (!slot) throw new Error('Item inexistente no baú');
  if (hero(save, heroId).items.length >= MAX_ITEMS) throw new Error(`${heroId} já carrega ${MAX_ITEMS} itens`);
  const next = { ...save, convoy: { ...save.convoy, items: save.convoy.items.filter((_, i) => i !== convoyIndex) } };
  return withHero(next, heroId, (r) => ({ ...r, items: [...r.items, { ...slot }] }));
}

/** Classe atual do herói (a promovida, se houver). */
function classOf(r: RosterEntry, db: GameDatabase) {
  return lookup(db.classes, r.classId ?? lookup(db.characters, r.characterId, 'Personagem').classId, 'Classe');
}

/** O herói pode usar a arma (tipo aceito pela classe atual)? */
export function canEquip(save: SaveData, heroId: string, weaponId: string, db: GameDatabase): boolean {
  const r = hero(save, heroId);
  return classOf(r, db).weaponTypes.includes(lookup(db.weapons, weaponId, 'Arma').type);
}

/** Equipa uma arma do baú; a arma atual do herói volta para o baú. */
export function equipWeapon(save: SaveData, heroId: string, convoyIndex: number, db: GameDatabase): SaveData {
  const weaponId = save.convoy.weapons[convoyIndex];
  if (!weaponId) throw new Error('Arma inexistente no baú');
  if (!canEquip(save, heroId, weaponId, db)) throw new Error(`${heroId} não sabe usar essa arma`);
  const old = hero(save, heroId).weaponId;
  const weapons = save.convoy.weapons.filter((_, i) => i !== convoyIndex);
  const next = { ...save, convoy: { ...save.convoy, weapons: [...weapons, old] } };
  return withHero(next, heroId, (r) => ({ ...r, weaponId }));
}

/** Coloca itens no baú (ex.: achados que não couberam no inventário). */
export function addToConvoy(save: SaveData, items: InventorySlot[], weapons: string[]): SaveData {
  return { ...save, convoy: { items: [...save.convoy.items, ...items], weapons: [...save.convoy.weapons, ...weapons] } };
}
