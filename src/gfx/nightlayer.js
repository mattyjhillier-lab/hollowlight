// WL6b: the enemy night look layer (Phaser side). Pooled additive eye images (ember halo + cream core) drawn ABOVE the vignette, pooled cool rim
// images (baked outline textures, Med/High), and the per-enemy lit levels used for the body tint. No per-frame allocation: all buffers are
// preallocated, images are created lazily and reused (docs/design/visibility-arc-v1.md sections 3, 4, 7). Visual only.
import Phaser from 'phaser';
import {
  EYE_DEFS, BOSS_EYES, BOSS_CORE, BOSS_HALO, EYE_CORE_TINT, RIM_TINT, LIT_STEPS,
  eyeCap, rimCap, spiritCap, litLevel, bandOf, fillTintTable, blinkMul, eyeAlpha, rimAlpha, planEyes, slotsOf,
} from './nightlook.js';
import { ROLE } from './palette.js';

const ADD = Phaser.BlendModes.ADD;
const MAXE = 512;
const SPIRIT_R2 = 40 * 40;

export class NightLayer {
  constructor(scene, depth) {
    this.scene = scene;
    this.depth = depth;
    this.core = [];
    this.bHalo = [];
    this.bCore = [];
    this.rims = {}; // texture key -> { arr, n }
    this.prevEyes = 0;
    this.prevBoss = 0;
    this.prevRims = 0;
    this.lit = new Uint8Array(MAXE);
    this.near = new Uint8Array(MAXE);
    this.kinds = new Uint8Array(MAXE);
    this.plan = new Int16Array(MAXE);
    this.tab = new Int32Array(LIT_STEPS + 1);
    this.ver = 0; // bumps when the tint table changes (enemies re-apply their tint)
    this.tabKey = -1;
    this.lights = new Float32Array(32);
    this.nLights = 0;
    this.n = 0;
    this.on = false;
    // last-frame readouts for tests / the debug overlay
    this.eyeSlots = 0; // eye images in use
    this.rimCount = 0;
    this.eyeEnemies = 0; // enemies with eyes (the capped number)
  }

  eyeImg(arr, i, tint, depth, key) {
    let im = arr[i];
    if (!im) {
      im = this.scene.add.image(0, 0, key || 'glow').setBlendMode(ADD).setTint(tint).setDepth(depth);
      im.dw = 0;
      arr[i] = im;
    }
    return im;
  }

  place(im, x, y, size, a) {
    if (im.dw !== size) { im.dw = size; im.setDisplaySize(size, size); }
    im.x = x; im.y = y; im.alpha = a; // plain property writes (cheaper than the chained setters on a few hundred images per frame)
    if (!im.visible) im.visible = true;
  }

  // Before the enemy loop: tint table, nearby spirit lights, lit level per enemy (index = position in sim.enemies).
  prepare(sim, lx, ly, R, tier, arc) {
    const key = Math.round(arc.farV * 1000) * 1000 + Math.round(arc.bodyK * 1000);
    if (key !== this.tabKey) { this.tabKey = key; fillTintTable(arc.farV, arc.bodyK, this.tab); this.ver++; }
    // spirit lights (wolves, ravens, orbs): the first few visible ones also light the enemies beside them
    let nl = 0;
    const cap = Math.min(spiritCap(tier), 16);
    if (cap > 0) {
      const us = sim.units;
      for (let i = 0; i < us.length && nl < cap; i++) {
        const u = us[i];
        if (u.hidden) continue;
        this.lights[nl * 2] = u.x;
        this.lights[nl * 2 + 1] = u.y;
        nl++;
      }
    }
    this.nLights = nl;
    const es = sim.enemies;
    const n = Math.min(es.length, MAXE);
    this.n = n;
    for (let i = 0; i < n; i++) {
      const e = es[i];
      const dx = e.x - lx;
      const dy = e.y - ly;
      const d2 = dx * dx + dy * dy;
      this.near[i] = bandOf(d2, R);
      let ns = false;
      for (let k = 0; k < nl; k++) {
        const sx = e.x - this.lights[k * 2];
        const sy = e.y - this.lights[k * 2 + 1];
        if (sx * sx + sy * sy < SPIRIT_R2) { ns = true; break; }
      }
      this.lit[i] = e.boss ? LIT_STEPS : litLevel(Math.sqrt(d2), R, ns);
    }
  }

