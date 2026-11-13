// Title cover check: node scripts/title-shots.mjs <outDir> [baseUrl] [prefix]  (needs `npx vite --port 5191` or a preview). Own Chrome on port 9395, own temp profile (deleted).
// Shots at 1280x720, 390x844@2x, 844x390@2x (+ Calm, Elias, first launch), plus per-frame cost, contrast probe and front-door keyboard checks.
import { spawn } from 'node:child_process';
import { writeFileSync, readFileSync, mkdtempSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const out = process.argv[2] || 'docs/screenshots/title-build'; const base = process.argv[3] || 'http://localhost:5193'; const pre = process.argv[4] || '';
const CHROME = [process.env.CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find((p) => p && existsSync(p));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const PORT = 49395; const dir = mkdtempSync(join(tmpdir(), 'wk-title-'));
const proc = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${dir}`, '--no-first-run', '--disable-extensions', 'about:blank'], { stdio: 'ignore' });
for (let i = 0; i < 60; i++) { try { if ((await fetch(`http://127.0.0.1:${PORT}/json/version`)).ok) break; } catch { /* retry */ } await sleep(250); }
const tabs = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
const ws = new WebSocket(tabs.find((t) => t.type === 'page').webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r));
let id = 0; const pending = new Map(); const errors = [];
ws.addEventListener('message', (m) => { const d = JSON.parse(m.data);
  if (d.id && pending.has(d.id)) { const p = pending.get(d.id); pending.delete(d.id); d.error ? p.rej(new Error(d.error.message)) : p.res(d.result); }
  else if (d.method === 'Runtime.exceptionThrown') errors.push(d.params.exceptionDetails.text + ' ' + (d.params.exceptionDetails.exception?.description || ''));
  else if (d.method === 'Runtime.consoleAPICalled' && d.params.type === 'error') errors.push('console.error ' + d.params.args.map((a) => a.value ?? a.description).join(' ')); });
const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pending.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (expr) => { const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + ' ' + (r.exceptionDetails.exception?.description || '')); return r.result.value; };
const open = async (url, w, h, dpr, mobile) => {
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: dpr, mobile });
  await send('Emulation.setTouchEmulationEnabled', mobile ? { enabled: true, maxTouchPoints: 5 } : { enabled: false });
  await send('Page.enable'); await send('Runtime.enable'); await send('Page.navigate', { url });
  for (let i = 0; i < 80; i++) { await sleep(250); try { if (await ev('!!(window.__app && window.__app.ui && window.__app.ui.screen)')) break; } catch { /* loading */ } }
  await ev('document.fonts.ready.then(()=>1)');
  if (process.env.CSS) { const css = readFileSync(process.env.CSS, 'utf8'); await ev(`(()=>{const e=document.createElement('style');e.id='try';e.textContent=${JSON.stringify(css)};document.head.appendChild(e);return 1})()`); }
  if (process.env.NOCARD) await ev("(()=>{const b=document.querySelector('.pwa-no');if(b)b.click();return 1})()");
  await sleep(900); };
const shot = async (name) => { mkdirSync(out, { recursive: true }); const r = await send('Page.captureScreenshot', { format: 'png' }); writeFileSync(join(out, pre + name + '.png'), Buffer.from(r.data, 'base64')); console.log('  shot', name); };
let fails = 0; const ok = (c, m) => { console.log(c ? 'PASS' : 'FAIL', m); if (!c) fails++; };
const seed = (o) => `(()=>{const A=__app,d=A.save.data;d.gold=1240;d.shards=6;d.stats.runs=14;d.stats.charsUsed={wren:10,elias:4};d.chars={wren:{xp:0,keep:0,woke:true},elias:{xp:0,keep:0,woke:true}};d.notes=d.notes||{};d.notes.loadout=${JSON.stringify(o.loadout)};${o.calm?'d.settings.reducedMotion=true;':''}${o.fresh?'d.stats.runs=0;d.gold=0;d.shards=0;d.chars={wren:{xp:0,keep:0,woke:true}};delete d.notes.loadout;':''}A.save.saveNow(true);return 1})()`;
const VIEWS = [['desktop-1280x720', 1280, 720, 1, false], ['phone-portrait-390x844', 390, 844, 2, true], ['phone-landscape-844x390', 844, 390, 2, true]];
const STATES = process.env.STATES ? process.env.STATES.split(',') : ['wren', 'elias', 'first', 'calm'];
const ST = { wren: { loadout: { hero: 'wren', weapon: 'ghost_wolves' } }, elias: { loadout: { hero: 'elias', weapon: 'holy_orbit' } }, first: { fresh: true, loadout: null }, calm: { loadout: { hero: 'wren', weapon: 'ghost_wolves' }, calm: true }, hostile: { loadout: { hero: '__proto__', weapon: 'x' } } };
const PROBE = `(()=>{const c=window.__cover; if(!c) return null; const out={}; const cv=c.cv, x=cv.getContext('2d'); const ar=cv.getBoundingClientRect(); const sx=cv.width/ar.width, sy=cv.height/ar.height;
 for (const [k,sel] of [['brand','.u3-brand'],['menu','.u3-menu'],['kicker','.u3-kicker'],['tagline','.u3-tagline'],['wordmark','.u3-h1']]) { const n=document.querySelector(sel); if(!n){continue;} const r=n.getBoundingClientRect(); const px=Math.max(0,Math.floor((r.left-ar.left)*sx)), py=Math.max(0,Math.floor((r.top-ar.top)*sy)), w=Math.min(cv.width-px,Math.floor(r.width*sx)), h=Math.min(cv.height-py,Math.floor(r.height*sy)); if(w<2||h<2) continue; const d=x.getImageData(px,py,w,h).data; out[k]=Array.from(d);} return out;})()`;
