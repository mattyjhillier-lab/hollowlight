// FD4/FD5 check: node scripts/fd45-shots.mjs <outDir> [baseUrl]  (needs `npm run build && npx vite preview --port 4192`). Own Chrome on port 9392,
// own temp profile (deleted at the end). The Night Gate lanterns are inert on the live tree, so this page-only check opens Deep Dusk by
// overriding app.openTiers in the page (never in the build). Map screen (Deep Dusk NEW, Long Night locked, Twilight) and results (Deep Dusk
// first dawn, Deep Dusk death, Twilight win) at 1280x720, 844x390@2x, 390x844@2x; per screen: no scroll, taps >= 44, text >= 12, nothing off-screen.
// Flow: hero 'Next' -> map -> Enter starts a REAL Deep Dusk run (not a debug run) -> bankRun records Deep Dusk; T -> tree -> Back returns to the map.
import { spawn } from 'node:child_process';
import { writeFileSync, mkdtempSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const out = process.argv[2] || 'docs/screenshots/front-door'; const base = process.argv[3] || 'http://localhost:4192';
const CHROME = [process.env.CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find((p) => p && existsSync(p));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const PORT = 9392;
const dir = mkdtempSync(join(tmpdir(), 'hl-fd45-'));
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

// One lantern: Twilight cleared twice (2 stars), Wren most played; Deep Dusk opened by an in-page override (the Night Gate is inert in the build).
const SEED = `(()=>{const A=__app;const d=A.save.data;d.gold=2410;d.shards=6;d.dawnglass=4;d.stats.runs=14;d.stats.wins=2;d.stats.charsUsed={wren:10,elias:4};
 d.stats.tiers={cursed_forest:{normal:{runs:12,clears:2,best:{t:900,kills:1500,level:19},stars:3,heroes:{wren:{clears:2,first:false},elias:{clears:0,first:false}}}}};A.save.saveNow(true);return 1})()`;
const OPEN = `(()=>{__app.openTiers=()=>['cursed_forest:hard'];return 1})()`;
const R = (o) => JSON.stringify({ outcome: 'victory', time: 900, clock: 900, level: 19, kills: 1904, gold: 1120, shards: 5, bossKilled: true, bossId: 'elder_treant', chapter: 'cursed_forest', character: 'wren', weapons: [{ id: 'ghost_wolves', evo: 'phantom_stampede', ranks: {}, damage: 12000, kills: 900 }, { id: 'holy_orbit', evo: null, ranks: {}, damage: 4000, kills: 300 }, { id: 'raven_flock', evo: null, ranks: {}, damage: 2000, kills: 100 }], ...o });
// bank a staged result through the REAL app.bankRun (tier = the run's tier), then show the real results screen
const END = (tier, o) => `(()=>{const A=__app;A.runTier='${tier}';A.banked=false;const r=Object.assign(${R({})},${JSON.stringify(o)},{tier:'${tier}'});const sim={result:()=>r,state:r.outcome};const b=A.bankRun(sim);A.ui.hideAll();A.ui.showEnd(sim,b);return new Promise((res)=>setTimeout(()=>res(JSON.stringify({tier:b.tier,night:b.night})),1300))})()`;
const VIEWS = [['1280x720', 1280, 720, 1, false], ['844x390', 844, 390, 2, true], ['390x844', 390, 844, 2, true]];
for (const [n, w, h, d, m] of VIEWS) {
  console.log(n);
  const url = `${base}/${m ? '?touch=1' : ''}`;
  await open(url, w, h, d, m);
  await ev('localStorage.clear()'); await open(url, w, h, d, m);
  if (await ev("(()=>{__app.ui.showHeroSelect();return document.querySelector('.layer-hero .lg-btn--primary .lg-btn__label').textContent})()") !== 'Walk with Wren') fail('fresh hero button');
  await ev(SEED); await open(url, w, h, d, m); await ev(OPEN);
  await ev("__app.showMenu()"); await sleep(200);
  const wh = await ev("document.querySelector('.u3-title .lg-btn__whisper').textContent");
  if (wh !== 'Wren · Deep Dusk is waiting') fail('continue whisper ' + wh);
  await ev("document.querySelector('.u3-title .lg-btn--primary').click()"); await sleep(250);
  const lab = await ev("document.querySelector('.layer-hero .lg-btn--primary .lg-btn__label').textContent");
  if (lab !== 'Next') fail('hero button ' + lab);
  await ev("document.querySelector('.layer-hero .lg-btn--primary').click()"); await sleep(300);
  if (!(await vis('nights'))) fail('map screen did not open');
  await shot(`fd4-map-${n}`); await check('map deep dusk', '.layer-nights', '.fdm-screen');
  const a11y = await ev("JSON.stringify([...document.querySelectorAll('.fdm-tier')].map(e=>[e.getAttribute('aria-checked'),e.getAttribute('tabindex'),e.getAttribute('aria-disabled')]))");
  if (a11y !== '[["false","-1",null],["true","0",null],["false","-1","true"]]') fail('chip a11y ' + a11y);
  await key('3', 'Digit3', 51); await sleep(200);
  await shot(`fd4-map-locked-${n}`); await check('map locked', '.layer-nights', '.fdm-screen');
  if (!(await ev("document.querySelector('.fdm-begin').disabled"))) fail('begin enabled on a locked night');
  await key('1', 'Digit1', 49); await sleep(200);
  if (n === '1280x720') { await shot(`fd4-map-twilight-${n}`); await check('map twilight', '.layer-nights', '.fdm-screen'); }
  // tree jump and back to the map
  await key('t', 'KeyT', 84); await sleep(500);
  if (!(await vis('tree'))) fail('T did not open the tree');
  await ev("__app.ui.tree.close()"); await sleep(300);
  if (!(await vis('nights'))) fail('tree Back did not return to the map');
  await key('2', 'Digit2', 50); await sleep(150);
  await key('Enter', 'Enter', 13); await sleep(600);
  const run = await ev("JSON.stringify([__app.sim&&__app.sim.tier.id,__app.runTier,__app.isDebugRun(),__app.save.data.notes.night])");
  console.log('  run', run);
  if (!run.startsWith('["hard","hard",false,{"map":"cursed_forest","tier":"hard","seen":["normal","hard"]}')) fail('run start ' + run);
  await ev('__app.showMenu()'); await sleep(200);
  // results (real bankRun: Deep Dusk first dawn win, then a Deep Dusk death, then a Twilight win)
  const b1 = await ev(END('hard', {})); console.log('  bank', b1);
  if (!b1.includes('"firstDawn":true') || !b1.includes('"glass":6')) fail('first dawn not banked ' + b1);
  await shot(`fd5-results-win-hard-${n}`); await check('results win hard', '.layer-end', '.u6-wrap');
  await ev(END('hard', { outcome: 'defeat', time: 702, clock: 702, bossKilled: false, gold: 750 }));
  await shot(`fd5-results-death-hard-${n}`); await check('results death hard', '.layer-end', '.u6-wrap');
  await ev(END('normal', { gold: 900 }));
  await shot(`fd5-results-win-twilight-${n}`); await check('results win twilight', '.layer-end', '.u6-wrap');
  const ag = await ev("document.querySelector('.u6-btn--again .lg-btn__label').textContent");
  if (ag !== 'Again · Twilight') fail('again label ' + ag);
  if (errors.length) fail('console ' + errors.splice(0).join(';'));
}
try { ws.close(); proc.kill(); } catch { /* ignore */ }
await sleep(800);
try { rmSync(dir, { recursive: true, force: true }); } catch { /* best effort */ }
console.log(fails ? `${fails} FAIL` : 'ALL OK');
process.exit(fails ? 1 : 0);
