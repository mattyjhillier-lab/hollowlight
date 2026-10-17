// AL-5 critters: sparrow, hare and moths. The pure state machine (no Phaser, no DOM). AMBIENT ONLY and visual only: nothing in src/sim is
// imported, the sim RNG is never touched or advanced (placement is a pure function of the visual seed + grid cell, motion of the clock),
// creatures are only READ (x, y). Critters have no collision, no targeting, no drops, no hits and never gate anything.
//   Rules (docs/design/ambient-life-v1.md R3): they live on restored ground only; they FLEE the hero when it comes close; they HUSH
//   (fade out and stay away) when an enemy is near the hero or the critter, or during a swarm, and return only after a calm spell.
//   They look nothing like enemies (renderer): warm tan/cream, tiny, no glow, dark round eye, and they run away instead of approaching.
import { hash } from './wind.js';

export const SPARROW = 0; export const HARE = 1; export const MOTH = 2;
export const KIND_NAME = ['sparrow', 'hare', 'moth'];
export const ORDER = [SPARROW, HARE, MOTH, SPARROW, MOTH]; // quota order: cap 2 = sparrow + hare, 3 adds a moth, 5 = 2 sparrows + hare + 2 moths
export const CELL = 240; // placement grid
export const SPAWN_MARGIN = 150; // candidates are looked for in the view grown by this
export const CAND_P = 0.62; // chance a cell hosts a candidate
export const LIFE_MIN = 0.7; // clean restored life needed at the spot (and kept: below LIFE_KEEP the critter settles away)
export const LIFE_KEEP = 0.35;
export const TRIGGER = [74, 92, 42]; // hero distance that scares: sparrow, hare, moth
export const FLEE_SPEED = [128, 150, 72];
export const FLEE_S = 1.25; // seconds of running before fading out
export const HIDE_S = 0.45; // fade-out time (flee end, hush)
export const FADE_IN = 0.9;
export const HUSH_R = 150; // an enemy this close to the HERO hushes everything
export const HUSH_CRIT_R = 120; // an enemy this close to a critter hushes that critter
export const HUSH_N = 12; // this many enemies within SWARM_R of the hero = a swarm
export const SWARM_R = 420;
export const CALM_S = 6; // calm seconds before critters return (design: ~6 s)
export const SPAWN_GAP = 0.5; // seconds between spawn scans
export const MIN_HERO_DIST = 150; // never appear right next to the hero
export const MIN_ENEMY_DIST = 220; // nor next to an enemy
export const COOL_MIN = 6; export const COOL_MAX = 14; // per-cell cooldown after a critter leaves
export const PHONE_K = 0.6;

export const S_FADEIN = 0; export const S_IDLE = 1; export const S_FLEE = 2; export const S_HUSH = 3;

const fin = (v, d = 0) => (Number.isFinite(v) ? v : d);

export function critterCap(cap, { phone = false, reduced = false } = {}) {
  const c = Math.floor(fin(cap));
  if (c <= 0) return 0;
  return Math.min(c, Math.max(1, Math.floor(c * (phone ? PHONE_K : 1))));
}

// per-kind quotas for a cap (first `cap` entries of ORDER); moths are skipped with reduced motion (they are all motion)
export function quotas(cap, reduced = false, out = [0, 0, 0]) {
  out[0] = 0; out[1] = 0; out[2] = 0;
  for (let i = 0; i < cap && i < ORDER.length; i++) out[ORDER[i]]++;
  if (reduced) out[MOTH] = 0;
  return out;
}

// Pure placement: does grid cell (cx, cy) host a critter for this seed, and what/where? Writes into `out` (allocation-free).
// Returns true/false. Position is inside the cell, away from the cell border and at least 200 from the world edge.
export function candidate(seed, cx, cy, out, world = 4000) {
  const k = (Math.imul(cx | 0, 7919) + Math.imul(cy | 0, 104729) + Math.imul(seed | 0, 31337)) | 0;
  if (hash(k + 1) >= CAND_P) return false;
  const x = cx * CELL + 30 + (CELL - 60) * hash(k + 2);
  const y = cy * CELL + 30 + (CELL - 60) * hash(k + 3);
  if (!(x >= 200 && y >= 200 && x <= world - 200 && y <= world - 200)) return false;
  const r = hash(k + 4);
  out.kind = r < 0.38 ? SPARROW : r < 0.62 ? HARE : MOTH;
  out.x = x; out.y = y;
  out.key = ((cx + 512) << 12) | (cy + 512); // unique per cell
  out.h = hash(k + 5);
  return true;
}

