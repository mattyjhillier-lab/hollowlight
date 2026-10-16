// AL-1 ambient atlas: one small code-drawn canvas holding the sway sprites (docs/design/ambient-life-v1.md option 1).
// Hollowlight Style v1: tinted (darker-shade) outline L2, soft base-to-tip gradient + rim light H2, chibi-soft shapes.
// 10 frames of 64x64 texels (4 texels per world unit, base near the bottom centre so a sprite rotates about its base):
//   0-2 meadow tufts, 3-5 fern tufts (Deep Forest), 6-9 flowers (cream, peach, dusty blue, lilac-grey).
// Colours match the restored ground tiles in luminance (readability rule R1: contrast <= ~18%); flowers avoid the pickup
// hues (mint gem, rose heart, violet magnet, gold evolve). Pure drawing, no DOM at import time (testable with a fake 2D ctx).
export const FRAME_PX = 64;
export const ATLAS_COLS = 5;
export const ATLAS_ROWS = 2;
export const FRAME_NAMES = ['t0', 't1', 't2', 'f0', 'f1', 'f2', 'b0', 'b1', 'b2', 'b3'];
export const FRAME_COUNT = FRAME_NAMES.length;
export const TEXELS_PER_UNIT = 4;
export const ORIGIN_Y = 58 / FRAME_PX; // base of the plant inside the frame (rotation pivot)
export const ATLAS_KEY = 'ambAtlas';

const TAU = Math.PI * 2;
function rnd(seed) {
  let s = seed >>> 0;
  return () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const rgb = (c, a = 1) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
const shade = (c, k) => [Math.round(c[0] * k), Math.round(c[1] * k * 0.98), Math.min(255, Math.round(c[2] * k * 1.04))];
const lift = (c, k) => [Math.min(255, Math.round(c[0] * k)), Math.min(255, Math.round(c[1] * k)), Math.min(255, Math.round(c[2] * k))];

// Blade palettes (fill base, fill tip): close to the tile greens so the sprite reads as the same grass, moving.
const MEADOW = [[[116, 184, 93], [130, 196, 102]], [[114, 182, 92], [126, 192, 100]], [[118, 186, 94], [132, 198, 104]]];
const FERN = [[[78, 128, 66], [86, 136, 74]], [[76, 126, 66], [84, 134, 72]], [[80, 130, 68], [88, 138, 76]]];
const PETAL = [
  { petal: [178, 174, 142], centre: [186, 150, 90] }, // cream
  { petal: [200, 150, 120], centre: [186, 150, 90] }, // peach
  { petal: [140, 160, 196], centre: [186, 160, 100] }, // dusty blue
  { petal: [168, 150, 190], centre: [186, 160, 100] }, // lilac-grey (desaturated, not the magnet violet)
];
const OUT_K = 0.9; // tinted outline = 90% of the fill (keeps every pixel within ~17% of the ground luminance)

// One blade: tinted outline stroke under a gradient fill stroke, plus a thin rim-light on the lit side.
function blade(c, x0, y0, x1, y1, cx, cy, w, pal) {
  const out = shade(pal[0], OUT_K);
  c.lineCap = 'round';
  c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo(cx, cy, x1, y1);
  c.lineWidth = w + 2.6; c.strokeStyle = rgb(out); c.stroke();
  const g = c.createLinearGradient(x0, y0, x1, y1);
  g.addColorStop(0, rgb(pal[0])); g.addColorStop(1, rgb(pal[1]));
  c.beginPath(); c.moveTo(x0, y0); c.quadraticCurveTo(cx, cy, x1, y1);
  c.lineWidth = w; c.strokeStyle = g; c.stroke();
  c.beginPath(); c.moveTo(x0 + 0.8, y0 - 1); c.quadraticCurveTo(cx + 0.8, cy, x1 + 0.4, y1 + 1.5);
  c.lineWidth = Math.max(0.8, w * 0.22); c.strokeStyle = rgb(lift(pal[1], 1.07), 0.7); c.stroke();
}

function drawTuft(c, ox, oy, seed, pal, n, h, spread) {
  const r = rnd(seed);
  const bl = [];
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 0 : i / (n - 1) - 0.5;
    bl.push({ t, h: h * (0.72 + r() * 0.42) * (1 - Math.abs(t) * 0.45), bend: (r() - 0.5) * 6 });
  }
  bl.sort((a, b) => Math.abs(b.t) - Math.abs(a.t)); // outer blades first, tall centre blades in front
  for (const b of bl) {
    const x1 = ox + b.t * spread + b.bend * 0.4;
    blade(c, ox + b.t * 7, oy, x1, oy - b.h, ox + b.t * spread * 0.45 + b.bend, oy - b.h * 0.55, 4.2, pal);
  }
}

