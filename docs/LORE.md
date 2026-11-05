# Lore — A Crista de Fogo

## O mundo: Aldrenn, sob o Longo Crepúsculo

Há 300 anos o sol começou a enfraquecer. Os dias ficaram curtos e frios — a era chamada **Longo Crepúsculo**. Na noite em que o sol "sangrou", caiu a **Chuva de Brasas**: fragmentos de luz solar que se fundiram ao sangue de algumas pessoas, marcando-as com a **Crista de Fogo** — um brasão de chamas vivas na pele que concede poder e mantém a luz acesa ao redor.

Os primeiros portadores fundaram o **Reino de Solmarch** e acenderam os **Sete Faróis**, torres que guardam as fronteiras contra **o Cinzento**: uma névoa fria que apaga o fogo, a memória e a vontade. Quem é tocado vira um **Esvaído** — um corpo que anda, mas sem lembranças.

## O conflito

- **A Ordem do Ocaso** (antagonistas): uma igreja que prega que o sol *deve* morrer e que o Cinzento é o "Sono Sagrado", que acabará com todo o sofrimento. Seus inquisidores caçam os portadores da Crista e extraem as brasas para **apagar os Faróis**, um a um.
- **Solmarch está em ruínas**: o último rei-portador morreu há 20 anos. Os nobres disputam o trono e o povo esqueceu os Faróis. A Ordem cresceu nesse vácuo.
- **O segredo** (revelado aos poucos, com o desfecho em capítulos futuros): a Crista não é um dom — é o sol se *dividindo* para sobreviver. Se todas as brasas forem reunidas, o sol pode reacender… ou ser consumido por quem as reunir. É exatamente isso que o Grão-Hierofante da Ordem quer.

## Personagens jogáveis (Capítulo 1)

| Personagem | Classe | Gancho |
|---|---|---|
| **Aren Valdris** | Portador (lorde) | Jovem vigia da vila fronteiriça de Brasalva. A Crista desperta em sua mão quando a vila é atacada. Não sabe que é filho bastardo do último rei. |
| **Mira Tolven** | Espadachim | Amiga de infância, mercenária endividada, sarcástica e leal. |
| **Sir Hadric Moor** | Lanceiro | O último cavaleiro do Farol de Brasalva. Sabe quem Aren é e esconde isso. |
| **Kaira Forjaluz** | Guerreira (machado) | Ferreira de Brasalva, braços largos e pavio curto. Protege Aren como a um irmão mais novo e jura que foi ela quem amolou a Lâmina de Brasa. Está no time desde a Fase 1. |
| **Ilian Solvarr** | Mago de Luz | Último guardião de um santuário do sol à beira da ponte de Thornmere. Seu Tomo da Aurora queima os Esvaídos e os servos do Ocaso. Entra na Fase 2, quando Aren conversa com ele. |
| **Wren** | Arqueira | Caçadora órfã do Bosque dos Sussurros; perdeu a família para os Esvaídos. Entra na Fase 3. |
| **Irmã Lys** | Clériga | Noviça que desertou da Ordem do Ocaso ao ver o que fazem com os portadores. Entra na Fase 4 (conversa com Aren). |
| **Corvin Ash** | Piromante | Estudioso excêntrico que tenta replicar a Crista com alquimia. Entra na Fase 4. |

**Cabelos:** cada herói tem uma cor que o identifica no mapa e nos retratos. Aren tem cabelo azul, Mira roxo, Hadric branco, Kaira verde e Ilian dourado. Wren tem verde-musgo, Lys azul-claro e Corvin roxo-escuro.

## Antagonistas (Capítulo 1)

- **Brom, o Capanga** — braço direito de Grull, que lidera os batedores na Fase 1.
- **Grull, o Rasga-Cercas** — chefe bandido contratado pela Ordem (Fase 2).
- **Abade Morvane** — carcereiro de Cinzaforte, monge do Ocaso (Fase 4).
- **Vela Mortiça** — uma Esvaída que já foi a guardiã do bosque (Fase 3).
- **Inquisidora Seraphine Vael** — caçadora de portadores da Ordem e chefe final do capítulo. No fim, foge e promete voltar.

## Visual da Ordem do Ocaso — inspirado no Grande Esquema

O hábito da Ordem, e em especial o de Seraphine, se inspira no hábito dos monges do **Grande Esquema** (*Megaloschema*), da tradição ortodoxa do Leste Europeu:

- **Capuz pontudo** (estilo *koukoulion*) preto, cobrindo cabeça e ombros e caindo em painéis pelas costas.
- **Escapulário longo** (estilo *analavos*) na frente e atrás, bordado com **caveiras e ossos cruzados**, uma **cruz-escada sobre um monte** (o "Calvário") e **inscrições em letras cirílicas estilizadas** — na lore, uma escrita litúrgica da Ordem com versos sobre o "Sono Sagrado".
- Paleta: **preto absoluto** com bordados **vermelho-sangue e branco-osso**. O único "fogo" no visual são velas apagadas e fumaça.
- **Seraphine** se destaca dos monges comuns: escapulário mais ornamentado, um rosário de contas de cinza (*chotki*) no pulso como arma ritual e um **sol eclipsado** bordado no centro da cruz.
- Os **Monges do Ocaso** (inimigos genéricos) usam uma versão simplificada do mesmo hábito.

