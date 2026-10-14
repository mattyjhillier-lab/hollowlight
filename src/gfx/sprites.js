// Procedural sprite factory for both visual styles. One set of Canvas2D shape definitions:
//  A: drawn smooth at 3 texels/unit (gradients, soft shadow, rim light), LINEAR filtering.
//  B: drawn at 2 texels/unit, then pixelised (hard alpha, posterised colour bands, 1px dark outline,
//     lit top-left edge, flat shadow) and sampled NEAREST.
// All sizes are in world units (the 640x360 logical space); INV[key] = world units per texel.
import { INV, VIS, DENS } from './style.js';

const TAU = Math.PI * 2;
const ch = (c, s) => (c >> s) & 255;
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
function hero(body, trim, hood) {
  return (c) => {
    c.beginPath(); c.moveTo(4, 8.2); c.quadraticCurveTo(7, 6.6, 10, 8.2); c.lineTo(11.7, 15.5); c.quadraticCurveTo(7, 16.8, 2.3, 15.5); c.closePath();
    c.fillStyle = lg(c, 3, 7, 11, 16, [[0, sh(body, 1.35)], [1, sh(body, 0.6)]]); c.fill();
    line(c, 2.3, 15.4, 7, 16.6, 11.7, 15.4, 0.8, sh(trim, 1));
    line(c, 7, 8, 7.2, 12, 7, 15.8, 0.55, sh(trim, 0.9));
    c.fillStyle = sh(trim, 0.8); c.fillRect(4.2, 11.6, 5.6, 0.7);
    circ(c, 7, 5.2, 4.7, rg(c, 5.4, 3.4, 0.4, 5.6, [[0, sh(hood, 1.4)], [1, sh(hood, 0.7)]]));
    ell(c, 7.3, 5.7, 2.4, 2.2, lg(c, 7, 3.5, 7, 8, [[0, '#f6dfc0'], [1, '#d9ae84']]));
    ell(c, 6.2, 5.6, 0.45, 0.55, '#1a1420'); ell(c, 8.5, 5.6, 0.45, 0.55, '#1a1420');
    c.beginPath(); c.arc(7, 5.2, 4.3, Math.PI * 1.02, Math.PI * 1.55); c.lineWidth = 0.55; c.lineCap = 'round';
    c.strokeStyle = 'rgba(255,255,255,0.45)'; c.stroke();
  };
}

function wolfShape(fur, dark, light, eye, ghost) {
  const F = sh(fur, 1); const Dk = sh(dark, 1); const Li = sh(light, 1);
  return (c) => {
    if (ghost) ell(c, 9, 6, 9, 5.6, css(fur, 0.17));
    line(c, 3, 5, -0.5, 2.4, -2, 1.6, 2.2, Dk);
    line(c, 3, 6, -0.2, 5, -1.6, 2.4, 1.2, F);
    for (const x of [4.2, 6.4, 10.2, 12.2]) { c.fillStyle = Dk; c.beginPath(); c.roundRect(x, 7.6, 1.9, 3.8, 0.9); c.fill(); }
    ell(c, 8, 6, 6.7, 3.7, lg(c, 8, 2.2, 8, 9.6, [[0, Li], [0.55, F], [1, Dk]]));
    ell(c, 5.6, 4.6, 2.6, 1.5, 'rgba(255,255,255,0.12)', -0.2);
    poly(c, [11.6, 3.6, 12.1, -0.4, 14.2, 2.4], Dk);
    poly(c, [13.8, 2.4, 15.6, -0.5, 16.4, 3.4], F);
    ell(c, 14, 5, 3.4, 2.9, lg(c, 14, 2, 14, 8, [[0, Li], [1, F]]));
    ell(c, 16.5, 6, 2, 1.3, sh(light, 1.1));
    circ(c, 18.1, 5.6, 0.55, '#15121a');
    if (eye) {
      circ(c, 15.1, 4.3, 1.7, rg(c, 15.1, 4.3, 0, 1.7, [[0, css(eye, 0.85)], [1, css(eye, 0)]]));
      ell(c, 15.1, 4.3, 0.65, 0.5, sh(eye, 1.5));
    }
    c.beginPath(); c.moveTo(3.2, 4); c.quadraticCurveTo(8, 1.6, 12.6, 3.2); c.lineWidth = 0.5; c.lineCap = 'round';
    c.strokeStyle = ghost ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.28)'; c.stroke();
  };
}

