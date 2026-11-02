// Teste de fumaça de ponta a ponta: abre o jogo, entra na Fase 1, move, ataca,
// passa o turno (IA inimiga), checa vitória e verifica que não há erros no console.
// Uso: `npm run dev` (em outro terminal) e depois `npm run e2e`.
// Variáveis: GAME_URL (padrão http://localhost:5173), SHOTS_DIR (padrão e2e-shots).
import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

const url = process.env.GAME_URL ?? 'http://localhost:5173';
const shots = process.env.SHOTS_DIR ?? 'e2e-shots';
mkdirSync(shots, { recursive: true });

// require() respeita NODE_PATH (Playwright instalado globalmente); localmente: npm i -D playwright.
const { chromium } = createRequire(import.meta.url)('playwright');

const browser = await chromium.launch(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {});
const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push(String(e)));

const fail = (msg) => { console.error('FALHOU:', msg); process.exitCode = 1; };
const shot = (name) => page.screenshot({ path: join(shots, `${name}.png`) });
const press = async (key, wait = 120) => { await page.keyboard.press(key); await page.waitForTimeout(wait); };
const dialogueOpen = () => page.evaluate(() => window.__FIRE_CREST__.scene.isActive('Dialogue'));

/** Espera `predicate` (função executada na página) virar verdadeira, pulando diálogos. */
async function until(predicate, arg, timeout = 60000, label = 'condição') {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (await dialogueOpen()) await press('Escape', 150);
    if (await page.evaluate(predicate, arg)) return;
    await page.waitForTimeout(150);
  }
  throw new Error(`Tempo esgotado esperando: ${label}`);
}

const battle = () => page.evaluate(() => {
  const s = window.__FIRE_CREST__.scene.getScene('Battle');
  const b = s.battle;
  const aren = b.units.find((u) => u.characterId === 'aren');
  return { mode: s.mode, turn: b.turn, phase: b.phase, outcome: s.outcome, aren: { x: aren.x, y: aren.y, acted: aren.hasActed, exp: aren.exp, level: aren.level } };
});
const idle = () => window.__FIRE_CREST__?.scene.isActive('Battle')
  && window.__FIRE_CREST__.scene.getScene('Battle').mode === 'idle'
  && !window.__FIRE_CREST__.scene.isActive('Dialogue');

// --- Título ---
await page.goto(url);
await page.waitForFunction(() => window.__FIRE_CREST__?.scene.isActive('Title'));
await page.waitForTimeout(600);
await shot('01-title');
await press('Enter', 200);

// --- Diálogo de abertura (M4) ---
try {
  await page.waitForFunction(() => window.__FIRE_CREST__.scene.isActive('Dialogue'), null, { timeout: 5000 });
} catch {
  fail('esperava o diálogo de abertura');
}
await press('Enter', 600); // completa o texto da 1ª fala
await shot('02-dialogue');
await until(idle, null, 20000, 'batalha pronta');
await shot('03-battle');

// --- Movimento (M1) ---
await press('KeyZ');
let s = await battle();
if (s.mode !== 'selected') fail(`esperava modo selected, veio ${s.mode}`);
await press('ArrowLeft'); await press('ArrowLeft'); await press('ArrowUp');
await shot('04-ranges');
await press('KeyZ', 900);
s = await battle();
if (s.mode !== 'menu') fail(`esperava modo menu, veio ${s.mode}`);
if (s.aren.x !== 4 || s.aren.y !== 6) fail(`Aren deveria estar em (4,6), está em (${s.aren.x},${s.aren.y})`);
await press('ArrowUp'); // "Esperar" é sempre a última opção (↑ dá a volta)
await press('KeyZ', 300);
s = await battle();
if (!s.aren.acted) fail('Aren deveria ter agido');

// --- Fim de turno + IA inimiga (M3) ---
await press('KeyE');
await until(() => {
  const sc = window.__FIRE_CREST__.scene.getScene('Battle');
  return sc.outcome !== undefined || (sc.battle.turn === 2 && sc.mode === 'idle' && !window.__FIRE_CREST__.scene.isActive('Dialogue'));
}, null, 60000, 'turno 2');
s = await battle();
await shot('05-turn2');
if (s.outcome) fail(`batalha terminou cedo demais: ${s.outcome}`);

// --- Inspeção de inimigo ---
const foe = await page.evaluate(() => {
  const u = window.__FIRE_CREST__.scene.getScene('Battle').battle.units.find((x) => x.faction === 'enemy' && x.isAlive());
  return { x: u.x, y: u.y };
});
await page.mouse.click(foe.x * 48 + 24, foe.y * 48 + 24);
await page.waitForTimeout(200);
s = await battle();
if (s.mode !== 'inspect') fail(`esperava modo inspect, veio ${s.mode}`);
await shot('06-enemy-range');
await press('KeyX');

