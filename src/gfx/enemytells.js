// EN3-EN5: telegraph decals for the data-driven telegraph enemies + the Stoat Piper's thorns. Visual only (reads sim state, never writes it).
// Drawn into the scene's telegraph Graphics (depth above the vignette: a threat is never darkened, docs/design/enemies-v1.md F2).
// Red-orange #ff5a3c (corruption.accent) is reserved for eyes + danger tells. Every tell also has a body cue in the atlas frames (shape change
// for colour-blind players). Reduced motion: decals still shown (threat cues), only the decorative pulse is dropped. No allocation per call.
import { TELE_FAINT, WOLF_TELL_T } from './telebudget.js';
export const TELL_RO = 0xff5a3c;
const RIM = 0x1a1020; // dark rim under every decal so it separates from a pile of enemies (DR2)
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

// DR2 Fell Wolf lunge: a small chevron on the GROUND at the wolf's feet pointing along the locked lunge (replaces the long line + the floating
// triangle on every wolf). mode 2 = full strength (this lunge will reach the hero), 1 = faint. Dark rim, squashed to the ground plane.
export function drawWolfChevron(g, e, mode) {
  const k = Math.max(0, Math.min(1, 1 - e.stT / (e.teleT || WOLF_TELL_T))), a = mode === 2 ? 0.55 + 0.4 * k : TELE_FAINT;
  const ux = e.dx, uy = e.dy * 0.7, px = -e.dy * 5, py = e.dx * 5 * 0.7; // y squashed: a decal lying on the ground
  const fx = e.x + ux * 7, fy = e.y + 5 + uy * 7; // starts just ahead of the paws
  const tx = fx + ux * 15, ty = fy + uy * 15;
  g.fillStyle(RIM, 0.8 * (mode === 2 ? 1 : 0.5)).fillTriangle(tx + ux * 3, ty + uy * 3, fx + px * 1.35, fy + py * 1.35, fx - px * 1.35, fy - py * 1.35);
  g.fillStyle(TELL_RO, a).fillTriangle(tx, ty, fx + px, fy + py, fx - px, fy - py);
}

export function drawEnemyTells(g, e, calm, threat = true) {
  const A = e.ai, k = prog(e), f = threat ? 1 : TELE_FAINT; // DR2: only a tell that will reach the hero is bright
  if (A.kind === 'ranged') {
    // Stoat Piper aim tick: a thin dashed line from the pipe tip along the locked aim, growing with the tell, a small ring at its end
    const mx = e.x + e.dx * (A.muzzle + 4), my = e.y - 6 + e.dy * (A.muzzle + 4), len = 34 + 56 * k;
    g.lineStyle(1.2, TELL_RO, (0.45 + 0.45 * k) * f);
    dashes(g, mx, my, e.dx, e.dy, len, 5, 4);
    g.lineStyle(1.2, TELL_RO, (0.5 + 0.4 * k) * f).strokeCircle(mx + e.dx * len, my + e.dy * len, 3);
  } else if (A.kind === 'fuse') {
    // Puffback Toad fuse ring: the full burst radius outlined from the first frame (you know where NOT to stand), an inner disc FILLS to it
    // over the fuse; the outline brightens as it fills. Exactly the sim's burst radius (+ the hero's own radius is the hit test).
    const R = A.burstR;
    // DR2: while the hero stands inside the disc the fill is capped (0.18 in all) so she is never buried under it; the ring stroke is unchanged
    if (threat) { g.fillStyle(TELL_RO, 0.06).fillCircle(e.x, e.y, R); g.fillStyle(TELL_RO, 0.12).fillCircle(e.x, e.y, Math.max(1, R * k)); }
    else { g.fillStyle(TELL_RO, (0.07 + 0.08 * k) * f).fillCircle(e.x, e.y, R); g.fillStyle(TELL_RO, 0.2 * f).fillCircle(e.x, e.y, Math.max(1, R * k)); }
    g.lineStyle(3, RIM, 0.35 * f).strokeCircle(e.x, e.y, R);
    g.lineStyle(1.6, TELL_RO, (0.55 + 0.4 * k) * f).strokeCircle(e.x, e.y, R);
  } else if (A.kind === 'charger' || A.kind === 'alpha') {
    // Bramble Hart / Branch-Mane charge lane: the WHOLE locked lane (exact charge length = speed x chargeMul x charge) as a soft band + a dashed centre line
    // + an arrow head at the end; drawn at full length from the first frame of the tell (where it will go), brightening as the tell runs.
    const len = e.speed * A.chargeMul * A.charge, w = e.r + 6, px = -e.dy, py = e.dx, x1 = e.x + e.dx * len, y1 = e.y + e.dy * len;
    g.fillStyle(TELL_RO, (0.08 + 0.1 * k) * f);
    g.fillTriangle(e.x + px * w, e.y + py * w, x1 + px * w, y1 + py * w, x1 - px * w, y1 - py * w);
    g.fillTriangle(e.x + px * w, e.y + py * w, x1 - px * w, y1 - py * w, e.x - px * w, e.y - py * w);
    g.lineStyle(1.4, TELL_RO, (0.5 + 0.4 * k) * f);
    dashes(g, e.x, e.y, e.dx, e.dy, len, 9, 6);
    g.lineStyle(2, TELL_RO, (0.55 + 0.4 * k) * f);
    g.lineBetween(x1, y1, x1 - e.dx * 10 + px * 7, y1 - e.dy * 10 + py * 7);
    g.lineBetween(x1, y1, x1 - e.dx * 10 - px * 7, y1 - e.dy * 10 - py * 7);
  }
}

