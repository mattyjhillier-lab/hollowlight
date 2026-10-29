// Map events v1 "Hollow Places" render layer (visual only: reads sim.sites + sim events, never writes the sim).
// Shape language (map-events-v1.md section 2): a grey sleeping object with ONE cold ember; awake = a soft cream ring on the ground + a floating
// OFFER BADGE (what it pays, shown before you commit); done = it stays lit / restored with a small lasting glow, and colour floods the life map.
//  - Lamp Post: a thin iron post with a glass head; the badge is ONE reward glyph (gem = XP, coin = gold, heart = heal).
//  - Lantern Road: three lantern posts; a thin warm thread joins the lit ones; the road paints a ribbon of colour when it is done.
//  - Hollow Knot: a knot of black roots with a cold violet core and creeping corruption; HP ring while fighting; the root pulse tell is a
//    filling ring on the ground in the shared danger red (the only red here).
// Edge arrows: at most 2 (the active site, then the nearest awake one), a cream chevron on the view edge outside the HUD bands, with the
// site's icon and 1-3 distance pips; hidden while the site is on screen. No per-frame allocation beyond small fixed arrays.
import { ROLE, PAL } from './palette.js';

const LANTERN = ROLE.lantern, CORE = ROLE.lanternCore, CREAM = PAL.cream, BRASS = PAL.brass, BRASS_D = PAL.brassDark;
const IRON = 0x2b2633, IRON_HI = 0x4a4458, COLD = 0x8fa3ba, INK = 0x1a1020, VEIN = 0x6a58a0, KNOT = 0x221a2c, KNOT_HI = 0x3d2f4f, LIFE = 0x6fae5a;
const POST_K = 1.35; // lamp / lantern posts drawn larger so they read at a glance (visual only)
const SHARD = ROLE.spiritB2, DANGER = ROLE.danger;
export const HUD_TOP = 0.22, HUD_BOT = 0.14, HUD_TOP_TALL = 0.26, HUD_BOT_TALL = 0.16; // locked HUD bands (share of the view height) the arrows keep out of; a portrait phone stacks its HUD taller

// pure: which sites get an arrow (active first, then the nearest awake one), max 2, only if off the view rect
export function arrowTargets(sites, p, view, out = []) {
  out.length = 0;
  if (!sites) return out;
  const off = (x, y) => x < view.x0 || x > view.x1 || y < view.y0 || y > view.y1;
  const act = sites.active;
  if (act) { const q = aimOf(act, p); if (off(q.x, q.y)) out.push({ s: act, x: q.x, y: q.y }); }
  let best = null, bd = Infinity;
  for (const s of sites.list) {
    if (s === act || (s.state !== 'awake' && s.state !== 'calm')) continue;
    const q = aimOf(s, p), d = Math.hypot(q.x - p.x, q.y - p.y);
    if (d < bd) { bd = d; best = { s, x: q.x, y: q.y }; }
  }
  if (best && off(best.x, best.y) && out.length < 2) out.push(best);
  return out;
}
// a road aims at its nearest unlit lantern; anything else at itself
function aimOf(s, p) {
  if (s.kind !== 'road') return s;
  let q = s.lanterns[1], bd = Infinity;
  for (const L of s.lanterns) if (!L.lit) { const d = Math.hypot(L.x - p.x, L.y - p.y); if (d < bd) { bd = d; q = L; } }
  return q;
}
// pure: the point on the view edge (inset, outside the HUD bands) where the hero->target line leaves the view
export function edgePoint(p, t, view, inset = 16) {
  const h = view.y1 - view.y0, tall = h > view.x1 - view.x0;
  const x0 = view.x0 + inset, x1 = view.x1 - inset, y0 = view.y0 + h * (tall ? HUD_TOP_TALL : HUD_TOP) + inset * 0.5, y1 = view.y1 - h * (tall ? HUD_BOT_TALL : HUD_BOT) - inset * 0.5;
  const cx = Math.min(x1, Math.max(x0, p.x)), cy = Math.min(y1, Math.max(y0, p.y)); // the hero may sit outside the inner box (camera lead)
  const dx = t.x - cx, dy = t.y - cy, len = Math.hypot(dx, dy) || 1, ux = dx / len, uy = dy / len;
  const kx = ux > 1e-6 ? (x1 - cx) / ux : ux < -1e-6 ? (x0 - cx) / ux : Infinity;
  const ky = uy > 1e-6 ? (y1 - cy) / uy : uy < -1e-6 ? (y0 - cy) / uy : Infinity;
  const k = Math.max(0, Math.min(kx, ky));
  return { x: cx + ux * k, y: cy + uy * k, ux, uy };
}

