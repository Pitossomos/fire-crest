import type { StageDef, UnitPlacement } from '../types';
import { DEFAULT_LEGEND } from '../terrain';

const monk = (x: number, y: number, level = 8, ai: UnitPlacement['ai'] = 'stationary'): UnitPlacement => ({
  classId: 'dusk_monk', weaponId: 'sleep_psalm', faction: 'enemy', x, y, level, ai,
});

/** Cap. 2, Fase 5 — A Catedral do Ocaso: derrotar o Arquidiácono Malachar. */
export const C2_STAGE_5: StageDef = {
  id: 'c2s5',
  chapterId: 'c2',
  order: 5,
  name: 'A Catedral do Ocaso',
  objective: { kind: 'boss', description: 'Derrote o Arquidiácono Malachar', targetId: 'malachar' },
  map: {
    rows: [
      '####################',
      '#,,,,,,,FFFF,,,,,,,#',
      '#,,,,,,,FFFF,,,,,,,#',
      '#,,#,,,,,,,,,,,,#,,#',
      '#,,#,P,,P,,P,,P,#,,#',
      '#,,,,,,,,,,,,,,,,,,#',
      '#,,#,,,,,,,,,,,,#,,#',
      '#,,#,P,,P,,P,,P,#,,#',
      '#,,#,,,,,,,,,,,,#,,#',
      '#,,#,,,,,,,,,,,,#,,#',
      '#,,,,P,,P,,P,,P,,,,#',
      '#,,#,,,,,,,,,,,,#,,#',
      '#,,#,,,,,,,,,,,,#,,#',
      '#,,,#,,,,,,,,,,#,,,#',
      '#,,,,,,,GGGG,,,,,,,#',
      '####################',
    ],
    legend: DEFAULT_LEGEND,
  },
  units: [
    { characterId: 'aren', faction: 'player', x: 9, y: 14 },
    { characterId: 'mira', faction: 'player', x: 8, y: 14 },
    { characterId: 'hadric', faction: 'player', x: 10, y: 14 },
    { characterId: 'kaira', faction: 'player', x: 11, y: 14 },
    { characterId: 'ilian', faction: 'player', x: 9, y: 13 },
    { characterId: 'wren', faction: 'player', x: 8, y: 13 },
    { characterId: 'lys', faction: 'player', x: 10, y: 13 },
    { characterId: 'corvin', faction: 'player', x: 11, y: 13 },
    { characterId: 'brielle', faction: 'player', x: 7, y: 14 },
    { characterId: 'sorrel', faction: 'player', x: 12, y: 14 },
    { characterId: 'malachar', faction: 'enemy', x: 9, y: 1, ai: 'stationary', boss: true },
    monk(7, 1), monk(12, 1),
    { classId: 'ash_sentinel', weaponId: 'steel_axe', faction: 'enemy', x: 9, y: 5, level: 8, ai: 'guard' },
    { classId: 'ash_sentinel', weaponId: 'steel_axe', faction: 'enemy', x: 10, y: 5, level: 8, ai: 'guard' },
    { classId: 'dusk_knight', weaponId: 'steel_lance', faction: 'enemy', x: 5, y: 8, level: 8, ai: 'aggressive' },
    { classId: 'dusk_knight', weaponId: 'steel_lance', faction: 'enemy', x: 14, y: 8, level: 8, ai: 'aggressive' },
    { classId: 'hollow', weaponId: 'claws', faction: 'enemy', x: 1, y: 2, level: 8, ai: 'aggressive' },
    { classId: 'hollow', weaponId: 'claws', faction: 'enemy', x: 18, y: 2, level: 8, ai: 'aggressive' },
    { classId: 'archer', weaponId: 'iron_bow', faction: 'enemy', x: 4, y: 4, level: 8, ai: 'guard' },
    { classId: 'archer', weaponId: 'iron_bow', faction: 'enemy', x: 15, y: 4, level: 8, ai: 'guard' },
  ],
  rewardSeals: 0,
  preDialogue: [
    { speakerId: 'narrator', side: 'left', text: 'A Catedral do Ocaso já foi a Catedral do Sol. Os vitrais dourados foram pintados de preto; as velas, todas apagadas.' },
    { speakerId: 'malachar', side: 'right', text: 'O filho de Aldric Valdris, na minha catedral. O Grão-Hierofante vai me agradecer por entregar sua brasa embrulhada em silêncio.' },
    { speakerId: 'aren', side: 'left', text: 'Você apagou o Farol de Vessa e deixou a cidade inteira no escuro. Acabou, Malachar.' },
    { speakerId: 'malachar', side: 'right', text: 'Acabou? Criança. O Eclipse Eterno já começou. Os Faróis são só velas no vento.' },
    { speakerId: 'ilian', side: 'left', text: 'Ele usa o Tomo do Eclipse. Cuidado com a magia dele — mas minha luz fere tudo que vem do Ocaso, inclusive ele.' },
    { speakerId: 'hadric', side: 'right', text: 'Os pilares dão cobertura. Avancem juntos pela nave e não deixem ninguém sozinho nas capelas.' },
  ],
  postDialogue: [
    { speakerId: 'narrator', side: 'left', text: 'Com Malachar caído, as correntes da pira se partem. Aren sobe ao topo do Farol de Vessa e pousa a mão no fogo frio.' },
    { speakerId: 'narrator', side: 'left', text: 'A Crista arde — e a luz de Vessa corta a noite. Dois dos Sete Faróis voltaram a brilhar.' },
    { speakerId: 'lys', side: 'left', text: 'Nas coisas de Malachar havia cartas. O Grão-Hierofante está reunindo as brasas roubadas na Capital, em Solmarch.' },
    { speakerId: 'corvin', side: 'left', text: 'Se as cartas estiverem certas, ele quer fundir todas as brasas numa só. Isso não reacende o sol. Isso o devora.' },
    { speakerId: 'brielle', side: 'right', text: 'Então a estrada leva à Capital. Ao trono do seu pai, Aren.' },
    { speakerId: 'aren', side: 'left', text: 'Não vou pelo trono. Vou pelos Faróis. Mas, se o caminho passa por lá, que passe.' },
    { speakerId: 'narrator', side: 'left', text: 'Fim do Capítulo 2 — O Caminho dos Faróis. A jornada continua...' },
  ],
  events: [
    {
      id: 'c2s5-reinforcements',
      on: 'turnStart',
      turn: 4,
      spawns: [monk(1, 12, 8, 'aggressive'), monk(18, 12, 8, 'aggressive')],
      dialogue: [{ speakerId: 'malachar', side: 'right', text: 'Irmãos das capelas! Cantem! Que o sono desça sobre eles!' }],
    },
    {
      id: 'c2s5-malachar',
      on: 'unitDefeated',
      unitId: 'malachar',
      spawns: [],
      dialogue: [
        { speakerId: 'malachar', side: 'right', text: 'Impossível... O Eclipse... foi prometido... O Hierofante... virá por você...' },
      ],
    },
  ],
};
