# Design de jogo

RPG tático por turnos em **grade quadrada** (4 direções), no estilo Fire Emblem / Battle for Wesnoth. São **2 capítulos de 5 fases**, com **10 heróis** e **10 classes jogáveis**, cada uma com uma versão avançada.

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
| Guerreira (Kaira) | 5 | Machado | Muito HP e FOR, pouca HAB/VEL; vence os lanceiros inimigos |
| Arqueiro | 5 | Arco (alcance 2) | Dano à distância, fraco no corpo a corpo |
| Clérigo | 5 | Cajado | Cura aliados adjacentes; não ataca |
| Piromante | 5 | Tomo de fogo (alcance 1–2) | Dano mágico (usa MAG contra RES) |
| Mago de Luz (Ilian) | 5 | Tomo da Aurora (alcance 1–2) | Magia **eficaz** contra Esvaídos, Monges do Ocaso e Inquisidores |
| *Inimigos:* Bandido (machado), Esvaído (garras, muito HP), Monge do Ocaso (tomo sombrio, 1–2), Inquisidor (chefe) | | | |

Os valores ficam em `src/data/classes.ts`, `src/data/weapons.ts` e `src/data/characters.ts`.

## Capítulo 2: promoção, montaria e mapas grandes

- **Selos da Brasa:** são ganhos no início do Capítulo 2 (1) e ao vencer as Fases 2, 3 e 4 (1 cada). Na tela de resultado, um herói de **nível 5+** pode gastar um selo para **promover**: muda para a classe avançada, soma um bônus de atributos (e geralmente +1 de movimento) e volta ao nível 1 da classe nova. Classes avançadas contam como 10 níveis acima no cálculo de EXP.

| Classe | Promove para |
|---|---|
| Portador | Lorde Solar |
| Espadachim | Mestre de Lâminas |
| Lanceiro | Baluarte |
| Guerreira | Berserker |
| Arqueiro | Atiradora |
| Clérigo | Sacerdotisa |
| Piromante | Arquimago |
| Mago de Luz | Arauto da Aurora |
| Cavaleira | Paladina |
| Batedora | Lâmina Sombria |

- **Tipos de movimento:** *a pé*, *montado* (Cavaleira, Cavaleiro do Ocaso) e *blindado* (Sentinela Cinzenta). Cada terreno pode ter custos próprios por tipo. O painel lateral mostra esses custos.
- **Mapas maiores** (até 24×16): a câmera rola para acompanhar o cursor, as unidades da IA, os reforços e os alvos. Painel, menus e previsão ficam fixos na tela.
- **Continuidade:** o save do Capítulo 1 segue para o Capítulo 2 com níveis, itens e mortos (no Clássico). O título também oferece começar direto no Capítulo 2 com um time pronto.

## Terreno

| Terreno | Custo | DEF | EVA | Especial |
|---|---|---|---|---|
| Planície / Estrada / Ponte / Casa | 1 | 0 | 0 (Casa: 10) | — |
| Floresta | 2 | +1 | +20 | — |
| Colina | 3 | +1 | +30 | — |
| Fortaleza | 2 | +2 | +20 | Cura 10%/turno |
| Portão | 1 | +3 | +30 | Cura 10%/turno |
| Rio / Muralha | — | — | — | Intransponível |
| Pântano | 2 | 0 | −10 | Montados e blindados: 4 |
| Pilar | 2 | +1 | +20 | Cobertura em interiores |

Na floresta, montados e blindados pagam 3; na colina, 5.

Os mapas são texto em `src/data/chapter1/stageN.ts`, com a legenda definida em `src/data/terrain.ts`.

## Combate (marco M2)

- Atributos: HP, FOR, MAG, HAB, VEL, SOR, DEF, RES, MOV.
- **Dano** = (FOR ou MAG + poder da arma) − (DEF ou RES do alvo + bônus do terreno).
- **Acerto** = precisão + HAB×2 + SOR/2 − (VEL×2 + SOR + evasão do terreno do alvo).
- **Crítico** = crítico da arma + HAB/2 − SOR do alvo → dano ×3.
- **Ataque duplo** se VEL ≥ VEL do alvo + 4.
- **Triângulo de armas:** Espada > Machado > Lança > Espada (+15 de acerto e +1 de dano para quem leva vantagem).
- **Contra-ataque** se o alvo alcançar o atacante.
- **Eficácia:** armas com `effective` dobram o poder contra as classes listadas (ex.: Tomo da Aurora contra Esvaídos e servos do Ocaso). O painel lateral mostra a lista.
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
| Ligar/desligar o som | M | — |
| Pular diálogo | Esc | — |

