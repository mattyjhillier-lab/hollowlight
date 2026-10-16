// HUD-3: floating number logic, pure JS (no Phaser/DOM) so merge, caps, scaling and reduced motion are unit-testable.
// Display-only: fed from sim hit records and HUD-side deltas, never writes to the sim. Fixed slot array, no allocation per call.
// Rules (docs/research/28 s3, hud-proof-4): cream by default, bigger + warmer for big hits (never gold), sum rapid hits per
// target per 120ms, hard cap on live numbers (drop the SMALLEST first), heal soft teal '+30', damage taken light red '-9'.
export const KIND = { DMG: 0, BIG: 1, HEAL: 2, HURT: 3, BLEED: 4 }; // BLEED: batched damage-over-time tick, small, pale blue, first to be dropped
export const MERGE_WINDOW = 0.12; // s
export const MAX_SLOTS = 40;
const LIFE = [0.5, 0.7, 0.9, 0.9, 0.7]; // per kind, seconds
const RISE = [20, 22, 16, 16, 14]; // px of float (none when reduced motion)

const fin = (v, d = 0) => (Number.isFinite(v) ? v : d);

// "38", "1.2k", "12k", "1.2M". Never NaN/Infinity/negative, never wraps (nowrap by construction: one short token).
export function fmtNum(v) {
  let n = Math.floor(fin(v, 0));
  if (n < 0) n = 0;
  if (n < 10000) return String(n);
  if (n < 1e6) return `${n >= 1e5 ? Math.round(n / 1e3) : (n / 1e3).toFixed(1).replace(/\.0$/, '')}k`;
  if (n >= 1e9) return '999M';
  return `${n >= 1e7 ? Math.round(n / 1e6) : (n / 1e6).toFixed(1).replace(/\.0$/, '')}M`;
}
export const fmtSigned = (v, sign) => sign + fmtNum(v);

// Size multiplier from hit size relative to the running typical hit: 1 below 3x, 1.4x at 3x, rising to the hard cap 2x.
export function sizeMul(val, ref) {
  val = fin(val, 0); ref = fin(ref, 0);
  if (!(ref > 0) || !(val > 0)) return 1;
  const r = val / ref;
  if (r < 3) return 1;
  return Math.min(2, 1.4 + 0.6 * Math.min(1, (r - 3) / 12));
}

// Running "typical hit" (EMA). Big hits are judged against it, so scaling stays relative as the run grows.
export class HitRef {
  constructor() { this.v = 0; this.n = 0; }
  add(a) {
    a = fin(a, 0);
    if (!(a > 0)) return;
    this.v = this.n === 0 ? a : this.v + (a - this.v) * 0.05;
    this.n++;
  }
  // 0 until warmed up (so the first hits of a run are never "big")
  get ref() { return this.n >= 8 ? this.v : 0; }
}

// Lower number = more expendable: bleed ticks first, then hits by size; player lanes (heal/hurt) outrank any damage number.
export function prioOf(kind, val) { return kind === KIND.BLEED ? val - 1e6 : kind === KIND.HEAL || kind === KIND.HURT ? 1e12 + val : val; }

export class NumPool {
  constructor(cap = 24) {
    this.slots = Array.from({ length: MAX_SLOTS }, () => ({ on: false, age: 0, life: 0.5, val: 0, eid: 0, kind: 0, mul: 1, x: 0, y: 0, ref: 0, dirty: false, sign: '' }));
    this.cap = Math.min(MAX_SLOTS, Math.max(1, cap | 0));
    this.alive = 0;
    this.enabled = true;
    this.reduced = false;
    this.seed = 0x9e3779b9;
    this.pose = { dy: 0, scale: 1, alpha: 1 }; // reused output of poseOf
  }

  setCap(n) {
    this.cap = Math.min(MAX_SLOTS, Math.max(1, fin(n, 24) | 0));
    while (this.alive > this.cap) this.dropSmallest();
  }

  clear() { for (const s of this.slots) { s.on = false; s.dirty = false; } this.alive = 0; }

  jit() { this.seed = (Math.imul(this.seed, 1664525) + 1013904223) >>> 0; return (this.seed >>> 8) / 16777216 - 0.5; }

  // Lower number = more expendable. Player lanes (heal/hurt) outrank any damage number.
  prio(s) { return prioOf(s.kind, s.val); }

  smallest() {
    let bi = -1, bp = Infinity;
    for (let i = 0; i < this.slots.length; i++) {
      const s = this.slots[i];
      if (!s.on) continue;
      const p = this.prio(s);
      if (p < bp) { bp = p; bi = i; }
    }
    return bi;
  }

  dropSmallest() {
    const i = this.smallest();
    if (i < 0) return -1;
    this.slots[i].on = false; this.slots[i].dirty = false; this.alive--;
    return i;
  }

