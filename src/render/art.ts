/**
 * Pixel-art procedural (placeholder até a chegada dos assets CC0 definitivos).
 * Módulo puro — não depende do Phaser — para poder ser testado.
 */
import type { Faction } from '../data/types';
import { PixelCanvas, hash2 } from './pixel-canvas';
import { BASE_TILE } from './layout';

const N = BASE_TILE;

// ---------------------------------------------------------------------------
// Paletas
// ---------------------------------------------------------------------------

export const FACTION_COLORS: Record<Faction, { c: string; d: string }> = {
  player: { c: '#3f6fd8', d: '#24418a' },
  enemy: { c: '#c8433a', d: '#7a2420' },
  ally: { c: '#3fa45b', d: '#226b37' },
};

const BASE_PALETTE: Record<string, string> = {
  o: '#1a1420', // contorno
  s: '#f0c8a0', // pele
  h: '#8a4a2a', // cabelo
  m: '#c9d1d9', // metal
  n: '#7d8894', // metal escuro
  w: '#8b5a2b', // madeira
  k: '#141018', // preto do hábito
  r: '#b0182a', // vermelho-sangue
  b: '#e9e2cc', // branco-osso
  f: '#ff8a1f', // fogo
  y: '#ffd34d', // ouro
  g: '#8e98a3', // cinza
  e: '#d8f0ff', // olhos vazios (Esvaído)
};

// ---------------------------------------------------------------------------
// Unidades: corpo base + camadas por classe
// ---------------------------------------------------------------------------

const BODY: readonly string[] = [
  '................',
  '................',
  '................',
  '......oooo......',
  '.....osssso.....',
  '.....osssso.....',
  '......osso......',
  '....oddccddo....',
  '...osdccccdso...',
  '...osdccccdso...',
  '....odccccdo....',
  '....oddddddo....',
  '....occoocco....',
  '....occoocco....',
  '....oooooooo....',
  '................',
];

/** Camadas sobrepostas ao corpo ('.' mantém o pixel de baixo). */
const LAYERS: Record<string, readonly string[]> = {
  // Aren: cabelo espetado e a Crista de Fogo brilhando na mão esquerda.
  bearer: [
    '................',
    '................',
    '......h..h......',
    '.....ohhhho.....',
    '.....hsssso.....',
    '................',
    '................',
    '................',
    '...f............',
    '..fyf...........',
    '...f............',
  ],
  // Mira: rabo de cavalo.
  swordfighter: [
    '................',
    '................',
    '................',
    '.....ohhhhoo....',
    '.....hsssshh....',
    '..........hh....',
    '...........h....',
  ],
  // Hadric: elmo, armadura pesada, costeletas e barba.
  lancer: [
    '................',
    '................',
    '......mmmm......',
    '.....mnnnnm.....',
    '.....mhsshm.....',
    '.....mhsshm.....',
    '......hhhh......',
    '....mmddddmm....',
    '...omdmmmmdmo...',
    '...omdmmmmdmo...',
    '....mdmmmmdm....',
  ],
  // Arqueiro: capuz na cor da facção, franja e mechas por baixo.
  archer: [
    '................',
    '................',
    '......dddd......',
    '.....dddddd.....',
    '.....dhhhhd.....',
    '.....dssssd.....',
    '.....dh..hd.....',
  ],
  // Clérigo: capuz branco com faixa dourada, franja e mechas por baixo.
  cleric: [
    '................',
    '................',
    '......bbbb......',
    '.....bbbbbb.....',
    '.....bhhhhb.....',
    '.....bssssb.....',
    '.....bh..hb.....',
    '................',
    '.......yy.......',
    '.......yy.......',
    '.......yy.......',
  ],
  // Piromante: chapéu pontudo com o cabelo escapando por baixo.
  pyromancer: [
    '........o.......',
    '.......odo......',
    '......occco.....',
    '....oddddddo....',
    '....hhsssshh....',
    '....h......h....',
  ],
  // Guerreira (Kaira): cabelo longo solto, faixa na testa na cor da facção.
  axefighter: [
    '................',
    '................',
    '.....hhhhhh.....',
    '....hddddddh....',
    '....hhsssshh....',
    '....hhsssshh....',
    '....hh....hh....',
    '...hh......hh...',
    '...h........h...',
  ],
  // Mago de Luz (Ilian): tiara dourada, cabelo nos ombros e um sol bordado no peito.
  lightmage: [
    '................',
    '................',
    '.....hhhhhh.....',
    '.....hyyyyh.....',
    '....hhsssshh....',
    '....h......h....',
    '................',
    '................',
    '.......yy.......',
    '......yyyy......',
    '.......yy.......',
  ],
  // Bandido: bandana e barba.
  bandit: [
    '................',
    '................',
    '................',
    '.....odddddd....',
    '.....osssso.dd..',
    '.....hsssshd....',
    '......hhhh......',
  ],
  // Esvaído: olhos vazios, roupa em farrapos.
  hollow: [
    '................',
    '................',
    '................',
    '......oooo......',
    '.....osssso.....',
    '.....oesseo.....',
    '......osso......',
    '................',
    '................',
    '................',
    '....odc.cddo....',
    '....od.dd.do....',
  ],
  // Monge do Ocaso — hábito do Grande Esquema: capuz pontudo (koukoulion)
  // e escapulário (analavos) com cruz-escada sobre o Calvário em osso e sangue.
  dusk_monk: [
    '.......k........',
    '......kkk.......',
    '.....kkkkkk.....',
    '.....kkkkkk.....',
    '....kkssssk.....',
    '....kkssssk.....',
    '....kkkkkkkk....',
    '....kkkbbkkk....',
    '...kskbbbbksk...',
    '...kskkbbkksk...',
    '....kkrbbrkk....',
    '....kkrrrrkk....',
    '....kkkkkkkk....',
    '....kkkkkkkk....',
    '....kkkkkkkk....',
  ],
  // Inquisidora Seraphine — Grande Esquema ornamentado: bordas vermelhas,
  // caveira de osso, sol eclipsado dourado e rosário de cinzas.
  inquisitor: [
    '.......k........',
    '......krk.......',
    '.....kkrkkk.....',
    '.....rkkkkr.....',
    '....kkssssk.....',
    '....kkssssk.....',
    '....rkkkkkkr....',
    '....rkbbbbkr....',
    '...kskbkkbksk...',
    '...kskbbbbksk...',
    '....rkkyykkr....',
    '....rkyrrykr....',
    '....rkkyykkr....',
    '....rkkkkkkr....',
    '....rrrrrrrr....',
  ],
};

