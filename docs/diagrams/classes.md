<!-- GERADO AUTOMATICAMENTE por scripts/diagrams/generate.ts — não edite à mão. Rode `npm run diagrams`. -->

# Diagrama de classes

Extraído do AST TypeScript com ts-morph. Legenda: `<|--` herança, `<|..` implementação, `*--` composição (coleção), `-->` associação; `<<module>>` = arquivo que exporta funções; `$` = estático.

## Visão geral

Todas as classes, interfaces e módulos de funções de `src/`, agrupados por camada, sem membros.

```mermaid
---
title: Classes — visão geral
---
classDiagram
  direction LR
  namespace core {
    class BattleMap
    class BattleState
    class RangeInfo {
      <<interface>>
    }
    class mod_core_faction["faction.ts"] {
      <<module>>
    }
    class Point {
      <<interface>>
    }
    class mod_core_grid["grid.ts"] {
      <<module>>
    }
    class ReachNode {
      <<interface>>
    }
    class mod_core_pathfinding["pathfinding.ts"] {
      <<module>>
    }
    class Rng
    class mod_core_unit_factory["unit-factory.ts"] {
      <<module>>
    }
    class Unit
    class UnitInit {
      <<interface>>
    }
  }
  namespace data {
    class GameDatabase {
      <<interface>>
    }
    class mod_data_index["index.ts"] {
      <<module>>
    }
    class mod_data_stats["stats.ts"] {
      <<module>>
    }
    class TerrainDef {
      <<interface>>
    }
    class WeaponDef {
      <<interface>>
    }
    class ClassDef {
      <<interface>>
    }
    class CharacterDef {
      <<interface>>
    }
    class MapDef {
      <<interface>>
    }
    class UnitPlacement {
      <<interface>>
    }
    class ObjectiveDef {
      <<interface>>
    }
    class DialogueLine {
      <<interface>>
    }
    class EventTrigger {
      <<interface>>
    }
    class StageDef {
      <<interface>>
    }
    class ChapterDef {
      <<interface>>
    }
    class RosterEntry {
      <<interface>>
    }
    class SaveData {
      <<interface>>
    }
  }
  namespace render {
    class ActionMenu
    class MenuOption {
      <<interface>>
    }
    class UnitArtSpec {
      <<interface>>
    }
    class mod_render_art["art.ts"] {
      <<module>>
    }
    class MapView
    class mod_render_PhaseBanner["PhaseBanner.ts"] {
      <<module>>
    }
    class PixelCanvas
    class mod_render_pixel_canvas["pixel-canvas.ts"] {
      <<module>>
    }
    class SidePanel
    class mod_render_textures["textures.ts"] {
      <<module>>
    }
    class UnitSprite
  }
  namespace scenes {
    class BattleScene
    class Selection {
      <<interface>>
    }
    class BootScene
    class TitleScene
  }
  class Phaser_Scene["Phaser.Scene"] {
    <<external>>
  }
  ActionMenu "1" *-- "*" MenuOption : options
  BattleMap "1" *-- "*" TerrainDef : tiles
  BattleScene "1" *-- "*" UnitSprite : sprites
  BattleScene --> ActionMenu : menu
  BattleScene --> BattleState : state
  BattleScene --> MapView : mapView
  BattleScene --> Point : cursor
  BattleScene --> Selection : selection
  BattleScene --> SidePanel : panel
  BattleState "1" *-- "*" Unit : units
  BattleState --> BattleMap : map
  BattleState --> StageDef : stage
  ChapterDef "1" *-- "*" StageDef : stageIds
  CharacterDef --> ClassDef : classId
  CharacterDef --> WeaponDef : weaponId
  DialogueLine --> CharacterDef : speakerId
  EventTrigger "1" *-- "*" DialogueLine : dialogue
  EventTrigger "1" *-- "*" UnitPlacement : spawns
  EventTrigger --> CharacterDef : otherUnitId
  EventTrigger --> CharacterDef : recruitId
  EventTrigger --> CharacterDef : unitId
  GameDatabase "1" *-- "*" CharacterDef : characters
  GameDatabase "1" *-- "*" ClassDef : classes
  GameDatabase "1" *-- "*" StageDef : stages
  GameDatabase "1" *-- "*" TerrainDef : terrain
  GameDatabase "1" *-- "*" WeaponDef : weapons
  MapDef "1" *-- "*" TerrainDef : legend
  MapView --> BattleMap : map
  ObjectiveDef --> CharacterDef : targetId
  Phaser_Scene <|-- BattleScene
  Phaser_Scene <|-- BootScene
  Phaser_Scene <|-- TitleScene
  RangeInfo "1" *-- "*" Point : attack
  RangeInfo "1" *-- "*" Point : move
  RangeInfo "1" *-- "*" ReachNode : reach
  ReachNode --> Point : point
  RosterEntry --> CharacterDef : characterId
  RosterEntry --> WeaponDef : weaponId
  SaveData "1" *-- "*" RosterEntry : roster
  SaveData --> ChapterDef : chapterId
  Selection --> Point : origin
  Selection --> RangeInfo : range
  Selection --> Unit : unit
  StageDef "1" *-- "*" DialogueLine : postDialogue
  StageDef "1" *-- "*" DialogueLine : preDialogue
  StageDef "1" *-- "*" EventTrigger : events
  StageDef "1" *-- "*" UnitPlacement : units
  StageDef --> ChapterDef : chapterId
  StageDef --> MapDef : map
  StageDef --> ObjectiveDef : objective
  Unit --> ClassDef : classDef
  Unit --> WeaponDef : weapon
  UnitInit --> ClassDef : classDef
  UnitInit --> Point : position
  UnitInit --> WeaponDef : weapon
  UnitPlacement --> CharacterDef : characterId
  UnitPlacement --> ClassDef : classId
  UnitPlacement --> WeaponDef : weaponId
  UnitSprite --> Unit : unit
```

