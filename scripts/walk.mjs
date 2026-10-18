// Walk-smoothness harness (real GPU Chrome, own port, kills only its own Chrome). Holds D for SECS/2 then A for SECS/2 and records,
// every rendered frame: rAF time, Phaser smoothed delta, hero world x/y, camera scroll/zoom, walk phase, head/body sprite y.
// Reports frame-time percentiles plus jitter metrics:
//   heroJit  = stddev of the hero's per-frame screen-x change (device px; 0 = hero glued to the screen while the camera follows)
//   worldJit = stddev of the per-frame world scroll step around the ideal speed*dt*zoom (device px; ground judder)
//   phaseCV  = stddev/mean of per-frame walk-phase increments
//   head     = head-y (rel. feet, design units) per step: bumps per step, RMS jerk, share of spectral energy above 1.5x step freq
//   node scripts/walk.mjs [dist] ; env: URL=http://127.0.0.1:5191/ (dev server instead of dist) HERO=wren|elias INJ=350 SECS=10
//   TIER=high HEADLESS=1 ANGLE=d3d11 LABEL=x STRIP=out.png (manual 60 Hz stepping, 12-frame strips; STRIPZ=3 zoom) JSON=series.json
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdtempSync, existsSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, extname, resolve } from 'node:path';
import { analyzeWalk } from './walkstats.mjs';

