import type { StageDef, UnitPlacement } from '../types';
import { DEFAULT_LEGEND } from '../terrain';

const knight = (x: number, y: number, level = 5): UnitPlacement => ({
  classId: 'dusk_knight', weaponId: 'iron_lance', faction: 'enemy', x, y, level, ai: 'aggressive',
});

/** Cap. 2, Fase 1 — A Estrada do Rei: emboscada dos Cavaleiros do Ocaso; Brielle se junta. */
export const C2_STAGE_1: StageDef = {
  id: 'c2s1',
  chapterId: 'c2',
  order: 1,
  name: 'A Estrada do Rei',
  objective: { kind: 'rout', description: 'Derrote todos os inimigos' },
  map: {
    rows: [
      'hhh......ff....~..hhhh',
      'hhh.ff....ff...~..hhhh',
      '.....ff........~..hhhh',
      '........hh..f..~......',
      '...ff.....f....~.ff...',
      '....f.H...f....~..f...',
      '...............b....f.',
      '===============b======',
      '...............~....f.',
      '.......H.....h.~......',
      '.......ff.....h~.ff...',
      '........ff...f.~...hhh',
      'hhhh........ff.~...hhh',
      'hhhh...........~...hhh',
    ],
    legend: DEFAULT_LEGEND,
  },
  units: [
    { characterId: 'aren', faction: 'player', x: 1, y: 7 },
    { characterId: 'mira', faction: 'player', x: 1, y: 6 },
    { characterId: 'hadric', faction: 'player', x: 2, y: 7 },
    { characterId: 'kaira', faction: 'player', x: 2, y: 8 },
    { characterId: 'ilian', faction: 'player', x: 0, y: 7 },
    { characterId: 'wren', faction: 'player', x: 0, y: 6 },
    { characterId: 'lys', faction: 'player', x: 0, y: 8 },
    { characterId: 'corvin', faction: 'player', x: 1, y: 8 },
    { characterId: 'brielle', faction: 'ally', x: 12, y: 7, ai: 'guard' },
    knight(14, 3), knight(14, 11), knight(18, 7, 6),
    { classId: 'bandit', weaponId: 'iron_axe', faction: 'enemy', x: 8, y: 2, level: 6, ai: 'aggressive' },
    { classId: 'bandit', weaponId: 'iron_axe', faction: 'enemy', x: 9, y: 12, level: 6, ai: 'aggressive' },
    { classId: 'archer', weaponId: 'iron_bow', faction: 'enemy', x: 8, y: 3, level: 5, ai: 'stationary' },
    { classId: 'archer', weaponId: 'iron_bow', faction: 'enemy', x: 13, y: 9, level: 5, ai: 'stationary' },
    { classId: 'dusk_monk', weaponId: 'sleep_psalm', faction: 'enemy', x: 19, y: 3, level: 5, ai: 'guard' },
    { classId: 'dusk_monk', weaponId: 'sleep_psalm', faction: 'enemy', x: 19, y: 9, level: 5, ai: 'guard' },
  ],
  rewardSeals: 0,
  preDialogue: [
    { speakerId: 'narrator', side: 'left', text: 'Capítulo 2 — O Caminho dos Faróis. O Farol de Brasalva arde de novo, mas três dos Sete Faróis continuam apagados.' },
    { speakerId: 'corvin', side: 'left', text: 'O mais próximo é o Farol de Vessa, ao sul. Destilei uma brasa da pira de Brasalva: um Selo da Brasa. Com ele, um de vocês pode... evoluir.' },
    { speakerId: 'hadric', side: 'right', text: 'A Estrada do Rei leva a Vessaria em três dias. Se ainda for do rei, claro.' },
    { speakerId: 'narrator', side: 'left', text: 'Ao meio-dia, ouvem cascos. Uma cavaleira de Solmarch luta sozinha contra cavaleiros de armadura negra.' },
    { speakerId: 'brielle', side: 'right', text: 'Para trás, viajantes! Os Cavaleiros do Ocaso não deixam testemunhas — e eu não pretendo deixar cavaleiros!' },
    { speakerId: 'hadric', side: 'left', text: 'Aquela lança... é o brasão dos Ventor. Aren, vamos ajudá-la. E deixem-me falar com ela.' },
    { speakerId: 'narrator', side: 'left', text: 'Dica: Cavaleiros montados andam longe na estrada, mas sofrem na floresta e nas colinas. A Cavaleira entra no time se Hadric conversar com ela.' },
  ],
  postDialogue: [
    { speakerId: 'brielle', side: 'right', text: 'Os Cavaleiros do Ocaso são comandados por Draven. Ele já foi um de nós. Agora guarda as muralhas de Vessaria.' },
    { speakerId: 'aren', side: 'left', text: 'Então é para lá que vamos. O Farol de Vessa precisa voltar a arder.' },
    { speakerId: 'mira', side: 'left', text: 'O caminho mais curto é pelo Pântano de Vessa. O mais seguro também é pelo pântano, o que diz muito sobre a estrada.' },
  ],
  events: [
    {
      id: 'c2s1-brielle',
      on: 'talk',
      unitId: 'hadric',
      otherUnitId: 'brielle',
      recruitId: 'brielle',
      spawns: [],
      dialogue: [
        { speakerId: 'hadric', side: 'left', text: 'Brielle Ventor? A última vez que te vi, você mal alcançava o estribo do seu pai.' },
        { speakerId: 'brielle', side: 'right', text: 'Sir Hadric?! Meu pai dizia que o senhor tinha morrido guardando um farol de pescadores.' },
        { speakerId: 'hadric', side: 'left', text: 'Quase. Esse garoto da espada brilhante é o motivo. Lute conosco e eu te conto o resto.' },
        { speakerId: 'brielle', side: 'right', text: 'Por Gerold Ventor e por Solmarch: minha lança é sua.' },
      ],
    },
    {
      id: 'c2s1-reinforcements',
      on: 'turnStart',
      turn: 3,
      spawns: [knight(21, 3, 6), knight(21, 10, 6)],
      dialogue: [{ speakerId: 'brielle', side: 'right', text: 'Mais cavaleiros pelo leste! Fiquem perto das árvores — os cavalos odeiam o mato!' }],
    },
  ],
};
