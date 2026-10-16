// AL-4 creature-reactive foliage: the pure (no Phaser, no DOM) pusher list + lean target + damped spring. Visual only: nothing in
// src/sim is imported, the sim RNG is never touched or advanced, creatures are only READ (x, y, r, speed, id). It adds ONE extra lean
// term (a per-sprite damped spring) on top of the shared wind in the pooled AL-1 sway sprites and the W4 bush/fern/bramble bodies and
// tree crowns, so no new sprites exist. Ground that is not restored has no sprites/blend, so the Hollow stays still (R5); the term is
// also multiplied by the restored amount. Depth, clear zone and alpha rules are unchanged (the layers own them).
//   Pushers: the hero + the first N enemies by a stable hash (spread across the view, no flicker) that are in view and outside the hero core.
//   Strength: hero = speed (passing, not standing); enemy = size x speed. Lean target is AWAY from the pusher along x (sprites rotate about the base).
import { hash } from './wind.js';

export const HERO_R = 132; // reach of the hero push on grass tufts: flat to 0.7 R, so sprites in the 78-112 clear-zone fade ring still bend as it passes
export const FLAT = 0.7; // fraction of R at full strength, smooth to 0 at R
export const ENEMY_R0 = 24; // enemy reach = ENEMY_R0 + ENEMY_RK * r
export const ENEMY_RK = 1.5;
export const ENEMY_GAIN = 0.8; // an enemy leans foliage a bit less than the hero
export const HERO_DEAD = 6; // hero speed (units/s) below which it pushes nothing
export const HERO_FULL = 96; // hero speed that counts as full strength (Wren base speed)
export const ENEMY_CORE = 50; // enemies this close to the hero are never picked (their foliage is in the hero clear zone anyway)
export const SPRING_K = 190; // damped spring: omega ~ 13.8 rad/s (period ~0.45 s)
export const SPRING_C = 13; // damping ratio ~0.47: one small overshoot (~18%), settled in ~0.5 s
export const MAX_DT = 0.08; // spring step clamp (omega*dt < 2 keeps it stable)
export const SPRING_MAX = 0.62; // hard clamp on the spring angle (rad)
export const AMP_TUFT = 0.3; // push lean for sway tufts/flowers (rad, ~17 deg) on top of the wind (<= ~0.3)
export const AMP_BODY = 0.17; // bush / fern / bramble bodies (bigger things bend less)
export const AMP_CROWN = 0.04; // oak/snag crowns (~2.3 deg: a tall crown only shivers)
export const PROP_RS = 0.5; // radius scale for props (the hero can walk right up to a bush; no clear zone)
export const PUSH_BODY = { bush: 1, fern: 1, bramble: 0.8 }; // body kinds that react (x amp); crowns of oak/snag react via AMP_CROWN
export const STEP_S = 0.05; // pusher list refresh period (20 Hz)

const TAU_DIR = 14; // tanh softness of the away direction near dx = 0
const sstep = (a, b, v) => { const t = v <= a ? 0 : v >= b ? 1 : (v - a) / (b - a); return t * t * (3 - 2 * t); };
const fin = (v, d = 0) => (Number.isFinite(v) ? v : d);

// Source budget (hero included) for a tier. total = CAPS.<tier>.ambient.push. Phone x0.6 (never below the hero), reduced motion = hero only.
export function pushBudget(total, { phone = false, reduced = false } = {}) {
  const t = Math.floor(fin(total));
  if (t <= 0) return 0;
  if (reduced) return 1;
  return Math.max(1, Math.floor(t * (phone ? 0.6 : 1)));
}

export class PushField {
  constructor() {
    this.max = 16;
    this.n = 0; // live sources
    this.px = new Float32Array(this.max);
    this.py = new Float32Array(this.max);
    this.R = new Float32Array(this.max);
    this.S = new Float32Array(this.max); // strength 0..1.2
    this.V = new Float32Array(this.max); // velocity direction x (-1..1) used for the wake
    this.budget = 0;
    this.acc = 9;
    this.lastX = NaN; this.lastY = NaN;
    this.spd = 0; this.vxn = 0;
    this.pickKey = new Float64Array(this.max); // hash keys of the picked enemies (insertion sorted, desc)
    this.pickIdx = new Int32Array(this.max);
  }

  // total sources incl. the hero (0 disables everything)
  setBudget(total) {
    const b = Math.max(0, Math.min(this.max, Math.floor(fin(total))));
    if (b !== this.budget) { this.budget = b; this.acc = 9; if (b === 0) this.n = 0; }
  }

  reset() { this.n = 0; this.acc = 9; this.lastX = NaN; this.lastY = NaN; this.spd = 0; this.vxn = 0; }