const CHROME = [process.env.CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find((p) => p && existsSync(p));
// Random high ports, checked free first: other agents run their own Chrome/servers on fixed ports, and attaching to THEIR
// browser by accident would drive their page.
const rp = () => 9600 + Math.floor(Math.random() * 300);
let CPORT = Number(process.env.CPORT || rp()), SPORT = Number(process.env.SPORT || 4600 + Math.floor(Math.random() * 300));
const portBusy = async (p) => { try { await fetch(`http://127.0.0.1:${p}/json/version`, { signal: AbortSignal.timeout(500) }); return true; } catch (e) { return e.cause?.code !== 'ECONNREFUSED'; } };
for (let i = 0; i < 20 && await portBusy(CPORT); i++) CPORT = rp();
if (await portBusy(CPORT)) throw new Error('no free debug port');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json', '.css': 'text/css' };
const serve = (dir) => { const root = resolve(dir); const srv = createServer((req, res) => { let p = decodeURIComponent((req.url || '/').split('?')[0]); if (p === '/') p = '/index.html'; const f = resolve(join(root, p)); if (!f.startsWith(root) || !existsSync(f)) { res.writeHead(404); res.end(); return; } res.writeHead(200, { 'content-type': MIME[extname(f)] || 'application/octet-stream' }); res.end(readFileSync(f)); }); return new Promise((r) => srv.listen(SPORT, '127.0.0.1', () => r(srv))); };

async function launch() {
  const dir = mkdtempSync(join(tmpdir(), 'hl-walk-'));
  const args = [`--remote-debugging-port=${CPORT}`, `--user-data-dir=${dir}`, '--no-first-run', '--disable-extensions', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows', '--window-size=1300,820', '--window-position=40,40', `--use-angle=${process.env.ANGLE || 'd3d11'}`, '--ignore-gpu-blocklist', '--enable-precise-memory-info', '--disable-features=CalculateNativeWinOcclusion', 'about:blank'];
  if (process.env.HEADLESS) args.unshift('--headless=new');
  const proc = spawn(CHROME, args, { stdio: 'ignore' });
  for (let i = 0; i < 60; i++) { try { const r = await fetch(`http://127.0.0.1:${CPORT}/json/version`); if (r.ok) break; } catch { /* retry */ } await sleep(250); }
  const tabs = await (await fetch(`http://127.0.0.1:${CPORT}/json/list`)).json();
  if (!tabs.some((t) => t.type === 'page' && t.url === 'about:blank')) { proc.kill(); throw new Error('debug port ' + CPORT + ' is not our fresh Chrome'); }
  const ws = new WebSocket(tabs.find((t) => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener('open', r));
  let id = 0; const pending = new Map(); const errs = [];
  const trace = [];
  ws.addEventListener('message', (m) => { const d = JSON.parse(m.data); if (d.method === 'Tracing.dataCollected') { for (const e of d.params.value) trace.push(e); return; } if (d.method === 'Tracing.tracingComplete') { trace.done = true; return; } if (d.method === 'Runtime.exceptionThrown') errs.push(d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text); if (d.method === 'Runtime.consoleAPICalled' && (d.params.type === 'error' || d.params.type === 'warning')) errs.push(d.params.type + ': ' + d.params.args.map((a) => a.value ?? a.description ?? '').join(' ').slice(0, 160)); if (d.id && pending.has(d.id)) { const p = pending.get(d.id); pending.delete(d.id); d.error ? p.rej(new Error(d.error.message)) : p.res(d.result); } });
  const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pending.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async (expr) => { const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + ' ' + (r.exceptionDetails.exception?.description || '')); return r.result.value; };
  const close = () => { try { ws.close(); } catch { /* */ } try { proc.kill(); } catch { /* */ } setTimeout(() => { try { rmSync(dir, { recursive: true, force: true }); } catch { /* */ } }, 1500); };
  return { send, ev, close, errs, trace, pid: proc.pid };
}

const REC = `(()=>{
  window.__walk={on:false,f:[],lt:[],mu:[]};
  addEventListener('DOMContentLoaded',()=>{try{new MutationObserver(l=>{const w=window.__walk;if(!w.on||w.mu.length>400)return;for(const m of l){const t=m.target;w.mu.push([performance.now(),m.type,(t.id||t.className||t.nodeName||'').toString().slice(0,40),m.attributeName||''])}}).observe(document.body,{subtree:true,attributes:true,childList:true,characterData:false})}catch(e){}});
  try{new PerformanceObserver(l=>{for(const e of l.getEntries())window.__walk.lt.push([Math.round(e.startTime),Math.round(e.duration)])}).observe({entryTypes:['longtask']})}catch(e){}
  const hk=()=>{const sc=window.__app&&window.__app.scene;if(!sc||!sc.game){setTimeout(hk,100);return}
    sc.game.events.on('postrender',()=>{const w=window.__walk;if(!w.on||!sc.sim)return;const lp=sc.game.loop,cam=sc.cameras.main,p=sc.sim.player,r=sc.rig;
      w.f.push([lp.now,lp.rawDelta,lp.delta,p.x,p.y,cam.scrollX,cam.scrollY,cam.zoom,r.phase,r.head?r.head.y:0,r.body?r.body.y:0,r.head?r.head.rotation:0,sc.sim.enemies.length,cam.originX*cam.width,sc.bState?sc.bState.ready:0])})};
  hk();
})()`;
const pct = (a, q) => { const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(q * s.length))]; };
const fstats = (a) => ({ n: a.length, avg: +(a.reduce((x, y) => x + y, 0) / a.length).toFixed(2), p50: +pct(a, 0.5).toFixed(1), p95: +pct(a, 0.95).toFixed(1), p99: +pct(a, 0.99).toFixed(1), max: +Math.max(...a).toFixed(1), g20: a.filter((x) => x > 20).length, g33: a.filter((x) => x > 33).length });

