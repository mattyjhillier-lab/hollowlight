// W5 air: the pure (no Phaser, no DOM) fields behind the fog banks, the fireflies/motes and the world-edge fade.
// Visual only: nothing in src/sim is imported, the sim RNG is never touched, life is only READ. Every number comes from the stateless
// hash in wind.js (placement is a pure function of the visual seed) and the shared wind (motion is a pure function of the clock).
// Zero per-frame allocation: all state lives in typed arrays sized once for the largest tier; update() writes the arrays the renderer reads.
//   Fog: soft low-contrast banks, thick over the Hollow and corruption, thin over restored ground, a little thicker toward the map edge.
//   Air: warm cream fireflies/pollen over restored ground, cold pale ones over the Hollow (never gem mint, heart rose, magnet violet or evolution gold).
//   Edge: up to 4 dark gradient strips along the map boundary so the end of the world reads.
import { hash, REDUCED_SCALE } from './wind.js';

const sst = (a, b, v) => { const t = v <= a ? 0 : v >= b ? 1 : (v - a) / (b - a); return t * t * (3 - 2 * t); };
const fin = (v, d = 0) => (Number.isFinite(v) ? v : d);
const mod = (a, n) => ((a % n) + n) % n;

export const PHONE_K = 0.6; // phone density
export const FOG_MAX = 6;
export const FOG_ALPHA = 0.17; // peak banks alpha (normal blend over the 0.7-peak glow texture: <= ~0.12 real, low contrast)
export const FOG_W = [300, 420]; // bank width range (world units); height = 0.6 x width
export const FOG_DENS_ALIVE = 0.3; // restored ground keeps 30% of the Hollow fog
export const FOG_EDGE_REACH = 420; // fog thickens within this distance of the map edge
export const FOG_EDGE_GAIN = 0.7;
export const FOG_M = 180; // wrap margin around the view
export const FOG_SMOOTH = 1.6; // density follow rate (1/s)

export const FLY_MAX = 24;
export const MOTE_MAX = 28;
export const FLY_ALPHA = 0.6; // R2: airborne cream cores <= 0.6
export const MOTE_ALPHA = 0.38;
export const FLY_SIZE = 5; // displayed size (world units): bright core <= 2.5 units
export const MOTE_SIZE = 3.6;
export const AIR_M = 28;
export const COLD = 0xb9c6e0; // Hollow: cold pale
export const WARM = 0xfff0cc; // restored: warm cream
export const TINT_STEPS = 8;
export const COLD_DIM = 0.55; // Hollow fireflies are dimmer
export const EDGE_T = 190; // edge fade thickness (world units)
export const EDGE_A = 0.92; // strip alpha at the boundary (texture ramps it to 0 at EDGE_T)

const lerpC = (a, b, k) => {
  const r = (a >> 16 & 255) + ((b >> 16 & 255) - (a >> 16 & 255)) * k;
  const g = (a >> 8 & 255) + ((b >> 8 & 255) - (a >> 8 & 255)) * k;
  const bl = (a & 255) + ((b & 255) - (a & 255)) * k;
  return ((r | 0) << 16) | ((g | 0) << 8) | (bl | 0);
};
export const TINTS = Array.from({ length: TINT_STEPS + 1 }, (_, i) => lerpC(COLD, WARM, i / TINT_STEPS)); // index 0 = Hollow cold, 8 = warm cream

// budget helper: count for a tier cap on a phone (never below 1 when the cap is on)
export function airCount(cap, { phone = false, max = 999 } = {}) {
  const c = Math.floor(fin(cap));
  if (c <= 0) return 0;
  return Math.min(max, Math.max(1, Math.floor(c * (phone ? PHONE_K : 1))));
}

// ------------------------------------------------------------------------------------------------ fog
export class FogField {
  constructor(seed = 1) {
    this.seed = seed | 0;
    this.n = 0;
    this.bx = new Float32Array(FOG_MAX);
    this.by = new Float32Array(FOG_MAX);
    this.ax = new Float32Array(FOG_MAX); // drift accumulators
    this.ay = new Float32Array(FOG_MAX);
    this.sp = new Float32Array(FOG_MAX);
    this.ph = new Float32Array(FOG_MAX);
    this.w = new Float32Array(FOG_MAX);
    this.h = new Float32Array(FOG_MAX);
    this.dens = new Float32Array(FOG_MAX);
    this.tgt = new Float32Array(FOG_MAX);
    // render outputs
    this.x = new Float32Array(FOG_MAX);
    this.y = new Float32Array(FOG_MAX);
    this.a = new Float32Array(FOG_MAX);
    this.sampT = 9;
    this.reset(seed);
  }

