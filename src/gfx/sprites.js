// Procedural sprite factory for both visual styles. One set of Canvas2D shape definitions:
//  A: drawn smooth at 3 texels/unit (gradients, soft shadow, rim light), LINEAR filtering.
//  B: drawn at 2 texels/unit, then pixelised (hard alpha, posterised colour bands, 1px dark outline,
//     lit top-left edge, flat shadow) and sampled NEAREST.
// All sizes are in world units (the 640x360 logical space); INV[key] = world units per texel.
import { INV, VIS, DENS } from './style.js';
import { TILE_DRAW, TILE_GEN, TILE_PX } from './groundtiles.js';
import { ROLE } from './palette.js';
import { makeRigTextures } from './rigtex.js';

const TAU = Math.PI * 2;
const ch = (c, s) => (c >> s) & 255;
// WL6d: the night eye core is the authored cream pushed 35% toward white (luminance carries the eye for protan viewers: measured 2.96:1 -> above 3:1 on the root crawler)
const EYE_NIGHT_CORE = (() => { const f = (s) => { const v = (ROLE.eyeCore >> s) & 255; return Math.round(v + (255 - v) * 0.35); }; return (f(16) << 16) | (f(8) << 8) | f(0); })();
const css = (c, a = 1) => `rgba(${ch(c, 16)},${ch(c, 8)},${ch(c, 0)},${a})`;
// f<1 darkens, f>1 lightens toward white.
const sh = (c, f) => {
  const m = (v) => Math.max(0, Math.min(255, Math.round(f <= 1 ? v * f : v + (255 - v) * (f - 1))));
  return `rgb(${m(ch(c, 16))},${m(ch(c, 8))},${m(ch(c, 0))})`;
};
const lg = (c, x0, y0, x1, y1, stops) => {
  const g = c.createLinearGradient(x0, y0, x1, y1);
  for (const s of stops) g.addColorStop(s[0], s[1]);
  return g;
};
const rg = (c, x, y, r0, r1, stops) => {
  const g = c.createRadialGradient(x, y, r0, x, y, r1);
  for (const s of stops) g.addColorStop(s[0], s[1]);
  return g;
};
const ell = (c, x, y, rx, ry, fill, rot = 0) => {
  c.beginPath(); c.ellipse(x, y, rx, ry, rot, 0, TAU); c.fillStyle = fill; c.fill();
};
const circ = (c, x, y, r, fill) => ell(c, x, y, r, r, fill);
const poly = (c, pts, fill) => {
  c.beginPath(); c.moveTo(pts[0], pts[1]);
  for (let i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1]);
  c.closePath(); c.fillStyle = fill; c.fill();
};
const line = (c, x0, y0, qx, qy, x1, y1, w, col) => {
  c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo(qx, qy, x1, y1);
  c.lineWidth = w; c.lineCap = 'round'; c.strokeStyle = col; c.stroke();
};

// ---- shape definitions (world units; box w x h; origin top-left of the box) -------------
// Colours come from ROLE (palette.js). Value order on screen: ground < enemies < hero < spirits < pickups < gold (evolutions only).
const emberEye = (c, x, y, r) => {
  circ(c, x, y, r * 2.4, rg(c, x, y, 0, r * 2.4, [[0, css(ROLE.eye, 0.8)], [1, css(ROLE.eye, 0)]]));
  circ(c, x, y, r, sh(ROLE.eye, 1.05));
  circ(c, x, y, r * 0.55, sh(ROLE.eyeCore, 1));
};

// Hooded wolf-eared traveller with staff + lantern. `o`: cloak, lit, back, lining, trim, ears ('wolf' | 'mitre'), sash.
function hero(o) {
  return (c) => {
    // staff + lantern (left side, so the silhouette is asymmetric and reads as "the lantern bearer")
    c.beginPath(); c.moveTo(1.9, 5.6); c.lineTo(2.5, 17); c.lineWidth = 0.8; c.lineCap = 'round'; c.strokeStyle = sh(ROLE.staff, 1.4); c.stroke();
    circ(c, 1.9, 4.6, 3, rg(c, 1.9, 4.6, 0, 3, [[0, css(ROLE.lantern, 0.55)], [1, css(ROLE.lantern, 0)]]));
    c.fillStyle = sh(ROLE.lantern, 0.8); c.beginPath(); c.roundRect(0.9, 3.3, 2, 2.9, 0.5); c.fill();
    c.fillStyle = sh(ROLE.lanternCore, 1); c.beginPath(); c.roundRect(1.35, 3.8, 1.1, 1.9, 0.4); c.fill();
    // cloak back + tattered body
    poly(c, [3.2, 8.4, 11.2, 8.4, 12.6, 16.6, 1.8, 16.6], sh(o.back, 1));
    c.beginPath(); c.moveTo(3.8, 8.6); c.quadraticCurveTo(7, 7, 10.2, 8.6); c.lineTo(11.9, 16.7); c.lineTo(10.3, 15.1); c.lineTo(8.7, 17); c.lineTo(7, 15.3); c.lineTo(5.3, 17); c.lineTo(3.7, 15.1); c.lineTo(2.1, 16.7); c.closePath();
    c.fillStyle = lg(c, 3, 8, 11, 17, [[0, sh(o.lit, 1)], [0.55, sh(o.cloak, 1)], [1, sh(o.cloak, 0.7)]]); c.fill();
    if (o.sash) { c.fillStyle = sh(o.sash, 1); c.fillRect(3.9, 11.3, 6.2, 1.1); }
    else { line(c, 7, 8.4, 7.3, 12, 7, 15.4, 0.5, sh(o.cloak, 0.6)); }
    // scarf tail (teal), flows behind to the right
    line(c, 8.6, 8.9, 11.4, 8.4, 13.3, 11.4, 1.7, sh(ROLE.scarf, 1));
    line(c, 8.8, 8.7, 11.4, 8.1, 13.1, 11.1, 0.5, 'rgba(255,255,255,0.45)');
    // ears (wolf) or mitre, then hood
    if (o.ears === 'wolf') {
      poly(c, [3.1, 4.4, 2.9, -1.1, 6.1, 1.7], sh(o.cloak, 1.05)); poly(c, [3.7, 3.7, 3.7, 0.4, 5.3, 2.2], sh(o.lining, 1));
      poly(c, [10.9, 4.4, 11.1, -1.1, 7.9, 1.7], sh(o.cloak, 1.05)); poly(c, [10.3, 3.7, 10.3, 0.4, 8.7, 2.2], sh(o.lining, 1));
    } else {
      poly(c, [7, -1.9, 10.7, 4, 3.3, 4], sh(o.trim, 1)); poly(c, [7, -0.2, 9.1, 3.8, 4.9, 3.8], sh(o.cloak, 1.02));
    }
    circ(c, 7, 5.5, 4.6, rg(c, 5.4, 3.5, 0.4, 5.8, [[0, sh(o.lit, 1)], [1, sh(o.cloak, 0.75)]]));
    circ(c, 7, 6, 3.4, sh(o.lining, 1));
    ell(c, 7.2, 6.2, 2.45, 2.25, lg(c, 7, 4, 7, 8.4, [[0, css(ROLE.face)], [1, sh(ROLE.face, 0.82)]]));
    ell(c, 6.1, 6.1, 0.5, 0.62, '#1a1420'); ell(c, 8.5, 6.1, 0.5, 0.62, '#1a1420');
    // 1u white rim on the top-left edges
    c.beginPath(); c.arc(7, 5.5, 4.55, Math.PI * 0.95, Math.PI * 1.5); c.lineWidth = 0.7; c.lineCap = 'round'; c.strokeStyle = 'rgba(255,255,255,0.62)'; c.stroke();
    c.beginPath(); c.moveTo(3.8, 8.8); c.lineTo(2.2, 16.5); c.lineWidth = 0.6; c.strokeStyle = 'rgba(255,255,255,0.4)'; c.stroke();
  };
}

