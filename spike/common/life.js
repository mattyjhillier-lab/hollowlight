// "Life map": 128x128 low-res grid over the whole world. Hero lantern + spirits paint life (slow fade),
// enemies paint corruption. Shared by spike A (3D ground/prop shading) and B (2D ground shader).
export const LIFE_N = 128;

export class LifeMap {
  constructor(worldSize = 4000) {
    this.n = LIFE_N;
    this.world = worldSize;
    this.cell = worldSize / LIFE_N;
    this.life = new Float32Array(LIFE_N * LIFE_N);
    this.corr = new Float32Array(LIFE_N * LIFE_N);
    this.data = new Uint8Array(LIFE_N * LIFE_N * 4);
    for (let i = 3; i < this.data.length; i += 4) this.data[i] = 255;
    this.cost = 0;
  }

  stamp(arr, x, y, radius, amount) {
    const n = this.n, c = this.cell;
    const cx = x / c, cy = y / c, r = radius / c;
    const x0 = Math.max(0, Math.floor(cx - r)), x1 = Math.min(n - 1, Math.ceil(cx + r));
    const y0 = Math.max(0, Math.floor(cy - r)), y1 = Math.min(n - 1, Math.ceil(cy + r));
    for (let j = y0; j <= y1; j++) {
      for (let i = x0; i <= x1; i++) {
        const d = Math.hypot(i + 0.5 - cx, j + 0.5 - cy) / r;
        if (d >= 1) continue;
        const k = j * n + i;
        const v = arr[k] + amount * (1 - d * d);
        arr[k] = v > 1 ? 1 : v;
      }
    }
  }

  update(sim, dt) {
    const t0 = performance.now();
    const p = sim.player;
    this.stamp(this.life, p.x, p.y, 170, 0.9 * dt);
    for (const u of sim.units) if (!u.dead) this.stamp(this.life, u.x, u.y, 70, (u.kind === 'orb' ? 0.5 : 0.7) * dt);
    for (const e of sim.enemies) if (!e.dead) this.stamp(this.corr, e.x, e.y, 36, 0.14 * dt);
    const L = this.life, C = this.corr;
    const dl = 0.004 * dt, dc = 0.05 * dt;
    for (let k = 0; k < L.length; k++) {
      const c = C[k];
      let l = L[k] - dl - c * 0.25 * dt;
      L[k] = l < 0 ? 0 : l;
      C[k] = c - dc < 0 ? 0 : c - dc;
    }
    this.cost = performance.now() - t0;
  }

  // pack into the RGBA8 buffer (R life, G corruption); returns the buffer for texture upload
  pack() {
    const d = this.data, L = this.life, C = this.corr;
    for (let k = 0, o = 0; k < L.length; k++, o += 4) { d[o] = L[k] * 255; d[o + 1] = C[k] * 255; }
    return d;
  }
}
