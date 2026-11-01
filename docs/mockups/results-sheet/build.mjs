// Results sheet (defeat + victory dawn): static HTML mock-ups, NOT game code. Node built-ins + own headless Chrome only.
// Regenerate: node build.mjs  (writes results-*.png + measured.txt here; tmp/ holds the HTML pages)
import { writeFileSync, mkdtempSync, existsSync, mkdirSync } from 'node:fs';
import { spawn } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const CSS = `
:root{--ink:#140f0c;--brass:#d8b26a;--cream:#fff3dc;--muted:#b9ab92;--gold:#ffd36b;--teal:#8fd6c8}
*{box-sizing:border-box;margin:0}
html,body{height:100%;overflow:hidden;background:#0b0908;font-family:"Segoe UI",system-ui,sans-serif;color:var(--cream)}
.num{font-family:"Segoe UI Black","Arial Black",sans-serif;font-weight:900;font-variant-numeric:tabular-nums;-webkit-text-stroke:3px var(--ink);paint-order:stroke fill;line-height:1}
.res{position:fixed;inset:0;display:flex;flex-direction:column;
 padding:max(2.4vh,env(safe-area-inset-top)) max(3vw,env(safe-area-inset-right)) max(2.4vh,env(safe-area-inset-bottom)) max(3vw,env(safe-area-inset-left));gap:2vh;
 --u:min(1vw,1.78vh);}
.res[data-out=defeat]{background:radial-gradient(ellipse 60% 55% at 30% 40%,rgba(255,171,58,.16),transparent 70%),radial-gradient(ellipse 120% 100% at 50% 50%,#1b1a1c,#0b0a0b 80%)}
.res[data-out=victory]{background:radial-gradient(ellipse 80% 60% at 28% 8%,rgba(255,226,150,.5),transparent 65%),radial-gradient(ellipse 100% 70% at 50% 100%,rgba(143,214,150,.16),transparent 70%),linear-gradient(#3a2b1c,#171210 75%)}
.world{position:absolute;inset:0;width:100%;height:100%;pointer-events:none}
.body{position:relative;flex:1;min-height:0;display:grid;grid-template-columns:minmax(0,.9fr) minmax(0,1.25fr);gap:calc(var(--u)*2.4);align-items:center}
.hero{display:flex;flex-direction:column;align-items:center;text-align:center;gap:calc(var(--u)*1.1)}
.lamp{width:calc(var(--u)*17);height:calc(var(--u)*24);overflow:visible}
.kicker{font-size:max(11px,calc(var(--u)*1.35));letter-spacing:.14em;text-transform:uppercase;color:var(--muted)}
h1{font-family:Georgia,serif;font-weight:700;font-size:calc(var(--u)*4.6);line-height:1.05;color:var(--cream);text-shadow:0 2px 0 var(--ink),0 0 24px rgba(255,171,58,.35)}
.res[data-out=victory] h1{color:var(--gold);text-shadow:0 2px 0 #4a2f08,0 0 30px rgba(255,211,107,.6)}
.line{font-family:Georgia,serif;font-style:italic;font-size:calc(var(--u)*1.9);color:#e8d9bb;max-width:26em}
.bark{font-size:calc(var(--u)*1.7);color:#ffe0a0}
.card{position:relative;background:linear-gradient(rgba(45,37,32,.88),rgba(23,18,15,.88));border:2px solid rgba(216,178,106,.8);border-radius:calc(var(--u)*1.6);padding:calc(var(--u)*1.6) calc(var(--u)*2);display:flex;flex-direction:column;gap:calc(var(--u)*1.3);box-shadow:0 8px 28px rgba(0,0,0,.5)}
.timeblk{display:flex;flex-direction:column;gap:calc(var(--u)*.7)}
.trow{display:flex;align-items:baseline;gap:calc(var(--u)*1.2);flex-wrap:wrap}
.big{font-size:calc(var(--u)*5.4)}
.lab{font-size:max(11px,calc(var(--u)*1.3));letter-spacing:.1em;text-transform:uppercase;color:var(--muted)}
.near{font-size:calc(var(--u)*1.6);color:#f0e2c4}
.near b{color:var(--cream)}
.arc{position:relative;height:calc(var(--u)*1.1);min-height:9px;border-radius:99px;background:#0c0908;border:1.5px solid rgba(141,108,52,.8)}
.arc i{position:absolute;left:0;top:0;bottom:0;border-radius:99px;background:linear-gradient(90deg,#ffb55a,#ffe0a0 70%,#fff8e6)}
.arc em{position:absolute;top:-4px;bottom:-4px;width:2px;background:rgba(216,178,106,.7)}
.arc u{position:absolute;top:50%;width:calc(var(--u)*2);height:calc(var(--u)*2);min-width:16px;min-height:16px;margin-top:calc(var(--u)*-1);transform:translateX(-50%);border-radius:50%;background:radial-gradient(#fff3b0,#ffab3a 55%,transparent 72%)}
.arcl{display:flex;justify-content:space-between;font-size:max(11px,calc(var(--u)*1.15));color:var(--muted)}
.chips{display:grid;grid-template-columns:repeat(3,1fr);gap:calc(var(--u)*1)}
.chip{background:rgba(12,9,8,.55);border:1.5px solid rgba(141,108,52,.55);border-radius:calc(var(--u)*1.1);padding:calc(var(--u)*.8) calc(var(--u)*1);display:flex;flex-direction:column;gap:calc(var(--u)*.4)}
.chip .num{font-size:calc(var(--u)*2.8)}
.bank .chip .num{font-size:calc(var(--u)*3.2)}
.chip .sub{font-size:max(11px,calc(var(--u)*1.15));color:var(--muted)}
.coin{display:inline-block;width:.8em;height:.8em;border-radius:50%;background:radial-gradient(circle at 35% 30%,#fff0b0,#d8b26a 60%,#8d6c34);vertical-align:-.05em;margin-right:.18em;box-shadow:0 0 0 1.5px var(--ink)}
.shard{display:inline-block;width:.7em;height:.85em;background:linear-gradient(135deg,#e9ddff,#9d86ff);clip-path:polygon(50% 0,100% 40%,70% 100%,30% 100%,0 40%);vertical-align:-.08em;margin-right:.2em}
.pack{display:flex;flex-direction:column;gap:calc(var(--u)*.55)}
.wr{display:grid;grid-template-columns:calc(var(--u)*2.2) minmax(0,15em) 1fr auto;gap:calc(var(--u)*.9);align-items:center;font-size:calc(var(--u)*1.45)}
.wr .ic{width:calc(var(--u)*2.2);height:calc(var(--u)*2.2);border-radius:50%;border:1.5px solid var(--brass);background:#241d17;display:grid;place-items:center;font-size:calc(var(--u)*1.2)}
.wr .nm{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.wr .bar{height:calc(var(--u)*.9);min-height:7px;border-radius:99px;background:#0c0908;overflow:hidden}
.wr .bar i{display:block;height:100%;border-radius:99px;background:linear-gradient(90deg,#8d6c34,#ffe0a0)}
.wr .pc{color:var(--muted);font-variant-numeric:tabular-nums;min-width:2.6em;text-align:right}
.evo{color:var(--gold);font-weight:700} @media (max-width:900px){.evn{display:none}}
.nudge{display:flex;flex-direction:column;gap:calc(var(--u)*.5);font-size:calc(var(--u)*1.5)}
.nudge .arc{height:calc(var(--u)*.9);min-height:7px}
.new{color:var(--teal);font-weight:700;letter-spacing:.08em;font-size:.85em}
.acts{position:relative;display:flex;gap:calc(var(--u)*1.4);align-items:stretch;justify-content:center}
.btn{white-space:nowrap;font:700 calc(var(--u)*2)/1 "Segoe UI",system-ui,sans-serif;min-height:max(48px,calc(var(--u)*5.6));padding:0 calc(var(--u)*3);border-radius:calc(var(--u)*1.4);border:2px solid var(--brass);color:var(--cream);background:linear-gradient(#3a3029,#1d1713);display:flex;align-items:center;justify-content:center;gap:.6em}
.btn kbd{font:600 .62em "Segoe UI",sans-serif;padding:.25em .5em;border-radius:.4em;border:1px solid rgba(216,178,106,.7);color:var(--muted)}
.btn.main{flex:1.6;max-width:calc(var(--u)*34);background:linear-gradient(#ffcf7a,#e8903a 60%,#b9621d);color:#2a1604;border-color:#fff0b0;box-shadow:0 0 0 3px rgba(255,211,107,.35),0 0 30px rgba(255,171,58,.5)}
.btn.main kbd{border-color:rgba(42,22,4,.6);color:#4a2a0a}
.btn.sec{flex:1;max-width:calc(var(--u)*20)}
.btn .dot{width:.55em;height:.55em;border-radius:50%;background:var(--teal);box-shadow:0 0 8px var(--teal)}
@media (max-height:450px){
 .res{gap:8px;padding-top:max(8px,env(safe-area-inset-top));padding-bottom:max(8px,env(safe-area-inset-bottom));--u:min(1vw,2.5vh)}
 .body{grid-template-columns:minmax(0,.62fr) minmax(0,1.38fr);gap:14px}
 .lamp{width:calc(var(--u)*9);height:calc(var(--u)*13)}
 h1{font-size:calc(var(--u)*3.6)} .line{font-size:calc(var(--u)*1.7)}
 .card{padding:9px 12px;gap:8px} .big{font-size:calc(var(--u)*4.4)}
 .chip{padding:5px 8px;gap:2px} .chip .num{font-size:calc(var(--u)*2.7)} .bank .chip .num{font-size:calc(var(--u)*2.9)}
 .near{font-size:calc(var(--u)*1.55)} .wr{font-size:calc(var(--u)*1.5)}
 .wr:nth-child(n+3){display:none}
 .nudge{font-size:calc(var(--u)*1.5)} .chip .sub{font-size:max(11px,calc(var(--u)*1.4))}
 .acts{gap:10px} .btn{font-size:calc(var(--u)*2);min-height:46px;padding:0 16px}
 .arcl{display:none}
}
@media (orientation:portrait){
 .res{--u:min(2.4vw,1.06vh);gap:12px}
 .body{grid-template-columns:1fr;align-content:center;gap:calc(var(--u)*1.4)}
 .hero{display:grid;grid-template-columns:auto 1fr;column-gap:calc(var(--u)*1.6);row-gap:calc(var(--u)*.4);text-align:left;align-items:center}
 .lamp{grid-row:1/5;width:calc(var(--u)*9);height:calc(var(--u)*13)}
 h1{font-size:calc(var(--u)*3.8)} .line{font-size:calc(var(--u)*2)} .kicker{font-size:max(11px,calc(var(--u)*1.5))} .bark{font-size:calc(var(--u)*1.9)}
 .card{padding:calc(var(--u)*1.4);gap:calc(var(--u)*1.1)}
 .big{font-size:calc(var(--u)*5)} .near{font-size:calc(var(--u)*1.9)} .lab{font-size:max(11px,calc(var(--u)*1.4))}
 .chip{padding:calc(var(--u)*.6) calc(var(--u)*.9)} .chip .num{font-size:calc(var(--u)*3.2)} .bank .chip .num{font-size:calc(var(--u)*3.5)} .chip .sub{font-size:max(11px,calc(var(--u)*1.4))}
 .wr{font-size:calc(var(--u)*1.8);grid-template-columns:calc(var(--u)*2.6) minmax(0,8em) 1fr auto}
 .wr .ic{width:calc(var(--u)*2.6);height:calc(var(--u)*2.6)}
 .nudge{font-size:calc(var(--u)*1.8)} .arcl{font-size:max(11px,calc(var(--u)*1.4))}
 .acts{flex-wrap:wrap;gap:10px} .btn{font-size:calc(var(--u)*2.4);min-height:54px;padding:0 8px;min-width:0}
 .btn kbd{display:none} .btn.main{flex:1 1 100%;max-width:none;order:-1} .btn.sec{flex:1 1 0;max-width:none} .wr:nth-child(n+3){display:none} .line{font-size:calc(var(--u)*1.9)}
}
`;