// Enemy wolf: low, long, hackled, ears flat back, ember eyes. Faces right.
function enemyWolf() {
  const F = ROLE.enemyBody; const T = ROLE.enemyTop; const U = ROLE.enemyUnder;
  return (c) => {
    line(c, 3, 5, -0.4, 2.2, -2.2, 1.2, 2.3, sh(U, 1));
    line(c, 3, 6, -0.2, 5, -1.6, 2.4, 1.2, sh(F, 1));
    for (const x of [4.2, 6.4, 10.2, 12.2]) { c.fillStyle = sh(U, 1); c.beginPath(); c.roundRect(x, 7.4, 1.9, 4, 0.9); c.fill(); }
    ell(c, 8, 6, 6.8, 3.8, lg(c, 8, 2.2, 8, 9.8, [[0, sh(T, 1)], [0.5, sh(F, 1)], [1, sh(U, 1)]]));
    // hackles: 5 spikes along the back
    for (let i = 0; i < 5; i++) { const x = 4.2 + i * 1.6; poly(c, [x, 2.9, x + 0.9, 0.5 + (i % 2) * 0.3, x + 1.7, 2.9], sh(F, 1.05)); }
    poly(c, [11.6, 3.7, 10.3, 1.1, 13.2, 2.6], sh(U, 1)); // ear, flat back
    ell(c, 14, 5, 3.5, 3, lg(c, 14, 2, 14, 8, [[0, sh(T, 1)], [1, sh(F, 1)]]));
    ell(c, 16.6, 6.1, 2.1, 1.3, sh(T, 0.9));
    circ(c, 18.2, 5.8, 0.55, '#15121a');
    emberEye(c, 15.2, 4.4, 1.15);
    emberEye(c, 13.6, 4.2, 0.8);
  };
}

// Ghost wolf (summon): translucent ice body, white spine, wisp tail streamers, white eyes. Brighter than any enemy.
function ghostWolf() {
  const A = ROLE.spiritA; const A2 = ROLE.spiritA2;
  return (c) => {
    ell(c, 9, 6, 10, 6.4, css(A, 0.2));
    for (const [y1, y2] of [[3.2, 0.6], [5, 3.2], [6.8, 6.4]]) line(c, 3.4, 5.2, -1, y1, -3.2, y2, 1.4, css(A, 0.55));
    for (const x of [4.2, 6.4, 10.2, 12.2]) { c.fillStyle = css(A2, 0.9); c.beginPath(); c.roundRect(x, 7.6, 1.9, 3.8, 0.9); c.fill(); }
    ell(c, 8, 6, 6.7, 3.7, lg(c, 8, 2.2, 8, 9.6, [[0, '#ffffff'], [0.6, sh(A, 1.25)], [1, sh(A2, 1.1)]]));
    poly(c, [11.6, 3.6, 12.1, -0.4, 14.2, 2.4], sh(A, 1.1)); poly(c, [13.8, 2.4, 15.6, -0.5, 16.4, 3.4], '#ffffff');
    ell(c, 14, 5, 3.4, 2.9, lg(c, 14, 2, 14, 8, [[0, '#ffffff'], [1, sh(A, 1)]]));
    ell(c, 16.5, 6, 2, 1.3, '#ffffff');
    circ(c, 18.1, 5.6, 0.55, sh(A2, 0.5));
    circ(c, 15.1, 4.3, 1.5, 'rgba(255,255,255,0.9)'); circ(c, 15.1, 4.3, 0.7, sh(A2, 0.7));
    c.beginPath(); c.moveTo(3.2, 4); c.quadraticCurveTo(8, 1.4, 12.6, 3.2); c.lineWidth = 0.7; c.lineCap = 'round'; c.strokeStyle = 'rgba(255,255,255,0.85)'; c.stroke();
  };
}

