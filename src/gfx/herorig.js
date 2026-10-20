// Wren v2 + pup as a code-driven rig (docs/mockups/wren-v2): a handful of pooled images from ONE atlas, animated with transforms only.
// Visual only: it reads the sim player (position, facing, hp, iframes) and never writes to the sim. No allocation per frame.
// Tiers: med/high = rig parts (7 Wren images incl. ember glow, 4 pup images); low = one flat Wren sprite + one flat pup sprite.
import { DU, FEET, TEX, ANCHOR, PUP_K, PUP_NECK, REST, HEAD_EXPR, pupAnchors, FLAT, FLAT_TEXEL, PUP_FLAT } from './wrenart.js';
import * as M from './rigmath.js';
import { iframeFlick, FLICK_ALPHA } from './hitfx.js';

export const ATLAS = 'wren_rig';
const K = DU / TEX; // world units per atlas texel (the pup flats share it: same texel density per pup unit)
const FS = DU / FLAT_TEXEL; // world units per texel of the flat Wren sprite
const RAD = Math.PI / 180;
const PUP_GLOW = 0xffc45a;

export class HeroRig {
  // opts: { add: scene.add, depth: D_LIT, glowKey, glowInv, blendAdd, flat: the scene's hero sprite (Image) }
  constructor(scene, o) {
    this.scene = scene;
    this.depth = o.depth;
    const a = scene.add;
    const mk = (frame) => a.image(0, 0, ATLAS, frame).setVisible(false);
    this.tail = mk('w_tail'); this.bootF = mk('w_boot'); this.bootN = mk('w_boot'); this.body = mk('w_body'); this.head = mk('w_head_neutral');
    this.ember = mk('w_ember');
    this.eGlow = a.image(0, 0, o.glowKey).setBlendMode(o.blendAdd).setTint(0xffc96b).setVisible(false);
    this.pTail = mk('p_tail_sit'); this.pBody = mk('p_body_sit'); this.pHead = mk('p_head_open');
    this.pGlow = a.image(0, 0, o.glowKey).setBlendMode(o.blendAdd).setTint(PUP_GLOW).setVisible(false);
    this.pFlat = a.image(0, 0, 'pup_sit').setOrigin(-PUP_FLAT.x0 / PUP_FLAT.w, -PUP_FLAT.y0 / PUP_FLAT.h).setVisible(false);
    this.flat = o.flat; // the scene's playerImg: flat Wren (Low tier, iframe flicker, death)
    this.glowInv = o.glowInv;
    this.parts = [this.tail, this.bootF, this.bootN, this.body, this.head, this.ember];
    this.pupParts = [this.pTail, this.pBody, this.pHead];
    this.active = false; this.flatBox = FLAT; this.hasPup = true; this.id = 'wren';
    this.mode = ''; this.pupMode = ''; this._x = 0; this._y = 0; // '' | 'rig' | 'flat'
    // reusable scratch (no allocation in update)
    this.wp = { leg: 0, lift: 0, lift2: 0, h: 0, bob: 0, headBob: 0, sy: 1, sx: 1, lean: 0, nod: 0, tailSway: 0 };
    this.wd = { v: 0, amp: 0, phase: 0, acc: 0 }; // WALK v2 driver state
    this.hf = { tint: 0, sx: 1, sy: 1, lean: 0, active: false };
    this.df = { k: 0, alpha: 1, rise: 0, sy: 1, sx: 1, light: 0, emberY: -80 };
    this.es = { x: 0, y: 0, vx: 0, vy: 0 }; // ember spring (world)
    this.ps = { x: 0, y: 0, vx: 0, vy: 0 }; // pup spring (world, ground contact)
    this.heel = { x: 0, y: 0 };
    this.pst = { run: false, still: 0 };
    this.emberX = 0; this.emberY = 0; this.scarfX = 0; this.scarfY = 0; this.pupX = 0; this.pupY = 0;
    this.reset();
  }

  reset() {
    this.t = 0; this.lastT = -1; this.px = 0; this.py = 0; this.phase = 0; this.sps = 0; this.dir = 1; this.hp = -1;
    this.hurtT = 9; this.deadT = -1; this.lastIf = 0; this.pdir = 1; this.pPhase = 0; this.pup = 'sit'; this.tint = -1; this.alphaSet = -1;
    this.trailT = 0; this.ready = false; this.turnT = 9; this.leanS = 0; this.wd.v = 0; this.wd.amp = 0; this.wd.phase = 0; this.wd.acc = 0; this.pst.run = false; this.pst.still = 0;
  }

