import type { Stats } from './types';

/** Atalho para declarar atributos na ordem HP, FOR, MAG, HAB, VEL, SOR, DEF, RES. */
export function stats(
  hp: number, str: number, mag: number, skl: number,
  spd: number, lck: number, def: number, res: number,
): Stats {
  return { hp, str, mag, skl, spd, lck, def, res };
}