## Camada `core`

Atributos e métodos dos tipos em `src/core/`. Relações apenas internas à camada.

```mermaid
---
title: Classes — core
---
classDiagram
  direction LR
  namespace core {
    class BattleMap {
      +width: number
      +height: number
      -tiles: TerrainDef[][]
      +inBounds(p: Point) boolean
      +terrainAt(p: Point) TerrainDef
      +moveCost(p: Point) number | null
    }
    class BattleState {
      +stage: StageDef
      +map: BattleMap
      +units: Unit[]
      +turn: number
      +phase: Faction
      +livingUnits: Unit[]
      +unitAt(p: Point) Unit | undefined
      +unitsOf(faction: Faction) Unit[]
      +rangeFor(unit: Unit) RangeInfo
      +moveUnit(unit: Unit, to: Point) Point[]
      +undoMove(unit: Unit, origin: Point) void
      +wait(unit: Unit) void
      +phaseExhausted() boolean
      +endPhase() Faction
    }
    class RangeInfo {
      <<interface>>
      +reach: Map~string, ReachNode~
      +move: Point[]
      +attack: Point[]
    }
    class mod_core_faction["faction.ts"] {
      <<module>>
      +areHostile(a: Faction, b: Faction) boolean
    }
    class Point {
      <<interface>>
      +x: number
      +y: number
    }
    class mod_core_grid["grid.ts"] {
      <<module>>
      +pointKey(p: Point) string
      +parseKey(key: string) Point
      +samePoint(a: Point, b: Point) boolean
      +manhattan(a: Point, b: Point) number
      +neighbors(p: Point) Point[]
      +tilesInRange(p: Point, min: number, max: number) Point[]
    }
    class ReachNode {
      <<interface>>
      +point: Point
      +cost: number
      +prev: string | null
    }
    class mod_core_pathfinding["pathfinding.ts"] {
      <<module>>
      +computeReach(map: BattleMap, unit: Unit, occupancy: Occupancy) Map~string, ReachNode~
      +movementTiles(reach: Map~string, ReachNode~, unit: Unit, occupancy: Occupancy) Point[]
      +attackTiles(map: BattleMap, destinations: Point[], minRange: number, maxRange: number) Point[]
      +buildPath(reach: Map~string, ReachNode~, target: Point) Point[]
    }
    class Rng {
      -state: number
      +next() number
      +int(max: number) number
      +roll(percent: number) boolean
    }
    class mod_core_unit_factory["unit-factory.ts"] {
      <<module>>
      +genericStats(base: Stats, growths: Stats, level: number) Stats
      +createUnit(p: UnitPlacement, db: GameDatabase, index: number) Unit
    }
    class Unit {
      +id: string
      +name: string
      +faction: Faction
      +classDef: ClassDef
      +characterId: string
      +ai: AiBehavior
      +boss: boolean
      +weapon: WeaponDef
      +level: number
      +exp: number
      +stats: Stats
      +growths: Stats
      +hp: number
      +x: number
      +y: number
      +hasActed: boolean
      +maxHp: number
      +move: number
      +isLord: boolean
      +position: Point
      +isAlive() boolean
      +canAct() boolean
      +moveTo(p: Point) void
    }
    class UnitInit {
      <<interface>>
      +id: string
      +name: string
      +faction: Faction
      +classDef: ClassDef
      +weapon: WeaponDef
      +level: number
      +stats: Stats
      +growths: Stats
      +position: Point
      +characterId?: string
      +ai?: AiBehavior
      +boss?: boolean
    }
  }
  BattleState "1" *-- "*" Unit : units
  BattleState --> BattleMap : map
  RangeInfo "1" *-- "*" Point : attack
  RangeInfo "1" *-- "*" Point : move
  RangeInfo "1" *-- "*" ReachNode : reach
  ReachNode --> Point : point
  UnitInit --> Point : position
```

