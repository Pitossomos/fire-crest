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
const idle = () => window.__FIRE_CREST__.scene.getScene('Battle')?.mode === 'idle' && !window.__FIRE_CREST__.scene.isActive('Dialogue');

// --- Título ---
await page.goto(url);
await page.waitForFunction(() => window.__FIRE_CREST__?.scene.isActive('Title'));
await page.waitForTimeout(600);
await shot('01-title');
await press('Enter', 1000);

// --- Diálogo de abertura (M4) ---
if (!(await dialogueOpen())) fail('esperava o diálogo de abertura');
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

// --- Vitória (M3/M4): derrota todos os inimigos via hook e checa o desfecho ---
if (!s.outcome) {
  const out = await page.evaluate(() => {
    const sc = window.__FIRE_CREST__.scene.getScene('Battle');
    for (const u of sc.battle.units) if (u.faction === 'enemy') u.hp = 0;
    sc.checkOutcome();
    return sc.outcome;
  });
  if (out !== 'victory') fail(`esperava vitória, veio ${out}`);
  await page.waitForTimeout(900);
  await shot('09-victory');
  await press('Enter', 600);
  if (!(await dialogueOpen())) fail('esperava o diálogo pós-batalha');
  await shot('10-post-dialogue');
}

if (errors.length) fail(`erros no console:\n${errors.join('\n')}`);
await browser.close();
console.log(process.exitCode ? 'Smoke test com falhas.' : `Smoke test OK. Screenshots em ${shots}/`);
