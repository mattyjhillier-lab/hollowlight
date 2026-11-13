// DM3: Dragonfire Meteor art (RENDER ONLY: reads the sim's rt.fly / rt.pools, never writes them; src/sim is untouched).
// Look (docs/design/fire-weapon-lucinda-v2.md s1): ONE soft ramp, pale gold #fff1c2 -> amber #ffb35c -> ember-rose #e07a6b (0.5 alpha rim). It is
// warm lantern light: it blooms colour back into the ground, never scorches, no smoke, no black. Beat: launch -> 0.45 s arc (ball, short ember
// tail, a faint landing tell on the ground) -> impact flash + tongues -> burning ground that fades as Embers expire and lingers 1 s as a colour tint.
// Cost: a handful of pooled sprites from ONE baked canvas atlas (6 tongue frames + glow, bloom, ring, ball, ember, shade, a flat Low pool).
//   High: full. Medium: fewer tongues / embers / sparks. Low: ONE baked flat sprite per pool, NORMAL blend, no embers, no tongues, no tail.
//   Calm motion: no flicker, no pulse, no embers, no sparks, no pop (steady glow, fades only).
// Flame-visual budget per run = 8 pool visuals, 3 reserved for Lucinda's ability, so this weapon (and its evolutions) may show at most 5.
import { METEOR } from '../sim/weapons.js';

export const FLAME_BUDGET = 8, ABILITY_RESERVE = 3, WEAPON_VISUALS = FLAME_BUDGET - ABILITY_RESERVE; // = 5 = the base sim's live-pool cap
// DM4 Wildfire: up to 6 live pools (WILDFIRE_HARD.maxLive). Only WEAPON_VISUALS (5) are drawn in full; children are always the lighter form
// (fewer tongues, no embers, dimmer 0.8 / 0.65 per generation) and a 6th live pool is glow + ring only, so the flame budget holds.
export const WYRM_SEGS = 7; // = the sim's WYRM_HARD.segs
export const PM_MAX = 6, KID_DIM = [1, 0.8, 0.65], KID_TONGUES = [99, 2, 1];
export const COL = { core: 0xfff1c2, amber: 0xffb35c, rose: 0xe07a6b };
export const IMPACT_T = 0.38, LINGER_T = 1.0, CAP_FADE_T = 0.3, FADE_IN_T = 0.18;
export const KEY = 'mt_atlas', K = 2; // texels per world unit in the atlas

// tier -> caps (phone x0.7 on counts; Calm drops everything that moves on its own)
const BASE = {
  high: { tongues: 4, tongueMax: 6, embers: 3, impact: 8, sparks: 14, tail: 4, halo: true, flat: false, wrate: 16 },
  med: { tongues: 3, tongueMax: 4, embers: 1, impact: 5, sparks: 8, tail: 2, halo: true, flat: false, wrate: 6 },
  low: { tongues: 0, tongueMax: 0, embers: 0, impact: 0, sparks: 0, tail: 0, halo: false, flat: true, wrate: 0 },
};
const CACHE = {};
export function meteorCaps(tier, phone = false, calm = false) {
  const t = BASE[tier] ? tier : 'med', key = t + (phone ? 'p' : '') + (calm ? 'c' : '');
  if (CACHE[key]) return CACHE[key];
  const b = BASE[t], sc = (n) => (n > 0 && phone ? Math.max(1, Math.round(n * 0.7)) : n);
  const c = { tier: t, flat: b.flat, halo: b.halo, calm: !!calm, tongues: sc(b.tongues), tongueMax: sc(b.tongueMax), embers: calm ? 0 : sc(b.embers), impact: calm ? 0 : sc(b.impact), sparks: calm ? 0 : sc(b.sparks), tail: sc(b.tail), flicker: !calm && !b.flat, pop: !calm, wrate: calm ? 0 : sc(b.wrate) }; // wrate = Wyrm spark-trail sparks per second (about 8 live on High, 3 on Medium, none on Low or Calm)
  c.add = !c.flat; // additive blend only above Low
  return (CACHE[key] = c);
}

const sm = (x) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
const frac = (x) => x - Math.floor(x);
export const poolSeed = (x, y) => frac(Math.sin(x * 12.9898 + y * 78.233) * 43758.5453);

// The ball's pose at arc progress k (0 launch .. 1 land): ground point, height above it, and a scale.
export function ballPose(k, ox, oy, tx, ty, out = {}) {
  const kk = k < 0 ? 0 : k > 1 ? 1 : k, d = Math.hypot(tx - ox, ty - oy), H = Math.min(62, Math.max(30, 24 + d * 0.22));
  out.x = ox + (tx - ox) * kk; out.y = oy + (ty - oy) * kk;
  out.h = 12 * (1 - kk) + H * Math.sin(Math.PI * kk);
  out.s = 0.8 + 0.3 * kk;
  return out;
}

