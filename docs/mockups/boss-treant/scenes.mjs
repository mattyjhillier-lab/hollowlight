// World-frame overlays for the boss sheet (arena, telegraphs, adds, HUD bits, victory flood). Mock-up code only, not game code.
// All sizes in WORLD units, converted with k = css px per world unit (desktop 2.34, phone 1.3). Top-down ground decals are true circles.
import { f, glow, mix, rng, line, blob, circ } from '../enemies-art2/paint.mjs';
import { K, S, P, thorn as thornArt } from '../enemies-husks/kit.mjs';
import { seedPod } from './treant.mjs';
export const RO = '#ff5a3c', RIM = '#2a0f0a';

// ground wash for the moment: 14:00 = warm grey-gold morning light over the 11:30 plate; 'dawn' = full restored
export const wash = (w, h, t = 14) => t >= 15 ? `<rect width="${w}" height="${h}" fill="#ffe2b8" opacity=".22" style="mix-blend-mode:screen"/>` : `<rect width="${w}" height="${h}" fill="#ffd9a8" opacity="${t >= 14 ? 0.14 : 0.08}"/>`;
// painted ground (no plate exists for phone portrait): restored grass + hollow grey mottles
export const groundPaint = (w, h, seed = 3) => { const q = rng(seed); let s = `<rect width="${w}" height="${h}" fill="#6f7a64"/><rect width="${w}" height="${h}" filter="url(#mottle)" opacity=".5"/>`;
  for (let i = 0; i < 26; i++) s += `<ellipse cx="${f(q() * w)}" cy="${f(q() * h)}" rx="${f(30 + q() * 70)}" ry="${f(20 + q() * 50)}" fill="${q() < 0.5 ? '#8a9a6a' : '#666a72'}" opacity=".35"/>`;
  for (let i = 0; i < 70; i++) { const x = q() * w, y = q() * h; s += `<path d="M${f(x)} ${f(y)} l-2 -6 M${f(x + 3)} ${f(y)} l1 -7 M${f(x + 6)} ${f(y)} l3 -5" stroke="#4f6a46" stroke-width="1.4" opacity=".6"/>`; }
  for (let i = 0; i < 14; i++) s += `<circle cx="${f(q() * w)}" cy="${f(q() * h)}" r="2.2" fill="${['#ffd98a', '#f4a6b8', '#cfe6ff'][i % 3]}" opacity=".85"/>`;
  return s; };

// outside the arena: the Hollow stays grey (desaturate + dim), inside stays as it is
export const outside = (w, h, cx, cy, R, a = 0.5) => `<path d="M0 0 H${w} V${h} H0Z ${circ(cx, cy, R)}" fill-rule="evenodd" fill="#4a5060" opacity="${a}"/><path d="M0 0 H${w} V${h} H0Z ${circ(cx, cy, R)}" fill-rule="evenodd" fill="#7a7f8a" style="mix-blend-mode:saturation" opacity=".9"/>`;

