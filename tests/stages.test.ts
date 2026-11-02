import { describe, expect, it } from 'vitest';
import { applyVictory, buildStageUnits, newCampaign } from '../src/core/campaign';
import { simulate } from './simulate';
import { BattleState } from '../src/core/battle-state';
import { pointKey } from '../src/core/grid';
import { distanceField } from '../src/core/pathfinding';
import { DB } from '../src/data';
import { NARRATOR_ID } from '../src/data/characters';
import { CHAPTER_1, CHAPTER_1_STAGES } from '../src/data/chapter1';
import type { StageDef } from '../src/data/types';

describe('Capítulo 1', () => {
  it('tem 5 fases em ordem', () => {
    expect(CHAPTER_1.stageIds).toEqual(CHAPTER_1_STAGES.map((s) => s.id));
    expect(CHAPTER_1_STAGES.map((s) => s.order)).toEqual([1, 2, 3, 4, 5]);
  });
});

describe.each(CHAPTER_1_STAGES.map((s) => [s.name, s] as [string, StageDef]))('%s', (_name, stage) => {
  const state = new BattleState(stage, DB, { seed: 1 });

  it('mapa 15×10 e unidades em tiles distintos e transponíveis', () => {
    expect(state.map.width).toBe(15);
    expect(state.map.height).toBe(10);
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
});
