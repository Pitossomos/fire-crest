import type { AiBehavior, ClassDef, Faction, Stats, WeaponDef } from '../data/types';
import type { Point } from './grid';

export interface UnitInit {
  id: string;
  name: string;
  faction: Faction;
  classDef: ClassDef;
  weapon: WeaponDef;
  level: number;
  stats: Stats;
  growths: Stats;
  position: Point;
  characterId?: string;
  ai?: AiBehavior;
  boss?: boolean;
}

/** Unidade em batalha (estado mutável durante a fase). */
export class Unit {
  readonly id: string;
  readonly name: string;
  readonly faction: Faction;
  readonly classDef: ClassDef;
  readonly characterId?: string;
  readonly ai: AiBehavior;
  readonly boss: boolean;
  weapon: WeaponDef;
  level: number;
  exp = 0;
  stats: Stats;
  growths: Stats;
  hp: number;
  x: number;
  y: number;
  hasActed = false;

  constructor(init: UnitInit) {
    this.id = init.id;
    this.name = init.name;
    this.faction = init.faction;
    this.classDef = init.classDef;
    this.weapon = init.weapon;
    this.level = init.level;
    this.stats = { ...init.stats };
    this.growths = { ...init.growths };
    this.hp = init.stats.hp;
    this.x = init.position.x;
    this.y = init.position.y;
    this.characterId = init.characterId;
    this.ai = init.ai ?? 'aggressive';
    this.boss = init.boss ?? false;
  }

  get maxHp(): number {
    return this.stats.hp;
  }

  get move(): number {
    return this.classDef.move;
  }

  get isLord(): boolean {
    return this.classDef.isLord === true;
  }

  get position(): Point {
    return { x: this.x, y: this.y };
  }

  isAlive(): boolean {
    return this.hp > 0;
  }

  canAct(): boolean {
    return this.isAlive() && !this.hasActed;
  }

  moveTo(p: Point): void {
    this.x = p.x;
    this.y = p.y;
  }
}
