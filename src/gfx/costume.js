// WARDROBE v2 Ring Keepsake costumes drawn on the REAL hero rigs (wrenart.js / eliasart.js): a palette swap on the rig's own colour table plus ONE
// motif overlay per ring. Silhouettes never change (same shapes, same frames, same hitboxes); zero power. Browser-only (Canvas2D) like the rig art.
// The run bakes a costume ONCE into the existing rig textures (rigtex.js paintCostume), so the per-frame path is identical to the plain hero.
// The Wear drawer preview draws the same functions live. Colours and motif ids come from validated cosmetics.json (#rrggbb, whitelisted motifs).
import * as WA from './wrenart.js';
import * as EA from './eliasart.js';

const HEX = /^#[0-9a-f]{6}$/i;
const ORIG = { wren: { ...WA.PAL2 }, elias: { ...EA.PE } }; // the plain palettes, captured at load (nothing else ever edits them)
const PAL = (hero) => (hero === 'wren' ? WA.PAL2 : EA.PE);
const F = (n) => +n.toFixed(1);
const starPath = (x, y, R, r) => { let d = ''; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, q = i % 2 ? r : R; d += (i ? 'L' : 'M') + F(x + Math.cos(a) * q) + ' ' + F(y + Math.sin(a) * q); } return d + 'Z'; };
export const okCost = (c) => !!c && ['base', 'second', 'mantle', 'accent', 'trim', 'glow'].every((k) => typeof c[k] === 'string' && HEX.test(c[k])) && Array.isArray(c.motifs);

/** Runs fn with the hero's rig palette swapped to the costume (null = plain); the palette is ALWAYS restored. */
export function withCostume(hero, cost, fn) {
  const P = PAL(hero);
  Object.assign(P, ORIG[hero]);
  try {
    if (okCost(cost)) {
      if (hero === 'wren') { P.tunic = cost.base; P.inner = cost.second; P.pelt = cost.mantle; P.peltDk = WA.mix(cost.mantle, '#4a5f78', 0.44); P.boot = cost.accent; }
      else { P.coat = cost.base; P.coatDk = WA.mix(cost.base, '#2a1410', 0.4); P.coatLt = WA.mix(cost.base, '#fff0d0', 0.24); P.cap = cost.second; P.sage = cost.mantle; P.slate = cost.accent; }
    }
    return fn();
  } finally { Object.assign(P, ORIG[hero]); }
}

