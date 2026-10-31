// CHARACTER SYSTEM v2 UI screens (CH4-CH6): node scripts/ch-ui-shots.mjs <outDir> [baseUrl]. Was: smoke + screenshots (CH1-CH3): node scripts/ch-smoke.mjs <outDir> [baseUrl]   (needs `npm run build && npx vite preview --port 4193`)
// Own headless Chrome on port 9393 with its own temp profile (deleted at the end). Checks: Pelt Dash + Sanctuary Ring fire in a real page with
// no console errors (shots at 1280x720, 844x390@2x, 390x844@2x); a fresh profile gets the interim starter set (Wren + Ghost Wolves) and only Wren
// is offered; a pre-v2 save keeps both heroes and both launch hearts; the starting weapon of a run is the remembered loadout.
import { spawn } from 'node:child_process';
import { writeFileSync, mkdtempSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const out = process.argv[2] || 'docs/screenshots/characters'; const base = process.argv[3] || 'http://localhost:4193';
const CHROME = [process.env.CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find((p) => p && existsSync(p));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const PORT = 9394;
const dir = mkdtempSync(join(tmpdir(), 'hl-chui-'));
const proc = spawn(CHROME, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${dir}`, '--no-first-run', '--disable-extensions', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', 'about:blank'], { stdio: 'ignore' });
let fails = 0; const fail = (m) => { fails++; console.log('FAIL', m); };
try {
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
    await send('Page.enable'); await send('Runtime.enable');
    await send('Page.navigate', { url });
    for (let i = 0; i < 80; i++) { await sleep(250); try { if (await ev('!!(window.__app && window.__app.ui)')) break; } catch { /* loading */ } }
    await sleep(800);
  };
  const shot = async (name) => { mkdirSync(out, { recursive: true }); const r = await send('Page.captureScreenshot', { format: 'png' }); writeFileSync(join(out, name + '.png'), Buffer.from(r.data, 'base64')); console.log('  shot', name); };
  const VIEWS = [['1280x720', 1280, 720, 1, false], ['844x390', 844, 390, 2, true], ['390x844', 390, 844, 2, true]];
  // per screen: no page scroll, taps >= 44 px, text >= 12 px, nothing off-screen (same rule as the front door checks)
  // (.ch-detail is a scroll region: its inside may sit below the fold; the page itself must not scroll)
  const MEASURE = `(()=>{const l=document.querySelector('.layer-hero:not([style*="none"])')||document.querySelector('.layer-nights')||document.body;
   const vis=(e)=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return r.width>0&&r.height>0&&s.visibility!=='hidden'&&s.display!=='none'&&!e.closest('[hidden]')};
   const taps=[...l.querySelectorAll('button,[role=radio]')].filter(vis).map(e=>{const r=e.getBoundingClientRect();return [(e.getAttribute('aria-label')||e.textContent||'').trim().slice(0,16),Math.round(r.width),Math.round(r.height)]});
   let minF=99,small=[];const tw=document.createTreeWalker(l,NodeFilter.SHOW_TEXT);let n;while(n=tw.nextNode()){if(!n.textContent.trim())continue;const p=n.parentElement;if(!vis(p)||p.closest('.u3-sr'))continue;const f=parseFloat(getComputedStyle(p).fontSize);if(f<minF)minF=f;if(f<12)small.push(p.className+':'+f)}
   const vw=innerWidth,vh=innerHeight;const off=[...l.querySelectorAll('*')].filter(vis).filter(e=>!(e.closest('svg')&&e.tagName!=='svg')).filter(e=>!e.closest('.ch-detail')).filter(e=>{const r=e.getBoundingClientRect();return r.right>vw+1||r.left<-1||r.bottom>vh+1||r.top<-1}).map(e=>String(e.className.baseVal??e.className)).slice(0,4);
   return JSON.stringify({scroll:document.documentElement.scrollHeight>vh+1||document.documentElement.scrollWidth>vw+1||l.scrollHeight>l.clientHeight+1,small:taps.filter(t=>t[1]<44||t[2]<44),minF,smallText:small.slice(0,3),off})})()`;
  const check = async (tag) => { await sleep(500); const m = JSON.parse(await ev(MEASURE)); console.log(' ', tag, JSON.stringify(m));
    if (m.scroll) fail(tag + ' scrolls'); if (m.small.length) fail(tag + ' small taps ' + JSON.stringify(m.small)); if (m.minF < 12) fail(tag + ' text ' + m.minF + ' ' + m.smallText); if (m.off.length) fail(tag + ' off-screen ' + m.off); };
  const label = () => ev(`(()=>{const b=document.querySelector('.layer-hero .lg-btn--primary .lg-btn__label');return b?b.textContent:''})()`);
  for (const [n, w, h, d, m] of VIEWS) {
    console.log(n);
    const url = `${base}/${m ? '?touch=1' : ''}`;
    await open(url, w, h, d, m); await ev('localStorage.clear()'); await open(url, w, h, d, m);
    // 1. a new profile: starter pick, hero then spirit (all offered), then straight into the run
    await ev('__app.ui.beginLoadout()'); await sleep(300);
    if (!(await ev("!!document.querySelector('.layer-hero.ld-starter')"))) fail('starter hero screen did not open');
    await shot(`ld-starter-hero-${n}`); await check('starter hero');
    await ev("__app.ui.screen.hero.choose(1,true)");
    await ev("__app.ui.screen.hero.start.click()"); await sleep(300);
    const nsp = await ev("document.querySelectorAll('.ld-spirit').length"); const nopen = await ev("document.querySelectorAll('.ld-spirit:not(.is-sleeping)').length");
    if (nsp !== 5 || nopen !== 5) fail(`starter spirits ${nopen}/${nsp}`);
    if ((await label()) !== 'Choose a spirit to start' || !(await ev("document.querySelector('.layer-hero .lg-btn--primary').disabled"))) fail('starter spirit should start with nothing chosen: ' + (await label()));
    if (await ev("!!document.querySelector('.ld-spirit.is-chosen') || /kindred/i.test(document.querySelector('.layer-hero').textContent)")) fail('starter spirit preselected / kindred text');
    await shot(`ld-starter-spirit-${n}`); await check('starter spirit');
    await ev("document.querySelector('.ld-spirit[aria-label=\"Chain Lightning\"]').click()");
    const lab = await label(); if (lab !== 'Begin with Elias · Chain Lightning') fail('starter label ' + lab);
    await ev("__app.ui.screen.hero.start.click()"); await sleep(600);
    const run = JSON.parse(await ev(`JSON.stringify({h:__app.sim&&__app.sim.characterId,w:__app.sim&&__app.sim.weapons.map(x=>x.id),st:__app.save.data.notes.starter,tree:Object.keys(__app.save.data.tree)})`));
    if (run.h !== 'elias' || run.w.join() !== 'chain_lightning' || !run.tree.includes('gt_chain_lightning')) fail('starter run ' + JSON.stringify(run));
    // 2. the loadout on that profile: character (only Elias awake) -> spirit (only Chain awake)
    await open(url, w, h, d, m);
    await ev('__app.ui.beginLoadout()'); await sleep(300);
    if ((await ev("document.querySelectorAll('.layer-hero .u3-hero').length")) !== 1) fail('character step should offer only the awake hero');
    if ((await label()) !== 'Next') fail('character step label');
    await shot(`ld-hero-${n}`); await check('character');
    await ev("__app.ui.screen.hero.start.click()"); await sleep(300);
    const sp = JSON.parse(await ev("JSON.stringify([...document.querySelectorAll('.ld-spirit')].map(e=>e.classList.contains('is-sleeping')?0:1))"));
    if (sp.join('') !== '00010') fail('spirit step open set ' + sp.join(''));
    if ((await label()) !== 'Walk with Elias · Chain Lightning') fail('spirit label ' + (await label()));
    await shot(`ld-spirit-${n}`); await check('spirit');
    // 2b. no hero weapon: with both heroes awake, a hero with no remembered loadout gets NO preselected spirit and no weapon on its card
    await ev(`(()=>{const d=__app.save.data;d.chars={wren:{xp:0,keep:0,woke:true},elias:{xp:0,keep:0,woke:true}};d.notes.loadout={hero:'wren',weapon:'chain_lightning'};d.tree.gt_ghost_wolves=1;return 1})()`);
    await ev('__app.ui.beginLoadout()'); await sleep(300);
    if (/Ghost Wolves|Holy Orbit|Chain Lightning|kindred/i.test(await ev("document.querySelector('.layer-hero').textContent"))) fail('hero tile names a weapon');
    await shot(`ld-hero-two-${n}`); await check('character two');
    await ev("__app.ui.screen.hero.choose(1,true)"); await ev("__app.ui.screen.hero.start.click()"); await sleep(300);
    await shot(`ld-spirit-nopick-${n}`); await check('spirit nopick');
    if ((await label()) !== 'Choose a spirit to start') fail('hero without memory should preselect nothing: ' + (await label()));
    await ev("document.querySelector('.ld-spirit:not(.is-sleeping)').click()");
    if (!/^Walk with .* · /.test(await label())) fail('tap picks a spirit: ' + (await label()));
    // 3. the map step comes first once a night choice exists (Deep Dusk opened in-page, as fd45), and its button reads Next
    await ev(`(()=>{const d=__app.save.data;d.stats.runs=14;d.stats.wins=2;d.stats.tiers={cursed_forest:{normal:{runs:12,clears:2,best:{t:900,kills:1500,level:19},stars:3,heroes:{elias:{clears:2,first:false}}}}};__app.openTiers=()=>['cursed_forest:hard'];return 1})()`);
    await ev('__app.ui.beginLoadout()'); await sleep(400);
    if (!(await ev("(()=>{const l=document.querySelector('.layer-nights');return !!l&&l.style.display!=='none'})()"))) fail('map step first');
    const ml = await ev("document.querySelector('.fdm-begin .lg-btn__label').textContent"); if (ml !== 'Next') fail('map label ' + ml);
    await ev("document.querySelector('.fdm-begin').click()"); await sleep(300);
    if (!(await ev("!!document.querySelector('.layer-hero.ld-step-hero')"))) fail('map -> character');
    await ev("__app.ui.screen.hero.back.click()"); await sleep(300);
    if (!(await ev("(()=>{const l=document.querySelector('.layer-nights');return !!l&&l.style.display!=='none'})()"))) fail('character Back -> map');
    // 4. Characters page (CH5): an awake hero with Bond 7 and a sleeping one with 2 keepsakes; title shows the Characters button (C)
    await open(url, w, h, d, m); await ev('localStorage.clear()'); await open(url, w, h, d, m);
    await ev(`(()=>{const A=__app;const d=A.save.data;d.notes.starter={hero:'wren',weapon:'ghost_wolves'};d.tree.gt_ghost_wolves=1;d.chars={wren:{xp:2000,keep:0,woke:true},elias:{xp:0,keep:2,woke:false}};d.stats.runs=9;d.stats.killsByEnemy={root_crawler:520,wolf:900};A.save.saveNow(true);return 1})()`);
    await open(url, w, h, d, m);
    await ev('__app.showMenu ? __app.showMenu() : __app.ui.showStart(__app.ui.onPick)'); await sleep(400);
    if (!(await ev("!!document.querySelector('.layer-start .ch-btn')"))) fail('title has no Characters button');
    await shot(`ch-title-${n}`);
    await ev("document.querySelector('.layer-start .ch-btn').click()"); await sleep(400);
    if (!(await ev("!!document.querySelector('.ch-page')"))) fail('characters page did not open');
    await shot(`ch-page-${n}`); await check('characters');
    await ev("__app.ui.screen.hero.choose(1,true)"); await sleep(200);
    const kt = await ev("document.querySelector('.ch-detail').textContent");
    if (!/Candle Stub 2\/5/.test(kt) || /Elias/.test(kt)) fail('sleeping page ' + kt.slice(0, 80));
    await shot(`ch-page-sleeping-${n}`); await check('characters sleeping');
    // 5. results Bond beat (CH6): a staged run banked through the real bankRun: Bond 4 -> 5 (a gift) + Elias's fifth keepsake (he wakes)
    await ev(`(()=>{const d=__app.save.data;d.chars={wren:{xp:1050,keep:0,woke:true},elias:{xp:0,keep:4,woke:false}};return 1})()`);
    const R2 = JSON.stringify({ outcome: 'victory', time: 900, clock: 900, level: 30, kills: 2000, gold: 900, shards: 5, bossKilled: true, bossId: 'elder_treant', chapter: 'cursed_forest', character: 'wren', startWeapon: 'ghost_wolves', keepsake: 'elias', chests: 2, weapons: [{ id: 'ghost_wolves', evo: null, ranks: {}, damage: 9000, kills: 1500 }] });
    await ev(`(()=>{const A=__app;A.banked=false;const r=${R2};const sim={result:()=>r,state:r.outcome};const b=A.bankRun(sim);window.__bb=b;A.ui.hideAll();A.ui.showEnd(sim,b);return 1})()`);
    await sleep(1300);
    const bb = JSON.parse(await ev("JSON.stringify({bond:__bb.bond,cards:(__bb.cel&&__bb.cel.cards||[]).map(c=>[c.size,c.title])})"));
    console.log('  beat', JSON.stringify(bb));
    if (!bb.cards.some((c) => c[1] === 'Elias wakes') || !bb.cards.some((c) => c[1] === 'Bond 5 with Wren')) fail('bond beat cards ' + JSON.stringify(bb.cards));
    await shot(`ch-beat-wake-${n}`);
    await ev("document.dispatchEvent(new KeyboardEvent('keydown',{key:' '}));window.dispatchEvent(new KeyboardEvent('keydown',{key:' '}))"); await sleep(1600);
    await shot(`ch-beat-bond-${n}`);
  }
  if (errors.length) fail('console errors: ' + errors.slice(0, 5).join(' | '));
} finally {
  try { proc.kill(); } catch { /* gone */ }
  await sleep(800);
  try { rmSync(dir, { recursive: true, force: true }); } catch { /* locked */ }
}
console.log(fails ? `${fails} FAIL` : 'ch-ui ok');
process.exit(fails ? 1 : 0);