  reset(seed = this.seed) {
    this.seed = seed | 0;
    for (let i = 0; i < FOG_MAX; i++) {
      const s = this.seed * 31 + i * 977;
      this.bx[i] = hash(s + 1) * 4000;
      this.by[i] = hash(s + 2) * 4000;
      this.ax[i] = 0; this.ay[i] = 0;
      this.sp[i] = 0.7 + 0.6 * hash(s + 3);
      this.ph[i] = hash(s + 4) * 6.28;
      this.w[i] = FOG_W[0] + (FOG_W[1] - FOG_W[0]) * hash(s + 5);
      this.h[i] = this.w[i] * 0.6;
      this.dens[i] = 1; this.tgt[i] = 1; this.a[i] = 0;
    }
    this.sampT = 9;
  }

  setBudget(n) { this.n = Math.max(0, Math.min(FOG_MAX, Math.floor(fin(n)))); }

  // view = { x0, y0, x1, y1 }; wnd = { x, y } cached shared wind (-1..1); life = LifeMap-like (sampleClean/sampleCorr)
  update(dt, t, view, life, wx, wy, reduced, world = 4000, thin = 0) {
    const n = this.n;
    if (n === 0) return;
    const d = dt > 0 ? (dt < 0.1 ? dt : 0.1) : 0;
    t = fin(t);
    const sc = reduced ? REDUCED_SCALE : 1;
    const PX = view.x1 - view.x0 + 2 * FOG_M;
    const PY = view.y1 - view.y0 + 2 * FOG_M;
    const ox = view.x0 - FOG_M; const oy = view.y0 - FOG_M;
    this.sampT += d;
    const doSample = this.sampT >= 0.25;
    if (doSample) this.sampT = 0;
    const k = Math.min(1, d * FOG_SMOOTH);
    for (let i = 0; i < n; i++) {
      this.ax[i] += (3 + 5 * this.sp[i] + 9 * fin(wx)) * sc * d; // drifts with the wind, never against it fast
      this.ay[i] += (1.2 * Math.sin(t * 0.13 + this.ph[i]) + 2.5 * fin(wy)) * sc * d;
      const px = ox + mod(this.bx[i] + this.ax[i] - ox, PX);
      const py = oy + mod(this.by[i] + this.ay[i] - oy, PY);
      this.x[i] = px; this.y[i] = py;
      if (doSample) {
        const clean = life ? fin(life.sampleClean(px, py)) : 0;
        const corr = life && life.sampleCorr ? fin(life.sampleCorr(px, py)) : 0;
        let dn = 1 - (1 - FOG_DENS_ALIVE) * (clean > 1 ? 1 : clean) + 0.25 * (corr > 1 ? 1 : corr);
        const edge = Math.min(px, py, world - px, world - py);
        dn *= 1 + FOG_EDGE_GAIN * (1 - sst(0, FOG_EDGE_REACH, edge));
        this.tgt[i] = dn;
      }
      this.dens[i] += (this.tgt[i] - this.dens[i]) * k;
      const u = (px - ox) / PX; const v = (py - oy) / PY; // fade at the wrap seam so a bank never pops
      const seam = sst(0, 0.16, u) * sst(0, 0.16, 1 - u) * sst(0, 0.16, v) * sst(0, 0.16, 1 - v);
      this.a[i] = FOG_ALPHA * this.dens[i] * seam * (1 - fin(thin)); // AL-6: first light / dawn thin the fog
    }
  }
}

// ------------------------------------------------------------------------------------------------ fireflies + motes
export class AirField {
  constructor(seed = 1) {
    this.seed = seed | 0;
    const N = FLY_MAX + MOTE_MAX;
    this.N = N;
    this.nFly = 0; this.nMote = 0;
    this.bx = new Float32Array(N); this.by = new Float32Array(N);
    this.ax = new Float32Array(N); this.ay = new Float32Array(N);
    this.ph = new Float32Array(N); this.sp = new Float32Array(N);
    this.lifeS = new Float32Array(N); // smoothed life under each
    this.x = new Float32Array(N); this.y = new Float32Array(N);
    this.a = new Float32Array(N);
    this.tint = new Uint8Array(N); // index into TINTS
    this.cursor = 0;
    this.reset(seed);
  }

  reset(seed = this.seed) {
    this.seed = seed | 0;
    for (let i = 0; i < this.N; i++) {
      const s = this.seed * 17 + i * 613;
      this.bx[i] = hash(s + 1) * 4000; this.by[i] = hash(s + 2) * 4000;
      this.ax[i] = 0; this.ay[i] = 0;
      this.ph[i] = hash(s + 3) * 6.28; this.sp[i] = 0.6 + 0.8 * hash(s + 4);
      this.lifeS[i] = 0; this.a[i] = 0; this.tint[i] = 0;
    }
    this.cursor = 0;
  }

  // fireflies occupy 0..nFly-1, motes FLY_MAX..FLY_MAX+nMote-1
  setBudget(nFly, nMote) {
    this.nFly = Math.max(0, Math.min(FLY_MAX, Math.floor(fin(nFly))));
    this.nMote = Math.max(0, Math.min(MOTE_MAX, Math.floor(fin(nMote))));
  }

  get count() { return this.nFly + this.nMote; }
  indexOf(j) { return j < this.nFly ? j : FLY_MAX + (j - this.nFly); } // j in 0..count-1 -> slot

