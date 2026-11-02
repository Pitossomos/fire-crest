# Fire Crest — guia para agentes e colaboradores

RPG tático (TypeScript + Phaser 3 + Vite). Os textos do jogo e a documentação são em **português do Brasil**.

## Regras do projeto

- **Diagramas sempre atualizados.** Toda mudança em `src/` deve vir acompanhada de `npm run diagrams` (o hook de pre-commit faz isso automaticamente). A CI falha se `docs/diagrams/` estiver desatualizado. Nunca edite `docs/diagrams/*` à mão.
- **Entidades do modelo de dados** ficam em `src/data/types.ts` e são marcadas com `/** @entity Descrição */` para aparecer no diagrama ER. Referências a outras entidades usam `Ref<X>`.
- **Camadas** (verificadas por `npm run lint:arch`): `core/`, `data/` e `save/` são puros — sem Phaser, sem `render/` e sem `scenes/`. `data/` não importa `core/`. `render/` não importa `scenes/`.
- **Balanceamento:** ao mexer em atributos, armas ou fases, rode `SIM_REPORT=1 npx vitest run tests/sim-report.test.ts --silent=false` e compare o relatório.
- **Atalhos de dev:** `?stage=c1s4&seed=42` na URL abre uma fase direto com RNG fixo.
- A lógica de jogo nova vai em `core/`, com teste em `tests/`. As cenas só traduzem entrada → comandos → visualização.
- O conteúdo (classes, armas, personagens, fases, diálogos) é dado em `src/data/`, não código.
- Ao concluir um marco, atualize o roadmap em `docs/DESIGN.md`.

## Antes de commitar

```bash
npm run typecheck && npm test && npm run lint:arch && npm run diagrams
```

Para mudanças visuais, rode também `npm run dev` + `npm run e2e`.