  bind(sim) {
    this.reset();
    this.ready = false;
    this.active = sim.characterId === 'wren' && this.scene.textures.exists(ATLAS);
    this.pupMode = '';
    if (this.active) this.flat.setOrigin(-FLAT.x0 / FLAT.w, -FLAT.y0 / FLAT.h);
    else this.hide();
  }

  hide() {
    for (const p of this.parts) p.setVisible(false);
    for (const p of this.pupParts) p.setVisible(false);
    this.eGlow.setVisible(false); this.pGlow.setVisible(false); this.pFlat.setVisible(false);
    this.mode = '';
  }

  // debug / screenshots / future abilities: trigger the hurt reaction
  triggerHurt() { this.hurtT = 0; }

  setTint(mode) { // 0 none, 1 white fill, 2 red fill, 3 cream fill (death)
    if (mode === this.tint) return;
    this.tint = mode;
    const all = this.parts; // ember keeps its own colours
    for (let i = 0; i < all.length - 1; i++) {
      if (mode === 0) all[i].clearTint(); else all[i].setTintFill(mode === 1 ? 0xffffff : mode === 2 ? 0xff7a6a : 0xffe6b0);
    }
    if (mode === 0) this.flat.clearTint(); else this.flat.setTintFill(mode === 1 ? 0xffffff : mode === 2 ? 0xff7a6a : 0xffe6b0);
    if (mode === 0) this.bootF.setTint(0xc4c8d8);
  }

  // anchor (design units rel. feet) -> world, through lean/squash/bob/rise. Writes this._x/_y.
  at(fx, fy, dx, dy, ca, sa, sx, sy, bob) {
    const rx = dx * this.dir * sx; const ry = (dy + bob) * sy;
    this._x = fx + (rx * ca - ry * sa) * DU;
    this._y = fy + (rx * sa + ry * ca) * DU;
  }

