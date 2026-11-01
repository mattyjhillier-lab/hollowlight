// U2 check: node scripts/u2-shots.mjs <outDir> <tag> [baseUrl]  (needs `npm run build && npx vite preview --port 4173`).
// 1) HUD A computed-style hash (must equal the before hash). 2) If tag=after: the ?kit=1 page at 3 sizes: screenshots, tap targets >= 44 px,
// text >= 11 px, no horizontal scroll, fonts loaded, no external requests, keyboard focus order + ring, tooltip on focus/Esc, console errors.
// Spawns its own Chrome and kills only that PID.
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, mkdtempSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const CHROME = [process.env.CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find((p) => p && existsSync(p));
const PORT = 9362;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const dir = mkdtempSync(join(tmpdir(), 'hl-u2-'));
const proc = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${dir}`, '--no-first-run', '--disable-extensions', 'about:blank'], { stdio: 'ignore' });
for (let i = 0; i < 60; i++) { try { if ((await fetch(`http://127.0.0.1:${PORT}/json/version`)).ok) break; } catch { /* retry */ } await sleep(250); }
const tabs = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
const ws = new WebSocket(tabs.find((t) => t.type === 'page').webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r));
let id = 0; const pending = new Map(); const errors = [];
ws.addEventListener('message', (m) => {
  const d = JSON.parse(m.data);
  if (d.id && pending.has(d.id)) { const p = pending.get(d.id); pending.delete(d.id); d.error ? p.rej(new Error(d.error.message)) : p.res(d.result); }
  else if (d.method === 'Runtime.exceptionThrown') errors.push(d.params.exceptionDetails.text + ' ' + (d.params.exceptionDetails.exception?.description || ''));
  else if (d.method === 'Runtime.consoleAPICalled' && d.params.type === 'error') errors.push('console.error ' + d.params.args.map((a) => a.value ?? a.description).join(' '));
});
const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pending.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (expr) => { const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + ' ' + (r.exceptionDetails.exception?.description || '')); return r.result.value; };
const [out, tag = 'after', base = 'http://localhost:4173'] = process.argv.slice(2);
mkdirSync(out, { recursive: true });
const VIEWS = [['desktop', 1280, 720, 1, false], ['phone-land', 844, 390, 2, true], ['phone-port', 390, 844, 2, true]];
const open = async (w, h, dpr, mobile, query) => {
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: dpr, mobile });
  await send('Emulation.setTouchEmulationEnabled', mobile ? { enabled: true, maxTouchPoints: 5 } : { enabled: false });
  await send('Page.enable'); await send('Runtime.enable');
  await send('Page.navigate', { url: base + '/' + query });
};
const shot = async (name) => { const r = await send('Page.captureScreenshot', { format: 'png' }); writeFileSync(join(out, name + '.png'), Buffer.from(r.data, 'base64')); console.log('  shot', name); };
const key = async (k, code, vk) => { await send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: k, code, windowsVirtualKeyCode: vk }); await send('Input.dispatchKeyEvent', { type: 'keyUp', key: k, code, windowsVirtualKeyCode: vk }); };
const STYLES = `(()=>{const o=[];for(const e of document.querySelectorAll('#ui, #ui *')){const c=getComputedStyle(e);o.push([e.tagName,e.className&&e.className.baseVal===undefined?e.className:'',c.fontFamily,c.fontSize,c.fontWeight,c.letterSpacing,c.color,c.lineHeight].join('|'));}return o.join(String.fromCharCode(10))})()`;
const MEASURE = `(async()=>{await document.fonts.ready;
  const page=document.getElementById('kitpage'); if(!page) return {ok:false};
  const vis=(e)=>{const r=e.getBoundingClientRect();const c=getComputedStyle(e);return r.width>0&&r.height>0&&c.visibility!=='hidden'&&c.display!=='none'};
  const taps=[...page.querySelectorAll('button,[role=switch],[role=tab],input')].filter(vis).map(e=>{const r=e.getBoundingClientRect();return [e.className.split(' ')[0],Math.round(r.width),Math.round(r.height)]});
  const small=taps.filter(t=>t[2]<44||t[1]<44);
  let minFont=99;const tw=document.createTreeWalker(page,NodeFilter.SHOW_TEXT);let n;while(n=tw.nextNode()){if(!n.textContent.trim())continue;const p=n.parentElement;if(!vis(p))continue;const f=parseFloat(getComputedStyle(p).fontSize);if(f<minFont)minFont=f}
  const ext=performance.getEntriesByType('resource').map(r=>r.name).filter(u=>!u.startsWith(location.origin)&&!u.startsWith('data:'));
  return {ok:true,fonts:[...document.fonts].map(x=>x.family+' '+x.status),taps:taps.length,small,minFont,hscroll:document.documentElement.scrollWidth>innerWidth+1,ext,full:page.scrollHeight}})()`;
