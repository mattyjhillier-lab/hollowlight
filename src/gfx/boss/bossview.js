// ELDER TREANT fight rendering (B1 arena + camera + arrival, B2 tells, B3 boss sprite, B4 victory beat). VISUAL ONLY: reads sim state
// (sim.fight, sim.boss), never writes it. Phaser objects are pooled and created once; no per-frame allocation in update()/drawTells().
// docs/design/boss-treant-v1.md (all option A, LOCKED 2026-10-20) + damage-readability-v1 (DR2: only a warning that will reach the hero is
// bright, dark rim under every decal, red-orange only on decals, the boss body never turns red, amber eyes) + visibility-arc (boss always lit).
// Calm motion (reducedMotion): no shake, no slow-mo, no root sweep animation (the ring is simply there), the flood is a 1 s fade.
import { tellHits } from '../../sim/boss.js';
import { TELL_RO } from '../enemytells.js';
import { TELE_FAINT } from '../telebudget.js';
import { bake, frameFor, framesFor, BOSS_ATLAS, POD_KEY, SAP_KEY, ADD_TEX, ADD_K, ADD_FOOT, ADD_WPD, TPW, BAKE_AT, layout } from './bossart.js';

const TAU = Math.PI * 2;
const RIM = 0x1a1020;
const AMBER = 0xffb84a;
const COLD = 0xcfdcff;
export const ROOTS = { high: 110, med: 70, low: 36 }; // pooled root spikes along the ring (sheet (b) Low-tier cost)
export const FIGHT_ZOOM = 0.92; // -8% for the fight (desktop / landscape)
export const PORTRAIT_VIEW_W = 300; // phone portrait: zoom out until the view is ~300 u wide (review finding 11)
export const CAM_PAD = 40; // the view never shows more than this past the wall
export const BEAT = { ring0: 0.3, ring1: 1.5, rise0: 1.0, rise1: 3.0, zoomIn: 1.5 };
// victory timeline (s after the killing blow; sheet (e) A)
export const VIC = { stop: 0.12, kneel: 1.2, mask: 1.8, leaf: 2.6, flood: 4.6, line: 6.0, skipAfter: 1.5, speed: 420, calmFlood: 1.0 };
export const BARK_LINE = { wren: 'We made it, pup.', elias: 'Rest now, old friend.' }; // in-world hero line at the victory (3-6 words; placeholder until Matt writes his own)

// ---------------------------------------------------------------- pure helpers (unit-tested)
// zoom multiplier for the fight: -8%, or (portrait) whatever makes the view PORTRAIT_VIEW_W wide (never zooms IN)
export function fightZoomK(viewW, viewH) {
  if (!(viewW > 0 && viewH > 0)) return FIGHT_ZOOM;
  if (viewH > viewW) return Math.min(FIGHT_ZOOM, viewW / PORTRAIT_VIEW_W);
  return FIGHT_ZOOM;
}
// clamp the camera target so the view (half extents hw, hh) shows at most CAM_PAD past the ring's bounding box
export function camClamp(tx, ty, A, hw, hh, out) {
  const mx = Math.max(0, A.r + CAM_PAD - hw), my = Math.max(0, A.r + CAM_PAD - hh);
  out[0] = Math.min(A.cx + mx, Math.max(A.cx - mx, tx));
  out[1] = Math.min(A.cy + my, Math.max(A.cy - my, ty));
  return out;
}
// display clock during the victory beat: held 840 until the flood, then runs to 900 (dawn) across it
export function victoryClock(bossAt, runSeconds, t, calm) {
  const t0 = VIC.leaf, dur = calm ? VIC.calmFlood : VIC.flood - VIC.leaf;
  const k = Math.max(0, Math.min(1, (t - t0) / dur));
  return bossAt + (runSeconds - bossAt) * k;
}
// root i of n: angle (sweep order from the boss's side), height jitter, lean (deterministic, no RNG)
const hash = (n) => { let h = (n | 0) * 0x9e3779b1; h ^= h >>> 15; h = Math.imul(h, 0x85ebca77); h ^= h >>> 13; return (h >>> 0) / 4294967296; };
export function rootSpec(i, n, out) {
  out.a = (i / n) * TAU + (hash(i * 3 + 1) - 0.5) * (TAU / n) * 0.6;
  out.h = 0.7 + 0.6 * hash(i * 7 + 5);
  out.lean = (hash(i * 11 + 2) - 0.5) * 0.5;
  out.d = (hash(i * 13 + 9) - 0.5) * 10; // radial jitter (u)
  return out;
}
// eruption sweep: root at angle a appears when the sweep (starting at angle a0) reaches it, over ring0..ring1
export function rootRise(a, a0, t, calm) {
  if (calm) return t >= BEAT.ring0 ? 1 : 0;
  let da = (a - a0) % TAU; if (da < 0) da += TAU;
  const at = BEAT.ring0 + (da / TAU) * (BEAT.ring1 - BEAT.ring0);
  return Math.max(0, Math.min(1, (t - at) / 0.25));
}

