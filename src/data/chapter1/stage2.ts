import type { StageDef } from '../types';
import { DEFAULT_LEGEND } from '../terrain';

/** Fase 2 — A Ponte de Thornmere: tomar o portão de Grull do outro lado do rio. */
export const STAGE_2: StageDef = {
  id: 'c1s2',
  chapterId: 'c1',
  order: 2,
  name: 'A Ponte de Thornmere',
  objective: { kind: 'seize', description: 'Aren deve tomar o portão (leste)', x: 12, y: 4 },
  map: {
    rows: [
      'hff...~~..f.#..',
      'ff....~~....#..',
      'f..f..~~..h.#..',
      '......~~......F',
      '..====bb====G..',
      '......bb....#..',
      '..f...~~..f.#..',
      'f.....~~....#..',
      'ff.h..~~.f..#..',
      'hff...~~....#hh',
    ],
    legend: DEFAULT_LEGEND,
  },
  units: [
    { characterId: 'aren', faction: 'player', x: 1, y: 4, weaponId: 'ember_blade' },
    { characterId: 'mira', faction: 'player', x: 1, y: 5 },
    { characterId: 'hadric', faction: 'player', x: 2, y: 3 },
    { characterId: 'kaira', faction: 'player', x: 2, y: 5 },
    { characterId: 'grull', faction: 'enemy', x: 12, y: 4, ai: 'stationary', boss: true },
    { classId: 'bandit', weaponId: 'iron_axe', faction: 'enemy', x: 7, y: 4, level: 2, ai: 'stationary' },
    { classId: 'lancer', weaponId: 'iron_lance', faction: 'enemy', x: 7, y: 5, level: 2, ai: 'guard' },
    { classId: 'bandit', weaponId: 'iron_axe', faction: 'enemy', x: 9, y: 2, level: 2, ai: 'aggressive' },
    { classId: 'bandit', weaponId: 'hand_axe', faction: 'enemy', x: 9, y: 7, level: 2, ai: 'aggressive' },
    { classId: 'archer', weaponId: 'iron_bow', faction: 'enemy', x: 13, y: 2, level: 2, ai: 'stationary' },
    { classId: 'archer', weaponId: 'iron_bow', faction: 'enemy', x: 13, y: 6, level: 2, ai: 'stationary' },
  ],
  preDialogue: [
    { speakerId: 'narrator', side: 'left', text: 'Ao amanhecer, os três seguem a trilha de Grull até a ponte de Thornmere, a única travessia do rio em léguas.' },
    { speakerId: 'hadric', side: 'right', text: 'Aren. Tome isto. É a Lâmina de Brasa, a espada do último rei de Solmarch.' },
    { speakerId: 'aren', side: 'left', text: 'Do rei? Hadric, por que você guardaria a espada de um rei numa vila de pescadores?' },
    { speakerId: 'hadric', side: 'right', text: 'Porque um rei me pediu. E porque ela só arde na mão de quem carrega a Crista. Veja.' },
    { speakerId: 'mira', side: 'left', text: 'Ótimo, ela brilha. Agora: Grull está naquele portão com metade do vale de capangas. Algum plano?' },
    { speakerId: 'hadric', side: 'right', text: 'A ponte é estreita. Espadas vencem machados; minha lança cuida das lanças deles. Não deixem os arqueiros pegarem vocês em campo aberto.' },
  ],
  postDialogue: [
    { speakerId: 'mira', side: 'left', text: 'O portão é nosso. E o Grull... nem tão rasga-cercas assim, no fim das contas.' },
    { speakerId: 'kaira', side: 'left', text: 'E aquele portão era carvalho de lei. Quase dá pena de ter rachado.' },
    { speakerId: 'aren', side: 'left', text: 'Ele disse "a Ordem". Que Ordem, Hadric?' },
    { speakerId: 'hadric', side: 'right', text: 'A Ordem do Ocaso. Monges que pregam que o sol deve morrer. Eles caçam gente como você, Aren.' },
    { speakerId: 'hadric', side: 'right', text: 'Precisamos atravessar o Bosque dos Sussurros antes que eles nos achem. E rezar para que o bosque ainda tenha guardiã.' },
  ],
  events: [
    {
      id: 'c1s2-reinforcements',
      on: 'turnStart',
      turn: 4,
      spawns: [
        { classId: 'bandit', weaponId: 'iron_axe', faction: 'enemy', x: 9, y: 0, level: 2, ai: 'aggressive' },
        { classId: 'bandit', weaponId: 'iron_axe', faction: 'enemy', x: 9, y: 9, level: 2, ai: 'aggressive' },
      ],
      dialogue: [
        { speakerId: 'grull', side: 'right', text: 'Mais gente pra cerca! Peguem o garoto da mão acesa — a Ordem paga por ele inteiro!' },
      ],
    },
    {
      id: 'c1s2-grull',
      on: 'unitDefeated',
      unitId: 'grull',
      spawns: [],
      dialogue: [
        { speakerId: 'grull', side: 'right', text: 'Grr... a Ordem me prometeu... ouro... não me falou que a brasa... queimava tanto...' },
        { speakerId: 'narrator', side: 'left', text: 'Com Grull caído, os bandidos restantes hesitam. O portão está aberto — basta Aren tomá-lo.' },
      ],
    },
  ],
};