export class SiteView {
  constructor(scene, depths) {
    this.scene = scene;
    this.gg = scene.add.graphics().setDepth(depths.ground); // rings, threads, veins, the pulse tell
    this.pg = scene.add.graphics().setDepth(depths.prop); // posts, lanterns, the knot
    this.bg = scene.add.graphics().setDepth(depths.badge); // badges, HP ring
    this.ag = scene.add.graphics().setDepth(depths.arrow); // edge arrows
    this.time = 0; this.corrT = 0; this.arrows = []; this.flood = []; // flood: queued life-map writes { x, y, r, t, x1, y1 } (render only)
  }

  onEvent(ev, life) {
    const sc = this.scene, low = sc.quality && sc.quality.tier === 'low', calm = sc.reducedMotion ? sc.reducedMotion() : false;
    if (ev.type === 'lampLit') {
      sc.addRing(ev.x, ev.y - 18, 4, 34, 0.45, LANTERN, 2);
      if (!low && !calm) sc.burst(ev.x, ev.y - 22, 8, CORE, 50, 0.5, 0.35);
      this.flood.push({ x: ev.x, y: ev.y, r: 90, t: 0, d: 0.5 });
    } else if (ev.type === 'roadLit') {
      sc.addRing(ev.x, ev.y - 20, 4, 44, 0.5, LANTERN, 2);
      if (!low && !calm) sc.burst(ev.x, ev.y - 24, 10, CORE, 60, 0.6, 0.4);
      this.flood.push({ x: ev.x, y: ev.y, r: 120, t: 0, d: 0.6 });
    } else if (ev.type === 'siteDone' && ev.kind === 'road') {
      const s = this.find(ev.id);
      if (s) for (let i = 0; i < s.lanterns.length - 1; i++) { const a = s.lanterns[i], b = s.lanterns[i + 1]; this.flood.push({ x: a.x, y: a.y, x1: b.x, y1: b.y, r: 60, t: -0.15 * i, d: 1.2 }); }
      sc.addRing(ev.x, ev.y - 20, 6, 90, 0.8, CORE, 3);
    } else if (ev.type === 'siteDone' && ev.kind === 'knot') {
      sc.addRing(ev.x, ev.y, 8, 140, 0.9, LANTERN, 3); sc.addRing(ev.x, ev.y, 6, 80, 0.6, CORE, 2, 0.15);
      if (!low && !calm) sc.burst(ev.x, ev.y - 8, 18, CORE, 80, 0.9, 0.5);
      this.flood.push({ x: ev.x, y: ev.y, r: 320, t: 0, d: 1.4 });
      if (sc.stop) sc.stop(0.05);
    } else if (ev.type === 'knotWake') {
      sc.addRing(ev.x, ev.y, 10, 70, 0.6, VEIN, 2);
      if (sc.shake) sc.shake(160, 0.003);
    } else if (ev.type === 'knotPulse') {
      sc.addRing(ev.x, ev.y, 10, 92, 0.35, DANGER, 2);
    } else if (ev.type === 'siteWake') {
      this.wakeT = 3; // the arrows brighten for 3 s (no banner)
    }
  }

  find(id) { const S = this.sim && this.sim.sites; if (S) for (const s of S.list) if (s.id === id) return s; return null; }

