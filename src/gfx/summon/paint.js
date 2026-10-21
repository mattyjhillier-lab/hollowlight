// S0 painter for the summon atlas: small canvas-2D helpers in the Hollowlight Style v1 friendly-spirit recipe
// (L2 tinted outline, H2 soft gradient with a WARM rim, P1 chibi, warm ember heart) plus placeholder silhouettes per group.
// The real creature art lands in S1-S7 and replaces PAINTERS entries only; frame ids, sizes and anchors stay fixed.
// Pure drawing against a 2D context (testable with a fake ctx); no DOM at import time.
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
export const PAINTERS = { wolf: body, alpha: body, echo: body, raven: body, low: body, glyph: body, flame: body, decal: body };

// Draws every frame at its packed rect, clipped so a painter can never bleed into a neighbour. Returns the number of frames drawn.
export function paintAll(c, packed) {
  let n = 0;
  for (const f of packed.frames) {
    c.save();
    c.beginPath(); c.rect(f.x, f.y, f.w, f.h); c.clip();
    (PAINTERS[f.group] || body)(c, f, f.x, f.y);
    c.restore(); n++;
  }
  return n;
}
