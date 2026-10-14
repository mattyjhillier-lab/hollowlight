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
    this.frames++;
    this.sumMs += dtMs;
    this.sumWork += workMs;
    if (dtMs > this.maxMs) this.maxMs = dtMs;
    this.acc += dtMs;
    if (this.acc < 500) return;
    const n = this.frames;
    const ms = this.sumMs / n;
    const wk = this.sumWork / n;
    this.rec = { fps: 1000 / ms, ms, work: wk, max: this.maxMs, sprites: info.sprites, particles: info.particles, calls: this.lastCalls, tier: info.tier };
    if (this.on) {
      this.el.textContent = `${(1000 / ms).toFixed(0)} fps  ${ms.toFixed(1)} ms (max ${this.maxMs.toFixed(0)})\nwork ${wk.toFixed(1)} ms\nsprites ${info.sprites}  particles ${info.particles}\ncalls ${this.lastCalls}\ntier ${info.tier} (${info.mode})`;
    }
    this.acc = 0; this.frames = 0; this.sumMs = 0; this.sumWork = 0; this.maxMs = 0;
  }
}
