// Elias v2 as a code-driven rig (docs/mockups/elias-v2): 6 pooled images from ONE atlas + 2 additive glows, animated with transforms only.
// Visual only: it reads the sim player (position, facing, hp, iframes) and the Candle Wheel zone, never writes to the sim. No allocation per frame.
// Tiers: med/high = rig parts; low = one flat sprite (lantern halo baked in) + the lantern glow.
import { DU, FEET, TEX } from './wrenart.js';
import { E_ANCHOR, E_EXPR, E_FLAT, E_FLAT_TEXEL } from './eliasart.js';
import * as M from './rigmath.js';
import { iframeFlick, FLICK_ALPHA } from './hitfx.js';

export const ELIAS_ATLAS = 'elias_rig';
const K = DU / TEX; // world units per atlas texel
const FS = DU / E_FLAT_TEXEL; // world units per texel of the flat sprite
const RAD = Math.PI / 180;
const E_STRIDE = 40; // world units per leg cycle: he is slower (76 u/s), so a slightly shorter stride keeps a calm ~1.9 cycles/s
const WARM = 0xffc96b;

export class EliasRig {
  // opts as HeroRig: { depth, glowKey, glowInv, blendAdd, flat: the scene's hero sprite (Image) }
  constructor(scene, o) {
    this.scene = scene; this.depth = o.depth; this.id = 'elias';
    const a = scene.add;
    const mk = (frame) => a.image(0, 0, ELIAS_ATLAS, frame).setVisible(false);
    this.staffB = mk('e_staff_back'); this.bootF = mk('e_boot'); this.bootN = mk('e_boot'); this.body = mk('e_body'); this.head = mk('e_head_kind'); this.staffF = mk('e_staff_front');
    this.lGlow = a.image(0, 0, o.glowKey).setBlendMode(o.blendAdd).setTint(WARM).setVisible(false); // lantern
    this.cGlow = a.image(0, 0, o.glowKey).setBlendMode(o.blendAdd).setTint(WARM).setVisible(false); // candle crown
    this.flat = o.flat; this.glowInv = o.glowInv;
    this.parts = [this.staffB, this.bootF, this.bootN, this.body, this.head, this.staffF];
    this.flatBox = E_FLAT; this.hasPup = false; this.backScale = [1.35, 1.95]; this.backY = -9; // focal-point backing (A1b-style), sized for his taller shape
    this.active = false; this.mode = '';
    this.wp = { leg: 0, lift: 0, lift2: 0, h: 0, bob: 0, headBob: 0, sy: 1, sx: 1, lean: 0, nod: 0, tailSway: 0 };
    this.wd = { v: 0, amp: 0, phase: 0, acc: 0 }; // WALK v2 driver state
    this.hf = { tint: 0, sx: 1, sy: 1, lean: 0, active: false };
    this.df = { k: 0, alpha: 1, rise: 0, sy: 1, sx: 1, light: 0, emberY: -80 };
    this._x = 0; this._y = 0; this.emberX = 0; this.emberY = 0; this.scarfX = 0; this.scarfY = 0;
    this.reset();
  }

  reset() {
    this.t = 0; this.lastT = -1; this.px = 0; this.py = 0; this.phase = 0; this.sps = 0; this.dir = 1; this.hp = -1;
    this.hurtT = 9; this.deadT = -1; this.lastIf = 0; this.tint = -1; this.ready = false; this.deadSet = false; this.turnT = 9; this.leanS = 0; this.wd.v = 0; this.wd.amp = 0; this.wd.phase = 0; this.wd.acc = 0; this.deadX = 0; this.deadY = 0;
  }

  bind(sim) {
    this.reset();
    this.active = sim.characterId === 'elias' && this.scene.textures.exists(ELIAS_ATLAS);
    if (this.active) this.flat.setOrigin(-E_FLAT.x0 / E_FLAT.w, -E_FLAT.y0 / E_FLAT.h);
    else this.hide();
  }

  hide() {
    for (const p of this.parts) p.setVisible(false);
    this.lGlow.setVisible(false); this.cGlow.setVisible(false);
    this.mode = '';
  }

  triggerHurt() { this.hurtT = 0; }

  setTint(mode) { // 0 none, 1 white fill, 2 red fill, 3 cream fill (death)
    if (mode === this.tint) return;
    this.tint = mode;
    const col = mode === 1 ? 0xffffff : mode === 2 ? 0xff7a6a : 0xffe6b0;
    for (const q of this.parts) { if (mode === 0) q.clearTint(); else q.setTintFill(col); }
    if (mode === 0) this.flat.clearTint(); else this.flat.setTintFill(col);
    if (mode === 0) this.bootF.setTint(0xc4c8d8);
  }

  // anchor (design units rel. feet) -> world, through lean/squash/bob. Writes this._x/_y.
  at(fx, fy, dx, dy, ca, sa, sx, sy, bob) {
    const rx = dx * this.dir * sx; const ry = (dy + bob) * sy;
    this._x = fx + (rx * ca - ry * sa) * DU;
    this._y = fy + (rx * sa + ry * ca) * DU;
  }

