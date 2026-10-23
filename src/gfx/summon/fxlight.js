// S7 shared FX "Light in, light out" (docs/design/summons-art-v1.md 3.6 A, LOCKED Summons art #3). Render only, pure JS (no Phaser/DOM):
// it reads unit ids/positions and the sim hit log, never writes the sim. Draw calls go to a Graphics-like object (unit-testable with a mock).
//   spawn   light gathers from the hero's lantern into the spirit: a mote flies lantern -> spirit while a ring closes on it (SPAWN_T)
//   despawn 5 warm cream-amber motes (never gold) drift up and fade (DESPAWN_T)
//   hits    each weapon's verb as a tiny shape <= HIT_T: wolf claw crescents, raven star + feather, glyph ink spatter
//           (chain crack-star = S6 CrackPool, flame flare + Burn licks = S4 / burn readout: reused, not duplicated)
//   rims    one shared gold-rim budget per frame across every weapon (the rims themselves are baked per weapon in S2-S5)
// Calm motion: no rings, no drift, no swipe: every beat is a plain monotonic fade (0 crossings/s, rule <= 3).
export const SPAWN_T = 0.25, DESPAWN_T = 0.4, HIT_T = 0.15, MOTES = 5;
export const GOLD = 0xffd36b; // evolved rims ONLY (never used here)
export const MOTE_COL = [0xfff1c8, 0xffe6b4, 0xffdfa6, 0xfff6dc, 0xffe9bc]; // warm cream-amber (low saturation, never the gold)
export const RING_COL = 0xffe9bc, CORE_COL = 0xfff6dc;
export const CLAW_COL = 0xd2ecff, STAR_COL = 0xf0e6ff, FEATHER_COL = 0xefe1c0, FEATHER_INK = 0x34236e, INK_COL = 0x145a72, INK_LIT = 0x7ff0ff;
export const VERB_OF = { ghost_wolves: 'claw', raven_flock: 'star', spirit_bolts: 'ink' }; // chain_lightning / holy_orbit verbs already drawn (S6 / S4)
export const SPAWN_KINDS = ['wolf', 'raven', 'orb']; // persistent spirits (echoes rise with their own S2 motes; bolts are shots, not spirits)

// Per-tier budget (section 5 table). phone multipliers apply where the table gives one.
export const FX_CAPS = {
  high: { bodies: 40, halos: 160, ribbons: 12, echoes: 10, decals: 40, beats: 12, rims: 40 },
  med: { bodies: 28, halos: 90, ribbons: 6, echoes: 6, decals: 24, beats: 8, rims: 24 },
  low: { bodies: 20, halos: 40, ribbons: 0, echoes: 3, decals: 12, beats: 3, rims: 12 },
};
export const PHONE_K = { bodies: 0.85, halos: 0.6, ribbons: 0.85, decals: 0.6 };
export function fxCap(tier, key, phone = false) {
  const c = (FX_CAPS[tier] || FX_CAPS.med)[key];
  if (!Number.isFinite(c)) return 0;
  return phone && PHONE_K[key] ? Math.round(c * PHONE_K[key]) : c;
}

const fin = (v, d = 0) => (Number.isFinite(v) ? v : d);
const ease = (k) => 1 - (1 - k) * (1 - k);
const hh = (n) => { n = Math.imul((n | 0) ^ 0x5bd1e995, 0x2c1b3c6d); n ^= n >>> 13; n = Math.imul(n, 0x297a2d39); n ^= n >>> 15; return (n >>> 0) / 4294967296; }; // [0,1)

// Fixed pool of in-flight beats (spawn + despawn share the 'beats' cap). add() refuses when full: the cap is never exceeded.
export class BeatPool {
  constructor(n = 12) { this.buf = Array.from({ length: n }, () => ({ on: false, kind: 0, t0: 0, x: 0, y: 0, lx: 0, ly: 0, ref: null, s: 0 })); this.cap = n; }
  setCap(c) { this.cap = Math.max(0, Math.min(this.buf.length, c | 0)); }
  clear() { for (const b of this.buf) { b.on = false; b.ref = null; } }
  live(t) { let n = 0; for (const b of this.buf) if (b.on && t - b.t0 < (b.kind ? DESPAWN_T : SPAWN_T)) n++; return n; }
  // kind 0 spawn (ref = live {x,y} of the spirit, lx/ly = the lantern), 1 despawn (x/y = where it went)
  add(kind, t, x, y, lx, ly, ref, s) {
    if (this.live(t) >= this.cap) return false;
    for (const b of this.buf) {
      if (b.on && t - b.t0 < (b.kind ? DESPAWN_T : SPAWN_T)) continue;
      b.on = true; b.kind = kind ? 1 : 0; b.t0 = fin(t); b.x = fin(x); b.y = fin(y); b.lx = fin(lx, b.x); b.ly = fin(ly, b.y); b.ref = ref || null; b.s = s | 0;
      return true;
    }
    return false;
  }
  draw(g, t, calm, vx0 = -1e9, vy0 = -1e9, vx1 = 1e9, vy1 = 1e9) {
    let n = 0;
    for (const b of this.buf) {
      if (!b.on) continue;
      const age = t - b.t0, life = b.kind ? DESPAWN_T : SPAWN_T;
      if (age < 0 || age >= life) { b.on = false; b.ref = null; continue; }
      const k = age / life, x = b.ref ? fin(b.ref.x, b.x) : b.x, y = b.ref ? fin(b.ref.y, b.y) : b.y;
      if (x < vx0 || x > vx1 || y < vy0 || y > vy1) continue;
      n++;
      if (b.kind === 0) drawSpawn(g, k, x, y, b.lx, b.ly, calm);
      else drawDespawn(g, k, x, y, b.s, calm);
    }
    return n;
  }
}

