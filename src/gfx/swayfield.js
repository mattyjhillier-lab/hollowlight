// AL-1 grass/flower sway: the pure (no Phaser, no DOM) placement + pose logic. Visual only: nothing in src/sim touches
// this, it never reads or advances the sim RNG (stateless hashes of cell coordinates + a visual seed), and it only reads
// the life map. Rules from docs/design/ambient-life-v1.md section 4:
//   R1 decal below all creatures (the layer sets the depth), none within HERO_CLEAR of the hero (faded out to HERO_FADE),
//   R4 amplitude <= 6 px (3 world units at the sprite tip), period >= 6 s (the shared wind), no flicker,
//   R5 the Hollow is still: a sprite only exists where the life map says colour has returned; it fades with the colour,
//   R6 phone: density x0.6 and fewer flowers.
import { lean, windScale, hash } from './wind.js';
import { FRAME_COUNT } from './ambatlas.js';

export const CELL = 64; // world units per hash-grid cell
export const ENTER = 0.34; // life needed for a NEW sprite to be placed (just above ALPHA_LO so it fades in from nothing, no pop)
export const EXIT = 0.26; // below this a sprite is released
export const ALPHA_LO = 0.32; // life -> alpha ramp, narrow (AL-1b): a sprite is clearly there or gone, no long ghostly half-alpha band at restored edges
export const ALPHA_HI = 0.5;
export const MAX_ALPHA = 0.95;
export const HERO_CLEAR = 78; // no sprite inside this radius of the hero
export const HERO_FADE = 112; // fully visible beyond this
export const SPAWN_MARGIN = 28; // new sprites only appear just outside the view
export const KEEP_MARGIN = 64; // sprites farther than this outside the view are recycled
export const AMP = 0.29; // max lean (radians, ~16.6 deg) about the base (AL-1b: with the wind shaping below, typical lean ~11 deg; total with WOBBLE <= ~18 deg)
export const SHAPE = 1.5; // soft gain on the wind (tanh): small winds read, peaks never exceed AMP
export const WOBBLE = 0.025;
export const PHONE_DENSITY = 0.6;

const TAU = Math.PI * 2;
const SHAPE_NORM = Math.tanh(SHAPE);
const sstep = (a, b, v) => { const t = v <= a ? 0 : v >= b ? 1 : (v - a) / (b - a); return t * t * (3 - 2 * t); };

// Deterministic props of one hash-grid cell (1-2, rarely 3). Frames: 0-2 meadow tuft, 3-5 fern tuft, 6-9 flower.
// zoneFn(x, y) -> 0..1 weight of ground set B (Deep Forest): B zones get ferns and no flowers.
export function cellProps(ci, cj, seed = 0, zoneFn = null, world = 4000) {
  const base = (Math.imul(cj + 16, 4099) + Math.imul(ci + 16, 131) + (seed | 0)) | 0;
  const h0 = hash(base * 3 + 1);
  const n = h0 < 0.4 ? 1 : h0 < 0.92 ? 2 : 3;
  const out = [];
  for (let k = 0; k < n; k++) {
    const hh = (i) => hash(Math.imul(base, 977) + k * 131 + i * 7);
    const x = (ci + 0.08 + 0.84 * hh(1)) * CELL;
    const y = (cj + 0.08 + 0.84 * hh(2)) * CELL;
    if (x < 40 || y < 40 || x > world - 40 || y > world - 40) continue;
    const zb = zoneFn ? zoneFn(x, y) : 0;
    const flower = zb < 0.5 && hh(3) < 0.26;
    const frame = flower ? 6 + Math.min(3, Math.floor(hh(4) * 4)) : (zb >= 0.5 ? 3 : 0) + Math.min(2, Math.floor(hh(4) * 3));
    out.push({
      id: ((cj + 16) * 1024 + (ci + 16)) * 4 + k,
      x, y, frame, flower,
      phase: hh(5) * TAU,
      size: 0.95 + 0.4 * hh(6),
      amp: 0.8 + 0.2 * hh(7),
      prio: hh(8),
      d: hh(9), // density gate (phone keeps d < density)
    });
  }
  return out;
}

export class SwayField {
  constructor({ seed = 0, zone = null, world = 4000 } = {}) {
    this.seed = seed | 0;
    this.zone = zone;
    this.world = world;
    this.slots = new Map(); // id -> { prop, alpha, tgt, ang, ref }
    this.cap = 0;
    this.density = 1;
    this.onAdd = null; // (slot) -> void   (the renderer attaches a sprite)
    this.onRemove = null; // (slot) -> void
    this.refreshes = 0;
  }

  get count() { return this.slots.size; }

