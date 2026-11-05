import type { StageDef, UnitPlacement } from '../types';
import { DEFAULT_LEGEND } from '../terrain';

const knight = (x: number, y: number, level = 7): UnitPlacement => ({
  classId: 'dusk_knight', weaponId: 'iron_lance', faction: 'enemy', x, y, level, ai: 'aggressive',
});

/** Cap. 2, Fase 3 — As Muralhas de Vessaria: tomar o portão de Draven. */
export const C2_STAGE_3: StageDef = {
  id: 'c2s3',
  chapterId: 'c2',
  order: 3,
  name: 'As Muralhas de Vessaria',
  objective: { kind: 'seize', description: 'Aren deve tomar o portão da cidade (leste)', x: 19, y: 7 },
  map: {
    rows: [
      '.ff.......~~...f...#,,,,',
      '.f....ff..~~......F#,,,,',
      '..........~~......F#,HH,',
      '==========bb======.#,,,,',
      '....=.....~~.....=.#,,,,',
      '....=.....~~.....=.#,,,,',
      'ff..=.hh..~~.ff..=.#,,,,',
      '....=..h..~~..f..==G,,,,',
      '....=.....~~.....=.#,,,,',
      '....=.....~~.....=.#,,,,',
      '==========bb======.#,,,,',
      '..........~~......F#,HH,',
      '..ff...f..~~..hh..F#,,,,',
      '........f.~~.f.....#,,,,',
    ],
    legend: DEFAULT_LEGEND,
  },
  units: [
    { characterId: 'aren', faction: 'player', x: 1, y: 7 },
    { characterId: 'mira', faction: 'player', x: 1, y: 6 },
    { characterId: 'hadric', faction: 'player', x: 2, y: 7 },
    { characterId: 'kaira', faction: 'player', x: 2, y: 8 },
    { characterId: 'ilian', faction: 'player', x: 0, y: 7 },
    { characterId: 'wren', faction: 'player', x: 0, y: 8 },
    { characterId: 'lys', faction: 'player', x: 1, y: 8 },
    { characterId: 'corvin', faction: 'player', x: 0, y: 9 },
    { characterId: 'brielle', faction: 'player', x: 1, y: 9 },
    { characterId: 'sorrel', faction: 'player', x: 2, y: 9 },
    { characterId: 'draven', faction: 'enemy', x: 19, y: 7, ai: 'stationary', boss: true },
    { classId: 'archer', weaponId: 'iron_bow', faction: 'enemy', x: 18, y: 1, level: 7, ai: 'stationary' },
    { classId: 'archer', weaponId: 'iron_bow', faction: 'enemy', x: 18, y: 12, level: 7, ai: 'stationary' },
    { classId: 'ash_sentinel', weaponId: 'iron_axe', faction: 'enemy', x: 11, y: 3, level: 7, ai: 'stationary' },
    { classId: 'ash_sentinel', weaponId: 'iron_axe', faction: 'enemy', x: 11, y: 10, level: 7, ai: 'stationary' },
    knight(15, 5), knight(15, 9),
    { classId: 'dusk_monk', weaponId: 'sleep_psalm', faction: 'enemy', x: 16, y: 7, level: 7, ai: 'guard' },
    { classId: 'bandit', weaponId: 'steel_axe', faction: 'enemy', x: 7, y: 1, level: 7, ai: 'aggressive' },
  ],
  rewardSeals: 1,
  preDialogue: [
    { speakerId: 'narrator', side: 'left', text: 'Vessaria ergue-se além do rio, cercada por muralhas brancas manchadas de fuligem. No alto, o Farol de Vessa: escuro.' },
    { speakerId: 'draven', side: 'right', text: 'Ventor. Hadric. E o bastardo do rei. Que reunião comovente — para um velório.' },
    { speakerId: 'brielle', side: 'left', text: 'Draven! Você jurou a mesma bandeira que meu pai. Como pôde?' },
    { speakerId: 'draven', side: 'right', text: 'Jurei a um rei. O rei morreu. O sol está morrendo. Eu escolhi o lado que vai sobrar.' },
    { speakerId: 'hadric', side: 'left', text: 'As pontes são estreitas e guardadas por Sentinelas. Magia passa pela armadura delas como faca na manteiga, Corvin.' },
    { speakerId: 'kaira', side: 'left', text: 'E o portão? Deixa comigo. Já rachei portões mais bonitos que esse.' },
  ],
  postDialogue: [
    { speakerId: 'brielle', side: 'left', text: 'Draven caiu. Que a lança dele descanse onde a honra dele já descansava faz tempo.' },
    { speakerId: 'sorrel', side: 'right', text: 'Dentro da cidade, as ruas são um labirinto. E eu ouvi um nome nas tavernas: Seraphine.' },
    { speakerId: 'aren', side: 'left', text: 'Ela de novo. Então vamos direto ao Farol, antes que ela faça com Vessa o que tentou fazer com Brasalva.' },
  ],
  events: [
    {
      id: 'c2s3-reinforcements',
      on: 'turnStart',
      turn: 4,
      spawns: [knight(12, 0, 7), knight(12, 13, 7)],
      dialogue: [{ speakerId: 'draven', side: 'right', text: 'Cavaleiros! Pelas margens! Cerquem os ratos antes que cheguem ao portão!' }],
    },
    {
      id: 'c2s3-draven',
      on: 'unitDefeated',
      unitId: 'draven',
      spawns: [],
      dialogue: [
        { speakerId: 'draven', side: 'right', text: 'Ventor... seu pai... teria orgulho... Diga a ele... que eu... sinto muito.' },
        { speakerId: 'narrator', side: 'left', text: 'O portão de Vessaria está aberto. Aren só precisa tomá-lo.' },
      ],
    },
  ],
};