export class CritterField {
  constructor(seed = 1, world = 4000) {
    this.seed = seed | 0;
    this.world = world;
    this.MAX = 5;
    this.cap = 0;
    this.reduced = false;
    this.q = [0, 0, 0];
    const mk = () => ({ on: false, key: -1, kind: 0, state: 0, x: 0, y: 0, z: 0, hx: 0, hy: 0, vx: 0, vy: 0, t: 0, st: 0, a: 0, face: 1, hop: 0, nextHop: 3, ph: 0, id: 0 });
    this.slots = Array.from({ length: this.MAX }, mk);
    this.cdKey = new Int32Array(16).fill(-1);
    this.cdUntil = new Float64Array(16);
    this.cdI = 0;
    this.cand = { kind: 0, x: 0, y: 0, key: 0, h: 0 };
    this.live = 0;
    this.hush = false;
    this.quiet = 0;
    this.scanT = 9;
    this.hushT = 9;
    this.spawnSerial = 0;
    this.stats = { spawned: 0, fled: 0, hushed: 0 };
  }

  reset(seed = this.seed) {
    this.seed = seed | 0;
    for (const s of this.slots) { s.on = false; s.key = -1; s.a = 0; }
    this.cdKey.fill(-1); this.cdUntil.fill(0); this.cdI = 0;
    this.live = 0; this.hush = false; this.quiet = 0; this.scanT = 9; this.hushT = 9; this.spawnSerial = 0;
    this.stats.spawned = 0; this.stats.fled = 0; this.stats.hushed = 0;
  }

  setBudget(cap, reduced = false) {
    const c = Math.max(0, Math.min(this.MAX, Math.floor(fin(cap))));
    this.reduced = !!reduced;
    if (c === this.cap && reduced === this._r) return;
    this._r = reduced;
    this.cap = c;
    quotas(c, reduced, this.q);
    for (const s of this.slots) if (s.on && c === 0) this.free(s);
  }

  free(s) { s.on = false; s.a = 0; s.key = -1; this.live--; }

  coolDown(key, until) {
    this.cdKey[this.cdI] = key; this.cdUntil[this.cdI] = until;
    this.cdI = (this.cdI + 1) % this.cdKey.length;
  }

  cooling(key, t) {
    for (let i = 0; i < this.cdKey.length; i++) if (this.cdKey[i] === key && this.cdUntil[i] > t) return true;
    return false;
  }

  occupied(key) {
    for (const s of this.slots) if (s.on && s.key === key) return true;
    return false;
  }

  kindCount(k) { let n = 0; for (const s of this.slots) if (s.on && s.kind === k) n++; return n; }

