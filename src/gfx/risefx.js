// DM7: Ophimber's Rise art (RENDER ONLY: reads `sim.rise`, never writes it; src/sim is untouched). Lucinda's ability (docs/design/fire-weapon-lucinda-v2.md s5).
// Beat: Ophimber (a PLACEHOLDER gold blob, ~16 px) rises 26 px over her shoulder in 0.4 s, wings spread -> a thin DOTTED outline of the next ring shows 0.25 s before
// it ignites (so the player sees where to stand) -> the ring ignites: the breath sweeps clockwise (a bright head runs round while the band fades in) -> the
// band burns 3 s and fades out -> Ophimber settles at 2.4 s. Same warm ramp as the Meteor (pale gold #fff1c2, amber #ffb35c, ember-rose #e07a6b rim): it is
// warm lantern light that blooms colour back, never scorches, no smoke, no black. Fire never reaches her: the rings are fixed on the ground.
// Cost: ONE baked canvas atlas (6 flame-band frames = 3 rings x 2 flicker variants, 3 dotted outlines, 2 Ophimber wing frames, glow, ember) and at most
// 3 ring sprites + 1 dotted outline + the pet + 1 head glow per frame (<= 8 sprites), never per tile, no per-frame allocation.
//   High: full (two flicker variants, sweep head + 2 sparks per ring, lights). Medium: one spark, fewer lights. Low: ONE baked band per ring, NORMAL blend, a
//   2-frame brightness pulse, no sweep animation, no sparks. Calm motion: rings fade in over 0.3 s (no sweep), no flicker, no sparks, Ophimber rises without
//   bounce and holds still (wings spread), no punch.
// Flame-budget: the 3 ring sprites are the 3 visuals reserved for the ability (meteorfx.ABILITY_RESERVE), so the weapon cannot starve it.
import { drawTongue, COL, ABILITY_RESERVE } from './meteorfx.js';

export const KEY = 'rise_atlas';
export const RING_R = [48, 88, 128]; // = characters.json rings (the frames are baked to these radii; the sim's radii are drawn by scale: r / baked)
export const RISE_FADE_OUT = 0.6, CAL_FADE_IN = 0.3, PET_UP = 26, PET_SHOULDER = 12;
const SIZE = RING_R.map((r) => 2 * r + 64); // frame side: ring + 32 px margin each side (flame tongues rise above the band)
const COLX = [0, 328, 656], ROWY = [0, 168, 416];
const FR = {};
RING_R.forEach((r, i) => { FR['bandA' + i] = [COLX[0], ROWY[i], SIZE[i], SIZE[i]]; FR['bandB' + i] = [COLX[1], ROWY[i], SIZE[i], SIZE[i]]; FR['dots' + i] = [COLX[2], ROWY[i], SIZE[i], SIZE[i]]; });
Object.assign(FR, { opha: [0, 744, 64, 64], ophb: [64, 744, 64, 64], glow: [128, 744, 64, 64], ember: [192, 744, 16, 16] });
export const ATLAS_W = 984, ATLAS_H = 808;

const rg = (c, x, y, r, stops) => { const g = c.createRadialGradient(x, y, 0, x, y, r); for (const [o, col] of stops) g.addColorStop(o, col); return g; };
const frac = (x) => x - Math.floor(x);
const sm = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
const TAU = Math.PI * 2;

// Tier -> caps (phone x0.7 on counts; Calm drops everything that moves on its own).
const BASE = {
  high: { sparks: 2, lights: 8, flicker: true, head: true, flat: false },
  med: { sparks: 1, lights: 4, flicker: true, head: true, flat: false },
  low: { sparks: 0, lights: 0, flicker: false, head: false, flat: true },
};
const CACHE = {};
export function riseCaps(tier, phone = false, calm = false) {
  const t = BASE[tier] ? tier : 'med', key = t + (phone ? 'p' : '') + (calm ? 'c' : '');
  if (CACHE[key]) return CACHE[key];
  const b = BASE[t], sc = (n) => (n > 0 && phone ? Math.max(1, Math.round(n * 0.7)) : n);
  return (CACHE[key] = { tier: t, flat: b.flat, calm: !!calm, sparks: calm ? 0 : sc(b.sparks), lights: sc(b.lights), flicker: !calm && b.flicker, head: !calm && b.head, add: !b.flat });
}

