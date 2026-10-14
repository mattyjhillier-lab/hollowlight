// node build2.mjs -> HTML + PNGs via local Chrome over CDP (Node built-ins only). Mock-ups, not game code.
import { writeFileSync, mkdtempSync, existsSync, statSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { page, world, layout } from './lib2.mjs';
import { recompress } from '../ui-directions/png.mjs';
import { E1 } from './e1.mjs';
import { E2 } from './e2.mjs';
import { E3 } from './e3.mjs';
const here = dirname(fileURLToPath(import.meta.url));
const DIRS = [
  { n: 1, D: E1, name: 'INK & SPIRIT', line: 'Hand-inked storybook: the world is black ink and hatching; colour exists only in spirits, pickups and one danger red.', legend: 'E1 = W1 world + U1 UI-plates + T1 type + C1 colour + I1 icons + L1 logo + B1 bars' },
  { n: 2, D: E2, name: 'COMIC CEL', line: 'Borderlands-style: thick black outlines, flat cel fills, one hard shadow tone, halftone dots, chunky angular plates.', legend: 'E2 = W2 world + U2 UI-plates + T2 type + C2 colour + I2 icons + L2 logo + B2 bars' },
  { n: 3, D: E3, name: 'PAPERCUT DIORAMA', line: 'Layered flat paper shapes with soft shadows between layers, warm lantern light, spirits as glowing paper cut-outs.', legend: 'E3 = W3 world + U3 paper-tags + T3 type + C3 colour + I3 icons + L3 logo + B3 bars' },
];
const jobs = [];
const worldSvg = (D) => D.bg('play') + world(D) + D.hud();
const mk = (file, meta, scr) => { writeFileSync(join(here, file + '.html'), page({ ...meta, screens: scr.map(([id, cap, svg]) => ({ id, cap, svg })) })); for (const [id] of scr) jobs.push([file, id]); };
for (const { n, D, name, line, legend } of DIRS) {
  D.codes = { W: `W${n}`, U: `U${n}`, T: `T${n}`, C: `C${n}`, I: `I${n}`, L: `L${n}`, B: `B${n}` };
  mk('e' + n, { label: `DIRECTION E${n}: ${name}`, line, legend, pal: D.pal, acc: D.acc },
    [['world', 'In-run scene', worldSvg(D)], ['title', 'Title and character select', layout.title(D)], ['levelup', 'Level-up cards (gold = reserved EVOLVE)', layout.levelup(D)], ['parts', 'Parts sheet + creature sheet (codes shown)', layout.parts(D)]]);
}
// Mix: E1 ink world + creatures, E2 UI plates/type/bars/cards. Recipe: W1 + U2 + T2 + I2 + B2 + L2 over C1 colours.
{
  const M = { ...E2, bg: E1.bg, cr: E1.cr, gem: E1.gem };
  // E2 UI drawn with E1 colour inputs
  const hud = E2.hudWith ? E2.hudWith({ cy: '#2ee6ff', vi: '#a35cff', red: '#ff2b3a', plate: '#262630', ol: '#050507' }) : '';
  mk('mix-e', { label: 'MIX E: INK WORLD + COMIC-CEL UI', line: 'Proof that parts combine: E1 ink world and creatures, E2 chunky HUD plates, bars and Impact type, recoloured with E1 spirit colours.', legend: 'MIX E = W1 world + U2 UI-plates + T2 type + B2 bars + I2 icons + C1 colour (E1 palette)', pal: E1.pal, acc: E1.acc },
    [['mix', 'Mix: W1 + U2 + T2 + B2 + I2 + C1', E1.bg('play') + world({ cr: E1.cr, gem: E1.gem, dmg: E1.dmg }) + hud]]);
}
const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find(existsSync);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const dir = mkdtempSync(join(tmpdir(), 'hl-id-'));
const proc = spawn(CHROME, ['--headless=new', '--remote-debugging-port=9335', `--user-data-dir=${dir}`, '--no-first-run', '--allow-file-access-from-files', 'about:blank'], { stdio: 'ignore' });
for (let i = 0; i < 60; i++) { try { if ((await fetch('http://127.0.0.1:9335/json/version')).ok) break; } catch {} await sleep(250); }
const tabs = await (await fetch('http://127.0.0.1:9335/json/list')).json();
const ws = new WebSocket(tabs.find((t) => t.type === 'page').webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r));
let id = 0; const pend = new Map();
ws.addEventListener('message', (m) => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); } });
const send = (method, params = {}) => new Promise((res) => { const i = ++id; pend.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 720, deviceScaleFactor: 1, mobile: false });
await send('Page.enable');
const only = process.argv[2];
for (const [file, scr] of jobs) {
  if (only && !(file + '-' + scr).includes(only) && file !== only) continue;
  await send('Page.navigate', { url: pathToFileURL(join(here, file + '.html')).href + '?s=' + scr });
  await sleep(1100);
  const r = await send('Page.captureScreenshot', { format: 'png' });
  const out = join(here, (file.startsWith('mix') ? file.replace('-e', '-e') : file + '-' + scr) + '.png');
  const src = Buffer.from(r.result.data, 'base64'); let o = src, rd = 0;
  for (const k of [1, 2, 3, 4, 5, 6, 8, 10]) { o = recompress(src, k); rd = k; if (o.length < 335 * 1024) break; }
  writeFileSync(out, o);
  console.log(out.split(/[\/]/).pop(), Math.round(statSync(out).size / 1024) + 'KB round' + rd);
}
ws.close(); proc.kill(); process.exit(0);
