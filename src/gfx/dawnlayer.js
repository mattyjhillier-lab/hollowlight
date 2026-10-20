// AL-6 renderer for the dawn chorus: <= 12 bird images (the critter atlas), <= 10 petal images and <= 3 light shafts (the shared soft glow), all pooled and created on first use.
// ALL below every creature (60000+), pickup and number: birds + petals sit just under the lightmap (graded with the world), shafts are faint additive glows just above it.
// They can never cover an enemy, gem, heart, magnet or number. Visual only (see dawn.js).
import { DawnField, BIRD_MAX, PETAL_MAX, SHAFT_MAX } from './dawn.js';
import { FRAME_NAMES, ATLAS_KEY, ORIGIN_Y } from './critteratlas.js';
import { INV } from './style.js';
import { petalMul } from './crowdread.js';

export const BIRD_DEPTH = 4997;
export const PETAL_DEPTH = 4998;
export const SHAFT_DEPTH = 5001;
export const PETAL_TINTS = [0xffe3c8, 0xfff1d6, 0xffd9b8]; // peach-cream blossoms: never heart rose, gem mint, magnet violet
export const SHAFT_TINT = 0xffe6b8;
const F0 = 2; // first frame index only (a real frame is set before the first draw)
const BIRD_SCALE = 1.25; // same as the AL-5 sparrow

export class DawnLayer {
  constructor(scene, opts = {}) {
    this.scene = scene;
    this.field = new DawnField(opts.seed || 1);
    this.glowKey = opts.glowKey || 'glow';
    this.blendAdd = opts.blendAdd;
    this.bird = [];
    this.petal = [];
    this.shaft = [];
    this.tint = 0xffffff;
    this.tintDirty = true;
    this.shown = 0;
  }

  get count() { return this.shown; }

  reset(seed) { this.field.reset(seed); this.hideAll(); }

  hideAll() {
    for (const im of this.bird) im.setVisible(false);
    for (const im of this.petal) im.setVisible(false);
    for (const im of this.shaft) im.setVisible(false);
    this.shown = 0;
  }

  setTint(c) { if (c !== this.tint) { this.tint = c; this.tintDirty = true; } }

  makeBird(i) {
    const im = this.scene.add.image(0, 0, ATLAS_KEY, FRAME_NAMES[F0]).setOrigin(0.5, ORIGIN_Y).setDepth(BIRD_DEPTH + i * 0.01).setVisible(false);
    im.fn = -1;
    this.bird[i] = im;
    return im;
  }

  makePetal(i) {
    const im = this.scene.add.image(0, 0, this.glowKey).setDepth(PETAL_DEPTH).setTint(PETAL_TINTS[i % PETAL_TINTS.length]).setVisible(false);
    this.petal[i] = im;
    return im;
  }

  makeShaft(i) {
    const im = this.scene.add.image(0, 0, this.glowKey).setDepth(SHAFT_DEPTH).setTint(SHAFT_TINT).setVisible(false);
    if (this.blendAdd !== undefined) im.setBlendMode(this.blendAdd);
    this.shaft[i] = im;
    return im;
  }

  // st: { calm, phone, victory, hx, hy, bright }; bud: { birds, petals, shafts } already tier- and phone-scaled; s: run seconds on the 900 s reference clock
  update(dt, s, view, st, bud) {
    const f = this.field;
    f.setBudget(bud.birds, bud.petals, bud.shafts);
    f.update(dt, s, view, st);
    let shown = 0;
    const k = (INV[ATLAS_KEY] || 0.25) * BIRD_SCALE;
    const pm = petalMul(st.dim); // DR3: petals fade while the crowd is thick
    for (let i = 0; i < BIRD_MAX; i++) {
      const a = f.ba[i];
      if (!f.st[i] || a < 0.01) { if (this.bird[i]) this.bird[i].setVisible(false); continue; }
      const im = this.bird[i] || this.makeBird(i);
      if (im.fn !== f.bf[i]) { im.fn = f.bf[i]; im.setFrame(FRAME_NAMES[f.bf[i]]); }
      if (this.tintDirty || im.tt !== this.tint) { im.tt = this.tint; im.setTint(this.tint); }
      im.setPosition(f.bx[i], f.by[i]).setScale(k * f.bs[i]).setFlipX(f.face[i] < 0).setAlpha(a).setVisible(true);
      shown++;
    }
    for (let i = 0; i < PETAL_MAX; i++) {
      const a = f.pa[i];
      if (a < 0.01) { if (this.petal[i]) this.petal[i].setVisible(false); continue; }
      const im = this.petal[i] || this.makePetal(i);
      im.setPosition(f.px[i], f.py[i]).setRotation(f.pr[i]).setDisplaySize(6.4, 3.6 * f.pk[i]).setAlpha(a * pm).setVisible(true);
      shown++;
    }
    for (let i = 0; i < SHAFT_MAX; i++) {
      const a = f.sa[i];
      if (a < 0.002) { if (this.shaft[i]) this.shaft[i].setVisible(false); continue; }
      const im = this.shaft[i] || this.makeShaft(i);
      im.setPosition(f.sx[i], f.sy[i]).setRotation(f.sr).setDisplaySize(f.sw, f.sh).setAlpha(a).setVisible(true);
      shown++;
    }
    this.tintDirty = false;
    this.shown = shown;
  }
}