// --- Combate (M2): garante um inimigo adjacente a Aren e ataca ---
await page.evaluate(() => {
  const scene = window.__FIRE_CREST__.scene.getScene('Battle');
  const b = scene.battle;
  const aren = b.units.find((u) => u.characterId === 'aren');
  const dist = (u) => Math.abs(u.x - aren.x) + Math.abs(u.y - aren.y);
  const enemies = b.units.filter((u) => u.faction === 'enemy' && u.isAlive());
  if (!enemies.some((u) => dist(u) === 1)) {
    const free = [{ x: 0, y: -1 }, { x: 1, y: 0 }, { x: -1, y: 0 }, { x: 0, y: 1 }]
      .map((d) => ({ x: aren.x + d.x, y: aren.y + d.y }))
      .find((p) => b.map.inBounds(p) && b.map.moveCost(p) !== null && !b.unitAt(p));
    enemies[0].moveTo(free);
    scene.sprites.get(enemies[0].id).snap();
  }
  scene.setCursor(aren.position);
});
await press('KeyZ');
await press('KeyZ', 300);
s = await battle();
if (s.mode !== 'menu') fail(`esperava menu após mover, veio ${s.mode}`);
await press('KeyZ'); // Atacar é a primeira opção
s = await battle();
if (s.mode !== 'targeting') fail(`esperava modo targeting, veio ${s.mode}`);
await shot('07-forecast');
const before = s.aren;
await press('KeyZ', 200);
await until(() => {
  const sc = window.__FIRE_CREST__.scene.getScene('Battle');
  return sc.outcome !== undefined || (sc.mode === 'idle' && !window.__FIRE_CREST__.scene.isActive('Dialogue'));
}, null, 20000, 'fim do combate');
s = await battle();
if (!s.outcome) {
  if (!s.aren.acted) fail('Aren deveria ter agido após atacar');
  if (s.aren.exp === before.exp && s.aren.level === before.level) fail('Aren deveria ter ganhado EXP');
}
await shot('08-after-combat');

// --- Item (M5): Mira ferida usa uma Poção pelo menu ---
/** Escolhe a opção do menu aberto pelo id (navega com ↓ e confirma). */
async function pick(optionId) {
  const idx = await page.evaluate((id) => window.__FIRE_CREST__.scene.getScene('Battle').menu.options.findIndex((o) => o.id === id), optionId);
  if (idx < 0) { fail(`opção de menu ausente: ${optionId}`); return; }
  for (let i = 0; i < idx; i++) await press('ArrowDown', 60);
  await press('KeyZ', 250);
}
if (!s.outcome) {
  const mira = await page.evaluate(() => {
    const sc = window.__FIRE_CREST__.scene.getScene('Battle');
    const m = sc.battle.units.find((u) => u.characterId === 'mira');
    if (!m.isAlive() || m.hasActed) return null;
    m.hp = Math.max(1, m.maxHp - 12);
    sc.setCursor(m.position);
    return { hp: m.hp, uses: m.items[0]?.uses };
  });
  if (mira) {
    await press('KeyZ');
    await press('KeyZ', 300);
    await pick('item');
    await shot('09a-item-menu');
    await pick('0');
    await until(() => window.__FIRE_CREST__.scene.getScene('Battle').mode !== 'busy', null, 10000, 'uso do item');
    const after = await page.evaluate(() => {
      const m = window.__FIRE_CREST__.scene.getScene('Battle').battle.units.find((u) => u.characterId === 'mira');
      return { hp: m.hp, uses: m.items[0]?.uses, acted: m.hasActed };
    });
    if (after.hp !== mira.hp + 10) fail(`Poção deveria curar 10 (de ${mira.hp} para ${mira.hp + 10}), ficou ${after.hp}`);
    if (after.uses !== mira.uses - 1) fail('Poção deveria gastar um uso');
  }
}

