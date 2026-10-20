// AL-6 DAWN CHORUS (docs/design/ambient-life-v1.md "three quiet dawn-chorus moments"; timing from docs/design/visibility-arc-v1.md). Pure JS: no Phaser, no DOM,
// no sim import, no Math.random. VISUAL ONLY: the clock is READ (run seconds on the 900 s reference run), every random number is the stateless hash from wind.js
// (own stream from the visual seed), nothing here is ever read by the sim. Zero per-frame allocation: all state lives in typed arrays sized once.
//   1. FIRST LIGHT (~8:00-9:00): fireflies drift upward and fade, fog thins, 1-3 sparrows glide in, land, then take off again.
//   2. THE HUSH (13:40-14:00, the pre-boss calm; boss-treant-v1 (a)): critters hush, motes slow, fireflies dim; it HOLDS through the boss fight
//      (the display clock parks at 14:00) and lifts only as the victory flood plays.
//   3. DAWN FLOOD (after 14:00 on the display clock, i.e. only in the victory beat once the Elder Treant falls): a burst of birds takes flight across the view (cap CAPS.<tier>.ambient.birds 12 / 8 / 4), petals drift, soft warm light shafts,
//      critters come out, and a soft colour flush on the restored ground (read by the vibrancy tick). VICTORY plays the final flush (+ a small flock).
// Calm motion (reducedMotion) = static: no birds, petals or shafts (only the existing tint/fade/hush multipliers and the colour flush remain).
// Low tier: 4 birds, no petals, no shafts. Reserved sound cue names (no audio is built): dawn_chorus_1 (first light), dawn_chorus_2 (hush), dawn_chorus_3 (flood / victory).
import { hash } from './wind.js';

export const REF = 900;
export const BIRD_MAX = 12;
export const PETAL_MAX = 10;
export const SHAFT_MAX = 3;
export const PHONE_K = 0.6;
export const CUES = ['dawn_chorus_1', 'dawn_chorus_2', 'dawn_chorus_3']; // reserved names only

// Moment timing (run seconds on the 900 s reference run)
export const TM = {
  firstIn0: 465, firstIn1: 500, firstOut0: 545, firstOut1: 585, // first light envelope
  arriveFrom: 490, arriveUntil: 560, // sparrows only arrive inside this window (a run started later never plays them)
  hushIn0: 815, hushIn1: 838, hushOut0: 846, hushOut1: 866, // pre-boss hush 13:35-13:58, held while the clock holds at 14:00
  floodIn0: 845, floodIn1: 880, burstAt: 848, // dawn flood: past the held 14:00, so it plays only in the victory beat (the scene runs the clock 840 -> 900)
};

// Per-tier extras (birds come from quality.js CAPS.<tier>.ambient.birds). Low: no petals, no shafts.
export const DAWN_CAPS = {
  low: { petals: 0, shafts: 0 },
  med: { petals: 6, shafts: 2 },
  high: { petals: 10, shafts: 3 },
};
export const BRIGHT_K = { normal: 1, brighter: 0.8, clear: 0.65 }; // light shafts + petals are quieter when the ambient is already lifted

export const FLUSH_FLOOD = 0.05; // sat added at full flood
export const FLUSH_VICTORY = 0.12; // extra sat pulse at victory (decays over ~4 s)

const fin = (v, d = 0) => (Number.isFinite(v) ? v : d);
const sst = (a, b, v) => { const t = v <= a ? 0 : v >= b ? 1 : (v - a) / (b - a); return t * t * (3 - 2 * t); };
const fr = (v) => v - Math.floor(v);

export function airN(cap, phone, max) {
  const c = Math.floor(fin(cap));
  if (c <= 0) return 0;
  return Math.min(max, Math.max(1, Math.floor(c * (phone ? PHONE_K : 1))));
}

// Envelope of the three moments at run second s (0..1 each). Allocation-free: writes into out.
export function phaseAt(s, out) {
  s = fin(s);
  if (s < 0) s = 0;
  out.first = sst(TM.firstIn0, TM.firstIn1, s) * (1 - sst(TM.firstOut0, TM.firstOut1, s));
  out.hush = sst(TM.hushIn0, TM.hushIn1, s) * (1 - sst(TM.hushOut0, TM.hushOut1, s));
  out.flood = sst(TM.floodIn0, TM.floodIn1, s);
  return out;
}