  // sim: the Sim; tier: 'low'|'med'|'high'; reduced: reduced motion; realDt seconds (death timeline); caps: quality caps; parts: Particles
  update(sim, tier, reduced, realDt, caps, parts) {
    const p = sim.player;
    let dt = sim.time - this.lastT;
    if (this.lastT < 0 || !(dt > 0)) dt = 0;
    if (dt > 0.1) dt = 0.1;
    this.lastT = sim.time;
    this.t += dt;
    const fx = p.x; const fy = p.y + FEET; // soles
    // movement measured from the real position delta (what the player sees)
    let dist = 0;
    if (!this.ready) { this.px = p.x; this.py = p.y; }
    else dist = Math.hypot(p.x - this.px, p.y - this.py);
    let ux = 0; let uy = 0;
    if (dist > 0.0001 && dist < 40) { ux = (p.x - this.px) / dist; uy = (p.y - this.py) / dist; } else if (dist >= 40) dist = 0; // teleport: no stride
    this.px = p.x; this.py = p.y;
    const top = p.speed > 1 ? p.speed * 1.1 : 105; // her trait speed (+10%)
    if (dt > 0) M.walkDrive(this.wd, dist, dt, top, M.STRIDE); // WALK v2: smoothed speed -> amount + phase
    this.sps = this.wd.amp;
    if (!reduced) this.phase = this.wd.phase;
    const pdir = this.dir;
    this.dir = M.faceDir(this.dir, p.faceX);
    const dir = this.dir;
    if (dir !== pdir) this.turnT = 0; else this.turnT += dt;
    const amp = this.sps;

    // hurt detection (hp drop or a fresh iframe window of the normal 0.4 s kind; also under god mode)
    if (this.ready && ((this.hp > 0 && p.hp < this.hp - 0.01) || (this.lastIf <= 0 && p.iframes > 0.3 && p.iframes <= 0.45))) this.hurtT = 0;
    this.hp = p.hp; this.lastIf = p.iframes;
    this.hurtT += dt;
    const dead = sim.state === 'defeat';
    if (dead) this.deadT = this.deadT < 0 ? 0 : this.deadT + realDt; else this.deadT = -1;
    const hf = M.hurtFx(this.hf, this.hurtT);
    const lowHp = p.hp > 0 && p.hp / p.maxHp < 0.3;
    const gentle = reduced; // reduced motion: static pose, only a gentle ember
    const wp = M.walkPose(this.wp, gentle ? 0 : this.phase, gentle ? 0 : this.sps);

    // ----- root transform -----
    const turn = gentle ? 1 : M.turnSquash(this.turnT);
    let sx = gentle ? 1 : M.clampSq(wp.sx * hf.sx * turn);
    let sy = gentle ? 1 : M.clampSq(wp.sy * hf.sy * (1 + (M.breathe(this.t) - 1) * (1 - amp))); // breathing fades out as she walks (no snap)
    let leanDeg = gentle ? 0 : wp.lean + M.clamp(this.wd.acc / top * 0.9, -3, 3) + hf.lean; // leans into a start, rocks back on a stop
    let bob = gentle ? 0 : wp.bob;
    let headBob = gentle ? 0 : wp.headBob;
    let alpha = 1; let rise = 0;
    let deadK = 0;
    if (dead) {
      const df = M.deathFx(this.df, this.deadT);
      sx = M.clampSq(df.sx); sy = M.clampSq(df.sy); leanDeg = 0; bob = 0; headBob = 0; alpha = df.alpha; rise = df.rise; deadK = df.k;
    }
    this.leanS = gentle || dead ? leanDeg * dir : M.easeTo(this.leanS, leanDeg * dir, dt, 0.07); // eases through upright on a turn
    const lean = this.leanS * RAD;
    const ca = Math.cos(lean); const sa = Math.sin(lean);

    // ----- mode: rig (med/high), flat (low, death, iframe flicker frames) -----
    const flick = iframeFlick(p.iframes, sim.time, dead); // DR1: steady, no 12 Hz swap (also under Calm)
    const wantFlat = tier === 'low' || dead || flick;
    if (!this.ready) { this.ready = true; this.es.x = fx; this.es.y = fy - 60 * DU; this.ps.x = fx - dir * 10; this.ps.y = fy + 1; this.mode = ''; }

    // tint (hurt flash / death light)
    let tintMode = 0;
    if (dead) tintMode = deadK > 0.2 ? 3 : 0; else tintMode = hf.tint;
    this.setTint(tintMode);

    // ----- ember: spring-follows its anchor (swings when she turns/stops), gentle bob; reduced motion = bob only -----
    const eAnchorY = dead ? this.df.emberY : ANCHOR.ember[1] + (lowHp ? 14 : 0) + (hf.active && !dead ? 10 : 0);
    const eBob = (Math.sin(this.t * 2.6) * 2.2 + Math.sin(this.t * 4.1 + 1) * 0.8) * (1 - 0.6 * amp); // floats when still, steadier when walking
    this.at(fx, fy, ANCHOR.ember[0] * (lowHp ? 0.8 : 1), eAnchorY + eBob, ca, sa, sx, sy, bob);
    if (gentle) { this.es.x = this._x; this.es.y = this._y; this.es.vx = this.es.vy = 0; } else { const lead = 0.064 * this.wd.v; M.springStep(this.es, this._x + ux * lead, this._y + uy * lead, dt, 220, 0.72, 60); } // soft, well damped, far below the step rate (never bounces with the steps); a velocity lead keeps the old steady walking offset (c/k lag 0.097 s minus 0.033 s), so the softer spring only adds swing on starts, stops and turns
    this.emberX = this.es.x; this.emberY = this.es.y;
    this.at(fx, fy, ANCHOR.scarf[0], ANCHOR.scarf[1], ca, sa, sx, sy, bob); this.scarfX = this._x; this.scarfY = this._y; // W2b trail anchor
    const flicker = gentle ? 1 : 1 + 0.045 * Math.sin(this.t * 17) + 0.03 * Math.sin(this.t * 29);
    const emberDim = hf.active && !dead ? 0.65 : 1;
    this.eGlow.setPosition(this.es.x, this.es.y).setScale((32 / 32) * this.glowInv * flicker * (lowHp ? 0.85 : 1)).setAlpha((dead ? 0.8 * (1 - deadK * 0.2) : 0.85) * emberDim).setVisible(true);

    // ----- apply Wren -----
    const dBase = this.depth + p.y;
    const flat = this.flat;
    if (wantFlat) {
      if (this.mode !== 'flat') { for (const q of this.parts) q.setVisible(false); this.mode = 'flat'; flat.setVisible(true); }
      this.at(fx, fy, 0, 0, ca, sa, sx, sy, bob);
      flat.setPosition(this._x, this._y).setRotation(lean).setScale(sx * FS, sy * FS).setFlipX(dir < 0).setDepth(dBase);
      flat.setAlpha(dead ? alpha : flick ? FLICK_ALPHA : 1);
      if (dead) { this.at(fx, fy - rise * DU, 0, 0, ca, sa, sx, sy, 0); flat.setPosition(this._x, this._y); }
      this.ember.setVisible(false);
    } else {
      if (this.mode !== 'rig') { flat.setVisible(false); for (const q of this.parts) q.setVisible(true); this.mode = 'rig'; this.bootF.setTint(0xc4c8d8); }
      flat.setAlpha(1);
      const fl = dir < 0;
      const tailRot = (REST.tail + 0.5 * this.sps + wp.tailSway) * dir + lean;
      this.at(fx, fy, ANCHOR.tail[0], ANCHOR.tail[1], ca, sa, sx, sy, bob);
      this.tail.setPosition(this._x, this._y).setRotation(tailRot).setScale(K * sx * (1 + 0.35 * this.sps), K * sy).setFlipX(fl).setDepth(dBase);
      const bx = wp.leg * 6.5;
      this.at(fx, fy, ANCHOR.bootFar[0] - bx, ANCHOR.bootFar[1] - wp.lift2 * 5, ca, sa, sx, sy, 0);
      this.bootF.setPosition(this._x, this._y).setRotation(lean).setScale(K * sx, K * sy).setFlipX(fl).setDepth(dBase + 0.001);
      this.at(fx, fy, ANCHOR.bootNear[0] + bx, ANCHOR.bootNear[1] - wp.lift * 5, ca, sa, sx, sy, 0);
      this.bootN.setPosition(this._x, this._y).setRotation(lean).setScale(K * sx, K * sy).setFlipX(fl).setDepth(dBase + 0.002);
      this.at(fx, fy, 0, 0, ca, sa, sx, sy, bob);
      this.body.setPosition(this._x, this._y).setRotation(lean).setScale(K * sx, K * sy).setFlipX(fl).setDepth(dBase + 0.003);
      // head: neck pivot, expression texture, tilt (breathing sway when idle)
      const ex = M.pickExpr(false, hf.active, lowHp, M.isBlink(this.t));
      const X = HEAD_EXPR[ex];
      const idleTilt = gentle ? 0 : wp.nod + (1 - amp) * Math.sin(this.t * 1.3) * 2.5;
      this.at(fx, fy, ANCHOR.neck[0], ANCHOR.neck[1], ca, sa, sx, sy, headBob);
      this.head.setFrame(`w_head_${ex}`).setPosition(this._x, this._y).setRotation(lean + (X.tilt + idleTilt) * RAD * dir).setScale(K * hf.sx * turn, K * hf.sy) // the head never squashes with the steps.setFlipX(fl).setDepth(dBase + 0.004);
      // ember cage rides the spring
      this.ember.setPosition(this.es.x, this.es.y).setScale(K * 0.95 * flicker).setDepth(dBase + 0.005).setVisible(true);
    }
    this.ember.setVisible(this.mode === 'rig');

    // ----- pup: follows at her heel (spring), bounds when moving, sits + tilts its head when she stops -----
    this.updatePup(sim, p, fx, fy, dir, ux, uy, dt, tier, reduced, hf, dead, realDt, caps, parts, dBase);
  }