const ORDER = `[...document.getElementById('kitpage').querySelectorAll('button:not([disabled]),input:not([disabled]),[tabindex="0"]')].filter(e=>e.getAttribute('tabindex')!=='-1').map(e=>(e.className.split(' ')[0]||e.tagName)+':'+(e.textContent||e.type).trim().slice(0,12))`;
const ACTIVE = `(()=>{const e=document.activeElement;const cs=getComputedStyle(e);return (e.className.split(' ')[0]||e.tagName)+':'+(e.textContent||e.type).trim().slice(0,12)+'|ring='+((cs.outlineStyle!=='none'&&parseFloat(cs.outlineWidth)>0)||e.type==='range')})()`;
const TIP = `(async()=>{const b=document.querySelector('.lg-tipwrap > button');b.focus();await new Promise(r=>setTimeout(r,250));const t=document.querySelector('.lg-tipwrap > .lg-tip');const open=!t.hidden;const desc=b.getAttribute('aria-describedby')===t.id;const tr=t.getBoundingClientRect(),br=b.getBoundingClientRect();const overlap=!(tr.bottom<=br.top||tr.top>=br.bottom);const inView=tr.left>=0&&tr.right<=innerWidth;return {open,desc,overlap,inView}})()`;
let fails = 0;
const fail = (m) => { fails++; console.log('FAIL', m); };
for (const [name, w, h, dpr, mobile] of VIEWS) {
  await open(w, h, dpr, mobile, `?auto=wren&seed=1&t=300&god=1&debug=1${mobile ? '&touch=1' : ''}`);
  for (let i = 0; i < 80; i++) { await sleep(250); try { if (await ev('!!(window.__app && window.__app.sim && window.__app.ui && window.__app.ui.hudView)')) break; } catch { /* loading */ } }
  await sleep(1200);
  const styles = await ev(STYLES);
  const hash = createHash('sha256').update(styles).digest('hex').slice(0, 16);
  writeFileSync(join(out, `${tag}-${name}-styles.txt`), styles);
  console.log(`HUD ${name} ${w}x${h} elements=${styles.split('\n').length} style-hash=${hash}`);
}
if (tag === 'after') {
  for (const [name, w, h, dpr, mobile] of VIEWS) {
    errors.length = 0;
    await open(w, h, dpr, mobile, '?kit=1');
    await sleep(1800);
    const m = await ev(MEASURE);
    console.log(`kit ${name}`, JSON.stringify({ ...m, fonts: undefined }));
    if (!m.ok) { fail('kit page missing ' + name); continue; }
    if (m.fonts.some((x) => !x.endsWith('loaded'))) fail('fonts not loaded ' + m.fonts.join(','));
    if (m.small.length) fail(`tap targets < 44px: ${JSON.stringify(m.small)}`);
    if (m.minFont < 12) fail('text under 12px ' + m.minFont);
    if (m.hscroll) fail('horizontal scroll');
    if (m.ext.length) fail('external requests ' + m.ext);
    await ev("document.activeElement && document.activeElement.blur(); document.getElementById('kitpage').scrollTop = 0");
    const order = await ev(ORDER);
    const seen = [];
    for (let i = 0; i < order.length; i++) { await key('Tab', 'Tab', 9); seen.push(await ev(ACTIVE)); }
    const names = seen.map((s) => s.split('|')[0]);
    const same = names.length === order.length && names.every((n, i) => n === order[i]);
    if (!same) fail(`focus order differs from DOM order (${name}): ${JSON.stringify({ order, names })}`);
    const noRing = seen.filter((s) => s.endsWith('ring=false'));
    if (noRing.length) fail('focus stops without outline: ' + noRing.join(';'));
    console.log(`  focus order ok=${same} stops=${seen.length} noRing=${noRing.length}`);
    const tip = await ev(TIP);
    await key('Escape', 'Escape', 27);
    const closed = await ev("document.querySelector('.lg-tipwrap > .lg-tip').hidden");
    console.log('  tooltip', JSON.stringify({ ...tip, closedByEsc: closed }));
    if (!tip.open || !tip.desc || tip.overlap || !tip.inView || !closed) fail('tooltip behaviour ' + JSON.stringify(tip));
    await ev("document.activeElement.blur(); document.getElementById('kitpage').scrollTop = 0");
    await shot(`kit-${name}`);
    if (m.full > h) { await send('Emulation.setDeviceMetricsOverride', { width: w, height: Math.min(m.full + 80, 4000), deviceScaleFactor: dpr, mobile }); await sleep(500); await shot(`kit-${name}-full`); }
    if (errors.length) fail('console errors: ' + errors.join(' | '));
  }
}
ws.close(); proc.kill();
process.exit(fails ? 1 : 0);
