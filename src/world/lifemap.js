// The life map (docs/IDENTITY.md, world sheet #2). Pure JS, visual only: nothing in src/sim reads or writes it.
// A N x N grid over the world. 0 = Hollow (grey), 1 = alive (restored). Hero and spirits stamp life along their
// paths; it decays linearly to 0 over `decay` seconds in a float array (8-bit decay would stall), and is
// converted to an 8-bit RGBA buffer (R = life) for upload to the GPU at ~10 Hz.
const STEP = 0.1; // decay step (s) = upload cadence
const MAX_SEG = 48; // cap on stamps per line segment

export class LifeMap {
  constructor({ n = 256, world = 4000, decay = 25 } = {}) {
    this.n = n;
    this.world = world;
    this.cell = world / n;
    this.decay = decay > 0 ? decay : 25;
    this.life = new Float32Array(n * n);
    this.rgba = new Uint8Array(n * n * 4);
    for (let i = 3; i < this.rgba.length; i += 4) this.rgba[i] = 255;
    this.acc = 0;
    this.dirty = true;
    this.version = 0;
  }

  reset() {
    this.life.fill(0);
    this.acc = 0;
    this.dirty = true;
    this.version++;
  }

  // Max-blend a soft disc: strength s (0..1) at the centre falling smoothly to 0 at radius r (world units).
  stamp(x, y, r, s = 1) {
    if (!(r > 0) || !Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(s)) return;
    s = s > 1 ? 1 : s;
    if (s <= 0) return;
    const { n, cell, life } = this;
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
        if (v > life[row + i]) life[row + i] = v;
      }
    }
    this.dirty = true;
  }

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
    const { life, rgba } = this;
    for (let i = 0, j = 0; i < life.length; i++, j += 4) {
      let v = life[i];
      if (v > 0) { v -= d; if (v < 0) v = 0; life[i] = v; }
      rgba[j] = (v * 255 + 0.5) | 0;
    }
    this.dirty = false;
    this.version++;
    return true;
  }

  // Bilinear sample at a world position; 0 outside the world.
  sample(x, y) {
    if (!Number.isFinite(x) || !Number.isFinite(y)) return 0;
    const { n, cell, life } = this;
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
}
