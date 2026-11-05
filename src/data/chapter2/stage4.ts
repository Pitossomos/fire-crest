import type { StageDef, UnitPlacement } from '../types';
import { DEFAULT_LEGEND } from '../terrain';

const knight = (x: number, y: number, level = 7): UnitPlacement => ({
  classId: 'dusk_knight', weaponId: 'iron_lance', faction: 'enemy', x, y, level, ai: 'aggressive',
});
const monk = (x: number, y: number, level = 7, ai: UnitPlacement['ai'] = 'aggressive'): UnitPlacement => ({
  classId: 'dusk_monk', weaponId: 'sleep_psalm', faction: 'enemy', x, y, level, ai,
});

/** Cap. 2, Fase 4 — Os Becos Apagados: atravessar a cidade até o Farol de Vessa. */
export const C2_STAGE_4: StageDef = {
  id: 'c2s4',
  chapterId: 'c2',
  order: 4,
  name: 'Os Becos Apagados',
  objective: { kind: 'seize', description: 'Aren deve chegar ao Farol de Vessa (leste)', x: 22, y: 7 },
  map: {
    rows: [
      '#===============f=====##',
      '==###==###==###==###==##',
      '==###==###==###==###==##',
      '==#H#==#H#==#H#==#H#==##',
      '=====#====#====#======##',
      '=f====================##',
      '==###==###==,,,==###=,,#',
      '==###==###==,F,==###=GF#',
      '==#H#==#H#==,,,==#H#=,F#',
      '=====================,,#',
      '=====#====#====#======##',
      '==###==###==###==###==##',
      '==###==###==###==###==##',
      '==#H#==#H#==#H#==#H#==##',
      '======f====f==========##',
      '#=====================##',
    ],
    legend: DEFAULT_LEGEND,
  },
  units: [
    { characterId: 'aren', faction: 'player', x: 1, y: 7 },
    { characterId: 'mira', faction: 'player', x: 1, y: 6 },
    { characterId: 'hadric', faction: 'player', x: 0, y: 7 },
    { characterId: 'kaira', faction: 'player', x: 1, y: 8 },
    { characterId: 'ilian', faction: 'player', x: 0, y: 8 },
    { characterId: 'wren', faction: 'player', x: 0, y: 6 },
    { characterId: 'lys', faction: 'player', x: 0, y: 9 },
    { characterId: 'corvin', faction: 'player', x: 1, y: 9 },
    { characterId: 'brielle', faction: 'player', x: 0, y: 5 },
    { characterId: 'sorrel', faction: 'player', x: 2, y: 9 },
    { characterId: 'seraphine', faction: 'enemy', x: 13, y: 7, ai: 'stationary', boss: true },
    { classId: 'ash_sentinel', weaponId: 'steel_axe', faction: 'enemy', x: 21, y: 7, level: 8, ai: 'stationary' },
    { classId: 'archer', weaponId: 'iron_bow', faction: 'enemy', x: 22, y: 6, level: 7, ai: 'stationary' },
    knight(11, 4), knight(16, 9),
    monk(20, 8, 7, 'guard'), monk(20, 6, 7, 'guard'),
    { classId: 'bandit', weaponId: 'steel_axe', faction: 'enemy', x: 6, y: 14, level: 7, ai: 'aggressive' },
    { classId: 'bandit', weaponId: 'steel_axe', faction: 'enemy', x: 8, y: 0, level: 7, ai: 'aggressive' },
  ],
  rewardSeals: 1,
  preDialogue: [
    { speakerId: 'narrator', side: 'left', text: 'As ruas de Vessaria estão vazias. Janelas fechadas, lampiões apagados. Só os sinos da Ordem tocam, lentos como um coração cansado.' },
    { speakerId: 'seraphine', side: 'right', text: 'Pequena brasa. Você cresceu. Trouxe amigos, até. Que pena que vão todos dormir na mesma praça.' },
    { speakerId: 'aren', side: 'left', text: 'Seraphine. Saia da frente. Eu vou acender aquele farol.' },
    { speakerId: 'seraphine', side: 'right', text: 'Então atravesse a cidade. Eu espero aqui — ou não. Tanto faz. O Arquidiácono já sabe que você veio.' },
    { speakerId: 'sorrel', side: 'left', text: 'Os becos ligam tudo, mas são estreitos. Deixem os cavalos nas ruas largas e não entrem na praça sem plano.' },
    { speakerId: 'narrator', side: 'left', text: 'Objetivo: levar Aren até o Farol de Vessa. Não é preciso derrotar Seraphine — mas ela não vai facilitar se você passar perto.' },
  ],
  postDialogue: [
    { speakerId: 'narrator', side: 'left', text: 'Aren sobe a escadaria do Farol de Vessa. A pira está fria — e acorrentada com correntes de prata negra, seladas por magia.' },
    { speakerId: 'lys', side: 'left', text: 'Esse selo é do Arquidiácono Malachar. Só se rompe se ele cair. Ele está na Catedral do Ocaso, no alto da cidade.' },
    { speakerId: 'corvin', side: 'left', text: 'E aqui, entre as correntes... mais uma brasa adormecida. Outro Selo da Brasa para a nossa coleção.' },
    { speakerId: 'kaira', side: 'left', text: 'Ótimo. Então a gente sobe, derruba o tal arquidiácono e quebra as correntes. Nessa ordem.' },
  ],
  events: [
    {
      id: 'c2s4-reinforcements-1',
      on: 'turnStart',
      turn: 3,
      spawns: [knight(12, 0, 7), knight(12, 15, 7)],
      dialogue: [{ speakerId: 'brielle', side: 'left', text: 'Cavaleiros pelas avenidas, norte e sul! Segurem os cruzamentos!' }],
    },
    {
      id: 'c2s4-reinforcements-2',
      on: 'turnStart',
      turn: 5,
      spawns: [monk(7, 0), monk(7, 15)],
      dialogue: [{ speakerId: 'ilian', side: 'left', text: 'Monges cantando o Salmo do Sono! Minha luz responde — fiquem perto de mim.' }],
    },
    {
      id: 'c2s4-seraphine',
      on: 'unitDefeated',
      unitId: 'seraphine',
      spawns: [],
      dialogue: [
        { speakerId: 'seraphine', side: 'right', text: 'De novo... De novo essa luz teimosa. Por que ela não se apaga?' },
        { speakerId: 'seraphine', side: 'right', text: 'Malachar que tente segurá-la. Eu... preciso pensar.' },
        { speakerId: 'narrator', side: 'left', text: 'Seraphine some numa nuvem de cinzas. Pela primeira vez, ela parecia em dúvida.' },
      ],
    },
  ],
};
