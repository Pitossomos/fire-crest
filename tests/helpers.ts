import type { StageDef, UnitPlacement } from '../src/data/types';
import { DEFAULT_LEGEND } from '../src/data/terrain';

/** Cria uma fase mínima para testes a partir de um mapa em texto. */
export function makeStage(rows: string[], units: UnitPlacement[]): StageDef {
  return {
    id: 'test', chapterId: 'c1', order: 0, name: 'Teste',
    objective: { kind: 'rout', description: '' },
    map: { rows, legend: DEFAULT_LEGEND },
    units, preDialogue: [], postDialogue: [], events: [],
  };
}
