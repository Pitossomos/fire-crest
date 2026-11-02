import { describe, expect, it } from 'vitest';
import { ALL_TEMPLATES, drawTerrain, drawUnit } from '../src/render/art';
import { DB } from '../src/data';

describe('pixel-art procedural', () => {
  it('todos os templates têm 16 colunas e no máximo 16 linhas', () => {
    for (const [name, rows] of Object.entries(ALL_TEMPLATES)) {
      expect(rows.length, name).toBeLessThanOrEqual(16);
      for (const row of rows) expect(row.length, `${name}: "${row}"`).toBe(16);
    }
  });

  it('todo terreno tem arte (não cai no magenta)', () => {
    for (const id of Object.keys(DB.terrain)) {
      expect(drawTerrain(id, 0).get(8, 8), id).not.toBe('#ff00ff');
    }
  });

  it('gera sprite para toda combinação classe × arma × facção', () => {
    for (const cls of Object.values(DB.classes)) {
      for (const faction of ['player', 'enemy', 'ally'] as const) {
        const art = drawUnit({ classId: cls.id, weaponType: cls.weaponTypes[0], faction });
        expect(art.get(7, 4), cls.id).not.toBeNull(); // rosto
      }
    }
  });
});