export const S_OFF = 0; export const S_FLY = 1; export const S_SIT = 3; export const S_LEAVE = 4; export const S_ARRIVE = 5;
export const K_FLOOD = 0; export const K_ARRIVE = 1;
// critter atlas frame indices (FRAME_NAMES order): 0 sit, 1 peck, 2 fly0, 3 fly1
export const F_SIT = 0; export const F_PECK = 1; export const F_FLY0 = 2; export const F_FLY1 = 3;

export class DawnField {
  constructor(seed = 1) {
    this.seed = seed | 0;
    const B = BIRD_MAX;
    this.st = new Uint8Array(B); this.kind = new Uint8Array(B);
    this.u = new Float32Array(B); this.v = new Float32Array(B); this.vx = new Float32Array(B); this.vy = new Float32Array(B);
    this.z = new Float32Array(B); this.age = new Float32Array(B); this.ph = new Float32Array(B);
    this.face = new Float32Array(B); this.land = new Float32Array(B); this.wx = new Float32Array(B); this.wy = new Float32Array(B);
    // render outputs (world coordinates)
    this.bx = new Float32Array(B); this.by = new Float32Array(B); this.ba = new Float32Array(B); this.bs = new Float32Array(B); this.bf = new Uint8Array(B);
    this.px = new Float32Array(PETAL_MAX); this.py = new Float32Array(PETAL_MAX); this.pa = new Float32Array(PETAL_MAX);
    this.pr = new Float32Array(PETAL_MAX); this.pk = new Float32Array(PETAL_MAX);
    this.sx = new Float32Array(SHAFT_MAX); this.sy = new Float32Array(SHAFT_MAX); this.sa = new Float32Array(SHAFT_MAX);
    this.sw = 0; this.sh = 0; this.sr = -0.5;
    this.ph3 = { first: 0, hush: 0, flood: 0 };
    // multipliers read by the other ambient layers
    this.mod = { rise: 0, fade: 0, slow: 0, thin: 0, hush: false, eager: false, flush: 0 };
    this.nBird = 0; this.nPetal = 0; this.nShaft = 0;
    this.reset(seed);
  }

  reset(seed = this.seed) {
    this.seed = seed | 0;
    this.st.fill(0); this.ba.fill(0); this.pa.fill(0); this.sa.fill(0);
    this.clk = 0; this.vicT = -1; this.fArr = false; this.fFlood = false; this.fVic = false; this.burstN = 0;
    this.nBird = 0; this.nPetal = 0; this.nShaft = 0;
    const m = this.mod; m.rise = m.fade = m.slow = m.thin = m.flush = 0; m.hush = false; m.eager = false;
  }

  setBudget(birds, petals, shafts) {
    this.nBird = Math.max(0, Math.min(BIRD_MAX, Math.floor(fin(birds))));
    this.nPetal = Math.max(0, Math.min(PETAL_MAX, Math.floor(fin(petals))));
    this.nShaft = Math.max(0, Math.min(SHAFT_MAX, Math.floor(fin(shafts))));
  }

  activeBirds() { let n = 0; for (let i = 0; i < BIRD_MAX; i++) if (this.st[i]) n++; return n; }

  killBirds() { this.st.fill(0); this.ba.fill(0); }

  free(from = 0) { for (let i = from; i < this.nBird; i++) if (this.st[i] === S_OFF) return i; return -1; }

  // Flood flock: take flight from the lower-left of the view, climbing up and to the right toward the sun side.
  spawnFlood(n, salt) {
    for (let k = 0; k < n; k++) {
      const i = this.free();
      if (i < 0) return;
      const s = (this.seed * 131 + salt * 7919 + k * 613) | 0;
      this.st[i] = S_FLY; this.kind[i] = K_FLOOD;
      this.u[i] = 0.05 + 0.5 * hash(s + 1); this.v[i] = 0.55 + 0.4 * hash(s + 2);
      const ang = 0.38 + 0.5 * hash(s + 3); // rad above the horizontal, heading right
      const sp = 0.17 + 0.09 * hash(s + 4); // view widths per second
      this.vx[i] = Math.cos(ang) * sp; this.vy[i] = -Math.sin(ang) * sp * 1.6; // view heights per second (16:9-ish aspect)
      this.age[i] = -(k * 0.27 + hash(s + 5) * 0.5); // staggered launch
      this.ph[i] = hash(s + 6) * 6.28; this.face[i] = 1; this.z[i] = 0; this.ba[i] = 0;
    }
  }

