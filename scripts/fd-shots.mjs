// FD2/FD3 check: node scripts/fd-shots.mjs <outDir> [baseUrl]  (needs `npm run build && npx vite preview --port 4191`). Own Chrome on port 9391,
// own temp profile (deleted at the end). Title (fresh + returning) and "Whose lantern?" (pick, menu, rename, delete confirm, new, replace) at
// 1280x720, 844x390@2x, 390x844@2x; per screen: no scroll, taps >= 44, text >= 12, no overflow; keyboard walk; delete/undo/rename/switch flow.
import { spawn } from 'node:child_process';
import { writeFileSync, mkdtempSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const out = process.argv[2] || 'docs/screenshots/front-door'; const base = process.argv[3] || 'http://localhost:4191';
const CHROME = [process.env.CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find((p) => p && existsSync(p));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const PORT = 9391;
const dir = mkdtempSync(join(tmpdir(), 'hl-fd-'));
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
const open = async (url, w, h, dpr, mobile) => {
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: dpr, mobile });
  await send('Emulation.setTouchEmulationEnabled', mobile ? { enabled: true, maxTouchPoints: 5 } : { enabled: false });
  await send('Page.enable'); await send('Runtime.enable');
  await send('Page.navigate', { url });
  for (let i = 0; i < 80; i++) { await sleep(250); try { if (await ev('!!(window.__app && window.__app.ui && window.__app.ui.screen)')) break; } catch { /* loading */ } }
  await ev('document.fonts.ready.then(()=>1)'); await sleep(700);
};
const shot = async (name) => { mkdirSync(out, { recursive: true }); const r = await send('Page.captureScreenshot', { format: 'png' }); writeFileSync(join(out, name + '.png'), Buffer.from(r.data, 'base64')); console.log('  shot', name); };
const key = async (k, code, vk, type = 'both') => { if (type !== 'up') await send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: k, code, windowsVirtualKeyCode: vk }); if (type !== 'down') await send('Input.dispatchKeyEvent', { type: 'keyUp', key: k, code, windowsVirtualKeyCode: vk }); };
const typeText = async (t) => { for (const ch of t) await send('Input.insertText', { text: ch }); };
let fails = 0; const fail = (m) => { fails++; console.log('FAIL', m); };
const MEASURE = `(async()=>{await document.fonts.ready;const l=[...document.querySelectorAll('.overlay.u3')].find(e=>e.style.display!=='none');const W=l.querySelector('.u3-wrap');
 const vis=(e)=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return r.width>0&&r.height>0&&s.visibility!=='hidden'&&s.display!=='none'};
 const taps=[...l.querySelectorAll('button,input')].filter(vis).map(e=>{const r=e.getBoundingClientRect();return [(e.getAttribute('aria-label')||e.textContent||e.className).trim().slice(0,16),Math.round(r.width),Math.round(r.height)]});
 let minF=99;const tw=document.createTreeWalker(l,NodeFilter.SHOW_TEXT);let n;while(n=tw.nextNode()){if(!n.textContent.trim())continue;const p=n.parentElement;if(!vis(p)||p.closest('.u3-sr'))continue;minF=Math.min(minF,parseFloat(getComputedStyle(p).fontSize))}
 const vw=innerWidth,vh=innerHeight;const off=[...l.querySelectorAll('*')].filter(vis).filter(e=>{const r=e.getBoundingClientRect();return r.right>vw+1||r.left<-1||r.bottom>vh+1}).map(e=>e.className.baseVal??e.className).slice(0,4);
 return {scroll:W.scrollHeight>W.clientHeight+1||W.scrollWidth>W.clientWidth+1,small:taps.filter(t=>t[1]<44||t[2]<44),minF,off}})()`;
const check = async (tag) => { const m = await ev(MEASURE); console.log(' ', tag, JSON.stringify(m));
  if (m.scroll) fail(tag + ' scrolls'); if (m.small.length) fail(tag + ' small taps ' + JSON.stringify(m.small)); if (m.minF < 12) fail(tag + ' text ' + m.minF); if (m.off.length) fail(tag + ' off-screen ' + m.off); };
const active = () => ev("(()=>{const e=document.activeElement;return (e.tagName)+':'+((e.getAttribute('aria-label')||e.textContent||'').trim().slice(0,22))})()");
const layer = (n) => ev(`(()=>{const l=document.querySelector('.layer-${n}');return !!l&&l.style.display!=='none'})()`);