// ARENA A: ROOT RING. The Treant's own roots erupt in a ring (dark bark arches, pale bark tips, thorns), a corruption band under them.
// prog 0..1 = forming (roots rise in a sweep around the ring), tell = red-orange dashed ring 1.5 s before (arrival warning)
export function rootRing(w, h, cx, cy, R, k, o = {}) {
  const prog = o.prog ?? 1, q = rng(o.seed || 7); let s = '';
  if (o.tell) s += `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(R * k)}" fill="none" stroke="${RIM}" stroke-width="${f(7 * k / 2.34 + 3)}" opacity=".55"/><circle cx="${f(cx)}" cy="${f(cy)}" r="${f(R * k)}" fill="none" stroke="${RO}" stroke-width="${f(3 * k / 2.34 + 1.5)}" stroke-dasharray="${f(14 * k)} ${f(9 * k)}" opacity=".9"/>`;
  if (prog <= 0) return s;
  s += `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(R * k)}" fill="none" stroke="#1d1826" stroke-width="${f(16 * k)}" opacity="${f(0.55 * prog)}"/>`;
  const n = Math.round(2 * Math.PI * R / 13);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + q() * 0.05, u = i / n; if (u > prog) continue;
    const rr = R + (q() - 0.5) * 8, x = cx + Math.cos(a) * rr * k, y = cy + Math.sin(a) * rr * k;
    if (x < -60 || x > w + 60 || y < -60 || y > h + 60) continue;
    const hgt = (10 + q() * 12) * k * (o.low ? 0.6 : 1), lean = (q() - 0.5) * 6 * k, wd = (3 + q() * 2.5) * k;
    const pts = [[x - wd * 1.4, y + 2], [x - wd * 0.6 + lean * 0.3, y - hgt * 0.6], [x + lean, y - hgt], [x + wd * 0.7 + lean * 0.4, y - hgt * 0.55], [x + wd * 1.4, y + 2]];
    s += `<path d="${blob(pts)}" fill="${mix('#4a4552', '#5f5a66', q())}" stroke="#221c2a" stroke-width="${f(Math.max(1, 0.6 * k))}" stroke-linejoin="round"/>`;
    s += `<path d="M${f(x + lean * 0.8 - wd * 0.3)} ${f(y - hgt * 0.92)} Q${f(x + lean)} ${f(y - hgt * 1.08)} ${f(x + lean * 0.9 + wd * 0.4)} ${f(y - hgt * 0.86)}" stroke="${K.barkLt}" stroke-width="${f(Math.max(1, 1.2 * k))}" fill="none" stroke-linecap="round" opacity=".9"/>`;
    if (q() < 0.3) s += thornArt(x - wd, y - hgt * 0.4, Math.PI + 0.4, 4 * k, 1.2 * k);
  }
  return s;
}
// ARENA B: CLEARING (fixed camera): an oval clearing of old standing stones/stumps; edge = dark stump wall
export function stumpOval(cx, cy, rx, ry, k) { const q = rng(5); let s = `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(rx * k)}" ry="${f(ry * k)}" fill="none" stroke="#1d1826" stroke-width="${f(14 * k)}" opacity=".6"/>`;
  const n = 44; for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2, x = cx + Math.cos(a) * rx * k, y = cy + Math.sin(a) * ry * k, r = (5 + q() * 3) * k; s += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(r)}" ry="${f(r * 0.8)}" fill="#55505e" stroke="#221c2a" stroke-width="1.2"/><ellipse cx="${f(x)}" cy="${f(y - r * 0.2)}" rx="${f(r * 0.6)}" ry="${f(r * 0.4)}" fill="#8a8496" opacity=".7"/>`; }
  return s; }
// ARENA C: THORN HEDGE (damaging edge, shrinks per phase): a bramble band with red-orange thorn tips
export function thornHedge(w, h, cx, cy, R, k) { const q = rng(9); let s = `<circle cx="${f(cx)}" cy="${f(cy)}" r="${f(R * k)}" fill="none" stroke="#2a2232" stroke-width="${f(18 * k)}" opacity=".85"/>`;
  const n = Math.round(2 * Math.PI * R / 7); for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2, rr = R + (q() - 0.5) * 14, x = cx + Math.cos(a) * rr * k, y = cy + Math.sin(a) * rr * k; if (x < -30 || x > w + 30 || y < -30 || y > h + 30) continue; s += thornArt(x, y, a + Math.PI + (q() - 0.5), 6 * k, 1.6 * k, '#3a3346') + (q() < 0.25 ? `<circle cx="${f(x)}" cy="${f(y)}" r="${f(1.2 * k)}" fill="${RO}" opacity=".8"/>` : ''); }
  return s; }

