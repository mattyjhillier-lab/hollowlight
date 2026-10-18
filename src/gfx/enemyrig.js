// EN0-EN2: Husk enemy animator + death beat (Phaser side, visual only). Reads sim enemies (position, faceX, tele/state, flash) and never writes
// to the sim. One pooled image per enemy from the chapter atlas (frame swap only), plus pooled death props (mask-pop, sinking body, warm mote).
// Per-enemy animation memory lives on the pooled image (reset when the image is reused for another id); no per-frame allocation.
import { HUSK_TYPES, FR, ATLAS_KEY, TPW, RIM_K, EYE_TEX, EYE_KINDS, eyeAnchors, eyeMeta, jitter, wpd } from './husk/frames.js';

const NAMES = Object.keys(FR);
const STRIDE = { wolf: 15, crow: 1, root_crawler: 13 }; // world units moved per walk cycle (crow flaps on time instead)
const CROW_SEQ = [0, 2, 0, 2, 1]; // jerky two-beat flap then a short stall glide (frames w0 up, w2 down, w1 glide)
const CROW_DUR = [0.09, 0.09, 0.09, 0.09, 0.2];
const CROW_T = CROW_DUR.reduce((a, b) => a + b, 0);
export const CORPSE_CAPS = { high: 40, med: 20, low: 8 };
const MOTE = 0xffd27a;
const MOTE_CORE = 0xfff1c8;

// Pure: walk frame for a phase 0..1. Root crawler: plant-then-pull (the planted frames w0/w2 hold longer, the pull frames w1/w3 are quick).
export function walkFrame(type, ph, low) {
  let u = ph - Math.floor(ph);
  if (type === 'root_crawler') { const q = (u * 2) % 1; u = Math.floor(u * 2) / 2 + (q < 0.62 ? 0 : 0.25); return low ? (u < 0.5 ? 0 : 2) : Math.min(3, Math.floor(u * 4 + 1e-6)); }
  const f = Math.min(3, Math.floor(u * 4));
  return low ? (f < 2 ? 0 : 2) : f;
}
// Pure: crow flap frame from time (two quick beats, one stall)
export function crowFrame(t) {
  let u = t - Math.floor(t / CROW_T) * CROW_T;
  for (let i = 0; i < CROW_SEQ.length; i++) { if (u < CROW_DUR[i]) return CROW_SEQ[i]; u -= CROW_DUR[i]; }
  return 1;
}

export class EnemyArt {
  constructor(scene) {
    this.scene = scene;
    this.on = false; // atlas baked + style A
    this.fi = new Uint8Array(512).fill(255); // frame id per enemy index this frame (255 = not a Husk / not drawn) -> night layer eyes/rims
    this.sc = new Float32Array(512).fill(1);
    this.dy = new Float32Array(512); // extra vertical offset (crow bob) per enemy index
    this.eyes = eyeAnchors();
    this.eyeMeta = eyeMeta(); // per socket: look clamp, core size (world units)
    this.eyeNames = {}; // [type][socket] = [glow, core, glow+core] atlas frame names (night layer)
    for (const id in HUSK_TYPES) this.eyeNames[id] = this.eyeMeta[id].map((m, j) => EYE_KINDS.map((k) => `${id}:e${k}${j}`));
    this.eyeInv = 1 / (TPW * EYE_TEX);
    this.foot = {}; for (const id in HUSK_TYPES) this.foot[id] = HUSK_TYPES[id].foot;
    this.names = {}; for (const id in HUSK_TYPES) { this.names[id] = NAMES.map((n) => `${id}:${n}`); this.names[id].rim = NAMES.map((n) => `${id}:r${n}`); }
    this.j = { s: 1, v: 1, ph: 0, sp: 1 };
    this.inv = 1 / TPW;
    this.rimInv = 1 / (TPW * RIM_K);
    this.atlas = ATLAS_KEY;
    // rim frame per runtime frame: walk/tell have their own outline, hurt/body/mask reuse w0
    this.rimOf = Object.values(FR).map((f) => (f <= FR.t1 ? f : FR.w0));
    this.corpses = [];
    this.cN = 0;
    this.ci = 0;
    this.spawned = 0; // readouts
    this.maskPops = 0;
  }