  // per frame. view = { x0, y0, x1, y1 } in world units; lm = lightmap (null on Low); life = the LifeMap (render-only writes)
  update(sim, dt, view, tier, calm, lm, life) {
    this.sim = sim; this.time += dt;
    const gg = this.gg, pg = this.pg, bg = this.bg, ag = this.ag;
    gg.clear(); pg.clear(); bg.clear(); ag.clear();
    this.labelOn = false;
    const S = sim.sites;
    if (!S) { if (this.label) this.label.setVisible(false); return; }
    if (this.wakeT > 0) this.wakeT -= dt;
    // colour floods (render only): each write grows over its duration
    if (life) {
      for (let i = this.flood.length - 1; i >= 0; i--) {
        const f = this.flood[i]; f.t += dt;
        if (f.t < 0) continue;
        const k = Math.min(1, f.t / f.d), r = f.r * (calm ? 1 : 0.35 + 0.65 * k);
        if (f.x1 !== undefined) life.stampLine(f.x, f.y, f.x1, f.y1, r, 0.5); else life.stamp(f.x, f.y, r, 0.5);
        if (k >= 1) this.flood.splice(i, 1);
      }
      if ((this.corrT += dt) >= 0.1) { this.corrT = 0; for (const s of S.list) if (s.kind === 'knot' && (s.state === 'awake' || s.state === 'fight' || s.state === 'calm')) life.stampCorr(s.x, s.y, 150, 0.03); }
    }
    const pad = 60, vis = (x, y) => x > view.x0 - pad && x < view.x1 + pad && y > view.y0 - pad && y < view.y1 + pad;
    const pulse = calm ? 0.5 : 0.5 + 0.5 * Math.sin(this.time * 3);
    for (const s of S.list) {
      if (s.state === 'sleep') continue;
      if (s.kind === 'lamp') { if (vis(s.x, s.y)) this.drawLamp(s, pulse, lm); }
      else if (s.kind === 'road') this.drawRoad(s, pulse, lm, vis);
      else if (vis(s.x, s.y)) this.drawKnot(s, sim, pulse, lm, calm);
    }
    this.drawArrows(sim, view);
    if (!this.labelOn && this.label && this.label.visible) this.label.setVisible(false);
  }

  post(x, y, h, lit, ember, k = POST_K) { // k: visual scale only (footprint read at a glance; the sim radius is untouched)
    const pg = this.pg; h *= k;
    pg.fillStyle(INK, 0.35).fillEllipse(x, y + 1, 12 * k, 4 * k); // contact shadow
    pg.fillStyle(IRON, 1).fillRect(x - 1.2 * k, y - h, 2.4 * k, h);
    pg.fillStyle(IRON_HI, 1).fillRect(x - 1.2 * k, y - h, 0.8 * k, h);
    pg.fillStyle(IRON, 1).fillRect(x - 3 * k, y - 1.5 * k, 6 * k, 1.5 * k); // foot
    const gy = y - h - 5 * k;
    pg.fillStyle(IRON, 1).fillRect(x - 4 * k, gy - 5 * k, 8 * k, 1.4 * k); // cap
    pg.fillStyle(lit ? LANTERN : COLD, lit ? 1 : 0.55).fillRoundedRect(x - 3 * k, gy - 3.6 * k, 6 * k, 7.4 * k, 1.5 * k); // glass
    pg.lineStyle(1, lit ? BRASS_D : IRON, 1).strokeRoundedRect(x - 3 * k, gy - 3.6 * k, 6 * k, 7.4 * k, 1.5 * k);
    if (lit) pg.fillStyle(CORE, 1).fillCircle(x, gy, 1.5 * k);
    else pg.fillStyle(ember > 0 ? LANTERN : COLD, ember > 0 ? 0.35 + 0.5 * ember : 0.6).fillCircle(x, gy + 1.5 * k, 1.1 * k); // the one cold ember
    return gy;
  }

  // a dashed ground ellipse (n dashes), used for wake / reach rings
  dashRing(g, x, y, rx, ry, n, w, col, a, rot = 0) {
    g.lineStyle(w, col, a);
    for (let i = 0; i < n; i++) {
      const a0 = rot + (i / n) * Math.PI * 2, a1 = a0 + (Math.PI * 2 / n) * 0.55;
      g.beginPath().moveTo(x + Math.cos(a0) * rx, y + Math.sin(a0) * ry);
      g.lineTo(x + Math.cos((a0 + a1) / 2) * rx, y + Math.sin((a0 + a1) / 2) * ry).lineTo(x + Math.cos(a1) * rx, y + Math.sin(a1) * ry).strokePath();
    }
  }

  // bobbing "go here" chevron pointing down at a place (cream on a dark backing so it reads on any ground)
  hint(x, y, pulse, col = CREAM) {
    const g = this.bg, b = Math.round(pulse * 3);
    g.fillStyle(INK, 0.7).fillTriangle(x - 7.5, y - 10 + b, x + 7.5, y - 10 + b, x, y + 1 + b);
    g.fillStyle(col, 1).fillTriangle(x - 5.5, y - 8 + b, x + 5.5, y - 8 + b, x, y - 1 + b);
  }