/** Armas desenhadas na mão direita (lado direito do sprite). */
const WEAPON_LAYERS: Record<string, readonly string[]> = {
  sword: [
    '................',
    '................',
    '................',
    '.............m..',
    '.............m..',
    '.............m..',
    '.............m..',
    '.............m..',
    '............yyy.',
    '.............w..',
  ],
  lance: [
    '.............m..',
    '............mmm.',
    '.............w..',
    '.............w..',
    '.............w..',
    '.............w..',
    '.............w..',
    '.............w..',
    '.............w..',
    '.............w..',
    '.............w..',
    '.............w..',
    '.............w..',
  ],
  axe: [
    '................',
    '................',
    '................',
    '.............nmm',
    '.............wmm',
    '.............wnm',
    '.............w..',
    '.............w..',
    '.............w..',
    '.............w..',
  ],
  bow: [
    '................',
    '................',
    '................',
    '.............w..',
    '..............w.',
    '..............wb',
    '..............wb',
    '..............wb',
    '..............wb',
    '..............w.',
    '.............w..',
  ],
  tome: [
    '................',
    '................',
    '................',
    '................',
    '................',
    '.............f..',
    '............fyf.',
    '.............f..',
    '................',
    '............rrr.',
    '............rbr.',
  ],
  // Tomo da Aurora: livro claro com um brilho solar.
  light: [
    '................',
    '................',
    '................',
    '................',
    '................',
    '.............y..',
    '............yby.',
    '.............y..',
    '................',
    '............bbb.',
    '............byb.',
  ],
  staff: [
    '................',
    '.............y..',
    '............yby.',
    '.............y..',
    '.............w..',
    '.............w..',
    '.............w..',
    '.............w..',
    '.............w..',
    '.............w..',
    '.............w..',
    '.............w..',
    '.............w..',
  ],
  dark: [
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '............kkk.',
    '............krk.',
    '............kkk.',
  ],
  claw: [
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '................',
    '..o..........o..',
    '.oo..........oo.',
  ],
};

/** Arma desenhada pela Inquisidora no lugar do tomo: rosário de contas de cinza. */
const ROSARY: readonly string[] = [
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '.............g..',
  '............g.g.',
  '............g.g.',
  '.............g..',
  '.............r..',
];