const SPRITES = {
  hero_wren: { w: 14, h: 18, shadow: [7, 16.6, 5.6, 1.8], outline: 1, draw: hero({ cloak: ROLE.hero, lit: ROLE.heroLit, back: ROLE.heroBack, lining: ROLE.heroLining, trim: ROLE.scarf, ears: 'wolf' }) },
  hero_elias: { w: 14, h: 18, shadow: [7, 16.6, 5.6, 1.8], outline: 1, draw: hero({ cloak: ROLE.eliasRobe, lit: 0xffffff, back: 0x9a94a8, lining: ROLE.heroLining, trim: ROLE.eliasTrim, ears: 'mitre', sash: ROLE.eliasSash }) },
  wolf: { w: 18, h: 12, shadow: [9, 10.6, 7, 1.7], enemy: 1, draw: enemyWolf() },
  wolfU: { w: 18, h: 12, draw: ghostWolf() },
  crow: {
    w: 14, h: 10, enemy: 1,
    draw: (c) => {
      const B = ROLE.crowBody; const T = ROLE.crowTop;
      poly(c, [2.4, 5, -1.4, 3.2, -0.8, 6.6], sh(B, 0.8)); // tail
      c.beginPath(); c.moveTo(4, 5); c.lineTo(0.6, 2.2); c.lineTo(2.4, 2.4); c.lineTo(1.6, 0.4); c.lineTo(4.4, 1.6); c.lineTo(5.6, -0.6); c.lineTo(7, 3.8); c.closePath(); c.fillStyle = sh(B, 0.85); c.fill(); // far wing
      ell(c, 6, 5.4, 4.8, 2.8, lg(c, 6, 2.6, 6, 8.2, [[0, sh(T, 1)], [0.5, sh(B, 1)], [1, sh(B, 0.6)]]));
      c.beginPath(); c.moveTo(3, 4.8); c.quadraticCurveTo(3.6, -1.8, 9.8, 2.6); c.lineTo(8.6, 1); c.lineTo(9.6, 4.2); c.quadraticCurveTo(6.2, 3.4, 3, 4.8);
      c.fillStyle = lg(c, 3, -1, 9, 5, [[0, sh(T, 1.15)], [1, sh(B, 1)]]); c.fill(); // near wing, feathered tip
      circ(c, 10.2, 4.3, 2.6, rg(c, 9.6, 3.4, 0.2, 2.9, [[0, sh(T, 1)], [1, sh(B, 0.8)]]));
      poly(c, [11.9, 3.6, 14.4, 4.8, 11.9, 5.6], sh(ROLE.beak, 1));
      emberEye(c, 10.9, 3.8, 1.05);
    },
  },
  root: {
    w: 20, h: 20, shadow: [10, 17, 7.5, 2], enemy: 1, rim: ROLE.rootTop,
    draw: (c) => {
      for (let a = 0; a < 7; a++) {
        const ang = (a / 7) * TAU + 0.3;
        const ex = 10 + Math.cos(ang) * 9.4;
        const ey = 10 + Math.sin(ang) * 9.4;
        const m = ang + 0.7;
        line(c, 10, 10, 10 + Math.cos(m) * 6, 10 + Math.sin(m) * 6, ex, ey, 2, sh(ROLE.rootBody, 0.85));
      }
      circ(c, 10, 10, 6.5, rg(c, 8, 7.6, 0.5, 7.2, [[0, sh(ROLE.rootTop, 1.1)], [0.6, sh(ROLE.rootBody, 1.1)], [1, sh(ROLE.rootBody, 0.55)]]));
      c.strokeStyle = css(ROLE.rootCrack, 0.5); c.lineWidth = 0.5; c.lineCap = 'round';
      for (const [x0, y0, x1, y1] of [[11, 8, 14, 11], [7, 12, 9.4, 15], [12, 12.5, 10.6, 15.6]]) { c.beginPath(); c.moveTo(x0, y0); c.lineTo(x1, y1); c.stroke(); }
      ell(c, 9.2, 5.2, 4.2, 2, sh(ROLE.moss, 1.2), -0.2); // moss cap
      emberEye(c, 8, 9.2, 1.2); emberEye(c, 12.2, 9.2, 1.2);
    },
  },
  treant: {
    w: 64, h: 72, shadow: [32, 66.5, 23, 5], enemy: 1, big: 1, rim: ROLE.barkRim,
    draw: (c) => {
      const K = ROLE.bark; const G = ROLE.canopy;
      line(c, 22, 60, 10, 66, 8, 70, 4.5, sh(K, 0.6)); line(c, 42, 60, 54, 66, 56, 70, 4.5, sh(K, 0.6));
      line(c, 28, 64, 22, 69, 16, 70, 3.5, sh(K, 0.6)); line(c, 36, 64, 42, 69, 48, 70, 3.5, sh(K, 0.6));
      c.beginPath(); c.moveTo(22, 26); c.lineTo(42, 26); c.quadraticCurveTo(46, 48, 45, 66); c.lineTo(19, 66); c.quadraticCurveTo(18, 48, 22, 26); c.closePath();
      c.fillStyle = lg(c, 19, 0, 45, 0, [[0, sh(K, 1.35)], [0.45, sh(K, 0.95)], [1, sh(K, 0.55)]]); c.fill();
      c.strokeStyle = 'rgba(20,12,6,0.5)'; c.lineWidth = 0.8;
      for (const x of [26, 31, 37, 41]) { c.beginPath(); c.moveTo(x, 32); c.quadraticCurveTo(x + 2, 48, x - 1, 64); c.stroke(); }
      line(c, 22, 38, 12, 40, 6, 52, 5.5, sh(K, 0.95)); line(c, 42, 38, 52, 40, 58, 52, 5.5, sh(K, 0.95));
      line(c, 6, 52, 3.4, 56, 2, 59, 1.6, sh(K, 0.95)); line(c, 6, 52, 6.4, 57, 6.8, 60, 1.6, sh(K, 0.95));
      line(c, 58, 52, 60.6, 56, 62, 59, 1.6, sh(K, 0.95)); line(c, 58, 52, 57.6, 57, 57.2, 60, 1.6, sh(K, 0.95));
      for (const [x, y, r, d] of [[14, 29, 11.5, 0], [50, 29, 11.5, 0], [32, 20, 20.5, 1]]) {
        circ(c, x, y, r, rg(c, x - r * 0.3, y - r * 0.4, r * 0.1, r * 1.05, [[0, sh(G, d ? 1.3 : 1.2)], [0.6, sh(G, 0.85)], [1, sh(G, 0.45)]]));
      }
      circ(c, 26, 13, 8, rg(c, 25, 12, 0, 8, [[0, 'rgba(160,230,150,0.45)'], [1, 'rgba(160,230,150,0)']]));
      ell(c, 26, 25, 7, 1.6, 'rgba(40,90,40,0.7)'); ell(c, 38.5, 25.5, 6, 1.4, 'rgba(40,90,40,0.7)');
      for (const x of [27, 37]) {
        circ(c, x, 40, 5.4, rg(c, x, 40, 0, 5.4, [[0, css(ROLE.bossEye, 0.95)], [1, css(ROLE.bossEye, 0)]]));
        ell(c, x, 40, 2.4, 1.6, sh(ROLE.bossEye, 1.5), x < 32 ? 0.25 : -0.25);
      }
      c.beginPath(); c.moveTo(27, 49); c.quadraticCurveTo(32, 52, 37, 49); c.quadraticCurveTo(32, 50.4, 27, 49);
      c.fillStyle = '#150d07'; c.fill();
      ell(c, 26, 56, 4, 1.2, 'rgba(90,160,90,0.55)');
    },
  },
  raven: {
    w: 12, h: 10,
    draw: (c) => {
      const B = ROLE.spiritB; const B2 = ROLE.spiritB2;
      circ(c, 6, 5, 6, rg(c, 6, 5, 0, 6, [[0, css(B, 0.5)], [1, css(B, 0)]]));
      poly(c, [2.2, 5, -0.6, 3.6, -0.2, 6.4], sh(B, 0.45));
      ell(c, 6, 5, 4.3, 2.3, lg(c, 6, 3, 6, 7.5, [[0, sh(B2, 1.05)], [1, sh(B, 0.95)]]));
      c.beginPath(); c.moveTo(3, 4.4); c.quadraticCurveTo(4.6, -1.6, 8.8, 3.4); c.lineTo(8.2, 1.8); c.lineTo(9.2, 4.2); c.quadraticCurveTo(6, 3.3, 3, 4.4);
      c.fillStyle = lg(c, 3, 0, 9, 4, [[0, sh(B2, 1)], [1, sh(B, 0.8)]]); c.fill();
      circ(c, 9, 4, 2, sh(B, 0.65)); poly(c, [10.4, 3.6, 12.2, 4.2, 10.4, 4.9], sh(B2, 1.2));
      circ(c, 9.5, 3.6, 0.6, '#ffffff');
    },
  },
  orb: {
    // A2: a Holy Orbit light is a small lilac-white FLAME (the locked Elias v2 flame ring), not a ball. Same footprint and centre as before.
    w: 12, h: 14, pad: 0,
    draw: (c) => {
      circ(c, 6, 7.6, 6, rg(c, 6, 7.6, 1, 6, [[0, css(ROLE.spiritB2, 0.45)], [1, css(ROLE.spiritB2, 0)]]));
      const fl = (k, col) => { c.beginPath(); c.moveTo(6, 12.6); c.bezierCurveTo(6 - 3.6 * k, 12, 6 - 3.4 * k, 7, 6 + 0.4 * k, 1.2 + (1 - k) * 6); c.bezierCurveTo(6 + 3.4 * k, 7, 6 + 3.6 * k, 12, 6, 12.6); c.fillStyle = col; c.fill(); };
      fl(1, sh(ROLE.spiritC, 0.85));
      c.lineWidth = 0.6; c.strokeStyle = css(ROLE.spiritA2, 0.7); c.stroke();
      fl(0.74, sh(ROLE.spiritC, 1.2));
      fl(0.42, '#ffffff');
    },
  },
  gem: {
    w: 8, h: 10,
    draw: (c) => {
      const T = ROLE.pickup;
      c.beginPath(); c.moveTo(4, 0); c.lineTo(8, 4.2); c.lineTo(4, 10); c.lineTo(0, 4.2); c.closePath();
      c.fillStyle = lg(c, 0, 0, 8, 10, [[0, sh(T, 1.8)], [1, sh(T, 0.8)]]); c.fill();
      poly(c, [4, 0, 8, 4.2, 4, 4.2], sh(T, 1.7)); poly(c, [4, 0, 0, 4.2, 4, 4.2], sh(T, 1.4));
      poly(c, [0, 4.2, 4, 4.2, 4, 10], sh(T, 0.85)); poly(c, [8, 4.2, 4, 4.2, 4, 10], sh(T, 0.65));
      poly(c, [4, 0.9, 5.4, 3.2, 4, 3.2], 'rgba(255,255,255,0.9)');
    },
  },
  heart: {
    w: 12, h: 11, shadow: [6, 10.2, 4, 0.9],
    draw: (c) => {
      const H = ROLE.heart;
      c.beginPath(); c.moveTo(6, 10.6); c.bezierCurveTo(-1.5, 5.4, 1.2, -0.6, 6, 2.8); c.bezierCurveTo(10.8, -0.6, 13.5, 5.4, 6, 10.6); c.closePath();
      c.fillStyle = rg(c, 4.5, 3.4, 0.4, 8, [[0, sh(H, 1.3)], [0.5, sh(H, 1)], [1, sh(H, 0.6)]]); c.fill();
      ell(c, 3.6, 3, 1.5, 1, 'rgba(255,255,255,0.75)', -0.6);
    },
  },
  magnet: {
    w: 12, h: 12,
    draw: (c) => {
      const M = ROLE.magnet;
      c.beginPath(); c.moveTo(2.6, 1.5); c.lineTo(2.6, 6.6); c.arc(6, 6.6, 3.4, Math.PI, 0, true); c.lineTo(9.4, 1.5);
      c.lineWidth = 2.9; c.lineCap = 'butt'; c.lineJoin = 'round'; c.strokeStyle = lg(c, 0, 0, 12, 12, [[0, sh(M, 1.1)], [1, sh(M, 0.6)]]); c.stroke();
      c.fillStyle = '#f2ecff'; c.fillRect(1.15, 0.6, 2.9, 2.4); c.fillRect(7.95, 0.6, 2.9, 2.4);
      c.fillStyle = 'rgba(255,255,255,0.4)'; c.fillRect(1.6, 3.2, 0.8, 3.5);
    },
  },
  bolt: {
    w: 10, h: 10, pad: 0,
    draw: (c) => {
      circ(c, 5, 5, 5, rg(c, 5, 5, 0.5, 5, [[0, css(ROLE.bolt, 0.55)], [1, css(ROLE.bolt, 0)]]));
      circ(c, 5, 5, 3, rg(c, 5, 5, 0, 3, [[0, '#ffffff'], [0.5, sh(ROLE.bolt, 1.1)], [1, sh(ROLE.bolt, 0.8)]]));
      circ(c, 5, 5, 1.3, '#ffffff');
    },
  },
  tree: {
    w: 30, h: 42, shadow: [15, 40, 10, 2],
    draw: (c) => {
      const K = ROLE.treeCanopy; const R = ROLE.treeRim;
      c.beginPath(); c.moveTo(12, 40); c.lineTo(13, 24); c.lineTo(17.4, 24); c.lineTo(18.6, 40); c.closePath();
      c.fillStyle = lg(c, 12, 0, 19, 0, [[0, sh(K, 0.8)], [1, sh(K, 0.35)]]); c.fill();
      for (const [x, y, r] of [[8, 21, 8.5], [22, 21, 8.5], [15, 17, 12.5]]) circ(c, x, y, r, rg(c, x - r * 0.35, y - r * 0.4, r * 0.1, r * 1.1, [[0, sh(K, 1.15)], [0.7, sh(K, 0.8)], [1, sh(K, 0.5)]]));
      circ(c, 12, 12, 7, rg(c, 11, 11, 0, 7, [[0, css(ROLE.scarf, 0.28)], [1, css(ROLE.scarf, 0)]]));
      c.lineCap = 'round'; c.lineWidth = 0.7; c.strokeStyle = css(R, 0.45);
      c.beginPath(); c.arc(15, 17, 12, Math.PI * 1.05, Math.PI * 1.62); c.stroke();
      c.beginPath(); c.arc(8, 21, 8.4, Math.PI * 0.95, Math.PI * 1.45); c.stroke();
    },
  },
  patch: {
    w: 64, h: 64, pad: 0,
    draw: (c) => {
      circ(c, 32, 32, 32, rg(c, 32, 32, 2, 32, [[0, 'rgba(70,120,110,0.22)'], [0.7, 'rgba(47,74,74,0.1)'], [1, 'rgba(47,74,74,0)']]));
      c.lineCap = 'round';
      for (let a = 0; a < 6; a++) {
        const ang = (a / 6) * TAU + 0.2;
        line(c, 32, 32, 32 + Math.cos(ang + 0.5) * 13, 32 + Math.sin(ang + 0.5) * 10, 32 + Math.cos(ang) * 25, 32 + Math.sin(ang) * 19, 0.9, 'rgba(90,150,135,0.42)');
      }
    },
  },
  // white radial falloff used as the lightmap stamp (tinted per light); 1 texel per unit
  light: {
    w: 64, h: 64, pad: 0, noPix: 1, S: 1,
    draw: (c) => {
      c.fillStyle = rg(c, 32, 32, 0, 32, [[0, 'rgba(255,255,255,1)'], [0.4, 'rgba(255,255,255,0.8)'], [0.75, 'rgba(255,255,255,0.28)'], [1, 'rgba(255,255,255,0)']]);
      c.fillRect(0, 0, 64, 64);
    },
  },
  // hero ground ring (tinted warm / danger): 24x9 u ellipse with a soft halo
  ring: {
    w: 28, h: 12, pad: 0, noPix: 1,
    draw: (c) => {
      c.beginPath(); c.ellipse(14, 6, 12, 4.5, 0, 0, TAU); c.lineWidth = 3.2; c.strokeStyle = 'rgba(255,255,255,0.22)'; c.stroke();
      c.beginPath(); c.ellipse(14, 6, 12, 4.5, 0, 0, TAU); c.lineWidth = 1.2; c.strokeStyle = 'rgba(255,255,255,0.95)'; c.stroke();
    },
  },
  // WL6b: the night eye core: a small disc that stays solid to half its radius, so the cream centre carries luminance (colour-blind safe), unlike the soft glow
  eyedot: {
    w: 16, h: 16, pad: 0, noPix: 1,
    draw: (c) => {
      c.fillStyle = rg(c, 8, 8, 0, 8, [[0, 'rgba(255,255,255,1)'], [0.5, 'rgba(255,255,255,1)'], [0.8, 'rgba(255,255,255,0.4)'], [1, 'rgba(255,255,255,0)']]);
      c.fillRect(0, 0, 16, 16);
    },
  },
  // WL6b: one-image night eye: ember halo under a solid cream core (core diameter = 0.47 of the image), additive, no tint needed
  eyen: {
    w: 32, h: 32, pad: 0, noPix: 1,
    draw: (c) => {
      c.fillStyle = rg(c, 16, 16, 0, 16, [[0, css(ROLE.eye, 0.95)], [0.45, css(ROLE.eye, 0.55)], [1, css(ROLE.eye, 0)]]);
      c.fillRect(0, 0, 32, 32);
      c.fillStyle = rg(c, 16, 16, 0, 7.5, [[0, css(EYE_NIGHT_CORE, 1)], [0.72, css(EYE_NIGHT_CORE, 1)], [1, css(EYE_NIGHT_CORE, 0)]]);
      c.fillRect(0, 0, 32, 32);
    },
  },
  glow: {
    w: 32, h: 32, pad: 0, noPix: 1,
    draw: (c) => {
      c.fillStyle = rg(c, 16, 16, 0, 16, [[0, 'rgba(255,255,255,0.7)'], [0.25, 'rgba(255,255,255,0.4)'], [0.6, 'rgba(255,255,255,0.12)'], [1, 'rgba(255,255,255,0)']]);
      c.fillRect(0, 0, 32, 32);
    },
  },
};

