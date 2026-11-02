# Arquitetura

O jogo é feito em **TypeScript + Phaser 3**, com build pelo Vite. O princípio central é separar a **lógica pura** (testável, sem Phaser) da **renderização**.

```
main.ts ─► scenes/ ─► render/ ─► phaser
              │          │
              ▼          ▼
            core/ ─────► data/
```

| Camada | Pasta | Responsabilidade | Pode importar |
|---|---|---|---|
| app | `src/main.ts` | Configura o `Phaser.Game` e registra as cenas | tudo |
| scenes | `src/scenes/` | Controladores: traduzem a entrada do jogador em comandos para o `BattleState` | render, core, data, phaser |
| render | `src/render/` | Componentes visuais (mapa, sprites, painel, menus) e a pixel-art procedural | core, data, phaser |
| core | `src/core/` | Regras do jogo: grade, pathfinding, estado da batalha, (combate, IA…) | data |
| data | `src/data/` | Definições estáticas (classes, armas, personagens, fases) e tipos do modelo | — |

As regras são **verificadas automaticamente** pelo dependency-cruiser (`.dependency-cruiser.cjs`, rodado com `npm run lint:arch` e na CI). Por exemplo, `core/` importar `phaser` quebra o build da CI.

## Diagramas (gerados automaticamente)

Os diagramas abaixo são **gerados a partir do código** e refletem sempre o estado atual:

| Diagrama | Arquivo | Fonte |
|---|---|---|
| Arquitetura (camadas e módulos) | [`diagrams/architecture.md`](diagrams/architecture.md) | imports reais (dependency-cruiser) |
| Classes | [`diagrams/classes.md`](diagrams/classes.md) | AST TypeScript (ts-morph) |
| Entidade-Relacionamento | [`diagrams/er.md`](diagrams/er.md) | interfaces marcadas com `@entity` (ts-morph) |

**Como visualizar:**

- **No GitHub:** abra os arquivos `.md` acima — o GitHub renderiza Mermaid nativamente.
- **Localmente:** abra [`diagrams/index.html`](diagrams/index.html) no navegador (com abas, tamanho real e botão "Ajustar à largura").
- **Online:** depois do deploy no Pages, o visualizador fica em `https://<usuário>.github.io/fire-crest/diagrams/`.
- **No VS Code:** use a extensão *Markdown Preview Mermaid Support*.
- **SVG:** `npm run diagrams:svg` exporta para `docs/diagrams/svg/` (requer Chromium; também é gerado como artefato da CI).

**Como os diagramas ficam atualizados:**

1. **Hook de pre-commit** (husky): todo commit roda `npm run diagrams` e inclui `docs/diagrams/`.
2. **CI:** `npm run diagrams:check` regenera os diagramas e falha se houver diferença; depois `diagrams:svg` renderiza todos para validar a sintaxe.
3. **Convenção:** para uma nova interface aparecer no diagrama ER, marque-a com `/** @entity Descrição */`.

Os geradores ficam em `scripts/diagrams/` (`generate.ts`, `class-diagram.ts`, `er-diagram.ts`, `architecture.ts`).

## Fluxo de uma ação do jogador

1. `BattleScene` recebe a entrada (teclado/mouse) e move o cursor.
2. Ao selecionar uma unidade, `BattleState.rangeFor()` roda o **Dijkstra** de `core/pathfinding.ts` (custo de terreno, aliados atravessáveis, inimigos bloqueiam) e calcula os tiles de ataque.
3. `MapView` pinta o alcance de movimento (azul) e o de ataque (vermelho); ao passar o cursor, mostra a prévia do caminho.
4. Ao confirmar, `BattleState.moveUnit()` valida e devolve o caminho; `UnitSprite.walk()` anima tile a tile.
5. `ActionMenu` oferece as ações; "Esperar" chama `BattleState.wait()`. Quando ninguém mais pode agir, `endPhase()` avança a fase.

## Testes

- `npm test` — testes unitários (Vitest) de `core/`, da integridade de `data/` e dos templates de pixel-art.
- `npm run e2e` — teste de fumaça com Playwright contra o `npm run dev`: abre o título, entra na Fase 1, move Aren, encerra o turno, inspeciona um inimigo e verifica que não há erros no console.
