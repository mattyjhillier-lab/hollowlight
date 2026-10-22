// EN7/EN8 render layer (visual only: reads sim state + events, never writes the sim): the Branch-Mane's extras and the Lantern Reliquary.
//  - miniboss always fully lit: a soft amber light at its body (like the boss; amber = the locked boss eye colour, never gold);
//  - HOWL: a ring of cold-violet corruption veins spreading from its feet (the sim fx 'howl'); Calm = a static ring, no spread;
//  - death beat: 50 ms hit-stop (scene.stop, off under Calm), a warm mote ring and a sprout + flower that grows where it fell (locked: minibosses only);
//  - the chest (Lantern Reliquary art, baked from src/gfx/husk/husks3.js at boot; flat 'chest' sprite until then): tier read = plain / brass bands /
//    + lit lantern; a slow seam-light breath (not under Calm); warm light in the lightmap; opening = roof tips back (open frame) + cream-amber light
//    spill up (rings + motes in lantern colours, no gold).
// No per-frame allocation: fixed pools (chest images, sprouts) and one Graphics redrawn per frame.
import { defs, resetAll, setGrainBox } from './husk/paint.js';
import { EXTRA_DEFS } from './husk/kit.js';
import { reliquaryA } from './husk/husks3.js';

export const RELIQ_KEY = 'reliq';
const TPU = 6; // texels per world unit
const WPD = 0.3; // world units per design unit (large tier ~31 px wide on the 720p desktop)
const BOX = [-50, -96, 100, 104]; // du: frame box incl. the glow and the open spill
const FRAMES = [[0, 0], [1, 0], [2, 0], [0, 1], [1, 1], [2, 1]]; // [tier, open]
const LANTERN = 0xffcf7a, CORE = 0xfff1c8, AMBER = 0xffb84a, VEIN = 0x6a58a0, LIFE = 0x6fae5a, PETAL = 0xffd98a;