export interface UnitArtSpec {
  classId: string;
  weaponType: string;
  faction: Faction;
  /** Cor do cabelo do personagem (sobrescreve o castanho padrão). */
  hair?: string;
}

/** Monta o sprite 16×16 de uma unidade. */
export function drawUnit(spec: UnitArtSpec): PixelCanvas {
  const canvas = new PixelCanvas(N, N);
  const palette: Record<string, string> = { ...BASE_PALETTE, ...FACTION_COLORS[spec.faction] };
  if (spec.classId === 'hollow') {
    Object.assign(palette, { s: '#a7b0b8', c: '#5d6670', d: '#3e454d' });
  }
  if (spec.classId === 'dusk_monk' || spec.classId === 'inquisitor') {
    Object.assign(palette, { c: BASE_PALETTE.k, d: BASE_PALETTE.k });
  }
  if (spec.hair) palette.h = spec.hair;
  canvas.stamp(BODY, palette);
  const layer = LAYERS[spec.classId];
  if (layer) canvas.stamp(layer, palette);
  const weapon = spec.classId === 'inquisitor' ? ROSARY : WEAPON_LAYERS[spec.weaponType];
  if (weapon) canvas.stamp(weapon, palette);
  return canvas;
}

/** Todas as camadas (para validação em testes). */
export const ALL_TEMPLATES: Record<string, readonly string[]> = {
  body: BODY,
  rosary: ROSARY,
  ...Object.fromEntries(Object.entries(LAYERS).map(([k, v]) => [`layer:${k}`, v])),
  ...Object.fromEntries(Object.entries(WEAPON_LAYERS).map(([k, v]) => [`weapon:${k}`, v])),
};

// ---------------------------------------------------------------------------
// Terrenos
// ---------------------------------------------------------------------------

const GRASS = ['#5a9e4b', '#64a854', '#4f9142'];
const WATER = ['#2f5f9e', '#3a6fb0', '#4a80c4'];

function grass(c: PixelCanvas, seed: number): void {
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) {
      const r = hash2(x, y, seed);
      c.set(x, y, r < 0.12 ? GRASS[2] : r > 0.9 ? GRASS[1] : GRASS[0]);
    }
  }
  // Florzinhas ocasionais.
  if (hash2(seed, 7) > 0.6) c.set(3 + Math.floor(hash2(seed, 1) * 10), 3 + Math.floor(hash2(seed, 2) * 10), '#f4e27a');
}

function water(c: PixelCanvas, seed: number): void {
  for (let y = 0; y < N; y++) {
    for (let x = 0; x < N; x++) c.set(x, y, WATER[1]);
  }
  for (let i = 0; i < 4; i++) {
    const wx = Math.floor(hash2(i, seed) * 12);
    const wy = 2 + i * 4;
    c.rect(wx, wy, 4, 1, WATER[2]);
    c.set(wx + 4, wy + 1, WATER[0]);
  }
}

function bricks(c: PixelCanvas, base: string, mortar: string, dark: string): void {
  c.fill(mortar);
  for (let row = 0; row < 4; row++) {
    const offset = row % 2 === 0 ? 0 : 4;
    for (let col = -1; col < 2; col++) {
      const x0 = col * 8 + offset;
      c.rect(x0 + 1, row * 4 + 1, 7, 3, base);
      c.rect(x0 + 1, row * 4 + 3, 7, 1, dark);
    }
  }
}

const TREE: readonly string[] = [
  '......aaaa......',
  '....aaabbaaa....',
  '...aabbbbbbaa...',
  '..aabbbbbbbbaa..',
  '..abbbcbbbbbba..',
  '.aabbbbbbcbbbaa.',
  '.abbcbbbbbbbbba.',
  '.aabbbbbbbbcbaa.',
  '..aabbbbbbbbaa..',
  '...aaabbbbaaa...',
  '.....aaaaaa.....',
  '.......tt.......',
  '.......tt.......',
  '......tttt......',
];
const TREE_PALETTE = { a: '#1f4d26', b: '#2f6b33', c: '#4c9a4a', t: '#5b3a1e' };

const HILL: readonly string[] = [
  '................',
  '................',
  '................',
  '................',
  '.......aa.......',
  '.....aabbaa.....',
  '....abbbbbba....',
  '...abbbcbbbba...',
  '..abbbbbbbcbba..',
  '.abbcbbbbbbbbba.',
  'aabbbbbbbbbbbbaa',
  'dddddddddddddddd',
];
const HILL_PALETTE = { a: '#6e5a3a', b: '#8c7448', c: '#a48c5c', d: '#4f9142' };

