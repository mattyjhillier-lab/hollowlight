// Debug overlay: fps, frame ms, CPU work ms, sprite/particle counts, draw calls. Off by default.
export class PerfOverlay {
  constructor(parent) {
    this.el = document.createElement('div');
    this.el.className = 'perf';
    parent.appendChild(this.el);
    this.on = false;
    this.acc = 0;
    this.frames = 0;
    this.sumMs = 0;
    this.sumWork = 0;
    this.maxMs = 0;
    this.calls = 0;
    this.lastCalls = 0;
    this.hooked = null;
    this.ring = new Float32Array(600); // last ~10 s of frame intervals (ms) for p95 / long-frame counts
    this.scratch = new Float32Array(600);
    this.ri = 0;
    this.rn = 0;
    this.rec = null; // optional sample recorder for measurement runs
  }

  toggle(force) {
    this.on = force === undefined ? !this.on : !!force;
    this.el.style.display = this.on ? 'block' : 'none';
    this.acc = 0;
  }

  // Count batch flushes (~draw calls). Phaser has no public counter; debug-only wrapper.
  hook(renderer) {
    if (this.hooked || !renderer || !renderer.pipelines || !renderer.pipelines.MULTI_PIPELINE) return;
    const pl = renderer.pipelines.MULTI_PIPELINE;
    const orig = pl.flush;
    const self = this;
    pl.flush = function (...a) {
      if (this.vertexCount > 0) self.calls++;
      return orig.apply(this, a);
    };
    this.hooked = pl;
  }

  frameEnd() { this.lastCalls = this.calls; this.calls = 0; }

  // Called once per frame. info = {tier, mode, sprites, particles, nums}. No allocation unless refreshing text.
  update(dtMs, workMs, info) {
    this.ring[this.ri] = dtMs;
    this.ri = (this.ri + 1) % 600;
    if (this.rn < 600) this.rn++;
    this.frames++;
    this.sumMs += dtMs;
    this.sumWork += workMs;
    if (dtMs > this.maxMs) this.maxMs = dtMs;
    this.acc += dtMs;
    if (this.acc < 500) return;
    const n = this.frames;
    const ms = this.sumMs / n;
    const wk = this.sumWork / n;
    const rn = this.rn;
    this.scratch.set(rn < 600 ? this.ring.subarray(0, rn) : this.ring);
    const srt = this.scratch.subarray(0, rn).sort();
    const p95 = srt[Math.min(rn - 1, Math.floor(rn * 0.95))];
    let slow = 0;
    for (let i = 0; i < rn; i++) if (srt[i] > 25) slow++;
    this.rec = { fps: 1000 / ms, ms, p95, slow, work: wk, max: this.maxMs, sprites: info.sprites, particles: info.particles, calls: this.lastCalls, tier: info.tier };
    if (this.on) {
      this.el.textContent = `${(1000 / ms).toFixed(0)} fps  ${ms.toFixed(1)} ms (max ${this.maxMs.toFixed(0)})\np95 ${p95.toFixed(1)} ms  slow(>25ms) ${slow}/${rn}\nwork ${wk.toFixed(1)} ms\nsprites ${info.sprites}  particles ${info.particles}\ncalls ${this.lastCalls}\ntier ${info.tier} (${info.mode})`;
    }
    this.acc = 0; this.frames = 0; this.sumMs = 0; this.sumWork = 0; this.maxMs = 0;
  }
}