// thorns: a dark bramble spike with a dark rim, an ember ring and a cream core (reads like an eye-point against the dark, G1) and a faint red-orange
// streak behind. DR2 visibility floor: drawn at no less than 5 world units (was 3) with a near-black rim, so it still shows over a pile of enemies;
// Low keeps the same body without the streak. Colours unchanged.
export function drawThorns(g, shots, x0, y0, x1, y1, low) {
  for (const s of shots) {
    if (s.x < x0 || s.x > x1 || s.y < y0 || s.y > y1) continue;
    const sp = Math.hypot(s.vx, s.vy) || 1, ux = s.vx / sp, uy = s.vy / sp, px = -uy, py = ux;
    const x = s.x, y = s.y - 6; // flies at pipe height
    if (!low) { g.lineStyle(2, TELL_RO, 0.4); g.lineBetween(x - ux * 18, y - uy * 18, x - ux * 5, y - uy * 5); }
    g.fillStyle(RIM, 0.9).fillTriangle(x + ux * 10, y + uy * 10, x - ux * 6 + px * 5.4, y - uy * 6 + py * 5.4, x - ux * 6 - px * 5.4, y - uy * 6 - py * 5.4); // dark rim
    g.fillStyle(THORN_DARK, 1).fillTriangle(x + ux * 8, y + uy * 8, x - ux * 5 + px * 3.6, y - uy * 5 + py * 3.6, x - ux * 5 - px * 3.6, y - uy * 5 - py * 3.6);
    g.lineStyle(1.4, THORN_EMBER, 0.95).lineBetween(x - ux * 3, y - uy * 3, x + ux * 5, y + uy * 5);
    g.fillStyle(THORN_CORE, 1).fillCircle(x + ux * 2, y + uy * 2, 1.6);
  }
}

// Puffback Toad burst (pale spore puff + a quick ring at the burst radius) / fizzle (a small grey puff, harmless). ttl-driven; Calm = no growth.
export function drawBurstFx(g, f, calm) {
  if (f.kind === 'burst') {
    const k = Math.max(0, Math.min(1, f.ttl / 0.45)), grow = calm ? 1 : 1.05 - 0.25 * k;
    g.fillStyle(0xc9d2c4, 0.35 * k).fillCircle(f.x, f.y, f.r * 0.8 * grow);
    g.lineStyle(2, TELL_RO, 0.7 * k).strokeCircle(f.x, f.y, f.r * grow);
    g.fillStyle(0xe6ece0, 0.5 * k).fillCircle(f.x, f.y - 6, 7 * (calm ? 1 : 1.6 - 0.6 * k));
  } else {
    const k = Math.max(0, Math.min(1, f.ttl / 0.35));
    g.fillStyle(0x9aa39a, 0.45 * k).fillCircle(f.x, f.y - 4, f.r * (calm ? 0.8 : 1.2 - 0.4 * k));
  }
}
