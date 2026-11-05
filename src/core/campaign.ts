import type { GameDatabase } from '../data';
import { lookup } from '../data';
import type { ChapterDef, GameMode, RosterEntry, SaveData, StageDef, StatKey } from '../data/types';
import type { BattleState } from './battle-state';
import { Unit } from './unit';
import { createUnit } from './unit-factory';

export const SAVE_VERSION = 2;
/** Nível mínimo para promover com um Selo da Brasa. */
export const PROMOTION_LEVEL = 5;

const STAT_KEYS: StatKey[] = ['hp', 'str', 'mag', 'skl', 'spd', 'lck', 'def', 'res'];

/** Novo save no início do capítulo 1 (roster vazio: a primeira fase traz o time). */
export function newCampaign(mode: GameMode, chapterId = 'c1'): SaveData {
  return { version: SAVE_VERSION, mode, chapterId, nextStageIndex: 0, roster: [], seals: 0 };
}

/**
 * Novo save começando direto num capítulo, com o time pré-montado do capítulo
 * (atributos projetados pelas taxas de crescimento médias até o nível indicado).
 */
export function newCampaignAt(mode: GameMode, chapterId: string, db: GameDatabase): SaveData {
  const chapter = lookup(db.chapters, chapterId, 'Capítulo');
  const roster = (chapter.premade ?? []).map((m) => premadeEntry(m.characterId, m.level, db));
  return { ...newCampaign(mode, chapterId), roster, seals: chapter.startSeals ?? 0 };
}

/** Entrada de roster de um herói no nível pedido (sem rolagens: crescimento médio). */
export function premadeEntry(characterId: string, level: number, db: GameDatabase): RosterEntry {
  const ch = lookup(db.characters, characterId, 'Personagem');
  const gained = Math.max(0, level - ch.level);
  const stats = { ...ch.stats };
  for (const k of STAT_KEYS) stats[k] += Math.floor((gained * ch.growths[k]) / 100);
  return {
    characterId,
    level: Math.max(level, ch.level),
    exp: 0,
    stats,
    weaponId: ch.weaponId,
    items: (ch.items ?? []).map((id) => ({ itemId: id, uses: lookup(db.items, id, 'Item').uses })),
    alive: true,
  };
}

export function currentChapter(save: SaveData, db: GameDatabase): ChapterDef {
  return lookup(db.chapters, save.chapterId, 'Capítulo');
}

/** Id da próxima fase a jogar, ou `undefined` se o capítulo terminou. */
export function currentStageId(save: SaveData, db: GameDatabase): string | undefined {
  return currentChapter(save, db).stageIds[save.nextStageIndex];
}

export function isChapterDone(save: SaveData, db: GameDatabase): boolean {
  return currentStageId(save, db) === undefined;
}

/**
 * Passa para o próximo capítulo mantendo o time (e os mortos do Clássico),
 * somando os selos iniciais do capítulo novo. `undefined` se não houver próximo.
 */
export function startNextChapter(save: SaveData, db: GameDatabase): SaveData | undefined {
  const next = currentChapter(save, db).nextChapterId;
  if (!next || !db.chapters[next]) return undefined;
  return { ...save, chapterId: next, nextStageIndex: 0, seals: save.seals + (db.chapters[next].startSeals ?? 0) };
}

/**
 * Monta as unidades da fase aplicando o roster:
 * - heróis do roster entram com classe, nível, EXP, atributos e itens salvos;
 * - heróis mortos (modo Clássico) ficam de fora;
 * - heróis fora do roster só entram na primeira fase ou se `joins: true`;
 * - inimigos e aliados NPC vêm direto da fase.
 */
export function buildStageUnits(stage: StageDef, save: SaveData, db: GameDatabase): Unit[] {
  const firstStage = save.roster.length === 0;
  const units: Unit[] = [];
  stage.units.forEach((p, i) => {
    if (p.faction !== 'player' || !p.characterId) {
      units.push(createUnit(p, db, i));
      return;
    }
    const entry = save.roster.find((r) => r.characterId === p.characterId);
    if (!entry) {
      if (firstStage || p.joins) units.push(createUnit(p, db, i));
      return;
    }
    if (!entry.alive) return;
    const base = createUnit(p, db, i);
    units.push(new Unit({
      id: base.id,
      name: base.name,
      faction: 'player',
      classDef: entry.classId ? lookup(db.classes, entry.classId, 'Classe') : base.classDef,
      weapon: lookup(db.weapons, p.weaponId ?? entry.weaponId, 'Arma'),
      level: entry.level,
      exp: entry.exp,
      stats: entry.stats,
      growths: base.growths,
      position: base.position,
      characterId: entry.characterId,
      items: entry.items.map((slot) => ({ def: lookup(db.items, slot.itemId, 'Item'), uses: slot.uses })),
    }));
  });
  return units;
}

