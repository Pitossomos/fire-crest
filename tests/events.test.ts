import { describe, expect, it } from 'vitest';
import { BattleState } from '../src/core/battle-state';
import { EventEngine } from '../src/core/events';
import { DB } from '../src/data';
import type { EventTrigger } from '../src/data/types';
import { makeStage } from './helpers';

function setup(events: EventTrigger[]) {
  const stage = makeStage(['.....', '.....'], [
    { characterId: 'aren', faction: 'player', x: 0, y: 0 },
    { characterId: 'lys', faction: 'ally', x: 1, y: 0, ai: 'stationary' },
    { characterId: 'grull', faction: 'enemy', x: 4, y: 1 },
  ]);
  stage.events = events;
  const state = new BattleState(stage, DB, { seed: 1 });
  return { state, engine: new EventEngine(state), aren: state.units[0], lys: state.units[1], grull: state.units[2] };
}

const base = { dialogue: [], spawns: [] };

describe('EventEngine', () => {
  it('turnStart dispara no turno certo e só uma vez', () => {
    const { state, engine } = setup([
      { ...base, id: 'dica', on: 'turnStart', turn: 1, dialogue: [{ speakerId: 'narrator', side: 'left', text: 'oi' }] },
      { ...base, id: 't2', on: 'turnStart', turn: 2 },
    ]);
    expect(engine.turnStart().map((e) => e.event.id)).toEqual(['dica']);
    expect(engine.turnStart()).toEqual([]);
    do state.endPhase(); while (state.phase !== 'player'); // jogador → inimigo → aliado → jogador
    expect(engine.turnStart().map((e) => e.event.id)).toEqual(['t2']);
  });

  it('reforços aparecem no tile livre mais próximo', () => {
    const { state, engine } = setup([
      { ...base, id: 'ref', on: 'turnStart', turn: 1,
        spawns: [{ classId: 'bandit', weaponId: 'iron_axe', faction: 'enemy', x: 4, y: 1 }] },
    ]);
    const [fx] = engine.turnStart();
    expect(fx.spawned).toHaveLength(1);
    const u = fx.spawned[0];
    expect(state.units).toContain(u);
    expect(u.x !== 4 || u.y !== 1).toBe(true); // (4,1) já tinha Grull
  });

  it('conversa adjacente recruta e some das opções', () => {
    const { engine, aren, lys } = setup([
      { ...base, id: 'lys', on: 'talk', unitId: 'aren', otherUnitId: 'lys', recruitId: 'lys' },
    ]);
    const opts = engine.talkOptions(aren);
    expect(opts.map(([, u]) => u)).toEqual([lys]);
    const fx = engine.talk(aren, opts[0][0]);
    expect(fx.recruited).toEqual([lys]);
    expect(lys.faction).toBe('player');
    expect(engine.talkOptions(aren)).toEqual([]);
  });

  it('sem conversa se não estiver adjacente', () => {
    const { engine, aren } = setup([
      { ...base, id: 'lys', on: 'talk', unitId: 'aren', otherUnitId: 'lys', recruitId: 'lys' },
    ]);
    aren.moveTo({ x: 3, y: 0 });
    expect(engine.talkOptions(aren)).toEqual([]);
  });

  it('tileReached só para unidades do jogador', () => {
    const { engine, aren, grull } = setup([{ ...base, id: 'cela', on: 'tileReached', x: 2, y: 1 }]);
    grull.moveTo({ x: 2, y: 1 });
    expect(engine.tileReached(grull)).toEqual([]);
    aren.moveTo({ x: 2, y: 1 });
    expect(engine.tileReached(aren)).toHaveLength(1);
  });

  it('unitDefeated reage ao personagem certo', () => {
    const { engine, grull, aren } = setup([{ ...base, id: 'morte', on: 'unitDefeated', unitId: 'grull' }]);
    expect(engine.unitDefeated(aren)).toEqual([]);
    expect(engine.unitDefeated(grull)).toHaveLength(1);
  });
});
