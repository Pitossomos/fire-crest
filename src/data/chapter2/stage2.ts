import type { StageDef, UnitPlacement } from '../types';
import { DEFAULT_LEGEND } from '../terrain';

const hollow = (x: number, y: number, level = 6): UnitPlacement => ({
  classId: 'hollow', weaponId: 'claws', faction: 'enemy', x, y, level, ai: 'aggressive',
});

/** Cap. 2, Fase 2 — O Pântano de Vessa: Guardião Afogado; Sorrel se junta. */
export const C2_STAGE_2: StageDef = {
  id: 'c2s2',
  chapterId: 'c2',
  order: 2,
  name: 'O Pântano de Vessa',
  objective: { kind: 'boss', description: 'Derrote o Guardião Afogado', targetId: 'warden' },
  map: {
    rows: [
      'pppppppppppf...ppppp',
      'ppppppppppp....ppp~~',
      'pppppf..ppp...fpppp~',
      'ppppp.f.pppppppppppp',
      'ppppp...p=======pppp',
      'f.ppppppp=ppppp=pppp',
      '....ppppp=ppppp=pffp',
      '....ppppp=pp~~p=pppp',
      '...=======p~~~p=pppp',
      '....ppppppppppp=....',
      '..f.ppppppfpppp=.FF.',
      '.fpppppppppfppp=.FF.',
      'ppppppf...pppppp....',
      'ppp~~p....pppppp....',
      'ppp~pp.f..pppppppppp',
      'pppppppppppppppppppp',
    ],
    legend: DEFAULT_LEGEND,
  },
  units: [
    { characterId: 'aren', faction: 'player', x: 1, y: 8 },
    { characterId: 'mira', faction: 'player', x: 1, y: 7 },
    { characterId: 'hadric', faction: 'player', x: 2, y: 8 },
    { characterId: 'kaira', faction: 'player', x: 2, y: 7 },
    { characterId: 'ilian', faction: 'player', x: 0, y: 8 },
    { characterId: 'wren', faction: 'player', x: 0, y: 7 },
    { characterId: 'lys', faction: 'player', x: 1, y: 9 },
    { characterId: 'corvin', faction: 'player', x: 0, y: 9 },
    { characterId: 'brielle', faction: 'player', x: 0, y: 6 },
    { characterId: 'sorrel', faction: 'ally', x: 12, y: 1, ai: 'guard' },
    { characterId: 'warden', faction: 'enemy', x: 17, y: 10, ai: 'stationary', boss: true },
    hollow(6, 3), hollow(7, 13), hollow(10, 10),
    { classId: 'ash_sentinel', weaponId: 'iron_axe', faction: 'enemy', x: 15, y: 8, level: 6, ai: 'guard' },
    { classId: 'ash_sentinel', weaponId: 'iron_axe', faction: 'enemy', x: 12, y: 4, level: 6, ai: 'guard' },
    { classId: 'dusk_monk', weaponId: 'sleep_psalm', faction: 'enemy', x: 18, y: 12, level: 6, ai: 'guard' },
    { classId: 'archer', weaponId: 'iron_bow', faction: 'enemy', x: 14, y: 2, level: 6, ai: 'stationary' },
  ],
  rewardSeals: 1,
  preDialogue: [
    { speakerId: 'narrator', side: 'left', text: 'O Pântano de Vessa cheira a ferro velho e chuva parada. O Cinzento se arrasta rente à água.' },
    { speakerId: 'brielle', side: 'left', text: 'Meu cavalo afunda até os joelhos. Isso aqui foi feito para sapos, não para cavaleiras.' },
    { speakerId: 'wren', side: 'left', text: 'Fiquem na calçada de pedra sempre que puderem. A lama prende os pés — e a Sentinela também.' },
    { speakerId: 'sorrel', side: 'right', text: 'Mira Tolven?! Ainda viva e ainda me devendo três moedas de prata!' },
    { speakerId: 'mira', side: 'left', text: 'Sorrel. Você me deve cinco. E aposto que sabe o caminho seco por aqui.' },
    { speakerId: 'narrator', side: 'left', text: 'Dica: no Pântano, todos andam devagar — e os blindados mais ainda. Sorrel entra no time se Mira conversar com ela.' },
  ],
  postDialogue: [
    { speakerId: 'narrator', side: 'left', text: 'A armadura do Guardião Afogado se desfaz em cinzas. No peito dela havia uma brasa fria, quase apagada — outro Selo da Brasa.' },
    { speakerId: 'corvin', side: 'left', text: 'Fascinante! A guarda do Farol de Vessa virou sentinela do Cinzento. A Ordem não apaga só o fogo, apaga o juramento.' },
    { speakerId: 'sorrel', side: 'right', text: 'As muralhas de Vessaria ficam logo depois do rio. Draven patrulha o portão pessoalmente. Boa sorte — eu cobro por ela.' },
  ],
  events: [
    {
      id: 'c2s2-sorrel',
      on: 'talk',
      unitId: 'mira',
      otherUnitId: 'sorrel',
      recruitId: 'sorrel',
      spawns: [],
      dialogue: [
        { speakerId: 'mira', side: 'left', text: 'Vem com a gente. Tem um farol pra acender e uma Ordem inteira pra irritar.' },
        { speakerId: 'sorrel', side: 'right', text: 'E as minhas cinco moedas?' },
        { speakerId: 'mira', side: 'left', text: 'Três. E eu não conto pro Hadric aquela história da ponte.' },
        { speakerId: 'sorrel', side: 'right', text: '...Fechado. Mas eu vou na frente. Vocês pisam alto demais.' },
      ],
    },
    {
      id: 'c2s2-reinforcements',
      on: 'turnStart',
      turn: 4,
      spawns: [hollow(19, 5, 7), hollow(10, 15, 7)],
      dialogue: [{ speakerId: 'ilian', side: 'left', text: 'Mais Esvaídos saindo da lama! Minha luz queima eles — deixem que eu cuide dos que se aproximarem.' }],
    },
    {
      id: 'c2s2-warden',
      on: 'unitDefeated',
      unitId: 'warden',
      spawns: [],
      dialogue: [{ speakerId: 'warden', side: 'right', text: '...O Farol... de Vessa... ainda... arde...?' }],
    },
  ],
};
