# Design de jogo

RPG tático por turnos em **grade quadrada** (4 direções), no estilo Fire Emblem / Battle for Wesnoth. Escopo pequeno: **6 classes jogáveis**, **5 fases** no Capítulo 1.

## Modos

- **Clássico** — permadeath: uma unidade que cai não volta.
- **Casual** — as unidades caídas voltam ao fim da fase.
- Nos dois modos, se **Aren** cair, é game over.

## Classes

| Classe | Mov | Arma | Papel |
|---|---|---|---|
| Portador (Aren) | 5 | Espada | Lorde equilibrado |
| Espadachim | 5 | Espada | Alta velocidade e evasão |
| Lanceiro | 4 | Lança | Alta defesa, baixa resistência |
| Arqueiro | 5 | Arco (alcance 2) | Dano à distância, fraco no corpo a corpo |
| Clérigo | 5 | Cajado | Cura aliados adjacentes; não ataca |
| Piromante | 5 | Tomo de fogo (alcance 1–2) | Dano mágico (usa MAG contra RES) |
| *Inimigos:* Bandido (machado), Esvaído (garras, muito HP), Monge do Ocaso (tomo sombrio, 1–2), Inquisidor (chefe) | | | |

Os valores ficam em `src/data/classes.ts`, `src/data/weapons.ts` e `src/data/characters.ts`.

## Terreno

| Terreno | Custo | DEF | EVA | Especial |
|---|---|---|---|---|
| Planície / Estrada / Ponte / Casa | 1 | 0 | 0 (Casa: 10) | — |
| Floresta | 2 | +1 | +20 | — |
| Colina | 3 | +1 | +30 | — |
| Fortaleza | 2 | +2 | +20 | Cura 10%/turno |
| Portão | 1 | +3 | +30 | Cura 10%/turno |
| Rio / Muralha | — | — | — | Intransponível |

Os mapas são texto em `src/data/chapter1/stageN.ts`, com a legenda definida em `src/data/terrain.ts`.

## Combate (marco M2)

- Atributos: HP, FOR, MAG, HAB, VEL, SOR, DEF, RES, MOV.
- **Dano** = (FOR ou MAG + poder da arma) − (DEF ou RES do alvo + bônus do terreno).
- **Acerto** = precisão + HAB×2 + SOR/2 − (VEL×2 + SOR + evasão do terreno do alvo).
- **Crítico** = crítico da arma + HAB/2 − SOR do alvo → dano ×3.
- **Ataque duplo** se VEL ≥ VEL do alvo + 4.
- **Triângulo de armas:** Espada > Machado > Lança > Espada (+15 de acerto e +1 de dano para quem leva vantagem).
- **Contra-ataque** se o alvo alcançar o atacante.
- **EXP:** 100 = +1 nível; crescimento por taxas (%) por personagem; nível máximo 10 no capítulo.
- RNG com seed (`src/core/rng.ts`) para os testes serem reproduzíveis.

## Turno

Fase do Jogador → Fase Inimiga → Fase Aliada (só quando há NPCs) → próximo turno.
Menu da unidade: Mover → Atacar / Curar / Conversar / Item / Esperar. Antes de confirmar um ataque, o jogo mostra a **previsão de combate**.

## IA inimiga (marco M3)

- `aggressive` — vai atrás do alvo mais vantajoso que consegue alcançar.
- `guard` — só age quando alguém entra na sua área de ameaça.
- `stationary` — nunca se move (chefes e arqueiros em muralhas).

Pontuação de cada alvo: dano esperado + chance de matar − dano recebido.

## Controles

| Ação | Teclado | Mouse |
|---|---|---|
| Mover o cursor | Setas / WASD | Mover o mouse |
| Confirmar / selecionar | Z / Enter / Espaço | Clique esquerdo |
| Cancelar / voltar | X / Esc / Backspace | Clique direito |
| Encerrar o turno | E | Clicar num tile vazio → "Encerrar turno" |
| Ver o alcance de um inimigo | Selecionar o inimigo | Clicar no inimigo |

## Roadmap

| Marco | Conteúdo | Status |
|---|---|---|
| M0 | Setup (Vite, TS, Phaser, Vitest), diagramas automáticos, CI, Pages | ✅ |
| M1 | Mapa, cursor, seleção, alcance de movimento e ataque, mover/desfazer/esperar, fases | ✅ |
| M2 | Combate: previsão, resolução, contra-ataque, morte, EXP/level-up | ⏳ |
| M3 | IA inimiga e condições de vitória/derrota | ⏳ |
| M4 | Fase 1 completa com diálogos (DialogueScene) | ⏳ |
| M5 | Eventos, conversar, curar, aliado NPC, reforços | ⏳ |
| M6 | Fases 2–5 | ⏳ |
| M7 | Título com save, Clássico/Casual, resultado, polimento, assets CC0 | ⏳ |
