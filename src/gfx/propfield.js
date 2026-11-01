// W4 props + AL-3 crown sway/petals: the pure (no Phaser, no DOM) placement, state and pose logic. Visual only: nothing in src/sim
// touches this, it never reads or advances the sim RNG (stateless hashes of cell coordinates + a visual seed), and it only READS
// the life map. Props are decor: no collision, no sim link. Rules (docs/mockups/world-sheet README, ambient-life-v1 AL-3):
//   - crowns/trunks draw UNDER every creature (the layer sets the depth) and fade when creatures stand under a crown,
//   - Hollow props are still and grey; restored props are colour and crowns lean with the shared wind (amplitude x life),
//   - Hollow <-> restored is a crossfade of two images with one silhouette (no pop); props that scroll in already restored just appear restored,
//   - a clear start area; per-tier live caps (CAPS.<tier>.props), phone/Low density gates, deterministic placement per zone.
import { lean, windScale, hash, wind } from './wind.js';
import { KINDS, kindGeo } from './propatlas.js';
import { springStep, AMP_BODY, AMP_CROWN, PROP_RS, PUSH_BODY } from './pushfield.js';

export const CELL = 96; // world units per low-prop hash cell
export const TALL_CELL = CELL * 2; // tall props live on a coarser lattice so trees never touch
export const LOW_P = 0.62; // chance a cell holds a low prop
export const TALL_P = 0.5; // chance a tall slot holds a tall prop (meadow zones)
export const TALL_P_B = 0.32; // ... in the Deep Forest zones (bark pillars are tall: fewer, so a phone view is not a fence)
export const EDGE_BAND = 90; // inside this distance from the world edge only the wall pillars stand
export const EDGE_KEEP = 56; // other props never closer than this to the edge
export const START_CLEAR = { tall: 240, low: 125 }; // radius around the run start with no props at all (hero clear area)
export const MARGIN = 24; // new props appear only just outside what is visible
export const REFRESH_S = 0.25;
export const SAMPLE_S = 0.45; // per-prop life sample period (staggered)
export const FADE_RATE = 3.2; // crossfade speed (1/s): ~0.7 s from grey to colour, no pop
export const LIFE_LO = 0.3; // life -> restored blend ramp
export const LIFE_HI = 0.52;
export const AMP = 0.03; // max crown lean, radians (~1.7 deg; the design said 0.8 deg, which is invisible at 3-5 px)
export const SHAPE = 1.3;
export const WOBBLE = 0.004;
export const CROWN_MIN = 0.55; // crown alpha while creatures stand under it (so a Fell Wolf never sits on a same-grey mass)
export const CROWN_RATE = 5; // crown fade speed (1/s)
export const PETAL_KINDS = ['oak', 'snag'];

const TAU = Math.PI * 2;
const SHAPE_NORM = Math.tanh(SHAPE);
const sstep = (a, b, v) => { const t = v <= a ? 0 : v >= b ? 1 : (v - a) / (b - a); return t * t * (3 - 2 * t); };

const LOW_A = [['bush', 30], ['fern', 24], ['stump', 8], ['boulder', 8], ['log', 5], ['grave', 5], ['mush', 4], ['bramble', 4]];
const LOW_B = [['fern', 30], ['bush', 12], ['log', 10], ['stump', 8], ['boulder', 8], ['bramble', 8], ['mush', 6], ['grave', 6]];
const TALL_A = [['oak', 12], ['snag', 8]];
const TALL_B = [['pillar', 18], ['snag', 5]];
const pick = (tbl, u) => { let tot = 0; for (const [, w] of tbl) tot += w; let a = u * tot; for (const [k, w] of tbl) { if ((a -= w) < 0) return k; } return tbl[0][0]; };

