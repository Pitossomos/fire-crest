import { describe, expect, it } from 'vitest';
import { BattleState } from '../src/core/battle-state';
import { applyVictory, buildStageUnits, newCampaign } from '../src/core/campaign';
import { DB } from '../src/data';
import { STAGE_1 } from '../src/data/chapter1/stage1';
import { STAGE_3 } from '../src/data/chapter1/stage3';
import { STAGE_4 } from '../src/data/chapter1/stage4';
import { STAGE_5 } from '../src/data/chapter1/stage5';
import type { GameMode, SaveData } from '../src/data/types';
import { type KeyValueStore, SAVE_KEY, clearSave, loadSave, writeSave } from '../src/save/save';

function afterStage1(mode: GameMode, kill: string[] = []): SaveData {
  const save = newCampaign(mode);
  const state = new BattleState(STAGE_1, DB, { units: buildStageUnits(STAGE_1, save, DB) });
  for (const u of state.units) {
    if (u.characterId === 'aren') { u.level = 3; u.exp = 42; u.stats.str = 9; u.items[0].uses = 1; }
    if (u.characterId && kill.includes(u.characterId)) u.hp = 0;
  }
  return applyVictory(save, state);
}

describe('campanha', () => {
  it('primeira fase usa os heróis da fase', () => {
    const units = buildStageUnits(STAGE_1, newCampaign('classic'), DB);
    expect(units.filter((u) => u.faction === 'player').map((u) => u.characterId)).toEqual(['aren', 'mira', 'hadric']);
  });

  it('vitória grava nível, EXP, atributos e itens e avança a fase', () => {
    const save = afterStage1('classic');
    expect(save.nextStageIndex).toBe(1);
    const aren = save.roster.find((r) => r.characterId === 'aren')!;
    expect(aren).toMatchObject({ level: 3, exp: 42, alive: true, items: [{ itemId: 'potion', uses: 1 }] });
    expect(aren.stats.str).toBe(9);
  });

  it('a fase seguinte usa os dados do roster (com HP cheio)', () => {
    const save = afterStage1('classic');
    const aren = buildStageUnits(STAGE_3, save, DB).find((u) => u.characterId === 'aren')!;
    expect(aren.level).toBe(3);
    expect(aren.stats.str).toBe(9);
    expect(aren.hp).toBe(aren.maxHp);
  });

  it('Clássico: quem cai fica de fora; Casual: volta na próxima fase', () => {
    const classic = afterStage1('classic', ['mira']);
    expect(classic.roster.find((r) => r.characterId === 'mira')?.alive).toBe(false);
    expect(buildStageUnits(STAGE_3, classic, DB).some((u) => u.characterId === 'mira')).toBe(false);
    const casual = afterStage1('casual', ['mira']);
    expect(buildStageUnits(STAGE_3, casual, DB).some((u) => u.characterId === 'mira')).toBe(true);
  });

  it('aliada NPC com recruitOnClear entra no roster só se sobreviver', () => {
    let save = afterStage1('classic');
    save = { ...save, nextStageIndex: 2 };
    const alive = new BattleState(STAGE_3, DB, { units: buildStageUnits(STAGE_3, save, DB) });
    expect(applyVictory(save, alive).roster.some((r) => r.characterId === 'wren')).toBe(true);
    const dead = new BattleState(STAGE_3, DB, { units: buildStageUnits(STAGE_3, save, DB) });
    dead.units.find((u) => u.characterId === 'wren')!.hp = 0;
    expect(applyVictory(save, dead).roster.some((r) => r.characterId === 'wren')).toBe(false);
  });

  it('heróis não recrutados não aparecem nas fases seguintes', () => {
    const save = afterStage1('classic');
    // Na Fase 4, Wren está listada como jogadora, mas não foi recrutada nesse save.
    expect(buildStageUnits(STAGE_4, save, DB).some((u) => u.characterId === 'wren')).toBe(false);
    // Na Fase 5, Lys e Corvin idem.
    const ids = buildStageUnits(STAGE_5, save, DB).map((u) => u.characterId);
    expect(ids).not.toContain('lys');
    expect(ids).not.toContain('corvin');
  });

  it('recrutas por conversa e por evento entram no roster', () => {
    let save = afterStage1('classic');
    save = { ...save, nextStageIndex: 3 };
    const state = new BattleState(STAGE_4, DB, { units: buildStageUnits(STAGE_4, save, DB) });
    state.units.find((u) => u.characterId === 'lys')!.faction = 'player';
    state.spawnUnit({ characterId: 'corvin', faction: 'player', x: 12, y: 2, joins: true });
    const ids = applyVictory(save, state).roster.map((r) => r.characterId);
    expect(ids).toEqual(expect.arrayContaining(['lys', 'corvin']));
  });
});

class MemoryStore implements KeyValueStore {
  data = new Map<string, string>();
  getItem(k: string) { return this.data.get(k) ?? null; }
  setItem(k: string, v: string) { this.data.set(k, v); }
  removeItem(k: string) { this.data.delete(k); }
}

describe('save', () => {
  it('grava e lê de volta', () => {
    const store = new MemoryStore();
    const save = afterStage1('casual');
    expect(writeSave(save, store)).toBe(true);
    expect(loadSave(store)).toEqual(save);
    clearSave(store);
    expect(loadSave(store)).toBeUndefined();
  });

  it('ignora save corrompido ou de outra versão', () => {
    const store = new MemoryStore();
    store.setItem(SAVE_KEY, '{nao é json');
    expect(loadSave(store)).toBeUndefined();
    store.setItem(SAVE_KEY, JSON.stringify({ ...newCampaign('classic'), version: 999 }));
    expect(loadSave(store)).toBeUndefined();
  });

  it('sem armazenamento, não quebra', () => {
    expect(writeSave(newCampaign('classic'), undefined)).toBe(false);
    expect(loadSave(undefined)).toBeUndefined();
  });
});
