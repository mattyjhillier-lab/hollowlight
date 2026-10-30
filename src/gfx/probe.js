// FIX4 real-device perf probe (?perf=1). Render-side only; nothing is stored or sent. A tiny on-screen overlay (frame ms, worst frame in the last
// 10 s, JS heap if the browser has it, the lazy-work label) and a "long frames" list (>50 ms) tagged with whatever lazy work ran in the frame before:
// texture bakes, canvas creation, ground tile paint, first use of a weapon/effect/audio cue, pool growth. Off by default: every call is a cheap no-op.
export const LONG_MS = 50;

export const probe = {
  on: false,
  tags: [], // [label, ms] collected since the last frame boundary
  seen: new Set(),
  long: [], // { at, ms, tags }
  frames: [], // [runSeconds, ms] for the current run (first 60 s), read by __probe.report()
  worst: new Float32Array(600), wi: 0, wn: 0,
  label: '', labelAt: 0,
  runT0: 0, last: 0, el: null, listEl: null, acc: 0, af: 0, am: 0,

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
    const lazy = now - this.labelAt < 3000 ? this.label : '-';
    let s = 'frame ' + avg.toFixed(1) + ' ms  worst10s ' + worst.toFixed(0) + ' ms  heap ' + (m >= 0 ? m.toFixed(0) + ' MB' : 'n/a') + tex + '\nlazy: ' + lazy + '\nlong frames (>' + LONG_MS + ' ms): ' + this.long.length;
    for (const l of this.long.slice(0, 8)) s += '\n ' + (l.at >= 0 ? l.at.toFixed(1) + 's ' : '') + l.ms.toFixed(0) + 'ms ' + (l.tags.length ? l.tags.slice(0, 4).join(', ') : '(no tag)');
    if (this.el) this.el.textContent = s; // textContent only: tags are our own labels, never untrusted input
    this.acc = 0; this.af = 0; this.am = 0;
  },

  /** p95 / max of the run's frames in [from, to) seconds (for measurement scripts). */
  report(from = 0, to = 20) {
    const a = this.frames.filter(([t]) => t >= from && t < to).map(([, d]) => d).sort((x, y) => x - y);
    if (!a.length) return { n: 0 };
    return { n: a.length, p50: a[Math.floor(a.length * 0.5)], p95: a[Math.floor(a.length * 0.95)], max: a[a.length - 1], long: a.filter((d) => d > LONG_MS).length, tagged: this.long.map((l) => ({ at: l.at, ms: l.ms, tags: l.tags })) };
  },
};