// per-prop colour jitter (multiplied onto the atlas texels): small brightness/hue shifts so repeats never read as copies; B zones a touch darker
function jitter(h1, h2, h3, zb, tall) {
  const dark = tall ? 1 : 1 - 0.16 * zb;
  const r = dark * (0.93 + 0.07 * h1); const g = dark * (0.94 + 0.06 * h2); const b = dark * (0.92 + 0.08 * h3);
  const q = (v) => Math.max(0, Math.min(255, Math.round(v * 255)));
  return (q(r) << 16) | (q(g) << 8) | q(b);
}

function nearClear(x, y, clear, tall) {
  if (!clear) return false;
  for (const c of clear) { const r = tall ? c.tall : c.low; if (r > 0 && Math.hypot(x - c.x, y - c.y) < r) return true; }
  return false;
}

// Deterministic props of one 96-unit cell: at most one low prop, and (on even/even cells) one tall prop somewhere inside the 192 lattice square.
// zoneFn(x, y) -> 0..1 weight of ground set B; clear = [{x, y, tall, low}] radii with no props.
export function cellProps(ci, cj, seed = 0, zoneFn = null, world = 4000, clear = null) {
  const base = (Math.imul(cj + 64, 8209) + Math.imul(ci + 64, 263) + (seed | 0)) | 0;
  const out = [];
  const hh = (k, i) => hash(Math.imul(base, 1013) + k * 977 + i * 31);
  const mk = (k, x, y, tall, kind, id) => {
    const zb = zoneFn ? zoneFn(x, y) : 0;
    out.push({
      id, x, y, kind, tall,
      variant: Math.min(KINDS[kind].variants - 1, Math.floor(hh(k, 4) * KINDS[kind].variants)),
      flip: hh(k, 5) > 0.5,
      size: tall ? 0.9 + 0.22 * hh(k, 6) : 0.88 + 0.28 * hh(k, 6),
      jit: jitter(hh(k, 7), hh(k, 8), hh(k, 9), zb, tall),
      phase: hh(k, 10) * TAU,
      amp: 0.75 + 0.25 * hh(k, 11),
      prio: hh(k, 12),
      d: hh(k, 13), // density gate
      zb,
    });
  };
  // low slot (id parity 0)
  const lx = (ci + 0.12 + 0.76 * hh(0, 1)) * CELL;
  const ly = (cj + 0.12 + 0.76 * hh(0, 2)) * CELL;
  const edge = Math.min(lx, ly, world - lx, world - ly);
  const id0 = ((cj + 64) * 2048 + (ci + 64)) * 4;
  if (edge < EDGE_BAND) {
    // the world-edge wall: a plain row of bark pillars (B), nothing else. Minimal by design.
    if (edge >= 8 && (zoneFn ? zoneFn(lx, ly) : 1) >= 0.5 && !nearClear(lx, ly, clear, true)) mk(0, lx, ly, true, 'pillar', id0);
  } else if (hh(0, 3) < LOW_P && edge >= EDGE_KEEP && !nearClear(lx, ly, clear, false)) {
    const zb = zoneFn ? zoneFn(lx, ly) : 0;
    const useB = zb > 0.85 || (zb > 0.15 && hh(0, 14) < zb);
    mk(0, lx, ly, false, pick(useB ? LOW_B : LOW_A, hh(0, 15)), id0);
  }
  // tall slot (even/even cells own a 192 lattice square)
  if (((ci & 1) === 0 && (cj & 1) === 0)) {
    const tx = (ci + 0.2 + 1.6 * hh(1, 1)) * CELL;
    const ty = (cj + 0.2 + 1.6 * hh(1, 2)) * CELL;
    const zt = zoneFn ? zoneFn(tx, ty) : 0;
    if (hh(1, 3) >= TALL_P + (TALL_P_B - TALL_P) * zt) return out;
    const e2 = Math.min(tx, ty, world - tx, world - ty);
    if (e2 >= EDGE_BAND + 30 && !nearClear(tx, ty, clear, true)) {
      const zb = zoneFn ? zoneFn(tx, ty) : 0;
      const useB = zb > 0.85 || (zb > 0.15 && hh(1, 14) < zb);
      mk(1, tx, ty, true, pick(useB ? TALL_B : TALL_A, hh(1, 15)), id0 + 1);
    }
  }
  return out;
}