  // After the enemy loop: eyes (near band first, capped), cool rims (Med/High), boss eyes. c = { tier, calm, time, arc, vx0, vy0, vx1, vy1, depthBase (rims sit just under the lit sprites) }.
  draw(sim, c) {
    const es = sim.enemies;
    const n = this.n;
    const tier = c.tier;
    const arc = c.arc;
    // 1) which enemies get eyes
    for (let i = 0; i < n; i++) {
      const e = es[i];
      this.kinds[i] = (e.boss || e.x < c.vx0 || e.x > c.vx1 || e.y < c.vy0 || e.y > c.vy1) ? 0 : slotsOf(e.type);
    }
    const cnt = planEyes(n, this.near, this.kinds, eyeCap(tier), this.plan);
    let slot = 0;
    for (let k = 0; k < cnt; k++) {
      const i = this.plan[k];
      const e = es[i];
      const d = EYE_DEFS[e.type];
      const fl = e.faceX < 0 ? -1 : 1;
      const a = eyeAlpha(arc.eyeA, this.lit[i], d.floorK) * blinkMul(c.time, e.id, c.calm);
      for (let j = 0; j < d.pts.length; j++) {
        const x = e.x + d.pts[j][0] * fl;
        const y = e.y + d.pts[j][1];
        this.place(this.eyeImg(this.core, slot, 0xffffff, this.depth, 'eyen'), x, y, d.halo, a);
        slot++;
      }
    }
    for (let i = slot; i < this.prevEyes; i++) if (this.core[i]) this.core[i].setVisible(false);
    this.prevEyes = slot;
    this.eyeSlots = slot;
    this.eyeEnemies = cnt;

    // 2) cool rims on enemies outside the pool (Med/High), nearest band first, capped
    let nr = 0;
    const rc = rimCap(tier);
    for (const key in this.rims) this.rims[key].n = 0;
    if (rc > 0 && arc.rimA > 0.01) {
      for (let pass = 0; pass < 3 && nr < rc; pass++) {
        for (let i = 0; i < n && nr < rc; i++) {
          if (this.near[i] !== pass) continue;
          const e = es[i];
          const d = EYE_DEFS[e.type];
          if (!d || e.boss || this.lit[i] >= LIT_STEPS) continue;
          if (e.x < c.vx0 || e.x > c.vx1 || e.y < c.vy0 || e.y > c.vy1) continue;
          const a = rimAlpha(arc.rimA, this.lit[i], d.rimK);
          if (a < 0.02) continue;
          let pool = this.rims[d.rim];
          if (!pool) pool = this.rims[d.rim] = { arr: [], n: 0 };
          let im = pool.arr[pool.n];
          if (!im) {
            im = this.scene.add.image(0, 0, d.rim).setBlendMode(ADD).setTint(RIM_TINT).setDepth(c.depthBase - 1);
            im.setScale(this.scene.pools[e.type].inv);
            pool.arr[pool.n] = im;
          }
          pool.n++;
          im.x = e.x; im.y = e.y; im.flipX = e.faceX < 0; im.alpha = a;
          if (!im.visible) im.visible = true;
          nr++;
        }
      }
    }
    for (const key in this.rims) { const p = this.rims[key]; for (let i = p.n; i < p.arr.length; i++) if (p.arr[i].visible) p.arr[i].setVisible(false); }
    this.rimCount = nr;

    // 3) boss: always fully lit (see the tint path), larger ember eyes drawn above the vignette, outside the caps
    let nb = 0;
    for (let i = 0; i < n; i++) {
      const e = es[i];
      if (!e.boss) continue;
      for (let j = 0; j < BOSS_EYES.length; j++) {
        const x = e.x + BOSS_EYES[j][0];
        const y = e.y + BOSS_EYES[j][1];
        this.place(this.eyeImg(this.bHalo, nb, ROLE.bossEye, this.depth), x, y, BOSS_HALO, 0.55);
        this.place(this.eyeImg(this.bCore, nb, EYE_CORE_TINT, this.depth + 0.5, 'eyedot'), x, y, BOSS_CORE, 0.9);
        nb++;
      }
    }
    for (let i = nb; i < this.prevBoss; i++) { this.bHalo[i].setVisible(false); this.bCore[i].setVisible(false); }
    this.prevBoss = nb;
  }

  // Night look off (Settings/dev param) or run over: hide everything that was shown.
  hide() {
    for (let i = 0; i < this.prevEyes; i++) if (this.core[i]) this.core[i].setVisible(false);
    for (let i = 0; i < this.prevBoss; i++) { this.bHalo[i].setVisible(false); this.bCore[i].setVisible(false); }
    for (const key in this.rims) for (const im of this.rims[key].arr) im.setVisible(false);
    this.prevEyes = 0; this.prevBoss = 0; this.eyeSlots = 0; this.rimCount = 0;
  }
}
