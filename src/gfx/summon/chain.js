// S6 Chain Lightning 'Storm Thread' (render only; reads sim fx, never writes the sim). Pure Phaser-Graphics drawing, no atlas frames
// (the summon atlas page is full): 3-layer arc (faint blurred violet fringe + cyan glow + white core) with small forks, re-jag every 60 ms
// (Calm = steady), a dark crack-star scorch on the ground for 0.5 s where each strike lands (pooled, capped per tier), and the evolved looks:
// Thunder Judgment = sky-crack + capped pillar (70-120 u, never inside the HUD band) with gold edge lines + ground crack ring; Static
// Storm = dashed crackling dome edge + gold hairline + tiny strikes; Storm Tether = braided steady cord with knot beads (no flicker).
import { PAL, ROLE } from '../palette.js';

export const REJAG = 0.06; // s between re-jags (Calm: never)
export const CRACK_LIFE = 0.5; // s a crack-star scorch stays where a strike landed
export const PILLAR_MIN = 70, PILLAR_MAX = 120; // Thunder Judgment column height (world units)
export const HUD_BAND = 0.18; // top share of the view held by the DOM HUD (timer / boss bar): no pillar pixels inside it
// per-tier caps: crack-star decals (impact decals row of the budget, phone x0.6), forks per arc segment, violet fringe on/off, dome dashes
export const CHAIN_CAPS = {
  high: { decals: 40, forks: 2, fringe: true, dashes: 48 },
  med: { decals: 24, forks: 1, fringe: true, dashes: 40 },
  low: { decals: 12, forks: 0, fringe: false, dashes: 28 },
};
const INK = 0x141a2a, VIOLET = PAL.violet, ICE = PAL.ice, CORE = 0xffffff, GOLD = ROLE.evo;

export const chainCaps = (tier) => CHAIN_CAPS[tier] || CHAIN_CAPS.med;
export const decalCap = (tier, phone) => Math.round(chainCaps(tier).decals * (phone ? 0.6 : 1));
// re-jag clock: a new jag shape every REJAG seconds; Calm keeps one shape for the life of the strike
export const jagStep = (t, calm) => (calm ? 0 : Math.floor(t / REJAG));
// deterministic hash -> [-0.5, 0.5) (allocation-free)
export function hj(n) {
  n |= 0; n = (n ^ 61) ^ (n >>> 16); n = Math.imul(n, 9); n ^= n >>> 4; n = Math.imul(n, 0x27d4eb2d); n ^= n >>> 15;
  return (n >>> 0) / 4294967296 - 0.5;
}
// top of a Judgment column: 70-120 u above the foe, clamped below the HUD band (viewTop/viewH = camera world view)
export function pillarTop(y1, viewTop, viewH, seed) {
  const h = PILLAR_MIN + (hj(seed) + 0.5) * (PILLAR_MAX - PILLAR_MIN);
  return Math.max(y1 - h, viewTop + HUD_BAND * viewH);
}

// crack-star scorch pool: fixed ring buffer (no allocation after construction), oldest overwritten once the tier cap is reached
export class CrackPool {
  constructor(n = 40) { this.buf = Array.from({ length: n }, () => ({ x: 0, y: 0, t: -99, s: 0, r: 6 })); this.cap = n; this.i = 0; }
  setCap(c) { c = Math.max(0, Math.min(this.buf.length, c | 0)); if (c !== this.cap) { this.cap = c; this.i = 0; for (const d of this.buf) d.t = -99; } }
  add(x, y, t, s, r = 6) {
    if (!this.cap) return;
    const d = this.buf[this.i]; this.i = (this.i + 1) % this.cap;
    d.x = x; d.y = y; d.t = t; d.s = s | 0; d.r = r;
  }
  live(t) { let n = 0; for (let i = 0; i < this.cap; i++) { const a = t - this.buf[i].t; if (a >= 0 && a < CRACK_LIFE) n++; } return n; }
  // dark crack-star on the ground layer (normal blend): 5-7 jagged spokes + a scorched centre, fading over CRACK_LIFE (no flicker)
  draw(g, t, vx0, vy0, vx1, vy1) {
    for (let i = 0; i < this.cap; i++) {
      const d = this.buf[i], age = t - d.t;
      if (age < 0 || age >= CRACK_LIFE || d.x < vx0 || d.x > vx1 || d.y < vy0 || d.y > vy1) continue;
      const a = 1 - age / CRACK_LIFE, n = 5 + ((d.s >>> 3) % 3);
      g.fillStyle(INK, 0.5 * a).fillCircle(d.x, d.y, d.r * 0.3);
      g.lineStyle(1.5, INK, 0.78 * a);
      for (let k = 0; k < n; k++) {
        const an = (k / n) * 6.2832 + hj(d.s + k * 13) * 0.7, L = d.r * (0.75 + hj(d.s + k * 29) * 0.5);
        const c = Math.cos(an), s = Math.sin(an), bend = hj(d.s + k * 47) * 0.9;
        g.beginPath().moveTo(d.x, d.y);
        g.lineTo(d.x + (c - s * bend * 0.4) * L * 0.5, d.y + (s + c * bend * 0.4) * L * 0.3);
        g.lineTo(d.x + c * L, d.y + s * L * 0.6).strokePath(); // flattened onto the ground plane
      }
    }
  }
}