// Pool look envelope. rem = the sim pool's life left; born/now = run seconds; gone = run time it left the sim list (or -1); cap = it was dropped by the cap.
// Returns { aIn, flame, glow, tint } in 0..1 (written into out).
export function poolEnv(rem, now, born, gone, cap, out = {}) {
  const aIn = Math.min(1, Math.max(0, (now - born) / FADE_IN_T));
  if (gone < 0) { out.aIn = aIn; out.flame = sm(rem / 1.2); out.glow = sm(rem / 0.7); out.tint = 1; return out; }
  const g = now - gone;
  if (cap) { const k = Math.max(0, 1 - g / CAP_FADE_T); out.aIn = aIn; out.flame = k; out.glow = k; out.tint = k; return out; }
  out.aIn = aIn; out.flame = 0; out.glow = 0; out.tint = Math.max(0, 1 - g / LINGER_T);
  return out;
}

// ---------------------------------------------------------------- atlas bake (2D canvas, once, on the first Meteor sight)
const FR = { glow: [0, 0, 64, 64], bloom: [64, 0, 64, 64], ring: [128, 0, 64, 64], ball: [192, 0, 32, 32], ember: [224, 0, 16, 16], shade: [240, 0, 32, 16], poolLow: [160, 64, 96, 96], whead: [0, 160, 48, 40], wseg: [48, 160, 32, 32] }; // DM5: Cinder Wyrm head + body segment (row at y 160)
export const ATLAS_W = 288, ATLAS_H = 208;
for (let i = 0; i < 6; i++) FR['tongue' + i] = [i * 24, 64, 24, 40];
const rg = (c, x, y, r, stops) => { const g = c.createRadialGradient(x, y, 0, x, y, r); for (const [o, col] of stops) g.addColorStop(o, col); return g; };
const GLOW = [[0, 'rgba(255,241,194,0.95)'], [0.25, 'rgba(255,214,140,0.7)'], [0.5, 'rgba(255,179,92,0.38)'], [0.78, 'rgba(224,122,107,0.14)'], [1, 'rgba(224,122,107,0)']];
const BLOOM = [[0, 'rgba(232,224,140,0.5)'], [0.6, 'rgba(214,214,132,0.25)'], [1, 'rgba(214,214,132,0)']];
function tonguePath(c, ox, oy, lean, hv, sc = 1) { // a licking flame tongue: round belly, S-curved body, tip bent by `lean` (not a symmetric drop)
  const tx = 2 + lean * 1.5, S = (v) => v * sc;
  c.beginPath(); c.moveTo(ox, oy);
  c.bezierCurveTo(ox - S(12), oy - S(2), ox - S(12), oy - S(15), ox - S(5) + S(lean) * 0.4, oy - S(23));
  c.bezierCurveTo(ox - S(2) + S(lean) * 0.8, oy - S(29), ox + S(tx) - S(2), oy - S(31), ox + S(tx), oy - S(36) + hv);
  c.bezierCurveTo(ox + S(tx) + S(3), oy - S(28), ox + S(12), oy - S(22), ox + S(11), oy - S(11));
  c.bezierCurveTo(ox + S(10), oy - S(3), ox + S(6), oy, ox, oy);
  c.closePath();
}
function drawTongue(c, ox, oy, lean, hv, sc = 1, a = 1) {
  const g = c.createLinearGradient(0, oy, 0, oy - 36 * sc);
  g.addColorStop(0, `rgba(224,122,107,${0.8 * a})`); g.addColorStop(0.2, `rgba(255,179,92,${a})`); g.addColorStop(0.6, `rgba(255,214,140,${0.97 * a})`); g.addColorStop(1, `rgba(255,236,176,${0.75 * a})`);
  c.fillStyle = g; tonguePath(c, ox, oy, lean, hv, sc); c.fill();
  c.strokeStyle = `rgba(224,122,107,${0.75 * a})`; c.lineWidth = 1.1 * sc; c.stroke(); // rose rim: gives the tongue an edge without any black
  const g2 = c.createLinearGradient(0, oy, 0, oy - 26 * sc);
  g2.addColorStop(0, `rgba(255,241,194,${0.7 * a})`); g2.addColorStop(1, 'rgba(255,241,194,0)');
  c.fillStyle = g2; tonguePath(c, ox, oy - 1, lean * 0.5, hv * 0.4 + 7 * sc, sc * 0.5); c.fill();
}
export function bakeAtlas(c) { // c = a 2D context 288 x 208
  const at = (n) => FR[n];
  let [x, y] = at('glow'); c.fillStyle = rg(c, x + 32, y + 32, 32, GLOW); c.fillRect(x, y, 64, 64);
  [x, y] = at('bloom'); c.fillStyle = rg(c, x + 32, y + 32, 32, BLOOM); c.fillRect(x, y, 64, 64);
  [x, y] = at('ring'); c.fillStyle = rg(c, x + 32, y + 32, 32, [[0, 'rgba(255,214,140,0)'], [0.925, 'rgba(255,214,140,0)'], [0.965, 'rgba(255,200,120,0.85)'], [1, 'rgba(255,179,92,0)']]); c.fillRect(x, y, 64, 64);
  [x, y] = at('ball');
  c.fillStyle = rg(c, x + 16, y + 16, 16, [[0, 'rgba(255,214,140,0.7)'], [0.5, 'rgba(224,122,107,0.4)'], [1, 'rgba(224,122,107,0)']]); c.fillRect(x, y, 32, 32);
  c.fillStyle = rg(c, x + 16, y + 16, 8, [[0, 'rgba(255,241,194,1)'], [0.55, 'rgba(255,200,120,1)'], [0.85, 'rgba(255,179,92,1)'], [1, 'rgba(255,179,92,0)']]); c.beginPath(); c.arc(x + 16, y + 16, 8, 0, 6.2832); c.fill();
  c.strokeStyle = 'rgba(224,122,107,0.5)'; c.lineWidth = 1; // dragon-scale glint: one tiny scale arc and a bright fleck
  c.beginPath(); c.arc(x + 17.5, y + 17.5, 3.6, 0.3, 1.6); c.stroke();
  c.fillStyle = 'rgba(255,255,240,0.95)'; c.beginPath(); c.arc(x + 13, y + 12.5, 1.6, 0, 6.2832); c.fill();
  [x, y] = at('ember'); c.fillStyle = rg(c, x + 8, y + 8, 8, [[0, 'rgba(255,241,194,1)'], [0.45, 'rgba(255,200,120,0.7)'], [1, 'rgba(255,179,92,0)']]); c.fillRect(x, y, 16, 16);
  [x, y] = at('shade'); c.save(); c.translate(x + 16, y + 8); c.scale(1, 0.5); c.fillStyle = rg(c, 0, 0, 16, [[0, 'rgba(46,40,78,0.55)'], [1, 'rgba(46,40,78,0)']]); c.fillRect(-16, -16, 32, 32); c.restore(); // dusk blue-violet, never black
  const L = [[-3, 0], [2, 3], [-1, -2], [3, 1], [-2, 4], [1, -1]];
  for (let i = 0; i < 6; i++) { const [tx, ty] = at('tongue' + i); drawTongue(c, tx + 12, ty + 38, L[i][0], L[i][1]); }
  [x, y] = at('wseg'); // DM5 Wyrm body segment: soft halo, round flame body (gold core, amber, rose rim), one dragon-scale arc
  c.fillStyle = rg(c, x + 16, y + 16, 16, [[0, 'rgba(255,214,140,0.5)'], [0.6, 'rgba(224,122,107,0.28)'], [1, 'rgba(224,122,107,0)']]); c.fillRect(x, y, 32, 32);
  c.fillStyle = rg(c, x + 16, y + 16, 12.5, [[0, 'rgba(255,241,194,1)'], [0.45, 'rgba(255,200,120,1)'], [0.85, 'rgba(255,179,92,1)'], [1, 'rgba(240,150,100,0.95)']]); c.beginPath(); c.arc(x + 16, y + 16, 12.5, 0, 6.2832); c.fill();
  c.strokeStyle = 'rgba(224,122,107,0.85)'; c.lineWidth = 1.4; c.beginPath(); c.arc(x + 16, y + 16, 12.2, 0, 6.2832); c.stroke();
  c.strokeStyle = 'rgba(224,122,107,0.55)'; c.lineWidth = 1; c.beginPath(); c.arc(x + 18, y + 18, 6, 0.2, 1.9); c.stroke();
  [x, y] = at('whead'); // DM5 Wyrm head, facing +x: two swept horns, a rounded muzzle, two eye glints (the dragon-kin family tie), gold-to-rose, no black
  c.fillStyle = rg(c, x + 22, y + 20, 24, [[0, 'rgba(255,214,140,0.5)'], [0.6, 'rgba(224,122,107,0.25)'], [1, 'rgba(224,122,107,0)']]); c.fillRect(x, y, 48, 40);
  for (const sg of [-1, 1]) {
    c.beginPath(); c.moveTo(x + 15, y + 20 + sg * 7); c.quadraticCurveTo(x + 6, y + 20 + sg * 11, x + 2, y + 20 + sg * 18); c.quadraticCurveTo(x + 12, y + 20 + sg * 15, x + 21, y + 20 + sg * 11); c.closePath();
    c.fillStyle = 'rgba(255,190,110,0.95)'; c.fill(); c.strokeStyle = 'rgba(224,122,107,0.9)'; c.lineWidth = 1.2; c.stroke();
  }
  c.beginPath(); c.moveTo(x + 7, y + 20); c.bezierCurveTo(x + 7, y + 8, x + 24, y + 6, x + 36, y + 13); c.bezierCurveTo(x + 45, y + 17, x + 45, y + 23, x + 36, y + 27); c.bezierCurveTo(x + 24, y + 34, x + 7, y + 32, x + 7, y + 20); c.closePath();
  const hg = c.createLinearGradient(x + 7, y, x + 45, y); hg.addColorStop(0, 'rgba(255,200,120,1)'); hg.addColorStop(0.55, 'rgba(255,226,160,1)'); hg.addColorStop(1, 'rgba(255,241,194,1)');
  c.fillStyle = hg; c.fill(); c.strokeStyle = 'rgba(224,122,107,0.9)'; c.lineWidth = 1.4; c.stroke();
  for (const sg of [-1, 1]) { c.fillStyle = 'rgba(224,122,107,0.95)'; c.beginPath(); c.arc(x + 29, y + 20 + sg * 5, 2.4, 0, 6.2832); c.fill(); c.fillStyle = 'rgba(255,255,240,1)'; c.beginPath(); c.arc(x + 29.6, y + 19.4 + sg * 5, 1.1, 0, 6.2832); c.fill(); }
  [x, y] = at('poolLow'); // Low: ONE flat sprite (no additive): tint + glow + rim + 5 tongues
  c.fillStyle = rg(c, x + 48, y + 48, 48, BLOOM); c.fillRect(x, y, 96, 96);
  c.fillStyle = rg(c, x + 48, y + 48, 44, [[0, 'rgba(255,226,160,0.6)'], [0.5, 'rgba(255,179,92,0.4)'], [0.9, 'rgba(224,122,107,0.28)'], [1, 'rgba(224,122,107,0)']]); c.fillRect(x, y, 96, 96);
  c.strokeStyle = 'rgba(240,140,100,0.55)'; c.lineWidth = 1.8; c.beginPath(); c.arc(x + 48, y + 48, 42, 0, 6.2832); c.stroke();
  for (let i = 0; i < 5; i++) { const a = i * 2.399 + 0.4, rr = 12 + (i % 3) * 8; drawTongue(c, x + 48 + Math.cos(a) * rr * 1.3, y + 50 + Math.sin(a) * rr * 1.2, L[i][0], L[i][1], 0.42, 0.9); }
}

