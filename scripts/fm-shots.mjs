// FM (first minute) capture, docs only: real build frames of the whisper plates, offer lines, results lessons and a first-run timing log.
// Own headless Chrome (9533) + own static server (4253) + a temp profile that is deleted at the end. Usage: node scripts/fm-shots.mjs <outDir> [only]
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdirSync, writeFileSync, mkdtempSync, existsSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, extname, resolve } from 'node:path';

const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find((p) => existsSync(p));
const PORT = 9533, HTTP = 4253;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json' };
const VIEWS = { desk: [1280, 720, 1], land: [844, 390, 2], port: [390, 844, 2] };
const out = process.argv[2]; mkdirSync(out, { recursive: true });
const ONLY = process.argv[3] || '';

function serve(dir) {
  const root = resolve(dir);
  const srv = createServer((req, res) => {
    let p = decodeURIComponent((req.url || '/').split('?')[0]); if (p === '/') p = '/index.html';
    const f = resolve(join(root, p));
    if (!f.startsWith(root) || !existsSync(f)) { res.writeHead(404); res.end(); return; }
    res.writeHead(200, { 'content-type': MIME[extname(f)] || 'application/octet-stream' }); res.end(readFileSync(f));
  });
  return new Promise((r) => srv.listen(HTTP, '127.0.0.1', () => r(srv)));
}
async function launch() {
  const dir = mkdtempSync(join(tmpdir(), 'hl-fm-'));
  const proc = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${dir}`, '--no-first-run', '--disable-extensions',
    '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows', 'about:blank'], { stdio: 'ignore' });
  for (let i = 0; i < 60; i++) { try { const r = await fetch(`http://127.0.0.1:${PORT}/json/version`); if (r.ok) break; } catch { /* retry */ } await sleep(250); }
  const tabs = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
  const ws = new WebSocket(tabs.find((t) => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener('open', r));
  let id = 0; const pending = new Map();
  ws.addEventListener('message', (m) => { const d = JSON.parse(m.data);
    if (d.method === 'Runtime.exceptionThrown') console.error('PAGE EXC', d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text);
    if (d.id && pending.has(d.id)) { const p = pending.get(d.id); pending.delete(d.id); d.error ? p.rej(new Error(d.error.message)) : p.res(d.result); } });
  const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pending.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async (expr) => { const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + ' ' + (r.exceptionDetails.exception?.description || '')); return r.result.value; };
  const close = async () => { try { ws.close(); } catch { /* */ } try { proc.kill(); } catch { /* */ } await sleep(1500); try { rmSync(dir, { recursive: true, force: true }); } catch { /* */ } };
  return { send, ev, close, dir };
}
async function open(c, query, w, h, dpr) {
  await c.send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: dpr, mobile: false });
  await c.send('Page.enable'); await c.send('Runtime.enable');
  await c.send('Page.navigate', { url: `http://127.0.0.1:${HTTP}/?${query}` });
  for (let i = 0; i < 80; i++) { await sleep(250); try { if (await c.ev('!!(window.__app && window.__app.sim && window.__app.scene && window.__app.scene.pools && window.__app.whispers)')) return; } catch { /* */ } }
  throw new Error('game did not start');
}
const shot = async (c, file) => { const r = await c.send('Page.captureScreenshot', { format: 'png' }); writeFileSync(file, Buffer.from(r.data, 'base64')); };
const W = (s) => `(()=>{const a=window.__app,s=a.sim,w=a.whispers;${s}})()`;

