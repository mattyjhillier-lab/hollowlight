// FREEZE-1: a real-length run in headless Chrome (no deps, Node 22+): samples render state every STEP s and frame stats per window, so growth over a
// run (heap, canvases, texture MB, display-list size, pooled sprites, trail segments, tweens/timers, particles) and the per-frame cost are visible.
// Also the start-of-run ground timeline (tier, ground shader on, Deep Forest tiles ready) and optional screenshots at chosen seconds.
// Usage: node scripts/run-soak.mjs <baseUrl> [minutes=14] [throttle=4] [profile=iphone|android|desktop] [quality=auto|high|med|low|saver]
//        [grant spec, e.g. ghost_wolves:count=5,power=5,speed=5,duration=5] [evolveAt=sim seconds:evoId] [step=30] [shots=dir:0,1,3,10]
// NOPREBAKE=1: both pre-bake modes start switched off by the crash guard (the in-run lazy path a device gets after two unfinished loads).
// Budget (exit 1): heap growth per minute after minute 2 > HEAP_MB_MIN (default 4), canvas count growth > 20, worst frame after 1:00 > LONG_BUDGET (default 1000 ms).
import { spawn } from 'node:child_process';
import { mkdtempSync, existsSync, writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';

const [base, minS = '14', thrS = '4', profile = 'iphone', quality = 'auto', grant = '', evolveAt = '', stepS = '30', shots = ''] = process.argv.slice(2);
if (!base) { console.error('usage: node scripts/run-soak.mjs <baseUrl> [minutes] [throttle] [profile] [quality] [grant] [evolveAt] [step] [shots]'); process.exit(2); }
const MIN = +minS, thr = +thrS, STEP = +stepS;
const HEAP_MB_MIN = +(process.env.HEAP_MB_MIN || 4), LONG_BUDGET = +(process.env.LONG_BUDGET || 1000);
const extra = process.env.EXTRA || ''; // extra URL params, e.g. '&weapons=dev'
const chrome = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find((p) => existsSync(p));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const PORT = 9360 + Math.floor(Math.random() * 60);
const dir = mkdtempSync(path.join(tmpdir(), 'runsoak-'));
const gpu = process.env.SWIFT ? ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'] : ['--enable-gpu', '--ignore-gpu-blocklist', '--use-angle=d3d11'];
const proc = spawn(chrome, ['--headless=new', `--remote-debugging-port=${PORT}`, `--user-data-dir=${dir}`, '--no-first-run', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--enable-precise-memory-info', '--js-flags=--expose-gc', '--autoplay-policy=no-user-gesture-required', ...gpu, 'about:blank'], { stdio: 'ignore' });
let tabs; for (let i = 0; i < 60; i++) { try { tabs = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json(); if (tabs.length) break; } catch { /* retry */ } await sleep(300); }
const ws = new WebSocket(tabs.find((t) => t.type === 'page').webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r));
let id = 0; const pend = new Map();
ws.addEventListener('message', (m) => { const d = JSON.parse(m.data); if (d.id && pend.has(d.id)) { pend.get(d.id)(d); pend.delete(d.id); } });
const send = (method, params = {}) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async (expr) => { const r = await Promise.race([send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }), sleep(60000).then(() => null)]); return r ? r.result?.result?.value : undefined; };
const UA = {
  iphone: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1',
  android: 'Mozilla/5.0 (Linux; Android 14; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36',
};
await send('Page.enable');
await send('Page.addScriptToEvaluateOnNewDocument', { source: `window.__fr=[];(function f(t){window.__fr.push(t);if(window.__fr.length>60000)window.__fr.splice(0,30000);requestAnimationFrame(f)})(0);
window.__cv=0;const __ce=document.createElement.bind(document);document.createElement=function(t,...r){if(String(t).toLowerCase()==='canvas')window.__cv++;return __ce(t,...r)};
${profile === 'iphone' ? "Object.defineProperty(Navigator.prototype,'maxTouchPoints',{get:()=>5});" : ''}
${process.env.NOPREBAKE ? "try{if(!sessionStorage.getItem('npb')){sessionStorage.setItem('npb','1');localStorage.setItem('hollowlight:pb','{\"s\":\"run\",\"n\":2}');localStorage.setItem('hollowlight:pb:ground','{\"s\":\"run\",\"n\":2}')}}catch(e){}" : ''}` });
if (profile !== 'desktop') {
  await send('Emulation.setDeviceMetricsOverride', { width: 844, height: 390, deviceScaleFactor: 3, mobile: true, screenOrientation: { type: 'landscapePrimary', angle: 90 } });
  await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  await send('Emulation.setUserAgentOverride', { userAgent: UA[profile] || UA.iphone, platform: profile === 'iphone' ? 'iPhone' : 'Linux armv8l' });
} else await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 720, deviceScaleFactor: 1, mobile: false });
await send('Emulation.setCPUThrottlingRate', { rate: thr });

