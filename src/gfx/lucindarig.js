// Lucinda, the Hearth-Warden, as a code-driven rig (look: docs/design/lucinda-ophimber-look-v1.md option A) + her pet Ophimber (a she, option 1 Hatchling).
// 6 pooled images from ONE atlas + 2 additive glows for Lucinda, 1 image + 1 glow for Ophimber, animated with transforms only (same driver as Elias / Wren).
// Visual only: reads the sim player (position, facing, hp, iframes) and sim.rise, never writes to the sim. No allocation per frame. Tiers: med/high = rig parts; low = one flat sprite.
// Ophimber is NOT a sim entity: she never collides, blocks or gets targeted. She trots 26 units behind with a 0.15 s lag, perches on Lucinda's back shoulder after 0.8 s still,
// is drawn flying by risefx.js during Ophimber's Rise (so she is hidden here until it settles) and sleeps on her shoulder in Calm. See lucindapet.js.
import { DU, FEET, TEX } from './wrenart.js';
import { L_ANCHOR, L_EXPR, L_FLAT, L_FLAT_TEXEL, PERCH_SCALE } from './lucindaart.js';
import { OPHIMBER_ATLAS, OPHIMBER_K } from './ophimberart.js';
import * as M from './rigmath.js';
import { newPet, petStep, petFrame, pickLucindaExpr, castArm } from './lucindapet.js';
import { iframeFlick, FLICK_ALPHA } from './hitfx.js';

export const LUCINDA_ATLAS = 'lucinda_rig';
const K = DU / TEX; // world units per atlas texel
const FS = DU / L_FLAT_TEXEL;
const RAD = Math.PI / 180;
const L_STRIDE = 42; // world units per leg cycle
const WARM = 0xffc96b;
const CAST_DEG = -112; // the near arm raised, palm up to the sky, while Ophimber rises

export class LucindaRig {
  // opts as HeroRig: { depth, glowKey, glowInv, blendAdd, flat: the scene's hero sprite (Image) }
  constructor(scene, o) {
    this.scene = scene; this.depth = o.depth; this.id = 'hearthwarden';
    const a = scene.add;
    const mk = (frame) => a.image(0, 0, LUCINDA_ATLAS, frame).setVisible(false);
    this.tail = mk('l_tail'); this.bootF = mk('l_boot'); this.bootN = mk('l_boot'); this.body = mk('l_body'); this.head = mk('l_head_kind'); this.arm = mk('l_arm');
    this.fGlow = a.image(0, 0, o.glowKey).setBlendMode(o.blendAdd).setTint(WARM).setVisible(false); // the hearth flame she cups (her light)
    this.pet = a.image(0, 0, OPHIMBER_ATLAS, 'o_stand').setVisible(false);
    this.pGlow = a.image(0, 0, o.glowKey).setBlendMode(o.blendAdd).setTint(WARM).setVisible(false);
    this.flat = o.flat; this.glowInv = o.glowInv;
    this.parts = [this.tail, this.bootF, this.bootN, this.body, this.head, this.arm];
    this.flatBox = L_FLAT; this.hasPup = false; this.backScale = [1.3, 1.75]; this.backY = -8;
    this.active = false; this.mode = '';
    this.wp = { leg: 0, lift: 0, lift2: 0, h: 0, bob: 0, headBob: 0, sy: 1, sx: 1, lean: 0, nod: 0, tailSway: 0 };
    this.wd = { v: 0, amp: 0, phase: 0, acc: 0 };
    this.hf = { tint: 0, sx: 1, sy: 1, lean: 0, active: false };
    this.df = { k: 0, alpha: 1, rise: 0, sy: 1, sx: 1, light: 0, emberY: -80 };
    this.st = newPet(); this.petOn = false; this.petX = 0; this.petY = 0; this.petDir = 1; this.petS = 1;
    this._x = 0; this._y = 0; this.emberX = 0; this.emberY = 0; this.scarfX = 0; this.scarfY = 0; this.perchX = 0; this.perchY = 0; this.armK = 0;
    this.reset();
  }

  reset() {
    this.t = 0; this.lastT = -1; this.px = 0; this.py = 0; this.phase = 0; this.sps = 0; this.dir = 1; this.hp = -1;
    this.hurtT = 9; this.deadT = -1; this.lastIf = 0; this.tint = -1; this.ready = false; this.deadSet = false; this.turnT = 9; this.leanS = 0; this.wd.v = 0; this.wd.amp = 0; this.wd.phase = 0; this.wd.acc = 0; this.deadX = 0; this.deadY = 0;
    if (this.st) { this.st.init = false; this.st.phase = 0; } this.petOn = false; this.petS = 1; this.armK = 0; this.snapPet = true;
  }