const P = new Float32Array(2 * 72); // scratch jag points (max 71 segments; longer arcs use a coarser step)
function jag(x0, y0, x1, y1, seed, amp, step) {
  const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy) || 1, n = Math.min(71, Math.max(2, Math.ceil(L / step)));
  const nx = -dy / L, ny = dx / L;
  P[0] = x0; P[1] = y0;
  for (let k = 1; k < n; k++) {
    const t = k / n, o = hj(seed + k * 17) * 2 * amp * Math.min(1, 4 * t * (1 - t) + 0.35);
    P[2 * k] = x0 + dx * t + nx * o; P[2 * k + 1] = y0 + dy * t + ny * o;
  }
  P[2 * n] = x1; P[2 * n + 1] = y1;
  return n;
}
function stroke(fx, n) { fx.beginPath().moveTo(P[0], P[1]); for (let k = 1; k <= n; k++) fx.lineTo(P[2 * k], P[2 * k + 1]); fx.strokePath(); }

// one Storm Thread arc segment: violet fringe (2 soft widths = blurred), cyan glow, white core, then small forks off the jag
export function drawArc(fx, x0, y0, x1, y1, seed, a, cap, amp = 4, scale = 1) {
  const n = jag(x0, y0, x1, y1, seed, amp, 11);
  if (cap.fringe) { fx.lineStyle(8 * scale, VIOLET, 0.1 * a); stroke(fx, n); fx.lineStyle(4.5 * scale, VIOLET, 0.2 * a); stroke(fx, n); }
  fx.lineStyle(2.2 * scale, ICE, 0.5 * a); stroke(fx, n);
  fx.lineStyle(1 * scale, CORE, 0.9 * a); stroke(fx, n);
  if (n < 3) return;
  for (let f = 0; f < cap.forks; f++) { // small forks: 5-10 u, off an inner jag vertex, bent away from the arc
    if (hj(seed + 701 + f * 7) < -0.2) continue; // not every segment forks
    const k = 1 + Math.floor((hj(seed + 901 + f * 11) + 0.5) * (n - 1)), px = P[2 * k], py = P[2 * k + 1];
    const dir = Math.atan2(y1 - y0, x1 - x0) + (f % 2 ? 1 : -1) * (0.55 + (hj(seed + 77 + f) + 0.5) * 0.5);
    const L = (5 + (hj(seed + 313 + f) + 0.5) * 5) * scale, mx = px + Math.cos(dir - 0.3) * L * 0.55, my = py + Math.sin(dir - 0.3) * L * 0.55;
    const ex = px + Math.cos(dir) * L, ey = py + Math.sin(dir) * L;
    fx.lineStyle(1.6 * scale, ICE, 0.5 * a).beginPath().moveTo(px, py).lineTo(mx, my).lineTo(ex, ey).strokePath();
    fx.lineStyle(0.8 * scale, CORE, 0.8 * a).beginPath().moveTo(px, py).lineTo(mx, my).lineTo(ex, ey).strokePath();
  }
}