  // view = { x0, y0, x1, y1 }; hero = { x, y }; life has sampleClean(x, y); enemies = array of { x, y } (read only), nEn = count to read.
  update(dt, t, view, hero, life, enemies, nEn, reduced = this.reduced) {
    if (this.cap === 0 && this.live === 0) return;
    const d = dt > 0 ? (dt < 0.1 ? dt : 0.1) : 0;
    const hx = fin(hero.x); const hy = fin(hero.y);
    const n = enemies ? Math.min(nEn | 0, enemies.length) : 0;
    // ---- hush state (5 Hz): an enemy near the hero, or a swarm around it
    this.hushT += d;
    if (this.hushT >= 0.2) {
      const step = Math.min(this.hushT, 0.25); this.hushT = 0;
      let near = false; let swarm = 0;
      for (let i = 0; i < n; i++) {
        const e = enemies[i];
        const dx = e.x - hx; const dy = e.y - hy; const dd = dx * dx + dy * dy;
        if (dd < HUSH_R * HUSH_R) near = true;
        if (dd < SWARM_R * SWARM_R) swarm++;
      }
      this.hush = near || swarm >= HUSH_N;
      if (this.hush) this.quiet = 0; else this.quiet += step;
    }
    // ---- update live critters
    for (let si = 0; si < this.slots.length; si++) {
      const s = this.slots[si];
      if (!s.on) continue;
      s.t += d;
      const dx = s.x - hx; const dy = s.y - hy;
      const dh = Math.sqrt(dx * dx + dy * dy);
      if (s.state === S_FADEIN) {
        s.a += d / FADE_IN;
        if (s.a >= 1) { s.a = 1; s.state = S_IDLE; s.t = 0; }
      }
      if (s.state === S_FADEIN || s.state === S_IDLE) {
        let scared = dh < TRIGGER[s.kind];
        let hushed = this.hush;
        if (!hushed) for (let i = 0; i < n; i++) { const e = enemies[i]; const ex = e.x - s.x; const ey = e.y - s.y; if (ex * ex + ey * ey < HUSH_CRIT_R * HUSH_CRIT_R) { hushed = true; break; } }
        if (!hushed && life && fin(life.sampleClean(s.x, s.y)) < LIFE_KEEP) hushed = true; // ground went back to grey (trail faded)
        if (hushed) { s.state = S_HUSH; s.st = s.a; s.t = 0; this.stats.hushed++; } else if (scared) {
          s.st = s.a;
          if (reduced) { s.state = S_HUSH; s.t = 0; } else {
            s.state = S_FLEE; s.t = 0;
            const inv = dh > 0.001 ? 1 / dh : 0;
            let ux = dh > 0.001 ? dx * inv : 1; let uy = dh > 0.001 ? dy * inv : 0;
            const j = (hash(s.id * 31 + 7) - 0.5) * 0.9; // spread the bolt direction a little (rotate by j rad)
            const c = Math.cos(j); const sn = Math.sin(j);
            const rx = ux * c - uy * sn; const ry = ux * sn + uy * c; ux = rx; uy = ry;
            s.vx = ux * FLEE_SPEED[s.kind]; s.vy = uy * FLEE_SPEED[s.kind];
            if (ux !== 0) s.face = ux < 0 ? -1 : 1;
          }
          this.stats.fled++;
        }
      }
      if (s.state === S_IDLE) {
        if (!reduced) {
          if (s.kind === HARE && s.t >= s.nextHop) { // a small grazing hop toward a random heading
            s.hop = 0.34; s.nextHop = s.t + 3 + 5 * hash(s.id * 13 + (s.t | 0));
            const a = hash(s.id * 17 + (s.t * 10 | 0)) * 6.28;
            s.vx = Math.cos(a) * 20; s.vy = Math.sin(a) * 20;
            s.face = s.vx < 0 ? -1 : 1;
          }
          if (s.hop > 0) { s.hop -= d; s.x += s.vx * d; s.y += s.vy * d; if (s.hop <= 0) { s.hop = 0; s.vx = 0; s.vy = 0; } }
          if (s.kind === MOTH) { // lazy figure-of-eight round its home
            const w = t * 0.9 + s.ph;
            s.x = s.hx + Math.cos(w) * 15 + Math.sin(w * 2.3) * 4;
            s.y = s.hy + Math.sin(w * 1.3) * 9;
            s.z = 10 + Math.sin(w * 0.7) * 3;
          }
        }
      } else if (s.state === S_FLEE) {
        s.x += s.vx * d; s.y += s.vy * d;
        if (s.kind === SPARROW) s.z = Math.min(26, s.z + 90 * d);
        else if (s.kind === MOTH) s.z = Math.min(20, s.z + 20 * d);
        if (s.t >= FLEE_S || dh > 280) { s.state = S_HUSH; s.t = 0; s.st = s.a; }
      }
      if (s.state === S_HUSH) {
        const u = s.t / HIDE_S;
        s.a = s.st * (u >= 1 ? 0 : 1 - u);
        if (s.kind === SPARROW) s.z = Math.min(26, s.z + 60 * d);
        if (u >= 1) { this.coolDown(s.key, t + COOL_MIN + (COOL_MAX - COOL_MIN) * hash(s.id * 5 + 1)); this.free(s); }
      }
      if (!Number.isFinite(s.x) || !Number.isFinite(s.y)) this.free(s); // belt and braces
    }
    // ---- spawn: one candidate per scan, only when calm, only on restored ground in the view + margin
    this.scanT += d;
    if (this.scanT < SPAWN_GAP) return;
    this.scanT = 0;
    if (this.cap === 0 || this.hush || this.quiet < CALM_S || this.live >= this.cap) return;
    const cx0 = Math.floor((view.x0 - SPAWN_MARGIN) / CELL); const cx1 = Math.floor((view.x1 + SPAWN_MARGIN) / CELL);
    const cy0 = Math.floor((view.y0 - SPAWN_MARGIN) / CELL); const cy1 = Math.floor((view.y1 + SPAWN_MARGIN) / CELL);
    const c = this.cand;
    for (let cy = cy0; cy <= cy1; cy++) {
      for (let cx = cx0; cx <= cx1; cx++) {
        if (!candidate(this.seed, cx, cy, c, this.world)) continue;
        if (this.q[c.kind] <= this.kindCount(c.kind)) continue;
        if (this.occupied(c.key) || this.cooling(c.key, t)) continue;
        const dx = c.x - hx; const dy = c.y - hy;
        if (dx * dx + dy * dy < MIN_HERO_DIST * MIN_HERO_DIST) continue;
        if (c.x < view.x0 - SPAWN_MARGIN || c.x > view.x1 + SPAWN_MARGIN || c.y < view.y0 - SPAWN_MARGIN || c.y > view.y1 + SPAWN_MARGIN) continue;
        if (!life || fin(life.sampleClean(c.x, c.y)) < LIFE_MIN) continue;
        let free = true;
        for (let i = 0; i < n && free; i++) { const e = enemies[i]; const ex = e.x - c.x; const ey = e.y - c.y; if (ex * ex + ey * ey < MIN_ENEMY_DIST * MIN_ENEMY_DIST) free = false; }
        if (!free) continue;
        this.spawn(c, t);
        return;
      }
    }
  }