// pure: the SVG sheet of the six chest frames in one row (frame i at x = i * fw). Our own code only (no external refs, no untrusted input).
export function reliquarySheet() {
  const k = TPU * WPD, fw = Math.ceil(BOX[2] * k) + 2, fh = Math.ceil(BOX[3] * k) + 2;
  resetAll(); setGrainBox(BOX[0], BOX[1], BOX[2], BOX[3]);
  let body = '';
  FRAMES.forEach(([tier, open], i) => {
    body += `<svg x="${i * fw}" y="0" width="${fw}" height="${fh}" viewBox="${(BOX[0] - 1 / k).toFixed(2)} ${(BOX[1] - 1 / k).toFixed(2)} ${(fw / k).toFixed(2)} ${(fh / k).toFixed(2)}" overflow="hidden">${reliquaryA({ tier, open })}</svg>`;
  });
  const w = fw * FRAMES.length;
  return { svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${fh}" viewBox="0 0 ${w} ${fh}">${defs()}<defs>${EXTRA_DEFS}</defs>${body}</svg>`, w, h: fh, fw, fh, ox: 1 + -BOX[0] * k, oy: 1 + -BOX[1] * k };
}

export const RELIQ_BAKE = { ready: false, ms: 0, error: '' };
export async function bakeReliquary(scene) {
  const t0 = performance.now();
  try {
    if (scene.textures.exists(RELIQ_KEY)) { RELIQ_BAKE.ready = true; return true; }
    const S = reliquarySheet();
    const url = URL.createObjectURL(new Blob([S.svg], { type: 'image/svg+xml' }));
    let img;
    try { img = new Image(); img.decoding = 'async'; img.src = url; await img.decode(); } finally { URL.revokeObjectURL(url); }
    const cv = document.createElement('canvas'); cv.width = S.w; cv.height = S.h;
    cv.getContext('2d').drawImage(img, 0, 0);
    const tex = scene.textures.addCanvas(RELIQ_KEY, cv);
    FRAMES.forEach((_, i) => { const f = tex.add(`c${i}`, 0, i * S.fw, 0, S.fw, S.fh); f.customPivot = true; f.pivotX = S.ox / S.fw; f.pivotY = S.oy / S.fh; });
    RELIQ_BAKE.ready = true;
    return true;
  } catch (err) {
    RELIQ_BAKE.error = String((err && err.message) || err);
    console.warn('Reliquary bake failed; keeping the flat chest sprite', err);
    return false;
  } finally { RELIQ_BAKE.ms = Math.round(performance.now() - t0); }
}

export class MiniView {
  // scene: RunScene (addRing / burst / stop / shake helpers); depths: { lit, ground } ; flatInv: world units per texel of the flat 'chest' sprite
  constructor(scene, depths, flatInv, glowInv) {
    this.scene = scene; this.D = depths; this.flatInv = flatInv || 0.25; this.glowInv = glowInv || 0.1;
    this.glows = []; // one soft additive warm glow under each chest (the reward reads at true size, day and night)
    this.chests = []; this.chestN = 0; // pooled images
    this.opening = []; for (let i = 0; i < 3; i++) this.opening.push({ t: 9, x: 0, y: 0, tier: 0, img: null });
    this.sprouts = []; for (let i = 0; i < 4; i++) this.sprouts.push({ t: 99, x: 0, y: 0 });
    this.g = scene.add.graphics().setDepth(depths.ground); // howl veins + sprouts (ground layer, under the bodies)
    this.time = 0;
  }

  chestImg(i) {
    let im = this.chests[i];
    if (!im) { im = this.chests[i] = this.scene.add.image(0, 0, 'chest'); im.fr = -1; im.key0 = 'chest'; this.glows[i] = this.scene.add.image(0, 0, 'glow').setBlendMode(1).setTint(LANTERN); }
    return im;
  }

  setChest(im, tier, open) {
    if (RELIQ_BAKE.ready) {
      if (im.key0 !== RELIQ_KEY) { im.key0 = RELIQ_KEY; im.fr = -1; }
      const fr = tier + (open ? 3 : 0);
      if (im.fr !== fr) { im.fr = fr; im.setTexture(RELIQ_KEY, `c${fr}`); }
      im.setScale(1 / TPU);
    } else {
      if (im.key0 !== 'chest') { im.key0 = 'chest'; im.setTexture('chest'); }
      im.setScale(this.flatInv * (0.86 + 0.1 * tier));
    }
  }

  onEvent(ev) {
    const sc = this.scene, calm = sc.reducedMotion ? sc.reducedMotion() : false, low = sc.quality && sc.quality.tier === 'low';
    if (ev.type === 'mini') sc.shake && sc.shake(200, 0.004);
    else if (ev.type === 'miniPhase') { if (Number.isFinite(ev.x)) sc.addRing(ev.x, ev.y, 10, 70, 0.5, AMBER, 2); }
    else if (ev.type === 'miniDead') {
      sc.stop && sc.stop(0.05); // 40-60 ms hit-stop on minibosses only (respects Calm + its own cool-down)
      sc.addRing(ev.x, ev.y, 8, 90, 0.6, LANTERN, 2);
      if (!low) sc.burst(ev.x, ev.y - 8, 14, CORE, 70, 0.7, 0.5);
      const s = this.sprouts.reduce((a, b) => (b.t > a.t ? b : a)); // the oldest slot
      s.t = 0; s.x = ev.x; s.y = ev.y + 4;
    } else if (ev.type === 'chestDrop') { sc.addRing(ev.x, ev.y, 4, 30, 0.5, LANTERN, 2); }
    else if (ev.type === 'chest') {
      const o = this.opening.reduce((a, b) => (b.t > a.t ? b : a)); o.t = 0; o.x = ev.x; o.y = ev.y; o.tier = ev.tier | 0;
      sc.addRing(ev.x, ev.y - 6, 6, 70 + 20 * (ev.tier | 0), 0.7, LANTERN, 3);
      sc.addRing(ev.x, ev.y - 6, 4, 40, 0.5, CORE, 2, 0.12);
      if (!low && !calm) sc.burst(ev.x, ev.y - 10, 10 + 6 * (ev.tier | 0), CORE, 60, 0.9, 0.5);
    }
  }

  // per frame, after the enemy loop. lm = the lightmap (null on Low / no lights).
  update(sim, dt, tier, calm, lm) {
    this.time += dt;
    const g = this.g; g.clear();
    // miniboss light (always fully lit)
    const m = sim.mini;
    if (m && !m.dead && lm) lm.add(m.x, m.y - 10, 62, AMBER, 0.55);
    // howl veins: cold-violet crack lines spreading from its feet over the fx life
    for (const f of sim.fx) {
      if (f.kind !== 'howl') continue;
      const k = calm ? 0.7 : 1 - Math.max(0, Math.min(1, f.ttl / 1.2)), R = f.r * (calm ? 1 : 0.35 + 0.65 * k), a = calm ? 0.45 : 0.75 * (1 - k * 0.7);
      g.lineStyle(1.6, VEIN, a);
      for (let i = 0; i < 9; i++) {
        const an = i * 0.698 + (f.x % 1), c = Math.cos(an), s = Math.sin(an) * 0.7; // squashed: lying on the ground
        g.beginPath(); g.moveTo(f.x + c * 8, f.y + 4 + s * 8); g.lineTo(f.x + c * R * 0.55 + s * 6, f.y + 4 + s * R * 0.55 - c * 4); g.lineTo(f.x + c * R, f.y + 4 + s * R); g.strokePath();
      }
      g.lineStyle(1, VEIN, a * 0.6).strokeEllipse(f.x, f.y + 4, R * 2, R * 1.4);
    }
    // sprout + flower where a miniboss fell (grows over 1.2 s, holds, fades by 6 s)
    for (const s of this.sprouts) {
      if (s.t > 6) continue;
      s.t += dt;
      const gr = Math.min(1, s.t / 1.2), a = s.t > 4.5 ? Math.max(0, 1 - (s.t - 4.5) / 1.5) : 1, h = 10 * gr;
      g.lineStyle(1.6, LIFE, a).beginPath(); g.moveTo(s.x, s.y); g.lineTo(s.x + 1, s.y - h); g.strokePath();
      g.fillStyle(LIFE, a).fillEllipse(s.x + 3, s.y - h * 0.6, 5 * gr, 2.4 * gr);
      if (gr > 0.6) { const b = (gr - 0.6) / 0.4; g.fillStyle(PETAL, a).fillCircle(s.x + 1, s.y - h - 1, 2.6 * b); g.fillStyle(CORE, a).fillCircle(s.x + 1, s.y - h - 1, 1 * b); }
    }
    // chests waiting on the ground
    let n = 0;
    for (const k of sim.pickups) {
      if (k.type !== 'chest') continue;
      const im = this.chestImg(n++);
      this.setChest(im, k.tier | 0, false);
      const br = calm ? 0 : Math.sin(this.time * 2.2 + k.id) * 0.04;
      im.setPosition(k.x, k.y + 3).setDepth(this.D.lit + k.y - 2).setAlpha(1).setVisible(true);
      if (!calm) im.setScale(im.scaleX * (1 + br * 0.25), im.scaleY);
      if (lm) lm.add(k.x, k.y - 6, 34 + 6 * (k.tier | 0), LANTERN, 0.5 + br);
      this.glows[n - 1].setPosition(k.x, k.y - 4).setScale((2.8 + 0.5 * (k.tier | 0)) * this.glowInv, 2.0 * this.glowInv).setDepth(this.D.lit + k.y - 3).setAlpha(0.75 + 0.1 * (k.tier | 0) + br).setVisible(true);
    }
    // opening beats (the open frame lifts and fades over 0.8 s)
    for (const o of this.opening) {
      if (o.t > 0.8) continue;
      o.t += dt;
      const im = this.chestImg(n++), u = Math.min(1, o.t / 0.8);
      this.setChest(im, o.tier, true);
      im.setPosition(o.x, o.y + 3 - (calm ? 0 : 3 * u)).setDepth(this.D.lit + o.y - 2).setAlpha(1 - u * u).setVisible(true);
      this.glows[n - 1].setPosition(o.x, o.y - 10).setScale(3.2 * this.glowInv, 3.6 * this.glowInv).setDepth(this.D.lit + o.y - 1).setAlpha(0.8 * (1 - u)).setVisible(true);
      if (lm) lm.add(o.x, o.y - 14, 60 * (1 - u * 0.5), CORE, 0.8 * (1 - u));
    }
    for (let i = n; i < this.chestN; i++) { this.chests[i].setVisible(false); this.glows[i].setVisible(false); }
    this.chestN = n;
  }
}
