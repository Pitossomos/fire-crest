import { describe, expect, it } from 'vitest';
import { manhattan, neighbors, parseKey, pointKey, tilesInRange } from '../src/core/grid';

describe('grid', () => {
  it('calcula distância de Manhattan', () => {
    expect(manhattan({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(7);
  });

  it('retorna 4 vizinhos ortogonais', () => {
    expect(neighbors({ x: 2, y: 2 })).toHaveLength(4);
  });

  it('converte chave ida e volta', () => {
    expect(parseKey(pointKey({ x: 5, y: 9 }))).toEqual({ x: 5, y: 9 });
  });

  it('gera anel de alcance 2–2 (arco) com 8 tiles', () => {
    expect(tilesInRange({ x: 0, y: 0 }, 2, 2)).toHaveLength(8);
    expect(tilesInRange({ x: 0, y: 0 }, 1, 2)).toHaveLength(12);
  });
});