const srv = await serve(process.env.DIST || 'dist'); const c = await launch();
const log = {};
try {
  // 1) real first run (desk, keyboard, Wren, god so standing still is safe): when does each plate / level-up happen?
  if (!ONLY || ONLY === 'timing') {
    await open(c, 'auto=wren&tips=1&seed=1&god=1', 1280, 720, 1);
    const seen = []; let lvl = []; const t0 = Date.now();
    while (Date.now() - t0 < 32000) {
      const r = await c.ev(W("const p=w.cur;const st=s.state;if(st==='levelup'&&s.offer){const tc=a.ui.luTeach;const k=s.offer.cards[0].key;setTimeout(()=>a.pick(k),400);return {t:s.time,lv:s.level,teach:tc?tc.id:null}}return {t:s.time,plate:p?p.id:null}"));
      if (r.plate && !seen.find((x) => x.id === r.plate)) seen.push({ id: r.plate, t: +r.t.toFixed(1) });
      if (r.lv && !lvl.find((x) => x.lv === r.lv)) lvl.push({ lv: r.lv, t: +r.t.toFixed(1), teach: r.teach });
      if (r.plate === 'move' && seen.length === 1 && !log.moveShot) { log.moveShot = 1; await sleep(400); await shot(c, join(out, 'fm1-real-move-0m01-desk.png')); }
      await sleep(120);
    }
    log.timing = { plates: seen, levelUps: lvl };
    console.log('timing', JSON.stringify(log.timing));
  }
  // 2) the three ladder plates at true size, 3 views (phones on touch copy), plus Calm
  if (!ONLY || ONLY === 'plates') {
    for (const [vn, [w, h, dpr]] of Object.entries(VIEWS)) {
      const touch = vn !== 'desk';
      await open(c, `auto=wren&tips=1&seed=3&god=1${touch ? '&touch=1' : ''}`, w, h, dpr);
      await sleep(900);
      for (const [id, at] of [['move', '0m01'], ['gems', '0m05'], ['ability', '0m10']]) {
        await c.ev(W(`w.hide();w.pending.clear();a.wv.ready=true;w.open('${id}',a.wv,false);return 1`));
        await sleep(700);
        await shot(c, join(out, `fm1-${id}-${at}-${vn}.png`));
      }
      if (vn === 'desk') {
        await c.ev(W("a.save.setSettings({reducedMotion:true});a.applySettings();w.hide();w.open('lowhp',a.wv,false);s.player.hp=s.player.maxHp*0.25;return 1"));
        await sleep(700); await shot(c, join(out, 'fm2-lowhp-calm-desk.png'));
        await c.ev(W("a.save.setSettings({reducedMotion:false});a.applySettings();s.player.hp=s.player.maxHp;w.hide();a.ui.toast('Health restored',w.pickup('heart'));return 1"));
        await sleep(500); await shot(c, join(out, 'fm2-heart-toast-desk.png'));
      }
    }
  }
  // 3) offer lines: first offer (3 views), reroll (desk), evolution card kicker (desk)
  if (!ONLY || ONLY === 'offer') {
    for (const [vn, [w, h, dpr]] of Object.entries(VIEWS)) {
      await open(c, `auto=wren&tips=1&seed=5&god=1${vn !== 'desk' ? '&touch=1' : ''}`, w, h, dpr);
      await sleep(700);
      await c.ev(W("s.xp=s.xpNeeded+1;return 1"));
      for (let i = 0; i < 30 && !(await c.ev("window.__app.sim.state==='levelup'")); i++) await sleep(100);
      await sleep(500); await shot(c, join(out, `fm2-firstoffer-${vn}.png`));
    }
    await open(c, 'auto=wren&tips=1&seed=6&god=1&rr=2&ban=1&grant=ghost_wolves:speed=5,power=5', 1280, 720, 1);
    await sleep(700);
    await c.ev(W("w.bits|=(1<<9);s.xp=s.xpNeeded+1;return 1"));
    for (let i = 0; i < 30 && !(await c.ev("window.__app.sim.state==='levelup'")); i++) await sleep(100);
    await sleep(500); await shot(c, join(out, 'fm2-reroll-desk.png'));
    log.offer2 = await c.ev(W("return {teach:a.ui.luTeach&&a.ui.luTeach.id, cls:a.ui.offerView.clsList}"));
    // evolution kicker: same offer re-rendered as if the reroll line had already been seen
    await c.ev(W("a.ui.luTeach=undefined;w.bits|=(1<<8);const e=a.data.evolutions.phantom_stampede;const st=s.offer.cards.find((x)=>x.kind==='stat');if(st)st.stirs=true;s.offer.cards[s.offer.cards.length-1]={key:'e:phantom_stampede',kind:'evolution',weaponId:'ghost_wolves',evoId:'phantom_stampede',title:e.name,desc:e.desc,badge:'EVOLVE',from:'Ghost Wolves',color:'#ffd24a'};a.ui.showLevelUp(s);return 1"));
    await sleep(400); await shot(c, join(out, 'fm2-evolve-desk.png'));
    await c.ev(W("a.ui.luTeach=undefined;w.bits|=(1<<11);s.offer.cards.pop();a.ui.showLevelUp(s);return 1"));
    await sleep(400); await shot(c, join(out, 'fm2-stirs-desk.png'));
    log.offer3 = await c.ev(W("return {teach:a.ui.luTeach&&a.ui.luTeach.id, cls:a.ui.offerView.clsList}"));
    console.log('offers', JSON.stringify([log.offer2, log.offer3]));
  }
  // 4) results lessons (real bank path on the temp profile: first death, then a first win)
  if (!ONLY || ONLY === 'results') {
    for (const [vn, [w, h, dpr]] of Object.entries(VIEWS)) {
      await c.ev("try{localStorage.clear()}catch(e){};1").catch(() => {});
      await open(c, 'auto=wren&tips=1', w, h, dpr);
      await sleep(600);
      await c.ev(W("a.params.auto=null;s.gold=42;s.player.hp=0.01;s.state='defeat';return 1"));
      await sleep(1600); await shot(c, join(out, `fm3-firstdeath-${vn}.png`));
      if (vn === 'desk') {
        log.death = await c.ev("(()=>{const b=document.querySelector('.u6-nudge.is-learn');const t=document.querySelector('.u6-btn--tree');return {learn:b&&b.textContent,treePrimary:!!(t&&t.className.includes('primary')),focus:document.activeElement&&document.activeElement.textContent}})()");
        await c.ev("window.__app.again();1"); await sleep(800);
        await c.ev(W("a.params.auto=null;s.state='victory';s.bossKilled=false;return 1"));
        await sleep(1800); await shot(c, join(out, 'fm3-firstwin-desk.png'));
        log.win = await c.ev("(()=>{const b=document.querySelector('.u6-nudge.is-learn');return {learn:b&&b.textContent}})()");
      }
    }
    console.log('results', JSON.stringify([log.death, log.win]));
  }
  writeFileSync(join(out, 'fm-log.json'), JSON.stringify(log, null, 1));
} finally { await c.close(); srv.close(); }