// spawn: ring closes 10 -> 2 u on the spirit while a mote travels from the lantern into it. Calm: a still glow that fades (no ring).
export function drawSpawn(g, k, x, y, lx, ly, calm) {
  if (calm) { g.fillStyle(CORE_COL, 0.45 * (1 - k)).fillCircle(x, y, 4); return; }
  const e = ease(k), r = 2 + 8 * (1 - e);
  g.lineStyle(1.3, RING_COL, 0.45 + 0.3 * e).strokeCircle(x, y, r);
  const mx = lx + (x - lx) * e, my = ly + (y - ly) * e, tx = lx + (x - lx) * Math.max(0, e - 0.18), ty = ly + (y - ly) * Math.max(0, e - 0.18);
  g.lineStyle(1.2, RING_COL, 0.35 * (1 - k)).lineBetween(tx, ty, mx, my);
  g.fillStyle(CORE_COL, 0.8).fillCircle(mx, my, 1.8);
}

// despawn: 5 motes drift up 12-16 u and fade. Calm: they fade where they are.
export function drawDespawn(g, k, x, y, s, calm) {
  const a = 0.8 * (1 - k), up = calm ? 0 : ease(k) * 14;
  for (let m = 0; m < MOTES; m++) {
    const ox = (m - 2) * 2.6 + (hh(s + m * 7) - 0.5) * 1.6, oy = -1 - (m % 2) * 2 - (hh(s + m * 13) * 2);
    g.fillStyle(MOTE_COL[m], a).fillCircle(x + ox, y + oy - up * (0.85 + 0.3 * hh(s + m * 31)), 1.3 - 0.5 * k);
  }
}

// Verb hits: fixed pool; live count is held under cap (the impact-decal budget is shared with the S6 crack-stars by the caller).
export class HitPool {
  constructor(n = 40) { this.buf = Array.from({ length: n }, () => ({ t0: -99, x: 0, y: 0, v: '', s: 0 })); this.cap = n; this.i = 0; }
  setCap(c) { this.cap = Math.max(0, Math.min(this.buf.length, c | 0)); }
  clear() { for (const d of this.buf) d.t0 = -99; }
  live(t) { let n = 0; for (const d of this.buf) { const a = t - d.t0; if (a >= 0 && a < HIT_T) n++; } return n; }
  add(v, t, x, y, s, cap = this.cap) {
    if (!VERB_OF_SET.has(v) || this.live(t) >= Math.min(cap, this.cap)) return false;
    for (let j = 0; j < this.buf.length; j++) {
      const d = this.buf[(this.i + j) % this.buf.length], a = t - d.t0;
      if (a >= 0 && a < HIT_T) continue;
      d.t0 = fin(t); d.x = fin(x); d.y = fin(y); d.v = v; d.s = s | 0;
      this.i = (this.i + j + 1) % this.buf.length;
      return true;
    }
    return false;
  }
  // gl = additive Graphics (claws, stars), gn = normal Graphics (ink spatter, feather)
  draw(gl, gn, t, calm, vx0 = -1e9, vy0 = -1e9, vx1 = 1e9, vy1 = 1e9) {
    let n = 0;
    for (const d of this.buf) {
      const age = t - d.t0;
      if (age < 0 || age >= HIT_T || d.x < vx0 || d.x > vx1 || d.y < vy0 || d.y > vy1) continue;
      n++;
      const k = age / HIT_T;
      if (d.v === 'claw') drawClaw(gl, k, d.x, d.y, d.s, calm);
      else if (d.v === 'star') drawStar(gl, gn, k, d.x, d.y, d.s, calm);
      else drawInk(gn, k, d.x, d.y, d.s);
    }
    return n;
  }
}
const VERB_OF_SET = new Set(Object.values(VERB_OF));