// visibility rectangle of a prop in world units (a tall prop's base can be below the view while its crown shows)
export function reach(p) {
  const g = kindGeo(p.kind);
  const hw = Math.max(Math.abs(g.body.x0), Math.abs(g.body.x1), g.crown ? Math.max(Math.abs(g.crown.x0), Math.abs(g.crown.x1)) : 0) * p.size;
  const top = Math.min(g.body.y0, g.crown ? g.crown.y0 : 0) * p.size; // negative: how far up it reaches
  return { hw, top, bottom: 14 * p.size };
}
const inView = (p, view, m) => { const r = reach(p); return p.x + r.hw >= view.x0 - m && p.x - r.hw <= view.x1 + m && p.y + r.bottom >= view.y0 - m && p.y + r.top <= view.y1 + m; };

export class PropField {
  constructor({ seed = 0, zone = null, world = 4000, clear = null } = {}) {
    this.seed = seed | 0;
    this.zone = zone;
    this.world = world;
    this.clear = clear;
    this.slots = new Map(); // id -> slot
    this.cap = 0;
    this.densTall = 1;
    this.densLow = 1;
    this.sway = true;
    this.onAdd = null; // (slot) -> void
    this.onRemove = null; // (slot) -> void
    this.refreshes = 0;
  }

  get count() { return this.slots.size; }

  reset(seed = this.seed, clear = this.clear) { this.clear = clear; this.clear_(); this.seed = seed | 0; }
  clear_() { if (this.onRemove) for (const s of this.slots.values()) this.onRemove(s); this.slots.clear(); }

  // cap = live props for the tier (CAPS.<tier>.props.live); density = tier x phone gate; sway = crowns move (Med/High)
  setBudget(cap, density = 1, phone = false, sway = true) {
    const c = cap > 0 ? Math.floor(cap) : 0;
    const d = density > 0 && density <= 1 ? density : 1;
    this.densTall = d * (phone ? 0.6 : 1);
    this.densLow = d * (phone ? 0.75 : 1);
    this.sway = !!sway;
    this.cap = c;
    if (c === 0) { this.clear_(); return; }
    if (this.slots.size > c) {
      const arr = [...this.slots.values()].sort((a, b) => b.prop.prio - a.prop.prio);
      for (let i = 0; i < arr.length - c; i++) this.drop(arr[i]);
    }
    for (const s of [...this.slots.values()]) if (s.prop.d >= (s.prop.tall ? this.densTall : this.densLow)) this.drop(s);
  }

  drop(s) { this.slots.delete(s.prop.id); if (this.onRemove) this.onRemove(s); }

  // ~4 Hz: recycle by view, place new props just outside it. view = {x0,y0,x1,y1}; life.sampleClean(x,y) or life.sample(x,y).
  refresh(view, life) {
    this.refreshes++;
    if (this.cap === 0 || !view) return;
    for (const s of [...this.slots.values()]) if (!inView(s.prop, view, MARGIN * 3)) this.drop(s);
    const m = MARGIN;
    const c0 = Math.floor((view.x0 - m - 160) / CELL) - 1; const c1 = Math.floor((view.x1 + m + 160) / CELL) + 1;
    const r0 = Math.floor((view.y0 - m - 40) / CELL) - 1; const r1 = Math.floor((view.y1 + m + 300) / CELL) + 1;
    const cand = [];
    for (let cj = r0; cj <= r1; cj++) for (let ci = c0; ci <= c1; ci++) {
      if (ci < 0 || cj < 0 || ci * CELL > this.world || cj * CELL > this.world) continue;
      for (const p of cellProps(ci, cj, this.seed, this.zone, this.world, this.clear)) {
        if (this.slots.has(p.id)) continue;
        if (p.d >= (p.tall ? this.densTall : this.densLow)) continue;
        if (!inView(p, view, m)) continue;
        cand.push(p);
      }
    }
    if (!cand.length) return;
    cand.sort((a, b) => a.prio - b.prio || a.id - b.id);
    for (const p of cand) {
      if (this.slots.size >= this.cap) break;
      const lf = life ? (life.sampleClean ? life.sampleClean(p.x, p.y) : life.sample(p.x, p.y)) : 0;
      const r = sstep(LIFE_LO, LIFE_HI, lf);
      const s = { prop: p, r, tgt: r, life: lf, ang: 0, crownA: 1, nextS: hash(p.id * 7 + 3) * SAMPLE_S, refs: null };
      this.slots.set(p.id, s);
      if (this.onAdd) this.onAdd(s);
    }
  }