// Motifs (design units, feet at the origin, drawn after the body so they sit on the clothes). o = { c: costume, a: alpha, k: light strength }
const MOT = {
  wren: {
    stitch(c, o) { const W = 25.5; let z = ''; for (let i = 0; i <= 8; i++) z += `L${F(-W + 2 * W * i / 8)} ${i % 2 ? -8.4 : -15.4} `; WA.stroke(c, 'M' + z.slice(1), o.c.trim, 1.5, { a: o.a }); WA.stroke(c, 'M-21 -19 Q0 -16 21 -19', o.c.trim, 1.2, { dash: [2, 2.2], a: o.a * 0.9 }); },
    wick(c, o) { const x = 1.4; WA.stroke(c, `M${x} -57 L${x} -52`, o.c.trim, 1.1, { a: o.a }); WA.shape(c, WA.S(`M${x - 2.4} -51.5 L${x + 2.4} -51.5 L${x + 2.2} -44 L${x - 2.2} -44Z`), '#f1e8d2', { w: 0.6 }); WA.shape(c, WA.S(`M${x - 2.6} -51.5 L${x + 2.6} -51.5 L${x + 2.4} -49.6 L${x - 2.4} -49.6Z`), o.c.trim, { w: 0.5 }); WA.stroke(c, `M${x} -51.6 Q${x + 0.5} -55 ${x + 2.8} -54.6`, '#3a2e30', 1.1); WA.glowAt(c, x + 2.8, -54.8, 5, '#ffc96b', 0.5 * o.a); },
    star(c, o) { const x = -12, y = -55; WA.glowAt(c, x, y, 8, o.c.trim, 0.35 * o.a); WA.shape(c, WA.S(starPath(x, y, 4.6, 2)), o.c.trim, { w: 0.55 }); },
    fringe(c, o) { const W = 25.5; for (const i of [1, 3, 5, 7]) { const x = -W + 2 * W * i / 8; WA.stroke(c, `M${F(x)} -8 Q${F(x + 1.2)} -5 ${F(x - 0.4)} -2.6`, o.c.trim, 1.3, { a: o.a }); WA.dot(c, x - 0.4, -2.4, 1.1, o.c.trim, o.a); } },
    core(c, o) { const W = 25.5 * 0.8; let z = ''; for (let i = 0; i <= 8; i++) z += `L${F(W - 2 * W * i / 8)} ${i % 2 ? -38 : -45} `; WA.stroke(c, 'M' + z.slice(1), o.c.trim, 1.3, { a: o.a }); WA.glowAt(c, 0, -26, 20, o.c.glow, 0.16 * o.a * o.k); WA.stroke(c, 'M0 -36 L0 -12', o.c.trim, 1, { a: 0.5 * o.a, dash: [3, 2.4] }); },
  },
  elias: {
    stitch(c, o) { WA.stroke(c, 'M-29 -20 Q0 -12 29 -20', o.c.trim, 1.6, { dash: [2.6, 2.2], a: o.a }); WA.stroke(c, 'M-31 -17 Q0 -9 31 -17', o.c.trim, 1.2, { a: o.a * 0.8 }); },
    wick(c, o) { const x = -8.5; WA.stroke(c, `M${x} -53 L${x} -48`, o.c.trim, 1.1, { a: o.a }); WA.shape(c, WA.S(`M${x - 2.5} -47.5 L${x + 2.5} -47.5 L${x + 2.3} -40 L${x - 2.3} -40Z`), '#f1e8d2', { w: 0.6 }); WA.shape(c, WA.S(`M${x - 2.7} -47.5 L${x + 2.7} -47.5 L${x + 2.5} -45.6 L${x - 2.5} -45.6Z`), o.c.trim, { w: 0.5 }); WA.stroke(c, `M${x} -47.6 Q${x + 0.5} -51 ${x + 2.8} -50.6`, '#3a2e30', 1.1); WA.glowAt(c, x + 2.8, -50.8, 5, '#ffc96b', 0.5 * o.a); },
    star(c, o) { const x = -14.5, y = -51; WA.glowAt(c, x, y, 9, o.c.trim, 0.35 * o.a); WA.shape(c, WA.S(starPath(x, y, 5.2, 2.3)), o.c.trim, { w: 0.55 }); },
    fringe(c, o) { for (let i = 0; i < 9; i++) { const x = -29 + i * 7.3; if (Math.abs(x) < 8) continue; const y0 = -14.5 + 3.6 * Math.abs(x) / 30; WA.stroke(c, `M${F(x)} ${F(y0)} Q${F(x + 1.2)} ${F(y0 + 3.5)} ${F(x - 0.4)} ${F(y0 + 7)}`, o.c.trim, 1.3, { a: o.a }); WA.dot(c, x - 0.4, y0 + 7.2, 1.1, o.c.trim, o.a); } },
    core(c, o) { WA.stroke(c, 'M1.1 -60 L1.1 -14', o.c.trim, 1.4, { a: o.a }); WA.glowAt(c, 1.1, -34, 26, o.c.glow, 0.14 * o.a * o.k); WA.stroke(c, 'M-24 -56 Q-27 -36 -32 -17 M24 -56 Q27 -36 32 -17', o.c.trim, 1, { a: 0.5 * o.a, dash: [3, 2.4] }); },
  },
};

/**
 * The ring motif(s) on the body (call right after drawWrenBody / drawEliasBody). o = { t, motes }: the Dawnbearer motes are animated, so only the
 * live preview asks for them (motes: true); the run bakes the static hem glow only.
 */
export function costumeOverlay(c, hero, cost, o = {}) {
  if (!okCost(cost) || (hero !== 'wren' && hero !== 'elias')) return;
  const base = { c: cost, a: 1, k: 1 };
  const list = cost.motifs;
  for (const m of list) if (Object.hasOwn(MOT[hero], m)) MOT[hero][m](c, list.length > 1 ? { ...base, a: 0.85 } : base);
  if (cost.rise) { // Dawnbearer: a soft rising glow at the hem (warm peach, never gold)
    c.save(); c.translate(0, -4); c.scale(1, 0.32); WA.glowAt(c, 0, 0, hero === 'wren' ? 40 : 50, cost.glow, 0.5); c.restore();
    if (o.motes) {
      const t = o.t || 0, calm = !!o.calm;
      for (let i = 0; i < 5; i++) { const ph = calm ? i / 5 : ((t * 0.22 + i / 5) % 1), x = (i - 2) * 9 + Math.sin(i * 3.1 + (calm ? 0 : t)) * 3, y = -6 - ph * 34; WA.dot(c, x, y, 1.5 * (1 - ph * 0.6), cost.glow, 0.8 * (1 - ph)); }
    }
  }
}

/** Wren's pup wears the costume trim as a collar (call in pup units at the head centre). */
export function pupCollar(c, cost) {
  if (!okCost(cost)) return;
  WA.stroke(c, 'M-9 11 Q-2 17 8 12', cost.trim, 2.8, { a: 0.95 }); WA.dot(c, -1, 15, 1.8, cost.trim);
}