const SPRITES = {
  hero_wren: { w: 14, h: 18, shadow: [7, 16.4, 5.6, 1.8], draw: hero(0x7a4b2a, 0xe8b86d, 0xb5783d), pal: 'hero' },
  hero_elias: { w: 14, h: 18, shadow: [7, 16.4, 5.6, 1.8], draw: hero(0xeeeeee, 0xffd24a, 0xdddddd), pal: 'hero' },
  wolf: { w: 18, h: 12, shadow: [9, 10.6, 7, 1.7], enemy: 1, draw: wolfShape(0x6e645e, 0x3f3935, 0x9a8f88, 0xff4a3a) },
  wolfU: { w: 18, h: 12, draw: wolfShape(0x9fd8ff, 0x7bb8e0, 0xdff4ff, 0xffffff, true) },
  crow: {
    w: 14, h: 10, enemy: 1,
    draw: (c) => {
      poly(c, [2.4, 5, -1.2, 3.4, -0.6, 6.4], '#1c1c28');
      ell(c, 6, 5.2, 4.7, 2.7, lg(c, 6, 2.5, 6, 8, [[0, '#3a3a4d'], [1, '#17171f']]));
      c.beginPath(); c.moveTo(3, 4.8); c.quadraticCurveTo(5, -1.6, 9.4, 4.2); c.quadraticCurveTo(6.2, 3.4, 3, 4.8);
      c.fillStyle = lg(c, 3, 0, 9, 5, [[0, '#4d4d66'], [1, '#26263a']]); c.fill();
      circ(c, 10.2, 4.2, 2.5, rg(c, 9.6, 3.4, 0.2, 2.8, [[0, '#46465c'], [1, '#1e1e2b']]));
      poly(c, [11.9, 3.5, 14.3, 4.6, 11.9, 5.5], '#e0b040');
      circ(c, 10.9, 3.6, 1.2, rg(c, 10.9, 3.6, 0, 1.2, [[0, 'rgba(255,90,90,0.9)'], [1, 'rgba(255,90,90,0)']]));
      circ(c, 10.9, 3.6, 0.45, '#ffb0a0');
    },
  },
  root: {
    w: 20, h: 20, shadow: [10, 17, 7.5, 2], enemy: 1,
    draw: (c) => {
      for (let a = 0; a < 7; a++) {
        const ang = (a / 7) * TAU + 0.3;
        const ex = 10 + Math.cos(ang) * 9.2;
        const ey = 10 + Math.sin(ang) * 9.2;
        const m = ang + 0.7;
        line(c, 10, 10, 10 + Math.cos(m) * 6, 10 + Math.sin(m) * 6, ex, ey, 1.9, '#4a3320');
      }
      circ(c, 10, 10, 6.3, rg(c, 8, 7.6, 0.5, 7, [[0, '#9a7448'], [0.6, '#6b4a2b'], [1, '#3d2a18']]));
      ell(c, 8, 7.4, 2.6, 1.6, 'rgba(255,255,255,0.14)', -0.5);
      for (const x of [8, 12]) {
        circ(c, x, 9.8, 1.9, rg(c, x, 9.8, 0, 1.9, [[0, 'rgba(157,255,122,0.9)'], [1, 'rgba(157,255,122,0)']]));
        ell(c, x, 9.8, 0.85, 0.7, '#d8ffc0');
      }
    },
  },
  treant: {
    w: 64, h: 72, shadow: [32, 66.5, 23, 5], enemy: 1, big: 1,
    draw: (c) => {
      line(c, 22, 60, 10, 66, 8, 70, 4.5, '#3a2616'); line(c, 42, 60, 54, 66, 56, 70, 4.5, '#3a2616');
      line(c, 28, 64, 22, 69, 16, 70, 3.5, '#3a2616'); line(c, 36, 64, 42, 69, 48, 70, 3.5, '#3a2616');
      c.beginPath(); c.moveTo(22, 26); c.lineTo(42, 26); c.quadraticCurveTo(46, 48, 45, 66); c.lineTo(19, 66); c.quadraticCurveTo(18, 48, 22, 26); c.closePath();
      c.fillStyle = lg(c, 19, 0, 45, 0, [[0, '#6a4a2e'], [0.45, '#4b331f'], [1, '#2c1d10']]); c.fill();
      c.strokeStyle = 'rgba(20,12,6,0.5)'; c.lineWidth = 0.8;
      for (const x of [26, 31, 37, 41]) { c.beginPath(); c.moveTo(x, 32); c.quadraticCurveTo(x + 2, 48, x - 1, 64); c.stroke(); }
      line(c, 22, 38, 12, 40, 6, 52, 5.5, '#4b331f'); line(c, 42, 38, 52, 40, 58, 52, 5.5, '#4b331f');
      line(c, 6, 52, 3.4, 56, 2, 59, 1.6, '#4b331f'); line(c, 6, 52, 6.4, 57, 6.8, 60, 1.6, '#4b331f');
      line(c, 58, 52, 60.6, 56, 62, 59, 1.6, '#4b331f'); line(c, 58, 52, 57.6, 57, 57.2, 60, 1.6, '#4b331f');
      for (const [x, y, r, d] of [[14, 29, 11.5, 0], [50, 29, 11.5, 0], [32, 20, 20.5, 1]]) {
        circ(c, x, y, r, rg(c, x - r * 0.3, y - r * 0.4, r * 0.1, r * 1.05, [[0, d ? '#3d7a3f' : '#356f38'], [0.6, '#235a28'], [1, '#143818']]));
      }
      circ(c, 26, 13, 8, rg(c, 25, 12, 0, 8, [[0, 'rgba(160,230,150,0.45)'], [1, 'rgba(160,230,150,0)']]));
      circ(c, 41, 18, 6, 'rgba(120,200,120,0.13)');
      ell(c, 26, 25, 7, 1.6, 'rgba(40,90,40,0.7)'); ell(c, 38.5, 25.5, 6, 1.4, 'rgba(40,90,40,0.7)');
      for (const x of [27, 37]) {
        circ(c, x, 40, 4.2, rg(c, x, 40, 0, 4.2, [[0, 'rgba(255,170,60,0.95)'], [1, 'rgba(255,170,60,0)']]));
        ell(c, x, 40, 2.1, 1.4, '#ffd58a', x < 32 ? 0.25 : -0.25);
      }
      c.beginPath(); c.moveTo(27, 49); c.quadraticCurveTo(32, 52, 37, 49); c.quadraticCurveTo(32, 50.4, 27, 49);
      c.fillStyle = '#150d07'; c.fill();
      ell(c, 26, 56, 4, 1.2, 'rgba(90,160,90,0.55)');
    },
  },
  raven: {
    w: 12, h: 10,
    draw: (c) => {
      circ(c, 6, 5, 6, rg(c, 6, 5, 0, 6, [[0, 'rgba(106,79,200,0.45)'], [1, 'rgba(106,79,200,0)']]));
      poly(c, [2.2, 5, -0.4, 3.8, 0, 6.2], '#241a48');
      ell(c, 6, 5, 4.3, 2.3, lg(c, 6, 3, 6, 7.5, [[0, '#5a49a8'], [1, '#2a1f58']]));
      c.beginPath(); c.moveTo(3, 4.4); c.quadraticCurveTo(5.4, -1, 8.8, 4); c.quadraticCurveTo(6, 3.3, 3, 4.4);
      c.fillStyle = lg(c, 3, 0, 9, 4, [[0, '#8a6fe0'], [1, '#3d2f80']]); c.fill();
      circ(c, 9, 4, 2, '#3a2c78'); poly(c, [10.4, 3.6, 12, 4.2, 10.4, 4.9], '#e0b040');
      circ(c, 9.5, 3.6, 0.45, '#dcd2ff');
    },
  },
  orb: {
    w: 12, h: 12, pad: 0,
    draw: (c) => {
      circ(c, 6, 6, 6, rg(c, 6, 6, 1, 6, [[0, 'rgba(232,224,255,0.5)'], [1, 'rgba(232,224,255,0)']]));
      circ(c, 6, 6, 3.6, rg(c, 5, 5, 0.3, 3.8, [[0, '#ffffff'], [0.5, '#b8f2ff'], [1, '#6fc8e8']]));
      circ(c, 4.9, 4.9, 1.2, 'rgba(255,255,255,0.95)');
    },
  },
  gem: {
    w: 8, h: 10,
    draw: (c) => {
      const T = 0x6fd3c5;
      c.beginPath(); c.moveTo(4, 0); c.lineTo(8, 4.2); c.lineTo(4, 10); c.lineTo(0, 4.2); c.closePath();
      c.fillStyle = lg(c, 0, 0, 8, 10, [[0, sh(T, 1.5)], [1, sh(T, 0.55)]]); c.fill();
      poly(c, [4, 0, 8, 4.2, 4, 4.2], sh(T, 1.4)); poly(c, [4, 0, 0, 4.2, 4, 4.2], sh(T, 1.15));
      poly(c, [0, 4.2, 4, 4.2, 4, 10], sh(T, 0.8)); poly(c, [8, 4.2, 4, 4.2, 4, 10], sh(T, 0.6));
      poly(c, [4, 0.9, 5.4, 3.2, 4, 3.2], 'rgba(255,255,255,0.8)');
    },
  },
  heart: {
    w: 12, h: 11, shadow: [6, 10.2, 4, 0.9],
    draw: (c) => {
      c.beginPath(); c.moveTo(6, 10.6); c.bezierCurveTo(-1.5, 5.4, 1.2, -0.6, 6, 2.8); c.bezierCurveTo(10.8, -0.6, 13.5, 5.4, 6, 10.6); c.closePath();
      c.fillStyle = rg(c, 4.5, 3.4, 0.4, 8, [[0, '#ff8a9c'], [0.5, '#e0455a'], [1, '#9a1f38']]); c.fill();
      ell(c, 3.6, 3, 1.5, 1, 'rgba(255,255,255,0.7)', -0.6);
    },
  },
  magnet: {
    w: 12, h: 12,
    draw: (c) => {
      c.beginPath(); c.moveTo(2.6, 1.5); c.lineTo(2.6, 6.6); c.arc(6, 6.6, 3.4, Math.PI, 0, true); c.lineTo(9.4, 1.5);
      c.lineWidth = 2.9; c.lineCap = 'butt'; c.lineJoin = 'round'; c.strokeStyle = lg(c, 0, 0, 12, 12, [[0, '#a98aff'], [1, '#5a36c8']]); c.stroke();
      c.fillStyle = '#f2ecff'; c.fillRect(1.15, 0.6, 2.9, 2.4); c.fillRect(7.95, 0.6, 2.9, 2.4);
      c.fillStyle = 'rgba(255,255,255,0.35)'; c.fillRect(1.6, 3.2, 0.8, 3.5);
    },
  },
  bolt: {
    w: 10, h: 10, pad: 0,
    draw: (c) => {
      circ(c, 5, 5, 5, rg(c, 5, 5, 0.5, 5, [[0, 'rgba(127,240,255,0.55)'], [1, 'rgba(127,240,255,0)']]));
      circ(c, 5, 5, 3, rg(c, 5, 5, 0, 3, [[0, '#ffffff'], [0.5, '#9af4ff'], [1, '#4ad0f0']]));
      circ(c, 5, 5, 1.3, '#ffffff');
    },
  },
  tree: {
    w: 30, h: 42, shadow: [15, 40, 10, 2],
    draw: (c) => {
      c.beginPath(); c.moveTo(12, 40); c.lineTo(13, 24); c.lineTo(17.4, 24); c.lineTo(18.6, 40); c.closePath();
      c.fillStyle = lg(c, 12, 0, 19, 0, [[0, '#2a3a4a'], [1, '#0d121c']]); c.fill();
      for (const [x, y, r] of [[8, 21, 8.5], [22, 21, 8.5], [15, 17, 12.5]]) circ(c, x, y, r, rg(c, x - r * 0.35, y - r * 0.4, r * 0.1, r * 1.1, [[0, '#1f3a50'], [0.7, '#132433'], [1, '#0a121b']]));
      circ(c, 12, 12, 7, rg(c, 11, 11, 0, 7, [[0, 'rgba(111,211,197,0.32)'], [1, 'rgba(111,211,197,0)']]));
      circ(c, 11, 12, 2.2, 'rgba(160,230,220,0.28)');
      c.beginPath(); c.arc(15, 17, 12, Math.PI * 1.05, Math.PI * 1.62); c.lineWidth = 0.7; c.lineCap = 'round'; c.strokeStyle = 'rgba(150,225,215,0.5)'; c.stroke();
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

// A: thin light-lavender rim so enemies read against the dusk grade.
function rimOutline(cv, col, px, alpha) {
  const o = mkCanvas(cv.width, cv.height);
  const x = o.getContext('2d');
  x.globalAlpha = alpha;
  for (const d of [[-px, 0], [px, 0], [0, -px], [0, px]]) x.drawImage(cv, d[0], d[1]);
  x.globalAlpha = 1;
  x.globalCompositeOperation = 'source-in';
  x.fillStyle = col; x.fillRect(0, 0, o.width, o.height);
  x.globalCompositeOperation = 'source-over';
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
  if (style === 'a' && def.enemy) return { cv: rimOutline(cv, '#d6b8e0', S * 0.4, 0.5), S };
  return { cv, S };
}

// ---- ground ------------------------------------------------------------------------------
function rnd(seed) {
  let s = seed >>> 0;
  return () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

// A: 512-unit seamless tile at 2 texels/unit: soft moss blotches, mist, grain, faint blades.
function groundA() {
  const N = 1024;
  const cv = mkCanvas(N, N);
  const c = cv.getContext('2d');
  const r = rnd(7);
  c.fillStyle = '#1f3042'; c.fillRect(0, 0, N, N);
  const wrap = (fn) => { for (const dx of [-N, 0, N]) for (const dy of [-N, 0, N]) fn(dx, dy); };
  const blot = (n, rmin, rmax, cols, amin, amax) => {
    for (let i = 0; i < n; i++) {
      const x = r() * N; const y = r() * N; const rad = rmin + r() * (rmax - rmin);
      const col = cols[(r() * cols.length) | 0]; const a = amin + r() * (amax - amin);
      wrap((dx, dy) => {
        if (x + dx < -rad || x + dx > N + rad || y + dy < -rad || y + dy > N + rad) return;
        c.fillStyle = rg(c, x + dx, y + dy, 0, rad, [[0, `rgba(${col},${a})`], [1, `rgba(${col},0)`]]);
        c.fillRect(x + dx - rad, y + dy - rad, rad * 2, rad * 2);
      });
    }
  };
  blot(46, 90, 220, ['38,56,74', '27,42,58', '16,26,40'], 0.35, 0.7);
  blot(60, 50, 150, ['56,92,90', '44,84,78', '48,72,92'], 0.16, 0.34);
  blot(26, 60, 140, ['8,12,22'], 0.25, 0.5);
  blot(22, 30, 80, ['90,140,150'], 0.06, 0.12);
  c.lineCap = 'round';
  for (let i = 0; i < 700; i++) {
    const x = r() * N; const y = r() * N; const hgt = 6 + r() * 12; const lean = (r() - 0.5) * 8;
    const col = r() < 0.6 ? '58,92,86' : '84,128,116'; const a = 0.1 + r() * 0.2;
    wrap((dx, dy) => {
      if (x + dx < -20 || x + dx > N + 20 || y + dy < -20 || y + dy > N + 20) return;
      c.strokeStyle = `rgba(${col},${a})`; c.lineWidth = 1.4 + r() * 0.8;
      c.beginPath(); c.moveTo(x + dx, y + dy); c.quadraticCurveTo(x + dx + lean * 0.3, y + dy - hgt * 0.5, x + dx + lean, y + dy - hgt); c.stroke();
    });
  }
  const id = c.getImageData(0, 0, N, N);
  const d = id.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (r() - 0.5) * 7;
    d[i] = d[i] * 1.55 + n; d[i + 1] = d[i + 1] * 1.55 + n; d[i + 2] = d[i + 2] * 1.55 + n * 1.2; // mid-value ground: darkness comes from the lightmap
  }
  c.putImageData(id, 0, 0);
  return cv;
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

// ---- damage-number digits ---------------------------------------------------------------
// 10 glyph cells, 5x7 units each, drawn into a canvas at k texels per unit.
function digitsCanvas(style) {
  const k = 4;
  const cv = mkCanvas(50 * k, 7 * k);
  const c = cv.getContext('2d');
  if (style === 'b') {
    const G = ['111101101101111', '010110010010111', '111001111100111', '111001111001111', '101101111001001',
      '111100111001111', '111100111101111', '111001001001001', '111101111101111', '111101111001111'];
    G.forEach((bits, i) => {
      for (let q = 0; q < 15; q++) {
        if (bits[q] !== '1') continue;
        c.fillStyle = '#07070d'; c.fillRect((i * 5 + 2 + (q % 3)) * k, (1 + Math.floor(q / 3)) * k, k, k);
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
  c.font = `700 ${6.4 * k}px "Trebuchet MS", "Segoe UI", system-ui, sans-serif`;
  c.textAlign = 'center'; c.textBaseline = 'middle';
  c.lineJoin = 'round';
  for (let i = 0; i < 10; i++) {
    const cx = (i * 5 + 2.5) * k;
    const cy = 3.7 * k;
    c.lineWidth = 1.5 * k; c.strokeStyle = 'rgba(7,7,13,0.92)'; c.strokeText(String(i), cx, cy);
    c.fillStyle = '#fff'; c.fillText(String(i), cx, cy);
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
  }
  const gcv = style === 'b' ? groundB() : groundA();
  const gt = scene.textures.addCanvas('ground', gcv);
  if (nearest) gt.setFilter(1);
  INV.ground = style === 'b' ? 0.5 : 0.5;
  vignette(scene);
  const dg = digitsCanvas(style);
  const dt = scene.textures.addCanvas('digits', dg.cv);
  if (nearest) dt.setFilter(1);
  INV.digits = 1 / dg.k;
  const dot = mkCanvas(2, 2);
  dot.getContext('2d').fillStyle = '#fff';
  dot.getContext('2d').fillRect(0, 0, 2, 2);
  scene.textures.addCanvas('dot', dot);
  INV.dot = 1;
  return dg.k;
}