// ---- rendering --------------------------------------------------------------------------
function mkCanvas(w, h) {
  const cv = document.createElement('canvas');
  cv.width = Math.max(1, Math.round(w));
  cv.height = Math.max(1, Math.round(h));
  return cv;
}

// A: warm 1-unit rim on the top/left edges so dark enemy bodies read against the ground.
function rimOutline(cv, col, px, alpha) {
  const o = mkCanvas(cv.width, cv.height);
  const x = o.getContext('2d');
  x.globalAlpha = alpha;
  for (const d of [[-px, 0], [0, -px], [-px * 0.7, -px * 0.7]]) x.drawImage(cv, d[0], d[1]);
  x.globalAlpha = 1;
  x.globalCompositeOperation = 'source-in';
  x.fillStyle = col; x.fillRect(0, 0, o.width, o.height);
  x.globalCompositeOperation = 'source-over';
  x.drawImage(cv, 0, 0);
  return o;
}

// Outline-only copy (silhouette pass: drawn over a crowd so the hero is never lost).
function outlineOf(cv, col, px) {
  const o = mkCanvas(cv.width, cv.height);
  const x = o.getContext('2d');
  for (let a = 0; a < 8; a++) x.drawImage(cv, Math.cos(a * TAU / 8) * px, Math.sin(a * TAU / 8) * px);
  x.globalCompositeOperation = 'source-in';
  x.fillStyle = col; x.fillRect(0, 0, o.width, o.height);
  x.globalCompositeOperation = 'destination-out';
  x.drawImage(cv, 0, 0);
  return o;
}

