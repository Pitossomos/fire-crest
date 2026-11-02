// Teste de fumaça de ponta a ponta: abre o jogo, entra na Fase 1, seleciona,
// move e faz Aren esperar, encerra o turno e verifica que não há erros no console.
// Uso: npm run dev (em outro terminal) e depois `npm run e2e`.
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

const battle = () => page.evaluate(() => {
  const s = window.__FIRE_CREST__.scene.getScene('Battle');
  const b = s.battle;
  const aren = b.units.find((u) => u.characterId === 'aren');
  return { mode: s.mode, turn: b.turn, phase: b.phase, aren: { x: aren.x, y: aren.y, acted: aren.hasActed } };
});
const press = async (key, wait = 120) => { await page.keyboard.press(key); await page.waitForTimeout(wait); };
const fail = (msg) => { console.error('FALHOU:', msg); process.exitCode = 1; };

await page.goto(url);
await page.waitForFunction(() => window.__FIRE_CREST__?.scene.isActive('Title'));
await page.waitForTimeout(600);
await page.screenshot({ path: join(shots, '01-title.png') });

await press('Enter');
await page.waitForFunction(() => window.__FIRE_CREST__.scene.getScene('Battle')?.mode === 'idle', null, { timeout: 5000 });
await page.screenshot({ path: join(shots, '02-battle.png') });

await press('KeyZ'); // seleciona Aren (cursor começa nele)
let s = await battle();
if (s.mode !== 'selected') fail(`esperava modo selected, veio ${s.mode}`);
await press('ArrowLeft'); await press('ArrowLeft'); await press('ArrowUp');
await page.screenshot({ path: join(shots, '03-ranges.png') });

await press('KeyZ', 900); // move e abre o menu
s = await battle();
if (s.mode !== 'menu') fail(`esperava modo menu, veio ${s.mode}`);
if (s.aren.x !== 4 || s.aren.y !== 6) fail(`Aren deveria estar em (4,6), está em (${s.aren.x},${s.aren.y})`);
await page.screenshot({ path: join(shots, '04-menu.png') });

await press('KeyZ'); // Esperar
s = await battle();
if (!s.aren.acted) fail('Aren deveria ter agido');

await press('KeyE'); // encerra o turno
await page.waitForFunction(() => {
  const b = window.__FIRE_CREST__.scene.getScene('Battle');
  return b.mode === 'idle' && b.battle.turn === 2;
}, null, { timeout: 10000 });
s = await battle();
if (s.aren.acted) fail('Aren deveria poder agir no turno 2');

// Inspeciona um inimigo com o mouse (bandido em 7,2 → pixel central).
await page.mouse.click(7 * 48 + 24, 2 * 48 + 24);
await page.waitForTimeout(200);
await page.screenshot({ path: join(shots, '05-enemy-range.png') });
s = await battle();
if (s.mode !== 'inspect') fail(`esperava modo inspect, veio ${s.mode}`);

if (errors.length) fail(`erros no console:\n${errors.join('\n')}`);
await browser.close();
console.log(process.exitCode ? 'Smoke test com falhas.' : `Smoke test OK. Screenshots em ${shots}/`);