// ---------------------------------------------------------------- pure timeline helpers (unit-testable)
// The look state of ring `q` (a sim ring) at run-rise time t: { phase: 'idle'|'preview'|'sweep'|'burn'|'out', a: band alpha 0..1, prog: sweep 0..1, pre: dotted alpha 0..1 }.
export function ringLook(q, t, previewT = 0.25, calm = false) {
  const out = { phase: 'idle', a: 0, prog: 0, pre: 0 };
  if (!q || !Number.isFinite(t)) return out;
  if (t < q.at - previewT) return out;
  if (t < q.at) { out.phase = 'preview'; out.pre = 0.35 + 0.65 * sm((t - (q.at - previewT)) / Math.max(1e-6, previewT)); return out; }
  if (t > q.end) return out;
  const sw = Math.min(1, Math.max(0, (t - q.at) / Math.max(1e-6, q.sweep)));
  out.prog = sw;
  out.phase = t >= q.end - RISE_FADE_OUT ? 'out' : sw < 1 ? 'sweep' : 'burn';
  const fadeIn = calm ? sm((t - q.at) / CAL_FADE_IN) : 0.3 + 0.7 * sm(sw);
  out.a = Math.min(fadeIn, Math.min(1, Math.max(0, (q.end - t) / RISE_FADE_OUT)));
  return out;
}
// Ophimber's pose at time t (hero-relative): lift 0..PET_UP px (ease over `rise`), alpha (fades after `settle`), wing frame 0/1.
export function petPose(t, D, calm = false, out = {}) {
  const rise = D && Number.isFinite(D.rise) ? D.rise : 0.4, settle = D && Number.isFinite(D.settle) ? D.settle : 2.4;
  const up = sm(t / Math.max(1e-6, rise));
  const down = t < settle ? 0 : sm((t - settle) / 0.5);
  out.lift = PET_UP * up * (1 - 0.55 * down); // settles back toward her shoulder, then fades
  out.a = Math.min(1, t / 0.12) * (1 - down);
  out.wing = calm ? 0 : Math.floor(t * 8) % 2;
  out.bob = calm ? 0 : Math.sin(t * 5) * 1.2 * up * (1 - down);
  return out;
}