// ---------------------------------------------------------------- the view
export class BossView {
  constructor(scene, depths) {
    this.s = scene;
    this.D = depths; // { lit, ground, tele }
    this.ring = scene.add.graphics().setDepth(depths.ground);
    this.grey = scene.add.graphics().setDepth(depths.ground + 1);
    this.roots = [];
    this.rootTex = makeRootTexture(scene);
    this.spec = { a: 0, h: 0, lean: 0, d: 0 };
    this.body = null; this.eyes = []; this.chest = null;
    this.flat = null;
    this.baked = { tier: null, ok: false, busy: false, names: new Set(), L: null, info: null };
    this.line = scene.add.text(0, 0, '', { fontFamily: 'Georgia, serif', fontSize: '28px', color: '#fff3d6', stroke: '#1d1424', strokeThickness: 6, align: 'center' }).setOrigin(0.5, 1).setDepth(depths.tele - 1).setVisible(false);
    this._c = [0, 0];
    ensureAddTextures(scene);
    // any key or tap after VIC.skipAfter skips the rest of the victory beat
    const skip = () => this.requestSkip();
    if (scene.input && scene.input.keyboard) scene.input.keyboard.on('keydown', skip);
    if (scene.input) scene.input.on('pointerdown', skip);
    this.reset(null);
  }

  reset(sim) {
    this.sim = sim;
    this.wakeT = -1; // render seconds since the arrival (-1 = none)
    this.vicT = -1; // render seconds since the killing blow
    this.skip = false;
    this.zk = 1;
    this.a0 = 0;
    this.ring.clear(); this.grey.clear();
    for (const r of this.roots) r.setVisible(false);
    if (this.body) this.body.setVisible(false);
    for (const e of this.eyes) e.setVisible(false);
    if (this.chest) this.chest.setVisible(false);
    this.line.setVisible(false);
    this.flooded = false;
    this.shakeAt = -1;
    this.ashSeen = new WeakSet();
  }

  // lazy bake (B3): at BAKE_AT on the run clock, once per quality tier
  maybeBake(sim, tier) {
    const B = this.baked;
    if (B.busy || (B.ok && B.tier === tier) || sim.time < BAKE_AT - 1 || typeof document === 'undefined') return;
    B.busy = true;
    const L = layout(tier);
    bake(this.s, tier).then((r) => {
      B.busy = false; B.info = r;
      if (!r.ok) return;
      B.ok = true; B.tier = tier; B.L = L; B.names = new Set(framesFor(tier).map((f) => f[0]));
      if (!this.body) this.body = this.s.add.image(0, 0, BOSS_ATLAS, 'p1').setVisible(false);
      else this.body.setTexture(BOSS_ATLAS, 'p1');
      this.body.setOrigin(L.frames.p1.ox / L.frames.p1.w, L.frames.p1.oy / L.frames.p1.h).setScale(1 / TPW[tier]);
    });
  }

  get live() { return !!(this.sim && this.sim.fight); }
  // camera zoom multiplier (eased in over the arrival beat)
  zoomK() { return this.zk; }
  // display clock (HUD is DOM-side and reads sim.clock; the scene's arc / AL-6 read this one so the victory flood can run it to dawn)
  clock(sim) {
    if (!sim) return 0;
    if (this.vicT >= 0 && sim.fight) return victoryClock(sim.chapter.bossAt, sim.balance.runSeconds, this.vicT, this.calm);
    return Number.isFinite(sim.clock) ? sim.clock : sim.time;
  }
  // render-side: is the victory flood playing (AL-6 victory flush, birds)?
  floodOn() { return this.vicT >= VIC.leaf; }
  // seconds the results screen should still wait (0 = show now); any key/tap after VIC.skipAfter skips
  endWait(sim) {
    if (!sim || sim.state !== 'victory' || !sim.fight) return 0;
    if (this.vicT < 0) return VIC.line;
    if (this.skip && this.vicT >= VIC.skipAfter) return 0;
    return Math.max(0, VIC.line - this.vicT);
  }
  requestSkip() { if (this.vicT >= VIC.skipAfter) this.skip = true; }