  update(dt, t, view, life, wx, wy, reduced, dmod = null) {
    if (this.count === 0) return;
    const rise = dmod ? fin(dmod.rise) : 0; const fade = dmod ? fin(dmod.fade) : 0; const slow = dmod ? 1 - fin(dmod.slow) : 1; // AL-6 dawn: fireflies rise + fade, motes slow
    const d = dt > 0 ? (dt < 0.1 ? dt : 0.1) : 0;
    t = fin(t);
    const PX = view.x1 - view.x0 + 2 * AIR_M;
    const PY = view.y1 - view.y0 + 2 * AIR_M;
    const ox = view.x0 - AIR_M; const oy = view.y0 - AIR_M;
    const kL = Math.min(1, d * 2.5);
    // life sampling: a rotating window of 8 per call (full pass over 52 in ~7 frames), never all at once
    const cnt = this.count;
    for (let s = 0; s < 8 && s < cnt; s++) {
      const j = (this.cursor + s) % cnt;
      const i = this.indexOf(j);
      const v = life ? fin(life.sampleClean(this.x[i], this.y[i])) : 0;
      this.lifeS[i] += ((v > 1 ? 1 : v < 0 ? 0 : v) - this.lifeS[i]) * Math.min(1, kL * 6);
    }
    this.cursor = (this.cursor + 8) % cnt;
    const wX = fin(wx); const wY = fin(wy);
    for (let j = 0; j < cnt; j++) {
      const i = this.indexOf(j);
      const fly = j < this.nFly;
      const lf = this.lifeS[i];
      let px; let py; let al;
      if (reduced) { // static: no drift, no bob, no blink (motes only; fireflies are not shown)
        px = ox + mod(this.bx[i] - ox, PX); py = oy + mod(this.by[i] - oy, PY);
        al = MOTE_ALPHA * 0.6;
      } else if (fly) {
        this.ax[i] += (2.2 * this.sp[i] + 7 * wX) * d;
        this.ay[i] += (-1.6 * this.sp[i] + 3 * wY - 16 * rise) * d;
        px = ox + mod(this.bx[i] + this.ax[i] - ox, PX) + Math.sin(t * 0.9 * this.sp[i] + this.ph[i]) * 6;
        py = oy + mod(this.by[i] + this.ay[i] - oy, PY) + Math.cos(t * 1.1 * this.sp[i] + this.ph[i]) * 5;
        al = FLY_ALPHA * (0.35 + 0.65 * Math.max(0, Math.sin(t * 1.4 * this.sp[i] + this.ph[i]) * 0.5 + 0.5)) * (1 - fade);
      } else {
        this.ax[i] += (6 + 14 * wX) * d * this.sp[i] * slow;
        this.ay[i] += (-0.8 + 4 * wY) * d * this.sp[i] * slow;
        px = ox + mod(this.bx[i] + this.ax[i] - ox, PX) + Math.sin(t * 0.5 + this.ph[i]) * 2;
        py = oy + mod(this.by[i] + this.ay[i] - oy, PY) + Math.cos(t * 0.6 + this.ph[i]) * 2;
        al = MOTE_ALPHA * (0.5 + 0.5 * Math.sin(t * 0.7 + this.ph[i]) * 0.5 + 0.25) * (1 - 0.3 * fade);
      }
      const u = (px - ox) / PX; const v = (py - oy) / PY;
      const seam = sst(0, 0.1, u) * sst(0, 0.1, 1 - u) * sst(0, 0.1, v) * sst(0, 0.1, 1 - v);
      const dim = COLD_DIM + (1 - COLD_DIM) * lf; // cold Hollow ones are dimmer
      this.x[i] = px; this.y[i] = py;
      this.a[i] = al * dim * seam;
      this.tint[i] = Math.round(lf * TINT_STEPS);
    }
  }
}

// ------------------------------------------------------------------------------------------------ edge wall fade
// Up to 4 strips along the boundary that intersect the view. Each strip: image rect (x, y, w, h), side 0 left / 1 right / 2 top / 3 bottom.
export class EdgeField {
  constructor() {
    this.n = 0;
    this.side = new Uint8Array(4);
    this.x = new Float32Array(4); this.y = new Float32Array(4);
    this.w = new Float32Array(4); this.h = new Float32Array(4);
  }

  update(view, world = 4000, T = EDGE_T) {
    this.n = 0;
    const x0 = view.x0 - 8; const x1 = view.x1 + 8; const y0 = view.y0 - 8; const y1 = view.y1 + 8;
    if (x0 < T) this.add(0, 0, y0, T, y1 - y0);
    if (x1 > world - T) this.add(1, world - T, y0, T, y1 - y0);
    if (y0 < T) this.add(2, x0, 0, x1 - x0, T);
    if (y1 > world - T) this.add(3, x0, world - T, x1 - x0, T);
  }

  add(s, x, y, w, h) { const k = this.n++; this.side[k] = s; this.x[k] = x; this.y[k] = y; this.w[k] = w; this.h[k] = h; }
}
