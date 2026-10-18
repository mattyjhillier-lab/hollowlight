// EN3-EN5: telegraph decals for the data-driven telegraph enemies + the Stoat Piper's thorns. Visual only (reads sim state, never writes it).
// Drawn into the scene's telegraph Graphics (depth above the vignette: a threat is never darkened, docs/design/enemies-v1.md F2).
// Red-orange #ff5a3c (corruption.accent) is reserved for eyes + danger tells. Every tell also has a body cue in the atlas frames (shape change
// for colour-blind players). Reduced motion: decals still shown (threat cues), only the decorative pulse is dropped. No allocation per call.
export const TELL_RO = 0xff5a3c;
const THORN_DARK = 0x2a2236;
const THORN_EMBER = 0xff8a50;
const THORN_CORE = 0xffe9c4;

// progress 0..1 through the tell (direction/position locked at tell start in the sim)
const prog = (e) => { const T = e.ai.tell ?? e.ai.fuse ?? 1; return Math.max(0, Math.min(1, 1 - e.stT / T)); };

// dashed segment helper (Graphics has no dash): n dashes of len on / gap off from (x, y) along (ux, uy)
function dashes(g, x, y, ux, uy, total, on, off) {
  for (let d = 0; d < total; d += on + off) {
    const d1 = Math.min(total, d + on);
    g.lineBetween(x + ux * d, y + uy * d, x + ux * d1, y + uy * d1);
  }
}

export function drawEnemyTells(g, e, calm) {
  const A = e.ai, k = prog(e);
  if (A.kind === 'ranged') {
    // Stoat Piper aim tick: a thin dashed line from the pipe tip along the locked aim, growing with the tell, a small ring at its end
    const mx = e.x + e.dx * (A.muzzle + 4), my = e.y - 6 + e.dy * (A.muzzle + 4), len = 34 + 56 * k;
    g.lineStyle(1.2, TELL_RO, 0.45 + 0.45 * k);
    dashes(g, mx, my, e.dx, e.dy, len, 5, 4);
    g.lineStyle(1.2, TELL_RO, 0.5 + 0.4 * k).strokeCircle(mx + e.dx * len, my + e.dy * len, 3);
  }
}

// thorns: a dark bramble spike with an ember/cream core (reads like an eye-point against the dark, G1) and a faint red-orange streak behind
export function drawThorns(g, shots, x0, y0, x1, y1, low) {
  for (const s of shots) {
    if (s.x < x0 || s.x > x1 || s.y < y0 || s.y > y1) continue;
    const sp = Math.hypot(s.vx, s.vy) || 1, ux = s.vx / sp, uy = s.vy / sp, px = -uy, py = ux;
    const x = s.x, y = s.y - 6; // flies at pipe height
    if (!low) { g.lineStyle(1.4, TELL_RO, 0.32); g.lineBetween(x - ux * 16, y - uy * 16, x - ux * 4, y - uy * 4); }
    g.fillStyle(THORN_DARK, 1).fillTriangle(x + ux * 6, y + uy * 6, x - ux * 4 + px * 2, y - uy * 4 + py * 2, x - ux * 4 - px * 2, y - uy * 4 - py * 2);
    g.lineStyle(1, THORN_EMBER, 0.95).lineBetween(x - ux * 2, y - uy * 2, x + ux * 3, y + uy * 3);
    g.fillStyle(THORN_CORE, 1).fillCircle(x + ux * 1.5, y + uy * 1.5, 0.9);
  }
}