## Camada `data`

Atributos e métodos dos tipos em `src/data/`. Relações apenas internas à camada.

```mermaid
---
title: Classes — data
---
classDiagram
  direction LR
  namespace data {
    class GameDatabase {
      <<interface>>
      +classes: Record~string, ClassDef~
      +weapons: Record~string, WeaponDef~
      +terrain: Record~string, TerrainDef~
      +characters: Record~string, CharacterDef~
      +stages: Record~string, StageDef~
    }
    class mod_data_index["index.ts"] {
      <<module>>
      +lookup(table: Record~string, T~, id: string, what: string) T
    }
    class mod_data_stats["stats.ts"] {
      <<module>>
      +stats(hp: number, str: number, mag: number, skl: number, spd: number, lck: number, def: number, res: number) Stats
    }
    class TerrainDef {
      <<interface>>
      +id: string
      +name: string
      +moveCost: number | null
      +def: number
      +avoid: number
      +heal: number
    }
    class WeaponDef {
      <<interface>>
      +id: string
      +name: string
      +type: WeaponType
      +might: number
      +hit: number
      +crit: number
      +minRange: number
      +maxRange: number
      +magic: boolean
      +heal?: number
    }
    class ClassDef {
      <<interface>>
      +id: string
      +name: string
      +move: number
      +weaponTypes: WeaponType[]
      +baseStats: Stats
      +growths: Stats
      +sprite: string
      +isLord?: boolean
    }
    class CharacterDef {
      <<interface>>
      +id: string
      +name: string
      +title: string
      +classId: Ref~ClassDef~
      +level: number
      +stats: Stats
      +growths: Stats
      +weaponId: Ref~WeaponDef~
      +bio: string
    }
    class MapDef {
      <<interface>>
      +rows: string[]
      +legend: Record~string, Ref~TerrainDef~~
    }
    class UnitPlacement {
      <<interface>>
      +characterId?: Ref~CharacterDef~
      +classId?: Ref~ClassDef~
      +weaponId?: Ref~WeaponDef~
      +name?: string
      +faction: Faction
      +x: number
      +y: number
      +level?: number
      +ai?: AiBehavior
      +boss?: boolean
    }
    class ObjectiveDef {
      <<interface>>
      +kind: ObjectiveKind
      +description: string
      +x?: number
      +y?: number
      +turns?: number
      +targetId?: Ref~CharacterDef~
    }
    class DialogueLine {
      <<interface>>
      +speakerId: Ref~CharacterDef~
      +side: PortraitSide
      +text: string
    }
    class EventTrigger {
      <<interface>>
      +id: string
      +on: EventKind
      +turn?: number
      +unitId?: Ref~CharacterDef~
      +otherUnitId?: Ref~CharacterDef~
      +x?: number
      +y?: number
      +dialogue: DialogueLine[]
      +spawns: UnitPlacement[]
      +recruitId?: Ref~CharacterDef~
    }
    class StageDef {
      <<interface>>
      +id: string
      +chapterId: Ref~ChapterDef~
      +order: number
      +name: string
      +objective: ObjectiveDef
      +map: MapDef
      +units: UnitPlacement[]
      +preDialogue: DialogueLine[]
      +postDialogue: DialogueLine[]
      +events: EventTrigger[]
    }
    class ChapterDef {
      <<interface>>
      +id: string
      +name: string
      +stageIds: Ref~StageDef~[]
    }
    class RosterEntry {
      <<interface>>
      +characterId: Ref~CharacterDef~
      +level: number
      +exp: number
      +stats: Stats
      +weaponId: Ref~WeaponDef~
      +alive: boolean
    }
    class SaveData {
      <<interface>>
      +version: number
      +mode: GameMode
      +chapterId: Ref~ChapterDef~
      +nextStageIndex: number
      +roster: RosterEntry[]
    }
  }
  ChapterDef "1" *-- "*" StageDef : stageIds
  CharacterDef --> ClassDef : classId
  CharacterDef --> WeaponDef : weaponId
  DialogueLine --> CharacterDef : speakerId
  EventTrigger "1" *-- "*" DialogueLine : dialogue
  EventTrigger "1" *-- "*" UnitPlacement : spawns
  EventTrigger --> CharacterDef : otherUnitId
  EventTrigger --> CharacterDef : recruitId
  EventTrigger --> CharacterDef : unitId
  GameDatabase "1" *-- "*" CharacterDef : characters
  GameDatabase "1" *-- "*" ClassDef : classes
  GameDatabase "1" *-- "*" StageDef : stages
  GameDatabase "1" *-- "*" TerrainDef : terrain
  GameDatabase "1" *-- "*" WeaponDef : weapons
  MapDef "1" *-- "*" TerrainDef : legend
  ObjectiveDef --> CharacterDef : targetId
  RosterEntry --> CharacterDef : characterId
  RosterEntry --> WeaponDef : weaponId
  SaveData "1" *-- "*" RosterEntry : roster
  SaveData --> ChapterDef : chapterId
  StageDef "1" *-- "*" DialogueLine : postDialogue
  StageDef "1" *-- "*" DialogueLine : preDialogue
  StageDef "1" *-- "*" EventTrigger : events
  StageDef "1" *-- "*" UnitPlacement : units
  StageDef --> ChapterDef : chapterId
  StageDef --> MapDef : map
  StageDef --> ObjectiveDef : objective
  UnitPlacement --> CharacterDef : characterId
  UnitPlacement --> ClassDef : classId
  UnitPlacement --> WeaponDef : weaponId
```

