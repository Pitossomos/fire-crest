import type { ArmorDef } from './types';

export const ARMORS: Record<string, ArmorDef> = {
  leather: { id: 'leather', name: 'Couraça de Couro', def: 1, res: 0 },
  chainmail: { id: 'chainmail', name: 'Cota de Malha', def: 2, res: 0, spd: -1 },
  runic_mantle: { id: 'runic_mantle', name: 'Manto Rúnico', def: 0, res: 3 },
  plate: { id: 'plate', name: 'Armadura de Placas', def: 4, res: 0, hp: 2, spd: -2, heavy: true },
  dusk_mantle: { id: 'dusk_mantle', name: 'Manto do Ocaso', def: 2, res: 3 },
  bulwark: { id: 'bulwark', name: 'Armadura do Baluarte', def: 6, res: 0, hp: 3, spd: -3, heavy: true },
  dawn_aegis: { id: 'dawn_aegis', name: 'Égide da Aurora', def: 3, res: 3, hp: 3 },
};
