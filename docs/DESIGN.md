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

- **Promoção por nível (sem selos):** quando um herói chega ao **nível 5**, a tela de resultado da vitória destaca **"Promover heróis ✦ (N prontos)"**. O jogador escolhe quem promover, ou "agora não" (a promoção continua disponível depois, em *Gerenciar time*). O herói muda de classe, soma um bônus de atributos e volta ao nível 1 da classe nova. Cada tier conta como +10 níveis no cálculo de EXP.
- **Árvore de classes:** tier 1 → um tier 2 → **dois caminhos de tier 3**, à escolha do jogador. A tela mostra uma prévia de cada caminho: bônus, movimento e tipos de arma. Vários caminhos ganham um segundo tipo de arma. O tier 3 aparece com capa e diadema dourados e ★★ no painel.

| Tier 1 | Tier 2 | Caminho A | Caminho B |
|---|---|---|---|
| Portador | Lorde Solar | Rei Solar (espada/lança) | Avatar da Crista (espada/luz) |
| Espadachim | Mestre de Lâminas | Santo da Espada | Dançarina das Lâminas |
| Lanceiro | Baluarte | Muralha Viva (lança/machado) | Grão-Paladino (lança/espada) |
| Guerreira | Berserker | Senhora da Guerra (machado/espada) | Fúria Rubra |
| Arqueiro | Atiradora | Olho de Falcão | Guarda-Florestal (arco/espada) |
| Clérigo | Sacerdotisa | Oráculo (cajado/luz) | Santa da Aurora |
| Piromante | Arquimago | Senhor das Chamas | Sábio Arcano (tomo/luz) |
| Mago de Luz | Arauto da Aurora | Lâmina da Alvorada (luz/espada) | Profeta Solar (luz/cajado) |
| Cavaleira | Paladina | Cavaleira Celeste (lança/espada) | Valquíria Solar (lança/luz) |
| Batedora | Lâmina Sombria | Assassina | Andarilha (espada/arco) |

- **Tipos de movimento:** *a pé*, *montado* (Cavaleira, Cavaleiro do Ocaso) e *blindado* (Sentinela Cinzenta). Cada terreno pode ter custos próprios por tipo. O painel lateral mostra esses custos.
- **Mapas maiores** (até 24×16): a câmera rola para acompanhar o cursor, as unidades da IA, os reforços e os alvos. Painel, menus e previsão ficam fixos na tela.
- **Continuidade:** o save do Capítulo 1 segue para o Capítulo 2 com níveis, itens e mortos (no Clássico). O título também oferece começar direto no Capítulo 2 com um time pronto.

## Investigar, baú e gerenciar o time

- **Investigar:** toda **Casa**, **Fortaleza** e **Ruína** pode ser investigada uma vez por fase. Basta parar a unidade em cima e escolher *Investigar*, o que gasta a ação. Algumas escondem itens, armas ou **armaduras** (definidos em `caches` de cada fase); as outras rendem só uma fala.
  - Cada fase tem de 4 a 8 esconderijos, e o equipamento fica mais forte com o avanço: couro e malha no Capítulo 1; aço, prata e mantos no Capítulo 2. No fim estão a **Égide da Aurora** e a lendária **Lâmina do Sol** (C2 F5).
  - Armas que se acham assim: Machadinha; Espada, Lança, Machado e Arco de Aço; Espada, Lança, Machado e Arco de Prata; Tomo das Labaredas, do Sol Poente, Radiante e da Alvorada; Cajado Solar; Lâmina do Sol.
- **Armaduras:** **um espaço por herói**, com bônus somados aos atributos na batalha. O roster guarda os atributos de base, então o crescimento por nível não muda. As **pesadas** só servem para as linhas do Lanceiro e da Guerreira (`ClassDef.heavyArmor`).

| Armadura | Bônus |
|---|---|
| Couraça de Couro | +1 DEF |
| Cota de Malha | +2 DEF, −1 VEL |
| Manto Rúnico | +3 RES |
| Armadura de Placas | +4 DEF, +2 HP, −2 VEL (pesada) |
| Manto do Ocaso | +2 DEF, +3 RES |
| Armadura do Baluarte | +6 DEF, +3 HP, −3 VEL (pesada) |
| Égide da Aurora | +3 DEF, +3 RES, +3 HP |

- **Inventário:** cada herói carrega até **5 itens**. O que não cabe, e toda arma ou armadura achada, vai para o **baú do grupo**. Os achados só entram no save se a fase for vencida.
- **Gerenciar time** (na tela de resultado, após cada vitória), passo a passo à esquerda e detalhes à direita:
  - dar um item a outro herói;
  - guardar ou pegar itens do baú;
  - equipar uma arma do baú (só se a classe usar aquele tipo; a arma antiga volta ao baú);
  - vestir ou tirar uma armadura (a antiga volta ao baú);
  - promover (nível 5+), escolhendo o caminho no tier 3.
- **Aliados ao alcance:** Wren (C1 F3) e Brielle (C2 F1) entram no time logo no início, com uma cena de apresentação. Ilian (C1 F2), Lys (C1 F4) e Sorrel (C2 F2) continuam recrutáveis por conversa, mas começam parados a até 3 tiles do grupo e fora do alcance de qualquer inimigo no turno 1. Um teste garante isso.

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
| Ruínas | 1 | +1 | +15 | Investigável |

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

**Menus:** a linha inteira de cada opção é clicável, inclusive no celular e com a câmera rolada. Clicar na borda do menu não faz nada; clicar fora dele cancela.

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
| C2 | Capítulo 2: 5 fases em mapas grandes com câmera, Cavaleira e Batedora, Cavaleiros do Ocaso e Sentinelas, promoção, movimento montado/blindado, continuidade do save | ✅ |
| C3 | Investigar construções, baú e gerenciar o time | ✅ |
| C4 | Promoção por nível sem selos, tier 3 bifurcado (20 classes), armaduras, ruínas, mais esconderijos com armas de prata, aliados seguros | ✅ |

### Desvios do plano original

- **Arte:** pixel-art procedural feita para o projeto (`src/render/art.ts`), porque o download dos pacotes CC0 da Kenney estava bloqueado no ambiente de desenvolvimento. Os sprites podem ser trocados por assets sem mudar a lógica.
- **Mapas:** texto (um caractere por terreno) em vez de Tiled. São mais simples de revisar em diffs e de validar em testes.
- **Mapas 15×10 no Capítulo 1:** todas as fases cabem na tela. O Capítulo 2 trouxe a câmera e mapas de até 24×16.
- **Sons:** sintetizados com WebAudio (`src/render/sfx.ts`), sem arquivos externos. A tecla M liga e desliga o som.
- **Tela de preparação:** cortada (era opcional). Os itens iniciais vêm dos personagens e o roster passa de fase em fase.
- **UIScene:** dividida em componentes de `render/` (painel, menus, previsão, efeitos) usados pela `BattleScene`.
- **Ordem:** o motor de eventos foi antecipado para o M4 (dicas de tutorial), e a campanha/save para o M6 (simulação de balanceamento).
