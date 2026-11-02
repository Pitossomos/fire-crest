import type { ChapterDef, StageDef } from '../types';
import { STAGE_1 } from './stage1';

export const CHAPTER_1: ChapterDef = {
  id: 'c1',
  name: 'Brasas no Vale',
  // Fases 2–5 (Ponte de Thornmere, Bosque dos Sussurros, Fortaleza de Cinzaforte,
  // Farol Apagado) entram no marco M6.
  stageIds: [STAGE_1.id],
};

export const CHAPTER_1_STAGES: StageDef[] = [STAGE_1];