// ---- telegraphs (shared DR2 style: dark rim + red-orange; FULL only if it reaches the hero, else 28%) ----
const al = (full) => (full ? 1 : 0.28);
export const tCircle = (x, y, r, k, fill = 0.6, full = true) => `<g opacity="${al(full)}"><circle cx="${f(x)}" cy="${f(y)}" r="${f(r * k)}" fill="${RO}" opacity=".14"/><circle cx="${f(x)}" cy="${f(y)}" r="${f(r * k * fill)}" fill="${RO}" opacity=".3"/><circle cx="${f(x)}" cy="${f(y)}" r="${f(r * k)}" fill="none" stroke="${RIM}" stroke-width="${f(1.6 * k + 1)}" opacity=".6"/><circle cx="${f(x)}" cy="${f(y)}" r="${f(r * k)}" fill="none" stroke="${RO}" stroke-width="${f(0.9 * k + 0.6)}"/></g>`;
export function tCone(x, y, ang, spread, r, k, fill = 0.6, full = true) {
  const a0 = ang - spread / 2, a1 = ang + spread / 2, R = r * k, Rf = R * fill;
  const arc = (rr) => `M${f(x)} ${f(y)} L${f(x + Math.cos(a0) * rr)} ${f(y + Math.sin(a0) * rr)} A${f(rr)} ${f(rr)} 0 0 1 ${f(x + Math.cos(a1) * rr)} ${f(y + Math.sin(a1) * rr)}Z`;
  return `<g opacity="${al(full)}"><path d="${arc(R)}" fill="${RO}" opacity=".13"/><path d="${arc(Rf)}" fill="${RO}" opacity=".28"/><path d="${arc(R)}" fill="none" stroke="${RIM}" stroke-width="${f(1.6 * k + 1)}" opacity=".6"/><path d="${arc(R)}" fill="none" stroke="${RO}" stroke-width="${f(0.9 * k + 0.6)}"/></g>`;
}
export function tLaneW(x0, y0, x1, y1, wdt, k, fill = 0.6, full = true) {
  const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy), nx = -dy / L, ny = dx / L, hw = wdt * k / 2;
  const rect = (t) => `M${f(x0 + nx * hw)} ${f(y0 + ny * hw)} L${f(x0 + dx * t + nx * hw)} ${f(y0 + dy * t + ny * hw)} L${f(x0 + dx * t - nx * hw)} ${f(y0 + dy * t - ny * hw)} L${f(x0 - nx * hw)} ${f(y0 - ny * hw)}Z`;
  return `<g opacity="${al(full)}"><path d="${rect(1)}" fill="${RO}" opacity=".13"/><path d="${rect(fill)}" fill="${RO}" opacity=".28"/><path d="${rect(1)}" fill="none" stroke="${RIM}" stroke-width="${f(1.6 * k + 1)}" opacity=".6"/><path d="${rect(1)}" fill="none" stroke="${RO}" stroke-width="${f(0.9 * k + 0.6)}" stroke-dasharray="${f(8 * k)} ${f(5 * k)}"/></g>`;
}
// a flying boss thorn (DR2 thorn rule: >= 5 u across, near-black rim, ember ring, cream core, short streak)
export const bThorn = (x, y, ang, k) => { const c = Math.cos(ang), s = Math.sin(ang), L = 7 * k, W = 2.6 * k;
  return `<path d="M${f(x - c * 18 * k)} ${f(y - s * 18 * k)} L${f(x)} ${f(y)}" stroke="#ffe9c4" stroke-width="${f(1.4 * k)}" opacity=".35" stroke-linecap="round"/><circle cx="${f(x)}" cy="${f(y)}" r="${f(4.2 * k)}" fill="${RO}" opacity=".35"/><path d="M${f(x - c * L * 0.4 - s * W)} ${f(y - s * L * 0.4 + c * W)} L${f(x + c * L * 0.7)} ${f(y + s * L * 0.7)} L${f(x - c * L * 0.4 + s * W)} ${f(y - s * L * 0.4 - c * W)}Z" fill="#2a2232" stroke="#0c0812" stroke-width="${f(0.8 * k)}"/><circle cx="${f(x)}" cy="${f(y)}" r="${f(1.1 * k)}" fill="#ffe9c4"/>`; };