const LAMP = (out) => {
  const d = out === 'defeat';
  const s = d ? 0.42 : 1;
  return `<svg class="lamp" viewBox="0 0 120 170" aria-hidden="true">
<defs><radialGradient id="g${out}"><stop offset="0" stop-color="#ffb23a" stop-opacity="${d ? 0.6 : 0.95}"/><stop offset=".5" stop-color="#ffb23a" stop-opacity="${d ? 0.14 : 0.35}"/><stop offset="1" stop-color="#ffb23a" stop-opacity="0"/></radialGradient>
<linearGradient id="f${out}" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#e0601b"/><stop offset=".55" stop-color="#ffab3a"/><stop offset="1" stop-color="#fff0a0"/></linearGradient>
<linearGradient id="b${out}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f3d99a"/><stop offset=".5" stop-color="#c79a4c"/><stop offset="1" stop-color="#7a5a28"/></linearGradient></defs>
${d ? '' : '<g stroke="#ffe0a0" stroke-opacity=".5" stroke-width="3" stroke-linecap="round"><path d="M60 6V-8M28 20L18 8M92 20L102 8M8 52H-6M112 52H126"/></g>'}
<circle cx="60" cy="88" r="${d ? 52 : 66}" fill="url(#g${out})"/>
<path d="M60 14C48 14 42 22 42 30H78C78 22 72 14 60 14Z" fill="url(#b${out})" stroke="#4a3412" stroke-width="3"/>
<path d="M54 14C54 4 66 4 66 14" fill="none" stroke="#8d6c34" stroke-width="4" stroke-linecap="round"/>
<path d="M40 32H80L88 128H32Z" fill="#2b2118" fill-opacity=".55" stroke="#4a3412" stroke-width="3" stroke-linejoin="round"/>
<g transform="translate(60 118) scale(${s}) translate(-60 -118)"><path d="M60 52C74 70 84 82 84 98C84 114 74 124 60 124C46 124 36 114 36 98C36 82 50 74 60 52Z" fill="url(#f${out})" stroke="#8a3a10" stroke-width="3"/><ellipse cx="60" cy="104" rx="9" ry="14" fill="#fff6c8" opacity=".85"/></g>
<path d="M30 128H90L84 142H36Z" fill="url(#b${out})" stroke="#4a3412" stroke-width="3" stroke-linejoin="round"/>
<path d="M44 40L48 124" stroke="#fff" stroke-opacity=".14" stroke-width="4" stroke-linecap="round"/>
</svg>`;
};

