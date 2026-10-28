// A1-A3 (save safety, text size, key remap) screenshots: node scripts/a11y-shots.mjs <chunk 1|2|3> <outDir> [baseUrl]
// Needs a running server (npm run dev -- --port 5181, or vite preview). Headless Chrome over CDP; spawns its own Chrome and kills only that PID.
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, mkdtempSync, existsSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const CHROME = [process.env.CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find((p) => p && existsSync(p));
const PORT = 9347;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const [chunk, out, base = 'http://localhost:5181'] = process.argv.slice(2);
mkdirSync(out, { recursive: true });

const dir = mkdtempSync(join(tmpdir(), 'hl-a11y-'));
const proc = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${dir}`, '--no-first-run', '--disable-extensions',
  '--disable-background-timer-throttling', '--disable-renderer-backgrounding', 'about:blank'], { stdio: 'ignore' });
for (let i = 0; i < 60; i++) { try { if ((await fetch(`http://127.0.0.1:${PORT}/json/version`)).ok) break; } catch { /* retry */ } await sleep(250); }
const tabs = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
const ws = new WebSocket(tabs.find((t) => t.type === 'page').webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r));
let id = 0;
const pending = new Map();
const errors = [];
ws.addEventListener('message', (m) => {
  const d = JSON.parse(m.data);
  if (d.method === 'Runtime.exceptionThrown') errors.push(d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text);
  if (d.id && pending.has(d.id)) { const p = pending.get(d.id); pending.delete(d.id); d.error ? p.rej(new Error(d.error.message)) : p.res(d.result); }
});
const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pending.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (expr) => {
  const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + ' ' + (r.exceptionDetails.exception?.description || ''));
  return r.result.value;
};
await send('Runtime.enable'); await send('Page.enable');
const results = [];
const check = (name, ok, extra = '') => { results.push([name, !!ok]); console.log(`${ok ? 'PASS' : 'FAIL'} ${name} ${extra}`); };
const shot = async (name) => {
  const r = await send('Page.captureScreenshot', { format: 'jpeg', quality: 72 });
  const f = join(out, name + '.jpg');
  writeFileSync(f, Buffer.from(r.data, 'base64'));
  console.log(`  shot ${name}.jpg ${Math.round(statSync(f).size / 1024)}KB`);
};
const SIZES = { game: [640, 360, false], desktop: [1280, 720, false], phoneP: [375, 812, true], phoneL: [812, 375, true], small: [320, 568, true] };
const size = async (k) => { const [w, h, m] = SIZES[k]; await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: m ? 2 : 1, mobile: m }); };
const go = async (url) => { await send('Page.navigate', { url }); await sleep(2500); };
// seed storage (lantern 1) then reload
const seed = async (obj, extra = {}) => {
  await go(base + '/');
  await ev(`if (window.__app && window.__app.save) { window.__app.save.readOnly = true; window.__app.lanterns.locked = true; } localStorage.clear(); localStorage.setItem('hollowlight.installCard.v1', String(Date.now())); localStorage.setItem('hollowlight:lantern:l1:save', ${JSON.stringify(typeof obj === 'string' ? obj : JSON.stringify(obj))}); ${Object.entries(extra).map(([k, v]) => `localStorage.setItem(${JSON.stringify(k)}, ${JSON.stringify(v)});`).join('')} true`);
};
const noOverflow = async (label) => {
  const o = await ev(`(()=>{const W=innerWidth,H=innerHeight;const bad=[];for(const e of document.querySelectorAll('#ui button, #ui p, #ui kbd, #ui .lg-btn__label')){const r=e.getBoundingClientRect();if(!r.width||getComputedStyle(e).visibility==='hidden')continue;if(e.closest('[hidden],[inert]'))continue;if(r.right>W+1||r.left<-1)bad.push((e.className||e.tagName)+':'+Math.round(r.left)+'-'+Math.round(r.right));}return {sw:document.documentElement.scrollWidth,W,bad:bad.slice(0,6)}})()`);
  check(`${label}: no horizontal overflow`, o.sw <= o.W + 1 && !o.bad.length, JSON.stringify(o));
};
const played = { version: 3, createdAt: 1, updatedAt: 2, gold: 120, stats: { runs: 10, wins: 3 } };

try {
  if (chunk === '1') {
    for (const k of ['desktop', 'game', 'phoneP', 'phoneL', 'small']) {
      await size(k); await seed(played); await go(base + '/');
      const n = await ev(`(()=>{const e=document.querySelector('.a1-nudge');if(!e)return null;const r=e.getBoundingClientRect();return {t:r.top,b:r.bottom,l:r.left,r:r.right}})()`);
      check(`${k}: reminder shown inside the screen${k === 'small' ? ' (320x568 title scrolls; width only)' : ''}`, n && n.t >= 0 && (k === 'small' || n.b <= innerHeightOf(k)) && n.l >= 0 && n.r <= SIZES[k][0] + 1, JSON.stringify(n));
      await noOverflow(k);
      await shot(`a1-title-reminder-${k}-${SIZES[k][0]}x${SIZES[k][1]}`);
    }
    for (const k of ['desktop', 'phoneP']) {
      await size(k); await seed('{"version":3,"gold":12,"stats":{"runs":4'); await go(base + '/');
      check(`${k}: damaged note shown`, await ev(`!!document.querySelector('.u3-note') && document.querySelector('.u3-note').textContent.includes('could not be read')`));
      await shot(`a1-title-damaged-${k}-${SIZES[k][0]}x${SIZES[k][1]}`);
      await ev(`document.querySelector('.u3-title')&&[...document.querySelectorAll('button')].find(b=>/Settings/.test(b.textContent)).click()`); await sleep(600);
      await ev(`document.getElementById('u4-tab-saves').click()`); await sleep(300);
      check(`${k}: damaged-copy download offered`, await ev(`[...document.querySelectorAll('button')].some(b=>/Download damaged copy/.test(b.textContent))`));
      await noOverflow(`${k} settings saves`);
      await shot(`a1-settings-saves-${k}-${SIZES[k][0]}x${SIZES[k][1]}`);
    }
  }
  if (chunk === '2') {
    const { run2 } = await import('./a11y-shots2.mjs');
    await run2({ ev, go, size, seed, shot, check, noOverflow, sleep, base, SIZES, played, send });
  }
  if (chunk === '3') {
    const { run3 } = await import('./a11y-shots3.mjs');
    await run3({ ev, go, size, seed, shot, check, noOverflow, sleep, base, SIZES, played, send });
  }
} catch (e) { check('script', false, e.stack); }
function innerHeightOf(k) { return SIZES[k][1]; }
check('no page exceptions', !errors.length, errors.slice(0, 3).join(' / '));
console.log(`${results.filter((r) => r[1]).length}/${results.length} pass`);
ws.close(); try { process.kill(proc.pid); } catch { /* gone */ }
process.exit(results.every((r) => r[1]) ? 0 : 1);
