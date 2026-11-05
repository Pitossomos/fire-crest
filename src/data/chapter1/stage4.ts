import type { StageDef } from '../types';
import { DEFAULT_LEGEND } from '../terrain';

/** Fase 4 — A Fortaleza de Cinzaforte: derrotar o Abade, recrutar Lys e libertar Corvin. */
export const STAGE_4: StageDef = {
  id: 'c1s4',
  chapterId: 'c1',
  order: 4,
  name: 'A Fortaleza de Cinzaforte',
  objective: { kind: 'boss', description: 'Derrote o Abade Morvane', targetId: 'morvane' },
  map: {
    rows: [
      '###############',
      '#,,,#,,,,,#,,,#',
      '#,,,#,,F,,#,,,#',
      '#,,,#,,,,,##,##',
      '#,,,,,,,,,,,,,#',
      '##,####,####,##',
      '#,,,#,,,,,#,,,#',
      '#,,,,,,,,,,,,,#',
      '#,,,#,,,,,#,,,#',
      '###############',
    ],
    legend: DEFAULT_LEGEND,
  },
  units: [
    { characterId: 'aren', faction: 'player', x: 7, y: 8 },
    { characterId: 'mira', faction: 'player', x: 6, y: 8 },
    { characterId: 'hadric', faction: 'player', x: 8, y: 8 },
    { characterId: 'kaira', faction: 'player', x: 6, y: 7 },
    { characterId: 'wren', faction: 'player', x: 7, y: 7 },
    { characterId: 'lys', faction: 'ally', x: 1, y: 8, ai: 'stationary' },
    { characterId: 'morvane', faction: 'enemy', x: 7, y: 2, ai: 'stationary', boss: true },
    { classId: 'dusk_monk', weaponId: 'sleep_psalm', faction: 'enemy', x: 6, y: 1, level: 4, ai: 'guard' },
    { classId: 'dusk_monk', weaponId: 'sleep_psalm', faction: 'enemy', x: 8, y: 1, level: 4, ai: 'guard' },
    { classId: 'bandit', weaponId: 'iron_axe', faction: 'enemy', x: 7, y: 5, level: 4, ai: 'guard' },
    { classId: 'lancer', weaponId: 'iron_lance', faction: 'enemy', x: 2, y: 4, level: 3, ai: 'guard' },
    { classId: 'dusk_monk', weaponId: 'sleep_psalm', faction: 'enemy', x: 12, y: 6, level: 3, ai: 'guard' },
    { classId: 'hollow', weaponId: 'claws', faction: 'enemy', x: 13, y: 8, level: 3, ai: 'aggressive' },
    { classId: 'archer', weaponId: 'iron_bow', faction: 'enemy', x: 2, y: 1, level: 3, ai: 'stationary' },
  ],
  preDialogue: [
    { speakerId: 'narrator', side: 'left', text: 'Cinzaforte já foi um posto dos Faróis. Agora suas torres estão negras, e de dentro vem o som de cânticos.' },
    { speakerId: 'wren', side: 'left', text: 'Ouviram? Estão cantando o Salmo do Sono. É assim que eles apagam as pessoas.' },
    { speakerId: 'morvane', side: 'right', text: 'Bem-vindos, filhos do fogo teimoso. Durmam. O sol já está cansado; por que vocês não estariam?' },
    { speakerId: 'hadric', side: 'right', text: 'O Abade Morvane. Ele mantém prisioneiros nas celas do leste. E a Ordem não costuma deixar testemunhas.' },
    { speakerId: 'aren', side: 'left', text: 'Então vamos tirar todos daqui. Cada um deles.' },
  ],
  postDialogue: [
    { speakerId: 'lys', side: 'right', text: 'O Abade era só um carcereiro. Quem dá as ordens é a Inquisidora Seraphine. Ela está indo para o Farol de Brasalva.' },
    { speakerId: 'hadric', side: 'right', text: 'O nosso Farol. Se ela o apagar, o Cinzento atravessa o vale inteiro.' },
    { speakerId: 'corvin', side: 'left', text: 'Então corramos! Eu explico no caminho por que a sua Crista é a coisa mais fascinante que já vi. Prometo ser breve. Relativamente breve.' },
    { speakerId: 'kaira', side: 'left', text: 'Cada prisioneiro daquelas celas volta pra casa. Eu mesma quebro as correntes.' },
  ],
  events: [
    {
      id: 'c1s4-lys',
      on: 'talk',
      unitId: 'aren',
      otherUnitId: 'lys',
      recruitId: 'lys',
      spawns: [],
      dialogue: [
        { speakerId: 'lys', side: 'right', text: 'Você... é o portador? Eu fugi da Ordem quando vi o que fazem com gente como você. Arrancam a brasa enquanto a pessoa ainda respira.' },
        { speakerId: 'aren', side: 'left', text: 'Então venha com a gente. Ninguém mais vai passar por isso se depender de nós.' },
        { speakerId: 'lys', side: 'right', text: 'Meu cajado é seu. Que a luz que ainda resta nos guarde.' },
      ],
    },
    {
      id: 'c1s4-corvin',
      on: 'tileReached',
      x: 12,
      y: 3,
      spawns: [{ characterId: 'corvin', faction: 'player', x: 12, y: 2, joins: true }],
      dialogue: [
        { speakerId: 'corvin', side: 'right', text: 'Finalmente! Uma visita que não quer me fazer dormir. Corvin Ash, alquimista, prisioneiro e, a partir de agora, seu aliado.' },
        { speakerId: 'corvin', side: 'right', text: 'Isso na sua mão é uma brasa solar de verdade? Eu passei dez anos tentando fazer uma. Explodi três laboratórios. Posso olhar mais de perto? Depois. Depois.' },
      ],
    },
    {
      id: 'c1s4-reinforcements',
      on: 'turnStart',
      turn: 5,
      spawns: [
        { classId: 'dusk_monk', weaponId: 'sleep_psalm', faction: 'enemy', x: 1, y: 2, level: 4, ai: 'aggressive' },
        { classId: 'dusk_monk', weaponId: 'sleep_psalm', faction: 'enemy', x: 9, y: 1, level: 4, ai: 'aggressive' },
      ],
      dialogue: [{ speakerId: 'morvane', side: 'right', text: 'Irmãos! Cantem mais alto! Que o sono os encontre!' }],
    },
    {
      id: 'c1s4-morvane',
      on: 'unitDefeated',
      unitId: 'morvane',
      spawns: [],
      dialogue: [{ speakerId: 'morvane', side: 'right', text: 'Vocês... só adiam... o inevitável. Seraphine... já está... no Farol...' }],
    },
  ],
};