const MEASURE = `(()=>{const l=document.querySelector('.overlay.layer-start'); const W=l.querySelector('.u3-wrap'); const vis=(e)=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return r.width>0&&r.height>0&&s.visibility!=='hidden'&&s.display!=='none'};
 const taps=[...l.querySelectorAll('button')].filter(vis).map(e=>{const r=e.getBoundingClientRect();return [(e.getAttribute('aria-label')||e.textContent||'').trim().slice(0,14),Math.round(r.width),Math.round(r.height)]}).filter(t=>t[1]<44||t[2]<44);
 const off=[...l.querySelectorAll('.u3-col *, .fd-top *')].filter(vis).filter(e=>{const r=e.getBoundingClientRect();return r.right>innerWidth+1||r.left<-1||r.bottom>innerHeight+1}).map(e=>String(e.className.baseVal??e.className).slice(0,30)).slice(0,4);
 return {scroll:W.scrollHeight>W.clientHeight+1||W.scrollWidth>W.clientWidth+1,small:taps,off}})()`;
const lumC = (bytes) => { const ls = []; for (let i = 0; i + 2 < bytes.length; i += 16) ls.push(0.2126 * bytes[i] + 0.7152 * bytes[i + 1] + 0.0722 * bytes[i + 2]); ls.sort((a, b) => a - b); const hi = ls.slice(Math.floor(ls.length * 0.95)); const m = hi.reduce((a, b) => a + b, 0) / Math.max(1, hi.length); const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; const L = (r, g, b) => 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); const a = L(255, 243, 220), b = L(m, m, m); return +((Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)).toFixed(2); };
try {
  for (const st of STATES) for (const [n, w, h, d, m] of VIEWS) {
    if (st === 'hostile' && n !== VIEWS[0][0]) continue;
    console.log(st, n); const url = `${base}/${m ? '?touch=1' : ''}`;
    await open(url, w, h, d, m); await ev('localStorage.clear()'); await open(url, w, h, d, m);
    await ev(seed(ST[st])); await open(url, w, h, d, m);
    const has = await ev('!!document.querySelector(".tc-cv")');
    ok(has, 'cover mounted ' + st + ' ' + n); if (!has) { await shot(`${st}-${n}-nocover`); continue; }
    await sleep(1800); // bloom 1.45 s plays out on its own
    await ev('window.__cover.skip()'); await sleep(900);
    await shot(`${st}-${n}`);
    if (process.env.EVAL) console.log('  eval', JSON.stringify(await ev(process.env.EVAL)));
    const stt = await ev('JSON.stringify(window.__cover.stats())'); console.log('  cover', stt); const S = JSON.parse(stt);
    ok(S.hero === (st === 'elias' ? 'elias' : 'wren'), 'hero on cover ' + S.hero); ok(S.calm === (st === 'calm'), 'calm ' + S.calm);
    const mm = await ev(MEASURE); console.log('  layout', JSON.stringify(mm)); if (mm.small.length || mm.off.length) { console.log('  note: small taps / off-screen above'); }
    if (st === 'wren') { const pr = await ev(PROBE); for (const k of Object.keys(pr || {})) { const c = lumC(pr[k]); console.log('  contrast', k, c); ok(c >= 4.5, 'contrast ' + k + ' ' + n + ' ' + c); } }
  }
  // front door: Continue is never delayed (Enter during the bloom), the cover goes away with the screen
  console.log('front door'); await open(base + '/', 1280, 720, 1, false); await ev('localStorage.clear()'); await open(base + '/', 1280, 720, 1, false);
  await ev(seed(ST.wren)); await open(base + '/', 1280, 720, 1, false);
  ok(await ev('!!document.activeElement && (document.activeElement.textContent||"").includes("Continue")'), 'Continue has focus on load');
  await ev('(()=>{const c=window.__cover;c.skipped=false;c.bloomStart=performance.now();c.kick();return 1})()'); await sleep(200);
  const early = await ev('window.__cover.cv.isConnected && getComputedStyle(document.querySelector(".u3-col")).opacity');
  console.log('  menu opacity mid-bloom', early, await ev('document.activeElement.className+"|"+__app.ui.screen.id'));
  const t0 = Date.now(); await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, text: '\r' }); await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 }); await sleep(400);
  ok(await ev('!window.__cover || window.__cover.dead'), 'Enter during the bloom opens the next screen at once (' + (Date.now() - t0) + ' ms incl. wait), cover torn down');
  console.log('  after Enter', await ev('__app.ui.screen.id+"|"+[...document.querySelectorAll(".overlay")].filter(e=>e.style.display!=="none").map(e=>e.className).join(",")')); ok(!(await ev('!!document.querySelector(".tc-cv")')), 'no cover canvas left behind');
} catch (e) { console.log('ERR', e.message); fails++; }
console.log('ERRORS', errors.slice(0, 6)); console.log(fails ? 'FAILS ' + fails : 'ALL OK');
try { ws.close(); } catch { /* */ } proc.kill(); await sleep(400); try { rmSync(dir, { recursive: true, force: true }); } catch { /* */ }
process.exit(fails ? 1 : 0);