const dist = process.argv[2] || 'dist';
const srv = process.env.URL ? null : await serve(dist);
const base = process.env.URL || `http://127.0.0.1:${SPORT}/`;
const c = await launch();
const hero = process.env.HERO || 'wren';
const key = (type, k, code, vk) => c.send('Input.dispatchKeyEvent', { type, key: k, code, windowsVirtualKeyCode: vk });
const D = ['d', 'KeyD', 68], A = ['a', 'KeyA', 65], W = ['w', 'KeyW', 87], S = ['s', 'KeyS', 83];
try {
  const secs = Number(process.env.SECS || 10), inj = Number(process.env.INJ ?? 350);
  await c.send('Page.enable'); await c.send('Runtime.enable');
  await c.send('Page.bringToFront'); await c.send('Emulation.setFocusEmulationEnabled', { enabled: true });
  await c.send('Page.addScriptToEvaluateOnNewDocument', { source: REC });
  const t0n = Date.now();
  if (process.env.TITLE) { // sit on the title screen for TITLE seconds first (Matt's flow), then start the run
    await c.send('Page.navigate', { url: `${base}?style=a&seed=3&t=${process.env.T || 240}&god=1&debug=1` });
    for (let i = 0; i < 240; i++) { await sleep(250); try { if (await c.ev('!!(window.__app&&window.__app.scene&&window.__app.scene.bState)')) break; } catch { /* */ } }
    await sleep(Number(process.env.TITLE) * 1000);
    console.log('title bake', await c.ev('JSON.stringify({done:!!(window.__app.scene.bState.lazy&&window.__app.scene.bState.lazy.done),fade:window.__app.scene.bState.fade})'));
    await c.ev(`(()=>{window.__app.startRun('${hero}');return 1})()`);
  } else await c.send('Page.navigate', { url: `${base}?style=a&auto=${hero}&seed=3&t=${process.env.T || 240}&god=1&debug=1${process.env.FLAGS ? '&' + process.env.FLAGS : ''}` });
  for (let i = 0; i < 600; i++) { await sleep(250); try { if (await c.ev('!!(window.__app&&window.__app.sim&&window.__app.scene.rig)')) break; } catch { /* */ } }
  const bootMs = Date.now() - t0n;
  await c.ev(`window.__app.save.setSettings({quality:'${process.env.TIER || 'high'}'}); true`);
  const ginfo = await c.ev(`(()=>{const gl=document.createElement('canvas').getContext('webgl');const e=gl.getExtension('WEBGL_debug_renderer_info');return gl.getParameter(e.UNMASKED_RENDERER_WEBGL)})()`);
  if (process.env.EARLY) await c.ev('(()=>{window.__walk.on=true;return 1})()');
  if (process.env.CPUPROF) { await c.send('Profiler.enable'); await c.send('Profiler.setSamplingInterval', { interval: 200 }); await c.send('Profiler.start'); setTimeout(async () => { const { profile } = await c.send('Profiler.stop'); const self = new Map(); const byId = new Map(profile.nodes.map((n) => [n.id, n])); const dts = profile.timeDeltas; for (let i = 0; i < profile.samples.length; i++) { const cf = byId.get(profile.samples[i]).callFrame; const k = (cf.functionName || '(anon)') + ' ' + cf.url.split('/').pop().split('?')[0] + ':' + cf.lineNumber; self.set(k, (self.get(k) || 0) + (dts[i] || 0)); } const tot = [...self.values()].reduce((a, b) => a + b, 0); console.log('CPU SELF ms (first', process.env.CPUPROF, 's)', (tot / 1000).toFixed(0)); for (const [k, v] of [...self].sort((a, b) => b[1] - a[1]).slice(0, 25)) console.log('  ', (v / 1000).toFixed(0), 'ms', k); }, Number(process.env.CPUPROF) * 1000); }
  if (process.env.TRACE) await c.send('Tracing.start', { transferMode: 'ReportEvents', traceConfig: { includedCategories: ['devtools.timeline', 'v8', 'v8.execute', 'disabled-by-default-devtools.timeline', 'gpu', 'blink.console', 'disabled-by-default-v8.gc'] } });
  if (!process.env.EARLY) await c.ev(`(()=>{const a=window.__app,s=a.sim;s.xpNeeded=1e9;s.player.x=1500;s.player.y=2000;a.scene.cameras.main.centerOn(1500,2000);${inj ? '' : 's.enemies.length=0;s.updateSpawns=()=>{};'}return 1})()`);
  const fill = `(()=>{const a=window.__app,s=a.sim;if(s.state==='levelup'&&s.offer&&s.offer.cards[0])a.pick(s.offer.cards[0].key);${inj ? `const T=['wolf','crow','root_crawler'];let k=0;while(s.enemies.length<${inj}){const an=(k*2.399)%6.2832,dd=60+((k*37)%260);s.spawnEnemy(T[k%3],s.player.x+Math.cos(an)*dd,s.player.y+Math.sin(an)*dd);k++}` : 's.enemies.length=0;'}return 1})()`;
  if (!process.env.EARLY) await sleep(2500);
  if (process.env.STRIP) {
    // manual 60 Hz stepping: stop rAF, step the Phaser loop by hand, capture the hero after every frame
    const seqs = (process.env.SEQ || 'right,flip,stop,down').split(',');
    const shots = [];
    const zoom = Number(process.env.STRIPZ || 1);
    await c.ev('(()=>{const g=window.__game;g.loop.sleep();window.__T=performance.now();return 1})()');
    const stepN = async (n) => { for (let i = 0; i < n; i++) await c.ev(`(()=>{window.__T+=1000/60;window.__game.loop.step(window.__T);return 1})()`); };
    const shot = async () => {
      if (process.env.ISO) await c.ev(`(()=>{const sc=window.__app.scene,r=sc.rig;const keep=new Set([...(r.parts||[]),...(r.pupParts||[]),r.eGlow,r.pGlow,r.lGlow,r.cGlow,r.flat].filter(Boolean));for(const o of sc.children.list){if(!keep.has(o)&&o.visible){o.setVisible(false)}}sc.cameras.main.setBackgroundColor('#5d6b5a');document.querySelectorAll('.hud,#ui,.ui').forEach(e=>e.style.visibility='hidden');sc.game.renderer.snapshot&&0;sc.game.loop.step&&0;sc.sys.game.renderer.render&&0;return 1})()`), await c.ev(`(()=>{const g=window.__game;g.renderer.preRender();g.scene.render(g.renderer);g.renderer.postRender();return 1})()`);
      const r = await c.ev(`(()=>{const sc=window.__app.scene,cam=sc.cameras.main,p=sc.sim.player,cv=sc.game.canvas,b=cv.getBoundingClientRect(),k=b.width/cv.width;const sx=(cam.originX*cam.width+(p.x-cam.scrollX-cam.originX*cam.width)*cam.zoom)*k+b.left,sy=(cam.originY*cam.height+(p.y-4-cam.scrollY-cam.originY*cam.height)*cam.zoom)*k+b.top;return [sx,sy,cam.zoom*k]})()`);
      const half = Number(process.env.STRIPH || 20) * r[2];
      const { data } = await c.send('Page.captureScreenshot', { format: 'png', clip: { x: r[0] - half, y: r[1] - half * 1.15, width: half * 2, height: half * 2, scale: zoom } });
      return data;
    };
    for (const sq of seqs) {
      await fillOnce();
      const row = [];
      const hold = async (k, n, every = 1) => { await key('keyDown', k[0], k[1], k[2]); for (let i = 0; i < n; i++) { await stepN(every); if (row.length < 12) row.push(await shot()); } await key('keyUp', k[0], k[1], k[2]); };
      if (sq === 'right') { await key('keyDown', ...D); await stepN(60); await key('keyUp', ...D); await hold(D, 12, 2); }
      else if (sq === 'consec') { await key('keyDown', ...D); await stepN(60); await key('keyUp', ...D); await hold(D, 12, 1); }
      else if (sq === 'down') { await key('keyDown', ...S); await stepN(60); await key('keyUp', ...S); await hold(S, 12, 2); }
      else if (sq === 'flip') { await key('keyDown', ...D); await stepN(60); await key('keyUp', ...D); await hold(D, 4, 2); await hold(A, 8, 2); }
      else if (sq === 'stop') { await key('keyDown', ...D); await stepN(60); await key('keyUp', ...D); await hold(D, 3, 2); for (let i = 0; i < 6; i++) { await stepN(3); row.push(await shot()); } await hold(D, 3, 2); }
      await stepN(30);
      shots.push([sq, row]);
    }
    async function fillOnce() { await c.ev(fill); }
    // compose rows on a blank page (our own captured PNGs only) and capture once
    const html = `<body style="margin:0;background:#222;font:12px sans-serif;color:#ddd">${shots.map(([n, r]) => `<div style="display:flex;align-items:center;gap:2px;margin:2px"><div style="width:40px">${n}</div>${r.map((d) => `<img src="data:image/png;base64,${d}">`).join('')}</div>`).join('')}</body>`;
    await c.send('Page.navigate', { url: 'about:blank' }); await sleep(300);
    await c.ev(`(()=>{document.open();document.write(${JSON.stringify(html)});document.close();return 1})()`); await sleep(500);
    const dim = await c.ev('[document.body.scrollWidth,document.body.scrollHeight]');
    const { data } = await c.send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: dim[0], height: dim[1], scale: 1 }, captureBeyondViewport: true });
    writeFileSync(process.env.STRIP, Buffer.from(data, 'base64'));
    console.log('strip', process.env.STRIP, dim);
  } else {
    await c.ev(fill);
    if (!process.env.EARLY) await c.ev('(()=>{const w=window.__walk;w.f.length=0;w.lt.length=0;w.on=true;return 1})()');
    const half = secs * 500;
    for (const [k, ms] of [[D, half], [A, half]]) {
      await key('keyDown', k[0], k[1], k[2]);
      const t1 = Date.now(); while (Date.now() - t1 < ms) { await sleep(500); await c.ev(fill); }
      await key('keyUp', k[0], k[1], k[2]);
    }
    if (process.env.TRACE) {
      await c.send('Tracing.end'); for (let i = 0; i < 80 && !c.trace.done; i++) await sleep(250);
      const tr = c.trace; let t0 = Infinity; for (const e of tr) if (e.ts > 0 && e.ts < t0) t0 = e.ts;
      const big = tr.filter((e) => e.ph === 'X' && e.dur > 30000).sort((a, b) => a.ts - b.ts);
      for (const e of big.slice(0, 60)) console.log('  TR', ((e.ts - t0) / 1e6).toFixed(2) + 's', (e.dur / 1000).toFixed(0) + 'ms', e.cat, e.name, 'tid', e.tid, JSON.stringify(e.args?.data?.url || e.args?.data?.functionName || e.args?.type || '').slice(0, 60));
    }
    const o = JSON.parse(await c.ev('(()=>{const w=window.__walk;w.on=false;return JSON.stringify({f:w.f,lt:w.lt,mu:w.mu,tier:window.__app.scene.quality.tier})})()'));
    if (process.env.JSON) writeFileSync(process.env.JSON, JSON.stringify(o.f));
    const raw = o.f.slice(1).map((r) => r[1]);
    const an = analyzeWalk(o.f);
    console.log(JSON.stringify({ label: process.env.LABEL || '', hero, url: base, gpu: ginfo, headless: !!process.env.HEADLESS, tier: o.tier, enemies: o.f.length ? o.f[o.f.length - 1][12] : 0, bootMs, pid: c.pid }));
    console.log('frame ', JSON.stringify(fstats(raw)));
    console.log('walk  ', JSON.stringify(an));
    if (process.env.EARLY) { const t0 = o.f[0][0]; let rd = -1; for (const r of o.f) if (rd < 0 && r[14] > 0) rd = r[0]; console.log('B tiles ready at s', rd < 0 ? 'never' : ((rd - t0) / 1000).toFixed(2), '| frames >25ms (s:ms):', o.f.filter((r) => r[1] > 25).map((r) => ((r[0] - t0) / 1000).toFixed(2) + ':' + r[1].toFixed(0)).join(' ')); }
    if (process.env.EARLY) { const t0 = o.f[0][0]; const seen = new Set(); console.log('DOM changes (first of each kind):', o.mu.filter((m) => { const k = m[2] + m[3]; if (seen.has(k)) return false; seen.add(k); return true; }).map((m) => ((m[0] - t0) / 1000).toFixed(2) + ' ' + m[2] + ' ' + m[3]).join(' | ')); }
    console.log('longtasks', o.lt.length, 'sum ms', o.lt.reduce((a, b) => a + b[1], 0));
  }
  console.log('console errors/warnings', c.errs.length, JSON.stringify(c.errs.slice(0, 6)));
} finally { c.close(); if (srv) srv.close(); }