// Thunder Judgment strike: sky-crack at the (capped) top, soft column, jagged white core, gold edge lines, cracked ground ring at the foot
export function drawPillar(fx, x, y1, yTop, seed, a, cap, k) {
  const H = y1 - yTop;
  if (H < 10) return; // the foe hugs the HUD band: no column and no ring (the crack-star scorch on the ground still marks the strike)
  {
    if (cap.fringe) fx.fillStyle(ICE, 0.12 * a).fillRect(x - 5, yTop, 10, H);
    const n = jag(x, yTop, x, y1, seed, 1.6, 14);
    fx.lineStyle(2.2, ICE, 0.38 * a); stroke(fx, n);
    fx.lineStyle(1.1, CORE, 0.9 * a); stroke(fx, n);
    fx.lineStyle(1, GOLD, 0.75 * a).lineBetween(x - 6, yTop + 3, x - 6, y1 - 3).lineBetween(x + 6, yTop + 3, x + 6, y1 - 3);
    for (let b = 0; b < 4; b++) { // sky-crack: short jagged branches spreading sideways and DOWN from the top (never above yTop)
      const side = b % 2 ? 1 : -1, an = side > 0 ? 0.15 + (hj(seed + b * 5) + 0.5) * 0.6 : Math.PI - 0.15 - (hj(seed + b * 5) + 0.5) * 0.6;
      const L = 7 + (hj(seed + b * 9) + 0.5) * 7, ex = x + Math.cos(an) * L, ey = yTop + Math.abs(Math.sin(an)) * L, mx = (x + ex) / 2 + hj(seed + b * 3) * 3, my = yTop + Math.abs(ey - yTop) * 0.35;
      fx.lineStyle(1.6, ICE, 0.65 * a).beginPath().moveTo(x, yTop).lineTo(mx, my).lineTo(ex, ey).strokePath();
      fx.lineStyle(0.8, CORE, 0.9 * a).beginPath().moveTo(x, yTop).lineTo(mx, my).lineTo(ex, ey).strokePath();
    }
  }
  const r = 8 + 5 * k; // ground crack ring: broken jagged arcs opening outward as the strike fades
  fx.lineStyle(1, ICE, 0.8 * a);
  for (let s = 0; s < 7; s++) {
    const a0 = (s / 7) * 6.2832 + hj(seed + s) * 0.3, a1 = a0 + 0.62, am = (a0 + a1) / 2, rr = r + hj(seed + s * 7) * 2;
    fx.beginPath().moveTo(x + Math.cos(a0) * r, y1 + Math.sin(a0) * r * 0.6).lineTo(x + Math.cos(am) * rr, y1 + Math.sin(am) * rr * 0.6).lineTo(x + Math.cos(a1) * r, y1 + Math.sin(a1) * r * 0.6).strokePath();
  }
}

// Static Storm dome edge: dashes around the field, each a 2-step crackle (re-jags on the 60 ms clock; Calm = still), gold hairline inside
export function drawDome(fx, cx, cy, R, step, t, calm, cap) {
  const n = cap.dashes, rot = calm ? 0 : t * 0.22, w = (6.2832 / n) * 0.55;
  fx.lineStyle(6, ICE, 0.035).strokeCircle(cx, cy, R - 3); // faint inner wall of the dome
  fx.lineStyle(1.2, ICE, 0.34);
  for (let i = 0; i < n; i++) {
    const a0 = rot + (i / n) * 6.2832, a1 = a0 + w, am = (a0 + a1) / 2, rm = R + hj(step * 131 + i * 17) * 3.2;
    fx.beginPath().moveTo(cx + Math.cos(a0) * R, cy + Math.sin(a0) * R).lineTo(cx + Math.cos(am) * rm, cy + Math.sin(am) * rm).lineTo(cx + Math.cos(a1) * R, cy + Math.sin(a1) * R).strokePath();
  }
  fx.lineStyle(1, GOLD, 0.22).strokeCircle(cx, cy, R - 3.5); // gold hairline (evolved), steady
}

// Storm Tether: a braided steady cord (two strands crossing every 8 u, fixed to the cord: no flicker, no crawl), violet underlay,
// gold hairline core (evolved), knot beads where the strands cross (every 16 u). Low: one strand + hairline + sparser beads.
export function drawBraid(fx, x0, y0, x1, y1, w, a, cap, low) {
  const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy);
  if (L < 2) return;
  const ux = dx / L, uy = dy / L, nx = -uy, ny = ux, lam = 16, amp = w * 0.9 + 0.6;
  if (cap.fringe) fx.lineStyle(w + 5, VIOLET, 0.15 * a).lineBetween(x0, y0, x1, y1);
  if (low) fx.lineStyle(w, ICE, 0.85 * a).lineBetween(x0, y0, x1, y1);
  else {
    const n = Math.min(71, Math.max(4, Math.ceil(L / 3)));
    for (let s = 0; s < 2; s++) {
      fx.lineStyle(1.1, s ? CORE : ICE, (s ? 0.62 : 0.75) * a).beginPath().moveTo(x0, y0);
      for (let k = 1; k <= n; k++) { const d = (k / n) * L, o = Math.sin((d / lam) * 6.2832) * amp * (s ? -1 : 1) * Math.min(1, d / 6, (L - d) / 6); fx.lineTo(x0 + ux * d + nx * o, y0 + uy * d + ny * o); }
      fx.strokePath();
    }
  }
  fx.lineStyle(0.8, GOLD, 0.55 * a).lineBetween(x0, y0, x1, y1);
  const gap = low ? 24 : lam;
  for (let d = gap; d < L - 4; d += gap) { const bx = x0 + ux * d, by = y0 + uy * d; fx.fillStyle(ICE, 0.45 * a).fillCircle(bx, by, 2.2); fx.fillStyle(CORE, 0.95 * a).fillCircle(bx, by, 1.1); }
}
