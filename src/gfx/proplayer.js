// W4 renderer for the prop field: pooled images on the one prop atlas, depth = world y (y-sorted among themselves) which is
// below EVERY creature (creatures are at D_LIT 60000+) and below the lightmap (5000), so dusk grades them with the ground. Each prop layer
// has a Hollow image and a restored image sharing one silhouette; the restored one fades in over the Hollow (crossfade, no pop).
// Visual only. Cadence: placement ~4 Hz, pose ~20 Hz. AL-3: crowns rotate about their base pivot; petals drift off restored blossoms.
import { PropField, PetalField, REFRESH_S, PETAL_DEPTH } from './propfield.js';
import { PUSH_BODY } from './pushfield.js';
import { KINDS, ATLAS_KEY, TPU, frameName, frameOrigin, PETAL_FRAMES, kindGeo } from './propatlas.js';

export const SHADE_DEPTH = -340; // pillar canopy shadow: a ground decal above the ground/sway layer, below everything standing
const mulTint = (a, b) => {
  const r = ((a >> 16 & 255) * (b >> 16 & 255) / 255) | 0; const g = ((a >> 8 & 255) * (b >> 8 & 255) / 255) | 0; const bl = ((a & 255) * (b & 255) / 255) | 0;
  return (r << 16) | (g << 8) | bl;
};

export class PropLayer {
  constructor(scene, opts = {}) {
    this.scene = scene;
    this.field = new PropField(opts);
    this.petals = new PetalField(opts.seed || 0);
    this.pool = []; // free images
    this.all = [];
    this.petalPool = [];
    this.petalAll = [];
    this.petalLive = []; // { q, im }
    this.tint = 0xffffff;
    this.refreshT = 9;
    this.stepT = 9;
    this.field.onAdd = (s) => { s.refs = {}; this.sync(s); };
    this.field.onRemove = (s) => { this.release(s); };
  }

  make() {
    const im = this.scene.add.image(0, 0, ATLAS_KEY).setVisible(false);
    this.all.push(im);
    return im;
  }

  get count() { return this.field.count; }
  get images() { return this.all.length - this.pool.length; } // live images (a prop is 1-2 layers, each 1 image steady, 2 mid-crossfade)

  release(s) {
    if (!s.refs) return;
    for (const k of Object.keys(s.refs)) { const im = s.refs[k]; if (im) { im.setVisible(false); this.pool.push(im); } }
    s.refs = null;
  }

  // place one image of slot `s` for (layer, st); st 'h' | 'r' | 'shade'
  attach(s, layer, st) {
    const p = s.prop; const K = KINDS[p.kind]; const geo = kindGeo(p.kind);
    const im = this.pool.pop() || this.make();
    const sc = (1 / TPU) * p.size;
    let name; let ox; let oy; let x = p.x; let y = p.y; let depth = p.y;
    if (st === 'shade') { name = 'shade'; [ox, oy] = frameOrigin('shade'); depth = SHADE_DEPTH; } else {
      name = frameName(p.kind, p.variant, layer, st);
      if (layer === 'crown') { [ox, oy] = frameOrigin(name, K.pivot[0], K.pivot[1]); x = p.x + geo.pivot[0] * p.size; y = p.y + geo.pivot[1] * p.size; depth = p.y + 0.01; } else [ox, oy] = frameOrigin(name);
    }
    im.setFrame(name).setOrigin(ox, oy).setPosition(x, y).setScale(sc).setRotation(0).setDepth(depth).setFlipX(st !== 'shade' && !!p.flip)
      .setAlpha(st === 'shade' ? 0.9 : 1).setVisible(true).setTint(mulTint(this.tint, p.jit));
    return im;
  }

