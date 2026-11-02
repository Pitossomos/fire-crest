/**
 * Modelo de dados do jogo (definições estáticas + save).
 *
 * Interfaces marcadas com a tag JSDoc `@entity` aparecem no diagrama
 * Entidade-Relacionamento (docs/diagrams/er.md). Relações são inferidas
 * pelo tipo dos campos:
 *   - `Ref<X>`   → chave estrangeira para a entidade X (N:1)
 *   - `X[]`      → coleção embutida de X (1:N)
 *   - `X`        → objeto embutido (1:1)
 */

/** Referência por id a outra entidade (chave estrangeira). */
export type Ref<T> = string & { readonly __entity?: T };

export type StatKey = 'hp' | 'str' | 'mag' | 'skl' | 'spd' | 'lck' | 'def' | 'res';
export type Stats = Record<StatKey, number>;

export type WeaponType = 'sword' | 'lance' | 'axe' | 'bow' | 'tome' | 'dark' | 'staff' | 'claw';
export type Faction = 'player' | 'enemy' | 'ally';
export type AiBehavior = 'aggressive' | 'guard' | 'stationary';
export type GameMode = 'classic' | 'casual';
export type ObjectiveKind = 'rout' | 'seize' | 'survive' | 'boss';
export type EventKind = 'turnStart' | 'unitDefeated' | 'tileReached' | 'talk';
export type PortraitSide = 'left' | 'right';

/** @entity Tipo de terreno do mapa e seus modificadores. */
export interface TerrainDef {
  id: string;
  name: string;
  /** Custo de movimento; `null` = intransponível. */
  moveCost: number | null;
  def: number;
  avoid: number;
  /** Cura em % do HP máximo no início do turno. */
  heal: number;
}

/** @entity Arma, tomo ou cajado. */
export interface WeaponDef {
  id: string;
  name: string;
  type: WeaponType;
  might: number;
  hit: number;
  crit: number;
  minRange: number;
  maxRange: number;
  /** Dano mágico (usa MAG contra RES). */
  magic: boolean;
  /** Quantidade curada (apenas cajados). */
  heal?: number;
}

/** @entity Classe de unidade: atributos-base, crescimento e armas permitidas. */
export interface ClassDef {
  id: string;
  name: string;
  move: number;
  weaponTypes: WeaponType[];
  baseStats: Stats;
  /** Taxas de crescimento (%) usadas por inimigos genéricos. */
  growths: Stats;
  /** Chave da textura do sprite. */
  sprite: string;
  isLord?: boolean;
}

/** @entity Personagem nomeado (jogável ou chefe). */
export interface CharacterDef {
  id: string;
  name: string;
  title: string;
  classId: Ref<ClassDef>;
  level: number;
  /** Atributos absolutos no nível inicial. */
  stats: Stats;
  growths: Stats;
  weaponId: Ref<WeaponDef>;
  bio: string;
}

/** @entity Mapa de uma fase em texto: cada caractere é um terreno. */
export interface MapDef {
  rows: string[];
  legend: Record<string, Ref<TerrainDef>>;
}

/** @entity Posição inicial de uma unidade numa fase. */
export interface UnitPlacement {
  /** Personagem nomeado; ausente para inimigos genéricos. */
  characterId?: Ref<CharacterDef>;
  /** Classe para inimigos genéricos. */
  classId?: Ref<ClassDef>;
  weaponId?: Ref<WeaponDef>;
  name?: string;
  faction: Faction;
  x: number;
  y: number;
  level?: number;
  ai?: AiBehavior;
  boss?: boolean;
}

/** @entity Condição de vitória de uma fase. */
export interface ObjectiveDef {
  kind: ObjectiveKind;
  description: string;
  x?: number;
  y?: number;
  turns?: number;
  targetId?: Ref<CharacterDef>;
}

/** @entity Uma fala de diálogo. */
export interface DialogueLine {
  speakerId: Ref<CharacterDef>;
  side: PortraitSide;
  text: string;
}

/** @entity Evento disparado durante a batalha. */
export interface EventTrigger {
  id: string;
  on: EventKind;
  turn?: number;
  unitId?: Ref<CharacterDef>;
  otherUnitId?: Ref<CharacterDef>;
  x?: number;
  y?: number;
  dialogue: DialogueLine[];
  spawns: UnitPlacement[];
  recruitId?: Ref<CharacterDef>;
}

/** @entity Fase (batalha) de um capítulo. */
export interface StageDef {
  id: string;
  chapterId: Ref<ChapterDef>;
  order: number;
  name: string;
  objective: ObjectiveDef;
  map: MapDef;
  units: UnitPlacement[];
  preDialogue: DialogueLine[];
  postDialogue: DialogueLine[];
  events: EventTrigger[];
}

/** @entity Capítulo da campanha. */
export interface ChapterDef {
  id: string;
  name: string;
  stageIds: Ref<StageDef>[];
}

/** @entity Estado salvo de um personagem entre fases. */
export interface RosterEntry {
  characterId: Ref<CharacterDef>;
  level: number;
  exp: number;
  stats: Stats;
  weaponId: Ref<WeaponDef>;
  alive: boolean;
}

/** @entity Save do jogo (localStorage). */
export interface SaveData {
  version: number;
  mode: GameMode;
  chapterId: Ref<ChapterDef>;
  nextStageIndex: number;
  roster: RosterEntry[];
}
