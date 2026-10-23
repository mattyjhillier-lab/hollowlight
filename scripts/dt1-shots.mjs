// DT1 Night Gate end-to-end check: node scripts/dt1-shots.mjs <outDir> [baseUrl]  (needs `npm run build && npx vite preview --port 4196`).
// Own Chrome on port 9396, own temp profile (deleted at the end). NO overrides: a save with one Twilight clear buys the REAL Deep Dusk gate in
// the tree UI (Light it, confirm), then hero 'Next' -> 'Choose your night' -> Deep Dusk run (sim tier hard, enemy HP x1.1, a real banked run)
// -> results (real bankRun: badge, Dawnglass boss 2 + dawn 2 + first dawn 6). Per screen: no scroll, taps >= 44, text >= 12, nothing off-screen.
// Run one size per process (VIEW=1280x720 | 844x390 | 390x844): back-to-back sizes in one Chrome can stall on the next navigation after a live run.
import { spawn } from 'node:child_process';
import { writeFileSync, mkdtempSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const out = process.argv[2] || 'docs/screenshots/front-door'; const base = process.argv[3] || 'http://localhost:4196';
const CHROME = [process.env.CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find((p) => p && existsSync(p));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const PORT = 9396;
const dir = mkdtempSync(join(tmpdir(), 'hl-dt1-'));
const proc = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${dir}`, '--no-first-run', '--disable-extensions', 'about:blank'], { stdio: 'ignore' });
for (let i = 0; i < 60; i++) { try { if ((await fetch(`http://127.0.0.1:${PORT}/json/version`)).ok) break; } catch { /* retry */ } await sleep(250); }
const tabs = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json();
const ws = new WebSocket(tabs.find((t) => t.type === 'page').webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r));
let id = 0; const pending = new Map(); const errors = [];
ws.addEventListener('message', (m) => {
  const d = JSON.parse(m.data);
  if (d.id && pending.has(d.id)) { const p = pending.get(d.id); pending.delete(d.id); d.error ? p.rej(new Error(d.error.message)) : p.res(d.result); }
  else if (d.method === 'Page.javascriptDialogOpening') ws.send(JSON.stringify({ id: ++id, method: 'Page.handleJavaScriptDialog', params: { accept: true } })); // a 'Leave site?' prompt mid-run never blocks the next view
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
  await ev('document.fonts.ready.then(()=>1)'); await sleep(600);
};
const shot = async (name) => { mkdirSync(out, { recursive: true }); const r = await send('Page.captureScreenshot', { format: 'png' }); writeFileSync(join(out, name + '.png'), Buffer.from(r.data, 'base64')); console.log('  shot', name); };
const key = async (k, code, vk) => { await send('Input.dispatchKeyEvent', { type: 'rawKeyDown', key: k, code, windowsVirtualKeyCode: vk }); await send('Input.dispatchKeyEvent', { type: 'keyUp', key: k, code, windowsVirtualKeyCode: vk }); };
let fails = 0; const fail = (m) => { fails++; console.log('FAIL', m); };
const MEASURE = (sel, scroller) => `(async()=>{await document.fonts.ready;await new Promise(r=>setTimeout(r,1100));const l=document.querySelector('${sel}');const W=l.querySelector('${scroller}')||l;
 const vis=(e)=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return r.width>0&&r.height>0&&s.visibility!=='hidden'&&s.display!=='none'&&!e.closest('[hidden]')};
 const taps=[...l.querySelectorAll('button,[role=radio]')].filter(vis).map(e=>{const r=e.getBoundingClientRect();return [(e.getAttribute('aria-label')||e.textContent||'').trim().slice(0,16),Math.round(r.width),Math.round(r.height)]});
 let minF=99,small=[];const tw=document.createTreeWalker(l,NodeFilter.SHOW_TEXT);let n;while(n=tw.nextNode()){if(!n.textContent.trim())continue;const p=n.parentElement;if(!vis(p)||p.closest('.u3-sr,.u6-sr'))continue;const f=parseFloat(getComputedStyle(p).fontSize);if(f<minF)minF=f;if(f<12)small.push(p.className+':'+f)}
 const vw=innerWidth,vh=innerHeight;const off=[...l.querySelectorAll('*')].filter(vis).filter(e=>!(e.closest('svg')&&e.tagName!=='svg')).filter(e=>{const r=e.getBoundingClientRect();return r.right>vw+1||r.left<-1||r.bottom>vh+1||r.top<-1}).map(e=>String(e.className.baseVal??e.className)).slice(0,4);
 const clipped=[...l.querySelectorAll('.fdm-side,.fdm-map,.u6-panel,.u6-main')].filter(vis).filter(e=>e.scrollHeight>e.clientHeight+1).map(e=>e.className.split(' ')[0]);
 return {scroll:W.scrollHeight>W.clientHeight+1||W.scrollWidth>W.clientWidth+1||document.documentElement.scrollWidth>vw+1,small:taps.filter(t=>t[1]<44||t[2]<44),minF,smallText:small.slice(0,3),off,clipped,dropped:(l.querySelector('.u6-wrap')||{getAttribute:()=>null}).getAttribute('data-dropped')}})()`;
const check = async (tag, sel, scroller) => { const m = await ev(MEASURE(sel, scroller)); console.log(' ', tag, JSON.stringify(m));
  if (m.scroll) fail(tag + ' scrolls'); if (m.small.length) fail(tag + ' small taps ' + JSON.stringify(m.small)); if (m.minF < 12) fail(tag + ' text ' + m.minF + ' ' + m.smallText); if (m.off.length) fail(tag + ' off-screen ' + m.off); if (m.clipped.length) fail(tag + ' clipped ' + m.clipped); };
const vis = (n) => ev(`(()=>{const l=document.querySelector('.layer-${n}');return !!l&&l.style.display!=='none'})()`);

const SEED = `(()=>{const A=__app;const d=A.save.data;d.gold=1500;d.shards=3;d.stats.runs=4;d.stats.wins=1;d.stats.charsUsed={wren:3,elias:1};
 d.stats.chapters={cursed_forest:{runs:4,clears:1,bestTime:900}};
 d.stats.tiers={cursed_forest:{normal:{runs:4,clears:1,best:{t:900,kills:1500,level:19},stars:1,heroes:{wren:{clears:1,first:false}}}}};A.save.saveNow(true);return 1})()`;
const R = (o) => JSON.stringify({ outcome: 'victory', time: 900, clock: 900, level: 19, kills: 1904, gold: 1120, shards: 5, bossKilled: true, bossId: 'elder_treant', chapter: 'cursed_forest', character: 'wren', weapons: [{ id: 'ghost_wolves', evo: 'phantom_stampede', ranks: {}, damage: 12000, kills: 900 }, { id: 'holy_orbit', evo: null, ranks: {}, damage: 4000, kills: 300 }], ...o });
const END = (tier, o) => `(()=>{const A=__app;A.runTier='${tier}';A.banked=false;const r=Object.assign(${R({})},${JSON.stringify(o)},{tier:'${tier}'});const sim={result:()=>r,state:r.outcome};const b=A.bankRun(sim);A.ui.hideAll();A.ui.showEnd(sim,b);return new Promise((res)=>setTimeout(()=>res(JSON.stringify({tier:b.tier,night:b.night,glass:A.save.data.dawnglass})),1300))})()`;
const VIEWS = [['1280x720', 1280, 720, 1, false], ['844x390', 844, 390, 2, true], ['390x844', 390, 844, 2, true]];
for (const [n, w, h, d, m] of VIEWS.filter((v) => !process.env.VIEW || v[0] === process.env.VIEW)) { // VIEW=844x390 runs one size
  console.log(n);
  const url = `${base}/${m ? '?touch=1' : ''}`;
  await open(url, w, h, d, m);
  await ev('localStorage.clear()'); await open(url, w, h, d, m);
  await ev(SEED); await open(url, w, h, d, m);
  // no night is open yet, but the gate is ready (condition met): the skip rule shows the map with the gate chip
  if (await ev("JSON.stringify(__app.openTiers(__app.save.data))") !== '[]') fail('a night was open before buying');
  await ev("__app.openTree('gt_cursed_forest_hard')"); await sleep(900);
  if (!(await vis('tree'))) fail('tree did not open');
  await shot(`dt1-tree-gate-${n}`);
  await ev("document.querySelector('.ts-primary').click()"); await sleep(200);
  if (await ev("document.querySelector('.ts-primary').classList.contains('confirm')")) { await ev("document.querySelector('.ts-primary').click()"); await sleep(400); }
  const bought = await ev("JSON.stringify([__app.save.data.tree.gt_cursed_forest_hard||0,__app.save.data.gold,__app.save.data.shards,__app.openTiers(__app.save.data)])");
  console.log('  bought', bought);
  if (bought !== '[1,300,1,["cursed_forest:hard"]]') fail('gate buy ' + bought);
  await shot(`dt1-tree-owned-${n}`);
  await ev("__app.ui.tree.close()"); await sleep(300);
  await ev("__app.showMenu()"); await sleep(200);
  await ev("document.querySelector('.u3-title .lg-btn--primary').click()"); await sleep(250);
  const lab = await ev("document.querySelector('.layer-hero .lg-btn--primary .lg-btn__label').textContent");
  if (lab !== 'Next') fail('hero button ' + lab);
  await ev("document.querySelector('.layer-hero .lg-btn--primary').click()"); await sleep(300);
  if (!(await vis('nights'))) fail('map screen did not open');
  await key('2', 'Digit2', 50); await sleep(200);
  await shot(`dt1-map-deepdusk-${n}`); await check('map deep dusk', '.layer-nights', '.fdm-screen');
  await key('Enter', 'Enter', 13); await sleep(800);
  const run = await ev("JSON.stringify([__app.sim&&__app.sim.tier.id,__app.sim&&__app.sim.tier.enemyHp,__app.sim&&__app.sim.tier.bossHp,__app.isDebugRun()])");
  console.log('  run', run);
  if (run !== '["hard",1.1,1.5,false]') fail('run start ' + run);
  await ev('__app.showMenu()'); await sleep(200); // leave the live run (its HUD) before staging the result
  const b1 = await ev(END('hard', {})); console.log('  bank', b1);
  if (!b1.includes('"tier":"hard"') || !b1.includes('"glassRun":4') || !b1.includes('"glassFirst":6') || !b1.includes('"glass":10')) fail('bank ' + b1);
  await shot(`dt1-results-deepdusk-${n}`); await check('results deep dusk', '.layer-end', '.u6-wrap');
  const txt = await ev("document.querySelector('.layer-end').textContent");
  for (const s of ['Deep Dusk', '4 + 6 first dawn']) if (!txt.includes(s)) fail('results text missing ' + s);
  // slice 2: Fourth Card + Fifth Hook owned, a Deep Dusk run (debug URL, never banks): 5 weapon tiles in the HUD, 4 normal cards per offer
  await ev(`(()=>{const d=__app.save.data;Object.assign(d.tree,{br_cardfan:1,cd_peek:1,cd_fourth:1,br_hearthkey:1,rs_bless:1,rs_slot5:1});__app.save.saveNow(true);return 1})()`);
  await open(`${base}/?auto=wren&seed=1&god=1&tier=hard&t=240&grant=${encodeURIComponent('raven_flock;spirit_bolts;holy_orbit;chain_lightning')}${m ? '&touch=1' : ''}`, w, h, d, m);
  let lu = false;
  for (let i = 0; i < 400 && !lu; i++) {
    await sleep(250); lu = await ev("!!(__app.sim && __app.sim.state === 'levelup' && document.querySelector('.layer-levelup .card'))");
    if (lu && await ev('!!__app.sim.offer.start')) { await sleep(400); await key('1', 'Digit1', 49); lu = false; } // Lantern Blessing start offer: take it, wait for a real level-up
  }
  if (!lu) fail('no level-up offer');
  await sleep(900);
  const hs = await ev("JSON.stringify([__app.sim.offerSize,__app.sim.weaponSlots,__app.sim.weapons.length,document.querySelectorAll('.h-tile').length,document.querySelectorAll('.h-tile:not(.empty)').length,__app.sim.offer.cards.length])");
  console.log('  hooks', hs);
  const [os, ws5, , tiles, , nc] = JSON.parse(hs);
  if (os !== 4 || ws5 !== 5 || tiles !== 5 || nc !== 4) fail('fourth card / fifth hook ' + hs);
  await shot(`dt1-fourth-card-${n}`);
  const lay = await ev(`(()=>{const vw=innerWidth,vh=innerHeight;const out=[...document.querySelectorAll('.layer-levelup .card,.h-tile')].filter(e=>{const r=e.getBoundingClientRect();return r.width&&(r.right>vw+1||r.left<-1||r.bottom>vh+1||r.top<-1)}).length;const small=[...document.querySelectorAll('.layer-levelup .card')].filter(e=>{const r=e.getBoundingClientRect();return r.width<44||r.height<44}).length;return JSON.stringify({out,small})})()`);
  console.log('  layout', lay); if (lay !== '{"out":0,"small":0}') fail('offer/HUD layout ' + lay);
  await ev("(()=>{const s=__app.sim;s.state='playing';__app.ui.hideAll&&0;document.querySelector('.layer-levelup').style.display='none';return 1})()"); await sleep(400);
  await shot(`dt1-fifth-hook-hud-${n}`);
  await ev('__app.showMenu()'); await sleep(200); // end the debug run before the next view navigates
  if (errors.length) fail('console ' + errors.splice(0).join(';'));
}
try { ws.close(); proc.kill(); } catch { /* ignore */ }
await sleep(800);
try { rmSync(dir, { recursive: true, force: true }); } catch { /* best effort */ }
console.log(fails ? `${fails} FAIL` : 'ALL OK');
process.exit(fails ? 1 : 0);