  // same, for a point on the staff: first swing it about the gripping hand by th (radians, forward positive)
  atStaff(fx, fy, px, py, th, ca, sa, sx, sy, bob) {
    const hx = E_ANCHOR.hand[0]; const hy = E_ANCHOR.hand[1];
    const dx = px - hx; const dy = py - hy; const c = Math.cos(th); const s = Math.sin(th);
    this.at(fx, fy, hx + dx * c - dy * s, hy + dx * s + dy * c, ca, sa, sx, sy, bob);
  }

  update(sim, tier, reduced, realDt, caps, parts) {
    const p = sim.player;
    let dt = sim.time - this.lastT;
    if (this.lastT < 0 || !(dt > 0)) dt = 0;
    if (dt > 0.1) dt = 0.1;
    this.lastT = sim.time;
    this.t += dt;
    const fx = p.x; const fy = p.y + FEET;
    let dist = 0;
    if (!this.ready) { this.px = p.x; this.py = p.y; } else dist = Math.hypot(p.x - this.px, p.y - this.py);
    if (dist >= 40) dist = 0; // teleport: no stride
    this.px = p.x; this.py = p.y;
    const top = p.speed > 1 ? p.speed : 76;
    if (dt > 0) M.walkDrive(this.wd, dist, dt, top, E_STRIDE); // WALK v2: smoothed speed -> amount + phase
    this.sps = this.wd.amp;
    if (!reduced) this.phase = this.wd.phase;
    const pdir = this.dir;
    this.dir = M.faceDir(this.dir, p.faceX);
    const dir = this.dir;
    if (dir !== pdir) this.turnT = 0; else this.turnT += dt;
    const amp = this.sps;

    if (this.ready && ((this.hp > 0 && p.hp < this.hp - 0.01) || (this.lastIf <= 0 && p.iframes > 0.3 && p.iframes <= 0.45))) this.hurtT = 0;
    this.hp = p.hp; this.lastIf = p.iframes;
    this.hurtT += dt;
    const dead = sim.state === 'defeat';
    if (dead) this.deadT = this.deadT < 0 ? 0 : this.deadT + realDt; else { this.deadT = -1; this.deadSet = false; }
    const hf = M.hurtFx(this.hf, this.hurtT);
    const lowHp = p.hp > 0 && p.hp / p.maxHp < 0.3;
    const gentle = reduced;
    const wp = M.walkPose(this.wp, gentle ? 0 : this.phase, gentle ? 0 : this.sps);
    let wheel = null;
    if (sim.zones) for (const z of sim.zones) if (z.wheel) { wheel = z; break; }
    const cast = M.wheelCasting(wheel);

    // ----- root transform (Elias is heavy: smaller lean and bob than Wren) -----
    const turn = gentle ? 1 : M.turnSquash(this.turnT);
    let sx = gentle ? 1 : M.clampSq(wp.sx * hf.sx * turn);
    let sy = gentle ? 1 : M.clampSq(wp.sy * hf.sy * (1 + (M.breathe(this.t * 0.85) - 1) * (1 - amp)));
    let leanDeg = gentle ? 0 : wp.lean * 0.7 + M.clamp(this.wd.acc / top * 0.6, -2, 2) + hf.lean;
    let bob = gentle ? 0 : wp.bob * 0.8;
    let headBob = gentle ? 0 : wp.headBob * 0.8;
    let alpha = 1; let rise = 0; let deadK = 0;
    if (dead) {
      const df = M.deathFx(this.df, this.deadT);
      sx = M.clampSq(df.sx); sy = M.clampSq(df.sy); leanDeg = 0; bob = 0; headBob = 0; alpha = df.alpha; rise = df.rise; deadK = df.k;
    }
    this.leanS = gentle || dead ? leanDeg * dir : M.easeTo(this.leanS, leanDeg * dir, dt, 0.09); // heavier: eases through upright a touch slower
    const lean = this.leanS * RAD;
    const ca = Math.cos(lean); const sa = Math.sin(lean);

    const flick = iframeFlick(p.iframes, sim.time, dead); // DR1: steady, no 12 Hz swap (also under Calm)
    const wantFlat = tier === 'low' || dead || flick;
    if (!this.ready) { this.ready = true; this.mode = ''; }

    const tintMode = dead ? (deadK > 0.2 ? 3 : 0) : hf.tint;
    this.setTint(tintMode);

    // ----- staff swing + lantern light (steady and held high; a small flicker; the crown flares while the wheel stands) -----
    const th = dead ? 0 : (gentle ? 1 : M.staffTilt(this.phase, this.sps)) * RAD;
    this.atStaff(fx, fy, E_ANCHOR.lantern[0], E_ANCHOR.lantern[1], th, ca, sa, sx, sy, bob);
    if (dead) { // a grave-lamp: the staff stays planted and lit where it stood
      if (!this.deadSet) { this.deadSet = true; this.deadX = this._x; this.deadY = this._y; }
      this._x = this.deadX; this._y = this.deadY;
    }
    this.emberX = this._x; this.emberY = this._y;
    this.at(fx, fy, E_ANCHOR.hem[0], E_ANCHOR.hem[1], ca, sa, sx, sy, bob); this.scarfX = this._x; this.scarfY = this._y; // W2b trail anchor
    const flicker = gentle ? 1 : 1 + 0.04 * Math.sin(this.t * 15) + 0.025 * Math.sin(this.t * 27);
    const dim = hf.active && !dead ? 0.6 : 1;
    this.lGlow.setPosition(this._x, this._y).setScale(this.glowInv * flicker * (lowHp ? 0.85 : 1)).setAlpha((dead ? 0.8 * (1 - deadK * 0.2) : 0.85) * dim).setVisible(true);

    const dBase = this.depth + p.y;
    const flat = this.flat;
    if (wantFlat) {
      if (this.mode !== 'flat') { for (const q of this.parts) q.setVisible(false); this.mode = 'flat'; flat.setVisible(true); }
      this.at(fx, fy, 0, 0, ca, sa, sx, sy, bob);
      flat.setPosition(this._x, this._y).setRotation(lean).setScale(sx * FS, sy * FS).setFlipX(dir < 0).setDepth(dBase);
      flat.setAlpha(dead ? alpha : flick ? FLICK_ALPHA : 1);
      if (dead) { this.at(fx, fy - rise * DU, 0, 0, ca, sa, sx, sy, 0); flat.setPosition(this._x, this._y); }
      this.cGlow.setVisible(false);
    } else {
      if (this.mode !== 'rig') { flat.setVisible(false); for (const q of this.parts) q.setVisible(true); this.mode = 'rig'; this.bootF.setTint(0xc4c8d8); }
      flat.setAlpha(1);
      const fl = dir < 0;
      const sRot = lean + th * dir;
      this.atStaff(fx, fy, E_ANCHOR.staffBack[0], E_ANCHOR.staffBack[1], th, ca, sa, sx, sy, bob);
      this.staffB.setPosition(this._x, this._y).setRotation(sRot).setScale(K * sx, K * sy).setFlipX(fl).setDepth(dBase);
      const bx = wp.leg * 5.5;
      this.at(fx, fy, E_ANCHOR.bootFar[0] - bx, E_ANCHOR.bootFar[1] - wp.lift2 * 4, ca, sa, sx, sy, 0);
      this.bootF.setPosition(this._x, this._y).setRotation(lean).setScale(K * sx, K * sy).setFlipX(fl).setDepth(dBase + 0.001);
      this.at(fx, fy, E_ANCHOR.bootNear[0] + bx, E_ANCHOR.bootNear[1] - wp.lift * 4, ca, sa, sx, sy, 0);
      this.bootN.setPosition(this._x, this._y).setRotation(lean).setScale(K * sx, K * sy).setFlipX(fl).setDepth(dBase + 0.002);
      this.at(fx, fy, 0, 0, ca, sa, sx, sy, bob);
      this.body.setPosition(this._x, this._y).setRotation(lean).setScale(K * sx, K * sy).setFlipX(fl).setDepth(dBase + 0.003);
      const ex = M.pickEliasExpr(false, hf.active, cast, lowHp, M.isBlink(this.t));
      const X = E_EXPR[ex];
      const idleTilt = gentle ? 0 : wp.nod * 0.75 + (1 - amp) * Math.sin(this.t * 1.1) * 1.8;
      this.at(fx, fy, E_ANCHOR.neck[0], E_ANCHOR.neck[1] + X.hy, ca, sa, sx, sy, headBob);
      this.head.setFrame(`e_head_${ex}`).setPosition(this._x, this._y).setRotation(lean + (X.tilt + idleTilt) * RAD * dir).setScale(K * hf.sx * turn, K * hf.sy).setFlipX(fl).setDepth(dBase + 0.004);
      this.atStaff(fx, fy, E_ANCHOR.staffFront[0], E_ANCHOR.staffFront[1], th, ca, sa, sx, sy, bob);
      this.staffF.setPosition(this._x, this._y).setRotation(sRot).setScale(K * sx, K * sy).setFlipX(fl).setDepth(dBase + 0.005);
      // candle crown glow: a soft gold halo around the six candles; flares when the Candle Wheel is planted
      this.atStaff(fx, fy, E_ANCHOR.crown[0], E_ANCHOR.crown[1], th, ca, sa, sx, sy, bob);
      this.cGlow.setPosition(this._x, this._y).setScale(0.62 * this.glowInv * flicker * M.wheelFlare(wheel)).setAlpha(0.3 * dim).setVisible(true);
    }
  }
}
