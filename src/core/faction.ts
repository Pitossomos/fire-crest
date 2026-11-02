import type { Faction } from '../data/types';

/** Jogador e aliados NPC são amigos; inimigos são hostis a ambos. */
export function areHostile(a: Faction, b: Faction): boolean {
  if (a === b) return false;
  return a === 'enemy' || b === 'enemy';
}

/** Ordem das fases de um turno. */
export const PHASE_ORDER: readonly Faction[] = ['player', 'enemy', 'ally'];
