// Title cover: code-drawn scenery helpers (Canvas 2D). Ported from the approved title sandbox; the heroes themselves are the game's own rigs (wrenart.js, eliasart.js).
// Browser-only (takes a 2D context); the pure maths lives in titlelogic.js. Look: drained blue-grey meadow with grey tufts, chunky cartoon trees with tinted outline and
// rim light, colour (green, flowers) painted in a second copy that the cover reveals around the lantern.
import { mixc, rgba, hex2, clamp, rng } from './titlelogic.js';

const TAU = Math.PI * 2;

export function glow(c, x, y, r, col, a) {
  const g = c.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, rgba(col, a)); g.addColorStop(0.2, rgba(col, a * 0.6)); g.addColorStop(0.45, rgba(col, a * 0.24)); g.addColorStop(0.75, rgba(col, a * 0.06)); g.addColorStop(1, rgba(col, 0));
  c.fillStyle = g; c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill();
}

export const PALS = {
  grey: { canopy: '#3a4864', trunk: '#2a3550', rim: '#6c7c9a' },
  col: { canopy: '#3f7d5a', canopyF: '#5a8f62', trunk: '#6a4a38', rim: '#ffd9a0' },
};

/** Painted ground: colour (green, flowers) when tint = 1, drained grey when tint = 0. */
export function paintGround(c, w, h, seed, night = 0.3, tint = 0) {
  const r = rng(seed);
  const g = c.createLinearGradient(0, 0, 0, h);
  g.addColorStop(0, mixc(mixc('#3a4864', '#161c2c', night), '#4a7a50', tint * 0.85)); g.addColorStop(1, mixc(mixc('#566680', '#222c42', night), '#78a05c', tint * 0.85));
  c.fillStyle = g; c.fillRect(0, 0, w, h);
  for (let i = 0; i < 26; i++) { const x = r() * w, y = r() * h, rr = 40 + r() * 120; const gg = c.createRadialGradient(x, y, 0, x, y, rr); const lite = r() > 0.5; gg.addColorStop(0, lite ? 'rgba(130,150,180,.10)' : 'rgba(10,14,28,.14)'); gg.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = gg; c.fillRect(x - rr, y - rr, rr * 2, rr * 2); }
  const n = Math.round((w * h) / 1250);
  const col = tint ? 1 : 0;
  for (let i = 0; i < n; i++) {
    const x = r() * w, y = r() * h, k = (0.55 + r() * 0.7 * (0.6 + (y / h) * 0.6)) * (w > 500 ? 1 : 0.8), kind = r();
    const gcol = mixc('#7d8ca3', '#8fc27a', col), gcol2 = mixc('#4d5b73', '#4f8f5a', col);
    if (kind < 0.72) { c.lineCap = 'round'; for (let b = -1; b <= 1; b++) { c.beginPath(); c.moveTo(x + b * 3 * k, y); c.quadraticCurveTo(x + b * 5 * k, y - 8 * k, x + b * 7 * k + (r() - 0.5) * 3, y - (11 + r() * 5) * k); c.strokeStyle = gcol2; c.lineWidth = 3 * k; c.stroke(); c.strokeStyle = gcol; c.lineWidth = 1.7 * k; c.stroke(); } }
    else if (kind < 0.9) {
      const pet = col > 0.25 ? ['#ffd9a8', '#ffc2c8', '#f6efe0', '#cfc2ff'][(r() * 4) | 0] : '#6f7f97'; const s = 2.4 * k;
      c.fillStyle = mixc('#4d5b73', pet, 0.3); for (let p = 0; p < 5; p++) { const a = (p / 5) * TAU; c.beginPath(); c.arc(x + Math.cos(a) * s, y + Math.sin(a) * s, s * 0.8, 0, TAU); c.fill(); }
      c.fillStyle = mixc('#8d9bb0', pet, col > 0.25 ? 1 : 0); for (let p = 0; p < 5; p++) { const a = (p / 5) * TAU; c.beginPath(); c.arc(x + Math.cos(a) * s, y + Math.sin(a) * s, s * 0.6, 0, TAU); c.fill(); }
      c.fillStyle = col > 0.25 ? '#fff0b8' : '#a9b6c8'; c.beginPath(); c.arc(x, y, s * 0.5, 0, TAU); c.fill();
    } else {
      c.fillStyle = 'rgba(8,12,24,.25)'; c.beginPath(); c.ellipse(x + 1.5, y + 2, 6 * k, 3.4 * k, 0, 0, TAU); c.fill();
      c.fillStyle = mixc('#6b7a92', '#8f9a8a', col * 0.5); c.strokeStyle = '#3d4a62'; c.lineWidth = 1.2; c.beginPath(); c.ellipse(x, y, 6 * k, 3.6 * k, 0, 0, TAU); c.fill(); c.stroke();
    }
  }
}

/** Chunky cartoon tree: tinted outline, soft shade, round canopy blobs, rim light. */
export function drawTree(c, x, y, s, trunk, canopy, rim) {
  const ol = mixc(canopy, '#101428', 0.55);
  c.lineJoin = 'round'; c.fillStyle = ol; c.fillRect(x - 7 * s - 2, y - 40 * s, 14 * s + 4, 40 * s + 2); c.fillStyle = trunk; c.fillRect(x - 7 * s, y - 40 * s, 14 * s, 40 * s);
  const blobs = [[0, -60, 34], [-26, -44, 26], [26, -46, 27], [-12, -86, 26], [14, -82, 28], [0, -104, 22]];
  for (const pass of [0, 1]) for (const [bx, by, br] of blobs) { c.beginPath(); c.arc(x + bx * s, y + by * s, br * s + (pass ? 0 : 3), 0, TAU); c.fillStyle = pass ? canopy : ol; c.fill(); }
  c.save(); c.globalAlpha = 0.55; for (const [bx, by, br] of blobs) { c.beginPath(); c.arc(x + (bx + 4) * s, y + (by + 5) * s, br * s * 0.9, 0, TAU); c.fillStyle = mixc(canopy, '#0b1020', 0.35); c.fill(); } c.restore();
  c.save(); c.globalAlpha = 0.6; c.strokeStyle = rim; c.lineWidth = 2 * s; for (const [bx, by, br] of blobs.slice(3)) { c.beginPath(); c.arc(x + bx * s, y + by * s, br * s * 0.8, Math.PI * 1.05, Math.PI * 1.55); c.stroke(); } c.restore();
}
export { mixc, clamp, hex2 };
