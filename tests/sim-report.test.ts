import { it } from 'vitest';
import { BattleState } from '../src/core/battle-state';
import { applyVictory, buildStageUnits, newCampaign } from '../src/core/campaign';
import { DB } from '../src/data';
import { CHAPTER_1_STAGES } from '../src/data/chapter1';
import { simulate } from './simulate';

it.skipIf(!process.env.SIM_REPORT)('relatório detalhado', () => {
  for (const seed of [1, 2, 3, 4, 5, 6, 7, 8]) {
    let save = newCampaign('casual');
    for (const stage of CHAPTER_1_STAGES) {
      const state = new BattleState(stage, DB, { seed, units: buildStageUnits(stage, save, DB) });
      const r = simulate(state);
      const dead = state.units.filter((u) => !u.isAlive() && u.faction !== 'enemy').map((u) => u.name.split(' ')[0]);
      const foes = state.unitsOf('enemy').length;
      console.log(`seed ${seed} ${stage.id}: ${r.result} t${r.turn} mortos=[${dead}] inimigos vivos=${foes} party=${state.unitsOf('player').map((u) => `${u.name.split(' ')[0]}:${u.level}(${u.hp}/${u.maxHp})`).join(' ')}`);
      if (r.result !== 'victory') break;
      save = applyVictory(save, r.state);
    }
  }
});