export const aimTick = (x0, y0, ang, len, k, full = true) => `<path d="M${f(x0)} ${f(y0)} L${f(x0 + Math.cos(ang) * len * k)} ${f(y0 + Math.sin(ang) * len * k)}" stroke="${RO}" stroke-width="${f(0.9 * k + 0.6)}" stroke-dasharray="${f(4 * k)} ${f(4 * k)}" opacity="${full ? 0.85 : 0.25}" stroke-linecap="round"/>`;
// erupted root spikes (after a Root Eruption / Root Lane resolves)
export const spikes = (x, y, r, k, seed = 3) => { const q = rng(seed); let s = ''; for (let i = 0; i < 7; i++) { const a = q() * Math.PI * 2, d = q() * r * 0.7, X = x + Math.cos(a) * d * k, Y = y + Math.sin(a) * d * k, hh = (8 + q() * 9) * k; s += `<path d="M${f(X - 2.4 * k)} ${f(Y)} L${f(X + (q() - 0.5) * 3 * k)} ${f(Y - hh)} L${f(X + 2.4 * k)} ${f(Y)}Z" fill="#4e4858" stroke="#1f1a27" stroke-width="${f(0.6 * k)}"/><path d="M${f(X)} ${f(Y - hh)} l${f(0.6 * k)} ${f(3 * k)}" stroke="${K.barkLt}" stroke-width="${f(0.8 * k)}"/>`; } return s; };
// seed pod in flight (arc dashed) + landing shadow tell
export const seedArc = (x0, y0, x1, y1, k, t = 0.6) => { const mx = (x0 + x1) / 2, my = Math.min(y0, y1) - 60 * k; const bx = (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * mx + t * t * x1, by = (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * my + t * t * y1;
  const pod = seedPod({ g: 0 }); return `<path d="M${f(x0)} ${f(y0)} Q${f(mx)} ${f(my)} ${f(x1)} ${f(y1)}" stroke="#e8e2cc" stroke-width="1.2" stroke-dasharray="4 5" fill="none" opacity=".45"/>` + tCircle(x1, y1, 12, k, t, true) + `<g transform="translate(${f(bx)},${f(by)}) scale(${f(k / 4)})">${pod.b}</g>`; };
export const sapling = (x, y, k, g = 1, flip = false) => { const d = seedPod({ g }); return `<g transform="translate(${f(x)},${f(y)}) scale(${f((flip ? -1 : 1) * k / 4 * 1.6)},${f(k / 4 * 1.6)})">${d.b}</g>`; };

// boss HP bar (HUD, locked brass/glass look simplified): name, bar with phase notches, small phase pips
export function bossBar(w, s, hp = 0.6, phase = 2, o = {}) {
  const bw = Math.min(520 * s, w - 40 * s), x = (w - bw) / 2, y = (o.y ?? 14) * s, h = 12 * s;
  let r = `<rect x="${f(x - 6 * s)}" y="${f(y - 6 * s)}" width="${f(bw + 12 * s)}" height="${f(h + 26 * s)}" rx="${f(8 * s)}" fill="#0c1018" opacity=".72"/>`;
  r += `<rect x="${f(x)}" y="${f(y)}" width="${f(bw)}" height="${f(h)}" rx="${f(h / 2)}" fill="#1c2232" stroke="#b98f4e" stroke-width="${f(1.4 * s)}"/><rect x="${f(x + 1.5 * s)}" y="${f(y + 1.5 * s)}" width="${f((bw - 3 * s) * hp)}" height="${f(h - 3 * s)}" rx="${f(h / 2)}" fill="#c9b9a0"/><rect x="${f(x + 1.5 * s)}" y="${f(y + 1.5 * s)}" width="${f((bw - 3 * s) * hp)}" height="${f((h - 3 * s) * 0.4)}" rx="${f(h / 3)}" fill="#fff4dc" opacity=".55"/>`;
  for (const t of [0.66, 0.33]) r += `<path d="M${f(x + bw * t)} ${f(y - 2 * s)} l0 ${f(h + 4 * s)}" stroke="#ffb84a" stroke-width="${f(1.6 * s)}"/>`;
  r += `<text x="${f(w / 2)}" y="${f(y + h + 16 * s)}" font-family="Georgia,serif" font-size="${f(11.5 * s)}" font-weight="700" fill="#efe6d2" text-anchor="middle">THE ELDER TREANT${o.sub ? '  ·  ' + o.sub : ''}</text>`;
  return r;
}
// the run clock held at 14:00 (moon-arc chip): the moon parked on the dawn line
export const heldClock = (x, y, s, label = '14:00') => `<rect x="${f(x)}" y="${f(y)}" width="${f(88 * s)}" height="${f(24 * s)}" rx="${f(12 * s)}" fill="#0c1018" opacity=".72"/><path d="M${f(x + 10 * s)} ${f(y + 18 * s)} Q${f(x + 30 * s)} ${f(y + 4 * s)} ${f(x + 50 * s)} ${f(y + 18 * s)}" stroke="#7d8cab" stroke-width="${f(1.4 * s)}" fill="none"/><circle cx="${f(x + 47 * s)}" cy="${f(y + 16 * s)}" r="${f(3.4 * s)}" fill="#e8eef8"/><path d="M${f(x + 6 * s)} ${f(y + 19 * s)} L${f(x + 54 * s)} ${f(y + 19 * s)}" stroke="#ffd36b" stroke-width="${f(1.2 * s)}" opacity=".8"/><text x="${f(x + 58 * s)}" y="${f(y + 16.5 * s)}" font-family="Segoe UI,Arial" font-size="${f(10.5 * s)}" font-weight="700" fill="#e8edf3">${label}</text>`;
// lantern HP pip (very simplified locked HUD flame) top-left
export const hpFlame = (x, y, s, v = 0.7) => `<rect x="${f(x)}" y="${f(y)}" width="${f(120 * s)}" height="${f(22 * s)}" rx="${f(11 * s)}" fill="#0c1018" opacity=".72"/><path d="M${f(x + 14 * s)} ${f(y + 18 * s)} q${f(-6 * s)} ${f(-6 * s)} 0 ${f(-14 * s)} q${f(6 * s)} ${f(8 * s)} 0 ${f(14 * s)}Z" fill="#ffc45a"/><rect x="${f(x + 26 * s)}" y="${f(y + 8 * s)}" width="${f(86 * s)}" height="${f(6 * s)}" rx="${f(3 * s)}" fill="#2a3040"/><rect x="${f(x + 26 * s)}" y="${f(y + 8 * s)}" width="${f(86 * s * v)}" height="${f(6 * s)}" rx="${f(3 * s)}" fill="#ffd27a"/>`;
// small caption plate
export const cap = (w, h, s, text, col = '#ffd98a') => `<rect x="${f(w / 2 - 300 * s)}" y="${f(h - 32 * s)}" width="${f(600 * s)}" height="${f(22 * s)}" rx="${f(11 * s)}" fill="#080b10" opacity=".82"/><text x="${f(w / 2)}" y="${f(h - 16.5 * s)}" font-family="Segoe UI,Arial" font-size="${f(11.5 * s)}" font-weight="700" fill="${col}" text-anchor="middle">${text}</text>`;
// boss light pool + ground shadow under the boss (always fully lit, its own light)
export const bossPool = (x, y, k) => glow(x, y - 30 * k, 70 * k, 50 * k, '#cfd6ea', 0.18) + `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(30 * k)}" ry="${f(9 * k)}" fill="#07050d" opacity=".45"/>`;
// ash wisps of crumbling Husks (arrival / victory)
export const ash = (x, y, k, a = 1, seed = 2) => { const q = rng(seed); let s = ''; for (let i = 0; i < 6; i++) { const X = x + (q() - 0.5) * 14 * k, Y = y - q() * 16 * k; s += `<path d="M${f(X)} ${f(Y)} q${f(3 * k)} ${f(-4 * k)} ${f(-1 * k)} ${f(-9 * k)}" stroke="#2a2440" stroke-width="${f(1.6 * k)}" fill="none" opacity="${f(0.7 * a)}" stroke-linecap="round"/>`; } return s + `<circle cx="${f(x)}" cy="${f(y - 8 * k)}" r="${f(1.6 * k)}" fill="#ffe2a0" opacity="${f(a)}"/>`; };
// a crumbling Husk silhouette (generic small body + mask) for arrival frames
export const husklet = (x, y, k, a = 1) => `<g opacity="${f(a)}"><ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(6 * k)}" ry="${f(2 * k)}" fill="#07050d" opacity=".4"/><path d="M${f(x - 7 * k)} ${f(y)} Q${f(x - 7 * k)} ${f(y - 9 * k)} ${f(x)} ${f(y - 9 * k)} Q${f(x + 8 * k)} ${f(y - 9 * k)} ${f(x + 7 * k)} ${f(y)}Z" fill="#4a5675" stroke="#1d2236" stroke-width="1"/><path d="M${f(x + 2 * k)} ${f(y - 12 * k)} l${f(7 * k)} ${f(2 * k)} l${f(-2 * k)} ${f(4 * k)} l${f(-6 * k)} 0Z" fill="#c8c3ad" stroke="#6f6857" stroke-width=".8"/><circle cx="${f(x + 5 * k)}" cy="${f(y - 10 * k)}" r="${f(1 * k)}" fill="#ff5a3c"/></g>`;

// VICTORY flood helpers: restored band (life) sweeping out from a point, with blooms; whiteout veil for option C
export function flood(w, h, cx, cy, Rpx, o = {}) {
  const id = 'fl' + Math.round(Rpx) + (o.tag || ''); const q = rng(o.seed || 4);
  let s = `<defs><radialGradient id="${id}" gradientUnits="userSpaceOnUse" cx="${f(cx)}" cy="${f(cy)}" r="${f(Rpx + 60)}"><stop offset="0" stop-color="#ffe7b0" stop-opacity=".04"/><stop offset="${f(Math.max(0, Rpx - 40) / (Rpx + 60))}" stop-color="#ffd98a" stop-opacity=".1"/><stop offset="${f(Rpx / (Rpx + 60))}" stop-color="#fff3c8" stop-opacity=".6"/><stop offset="1" stop-color="#fff3c8" stop-opacity="0"/></radialGradient>`
    + `<clipPath id="${id}c"><circle cx="${f(cx)}" cy="${f(cy)}" r="${f(Rpx)}"/></clipPath></defs>`;
  // inside: colour returns (saturate + warm), outside: still grey
  s += `<path d="M0 0 H${w} V${h} H0Z ${circ(cx, cy, Rpx)}" fill-rule="evenodd" fill="#7a7f8a" style="mix-blend-mode:saturation" opacity="${f(o.greyOut ?? 0.85)}"/>`;
  s += `<g clip-path="url(#${id}c)"><g opacity=".2">${groundPaint(w, h, 11)}</g><rect width="${w}" height="${h}" fill="#8fcf5a" style="mix-blend-mode:soft-light" opacity=".28"/><rect width="${w}" height="${h}" fill="#ffcf7a" style="mix-blend-mode:soft-light" opacity=".3"/>`;
  for (let i = 0; i < (o.blooms ?? 60); i++) { const a = q() * Math.PI * 2, d = Math.sqrt(q()) * Rpx, x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d; if (x < 0 || x > w || y < 0 || y > h) continue; const c = ['#ffd98a', '#f4a6b8', '#fff1c8', '#cfe6ff', '#b8f07a'][i % 5], r = (o.k || 2) * (1 + q()); s += `<path d="M${f(x)} ${f(y + 4 * r)} l0 ${f(-4 * r)}" stroke="#4f8a42" stroke-width="${f(r * 0.5)}"/><circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${c}"/><circle cx="${f(x)}" cy="${f(y)}" r="${f(r * 0.4)}" fill="#fff"/>`; }
  s += `</g><rect width="${w}" height="${h}" fill="url(#${id})" style="mix-blend-mode:screen"/>`;
  return s;
}
export const birds = (w, h, n, s, seed = 6, x0 = 0.2, y0 = 0.7) => { const q = rng(seed); let r = ''; for (let i = 0; i < n; i++) { const x = (x0 + q() * 0.6) * w, y = (y0 - q() * 0.6) * h, z = (5 + q() * 4) * s; r += `<path d="M${f(x - z)} ${f(y)} q${f(z * 0.5)} ${f(-z * 0.6)} ${f(z)} 0 q${f(z * 0.5)} ${f(-z * 0.6)} ${f(z)} 0" stroke="#3a3040" stroke-width="${f(1.6 * s)}" fill="none" stroke-linecap="round"/>`; } return r; };
export const petals = (w, h, n, s, seed = 8) => { const q = rng(seed); let r = ''; for (let i = 0; i < n; i++) { const x = q() * w, y = q() * h; r += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(2.6 * s)}" ry="${f(1.4 * s)}" fill="${q() < 0.5 ? '#ffd2b8' : '#fff1c8'}" opacity=".85" transform="rotate(${f(q() * 180)} ${f(x)} ${f(y)})"/>`; } return r; };
export const shafts = (w, h, a = 0.12) => [0.15, 0.42, 0.7].map((u, i) => `<path d="M${f(w * u)} 0 L${f(w * (u + 0.16))} 0 L${f(w * (u + 0.34))} ${h} L${f(w * (u + 0.12))} ${h}Z" fill="#fff0c8" opacity="${f(a * (1 - i * 0.2))}" style="mix-blend-mode:screen"/>`).join('');
// covers the plate's own run timer with the HELD 14:00 clock (moon parked on the dawn line, small brass "held" knot)
export const heldPill = (cx, cy, s) => `<rect x="${f(cx - 62 * s)}" y="${f(cy - 19 * s)}" width="${f(124 * s)}" height="${f(38 * s)}" rx="${f(19 * s)}" fill="#1a1712" stroke="#b98f4e" stroke-width="${f(1.6 * s)}"/><path d="M${f(cx - 52 * s)} ${f(cy + 9 * s)} L${f(cx - 14 * s)} ${f(cy + 9 * s)}" stroke="#ffd36b" stroke-width="${f(1.6 * s)}"/><path d="M${f(cx - 50 * s)} ${f(cy + 8 * s)} Q${f(cx - 33 * s)} ${f(cy - 14 * s)} ${f(cx - 16 * s)} ${f(cy + 8 * s)}" stroke="#7d8cab" stroke-width="${f(1.3 * s)}" fill="none"/><circle cx="${f(cx - 19 * s)}" cy="${f(cy + 5 * s)}" r="${f(4 * s)}" fill="#e8eef8"/><text x="${f(cx + 18 * s)}" y="${f(cy + 7 * s)}" font-family="Segoe UI,Arial" font-size="${f(19 * s)}" font-weight="800" fill="#efe6d2" text-anchor="middle">14:00</text>`;
