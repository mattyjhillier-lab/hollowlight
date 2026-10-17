// W2 glowing trails (visual only; the sim is never read for anything but positions). Pure logic (RibbonSet) + a pooled renderer (RibbonLayer).
// Ribbons are short-lived point histories (ring buffers) drawn as stretched additive glow sprites UNDER every creature/halo, so they never
// hide enemies, pickups or numbers. The long ~25 s mural is the life map (already stamped by hero + spirits); ribbons are the bright head of it.
// Warm cream-amber = hero lantern; scarf wisp = pale scarf colour; spirits keep their own friendly role colour. Enemies get nothing; gold (evolutions) is never used.
const FAST_DT = 0.035; // W2b: fast spirits (wolves) are sampled at ~28 Hz so a pounce/sprint leaves a continuous streak
const lighten = (c, k) => { const r = (c >> 16) & 255; const g = (c >> 8) & 255; const b = c & 255; return ((r + (255 - r) * k) << 16) | ((g + (255 - g) * k) << 8) | (b + (255 - b) * k); };
export const RIBBON_DEPTH = 54000; // below D_HALO (55000) and every lit sprite (60000+), above ground/sway/decals
const JUMP = 90; // a step larger than this (pounce, teleport) breaks the ribbon instead of drawing a streak
const MIN_STEP = 1.5; // world units the source must move before a point is added

export class Ribbon {
  constructor(maxPts) {
    this.max = Math.max(2, maxPts | 0);
    this.x = new Float32Array(this.max); this.y = new Float32Array(this.max); this.t = new Float32Array(this.max); this.brk = new Uint8Array(this.max);
    this.head = 0; this.n = 0; this.lastT = -1e9;
  }
  reset() { this.head = 0; this.n = 0; this.lastT = -1e9; }
  idx(i) { return (this.head - 1 - i + this.max * 2) % this.max; } // i = 0 newest
  push(x, y, now, interval) {
    if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(now)) return false;
    if (this.n > 0) {
      if (now - this.lastT < interval) return false;
      const k = this.idx(0);
      const d = Math.hypot(x - this.x[k], y - this.y[k]);
      if (d < MIN_STEP) return false;
      this.brk[this.head] = d > JUMP ? 1 : 0;
    } else this.brk[this.head] = 0;
    this.x[this.head] = x; this.y[this.head] = y; this.t[this.head] = now;
    this.head = (this.head + 1) % this.max;
    if (this.n < this.max) this.n++;
    this.lastT = now;
    return true;
  }
  // true when nothing is left to draw (the newest point is older than `life`)
  empty(now, life) { return this.n === 0 || now - this.t[this.idx(0)] >= life; }
}

// Per-tier numbers come from CAPS[tier].ribbon (quality.js); phone/reduced scale them down.
export function ribbonCaps(base, { phone = false, reduced = false } = {}) {
  const r = base || {};
  const ph = phone ? 0.6 : 1;
  const L = r.lantern || { life: 0, pts: 0 };
  const S = r.scarf || { life: 0, pts: 0 };
  const P = r.spirits || { n: 0, life: 0, pts: 0 };
  return {
    lantern: { life: L.life * (reduced ? 0.6 : 1), pts: L.pts, w: L.w || 9, a: L.a || 0.3, core: !!L.core && !reduced },
    scarf: reduced ? { life: 0, pts: 0 } : { life: S.life, pts: S.pts, w: S.w || 5, a: S.a || 0.2 },
    spirits: reduced ? { n: 0, life: 0, pts: 0 } : { n: Math.floor(P.n * ph), life: P.life, pts: P.pts, w: P.w || 6, a: P.a || 0.24 },
    segs: Math.max(0, Math.floor((r.segs || 0) * ph)),
  };
}

// Segment output buffers are preallocated; `emit` fills them and returns the count (never above caps.segs).
export class RibbonSet {
  constructor(maxSegs = 300, maxSlots = 16, maxPts = 64) {
    this.cap = maxSegs;
    this.sx = new Float32Array(maxSegs); this.sy = new Float32Array(maxSegs); this.sl = new Float32Array(maxSegs); this.sr = new Float32Array(maxSegs);
    this.sw = new Float32Array(maxSegs); this.sa = new Float32Array(maxSegs); this.sc = new Int32Array(maxSegs);
    this.count = 0;
    this.maxPts = maxPts;
    this.hero = new Ribbon(maxPts);
    this.scarf = new Ribbon(maxPts);
    this.slots = Array.from({ length: maxSlots }, () => ({ id: -1, rib: new Ribbon(maxPts), seen: 0, col: 0, life: 0, wm: 1, pts: 8 }));
    this.byId = new Map();
    this.drawn = { hero: 0, scarf: 0, spirits: 0 }; // last emit: segments per group (tests/perf)
  }