  updatePup(sim, p, fx, fy, dir, ux, uy, dt, tier, reduced, hf, dead, realDt, caps, parts, dBase) {
    const ps = this.ps;
    M.heelTarget(this.heel, fx, fy, dir, ux, uy, this.sps);
    if (reduced) { ps.x += (this.heel.x - ps.x) * Math.min(1, dt * 6); ps.y += (this.heel.y - ps.y) * Math.min(1, dt * 6); ps.vx = ps.vy = 0; }
    else M.springStep(ps, this.heel.x, this.heel.y, dt, 256, 0.9, 140);
    const pspd = Math.hypot(ps.vx, ps.vy);
    const run = !reduced && !dead && M.pupPose(this.pst, pspd, dt);
    // facing: toward its own motion while bounding; otherwise matches hers
    if (run) { if (ps.vx > 4) this.pdir = 1; else if (ps.vx < -4) this.pdir = -1; } else this.pdir = dir;
    const pd = this.pdir;
    if (run && dt > 0) this.pPhase = M.advancePhase(this.pPhase, pspd * dt, M.PUP_STRIDE);
    const hurt = hf.active && !dead;
    const pexpr = M.pickPupExpr(hurt, run, M.isBlink(this.t * 0.8 + 1.7));
    const dPup = this.depth + (ps.y - FEET);
    this.pupX = ps.x; this.pupY = ps.y;
    // soft light on the lightmap is added by the scene (it knows the lights budget); here: visuals only
    const gk = this.glowInv;
    if (tier === 'low') {
      if (this.pupMode !== 'flat') { for (const q of this.pupParts) q.setVisible(false); this.pGlow.setVisible(false); this.pFlat.setVisible(true); this.pupMode = 'flat'; }
      const key = run ? 'pup_run' : 'pup_sit';
      if (this.pFlat.texture.key !== key) this.pFlat.setTexture(key);
      const bounce = run ? -Math.abs(Math.sin(this.pPhase * M.TAU * 2)) * 0.6 : 0;
      this.pFlat.setPosition(ps.x, ps.y + bounce).setScale(K).setFlipX(pd < 0).setDepth(dPup);
      return;
    }
    if (this.pupMode !== 'rig') { this.pFlat.setVisible(false); for (const q of this.pupParts) q.setVisible(true); this.pGlow.setVisible(true); this.pupMode = 'rig'; }
    const poseKey = run ? 'run' : 'sit';
    const fr = run ? (Math.floor(this.pPhase * 4) & 3) : 0;
    const an = pupAnchors(poseKey, fr);
    const u = PUP_K * DU;
    const fl = pd < 0;
    this.pBody.setFrame(run ? `p_body_run${fr}` : 'p_body_sit').setPosition(ps.x, ps.y).setScale(K).setFlipX(fl).setDepth(dPup);
    // tail wag (sit: wags, curiously more when she is worried; run: streams)
    const wag = run ? Math.sin(this.t * 14) * 0.18 : (reduced ? 0 : Math.sin(this.t * (hurt ? 2 : 6.5)) * (hurt ? 0.08 : 0.34));
    this.pTail.setFrame(run ? 'p_tail_run' : 'p_tail_sit').setPosition(ps.x + an.tail[0] * pd * u, ps.y + an.tail[1] * u).setRotation(wag * pd).setScale(K).setFlipX(fl).setDepth(dPup - 0.001);
    const tilt = run || reduced || hurt ? 0 : M.pupTilt(this.t);
    this.pHead.setFrame(`p_head_${pexpr}`).setPosition(ps.x + (an.headC[0] + PUP_NECK[0]) * pd * u, ps.y + (an.headC[1] + PUP_NECK[1]) * u)
      .setRotation(((run ? 6 : 0) + tilt) * RAD * pd).setScale(K).setFlipX(fl).setDepth(dPup + 0.001);
    // small warm glow so the pup never reads as a smudge (kept on in Med/High; Low bakes it into the flat sprite)
    this.pGlow.setPosition(ps.x, ps.y - 8 * DU * 1.0).setScale((22 / 32) * gk).setAlpha(hurt ? 0.3 : 0.45).setDepth(dPup - 0.002);
    // ember tail-tip comet (not in Low)
    if (run && !reduced && caps.trails > 0 && parts && parts.count < parts.cap * 0.75) {
      this.trailT += dt;
      if (this.trailT > 0.045) { this.trailT = 0; parts.emit(ps.x + an.tail[0] * pd * u - 6 * pd * PUP_K * DU * 3, ps.y + (an.tail[1] - 6) * u, 0, 0, 0.3, 0.55, 0.05, 0xffb84a, 0.55); }
    }
  }

}
