import { describe, expect, it } from 'vitest';
import { applyVictory, buildStageUnits, newCampaign, newCampaignAt } from '../src/core/campaign';
import { simulate } from './simulate';
import { BattleState } from '../src/core/battle-state';
import { pointKey } from '../src/core/grid';
import { distanceField } from '../src/core/pathfinding';
import { DB } from '../src/data';
import { NARRATOR_ID } from '../src/data/characters';
import { CHAPTER_1, CHAPTER_1_STAGES } from '../src/data/chapter1';
import { CHAPTER_2_STAGES } from '../src/data/chapter2';
import type { StageDef } from '../src/data/types';

describe('Capítulo 1', () => {
  it('tem 5 fases em ordem', () => {
    expect(CHAPTER_1.stageIds).toEqual(CHAPTER_1_STAGES.map((s) => s.id));
    expect(CHAPTER_1_STAGES.map((s) => s.order)).toEqual([1, 2, 3, 4, 5]);
  });
});

describe('capítulos', () => {
  it('estão em ordem, encadeados e com fases existentes', () => {
    expect(DB.chapterOrder).toEqual(['c1', 'c2']);
    expect(DB.chapters.c1.nextChapterId).toBe('c2');
    for (const id of DB.chapterOrder) {
      const ch = DB.chapters[id];
      expect(ch.stageIds).toHaveLength(5);
      for (const sid of ch.stageIds) expect(DB.stages[sid]?.chapterId, sid).toBe(id);
      for (const m of ch.premade ?? []) expect(DB.characters[m.characterId], m.characterId).toBeDefined();
    }
  });
});

const ALL_STAGES = Object.values(DB.stages);

describe.each(ALL_STAGES.map((s) => [`${s.id} ${s.name}`, s] as [string, StageDef]))('%s', (_name, stage) => {
  const state = new BattleState(stage, DB, { seed: 1 });

  it('mapa entre 15×10 e 30×20, Cap. 1 sem rolagem; unidades em tiles distintos e transponíveis', () => {
    expect(state.map.width).toBeGreaterThanOrEqual(15);
    expect(state.map.height).toBeGreaterThanOrEqual(10);
    expect(state.map.width).toBeLessThanOrEqual(30);
    expect(state.map.height).toBeLessThanOrEqual(20);
    if (stage.chapterId === 'c1') expect([state.map.width, state.map.height]).toEqual([15, 10]);
    const keys = state.units.map((u) => pointKey(u.position));
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('tem exatamente um lorde do jogador e todos os heróis iniciais conectados ao lorde', () => {
    const lords = state.units.filter((u) => u.faction === 'player' && u.isLord);
    expect(lords).toHaveLength(1);
    const field = distanceField(state.map, [lords[0].position]);
    for (const u of state.unitsOf('player')) expect(field.has(pointKey(u.position)), u.name).toBe(true);
  });

  it('o objetivo é alcançável pelo lorde', () => {
    const lord = state.units.find((u) => u.isLord)!;
    const o = stage.objective;
    if (o.kind === 'seize') {
      expect(state.map.moveCost({ x: o.x!, y: o.y! })).not.toBeNull();
      expect(distanceField(state.map, [{ x: o.x!, y: o.y! }]).has(pointKey(lord.position))).toBe(true);
    }
    if (o.kind === 'boss') {
      const boss = state.units.find((u) => u.characterId === o.targetId);
      expect(boss?.boss, 'chefe marcado com boss: true').toBe(true);
      expect(distanceField(state.map, [boss!.position]).has(pointKey(lord.position))).toBe(true);
    }
    if (o.kind === 'survive') expect(o.turns).toBeGreaterThan(0);
  });

  it('eventos e falas referenciam personagens existentes', () => {
    const lines = [...stage.preDialogue, ...stage.postDialogue, ...stage.events.flatMap((e) => e.dialogue)];
    for (const l of lines) expect(l.speakerId === NARRATOR_ID || l.speakerId in DB.characters, l.speakerId).toBe(true);
    const ids = stage.events.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    const inStage = new Set(stage.units.map((u) => u.characterId).filter(Boolean));
    for (const e of stage.events) {
      for (const p of e.spawns) {
        expect(state.map.inBounds({ x: p.x, y: p.y }), `${e.id}: spawn fora do mapa`).toBe(true);
        if (p.characterId) inStage.add(p.characterId);
      }
    }
    for (const e of stage.events) {
      if (e.unitId) expect(inStage.has(e.unitId), `${e.id}: ${e.unitId}`).toBe(true);
      if (e.otherUnitId) expect(inStage.has(e.otherUnitId), `${e.id}: ${e.otherUnitId}`).toBe(true);
      if (e.recruitId) expect(inStage.has(e.recruitId), `${e.id}: ${e.recruitId}`).toBe(true);
      if (e.on === 'tileReached') expect(state.map.moveCost({ x: e.x!, y: e.y! })).not.toBeNull();
    }
    for (const id of stage.recruitOnClear ?? []) expect(inStage.has(id)).toBe(true);
  });
});

describe('simulação do capítulo (sanidade e balanceamento)', () => {
  it('a campanha simulada roda as 5 fases (com até 3 tentativas por fase)', () => {
    const report: string[] = [];
    let farthest = 0;
    for (const seed of [1, 2, 3, 4, 5, 6]) {
      let save = newCampaign('classic');
      let attempts = 0;
      for (const stage of CHAPTER_1_STAGES) {
        let won = false;
        for (let tryNo = 0; tryNo < 3 && !won; tryNo++) {
          attempts++;
          const state = new BattleState(stage, DB, { seed: seed * 100 + tryNo, units: buildStageUnits(stage, save, DB) });
          const r = simulate(state);
          if (r.result === 'victory') {
            save = applyVictory(save, r.state);
            won = true;
          }
        }
        if (!won) break;
      }
      farthest = Math.max(farthest, save.nextStageIndex);
      const levels = save.roster.map((r) => `${r.characterId}:${r.level}${r.alive ? '' : '†'}`).join(' ');
      report.push(`seed ${seed}: ${save.nextStageIndex}/5 fases em ${attempts} tentativas — ${levels}`);
    }
    console.log(`[balanceamento]\n${report.join('\n')}`);
    expect(farthest).toBeGreaterThanOrEqual(1);
  });

  it('o Capítulo 2 simulado com o time pré-montado roda sem erros', () => {
    const report: string[] = [];
    for (const seed of [1, 2, 3, 4]) {
      let save = newCampaignAt('casual', 'c2', DB);
      for (const stage of CHAPTER_2_STAGES) {
        let won = false;
        for (let tryNo = 0; tryNo < 3 && !won; tryNo++) {
          const state = new BattleState(stage, DB, { seed: seed * 100 + tryNo, units: buildStageUnits(stage, save, DB) });
          const r = simulate(state);
          if (r.result === 'victory') {
            save = applyVictory(save, r.state);
            won = true;
          }
        }
        if (!won) break;
      }
      report.push(`seed ${seed}: ${save.nextStageIndex}/5 fases, selos ${save.seals}`);
    }
    console.log(`[balanceamento Cap. 2]\n${report.join('\n')}`);
    expect(report).toHaveLength(4);
  });
});