// Two lanterns with progress (Matt: Wren, Deep Dusk played; Sam: Elias), written through the real store, then reload.
const SEED = `(()=>{const A=__app,L=A.lanterns;L.rename('l1','Matt');const d=A.save.data;d.gold=2410;d.shards=6;d.dawnglass=4;d.stats.runs=14;d.stats.wins=3;d.stats.charsUsed={wren:10,elias:4};
 d.stats.tiers={cursed_forest:{normal:{runs:12,clears:3,best:{t:840,kills:900,level:30},stars:3,heroes:{}},hard:{runs:2,clears:0,best:{t:400,kills:300,level:18},stars:0,heroes:{}}}};A.save.saveNow(true);
 const c=L.create('Sam');const s=L.open(c.id);s.load();s.data.gold=380;s.data.stats.runs=3;s.data.stats.charsUsed={elias:3};s.data.updatedAt=Date.now()-2*864e5;s.saveNow(true);return L.list().length})()`;
const VIEWS = [['1280x720', 1280, 720, 1, false], ['844x390', 844, 390, 2, true], ['390x844', 390, 844, 2, true]];
for (const [n, w, h, d, m] of VIEWS) {
  console.log(n);
  const url = `${base}/${m ? '?touch=1' : ''}`;
  await open(url, w, h, d, m);
  await ev('localStorage.clear()'); await open(url, w, h, d, m);
  await shot(`fd2-title-fresh-${n}`); await check('title fresh');
  const fresh = await ev("JSON.stringify([document.querySelector('.fd-chip__name').textContent, !!document.querySelector('.fd-newgame'), !!document.querySelector('.fd-coin--glass'), document.querySelector('.u3-title .lg-btn__label').textContent])");
  if (fresh !== '["Lantern 1",false,false,"Begin"]') fail('fresh title ' + fresh);
  await ev(SEED); await open(url, w, h, d, m);
  if (!(await layer('lanterns'))) fail('2 lanterns: boot did not ask whose lantern');
  await shot(`fd3-lanterns-${n}`); await check('lanterns');
  await ev("document.querySelector('.fd-card.is-current .fd-light').click()"); await sleep(300);
  await shot(`fd2-title-${n}`); await check('title returning');
  const t = await ev("JSON.stringify([document.querySelector('.fd-chip__name').textContent, document.querySelector('.u3-title .lg-btn__whisper').textContent, !!document.querySelector('.fd-dot'), document.querySelectorAll('.fd-pill').length, document.querySelector('.fd-newgame .lg-btn__whisper').textContent])");
  console.log('  title', t);
  if (!t.includes('"Matt"') || !t.includes('Wren · Twilight is waiting') || !t.includes(',3,') || !t.includes('1 of 3 free')) fail('title content ' + t);
  // menu, rename, delete confirm, new
  await ev("document.querySelector('.fd-chip').click()"); await sleep(250);
  await ev("document.querySelectorAll('.fd-more')[1].click()"); await sleep(200);
  await shot(`fd3-menu-${n}`); await check('menu');
  await ev("[...document.querySelectorAll('.fd-menu .lg-btn')].find(b=>b.textContent.includes('Delete')).click()"); await sleep(200);
  await shot(`fd3-delete-${n}`); await check('delete confirm');
  await ev("[...document.querySelectorAll('.fd-panel .lg-btn')].find(b=>b.textContent.includes('Cancel')).click()"); await sleep(150);
  await ev("document.querySelector('.fd-new').click()"); await sleep(200);
  await shot(`fd3-new-${n}`); await check('new form');
  if (errors.length) fail('console ' + errors.splice(0).join(';'));
}

