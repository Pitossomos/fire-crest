import type { TerrainDef } from './types';

export const TERRAIN: Record<string, TerrainDef> = {
  plain:  { id: 'plain',  name: 'Planície',  moveCost: 1,    def: 0, avoid: 0,  heal: 0 },
  road:   { id: 'road',   name: 'Estrada',   moveCost: 1,    def: 0, avoid: 0,  heal: 0 },
  forest: { id: 'forest', name: 'Floresta',  moveCost: 2,    def: 1, avoid: 20, heal: 0 },
  hill:   { id: 'hill',   name: 'Colina',    moveCost: 3,    def: 1, avoid: 30, heal: 0 },
  house:  { id: 'house',  name: 'Casa',      moveCost: 1,    def: 0, avoid: 10, heal: 0 },
  fort:   { id: 'fort',   name: 'Fortaleza', moveCost: 2,    def: 2, avoid: 20, heal: 10 },
  gate:   { id: 'gate',   name: 'Portão',    moveCost: 1,    def: 3, avoid: 30, heal: 10 },
  floor:  { id: 'floor',  name: 'Piso',      moveCost: 1,    def: 0, avoid: 0,  heal: 0 },
  bridge: { id: 'bridge', name: 'Ponte',     moveCost: 1,    def: 0, avoid: 0,  heal: 0 },
  water:  { id: 'water',  name: 'Rio',       moveCost: null, def: 0, avoid: 0,  heal: 0 },
  wall:   { id: 'wall',   name: 'Muralha',   moveCost: null, def: 0, avoid: 0,  heal: 0 },
};

/** Legenda padrão dos mapas em texto. */
export const DEFAULT_LEGEND: Record<string, string> = {
  '.': 'plain',
  '=': 'road',
  'f': 'forest',
  'h': 'hill',
  'H': 'house',
  'F': 'fort',
  'G': 'gate',
  'b': 'bridge',
  ',': 'floor',
  '~': 'water',
  '#': 'wall',
};
