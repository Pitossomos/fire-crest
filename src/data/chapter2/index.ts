import type { ChapterDef, StageDef } from '../types';
import { C2_STAGE_1 } from './stage1';
import { C2_STAGE_2 } from './stage2';
import { C2_STAGE_3 } from './stage3';
import { C2_STAGE_4 } from './stage4';
import { C2_STAGE_5 } from './stage5';

export const CHAPTER_2: ChapterDef = {
  id: 'c2',
  order: 2,
  name: 'O Caminho dos Faróis',
  stageIds: [C2_STAGE_1.id, C2_STAGE_2.id, C2_STAGE_3.id, C2_STAGE_4.id, C2_STAGE_5.id],
  startSeals: 1,
  // Time para começar o Capítulo 2 direto do título (sem save do Capítulo 1).
  premade: [
    { characterId: 'aren', level: 6 },
    { characterId: 'mira', level: 6 },
    { characterId: 'hadric', level: 8 },
    { characterId: 'kaira', level: 6 },
    { characterId: 'ilian', level: 5 },
    { characterId: 'wren', level: 6 },
    { characterId: 'lys', level: 5 },
    { characterId: 'corvin', level: 6 },
  ],
};

export const CHAPTER_2_STAGES: StageDef[] = [C2_STAGE_1, C2_STAGE_2, C2_STAGE_3, C2_STAGE_4, C2_STAGE_5];
