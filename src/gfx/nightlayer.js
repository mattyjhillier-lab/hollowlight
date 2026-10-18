// WL6b: the enemy night look layer (Phaser side). Pooled additive eye images (ember halo + cream core) drawn ABOVE the vignette, pooled cool rim
// images (baked outline textures, Med/High), and the per-enemy lit levels used for the body tint. No per-frame allocation: all buffers are
// preallocated, images are created lazily and reused (docs/design/visibility-arc-v1.md sections 3, 4, 7). Visual only.
import Phaser from 'phaser';
import {
  EYE_DEFS, DARK_FLOOR, DARK_FLOOR_DAY, DARK_OFF, DARK_DAY_K, BOSS_EYES, BOSS_CORE, BOSS_HALO, EYE_CORE_TINT, EYE_HALO_TINT, RIM_TINT, LIT_STEPS,
  eyeCap, rimCap, spiritCap, litLevel, bandOf, fillTintTable, blinkMul, eyeAlpha, rimAlpha, planEyes, slotsOf,
  eyeAnim, makeEyeOut, streakCap, LOOK_MAX, CORE_CAPS,
} from './nightlook.js';
import { ROLE } from './palette.js';
import { HUSK_TYPES, ATLAS_KEY as HUSK_ATLAS } from './husk/frames.js';

const ADD = Phaser.BlendModes.ADD;
const MAXE = 512;
const SPIRIT_R2 = 40 * 40;
const DAY_RIM_TINT = 0x1c2034; // cold ink outline (never under RGB 12: G3)
const POOL_LIT = 12; // lit level (of 16) from which a night pool outline is drawn

