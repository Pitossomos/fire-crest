import type { BattleState } from './battle-state';

export type Outcome = 'ongoing' | 'victory' | 'defeat';

/** Avalia vitória/derrota da fase. A derrota tem prioridade. */
export function evaluate(state: BattleState): Outcome {
  const players = state.unitsOf('player');
  if (players.length === 0) return 'defeat';
  const lords = state.units.filter((u) => u.faction === 'player' && u.isLord);
  if (lords.length > 0 && lords.some((l) => !l.isAlive())) return 'defeat';

  const obj = state.stage.objective;
  switch (obj.kind) {
    case 'rout':
      return state.unitsOf('enemy').length === 0 ? 'victory' : 'ongoing';
    case 'boss': {
      const boss = state.units.find((u) => u.characterId === obj.targetId);
      return boss && !boss.isAlive() ? 'victory' : 'ongoing';
    }
    case 'seize':
      return state.seized ? 'victory' : 'ongoing';
    case 'survive':
      return state.turn > (obj.turns ?? 0) ? 'victory' : 'ongoing';
  }
}