// ---------------------------------------------------------------- atlas bake (2D canvas, once, on the first Rise)
function bakeBand(c, ox, oy, i, variant) {
  const R = RING_R[i], S = SIZE[i], cx = ox + S / 2, cy = oy + S / 2, band = 20;
  c.save(); c.beginPath(); c.rect(ox, oy, S, S); c.clip();
  // 1. colour-restoring tint under the band (soft, wider than the flame: warm life returning, never char)
  c.lineWidth = band + 14; c.strokeStyle = 'rgba(232,224,140,0.16)'; c.beginPath(); c.arc(cx, cy, R, 0, TAU); c.stroke();
  // 2. the burning band: amber body with a glow halo, pale-gold core
  c.shadowColor = 'rgba(255,179,92,0.9)'; c.shadowBlur = 12;
  c.lineWidth = band; c.strokeStyle = 'rgba(255,179,92,0.52)'; c.beginPath(); c.arc(cx, cy, R, 0, TAU); c.stroke();
  c.shadowBlur = 0;
  c.lineWidth = band * 0.5; c.strokeStyle = 'rgba(255,226,160,0.72)'; c.beginPath(); c.arc(cx, cy, R, 0, TAU); c.stroke();
  c.lineWidth = band * 0.18; c.strokeStyle = 'rgba(255,248,214,0.8)'; c.beginPath(); c.arc(cx, cy, R, 0, TAU); c.stroke();
  // 3. ember-rose rim on both edges: gives the band a clear edge (the damage edge) with no black
  c.lineWidth = 1.5; c.strokeStyle = 'rgba(224,122,107,0.85)';
  c.beginPath(); c.arc(cx, cy, R + band / 2, 0, TAU); c.stroke(); c.beginPath(); c.arc(cx, cy, R - band / 2, 0, TAU); c.stroke();
  // 4. flame tongues round the band (baked, so the cost is one sprite): two variants differ in lean + height for the flicker
  const N = Math.round((TAU * R) / 15);
  for (let k = 0; k < N; k++) {
    const j = frac(Math.sin((k + 1) * 12.9898 + i * 4.1 + variant * 7.7) * 43758.5453);
    const a = ((k + 0.25 + 0.5 * j) / N) * TAU, bx = cx + Math.cos(a) * R, by = cy + Math.sin(a) * R + 3;
    const lean = Math.cos(a) * 1.2 + (variant ? 1.2 : -1.2) * (j - 0.5), hv = (variant ? 3 : -2) * (j - 0.3), sc = 0.4 + 0.18 * frac(j * 7.3 + variant * 0.37);
    drawTongue(c, bx, by, lean, hv, sc, 0.92);
  }
  c.restore();
}
function bakeDots(c, ox, oy, i) {
  const R = RING_R[i], S = SIZE[i], cx = ox + S / 2, cy = oy + S / 2;
  c.save(); c.beginPath(); c.rect(ox, oy, S, S); c.clip();
  c.shadowColor = 'rgba(255,179,92,0.8)'; c.shadowBlur = 5;
  c.lineCap = 'round'; c.setLineDash([0.1, 7]); // round dots, clear and thick enough for a phone: a rose-amber rim under a pale gold core (contrast on the bright lantern pool)
  c.lineWidth = 5.4; c.strokeStyle = 'rgba(224,122,107,0.92)'; c.beginPath(); c.arc(cx, cy, R, 0, TAU); c.stroke();
  c.lineWidth = 3; c.strokeStyle = 'rgba(255,244,206,1)'; c.beginPath(); c.arc(cx, cy, R, 0, TAU); c.stroke();
  c.setLineDash([]); c.shadowBlur = 0; c.restore();
}
// PLACEHOLDER (Matt picks Ophimber's real look from three options later; characters.json hearthwarden.placeholder = true): a plain gold blob with two
// wing ovals and one eye, in the shared warm ramp. Not final art; do not polish.
function bakeOphimber(c, ox, oy, up) {
  const P = (x, y) => [ox + x, oy + y];
  c.lineJoin = 'round';
  for (const sg of [-1, 1]) { c.beginPath(); c.ellipse(...P(32 + sg * 11, up ? 22 : 38), 6, 11, sg * (up ? -0.5 : 0.5), 0, TAU); c.fillStyle = 'rgba(255,210,140,0.9)'; c.fill(); c.strokeStyle = 'rgba(224,122,107,0.95)'; c.lineWidth = 1.3; c.stroke(); }
  c.beginPath(); c.arc(...P(32, 32), 12, 0, TAU); c.fillStyle = rg(c, ox + 28, oy + 28, 14, [[0, 'rgba(255,241,194,1)'], [1, 'rgba(255,190,110,1)']]); c.fill(); c.strokeStyle = 'rgba(224,122,107,0.95)'; c.lineWidth = 1.5; c.stroke();
  c.fillStyle = 'rgba(181,84,74,1)'; c.beginPath(); c.arc(...P(37, 29), 2.4, 0, TAU); c.fill();
}
export function bakeAtlas(c) {
  for (let i = 0; i < 3; i++) { bakeBand(c, FR['bandA' + i][0], FR['bandA' + i][1], i, 0); bakeBand(c, FR['bandB' + i][0], FR['bandB' + i][1], i, 1); bakeDots(c, FR['dots' + i][0], FR['dots' + i][1], i); }
  bakeOphimber(c, FR.opha[0], FR.opha[1], true); bakeOphimber(c, FR.ophb[0], FR.ophb[1], false);
  let [x, y] = FR.glow; c.fillStyle = rg(c, x + 32, y + 32, 32, [[0, 'rgba(255,241,194,0.95)'], [0.25, 'rgba(255,214,140,0.7)'], [0.5, 'rgba(255,179,92,0.38)'], [0.78, 'rgba(224,122,107,0.14)'], [1, 'rgba(224,122,107,0)']]); c.fillRect(x, y, 64, 64);
  [x, y] = FR.ember; c.fillStyle = rg(c, x + 8, y + 8, 8, [[0, 'rgba(255,241,194,1)'], [0.45, 'rgba(255,200,120,0.7)'], [1, 'rgba(255,179,92,0)']]); c.fillRect(x, y, 16, 16);
}