  // the one pooled world label ("Destroy the knot"); fixed strings only
  say(txt, x, y) {
    let t = this.label;
    if (!t) { t = this.label = this.scene.add.text(0, 0, '', { fontFamily: 'Georgia, serif', fontSize: '10px', color: '#fff3dc', stroke: '#1a1020', strokeThickness: 3, resolution: 4 }).setOrigin(0.5, 1).setDepth(this.bg.depth + 1); }
    if (t.text !== txt) t.setText(txt);
    t.setPosition(Math.round(x), Math.round(y)).setVisible(true);
    this.labelOn = true;
  }

  drawLamp(s, pulse, lm) {
    const lit = s.state === 'done', awake = s.state === 'awake';
    if (awake) { this.gg.fillStyle(CREAM, 0.07 + 0.05 * pulse).fillEllipse(s.x, s.y + 1, 44, 18); this.gg.lineStyle(2.5, INK, 0.5).strokeEllipse(s.x, s.y + 1, 44, 18); this.gg.lineStyle(2, CREAM, 0.6 + 0.3 * pulse).strokeEllipse(s.x, s.y + 1, 44, 18); } // = the real touch radius (22)
    const gy = this.post(s.x, s.y, 20, lit, awake ? pulse : 0);
    if (lit && lm) lm.add(s.x, gy, 40, LANTERN, 0.6);
    else if (awake && lm) lm.add(s.x, gy, 30, LANTERN, 0.3 + 0.15 * pulse);
    if (awake) this.badge(s.x, gy - 16 * POST_K, [s.reward]);
  }

  drawRoad(s, pulse, lm, vis) {
    const gg = this.gg, live = s.state === 'awake' || s.state === 'active';
    for (let i = 0; i < s.lanterns.length - 1; i++) { // the warm thread between lit neighbours (the old road being relit)
      const a = s.lanterns[i], b = s.lanterns[i + 1];
      if (a.lit && b.lit) gg.lineStyle(2, LANTERN, 0.5).lineBetween(a.x, a.y, b.x, b.y);
    }
    let first = true;
    for (const L of s.lanterns) {
      if (!vis(L.x, L.y)) continue;
      if (live && !L.lit) { gg.fillStyle(CREAM, 0.07 + 0.05 * pulse).fillEllipse(L.x, L.y + 1, 52, 21); gg.lineStyle(2.5, INK, 0.5).strokeEllipse(L.x, L.y + 1, 52, 21); gg.lineStyle(2, CREAM, 0.6 + 0.3 * pulse).strokeEllipse(L.x, L.y + 1, 52, 21); } // = the real touch radius (26)
      const gy = this.post(L.x, L.y, 26, L.lit, live && !L.lit ? pulse : 0);
      this.pg.lineStyle(1.4, IRON, 1).lineBetween(L.x, L.y - 26 * POST_K, L.x + 6, L.y - 26 * POST_K - 5); // a little hook arm: a lantern post, not a lamp post
      if (L.lit && lm) lm.add(L.x, gy, 54, LANTERN, 0.7);
      else if (live && lm) lm.add(L.x, gy, 30, LANTERN, 0.25 + 0.15 * pulse);
      if (live && !L.lit && first) { first = false; this.badge(L.x, gy - 16 * POST_K, s.def.set.bless ? ['gold', 'bless'] : ['gold', 'magnet']); }
    }
  }