export class NightLayer {
  constructor(scene, depth) {
    this.scene = scene;
    this.atlasKey = HUSK_ATLAS;
    this.depth = depth;
    this.core = [];
    this.coreN = 0;
    this.prevCore = 0;
    this.hp = {}; // Husk socket-eye pools: atlas frame name -> { arr, n } (one pool per frame: no setFrame churn)
    this.day = { arr: [], n: 0 }; // daylight dark outline (crow / crawler, dawn |dL*| gate)
    this.bHalo = [];
    this.bCore = [];
    this.rims = {}; // texture key -> { arr, n }
    this.prevEyes = 0;
    this.prevBoss = 0;
    this.prevRims = 0;
    this.streak = []; // WL6b2: pooled trailing streaks behind fast movers
    this.prevStreak = 0;
    this.streaks = 0;
    this.ea = makeEyeOut();
    // per-enemy motion memory (by id, 1024 slots): position at the last draw, smoothed velocity
    this.mId = new Int32Array(1024).fill(-1);
    this.mT = new Float32Array(1024);
    this.mX = new Float32Array(1024);
    this.mY = new Float32Array(1024);
    this.mVx = new Float32Array(1024);
    this.mVy = new Float32Array(1024);
    this.lit = new Uint8Array(MAXE);
    this.near = new Uint8Array(MAXE);
    this.kinds = new Uint8Array(MAXE);
    this.plan = new Int16Array(MAXE);
    this.tab = new Int32Array(2 * (LIT_STEPS + 1)); // [0..16] normal far tint, [17..33] with the dark-type floor (WL6d)
    this.tq = new Uint8Array(MAXE); // tint index per enemy: lit level (+17 for dark types)
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

  // Husk socket eye: pooled atlas image per frame name; sx/sy = scale (sy squashes for lids), flip = facing left
  put(name, x, y, sx, sy, flip, a) {
    let p = this.hp[name];
    if (!p) p = this.hp[name] = { arr: [], n: 0 };
    let im = p.arr[p.n];
    if (!im) { im = this.scene.add.image(0, 0, this.atlasKey, name).setBlendMode(ADD).setDepth(this.depth); p.arr[p.n] = im; }
    p.n++;
    im.x = x; im.y = y; im.alpha = a;
    if (im.scaleX !== sx) im.scaleX = sx;
    if (im.scaleY !== sy) im.scaleY = sy;
    if (im.flipX !== flip) im.flipX = flip;
    if (!im.visible) im.visible = true;
  }

  dayImg(atlas, rn, depthBase) { const im = this.scene.add.image(0, 0, atlas, rn).setTint(DAY_RIM_TINT).setDepth(depthBase - 1); im.rn = rn; return im; }

  endPools(pools) { for (const key in pools) { const p = pools[key]; for (let i = p.n; i < p.arr.length; i++) if (p.arr[i].visible) p.arr[i].setVisible(false); } }

  // trailing ember streak behind a fast mover (WL6b2): h = thickness (Husks: thinner than the socket), k = length factor
  streakAt(ns, x, y, ea, a, h, k) {
    let st = this.streak[ns];
    if (!st) { st = this.scene.add.image(0, 0, 'glow').setBlendMode(ADD).setTint(EYE_HALO_TINT).setDepth(this.depth - 0.5); st.dw = 0; this.streak[ns] = st; }
    const len = ea.sl * k;
    st.setDisplaySize(len + 3 * k, h);
    st.x = x - ea.sx * len * 0.5; st.y = y - ea.sy * len * 0.5; st.rotation = Math.atan2(ea.sy, ea.sx); st.alpha = ea.sa * a;
    if (!st.visible) st.visible = true;
  }

  place(im, x, y, size, a) {
    if (im.dw !== size) { im.dw = size; im.setDisplaySize(size, size); }
    im.x = x; im.y = y; im.alpha = a; // plain property writes (cheaper than the chained setters on a few hundred images per frame)
    if (!im.visible) im.visible = true;
  }

  // Before the enemy loop: tint table, nearby spirit lights, lit level per enemy (index = position in sim.enemies).
  // husks = the Husk atlas is on: Husk types use the normal tint table (the dark-type floor was for the old near-black crawler sprite;
  // the Husk bake lifts its own blacks for G3, and the floor made the pale-masked Rootback match bright daylight ground, |dL*| < 1)
  prepare(sim, lx, ly, R, tier, arc, husks) {
    const key = Math.round(arc.farV * 1000) * 1000 + Math.round(arc.bodyK * 1000);
    if (key !== this.tabKey) { this.tabKey = key; fillTintTable(arc.farV, arc.bodyK, this.tab); fillTintTable(Math.max(arc.farV * DARK_DAY_K, DARK_FLOOR.root_crawler, DARK_FLOOR_DAY / arc.bodyK), arc.bodyK, this.tab, DARK_OFF); this.ver++; }
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
      this.tq[i] = this.lit[i] + (DARK_FLOOR[e.type] && !(husks && HUSK_TYPES[e.type]) ? DARK_OFF : 0);
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
    let ns = 0;
    const coreCap = CORE_CAPS[tier] ?? 0;
    this.coreN = 0;
    for (const key in this.hp) this.hp[key].n = 0;
    const sc = streakCap(tier);
    const ea = this.ea;
    const calm = c.calm;
    for (let k = 0; k < cnt; k++) {
      const i = this.plan[k];
      const e = es[i];
      const d = EYE_DEFS[e.type];
      const fl = e.faceX < 0 ? -1 : 1;
      // motion memory (smoothed velocity from the last drawn position; reset when the enemy was not drawn for a while)
      const m = e.id & 1023;
      let spd = 0;
      if (this.mId[m] !== e.id || c.time - this.mT[m] > 0.25 || c.time < this.mT[m]) {
        this.mId[m] = e.id; this.mT[m] = c.time; this.mX[m] = e.x; this.mY[m] = e.y; this.mVx[m] = 0; this.mVy[m] = 0;
      } else {
        const dt = c.time - this.mT[m];
        if (dt > 0.001) {
          const ivx = (e.x - this.mX[m]) / dt;
          const ivy = (e.y - this.mY[m]) / dt;
          this.mVx[m] += (ivx - this.mVx[m]) * 0.3;
          this.mVy[m] += (ivy - this.mVy[m]) * 0.3;
          this.mT[m] = c.time; this.mX[m] = e.x; this.mY[m] = e.y;
        }
      }
      const mvx = this.mVx[m];
      const mvy = this.mVy[m];
      spd = Math.sqrt(mvx * mvx + mvy * mvy);
      eyeAnim(c.time, e.id, c.hx - e.x, c.hy - e.y, spd, mvx, mvy, calm, ea);
      const art = c.art;
      const af = art && i < 512 ? art.fi[i] : 255;
      const bm = blinkMul(c.time, e.id, calm);
      if (af !== 255) {
        // EYES IN SOCKETS (Husks): a socket-shaped ember glow that fills the knot-hole (+ a faint spill on the lip) and a small species core that
        // drifts toward the hero inside the socket's free room; blink = the lid closes (the sprites squash shut, never leave the socket);
        // hurt squints (open 0.55, hotter); the tell flares (brighter, core +25%). Beyond the nearest CORE_CAPS (and on Low): one glow+core image per
        // eye, no drift. All on the frame's anchors.
        const E = art.eyes[e.type][af];
        const ME = art.eyeMeta[e.type];
        const NM = art.eyeNames[e.type];
        const ks = art.sc[i];
        const oy = e.y + art.foot[e.type] + art.dy[i];
        const blink = bm < 1;
        const a0 = Math.min(1, eyeAlpha(arc.eyeA, this.lit[i], d.floorK) * ea.am * (blink ? 0.7 : 1) + ea.ab);
        const gS = ks * art.eyeInv * (1 + (ea.sc - 1) * 0.3); // the glow grows a little (<= ~+9%) as the enemy closes in: it stays on the lip
        const split = k < coreCap;
        const lx = ea.ox / LOOK_MAX;
        const ly = ea.oy / LOOK_MAX;
        for (let j = 0; j < E.length; j++) {
          const A = E[j];
          const mj = ME[A[6]];
          const nm = NM[A[6]];
          const open = A[4] * (blink ? 0.15 : 1); // core: lid closes on a blink, squints on a hit
          const gOpen = blink ? 0.15 : A[4] < 1 ? 0.85 : 1; // glow: a hit only narrows it a little (an enemy under fire stays readable)
          const a = Math.min(1, a0 * (A[4] < 1 ? 1.35 : 1 + 0.3 * A[5])); // tell flares; the hurt squint flinches hot (narrower, brighter)
          const gx = e.x + A[0] * ks * fl;
          const gy = oy + A[1] * ks;
          this.put(nm[split ? (c.bloom ? 3 : 0) : (c.bloom ? 4 : 2)], gx, gy, gS, gS * gOpen, fl < 0, a);
          slot++;
          if (split) {
            const cS = ks * art.eyeInv * ea.sc * (1 + 0.25 * A[5]);
            this.put(nm[1], e.x + A[2] * ks * fl + lx * mj.lx * ks, oy + A[3] * ks + ly * mj.ly * ks, cS, cS * open, fl < 0, a);
            slot++;
          }
          if (ea.sl > 0 && ns < sc && j === 0) this.streakAt(ns++, gx, gy, ea, a, mj.h * ks * 0.7, 0.6);
        }
        continue;
      }
      const a = Math.min(1, eyeAlpha(arc.eyeA, this.lit[i], d.floorK) * ea.am * bm + ea.ab);
      const size = d.halo * ea.sc;
      const pts = d.pts;
      for (let j = 0; j < pts.length; j++) {
        const pj = pts[j];
        const x = e.x + pj[0] * fl + ea.ox;
        const y = e.y + pj[1] + ea.oy;
        this.place(this.eyeImg(this.core, this.coreN++, 0xffffff, this.depth, 'eyen'), x, y, size, a);
        slot++;
        if (ea.sl > 0 && ns < sc && j === 0) this.streakAt(ns++, x, y, ea, a, 3.2, 1);
      }
    }
    for (let i = ns; i < this.prevStreak; i++) if (this.streak[i]) this.streak[i].setVisible(false);
    this.prevStreak = ns;
    this.streaks = ns;
    for (let i = this.coreN; i < this.prevCore; i++) if (this.core[i]) this.core[i].setVisible(false);
    this.prevCore = this.coreN;
    this.endPools(this.hp);
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
          const art = c.art;
          const af = art && i < 512 ? art.fi[i] : 255;
          const rk = af !== 255 ? 'husk' : d.rim; // EN0: Husk rims are half-density outline frames in the chapter atlas (one per walk/tell frame)
          let pool = this.rims[rk];
          if (!pool) pool = this.rims[rk] = { arr: [], n: 0 };
          let im = pool.arr[pool.n];
          if (!im) {
            im = af !== 255 ? this.scene.add.image(0, 0, art.atlas, art.rimName(e.type, af)) : this.scene.add.image(0, 0, d.rim);
            im.setBlendMode(ADD).setTint(RIM_TINT).setDepth(c.depthBase - 1);
            if (af === 255) im.setScale(this.scene.pools[e.type].inv);
            im.rn = '';
            pool.arr[pool.n] = im;
          }
          pool.n++;
          if (af !== 255) {
            const rn = art.rimName(e.type, af);
            if (im.rn !== rn) { im.rn = rn; im.setFrame(rn); }
            const k = art.sc[i] * art.rimInv;
            if (im.scaleX !== k) im.setScale(k);
            im.x = e.x; im.y = e.y + art.foot[e.type] + art.dy[i];
          } else { im.x = e.x; im.y = e.y; }
          im.flipX = e.faceX < 0; im.alpha = a;
          if (!im.visible) im.visible = true;
          nr++;
        }
      }
    }
    for (const key in this.rims) { const p = this.rims[key]; for (let i = p.n; i < p.arr.length; i++) if (p.arr[i].visible) p.arr[i].setVisible(false); }
    this.rimCount = nr;

    // 2b) daylight (bodyK < 1): a soft DARK outline on the Husk types whose bodies sit close to bright dawn ground (crow, crawler: the dawn
    // |dL*| >= 6 gate), from the same atlas outline frames, normal blend, under the sprites; Med/High only (rim caps), in view, not the boss
    // and at night under the High bloom: the crow (darkest type) standing in the lit lantern pool (its small socket eye is softened by the
    // bloom's blur-mix there, so its silhouette carries the read: G2)
    const dayOn = c.art && rc > 0 && (arc.bodyK < 0.999 || c.bloom);
    const dp = this.day;
    dp.n = 0;
    if (dayOn) {
      const art = c.art;
      const dk = Math.min(1, (1 - arc.bodyK) / 0.28);
      const night = arc.bodyK >= 0.999;
      for (let i = 0; i < n && dp.n < rc; i++) {
        const e = es[i];
        const af = i < 512 ? art.fi[i] : 255;
        if (af === 255 || e.boss) continue;
        const T = HUSK_TYPES[e.type];
        if (!T || !T.dayRim || (night && (!T.poolRim || this.lit[i] < POOL_LIT))) continue;
        if (e.x < c.vx0 || e.x > c.vx1 || e.y < c.vy0 || e.y > c.vy1) continue;
        let im = dp.arr[dp.n];
        const rn = art.rimName(e.type, af);
        if (!im) { im = this.dayImg(art.atlas, rn, c.depthBase); dp.arr[dp.n] = im; }
        dp.n++;
        if (im.rn !== rn) { im.rn = rn; im.setFrame(rn); }
        const k = art.sc[i] * art.rimInv;
        if (im.scaleX !== k) im.setScale(k);
        im.x = e.x; im.y = e.y + art.foot[e.type] + art.dy[i];
        im.flipX = e.faceX < 0; im.alpha = night ? T.poolRim : T.dayRim * dk;
        if (!im.visible) im.visible = true;
      }
    }
    for (let i = dp.n; i < dp.arr.length; i++) if (dp.arr[i].visible) dp.arr[i].setVisible(false);
    this.dayRims = dp.n;

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
    for (let i = 0; i < this.prevCore; i++) if (this.core[i]) this.core[i].setVisible(false);
    for (const key in this.hp) this.hp[key].n = 0;
    this.endPools(this.hp);
    this.day.n = 0;
    for (const im of this.day.arr) im.setVisible(false);
    this.prevCore = 0;
    for (let i = 0; i < this.prevBoss; i++) { this.bHalo[i].setVisible(false); this.bCore[i].setVisible(false); }
    for (const key in this.rims) for (const im of this.rims[key].arr) im.setVisible(false);
    for (let i = 0; i < this.prevStreak; i++) this.streak[i].setVisible(false);
    this.prevStreak = 0; this.streaks = 0;
    this.prevEyes = 0; this.prevBoss = 0; this.eyeSlots = 0; this.rimCount = 0;
  }
}