  reset() {
    this.hero.reset(); this.scarf.reset(); this.byId.clear();
    for (const s of this.slots) { s.id = -1; s.rib.reset(); }
    this.count = 0;
  }

  activeSlots() { let n = 0; for (const s of this.slots) if (s.id >= 0) n++; return n; }

  // hero {lx,ly,sx,sy}; units [{id,x,y,col,life}] already culled by the caller. Colours are 0xRRGGBB ints.
  update(now, caps, hero, units, nUnits) {
    const L = caps.lantern;
    if (L.life > 0 && hero) {
      this.hero.push(hero.lx, hero.ly, now, Math.max(0.03, L.life / Math.max(4, L.pts - 2)));
      if (caps.scarf.life > 0) this.scarf.push(hero.sx, hero.sy, now, Math.max(0.03, caps.scarf.life / Math.max(4, caps.scarf.pts - 2)));
    }
    // spirits: stable slot per id; a slot is released only when its ribbon has faded out
    const P = caps.spirits;
    for (let i = 0; i < nUnits; i++) {
      const u = units[i];
      let s = this.byId.get(u.id);
      if (!s) {
        if (P.n <= 0 || this.byId.size >= Math.min(P.n, this.slots.length)) continue;
        s = this.slots.find((q) => q.id < 0);
        if (!s) continue;
        s.id = u.id; s.rib.reset(); this.byId.set(u.id, s);
      }
      s.seen = now; s.col = u.col; s.life = u.life;
      const fast = u.fast ? 1 : 0;
      const dt = fast ? FAST_DT : Math.max(0.04, u.life / Math.max(4, P.pts - 2));
      s.wm = fast ? 1.45 : 1; s.pts = Math.min(this.maxPts, Math.ceil(u.life / dt) + 2);
      s.rib.push(u.x, u.y, now, dt);
    }
    for (const s of this.slots) {
      if (s.id >= 0 && now - s.seen > 0.05 && (s.rib.empty(now, s.life) || P.n <= 0)) { this.byId.delete(s.id); s.id = -1; s.rib.reset(); }
    }
  }

  // Walk a ribbon newest -> oldest, one segment per consecutive point pair, alpha/width tapering with age.
  seg(rib, now, life, w, a, col, ptsCap, limit, core) {
    let n = 0;
    const m = Math.min(rib.n, ptsCap);
    for (let i = 0; i + 1 < m && this.count < limit; i++) {
      const k0 = rib.idx(i); const k1 = rib.idx(i + 1);
      if (rib.brk[k0]) continue;
      const age = now - 0.5 * (rib.t[k0] + rib.t[k1]);
      if (!(age < life)) break;
      const f = 1 - Math.max(0, age) / life;
      const dx = rib.x[k0] - rib.x[k1]; const dy = rib.y[k0] - rib.y[k1];
      const len = Math.hypot(dx, dy);
      if (!(len > 0.01)) continue;
      const q = this.count++;
      this.sx[q] = 0.5 * (rib.x[k0] + rib.x[k1]); this.sy[q] = 0.5 * (rib.y[k0] + rib.y[k1]);
      this.sl[q] = len; this.sr[q] = Math.atan2(dy, dx);
      this.sw[q] = w * (0.22 + 0.78 * f) * (core ? (core === 2 ? 0.34 : 0.38) : 1);
      this.sa[q] = a * Math.pow(f, 1.25) * (core ? 1.6 : 1);
      this.sc[q] = core ? (core === 2 ? lighten(col, 0.6) : 0xfff1c8) : col;
      n++;
    }
    return n;
  }

