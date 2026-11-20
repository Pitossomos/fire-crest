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
  },
  scout: {
    id: 'scout', name: 'Batedora', move: 6, weaponTypes: ['sword'], sprite: 'unit_scout',
    baseStats: stats(17, 4, 0, 8, 11, 8, 2, 2), growths: stats(60, 35, 5, 55, 70, 60, 15, 25),
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

/**
 * Classes mestras (tier 3): cada classe promovida escolhe um de dois caminhos.
 * Muitas ganham um segundo tipo de arma — o que dá uso às armas do baú.
 */
function master(
  fromId: string, id: string, name: string, move: number, bonus: ClassDef['baseStats'],
  weaponTypes: ClassDef['weaponTypes'], blurb: string,
): ClassDef {
  const from = CLASSES[fromId];
  const baseStats = { ...from.baseStats };
  for (const k of Object.keys(baseStats) as (keyof typeof baseStats)[]) baseStats[k] += bonus[k];
  return {
    ...from, id, name, move, tier: 3, sprite: `unit_${id}`, artBase: from.artBase ?? fromId,
    weaponTypes, blurb, promotesTo: undefined, promotionBonus: bonus, baseStats,
  };
}

// Linhas que vestem armaduras pesadas (os promovidos herdam).
Object.assign(CLASSES.lancer, { heavyArmor: true });
Object.assign(CLASSES.axefighter, { heavyArmor: true });

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

for (const c of [
  master('sunlord', 'solar_king', 'Rei Solar', 7, stats(4, 3, 0, 2, 1, 1, 3, 2), ['sword', 'lance'], 'Comandante: espada e lança, defesa sólida.'),
  master('sunlord', 'crest_avatar', 'Avatar da Crista', 7, stats(3, 1, 4, 2, 2, 1, 1, 3), ['sword', 'light'], 'A Crista desperta: espada e magia de luz.'),
  master('blademaster', 'sword_saint', 'Santo da Espada', 7, stats(3, 3, 0, 4, 2, 1, 1, 1), ['sword'], 'Golpes certeiros: muita FOR e HAB.'),
  master('blademaster', 'blade_dancer', 'Dançarina das Lâminas', 7, stats(2, 1, 0, 2, 4, 3, 1, 1), ['sword'], 'Rápida como o vento: VEL e SOR altíssimas.'),
  master('bastion', 'living_wall', 'Muralha Viva', 5, stats(5, 2, 0, 1, 0, 0, 5, 1), ['lance', 'axe'], 'Defesa quase impenetrável; lança e machado.'),
  master('bastion', 'grand_paladin', 'Grão-Paladino', 6, stats(4, 2, 0, 2, 2, 1, 2, 4), ['lance', 'sword'], 'Equilíbrio: lança e espada, boa RES.'),
  master('berserker', 'warlady', 'Senhora da Guerra', 6, stats(5, 3, 0, 2, 1, 0, 3, 1), ['axe', 'sword'], 'Machado e espada, muito resistente.'),
  master('berserker', 'red_fury', 'Fúria Rubra', 7, stats(4, 4, 0, 1, 3, 0, 0, 0), ['axe'], 'Força bruta e velocidade.'),
  master('sniper', 'hawkeye', 'Olho de Falcão', 6, stats(2, 2, 0, 4, 2, 2, 1, 1), ['bow'], 'Precisão e críticos com o arco.'),
  master('sniper', 'ranger', 'Guarda-Florestal', 7, stats(3, 2, 0, 2, 2, 1, 1, 1), ['bow', 'sword'], 'Arco e espada; anda longe.'),
  master('bishop', 'oracle', 'Oráculo', 6, stats(3, 0, 3, 2, 1, 1, 1, 3), ['staff', 'light'], 'Cura e ataca com magia de luz.'),
  master('bishop', 'dawn_saint', 'Santa da Aurora', 6, stats(4, 0, 4, 1, 1, 2, 1, 4), ['staff'], 'Curas fortíssimas e muita RES.'),
  master('archmage', 'flame_lord', 'Senhor das Chamas', 6, stats(3, 0, 5, 2, 1, 0, 1, 2), ['tome'], 'Magia de fogo devastadora.'),
  master('archmage', 'arcane_sage', 'Sábio Arcano', 6, stats(3, 0, 3, 2, 2, 1, 1, 3), ['tome', 'light'], 'Fogo e luz: eficaz contra o Ocaso.'),
  master('dawnherald', 'dawn_blade', 'Lâmina da Alvorada', 7, stats(4, 3, 2, 2, 2, 0, 2, 1), ['light', 'sword'], 'Luz e espada na linha de frente.'),
  master('dawnherald', 'sun_prophet', 'Profeta Solar', 6, stats(3, 0, 4, 2, 1, 1, 1, 3), ['light', 'staff'], 'Magia de luz e cura.'),
  master('paladin', 'sky_knight', 'Cavaleira Celeste', 8, stats(3, 2, 0, 2, 3, 1, 2, 1), ['lance', 'sword'], 'Montaria veloz: lança e espada.'),
  master('paladin', 'sun_valkyrie', 'Valquíria Solar', 8, stats(3, 1, 3, 1, 2, 1, 1, 3), ['lance', 'light'], 'Montada, com magia de luz.'),
  master('shadowblade', 'assassin', 'Assassina', 7, stats(2, 3, 0, 3, 3, 1, 0, 1), ['sword'], 'Ataques letais e certeiros.'),
  master('shadowblade', 'wanderer', 'Andarilha', 8, stats(3, 2, 0, 2, 2, 2, 1, 1), ['sword', 'bow'], 'Espada e arco; a que mais anda.'),
]) {
  CLASSES[c.id] = c;
}

// Árvore de promoção: tier 1 → tier 2 (um destino) → tier 3 (dois caminhos).
const TREE: Record<string, string[]> = {
  bearer: ['sunlord'], swordfighter: ['blademaster'], lancer: ['bastion'], axefighter: ['berserker'],
  archer: ['sniper'], cleric: ['bishop'], pyromancer: ['archmage'], lightmage: ['dawnherald'],
  cavalier: ['paladin'], scout: ['shadowblade'],
  sunlord: ['solar_king', 'crest_avatar'], blademaster: ['sword_saint', 'blade_dancer'],
  bastion: ['living_wall', 'grand_paladin'], berserker: ['warlady', 'red_fury'],
  sniper: ['hawkeye', 'ranger'], bishop: ['oracle', 'dawn_saint'], archmage: ['flame_lord', 'arcane_sage'],
  dawnherald: ['dawn_blade', 'sun_prophet'], paladin: ['sky_knight', 'sun_valkyrie'],
  shadowblade: ['assassin', 'wanderer'],
};
for (const [from, to] of Object.entries(TREE)) CLASSES[from].promotesTo = to;