  reset(seed = this.seed) {
    this.clear();
    this.seed = seed | 0;
  }

  clear() {
    if (this.onRemove) for (const s of this.slots.values()) this.onRemove(s);
    this.slots.clear();
  }

  // cap per tier (CAPS.<tier>.ambient.sway); density 1 desktop, PHONE_DENSITY on phones. 0 releases everything.
  setBudget(cap, density = 1) {
    const c = cap > 0 ? Math.floor(cap * (density > 0 ? density : 1)) : 0;
    this.density = density > 0 && density <= 1 ? density : 1;
    this.cap = c;
    if (c === 0) { this.clear(); return; }
    if (this.slots.size > c) { // drop the lowest alpha / lowest priority first
      const arr = [...this.slots.values()].sort((a, b) => a.alpha - b.alpha || a.prop.prio - b.prop.prio);
      for (let i = 0; i < arr.length - c; i++) this.drop(arr[i]);
    }
  }

  drop(s) {
    this.slots.delete(s.prop.id);
    if (this.onRemove) this.onRemove(s);
  }

  // ~5 Hz: recycle by camera view, place new sprites where the life map is alive. view = {x0,y0,x1,y1}; lifeMap.sample(x,y).
  refresh(view, hero, lifeMap) {
    this.refreshes++;
    if (this.cap === 0 || !view || !lifeMap) return;
    const keep = KEEP_MARGIN;
    for (const s of [...this.slots.values()]) {
      const p = s.prop;
      if (p.x < view.x0 - keep || p.x > view.x1 + keep || p.y < view.y0 - keep || p.y > view.y1 + keep) this.drop(s);
      else if (s.life < EXIT && s.alpha < 0.02) this.drop(s);
    }
    if (this.slots.size >= this.cap) return;
    const sm = SPAWN_MARGIN;
    const c0 = Math.floor((view.x0 - sm) / CELL); const c1 = Math.floor((view.x1 + sm) / CELL);
    const r0 = Math.floor((view.y0 - sm) / CELL); const r1 = Math.floor((view.y1 + sm) / CELL);
    const cand = [];
    for (let cj = r0; cj <= r1; cj++) for (let ci = c0; ci <= c1; ci++) {
      for (const p of cellProps(ci, cj, this.seed, this.zone, this.world)) {
        if (this.slots.has(p.id) || p.d >= this.density) continue;
        if (p.flower && this.density < 1 && p.prio < 0.5) continue; // phone: drop half the (smallest-looking) flowers
        if (p.x < view.x0 - sm || p.x > view.x1 + sm || p.y < view.y0 - sm || p.y > view.y1 + sm) continue;
        if (hero && Math.hypot(p.x - hero.x, p.y - hero.y) < HERO_CLEAR) continue;
        const lf = lifeMap.sample(p.x, p.y);
        if (lf < ENTER) continue;
        cand.push({ p, lf });
      }
    }
    if (!cand.length) return;
    cand.sort((a, b) => a.p.prio - b.p.prio || a.p.id - b.p.id);
    for (const { p, lf } of cand) {
      if (this.slots.size >= this.cap) break;
      const s = { prop: p, alpha: 0, tgt: 0, ang: 0, life: lf, ref: null };
      this.slots.set(p.id, s);
      if (this.onAdd) this.onAdd(s);
    }
  }

  // ~20 Hz: fade with the life map and the hero clear zone, lean with the shared wind. t = sim time (s).
  step(dt, t, hero, lifeMap, reducedMotion = false) {
    if (this.cap === 0) return;
    const sc = windScale(reducedMotion);
    const k = Math.min(1, (dt > 0 ? dt : 0) * 6);
    for (const s of this.slots.values()) {
      const p = s.prop;
      s.life = lifeMap ? lifeMap.sample(p.x, p.y) : 0;
      let tgt = sstep(ALPHA_LO, ALPHA_HI, s.life) * MAX_ALPHA;
      if (hero) tgt *= sstep(HERO_CLEAR, HERO_FADE, Math.hypot(p.x - hero.x, p.y - hero.y));
      s.tgt = tgt;
      s.alpha += (tgt - s.alpha) * k;
      if (s.alpha < 0.004) s.alpha = 0;
      const live = 0.5 + 0.5 * sstep(ALPHA_LO, ALPHA_HI, s.life); // amplitude x life value
      const w = sc > 0 ? lean(p.x, p.y, t, 1, sc, 0) / sc : 0; // -1..1 independent of the reduced-motion scale
      s.ang = Math.tanh(w * SHAPE) / SHAPE_NORM * sc * AMP * p.amp * live + WOBBLE * sc * Math.sin(t * 0.9 + p.phase);
    }
  }
}

export { FRAME_COUNT };