  drawKnot(s, sim, pulse, lm, calm) {
    const gg = this.gg, pg = this.pg, x = s.x, y = s.y, K = sim.sites.def.knots;
    if (s.state === 'done') { // restored: living roots and a small lasting warm glow
      pg.fillStyle(LIFE, 0.9).fillEllipse(x, y + 2, 22, 8);
      for (let i = 0; i < 5; i++) { const a = i * 1.257, c = Math.cos(a), sn = Math.sin(a) * 0.5; pg.lineStyle(2, LIFE, 0.8).lineBetween(x + c * 6, y + sn * 6, x + c * 18, y + sn * 18); }
      pg.fillStyle(PAL.cream, 0.9).fillCircle(x, y - 4, 2);
      if (lm) lm.add(x, y - 4, 40, LANTERN, 0.45);
      return;
    }
    if (s.state === 'gone') return;
    const fight = s.state === 'fight' || s.state === 'calm';
    // pulse tell: the ground ring fills in the shared danger red over the 0.8 s windup
    if (s.tell > 0) {
      const k = 1 - s.tell / K.pulse.tell;
      gg.fillStyle(DANGER, 0.12 + 0.18 * k).fillEllipse(x, y + 2, K.pulse.r * 2 * k, K.pulse.r * 1.3 * k);
      gg.lineStyle(2, DANGER, 0.75).strokeEllipse(x, y + 2, K.pulse.r * 2, K.pulse.r * 1.3);
    } else if (fight) gg.lineStyle(1.2, VEIN, 0.35).strokeEllipse(x, y + 2, K.pulse.r * 2, K.pulse.r * 1.3); // the reach of the pulse, quiet between tells
    if (s.state === 'awake') { // wake ring: step inside the dashed ring and it wakes (the real wake distance); a bold ring hugs the knot
      this.dashRing(gg, x, y + 2, K.wake, K.wake * 0.64, 40, 3, INK, 0.35, 0);
      this.dashRing(gg, x, y + 2, K.wake, K.wake * 0.64, 40, 1.8, CREAM, 0.45 + 0.25 * pulse, 0);
      gg.lineStyle(2.5, CREAM, 0.5 + 0.3 * pulse).strokeEllipse(x, y + 2, 70, 28);
    }
    // roots: thick dark curves lying on the ground around a raised core
    const wob = calm ? 0 : Math.sin(this.time * 1.6) * 0.6;
    pg.fillStyle(INK, 0.4).fillEllipse(x, y + 3, 44, 14);
    for (let i = 0; i < 7; i++) {
      const a = i * 0.8976 + 0.3, c = Math.cos(a), sn = Math.sin(a) * 0.45, L = 16 + (i % 3) * 5;
      pg.lineStyle(4 - (i % 2), KNOT, 1).beginPath(); pg.moveTo(x + c * 5, y + sn * 5); pg.lineTo(x + c * L * 0.6 - sn * 4, y + sn * L * 0.6 + c * 2 + wob); pg.lineTo(x + c * L, y + sn * L + 2); pg.strokePath();
    }
    pg.fillStyle(KNOT, 1).fillEllipse(x, y - 5, 20, 18);
    pg.fillStyle(KNOT_HI, 1).fillEllipse(x - 3, y - 9, 8, 6);
    const ek = fight ? 0.6 + 0.4 * pulse : 0.35 + 0.3 * pulse;
    pg.fillStyle(VEIN, ek).fillCircle(x, y - 5, 4);
    pg.fillStyle(0xb9a8ff, ek * 0.8).fillCircle(x, y - 5, 1.6); // the cold core
    if (lm) lm.add(x, y - 5, 22, VEIN, 0.25);
    if (fight && s.maxHp > 0) { // HP ring over it
      const f = Math.max(0, Math.min(1, s.hp / s.maxHp));
      this.bg.lineStyle(4, INK, 0.6).beginPath().arc(x, y - 6, 16, -Math.PI / 2, Math.PI * 1.5).strokePath();
      this.bg.lineStyle(2.4, VEIN, 0.95).beginPath().arc(x, y - 6, 16, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * f).strokePath();
    }
    if (s.state === 'awake' || fight) { // clarity: what it is, what to do, and (while fighting) its health, in the world
      this.hint(x, y - (fight ? 44 : 56), pulse, fight ? VEIN : CREAM);
      this.say(fight ? 'Destroy the knot' : 'Hollow Knot: destroy it', x, y - (fight ? 52 : 64));
      if (fight && s.maxHp > 0) {
        const f = Math.max(0, Math.min(1, s.hp / s.maxHp)), w = 44, bx = Math.round(x - w / 2), by = Math.round(y + 14);
        this.bg.fillStyle(INK, 0.85).fillRect(bx - 1, by - 1, w + 2, 6).fillStyle(VEIN, 1).fillRect(bx, by, Math.max(1, Math.round(w * f)), 4);
      }
    }
    if (s.state === 'awake' || s.state === 'calm') { const W = s.def.reward; this.badge(x, y - 28, W.bless ? (W.shard ? ['bless', 'shard'] : ['bless']) : ['xp', 'gold', 'heart']); }
  }

  // the offer badge: 1-3 round icons on a dark backing (same icon family as the cards / results)
  badge(cx, cy, icons) {
    const n = icons.length, w = 11, x0 = cx - ((n - 1) * w) / 2, g = this.bg;
    g.fillStyle(INK, 0.62).fillRoundedRect(x0 - 7, cy - 7, (n - 1) * w + 14, 14, 7);
    g.lineStyle(1, BRASS_D, 0.8).strokeRoundedRect(x0 - 7, cy - 7, (n - 1) * w + 14, 14, 7);
    for (let i = 0; i < n; i++) this.icon(g, icons[i], x0 + i * w, cy, 1);
  }