// ------------------------------------------------------------------ live preview (Wear drawer): hero + companion
const TAU = Math.PI * 2;
const rgba = (h, a) => { const n = parseInt(h.slice(1), 16); return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`; };
const flameOf = (f) => ({ glow: f && HEX.test(f.glow || '') ? f.glow : '#ffcf7a', core: f && HEX.test(f.core || '') ? f.core : '#fff1c8' });

/** Draws the hero (layered like the run rig) in design units, feet at the origin. o = { t, calm, flame: {glow, core}, gk }. */
export function drawHero(c, hero, cost, o = {}) {
  const t = o.t || 0, calm = !!o.calm, fl = flameOf(o.flame);
  const k = calm ? 0 : 1, sway = Math.sin(t * 1.7) * 0.06 * k, br = 1 + 0.03 * Math.sin(t / 2.4 * TAU) * k, blink = !calm && (t % 4.3) > 3.9 && (t % 4.3) < 4.02;
  const ov = { t, calm, motes: !calm };
  withCostume(hero, cost, () => {
    if (hero === 'wren') {
      const A = WA.ANCHOR;
      c.save(); c.translate(A.tail[0], A.tail[1]); c.rotate(-0.05 + sway); c.translate(-A.tail[0], -A.tail[1]); WA.drawWrenTail(c); c.restore();
      for (const b of [A.bootFar, A.bootNear]) { c.save(); c.translate(b[0], b[1]); WA.drawWrenBoot(c); c.restore(); }
      c.save(); c.scale(1, br); WA.drawWrenBody(c); costumeOverlay(c, 'wren', cost, ov); WA.drawWrenHead(c, blink ? 'blink' : 'neutral'); c.restore();
      const bob = Math.sin(t * 2.1) * 1.6 * k, ex = A.ember[0], ey = A.ember[1] + bob, gk = o.gk ?? 0.7;
      WA.glowAt(c, ex, ey, 70, fl.glow, 0.34 * gk); WA.glowAt(c, ex, ey, 22, fl.core, 0.5 * gk);
      WA.stroke(c, `M${A.hand[0]} ${A.hand[1]} Q${ex * 0.9} ${(ey + A.hand[1]) / 2 + 4} ${ex} ${ey + 12}`, ORIG.wren.amber, 1.2, { dash: [1.2, 2.4] });
      c.save(); c.translate(ex, ey); c.scale(0.95, 0.95); WA.drawEmber(c); c.restore();
    } else {
      const A = EA.E_ANCHOR;
      WA.glowAt(c, A.lantern[0], A.lantern[1], 60, fl.glow, 0.3 * (o.gk ?? 0.7));
      EA.drawStaffBack(c);
      for (const b of [A.bootFar, A.bootNear]) { c.save(); c.translate(b[0], b[1]); EA.drawEliasBoot(c); c.restore(); }
      c.save(); c.scale(1, br); EA.drawEliasBody(c); costumeOverlay(c, 'elias', cost, ov); EA.drawEliasHead(c, blink ? 'blink' : 'kind'); c.restore();
      EA.drawStaffFront(c);
      WA.glowAt(c, A.crown[0], A.crown[1], 34, fl.glow, 0.26 + (calm ? 0 : 0.04 * Math.sin(t * 5)));
    }
  });
}

/** Wren's pup (collar takes the costume trim) / Elias's ring-light. Pup units, origin = ground. */
export function drawCompanion(c, hero, cost, o = {}) {
  const t = o.t || 0, calm = !!o.calm, fl = flameOf(o.flame);
  if (hero === 'wren') {
    const bob = calm ? 0 : Math.sin(t * 2.6) * 0.8;
    c.save(); c.translate(0, bob);
    WA.drawPupFlat(c, 'sit');
    const hc = WA.pupAnchors('sit', 0).headC;
    if (okCost(cost)) { c.save(); c.translate(hc[0], hc[1]); pupCollar(c, cost); c.restore(); }
    c.restore();
  } else {
    const p = calm ? 0.3 : t * 0.8;
    c.save(); c.translate(0, -2); c.scale(1, 0.28); c.strokeStyle = rgba(fl.glow, 0.85); c.lineWidth = 5; c.beginPath(); c.arc(0, 0, 30, 0, TAU); c.stroke(); c.strokeStyle = rgba(fl.core, 0.8); c.lineWidth = 1.8; c.stroke(); c.restore();
    for (let i = 0; i < 3; i++) { const a = p + i * TAU / 3; WA.glowAt(c, Math.cos(a) * 30, -2 + Math.sin(a) * 8.4, 8, fl.glow, 0.7); WA.dot(c, Math.cos(a) * 30, -2 + Math.sin(a) * 8.4, 2.1, fl.core); }
  }
}

const BOX = { wren: { x0: -60, y0: -134, w: 120, h: 142 }, elias: { x0: -48, y0: -154, w: 128, h: 168 } };
/** A static portrait (hero + costume) on a new canvas, px = height in CSS px, dpr = pixel ratio. */
export function portrait(hero, cost, px, opt = {}) {
  const d = BOX[hero] || BOX.wren, k = px / d.h, dpr = opt.dpr || 1, cv = document.createElement('canvas');
  cv.width = Math.ceil(d.w * k * dpr); cv.height = Math.ceil(d.h * k * dpr);
  const c = cv.getContext('2d'); c.scale(k * dpr, k * dpr); c.translate(-d.x0, -d.y0);
  drawHero(c, hero, cost, { t: 0, calm: true, flame: opt.flame });
  return cv;
}
