// W5 renderer for the air: pooled images for the fog banks, fireflies/motes and the world-edge fade. Visual only (docs in airfield.js).
//   Fog: normal-blend soft sprites BELOW the lightmap (depth 4990, so dusk grades them with the ground) and below every creature, pickup and number.
//   Fireflies / motes: tiny additive glows under every creature (below D_HALO), cream or cold pale by the life under them.
//   Edge: up to 4 dark gradient strips along the map boundary (ground-level decals, below the lightmap).
// Cadence: fields update every frame (cheap typed-array maths, zero allocation); images only get setters when something changed.
import { FogField, AirField, EdgeField, TINTS, FLY_SIZE, MOTE_SIZE, airCount, FLY_MAX, MOTE_MAX, FOG_MAX, EDGE_A } from './airfield.js';
import { wind, windScale } from './wind.js';
import { buildGlowTable, VIB_LEVELS } from './vibrancy.js';

const GLOW_N = TINTS.length;
const GLOW_TAB = buildGlowTable(TINTS); // WL6c: [level][tint index] saturated firefly/mote colours

export const FOG_DEPTH = 4990; // above props (depth = world y <= 4000), below the lightmap (5000)
export const EDGE_DEPTH = 4995;
export const AIR_DEPTH = 54996; // D_HALO - 4: above the lightmap, below every creature (60000+)
export const FOG_TINT_COLD = 0x9fb0c8;
export const EDGE_TINT = 0x070a14;

// Soft one-sided gradient textures for the edge fade (white ramp tinted at use): H = fades left to right, V = fades top to bottom.
export function makeEdgeTextures(scene, mkCanvas) {
  for (const [key, horiz] of [['edgeH', true], ['edgeV', false]]) {
    if (scene.textures.exists(key)) scene.textures.remove(key);
    const cv = mkCanvas(horiz ? 64 : 4, horiz ? 4 : 64);
    const c = cv.getContext('2d');
    const g = horiz ? c.createLinearGradient(0, 0, 64, 0) : c.createLinearGradient(0, 0, 0, 64);
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.35, 'rgba(255,255,255,0.55)'); g.addColorStop(0.7, 'rgba(255,255,255,0.16)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    c.fillStyle = g; c.fillRect(0, 0, cv.width, cv.height);
    scene.textures.addCanvas(key, cv);
  }
}

export class AirLayer {
  constructor(scene, opts = {}) {
    this.scene = scene;
    this.world = opts.world || 4000;
    this.glowKey = opts.glowKey || 'glow';
    this.blendAdd = opts.blendAdd;
    this.fog = new FogField(opts.seed || 1);
    this.air = new AirField(opts.seed || 1);
    this.edge = new EdgeField();
    this.fogIm = [];
    this.flyIm = [];
    this.edgeIm = [];
    this.tintOf = new Int16Array(FLY_MAX + MOTE_MAX).fill(-1);
    this.vibL = -1; // WL6c vibrancy level (-1 = off)
    this.wx = 0; this.wy = 0; this.wT = 9;
    this.nFog = 0; this.nAir = 0; this.nEdge = 0;
  }

  get count() { return this.nFog + this.nAir + this.nEdge; }

  makeFog() {
    const im = this.scene.add.image(0, 0, this.glowKey).setDepth(FOG_DEPTH).setTint(FOG_TINT_COLD).setAlpha(0).setVisible(false);
    this.fogIm.push(im);
    return im;
  }

  makeAir(i) {
    const fly = i < FLY_MAX;
    const im = this.scene.add.image(0, 0, this.glowKey).setDepth(AIR_DEPTH + (fly ? 0.1 : 0)).setAlpha(0).setVisible(false);
    im.setDisplaySize(fly ? FLY_SIZE : MOTE_SIZE, fly ? FLY_SIZE : MOTE_SIZE);
    if (this.blendAdd !== undefined) im.setBlendMode(this.blendAdd);
    this.flyIm[i] = im;
    return im;
  }

  makeEdge(k) {
    const im = this.scene.add.image(0, 0, 'edgeH').setDepth(EDGE_DEPTH).setTint(EDGE_TINT).setAlpha(EDGE_A).setOrigin(0, 0).setVisible(false);
    this.edgeIm[k] = im;
    return im;
  }

  setVib(level) { this.vibL = level < 0 ? -1 : level >= VIB_LEVELS ? VIB_LEVELS - 1 : level; }

