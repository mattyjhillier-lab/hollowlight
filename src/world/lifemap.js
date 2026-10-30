// The life map (docs/IDENTITY.md, world sheet #2). Pure JS, visual only: nothing in src/sim reads or writes it.
// A N x N grid over the world. 0 = Hollow (grey), 1 = alive (restored). Hero and spirits stamp life along their
// paths; it decays linearly to 0 over `decay` seconds in a float array (8-bit decay would stall), and is
// converted to an 8-bit RGBA buffer (R = life) for upload to the GPU at ~10 Hz.
const STEP = 0.1; // decay step (s) = upload cadence
const MAX_SEG = 48; // cap on stamps per line segment
// W3 corruption (visual only): a second float channel in the same map, uploaded in the same texture (B channel).
// Enemies stamp it slowly; it fades on its own over ~60 s and is pushed back hard by restored ground (life), so the hero's
// lantern, trails and spirits heal it. Never read by src/sim.
export const CORR_DECAY = 1 / 60; // per second, untouched
export const CORR_HEAL = 1.6; // per second per unit of life (life 1 clears a cell in ~0.6 s)
const sst = (a, b, v) => { const t = v <= a ? 0 : v >= b ? 1 : (v - a) / (b - a); return t * t * (3 - 2 * t); };

export class LifeMap {
  constructor({ n = 256, world = 4000, decay = 25, zone = null } = {}) {
    this.n = n;
    this.world = world;
    this.cell = world / n;
    this.decay = decay > 0 ? decay : 25;
    this.life = new Float32Array(n * n);
    this.corr = new Float32Array(n * n); // W3 corruption 0..1
    this.floor = new Float32Array(n * n); // AL-1b starter glade: life never decays below this (all zero = old behaviour)
    this.rgba = new Uint8Array(n * n * 4);
    for (let i = 3; i < this.rgba.length; i += 4) this.rgba[i] = 255;
    // G channel = ground zone weight (0 set A .. 1 set B) from zone(x, y), written once; update() only touches R
    if (typeof zone === 'function') {
      const cell = world / n;
      for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) { const z = zone((i + 0.5) * cell, (j + 0.5) * cell); this.rgba[(j * n + i) * 4 + 1] = z > 0 ? (z >= 1 ? 255 : (z * 255 + 0.5) | 0) : 0; }
    }
    this.acc = 0;
    this.dirty = true;
    this.version = 0;
    // Perf: rows that can still change (life above its floor, or corruption > 0). stamp/stampCorr mark rows; update() only walks
    // active rows and retires a row once every cell in it is at rest. dy0..dy1 = rows touched by the last update() (sub-upload range).
    this.rowAct = new Uint8Array(n).fill(1);
    this.dy0 = 0;
    this.dy1 = n - 1;
    // FIX4g: stamps write the R byte at once (see stamp) so the reveal can reach the GPU every frame; sy0..sy1 = rows stamped since the last upload (sy1 < sy0 = none)
    this.sy0 = n;
    this.sy1 = -1;
  }

  reset() {
    this.life.set(this.floor);
    this.corr.fill(0);
    for (let i = 2; i < this.rgba.length; i += 4) this.rgba[i] = 0;
    this.acc = 0;
    this.dirty = true;
    this.rowAct.fill(1);
    this.version++;
  }

  // Max-blend a soft disc: strength s (0..1) at the centre falling smoothly to 0 at radius r (world units).
  stamp(x, y, r, s = 1, arr = this.life) {
    if (!(r > 0) || !Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(s)) return;
    s = s > 1 ? 1 : s;
    if (s <= 0) return;
    const { n, cell } = this;
    const life = arr;
    const cx = x / cell - 0.5;
    const cy = y / cell - 0.5;
    const rc = r / cell;
    const x0 = Math.max(0, Math.floor(cx - rc));
    const x1 = Math.min(n - 1, Math.ceil(cx + rc));
    const y0 = Math.max(0, Math.floor(cy - rc));
    const y1 = Math.min(n - 1, Math.ceil(cy + rc));
    if (x0 > x1 || y0 > y1) return;
    const inv = 1 / rc;
    for (let j = y0; j <= y1; j++) {
      const dy = j - cy;
      const row = j * n;
      for (let i = x0; i <= x1; i++) {
        const dx = i - cx;
        const d = Math.sqrt(dx * dx + dy * dy) * inv;
        if (d >= 1) continue;
        const t = 1 - d;
        const v = s * t * t * (3 - 2 * t);
        if (v > life[row + i]) { life[row + i] = v; if (arr === this.life) this.rgba[(row + i) * 4] = (v * 255 + 0.5) | 0; }
      }
    }
    this.rowAct.fill(1, y0, y1 + 1);
    if (arr === this.life) { if (y0 < this.sy0) this.sy0 = y0; if (y1 > this.sy1) this.sy1 = y1; }
    this.dirty = true;
  }

  // W3: add corruption in a soft disc. s = amount added at the centre (0..1) per call, scaled down on restored ground.
  stampCorr(x, y, r, s = 0.01) {
    if (!(r > 0) || !(s > 0) || !Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(s)) return;
    if (s > 1) s = 1;
    const { n, cell, corr, life } = this;
    const cx = x / cell - 0.5; const cy = y / cell - 0.5; const rc = r / cell;
    const x0 = Math.max(0, Math.floor(cx - rc)); const x1 = Math.min(n - 1, Math.ceil(cx + rc));
    const y0 = Math.max(0, Math.floor(cy - rc)); const y1 = Math.min(n - 1, Math.ceil(cy + rc));
    if (x0 > x1 || y0 > y1) return;
    const inv = 1 / rc;
    for (let j = y0; j <= y1; j++) {
      const dy = j - cy; const row = j * n;
      for (let i = x0; i <= x1; i++) {
        const dx = i - cx;
        const d = Math.sqrt(dx * dx + dy * dy) * inv;
        if (d >= 1) continue;
        const t = 1 - d;
        const k = row + i;
        const v = corr[k] + s * t * t * (3 - 2 * t) * (1 - sst(0.2, 0.7, life[k]));
        corr[k] = v > 1 ? 1 : v;
      }
    }
    this.rowAct.fill(1, y0, y1 + 1);
    this.dirty = true;
  }

  // AL-1b: a permanent soft patch (max-blended into the floor and the live map). Visual only.
  stampFloor(x, y, r, s = 1) {
    this.stamp(x, y, r, s, this.floor);
    this.stamp(x, y, r, s);
  }

  clearFloor() { this.floor.fill(0); this.rowAct.fill(1); }

  // Trail: stamps along a segment so a fast mover leaves a continuous ribbon.
  stampLine(x0, y0, x1, y1, r, s = 1) {
    if (![x0, y0, x1, y1].every(Number.isFinite)) return;
    const len = Math.hypot(x1 - x0, y1 - y0);
    const k = Math.min(MAX_SEG, Math.max(1, Math.ceil(len / Math.max(1, r * 0.5))));
    for (let i = 0; i <= k; i++) this.stamp(x0 + ((x1 - x0) * i) / k, y0 + ((y1 - y0) * i) / k, r, s);
  }

  // Linear decay in fixed steps. Returns true when the RGBA buffer was refreshed (caller uploads it).
  update(dt) {
    if (!(dt > 0)) return false;
    this.acc += dt > 1 ? 1 : dt;
    if (this.acc < STEP) return false;
    const steps = Math.floor(this.acc / STEP);
    this.acc -= steps * STEP;
    const d = (steps * STEP) / this.decay;
    const cdt = steps * STEP;
    const { life, rgba, floor, corr, rowAct, n } = this;
    let r0 = n;
    let r1 = -1;
    for (let j = 0; j < n; j++) {
      if (!rowAct[j]) continue;
      if (j < r0) r0 = j;
      r1 = j;
      let busy = 0;
      for (let i = j * n, e = i + n, k = i * 4; i < e; i++, k += 4) {
        let v = life[i];
        const fl = floor[i];
        if (v > fl) { v -= d; if (v < fl) v = fl; life[i] = v; if (v > fl) busy = 1; }
        rgba[k] = (v * 255 + 0.5) | 0;
        let c = corr[i];
        if (c > 0) {
          c -= (CORR_DECAY + CORR_HEAL * v) * cdt;
          if (!(c > 0)) c = 0;
          corr[i] = c;
          if (c > 0) busy = 1;
        } else if (c !== 0) corr[i] = c = 0; // NaN guard
        rgba[k + 2] = (c * 255 + 0.5) | 0;
      }
      if (!busy) rowAct[j] = 0;
    }
    if (r1 < 0) { r0 = 0; r1 = -1; }
    this.dy0 = r0;
    this.dy1 = r1;
    this.sy0 = n; this.sy1 = -1; // this pass rewrote every active row (stamped rows are active), so nothing is left pending
    this.dirty = false;
    this.version++;
    return true;
  }

  // Bilinear sample at a world position; 0 outside the world.
  sample(x, y, arr = this.life) {
    if (!Number.isFinite(x) || !Number.isFinite(y)) return 0;
    const { n, cell } = this;
    const life = arr;
    const fx = x / cell - 0.5;
    const fy = y / cell - 0.5;
    if (fx < -1 || fy < -1 || fx > n || fy > n) return 0;
    const ix = Math.floor(fx);
    const iy = Math.floor(fy);
    const tx = fx - ix;
    const ty = fy - iy;
    const g = (i, j) => (i < 0 || j < 0 || i >= n || j >= n ? 0 : life[j * n + i]);
    const a = g(ix, iy) * (1 - tx) + g(ix + 1, iy) * tx;
    const b = g(ix, iy + 1) * (1 - tx) + g(ix + 1, iy + 1) * tx;
    return a * (1 - ty) + b * ty;
  }

  sampleCorr(x, y) { return this.sample(x, y, this.corr); }

  // Restored colour that is not buried under corruption: what sway/bloom use (they only live on clean restored ground).
  sampleClean(x, y) { return this.sample(x, y) * (1 - sst(0.1, 0.4, this.sample(x, y, this.corr))); }
}