// wolf: two claw crescents raked across the foe (the swipe sweeps in over the first half; Calm: full shape, fade only)
export function drawClaw(g, k, x, y, s, calm) {
  const a = 0.85 * (k < 0.5 ? 1 : 1 - (k - 0.5) / 0.5), sw = calm ? 1 : Math.min(1, 0.35 + k * 1.6), dir = hh(s) < 0.5 ? -1 : 1, base = -0.9 * dir;
  for (let c = 0; c < 2; c++) {
    const cx = x + (c - 0.5) * 3 * dir, cy = y - 3 + (c - 0.5) * 2;
    g.lineStyle(2, CLAW_COL, a).beginPath();
    g.arc(cx, cy, 5.5, base - 0.9 * sw, base + 0.9 * sw, false);
    g.strokePath();
  }
}

// raven: a small 4-point star where the beak struck + one cream letter-paper feather beside it (drifts 2 u; Calm: still)
export function drawStar(gl, gn, k, x, y, s, calm) {
  const a = 0.9 * (1 - k), r = 4.5 * (calm ? 1 : 0.7 + 0.3 * ease(Math.min(1, k * 2))), cy = y - 3;
  gl.fillStyle(STAR_COL, a);
  gl.fillTriangle(x - r, cy, x, cy - r * 0.28, x + r, cy).fillTriangle(x - r, cy, x, cy + r * 0.28, x + r, cy);
  gl.fillTriangle(x, cy - r, x - r * 0.28, cy, x, cy + r).fillTriangle(x, cy - r, x + r * 0.28, cy, x, cy + r);
  const side = hh(s + 3) < 0.5 ? -1 : 1, fx = x + side * (5 + (calm ? 0 : 2 * k)), fy = cy + 2 + (calm ? 0 : 2 * k);
  gn.fillStyle(FEATHER_COL, 0.9 * (1 - k)).fillEllipse(fx, fy, 2.2, 5);
  gn.lineStyle(0.8, FEATHER_INK, 0.7 * (1 - k)).lineBetween(fx, fy - 2.4, fx, fy + 2.6);
}

// glyph: a splash of ink dots where the orb broke (static, fades)
export function drawInk(g, k, x, y, s) {
  const a = 0.75 * (1 - k);
  for (let m = 0; m < 5; m++) {
    const an = hh(s + m * 11) * 6.2832, d = 2.5 + hh(s + m * 17) * 3.5;
    g.fillStyle(INK_COL, a).fillCircle(x + Math.cos(an) * d, y - 3 + Math.sin(an) * d * 0.7, 0.9 + hh(s + m * 23) * 1.1);
  }
  g.fillStyle(INK_LIT, a * 0.6).fillCircle(x, y - 3, 1.1);
}

// Tracks persistent spirits by id across frames: a new id = spawn beat, an id gone from the sim = despawn beat at its last position.
// Hidden units keep their entry silently (the Judgement Wheel rest has its own S4 flower). Allocation only when a spirit appears.
export class SpiritTracker {
  constructor() { this.m = new Map(); this.tick = 0; this.primed = false; }
  clear() { this.m.clear(); this.primed = false; }
  // calls onSpawn(entry) / onDespawn(entry) where entry = { id, x, y, kind }
  update(units, onSpawn, onDespawn) {
    const tk = ++this.tick;
    for (const u of units) {
      if (!u || !SPAWN_KINDS.includes(u.kind)) continue;
      let e = this.m.get(u.id);
      if (!e) { e = { id: u.id, x: fin(u.x), y: fin(u.y), kind: u.kind, tick: tk, hid: !!u.hidden }; this.m.set(u.id, e); if (onSpawn && !u.hidden) onSpawn(e); continue; }
      e.tick = tk; e.hid = !!u.hidden; // a resting (hidden) light keeps its entry: no despawn / respawn beat for the Wheel's rest
      if (!u.hidden) { e.x = fin(u.x, e.x); e.y = fin(u.y, e.y); }
    }
    for (const [id, e] of this.m) if (e.tick !== tk) { this.m.delete(id); if (e.hid !== true && onDespawn) onDespawn(e); }
    this.primed = true;
  }
}

// Unified gold-rim budget: evolved units take a rim from one per-frame pool shared by every weapon; over the cap they draw their plain frame.
export class RimBudget {
  constructor() { this.n = 0; this.cap = 40; }
  begin(tier, n = fxCap(tier, 'rims')) { this.n = 0; this.cap = n; }
  take() { if (this.n >= this.cap) return false; this.n++; return true; }
}

// Calm rule helper (tests + harness): direction changes per second of a sampled signal (a flicker or bob shows as many crossings).
export function crossingsPerSec(vals, dt) {
  let c = 0, last = 0;
  for (let i = 1; i < vals.length; i++) {
    const d = vals[i] - vals[i - 1];
    if (Math.abs(d) < 1e-9) continue;
    const sg = d > 0 ? 1 : -1;
    if (last && sg !== last) c++;
    last = sg;
  }
  const T = (vals.length - 1) * dt;
  return T > 0 ? c / T : 0;
}