  // ~20 Hz. creatures = [{x, y}] (hero + enemies, read-only) for the crown fade; t = sim time (s).
  // push = AL-4 PushField (optional): bush/fern/bramble bodies and oak/snag crowns lean away from nearby creatures (spring), x restored blend s.r
  step(dt, t, life, reduced = false, creatures = null, nCreat = 0, hero = null, push = null) {
    if (this.cap === 0) return;
    const d0 = dt > 0 ? (dt > 0.25 ? 0.25 : dt) : 0;
    const kf = 1 - Math.exp(-FADE_RATE * d0);
    const kc = 1 - Math.exp(-CROWN_RATE * d0);
    const sc = this.sway ? windScale(reduced) : 0;
    for (const s of this.slots.values()) {
      const p = s.prop;
      s.nextS -= d0;
      if (s.nextS <= 0) {
        s.nextS += SAMPLE_S;
        s.life = life ? (life.sampleClean ? life.sampleClean(p.x, p.y) : life.sample(p.x, p.y)) : 0;
        s.tgt = sstep(LIFE_LO, LIFE_HI, s.life);
      }
      s.r += (s.tgt - s.r) * kf;
      if (s.r < 0.002) s.r = 0; else if (s.r > 0.998) s.r = 1;
      const K = KINDS[p.kind];
      const pk = PUSH_BODY[p.kind];
      const pamp = K.layers.crown ? AMP_CROWN : pk ? AMP_BODY * pk : 0;
      if (pamp > 0 && this.sway) {
        if (!s.pst) s.pst = { pa: 0, pv: 0 };
        const live = push && push.n > 0;
        if (live || s.pst.pa !== 0 || s.pst.pv !== 0) springStep(s.pst, live ? push.targetAt(p.x, p.y, PROP_RS) * pamp * s.r * (reduced ? windScale(true) : 1) * p.amp : 0, d0);
      }
      if (K.layers.crown) {
        // AL-3 crown sway: shared wind, amplitude x colour (the Hollow stays still)
        if (sc > 0 && s.r > 0) {
          const w = lean(p.x, p.y, t, 1, sc, 0) / sc;
          s.ang = (Math.tanh(w * SHAPE) / SHAPE_NORM * sc * AMP * p.amp + WOBBLE * sc * Math.sin(t * 0.8 + p.phase)) * s.r;
        } else s.ang = 0;
        if (s.pst) s.ang += s.pst.pa;
        // creatures standing under the crown: fade it so nothing hides in it or sits on a same-grey mass
        let under = false;
        if ((creatures && nCreat > 0) || hero) {
          const g = kindGeo(p.kind); const cr = g.crown;
          const x0 = p.x + cr.x0 * p.size; const x1 = p.x + cr.x1 * p.size;
          const y0 = p.y + cr.y0 * p.size - 6; const y1 = p.y + cr.y1 * p.size + 8;
          if (hero && hero.x >= x0 && hero.x <= x1 && hero.y >= y0 && hero.y <= y1) under = true;
          for (let i = 0; !under && creatures && i < nCreat; i++) { const c = creatures[i]; if (c.x >= x0 && c.x <= x1 && c.y >= y0 && c.y <= y1) { under = true; break; } }
        }
        s.crownA += ((under ? CROWN_MIN : 1) - s.crownA) * kc;
      }
    }
  }
}

