<!-- GERADO AUTOMATICAMENTE por scripts/diagrams/generate.ts — não edite à mão. Rode `npm run diagrams`. -->

# Diagrama Entidade-Relacionamento

Modelo de dados do jogo (definições estáticas em `src/data/` e o save). Para incluir uma nova entidade, marque a interface com `/** @entity Descrição */`.

## Entidades e relacionamentos

Interfaces marcadas com `@entity`. `Ref<X>` é chave estrangeira (FK) para X; listas e objetos embutidos são relações 1:N / 1:1.

```mermaid
---
title: Modelo de dados (entidades @entity)
---
erDiagram
  ChapterDef {
    string id PK
    string name
    list stageIds FK "-> StageDef"
  }
  CharacterDef {
    string id PK
    string name
    string title_ "campo title"
    string classId FK "-> ClassDef"
    number level
    Stats stats
    Stats growths
    string weaponId FK "-> WeaponDef"
    string bio
  }
  ClassDef_["ClassDef"] {
    string id PK
    string name
    number move
    list weaponTypes "WeaponType[]"
    Stats baseStats
    Stats growths
    string sprite
    boolean isLord "opcional"
  }
  DialogueLine {
    string speakerId FK "-> CharacterDef"
    PortraitSide side
    string text
  }
  EventTrigger {
    string id PK
    EventKind on
    number turn "opcional"
    string unitId FK "-> CharacterDef; opcional"
    string otherUnitId FK "-> CharacterDef; opcional"
    number x "opcional"
    number y "opcional"
    list dialogue "DialogueLine[]"
    list spawns "UnitPlacement[]"
    string recruitId FK "-> CharacterDef; opcional"
  }
  MapDef {
    list rows "string[]"
    map legend FK "-> TerrainDef"
  }
  ObjectiveDef {
    ObjectiveKind kind
    string description
    number x "opcional"
    number y "opcional"
    number turns "opcional"
    string targetId FK "-> CharacterDef; opcional"
  }
  RosterEntry {
    string characterId FK "-> CharacterDef"
    number level
    number exp
    Stats stats
    string weaponId FK "-> WeaponDef"
    boolean alive
  }
  SaveData {
    number version
    GameMode mode
    string chapterId FK "-> ChapterDef"
    number nextStageIndex
    list roster "RosterEntry[]"
  }
  StageDef {
    string id PK
    string chapterId FK "-> ChapterDef"
    number order
    string name
    ObjectiveDef objective
    MapDef map
    list units "UnitPlacement[]"
    list preDialogue "DialogueLine[]"
    list postDialogue "DialogueLine[]"
    list events "EventTrigger[]"
  }
  TerrainDef {
    string id PK
    string name
    number moveCost "number | null"
    number def
    number avoid
    number heal
  }
  UnitPlacement {
    string characterId FK "-> CharacterDef; opcional"
    string classId FK "-> ClassDef; opcional"
    string weaponId FK "-> WeaponDef; opcional"
    string name "opcional"
    Faction faction
    number x
    number y
    number level "opcional"
    AiBehavior ai "opcional"
    boolean boss "opcional"
  }
  WeaponDef {
    string id PK
    string name
    WeaponType type
    number might
    number hit
    number crit
    number minRange
    number maxRange
    boolean magic
    number heal "opcional"
  }
  ChapterDef }o--o{ StageDef : "stageIds"
  CharacterDef }o--|| ClassDef_ : "classId"
  CharacterDef }o--|| WeaponDef : "weaponId"
  DialogueLine }o--|| CharacterDef : "speakerId"
  EventTrigger ||--o{ DialogueLine : "dialogue"
  EventTrigger ||--o{ UnitPlacement : "spawns"
  EventTrigger }o--o| CharacterDef : "otherUnitId"
  EventTrigger }o--o| CharacterDef : "recruitId"
  EventTrigger }o--o| CharacterDef : "unitId"
  MapDef }o--o{ TerrainDef : "legend"
  ObjectiveDef }o--o| CharacterDef : "targetId"
  RosterEntry }o--|| CharacterDef : "characterId"
  RosterEntry }o--|| WeaponDef : "weaponId"
  SaveData ||--o{ RosterEntry : "roster"
  SaveData }o--|| ChapterDef : "chapterId"
  StageDef ||--o{ DialogueLine : "postDialogue"
  StageDef ||--o{ DialogueLine : "preDialogue"
  StageDef ||--o{ EventTrigger : "events"
  StageDef ||--o{ UnitPlacement : "units"
  StageDef ||--|| MapDef : "map"
  StageDef ||--|| ObjectiveDef : "objective"
  StageDef }o--|| ChapterDef : "chapterId"
  UnitPlacement }o--o| CharacterDef : "characterId"
  UnitPlacement }o--o| ClassDef_ : "classId"
  UnitPlacement }o--o| WeaponDef : "weaponId"
```

## Entidades

| Entidade | Descrição | Arquivo |
|---|---|---|
| `ChapterDef` | Capítulo da campanha. | `src/data/types.ts` |
| `CharacterDef` | Personagem nomeado (jogável ou chefe). | `src/data/types.ts` |
| `ClassDef` | Classe de unidade: atributos-base, crescimento e armas permitidas. | `src/data/types.ts` |
| `DialogueLine` | Uma fala de diálogo. | `src/data/types.ts` |
| `EventTrigger` | Evento disparado durante a batalha. | `src/data/types.ts` |
| `MapDef` | Mapa de uma fase em texto: cada caractere é um terreno. | `src/data/types.ts` |
| `ObjectiveDef` | Condição de vitória de uma fase. | `src/data/types.ts` |
| `RosterEntry` | Estado salvo de um personagem entre fases. | `src/data/types.ts` |
| `SaveData` | Save do jogo (localStorage). | `src/data/types.ts` |
| `StageDef` | Fase (batalha) de um capítulo. | `src/data/types.ts` |
| `TerrainDef` | Tipo de terreno do mapa e seus modificadores. | `src/data/types.ts` |
| `UnitPlacement` | Posição inicial de uma unidade numa fase. | `src/data/types.ts` |
| `WeaponDef` | Arma, tomo ou cajado. | `src/data/types.ts` |