  // W7b Lightfoot Pack: draw the sim's wolf trail points (visual only; the sim is never written). pts = [{x,y,t,l,hw,id}] in drop order;
  // consecutive points of the same wolf make one segment. Pale-blue body (+ warm cream core when caps.core > 0) on the newest caps.body points.
  // Appended after emit(): never above this.cap. Returns the new total count.
  addTrail(pts, caps, bodyCol, coreCol) {
    const n = pts ? pts.length : 0;
    const bodyN = Math.min(n, Math.max(0, caps.body | 0));
    const coreN = Math.min(bodyN, Math.max(0, caps.core | 0));
    if (!bodyN) return this.count;
    const last = new Map();
    const prev = new Int32Array(n);
    for (let i = 0; i < n; i++) { const q = pts[i]; const j = last.get(q.id); prev[i] = j === undefined ? -1 : j; last.set(q.id, i); }
    const from = n - bodyN;
    for (let i = from; i < n && this.count < this.cap; i++) {
      const j = prev[i];
      if (j < 0) continue;
      const q = pts[i]; const o = pts[j];
      const dx = q.x - o.x; const dy = q.y - o.y; const len = Math.hypot(dx, dy);
      if (!(len > 0.01) || len > JUMP) continue;
      const f = Math.max(0, Math.min(1, q.t / (q.l || 1)));
      const k = this.count++;
      this.sx[k] = 0.5 * (q.x + o.x); this.sy[k] = 0.5 * (q.y + o.y); this.sl[k] = len; this.sr[k] = Math.atan2(dy, dx);
      this.sw[k] = q.hw * 2 * (0.45 + 0.55 * f); this.sa[k] = 0.3 * (0.2 + 0.8 * f); this.sc[k] = bodyCol;
      if (i >= n - coreN && this.count < this.cap) {
        const c = this.count++;
        this.sx[c] = this.sx[k]; this.sy[c] = this.sy[k]; this.sl[c] = len; this.sr[c] = this.sr[k];
        this.sw[c] = q.hw * 0.8 * (0.45 + 0.55 * f); this.sa[c] = 0.55 * f; this.sc[c] = coreCol;
      }
    }
    return this.count;
  }

  emit(now, caps, heroCol, scarfCol) {
    this.count = 0;
    const limit = Math.min(this.cap, caps.segs);
    const L = caps.lantern; const S = caps.scarf; const P = caps.spirits;
    let h = 0; let sc = 0; let sp = 0;
    if (L.life > 0) {
      h = this.seg(this.hero, now, L.life, L.w, L.a, heroCol, L.pts, limit, 0);
      if (L.core) h += this.seg(this.hero, now, L.life, L.w, L.a * 0.55, heroCol, L.pts, limit, 1);
    }
    if (S.life > 0) sc = this.seg(this.scarf, now, S.life, S.w, S.a, scarfCol, S.pts, limit, 0);
    if (P.n > 0) for (const s of this.slots) if (s.id >= 0) {
      const w = P.w * s.wm; const pc = s.pts;
      sp += this.seg(s.rib, now, s.life, w, P.a, s.col, pc, limit, 0); // soft wide body
      sp += this.seg(s.rib, now, s.life, w, P.a * 0.6, s.col, pc, limit, 2); // W2b: brighter lighter-tint core so it reads on bright restored ground
    }
    this.drawn.hero = h; this.drawn.scarf = sc; this.drawn.spirits = sp;
    return this.count;
  }
}

// Pooled additive sprites: one 'glow' image per live segment (created lazily, never above the largest tier cap).
export class RibbonLayer {
  constructor(scene, glowKey, glowInv, blendAdd, maxSegs = 300) {
    this.scene = scene; this.key = glowKey; this.inv = glowInv; this.add = blendAdd; this.max = maxSegs;
    this.all = []; this.shown = 0;
  }
  get created() { return this.all.length; }
  make() {
    const im = this.scene.add.image(0, 0, this.key).setBlendMode(this.add).setDepth(RIBBON_DEPTH).setVisible(false);
    this.all.push(im);
    return im;
  }
  render(set, count) {
    const n = Math.min(count, this.max);
    for (let i = 0; i < n; i++) {
      const im = this.all[i] || this.make();
      const w = set.sw[i];
      im.setPosition(set.sx[i], set.sy[i]).setRotation(set.sr[i]).setScale(((set.sl[i] + w * 1.1) / 32) * this.inv, (w / 32) * this.inv).setTint(set.sc[i]).setAlpha(set.sa[i]).setVisible(true);
    }
    for (let i = n; i < this.shown; i++) this.all[i].setVisible(false);
    this.shown = n;
  }
  clear() { for (const im of this.all) im.setVisible(false); this.shown = 0; }
}