**Celular:** em aparelhos de toque aparecem botões virtuais flutuantes.
- **À esquerda:** um direcional (▲◀▼▶ = W/A/S/D); segurar repete o movimento do cursor.
- **À direita:** **✓** (Enter) e **✕** (Esc, para voltar ou cancelar).

Os botões simulam as teclas, então funcionam em todas as telas: título, batalha, menus, diálogos e resultado. Tocar no mapa continua funcionando. `?touch=1` na URL força os botões no desktop; `?touch=0` esconde no celular.

**Atalhos de desenvolvimento** (URL): `?stage=c1s4` abre a fase direto (roster novo, modo Casual); `?seed=42` fixa o RNG.

## Balanceamento

- `tests/stages.test.ts` valida cada fase (mapa 15×10, posições, alcançabilidade do objetivo, referências de eventos e falas) e simula o capítulo inteiro com a IA jogando dos dois lados, com o roster passando de fase em fase.
- `SIM_REPORT=1 npx vitest run tests/sim-report.test.ts --silent=false` imprime um relatório por fase (resultado, turno, quem caiu, níveis). O "jogador" simulado é bem mais ingênuo que um humano, então serve como piso, não como meta.
- **Kaira** (Guerreira, desde a Fase 1) entrou para aliviar a dificuldade. Na simulação, a Fase 2 passou de 2 para 6 vitórias em 8, e a Fase 3 é vencida em todas as tentativas.
- Ajustes feitos com base na simulação: dano dos inimigos reduzido (Bandido FOR 5, Machado de Ferro 7, Lanceiro FOR 6, Esvaído FOR 6, Salmo do Sono 5), Aren com HP 22 e DEF 6, Mira com HP 20 e DEF 4, bandido da ponte da Fase 2 parado, e alas da Fase 4 em `guard`.

## Roadmap

| Marco | Conteúdo | Status |
|---|---|---|
| M0 | Setup (Vite, TS, Phaser, Vitest), diagramas automáticos, CI, Pages | ✅ |
| M1 | Mapa, cursor, seleção, alcance de movimento e ataque, mover/desfazer/esperar, fases | ✅ |
| M2 | Combate: previsão, resolução, contra-ataque, morte, EXP/level-up | ✅ |
| M3 | IA inimiga e condições de vitória/derrota | ✅ |
| M4 | Fase 1 completa com diálogos (DialogueScene) e motor de eventos (antecipado do M5) | ✅ |
| M5 | Conversar, curar, itens (Poção/Elixir), tomar, fase aliada | ✅ |
| M6 | Fases 2–5 (mapas, eventos, diálogos), validação automática das fases e simulação de balanceamento | ✅ |
| M7 | Campanha com save, título (Clássico/Casual/Continuar), tela de resultado, efeitos sonoros sintetizados, transições | ✅ |
| C2 | Capítulo 2: 5 fases em mapas grandes com câmera, Cavaleira e Batedora, Cavaleiros do Ocaso e Sentinelas, promoção com Selos da Brasa, movimento montado/blindado, continuidade do save | ✅ |

### Desvios do plano original

- **Arte:** pixel-art procedural feita para o projeto (`src/render/art.ts`), porque o download dos pacotes CC0 da Kenney estava bloqueado no ambiente de desenvolvimento. Os sprites podem ser trocados por assets sem mudar a lógica.
- **Mapas:** texto (um caractere por terreno) em vez de Tiled. São mais simples de revisar em diffs e de validar em testes.
- **Mapas 15×10 no Capítulo 1:** todas as fases cabem na tela. O Capítulo 2 trouxe a câmera e mapas de até 24×16.
- **Sons:** sintetizados com WebAudio (`src/render/sfx.ts`), sem arquivos externos. A tecla M liga e desliga o som.
- **Tela de preparação:** cortada (era opcional). Os itens iniciais vêm dos personagens e o roster passa de fase em fase.
- **UIScene:** dividida em componentes de `render/` (painel, menus, previsão, efeitos) usados pela `BattleScene`.
- **Ordem:** o motor de eventos foi antecipado para o M4 (dicas de tutorial), e a campanha/save para o M6 (simulação de balanceamento).
