// Minimal headless-Chrome CDP driver (no dependencies; Node 22+ global WebSocket).
// Usage: node scripts/cdp.mjs shots <outDir> [baseUrl]   | node scripts/cdp.mjs perf [baseUrl]
// Needs `npm run build && npx vite preview --port 4173` running.
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, mkdtempSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME = [process.env.CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find((p) => p && existsSync(p));
const PORT = 9333;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function launch() {
  const dir = mkdtempSync(join(tmpdir(), 'hl-chrome-'));
  const proc = spawn(CHROME, [
    '--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${dir}`, '--no-first-run', '--disable-extensions',
    '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows',
    '--autoplay-policy=no-user-gesture-required', ...(process.env.SWGL ? ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] : []), 'about:blank',
  ], { stdio: 'ignore' });
  for (let i = 0; i < 60; i++) {
    try { const r = await fetch(`http://127.0.0.1:${PORT}/json/version`); if (r.ok) break; } catch { /* retry */ }
    await sleep(250);
  }
  const tabs = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
  const ws = new WebSocket(tabs.find((t) => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener('open', r));
  let id = 0;
  const pending = new Map();
  ws.addEventListener('message', (m) => {
    const d = JSON.parse(m.data);
    if (d.method === 'Runtime.exceptionThrown') console.error('PAGE EXC', d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text);
    if (d.method === 'Runtime.consoleAPICalled' && d.params.type === 'error') console.error('PAGE ERR', d.params.args.map((a) => a.value || a.description).join(' '));
    if (d.id && pending.has(d.id)) { const p = pending.get(d.id); pending.delete(d.id); d.error ? p.rej(new Error(d.error.message)) : p.res(d.result); }
  });
  const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pending.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async (expr) => {
    const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + ' ' + (r.exceptionDetails.exception?.description || ''));
    return r.result.value;
  };
  const close = () => { try { ws.close(); proc.kill(); } catch { /* ignore */ } };
  return { send, ev, close };
}

async function open(c, url, w, h, dpr) {
  await c.send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: dpr, mobile: false });
  await c.send('Page.enable');
  await c.send('Runtime.enable');
  await c.send('Page.navigate', { url });
  for (let i = 0; i < 80; i++) {
    await sleep(250);
    try { if (await c.ev('!!(window.__app && window.__app.sim)')) return; } catch { /* loading */ }
  }
  console.error(await c.ev('JSON.stringify({rs:document.readyState,app:typeof window.__app,sim:!!(window.__app&&window.__app.sim),href:location.href,txt:document.body.innerText.slice(0,200)})'));
  throw new Error('run did not start: ' + url);
}

const simT = (c) => c.ev('window.__app.sim.time');
async function waitSim(c, fn, timeoutMs = 30000) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) { if (await c.ev(fn)) return true; await sleep(100); }
  return false;
}

async function shot(c, file) {
  const r = await c.send('Page.captureScreenshot', { format: 'png' });
  writeFileSync(file, Buffer.from(r.data, 'base64'));
}

const GRANT = 'ghost_wolves:speed=3,power=3;raven_flock:power=3;spirit_bolts:power=3,pierce=2;holy_orbit:power=2';

export async function shots(out, base) {
  mkdirSync(out, { recursive: true });
  const c = await launch();
  try {
    for (const st of ['a', 'b']) {
      for (const [tag, w, h, dpr] of [['', 1280, 720, 1], ['phone-', 390, 844, 2]]) {
        const q = (t) => `${base}/?style=${st}&auto=wren&seed=1&t=${t}&god=1&debug=1&grant=${GRANT}`;
        await open(c, q(300), w, h, dpr);
        await waitSim(c, 'window.__app.sim.time > 306');
        await shot(c, join(out, `${st}-${tag}midrun.raw.png`));
        await open(c, q(358), w, h, dpr);
        await waitSim(c, 'window.__app.sim.time > 364');
        await shot(c, join(out, `${st}-${tag}swarm.raw.png`));
        await open(c, q(598), w, h, dpr);
        await waitSim(c, '!!window.__app.sim.boss');
        await c.ev('(()=>{const s=window.__app.sim;const b=s.boss;s.player.x=b.x-110;s.player.y=b.y+30;return true})()');
        await sleep(900);
        await shot(c, join(out, `${st}-${tag}boss.raw.png`));
        if (tag === '') {
          // level-up overlay
          await open(c, `${base}/?style=${st}&auto=wren&seed=2&t=120&god=1&debug=1&rr=2&ban=2`, w, h, dpr);
          await waitSim(c, 'window.__app.sim.state === "levelup"', 60000);
          await sleep(900);
          await shot(c, join(out, `${st}-levelup.raw.png`));
        }
      }
    }
  } finally { c.close(); }
}

// Per style x tier: run from t=300 for `secs`, sample scene.perf.rec twice a second.
export async function perf(base, secs = 12, throttle = 1, styles = ['a', 'b'], tiers = ['low', 'med', 'high'], size = [1280, 720, 1]) {
  const c = await launch();
  const rows = [];
  try {
    if (throttle > 1) await c.send('Emulation.setCPUThrottlingRate', { rate: throttle });
    for (const st of styles) {
      for (const tier of tiers) {
        await open(c, `${base}/?style=${st}&auto=wren&seed=1&t=300&god=1&debug=1&grant=${GRANT}`, ...size);
        await c.ev(`window.__app.save.setSettings({quality:'${tier}'}); true`);
        await sleep(3000);
        const acc = { fps: 0, ms: 0, work: 0, sprites: 0, particles: 0, calls: 0, n: 0 };
        for (let i = 0; i < secs * 2; i++) {
          await sleep(500);
          const r = await c.ev('(()=>{const r=window.__app.scene.perf.rec;return r?{...r}:null})()');
          if (!r) continue;
          for (const k of ['fps', 'ms', 'work', 'sprites', 'particles', 'calls']) acc[k] += r[k];
          acc.n++;
        }
        const gpu = await c.ev('(()=>{const g=document.createElement("canvas").getContext("webgl");const e=g&&g.getExtension("WEBGL_debug_renderer_info");return e?g.getParameter(e.UNMASKED_RENDERER_WEBGL):"?"})()');
        const n = acc.n || 1;
        rows.push({ style: st, tier, throttle, fps: +(acc.fps / n).toFixed(1), ms: +(acc.ms / n).toFixed(1), work: +(acc.work / n).toFixed(2), sprites: Math.round(acc.sprites / n), particles: Math.round(acc.particles / n), calls: Math.round(acc.calls / n), gpu });
        console.log(JSON.stringify(rows[rows.length - 1]));
      }
    }
  } finally { c.close(); }
  return rows;
}

const [cmd, a1, a2] = process.argv.slice(2);
if (cmd === 'shots') await shots(a1, a2 || 'http://localhost:4173');
else if (cmd === 'perf') {
  const th = Number(process.env.THROTTLE || 1);
  const tiers = process.env.TIERS ? process.env.TIERS.split(',') : undefined;
  await perf(a1 || 'http://localhost:4173', Number(process.env.SECS || 12), th, undefined, tiers);
}
process.exit(0);