> No jogo, os sprites de monge e inquisidora já seguem essa paleta (`src/render/art.ts`). Retratos próprios para os diálogos virão no marco de polimento (M7).

## Capítulo 1 — Brasas no Vale

| # | Fase | Objetivo | Novidade | Recrutamento |
|---|---|---|---|---|
| 1 | **A Vila em Chamas** | Derrotar todos os inimigos | Tutorial: mover, atacar, terreno, fim de turno | Aren, Mira, Hadric, Kaira |
| 2 | **A Ponte de Thornmere** | Tomar o portão do outro lado da ponte | Triângulo de armas, gargalo, chefe Grull, conversa | Ilian (conversa com Aren) |
| 3 | **O Bosque dos Sussurros** | Sobreviver 8 turnos | Floresta, reforços, Esvaídos | Wren (aliada NPC; entra no time se sobreviver) |
| 4 | **A Fortaleza de Cinzaforte** | Derrotar o chefe | Conversar, curar, portas | Lys (conversa com Aren), Corvin (libertado da cela) |
| 5 | **O Farol Apagado** | Derrotar a Inquisidora Seraphine | Mapa maior, chefe em terreno fortificado | — |

**Final do capítulo:** Seraphine foge. Aren reacende o Farol de Brasalva com sua Crista — o primeiro Farol reaceso em 20 anos. Hadric revela a verdadeira origem de Aren. Gancho: a Ordem já apagou três dos Sete Faróis.

---

# Capítulo 2 — O Caminho dos Faróis

Com o Farol de Brasalva aceso de novo, o grupo descobre que a Ordem do Ocaso já apagou três dos Sete Faróis. O mais próximo é o **Farol de Vessa**, ao sul. A cidade de **Vessaria** é governada pelo **Arquidiácono Malachar**, que transformou a antiga Catedral do Sol em templo do Ocaso. Corvin destila uma brasa da pira de Brasalva e cria o primeiro **Selo da Brasa**, capaz de fazer um herói evoluir para uma classe avançada.

## Novos aliados

| Personagem | Classe | Gancho |
|---|---|---|
| **Ser Brielle Ventor** | Cavaleira (montada, lança) | Última cavaleira de uma patrulha de Solmarch e filha de Gerold Ventor, velho camarada de Hadric. Cabelo vermelho. Entra na Fase 1 quando **Hadric** conversa com ela. |
| **Sorrel** | Batedora (espada, muito rápida) | Contrabandista do Pântano de Vessa e velha amiga (e credora) da Mira. Cabelo rosa. Entra na Fase 2 quando **Mira** conversa com ela. |

## Novos inimigos

- **Cavaleiros do Ocaso** — montados, de armadura negra e lança. Correm longe na estrada, mas sofrem na floresta, nas colinas e no pântano.
- **Sentinelas Cinzentas** — antigas armaduras da guarda dos Faróis, animadas pelo Cinzento. Lentas e com muita defesa, mas quase sem resistência à magia.
- **Comandante Draven** — ex-cavaleiro de Solmarch e líder dos Cavaleiros do Ocaso.
- **Guardião Afogado** — a armadura do antigo guardião do Farol de Vessa, presa no pântano.
- **Arquidiácono Malachar** — senhor de Vessaria, com o Tomo do Eclipse.
- **Seraphine** volta na Fase 4. Ao ser derrotada, foge mais uma vez, agora em dúvida.

## Fases

| # | Fase | Objetivo | Novidade | Recrutamento |
|---|---|---|---|---|
| 1 | **A Estrada do Rei** | Derrotar todos | Cavaleiros montados, reforços pelo leste | Brielle (conversa com Hadric) |
| 2 | **O Pântano de Vessa** | Derrotar o Guardião Afogado | Pântano (movimento lento), Sentinelas | Sorrel (conversa com Mira) |
| 3 | **As Muralhas de Vessaria** | Tomar o portão | Pontes guardadas, Comandante Draven | — |
| 4 | **Os Becos Apagados** | Chegar ao Farol de Vessa | Cidade em quarteirões, Seraphine na praça (opcional) | — |
| 5 | **A Catedral do Ocaso** | Derrotar Malachar | Nave com pilares, capelas laterais | — |

**Final do capítulo:** Aren reacende o Farol de Vessa, e dois dos Sete Faróis voltam a brilhar. Nas cartas de Malachar, o grupo descobre que o **Grão-Hierofante** reúne as brasas roubadas na Capital de Solmarch para fundi-las e devorar o sol (o "Eclipse Eterno"). Gancho: a estrada leva à Capital, ao trono do pai de Aren.
