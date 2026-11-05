import type { CharacterDef } from './types';
import { stats } from './stats';

export const CHARACTERS: Record<string, CharacterDef> = {
  // --- Heróis ---
  aren: {
    id: 'aren', hair: '#5fb4ff', name: 'Aren Valdris', title: 'Vigia de Brasalva', classId: 'bearer', level: 1,
    stats: stats(22, 6, 2, 6, 7, 6, 6, 2), growths: stats(75, 50, 15, 50, 50, 55, 35, 25),
    weaponId: 'iron_sword', items: ['potion'],
    bio: 'Jovem vigia da vila fronteiriça de Brasalva. A Crista de Fogo despertou em sua mão na noite do ataque.',
  },
  mira: {
    id: 'mira', hair: '#a05ad8', name: 'Mira Tolven', title: 'Mercenária', classId: 'swordfighter', level: 2,
    stats: stats(20, 5, 0, 10, 11, 5, 4, 1), growths: stats(60, 40, 5, 60, 65, 45, 20, 25),
    weaponId: 'iron_sword', items: ['potion'],
    bio: 'Amiga de infância de Aren. Endividada até o pescoço, sarcástica e leal até o fim.',
  },
  hadric: {
    id: 'hadric', hair: '#ecebf2', name: 'Sir Hadric Moor', title: 'Guardião do Farol', classId: 'lancer', level: 5,
    stats: stats(28, 9, 0, 6, 4, 4, 12, 2), growths: stats(60, 30, 0, 25, 15, 20, 35, 10),
    weaponId: 'iron_lance', items: ['potion'],
    bio: 'O último cavaleiro do Farol de Brasalva. Sabe mais sobre a origem de Aren do que admite.',
  },
  kaira: {
    id: 'kaira', hair: '#4fc96a', name: 'Kaira Forjaluz', title: 'Ferreira de Brasalva', classId: 'axefighter', level: 2,
    stats: stats(27, 8, 0, 6, 6, 4, 6, 1), growths: stats(85, 55, 0, 40, 35, 35, 30, 15),
    weaponId: 'iron_axe', items: ['potion'],
    bio: 'Ferreira de Brasalva, braços largos e pavio curto. Protege Aren como a um irmão mais novo — e jura que foi ela quem amolou a Lâmina de Brasa.',
  },
  ilian: {
    id: 'ilian', hair: '#ffb02e', name: 'Ilian Solvarr', title: 'Guardião do Santuário', classId: 'lightmage', level: 2,
    stats: stats(18, 0, 7, 7, 7, 7, 2, 7), growths: stats(50, 0, 55, 50, 45, 50, 15, 50),
    weaponId: 'sun_tome', items: ['potion'],
    bio: 'Último guardião de um santuário do sol à beira da ponte de Thornmere. Guarda as orações de luz que a Ordem do Ocaso tenta apagar.',
  },
  wren: {
    id: 'wren', hair: '#6f8f3a', name: 'Wren', title: 'Caçadora do Bosque', classId: 'archer', level: 3,
    stats: stats(19, 6, 0, 9, 8, 5, 4, 2), growths: stats(60, 45, 0, 60, 50, 40, 20, 15),
    weaponId: 'iron_bow', items: ['potion'],
    bio: 'Órfã do Bosque dos Sussurros. Perdeu a família para os Esvaídos e não erra uma flecha por raiva.',
  },
  lys: {
    id: 'lys', hair: '#a8dcff', name: 'Irmã Lys', title: 'Desertora do Ocaso', classId: 'cleric', level: 2,
    stats: stats(17, 0, 6, 5, 7, 9, 1, 8), growths: stats(50, 5, 55, 40, 45, 65, 15, 60),
    weaponId: 'heal_staff', items: ['potion'],
    bio: 'Noviça que fugiu da Ordem do Ocaso depois de ver o que fazem com os portadores da Crista.',
  },
  corvin: {
    id: 'corvin', hair: '#5a2d8c', name: 'Corvin Ash', title: 'Alquimista', classId: 'pyromancer', level: 4,
    stats: stats(19, 0, 8, 7, 6, 4, 3, 7), growths: stats(55, 5, 60, 45, 40, 30, 15, 45),
    weaponId: 'fire_tome', items: ['elixir'],
    bio: 'Estudioso excêntrico que tenta replicar a Crista com alquimia. Já explodiu três laboratórios.',
  },
  brielle: {
    id: 'brielle', hair: '#e8443a', name: 'Ser Brielle Ventor', title: 'Cavaleira de Solmarch', classId: 'cavalier', level: 5,
    stats: stats(26, 8, 0, 8, 9, 5, 8, 2), growths: stats(75, 45, 0, 45, 45, 35, 30, 15),
    weaponId: 'iron_lance', items: ['potion'],
    bio: 'Última cavaleira de uma patrulha de Solmarch. Filha de Gerold Ventor, velho companheiro de armas de Hadric. Teimosa, honrada e rápida demais para o próprio bem.',
  },
  sorrel: {
    id: 'sorrel', hair: '#ff7ac8', name: 'Sorrel', title: 'Contrabandista do Pântano', classId: 'scout', level: 5,
    stats: stats(21, 6, 0, 10, 14, 10, 3, 3), growths: stats(60, 35, 5, 55, 70, 60, 15, 25),
    weaponId: 'iron_sword', items: ['potion'],
    bio: 'Conhece cada trilha seca do Pântano de Vessa. Deve dinheiro a metade do vale — inclusive à Mira, com quem dividiu muitas dívidas e algumas fugas.',
  },
  // --- Antagonistas ---
  grull: {
    id: 'grull', villain: true, name: 'Grull', title: 'o Rasga-Cercas', classId: 'bandit', level: 5,
    stats: stats(30, 10, 0, 4, 5, 2, 5, 1), growths: stats(80, 50, 0, 20, 30, 15, 20, 5),
    weaponId: 'iron_axe',
    bio: 'Chefe bandido contratado pela Ordem do Ocaso para "limpar" o vale.',
  },
  vela: {
    id: 'vela', villain: true, name: 'Vela Mortiça', title: 'Guardiã Esvaída', classId: 'hollow', level: 6,
    stats: stats(36, 10, 0, 3, 3, 0, 4, 2), growths: stats(90, 45, 0, 10, 15, 0, 25, 0),
    weaponId: 'claws',
    bio: 'Já foi a guardiã do Bosque dos Sussurros. O Cinzento levou suas memórias, mas não seu posto.',
  },
  brom: {
    id: 'brom', villain: true, name: 'Brom', title: 'o Capanga', classId: 'bandit', level: 3,
    stats: stats(24, 7, 0, 3, 5, 1, 4, 0), growths: stats(80, 50, 0, 20, 30, 15, 20, 5),
    weaponId: 'hand_axe',
    bio: 'Braço direito de Grull. Fala alto, bate mais alto ainda.',
  },
  morvane: {
    id: 'morvane', villain: true, name: 'Abade Morvane', title: 'Carcereiro de Cinzaforte', classId: 'dusk_monk', level: 7,
    stats: stats(30, 0, 10, 7, 5, 3, 5, 8), growths: stats(55, 0, 50, 35, 30, 15, 20, 40),
    weaponId: 'sleep_psalm',
    bio: 'Abade da Ordem do Ocaso. Transformou a velha fortaleza de Cinzaforte em prisão para os "impuros".',
  },
  draven: {
    id: 'draven', villain: true, name: 'Comandante Draven', title: 'Lança do Ocaso', classId: 'dusk_knight', level: 9,
    stats: stats(38, 13, 0, 9, 9, 4, 12, 4), growths: stats(75, 45, 0, 35, 35, 15, 30, 15),
    weaponId: 'steel_lance',
    bio: 'Comandante dos Cavaleiros do Ocaso. Já foi cavaleiro de Solmarch; trocou de lado quando o último rei caiu.',
  },
  warden: {
    id: 'warden', villain: true, name: 'Guardião Afogado', title: 'Sentinela de Brasa Morta', classId: 'ash_sentinel', level: 8,
    stats: stats(42, 13, 0, 6, 3, 0, 15, 1), growths: stats(85, 50, 0, 25, 10, 5, 45, 5),
    weaponId: 'steel_axe',
    bio: 'Uma armadura antiga do Farol de Vessa, animada pelo Cinzento. Guarda a ponte de pedra do pântano há décadas.',
  },
  malachar: {
    id: 'malachar', villain: true, name: 'Arquidiácono Malachar', title: 'Senhor de Vessaria', classId: 'inquisitor', level: 10,
    stats: stats(44, 6, 14, 12, 9, 8, 9, 13), growths: stats(70, 20, 60, 50, 45, 40, 30, 50),
    weaponId: 'eclipse_tome',
    bio: 'Governa Vessaria em nome do Grão-Hierofante. Foi ele quem apagou o Farol de Vessa e transformou a catedral do sol em templo do Ocaso.',
  },
  seraphine: {
    id: 'seraphine', villain: true, name: 'Seraphine Vael', title: 'Inquisidora do Ocaso', classId: 'inquisitor', level: 10,
    stats: stats(34, 6, 10, 11, 10, 8, 6, 10), growths: stats(70, 20, 60, 50, 45, 40, 30, 50),
    weaponId: 'ash_rosary',
    bio: 'Caçadora de portadores. Veste o hábito do Grande Esquema bordado com caveiras e um sol eclipsado.',
  },
};

/** Id especial para falas do narrador (não é um personagem). */
export const NARRATOR_ID = 'narrator';