function softShadow(c, sd, a) {
  c.save();
  c.translate(sd[0], sd[1]); c.scale(1, sd[3] / sd[2]);
  c.fillStyle = rg(c, 0, 0, 0, sd[2], [[0, `rgba(0,0,0,${a})`], [0.6, `rgba(0,0,0,${a * 0.55})`], [1, 'rgba(0,0,0,0)']]);
  c.beginPath(); c.arc(0, 0, sd[2], 0, TAU); c.fill();
  c.restore();
}

// B: hard alpha, posterised colour, dark 1px outline, lit top-left edge, flat shadow.
function pixelize(cv, sd, S, pad) {
  const w = cv.width;
  const h = cv.height;
  const x = cv.getContext('2d');
  const id = x.getImageData(0, 0, w, h);
  const d = id.data;
  const L = 10;
  const opaque = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) {
    const o = i * 4;
    if (d[o + 3] < 96) { d[o + 3] = 0; continue; }
    d[o + 3] = 255; opaque[i] = 1;
    const y = 0.299 * d[o] + 0.587 * d[o + 1] + 0.114 * d[o + 2];
    const f = y > 1 ? (Math.round((y / 255) * L) * (255 / L)) / y : 1;
    for (let k = 0; k < 3; k++) d[o + k] = Math.min(255, Math.round(d[o + k] * f));
  }
  const at = (px, py) => (px < 0 || py < 0 || px >= w || py >= h ? 0 : opaque[py * w + px]);
  // lit edge (top/left inside the silhouette)
  for (let py = 0; py < h; py++) {
    for (let px = 0; px < w; px++) {
      if (!opaque[py * w + px]) continue;
      if (!at(px, py - 1) || !at(px - 1, py)) {
        const o = (py * w + px) * 4;
        for (let k = 0; k < 3; k++) d[o + k] = Math.min(255, d[o + k] * 1.22 + 26);
      }
    }
  }
  // outline (outside, 4-neighbourhood), darkened from the neighbour colour
  const add = [];
  for (let py = 0; py < h; py++) {
    for (let px = 0; px < w; px++) {
      if (opaque[py * w + px]) continue;
      for (const [dx, dy] of [[0, 1], [1, 0], [0, -1], [-1, 0]]) {
        if (at(px + dx, py + dy)) { add.push(px, py, (py + dy) * w + px + dx); break; }
      }
    }
  }
  for (let i = 0; i < add.length; i += 3) {
    const o = (add[i + 1] * w + add[i]) * 4;
    const s = add[i + 2] * 4;
    d[o] = d[s] * 0.28; d[o + 1] = d[s + 1] * 0.26; d[o + 2] = d[s + 2] * 0.34; d[o + 3] = 255;
  }
  // flat shadow under (only into empty pixels)
  if (sd) {
    const cx = (sd[0] + pad) * S;
    const cy = (sd[1] + pad) * S;
    const rx = sd[2] * S;
    const ry = sd[3] * S;
    for (let py = Math.max(0, Math.floor(cy - ry)); py < Math.min(h, Math.ceil(cy + ry)); py++) {
      for (let px = Math.max(0, Math.floor(cx - rx)); px < Math.min(w, Math.ceil(cx + rx)); px++) {
        const o = (py * w + px) * 4;
        if (d[o + 3] || ((px - cx) / rx) ** 2 + ((py - cy) / ry) ** 2 > 1) continue;
        d[o] = 4; d[o + 1] = 4; d[o + 2] = 12; d[o + 3] = 84;
      }
    }
  }
  x.putImageData(id, 0, 0);
}