  camTarget(px, py, hw, hh) {
    const F = this.sim && this.sim.fight;
    if (!F || this.wakeT < 0) { this._c[0] = px; this._c[1] = py; return this._c; }
    return camClamp(px, py, F.arena, hw, hh, this._c);
  }

  onEvent(ev) {
    const sim = this.sim;
    if (!sim) return;
    if (ev.type === 'bossWake') {
      this.wakeT = 0;
      const F = sim.fight;
      this.a0 = Math.atan2(F.arena.by - F.arena.cy, F.arena.bx - F.arena.cx);
      if (!this.calm) this.s.shake(260, 0.004); // soft ground tremor
    } else if (ev.type === 'bossHit' && !this.calm) {
      if (ev.move === 'slam') this.s.shake(170, 0.006);
      else if (ev.move === 'lanes' || ev.move === 'eruption') this.s.shake(110, 0.003);
    } else if (ev.type === 'bossPhase') {
      const b = sim.boss;
      if (b) { this.s.addRing(b.x, b.y - 30, 10, 120, 0.6, COLD, 2); if (!this.calm) this.s.shake(240, 0.005); }
    } else if (ev.type === 'bossDead') {
      this.vicT = 0;
      if (!this.calm) { this.s.hitStop = VIC.stop; this.s.flash(0xffffff, 0.18, 0.25); } // 120 ms hit-stop + a soft white tick (sheet (e); no full-screen whiteout)
    }
  }

  // per frame (render dt). caps = quality caps, tier = 'high'|'med'|'low', calm = reduced motion, lm = lightmap (or null), life = LifeMap
  update(sim, dt, tier, calm, lm, life, view) {
    this.sim = sim; this.calm = calm;
    if (!sim) return;
    this.maybeBake(sim, tier);
    const F = sim.fight;
    if (!F) { if (this.zk !== 1) this.zk = 1; return; }
    if (this.wakeT < 0) { this.wakeT = 0; const A = F.arena; this.a0 = Math.atan2(A.by - A.cy, A.bx - A.cx); } // a run loaded mid-fight (debug ?t=)
    this.wakeT += dt;
    if (this.vicT >= 0 && !(this.s.hitStop > 0)) this.vicT += dt; // the 120 ms hit-stop holds the beat
    const A = F.arena;
    // zoom: ease to the fight zoom over the beat; back to 1 as the flood ends
    const target = this.vicT >= VIC.flood ? 1 : fightZoomK(view.width / Math.max(1e-6, this.zk), view.height / Math.max(1e-6, this.zk));
    const kz = calm ? 1 : Math.min(1, dt / 0.6);
    this.zk += (target - this.zk) * kz;
    this.drawAsh(F, tier, calm);
    this.drawRing(sim, A, tier, calm, life);
    this.drawBoss(sim, tier, calm, lm);
    if (this.vicT >= 0) this.victory(sim, A, calm, life, view);
  }

  // foes crumbling to ash (the arrival and the killing blow): a few grey motes rise where each stood (render only; capped per frame; none on Low / Calm)
  drawAsh(F, tier, calm) {
    if (!F.ash.length || calm || tier === 'low' || !this.s.parts) return;
    let n = 0;
    const cap = tier === 'high' ? 60 : 30;
    for (const a of F.ash) {
      if (this.ashSeen.has(a)) continue;
      this.ashSeen.add(a);
      if (n++ >= cap) continue;
      for (let k = 0; k < 2; k++) this.s.parts.emit(a.x + (k ? 3 : -3), a.y - 4, (k ? 6 : -6), -22, 0.9, 0.7, 0.05, 0x9a96a4, 0.6);
    }
  }