## Camada `render`

Atributos e métodos dos tipos em `src/render/`. Relações apenas internas à camada.

```mermaid
---
title: Classes — render
---
classDiagram
  direction LR
  namespace render {
    class ActionMenu {
      -scene: Phaser.Scene
      -container: Phaser.GameObjects.Container
      -options: MenuOption[]
      -index: number
      -items: Phaser.GameObjects.Text[]
      -highlight: Phaser.GameObjects.Rectangle
      -onPick: Function
      +isOpen: boolean
      +open(x: number, y: number, options: MenuOption[], onPick: Function) void
      +moveSelection(delta: number) void
      +confirm() void
      +close() void
      -select(i: number) void
    }
    class MenuOption {
      <<interface>>
      +id: string
      +label: string
      +enabled?: boolean
    }
    class UnitArtSpec {
      <<interface>>
      +classId: string
      +weaponType: string
      +faction: Faction
    }
    class mod_render_art["art.ts"] {
      <<module>>
      +drawUnit(spec: UnitArtSpec) PixelCanvas
      +drawTerrain(terrainId: string, variant: number) PixelCanvas
    }
    class MapView {
      -scene: Phaser.Scene
      -map: BattleMap
      -highlights: Phaser.GameObjects.Graphics
      -pathLayer: Phaser.GameObjects.Graphics
      -cursor: Phaser.GameObjects.Graphics
      -cursorTween: Phaser.Tweens.Tween
      +toPixel(p: Point) object$
      +toTile(px: number, py: number) Point | null
      +showRanges(move: Point[], attack: Point[], attackKind: HighlightKind) void
      +clearRanges() void
      +showPath(path: Point[]) void
      +clearPath() void
      +moveCursor(p: Point) void
      +setCursorVisible(visible: boolean) void
      -fillTiles(tiles: Point[], color: number, alpha: number) void
      -drawCursor() void
      +destroy() void
    }
    class mod_render_PhaseBanner["PhaseBanner.ts"] {
      <<module>>
      +showPhaseBanner(scene: Phaser.Scene, label: string, faction: keyof typeof BANNER_COLOR) Promise~void~
    }
    class PixelCanvas {
      +width: number
      +height: number
      -pixels: (string | null)[]
      +set(x: number, y: number, color: string | null) void
      +get(x: number, y: number) string | null
      +fill(color: string) void
      +rect(x: number, y: number, w: number, h: number, color: string) void
      +stamp(template: readonly string[], palette: Record~string, string~, ox: any, oy: any) void
      +paint(ctx: CanvasRenderingContext2D) void
    }
    class mod_render_pixel_canvas["pixel-canvas.ts"] {
      <<module>>
      +hash2(x: number, y: number, seed: any) number
    }
    class SidePanel {
      -turnText: Phaser.GameObjects.Text
      -terrainText: Phaser.GameObjects.Text
      -unitTitle: Phaser.GameObjects.Text
      -unitText: Phaser.GameObjects.Text
      -hpBar: Phaser.GameObjects.Graphics
      -helpText: Phaser.GameObjects.Text
      +setTurn(turn: number, phase: keyof typeof PHASE_LABEL) void
      +setTerrain(t: TerrainDef) void
      +setUnit(u: Unit | undefined) void
      +setHelp(message: string) void
    }
    class mod_render_textures["textures.ts"] {
      <<module>>
      +terrainTextureKey(terrainId: string, variant: number) string
      +unitTextureKey(sprite: string, weaponType: string, faction: Faction) string
      +generateTextures(scene: Phaser.Scene, db: GameDatabase) void
    }
    class UnitSprite {
      +unit: Unit
      -container: Phaser.GameObjects.Container
      -sprite: Phaser.GameObjects.Image
      -hpBar: Phaser.GameObjects.Graphics
      -scene: Phaser.Scene
      +refresh() void
      +snap() void
      +walk(path: Point[], msPerTile: any) Promise~void~
      +setSelected(selected: boolean) void
      +destroy() void
    }
  }
  ActionMenu "1" *-- "*" MenuOption : options
```

