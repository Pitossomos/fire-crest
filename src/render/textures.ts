import Phaser from 'phaser';
import type { ClassDef, Faction } from '../data/types';
import type { GameDatabase } from '../data';
import { TERRAIN_VARIANTS, type UnitArtSpec, drawTerrain, drawUnit } from './art';
import type { PixelCanvas } from './pixel-canvas';

function register(scene: Phaser.Scene, key: string, art: PixelCanvas): void {
  if (scene.textures.exists(key)) return;
  const tex = scene.textures.createCanvas(key, art.width, art.height);
  if (!tex) throw new Error(`Não foi possível criar a textura ${key}`);
  art.paint(tex.getContext());
  tex.refresh();
}

export function terrainTextureKey(terrainId: string, variant: number): string {
  return `terrain_${terrainId}_${variant % TERRAIN_VARIANTS}`;
}

/** Chave da textura; com `characterId`, a versão com o cabelo próprio do personagem. */
export function unitTextureKey(sprite: string, weaponType: string, faction: Faction, characterId?: string): string {
  return `${sprite}_${weaponType}_${faction}${characterId ? `_${characterId}` : ''}`;
}

/** Usa a textura do personagem (cabelo colorido) se existir; senão, a genérica da classe. */
export function resolveUnitTexture(
  scene: Phaser.Scene, sprite: string, weaponType: string, faction: Faction, characterId?: string,
): string {
  const own = characterId ? unitTextureKey(sprite, weaponType, faction, characterId) : undefined;
  return own && scene.textures.exists(own) ? own : unitTextureKey(sprite, weaponType, faction);
}

/** Especificação do desenho de uma classe (montada, promovida, camada herdada). */
export function artSpecFor(cls: ClassDef, weaponType: string, faction: Faction, hair?: string): UnitArtSpec {
  return {
    classId: cls.id,
    weaponType,
    faction,
    hair,
    mounted: cls.movement === 'mounted',
    promoted: (cls.tier ?? 1) > 1,
    layerOf: cls.artBase,
  };
}

/** Gera todas as texturas procedurais (terrenos + unidades por classe/arma/facção). */
export function generateTextures(scene: Phaser.Scene, db: GameDatabase): void {
  for (const id of Object.keys(db.terrain)) {
    for (let v = 0; v < TERRAIN_VARIANTS; v++) register(scene, terrainTextureKey(id, v), drawTerrain(id, v));
  }
  for (const cls of Object.values(db.classes)) {
    for (const weaponType of cls.weaponTypes) {
      for (const faction of ['player', 'enemy', 'ally'] as const) {
        register(scene, unitTextureKey(cls.sprite, weaponType, faction), drawUnit(artSpecFor(cls, weaponType, faction)));
      }
    }
  }
  // Personagens com cabelo colorido ganham texturas próprias.
  for (const ch of Object.values(db.characters)) {
    if (!ch.hair) continue;
    const base = db.classes[ch.classId];
    // Classe original e a promovida (o cabelo acompanha a promoção).
    const classes = [base, ...(base.promotesTo ? [db.classes[base.promotesTo]] : [])];
    for (const cls of classes) {
      for (const weaponType of cls.weaponTypes) {
        for (const faction of ['player', 'enemy', 'ally'] as const) {
          register(scene, unitTextureKey(cls.sprite, weaponType, faction, ch.id), drawUnit(artSpecFor(cls, weaponType, faction, ch.hair)));
        }
      }
    }
  }
}