  drawRing(sim, A, tier, calm, life) {
    const g = this.ring, gr = this.grey;
    g.clear(); gr.clear();
    const t = this.wakeT, sink = this.vicT >= VIC.mask ? Math.min(1, (this.vicT - VIC.mask) / 0.8) : 0;
    const form = calm ? (t >= BEAT.ring0 ? 1 : 0) : Math.max(0, Math.min(1, (t - BEAT.ring0) / (BEAT.ring1 - BEAT.ring0)));
    // arrival warning: a dashed red-orange ring tell for the first moment (the wall forming), fading as the roots rise
    if (t < BEAT.ring1 + 0.3 && this.vicT < 0) {
      const a = (1 - Math.max(0, (t - BEAT.ring1) / 0.3)) * 0.85;
      g.lineStyle(4, RIM, 0.5 * a);
      g.strokeCircle(A.cx, A.cy, A.r);
      g.lineStyle(2, TELL_RO, a);
      for (let i = 0; i < 48; i++) { if (i % 2) continue; const a0 = (i / 48) * TAU, a1 = ((i + 1) / 48) * TAU; g.beginPath(); g.arc(A.cx, A.cy, A.r, a0, a1); g.strokePath(); }
    }
    // the dark corruption band under the roots (forms with the sweep, sinks at the victory)
    if (form > 0 && sink < 1) {
      const k = form * (1 - sink);
      g.lineStyle(26, 0x1c1826, 0.42 * k).strokeCircle(A.cx, A.cy, A.r + 6);
      g.lineStyle(10, 0x2a2232, 0.55 * k).strokeCircle(A.cx, A.cy, A.r + 2);
    }
    // outside stays grey and still: a cool grey wash over the ground beyond the wall (a very wide stroke = a donut), lifts with the flood
    const fl = this.floodR;
    const washA = (this.vicT >= VIC.leaf ? Math.max(0, 1 - (this.vicT - VIC.leaf) / (calm ? VIC.calmFlood : 1.6)) : form) * 0.34;
    if (washA > 0.01) { const inner = Math.max(A.r + 10, fl || 0), W = 1500; gr.lineStyle(W, 0x8a90a0, washA).strokeCircle(A.cx, A.cy, inner + W / 2); }
    // root spikes (pooled sprites, depth-sorted with the creatures)
    const n = ROOTS[tier] || ROOTS.low;
    const s = this.spec;
    for (let i = 0; i < n; i++) {
      let r = this.roots[i];
      if (!r) { r = this.roots[i] = this.s.add.image(0, 0, this.rootTex).setOrigin(0.5, 1).setVisible(false); }
      rootSpec(i, n, s);
      const up = rootRise(s.a, this.a0, t, calm) * (1 - sink);
      if (up <= 0.01) { if (r.visible) r.setVisible(false); continue; }
      const x = A.cx + Math.cos(s.a) * (A.r + 6 + s.d), y = A.cy + Math.sin(s.a) * (A.r + 6 + s.d);
      r.setPosition(x, y).setScale(0.5 * (0.8 + 0.4 * s.h), 0.5 * s.h * up).setRotation(s.lean * 0.6 + Math.cos(s.a) * 0.18).setDepth(this.D.lit + y).setVisible(true);
      if (tier !== 'low' && life && i % 6 === 0 && up < 1 && !calm) life.stampCorr(x, y, 22, 0.02);
    }
    for (let i = n; i < this.roots.length; i++) if (this.roots[i].visible) this.roots[i].setVisible(false);
    // lingering brush (lane roots, slam spikes): low dark root stubs, slowing but never solid
    const F = sim.fight;
    for (const b of F.brush) {
      const k = Math.min(1, b.ttl / 0.4) * Math.min(1, (b.max - b.ttl) / 0.15);
      if (b.kind === 'disc') { g.fillStyle(0x2a2232, 0.75 * k).fillCircle(b.x, b.y, b.r); g.lineStyle(2, 0x6d6878, 0.8 * k).strokeCircle(b.x, b.y, b.r * 0.6); }
      else {
        const px = -b.ay * b.w / 2, py = b.ax * b.w / 2, x1 = b.x + b.ax * b.len, y1 = b.y + b.ay * b.len;
        g.fillStyle(0x2a2232, 0.55 * k);
        g.fillTriangle(b.x + px, b.y + py, x1 + px, y1 + py, x1 - px, y1 - py);
        g.fillTriangle(b.x + px, b.y + py, x1 - px, y1 - py, b.x - px, b.y - py);
        g.lineStyle(2, 0x6d6878, 0.7 * k);
        for (let d = 8; d < b.len; d += 16) g.lineBetween(b.x + b.ax * d - py * 0.5, b.y + b.ay * d + px * 0.5, b.x + b.ax * (d + 7) + py * 0.3, b.y + b.ay * (d + 7) - px * 0.3);
      }
    }
  }

