import type { ClassDef } from './types';
import { stats } from './stats';

export const CLASSES: Record<string, ClassDef> = {
  // --- Jogáveis ---
  bearer: {
    id: 'bearer', name: 'Portador', move: 5, weaponTypes: ['sword'], sprite: 'unit_bearer', isLord: true,
    baseStats: stats(20, 6, 2, 6, 7, 6, 5, 2), growths: stats(75, 50, 15, 50, 50, 55, 35, 25),
  },
  swordfighter: {
    id: 'swordfighter', name: 'Espadachim', move: 5, weaponTypes: ['sword'], sprite: 'unit_swordfighter',
    baseStats: stats(18, 5, 0, 9, 10, 4, 3, 1), growths: stats(65, 40, 5, 60, 65, 40, 20, 20),
  },
  lancer: {
    id: 'lancer', name: 'Lanceiro', move: 4, weaponTypes: ['lance'], sprite: 'unit_lancer',
    baseStats: stats(24, 6, 0, 4, 2, 2, 10, 0), growths: stats(85, 50, 0, 35, 20, 25, 60, 10),
  },
  axefighter: {
    id: 'axefighter', name: 'Guerreira', move: 5, weaponTypes: ['axe'], sprite: 'unit_axefighter',
    baseStats: stats(26, 8, 0, 5, 5, 4, 5, 1), growths: stats(85, 55, 0, 40, 35, 35, 30, 15),
  },
  archer: {
    id: 'archer', name: 'Arqueiro', move: 5, weaponTypes: ['bow'], sprite: 'unit_archer',
    baseStats: stats(17, 5, 0, 7, 6, 3, 3, 1), growths: stats(65, 45, 0, 55, 45, 35, 20, 15),
  },
  cleric: {
    id: 'cleric', name: 'Clérigo', move: 5, weaponTypes: ['staff'], sprite: 'unit_cleric',
    baseStats: stats(16, 0, 5, 4, 6, 7, 1, 6), growths: stats(50, 5, 55, 40, 45, 60, 15, 55),
  },
  pyromancer: {
    id: 'pyromancer', name: 'Piromante', move: 5, weaponTypes: ['tome'], sprite: 'unit_pyromancer',
    baseStats: stats(16, 0, 6, 5, 5, 3, 2, 5), growths: stats(55, 5, 60, 45, 40, 30, 15, 45),
  },
  lightmage: {
    id: 'lightmage', name: 'Mago de Luz', move: 5, weaponTypes: ['light'], sprite: 'unit_lightmage',
    baseStats: stats(17, 0, 6, 6, 6, 6, 2, 6), growths: stats(50, 0, 55, 50, 45, 50, 15, 50),
  },
  // --- Inimigos ---
  bandit: {
    id: 'bandit', name: 'Bandido', move: 5, weaponTypes: ['axe'], sprite: 'unit_bandit',
    baseStats: stats(22, 5, 0, 2, 4, 0, 3, 0), growths: stats(80, 50, 0, 20, 30, 15, 20, 5),
  },
  hollow: {
    id: 'hollow', name: 'Esvaído', move: 4, weaponTypes: ['claw'], sprite: 'unit_hollow',
    baseStats: stats(28, 6, 0, 1, 2, 0, 2, 0), growths: stats(90, 45, 0, 10, 15, 0, 25, 0),
  },
  dusk_monk: {
    id: 'dusk_monk', name: 'Monge do Ocaso', move: 5, weaponTypes: ['dark', 'staff'], sprite: 'unit_dusk_monk',
    baseStats: stats(18, 0, 5, 4, 4, 1, 2, 5), growths: stats(55, 0, 50, 35, 30, 15, 20, 40),
  },
  inquisitor: {
    id: 'inquisitor', name: 'Inquisidor', move: 5, weaponTypes: ['dark', 'staff'], sprite: 'unit_inquisitor',
    baseStats: stats(30, 4, 9, 8, 8, 6, 5, 8), growths: stats(70, 20, 60, 50, 45, 40, 30, 50),
  },
  // --- Capítulo 2: novos aliados ---
  cavalier: {
    id: 'cavalier', name: 'Cavaleira', move: 7, weaponTypes: ['lance'], sprite: 'unit_cavalier', movement: 'mounted',
    baseStats: stats(22, 6, 0, 6, 7, 4, 6, 1), growths: stats(75, 45, 0, 45, 45, 35, 30, 15),
    promotesTo: 'paladin',
  },
  scout: {
    id: 'scout', name: 'Batedora', move: 6, weaponTypes: ['sword'], sprite: 'unit_scout',
    baseStats: stats(17, 4, 0, 8, 11, 8, 2, 2), growths: stats(60, 35, 5, 55, 70, 60, 15, 25),
    promotesTo: 'shadowblade',
  },
  // --- Capítulo 2: novos inimigos ---
  dusk_knight: {
    id: 'dusk_knight', name: 'Cavaleiro do Ocaso', move: 7, weaponTypes: ['lance'], sprite: 'unit_dusk_knight', movement: 'mounted',
    baseStats: stats(24, 6, 0, 5, 6, 2, 6, 2), growths: stats(75, 45, 0, 35, 35, 15, 30, 15),
  },
  ash_sentinel: {
    id: 'ash_sentinel', name: 'Sentinela Cinzenta', move: 4, weaponTypes: ['axe'], sprite: 'unit_ash_sentinel', movement: 'armored',
    baseStats: stats(30, 8, 0, 3, 1, 0, 12, 0), growths: stats(85, 50, 0, 25, 10, 5, 45, 5),
  },
};