  // make the right images exist for the slot's current blend (steady state = 1 image per layer; 2 only while crossfading)
  sync(s) {
    const K = KINDS[s.prop.kind];
    const refs = s.refs;
    if (!refs) return;
    if (s.prop.kind === 'pillar' && !refs.shade) refs.shade = this.attach(s, 'body', 'shade');
    for (const layer of Object.keys(K.layers)) {
      const wantH = s.r < 1; const wantR = s.r > 0;
      const kh = layer + 'h'; const kr = layer + 'r';
      if (wantH && !refs[kh]) refs[kh] = this.attach(s, layer, 'h');
      else if (!wantH && refs[kh]) { refs[kh].setVisible(false); this.pool.push(refs[kh]); refs[kh] = null; }
      if (wantR && !refs[kr]) refs[kr] = this.attach(s, layer, 'r');
      else if (!wantR && refs[kr]) { refs[kr].setVisible(false); this.pool.push(refs[kr]); refs[kr] = null; }
    }
  }

  setTint(c) {
    if (c === this.tint) return;
    this.tint = c;
    for (const s of this.field.slots.values()) if (s.refs) for (const k of Object.keys(s.refs)) if (s.refs[k] && k !== 'shade') s.refs[k].setTint(mulTint(c, s.prop.jit));
  }

  pose(s) {
    const refs = s.refs; if (!refs) return;
    this.sync(s);
    const K = KINDS[s.prop.kind];
    for (const layer of Object.keys(K.layers)) {
      const h = refs[layer + 'h']; const r = refs[layer + 'r'];
      const ca = layer === 'crown' ? s.crownA : 1;
      if (h) h.setAlpha(ca);
      if (r) r.setAlpha(s.r * ca);
      if (layer === 'crown') { if (h) h.setRotation(s.ang); if (r) r.setRotation(s.ang); } else if (s.pst && PUSH_BODY[s.prop.kind]) { if (h) h.setRotation(s.pst.pa); if (r) r.setRotation(s.pst.pa); } // AL-4: bush/fern/bramble bodies lean about their base
    }
  }

  reset(seed, clear) { this.field.reset(seed, clear); this.petals.reset(seed); this.clearPetals(); this.refreshT = 9; this.stepT = 9; }
  clear() { this.field.clear_(); this.petals.reset(); this.clearPetals(); }
  clearPetals() { for (const k of this.petalLive) { k.im.setVisible(false); this.petalPool.push(k.im); } this.petalLive.length = 0; }

  // caps = CAPS.<tier> (props + ambient.petals); st = { phone, reduced, creatures, nCreat }
  update(dt, t, view, life, caps, st) {
    const pc = caps.props;
    const dens = (pc.density || 1);
    if (pc.live !== this.field.cap || dens !== this._dens || !!st.phone !== this._phone || !!pc.sway !== this.field.sway) { this._dens = dens; this._phone = !!st.phone; this.field.setBudget(pc.live, dens, !!st.phone, !!pc.sway); }
    this.petals.setBudget(st.reduced ? 0 : (caps.ambient.petals || 0), !!st.phone);
    if (this.field.cap === 0) { if (this.petalLive.length) this.clearPetals(); return; }
    this.refreshT += dt; this.stepT += dt;
    const v = { x0: view.x, y0: view.y, x1: view.right, y1: view.bottom };
    if (this.refreshT >= REFRESH_S) { this.refreshT = 0; this.field.refresh(v, life); }
    if (this.stepT >= 0.05) {
      const d = this.stepT; this.stepT = 0;
      this.field.step(d, t, life, st.reduced, st.creatures, st.nCreat | 0, st.hero, st.push || null);
      for (const s of this.field.slots.values()) this.pose(s);
      this.petals.step(d, t, this.field.slots.values(), v, st.reduced);
      this.drawPetals();
    }
  }

  drawPetals() {
    const live = this.petals.petals;
    while (this.petalLive.length > live.length) { const k = this.petalLive.pop(); k.im.setVisible(false); this.petalPool.push(k.im); }
    while (this.petalLive.length < live.length) {
      const im = this.petalPool.pop() || this.scene.add.image(0, 0, ATLAS_KEY, PETAL_FRAMES[0]).setDepth(PETAL_DEPTH);
      this.petalLive.push({ im });
    }
    for (let i = 0; i < live.length; i++) {
      const q = live[i]; const im = this.petalLive[i].im;
      im.setFrame(PETAL_FRAMES[q.kind]).setPosition(q.x, q.y).setRotation(q.rot).setScale(1 / TPU * 1.1).setAlpha(this.petals.alphaOf(q)).setVisible(true).setTint(this.tint);
    }
  }
}