  rimName(type, f) { const r = this.rimOf[f]; return this.names[type].rim[type === 'wolf' || r < FR.t0 ? r : FR.w0]; }

  enable(on) { this.on = on && this.scene.textures.exists(ATLAS_KEY); }
  isHusk(type) { return this.on && !!HUSK_TYPES[type]; }

  // one enemy image per frame. ei = index in sim.enemies. low = Low tier (2-frame walk, no tell ramp).
  apply(img, e, ei, time, low) {
    const T = HUSK_TYPES[e.type];
    const nm = this.names[e.type];
    if (img.aid !== e.id) {
      jitter(e.id, this.j);
      img.aid = e.id; img.ax = e.x; img.ay = e.y; img.js = this.j.s; img.jv = this.j.v; img.ph = this.j.ph; img.jsp = this.j.sp;
      img.hurtT = -9; img.teleT = 0; img.frn = -1; img.tq = -1; img.sx0 = -1;
      if (img.texture.key !== ATLAS_KEY) img.setTexture(ATLAS_KEY, nm[0]);
    }
    const dx = e.x - img.ax, dy = e.y - img.ay;
    const d = Math.sqrt(dx * dx + dy * dy);
    img.ax = e.x; img.ay = e.y;
    let f, sx = 1, sy = 1, bob = 0;
    if (e.flash > 0) img.hurtT = time;
    if (e.tele) img.teleT += Math.min(0.1, this.scene.game.loop.delta / 1000); else img.teleT = 0;
    if (time - img.hurtT < 0.14 && img.hurtT <= time) f = FR.h;
    else if (e.type === 'wolf' && e.tele) f = low || img.teleT > 0.16 ? FR.t1 : FR.t0; // crouch, then the hackles fan up
    else if (e.type === 'crow') { f = crowFrame(time * img.jsp + img.ph * CROW_T); if (low && f === 1) f = 0; bob = Math.sin(time * 5 + img.ph * 6.28) * 0.9; }
    else {
      if (d < 20) img.ph += (d / STRIDE[e.type]) * img.jsp; // teleports (debug moves) never spin the legs
      f = walkFrame(e.type, img.ph, low);
      if (e.state === 'charge') { f = FR.w1; sx = 1.1; sy = 0.93; } // the lunge: stretched, legs extended
    }
    if (f !== img.frn) { img.frn = f; img.setFrame(nm[f]); }
    const s = img.js * this.inv;
    if (img.sx0 !== sx * s) { img.sx0 = sx * s; img.setScale(sx * s, sy * s); }
    img.x = e.x; img.y = e.y + T.foot + bob; // plain writes (cheaper than the chained setter on a few hundred images)
    if (ei < 512) { this.fi[ei] = f; this.sc[ei] = img.js; this.dy[ei] = bob; }
    return f;
  }

  // ---- death beat: the mask pops off and tumbles, the freed body sinks and fades, a small warm mote rises (every kill; locked 2026-10-18) ----
  corpseImg(key, frame, add) {
    const a = this.scene.add.image(0, 0, key, frame).setVisible(false);
    if (add) a.setBlendMode(add);
    return a;
  }

