import type { StageDef, UnitPlacement } from '../types';
import { DEFAULT_LEGEND } from '../terrain';

const hollow = (x: number, y: number, level: number): UnitPlacement => ({
  classId: 'hollow', weaponId: 'claws', faction: 'enemy', x, y, level, ai: 'aggressive',
});

/** Fase 3 — O Bosque dos Sussurros: sobreviver às ondas de Esvaídos com Wren. */
export const STAGE_3: StageDef = {
  id: 'c1s3',
  chapterId: 'c1',
  order: 3,
  name: 'O Bosque dos Sussurros',
  objective: { kind: 'survive', description: 'Sobreviva até o fim do turno 8', turns: 8 },
  map: {
    rows: [
      'fffhff.ff.fffhf',
      'ff..f..f..ff.ff',
      'f..ff....f...ff',
      '.f...f.ff..f..f',
      '..f..F....f..ff',
      '.f...f..f...f..',
      'ff..f...ff.f...',
      'f..ff.f....ff.f',
      'ff...f..f..f.ff',
      'fhff.ff..ff.fhf',
    ],
    legend: DEFAULT_LEGEND,
  },
  units: [
    { characterId: 'aren', faction: 'player', x: 4, y: 4 },
    { characterId: 'mira', faction: 'player', x: 4, y: 5 },
    { characterId: 'hadric', faction: 'player', x: 5, y: 4 },
    { characterId: 'kaira', faction: 'player', x: 5, y: 5 },
    { characterId: 'wren', faction: 'ally', x: 9, y: 4, ai: 'guard' },
    { characterId: 'vela', faction: 'enemy', x: 13, y: 4, ai: 'guard', boss: true },
    hollow(12, 2, 2),
    hollow(12, 6, 2),
    hollow(9, 8, 2),
    hollow(8, 1, 2),
  ],
  recruitOnClear: ['wren'],
  preDialogue: [
    { speakerId: 'narrator', side: 'left', text: 'O Bosque dos Sussurros nunca foi silencioso. Hoje, nem os pássaros cantam. Uma névoa fria escorre entre as árvores.' },
    { speakerId: 'mira', side: 'left', text: 'Que frio é esse? Estamos no verão... ou no que o Crepúsculo chama de verão.' },
    { speakerId: 'hadric', side: 'right', text: 'É o Cinzento. A névoa que apaga. Quem respira fundo demais esquece o próprio nome.' },
    { speakerId: 'wren', side: 'right', text: 'Vocês aí! Fiquem perto do fogo ou da luz! Os Esvaídos vêm em ondas quando a névoa sobe.' },
    { speakerId: 'aren', side: 'left', text: 'Quem é você?' },
    { speakerId: 'wren', side: 'right', text: 'Wren. Caço aqui desde sempre. Aguentem até a névoa baixar — oito viradas da ampulheta — e eu tiro vocês daqui.' },
  ],
  postDialogue: [
    { speakerId: 'narrator', side: 'left', text: 'Ao fim do oitavo turno, a névoa recua como uma maré. Os Esvaídos que restam simplesmente param, e esquecem por que vieram.' },
    { speakerId: 'wren', side: 'right', text: 'Aquela mão sua... ela queimou a névoa. Nunca vi nada assim. Minha família não teve essa sorte.' },
    { speakerId: 'wren', side: 'right', text: 'Os monges do Ocaso levaram gente daqui para Cinzaforte, a fortaleza ao norte. Se vocês vão atrás deles, eu vou junto.' },
    { speakerId: 'aren', side: 'left', text: 'Bem-vinda, Wren.' },
    { speakerId: 'kaira', side: 'left', text: 'Se precisar de pontas de flecha novas, Wren, a minha forja é sua.' },
  ],
  events: [
    {
      id: 'c1s3-wave1',
      on: 'turnStart',
      turn: 3,
      spawns: [hollow(14, 0, 2), hollow(14, 9, 2)],
      dialogue: [{ speakerId: 'wren', side: 'right', text: 'Mais deles saindo da névoa a leste! Não se espalhem!' }],
    },
    {
      id: 'c1s3-wave2',
      on: 'turnStart',
      turn: 5,
      spawns: [hollow(0, 0, 3), hollow(0, 9, 3)],
      dialogue: [{ speakerId: 'hadric', side: 'right', text: 'Pelas costas também! Formem um círculo perto das ruínas!' }],
    },
    {
      id: 'c1s3-wave3',
      on: 'turnStart',
      turn: 7,
      spawns: [hollow(14, 4, 3), hollow(7, 0, 3), hollow(7, 9, 3)],
      dialogue: [{ speakerId: 'mira', side: 'left', text: 'Só mais um pouco... Aren, sua mão está brilhando mais forte!' }],
    },
    {
      id: 'c1s3-vela',
      on: 'unitDefeated',
      unitId: 'vela',
      spawns: [],
      dialogue: [
        { speakerId: 'vela', side: 'right', text: 'Eu... eu guardava... este bosque... Obrigada... por me deixar... lembrar...' },
        { speakerId: 'wren', side: 'right', text: 'Vela... era ela que me ensinou a caçar. Que a luz a guarde.' },
      ],
    },
  ],
};