// ---------------------------------------------------------------- pooled sprite list
class Slots {
  constructor(scene, key, blend, origin) { this.scene = scene; this.key = key; this.blend = blend; this.origin = origin; this.list = []; this.n = 0; this.top = 0; }
  begin() { this.n = 0; }
  put(frame, x, y, depth, sx, sy, alpha, rot = 0, tint = -1) {
    let im = this.list[this.n];
    if (!im) { im = this.scene.add.image(0, 0, this.key, frame).setBlendMode(this.blend); if (this.origin) im.setOrigin(this.origin[0], this.origin[1]); this.list.push(im); }
    this.n++;
    im.setFrame(frame).setPosition(x, y).setDepth(depth).setScale(sx, sy).setAlpha(alpha).setRotation(rot).setVisible(true);
    if (tint >= 0) im.setTint(tint); else im.clearTint();
    return im;
  }
  end() { for (let i = this.n; i < this.top; i++) this.list[i].setVisible(false); this.top = this.n; }
  hide() { this.n = 0; this.end(); }
}

export class RiseLayer {
  // gl = { ADD, NORMAL, LINEAR, depthGround, depthLit, depthFx } (passed in so this file never imports Phaser)
  constructor(scene, gl) {
    this.scene = scene; this.gl = gl; this.ok = false; this.dead = false; this.sNorm = null; this.sAdd = null; this.sPet = null;
    this.last = null; this.seenRing = [false, false, false]; this.sprites = 0; this.lastT = 0; this.punched = false;
    this.pose = { lift: 0, a: 0, wing: 0, bob: 0 };
  }
  get active() { return this.ok; }
  bake() {
    if (this.ok || this.dead) return this.ok;
    try {
      const sc = this.scene, tex = sc.textures.exists(KEY) ? sc.textures.get(KEY) : sc.textures.createCanvas(KEY, ATLAS_W, ATLAS_H);
      if (!sc.textures.exists(KEY) || !tex.frames || !tex.frames.glow) {
        bakeAtlas(tex.getContext());
        for (const n of Object.keys(FR)) tex.add(n, 0, FR[n][0], FR[n][1], FR[n][2], FR[n][3]);
        tex.refresh();
        if (this.gl.LINEAR !== undefined && tex.setFilter) tex.setFilter(this.gl.LINEAR);
      }
      const g = this.gl;
      this.sNorm = new Slots(sc, KEY, g.NORMAL); this.sAdd = new Slots(sc, KEY, g.ADD); this.sPet = new Slots(sc, KEY, g.NORMAL);
      this.ok = true;
    } catch { this.dead = true; this.ok = false; } // no canvas: the ability simply has no art (the sim still burns)
    return this.ok;
  }
  hideAll() { if (!this.ok) return; for (const s of [this.sNorm, this.sAdd, this.sPet]) s.hide(); this.sprites = 0; }
  reset() { this.last = null; this.seenRing = [false, false, false]; this.punched = false; this.lastT = 0; this.hideAll(); }

