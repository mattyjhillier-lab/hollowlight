// Regenerate: node build.mjs [t1|t2|t3] [screen]  (own headless Chrome on port 9372; Node built-ins only).
// Writes <take>-<screen>.html + PNGs at 1280x720, 844x390@2x, 390x844@2x (kit: 1280x720 only) and measured.txt.
// T2/T3 proofs load OFL fonts from fonts.googleapis.com (mock-ups only, nothing downloaded into the repo).
import { writeFileSync, mkdtempSync, existsSync, readFileSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { DEFS } from './lib.mjs';
import { BASE } from './base.mjs';
import { screens, kit } from './screens.mjs';
const HERE = dirname(fileURLToPath(import.meta.url));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const META = {
  t1: { n: 1, name: 'Lantern Glass, Lit', line: 'Round 1, painted by the same hand as Wren: chunky lantern windows, tinted outline, rim light, cool glass lit warm.', panel: 'Cool Hollow glass, lit warm from the lantern cap. Brass band with a dark tinted outline and a bright top edge, hand-wobbled.' },
  t2: { n: 2, name: 'Leadlight', line: 'Every surface is a leaded window lit from behind. Far from the lantern the glass stays Hollow-grey; near it, colour returns.', panel: 'Thick lead came (the outline), a border of glass pieces that colour up near the light, and a calm frosted pane for reading.' },
  t3: { n: 3, name: 'Stitchwork', line: 'The lantern-bearer\'s cloak: indigo felt, cream pelt patches, amber thread that glows like a trail, brass buttons.', panel: 'Felt with a fuzzy hand-cut edge and a tinted outline, amber running stitch that glows, brass grommets on a hanging thread.' },
};
const SIZES = [['1280x720', 1280, 720, 1], ['844x390', 844, 390, 2], ['390x844', 390, 844, 2]];
const args = process.argv.slice(2);
const takes = ['t1', 't2', 't3'].filter((t) => !args.some((a) => /^t\d$/.test(a)) || args.includes(t));
const only = args.filter((a) => !/^t\d$/.test(a));
const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find(existsSync);
const PORT = 9372;
const proc = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), 'hl-uiv2-'))}`, '--no-first-run', '--disable-extensions', '--allow-file-access-from-files', 'about:blank'], { stdio: 'ignore' });
for (let i = 0; i < 60; i++) { try { if ((await fetch(`http://127.0.0.1:${PORT}/json/version`)).ok) break; } catch {} await sleep(250); }
const tabs = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
const ws = new WebSocket(tabs.find((t) => t.type === 'page').webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r));
let id = 0; const pending = new Map();
ws.addEventListener('message', (m) => { const d = JSON.parse(m.data); if (d.id && pending.has(d.id)) { const p = pending.get(d.id); pending.delete(d.id); d.error ? p.rej(new Error(d.error.message)) : p.res(d.result); } });
const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pending.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (e) => (await send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true })).result.value;
await send('Page.enable');
const MEASURE = `(async()=>{await document.fonts.ready;await new Promise(r=>setTimeout(r,250));const vw=innerWidth,vh=innerHeight;const skip=e=>e.closest('svg')||e.closest('.frame')||e.matches('.bg,.veil,.hang,.hang *,.ptop,.ptop *,.seal,.seal *,.flag,.flag *,.eye,.pips::before');
const bad=[];for(const e of document.querySelectorAll('.scr *')){if(skip(e))continue;const r=e.getBoundingClientRect();if(!r.width||getComputedStyle(e).display==='none')continue;if(r.bottom>vh+1||r.right>vw+1||r.left<-1||r.top<-1)bad.push((e.className||e.tagName).toString().slice(0,20))}
const small=[];for(const e of document.querySelectorAll('.scr *')){if(e.closest('svg'))continue;if(![...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim()))continue;const cs=getComputedStyle(e);if(cs.display==='none'||!e.getBoundingClientRect().width)continue;const fs=parseFloat(cs.fontSize);if(fs<11.95)small.push(e.tagName+'.'+e.className+':'+fs.toFixed(1))}
const t=[...document.querySelectorAll('.btn,.pill,.bless,.card,.hcard,.tab,.tog')].filter(b=>b.getBoundingClientRect().width).map(b=>Math.min(b.getBoundingClientRect().width,b.getBoundingClientRect().height));
const fonts=[...document.fonts].filter(f=>f.status==='loaded').map(f=>f.family.replace(/"/g,'')).filter((v,i,a)=>a.indexOf(v)===i).join('+');
return JSON.stringify({overflow:[...new Set(bad)].slice(0,6),under12:[...new Set(small)].slice(0,5),minTarget:Math.round(Math.min(...t,999)),scroll:document.documentElement.scrollHeight>vh+1,fonts})})()`;
const lines = existsSync(join(HERE, 'measured.txt')) ? readFileSync(join(HERE, 'measured.txt'), 'utf8').split('\n').filter(Boolean) : [];
const put = (k, v) => { const i = lines.findIndex((l) => l.startsWith(k + ' ')); const s = `${k} ${v}`; if (i >= 0) lines[i] = s; else lines.push(s); };
for (const t of takes) {
  const T = await import(`./${t}.mjs`);
  const S = screens(T.O);
  const pages = { kit: () => kit(T.O, META[t]), ...S };
  for (const [name, fn] of Object.entries(pages)) {
    if (only.length && !only.includes(name)) continue;
    const f = join(HERE, `${t}-${name}.html`);
    writeFileSync(f, `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Hollowlight UI v2 ${META[t].name}: ${name}</title>${T.head}<style>${BASE}${T.css}</style></head><body>${DEFS}<div class="scr ${t}" data-s="${name}">${fn()}</div>${T.script || ''}</body></html>`);
    for (const [sz, w, h, dpr] of SIZES) {
      if (name === 'kit' && sz !== '1280x720') continue;
      await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: dpr, mobile: false });
      await send('Page.navigate', { url: pathToFileURL(f).href }); await sleep(700);
      const m = await ev(MEASURE);
      const r = await send('Page.captureScreenshot', { format: 'png' });
      writeFileSync(join(HERE, `${t}-${name}-${sz}.png`), Buffer.from(r.data, 'base64'));
      put(`${t}-${name}-${sz}`, m); console.log(t, name, sz, m);
    }
  }
}
lines.sort();
writeFileSync(join(HERE, 'measured.txt'), lines.join('\n') + '\n');
ws.close(); proc.kill();