  // call every frame; the list refreshes at 20 Hz. hero = {x, y}; enemies = array of {x, y, r, speed, id}; view = {x0, y0, x1, y1}
  update(dt, hero, enemies, nEnemies, view, reduced = false) {
    const d = fin(dt) > 0 ? Math.min(dt, 0.25) : 0;
    this.acc += d;
    if (this.acc < STEP_S) return;
    const step = this.acc; this.acc = 0;
    if (this.budget <= 0 || !hero || !Number.isFinite(hero.x) || !Number.isFinite(hero.y)) { this.n = 0; return; }
    // hero velocity from its own motion (smoothed); a teleport/respawn counts as no push
    if (Number.isFinite(this.lastX)) {
      const dx = hero.x - this.lastX; const dy = hero.y - this.lastY;
      const sp = Math.hypot(dx, dy) / step;
      const ok = sp < 400;
      const k = 1 - Math.exp(-step * 14);
      this.spd += ((ok ? sp : 0) - this.spd) * k;
      const tvx = ok && sp > 1 ? dx / (sp * step) : 0;
      this.vxn += (tvx - this.vxn) * k;
    }
    this.lastX = hero.x; this.lastY = hero.y;
    const hs = Math.max(0, Math.min(1, (this.spd - HERO_DEAD) / (HERO_FULL - HERO_DEAD)));
    this.px[0] = hero.x; this.py[0] = hero.y; this.R[0] = HERO_R; this.S[0] = hs; this.V[0] = hs > 0 ? Math.max(-1, Math.min(1, this.vxn)) : 0;
    let n = 1;
    const room = this.budget - 1;
    if (room > 0 && !reduced && enemies && nEnemies > 0 && view) {
      let m = 0;
      const pad = 24;
      for (let i = 0; i < nEnemies; i++) {
        const e = enemies[i];
        if (!e) continue;
        const ex = e.x; const ey = e.y;
        if (!(ex >= view.x0 - pad && ex <= view.x1 + pad && ey >= view.y0 - pad && ey <= view.y1 + pad)) continue;
        if (Math.hypot(ex - hero.x, ey - hero.y) < ENEMY_CORE) continue;
        const key = hash((e.id | 0) * 31 + 7) + 1e-9 * i;
        // insertion into the top-`room` list by key (desc)
        let j = m;
        if (m < room) m++; else if (key <= this.pickKey[room - 1]) continue; else j = room - 1;
        while (j > 0 && this.pickKey[j - 1] < key) { this.pickKey[j] = this.pickKey[j - 1]; this.pickIdx[j] = this.pickIdx[j - 1]; j--; }
        this.pickKey[j] = key; this.pickIdx[j] = i;
      }
      for (let j = 0; j < m; j++) {
        const e = enemies[this.pickIdx[j]];
        const r = fin(e.r, 6);
        const size = Math.max(0.6, Math.min(1.5, 0.55 + r / 20));
        const spd = Math.max(0.4, Math.min(1, fin(e.speed, 40) / 62));
        this.px[n] = e.x; this.py[n] = e.y; this.R[n] = ENEMY_R0 + ENEMY_RK * r; this.S[n] = size * spd * ENEMY_GAIN; this.V[n] = 0;
        n++;
      }
    }
    this.n = n;
  }

  // lean target -1..1 at (x, y): positive = lean toward +x (tip right), i.e. away from pushers on the left. rs scales every reach (props: PROP_RS).
  targetAt(x, y, rs = 1) {
    let sum = 0;
    for (let i = 0; i < this.n; i++) {
      const s = this.S[i];
      if (!(s > 0)) continue;
      const R = this.R[i] * rs;
      const dx = x - this.px[i]; const dy = y - this.py[i];
      if (dx > R || dx < -R || dy > R || dy < -R) continue;
      const dd = Math.sqrt(dx * dx + dy * dy);
      if (dd >= R) continue;
      const f = 1 - sstep(R * FLAT, R, dd);
      const dir = 0.75 * Math.tanh(dx / TAU_DIR) + 0.25 * this.V[i];
      sum += dir * f * s;
    }
    return sum > 1 ? 1 : sum < -1 ? -1 : fin(sum);
  }
}

// Damped spring for one slot: st = { pa, pv } (angle, angular velocity). tgt = target angle (rad). Clamps and NaN-guards.
export function springStep(st, tgt, dt) {
  let d = fin(dt) > 0 ? dt : 0;
  if (d > 0.25) d = 0.25;
  const t = fin(tgt);
  while (d > 1e-6) {
    const h = d > MAX_DT ? MAX_DT : d;
    st.pv += (SPRING_K * (t - st.pa) - SPRING_C * st.pv) * h;
    st.pa += st.pv * h;
    d -= h;
  }
  if (!Number.isFinite(st.pa)) st.pa = 0;
  if (!(Math.abs(st.pa) < SPRING_MAX)) st.pa = st.pa > 0 ? SPRING_MAX : -SPRING_MAX;
  if (!Number.isFinite(st.pv)) st.pv = 0;
  if (Math.abs(st.pa) < 1e-4 && Math.abs(st.pv) < 1e-3 && Math.abs(t) < 1e-4) { st.pa = 0; st.pv = 0; }
}
