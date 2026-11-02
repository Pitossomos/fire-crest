import type { CharacterDef } from './types';
import { stats } from './stats';

export const CHARACTERS: Record<string, CharacterDef> = {
  // --- Heróis ---
  aren: {
    id: 'aren', name: 'Aren Valdris', title: 'Vigia de Brasalva', classId: 'bearer', level: 1,
    stats: stats(20, 6, 2, 6, 7, 6, 5, 2), growths: stats(75, 50, 15, 50, 50, 55, 35, 25),
    weaponId: 'iron_sword',
    bio: 'Jovem vigia da vila fronteiriça de Brasalva. A Crista de Fogo despertou em sua mão na noite do ataque.',
  },
  mira: {
    id: 'mira', name: 'Mira Tolven', title: 'Mercenária', classId: 'swordfighter', level: 2,
    stats: stats(19, 5, 0, 10, 11, 5, 3, 1), growths: stats(60, 40, 5, 60, 65, 45, 20, 25),
    weaponId: 'iron_sword',
    bio: 'Amiga de infância de Aren. Endividada até o pescoço, sarcástica e leal até o fim.',
  },
  hadric: {
    id: 'hadric', name: 'Sir Hadric Moor', title: 'Guardião do Farol', classId: 'lancer', level: 5,
    stats: stats(28, 9, 0, 6, 4, 4, 12, 2), growths: stats(60, 30, 0, 25, 15, 20, 35, 10),
    weaponId: 'iron_lance',
    bio: 'O último cavaleiro do Farol de Brasalva. Sabe mais sobre a origem de Aren do que admite.',
  },
  wren: {
    id: 'wren', name: 'Wren', title: 'Caçadora do Bosque', classId: 'archer', level: 3,
    stats: stats(19, 6, 0, 9, 8, 5, 4, 2), growths: stats(60, 45, 0, 60, 50, 40, 20, 15),
    weaponId: 'iron_bow',
    bio: 'Órfã do Bosque dos Sussurros. Perdeu a família para os Esvaídos e não erra uma flecha por raiva.',
  },
  lys: {
    id: 'lys', name: 'Irmã Lys', title: 'Desertora do Ocaso', classId: 'cleric', level: 2,
    stats: stats(17, 0, 6, 5, 7, 9, 1, 8), growths: stats(50, 5, 55, 40, 45, 65, 15, 60),
    weaponId: 'heal_staff',
    bio: 'Noviça que fugiu da Ordem do Ocaso depois de ver o que fazem com os portadores da Crista.',
  },
  corvin: {
    id: 'corvin', name: 'Corvin Ash', title: 'Alquimista', classId: 'pyromancer', level: 4,
    stats: stats(19, 0, 8, 7, 6, 4, 3, 7), growths: stats(55, 5, 60, 45, 40, 30, 15, 45),
    weaponId: 'fire_tome',
    bio: 'Estudioso excêntrico que tenta replicar a Crista com alquimia. Já explodiu três laboratórios.',
  },
  // --- Antagonistas ---
  grull: {
    id: 'grull', name: 'Grull', title: 'o Rasga-Cercas', classId: 'bandit', level: 5,
    stats: stats(30, 10, 0, 4, 5, 2, 5, 1), growths: stats(80, 50, 0, 20, 30, 15, 20, 5),
    weaponId: 'iron_axe',
    bio: 'Chefe bandido contratado pela Ordem do Ocaso para "limpar" o vale.',
  },
  vela: {
    id: 'vela', name: 'Vela Mortiça', title: 'Guardiã Esvaída', classId: 'hollow', level: 6,
    stats: stats(36, 10, 0, 3, 3, 0, 4, 2), growths: stats(90, 45, 0, 10, 15, 0, 25, 0),
    weaponId: 'claws',
    bio: 'Já foi a guardiã do Bosque dos Sussurros. O Cinzento levou suas memórias, mas não seu posto.',
  },
  seraphine: {
    id: 'seraphine', name: 'Seraphine Vael', title: 'Inquisidora do Ocaso', classId: 'inquisitor', level: 10,
    stats: stats(38, 6, 13, 11, 11, 8, 7, 12), growths: stats(70, 20, 60, 50, 45, 40, 30, 50),
    weaponId: 'ash_rosary',
    bio: 'Caçadora de portadores. Veste o hábito do Grande Esquema bordado com caveiras e um sol eclipsado.',
  },
};

/** Id especial para falas do narrador (não é um personagem). */
export const NARRATOR_ID = 'narrator';
