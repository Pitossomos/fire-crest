/** Coordenada de tile na grade. */
export interface Point {
  x: number;
  y: number;
}

/** Chave estável "x,y" para usar em Map/Set. */
export function pointKey(p: Point): string {
  return `${p.x},${p.y}`;
}

export function parseKey(key: string): Point {
  const [x, y] = key.split(',').map(Number);
  return { x, y };
}

export function samePoint(a: Point, b: Point): boolean {
  return a.x === b.x && a.y === b.y;
}

/** Distância de Manhattan (grade com 4 direções). */
export function manhattan(a: Point, b: Point): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

const DIRS: readonly Point[] = [
  { x: 0, y: -1 },
  { x: 1, y: 0 },
  { x: 0, y: 1 },
  { x: -1, y: 0 },
];

/** Vizinhos ortogonais (não verifica limites). */
export function neighbors(p: Point): Point[] {
  return DIRS.map((d) => ({ x: p.x + d.x, y: p.y + d.y }));
}

/** Todos os tiles a uma distância entre min e max de `p` (losango). */
export function tilesInRange(p: Point, min: number, max: number): Point[] {
  const out: Point[] = [];
  for (let dy = -max; dy <= max; dy++) {
    for (let dx = -max; dx <= max; dx++) {
      const d = Math.abs(dx) + Math.abs(dy);
      if (d >= min && d <= max) out.push({ x: p.x + dx, y: p.y + dy });
    }
  }
  return out;
}