  // c = { sim, tier, phone, calm, lm (or null), parts, cue(id), shake(ms,k), vx0, vy0, vx1, vy1 }; call once a frame.
  update(c) {
    const sim = c.sim, R = sim.rise;
    if (!R) { if (this.sprites || this.last) this.reset(); return; }
    if (!this.bake()) return;
    if (this.last !== R) { this.reset(); this.last = R; }
    const caps = riseCaps(c.tier, c.phone, c.calm), g = this.gl, p = sim.player, t = R.t, D = R.D;
    const dG = g.depthGround, dF = g.depthFx, lm = c.lm, dt = Math.max(0, Math.min(0.1, sim.time - this.lastT)); this.lastT = sim.time;
    for (const s of [this.sNorm, this.sAdd, this.sPet]) s.begin();
    const inV = (x, y) => x >= c.vx0 - 160 && x <= c.vx1 + 160 && y >= c.vy0 - 160 && y <= c.vy1 + 160;
    const bandFlat = caps.flat;
    let preview = -1;
    for (let i = 0; i < R.rings.length; i++) {
      const q = R.rings[i], L = ringLook(q, t, D.previewT, caps.calm);
      const base = RING_R[i], k = q.r / base; // the frame is baked at the locked radius; data radii scale it (clamped by the sim)
      if (L.phase === 'preview' && preview < 0) preview = i;
      if (L.phase === 'preview') {
        const pulse = caps.calm ? 1 : 0.85 + 0.15 * Math.sin(t * 22);
        this.sNorm.put('dots' + i, R.x, R.y, dG + 6, k, k, Math.min(1, L.pre * pulse));
        continue;
      }
      if (L.a <= 0.01 || !inV(R.x, R.y)) continue;
      if (!this.seenRing[i]) { this.seenRing[i] = true; if (c.shake && !caps.calm && !caps.flat && !this.punched) { this.punched = true; c.shake(60, caps.tier === 'high' ? 0.003 : 0.002); } } // one small kick for the first ring (High 2 px / Med ~1.5 px); Calm and Low: none
      const fl = caps.flicker ? (Math.floor(t * 7 + i * 1.3) % 2 ? 'B' : 'A') : 'A';
      let a = L.a;
      if (bandFlat) a *= Math.floor(t * 2 + i) % 2 ? 0.88 : 1; // Low: a 2-frame brightness pulse
      else if (caps.flicker) a *= 0.94 + 0.06 * Math.sin(t * 9 + i * 2.1);
      // the band: one sprite (the sweep is the bright head + the fade-in, never a mask)
      this.sNorm.put('band' + fl + i, R.x, R.y, dG + 7, k, k, a);
      if (caps.head && L.phase === 'sweep') { // the breath head runs clockwise (0 = straight up)
        const ang = L.prog * TAU, hx = R.x + Math.sin(ang) * q.r, hy = R.y - Math.cos(ang) * q.r;
        this.sAdd.put('glow', hx, hy - 4, dF - 12, 0.75, 0.75, 0.9);
        if (c.parts) for (let j = 0; j < caps.sparks; j++) { const w = (R.n = (R.n || 0) + 1); c.parts.emit(hx, hy - 4, ((w % 5) - 2) * 7, -14 - (w % 3) * 6, 0.4, 0.45, 0.1, w % 2 ? COL.amber : COL.core, 0.9); }
      }
      if (lm && caps.lights > 0 && L.a > 0.05) { // lights round the band: Calm and Low skip (Low has no lightmap)
        const n = caps.lights;
        for (let j = 0; j < n; j++) { const ang = (j / n) * TAU + i; lm.add(R.x + Math.sin(ang) * q.r, R.y - Math.cos(ang) * q.r, 30, COL.amber, 0.22 * L.a); }
      }
    }
    // Ophimber: rises over her shoulder, wings spread, settles and fades at `settle`
    const pp = petPose(t, D, caps.calm, this.pose);
    if (pp.a > 0.01) {
      const x = p.x + 11, y = p.y - PET_SHOULDER - pp.lift + pp.bob;
      if (!bandFlat) this.sAdd.put('glow', x, y, dF - 11, 0.62, 0.62, 0.55 * pp.a);
      this.sPet.put(pp.wing ? 'ophb' : 'opha', x, y, dF - 10, 0.34, 0.34, pp.a);
      if (lm && !bandFlat) lm.add(x, y, 34, COL.amber, 0.35 * pp.a);
      if (caps.sparks > 0 && c.parts && t < D.rise + 0.5 && Math.floor(t * 30) !== Math.floor((t - dt) * 30)) c.parts.emit(x - 2, y + 4, -6 + ((Math.floor(t * 30) % 3) - 1) * 5, 10, 0.4, 0.4, 0.1, COL.core, 0.8); // a few embers trail the rise
    }
    for (const s of [this.sNorm, this.sAdd, this.sPet]) s.end();
    this.sprites = this.sNorm.n + this.sAdd.n + this.sPet.n;
  }
}

export const RISE_VISUALS = ABILITY_RESERVE; // the three ring visuals
