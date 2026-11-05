import type { ChapterDef, CharacterDef, ClassDef, ItemDef, StageDef, TerrainDef, WeaponDef } from './types';
import { CLASSES } from './classes';
import { WEAPONS } from './weapons';
import { TERRAIN } from './terrain';
import { CHARACTERS } from './characters';
import { ITEMS } from './items';
import { CHAPTER_1, CHAPTER_1_STAGES } from './chapter1';
import { CHAPTER_2, CHAPTER_2_STAGES } from './chapter2';

/** Capítulos em ordem de jogo, com as respectivas fases. */
const CHAPTERS: { chapter: ChapterDef; stages: StageDef[] }[] = [
  { chapter: CHAPTER_1, stages: CHAPTER_1_STAGES },
  { chapter: CHAPTER_2, stages: CHAPTER_2_STAGES },
];

/** Acesso somente-leitura a todas as definições estáticas do jogo. */
export interface GameDatabase {
  classes: Record<string, ClassDef>;
  weapons: Record<string, WeaponDef>;
  terrain: Record<string, TerrainDef>;
  characters: Record<string, CharacterDef>;
  items: Record<string, ItemDef>;
  stages: Record<string, StageDef>;
  chapters: Record<string, ChapterDef>;
  /** Ids dos capítulos em ordem. */
  chapterOrder: string[];
}

export const DB: GameDatabase = {
  classes: CLASSES,
  weapons: WEAPONS,
  terrain: TERRAIN,
  characters: CHARACTERS,
  items: ITEMS,
  stages: Object.fromEntries(CHAPTERS.flatMap((c) => c.stages).map((s) => [s.id, s])),
  chapters: Object.fromEntries(CHAPTERS.map((c) => [c.chapter.id, c.chapter])),
  chapterOrder: CHAPTERS.map((c) => c.chapter.id),
};

/** Busca por id lançando erro se não existir (falha cedo em dados inválidos). */
export function lookup<T>(table: Record<string, T>, id: string, what: string): T {
  const value = table[id];
  if (value === undefined) throw new Error(`${what} desconhecido: "${id}"`);
  return value;
}