  // kind: KIND.*; ref: typical hit (0 = unknown); force: boss/one-shot hits that are big regardless of ref.
  // Returns the slot, or null when nothing was shown (disabled, bad value, crowded).
  spawn(x, y, val, eid, kind, ref = 0, force = false) {
    if (!this.enabled || !(fin(val, 0) >= 1)) return null;
    x = fin(x, 0); y = fin(y, 0);
    const dmg = kind === KIND.DMG || kind === KIND.BIG;
    const S = this.slots;
    if (dmg) {
      for (let i = 0; i < S.length; i++) {
        const n = S[i];
        if (n.on && n.eid === eid && n.kind <= KIND.BIG && n.age < MERGE_WINDOW) {
          n.val += val; n.age = Math.min(n.age, 0.04); n.ref = ref;
          this.restyle(n, force);
          n.dirty = true;
          return n;
        }
      }
    }
    if (this.alive >= this.cap) {
      const i = this.smallest();
      const cand = prioOf(kind, val);
      if (i < 0 || cand <= this.prio(S[i])) return null; // new one is the smallest: drop it
      this.dropSmallest();
    } else if (dmg && kind === KIND.DMG && this.alive > this.cap * 0.6 && val < 3 && !force) return null; // crowded: skip tiny hits
    let n = null;
    for (let i = 0; i < S.length; i++) if (!S[i].on) { n = S[i]; break; }
    if (!n) return null;
    n.on = true; n.age = 0; n.val = val; n.eid = eid; n.kind = kind; n.ref = ref; n.dirty = true;
    n.sign = kind === KIND.HEAL ? '+' : kind === KIND.HURT ? '-' : '';
    n.x = x + (dmg ? this.jit() * 12 : 0); n.y = y - 8;
    this.restyle(n, force);
    this.alive++;
    return n;
  }

  restyle(n, force) {
    if (n.kind <= KIND.BIG) {
      const m = force ? Math.max(1.4, sizeMul(n.val, n.ref)) : sizeMul(n.val, n.ref);
      n.mul = m;
      n.kind = m > 1 ? KIND.BIG : KIND.DMG;
    } else if (n.kind === KIND.BLEED) n.mul = 0.8;
    else n.mul = 1.15; // player lanes: slightly larger than a normal hit so they read near the hero
    n.life = LIFE[n.kind];
  }

  update(dt) {
    dt = fin(dt, 0);
    for (let i = 0; i < this.slots.length; i++) {
      const s = this.slots[i];
      if (!s.on) continue;
      s.age += dt;
      if (s.age >= s.life) { s.on = false; s.dirty = false; this.alive--; }
    }
  }

  // Pose for the view at this moment. Reduced motion: no rise, no pop, only a fade in place.
  poseOf(s) {
    const k = Math.min(1, Math.max(0, s.age / s.life));
    const o = this.pose;
    const fade = k < 0.6 ? 1 : 1 - (k - 0.6) / 0.4;
    if (this.reduced) { o.dy = 0; o.scale = s.mul; o.alpha = fade; return o; }
    const pop = k < 0.12 ? 1 + (s.kind === KIND.BIG ? 0.5 : 0.35) * (1 - k / 0.12) : 1;
    o.dy = -RISE[s.kind] * (1 - (1 - k) * (1 - k));
    o.scale = s.mul * pop;
    o.alpha = fade;
    return o;
  }
}

// ---- display-only watcher: turns per-frame sim values into pickup / hit feedback (no events needed from the sim) ----
// step(sim) fills `out`; flags are rate-limited by sim time so a swarm of gems cannot spam the HUD.
export class FbWatch {
  constructor() {
    this.out = { gem: false, gold: false, heal: 0, hurt: 0, level: false };
    this.reset(null);
  }

  reset(sim) {
    const p = sim && sim.player;
    this.t = sim ? fin(sim.time, 0) : 0;
    this.xp = sim ? fin(sim.xp, 0) : 0;
    this.level = sim ? fin(sim.level, 0) : 0;
    this.gold = sim ? fin(sim.gold, 0) : 0;
    this.hp = p ? fin(p.hp, 0) : 0;
    this.maxHp = p ? fin(p.maxHp, 0) : 0;
    this.gemAt = -9; this.goldAt = -9; this.healAt = -9;
    this.healAcc = 0;
  }

  step(sim) {
    const o = this.out;
    o.gem = false; o.gold = false; o.heal = 0; o.hurt = 0; o.level = false;
    if (!sim || !sim.player) return o;
    const t = fin(sim.time, 0);
    if (t < this.t - 0.5) this.reset(sim); // a new run started
    this.t = t;
    const xp = fin(sim.xp, 0), lv = fin(sim.level, 0), gold = fin(sim.gold, 0);
    if (lv > this.level) o.level = true;
    if ((xp > this.xp || lv > this.level) && t - this.gemAt >= 0.15) { o.gem = true; this.gemAt = t; }
    if (gold > this.gold && t - this.goldAt >= 0.15) { o.gold = true; this.goldAt = t; }
    this.xp = xp; this.level = lv; this.gold = gold;

    const hp = fin(sim.player.hp, 0), mx = fin(sim.player.maxHp, 0);
    if (mx === this.maxHp) { // a max-HP change is a stat change, not damage
      const d = hp - this.hp;
      if (d <= -0.5) o.hurt = -d;
      else if (d > 0) {
        this.healAcc += d;
        // discrete heals (heart, card, revive) show at once; regen / candle wheel ticks gather into one number per 0.6s
        if (this.healAcc >= 5 || (this.healAcc >= 2 && t - this.healAt >= 0.6)) { o.heal = this.healAcc; this.healAcc = 0; this.healAt = t; }
      }
    }
    this.hp = hp; this.maxHp = mx;
    return o;
  }
}
