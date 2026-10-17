// Enemies sheet: capture EMPTY real-build world plates (no enemies) to composite the code-drawn enemy designs onto at true in-game scale.
// node plates.mjs [baseUrl]  (serve a build first, e.g. `npx vite build --outDir X && npx vite preview --outDir X --port 4191`).
// Own Chrome on its own port; kills only that PID. Writes plates/*.jpg in this folder. Mock-up tooling only, not game code.
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, mkdtempSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const here = dirname(fileURLToPath(import.meta.url));
const base = process.argv[2] || 'http://localhost:4191';
const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find(existsSync);
const PORT = 9431;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const proc = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), 'hl-enp-'))}`, '--no-first-run', '--disable-extensions',
  '--disable-background-timer-throttling', '--disable-renderer-backgrounding', 'about:blank'], { stdio: 'ignore' });
for (let i = 0; i < 60; i++) { try { if ((await fetch(`http://127.0.0.1:${PORT}/json/version`)).ok) break; } catch { /* retry */ } await sleep(250); }
const tabs = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
const ws = new WebSocket(tabs.find((t) => t.type === 'page').webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r));
let id = 0; const pend = new Map();
ws.addEventListener('message', (m) => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { const p = pend.get(d.id); pend.delete(d.id); d.error ? p.rej(new Error(d.error.message)) : p.res(d.result); } });
const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pend.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (expr) => { const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.text); return r.result.value; };
mkdirSync(join(here, 'plates'), { recursive: true });
// [name, hero, t, w, h, mobile]
const PLATES = [
  ['desk-night-wren', 'wren', 30, 1280, 720, false], ['desk-day-wren', 'wren', 690, 1280, 720, false],
  ['desk-night-elias', 'elias', 30, 1280, 720, false], ['desk-day-elias', 'elias', 690, 1280, 720, false],
  ['phone-night-wren', 'wren', 30, 844, 390, true], ['phone-day-wren', 'wren', 690, 844, 390, true],
];
try {
  for (const [name, hero, t, w, h, mobile] of PLATES) {
    await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: mobile ? 2 : 1, mobile });
    await send('Page.enable'); await send('Runtime.enable');
    await send('Page.navigate', { url: `${base}/?auto=${hero}&seed=3&t=${t}&god=1${mobile ? '&touch=1' : ''}` });
    for (let i = 0; i < 80; i++) { await sleep(250); try { if (await ev('!!(window.__app && window.__app.sim && window.__app.scene)')) break; } catch { /* loading */ } }
    await ev(`(() => { const a = window.__app; const sc = a.scene; try { sc.quality.setMode('high'); sc.applyTier(); } catch (e) {}
      const clr = () => { const s = a.sim; if (!s) return; s.bossSpawned = true; s.boss = null; s.chapter.waves.length = 0; s.chapter.events.length = 0; for (const e of s.enemies) e.dead = true; };
      clr(); setInterval(clr, 20); return 1; })()`);
    await sleep(3200);
    const r = await send('Page.captureScreenshot', { format: 'jpeg', quality: 86 });
    writeFileSync(join(here, 'plates', name + '.jpg'), Buffer.from(r.data, 'base64'));
    console.log('plate', name, JSON.parse(await ev('JSON.stringify({t: +window.__app.sim.time.toFixed(1), n: window.__app.sim.enemies.filter(e=>!e.dead).length, tier: window.__app.scene.quality.tier, zoom: window.__app.scene.cameras.main.zoom})')));
  }
} finally { try { ws.close(); } catch { /* */ } proc.kill(); }
process.exit(0);