  reset(seed) { this.fog.reset(seed); this.air.reset(seed); this.tintOf.fill(-1); this.hideAll(); }

  hideAll() {
    for (const im of this.fogIm) im.setVisible(false);
    for (const im of this.flyIm) if (im) im.setVisible(false);
    for (const im of this.edgeIm) if (im) im.setVisible(false);
    this.nFog = 0; this.nAir = 0; this.nEdge = 0;
  }

  // st = { caps (CAPS.<tier>), phone, reduced, fog, motes, edge (debug flags) }; view = { x0, y0, x1, y1 }
  update(dt, t, view, life, st) {
    const caps = st.caps;
    const reduced = !!st.reduced;
    // shared wind, sampled at the view centre 10x/s (keeps the hot path free of allocation)
    this.wT += dt;
    if (this.wT >= 0.1) {
      this.wT = 0;
      const w = wind((view.x0 + view.x1) / 2, (view.y0 + view.y1) / 2, t, windScale(reduced), 0);
      this.wx = w.x; this.wy = w.y;
    }
    // ---- fog
    const nf = st.fog ? airCount(caps.atmos.fog, { phone: st.phone, max: FOG_MAX }) : 0;
    this.fog.setBudget(nf);
    const mod = st.mod || null; // AL-6 dawn multipliers (rise / fade / slow / thin), optional
    this.fog.update(dt, t, view, life, this.wx, this.wy, reduced, this.world, mod ? mod.thin : 0);
    for (let i = 0; i < nf; i++) {
      const im = this.fogIm[i] || this.makeFog();
      const a = this.fog.a[i];
      if (a < 0.002) { im.setVisible(false); continue; }
      im.setPosition(this.fog.x[i], this.fog.y[i]).setDisplaySize(this.fog.w[i], this.fog.h[i]).setAlpha(a).setVisible(true);
    }
    for (let i = nf; i < this.fogIm.length; i++) this.fogIm[i].setVisible(false);
    this.nFog = nf;
    // ---- fireflies + motes (reduced motion: no fireflies, half the motes, static)
    let nFly = st.motes ? airCount(caps.ambient.fireflies, { phone: st.phone, max: FLY_MAX }) : 0;
    let nMote = st.motes ? airCount(caps.ambient.motes, { phone: st.phone, max: MOTE_MAX }) : 0;
    if (reduced) { nFly = 0; nMote >>= 1; }
    this.air.setBudget(nFly, nMote);
    this.air.update(dt, t, view, life, this.wx, this.wy, reduced, mod);
    const cnt = nFly + nMote;
    for (let j = 0; j < cnt; j++) {
      const i = this.air.indexOf(j);
      const im = this.flyIm[i] || this.makeAir(i);
      const a = this.air.a[i];
      if (a < 0.01) { im.setVisible(false); continue; }
      const ti = this.air.tint[i];
      const tk = ti + GLOW_N * (this.vibL + 1); // WL6c: the key includes the vibrancy level (vibL -1 = off)
      if (tk !== this.tintOf[i]) { this.tintOf[i] = tk; im.setTint(this.vibL >= 0 ? GLOW_TAB[this.vibL * GLOW_N + ti] : TINTS[ti]); }
      im.setPosition(this.air.x[i], this.air.y[i]).setAlpha(a).setVisible(true);
    }
    for (let i = 0; i < this.flyIm.length; i++) {
      const im = this.flyIm[i];
      if (!im) continue;
      const on = i < FLY_MAX ? i < nFly : i - FLY_MAX < nMote;
      if (!on) im.setVisible(false);
    }
    this.nAir = cnt;
    // ---- edge wall fade
    if (st.edge && caps.atmos.edge > 0) this.edge.update(view, this.world); else this.edge.n = 0;
    const ne = Math.min(this.edge.n, caps.atmos.edge);
    for (let k = 0; k < ne; k++) {
      const im = this.edgeIm[k] || this.makeEdge(k);
      const s = this.edge.side[k];
      im.setTexture(s < 2 ? 'edgeH' : 'edgeV').setPosition(this.edge.x[k], this.edge.y[k]).setDisplaySize(this.edge.w[k], this.edge.h[k]).setFlip(s === 1, s === 3).setVisible(true);
    }
    for (let k = ne; k < this.edgeIm.length; k++) if (this.edgeIm[k]) this.edgeIm[k].setVisible(false);
    this.nEdge = ne;
  }
}