// ---------------------------------------------------------------- pooled sprite lists
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

export class MeteorLayer {
  // gl = { ADD, NORMAL, LINEAR, depthGround, depthLit, depthFx } (passed in so this file never imports Phaser)
  constructor(scene, gl) {
    this.scene = scene; this.gl = gl; this.ok = false; this.dead = false;
    this.sTint = null; this.sGlow = null; this.sNorm = null; this.sTongue = null; this.sTongueI = null; this.sFx = null; this.sFxN = null;
    this.fly = new Map(); this.pools = new Map(); this.imp = []; this.fr = 0; this.lastT = 0; this.crack = 0;
    this.wl = 0; this.wsp = 0; this.wn = 0;
    this.pose = { x: 0, y: 0, h: 0, s: 1 }; this.env = { aIn: 0, flame: 0, glow: 0, tint: 0 };
    this.sprites = 0; // sprites placed last frame (probe)
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
      this.sTint = new Slots(sc, KEY, g.NORMAL); this.sGlow = new Slots(sc, KEY, g.ADD); this.sNorm = new Slots(sc, KEY, g.NORMAL);
      this.sTongue = new Slots(sc, KEY, g.NORMAL, [0.5, 0.94]); this.sTongueI = new Slots(sc, KEY, g.NORMAL, [0.5, 0.94]); this.sFx = new Slots(sc, KEY, g.ADD); this.sFxN = new Slots(sc, KEY, g.NORMAL);
      this.ok = true;
    } catch { this.dead = true; this.ok = false; } // no canvas: the old placeholder rings keep showing
    return this.ok;
  }
  hideAll() { if (!this.ok) return; for (const s of [this.sTint, this.sGlow, this.sNorm, this.sTongue, this.sTongueI, this.sFx, this.sFxN]) s.hide(); this.sprites = 0; }
  reset() { this.wl = 0; this.wsp = 0; this.wn = 0; this.fly.clear(); this.pools.clear(); this.imp.length = 0; this.lastT = 0; this.crack = 0; this.hideAll(); }

  // c = { sim, tier, phone, calm, lm (or null), parts, cue(id), vx0, vy0, vx1, vy1 }; call once a frame.
  update(c) {
    const sim = c.sim, w = sim.weapons.find((x) => x.id === 'dragonfire_meteor');
    if (!w || !w.rt || !w.rt.pools) { if (this.sprites || this.fly.size || this.pools.size) this.reset(); return; }
    if (!this.bake()) return;
    const T = sim.time, dt = Math.max(0, Math.min(0.1, T - this.lastT)); if (T < this.lastT) this.reset(); this.lastT = T;
    const caps = meteorCaps(c.tier, c.phone, c.calm), g = this.gl, p = sim.player;
    for (const s of [this.sTint, this.sGlow, this.sNorm, this.sTongue, this.sTongueI, this.sFx, this.sFxN]) s.begin();
    const fr = ++this.fr, dG = g.depthGround, dL = g.depthLit, dF = g.depthFx, lm = c.lm;
    const inV = (x, y) => x >= c.vx0 && x <= c.vx1 && y >= c.vy0 && y <= c.vy1;
    const sFxA = caps.add ? this.sFx : this.sFxN, sGlA = caps.add ? this.sGlow : this.sNorm;
    const fx = caps.add ? this.sFx : this.sFxN;

    // ---- fireballs in the air
    const arc = METEOR.arc, ps = this.pose; let punched = false;
    for (const f of w.rt.fly) {
      let r = this.fly.get(f);
      if (!r) { r = { ox: p.x, oy: p.y - 4, x: f.x, y: f.y, r: f.r, fr }; this.fly.set(f, r); c.cue('meteor_launch'); }
      r.fr = fr; r.x = f.x; r.y = f.y; r.r = f.r;
      const k = 1 - f.t / arc;
      // landing tell: a thin ring at the burst radius (low coverage), steady in Calm
      const ta = caps.pop ? 0.22 + 0.34 * k : 0.38;
      this.sNorm.put('ring', f.x, f.y, dG + 5, f.r / 15.2 * (caps.pop ? 1.12 - 0.12 * k : 1), f.r / 15.2 * (caps.pop ? 1.12 - 0.12 * k : 1), ta);
      if (!caps.flat) sGlA.put('glow', f.x, f.y, dG + 4, f.r / 16, f.r / 16, 0.05 + 0.1 * k, 0, COL.amber);
      ballPose(k, r.ox, r.oy, f.x, f.y, ps);
      this.sNorm.put('shade', ps.x, ps.y + 2, dG + 6, 0.8 + 0.4 * k, 0.8 + 0.4 * k, 0.3 + 0.25 * k - ps.h * 0.002);
      if (caps.tail) for (let j = caps.tail; j >= 1; j--) {
        const kj = k - 0.075 * j; if (kj <= 0) continue;
        const q = ballPose(kj, r.ox, r.oy, f.x, f.y, this.pose2 || (this.pose2 = { x: 0, y: 0, h: 0, s: 1 }));
        sFxA.put('glow', q.x, q.y - q.h, dF - 12, 0.2 * (1 - j / (caps.tail + 1)) + 0.05, 0.2 * (1 - j / (caps.tail + 1)) + 0.05, 0.55 / (1 + j * 0.5), 0, j > 1 ? COL.rose : COL.amber);
      }
      if (caps.halo) sFxA.put('glow', ps.x, ps.y - ps.h, dF - 11, 0.62 * ps.s, 0.62 * ps.s, 0.8);
      fx.put('ball', ps.x, ps.y - ps.h, dF - 10, 0.5 * ps.s, 0.5 * ps.s, 1);
      if (lm && !caps.flat) lm.add(ps.x, ps.y - ps.h * 0.5, 38, COL.amber, 0.6);
    }
    if (this.fly.size) for (const [f, r] of this.fly) if (r.fr !== fr) { // gone from the sim list = it landed
      this.fly.delete(f);
      if (this.imp.length < 12) this.imp.push({ x: r.x, y: r.y, r: r.r, t: 0, s: poolSeed(r.x, r.y) });
      if (inV(r.x, r.y)) { c.cue('meteor_impact'); if (caps.pop && !caps.flat && c.shake && !punched) { punched = true; c.shake(60, caps.tier === 'high' ? 0.0045 : 0.003); } } // 3 px (High) / 2 px (Med) kick; RunScene.shake obeys Calm + the Screen shake setting + its 0.4 s gate
    }

    // ---- DM5 Cinder Wyrm: a flame-serpent spirit (7 round segments, taper to the tail, a horned head). Reads the sim's rt.wyrm positions; adds no pools.
    const wy = w.rt.wyrm;
    if (wy && wy.seg && wy.k > 0.01 && Number.isFinite(wy.cx) && Number.isFinite(wy.cy)) {
      if (wy.loops !== this.wl) { this.wl = wy.loops; if (wy.on && inV(wy.cx, wy.cy)) c.cue('wyrm_rise'); }
      const k = sm(wy.k), n = Math.min(WYRM_SEGS, Math.max(2, wy.nseg | 0));
      for (let i = n - 1; i >= 0; i--) {
        const sx = wy.seg[i * 2], sy = wy.seg[i * 2 + 1];
        if (!Number.isFinite(sx) || !Number.isFinite(sy)) continue;
        if (sx < c.vx0 - 40 || sx > c.vx1 + 40 || sy < c.vy0 - 40 || sy > c.vy1 + 40) continue;
        const sc = i === 0 ? 1 : 0.8 - 0.4 * (i / (n - 1)), dd = dF - 9 - (n - i) * 0.01;
        if (!caps.flat) sGlA.put('glow', sx, sy - 7, dd - 3, 0.5 * sc + 0.15, 0.5 * sc + 0.15, 0.3 * k, 0, COL.amber);
        if (i > 0) this.sFxN.put('wseg', sx, sy - 7, dd, 0.9 * sc, 0.9 * sc, k);
      }
      { const hx = wy.seg[0], hy = wy.seg[1], nx = wy.seg[2], ny = wy.seg[3];
        if (Number.isFinite(hx) && Number.isFinite(hy) && hx >= c.vx0 - 40 && hx <= c.vx1 + 40 && hy >= c.vy0 - 40 && hy <= c.vy1 + 40) {
          const ang = Number.isFinite(nx) && Number.isFinite(ny) ? Math.atan2(hy - ny, hx - nx) : 0;
          this.sFxN.put('whead', hx, hy - 7, dF - 9.5, 0.8, 0.8, k, ang);
          if (lm && !caps.flat) lm.add(hx, hy - 7, 46, COL.amber, 0.45 * k);
        } }
      if (caps.wrate > 0 && c.parts && wy.on) { // spark trail: a few embers shed from the body, one per tick, picked by a counter (no random draws)
        this.wsp += dt * caps.wrate;
        while (this.wsp >= 1) { this.wsp -= 1; this.wn++; const i = 1 + (this.wn * 3) % Math.max(1, n - 1), sx = wy.seg[i * 2], sy = wy.seg[i * 2 + 1]; if (Number.isFinite(sx) && inV(sx, sy)) c.parts.emit(sx, sy - 7, ((this.wn % 5) - 2) * 6, -16 - (this.wn % 3) * 6, 0.5, 0.45, 0.1, this.wn % 3 ? COL.amber : COL.core, 0.85); }
        if (this.wsp > 3) this.wsp = 0;
      }
    }

    // ---- impacts: flash + expanding tongues + sparks
    for (let i = this.imp.length - 1; i >= 0; i--) {
      const m = this.imp[i];
      if (m.t === 0 && caps.sparks && c.parts) {
        for (let j = 0; j < caps.sparks; j++) { const a = j / caps.sparks * 6.2832 + m.s * 6, sp = 40 + ((j * 37) % 55); c.parts.emit(m.x, m.y - 4, Math.cos(a) * sp, Math.sin(a) * sp * 0.7 - 28, 0.42 + (j % 3) * 0.08, 0.5, 0.12, j % 3 ? COL.amber : COL.core, 0.9); }
      }
      m.t += dt;
      const k = m.t / IMPACT_T;
      if (k >= 1) { this.imp.splice(i, 1); continue; }
      const e = 1 - (1 - k) * (1 - k), fa = 1 - k, rr = m.r;
      const fs = caps.pop ? (0.5 + 0.8 * e) : 1;
      fx.put('glow', m.x, m.y, dF - 8, rr * 1.3 / 32 * fs, rr * 1.3 / 32 * fs, caps.add ? 0.4 * fa : 0.6 * fa);
      if (!caps.flat) fx.put('glow', m.x, m.y - 2, dF - 7, rr * 0.6 / 32 * (0.6 + 0.6 * e), rr * 0.6 / 32 * (0.6 + 0.6 * e), 0.55 * fa, 0, COL.core);
      for (let j = 0; j < caps.impact; j++) { // tongues leap out and up from the ground in one ramp (leaning outward, uneven: a burst, not a flower)
        const a = (j + 0.3 * frac(j * 1.7 + m.s)) / caps.impact * 6.2832 + m.s * 6.2832, d = rr * (0.18 + 0.62 * e) * (0.8 + 0.4 * frac(j * 0.618 + m.s));
        const ts = (rr / 34) * (0.45 + 0.4 * frac(j * 0.37 + m.s * 3)) * (1 - 0.5 * k), lean = Math.cos(a) * 0.3;
        this.sTongueI.put('tongue' + ((j + (m.s * 6 | 0)) % 6), m.x + Math.cos(a) * d, m.y + Math.sin(a) * d * 0.7 - 5 * e, dF - 6, ts, ts, 0.75 * fa, lean);
      }
      if (lm) lm.add(m.x, m.y, rr * 1.6, COL.amber, 0.55 * fa);
    }

    // ---- burning ground
    const pm = this.pools;
    for (const q of w.rt.pools) {
      let r = pm.get(q);
      if (!r) { r = { born: T, gone: -1, cap: false, x: q.x, y: q.y, r: q.r, rem: q.life, s: poolSeed(q.x, q.y), fr, gen: q.gen > 0 ? Math.min(2, q.gen | 0) : 0, par: q.par || null }; pm.set(q, r); if (r.gen && q.par && inV(q.x, q.y)) c.cue('meteor_crackle'); } // a child lights: the soft ember tick
      r.fr = fr; r.rem = q.life; r.r = q.r;
    }
    if (pm.size) {
      for (const [q, r] of pm) if (r.fr !== fr && r.gone < 0) { r.gone = T; r.cap = r.rem > 0.15; } // left the sim list: natural end vs dropped by the cap
      let liveN = 0; for (const r of pm.values()) if (r.gone < 0) liveN++;
      const lim = Math.min(PM_MAX, Math.max(WEAPON_VISUALS, liveN)); // 5 visuals (6 only while 6 Wildfire pools are really alive; ghosts go first)
      while (pm.size > lim) { // shared flame budget: oldest ghost goes first
        let ok = null, ov = Infinity;
        for (const [q, r] of pm) { const v = (r.gone >= 0 ? 0 : 1e6) + r.born; if (v < ov) { ov = v; ok = q; } }
        pm.delete(ok);
      }
      const env = this.env;
      let nv = 0, newest = null, nb = -1;
      for (const [q, r] of pm) { if (r.gone < 0 || !r.cap) { nv++; } if (r.gone < 0 && r.born >= nb) { nb = r.born; newest = q; } }
      const ov = 1 / (1 + 0.8 * Math.max(0, nv - 1)); // overlap damping: 5 stacked pools share ~0.4 of a single pool's add-blend light
      let full = 0; // parents first, then oldest: the first WEAPON_VISUALS live pools get the full form
      for (const [q, r] of pm) r.lite = true;
      for (let pass = 0; pass < 2; pass++) for (const [q, r] of pm) if (r.gone < 0 && (pass === 0) === (r.gen === 0) && full < WEAPON_VISUALS) { r.lite = false; full++; }
      for (const [q, r] of pm) {
        poolEnv(r.rem, T, r.born, r.gone, r.cap, env);
        if (r.gone >= 0 && (T - r.gone) > (r.cap ? CAP_FADE_T : LINGER_T)) { pm.delete(q); continue; }
        const rad = r.r, px = r.x, py = r.y, kd = KID_DIM[r.gen] || 0.65;
        if ((px < c.vx0 - rad || px > c.vx1 + rad || py < c.vy0 - rad || py > c.vy1 + rad)) continue;
        if (r.par) { // the creeping thread: one faint ember streak from the parent's heart to the child's, while both burn (1 sprite; High adds two drifting embers)
          const pr = pm.get(r.par);
          if (pr && pr.gone < 0 && r.gone < 0) {
            const tx = pr.x, ty = pr.y, len = Math.hypot(px - tx, py - ty) || 1, ang = Math.atan2(py - ty, px - tx), ta = 0.5 * env.flame * env.aIn * Math.min(1, (T - r.born) / 0.6);
            if (ta > 0.01) {
              fx.put('ember', (tx + px) / 2, (ty + py) / 2, dF - 15, len / 11, 0.42, ta, ang);
              if (!caps.flat && caps.embers && !caps.calm) for (let j = 0; j < 2; j++) { const ph = frac(T * 0.7 + r.s * 3 + j * 0.5); fx.put('ember', tx + (px - tx) * ph, ty + (py - ty) * ph, dF - 14, 0.55, 0.55, Math.sin(Math.PI * ph) * 0.8 * env.flame * env.aIn); }
            }
          }
        }
        if (caps.flat) { // ONE baked flat sprite
          const a = kd * env.aIn * (r.gone < 0 ? 0.85 * env.glow + 0.15 : r.cap ? env.tint : 0.15 * env.tint);
          this.sNorm.put('poolLow', px, py, dG + 3, rad * 2.2 / 48, rad * 2.2 / 48, Math.min(1, a));
          continue;
        }
        const pulse = caps.flicker ? 0.06 * Math.sin(T * 3.1 + r.s * 6.2832) : 0;
        this.sTint.put('bloom', px, py, dG + 2, rad * 1.15 / 16, rad * 1.15 / 16, 0.42 * kd * env.aIn * env.tint * (0.45 + 0.55 * ov));
        if (env.glow > 0.01) this.sGlow.put('glow', px, py, dG + 3, rad * 1.25 / 16, rad * 1.25 / 16, Math.max(0, (0.17 + pulse * 0.5) * kd * env.glow * env.aIn * ov), 0, 0xffc880);
        const ra = (q === newest ? 0.4 : 0.13) /* the newest pool keeps a clear damage edge, older ones a faint one */ * kd * env.aIn * (0.3 + 0.7 * env.glow) * (r.gone >= 0 ? env.tint : 1);
        if (ra > 0.01) this.sNorm.put('ring', px, py, dG + 4, rad / 15.2, rad / 15.2, ra);
        if (env.flame > 0.02 && !r.lite) {
          const nT = Math.min(caps.tongueMax, caps.tongues + Math.max(0, Math.floor((rad - 35) / 15)), KID_TONGUES[r.gen] || 1), base = (rad / 35 < 0.8 ? 0.8 : rad / 35 > 1.2 ? 1.2 : rad / 35) * 0.62;
          for (let i = 0; i < nT; i++) {
            const th = r.s * 6.2832 + i * 2.399, rho = rad * (0.2 + 0.5 * frac(i * 0.618 + r.s)), tx = px + Math.cos(th) * rho, ty = py + Math.sin(th) * rho * 0.9;
            const fi = caps.flicker ? ((Math.floor(T * 7 + i * 1.7 + r.s * 6)) % 6 + 6) % 6 : (i + Math.floor(r.s * 6)) % 6;
            const wob = caps.flicker ? 1 + 0.12 * Math.sin(T * 9 + i * 2 + r.s * 20) : 1, s = base * env.flame * wob;
            this.sTongue.put('tongue' + fi, tx, ty, dG + 7, s, s, 0.75 * kd * env.aIn * env.flame);
          }
          if (!r.gen) for (let j = 0; j < caps.embers; j++) {
            const ph = frac(T * 0.6 + r.s * 3 + j / 3), ex = px + (frac(r.s * 7 + j * 0.37) - 0.5) * rad * 1.2, ey = py + (frac(r.s * 5 + j * 0.21) - 0.5) * rad * 0.8 - ph * 22;
            this.sFx.put('ember', ex, ey, dF - 14, 0.7 * (1 - 0.4 * ph), 0.7 * (1 - 0.4 * ph), Math.sin(Math.PI * ph) * 0.85 * env.flame * env.aIn);
          }
        }
        if (lm && env.glow > 0.02) lm.add(px, py, rad * 1.7, COL.amber, 0.2 * env.glow * env.aIn * ov);
      }
      // a quiet crackle tick while a pool burns in view (loop-free: one short cue per ~0.55 s of run time)
      this.crack -= dt;
      if (this.crack <= 0) { for (const [q, r] of pm) if (r.gone < 0 && inV(r.x, r.y)) { c.cue('meteor_crackle'); break; } this.crack = 0.55; }
    }
    for (const s of [this.sTint, this.sGlow, this.sNorm, this.sTongue, this.sTongueI, this.sFx, this.sFxN]) s.end();
    this.sprites = this.sTint.n + this.sGlow.n + this.sNorm.n + this.sTongue.n + this.sTongueI.n + this.sFx.n + this.sFxN.n;
  }
}
