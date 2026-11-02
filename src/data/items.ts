import type { ItemDef } from './types';

export const ITEMS: Record<string, ItemDef> = {
  potion: { id: 'potion', name: 'Poção', heal: 10, uses: 3 },
  elixir: { id: 'elixir', name: 'Elixir de Brasa', heal: 99, uses: 1 },
};