const saver = quality === 'saver';
await send('Page.navigate', { url: `${base}/?perf=1&god=1&seed=1${process.env.T0 ? '&t=' + (+process.env.T0) : ''}${grant ? '&grant=' + grant : ''}${extra}` });
for (let i = 0; i < 200; i++) { if (await ev('!!(window.__app && window.__app.scene && window.__app.scene.sys && window.__app.save)')) break; await sleep(300); }
await sleep(+(process.env.LINGER || 1.5) * 1000);
await ev(`(window.__app.save.setSettings({quality:${JSON.stringify(saver ? 'auto' : quality)},batterySaver:${saver}}), window.__app.applySettings(), 0)`);
const tStart = await ev("(window.__app.startRun('wren'), performance.now())");
let simAt = null; for (let i = 0; i < 1200; i++) { if (await ev('!!(window.__app.sim && window.__app.sim.time > 0.02)')) { simAt = await ev('performance.now()'); break; } await sleep(50); }
if (simAt === null) { console.log(JSON.stringify({ error: 'run never started' })); proc.kill(); process.exit(1); }
// a walker: the hero circles (radius ~300 px, one lap ~25 s) and dashes now and then, so gems are collected and the camera moves like a player's
await ev(`(()=>{const sc=window.__app.scene,o=sc.readInput.bind(sc);sc.readInput=function(){const r=o(),t=(window.__app.sim?window.__app.sim.time:0);r.x=Math.cos(t*0.25);r.y=Math.sin(t*0.25);return r}})()`);
// split of app.frame (RunScene sec 0): sim.step / minimap / audio / feel+events, ms per frame (reported as 'split')
await ev(`(()=>{const a=window.__app,T=window.__split={n:0,sim:0,map:0,audio:0,ev:0,hud:0};const wrap=(o,k,key)=>{const f=o[k];if(typeof f!=='function')return;o[k]=function(...x){const t=performance.now();try{return f.apply(this,x)}finally{T[key]+=performance.now()-t}}};
const P=Object.getPrototypeOf(a.sim);wrap(P,'step','sim');wrap(a,'mapTick','map');if(a.audio)wrap(a.audio,'frame','audio');wrap(a,'onEvent','ev');wrap(a,'tickFeel','ev');if(a.ui&&a.ui.hudView&&a.ui.hudView.update)wrap(a.ui.hudView,'update','hud');a.scene.game.events.on('postrender',()=>T.n++)})()`);
// per-section CPU (RunScene sec timers: 0 app.frame/sim+UI, 1 draw, 2 life map, 3 sway, 4 props, 5 ribbons, 6 lightmap flush, 7 fx, 8 ambient) + work ms, averaged per sample window
await ev(`(()=>{const sc=window.__app.scene;window.__acc={n:0,w:0,s:new Float64Array(10)};sc.game.events.on('postrender',()=>{const A=window.__acc;A.n++;A.w+=sc.workMs;for(let i=0;i<10;i++)A.s[i]+=sc.sec[i]})})()`);
const SAMPLE = `(()=>{const a=window.__app,s=a.sim,sc=a.scene,b=sc.bState,P=sc.perf&&sc.perf.rec||{};const A=window.__acc,an=Math.max(1,A.n),secs=Array.from(A.s,v=>+(v/an).toFixed(2)),wk=+(A.w/an).toFixed(2),fpsN=A.n;A.n=0;A.w=0;A.s.fill(0);let tb=0,tn=0;try{const T=sc.textures.list;for(const k in T){tn++;for(const r of T[k].source||[])tb+=(r.width||0)*(r.height||0)*4}}catch(e){}
const Sp=window.__split||{n:0},sn=Math.max(1,Sp.n),split=Sp.n?{sim:+(Sp.sim/sn).toFixed(2),map:+(Sp.map/sn).toFixed(2),audio:+(Sp.audio/sn).toFixed(2),ev:+(Sp.ev/sn).toFixed(2),hud:+(Sp.hud/sn).toFixed(2)}:null;if(window.__split){for(const k in Sp)Sp[k]=0}
const rib=sc.ribLayer?(sc.ribLayer.all?sc.ribLayer.all.length:-1):-1,paw=sc.pawLayer&&sc.pawLayer.all?sc.pawLayer.all.length:-1;
return {t:+((performance.now()-${simAt})/1000).toFixed(2),simT:s?+s.time.toFixed(1):-1,state:s?s.state:'-',tier:sc.quality.tier,gb:sc.gbOn?1:0,bReady:b?+b.ready.toFixed(2):-1,lazyN:b&&b.lazy?b.lazy.n:-1,lm:sc.lmOn?1:0,
heapMB:performance.memory?+(performance.memory.usedJSHeapSize/1048576).toFixed(1):-1,canvases:window.__cv,texN:tn,texMB:+(tb/1048576).toFixed(1),children:sc.children.list.length,
sprites:sc.countSprites(),particles:sc.parts?sc.parts.count:-1,rib,paw,tweens:sc.tweens?sc.tweens.getTweens().length:-1,timers:sc.time&&sc.time._active?sc.time._active.length:-1,
enemies:s?s.enemies.length:-1,units:s?s.units.length:-1,gems:s&&s.gems?s.gems.length:-1,calls:P.calls||0,work:wk,secs,split,frames:fpsN,fps:P.fps?+P.fps.toFixed(0):0,evo:s?s.weapons.map(w=>w.id+(w.evo?'+'+w.evo:'')).join(' '):''}})()`;
const samples = [], groundTl = [];
const shotSet = shots ? (() => { const cut = shots.lastIndexOf(':'), d = shots.slice(0, cut), list = shots.slice(cut + 1); mkdirSync(d, { recursive: true }); return { d, at: list.split(',').map(Number) }; })() : null;
let evolved = false; const [evoT, evoId] = evolveAt ? evolveAt.split(':') : [null, null];
const end = simAt + MIN * 60000;
let nextSample = 0, nextShot = 0;
while (true) {
  const now = await ev('performance.now()');
  const rt = (now - simAt) / 1000;
  if (rt < 20) { const g = await ev(`(()=>{const sc=window.__app.scene,b=sc.bState;return {t:+((performance.now()-${simAt})/1000).toFixed(2),tier:sc.quality.tier,gb:sc.gbOn?1:0,bReady:b?+b.ready.toFixed(2):-1,lazyN:b&&b.lazy?b.lazy.n:-1}})()`); if (!groundTl.length || JSON.stringify({ ...groundTl.at(-1), t: 0 }) !== JSON.stringify({ ...g, t: 0 })) groundTl.push(g); }
  if (shotSet && nextShot < shotSet.at.length && rt >= shotSet.at[nextShot]) { const r = await send('Page.captureScreenshot', { format: 'png' }); writeFileSync(path.join(shotSet.d, `t${String(shotSet.at[nextShot]).padStart(3, '0')}.png`), Buffer.from(r.result.data, 'base64')); nextShot++; }
  if (evoId && !evolved && (await ev('window.__app.sim ? window.__app.sim.time : 0')) >= +evoT) {
    await ev(`(()=>{const s=window.__app.sim,e=window.__app.data.evolutions[${JSON.stringify(evoId)}],w=s.weapons.find(x=>x.id===e.weapon);if(!w)return 0;for(const u of s.units)if(u.owner===e.weapon)u.dead=true;s.pushEvent('evolve',{id:${JSON.stringify(evoId)}});s.debugGrant(e.weapon,{...w.ranks},${JSON.stringify(evoId)});return 1})()`);
    evolved = rt; console.error('evolved at', rt.toFixed(1), 's');
  }
  // level-up / chest / offer cards: take the first card at once (the run never waits on a pick; evolution cards are declined so the evolve moment is ours)
  await ev(`(()=>{const a=window.__app,s=a.sim;if(!s||s.state!=='levelup'||!s.offer)return 0;const c=s.offer.cards.find(c=>c.kind!=='evolution')||s.offer.cards[0];if(c)a.pick(c.key);return 1})()`);
  // RISE=1 (dev builds): swap in Lucinda's hidden Ophimber's Rise (sim only, as scripts/rise-shots.mjs does) and cast it whenever it is ready
  if (process.env.RISE) await ev(`(()=>{const a=window.__app,s=a.sim;if(!s||s.state!=='running'||!a.data.hiddenCharacters||!a.data.hiddenCharacters.hearthwarden)return 0;s.character=a.data.hiddenCharacters.hearthwarden;s.ability.id='ophimbers_rise';if(s.ability.cdLeft<=0)s.useAbility();return 1})()`);
  if (rt >= nextSample) { const s = await ev(SAMPLE); samples.push(s); nextSample += STEP; console.error(`${s.t}s sim ${s.simT} heap ${s.heapMB} cv ${s.canvases} tex ${s.texMB} ch ${s.children} spr ${s.sprites} rib ${s.rib} e ${s.enemies} work ${s.work} calls ${s.calls} tier ${s.tier}`); }
  if (now >= end) break;
  await sleep(rt < 20 ? 100 : 1000);
}
// PROFILE=<s>: a CPU profile of s seconds taken at 40 s into the run; top self-time functions (render/sim split) are printed to stderr and kept in the JSON
let profTop = null;
if (+process.env.PROFILE > 0) {
  await send('Profiler.enable'); await send('Profiler.setSamplingInterval', { interval: 500 }); await send('Profiler.start');
  await sleep(+process.env.PROFILE * 1000);
  const pr = (await send('Profiler.stop')).result.profile;
  const self = new Map(), dt = new Map(); let total = 0;
  for (let i = 0; i < pr.samples.length; i++) { const d = pr.timeDeltas[i] || 0; dt.set(pr.samples[i], (dt.get(pr.samples[i]) || 0) + d); total += d; }
  for (const n of pr.nodes) { const t = dt.get(n.id) || 0; if (!t) continue; const cf = n.callFrame; const k = (cf.functionName || '(anon)') + ' ' + (cf.url ? cf.url.split('/').pop() : '') + ':' + cf.lineNumber + ':' + cf.columnNumber; self.set(k, (self.get(k) || 0) + t); }
  profTop = [...self.entries()].sort((a, b) => b[1] - a[1]).slice(0, 40).map(([k, t]) => [k, +(100 * t / total).toFixed(1)]);
  for (const [k, pc] of profTop) console.error(pc + '%', k);
}
const fr = await ev('window.__fr.slice()');
const win = (a, b) => { const w = []; for (let i = 1; i < fr.length; i++) if (fr[i - 1] >= simAt + a * 1000 && fr[i] <= simAt + b * 1000) w.push(fr[i] - fr[i - 1]); const s = w.sort((x, y) => x - y); const q = (p) => (s.length ? +s[Math.min(s.length - 1, Math.floor(s.length * p))].toFixed(1) : 0); return { n: s.length, p50: q(0.5), p95: q(0.95), max: q(1), over50: s.filter((d) => d > 50).length, over500: s.filter((d) => d > 500).length }; };
const windows = []; for (let a = 0; a < MIN * 60; a += 60) windows.push({ min: a / 60, ...win(a, a + 60) });
const longs = await ev('window.__probe ? window.__probe.long.slice(0,20).map(l=>(l.at>=0?l.at.toFixed(0)+"s ":"")+Math.round(l.ms)+"ms "+l.tags.slice(0,4).join(", ")) : []');
// growth: least-squares slope of heap from minute 2 on (MB per minute)
const tail = samples.filter((s) => s.t >= 120 && s.heapMB >= 0);
const slope = (k) => { const n = tail.length; if (n < 3) return 0; const mx = tail.reduce((a, s) => a + s.t / 60, 0) / n, my = tail.reduce((a, s) => a + s[k], 0) / n; let num = 0, den = 0; for (const s of tail) { num += (s.t / 60 - mx) * (s[k] - my); den += (s.t / 60 - mx) ** 2; } return +(num / den).toFixed(2); };
const growth = { heapMBperMin: slope('heapMB'), childrenPerMin: slope('children'), texMBperMin: slope('texMB'), canvases: samples.length ? samples.at(-1).canvases - samples[0].canvases : 0 };
const worstAfter1 = Math.max(0, ...windows.filter((w) => w.min >= 1).map((w) => w.max));
const fail = growth.heapMBperMin > HEAP_MB_MIN || growth.canvases > 20 || worstAfter1 > LONG_BUDGET;
console.log(JSON.stringify({ base, minutes: MIN, throttle: thr, profile, quality, grant, evolveAt, startMs: Math.round(simAt - tStart), evolved, budget: { HEAP_MB_MIN, LONG_BUDGET }, growth, worstAfter1, fail, profTop, groundTl, windows, samples, longs }, null, 1));
ws.close(); proc.kill();
process.exit(fail ? 1 : 0);
