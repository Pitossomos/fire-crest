import type { Faction, StageDef, UnitPlacement } from '../data/types';
import type { GameDatabase } from '../data';
import { BattleMap } from './battle-map';
import { type Point, neighbors, pointKey } from './grid';
import { PHASE_ORDER } from './faction';
import { Unit } from './unit';
import { createUnit } from './unit-factory';
import { type ReachNode, attackTiles, buildPath, computeReach, movementTiles } from './pathfinding';
import { type CombatResult, canAttackWith, inWeaponRange, resolveCombat } from './combat';
import { HEAL_EXP, type LevelUp, combatExp, gainExp } from './leveling';
import { areHostile } from './faction';
import { Rng } from './rng';

export interface BattleOptions {
  /** Semente do RNG (combate e level-up reproduzíveis). */
  seed?: number;
  /** Unidades já montadas (campanha); padrão: criadas a partir da fase. */
  units?: Unit[];
}

/** EXP ganha por uma unidade numa ação. */
export interface ExpGain {
  unit: Unit;
  amount: number;
  levelUps: LevelUp[];
}

/** Cura recebida por terreno no início da fase. */
export interface TerrainHeal {
  unit: Unit;
  amount: number;
}

export interface HealOutcome {
  amount: number;
  exp?: ExpGain;
}

export interface AttackOutcome {
  result: CombatResult;
  exp: ExpGain[];
}

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
  readonly db: GameDatabase;
  readonly rng: Rng;
  turn = 1;
  phase: Faction = 'player';
  /** Objetivo "tomar" cumprido. */
  seized = false;
  /** Curas de terreno aplicadas no início da fase atual. */
  phaseHeals: TerrainHeal[] = [];
  private nextIndex: number;

  constructor(stage: StageDef, db: GameDatabase, opts: BattleOptions = {}) {
    this.stage = stage;
    this.db = db;
    this.rng = new Rng(opts.seed ?? Date.now());
    this.map = new BattleMap(stage.map, db.terrain);
    this.units = opts.units ?? stage.units.map((p, i) => createUnit(p, db, i));
    this.nextIndex = this.units.length;
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

  /**
   * Cria uma unidade no meio da batalha (reforço/recruta). Se o tile pedido
   * estiver ocupado, usa o tile livre e transponível mais próximo.
   */
  spawnUnit(p: UnitPlacement): Unit {
    const unit = createUnit(p, this.db, this.nextIndex++);
    unit.moveTo(this.nearestFree(unit.position));
    this.units.push(unit);
    return unit;
  }

  private nearestFree(start: Point): Point {
    const seen = new Set([pointKey(start)]);
    const queue = [start];
    while (queue.length > 0) {
      const p = queue.shift()!;
      if (this.map.moveCost(p) !== null && !this.unitAt(p)) return p;
      for (const n of neighbors(p)) {
        if (this.map.inBounds(n) && !seen.has(pointKey(n))) {
          seen.add(pointKey(n));
          queue.push(n);
        }
      }
    }
    throw new Error('Mapa sem espaço livre');
  }

  /** Inimigos vivos que a unidade pode atacar da posição atual. */
  targetsInRange(unit: Unit): Unit[] {
    if (!canAttackWith(unit)) return [];
    return this.livingUnits.filter(
      (t) => areHostile(unit.faction, t.faction) && inWeaponRange(unit, unit.position, t.position),
    );
  }

  /** Executa um ataque, distribui EXP às unidades do jogador e marca o atacante como tendo agido. */
  attack(attacker: Unit, defender: Unit): AttackOutcome {
    if (!this.targetsInRange(attacker).includes(defender)) {
      throw new Error(`${attacker.name} não alcança ${defender.name}`);
    }
    const result = resolveCombat(this.map, attacker, defender, this.rng);
    const exp: ExpGain[] = [];
    for (const [u, enemy, killed] of [
      [attacker, defender, result.defenderDied],
      [defender, attacker, result.attackerDied],
    ] as const) {
      if (u.faction !== 'player' || !u.isAlive()) continue;
      const dealt = result.strikes.some((s) => s.attackerId === u.id && s.damage > 0);
      const amount = combatExp(u, enemy, dealt, killed);
      exp.push({ unit: u, amount, levelUps: gainExp(u, amount, this.rng) });
    }
    attacker.hasActed = true;
    return { result, exp };
  }

  /** Aliados feridos que a unidade pode curar com o cajado da posição atual. */
  healTargets(unit: Unit): Unit[] {
    const w = unit.weapon;
    if (w.type !== 'staff' || !w.heal) return [];
    return this.livingUnits.filter(
      (t) => t !== unit && !areHostile(unit.faction, t.faction) && t.hp < t.maxHp
        && inWeaponRange(unit, unit.position, t.position),
    );
  }

  /** Cura com cajado: cura do cajado + MAG/2; dá EXP ao curandeiro do jogador. */
  healUnit(healer: Unit, target: Unit): HealOutcome {
    if (!this.healTargets(healer).includes(target)) throw new Error(`${healer.name} não pode curar ${target.name}`);
    const amount = target.heal((healer.weapon.heal ?? 0) + Math.floor(healer.stats.mag / 2));
    healer.hasActed = true;
    if (healer.faction !== 'player') return { amount };
    return { amount, exp: { unit: healer, amount: HEAL_EXP, levelUps: gainExp(healer, HEAL_EXP, this.rng) } };
  }

  /** Usa o item do slot indicado (Poção etc.); remove o item quando os usos acabam. */
  useItem(unit: Unit, index: number): number {
    const slot = unit.items[index];
    if (!slot) throw new Error(`${unit.name} não tem item no slot ${index}`);
    const amount = unit.heal(slot.def.heal);
    slot.uses--;
    if (slot.uses <= 0) unit.items.splice(index, 1);
    unit.hasActed = true;
    return amount;
  }

  /** O lorde pode tomar o objetivo estando onde está? */
  canSeize(unit: Unit): boolean {
    const o = this.stage.objective;
    return o.kind === 'seize' && unit.isLord && unit.x === o.x && unit.y === o.y;
  }

  seize(unit: Unit): void {
    if (!this.canSeize(unit)) throw new Error(`${unit.name} não pode tomar este ponto`);
    this.seized = true;
    unit.hasActed = true;
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
    this.phaseHeals = [];
    // Só a facção da vez fica "acinzentada" ao agir; as demais voltam ao normal.
    for (const u of this.livingUnits) u.hasActed = false;
    for (const u of this.unitsOf(this.phase)) {
      const pct = this.map.terrainAt(u.position).heal;
      if (pct > 0 && u.hp < u.maxHp) {
        const amount = u.heal(Math.max(1, Math.floor((u.maxHp * pct) / 100)));
        if (amount > 0) this.phaseHeals.push({ unit: u, amount });
      }
    }
    return this.phase;
  }
}
