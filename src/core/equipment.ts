import type { ArmorDef, ClassDef, Stats } from '../data/types';

/** Soma (sinal +1) ou desconta (−1) o bônus da armadura nos atributos. */
export function applyArmor(stats: Stats, armor: ArmorDef | undefined, sign: 1 | -1): Stats {
  const out = { ...stats };
  if (!armor) return out;
  out.def += sign * armor.def;
  out.res += sign * armor.res;
  out.hp += sign * (armor.hp ?? 0);
  out.spd += sign * (armor.spd ?? 0);
  return out;
}

/** A classe pode vestir a armadura? (pesadas só para quem tem `heavyArmor`) */
export function canWear(cls: ClassDef, armor: ArmorDef): boolean {
  return !armor.heavy || cls.heavyArmor === true;
}

/** Texto curto do bônus da armadura (ex.: "+4 DEF, +2 HP, −2 VEL"). */
export function armorBonusLabel(a: ArmorDef): string {
  const parts: string[] = [];
  if (a.def) parts.push(`+${a.def} DEF`);
  if (a.res) parts.push(`+${a.res} RES`);
  if (a.hp) parts.push(`+${a.hp} HP`);
  if (a.spd) parts.push(`${a.spd > 0 ? '+' : '−'}${Math.abs(a.spd)} VEL`);
  return `${parts.join(', ')}${a.heavy ? ' · pesada' : ''}`;
}