## Camada `scenes`

Atributos e métodos dos tipos em `src/scenes/`. Relações apenas internas à camada.

```mermaid
---
title: Classes — scenes
---
classDiagram
  direction LR
  namespace scenes {
    class BattleScene {
      -state: BattleState
      -mapView: MapView
      -panel: SidePanel
      -menu: ActionMenu
      -sprites: Map~string, UnitSprite~
      -mode: Mode
      -cursor: Point
      -selection: Selection
      -menuCancel: Function
      +battle: BattleState
      +create(data: object) void
      -bindInput() void
      -onKey(code: string) void
      -confirm() void
      -cancel() void
      -select(unit: Unit) void
      -deselect() void
      -inspect(unit: Unit) void
      -clearInspect() void
      -moveSelected(to: Point) Promise~void~
      -openUnitMenu(sel: Selection) void
      -undoMove(sel: Selection) void
      -finishAction(unit: Unit) void
      -openMapMenu() void
      -runEndPhase() Promise~void~
      -announcePhase() Promise~void~
      -setMode(mode: Mode) void
      -setCursor(p: Point) void
      -refreshPanel() void
      -refreshSprites() void
    }
    class Selection {
      <<interface>>
      +unit: Unit
      +origin: Point
      +range: RangeInfo
      +moveKeys: Set~string~
    }
    class BootScene {
      +create() void
    }
    class TitleScene {
      +create() void
      -spawnEmber(anywhere: boolean) void
    }
  }
  class Phaser_Scene["Phaser.Scene"] {
    <<external>>
  }
  BattleScene --> Selection : selection
  Phaser_Scene <|-- BattleScene
  Phaser_Scene <|-- BootScene
  Phaser_Scene <|-- TitleScene
```
