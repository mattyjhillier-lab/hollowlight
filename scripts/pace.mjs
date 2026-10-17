// Frame-pacing harness (real GPU, headed Chrome by default). Records per-frame rAF deltas, long tasks, Phaser loop delta/rawDelta
// while the hero walks through restored ground with N enemies. Own port + static server; kills only its own Chrome.
//   node scripts/pace.mjs [dist] ; env: FLAGS="ground=flat&sway=0" SECS=30 INJ=350 T=240 TIER=high HEADLESS=1 ANGLE=d3d11 LABEL=x URL=http://127.0.0.1:4195/ (use another server instead of dist)
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { mkdtempSync, existsSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, extname, resolve } from 'node:path';

const CHROME = [process.env.CHROME, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'].find((p) => p && existsSync(p));
const CPORT = 9482, SPORT = 4195;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.webmanifest': 'application/manifest+json', '.css': 'text/css' };
const GRANT = 'holy_orbit:power=3;ghost_wolves:speed=3,power=3;raven_flock:power=3;spirit_bolts:power=3,pierce=2';
const serve = (dir) => { const root = resolve(dir); const srv = createServer((req, res) => { let p = decodeURIComponent((req.url || '/').split('?')[0]); if (p === '/') p = '/index.html'; const f = resolve(join(root, p)); if (!f.startsWith(root) || !existsSync(f)) { res.writeHead(404); res.end(); return; } res.writeHead(200, { 'content-type': MIME[extname(f)] || 'application/octet-stream' }); res.end(readFileSync(f)); }); return new Promise((r) => srv.listen(SPORT, '127.0.0.1', () => r(srv))); };

async function launch() {
  const dir = mkdtempSync(join(tmpdir(), 'hl-pace-'));
  const args = [`--remote-debugging-port=${CPORT}`, `--user-data-dir=${dir}`, '--no-first-run', '--disable-extensions', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows', '--window-size=1300,820', '--window-position=40,40', `--use-angle=${process.env.ANGLE || 'd3d11'}`, '--ignore-gpu-blocklist', '--enable-precise-memory-info', '--disable-features=CalculateNativeWinOcclusion', 'about:blank'];
  if (process.env.HEADLESS) args.unshift('--headless=new');
  const proc = spawn(CHROME, args, { stdio: 'ignore' });
  for (let i = 0; i < 60; i++) { try { const r = await fetch(`http://127.0.0.1:${CPORT}/json/version`); if (r.ok) break; } catch { /* retry */ } await sleep(250); }
  const tabs = await (await fetch(`http://127.0.0.1:${CPORT}/json/list`)).json();
  const ws = new WebSocket(tabs.find((t) => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener('open', r));
  let id = 0; const pending = new Map();
  ws.addEventListener('message', (m) => { const d = JSON.parse(m.data); if (d.method === 'Runtime.exceptionThrown') console.error('PAGE EXC', d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text); if (d.id && pending.has(d.id)) { const p = pending.get(d.id); pending.delete(d.id); d.error ? p.rej(new Error(d.error.message)) : p.res(d.result); } });
  const send = (method, params = {}) => new Promise((res, rej) => { const i = ++id; pending.set(i, { res, rej }); ws.send(JSON.stringify({ id: i, method, params })); });
  const ev = async (expr) => { const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true }); if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + ' ' + (r.exceptionDetails.exception?.description || '')); return r.result.value; };
  const close = () => { try { ws.close(); } catch { /* */ } try { proc.kill(); } catch { /* */ } setTimeout(() => { try { rmSync(dir, { recursive: true, force: true }); } catch { /* */ } }, 1500); };
  return { send, ev, close };
}

