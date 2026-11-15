// FIX4 real-device perf probe (?perf=1). Render-side only; nothing is stored or sent. A tiny on-screen overlay (frame ms, worst frame in the last
// 10 s, JS heap if the browser has it, the lazy-work label) and a "long frames" list (>50 ms) tagged with whatever lazy work ran in the frame before:
// texture bakes, canvas creation, ground tile paint, first use of a weapon/effect/audio cue, pool growth. Off by default: every call is a cheap no-op.
export const LONG_MS = 50;

/** Nearest common refresh rate for a median rAF interval (ms); 0 if none fits within 6%. */
export function refreshHz(ms) {
  if (!(ms > 0)) return 0;
  const hz = 1000 / ms;
  for (const c of [30, 40, 48, 60, 72, 90, 120, 144]) if (Math.abs(hz - c) / c < 0.06) return c;
  return 0;
}

/** Plain-words reading of one probe window. frame = Phaser callback interval, work = our CPU ms, raf = raw rAF median, gpu = gl.finish wait (-1 if off). */
export function verdict(frame, work, raf, gpu = -1) {
  if (!(frame > 0) || !(raf > 0)) return '';
  if (raf > 28 && work < raf * 0.6) return 'browser draws ~30 Hz (Low Power Mode or screen cap?)';
  if (work > raf * 0.85) return 'CPU bound (our JS)';
  if (gpu >= 0 && work + gpu > raf * 0.85) return 'GPU bound';
  if (frame > raf * 1.3) return 'frames lost outside our JS (GPU / compositor)';
  return 'ok';
}