  icon(g, kind, x, y, k) {
    if (kind === 'gold') { g.fillStyle(BRASS, 1).fillCircle(x, y, 3.6 * k); g.lineStyle(1, BRASS_D, 1).strokeCircle(x, y, 3.6 * k); g.fillStyle(CREAM, 0.9).fillRect(x - 0.5 * k, y - 2 * k, 1 * k, 4 * k); }
    else if (kind === 'xp') { g.fillStyle(ROLE.pickup, 1).fillTriangle(x, y - 4 * k, x + 3 * k, y, x - 3 * k, y); g.fillStyle(0x3fbf8a, 1).fillTriangle(x, y + 4 * k, x + 3 * k, y, x - 3 * k, y); }
    else if (kind === 'heart') { g.fillStyle(ROLE.heart, 1).fillCircle(x - 1.6 * k, y - 1 * k, 2 * k).fillCircle(x + 1.6 * k, y - 1 * k, 2 * k).fillTriangle(x - 3.5 * k, y - 0.4 * k, x + 3.5 * k, y - 0.4 * k, x, y + 3.6 * k); }
    else if (kind === 'bless') { g.fillStyle(CREAM, 1).fillRoundedRect(x - 2.8 * k, y - 3.8 * k, 5.6 * k, 7.6 * k, 1); g.lineStyle(1, BRASS, 1).strokeRoundedRect(x - 2.8 * k, y - 3.8 * k, 5.6 * k, 7.6 * k, 1); g.fillStyle(BRASS, 1).fillCircle(x, y, 1.2 * k); }
    else if (kind === 'shard') { g.fillStyle(SHARD, 1).fillTriangle(x, y - 4.2 * k, x + 2.6 * k, y + 0.6 * k, x - 2.6 * k, y + 0.6 * k); g.fillStyle(0x8a6fe0, 1).fillTriangle(x, y + 4 * k, x + 2.6 * k, y + 0.6 * k, x - 2.6 * k, y + 0.6 * k); }
    else if (kind === 'magnet') { g.lineStyle(2 * k, ROLE.magnet, 1).beginPath().arc(x, y - 0.5 * k, 2.8 * k, Math.PI, 0, false).strokePath(); g.fillStyle(CREAM, 1).fillRect(x - 3.8 * k, y - 0.5 * k, 2 * k, 2.4 * k).fillRect(x + 1.8 * k, y - 0.5 * k, 2 * k, 2.4 * k); }
    else if (kind === 'road') { g.fillStyle(LANTERN, 1).fillRoundedRect(x - 2.4 * k, y - 3 * k, 4.8 * k, 6 * k, 1); g.fillStyle(CORE, 1).fillCircle(x, y, 1.2 * k); }
    else if (kind === 'knot') { g.fillStyle(VEIN, 1).fillCircle(x, y, 3 * k); g.fillStyle(0xb9a8ff, 1).fillCircle(x, y, 1.2 * k); }
  }

  drawArrows(sim, view) {
    const p = sim.player, ag = this.ag, list = arrowTargets(sim.sites, p, view, this.arrows);
    const bright = this.wakeT > 0 ? 1 : 0.8;
    for (const a of list) {
      const e = edgePoint(p, a, view), d = Math.hypot(a.x - p.x, a.y - p.y), pips = d < 900 ? 1 : d < 1600 ? 2 : 3;
      const ux = e.ux, uy = e.uy, nx = -uy, ny = ux, qx = e.x, qy = e.y, act = a.s === sim.sites.active;
      ag.fillStyle(INK, 0.7 * bright).fillCircle(qx - ux * 6, qy - uy * 6, 9);
      ag.fillStyle(act ? LANTERN : CREAM, bright).fillTriangle(qx + ux * 6, qy + uy * 6, qx + nx * 5, qy + ny * 5, qx - nx * 5, qy - ny * 5);
      const kind = a.s.kind === 'lamp' ? a.s.reward : a.s.kind === 'road' ? 'road' : 'knot';
      this.icon(ag, kind, qx - ux * 6, qy - uy * 6, 1.05);
      for (let i = 0; i < pips; i++) ag.fillStyle(CREAM, 0.85 * bright).fillCircle(qx - ux * 18 + nx * (i - (pips - 1) / 2) * 4, qy - uy * 18 + ny * (i - (pips - 1) / 2) * 4, 1.2);
    }
  }
}