  drawBoss(sim, tier, calm, lm) {
    const b = sim.boss, B = this.baked;
    const show = b && (!b.dead || this.vicT >= 0) && B.ok && this.body;
    if (!show) { if (this.body) this.body.setVisible(false); this.usingArt = false; return; }
    this.usingArt = true;
    const F = sim.fight, I = F.def.intro;
    // rise out of the soil over the beat (rise0..rise1 from the arrival = the boss's own 0..2 s)
    const up = F.stage === 'intro' && !calm ? Math.max(0.05, Math.min(1, (F.introT - I.freezeAt) / (I.beat - I.freezeAt))) : 1;
    const deathK = this.vicT >= 0 ? Math.min(1, this.vicT / VIC.leaf) : -1;
    const name = frameFor(B.names, F.phase, b.pose || '', deathK);
    if (this.body.frame.name !== name) {
      this.body.setFrame(name);
      const fr = B.L.frames[name];
      this.body.setOrigin(fr.ox / fr.w, fr.oy / fr.h);
    }
    const sway = calm || deathK >= 0 ? 0 : Math.sin(sim.time * 0.9 + 0.4) * 0.018 * (b.pose ? 0.3 : 1);
    const sc = 1 / TPW[B.tier];
    this.body.setPosition(b.x, b.y + 4).setScale(sc, sc * up).setRotation(sway).setFlipX(b.x > sim.player.x).setDepth(this.D.lit + b.y).setVisible(true);
    this.body.setAlpha(up < 1 ? 0.6 + 0.4 * up : 1);
  }

