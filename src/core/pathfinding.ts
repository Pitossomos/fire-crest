import { type Point, neighbors, parseKey, pointKey, tilesInRange } from './grid';
import type { BattleMap } from './battle-map';
import type { Unit } from './unit';
import { areHostile } from './faction';

/** Nó do resultado do Dijkstra: custo acumulado e tile anterior no caminho. */
export interface ReachNode {
  point: Point;
  cost: number;
  prev: string | null;
}

export type Occupancy = (p: Point) => Unit | undefined;

/**
 * Dijkstra a partir da posição da unidade, limitado pelo seu movimento.
 * A unidade atravessa aliados, mas não inimigos nem terrenos intransponíveis.
 * O resultado inclui tiles ocupados por aliados (podem ser atravessados,
 * mas não são destinos válidos — ver `movementTiles`).
 */
export function computeReach(map: BattleMap, unit: Unit, occupancy: Occupancy): Map<string, ReachNode> {
  const start = unit.position;
  const reach = new Map<string, ReachNode>();
  reach.set(pointKey(start), { point: start, cost: 0, prev: null });
  // Fila de prioridade simples: mapas pequenos (≤ 30×30) não justificam um heap.
  const open: ReachNode[] = [reach.get(pointKey(start))!];

  while (open.length > 0) {
    open.sort((a, b) => a.cost - b.cost);
    const current = open.shift()!;
    if (current.cost > (reach.get(pointKey(current.point))?.cost ?? Infinity)) continue;

    for (const next of neighbors(current.point)) {
      const step = map.moveCost(next);
      if (step === null) continue;
      const occupant = occupancy(next);
      if (occupant && occupant !== unit && areHostile(occupant.faction, unit.faction)) continue;
      const cost = current.cost + step;
      if (cost > unit.move) continue;
      const key = pointKey(next);
      const known = reach.get(key);
      if (known && known.cost <= cost) continue;
      const node: ReachNode = { point: next, cost, prev: pointKey(current.point) };
      reach.set(key, node);
      open.push(node);
    }
  }
  return reach;
}

/** Destinos válidos: alcançáveis e livres (ou a própria posição). */
export function movementTiles(reach: Map<string, ReachNode>, unit: Unit, occupancy: Occupancy): Point[] {
  const out: Point[] = [];
  for (const node of reach.values()) {
    const occupant = occupancy(node.point);
    if (!occupant || occupant === unit) out.push(node.point);
  }
  return out;
}

/** Tiles que a unidade pode atingir com a arma a partir de qualquer destino (excluindo os próprios destinos). */
export function attackTiles(map: BattleMap, destinations: Point[], minRange: number, maxRange: number): Point[] {
  const dest = new Set(destinations.map(pointKey));
  const out = new Map<string, Point>();
  for (const d of destinations) {
    for (const t of tilesInRange(d, minRange, maxRange)) {
      const key = pointKey(t);
      if (map.inBounds(t) && !dest.has(key)) out.set(key, t);
    }
  }
  return [...out.values()];
}

/** Reconstrói o caminho (início → destino) a partir do resultado do Dijkstra. */
export function buildPath(reach: Map<string, ReachNode>, target: Point): Point[] {
  const path: Point[] = [];
  let key: string | null = pointKey(target);
  if (!reach.has(key)) return path;
  while (key !== null) {
    const node: ReachNode = reach.get(key)!;
    path.unshift(parseKey(key));
    key = node.prev;
  }
  return path;
}
