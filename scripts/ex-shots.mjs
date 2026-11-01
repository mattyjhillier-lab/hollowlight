// EXTRAS v1 screenshots + layout checks: node scripts/ex-shots.mjs <assist|wardrobe|endless|all> [outDir] [baseUrl]  (needs `npm run build && npx vite preview --port 4196`).
// Own Chrome on port 9394, own temp profile (deleted at the end). 1280x720, 844x390@2x, 390x844@2x; per screen: no scroll, taps >= 44, text >= 12, nothing off-screen.
import { spawn } from 'node:child_process';
import { writeFileSync, mkdtempSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
const PHASE = process.argv[2] || 'all'; const out = process.argv[3] || 'docs/screenshots/extras'; const base = process.argv[4] || 'http://localhost:4196';
const CHROME = [process.env.CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find((p) => p && existsSync(p));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const PORT = 9394;
const dir = mkdtempSync(join(tmpdir(), 'hl-ex-'));
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
 const taps=[...l.querySelectorAll('button,[role=radio],[role=checkbox]')].filter(vis).map(e=>{const r=e.getBoundingClientRect();return [(e.getAttribute('aria-label')||e.textContent||'').trim().slice(0,16),Math.round(r.width),Math.round(r.height)]});
 let minF=99,small=[];const tw=document.createTreeWalker(l,NodeFilter.SHOW_TEXT);let n;while(n=tw.nextNode()){if(!n.textContent.trim())continue;const p=n.parentElement;if(!vis(p)||p.closest('.u3-sr,.u6-sr'))continue;const f=parseFloat(getComputedStyle(p).fontSize);if(f<minF)minF=f;if(f<12)small.push(p.className+':'+f)}
 const vw=innerWidth,vh=innerHeight;const off=[...l.querySelectorAll('*')].filter(vis).filter(e=>!(e.closest('svg')&&e.tagName!=='svg')).filter(e=>{const r=e.getBoundingClientRect();return r.right>vw+1||r.left<-1||r.bottom>vh+1||r.top<-1}).map(e=>String(e.className.baseVal??e.className)).slice(0,4);
 const clipped=[...l.querySelectorAll('.fdm-side,.fdm-map,.u6-panel,.u6-main')].filter(vis).filter(e=>e.scrollHeight>e.clientHeight+1).map(e=>e.className.split(' ')[0]);
 return {scroll:W.scrollHeight>W.clientHeight+1||W.scrollWidth>W.clientWidth+1||document.documentElement.scrollWidth>vw+1,small:taps.filter(t=>t[1]<44||t[2]<44),minF,smallText:small.slice(0,3),off,clipped,dropped:(l.querySelector('.u6-wrap')||{getAttribute:()=>null}).getAttribute('data-dropped')}})()`;
const check = async (tag, sel, scroller) => { const m = await ev(MEASURE(sel, scroller)); console.log(' ', tag, JSON.stringify(m));
  if (m.scroll) fail(tag + ' scrolls'); if (m.small.length) fail(tag + ' small taps ' + JSON.stringify(m.small)); if (m.minF < 12) fail(tag + ' text ' + m.minF + ' ' + m.smallText); if (m.off.length) fail(tag + ' off-screen ' + m.off); if (m.clipped.length) fail(tag + ' clipped ' + m.clipped); };
const vis = (n) => ev(`(()=>{const l=document.querySelector('.layer-${n}');return !!l&&l.style.display!=='none'})()`);

// One lantern: Twilight cleared twice (2 stars), Wren most played; Deep Dusk opened by an in-page override (the Night Gate is inert in the build).
const SEED = `(()=>{const A=__app;A.chooseStarter('wren','ghost_wolves');const d=A.save.data;d.gold=2410;d.shards=6;d.dawnglass=4;d.stats.runs=14;d.stats.wins=2;d.stats.charsUsed={wren:10,elias:4};
 d.stats.tiers={cursed_forest:{normal:{runs:12,clears:2,best:{t:900,kills:1500,level:19},stars:3,heroes:{wren:{clears:2,first:false},elias:{clears:0,first:false}}}}};A.save.saveNow(true);return 1})()`;
const OPEN = `(()=>{__app.openTiers=()=>['cursed_forest:hard'];return 1})()`;
const R = (o) => JSON.stringify({ outcome: 'victory', time: 900, clock: 900, level: 19, kills: 1904, gold: 1120, shards: 5, bossKilled: true, bossId: 'elder_treant', chapter: 'cursed_forest', character: 'wren', weapons: [{ id: 'ghost_wolves', evo: 'phantom_stampede', ranks: {}, damage: 12000, kills: 900 }, { id: 'holy_orbit', evo: null, ranks: {}, damage: 4000, kills: 300 }, { id: 'raven_flock', evo: null, ranks: {}, damage: 2000, kills: 100 }], ...o });
// bank a staged result through the REAL app.bankRun (tier = the run's tier), then show the real results screen
const END = (tier, o) => `(()=>{const A=__app;A.runTier='${tier}';A.banked=false;const r=Object.assign(${R({})},${JSON.stringify(o)},{tier:'${tier}'});const sim={result:()=>r,state:r.outcome};const b=A.bankRun(sim);A.ui.hideAll();A.ui.showEnd(sim,b);return new Promise((res)=>setTimeout(()=>res(JSON.stringify({tier:b.tier,night:b.night})),1300))})()`;
const VIEWS = [['1280x720', 1280, 720, 1, false], ['844x390', 844, 390, 2, true], ['390x844', 390, 844, 2, true]];
const has = (p) => PHASE === 'all' || PHASE === p;
const toMap = async () => { await ev("__app.ui.showNights('wren')"); await sleep(300); };
try {
for (const [n, w, h, d, m] of VIEWS) {
  if (process.env.VIEW && process.env.VIEW !== n) continue; // VIEW=844x390 runs one size
  console.log(n);
  const url = `${base}/${m ? '?touch=1' : ''}`;
  await open(url, w, h, d, m);
  await ev('localStorage.clear()'); await open(url, w, h, d, m);
  await ev(SEED); await open(url, w, h, d, m); await ev(OPEN);
  if (has('assist')) {
    await toMap();
    if (!(await vis('nights'))) fail('map screen did not open');
    await key('1', 'Digit1', 49); await sleep(200);
    const g0 = await ev("(()=>{const g=document.querySelector('.fdm-gentle');return g?g.getAttribute('aria-checked'):'none'})()");
    if (g0 !== 'false') fail('gentle box default ' + g0);
    await shot(`ex1-twilight-off-${n}`); await check('twilight gentle off', '.layer-nights', '.fdm-screen');
    await ev("document.querySelector('.fdm-gentle').focus()"); await key(' ', 'Space', 32); await sleep(200);
    const g1 = await ev("JSON.stringify([document.querySelector('.fdm-gentle').getAttribute('aria-checked'),__app.save.data.settings.gentleLight,document.activeElement&&document.activeElement.className])");
    if (!g1.startsWith('["true",true,"fdm-gentle is-on"')) fail('gentle toggle by Space ' + g1);
    await shot(`ex1-twilight-on-${n}`); await check('twilight gentle on', '.layer-nights', '.fdm-screen');
    await key('2', 'Digit2', 50); await sleep(200);
    if (await ev("!!document.querySelector('.fdm-gentle')")) fail('gentle box shown on Deep Dusk');
    await key('1', 'Digit1', 49); await sleep(150);
    await key('Enter', 'Enter', 13); await sleep(400); // -> hero step; Enter again starts the run
    for (let k = 0; k < 3 && !(await ev('!!__app.sim')); k++) { await ev("(()=>{const b=document.querySelector('.layer-hero .lg-btn--primary');if(b)b.click();return 1})()"); await sleep(500); }
    const run = await ev("JSON.stringify([__app.sim&&__app.sim.tier.id,!!(__app.sim&&__app.sim.assist),__app.isDebugRun()])");
    console.log('  run', run);
    if (run !== '["normal",true,false]') fail('gentle run start ' + run);
    await ev('__app.showMenu()'); await sleep(200);
    const b1 = await ev(END('normal', { assist: true, gold: 900 })); console.log('  bank', b1);
    if (!b1.includes('"assist":true')) fail('assist not banked ' + b1);
    for (let k = 0; k < 4 && (await ev("__app.ui.celActive()")); k++) { await key('Escape', 'Escape', 27); await sleep(500); }
    await shot(`ex1-results-gentle-${n}`); await check('results gentle', '.layer-end', '.u6-wrap');
    if (!(await ev("!!document.querySelector('.u6-gentle')"))) fail('results gentle line missing');
    await ev('__app.ui.hideAll();__app.ui.showSettings()'); await sleep(300);
    await ev("(()=>{const t=[...document.querySelectorAll('[role=tab]')].find(e=>e.getAttribute('data-id')==='controls');if(t)t.click();return 1})()"); await sleep(300);
    const sw = await ev("JSON.stringify([...document.querySelectorAll('[role=switch]')].map(e=>(e.textContent||'').slice(0,12)+':'+e.getAttribute('aria-checked')).filter(s=>s.startsWith('Gentle')))");
    if (!sw.includes('true')) fail('settings switch ' + sw);
    await ev("(()=>{const s=[...document.querySelectorAll('[role=switch]')].find(e=>(e.textContent||'').startsWith('Gentle'));let p=s;while(p&&p!==document.body){if(p.scrollHeight>p.clientHeight+2&&/auto|scroll/.test(getComputedStyle(p).overflowY)){p.scrollTop=s.offsetTop-p.clientHeight/2;break}p=p.parentElement}return 1})()"); await sleep(200);
    await shot(`ex1-settings-${n}`);
    const sm = await ev("JSON.stringify((()=>{const L=[...document.querySelectorAll('.overlay.u4')].find(e=>e.offsetParent!==null||getComputedStyle(e).display!=='none');const P=L&&L.querySelector('.lg-panel');const B=[...L.querySelectorAll('.lg-btn')].pop();const r=(e)=>{const q=e.getBoundingClientRect();return [Math.round(q.top),Math.round(q.bottom)]};return {vh:innerHeight,panel:P&&r(P),back:B&&r(B),ovScroll:L&&[L.scrollTop,L.scrollHeight,L.clientHeight]}})())");
    console.log('  settings', sm);
    console.log('  settings-without-gentle', await ev("JSON.stringify((()=>{const g=[...document.querySelectorAll('[role=switch]')].find(e=>(e.textContent||'').startsWith('Gentle'));const row=g.closest('.lg-switch')||g;const par=row.parentNode,nx=row.nextSibling;row.remove();const L=[...document.querySelectorAll('.overlay.u4')].find(e=>getComputedStyle(e).display!=='none');const B=[...L.querySelectorAll('.lg-btn')].pop();const q=B.getBoundingClientRect();par.insertBefore(row,nx);return [Math.round(q.top),Math.round(q.bottom)]})())"));
    await ev("(()=>{const s=[...document.querySelectorAll('[role=switch]')].find(e=>(e.textContent||'').startsWith('Gentle'));s.click();return 1})()"); await sleep(200);
    if (await ev('__app.save.data.settings.gentleLight') !== false) fail('settings switch did not turn it off');
    await ev('__app.ui.hideSettings ? __app.ui.hideSettings() : 0'); await sleep(200);
  }
  if (has('wardrobe')) {
    // own the Wardrobe bridge + Petal Drift + Dawn Rose; Wren Bond 11 (two looks); Bright flame + petal trail + fox wisp worn after the drawer
    await ev(`(()=>{const d=__app.save.data;d.tree=Object.assign({},d.tree,{li_study:1,li_coin:1,br_wardrobe:1,wd_petal:1,wd_rose:1});d.chars.wren=Object.assign({},d.chars.wren,{xp:5000,woke:true});d.cosm={worn:{flame:null,trail:null,look:{}}};__app.save.saveNow(true);return 1})()`);
    await open(url, w, h, d, m); await ev(OPEN);
    await ev('__app.ui.showHeroSelect()'); await sleep(300);
    if (!(await ev("!!document.querySelector('.layer-hero .u3-wear')"))) fail('no Wear button on hero select');
    if (n === '1280x720') { await shot(`ex2-hero-wear-${n}`); await check('hero select + wear', '.layer-hero', '.u3-wrap'); }
    await ev("document.querySelector('.layer-hero .u3-wear').click()"); await sleep(400);
    if (!(await ev("!!document.querySelector('.wr-screen')"))) fail('Wear drawer did not open');
    const items = await ev("JSON.stringify([...document.querySelectorAll('.wr-item')].map(e=>[e.getAttribute('data-id'),e.getAttribute('aria-checked'),e.getAttribute('aria-disabled')]))");
    console.log('  flames', items);
    if (!items.includes('["moon_teal","false",null]') || !items.includes('["dawn_rose","false",null]') || !items.includes('["lilac_hush","false","true"]')) fail('flame ownership ' + items);
    await ev("document.querySelector('.wr-item[data-id=dawn_rose]').click()"); await sleep(200);
    await shot(`ex2-wear-flame-${n}`); await check('wear flame', '.layer-hero', '.wr-screen');
    await key('2', 'Digit2', 50); await sleep(150);
    await ev("document.querySelector('.wr-item[data-id=petal]').click()"); await sleep(150);
    await key('3', 'Digit3', 51); await sleep(150);
    const looks = await ev("JSON.stringify([...document.querySelectorAll('.wr-item')].map(e=>[e.getAttribute('data-id'),e.getAttribute('aria-disabled')]))");
    if (!looks.includes('["wren_fox",null]') || !looks.includes('["wren_moss",null]') || !looks.includes('["wren_dusk","true"]')) fail('looks by Bond ' + looks);
    await ev("document.querySelector('.wr-item[data-id=wren_fox]').focus()"); await key(' ', 'Space', 32); await sleep(150);
    await shot(`ex2-wear-look-${n}`); await check('wear look', '.layer-hero', '.wr-screen');
    await ev("document.querySelector('.wr-item[data-id=wren_dusk]').click()"); await sleep(100); // locked: no change
    await key('Enter', 'Enter', 13); await sleep(200);
    const worn = await ev('JSON.stringify(__app.save.data.cosm)');
    console.log('  worn', worn);
    if (worn !== '{"worn":{"flame":"dawn_rose","trail":"petal","look":{"wren":"wren_fox"}}}') fail('worn saved ' + worn);
    await key('Escape', 'Escape', 27); await sleep(250);
    if (!(await ev("!!document.querySelector('.layer-hero .u3-wear')"))) fail('Back did not return to hero select');
    // hostile worn: an unowned flame is refused at wear time and at resolve time
    const forged = await ev("JSON.stringify((()=>{__app.save.data.cosm={worn:{flame:'lilac_hush',trail:'firefly',look:{wren:'wren_star',__proto__:{x:1}}}};const v=__app.ui.handlers.wearView('wren');return v.sel})())");
    if (forged !== '{"flame":"hearth","trail":"thread","look":"wren_frost"}') fail('forged worn not refused ' + forged);
    await ev(`(()=>{__app.save.data.cosm={worn:{flame:'dawn_rose',trail:'petal',look:{wren:'wren_fox'}}};return 1})()`);
    // in game: a real run wearing them (bot steering, a few seconds in)
    await open(`${base}/?auto=wren&seed=4&god=1${m ? '&touch=1' : ''}`, w, h, d, m);
    await ev(`(()=>{__app.save.data.cosm={worn:{flame:'dawn_rose',trail:'petal',look:{wren:'wren_fox'}}};__app.save.data.tree=Object.assign({},__app.save.data.tree,{br_wardrobe:1,wd_petal:1,wd_rose:1});__app.save.data.chars.wren=Object.assign({},__app.save.data.chars.wren,{xp:5000});__app.applyCosm(__app.sim);return 1})()`);
    for (let k = 0; k < 14; k++) { await ev("(()=>{const s=__app.sim;if(s&&s.state==='levelup'&&s.offer){const c=s.offer.cards[0]||s.offer.gold[0];if(c)s.pickCard(c.key)}return 1})()"); await sleep(400); }
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'd', code: 'KeyD', windowsVirtualKeyCode: 68 }); await sleep(1400); await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'd', code: 'KeyD', windowsVirtualKeyCode: 68 });
    await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 's', code: 'KeyS', windowsVirtualKeyCode: 83 }); await sleep(700); await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 's', code: 'KeyS', windowsVirtualKeyCode: 83 });
    const sc = await ev("JSON.stringify([__app.scene.cosm&&__app.scene.cosm.flame.id,__app.scene.cosm&&__app.scene.cosm.trail.id,__app.scene.cosm&&__app.scene.cosm.look.id,__app.scene.cGlow.toString(16)])");
    console.log('  scene', sc);
    if (!sc.startsWith('["dawn_rose","petal","wren_fox","ffb3a8"')) fail('scene cosm ' + sc);
    await shot(`ex2-ingame-${n}`);
    if (n === '1280x720') { const r = await send('Page.captureScreenshot', { format: 'png', clip: { x: 440, y: 200, width: 400, height: 320, scale: 2 } }); writeFileSync(join(out, `ex2-ingame-zoom-${n}.png`), Buffer.from(r.data, 'base64')); console.log('  shot zoom'); }
    if (n === '1280x720') {
      await open(url, w, h, d, m);
      await ev("__app.openTree('wd_white')"); await sleep(1200);
      await ev("(()=>{const b=[...document.querySelectorAll('button')].find(x=>(x.textContent||'').trim()==='Got it');if(b)b.click();return 1})()"); await sleep(500);
      await shot(`ex2-tree-wardrobe-${n}`);
    }
  }
  if (has('endless')) {
    // map side card: a Twilight 'Longest night' record
    await ev(`(()=>{const d=__app.save.data;d.stats.tiers.cursed_forest.normal.dark=372;__app.save.saveNow(true);return 1})()`);
    await open(url, w, h, d, m); await ev(OPEN);
    await toMap(); await key('1', 'Digit1', 49); await sleep(200);
    const rec = await ev("(document.querySelector('.fdm-rec')||{}).textContent||''");
    if (n === '1280x720' && !rec.includes('Longest night +6:12')) fail('longest night record ' + rec);
    if (n === '1280x720') await shot(`ex3-map-longest-${n}`);
    // a real boss win (debug run: t + god), then the dawn choice
    await open(`${base}/?t=836&god=1&seed=3${m ? '&touch=1' : ''}`, w, h, d, m);
    await ev("(()=>{const ok=__app.ui.screen&&__app.ui.screen.id;return 1})()");
    await ev("(()=>{__app.startRun('wren','normal');return 1})()"); await sleep(400);
    for (let k = 0; k < 60; k++) {
      const st = await ev("(()=>{const s=__app.sim;if(!s)return 'none';if(s.state==='levelup'&&s.offer){const c=s.offer.cards[0]||s.offer.gold[0];if(c)s.pickCard(c.key)}if(s.fight&&s.fight.stage==='fight'&&s.boss&&!s.boss.dead){s.hurt(s.boss,s.boss.hp+1)}return s.state+':'+(!!__app.ui.darkView)})()");
      if (st.endsWith('true')) break; await sleep(500);
    }
    if (!(await ev('!!__app.ui.darkView'))) fail('dawn choice did not appear');
    await shot(`ex3-dawn-choice-${n}`); await check('dawn choice', '.layer-dark', '.dk-wrap');
    await key('s', 'KeyS', 83); await sleep(300);
    const dk = await ev("JSON.stringify([__app.sim.state,!!__app.sim.endless,!!__app.ui.darkView,__app.sim.fight])");
    if (dk !== '["running",true,false,null]') fail('stay in the dark ' + dk);
    for (let k = 0; k < 110; k++) { await ev("(()=>{const s=__app.sim;if(s&&s.state==='levelup'&&s.offer){const c=s.offer.cards[0]||s.offer.gold[0];if(c)s.pickCard(c.key)}return 1})()"); await sleep(500); } // ~50 s: the sky is back to night
    const hud = await ev("(document.querySelector('.hud [class*=time]')||{}).textContent||''");
    console.log('  hud', hud, await ev('Math.round(__app.sim.time-__app.sim.endless.t0)'));
    await shot(`ex3-dark-ingame-${n}`);
    await ev("(()=>{const s=__app.sim;s.godMode=false;s.player.iframes=0;s.player.hp=1;s.damagePlayer(999,'wolf');return s.state})()"); await sleep(900);
    for (let k = 0; k < 4 && (await ev('__app.ui.celActive()')); k++) { await key('Escape', 'Escape', 27); await sleep(400); }
    const dl = await ev("(document.querySelector('.u6-dark')||{}).textContent||''");
    if (!dl.includes('You held the dark')) fail('results dark line ' + dl);
    await shot(`ex3-results-dark-${n}`); await check('results dark', '.layer-end', '.u6-wrap');
  }
  if (errors.length) fail('console ' + errors.splice(0).join(';'));
}
} catch (e) { fail('crash ' + e.message); }
try { ws.close(); proc.kill(); } catch { /* ignore */ }
await sleep(800);
try { rmSync(dir, { recursive: true, force: true }); } catch { /* best effort */ }
console.log(fails ? `${fails} FAIL` : 'ALL OK');
process.exit(fails ? 1 : 0);