  // B2 tells: called by the scene with its telegraph Graphics (above the vignette). DR2: full strength only where the hero will be hit.
  drawTells(g, sim, calm) {
    const F = sim.fight;
    if (!F || !F.tells.length) { this.drawArrow(g, sim); return; }
    const p = sim.player, now = sim.time;
    for (const t of F.tells) {
      const k = Math.max(0, Math.min(1, (now - t.t0) / Math.max(0.01, t.t1 - t.t0)));
      const thr = t.harm && tellHits(t, p.x, p.y, p.r);
      const f = !t.harm ? 0.6 : thr ? 1 : TELE_FAINT;
      if (t.shape === 'disc') {
        // the full zone outlined from the first frame; an inner disc fills from the centre over the tell; capped fill under the hero (DR2)
        const fillA = thr ? 0.12 : 0.2 * f;
        g.fillStyle(TELL_RO, 0.06 * f).fillCircle(t.x, t.y, t.r);
        g.fillStyle(TELL_RO, fillA).fillCircle(t.x, t.y, Math.max(1, t.r * k));
        g.lineStyle(3.5, RIM, 0.45 * f).strokeCircle(t.x, t.y, t.r);
        g.lineStyle(1.8, TELL_RO, (0.55 + 0.4 * k) * f).strokeCircle(t.x, t.y, t.r);
      } else if (t.shape === 'cone') {
        const a = Math.atan2(t.ay, t.ax), h = t.arc / 2;
        g.fillStyle(TELL_RO, (thr ? 0.1 : 0.16) * f);
        g.slice(t.x, t.y, t.r, a - h, a + h, false); g.fillPath();
        g.fillStyle(TELL_RO, (thr ? 0.1 : 0.18) * f);
        g.slice(t.x, t.y, t.r * k, a - h, a + h, false); g.fillPath();
        g.lineStyle(3.5, RIM, 0.45 * f); g.slice(t.x, t.y, t.r, a - h, a + h, false); g.strokePath();
        g.lineStyle(1.8, TELL_RO, (0.55 + 0.4 * k) * f); g.slice(t.x, t.y, t.r, a - h, a + h, false); g.strokePath();
      } else if (t.shape === 'lane') {
        const px = -t.ay * t.w / 2, py = t.ax * t.w / 2, x1 = t.x + t.ax * t.len, y1 = t.y + t.ay * t.len;
        g.fillStyle(TELL_RO, (thr ? 0.1 : 0.08 + 0.1 * k) * f);
        g.fillTriangle(t.x + px, t.y + py, x1 + px, y1 + py, x1 - px, y1 - py);
        g.fillTriangle(t.x + px, t.y + py, x1 - px, y1 - py, t.x - px, t.y - py);
        g.lineStyle(3, RIM, 0.4 * f); g.lineBetween(t.x + px, t.y + py, x1 + px, y1 + py); g.lineBetween(t.x - px, t.y - py, x1 - px, y1 - py);
        g.lineStyle(1.6, TELL_RO, (0.5 + 0.45 * k) * f); g.lineBetween(t.x + px, t.y + py, x1 + px, y1 + py); g.lineBetween(t.x - px, t.y - py, x1 - px, y1 - py);
        // ground cracks along the lane centre, growing with the tell
        g.lineStyle(1.2, TELL_RO, 0.7 * f);
        for (let d = 0; d < t.len * k; d += 14) g.lineBetween(t.x + t.ax * d, t.y + t.ay * d, t.x + t.ax * (d + 8) + px * 0.25, t.y + t.ay * (d + 8) + py * 0.25);
      } else if (t.shape === 'pod') {
        // harmless landing ring of a seed pod (where an add will appear): faint, dashed, never bright
        g.lineStyle(1.2, TELL_RO, 0.35 + 0.2 * k);
        for (let i = 0; i < 8; i += 2) { g.beginPath(); g.arc(t.x, t.y, t.r, (i / 8) * TAU, ((i + 1) / 8) * TAU); g.strokePath(); }
      } else if (t.shape === 'fan') {
        // aim ticks: n short dashed spokes from the chest along the locked aim (Piper style), growing with the tell
        const a0 = Math.atan2(t.ay, t.ax), half = (t.n - 1) / 2, len = 30 + 50 * k;
        const inFan = Math.abs(angDiff(Math.atan2(p.y - t.y, p.x - t.x), a0)) < t.arc * half + 0.15;
        g.lineStyle(1.3, TELL_RO, (0.4 + 0.5 * k) * (inFan ? 1 : TELE_FAINT));
        for (let i = 0; i < t.n; i++) { const a = a0 + (i - half) * t.arc, c = Math.cos(a), s = Math.sin(a); for (let d = 26; d < 26 + len; d += 9) g.lineBetween(t.x + c * d, t.y + s * d, t.x + c * (d + 5), t.y + s * (d + 5)); }
      } else if (t.shape === 'nova') {
        // the ring of thorns: spokes where thorns will fly, the GAPS left clear (stand in a gap or go far)
        const slots = t.n + 2 * t.gaps, step = TAU / slots, per = slots / t.gaps;
        g.lineStyle(1.3, TELL_RO, (0.35 + 0.5 * k));
        for (let s = 0; s < slots; s++) {
          if (((s % per) + per) % per < 2 - 1e-9) continue;
          const a = t.rot + s * step, c = Math.cos(a), sn = Math.sin(a);
          g.lineBetween(t.x + c * 40, t.y + sn * 40, t.x + c * (46 + 30 * k), t.y + sn * (46 + 30 * k));
        }
        g.lineStyle(3, RIM, 0.3).strokeCircle(t.x, t.y, 40);
      }
    }
    this.drawArrow(g, sim);
  }

  // amber edge arrow to the boss when it is off view (phones, portrait)
  drawArrow(g, sim) {
    const b = sim.boss, cam = this.s.cameras.main, wv = cam.worldView;
    if (!b || b.dead || !sim.fight || sim.fight.stage === 'over') return;
    if (b.x > wv.x + 8 && b.x < wv.right - 8 && b.y - 40 > wv.y && b.y < wv.bottom - 8) return;
    const cx = wv.centerX, cy = wv.centerY, dx = b.x - cx, dy = b.y - 30 - cy;
    const sx = (wv.width / 2 - 16) / Math.max(1e-6, Math.abs(dx)), sy = (wv.height / 2 - 16) / Math.max(1e-6, Math.abs(dy)), s = Math.min(sx, sy);
    const x = cx + dx * s, y = cy + dy * s, a = Math.atan2(dy, dx), c = Math.cos(a), n = Math.sin(a);
    g.fillStyle(RIM, 0.7).fillTriangle(x + c * 9, y + n * 9, x - c * 6 - n * 8, y - n * 6 + c * 8, x - c * 6 + n * 8, y - n * 6 - c * 8);
    g.fillStyle(AMBER, 0.95).fillTriangle(x + c * 7, y + n * 7, x - c * 4 - n * 6, y - n * 4 + c * 6, x - c * 4 + n * 6, y - n * 4 - c * 6);
  }

