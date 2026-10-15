// node build.mjs  -> writes HTML + renders PNGs via local Chrome over CDP (Node built-ins only).
import { writeFileSync, mkdtempSync, existsSync, statSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { page } from './lib.mjs';
import { recompress } from './png.mjs';
import { title, hud, levelup, parts, DIRS, legendOf, metaOf } from './screens.mjs';
const here = dirname(fileURLToPath(import.meta.url));
const jobs = [];
const mk = (file, meta, scr) => { writeFileSync(join(here, file + '.html'), page({ ...meta, screens: scr.map(([id, cap, fn]) => ({ id, cap, html: fn(meta.cb) })) })); for (const [id] of scr) jobs.push([file, id]); };
for (const d of DIRS) {
  const meta = metaOf(`DIRECTION ${d.n}: ${d.name}`, d.line, `D${d.n} = ` + legendOf(d.cb), d.cb);
  mk('d' + d.n, meta, [['title', 'Title screen', title], ['hud', 'In-run HUD', hud], ['levelup', 'Level-up cards', levelup], ['parts', 'Parts sheet (each part has its mix-and-match code)', parts]]);
}
const A = { S: 2, C: 3, T: 2, I: 2, B: 2, K: 2, L: 2 }, Bm = { S: 3, C: 4, T: 4, I: 3, B: 3, K: 3, L: 4 };
mk('mix-a', metaOf('MIX A: GOTHIC FRAMES + NEON COLOURS', 'Proof that parts combine: D2 shapes/type/bars/cards with D3 palette.', 'MIX A = ' + legendOf(A), A), [['levelup', 'Level-up cards (mix)', levelup]]);
mk('mix-b', metaOf('MIX B: CUT-CORNER HUD + EMBER COLOURS', 'Proof that parts combine: D3 shapes/bars/icons with D4 palette and heavy type.', 'MIX B = ' + legendOf(Bm), Bm), [['hud', 'In-run HUD (mix)', hud]]);

const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find(existsSync);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const dir = mkdtempSync(join(tmpdir(), 'hl-mock-'));
const proc = spawn(CHROME, ['--headless=new', '--remote-debugging-port=9334', `--user-data-dir=${dir}`, '--no-first-run', '--allow-file-access-from-files', 'about:blank'], { stdio: 'ignore' });
for (let i = 0; i < 60; i++) { try { if ((await fetch('http://127.0.0.1:9334/json/version')).ok) break; } catch {} await sleep(250); }
const tabs = await (await fetch('http://127.0.0.1:9334/json/list')).json();
const ws = new WebSocket(tabs.find((t) => t.type === 'page').webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r));
let id = 0; const pend = new Map();
ws.addEventListener('message', (m) => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); } });
const send = (method, params = {}) => new Promise((res) => { const i = ++id; pend.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 720, deviceScaleFactor: 1, mobile: false });
await send('Page.enable');
for (const [file, scr] of jobs) {
  await send('Page.navigate', { url: pathToFileURL(join(here, file + '.html')).href + '?s=' + scr });
  await sleep(900);
  const r = await send('Page.captureScreenshot', { format: 'png' });
  const out = join(here, (file.startsWith('mix') ? file : file + '-' + scr) + '.png');
  const src = Buffer.from(r.result.data, 'base64'); let o = src, rd = 0;
  for (const k of [1, 2, 3, 4, 5]) { o = recompress(src, k); rd = k; if (o.length < 330 * 1024) break; }
  writeFileSync(out, o);
  console.log(out.split(/[\/]/).pop(), Math.round(statSync(out).size / 1024) + 'KB round' + rd);
}
ws.close(); proc.kill(); process.exit(0);