  bind(sim) {
    this.reset();
    this.active = sim.characterId === 'hearthwarden' && this.scene.textures.exists(LUCINDA_ATLAS) && this.scene.textures.exists(OPHIMBER_ATLAS);
    if (this.active) this.flat.setOrigin(-L_FLAT.x0 / L_FLAT.w, -L_FLAT.y0 / L_FLAT.h);
    else this.hide();
  }

  hide() {
    for (const p of this.parts) p.setVisible(false);
    this.fGlow.setVisible(false); this.pet.setVisible(false); this.pGlow.setVisible(false);
    this.mode = ''; this.petOn = false;
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

  // same, for a point on the near arm: first swing it about the shoulder by th (radians, clockwise positive)
  atArm(fx, fy, px, py, th, ca, sa, sx, sy, bob) {
    const hx = L_ANCHOR.shoulder[0]; const hy = L_ANCHOR.shoulder[1];
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
    const top = p.speed > 1 ? p.speed : 80;
    if (dt > 0) M.walkDrive(this.wd, dist, dt, top, L_STRIDE);
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
    const R = sim.rise && sim.rise.D ? sim.rise : null;
    const ck = R ? castArm(R.t, R.D.settle) : 0; // Ophimber's Rise: she raises her arm while the little dragon climbs
    this.armK = gentle ? (ck > 0.5 ? 1 : 0) : ck;

    // ----- root transform -----
    const turn = gentle ? 1 : M.turnSquash(this.turnT);
    let sx = gentle ? 1 : M.clampSq(wp.sx * hf.sx * turn);
    let sy = gentle ? 1 : M.clampSq(wp.sy * hf.sy * (1 + (M.breathe(this.t * 0.9) - 1) * (1 - amp)));
    let leanDeg = gentle ? 0 : wp.lean * 0.8 + M.clamp(this.wd.acc / top * 0.6, -2, 2) + hf.lean;
    let bob = gentle ? 0 : wp.bob;
    let headBob = gentle ? 0 : wp.headBob;
    let alpha = 1; let rise = 0; let deadK = 0;
    if (dead) {
      const df = M.deathFx(this.df, this.deadT);
      sx = M.clampSq(df.sx); sy = M.clampSq(df.sy); leanDeg = 0; bob = 0; headBob = 0; alpha = df.alpha; rise = df.rise; deadK = df.k;
    }
    this.leanS = gentle || dead ? leanDeg * dir : M.easeTo(this.leanS, leanDeg * dir, dt, 0.08);
    const lean = this.leanS * RAD;
    const ca = Math.cos(lean); const sa = Math.sin(lean);

    const flick = iframeFlick(p.iframes, sim.time, dead);
    const wantFlat = tier === 'low' || dead || flick;
    if (!this.ready) { this.ready = true; this.mode = ''; }

    const tintMode = dead ? (deadK > 0.2 ? 3 : 0) : hf.tint;
    this.setTint(tintMode);

    // ----- the near arm and the hearth flame (steady, a small flicker; raised and brighter while Ophimber rises) -----
    const swing = gentle || dead ? 0 : -wp.leg * 9 * (1 - this.armK);
    const th = (swing + CAST_DEG * this.armK) * RAD;
    this.atArm(fx, fy, L_ANCHOR.flame[0], L_ANCHOR.flame[1], th, ca, sa, sx, sy, bob);
    this.emberX = this._x; this.emberY = this._y;
    const fxw = this._x; const fyw = this._y;
    this.at(fx, fy, L_ANCHOR.hem[0], L_ANCHOR.hem[1], ca, sa, sx, sy, bob); this.scarfX = this._x; this.scarfY = this._y; // trail anchor
    const flicker = gentle ? 1 : 1 + 0.05 * Math.sin(this.t * 14) + 0.03 * Math.sin(this.t * 26);
    const dim = hf.active && !dead ? 0.6 : 1;
    this.fGlow.setPosition(fxw, fyw - 2).setScale(this.glowInv * flicker * (lowHp ? 0.85 : 1) * (1 + 0.35 * this.armK)).setAlpha((dead ? 0.7 * (1 - deadK * 0.3) : 0.8) * dim).setVisible(true);

    const dBase = this.depth + p.y;
    const flat = this.flat;
    const fl = dir < 0;
    if (wantFlat) {
      if (this.mode !== 'flat') { for (const q of this.parts) q.setVisible(false); this.mode = 'flat'; flat.setVisible(true); }
      this.at(fx, fy, 0, 0, ca, sa, sx, sy, bob);
      flat.setPosition(this._x, this._y).setRotation(lean).setScale(sx * FS, sy * FS).setFlipX(fl).setDepth(dBase);
      flat.setAlpha(dead ? alpha : flick ? FLICK_ALPHA : 1);
      if (dead) { this.at(fx, fy - rise * DU, 0, 0, ca, sa, sx, sy, 0); flat.setPosition(this._x, this._y); }
    } else {
      if (this.mode !== 'rig') { flat.setVisible(false); for (const q of this.parts) q.setVisible(true); this.mode = 'rig'; this.bootF.setTint(0xc4c8d8); }
      flat.setAlpha(1);
      // tail: sways about its root, trailing the body
      const sway = gentle ? 0 : (Math.sin(this.t * 3 - 1) * (0.4 + amp) * 4 + (wp.tailSway || 0) * 20) * RAD;
      this.at(fx, fy, L_ANCHOR.tail[0], L_ANCHOR.tail[1], ca, sa, sx, sy, bob);
      this.tail.setPosition(this._x, this._y).setRotation(lean + sway * dir).setScale(K * sx, K * sy).setFlipX(fl).setDepth(dBase);
      const bx = wp.leg * 5;
      this.at(fx, fy, L_ANCHOR.bootFar[0] - bx, L_ANCHOR.bootFar[1] - wp.lift2 * 4, ca, sa, sx, sy, 0);
      this.bootF.setPosition(this._x, this._y).setRotation(lean).setScale(K * sx * 0.95, K * sy * 0.95).setFlipX(fl).setDepth(dBase + 0.001);
      this.at(fx, fy, L_ANCHOR.bootNear[0] + bx, L_ANCHOR.bootNear[1] - wp.lift * 4, ca, sa, sx, sy, 0);
      this.bootN.setPosition(this._x, this._y).setRotation(lean).setScale(K * sx, K * sy).setFlipX(fl).setDepth(dBase + 0.002);
      this.at(fx, fy, 0, 0, ca, sa, sx, sy, bob);
      this.body.setPosition(this._x, this._y).setRotation(lean).setScale(K * sx, K * sy).setFlipX(fl).setDepth(dBase + 0.003);
      const ex = pickLucindaExpr(false, hf.active, this.armK > 0.5, M.isBlink(this.t));
      const X = L_EXPR[ex];
      const idleTilt = gentle ? 0 : wp.nod * 0.75 + (1 - amp) * Math.sin(this.t * 1.2) * 1.6;
      this.at(fx, fy, L_ANCHOR.neck[0], L_ANCHOR.neck[1] + X.hy, ca, sa, sx, sy, headBob);
      this.head.setFrame(`l_head_${ex}`).setPosition(this._x, this._y).setRotation(lean + (X.tilt + idleTilt) * RAD * dir).setScale(K * hf.sx * turn, K * hf.sy).setFlipX(fl).setDepth(dBase + 0.004);
      this.atArm(fx, fy, L_ANCHOR.shoulder[0], L_ANCHOR.shoulder[1], 0, ca, sa, sx, sy, bob);
      this.arm.setPosition(this._x, this._y).setRotation(lean + th * dir).setScale(K * sx, K * sy).setFlipX(fl).setDepth(dBase + 0.005);
    }

    // ----- Ophimber (render only) -----
    this.at(fx, fy, L_ANCHOR.perch[0], L_ANCHOR.perch[1], ca, sa, sx, sy, bob); this.perchX = this._x; this.perchY = this._y;
    const risingNow = !!R && R.t < (R.D.settle || 2.4) + 0.5;
    if (dead || risingNow) { // risefx.js draws her in the air; she is back on the shoulder when it ends
      this.pet.setVisible(false); this.pGlow.setVisible(false); this.petOn = false; this.snapPet = true;
      return;
    }
    const calm = !!reduced;
    petStep(this.st, fx, fy, dir, dt, dist, this.perchX, this.perchY, calm, this.snapPet); this.snapPet = false;
    const st = this.st;
    const target = st.perched ? PERCH_SCALE : 1;
    this.petS = calm ? target : M.easeTo(this.petS, target, dt, 0.1);
    const sc = OPHIMBER_K * K * this.petS;
    const py = st.y - st.lift - (st.perched || calm ? 0 : st.hop);
    this.petX = st.x; this.petY = py; this.petDir = st.dir; this.petOn = true;
    const perchedNow = st.perched || calm;
    this.pet.setFrame(petFrame(st, calm, this.t)).setPosition(st.x, py).setScale(sc * (perchedNow ? sx : 1), sc * (perchedNow ? sy : 1)).setFlipX(st.dir < 0).setRotation(perchedNow ? lean : 0)
      .setDepth(perchedNow ? dBase + 0.006 : this.depth + st.y - FEET).setAlpha(1).setVisible(true);
    if (tier === 'low') this.pGlow.setVisible(false);
    else this.pGlow.setPosition(st.x + st.dir * 3, py - 8).setScale(0.5 * this.glowInv).setAlpha(calm ? 0.28 : 0.32 + 0.05 * Math.sin(this.t * 3)).setDepth((perchedNow ? dBase + 0.006 : this.depth + st.y - FEET) - 0.0005).setVisible(true);
  }
}