function drawFlower(c, ox, oy, seed, pet) {
  const r = rnd(seed);
  const gp = MEADOW[seed % 3];
  drawTuft(c, ox, oy, seed + 7, gp, 4, 15, 15); // little grass skirt
  const lean = (r() - 0.5) * 5;
  const hx = ox + lean; const hy = oy - 33 - r() * 3; // flower head
  blade(c, ox, oy - 2, hx, hy + 3, ox + lean * 0.3, oy - 17, 2.6, [[116, 180, 94], [124, 188, 100]]); // stem
  const rot = r() * TAU; const sz = 6.6;
  const line = shade(pet.petal, 0.92);
  for (const pass of [0, 1]) {
    for (let i = 0; i < 5; i++) {
      const a = rot + (i / 5) * TAU;
      c.beginPath(); c.arc(hx + Math.cos(a) * sz * 0.7, hy + Math.sin(a) * sz * 0.7, sz * 0.62, 0, TAU);
      if (pass === 0) { c.lineWidth = 1.8; c.strokeStyle = rgb(line); c.stroke(); } else { c.fillStyle = rgb(pet.petal); c.fill(); }
    }
  }
  c.beginPath(); c.arc(hx - 1.2, hy - 1.4, sz * 0.4, 0, TAU); c.fillStyle = rgb(lift(pet.petal, 1.04), 0.7); c.fill(); // rim light
  c.beginPath(); c.arc(hx, hy, sz * 0.4, 0, TAU); c.fillStyle = rgb(pet.centre); c.fill(); c.lineWidth = 1.2; c.strokeStyle = rgb(shade(pet.centre, 0.95)); c.stroke();
}

// Draws every frame into `cv` (FRAME_PX * ATLAS_COLS wide, FRAME_PX * ATLAS_ROWS high).
export function drawAmbAtlas(cv) {
  const c = cv.getContext('2d');
  c.clearRect(0, 0, cv.width, cv.height);
  const cellOf = (i) => [(i % ATLAS_COLS) * FRAME_PX + FRAME_PX / 2, Math.floor(i / ATLAS_COLS) * FRAME_PX + 58];
  for (let i = 0; i < 3; i++) { const [x, y] = cellOf(i); drawTuft(c, x, y, 11 + i * 17, MEADOW[i], 5 + (i % 2), 29 + i * 2, 22); }
  for (let i = 0; i < 3; i++) { const [x, y] = cellOf(3 + i); drawTuft(c, x, y, 71 + i * 13, FERN[i], 5 + i % 2, 27 + i * 3, 27); }
  for (let i = 0; i < PETAL.length; i++) { const [x, y] = cellOf(6 + i); drawFlower(c, x, y, 5 + i, PETAL[i]); }
  return cv;
}

// Registers the atlas as a Phaser texture with one named frame per sprite. Returns the world units per texel.
export function makeAmbAtlas(scene, mkCanvas) {
  const cv = mkCanvas(FRAME_PX * ATLAS_COLS, FRAME_PX * ATLAS_ROWS);
  drawAmbAtlas(cv);
  if (scene.textures.exists(ATLAS_KEY)) scene.textures.remove(ATLAS_KEY);
  const tex = scene.textures.addCanvas(ATLAS_KEY, cv);
  FRAME_NAMES.forEach((name, i) => tex.add(name, 0, (i % ATLAS_COLS) * FRAME_PX, Math.floor(i / ATLAS_COLS) * FRAME_PX, FRAME_PX, FRAME_PX));
  return 1 / TEXELS_PER_UNIT;
}
