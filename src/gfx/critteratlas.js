// AL-5 critter atlas: one small code-drawn canvas with the ambient critters (docs/design/ambient-life-v1.md option 3).
// Hollowlight Style v1: tinted (darker shade of the fill) outline L2, soft gradient + rim light H2, chibi proportions P1 (big head, round body, dark round eye).
// 8 frames of 64x64 texels (4 texels per world unit, feet near the bottom centre): 0 sparrow sitting, 1 sparrow pecking, 2-3 sparrow flying (wings up/down),
// 4 hare sitting, 5 hare leaping, 6-7 moth (wings up/down).
// NOT enemies: warm tan / cream, NO glow, no cold light, no ember eyes; roughly 7-11 world units long (smaller than every enemy).
// Colours stay away from the pickup hues (mint gem, rose heart, violet magnet, gold evolve). Pure drawing, no DOM at import time (testable with a fake 2D ctx).
export const FRAME_PX = 64;
export const COLS = 4;
export const ROWS = 2;
export const FRAME_NAMES = ['spar_sit', 'spar_peck', 'spar_fly0', 'spar_fly1', 'hare_sit', 'hare_leap', 'moth0', 'moth1'];
export const FRAME_COUNT = FRAME_NAMES.length;
export const TEXELS_PER_UNIT = 4;
export const ORIGIN_Y = 58 / FRAME_PX; // feet line inside the frame
export const ATLAS_KEY = 'critterAtlas';
// body colours (exported so tests can check them against the pickup palette)
export const COLORS = {
  sparrow: [[182, 138, 92], [236, 218, 180], [142, 104, 70]], // back, belly, wing
  hare: [[204, 168, 124], [238, 226, 196], [226, 196, 170]], // coat, belly/tail, inner ear (muted sand, not rose)
  moth: [[238, 228, 202], [196, 174, 136], [214, 200, 168]], // wing, body, wing edge
};

const TAU = Math.PI * 2;
const rgb = (c, a = 1) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
const shade = (c, k) => [Math.round(c[0] * k), Math.round(c[1] * k * 0.98), Math.min(255, Math.round(c[2] * k * 1.04))];
const lift = (c, k) => [Math.min(255, Math.round(c[0] * k)), Math.min(255, Math.round(c[1] * k)), Math.min(255, Math.round(c[2] * k))];
const OUT_K = 0.62; // tinted outline = 62% of the fill (a deeper brown / warm-grey so the small body reads on the pale ground)

// filled blob with tinted outline and a soft top-left rim light
function blob(c, cx, cy, rx, ry, rot, col) {
  c.beginPath(); c.ellipse(cx, cy, rx + 1.7, ry + 1.7, rot, 0, TAU); c.fillStyle = rgb(shade(col, OUT_K)); c.fill();
  const g = c.createLinearGradient(cx - rx, cy - ry, cx + rx, cy + ry);
  g.addColorStop(0, rgb(lift(col, 1.1))); g.addColorStop(1, rgb(shade(col, 0.92)));
  c.beginPath(); c.ellipse(cx, cy, rx, ry, rot, 0, TAU); c.fillStyle = g; c.fill();
  c.beginPath(); c.ellipse(cx - rx * 0.25, cy - ry * 0.38, rx * 0.5, ry * 0.3, rot, 0, TAU); c.fillStyle = rgb(lift(col, 1.12), 0.5); c.fill();
}

function eye(c, x, y, r) {
  c.beginPath(); c.arc(x, y, r, 0, TAU); c.fillStyle = 'rgba(40,30,34,1)'; c.fill();
  c.beginPath(); c.arc(x - r * 0.3, y - r * 0.35, r * 0.34, 0, TAU); c.fillStyle = 'rgba(255,255,255,0.9)'; c.fill();
}

function sparrow(c, ox, oy, pose) {
  const [back, belly, wing] = COLORS.sparrow;
  if (pose === 'fly0' || pose === 'fly1') {
    const up = pose === 'fly0';
    const by = oy - 26;
    blob(c, ox, by, 10, 7, 0, back); // body
    blob(c, ox + 9, by - 3, 6.2, 5.6, 0, back); // head
    blob(c, ox + 5, by + 2, 6.5, 4, 0, belly);
    c.beginPath(); c.moveTo(ox + 14.5, by - 3); c.lineTo(ox + 19, by - 1.6); c.lineTo(ox + 14.5, by - 0.4); c.closePath(); c.fillStyle = rgb(shade([220, 170, 90], 0.95)); c.fill();
    eye(c, ox + 11, by - 4, 1.5);
    blob(c, ox - 12, by + 1, 6.5, 3, -0.2, wing); // tail
    blob(c, ox - 1, by + (up ? -11 : 8), 4.6, 9, up ? -0.5 : 0.5, wing); // wing
    return;
  }
  const peck = pose === 'peck';
  blob(c, ox - 1, oy - 10, 11, 8.6, 0, back); // plump body
  blob(c, ox + 2, oy - 7, 8, 5.8, 0, belly);
  blob(c, ox - 4, oy - 12, 6.6, 5.4, -0.25, wing); // folded wing
  blob(c, ox - 12, oy - 8, 6.5, 2.6, 0.3, wing); // tail
  const hx = ox + (peck ? 11 : 8.5); const hy = oy - (peck ? 14 : 19);
  blob(c, hx, hy, 6.8, 6.4, 0, back); // big chibi head
  c.beginPath(); c.moveTo(hx + 5.4, hy - 1); c.lineTo(hx + (peck ? 10 : 10.5), hy + (peck ? 3 : 0.8)); c.lineTo(hx + 5.2, hy + 2); c.closePath(); c.fillStyle = rgb([226, 178, 96]); c.fill();
  eye(c, hx + 2.4, hy - 1.4, 1.6);
  c.beginPath(); c.moveTo(ox - 1, oy - 1); c.lineTo(ox - 1, oy + 1.5); c.moveTo(ox + 3, oy - 1); c.lineTo(ox + 3, oy + 1.5); c.lineWidth = 1.4; c.strokeStyle = rgb(shade([190, 140, 100], 0.7)); c.stroke(); // legs
}

