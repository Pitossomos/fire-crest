import type { MapDef, TerrainDef } from '../data/types';
import type { Point } from './grid';

/** Grade de terrenos de uma fase, construída a partir de um MapDef em texto. */
export class BattleMap {
  readonly width: number;
  readonly height: number;
  private readonly tiles: TerrainDef[][];

  constructor(def: MapDef, terrain: Record<string, TerrainDef>) {
    if (def.rows.length === 0) throw new Error('Mapa vazio');
    this.height = def.rows.length;
    this.width = def.rows[0].length;
    this.tiles = def.rows.map((row, y) => {
      if (row.length !== this.width) {
        throw new Error(`Linha ${y} do mapa tem ${row.length} colunas (esperado ${this.width})`);
      }
      return [...row].map((ch, x) => {
        const terrainId = def.legend[ch];
        const t = terrainId !== undefined ? terrain[terrainId] : undefined;
        if (!t) throw new Error(`Terreno desconhecido "${ch}" em (${x},${y})`);
        return t;
      });
    });
  }

  inBounds(p: Point): boolean {
    return p.x >= 0 && p.y >= 0 && p.x < this.width && p.y < this.height;
  }

  terrainAt(p: Point): TerrainDef {
    if (!this.inBounds(p)) throw new Error(`Fora do mapa: (${p.x},${p.y})`);
    return this.tiles[p.y][p.x];
  }

  /** Custo para entrar no tile; `null` se intransponível ou fora do mapa. */
  moveCost(p: Point): number | null {
    return this.inBounds(p) ? this.terrainAt(p).moveCost : null;
  }
}
