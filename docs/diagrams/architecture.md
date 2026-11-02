<!-- GERADO AUTOMATICAMENTE por scripts/diagrams/generate.ts — não edite à mão. Rode `npm run diagrams`. -->

# Arquitetura do software

Gerado a partir dos imports reais com dependency-cruiser.

## Camadas

Dependências entre camadas de `src/` e pacotes externos. Setas tracejadas = apenas `import type`. Regras em `.dependency-cruiser.cjs` (`npm run lint:arch`).

```mermaid
---
title: Arquitetura — camadas
---
flowchart TB
  app["<b>main.ts — bootstrap do Phaser</b><br/>1 módulo(s)"]:::layer_app
  scenes["<b>scenes/ — cenas Phaser (controladores)</b><br/>3 módulo(s)"]:::layer_scenes
  render["<b>render/ — componentes visuais</b><br/>11 módulo(s)"]:::layer_render
  core["<b>core/ — regras do jogo (puro)</b><br/>12 módulo(s)"]:::layer_core
  data["<b>data/ — definições e conteúdo</b><br/>9 módulo(s)"]:::layer_data
  ext_phaser[("phaser")]:::external
  app -->|"1 import(s)"| ext_phaser
  app -->|"1 import(s)"| render
  app -->|"3 import(s)"| scenes
  core -->|"1 import(s), 8 só tipos"| data
  render -.->|"9 só tipos"| core
  render -.->|"4 só tipos"| data
  render -->|"8 import(s)"| ext_phaser
  scenes -->|"6 import(s), 1 só tipos"| core
  scenes -->|"2 import(s)"| data
  scenes -->|"3 import(s)"| ext_phaser
  scenes -->|"10 import(s)"| render
  classDef external fill:#e9e2cc,stroke:#5c4630,color:#1f1a24
  classDef layer_app fill:#f3dcc0,stroke:#8a4a2a,color:#1f1a24
  classDef layer_scenes fill:#f6c9c4,stroke:#7a2420,color:#1f1a24
  classDef layer_render fill:#f7d8b5,stroke:#b4531f,color:#1f1a24
  classDef layer_core fill:#c9d8f6,stroke:#24418a,color:#1f1a24
  classDef layer_data fill:#c8ecd2,stroke:#226b37,color:#1f1a24
  classDef layer_save fill:#ddd2f2,stroke:#4b3a6b,color:#1f1a24
```

## Módulos

Cada arquivo de `src/` e seus imports de valor (os `import type` estão resumidos na visão de camadas).