function hare(c, ox, oy, leap) {
  const [coat, belly, ear] = COLORS.hare;
  if (leap) { // stretched body, ears laid back, legs trailing
    blob(c, ox - 2, oy - 22, 16, 8.6, -0.18, coat);
    blob(c, ox + 1, oy - 18, 11, 4.6, -0.18, belly);
    blob(c, ox + 14, oy - 27, 7.8, 7, 0, coat); // head
    blob(c, ox + 8, oy - 33, 10, 3, -0.5, coat); blob(c, ox + 8, oy - 33, 7, 1.6, -0.5, ear); // ear back
    eye(c, ox + 17, oy - 28.5, 1.7);
    blob(c, ox - 17, oy - 25, 4.2, 4.2, 0, belly); // tail
    blob(c, ox - 12, oy - 13, 8, 3.3, 0.5, coat); // hind leg
    blob(c, ox + 12, oy - 15, 6, 2.6, -0.5, coat); // fore leg
    return;
  }
  blob(c, ox - 1, oy - 14, 13, 12, 0, coat); // round seated body
  blob(c, ox + 3, oy - 10, 8, 7, 0, belly);
  blob(c, ox - 13, oy - 8, 5, 4.8, 0, belly); // cotton tail
  blob(c, ox + 6, oy - 29, 8.4, 7.8, 0, coat); // big chibi head
  blob(c, ox + 1, oy - 44, 3.6, 10.5, -0.12, coat); blob(c, ox + 1, oy - 44, 1.9, 8, -0.12, ear); // ears up
  blob(c, ox + 10, oy - 45, 3.6, 10, 0.18, coat); blob(c, ox + 10, oy - 45, 1.9, 7.5, 0.18, ear);
  eye(c, ox + 10, oy - 30, 1.7);
  c.beginPath(); c.arc(ox + 14.2, oy - 27, 1.4, 0, TAU); c.fillStyle = rgb(shade(ear, 0.8)); c.fill(); // nose
  blob(c, ox - 5, oy - 3, 7, 3, 0, coat); // hind foot
}

function moth(c, ox, oy, up) {
  const [wing, body, edge] = COLORS.moth;
  const cy = oy - 30;
  const ang = up ? 0.9 : 0.25;
  for (const s of [-1, 1]) { // two wing pairs, mirrored
    blob(c, ox + s * 9, cy - (up ? 6 : 1), 10, 6, s * -ang, wing);
    blob(c, ox + s * 6, cy + 4, 6, 3.6, s * ang * 0.6, edge);
  }
  blob(c, ox, cy, 2.6, 7.4, 0, body);
  c.beginPath(); c.moveTo(ox - 1, cy - 6); c.quadraticCurveTo(ox - 5, cy - 12, ox - 7, cy - 11); c.moveTo(ox + 1, cy - 6); c.quadraticCurveTo(ox + 5, cy - 12, ox + 7, cy - 11);
  c.lineWidth = 1.1; c.strokeStyle = rgb(shade(body, 0.7)); c.stroke(); // feelers
}

// Draws every frame into `cv` (FRAME_PX * COLS wide, FRAME_PX * ROWS high).
export function drawCritterAtlas(cv) {
  const c = cv.getContext('2d');
  c.clearRect(0, 0, cv.width, cv.height);
  const cell = (i) => [(i % COLS) * FRAME_PX + FRAME_PX / 2, Math.floor(i / COLS) * FRAME_PX + 58];
  let p;
  p = cell(0); sparrow(c, p[0], p[1], 'sit');
  p = cell(1); sparrow(c, p[0], p[1], 'peck');
  p = cell(2); sparrow(c, p[0], p[1], 'fly0');
  p = cell(3); sparrow(c, p[0], p[1], 'fly1');
  p = cell(4); hare(c, p[0], p[1], false);
  p = cell(5); hare(c, p[0], p[1], true);
  p = cell(6); moth(c, p[0], p[1], true);
  p = cell(7); moth(c, p[0], p[1], false);
  return cv;
}

// Registers the atlas as a Phaser texture with one named frame per sprite. Returns the world units per texel.
export function makeCritterAtlas(scene, mkCanvas) {
  const cv = mkCanvas(FRAME_PX * COLS, FRAME_PX * ROWS);
  drawCritterAtlas(cv);
  if (scene.textures.exists(ATLAS_KEY)) scene.textures.remove(ATLAS_KEY);
  const tex = scene.textures.addCanvas(ATLAS_KEY, cv);
  FRAME_NAMES.forEach((name, i) => tex.add(name, 0, (i % COLS) * FRAME_PX, Math.floor(i / COLS) * FRAME_PX, FRAME_PX, FRAME_PX));
  return 1 / TEXELS_PER_UNIT;
}
