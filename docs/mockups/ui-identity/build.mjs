// Regenerate: node build.mjs [take] [screen]  (own headless Chrome; Node built-ins only). Writes <take>-<screen>.html + PNGs.
import { writeFileSync, mkdtempSync, existsSync, mkdirSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { SCREENS } from './shared.mjs';
import { COMMON, A, B, FLOOR } from './css.mjs';
const HERE = dirname(fileURLToPath(import.meta.url));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const TAKES = { a: A, b: B };
const SIZES = [['1280x720', 1280, 720, 1], ['844x390', 844, 390, 2], ['390x844', 390, 844, 2]];
const only = process.argv.slice(2);
const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find(existsSync);
const PORT = 9362;
const proc = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), 'hl-uiid-'))}`, '--no-first-run', '--disable-extensions', 'about:blank'], { stdio: 'ignore' });
for (let i = 0; i < 60; i++) { try { if ((await fetch(`http://127.0.0.1:${PORT}/json/version`)).ok) break; } catch {} await sleep(250); }
const tabs = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
const ws = new WebSocket(tabs.find((t) => t.type === 'page').webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r));
let id = 0; const pending = new Map();
ws.addEventListener('message', (m) => { const d = JSON.parse(m.data); if (d.id && pending.has(d.id)) { const p = pending.get(d.id); pending.delete(d.id); d.error ? p.rej(new Error(d.error.message)) : p.res(d.result); } });
const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pending.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (e) => (await send('Runtime.evaluate', { expression: e, returnByValue: true })).result.value;
await send('Page.enable');
const lines = [];
for (const [t, css] of Object.entries(TAKES)) for (const [name, fn] of Object.entries(SCREENS)) {
  if (only.length && !only.includes(t) && !only.includes(name)) continue;
  const f = join(HERE, `${t}-${name}.html`);
  writeFileSync(f, `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Hollowlight UI take ${t.toUpperCase()}: ${name}</title><style>${COMMON}${css}${FLOOR}</style></head><body><div class="scr" data-s="${name}">${fn()}</div></body></html>`);
  for (const [sz, w, h, dpr] of SIZES) {
    await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: dpr, mobile: false });
    await send('Page.navigate', { url: pathToFileURL(f).href }); await sleep(450);
    const m = await ev(`(()=>{const vw=innerWidth,vh=innerHeight;const bad=[];for(const e of document.querySelectorAll('.scr *')){if(e.closest('svg')||e.classList.contains('eye')||e.classList.contains('f')||e.classList.contains('bgscene')||e.classList.contains('dim')||e.classList.contains('badge')||e.closest('.badge')||e.classList.contains('stitch')||e.classList.contains('leak')||e.tagName==='I'||e.tagName==='U'||e.tagName==='EM'&&e.closest('.logo'))continue;const r=e.getBoundingClientRect();if(!r.width)continue;if(r.bottom>vh+1||r.right>vw+1||r.left<-1||r.top<-1)bad.push(e.className||e.tagName);}const small=[];for(const e of document.querySelectorAll('.scr *')){if(!e.childNodes.length||![...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim()))continue;const fs=parseFloat(getComputedStyle(e).fontSize);if(fs<10.9)small.push(e.tagName+'.'+e.className+':'+fs.toFixed(1)+':'+e.textContent.trim().slice(0,12));}const btns=[...document.querySelectorAll('.btn,.pill,.bcard,.card,.hcard')].map(b=>Math.min(b.getBoundingClientRect().width,b.getBoundingClientRect().height));return JSON.stringify({bad:[...new Set(bad)].slice(0,6),small:[...new Set(small)].slice(0,6),minTarget:Math.round(Math.min(...btns,999))})})()`);
    const r = await send('Page.captureScreenshot', { format: 'png' });
    writeFileSync(join(HERE, `${t}-${name}-${sz}.png`), Buffer.from(r.data, 'base64'));
    lines.push(`${t}-${name}-${sz} ${m}`);
  }
}
writeFileSync(join(HERE, 'measured.txt'), lines.join('\n') + '\n');
console.log(lines.join('\n'));
ws.close(); proc.kill();