  // img = the enemy's last image (still in its pool this frame), tier caps, phone x0.6, calm = no tumble spin (mask drops straight)
  kill(img, type, tier, phone, calm, depthBase, glowKey, glowInv, blendAdd) {
    const cap = Math.max(1, Math.round((CORPSE_CAPS[tier] ?? CORPSE_CAPS.low) * (phone ? 0.6 : 1)));
    const slot = this.ci % cap; // ring of `cap` slots: a burst of kills recycles the oldest death beat
    this.ci = (this.ci + 1) % 100000;
    let c = this.corpses[slot];
    if (!c) {
      c = { t: 9, dur: 1, x: 0, y: 0, fl: 1, s: 1, type, low: false, calm: false, depth: 0,
        body: this.corpseImg(ATLAS_KEY, this.names[type][FR.b]), mask: this.corpseImg(ATLAS_KEY, this.names[type][FR.m]),
        mote: this.corpseImg(glowKey, undefined, blendAdd).setTint(MOTE), core: this.corpseImg(glowKey, undefined, blendAdd).setTint(MOTE_CORE), gi: glowInv };
      this.corpses[slot] = c;
    }
    for (let k = cap; k < this.corpses.length; k++) { const q = this.corpses[k]; if (q && q.t < q.dur) { q.t = 9; q.body.setVisible(false); q.mask.setVisible(false); q.mote.setVisible(false); q.core.setVisible(false); } }
    const T = HUSK_TYPES[type];
    c.type = type; c.t = 0; c.low = tier === 'low'; c.dur = c.low ? 0.9 : 1.1; c.calm = calm;
    c.x = img.x; c.y = img.y; c.fl = img.flipX ? -1 : 1; c.s = img.js || 1; c.depth = depthBase + img.y - T.foot;
    c.body.setTexture(ATLAS_KEY, this.names[type][FR.b]).setFlipX(img.flipX).setScale(c.s * this.inv).setPosition(c.x, c.y).setDepth(c.depth).setAlpha(1).setVisible(true);
    c.body.setTint(img.lastTint ?? 0xffffff); // the body keeps its night/lit tint (never the white hit flash)
    c.mask.setTexture(ATLAS_KEY, this.names[type][FR.m]).setFlipX(img.flipX).setScale(c.s * this.inv).setDepth(c.depth + 0.5).setVisible(!c.low);
    this.spawned++;
    if (!c.low) this.maskPops++;
    return c;
  }

  // per frame (render dt in seconds)
  update(dt) {
    let live = 0;
    for (const c of this.corpses) {
      if (!c || c.t >= c.dur) continue;
      c.t += dt;
      const T = HUSK_TYPES[c.type], u = wpd(c.type) * c.s, t = c.t;
      if (c.t >= c.dur) { c.body.setVisible(false); c.mask.setVisible(false); c.mote.setVisible(false); c.core.setVisible(false); continue; }
      live++;
      // freed body: brief hold, then sinks and fades (0.5 s)
      const k = Math.min(1, Math.max(0, (t - 0.08) / 0.5));
      c.body.setAlpha(1 - k).setScale(c.s * this.inv * (1 + 0.04 * k), c.s * this.inv * (1 - 0.45 * k)).setPosition(c.x, c.y + k * 1.5);
      if (k >= 1) c.body.setVisible(false);
      // mask: pops up and forward, tumbles, lands on the ground and fades (Med/High only)
      if (!c.low) {
        const m = Math.min(1, t / 0.55);
        const mx = c.x + c.fl * (T.maskAt[0] + m * T.mdx) * u;
        const y0 = c.y + T.maskAt[1] * u, yG = c.y - 1.5;
        const my = y0 + (yG - y0) * m * m - Math.sin(Math.PI * Math.min(1, m * 1.4)) * 4;
        c.mask.setPosition(mx, my).setRotation(c.calm ? 0 : c.fl * m * 1.3).setAlpha(t < 0.75 ? 1 : Math.max(0, 1 - (t - 0.75) / (c.dur - 0.75)));
      }
      // warm mote: rises from the chest from 0.15 s, a soft gold point (colour coming back)
      const g = Math.min(1, Math.max(0, (t - 0.12) / 0.6));
      const vis = t > 0.12;
      const gy = c.y + T.maskAt[1] * u * 0.6 - g * 10;
      const ga = g < 0.7 ? 0.85 : 0.85 * (1 - (g - 0.7) / 0.3) * (1 - Math.max(0, (t - c.dur + 0.25) / 0.25));
      c.mote.setVisible(vis).setPosition(c.x, gy).setScale((0.2 + 0.12 * g) * c.gi).setAlpha(Math.max(0, ga * 0.7)).setDepth(c.depth + 2000);
      c.core.setVisible(vis).setPosition(c.x, gy).setScale(0.075 * c.gi).setAlpha(Math.max(0, ga)).setDepth(c.depth + 2001);
    }
    this.live = live;
    return live;
  }

  clear() {
    for (const c of this.corpses) { if (!c) continue; c.t = 9; c.body.setVisible(false); c.mask.setVisible(false); c.mote.setVisible(false); c.core.setVisible(false); }
  }
}

export { ATLAS_KEY, RIM_K, TPW };