const WORLD = (out) => `<svg class="world" viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
<defs><filter id="bl"><feGaussianBlur stdDeviation="9"/></filter></defs>
<g filter="url(#bl)" opacity=".55">
${[[160, 700, 150], [420, 760, 110], [980, 720, 170], [1320, 780, 120], [1500, 690, 140], [700, 800, 90]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${out === 'defeat' ? '#2c3238' : '#5a7a3c'}"/>`).join('')}
${out === 'victory' ? [[300, 740, 40], [900, 780, 36], [1200, 730, 44]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#e7a0b8"/>`).join('') : ''}
</g></svg>`;

const DATA = {
  defeat: { kicker: 'Night 1 · Cursed Forest · Wren', h1: 'The light dwindles', line: 'The night is long. The lantern still burns, a little. Rest, then walk again.',
    time: '7:42', near: '<b>7:18</b> short of dawn · best <b>11:20</b>', frac: 7.7 / 15, level: 9, kills: 412, evo: 'none', bossKilled: false, gold: 312, bankG: '1,840', sh: 2, bankS: 7, hero: '' },
  victory: { kicker: 'Night 1 · Cursed Forest · Wren', h1: 'Dawn', line: 'The sun is generous. Every grey thing wakes. The Treant sleeps at last.',
    time: '15:00', near: 'New best · <b>Elder Treant</b> slain', frac: 1, level: 17, kills: 1538, evo: '2', bossKilled: true, gold: 1120, bankG: '2,648', sh: 5, bankS: 10, hero: '“Still here. Still lit.” Wren' },
};
const PACK = [['Ghost Wolves', 'Pouncing Pack', 62, 'W'], ['Holy Orbit', null, 24, 'O'], ['Raven Flock', null, 14, 'R']];

const screen = (out) => {
  const D = DATA[out], v = out === 'victory';
  return `<main class="res" data-out="${out}">${WORLD(out)}
<div class="body">
 <section class="hero">${LAMP(out)}<div class="kicker">${D.kicker}</div><h1>${D.h1}</h1><p class="line">${D.line}</p>${D.hero ? `<p class="bark">${D.hero}</p>` : ''}</section>
 <section class="card" aria-label="Run summary">
  <div class="timeblk"><div class="trow"><span class="num big">${D.time}</span><span class="lab">${v ? 'Survived the night' : 'Time survived'}</span></div>
   <div class="near">${D.near}</div>
   <div class="arc" aria-label="Run progress toward dawn"><i style="width:${D.frac * 100}%"></i><em style="left:${(10 / 15) * 100}%"></em><u style="left:${D.frac * 100}%"></u></div>
   <div class="arcl"><span>Dusk</span><span>Elder Treant 10:00</span><span>Dawn 15:00</span></div></div>
  <div class="chips"><div class="chip"><span class="lab">Level</span><span class="num">${D.level}</span></div><div class="chip"><span class="lab">Slain</span><span class="num">${D.kills.toLocaleString('en')}</span></div><div class="chip"><span class="lab">Evolved</span><span class="num">${D.evo}</span></div></div>
  <div class="chips bank" style="grid-template-columns:1fr 1fr"><div class="chip"><span class="lab">Gold banked</span><span class="num"><span class="coin"></span>+${D.gold.toLocaleString('en')}</span><span class="sub">total ${D.bankG}</span></div><div class="chip"><span class="lab">Soul shards</span><span class="num"><span class="shard"></span>+${D.sh}</span><span class="sub">${D.bossKilled ? 'boss bonus included · ' : ''}total ${D.bankS}</span></div></div>
  <div class="pack" aria-label="Spirits this run">${PACK.map(([n, e, p, c]) => `<div class="wr"><span class="ic">${c}</span><span class="nm">${n}${e && v ? ` <span class="evo">✦<span class="evn"> ${e}</span></span>` : ''}</span><span class="bar"><i style="width:${p}%"></i></span><span class="pc">${p}%</span></div>`).join('')}</div>
  <div class="nudge"><span>${v ? '<span class="new">NEW</span> Hall of Dawns opened in the Tree' : 'Closest unlock: <b>Raven Flock</b> <span style="color:var(--muted)">· 120 crows slain</span>'}</span><div class="arc"><i style="width:${v ? 100 : 84}%"></i></div></div>
 </section>
</div>
<nav class="acts" aria-label="Next">
 <button class="btn sec"><span>Main menu</span><kbd>Esc</kbd></button>
 <button class="btn main">${v ? 'Play again' : 'Again'}<kbd>R</kbd></button>
 <button class="btn sec"><span>Tree</span>${v ? '' : '<span class="dot"></span>'}</button>
</nav>
</main>`;
};

const page = (out) => `<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>${CSS}</style>${screen(out)}
<script>
const q=(s)=>[...document.querySelectorAll(s)];
const R=(e)=>e.getBoundingClientRect();
const inV=(r)=>r.top>=-0.5&&r.bottom<=innerHeight+0.5&&r.left>=-0.5&&r.right<=innerWidth+0.5;
window.M={vw:innerWidth,vh:innerHeight,pageOverflowY:document.documentElement.scrollHeight-innerHeight,
 buttons:q('.btn').map(b=>{const r=R(b);return {w:Math.round(r.width),h:Math.round(r.height),inView:inV(r)}}),
 cardInView:inV(R(q('.card')[0])),noOverlap:R(q('.card')[0]).bottom<=R(q('.acts')[0]).top+0.5&&R(q('.hero')[0]).bottom<=R(q('.acts')[0]).top+0.5,heroInView:inV(R(q('.hero')[0])),
 minFontPx:Math.round(Math.min(...q('.res *').filter(e=>[...e.childNodes].some(n=>n.nodeType==3&&n.textContent.trim())&&getComputedStyle(e).display!='none').map(e=>parseFloat(getComputedStyle(e).fontSize)))*10)/10};
</script>`;

async function chrome() {
  const C = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find(existsSync);
  const dir = mkdtempSync(join(tmpdir(), 'hl-res-'));
  const port = 9800 + Math.floor(Math.random() * 300);
  const proc = spawn(C, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${dir}`, '--no-first-run', '--allow-file-access-from-files', 'about:blank'], { stdio: 'ignore' });
  for (let i = 0; i < 120; i++) { try { if ((await fetch(`http://127.0.0.1:${port}/json/version`)).ok) break; } catch {} await sleep(250); }
  const tabs = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
  const ws = new WebSocket(tabs.find((t) => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener('open', r));
  let id = 0; const pend = new Map();
  ws.addEventListener('message', (m) => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); } });
  const send = (method, params = {}) => new Promise((res) => { const i = ++id; pend.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
  await send('Page.enable');
  return { send, close() { ws.close(); proc.kill(); } };
}

const SIZES = [['desktop-1280x720', 1280, 720, 1], ['phone-landscape-844x390', 844, 390, 2], ['phone-portrait-390x844', 390, 844, 2]];
const c = await chrome();
mkdirSync(join(HERE, 'tmp'), { recursive: true });
const report = [];
for (const out of ['defeat', 'victory']) for (const [name, w, h, dpr] of SIZES) {
  const f = join(HERE, 'tmp', `${out}-${name}.html`);
  writeFileSync(f, page(out));
  await c.send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: dpr, mobile: false });
  await c.send('Page.navigate', { url: pathToFileURL(f).href });
  await sleep(1200);
  const ev = await c.send('Runtime.evaluate', { expression: 'JSON.stringify(window.M)', returnByValue: true });
  const shot = await c.send('Page.captureScreenshot', { format: 'png' });
  writeFileSync(join(HERE, `results-${out}-${name}.png`), Buffer.from(shot.result.data, 'base64'));
  report.push(`${out} ${name}: ${ev.result.result.value}`);
}
c.close();
writeFileSync(join(HERE, 'measured.txt'), report.join('\n') + '\n');
console.log(report.join('\n'));