export const probe = {
  on: false,
  tags: [], // [label, ms] collected since the last frame boundary
  seen: new Set(),
  long: [], // { at, ms, tags }
  frames: [], // [runSeconds, ms] for the current run (first 60 s), read by __probe.report()
  worst: new Float32Array(600), wi: 0, wn: 0,
  label: '', labelAt: 0,
  runT0: 0, last: 0, el: null, listEl: null, acc: 0, af: 0, am: 0,
  // IPHONE-PERF: CPU work per frame split by section (summed over the 0.5 s display window), the raw browser rAF interval (refresh rate)
  // next to Phaser's callback interval, and with &gpu=1 a gl.finish() wait after each render (GPU time; changes timing, diagnosis only).
  cur: { sim: 0, hud: 0 }, sum: { work: 0, sim: 0, hud: 0, app: 0, draw: 0, fx: 0, render: 0, gpu: 0, n: 0 },
  raf: new Float32Array(240), ri: 0, rn: 0, rafLast: 0, rafOn: false, gpu: false,

  /** Add ms to a section of the current frame (sim step, HUD writes). */
  add(k, ms) { if (this.on) this.cur[k] += ms; },
  /** Call at POST_RENDER: work = PRE_STEP..POST_RENDER, render = Phaser render, sec = RunScene section timers (0 app.frame, 1 draw, 7 tickFx). */
  endFrame(work, render, sec, gl) {
    if (!this.on) return;
    const s = this.sum, c = this.cur;
    let gpu = 0;
    if (this.gpu && gl && gl.finish) { const t = performance.now(); gl.finish(); gpu = performance.now() - t; }
    s.work += work; s.render += render; s.gpu += gpu; s.sim += c.sim; s.hud += c.hud;
    if (sec) { s.app += Math.max(0, sec[0] - c.sim - c.hud); s.draw += sec[1]; s.fx += sec[7]; }
    s.n++; c.sim = 0; c.hud = 0;
  },
  /** Raw requestAnimationFrame loop (independent of Phaser's frame limiter): the browser's real frame cadence. */
  startRaf() {
    if (!this.on || this.rafOn || typeof requestAnimationFrame !== 'function') return;
    this.rafOn = true;
    const tick = (t) => { if (this.rafLast && t > this.rafLast) { this.raf[this.ri] = t - this.rafLast; this.ri = (this.ri + 1) % this.raf.length; if (this.rn < this.raf.length) this.rn++; } this.rafLast = t; requestAnimationFrame(tick); };
    requestAnimationFrame(tick);
  },
  /** Median raw rAF interval (ms) and the refresh rate it implies (0 if unknown). */
  rafStats() {
    if (this.rn < 10) return { med: 0, hz: 0 };
    const a = Array.from(this.raf.subarray(0, this.rn)).sort((x, y) => x - y), med = a[a.length >> 1];
    return { med, hz: refreshHz(med) };
  },

  /** Record that lazy work ran (optionally how long it took). */
  tag(label, ms = 0) { if (!this.on) return; if (this.tags.length < 24) this.tags.push([label, ms]); this.label = label; this.labelAt = performance.now(); },
  /** Tag only the first time `label` is seen (first use of a weapon / effect / cue). */
  first(label) { if (!this.on || this.seen.has(label)) return; this.seen.add(label); this.tag('first:' + label); },
  /** Time fn and tag it. */
  span(label, fn) { if (!this.on) return fn(); const t = performance.now(); try { return fn(); } finally { this.tag(label, performance.now() - t); } },

  runStart() { this.runT0 = performance.now(); this.frames.length = 0; this.long.length = 0; this.tags.length = 0; },

  /** Patch the texture/canvas creators so every bake is tagged without touching each module. */
  hook(scene) {
    if (!this.on || this.hooked) return;
    this.hooked = true; this.scene = scene;
    const tm = scene.textures, self = this;
    for (const name of ['addCanvas', 'createCanvas', 'addBase64', 'addImage']) {
      const orig = tm[name];
      if (typeof orig !== 'function') continue;
      tm[name] = function (key, ...a) { const t = performance.now(); const r = orig.call(this, key, ...a); self.tag('texture:' + name + ':' + (typeof key === 'string' ? key : '?'), performance.now() - t); return r; };
    }
    try { // Graphics.generateTexture (texture bakes from vector drawing)
      const g = scene.add.graphics(), proto = Object.getPrototypeOf(g); g.destroy();
      const og = proto.generateTexture;
      if (typeof og === 'function') proto.generateTexture = function (key, ...a) { const t = performance.now(); const r = og.call(this, key, ...a); self.tag('texture:generateTexture:' + (typeof key === 'string' ? key : '?'), performance.now() - t); return r; };
    } catch { /* probe only */ }
    const origCreate = document.createElement.bind(document);
    document.createElement = function (tag, ...r) { const el = origCreate(tag, ...r); if (String(tag).toLowerCase() === 'canvas') self.tag('canvas:create'); return el; };
  },

  mount(parent) {
    if (!this.on || this.el) return;
    const el = document.createElement('div');
    el.setAttribute('data-probe', '1');
    el.style.cssText = 'position:fixed;left:4px;top:4px;z-index:99999;pointer-events:none;font:10px/1.25 ui-monospace,Consolas,monospace;color:#ffe9b8;background:rgba(10,12,20,.72);padding:3px 5px;border-radius:4px;max-width:92vw;white-space:pre;';
    (parent || document.body).appendChild(el);
    this.el = el;
  },

  /** Call once per rendered frame (Phaser PRE_STEP). */
  frame(now) {
    if (!this.on) return;
    const dt = this.last ? now - this.last : 0;
    this.last = now;
    if (!(dt > 0)) return;
    this.worst[this.wi] = dt; this.wi = (this.wi + 1) % 600; if (this.wn < 600) this.wn++;
    const rs = this.runT0 ? (now - this.runT0) / 1000 : -1;
    if (rs >= 0 && rs < 60 && this.frames.length < 4000) this.frames.push([rs, dt]);
    if (dt > LONG_MS && dt < 10000) {
      this.long.unshift({ at: rs, ms: dt, tags: this.tags.map(([l, ms]) => (ms >= 1 ? l + ' ' + ms.toFixed(0) + 'ms' : l)) });
      if (this.long.length > 40) this.long.length = 40;
    }
    this.tags.length = 0;
    this.af++; this.am += dt; this.acc += dt;
    if (this.acc >= 500) this.render(now);
  },

  render(now) {
    const avg = this.am / Math.max(1, this.af);
    let worst = 0; for (let i = 0; i < this.wn; i++) if (this.worst[i] > worst) worst = this.worst[i];
    const m = typeof performance !== 'undefined' && performance.memory ? performance.memory.usedJSHeapSize / 1048576 : -1;
    let tex = ''; if (this.scene) { try { let b = 0; const L = this.scene.textures.list; for (const k in L) for (const r of L[k].source || []) b += (r.width || 0) * (r.height || 0) * 4; tex = '  tex ~' + ((b * 2) / 1048576).toFixed(0) + ' MB'; } catch (e) { tex = ''; } }
    let st = ''; try { if (this.status) st = '\n' + this.status(); } catch (e) { st = ''; }
    const lazy = now - this.labelAt < 3000 ? this.label : '-';
    let s = 'frame ' + avg.toFixed(1) + ' ms  worst10s ' + worst.toFixed(0) + ' ms  heap ' + (m >= 0 ? m.toFixed(0) + ' MB' : 'n/a') + tex + st + '\n' + this.splitLine(avg) + '\nlazy: ' + lazy + '\nlong frames (>' + LONG_MS + ' ms): ' + this.long.length;
    const S = this.sum; S.work = 0; S.sim = 0; S.hud = 0; S.app = 0; S.draw = 0; S.fx = 0; S.render = 0; S.gpu = 0; S.n = 0;
    for (const l of this.long.slice(0, 8)) s += '\n ' + (l.at >= 0 ? l.at.toFixed(1) + 's ' : '') + l.ms.toFixed(0) + 'ms ' + (l.tags.length ? l.tags.slice(0, 4).join(', ') : '(no tag)');
    if (this.el) this.el.textContent = s; // textContent only: tags are our own labels, never untrusted input
    this.acc = 0; this.af = 0; this.am = 0;
  },

  /** IPHONE-PERF line: CPU work split, raw rAF cadence vs Phaser callback interval, and a plain verdict. */
  splitLine(frameAvg) {
    const S = this.sum, n = Math.max(1, S.n), f = (x) => (x / n).toFixed(1), r = this.rafStats();
    const work = S.work / n;
    let s = 'cpu ' + work.toFixed(1) + ' ms/f (sim ' + f(S.sim) + ' hud ' + f(S.hud) + ' app ' + f(S.app) + ' draw ' + f(S.draw) + ' fx ' + f(S.fx) + ' render ' + f(S.render) + ')' + (this.gpu ? ' gpu ' + f(S.gpu) : '');
    s += '\nrAF ' + (r.med ? r.med.toFixed(1) + ' ms (' + (r.hz || '?') + ' Hz)' : '-') + '  cb ' + frameAvg.toFixed(1) + '  idle ' + Math.max(0, frameAvg - work).toFixed(1) + '  ' + verdict(frameAvg, work, r.med, this.gpu ? S.gpu / n : -1);
    return s;
  },

  /** p95 / max of the run's frames in [from, to) seconds (for measurement scripts). */
  report(from = 0, to = 20) {
    const a = this.frames.filter(([t]) => t >= from && t < to).map(([, d]) => d).sort((x, y) => x - y);
    if (!a.length) return { n: 0 };
    return { n: a.length, p50: a[Math.floor(a.length * 0.5)], p95: a[Math.floor(a.length * 0.95)], max: a[a.length - 1], long: a.filter((d) => d > LONG_MS).length, tagged: this.long.map((l) => ({ at: l.at, ms: l.ms, tags: l.tags })) };
  },
};
