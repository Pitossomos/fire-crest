import { describe, expect, it } from 'vitest';
import { ALL_TEMPLATES, drawTerrain, drawUnit } from '../src/render/art';
import { artSpecFor } from '../src/render/textures';
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
        const art = drawUnit(artSpecFor(cls, cls.weaponTypes[0], faction));
        expect(art.get(7, 4), cls.id).not.toBeNull(); // rosto
      }
    }
  });

  it('cabelo colorido do personagem substitui o castanho padrão', () => {
    const spec = { classId: 'axefighter', weaponType: 'axe', faction: 'player' as const };
    const plain = drawUnit(spec);
    const green = drawUnit({ ...spec, hair: '#4fc96a' });
    // (5,2) é cabelo no topo da cabeça da Guerreira.
    expect(plain.get(5, 2)).toBe('#8a4a2a');
    expect(green.get(5, 2)).toBe('#4fc96a');
  });

  it('todos os heróis têm cor de cabelo e ela aparece no sprite', () => {
    for (const id of ['aren', 'mira', 'hadric', 'kaira', 'ilian', 'wren', 'lys', 'corvin']) {
      const ch = DB.characters[id];
      expect(ch.hair, id).toMatch(/^#[0-9a-f]{6}$/i);
      const cls = DB.classes[ch.classId];
      const art = drawUnit({ classId: cls.id, weaponType: DB.weapons[ch.weaponId].type, faction: 'player', hair: ch.hair });
      let found = false;
      for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) if (art.get(x, y) === ch.hair) found = true;
      expect(found, `${id} deveria mostrar o cabelo`).toBe(true);
    }
  });
});