  // B4 victory beat: kneel, mask falls, leaf + colour down the trunk (death frames), then the radial flood of life over the view and the map
  victory(sim, A, calm, life, view) {
    const t = this.vicT, b = sim.boss;
    const bx = b ? b.x : A.cx, by = b ? b.y : A.cy;
    if (t >= VIC.leaf && life) {
      const ft = t - VIC.leaf;
      const R = calm ? 4000 : Math.min(4000, ft * VIC.speed);
      this.floodR = R;
      if (!this.flooded) {
        life.stampFloor(bx, by, Math.max(60, R * 1.15), 1); // soft edge leads the wave
        if (R >= Math.hypot(view.width, view.height) * 0.6 + 200 || calm) { life.floor.fill(1); life.life.fill(1); life.corr.fill(0); life.rowAct.fill(1); life.dirty = true; this.flooded = true; } // the whole map restored (render only)
      }
    }
    if (t >= VIC.flood - 0.2 && !this.line.visible && this.sim) {
      const p = sim.player, txt = BARK_LINE[sim.characterId] || '';
      if (txt) this.line.setText(txt).setPosition(p.x, p.y - 22).setScale(0.25).setAlpha(0).setVisible(true);
    }
    if (this.line.visible) this.line.setAlpha(Math.min(1, (t - VIC.flood + 0.2) / 0.3));
  }
}

const angDiff = (a, b) => { let d = a - b; while (d > Math.PI) d -= TAU; while (d < -Math.PI) d += TAU; return d; };

// a root spike texture (pale bark tip, dark root, a thorn), drawn once with Graphics (Husk palette)
function makeRootTexture(scene) {
  const key = 'boss_root';
  if (scene.textures.exists(key)) return key;
  const g = scene.make.graphics({ x: 0, y: 0 }, false);
  const W = 28, H = 64;
  g.fillStyle(0x161221, 1); g.fillTriangle(2, H, W - 2, H, W * 0.55, 2); // ink outline
  g.fillStyle(0x3d3c46, 1); g.fillTriangle(5, H - 1, W - 5, H - 1, W * 0.55, 6); // bark
  g.fillStyle(0x5f5f69, 1); g.fillTriangle(8, H - 2, W * 0.5, H - 2, W * 0.53, 12); // lit side
  g.fillStyle(0xc8c3ad, 0.9); g.fillTriangle(W * 0.46, 22, W * 0.62, 22, W * 0.55, 7); // pale bark tip
  g.fillStyle(0x3a3346, 1); g.fillTriangle(W - 6, H * 0.55, W + 0, H * 0.45, W - 9, H * 0.62); // thorn
  g.generateTexture(key, W + 2, H);
  g.destroy();
  return key;
}

// the pod / sapling textures: blank canvases now (pools can be built at create), painted by the bake; a simple placeholder until then
function ensureAddTextures(scene) {
  for (const [key, col] of [[POD_KEY, 0x6d6658], [SAP_KEY, 0x5a5868]]) {
    if (scene.textures.exists(key)) continue;
    const t = scene.textures.createCanvas(key, ADD_TEX, ADD_TEX);
    const c = t.getContext();
    c.fillStyle = '#' + col.toString(16).padStart(6, '0');
    c.beginPath(); c.ellipse(ADD_TEX / 2, ADD_FOOT - 10, 10, 11, 0, 0, TAU); c.fill();
    t.refresh();
  }
}
export const ADD_SCALE = ADD_WPD / ADD_K; // world units per texel for the add textures
export const ADD_ORIGIN = [0.5, ADD_FOOT / ADD_TEX];