  // First-light sparrows: glide in from the right edge, land in the world, sit, then take off again.
  spawnArrive(n) {
    for (let k = 0; k < n; k++) {
      const i = this.free();
      if (i < 0) return;
      const s = (this.seed * 211 + k * 1777) | 0;
      this.st[i] = S_ARRIVE; this.kind[i] = K_ARRIVE;
      this.u[i] = 1.08 + 0.05 * k; this.v[i] = 0.4 + 0.4 * hash(s + 2);
      this.land[i] = 0.2 + 0.55 * hash(s + 3);
      this.age[i] = -(k * 1.1 + hash(s + 4) * 0.6);
      this.ph[i] = hash(s + 6) * 6.28; this.face[i] = -1; this.z[i] = 24; this.ba[i] = 0;
    }
  }

  // s = run seconds (reference clock); st = { calm, phone, victory, hx, hy, bright }; view = { x0, y0, x1, y1 }
  update(dt, s, view, st) {
    const d = dt > 0 ? (dt < 0.1 ? dt : 0.1) : 0;
    const calm = !!st.calm;
    const ph = phaseAt(s, this.ph3);
    this.clk += d;
    const W = view.x1 - view.x0; const H = view.y1 - view.y0;
    const bright = BRIGHT_K[st.bright] || 1;
    // ---- multipliers for the other layers (colour/fade only under Calm: motion is the layers' own reduced path)
    const m = this.mod;
    m.rise = calm ? 0 : ph.first;
    m.fade = Math.min(0.9, Math.max(ph.first * 0.7, ph.flood * 0.85, ph.hush * 0.5));
    m.slow = calm ? 0 : ph.hush * 0.6;
    m.thin = ph.first * 0.4 + ph.flood * 0.3;
    m.hush = ph.hush > 0.5;
    m.eager = ph.flood > 0.6;
    // ---- victory pulse clock
    if (st.victory) {
      if (!this.fVic) { this.fVic = true; this.vicT = 0; if (!calm && this.activeBirds() === 0) this.spawnFlood(Math.min(6, this.nBird), 9); }
      else this.vicT += d;
    }
    const vp = this.vicT < 0 ? 0 : sst(0, 0.6, this.vicT) * Math.exp(-Math.max(0, this.vicT - 0.6) / 2.5);
    const flood = st.victory ? 1 : ph.flood;
    m.flush = FLUSH_FLOOD * flood + FLUSH_VICTORY * vp;
    if (calm || this.nBird === 0) { if (this.activeBirds()) this.killBirds(); } else {
      for (let i = this.nBird; i < BIRD_MAX; i++) { this.st[i] = S_OFF; this.ba[i] = 0; } // tier dropped: extra birds vanish
      // ---- one-shot triggers (a run that starts later, e.g. ?t=870, plays only the moments still ahead)
      if (!this.fArr) {
        if (s >= TM.arriveFrom) { this.fArr = true; if (s < TM.arriveUntil) this.spawnArrive(Math.max(1, Math.min(3, Math.ceil(this.nBird * 0.34)))); }
      }
      if (!this.fFlood && s >= TM.burstAt) { this.fFlood = true; this.spawnFlood(this.nBird, 1); }
    }
    // ---- birds
    for (let i = 0; i < BIRD_MAX; i++) {
      const stt = this.st[i];
      if (!stt) { this.ba[i] = 0; continue; }
      this.age[i] += d;
      const a = this.age[i];
      if (a < 0) { this.ba[i] = 0; continue; }
      const flap = Math.floor((this.clk * 7 + this.ph[i] * 2) % 2);
      if (stt === S_FLY) {
        this.u[i] += this.vx[i] * d; this.v[i] += this.vy[i] * d;
        const lift = 30 * (1 - Math.exp(-a * 1.3));
        this.bx[i] = view.x0 + this.u[i] * W; this.by[i] = view.y0 + this.v[i] * H - lift;
        this.bs[i] = 1 + 0.35 * (1 - Math.exp(-a * 0.8)); this.bf[i] = flap ? F_FLY1 : F_FLY0;
        this.ba[i] = Math.min(1, a / 0.3) * (1 - sst(1.0, 1.18, this.u[i])) * sst(-0.2, 0.0, this.v[i]);
        if (this.u[i] > 1.2 || this.v[i] < -0.25 || a > 10) { this.st[i] = S_OFF; this.ba[i] = 0; }
      } else if (stt === S_ARRIVE) {
        const T = 2.6; const e = Math.min(1, a / T); const k = e * (2 - e); // ease out
        const u = this.u[i] + (this.land[i] - this.u[i]) * k;
        const z = 24 * (1 - k);
        this.bx[i] = view.x0 + u * W; this.by[i] = view.y0 + this.v[i] * H - z;
        this.bs[i] = 1; this.bf[i] = flap ? F_FLY1 : F_FLY0; this.ba[i] = Math.min(1, a / 0.5);
        if (a >= T) { this.st[i] = S_SIT; this.wx[i] = this.bx[i]; this.wy[i] = this.by[i]; this.age[i] = 0; this.face[i] = -1; }
      } else if (stt === S_SIT) {
        const hx = fin(st.hx, 1e9); const hy = fin(st.hy, 1e9);
        const near = (this.wx[i] - hx) * (this.wx[i] - hx) + (this.wy[i] - hy) * (this.wy[i] - hy) < 70 * 70;
        this.bx[i] = this.wx[i]; this.by[i] = this.wy[i]; this.bs[i] = 1;
        this.bf[i] = Math.floor((a + this.ph[i]) / 1.3) % 3 === 2 ? F_PECK : F_SIT; this.ba[i] = 1;
        if (a > 4.5 || near) { this.st[i] = S_LEAVE; this.age[i] = 0; this.face[i] = 1; }
      } else if (stt === S_LEAVE) {
        const z = 5 + 60 * a * a * 0.5 + 12 * a;
        this.bx[i] = this.wx[i] + 46 * a * this.face[i]; this.by[i] = this.wy[i] - z;
        this.bs[i] = 1; this.bf[i] = flap ? F_FLY1 : F_FLY0; this.ba[i] = 1 - sst(0.8, 1.8, a);
        if (a > 1.9) { this.st[i] = S_OFF; this.ba[i] = 0; }
      }
    }
    // ---- petals + shafts (View-space sky effects; need flood, a budget and motion allowed)
    const live = !calm && flood > 0.01;
    for (let i = 0; i < PETAL_MAX; i++) {
      const on = live && i < this.nPetal && i < Math.ceil(this.nPetal * flood);
      if (!on) { this.pa[i] = 0; continue; }
      const sd = (this.seed * 53 + i * 977) | 0;
      const sp = 0.6 + 0.8 * hash(sd + 3); const p0 = hash(sd + 4) * 6.28;
      const u = fr(hash(sd + 1) + this.clk * (0.012 + 0.02 * sp) + 0.015 * Math.sin(this.clk * 0.6 * sp + p0));
      const v = fr(hash(sd + 2) + this.clk * (0.03 + 0.03 * sp));
      this.px[i] = view.x0 + u * W; this.py[i] = view.y0 + v * H;
      this.pr[i] = p0 + this.clk * 1.1 * sp;
      this.pk[i] = 0.45 + 0.55 * Math.abs(Math.sin(this.clk * 1.9 * sp + p0)); // tumbling squash
      this.pa[i] = 0.75 * flood * bright * sst(0, 0.1, v) * sst(0, 0.1, 1 - v) * sst(0, 0.1, u) * sst(0, 0.1, 1 - u);
    }
    this.sw = Math.max(40, W * 0.16); this.sh = H * 1.5;
    for (let i = 0; i < SHAFT_MAX; i++) {
      const on = live && i < this.nShaft;
      if (!on) { this.sa[i] = 0; continue; }
      const u = 0.2 + 0.3 * i + 0.03 * Math.sin(this.clk * 0.15 + i * 2.1);
      this.sx[i] = view.x0 + u * W; this.sy[i] = view.y0 + 0.45 * H;
      this.sa[i] = 0.09 * flood * bright * (0.75 + 0.25 * Math.sin(this.clk * 0.35 + i * 1.7));
    }
  }
}
