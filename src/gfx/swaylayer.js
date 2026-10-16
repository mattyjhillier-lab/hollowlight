// AL-1 renderer for the sway field: a pool of images on the one ambient atlas, depth below every creature (and below the
// lightmap, so dusk lights/darkens them with the ground). Visual only. Cadence: placement/recycle ~5 Hz, pose ~20 Hz.
import { SwayField, PHONE_DENSITY } from './swayfield.js';
import { FRAME_NAMES, ATLAS_KEY, ORIGIN_Y } from './ambatlas.js';
import { INV } from './style.js';

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
    this.field.onAdd = (s) => {
      const im = this.pool.pop() || this.make();
      const p = s.prop;
      const sc = (INV[ATLAS_KEY] || 0.25) * p.size;
      im.setFrame(FRAME_NAMES[p.frame]).setPosition(p.x, p.y).setScale(sc).setRotation(0).setAlpha(0).setFlipX(p.phase > 3.14).setVisible(true).setTint(this.tint);
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

  get count() { return this.field.count; }

  reset(seed) { this.field.reset(seed); this.refreshT = 9; this.stepT = 9; }
  clear() { this.field.clear(); }

  // Sets the ground-grade tint used when the lightmap is not doing the dusk grading (fallback look only).
  setTint(c) {
    if (c === this.tint) return;
    this.tint = c;
    for (const im of this.all) im.setTint(c);
  }

  // on: sway wanted this frame (Med/High, ground shader showing the restored tile). cap from CAPS.<tier>.ambient.sway.
  update(dt, t, view, hero, lifeMap, { on, cap, phone, reduced }) {
    const budget = on ? cap : 0;
    if (budget !== this.field.cap || (phone ? PHONE_DENSITY : 1) !== this.field.density) this.field.setBudget(budget, phone ? PHONE_DENSITY : 1);
    if (budget === 0) return;
    this.refreshT += dt;
    this.stepT += dt;
    const d = view;
    const v = { x0: d.x, y0: d.y, x1: d.right, y1: d.bottom };
    if (this.refreshT >= 0.2) { this.refreshT = 0; this.field.refresh(v, hero, lifeMap); }
    if (this.stepT >= 0.05) {
      this.field.step(this.stepT, t, hero, lifeMap, reduced);
      this.stepT = 0;
      for (const s of this.field.slots.values()) if (s.ref) s.ref.setRotation(s.ang).setAlpha(s.alpha).setVisible(s.alpha > 0.004);
    }
  }
}