// --- Vitória → diálogo → resultado → próxima fase (M3/M4/M7) ---
const sceneActive = (key) => page.evaluate((k) => window.__FIRE_CREST__.scene.isActive(k), key);
if (!s.outcome) {
  const out = await page.evaluate(() => {
    const sc = window.__FIRE_CREST__.scene.getScene('Battle');
    for (const u of sc.battle.units) if (u.faction === 'enemy') u.hp = 0;
    sc.checkOutcome();
    return sc.outcome;
  });
  if (out !== 'victory') fail(`esperava vitória, veio ${out}`);
  await page.waitForTimeout(900);
  await shot('10-victory');
  await press('Enter', 700);
  if (!(await dialogueOpen())) fail('esperava o diálogo pós-batalha');
  await shot('11-post-dialogue');
  await until(() => window.__FIRE_CREST__.scene.isActive('Result'), null, 15000, 'tela de resultado');
  await page.waitForTimeout(500);
  await shot('12-result');
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('fire-crest-save-v1')));
  if (saved?.nextStageIndex !== 1) fail(`save deveria apontar para a Fase 2, veio ${saved?.nextStageIndex}`);
  const arenLevel = saved.roster.find((r) => r.characterId === 'aren').level;
  await press('Enter', 600); // Próxima fase
  await until(idle, null, 20000, 'Fase 2 pronta');
  const s2 = await page.evaluate(() => {
    const b = window.__FIRE_CREST__.scene.getScene('Battle').battle;
    const aren = b.units.find((u) => u.characterId === 'aren');
    return { stage: b.stage.id, level: aren.level, weapon: aren.weapon.id };
  });
  if (s2.stage !== 'c1s2') fail(`esperava a Fase 2, veio ${s2.stage}`);
  if (s2.level !== arenLevel) fail(`Aren deveria manter o nível ${arenLevel}, veio ${s2.level}`);
  if (s2.weapon !== 'ember_blade') fail('Aren deveria receber a Lâmina de Brasa na Fase 2');
  await shot('13-stage2');

  // Título com "Continuar"
  await page.goto(url);
  await page.waitForFunction(() => window.__FIRE_CREST__?.scene.isActive('Title'));
  await page.waitForTimeout(500);
  const firstOption = await page.evaluate(() => window.__FIRE_CREST__.scene.getScene('Title').menu.selectedId);
  if (firstOption !== 'continue') fail(`o título deveria oferecer "Continuar", veio ${firstOption}`);
  await shot('14-title-continue');
}

// --- Fase 4 via ?stage: conversar (recrutar Lys) e curar (M5) ---
await page.goto(`${url}/?stage=c1s4&seed=7`);
await until(idle, null, 20000, 'Fase 4 pronta');
await page.evaluate(() => {
  const sc = window.__FIRE_CREST__.scene.getScene('Battle');
  const b = sc.battle;
  const aren = b.units.find((u) => u.characterId === 'aren');
  aren.moveTo({ x: 2, y: 8 }); // ao lado de Lys (1,8)
  sc.sprites.get(aren.id).snap();
  sc.setCursor(aren.position);
});
await press('KeyZ');
await press('KeyZ', 300);
await pick('talk:0');
await until(() => {
  const sc = window.__FIRE_CREST__.scene.getScene('Battle');
  return sc.mode === 'idle' && !window.__FIRE_CREST__.scene.isActive('Dialogue');
}, null, 20000, 'conversa com Lys');
const lys = await page.evaluate(() => window.__FIRE_CREST__.scene.getScene('Battle').battle.units.find((u) => u.characterId === 'lys').faction);
if (lys !== 'player') fail(`Lys deveria ter sido recrutada, facção ${lys}`);
await page.evaluate(() => {
  const sc = window.__FIRE_CREST__.scene.getScene('Battle');
  const aren = sc.battle.units.find((u) => u.characterId === 'aren');
  aren.hp = 5;
  sc.sprites.get(aren.id).refresh();
  sc.setCursor(sc.battle.units.find((u) => u.characterId === 'lys').position);
});
await press('KeyZ');
await press('KeyZ', 300);
await pick('heal');
await shot('15-heal-target');
await press('KeyZ', 200);
await until(() => window.__FIRE_CREST__.scene.getScene('Battle').mode === 'idle', null, 15000, 'cura');
const arenHp = await page.evaluate(() => window.__FIRE_CREST__.scene.getScene('Battle').battle.units.find((u) => u.characterId === 'aren').hp);
if (arenHp <= 5) fail(`Lys deveria ter curado Aren (HP ${arenHp})`);
await shot('16-after-heal');

// --- Derrota → resultado → tentar de novo (M7) ---
await page.evaluate(() => {
  const sc = window.__FIRE_CREST__.scene.getScene('Battle');
  sc.battle.units.find((u) => u.characterId === 'aren').hp = 0;
  sc.checkOutcome();
});
await page.waitForTimeout(900);
await press('Enter', 600);
await until(() => window.__FIRE_CREST__.scene.isActive('Result'), null, 15000, 'resultado da derrota');
await page.waitForTimeout(400);
await shot('17-defeat');
await press('Enter', 600); // Tentar de novo
await until(idle, null, 20000, 'fase reiniciada');
const retry = await page.evaluate(() => window.__FIRE_CREST__.scene.getScene('Battle').battle.stage.id);
if (retry !== 'c1s4') fail(`"Tentar de novo" deveria reabrir a Fase 4, veio ${retry}`);

if (errors.length) fail(`erros no console:\n${errors.join('\n')}`);
await browser.close();
console.log(process.exitCode ? 'Smoke test com falhas.' : `Smoke test OK. Screenshots em ${shots}/`);
