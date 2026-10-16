// AL-1 renderer for the sway field: a pool of images on the one ambient atlas, depth below every creature (and below the
// lightmap, so dusk lights/darkens them with the ground). Visual only. Cadence: placement/recycle ~5 Hz, pose ~20 Hz.
import { SwayField, PHONE_DENSITY } from './swayfield.js';
import { FRAME_NAMES, ATLAS_KEY, ORIGIN_Y } from './ambatlas.js';
import { INV } from './style.js';
import { hash, wind } from './wind.js';

export const SPARK_LIFE = 0.7; // AL-2 petal sparkle: seconds
export const SPARK_PER_POP = 2;
export const SPARK_ALPHA = 0.55; // peak (design R2: <= 0.6, cream only)
export const SPARK_COLOR = 0xfff0cc; // cream (never mint / rose / violet / gold)
export const SPARK_SCALE = 0.16; // x glow inverse scale (about 5 world units across the soft core)
export const SWAY_DEPTH = -350; // above ground (-1000), patches (-500), Low pools (-450), wheel/ground fx (-400); below trees (y) and all creatures

export class SwayLayer {
  constructor(scene, opts = {}) {
    this.scene = scene;
    this.field = new SwayField(opts);
    this.pool = []; // free images
    this.all = []; // every image ever made (<= cap)
    this.refreshT = 9;
    this.stepT = 9;
    this.tint = 0xffffff;
    this.enabled = true;
    this.glow = opts.glow || null; // { key, inv, blend }: sparkle texture (AL-2); null = no sparkles
    this.sparkPool = []; // free sparkle images
    this.sparks = []; // live: { im, x, y, t, dx, dy }
    this.sparkAll = 0;
    this.sparkCap = 0;
    this.pending = [];
    this.field.onPop = (s) => { if (this.sparkCap > 0 && this.pending.length < 8) this.pending.push(s.prop); };
    this.field.onAdd = (s) => {
      const im = this.pool.pop() || this.make();
      const p = s.prop;
      const sc = (INV[ATLAS_KEY] || 0.25) * p.size;
      s.base = sc;
      im.setFrame(FRAME_NAMES[p.frame]).setPosition(p.x, p.y).setScale(sc * s.sc).setRotation(s.rot).setAlpha(0).setFlipX(p.phase > 3.14).setVisible(true).setTint(this.tint);
      s.ref = im;
    };
    this.field.onRemove = (s) => {
      const im = s.ref;
      if (im) { im.setVisible(false); this.pool.push(im); s.ref = null; }
    };
  }

  make() {
    const im = this.scene.add.image(0, 0, ATLAS_KEY, FRAME_NAMES[0]).setOrigin(0.5, ORIGIN_Y).setDepth(SWAY_DEPTH).setVisible(false);
    this.all.push(im);
    return im;
  }

  get count() { return this.field.count + this.sparks.length; }

  makeSpark() {
    const g = this.glow;
    const im = this.scene.add.image(0, 0, g.key).setDepth(SWAY_DEPTH + 1).setTint(SPARK_COLOR).setVisible(false);
    if (g.blend !== undefined) im.setBlendMode(g.blend);
    this.sparkAll++;
    return im;
  }

  clearSparks() {
    for (const k of this.sparks) { k.im.setVisible(false); this.sparkPool.push(k.im); }
    this.sparks.length = 0;
    this.pending.length = 0;
  }

  // petal sparkle: tiny cream glow rising off a freshly opened flower; pooled, never above the tier's ambient.bloom cap
  tickSparks(dt, t, reduced) {
    for (let i = this.sparks.length - 1; i >= 0; i--) {
      const k = this.sparks[i];
      k.t += dt;
      const u = k.t / SPARK_LIFE;
      if (u >= 1) { k.im.setVisible(false); this.sparkPool.push(k.im); this.sparks.splice(i, 1); continue; }
      const w = wind(k.x, k.y, t, 1, 0).x;
      const e = 1 - (1 - u) * (1 - u);
      k.im.setPosition(k.x + k.dx * e + w * 4 * u, k.y - 2 - 9 * e).setAlpha(SPARK_ALPHA * Math.sin(u * Math.PI)).setScale(SPARK_SCALE * this.glow.inv * (1 - 0.4 * u));
    }
    const room = this.sparkCap - this.sparks.length;
    let n = 0;
    while (this.pending.length && n < room) {
      const p = this.pending.shift();
      for (let j = 0; j < SPARK_PER_POP && n < room; j++, n++) {
        const im = this.sparkPool.pop() || this.makeSpark();
        const a = hash(p.id * 13 + j * 7 + 3);
        const k = { im, x: p.x + (a - 0.5) * 8 * p.size, y: p.y - 9 * p.size - hash(p.id * 17 + j) * 3, t: 0, dx: (j ? 1 : -1) * (2 + 4 * hash(p.id * 29 + j)) };
        im.setPosition(k.x, k.y).setAlpha(0).setVisible(true);
        this.sparks.push(k);
      }
    }
    this.pending.length = 0; // pops that found no room are simply skipped (decor)
  }

  reset(seed) { this.field.reset(seed); this.clearSparks(); this.refreshT = 9; this.stepT = 9; }
  clear() { this.field.clear(); this.clearSparks(); }

  // Sets the ground-grade tint used when the lightmap is not doing the dusk grading (fallback look only).
  setTint(c) {
    if (c === this.tint) return;
    this.tint = c;
    for (const im of this.all) im.setTint(c);
  }

  // on: sway wanted this frame (Med/High, ground shader showing the restored tile). cap from CAPS.<tier>.ambient.sway.
  update(dt, t, view, hero, lifeMap, { on, cap, phone, reduced, bloom = 0 }) {
    const budget = on ? cap : 0;
    this.sparkCap = on && this.glow && !reduced ? Math.floor(bloom * (phone ? PHONE_DENSITY : 1)) : 0;
    if (this.sparkCap === 0 && (this.sparks.length || this.pending.length)) this.clearSparks();
    if (budget !== this.field.cap || (phone ? PHONE_DENSITY : 1) !== this.field.density) this.field.setBudget(budget, phone ? PHONE_DENSITY : 1);
    if (budget === 0) return;
    if (this.sparkCap > 0 || this.sparks.length) this.tickSparks(dt > 0 ? Math.min(dt, 0.1) : 0, t, reduced);
    this.refreshT += dt;
    this.stepT += dt;
    const d = view;
    const v = { x0: d.x, y0: d.y, x1: d.right, y1: d.bottom };
    if (this.refreshT >= 0.2) { this.refreshT = 0; this.field.refresh(v, hero, lifeMap); }
    if (this.stepT >= 0.05) {
      this.field.step(this.stepT, t, hero, lifeMap, reduced);
      this.stepT = 0;
      for (const s of this.field.slots.values()) if (s.ref) s.ref.setRotation(s.ang + s.rot).setScale(s.base * s.sc).setAlpha(s.alpha).setVisible(s.alpha > 0.004);
    }
  }
}
