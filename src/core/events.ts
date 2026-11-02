import type { DialogueLine, EventTrigger } from '../data/types';
import type { BattleState } from './battle-state';
import { manhattan } from './grid';
import type { Unit } from './unit';

/** O que um evento produziu (a cena mostra o diálogo e anima as unidades novas). */
export interface EventEffects {
  event: EventTrigger;
  dialogue: DialogueLine[];
  spawned: Unit[];
  recruited: Unit[];
}

/**
 * Dispara os eventos da fase (cada um no máximo uma vez):
 * - `turnStart`: início da fase do jogador no turno indicado;
 * - `unitDefeated`: personagem `unitId` caiu;
 * - `tileReached`: unidade do jogador (ou `unitId`) parou em (x, y);
 * - `talk`: `unitId` conversa com `otherUnitId` adjacente.
 */
export class EventEngine {
  private readonly state: BattleState;
  private readonly fired = new Set<string>();

  constructor(state: BattleState) {
    this.state = state;
  }

  hasFired(id: string): boolean {
    return this.fired.has(id);
  }

  private pending(kind: EventTrigger['on']): EventTrigger[] {
    return this.state.stage.events.filter((e) => e.on === kind && !this.fired.has(e.id));
  }

  turnStart(): EventEffects[] {
    if (this.state.phase !== 'player') return [];
    return this.pending('turnStart').filter((e) => e.turn === this.state.turn).map((e) => this.fire(e));
  }

  unitDefeated(unit: Unit): EventEffects[] {
    if (!unit.characterId) return [];
    return this.pending('unitDefeated').filter((e) => e.unitId === unit.characterId).map((e) => this.fire(e));
  }

  tileReached(unit: Unit): EventEffects[] {
    if (unit.faction !== 'player') return [];
    return this.pending('tileReached')
      .filter((e) => e.x === unit.x && e.y === unit.y && (!e.unitId || e.unitId === unit.characterId))
      .map((e) => this.fire(e));
  }

  /** Conversas disponíveis para a unidade na posição atual: [evento, interlocutor]. */
  talkOptions(unit: Unit): [EventTrigger, Unit][] {
    if (!unit.characterId) return [];
    const out: [EventTrigger, Unit][] = [];
    for (const e of this.pending('talk')) {
      if (e.unitId !== unit.characterId) continue;
      const other = this.state.livingUnits.find((u) => u.characterId === e.otherUnitId);
      if (other && manhattan(other.position, unit.position) === 1) out.push([e, other]);
    }
    return out;
  }

  talk(unit: Unit, event: EventTrigger): EventEffects {
    if (!this.talkOptions(unit).some(([e]) => e === event)) throw new Error(`Conversa indisponível: ${event.id}`);
    return this.fire(event);
  }

  private fire(event: EventTrigger): EventEffects {
    this.fired.add(event.id);
    const spawned = event.spawns.map((p) => this.state.spawnUnit(p));
    const recruited: Unit[] = [];
    if (event.recruitId) {
      const unit = this.state.livingUnits.find((u) => u.characterId === event.recruitId);
      if (unit && unit.faction !== 'player') {
        unit.faction = 'player';
        unit.hasActed = false; // pode agir ainda neste turno
        recruited.push(unit);
      }
    }
    return { event, dialogue: event.dialogue, spawned, recruited };
  }
}