function renderSprite(def, style) {
  const S = def.S || (style === 'b' ? 2 : Math.max(3, Math.round((DENS[def.key] || 3) * (VIS[def.key] || 1))));
  const pad = def.pad === undefined ? 2 : def.pad;
  const cv = mkCanvas((def.w + pad * 2) * S, (def.h + pad * 2) * S);
  const c = cv.getContext('2d');
  c.scale(S, S);
  c.translate(pad, pad);
  const pix = style === 'b' && !def.noPix;
  if (style === 'a' && def.shadow) softShadow(c, def.shadow, 0.4);
  def.draw(c);
  if (pix) { pixelize(cv, def.shadow, S, pad); return { cv, S }; }
  if (style === 'a' && def.enemy) return { cv: rimOutline(cv, css(def.rim || ROLE.enemyRim, 1), S * 0.55, 0.55), S };
  return { cv, S };
}

// ---- ground ------------------------------------------------------------------------------
function rnd(seed) {
  let s = seed >>> 0;
  return () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

// B: 128-unit tile at 2 texels/unit, hard pixels: noise clusters, stones, grass tufts, moss.
function groundB() {
  const N = 256;
  const cv = mkCanvas(N, N);
  const c = cv.getContext('2d');
  const r = rnd(11);
  c.fillStyle = '#1d2b3a'; c.fillRect(0, 0, N, N);
  const px = (x, y, w, h, col) => {
    c.fillStyle = col;
    for (const dx of [-N, 0, N]) for (const dy of [-N, 0, N]) c.fillRect(((x + dx) | 0), ((y + dy) | 0), w, h);
  };
  const cols = ['#223244', '#182433', '#12182b', '#1a2a3a', '#26394c'];
  for (let i = 0; i < 700; i++) px(r() * N, r() * N, 2 + ((r() * 3) | 0), 2, cols[(r() * cols.length) | 0]);
  for (let i = 0; i < 10; i++) {
    const x = r() * N; const y = r() * N;
    for (let k = 0; k < 26; k++) px(x + (r() - 0.5) * 26, y + (r() - 0.5) * 14, 2, 2, r() < 0.5 ? '#2a4646' : '#2f4a4a');
  }
  for (let i = 0; i < 26; i++) {
    const x = r() * N; const y = r() * N;
    px(x, y + 2, 1, 4, '#3a6458'); px(x + 2, y + 3, 1, 3, '#2f4a4a'); px(x - 2, y + 3, 1, 3, '#34584f'); px(x + 1, y, 1, 2, '#5a8a7a');
  }
  for (let i = 0; i < 9; i++) {
    const x = r() * N; const y = r() * N;
    px(x, y, 6, 4, '#10151f'); px(x, y, 5, 1, '#33465a'); px(x + 1, y + 1, 3, 1, '#243448');
  }
  return cv;
}

// ---- vignette (screen space) -----------------------------------------------------------
function vignette(scene) {
  if (scene.textures.exists('vig')) return;
  const t = scene.textures.createCanvas('vig', 320, 180);
  const c = t.getContext();
  const gr = c.createRadialGradient(160, 90, 40, 160, 90, 190);
  gr.addColorStop(0, 'rgba(255,255,255,0)');
  gr.addColorStop(0.65, 'rgba(255,255,255,0.35)');
  gr.addColorStop(1, 'rgba(255,255,255,0.9)');
  c.fillStyle = gr;
  c.fillRect(0, 0, 320, 180);
  t.refresh();
}

// ---- damage-number glyphs ---------------------------------------------------------------
// 15 glyph cells ("0123456789k+-.M"), 5x7 units each, drawn into a canvas at k texels per unit. brass = big-hit font with a brass rim.
function digitsCanvas(style, brass) {
  const k = 4;
  const cv = mkCanvas(75 * k, 7 * k);
  const c = cv.getContext('2d');
  if (style === 'b') {
    const G = ['111101101101111', '010110010010111', '111001111100111', '111001111001111', '101101111001001',
      '111100111001111', '111100111101111', '111001001001001', '111101111101111', '111101111001111',
      '101101110101101', '000010111010000', '000000111000000', '000000000010000', '101111111101101'];
    G.forEach((bits, i) => {
      for (let q = 0; q < 15; q++) {
        if (bits[q] !== '1') continue;
        c.fillStyle = brass ? '#8d6c34' : '#07070d'; c.fillRect((i * 5 + 2 + (q % 3)) * k, (1 + Math.floor(q / 3)) * k, k, k);
      }
    });
    G.forEach((bits, i) => {
      for (let q = 0; q < 15; q++) {
        if (bits[q] !== '1') continue;
        c.fillStyle = '#fff'; c.fillRect((i * 5 + 1 + (q % 3)) * k, Math.floor(q / 3) * k, k, k);
      }
    });
    return { cv, k };
  }
  c.font = `800 ${6.4 * k}px "Trebuchet MS", "Segoe UI", system-ui, sans-serif`;
  c.textAlign = 'center'; c.textBaseline = 'middle';
  c.lineJoin = 'round';
  const chars = '0123456789k+-.M';
  for (let i = 0; i < chars.length; i++) {
    const cx = (i * 5 + 2.5) * k;
    const cy = 3.7 * k;
    if (brass) {
      c.lineWidth = 1.9 * k; c.strokeStyle = 'rgba(7,7,13,0.92)'; c.strokeText(chars[i], cx, cy);
      c.lineWidth = 1.15 * k; c.strokeStyle = '#a9823f'; c.strokeText(chars[i], cx, cy);
    } else {
      c.lineWidth = 1.5 * k; c.strokeStyle = 'rgba(7,7,13,0.92)'; c.strokeText(chars[i], cx, cy);
    }
    c.fillStyle = '#fff'; c.fillText(chars[i], cx, cy);
  }
  return { cv, k };
}

// ---- entry point ------------------------------------------------------------------------
export function makeStyleTextures(scene, style) {
  const nearest = style === 'b';
  for (const [key, def] of Object.entries(SPRITES)) {
    const { cv, S } = renderSprite({ ...def, key }, style);
    if (scene.textures.exists(key)) scene.textures.remove(key);
    const t = scene.textures.addCanvas(key, cv);
    if (nearest && !def.noPix && key !== 'glow') t.setFilter(1); // Phaser.Textures.FilterMode.NEAREST
    INV[key] = (VIS[key] || 1) / S; // world units per texel, display size included
    // WL6b: cool outline-only copy of each small enemy (the night rim, drawn behind far enemies on Med/High). Style A only; 1 world unit wide, tinted at draw time.
    if (def.enemy && !def.big && !nearest) {
      const rk = `${key}_r`;
      if (scene.textures.exists(rk)) scene.textures.remove(rk);
      scene.textures.addCanvas(rk, outlineOf(cv, '#ffffff', Math.max(1, Math.round(S * 1.0 / (VIS[key] || 1)))));
      INV[rk] = INV[key];
    }
    if (def.outline) {
      const ok = `${key}_o`;
      if (scene.textures.exists(ok)) scene.textures.remove(ok);
      scene.textures.addCanvas(ok, outlineOf(cv, css(ROLE.lanternCore, 1), S * 1.5 / (VIS[key] || 1)));
      INV[ok] = INV[key];
    }
  }
  if (style === 'a') makeRigTextures(scene); // Wren v2 rig atlas + flat Wren/pup (replaces the old hero_wren)
  // W1 ground: style a = four code-painted daylight tiles (src/gfx/groundtiles.js); style b keeps the old pixel tile.
  // 'ground' = Hollow A (also the Low tier flat tile), 'groundR' = restored A, 'groundBH'/'groundBR' = Deep Forest Floor Hollow/restored.
  const setTex = (key, cv) => {
    if (scene.textures.exists(key)) scene.textures.remove(key);
    const t = scene.textures.addCanvas(key, cv);
    if (nearest) t.setFilter(1);
  };
  scene.bState = { lazy: null, ready: style === 'b' ? 1 : 0, t: 0 }; // W1b: set B tile readiness (see RunScene.tickGround)
  if (style === 'b') {
    const gcv = groundB();
    for (const key of ['ground', 'groundR', 'groundBH', 'groundBR']) setTex(key, gcv);
  } else {
    // Meadow (A) tiles are built now; Deep Forest Floor (B) tiles start as flat-colour placeholders and are painted
    // later in small slices by makeGroundLazy() (W1b), so the boot has no long stall.
    for (const [key, name] of [['ground', 'hollowA'], ['groundR', 'restoredA']]) setTex(key, TILE_DRAW[name](mkCanvas(TILE_PX, TILE_PX)));
    for (const [key, col] of [['groundBH', '#627082'], ['groundBR', '#507c48']]) {
      const cv = mkCanvas(TILE_PX, TILE_PX); const g = cv.getContext('2d'); g.fillStyle = col; g.fillRect(0, 0, TILE_PX, TILE_PX);
      setTex(key, cv);
    }
  }
  INV.ground = 0.5;
  vignette(scene);
  for (const [key, brass] of [['digits', false], ['digitsB', true]]) {
    const dg = digitsCanvas(style, brass);
    if (scene.textures.exists(key)) scene.textures.remove(key);
    const dt = scene.textures.addCanvas(key, dg.cv);
    if (nearest) dt.setFilter(1);
    INV[key] = 1 / dg.k;
  }
  const dot = mkCanvas(2, 2);
  dot.getContext('2d').fillStyle = '#fff';
  dot.getContext('2d').fillRect(0, 0, 2, 2);
  scene.textures.addCanvas('dot', dot);
  INV.dot = 1;
  return 1 / INV.digits;
}

// W1b: paints the B ground tiles into their placeholder canvases in slices. step(ms) runs generator work for at most ~ms,
// returns true when both tiles are finished and uploaded to the GPU (texture source update). Visual only.
export function makeGroundLazy(scene) {
  const jobs = [['groundBH', TILE_GEN.hollowB], ['groundBR', TILE_GEN.restoredB]].map(([key, gen]) => {
    const tex = scene.textures.get(key);
    const cv = tex.getSourceImage();
    return { tex, cx: cv.getContext('2d'), it: gen(cv), done: false };
  });
  return {
    done: false,
    step(ms) {
      const t0 = performance.now();
      for (const j of jobs) {
        while (!j.done && performance.now() - t0 < ms) {
          const fin = j.it.next().done;
          j.cx.getImageData(0, 0, 1, 1); // forces the canvas to flush this slice now (GPU canvases defer work), keeps the cost inside the budget
          if (fin) { j.done = true; j.tex.source[0].update(); }
        }
        if (performance.now() - t0 >= ms) break;
      }
      this.done = jobs.every((j) => j.done);
      return this.done;
    },
  };
}
