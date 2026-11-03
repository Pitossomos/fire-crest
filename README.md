# Fire Crest — A Crista de Fogo

RPG tático por turnos no estilo Fire Emblem / Battle for Wesnoth, feito em **TypeScript + Phaser 3**.

> Ano 300 do Longo Crepúsculo. O sol enfraquece, e a Ordem do Ocaso caça quem ainda carrega a Crista de Fogo.
> Aren, um vigia de vila, descobre a marca em chamas na própria mão na noite em que bandidos atacam Brasalva.

🎮 **Jogar online:** https://pitossomos.github.io/fire-crest/

- 📜 [Lore e roteiro do Capítulo 1](docs/LORE.md)
- 🎲 [Design de jogo e roadmap](docs/DESIGN.md)
- 🏗️ [Arquitetura e diagramas (gerados automaticamente)](docs/ARCHITECTURE.md)

## Rodando

```bash
npm install
```

```bash
npm run dev
```

Abra http://localhost:5173.

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Checa tipos e gera `dist/` |
| `npm test` | Testes unitários (Vitest) |
| `npm run e2e` | Teste de fumaça no navegador (Playwright; requer `npm run dev` rodando) |
| `npm run lint:arch` | Valida as regras de arquitetura |
| `npm run diagrams` | Regenera os diagramas em `docs/diagrams/` |
| `npm run diagrams:svg` | Também exporta SVGs (requer Chromium) |

## Estado atual

O **Capítulo 1 — Brasas no Vale** está completo e jogável do início ao fim:

- 5 fases com objetivos diferentes: derrotar todos, tomar o portão, sobreviver, derrotar o chefe;
- 6 personagens jogáveis, com recrutamento por conversa, por evento e por sobrevivência;
- combate com previsão, triângulo de armas, críticos, ataque duplo e contra-ataque;
- EXP e level-up, cura com cajado, poções, reforços e IA inimiga com três comportamentos;
- diálogos com retratos;
- campanha com save automático entre fases, nos modos **Clássico** (permadeath) e **Casual**;
- efeitos sonoros (tecla M liga e desliga).

Veja o [roadmap e os desvios do plano](docs/DESIGN.md#roadmap).

A arte atual é **pixel-art procedural** gerada em código (`src/render/art.ts`) e será substituída por assets CC0 — veja [`public/assets/CREDITS.md`](public/assets/CREDITS.md).