const HOUSE: readonly string[] = [
  '................',
  '.......rr.......',
  '......rrrr......',
  '.....rrRRrr.....',
  '....rrRRRRrr....',
  '...rrRRRRRRrr...',
  '..rrrrrrrrrrrr..',
  '...wwwwwwwwww...',
  '...wwWwwwwWww...',
  '...wwWwwwwWww...',
  '...wwwwddwwww...',
  '...wwwwddwwww...',
  '...wwwwddwwww...',
  '...oooooooooo...',
];
const HOUSE_PALETTE = { r: '#a8402e', R: '#c45a3c', w: '#d9c3a0', W: '#6fa0c8', d: '#6b4423', o: '#4a3a2a' };

const FORT: readonly string[] = [
  'ss.ss.ss.ss.ss.s',
  'ssssssssssssssss',
  'sSsssSsssSsssSss',
  'ssssssssssssssss',
  'ss.....ff.....ss',
  'sS.....fF.....sS',
  'ss.....f......ss',
  'sS............sS',
  'ss............ss',
  'sS............sS',
  'ssssssssssssssss',
  'sSsssSsssSsssSss',
  'ssssssssssssssss',
];
const FORT_PALETTE = { s: '#8a8a92', S: '#6a6a74', f: '#7a5a3a', F: '#ffb347' };

const GATE: readonly string[] = [
  'ssssssssssssssss',
  'sSsssSsssSsssSss',
  'ssssssssssssssss',
  'sssss......sssss',
  'ssss..dddd..ssss',
  'sss..dddddd..sss',
  'sss.dddddddd.sss',
  'sss.dwdwdwdd.sss',
  'sss.dwdwdwdd.sss',
  'sss.dwdwdwdd.sss',
  'sss.dddddddd.sss',
  'sss.dddddddd.sss',
  'ssssssssssssssss',
];
const GATE_PALETTE = { s: '#8a8a92', S: '#6a6a74', d: '#2a2028', w: '#5b3a1e' };

/** Desenha o tile 16×16 do terreno (com variação por `variant`). */
export function drawTerrain(terrainId: string, variant: number): PixelCanvas {
  const c = new PixelCanvas(N, N);
  switch (terrainId) {
    case 'plain':
      grass(c, variant);
      break;
    case 'road':
      c.fill('#b89a6a');
      for (let i = 0; i < 10; i++) c.set(Math.floor(hash2(i, variant) * N), Math.floor(hash2(variant, i) * N), '#9c8054');
      for (let i = 0; i < 5; i++) c.set(Math.floor(hash2(i + 9, variant) * N), Math.floor(hash2(variant, i + 9) * N), '#d4b888');
      break;
    case 'forest':
      grass(c, variant);
      c.stamp(TREE, TREE_PALETTE, 0, 1);
      break;
    case 'hill':
      grass(c, variant);
      c.stamp(HILL, HILL_PALETTE, 0, 3);
      break;
    case 'house':
      grass(c, variant);
      c.stamp(HOUSE, HOUSE_PALETTE, 0, 1);
      break;
    case 'fort':
      c.fill('#9e9070');
      c.stamp(FORT, FORT_PALETTE, 0, 2);
      break;
    case 'gate':
      c.fill('#9e9070');
      c.stamp(GATE, GATE_PALETTE, 0, 2);
      break;
    case 'bridge':
      water(c, variant);
      for (let y = 0; y < N; y++) {
        c.rect(2, y, 12, 1, y % 3 === 2 ? '#7a5030' : '#a07040');
      }
      c.rect(1, 0, 1, N, '#5b3a1e');
      c.rect(14, 0, 1, N, '#5b3a1e');
      break;
    case 'water':
      water(c, variant);
      break;
    case 'floor':
      c.fill('#6e6670');
      for (let row = 0; row < 2; row++) {
        for (let col = 0; col < 2; col++) {
          c.rect(col * 8 + 1, row * 8 + 1, 6, 6, (row + col + variant) % 2 === 0 ? '#857c88' : '#7a7280');
        }
      }
      if (hash2(variant, 3) > 0.5) c.set(4 + variant, 10, '#5a525c');
      break;
    case 'wall':
      bricks(c, '#6a6a76', '#3a3a44', '#55555f');
      break;
    default:
      c.fill('#ff00ff'); // terreno sem arte: magenta chama a atenção
  }
  return c;
}

/** Número de variações geradas por terreno. */
export const TERRAIN_VARIANTS = 4;
