import { describe, expect, it } from 'vitest';
import { DB } from '../src/data';
import { NARRATOR_ID } from '../src/data/characters';

describe('integridade dos dados', () => {
  it('toda referência de personagem aponta para classe e arma existentes e compatíveis', () => {
    for (const ch of Object.values(DB.characters)) {
      const cls = DB.classes[ch.classId];
      const weapon = DB.weapons[ch.weaponId];
      expect(cls, ch.id).toBeDefined();
      expect(weapon, ch.id).toBeDefined();
      expect(cls.weaponTypes, ch.id).toContain(weapon.type);
    }
  });

  it('falas das fases usam personagens existentes', () => {
    for (const stage of Object.values(DB.stages)) {
      for (const line of [...stage.preDialogue, ...stage.postDialogue]) {
        expect(line.speakerId === NARRATOR_ID || line.speakerId in DB.characters, line.speakerId).toBe(true);
      }
    }
  });
});
