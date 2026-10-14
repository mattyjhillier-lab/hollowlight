// Spike entry. Params: mode=a|b|bake  q=high|low  n=<enemy top-up>  t=<start sec>  boss=1  pre=<life prefill secs>
//   life=0|1  hud=0|1  sync=1 (gl.finish each frame so work-ms includes GPU)  seed=<int>
import { Drive } from './common/drive.js';
import { LifeMap } from './common/life.js';

const q = new URLSearchParams(location.search);
const num = (k, d) => (q.has(k) ? Number(q.get(k)) : d);
const mode = q.get('mode') || 'a';
const quality = q.get('q') || 'high';
const stage = document.getElementById('stage');
const hud = document.getElementById('hud');

const w = innerWidth, h = innerHeight, dpr = devicePixelRatio || 1;
const stats = { frames: 0, rafDt: [], work: [], sim: [], calls: 0, tris: 0, lifeMs: [], n: 0 };
let paused = false;

async function main() {
  if (mode === 'bake') {
    const { runBake } = await import('./b/bake.js');
    return runBake(stage);
  }
  const drive = new Drive({ seed: num('seed', 1), t: num('t', 300), n: num('n', 0) });
  const life = new LifeMap(drive.sim.balance.worldSize);
  const pre = num('pre', 0);
  if (pre > 0) drive.fastForward(pre, (dt) => life.update(drive.sim, dt));
  if (q.get('boss')) drive.sim.spawnEnemy('elder_treant', drive.sim.player.x + 70, drive.sim.player.y + 60);
  const canvas = document.createElement('canvas');
  stage.appendChild(canvas);
  const lifeOn = q.get('life') !== '0';
  let R;
  const phone = Math.min(w, h) < 600;
  if (mode === 'a') {
    const { createA } = await import('./a/scene3d.js');
    R = await createA({ canvas, drive, life, quality, width: w, height: h, dpr, phone, lifeOn });
  } else {
    const { createB } = await import('./b/scene2d.js');
    R = await createB({ stage, canvas, drive, life, quality, width: w, height: h, dpr, phone, lifeOn });
  }
  const sync = q.get('sync') === '1';
  const gl = R.gl;
  let last = performance.now();
  let lifeAcc = 0;
  const loop = (now) => {
    requestAnimationFrame(loop);
    if (paused) return;
    const dt = Math.max(0.0005, Math.min(0.1, (now - last) / 1000));
    stats.rafDt.push(now - last);
    last = now;
    const t0 = performance.now();
    drive.advance(dt);
    const t1 = performance.now();
    if (lifeOn) life.update(drive.sim, dt);
    const t2 = performance.now();
    const r = R.frame(dt);
    if (sync && gl) gl.finish();
    const t3 = performance.now();
    stats.sim.push(t1 - t0); stats.lifeMs.push(t2 - t1); stats.work.push(t3 - t2);
    stats.calls += r.calls; stats.tris += r.tris; stats.n++;
    stats.enemies = drive.sim.enemies.length;
    if (hud && q.get('hud') === '1') hud.textContent = `${mode} ${quality}  enemies ${drive.sim.enemies.length}  calls ${r.calls}  tris ${r.tris}`;
  };
  requestAnimationFrame(loop);
  window.__spike = {
    drive, life, R, mode, quality,
    reset() { stats.rafDt = []; stats.work = []; stats.sim = []; stats.lifeMs = []; stats.calls = 0; stats.tris = 0; stats.n = 0; },
    setN(n) { drive.target = n; },
    setQuality(v) { R.setQuality(v); },
    summary() {
      const s = (a) => { const b = [...a].sort((x, y) => x - y); const m = b.reduce((x, y) => x + y, 0) / (b.length || 1); return { avg: +m.toFixed(2), p50: +(b[b.length >> 1] || 0).toFixed(2), p95: +(b[Math.floor(b.length * 0.95)] || 0).toFixed(2) }; };
      const dts = stats.rafDt.slice(2);
      return { frames: stats.n, fps: +(1000 / (dts.reduce((a, b) => a + b, 0) / (dts.length || 1))).toFixed(1), rafMs: s(dts), workMs: s(stats.work), simMs: s(stats.sim), lifeMs: s(stats.lifeMs), calls: Math.round(stats.calls / (stats.n || 1)), tris: Math.round(stats.tris / (stats.n || 1)), enemies: stats.enemies, info: R.info?.() };
    },
  };
  window.__spikeReady = true;
}
main().catch((e) => { console.error('SPIKE FAIL', e && e.stack || e); window.__spikeErr = String(e && e.stack || e); });