```mermaid
---
title: Arquitetura — dependências entre módulos
---
flowchart TB
  subgraph layer_app["src"]
    src_main_ts["main.ts"]
  end
  subgraph layer_scenes["src/scenes"]
    src_scenes_BattleScene_ts["BattleScene.ts"]
    src_scenes_BootScene_ts["BootScene.ts"]
    src_scenes_TitleScene_ts["TitleScene.ts"]
  end
  subgraph layer_render["src/render"]
    src_render_ActionMenu_ts["ActionMenu.ts"]
    src_render_ForecastPanel_ts["ForecastPanel.ts"]
    src_render_MapView_ts["MapView.ts"]
    src_render_PhaseBanner_ts["PhaseBanner.ts"]
    src_render_SidePanel_ts["SidePanel.ts"]
    src_render_UnitSprite_ts["UnitSprite.ts"]
    src_render_art_ts["art.ts"]
    src_render_effects_ts["effects.ts"]
    src_render_layout_ts["layout.ts"]
    src_render_pixel_canvas_ts["pixel-canvas.ts"]
    src_render_textures_ts["textures.ts"]
  end
  subgraph layer_core["src/core"]
    src_core_ai_ts["ai.ts"]
    src_core_battle_map_ts["battle-map.ts"]
    src_core_battle_state_ts["battle-state.ts"]
    src_core_combat_ts["combat.ts"]
    src_core_faction_ts["faction.ts"]
    src_core_grid_ts["grid.ts"]
    src_core_leveling_ts["leveling.ts"]
    src_core_objectives_ts["objectives.ts"]
    src_core_pathfinding_ts["pathfinding.ts"]
    src_core_rng_ts["rng.ts"]
    src_core_unit_factory_ts["unit-factory.ts"]
    src_core_unit_ts["unit.ts"]
  end
  subgraph layer_data["src/data"]
    src_data_chapter1_index_ts["chapter1/index.ts"]
    src_data_chapter1_stage1_ts["chapter1/stage1.ts"]
    src_data_characters_ts["characters.ts"]
    src_data_classes_ts["classes.ts"]
    src_data_index_ts["index.ts"]
    src_data_stats_ts["stats.ts"]
    src_data_terrain_ts["terrain.ts"]
    src_data_types_ts["types.ts"]
    src_data_weapons_ts["weapons.ts"]
  end
  ext_phaser[("phaser")]:::external
  src_core_ai_ts --> src_core_combat_ts
  src_core_ai_ts --> src_core_faction_ts
  src_core_ai_ts --> src_core_grid_ts
  src_core_ai_ts --> src_core_pathfinding_ts
  src_core_battle_state_ts --> src_core_battle_map_ts
  src_core_battle_state_ts --> src_core_combat_ts
  src_core_battle_state_ts --> src_core_faction_ts
  src_core_battle_state_ts --> src_core_grid_ts
  src_core_battle_state_ts --> src_core_leveling_ts
  src_core_battle_state_ts --> src_core_pathfinding_ts
  src_core_battle_state_ts --> src_core_rng_ts
  src_core_battle_state_ts --> src_core_unit_factory_ts
  src_core_battle_state_ts --> src_core_unit_ts
  src_core_combat_ts --> src_core_grid_ts
  src_core_pathfinding_ts --> src_core_faction_ts
  src_core_pathfinding_ts --> src_core_grid_ts
  src_core_unit_factory_ts --> src_core_unit_ts
  src_core_unit_factory_ts --> src_data_index_ts
  src_data_chapter1_index_ts --> src_data_chapter1_stage1_ts
  src_data_chapter1_stage1_ts --> src_data_terrain_ts
  src_data_characters_ts --> src_data_stats_ts
  src_data_classes_ts --> src_data_stats_ts
  src_data_index_ts --> src_data_chapter1_index_ts
  src_data_index_ts --> src_data_characters_ts
  src_data_index_ts --> src_data_classes_ts
  src_data_index_ts --> src_data_terrain_ts
  src_data_index_ts --> src_data_weapons_ts
  src_main_ts --> ext_phaser
  src_main_ts --> src_render_layout_ts
  src_main_ts --> src_scenes_BattleScene_ts
  src_main_ts --> src_scenes_BootScene_ts
  src_main_ts --> src_scenes_TitleScene_ts
  src_render_ActionMenu_ts --> ext_phaser
  src_render_ActionMenu_ts --> src_render_layout_ts
  src_render_art_ts --> src_render_layout_ts
  src_render_art_ts --> src_render_pixel_canvas_ts
  src_render_effects_ts --> ext_phaser
  src_render_effects_ts --> src_render_layout_ts
  src_render_ForecastPanel_ts --> ext_phaser
  src_render_ForecastPanel_ts --> src_render_layout_ts
  src_render_MapView_ts --> ext_phaser
  src_render_MapView_ts --> src_render_layout_ts
  src_render_MapView_ts --> src_render_pixel_canvas_ts
  src_render_MapView_ts --> src_render_textures_ts
  src_render_PhaseBanner_ts --> ext_phaser
  src_render_PhaseBanner_ts --> src_render_layout_ts
  src_render_SidePanel_ts --> ext_phaser
  src_render_SidePanel_ts --> src_render_layout_ts
  src_render_textures_ts --> ext_phaser
  src_render_textures_ts --> src_render_art_ts
  src_render_UnitSprite_ts --> ext_phaser
  src_render_UnitSprite_ts --> src_render_layout_ts
  src_render_UnitSprite_ts --> src_render_textures_ts
  src_scenes_BattleScene_ts --> ext_phaser
  src_scenes_BattleScene_ts --> src_core_ai_ts
  src_scenes_BattleScene_ts --> src_core_battle_state_ts
  src_scenes_BattleScene_ts --> src_core_combat_ts
  src_scenes_BattleScene_ts --> src_core_grid_ts
  src_scenes_BattleScene_ts --> src_core_objectives_ts
  src_scenes_BattleScene_ts --> src_core_pathfinding_ts
  src_scenes_BattleScene_ts --> src_data_index_ts
  src_scenes_BattleScene_ts --> src_render_ActionMenu_ts
  src_scenes_BattleScene_ts --> src_render_effects_ts
  src_scenes_BattleScene_ts --> src_render_ForecastPanel_ts
  src_scenes_BattleScene_ts --> src_render_layout_ts
  src_scenes_BattleScene_ts --> src_render_MapView_ts
  src_scenes_BattleScene_ts --> src_render_PhaseBanner_ts
  src_scenes_BattleScene_ts --> src_render_SidePanel_ts
  src_scenes_BattleScene_ts --> src_render_UnitSprite_ts
  src_scenes_BootScene_ts --> ext_phaser
  src_scenes_BootScene_ts --> src_data_index_ts
  src_scenes_BootScene_ts --> src_render_textures_ts
  src_scenes_TitleScene_ts --> ext_phaser
  src_scenes_TitleScene_ts --> src_render_layout_ts
  classDef external fill:#e9e2cc,stroke:#5c4630,color:#1f1a24
```