  spawn(c, t) {
    let s = null;
    for (const x of this.slots) if (!x.on) { s = x; break; }
    if (!s) return;
    s.on = true; s.key = c.key; s.kind = c.kind; s.state = S_FADEIN; s.x = c.x; s.y = c.y; s.hx = c.x; s.hy = c.y;
    s.z = c.kind === MOTH ? 10 : 0; s.vx = 0; s.vy = 0; s.t = 0; s.st = 0; s.a = 0; s.hop = 0;
    s.face = c.h < 0.5 ? -1 : 1; s.nextHop = 2 + 5 * c.h; s.ph = c.h * 6.28; s.id = ++this.spawnSerial * 7 + c.key;
    this.live++;
    this.stats.spawned++;
  }
}

// frame index into the critter atlas (see critteratlas.js FRAME_NAMES): 0 sparrow sit, 1 peck, 2/3 fly, 4 hare sit, 5 hare leap, 6/7 moth
export function frameOf(s, t, reduced = false) {
  if (s.kind === SPARROW) {
    if (s.state === S_FLEE || (s.state === S_HUSH && s.z > 2)) return 2 + ((t * 14) & 1);
    return !reduced && s.state === S_IDLE && (((t + s.ph) % 3.2) < 0.45) ? 1 : 0;
  }
  if (s.kind === HARE) {
    if (s.state === S_FLEE) return ((t * 6 + s.ph) % 1) < 0.62 ? 5 : 4;
    return s.hop > 0 ? 5 : 4;
  }
  return 6 + ((t * 18 + s.ph) & 1);
}

// vertical hop (world units) added on top of z for a hopping hare
export function hopLift(s, t) {
  if (s.kind !== HARE) return 0;
  if (s.state === S_FLEE) { const u = ((t * 6 + s.ph) % 1); return 7 * Math.sin(Math.min(1, u / 0.62) * Math.PI); }
  if (s.hop > 0) return 3 * Math.sin((1 - s.hop / 0.34) * Math.PI);
  return 0;
}
