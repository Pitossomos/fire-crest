import type { WeaponDef } from './types';

export const WEAPONS: Record<string, WeaponDef> = {
  iron_sword:  { id: 'iron_sword',  name: 'Espada de Ferro',   type: 'sword', might: 5, hit: 90, crit: 0,  minRange: 1, maxRange: 1, magic: false },
  ember_blade: { id: 'ember_blade', name: 'Lâmina de Brasa',   type: 'sword', might: 8, hit: 85, crit: 10,  minRange: 1, maxRange: 1, magic: false },
  iron_lance:  { id: 'iron_lance',  name: 'Lança de Ferro',    type: 'lance', might: 7, hit: 80, crit: 0,  minRange: 1, maxRange: 1, magic: false },
  iron_axe:    { id: 'iron_axe',    name: 'Machado de Ferro',  type: 'axe',   might: 7, hit: 70, crit: 0,  minRange: 1, maxRange: 1, magic: false },
  hand_axe:    { id: 'hand_axe',    name: 'Machadinha',        type: 'axe',   might: 6, hit: 60, crit: 0,  minRange: 1, maxRange: 2, magic: false },
  iron_bow:    { id: 'iron_bow',    name: 'Arco de Ferro',     type: 'bow',   might: 6, hit: 85, crit: 0,  minRange: 2, maxRange: 2, magic: false },
  fire_tome:   { id: 'fire_tome',   name: 'Tomo de Chamas',    type: 'tome',  might: 5, hit: 90, crit: 0,  minRange: 1, maxRange: 2, magic: true },
  sun_tome:    { id: 'sun_tome',    name: 'Tomo da Aurora',    type: 'light', might: 4, hit: 95, crit: 5,  minRange: 1, maxRange: 2, magic: true, effective: ['hollow', 'dusk_monk', 'inquisitor'] },
  sleep_psalm: { id: 'sleep_psalm', name: 'Salmo do Sono',     type: 'dark',  might: 5, hit: 80, crit: 0,  minRange: 1, maxRange: 2, magic: true },
  ash_rosary:  { id: 'ash_rosary',  name: 'Rosário de Cinzas', type: 'dark',  might: 7, hit: 80, crit: 5, minRange: 1, maxRange: 2, magic: true },
  heal_staff:  { id: 'heal_staff',  name: 'Cajado de Cura',    type: 'staff', might: 0, hit: 100, crit: 0, minRange: 1, maxRange: 1, magic: true, heal: 10 },
  claws:       { id: 'claws',       name: 'Garras Cinzentas',  type: 'claw',  might: 6, hit: 75, crit: 0,  minRange: 1, maxRange: 1, magic: false },
};
