// S0 painter for the summon atlas: small canvas-2D helpers in the Hollowlight Style v1 friendly-spirit recipe
// (L2 tinted outline, H2 soft gradient with a WARM rim, P1 chibi, warm ember heart) plus placeholder silhouettes per group.
// The real creature art lands in S1-S7 and replaces PAINTERS entries only; frame ids, sizes and anchors stay fixed.
// Pure drawing against a 2D context (testable with a fake ctx); no DOM at import time.
import { featherDecal, waxSealDecal } from './raven.js';
const TAU = Math.PI * 2;
export const ROLE_COL = {
  wolf: [159, 216, 255], raven: [183, 156, 255], bolt: [127, 240, 255], orbit: [232, 224, 255], fx: [255, 241, 200],
};
export const WARM = [255, 241, 200], EMBER = [255, 207, 122];
export const rgb = (c, a = 1) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
export const shade = (c, k) => [Math.round(c[0] * k), Math.round(c[1] * k * 0.98), Math.min(255, Math.round(c[2] * k * 1.04))];
export const lift = (c, k) => [Math.min(255, Math.round(c[0] * k)), Math.min(255, Math.round(c[1] * k)), Math.min(255, Math.round(c[2] * k))];

// body blob: tinted outline, soft gradient, warm top-left rim
export function blob(c, cx, cy, rx, ry, rot, col, lw = 3) {
  c.beginPath(); c.ellipse(cx, cy, rx + lw, ry + lw, rot, 0, TAU); c.fillStyle = rgb(shade(col, 0.55)); c.fill();
  const g = c.createLinearGradient(cx - rx, cy - ry, cx + rx, cy + ry);
  g.addColorStop(0, rgb(lift(col, 1.12))); g.addColorStop(1, rgb(shade(col, 0.9)));
  c.beginPath(); c.ellipse(cx, cy, rx, ry, rot, 0, TAU); c.fillStyle = g; c.fill();
  c.beginPath(); c.ellipse(cx - rx * 0.25, cy - ry * 0.4, rx * 0.5, ry * 0.28, rot, 0, TAU); c.fillStyle = rgb(WARM, 0.45); c.fill();
}
export function ember(c, x, y, r) {
  const g = c.createRadialGradient(x, y, 0, x, y, r * 2.4);
  g.addColorStop(0, rgb(EMBER, 0.85)); g.addColorStop(1, rgb(EMBER, 0));
  c.fillStyle = g; c.beginPath(); c.arc(x, y, r * 2.4, 0, TAU); c.fill();
  c.beginPath(); c.arc(x, y, r * 0.7, 0, TAU); c.fillStyle = rgb(WARM, 0.95); c.fill();
}

// Placeholder painter: (ctx, frame, ox, oy) with (ox, oy) = the frame's top-left. S1+ replace entries in PAINTERS per group.
function body(c, f, ox, oy) {
  const col = ROLE_COL[f.role] || ROLE_COL.fx;
  const cx = ox + f.w * 0.5, cy = oy + f.h * (f.ay > 0.6 ? 0.55 : 0.5);
  blob(c, cx, cy, f.w * 0.3, f.h * (f.ay > 0.6 ? 0.22 : 0.3), 0, col);
  ember(c, cx, cy, Math.min(f.w, f.h) * 0.06);
}
// S2 Light Trails pawprint (decal_paw): a cream pad + 4 toe beans with the wolf's tinted ink outline over a soft moon-blue glow; drawn near-white
// so the scene can fade it; centred in its 48 x 48 frame, toes toward -y (the sprite is rotated to the stride heading + 90 deg).
export const PAW_INK = [44, 90, 146], PAW_GLOW = [159, 216, 255];
export function paw(c, f, ox, oy) {
  const cx = ox + f.w / 2, cy = oy + f.h / 2, s = f.w / 48;
  const g = c.createRadialGradient(cx, cy, 0, cx, cy, 22 * s);
  g.addColorStop(0, rgb(PAW_GLOW, 0.55)); g.addColorStop(0.5, rgb(PAW_GLOW, 0.22)); g.addColorStop(1, rgb(PAW_GLOW, 0));
  c.fillStyle = g; c.beginPath(); c.arc(cx, cy, 22 * s, 0, TAU); c.fill();
  const toes = [[-8.6, -6.4, 3.3], [-3.1, -10.4, 3.5], [3.1, -10.4, 3.5], [8.6, -6.4, 3.3]];
  const shape = (grow) => {
    c.beginPath(); c.ellipse(cx, cy + 4.5 * s, (7.4 + grow) * s, (6 + grow) * s, 0, 0, TAU);
    for (const [x, y, r] of toes) { c.moveTo(cx + (x + r + grow) * s, cy + y * s); c.arc(cx + x * s, cy + y * s, (r + grow) * s, 0, TAU); }
  };
  shape(1.6); c.fillStyle = rgb(PAW_INK, 0.9); c.fill();
  shape(0); c.fillStyle = rgb(WARM, 1); c.fill();
  c.beginPath(); c.ellipse(cx - 2 * s, cy + 2.6 * s, 3.2 * s, 2 * s, 0, 0, TAU); c.fillStyle = 'rgba(255,255,255,0.9)'; c.fill();
}
const none = () => {};
// S3: the raven frames (plain, gold, Low flats) are painted by the lazy raven bake (atlas.js bakeRavenArt); feather + wax seal are canvas decals
export const NAMED = { decal_paw: paw, decal_feather: featherDecal, decal_waxseal: waxSealDecal, raven_flat0: none, raven_flat1: none };
export const PAINTERS = { wolf: none, // S1/S2: every wolf frame (base, overlays, Alpha, Echo, rimmed, Light Trails) is painted by the async wolf bake (atlas.js bakeWolfArt)
   alpha: none, echo: none, wolfg: none, lfoot: none, raven: none, ravg: none, low: body, glyph: body, flame: body, decal: body };

// Draws every frame at its packed rect, clipped so a painter can never bleed into a neighbour. Returns the number of frames drawn.
export function paintAll(c, packed) {
  let n = 0;
  for (const f of packed.frames) {
    c.save();
    c.beginPath(); c.rect(f.x, f.y, f.w, f.h); c.clip();
    (NAMED[f.name] || PAINTERS[f.group] || body)(c, f, f.x, f.y);
    c.restore(); n++;
  }
  return n;
}
