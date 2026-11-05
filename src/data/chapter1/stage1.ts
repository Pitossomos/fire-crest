import type { StageDef } from '../types';
import { DEFAULT_LEGEND } from '../terrain';

/** Fase 1 — A Vila em Chamas (tutorial). */
export const STAGE_1: StageDef = {
  id: 'c1s1',
  chapterId: 'c1',
  order: 1,
  name: 'A Vila em Chamas',
  objective: { kind: 'rout', description: 'Derrote todos os inimigos' },
  map: {
    rows: [
      'hhff....ff..fhh',
      'hf.....=....ffh',
      'f......=.....f.',
      '~~~b~~~b~~~~b~~',
      '..f....=.......',
      '.H..H..=..H..f.',
      '...====F====...',
      '.H.....=...H...',
      'ff..H..=..H..ff',
      'fff....=....fff',
    ],
    legend: DEFAULT_LEGEND,
  },
  units: [
    { characterId: 'aren', faction: 'player', x: 6, y: 7 },
    { characterId: 'mira', faction: 'player', x: 8, y: 7 },
    { characterId: 'hadric', faction: 'player', x: 7, y: 6 },
    { characterId: 'kaira', faction: 'player', x: 7, y: 8 },
    { classId: 'bandit', weaponId: 'iron_axe', faction: 'enemy', x: 2, y: 4, level: 1, ai: 'aggressive' },
    { classId: 'bandit', weaponId: 'iron_axe', faction: 'enemy', x: 12, y: 4, level: 1, ai: 'aggressive' },
    { classId: 'bandit', weaponId: 'iron_axe', faction: 'enemy', x: 7, y: 2, level: 2, ai: 'aggressive' },
    { classId: 'bandit', weaponId: 'hand_axe', faction: 'enemy', x: 4, y: 1, level: 1, ai: 'guard' },
    { characterId: 'brom', faction: 'enemy', x: 8, y: 0, ai: 'guard' },
  ],
  preDialogue: [
    { speakerId: 'narrator', side: 'left', text: 'Ano 300 do Longo Crepúsculo. O sol nasce cada vez mais pálido sobre o vale de Brasalva.' },
    { speakerId: 'mira', side: 'left', text: 'Aren! Bandidos cruzaram as pontes. Estão incendiando as casas do lado norte!' },
    { speakerId: 'kaira', side: 'left', text: 'Ouvi os gritos lá da forja. Ninguém põe fogo na minha vila e vai embora inteiro.' },
    { speakerId: 'hadric', side: 'right', text: 'São homens de Grull. Alguém pagou bem para que viessem esta noite... justo esta noite.' },
    { speakerId: 'aren', side: 'left', text: 'Minha mão... está queimando. Hadric, o que é isto?' },
    { speakerId: 'hadric', side: 'right', text: 'Depois, rapaz. Primeiro, defendemos o Farol. Se ele cair, Brasalva cai junto.' },
    { speakerId: 'brom', side: 'right', text: 'Ali! O garoto com a mão em chamas! Grull paga o dobro por ele vivo... ou o mesmo por ele morto!' },
    { speakerId: 'kaira', side: 'left', text: 'Vem buscar, então. Meu machado anda com saudade de lenha teimosa.' },
  ],
  postDialogue: [
    { speakerId: 'mira', side: 'left', text: 'Esses eram só os batedores. Grull ainda está do outro lado da ponte de Thornmere.' },
    { speakerId: 'kaira', side: 'left', text: 'Eu vou junto. Alguém precisa manter essa lâmina afiada — e esse garoto vivo.' },
    { speakerId: 'hadric', side: 'right', text: 'A marca na sua mão, Aren... é a Crista de Fogo. E agora toda a Ordem do Ocaso vai sentir o cheiro dela.' },
  ],
  events: [
    {
      id: 'c1s1-tutorial',
      on: 'turnStart',
      turn: 1,
      spawns: [],
      dialogue: [
        { speakerId: 'narrator', side: 'left', text: 'Dica: mova o cursor com as setas, WASD ou o mouse. Selecione uma unidade com Z, Enter ou um clique.' },
        { speakerId: 'narrator', side: 'left', text: 'O azul mostra até onde ela anda; o vermelho, o alcance da arma. Florestas e casas dão evasão; a fortaleza do Farol dá defesa e cura.' },
        { speakerId: 'narrator', side: 'left', text: 'Espada vence machado, machado vence lança, lança vence espada. Confira sempre a previsão antes de atacar.' },
        { speakerId: 'narrator', side: 'left', text: 'Clique num inimigo para ver até onde ele alcança. Se Aren cair, a Crista se apaga e a batalha está perdida.' },
      ],
    },
    {
      id: 'c1s1-turn2',
      on: 'turnStart',
      turn: 2,
      spawns: [],
      dialogue: [
        { speakerId: 'mira', side: 'left', text: 'Não deixe eles te cercarem, Aren. Use as casas, lute um de cada vez.' },
        { speakerId: 'hadric', side: 'right', text: 'E fique perto de mim. Minha armadura aguenta o que esses machados têm a oferecer.' },
      ],
    },
    {
      id: 'c1s1-brom',
      on: 'unitDefeated',
      unitId: 'brom',
      spawns: [],
      dialogue: [
        { speakerId: 'brom', side: 'right', text: 'Ugh... Grull vai... arrancar a sua pele, garoto... e a Ordem... vai ficar com essa sua mão brilhante...' },
      ],
    },
  ],
};