// ---------- AL-3 petals: a few cream/peach petals drifting off restored blossoming crowns ----------
export const PETAL_LIFE = 6.5; // seconds
export const PETAL_ALPHA = 0.55; // design R2: <= 0.6, cream only
export const PETAL_RATE = 0.9; // spawn attempts per second per 8 slots of cap
export const PETAL_DEPTH = 4500; // above every prop (depth = y <= world), below the lightmap (5000)

export class PetalField {
  constructor(seed = 0) {
    this.seed = seed | 0;
    this.cap = 0;
    this.petals = [];
    this.acc = 0;
    this.n = 0; // spawn counter (stateless hashes of seed + counter: deterministic, never the sim RNG)
  }

  reset(seed = this.seed) { this.seed = seed | 0; this.petals.length = 0; this.acc = 0; this.n = 0; }
  setBudget(cap, phone = false) { this.cap = cap > 0 ? Math.floor(cap * (phone ? 0.6 : 1)) : 0; if (this.cap === 0) this.petals.length = 0; else if (this.petals.length > this.cap) this.petals.length = this.cap; }

  // slots = PropField.slots values; view as in refresh
  step(dt, t, slots, view, reduced = false) {
    if (this.cap === 0 || reduced) { this.petals.length = 0; this.acc = 0; return; }
    const d0 = dt > 0 ? (dt > 0.25 ? 0.25 : dt) : 0;
    for (let i = this.petals.length - 1; i >= 0; i--) {
      const q = this.petals[i];
      q.age += d0;
      if (q.age >= q.life) { this.petals.splice(i, 1); continue; }
      const w = wind(q.x, q.y, t, 1, 0);
      q.x += (9 + w.x * 20 + Math.sin(t * 1.7 + q.ph) * 6) * d0;
      q.y += (5 + 4 * (0.5 + 0.5 * Math.sin(t * 1.1 + q.ph * 1.3)) + w.y * 6) * d0;
      q.rot = q.ph + t * 1.3;
    }
    this.acc = Math.min(2, this.acc + d0 * PETAL_RATE * (this.cap / 8));
    while (this.acc >= 1 && this.petals.length < this.cap) {
      this.acc -= 1;
      this.n++;
      // pick a restored blossoming crown that is in view
      let best = null; let bi = -1; let k = 0;
      for (const s of slots) {
        if (s.r < 0.85 || !PETAL_KINDS.includes(s.prop.kind)) continue;
        if (view && (s.prop.x < view.x0 - 20 || s.prop.x > view.x1 + 20 || s.prop.y < view.y0 || s.prop.y > view.y1 + 120)) continue;
        const sc = hash(s.prop.id * 31 + this.n * 7 + this.seed);
        if (best === null || sc > bi) { best = s; bi = sc; }
        k++;
      }
      if (!best) { this.acc = Math.min(this.acc, 1); break; }
      const p = best.prop; const g = kindGeo(p.kind).crown;
      const hx = hash(this.n * 13 + this.seed + 1); const hy = hash(this.n * 17 + this.seed + 2);
      this.petals.push({
        x: p.x + (g.x0 + (g.x1 - g.x0) * hx) * p.size * 0.9,
        y: p.y + (g.y0 + (g.y1 - g.y0) * (0.25 + 0.6 * hy)) * p.size,
        age: 0, life: PETAL_LIFE * (0.8 + 0.4 * hash(this.n * 19 + this.seed + 3)), ph: hash(this.n * 23 + this.seed + 4) * TAU, rot: 0,
        kind: hash(this.n * 29 + this.seed + 5) > 0.5 ? 1 : 0,
      });
    }
  }

  alphaOf(q) { const u = q.age / q.life; return PETAL_ALPHA * Math.sin(Math.PI * Math.min(1, Math.max(0, u))) ** 0.8; }
}