/**
 * Classes promovidas (tier 2): reaproveitam o desenho da classe base com
 * ombreiras douradas. O bônus é somado aos atributos do herói ao promover.
 */
function promoted(baseId: string, id: string, name: string, move: number, bonus: ClassDef['baseStats']): ClassDef {
  const base = CLASSES[baseId];
  const baseStats = { ...base.baseStats };
  for (const k of Object.keys(baseStats) as (keyof typeof baseStats)[]) baseStats[k] += bonus[k];
  return {
    ...base, id, name, move, tier: 2, sprite: `unit_${id}`, artBase: baseId,
    promotesTo: undefined, promotionBonus: bonus, baseStats,
  };
}

for (const c of [
  promoted('bearer', 'sunlord', 'Lorde Solar', 6, stats(4, 2, 1, 2, 2, 1, 2, 2)),
  promoted('swordfighter', 'blademaster', 'Mestre de Lâminas', 6, stats(3, 2, 0, 2, 2, 0, 1, 1)),
  promoted('lancer', 'bastion', 'Baluarte', 5, stats(4, 2, 0, 1, 1, 0, 3, 2)),
  promoted('axefighter', 'berserker', 'Berserker', 6, stats(5, 3, 0, 1, 2, 0, 1, 1)),
  promoted('archer', 'sniper', 'Atiradora', 6, stats(3, 2, 0, 3, 2, 0, 1, 1)),
  promoted('cleric', 'bishop', 'Sacerdotisa', 6, stats(3, 0, 2, 1, 1, 0, 1, 3)),
  promoted('pyromancer', 'archmage', 'Arquimago', 6, stats(3, 0, 3, 1, 1, 0, 1, 2)),
  promoted('lightmage', 'dawnherald', 'Arauto da Aurora', 6, stats(3, 0, 2, 2, 1, 0, 1, 2)),
  promoted('cavalier', 'paladin', 'Paladina', 8, stats(3, 2, 0, 1, 1, 0, 2, 2)),
  promoted('scout', 'shadowblade', 'Lâmina Sombria', 7, stats(2, 2, 0, 2, 2, 1, 1, 1)),
]) {
  CLASSES[c.id] = c;
}

// Cada classe básica de herói promove para a sua versão avançada.
Object.assign(CLASSES.bearer, { promotesTo: 'sunlord' });
Object.assign(CLASSES.swordfighter, { promotesTo: 'blademaster' });
Object.assign(CLASSES.lancer, { promotesTo: 'bastion' });
Object.assign(CLASSES.axefighter, { promotesTo: 'berserker' });
Object.assign(CLASSES.archer, { promotesTo: 'sniper' });
Object.assign(CLASSES.cleric, { promotesTo: 'bishop' });
Object.assign(CLASSES.pyromancer, { promotesTo: 'archmage' });
Object.assign(CLASSES.lightmage, { promotesTo: 'dawnherald' });