// ---- flows (desktop): keyboard, rename (Phaser must not eat letters), hold-to-delete + undo, switch, replace mode
console.log('flows');
await open(`${base}/`, 1280, 720, 1, false);
console.log(' focus on boot', await active());
await key('ArrowRight', 'ArrowRight', 39); console.log(' after Right', await active());
await key('Escape', 'Escape', 27); await sleep(200);
if (!(await layer('start'))) fail('Esc did not go back to the title');
const order = [await active()]; for (let i = 0; i < 8; i++) { await key('Tab', 'Tab', 9); order.push(await active()); }
console.log(' title tab order', order.join(' > '));
if (!/Continue/.test(order[0]) || !/Skill/.test(order[1]) || !/Setti/.test(order[2]) || !/New game/.test(order[3]) || !order.slice(4).some((x) => /Switch lantern/.test(x))) fail('title tab order');
await ev('document.activeElement.blur()'); await key('n', 'KeyN', 78); await sleep(250);
if (!(await ev("document.activeElement.classList.contains('fd-input')"))) fail('N did not open the new-lantern name field');
await key('Escape', 'Escape', 27); await sleep(150);
// rename Sam -> "Sam Wise" by typing (letters W, A, S, D, space must reach the field)
await ev("document.querySelectorAll('.fd-more')[1].click()"); await sleep(150);
await ev("[...document.querySelectorAll('.fd-menu .lg-btn')].find(b=>b.textContent.includes('Rename')).click()"); await sleep(150);
await ev("document.activeElement.value=''");
await typeText('Sad Wasd'); await key('Enter', 'Enter', 13); await sleep(250);
const names = await ev("JSON.stringify(__app.lanterns.list().map(x=>x.name))");
console.log(' after rename', names); if (!names.includes('Sad Wasd')) fail('rename by typing ' + names);
// hostile name rejected, nothing written
await ev("document.querySelectorAll('.fd-more')[1].click()"); await sleep(150);
await ev("[...document.querySelectorAll('.fd-menu .lg-btn')].find(b=>b.textContent.includes('Rename')).click()"); await sleep(150);
await ev("document.activeElement.value='<img src=x onerror=alert(1)>'"); await key('Enter', 'Enter', 13); await sleep(200);
const err = await ev("document.querySelector('.fd-field__err').textContent"); console.log(' hostile name ->', err);
if (!/letters/.test(err) && !/at most/.test(err)) fail('hostile name not refused');
await shot('fd3-rename-error-1280x720');
await key('Escape', 'Escape', 27); await sleep(150);
// hold-to-delete: a short hold does nothing, a 1.6 s Enter hold deletes; Undo restores
await ev("document.querySelectorAll('.fd-more')[1].click()"); await sleep(150);
await ev("[...document.querySelectorAll('.fd-menu .lg-btn')].find(b=>b.textContent.includes('Delete')).click()"); await sleep(150);
await ev("document.querySelector('.fd-hold').focus()");
await key('Enter', 'Enter', 13, 'down'); await sleep(500); await key('Enter', 'Enter', 13, 'up'); await sleep(200);
if ((await ev('__app.lanterns.list().length')) !== 2) fail('short hold deleted');
await key('Enter', 'Enter', 13, 'down'); await sleep(800); await shot('fd3-holding-1280x720'); await sleep(900); await key('Enter', 'Enter', 13, 'up'); await sleep(300);
if ((await ev('__app.lanterns.list().length')) !== 1) fail('1.7 s hold did not delete');
await shot('fd3-deleted-undo-1280x720');
await ev("[...document.querySelectorAll('.fd-status .lg-btn')].find(b=>b.textContent.includes('Undo')).click()"); await sleep(250);
const afterUndo = await ev("JSON.stringify(__app.lanterns.list().map(x=>x.name))"); console.log(' after undo', afterUndo);
if (!afterUndo.includes('Sad Wasd')) fail('undo');
// switch to the other lantern: its own gold, settings carried over
await ev("__app.save.setSettings({reducedMotion:true})");
await ev("[...document.querySelectorAll('.fd-card')].find(c=>c.textContent.includes('Sad Wasd')).querySelector('.fd-light').click()"); await sleep(300);
const sw = await ev("JSON.stringify([__app.lanterns.active, __app.save.data.gold, __app.save.data.settings.reducedMotion, document.querySelector('.fd-chip__name').textContent])");
console.log(' switched', sw); if (!sw.includes('380') || !sw.includes('true') || !sw.includes('Sad Wasd')) fail('switch ' + sw);
// replace mode: three lanterns lit -> New game opens replace
await ev("__app.lanterns.create('Pip'); __app.showMenu()"); await sleep(250);
await ev("document.querySelector('.fd-newgame').click()"); await sleep(250);
await shot('fd3-replace-1280x720'); await check('replace');
await ev("document.querySelectorAll('.fd-light')[2].click()"); await sleep(200);
await shot('fd3-replace-confirm-1280x720');
// screen-reader path: two activations without a pointer
await ev("document.querySelector('.fd-hold').click()"); await sleep(100);
if ((await ev('__app.lanterns.list().length')) !== 3) fail('one AT click replaced');
await ev("document.querySelector('.fd-hold').click()"); await sleep(300);
const rep = await ev("JSON.stringify([__app.lanterns.list().map(x=>x.name), document.querySelector('.layer-hero').style.display])");
console.log(' replaced', rep); if (!rep.includes('Lantern 3') || rep.includes('Pip') || rep.includes('none')) fail('replace ' + rep);
// calm motion screenshot of the title (reduced motion set above)
await ev('__app.showMenu()'); await sleep(250);
if (errors.length) fail('console ' + errors.join(';'));
try { ws.close(); proc.kill(); } catch { /* ignore */ }
await sleep(800);
try { rmSync(dir, { recursive: true, force: true }); } catch (e) { console.log('temp profile not removed yet:', dir); }
console.log(fails ? `FAILS ${fails}` : 'ALL OK');
process.exit(fails ? 1 : 0);
