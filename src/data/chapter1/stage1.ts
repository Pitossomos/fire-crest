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
    { classId: 'bandit', weaponId: 'iron_axe', faction: 'enemy', x: 2, y: 4, level: 1, ai: 'aggressive' },
    { classId: 'bandit', weaponId: 'iron_axe', faction: 'enemy', x: 12, y: 4, level: 1, ai: 'aggressive' },
    { classId: 'bandit', weaponId: 'iron_axe', faction: 'enemy', x: 7, y: 2, level: 2, ai: 'aggressive' },
    { classId: 'bandit', weaponId: 'hand_axe', faction: 'enemy', x: 4, y: 1, level: 1, ai: 'guard' },
    { classId: 'bandit', weaponId: 'hand_axe', name: 'Brom, o Capanga', faction: 'enemy', x: 8, y: 0, level: 3, ai: 'stationary' },
  ],
  preDialogue: [
    { speakerId: 'narrator', side: 'left', text: 'Ano 300 do Longo Crepúsculo. O sol nasce cada vez mais pálido sobre o vale de Brasalva.' },
    { speakerId: 'mira', side: 'left', text: 'Aren! Bandidos cruzaram as pontes. Estão incendiando as casas do lado norte!' },
    { speakerId: 'hadric', side: 'right', text: 'São homens de Grull. Alguém pagou bem para que viessem esta noite... justo esta noite.' },
    { speakerId: 'aren', side: 'left', text: 'Minha mão... está queimando. Hadric, o que é isto?' },
    { speakerId: 'hadric', side: 'right', text: 'Depois, rapaz. Primeiro, defendemos o Farol. Se ele cair, Brasalva cai junto.' },
  ],
  postDialogue: [
    { speakerId: 'mira', side: 'left', text: 'Esses eram só os batedores. Grull ainda está do outro lado da ponte de Thornmere.' },
    { speakerId: 'hadric', side: 'right', text: 'A marca na sua mão, Aren... é a Crista de Fogo. E agora toda a Ordem do Ocaso vai sentir o cheiro dela.' },
  ],
  events: [],
};