function toEntry(u: Unit, alive: boolean): RosterEntry {
  return {
    characterId: u.characterId!,
    classId: u.classDef.id,
    level: u.level,
    exp: u.exp,
    stats: { ...u.stats },
    weaponId: u.weapon.id,
    items: u.items.map((i) => ({ itemId: i.def.id, uses: i.uses })),
    alive,
  };
}

/**
 * Atualiza o save após vencer a fase: grava o estado dos heróis (no Casual,
 * os caídos voltam), adiciona recrutas e NPCs de `recruitOnClear` vivos,
 * soma os selos da fase e avança para a próxima.
 */
export function applyVictory(save: SaveData, state: BattleState): SaveData {
  const roster = new Map(save.roster.map((r) => [r.characterId, r]));
  const recruitOnClear = new Set(state.stage.recruitOnClear ?? []);
  for (const u of state.units) {
    if (!u.characterId) continue;
    const isMember = u.faction === 'player';
    const clearRecruit = !isMember && recruitOnClear.has(u.characterId) && u.isAlive();
    if (!isMember && !clearRecruit) continue;
    roster.set(u.characterId, toEntry(u, u.isAlive() || save.mode === 'casual'));
  }
  return {
    ...save,
    roster: [...roster.values()],
    nextStageIndex: save.nextStageIndex + 1,
    seals: save.seals + (state.stage.rewardSeals ?? 0),
  };
}

/** Classe atual de um membro do roster. */
export function rosterClassId(entry: RosterEntry, db: GameDatabase): string {
  return entry.classId ?? lookup(db.characters, entry.characterId, 'Personagem').classId;
}

/** O herói pode ser promovido agora (vivo, nível suficiente, classe com promoção)? */
export function canPromote(entry: RosterEntry, db: GameDatabase): boolean {
  const cls = lookup(db.classes, rosterClassId(entry, db), 'Classe');
  return entry.alive && !!cls.promotesTo && entry.level >= PROMOTION_LEVEL;
}

/**
 * Promove o herói gastando um Selo da Brasa: troca de classe, soma o bônus de
 * atributos e volta ao nível 1 da classe avançada (a arma continua a mesma).
 */
export function promote(save: SaveData, characterId: string, db: GameDatabase): SaveData {
  const entry = save.roster.find((r) => r.characterId === characterId);
  if (!entry) throw new Error(`${characterId} não está no time`);
  if (save.seals <= 0) throw new Error('Sem Selos da Brasa');
  if (!canPromote(entry, db)) throw new Error(`${characterId} não pode ser promovido agora`);
  const from = lookup(db.classes, rosterClassId(entry, db), 'Classe');
  const to = lookup(db.classes, from.promotesTo!, 'Classe');
  const stats = { ...entry.stats };
  for (const k of STAT_KEYS) stats[k] += to.promotionBonus?.[k] ?? 0;
  const promoted: RosterEntry = { ...entry, classId: to.id, level: 1, exp: 0, stats };
  return {
    ...save,
    seals: save.seals - 1,
    roster: save.roster.map((r) => (r.characterId === characterId ? promoted : r)),
  };
}

/** Membros vivos do roster (para a tela de resultado). */
export function livingRoster(save: SaveData): RosterEntry[] {
  return save.roster.filter((r) => r.alive);
}

/**
 * Save de desenvolvimento para abrir uma fase direto (`?stage=`): Casual,
 * com o time pré-montado do capítulo (ou o time da própria fase no Cap. 1).
 */
export function devSaveForStage(stageId: string, db: GameDatabase): SaveData {
  const stage = lookup(db.stages, stageId, 'Fase');
  const chapter = lookup(db.chapters, stage.chapterId, 'Capítulo');
  const base = chapter.premade ? newCampaignAt('casual', chapter.id, db) : newCampaign('casual', chapter.id);
  return { ...base, nextStageIndex: Math.max(0, chapter.stageIds.indexOf(stageId)) };
}