const REC = `(()=>{
  window.__pace={d:[],raw:[],sm:[],lt:[],on:false,last:0};
  try{new PerformanceObserver(l=>{for(const e of l.getEntries())window.__pace.lt.push([Math.round(e.startTime),Math.round(e.duration)])}).observe({entryTypes:['longtask']})}catch(e){}
  const f=t=>{const p=window.__pace;if(p.on&&p.last){p.d.push(t-p.last);const lp=window.__app&&window.__app.scene&&window.__app.scene.game.loop;if(lp){p.raw.push(lp.rawDelta);p.sm.push(lp.delta)}}p.last=t;requestAnimationFrame(f)};
  requestAnimationFrame(f);
  const hk=()=>{const sc=window.__app&&window.__app.scene;if(!sc||!sc.game){setTimeout(hk,200);return}
    window.__pace.fr=[];sc.game.events.on('postrender',()=>{const p=window.__pace;if(!p.on)return;const lp=sc.game.loop;p.fr.push([+lp.rawDelta.toFixed(1),+sc.workMs.toFixed(1),...(sc.sec?Array.from(sc.sec,v=>+v.toFixed(1)):[0,0,0,0,0,0,0,0,0,0]),sc.quality.tier,sc.sim?sc.sim.enemies.length:0,performance.memory.usedJSHeapSize])})};
  hk();
})()`;
const pct = (a, q) => { const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(q * s.length))]; };
const stats = (a) => ({ n: a.length, avg: +(a.reduce((x, y) => x + y, 0) / a.length).toFixed(2), p50: +pct(a, 0.5).toFixed(1), p95: +pct(a, 0.95).toFixed(1), p99: +pct(a, 0.99).toFixed(1), max: +Math.max(...a).toFixed(1), g20: a.filter((x) => x > 20).length, g33: a.filter((x) => x > 33).length, g50: a.filter((x) => x > 50).length });

