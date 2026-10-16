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
// AL-2 restore-bloom: a prop that appears because the ground BECAME restored (its life sample rose from below ENTER while it was in view)
// starts as a bud and pops open when life crosses BLOOM_ON (and it is visible: outside the hero clear zone). Props that scroll in already
// restored are simply open (no pop). Hysteresis: re-armed only after life falls below BLOOM_OFF and the sprite has faded out.
export const BLOOM_ON = 0.5;
export const BLOOM_OFF = 0.3;
export const BLOOM_T = 0.5; // flower pop length (s)
export const TUFT_T = 0.38; // tuft sprout length (s)
export const BUD_FLOWER = 0.4; // bud scale (x full size)
export const BUD_TUFT = 0.6;
export const BLOOM_RATE = 6; // flower pops per second (token bucket), tufts are not limited (no extra sprites)
export const BLOOM_BURST = 3;
export const OVERSHOOT = 1.70158; // ease-out-back: ~10% overshoot of the growth range (~4-6% of the sprite)
export const POP_SPIN = 0.5; // radians of rotate-in
export const HERO_SEE = 0.35; // hero clear-zone visibility needed before a pop starts (so it is seen, not wasted under the hero)

const TAU = Math.PI * 2;
const SHAPE_NORM = Math.tanh(SHAPE);
export function easeOutBack(u) {
  if (!(u > 0)) return 0;
  if (u >= 1) return 1;
  const c3 = OVERSHOOT + 1;
  const v = u - 1;
  return 1 + c3 * v * v * v + OVERSHOOT * v * v;
}
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
    this.mem = new Map(); // id -> last life sampled while the prop was in view and unplaced (AL-2: tells a rise from a scroll-in)
    this.tokens = BLOOM_BURST;
    this.onPop = null; // (slot) -> void   (flowers only: the renderer may add a petal sparkle)
    this.pops = 0;
  }

  get count() { return this.slots.size; }

  reset(seed = this.seed) {
    this.clear();
    this.seed = seed | 0;
  }

  clear() {
    this.mem.clear();
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
    if (this.cap === 0 || !view || !lifeMap) { this.mem.clear(); return; }
    const keep = KEEP_MARGIN;
    for (const s of [...this.slots.values()]) {
      const p = s.prop;
      if (p.x < view.x0 - keep || p.x > view.x1 + keep || p.y < view.y0 - keep || p.y > view.y1 + keep) this.drop(s);
      else if (s.life < EXIT && s.alpha < 0.02) this.drop(s);
    }
    const sm = SPAWN_MARGIN;
    const c0 = Math.floor((view.x0 - sm) / CELL); const c1 = Math.floor((view.x1 + sm) / CELL);
    const r0 = Math.floor((view.y0 - sm) / CELL); const r1 = Math.floor((view.y1 + sm) / CELL);
    const cand = [];
    const mem = this.mem; const nextMem = new Map();
    for (let cj = r0; cj <= r1; cj++) for (let ci = c0; ci <= c1; ci++) {
      for (const p of cellProps(ci, cj, this.seed, this.zone, this.world)) {
        if (this.slots.has(p.id) || p.d >= this.density) continue;
        if (p.flower && this.density < 1 && p.prio < 0.5) continue; // phone: drop half the (smallest-looking) flowers
        if (p.x < view.x0 - sm || p.x > view.x1 + sm || p.y < view.y0 - sm || p.y > view.y1 + sm) continue;
        const lf = lifeMap.sample(p.x, p.y);
        nextMem.set(p.id, lf);
        if (hero && Math.hypot(p.x - hero.x, p.y - hero.y) < HERO_CLEAR) continue;
        if (lf < ENTER) continue;
        cand.push({ p, lf, rose: mem.has(p.id) && mem.get(p.id) < ENTER });
      }
    }
    this.mem = nextMem;
    if (!cand.length) return;
    cand.sort((a, b) => a.p.prio - b.p.prio || a.p.id - b.p.id);
    for (const { p, lf, rose } of cand) {
      if (this.slots.size >= this.cap) break;
      // rose = the ground was seen unrestored and has now come alive: start as a bud (it pops when life crosses BLOOM_ON)
      const bud = !!rose;
      const s = { prop: p, alpha: 0, tgt: 0, ang: 0, life: lf, ref: null, bloomed: !bud, pop: -1, sc: bud ? (p.flower ? BUD_FLOWER : BUD_TUFT) : 1, rot: 0 };
      this.slots.set(p.id, s);
      if (this.onAdd) this.onAdd(s);
    }
  }

  // AL-2: bud -> pop (ease-out-back scale + rotate-in) -> open. Never reverses on life decay (the sprite just fades out).
  bloom(s, dt, hf, reduced) {
    const p = s.prop;
    if (s.bloomed) {
      if (s.pop >= 0) {
        s.pop += dt;
        const T = p.flower ? BLOOM_T : TUFT_T;
        const u = s.pop / T;
        if (u >= 1) { s.pop = -1; s.sc = 1; s.rot = 0; } else {
          const bud = p.flower ? BUD_FLOWER : BUD_TUFT;
          s.sc = bud + (1 - bud) * easeOutBack(u);
          s.rot = (p.phase > 3.14 ? 1 : -1) * POP_SPIN * (1 - u) * (1 - u);
        }
      } else if (s.life < BLOOM_OFF && s.alpha < 0.06) {
        // faded out below the hysteresis threshold: re-arm as a bud (invisible), so a later rise pops again
        s.bloomed = false; s.sc = p.flower ? BUD_FLOWER : BUD_TUFT; s.rot = 0;
      }
      return;
    }
    if (s.life < BLOOM_ON || hf < HERO_SEE) return;
    if (reduced) { s.bloomed = true; s.sc = 1; s.rot = 0; return; } // reduced motion: instant
    if (p.flower) {
      if (this.tokens < 1) return;
      this.tokens -= 1;
      this.pops++;
      s.bloomed = true; s.pop = 0;
      if (this.onPop) this.onPop(s);
    } else { s.bloomed = true; s.pop = 0; }
  }

  // ~20 Hz: fade with the life map and the hero clear zone, lean with the shared wind. t = sim time (s).
  step(dt, t, hero, lifeMap, reducedMotion = false) {
    if (this.cap === 0) return;
    const sc = windScale(reducedMotion);
    const k = Math.min(1, (dt > 0 ? dt : 0) * 6);
    const d0 = dt > 0 ? (dt > 0.25 ? 0.25 : dt) : 0;
    this.tokens = Math.min(BLOOM_BURST, this.tokens + d0 * BLOOM_RATE);
    for (const s of this.slots.values()) {
      const p = s.prop;
      s.life = lifeMap ? lifeMap.sample(p.x, p.y) : 0;
      let tgt = sstep(ALPHA_LO, ALPHA_HI, s.life) * MAX_ALPHA;
      let hf = 1;
      if (hero) { hf = sstep(HERO_CLEAR, HERO_FADE, Math.hypot(p.x - hero.x, p.y - hero.y)); tgt *= hf; }
      this.bloom(s, d0, hf, reducedMotion);
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
