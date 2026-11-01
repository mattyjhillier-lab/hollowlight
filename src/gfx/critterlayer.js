// AL-5 renderer for the critters: <= 5 pooled images on the one critter atlas. Ground critters (sparrow perched, hare) sit at decal depth under the
// lightmap; airborne ones (flying sparrow, moth) just below the lightmap, so dusk grades them like everything else. ALWAYS below every creature (60000+)
// and every pickup: they can never cover an enemy, gem, heart, magnet or number. Visual only.
import { CritterField, SPARROW, MOTH, frameOf, hopLift, critterCap } from './critters.js';
import { FRAME_NAMES, ATLAS_KEY, ORIGIN_Y } from './critteratlas.js';
import { INV } from './style.js';
import { mulTint } from './vibrancy.js';

export const GROUND_DEPTH = -330; // above the sway tufts (-350), below props / fog / lightmap
export const AIR_DEPTH = 4996;
const frameIdx = (n) => FRAME_NAMES.indexOf(n) + 1;
export const SCALE = [1.25, 1.25, 1.1]; // per-kind display scale (atlas texel scale x this)

export class CritterLayer {
  constructor(scene, opts = {}) {
    this.scene = scene;
    this.field = new CritterField(opts.seed || 1, opts.world || 4000);
    this.im = [];
    this.shadow = [];
    this.tint = 0xffffff;
    this.vibT = null; // WL6c: per-frame vibrancy tints or null = off (critters only exist over restored ground)
    this.vibL = -1;
    this.glowKey = opts.glowKey || 'glow';
  }

  get count() { return this.field.live; }

  make(i) {
    const im = this.scene.add.image(0, 0, ATLAS_KEY, FRAME_NAMES[0]).setOrigin(0.5, ORIGIN_Y).setDepth(GROUND_DEPTH).setVisible(false);
    this.im[i] = im;
    im.vk = -2;
    // a faint soft contact shadow so a flying sparrow / moth reads as airborne (dark ink, normal blend, no glow)
    this.shadow[i] = this.scene.add.image(0, 0, this.glowKey).setTint(0x0a0d18).setAlpha(0).setDepth(GROUND_DEPTH - 0.5).setVisible(false);
    return im;
  }

  reset(seed) { this.field.reset(seed); this.hideAll(); }

  hideAll() {
    for (const im of this.im) if (im) im.setVisible(false);
    for (const sh of this.shadow) if (sh) sh.setVisible(false);
  }

  setVib(level) { this.vibL = level; }

  // Fallback look only (no lightmap): the ground-grade tint, like the sway layer.
  setTint(c) {
    if (c === this.tint) return;
    this.tint = c;
    for (const im of this.im) if (im) im.vk = -2; // re-tinted on its next draw
  }

  // on: critters wanted this frame (restored ground visible, flag on); cap from CAPS.<tier>.ambient.critters
  update(dt, t, view, hero, life, enemies, nEn, { on, cap, phone, reduced }) {
    const f = this.field;
    f.setBudget(on ? critterCap(cap, { phone, reduced }) : 0, reduced);
    f.update(dt, t, view, hero, life, enemies, nEn, reduced);
    const k = INV[ATLAS_KEY] || 0.25;
    for (let i = 0; i < f.slots.length; i++) {
      const s = f.slots[i];
      const im = this.im[i] || (s.on ? this.make(i) : null);
      if (!im) continue;
      if (!s.on || s.a < 0.01) { im.setVisible(false); this.shadow[i].setVisible(false); continue; }
      const air = s.kind === MOTH || (s.kind === SPARROW && s.z > 2);
      const lift = s.z + hopLift(s, t);
      const sc = k * SCALE[s.kind];
      im.setFrame(FRAME_NAMES[frameOf(s, t, reduced)]).setPosition(s.x, s.y - lift).setScale(sc).setFlipX(s.face < 0).setAlpha(s.a).setDepth(air ? AIR_DEPTH : GROUND_DEPTH).setVisible(true);
      const vk = this.vibL * 64 + frameIdx(im.frame.name);
      if (im.vk !== vk || im.vt !== this.tint) { im.vk = vk; im.vt = this.tint; im.setTint(this.vibT && this.vibL >= 0 ? mulTint(this.tint, this.vibT.get(im.frame.name, this.vibL)) : this.tint); }
      const sh = this.shadow[i];
      if (lift > 1.5) sh.setPosition(s.x, s.y + 1).setDisplaySize(7 * SCALE[s.kind], 2.6).setAlpha(0.16 * s.a * (1 - Math.min(1, lift / 40))).setVisible(true); else sh.setVisible(false);
    }
  }
}