const dist = process.argv[2] || 'dist';
const srv = process.env.URL ? null : await serve(dist);
const base = process.env.URL || `http://127.0.0.1:${SPORT}/`;
const c = await launch();
try {
  const secs = Number(process.env.SECS || 30), inj = Number(process.env.INJ ?? 350);
  await c.send('Page.enable'); await c.send('Runtime.enable'); if (process.env.SIZE) { const [w, h, d] = process.env.SIZE.split(',').map(Number); await c.send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: d, mobile: false }); }
  await c.send('Page.bringToFront'); await c.send('Emulation.setFocusEmulationEnabled', { enabled: true });
  await c.send('Page.addScriptToEvaluateOnNewDocument', { source: REC });
  const url = `${base}?style=a&auto=wren&seed=3&t=${process.env.T || 240}&god=1&debug=1&mem=1&grant=${GRANT}${process.env.FLAGS ? '&' + process.env.FLAGS : ''}`;
  await c.send('Page.navigate', { url });
  for (let i = 0; i < 120; i++) { await sleep(250); try { if (await c.ev('!!(window.__app&&window.__app.sim)')) break; } catch { /* */ } }
  if (process.env.TIER && !process.env.EARLY) await c.ev(`window.__app.save.setSettings({quality:'${process.env.TIER}'}); true`);
  if (process.env.CSS) await c.ev(`(()=>{const st=document.createElement('style');st.textContent=${JSON.stringify(process.env.CSS)};document.head.appendChild(st);return 1})()`);
  if (process.env.HIDE) await c.ev(`(()=>{const st=document.createElement('style');st.textContent='${process.env.HIDE}{display:none!important}';document.head.appendChild(st);return 1})()`);
  const ginfo = await c.ev(`(()=>{const gl=document.createElement('canvas').getContext('webgl');const e=gl.getExtension('WEBGL_debug_renderer_info');return gl.getParameter(e.UNMASKED_RENDERER_WEBGL)})()`);
  if (!process.env.EARLY) await c.ev(`(()=>{const a=window.__app,s=a.sim;s.xpNeeded=1e9;s.player.x=2000;s.player.y=1000;a.scene.cameras.main.centerOn(2000,1000);return 1})()`);
  const key = (type, k, code, vk) => c.send('Input.dispatchKeyEvent', { type, key: k, code, windowsVirtualKeyCode: vk });
  const dirs = [['d', 'KeyD', 68], ['s', 'KeyS', 83], ['a', 'KeyA', 65], ['w', 'KeyW', 87]];
  if (!process.env.EARLY) await sleep(3000);
  await c.ev('(()=>{const p=window.__pace;p.d.length=0;(p.fr||[]).length=0;p.raw.length=0;p.sm.length=0;p.lt.length=0;p.on=true;window.__app.scene.secA&&window.__app.scene.secA.fill(0);return 1})()');
  if (process.env.CPUPROF) { await c.send('Profiler.enable'); await c.send('Profiler.setSamplingInterval', { interval: 500 }); await c.send('Profiler.start'); }
  if (process.env.PROF) { await c.send('HeapProfiler.enable'); await c.send('HeapProfiler.startSampling', { samplingInterval: 2048, includeObjectsCollectedByMajorGC: true, includeObjectsCollectedByMinorGC: true }); }
  await c.send('Performance.enable'); const pm = async () => Object.fromEntries((await c.send('Performance.getMetrics')).metrics.map((m) => [m.name, m.value])); const m0 = await pm();
  const t0 = Date.now(); let di = 0;
  while (Date.now() - t0 < secs * 1000) {
    const d = dirs[di++ % 4];
    await key('keyDown', d[0], d[1], d[2]);
    for (let k = 0; k < 6; k++) {
      await sleep(500);
      if (inj) await c.ev(`(()=>{const a=window.__app,s=a.sim;if(s.state==='levelup'&&s.offer&&s.offer.cards[0])a.pick(s.offer.cards[0].key);const T=['wolf','crow','root_crawler'];let k=0;while(s.enemies.length<${inj}){const an=(k*2.399)%6.2832,dd=50+((k*37)%260);s.spawnEnemy(T[k%3],s.player.x+Math.cos(an)*dd,s.player.y+Math.sin(an)*dd);k++}return 1})()`);
    }
    await key('keyUp', d[0], d[1], d[2]);
  }
  console.log('vis', await c.ev('document.visibilityState+" "+document.hasFocus()'));
  if (process.env.CPUPROF) {
    const { profile } = await c.send('Profiler.stop'); const self = new Map(); const byId = new Map(profile.nodes.map((n) => [n.id, n]));
    const dts = profile.timeDeltas; for (let i = 0; i < profile.samples.length; i++) { const n = byId.get(profile.samples[i]); const cf = n.callFrame; const k = (cf.functionName || '(anon)') + ' ' + cf.url.split('/').pop().split('?')[0] + ':' + cf.lineNumber; self.set(k, (self.get(k) || 0) + (dts[i] || 0)); }
    const tot = [...self.values()].reduce((a, b) => a + b, 0); console.log('CPU SELF total ms', (tot / 1000).toFixed(0)); for (const [k, v] of [...self].sort((a, b) => b[1] - a[1]).slice(0, 28)) console.log('  ', (v / 1000).toFixed(0), 'ms', (100 * v / tot).toFixed(1) + '%', k);
  }
  if (process.env.PROF) {
    const { profile } = await c.send('HeapProfiler.stopSampling'); const agg = new Map();
    const walk = (n) => { const cf = n.callFrame; const k = (cf.functionName || '(anon)') + ' ' + cf.url.split('/').pop().split('?')[0] + ':' + cf.lineNumber; agg.set(k, (agg.get(k) || 0) + n.selfSize); for (const ch of n.children) walk(ch); };
    walk(profile.head); const tot = [...agg.values()].reduce((a, b) => a + b, 0);
    console.log('HEAP SAMPLES total MB', (tot / 1e6).toFixed(1)); for (const [k, v] of [...agg].sort((a, b) => b[1] - a[1]).slice(0, 30)) console.log('  ', (v / 1e6).toFixed(2), 'MB', k);
  }
  const r = await c.ev('(()=>{const p=window.__pace;p.on=false;return JSON.stringify({fr:p.fr,d:p.d,raw:p.raw,sm:p.sm,lt:p.lt,tier:window.__app.scene.quality.tier,gb:window.__app.scene.gbOn,en:window.__app.sim.enemies.length,x:window.__app.sim.player.x|0,y:window.__app.sim.player.y|0})})()');
  const o = JSON.parse(r);
  console.log(JSON.stringify({ label: process.env.LABEL || '', flags: process.env.FLAGS || '', gpu: ginfo, headless: !!process.env.HEADLESS, tier: o.tier, gb: o.gb, enemies: o.en, pos: [o.x, o.y] }));
  console.log('rAF  ', JSON.stringify(stats(o.d)));
  console.log('raw  ', JSON.stringify(stats(o.raw)));
  console.log('smoth', JSON.stringify(stats(o.sm)));
  const fr = o.fr; let tc = 0; for (let i = 1; i < fr.length; i++) if (fr[i][12] !== fr[i - 1][12]) tc++;
  console.log('tier changes', tc, 'frames', fr.length);
  console.log('SECTION ms avg/p95/max  [sim draw life sway props rib lmflush fx]:');
  const names = ['sim', 'draw', 'life', 'sway', 'props', 'rib', 'lmfl', 'fx', 'air'];
  console.log(names.map((n, k) => { const a = fr.map((r) => r[2 + k]); return n + ' ' + (a.reduce((x, y) => x + y, 0) / a.length).toFixed(2) + '/' + pct(a, 0.95).toFixed(1) + '/' + Math.max(...a).toFixed(1); }).join('  '));
  if (false) {} const work = fr.map((r) => r[1]); console.log('work avg/p95/p99/max', (work.reduce((x, y) => x + y, 0) / work.length).toFixed(2), pct(work, 0.95), pct(work, 0.99), Math.max(...work));
  let shown = 0; for (let i = 1; i < fr.length && shown < 14; i++) if (fr[i][0] > 25) { shown++; const f = fr[i], q = fr[i - 1]; console.log(' spike', f[0], 'ms | prev work', q[1], 'sec', q.slice(2, 10).join(','), '| this work', f[1], 'sec', f.slice(2, 10).join(','), f[12]); }
  { let al = 0, gcs = 0, gcMax = 0; for (let i = 1; i < fr.length; i++) { const d = fr[i][14] - fr[i - 1][14]; if (d > 0) al += d; else if (d < -1e6) { gcs++; gcMax = Math.max(gcMax, -d); } }
    const secs2 = fr.length / 60; console.log('alloc MB/s', (al / 1e6 / secs2).toFixed(2), 'GC drops', gcs, 'biggest MB', (gcMax / 1e6).toFixed(1), 'heap MB', (fr[fr.length - 1][14] / 1e6).toFixed(0)); }
  console.log('alloc by section (MB/s):', (await c.ev('JSON.stringify(Array.from(window.__app.scene.secA||[],v=>+(v/1e6/' + (secs) + ').toFixed(2)))')));
  console.log('scene', await c.ev(`(()=>{const sc=window.__app.scene;const r=sc.perf.rec;const dl=sc.children.list.length;let vis=0;const by={};for(const o of sc.children.list){if(o.visible&&o.alpha>0){vis++;const k=(o.texture&&o.texture.key)||o.type;by[k]=(by[k]||0)+1}}const top=Object.entries(by).sort((a,b)=>b[1]-a[1]).slice(0,14);return JSON.stringify({sprites:r.sprites,calls:r.calls,displayList:dl,visible:vis,top,dpr:devicePixelRatio,canvas:[sc.game.canvas.width,sc.game.canvas.height]})})()`));
  { const m1 = await pm(); const dd = (k) => ((m1[k] - m0[k]) * 1000 / secs).toFixed(0); console.log('main-thread ms per sec: task', dd('TaskDuration'), 'script', dd('ScriptDuration'), 'layout', dd('LayoutDuration'), 'style', dd('RecalcStyleDuration'), 'layoutCount/s', ((m1.LayoutCount - m0.LayoutCount) / secs).toFixed(0), 'styleRecalc/s', ((m1.RecalcStyleCount - m0.RecalcStyleCount) / secs).toFixed(0)); }
  console.log('longtasks', o.lt.length, JSON.stringify(o.lt.slice(0, 12)));
} finally { c.close(); if (srv) srv.close(); }
