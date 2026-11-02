import type { ChapterDef, StageDef } from '../types';
import { STAGE_1 } from './stage1';
import { STAGE_2 } from './stage2';
import { STAGE_3 } from './stage3';
import { STAGE_4 } from './stage4';
import { STAGE_5 } from './stage5';

export const CHAPTER_1: ChapterDef = {
  id: 'c1',
  name: 'Brasas no Vale',
  stageIds: [STAGE_1.id, STAGE_2.id, STAGE_3.id, STAGE_4.id, STAGE_5.id],
};

export const CHAPTER_1_STAGES: StageDef[] = [STAGE_1, STAGE_2, STAGE_3, STAGE_4, STAGE_5];
