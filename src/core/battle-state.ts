import type { Faction, StageDef } from '../data/types';
import type { GameDatabase } from '../data';
import { BattleMap } from './battle-map';
import { type Point, pointKey } from './grid';
import { PHASE_ORDER } from './faction';
import { Unit } from './unit';
import { createUnit } from './unit-factory';
import { type ReachNode, attackTiles, buildPath, computeReach, movementTiles } from './pathfinding';

/** Áreas destacadas quando uma unidade é selecionada. */
export interface RangeInfo {
  reach: Map<string, ReachNode>;
  move: Point[];
  attack: Point[];
}

/**
 * Estado completo de uma batalha, sem dependência de renderização.
 * A cena Phaser lê este estado e envia comandos (mover, esperar, fim de fase).
 */
export class BattleState {
  readonly stage: StageDef;
  readonly map: BattleMap;
  readonly units: Unit[];
  turn = 1;
  phase: Faction = 'player';

  constructor(stage: StageDef, db: GameDatabase) {
    this.stage = stage;
    this.map = new BattleMap(stage.map, db.terrain);
    this.units = stage.units.map((p, i) => createUnit(p, db, i));
    for (const u of this.units) {
      if (!this.map.inBounds(u.position)) throw new Error(`${u.name} fora do mapa`);
      if (this.map.moveCost(u.position) === null) throw new Error(`${u.name} em terreno intransponível`);
    }
  }

  get livingUnits(): Unit[] {
    return this.units.filter((u) => u.isAlive());
  }

  unitAt(p: Point): Unit | undefined {
    return this.units.find((u) => u.isAlive() && u.x === p.x && u.y === p.y);
  }

  unitsOf(faction: Faction): Unit[] {
    return this.livingUnits.filter((u) => u.faction === faction);
  }

  /** Movimento + alcance de ataque/cura de uma unidade a partir da posição atual. */
  rangeFor(unit: Unit): RangeInfo {
    const occupancy = (p: Point) => this.unitAt(p);
    const reach = computeReach(this.map, unit, occupancy);
    const move = movementTiles(reach, unit, occupancy);
    const attack = attackTiles(this.map, move, unit.weapon.minRange, unit.weapon.maxRange);
    return { reach, move, attack };
  }

  /** Move a unidade se o destino for válido; retorna o caminho percorrido. */
  moveUnit(unit: Unit, to: Point): Point[] {
    if (unit.faction !== this.phase) throw new Error(`Não é a fase de ${unit.faction}`);
    if (!unit.canAct()) throw new Error(`${unit.name} já agiu`);
    const range = this.rangeFor(unit);
    if (!range.move.some((p) => pointKey(p) === pointKey(to))) {
      throw new Error(`Destino inválido (${to.x},${to.y}) para ${unit.name}`);
    }
    const path = buildPath(range.reach, to);
    unit.moveTo(to);
    return path;
  }

  /** Desfaz um movimento ainda não confirmado (antes de escolher a ação). */
  undoMove(unit: Unit, origin: Point): void {
    unit.moveTo(origin);
  }

  /** Encerra a ação da unidade neste turno. */
  wait(unit: Unit): void {
    unit.hasActed = true;
  }

  /** Verdadeiro quando nenhuma unidade da fase atual pode agir. */
  phaseExhausted(): boolean {
    return this.unitsOf(this.phase).every((u) => !u.canAct());
  }

  /**
   * Avança para a próxima fase com unidades vivas (jogador → inimigo → aliado).
   * Ao voltar ao jogador, incrementa o turno. Retorna a nova fase.
   */
  endPhase(): Faction {
    let idx = PHASE_ORDER.indexOf(this.phase);
    for (let i = 0; i < PHASE_ORDER.length; i++) {
      idx = (idx + 1) % PHASE_ORDER.length;
      const next = PHASE_ORDER[idx];
      if (next === 'player') this.turn++;
      if (next === 'player' || this.unitsOf(next).length > 0) {
        this.phase = next;
        break;
      }
    }
    for (const u of this.unitsOf(this.phase)) u.hasActed = false;
    return this.phase;
  }
}
