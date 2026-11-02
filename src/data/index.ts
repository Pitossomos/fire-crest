import type { CharacterDef, ClassDef, ItemDef, StageDef, TerrainDef, WeaponDef } from './types';
import { CLASSES } from './classes';
import { WEAPONS } from './weapons';
import { TERRAIN } from './terrain';
import { CHARACTERS } from './characters';
import { ITEMS } from './items';
import { CHAPTER_1_STAGES } from './chapter1';

/** Acesso somente-leitura a todas as definições estáticas do jogo. */
export interface GameDatabase {
  classes: Record<string, ClassDef>;
  weapons: Record<string, WeaponDef>;
  terrain: Record<string, TerrainDef>;
  characters: Record<string, CharacterDef>;
  items: Record<string, ItemDef>;
  stages: Record<string, StageDef>;
}

export const DB: GameDatabase = {
  classes: CLASSES,
  weapons: WEAPONS,
  terrain: TERRAIN,
  characters: CHARACTERS,
  items: ITEMS,
  stages: Object.fromEntries(CHAPTER_1_STAGES.map((s) => [s.id, s])),
};

/** Busca por id lançando erro se não existir (falha cedo em dados inválidos). */
export function lookup<T>(table: Record<string, T>, id: string, what: string): T {
  const value = table[id];
  if (value === undefined) throw new Error(`${what} desconhecido: "${id}"`);
  return value;
}
