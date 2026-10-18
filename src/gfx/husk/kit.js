// Enemies HUSKS options round: shared painting kit (mock-up drawing code only, NOT game code). Node built-ins only.
// Builds on ../enemies-art2/paint.mjs (L2 tinted outline, H2 gradient + soft form shadow + COLD rim, clipped texture, grain, WL6b eyes).
// Husk family rules baked in here so every option shares one look:
//  - mask = GROWN BARK, never smooth white: pale lichen-bark with carved growth grain, chipped/splintered back edge, root straps that grip
//    the head, knot-hole sockets with a raised lip, lichen cups, one tiny dead-twig sprout. Asymmetric, per-species shape (anti Hollow Knight).
//  - bodies cold (slate-indigo / grey-blue / lichen grey), ink socks; red-orange ONLY eyes + tells; amber eyes only miniboss/boss.
// Units: du. Origin = ground under the feet, facing +x, y up negative.
import { part, rod, furry, tuft, blob, line, poly, ell, circ, limb, eye, shadow, glow, mix, rng, specks, ticks, tick, strands, f, TAU, VOID, BOSS_EYE, EYE, sockRec } from './paint.js';
export { part, rod, furry, tuft, blob, line, poly, ell, circ, limb, eye, shadow, glow, mix, rng, specks, ticks, tick, strands, f, TAU, VOID, BOSS_EYE, EYE };

export const K = {
  fur: '#4a5675', furDk: '#2f3753', furHi: '#7d8cab', ruff: '#a9b6cc', ink: '#161221', inkRim: '#8e7fd0',
  bark: '#c8c3ad', barkLt: '#ece8d6', barkDk: '#8b846d', grain: '#6f6857', strap: '#6b6570', strapDk: '#3e3946', lichen: '#9fb5a2', lichenDk: '#5f7766',
  moss: '#6f8577', mossDk: '#465a50', leaf: '#8c917f', crack: '#6a58a0', feather: '#525d76', thorn: '#3a3346', brass: '#b98f4e', brassLt: '#e4c27f',
};
// hero-bar painter: heavier tinted outline + stronger cold rim than round 2
export const P = (d, col, o = {}) => part(d, col, { lw: 3.4, rim: 2.6, rimA: 0.85, grain: 0.06, shA: 0.55, lt: mix(col, '#e8eef8', 0.34), dk: mix(col, '#1a1830', 0.36), ...o });
export const S = (d, col, w = 4, o = {}) => rod(d, col, w, { lw: 2.6, ...o });

// fur clumps: big soft tapered locks (fewer, larger than round 2 ticks) = painted fur read at 3-5x and quiet at true size
export const locks = (list, col, a = 0.6) => list.map(([x, y, l, an, w = 2.4]) => tick(x, y, l, an, w, col, a)).join('');
// ink "sock" paw: dark wavy-top stocking (the Hollow got in through the feet)
export const sock = (x, y, r0, top0, o = {}) => { const r = r0 * 0.88, top = top0 * 0.75; return P(blob([[x - r, y - 1], [x - r * 1.05, y - top * 0.6], [x - r * 0.55, y - top - 1.6], [x, y - top + 1.2], [x + r * 0.5, y - top - 1], [x + r * 1.05, y - top * 0.45], [x + r * 1.45, y - 2.6], [x + r * 1.2, y + 0.7], [x - r * 0.3, y + 0.9]]), K.ink,
  { lw: 2.4, sh: 2, rimC: K.inkRim, rimA: 0.5, grain: 0, tex: o.toes === 0 ? '' : `<path d="M${f(x + r * 0.25)} ${f(y - 0.4)} l0 -2.6 M${f(x + r * 0.85)} ${f(y - 0.4)} l0 -2.3" stroke="#30264a" stroke-width="1.2"/>` }); };

// ---- the HUSK mask ----
// d = outline in world du; M = local->world mapper; o: grain [[pts]], crack [pts], lichen [[x,y,r]], knot [[x,y,r]], chip [[x,y,s,ang]] (splinter notches),
// under (dark underside path), hi (highlight stroke path), col
export function husk(d, M, o = {}) {
  const col = o.col || K.bark, gr = o.grainC || K.grain;
  let tex = '';
  if (o.under) tex += `<path d="${line(o.under.map(([x, y]) => M(x, y)))}" stroke="${K.barkDk}" stroke-width="${f(o.underW || 8)}" fill="none" opacity=".7" stroke-linecap="round" filter="url(#sb2)"/>`;
  for (const g of o.grain || []) { const pts = g.map(([x, y]) => M(x, y)); tex += `<path d="${line(pts)}" stroke="${gr}" stroke-width="${f(o.gw || 1.3)}" fill="none" opacity=".75" stroke-linecap="round"/><path d="${line(pts)}" stroke="${K.barkLt}" stroke-width=".7" fill="none" opacity=".55" transform="translate(-.6,-.9)"/>`; }
  for (const [x, y, r] of o.knot || []) { const [X, Y] = M(x, y); tex += `<ellipse cx="${f(X)}" cy="${f(Y)}" rx="${f(r * 1.6)}" ry="${f(r)}" fill="none" stroke="${gr}" stroke-width="1.1" opacity=".7"/><ellipse cx="${f(X)}" cy="${f(Y)}" rx="${f(r * 0.6)}" ry="${f(r * 0.4)}" fill="${gr}" opacity=".6"/>`; }
  if (o.crack) tex += `<path d="${line(o.crack.map(([x, y]) => M(x, y)))}" stroke="${VOID}" stroke-width="1.5" fill="none" opacity=".9" stroke-linejoin="round"/><path d="${line(o.crack.map(([x, y]) => M(x, y)))}" stroke="${K.barkLt}" stroke-width=".7" fill="none" opacity=".8" transform="translate(1.1,.4)"/>`;
  for (const [x, y, r] of o.lichen || []) { const [X, Y] = M(x, y); tex += lichen(X, Y, r); }
  if (o.hi) tex += `<path d="${line(o.hi.map(([x, y]) => M(x, y)))}" stroke="#fbf8ec" stroke-width="${f(o.hiW || 2.4)}" fill="none" opacity=".7" stroke-linecap="round"/>`;
  let s = P(d, col, { sh: 4, rimA: 1, rimC: '#f4f7ff', grain: 0.1, lt: K.barkLt, dk: mix(col, '#3c3646', 0.42), ink: mix(col, '#1e1626', 0.66), tex, ...(o.p || {}) });
  for (const [x, y, sz, ang] of o.chip || []) { const [X, Y] = M(x, y), c = Math.cos(ang), sn = Math.sin(ang); s += `<path d="M${f(X - sn * sz * 0.5)} ${f(Y + c * sz * 0.5)} L${f(X + c * sz)} ${f(Y + sn * sz)} L${f(X + sn * sz * 0.5)} ${f(Y - c * sz * 0.5)}Z" fill="${K.barkDk}" stroke="${mix(col, '#1e1626', 0.66)}" stroke-width="1" stroke-linejoin="round"/>`; }
  return s;
}
// lichen cup cluster (pale sage rosette)
export const lichen = (x, y, r, seed = 3) => { const q = rng(seed + Math.round(x * 7 + y * 13)); let s = ''; for (let i = 0; i < 4; i++) { const a = q() * TAU, d = r * 0.7 * q(), rr = r * (0.35 + 0.35 * q()); s += `<circle cx="${f(x + Math.cos(a) * d)}" cy="${f(y + Math.sin(a) * d)}" r="${f(rr)}" fill="${K.lichen}" stroke="${K.lichenDk}" stroke-width=".8"/><circle cx="${f(x + Math.cos(a) * d - rr * 0.2)}" cy="${f(y + Math.sin(a) * d - rr * 0.25)}" r="${f(rr * 0.45)}" fill="#d6e3d2" opacity=".75"/>`; } return s; };
// knot-hole SOCKET with a raised bark lip. d = socket outline. Recorded (sockRec) so eye() bakes the eye INTO it and the night glow matches its contour.
export const knotSocket = (d, lip = 2.2) => { sockRec(d); return `<path d="${d}" fill="none" stroke="${K.barkDk}" stroke-width="${f(lip * 2.4)}" stroke-linejoin="round" opacity=".75"/><path d="${d}" fill="none" stroke="${K.barkLt}" stroke-width="${f(lip * 0.9)}" stroke-linejoin="round" opacity=".55" transform="translate(-.7,-.9)"/><path d="${d}" fill="${VOID}"/><path d="${d}" fill="url(#hkVoid)"/>` };
// root strap that grips the head: a gnarled TAPERED root (filled, knobby, grain line, 1-2 hair rootlets), never a chain
export const strap = (pts, w = 3.2, o = {}) => { const q = rng(o.seed || 9), L = [], R = [], n = pts.length;
  for (let i = 0; i < n; i++) { const p = pts[i], a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l;
    const ww = w * (1 - 0.6 * i / (n - 1)) * (0.85 + 0.3 * q()); L.push([p[0] + nx * ww, p[1] + ny * ww]); R.push([p[0] - nx * ww, p[1] - ny * ww]); }
  const tip = pts[n - 1]; const d = blob([...L, tip, ...R.reverse()]);
  let s = P(d, o.col || K.strap, { lw: 2, sh: 1.5, rim: 1.2, rimA: 0.7, grain: 0.12, tex: `<path d="${line(pts)}" stroke="${K.strapDk}" stroke-width="${f(w * 0.35)}" fill="none" opacity=".6" stroke-linecap="round"/>` });
  if (o.rootlets !== 0) { const i = Math.max(1, Math.floor(n / 2)), [x, y] = pts[i], a = (o.out ?? -1.6) + (q() - 0.5); s += `<path d="M${f(x)} ${f(y)} q${f(Math.cos(a) * 3)} ${f(Math.sin(a) * 3)} ${f(Math.cos(a) * 6 + 1)} ${f(Math.sin(a) * 6 + 2)}" stroke="${o.col || K.strap}" stroke-width="1.1" fill="none" stroke-linecap="round"/>`; }
  return s; };
// tiny dead-twig sprout with a curled grey leaf (growing out of a mask)
export const sprout = (x, y, ang = -1.6, s = 1, o = {}) => { const c = Math.cos(ang), sn = Math.sin(ang), x2 = x + c * 10 * s, y2 = y + sn * 10 * s;
  let r = S(`M${f(x)} ${f(y)} Q${f(x + c * 6 * s + 2 * s)} ${f(y + sn * 6 * s)} ${f(x2)} ${f(y2)}`, K.strap, 1.8 * s, { lw: 1.6 });
  const lx = x + c * 6 * s, ly = y + sn * 6 * s;
  r += P(`M${f(lx)} ${f(ly)} q${f(5 * s)} ${f(-5 * s)} ${f(10 * s)} ${f(-2 * s)} q${f(-4 * s)} ${f(4 * s)} ${f(-10 * s)} ${f(2 * s)}Z`, o.leaf || K.leaf, { lw: 1.4, sh: 1, rim: 0.8, grain: 0 });
  if (o.two) r += P(`M${f(x2)} ${f(y2)} q${f(-6 * s)} ${f(-3 * s)} ${f(-8 * s)} ${f(-8 * s)} q${f(5 * s)} ${f(0)} ${f(8 * s)} ${f(8 * s)}Z`, mix(o.leaf || K.leaf, '#2a2838', 0.2), { lw: 1.4, sh: 1, rim: 0.8, grain: 0 });
  return r; };
// moss tuft hanging (drape) from a point
export const moss = (x, y, w, h, seed = 4, col = K.moss) => { const q = rng(seed), p = [[x - w / 2, y]]; const n = 5; for (let i = 0; i <= n; i++) { const t = i / n, xx = x - w / 2 + w * t, hh = h * (0.55 + 0.45 * q()) * (i % 2 ? 1 : 0.7); p.push([xx, y + hh]); } p.push([x + w / 2, y]); return P(blob(p), col, { lw: 1.8, sh: 2, rim: 1, grain: 0.15, tex: specks(x, y + h * 0.3, w * 0.4, h * 0.3, 5, K.mossDk, { seed, r: 1.4, a: 0.6 }) }); };
// a thorn (dark bramble thorn with pale tip)
export const thorn = (x, y, ang, len = 6, w = 2.6, col = K.thorn) => { const c = Math.cos(ang), s = Math.sin(ang), nx = -s * w, ny = c * w; return `<path d="M${f(x + nx)} ${f(y + ny)} L${f(x + c * len)} ${f(y + s * len)} L${f(x - nx)} ${f(y - ny)}Z" fill="${col}" stroke="${mix(col, '#0c0812', 0.5)}" stroke-width=".9" stroke-linejoin="round"/><path d="M${f(x + c * len * 0.55)} ${f(y + s * len * 0.55)} L${f(x + c * len)} ${f(y + s * len)}" stroke="#cfcbbd" stroke-width="${f(w * 0.5)}" stroke-linecap="round"/>`; };

// ---- telegraph ground decals (red-orange = danger only; drawn under the body in mock-ups, above the vignette in the build) ----
const RO = '#ff5a3c';
export const tLunge = (x0, x1, tl, y = 2) => `<path d="M${f(x0)} ${y} L${f(x1)} ${y}" stroke="${RO}" stroke-width="${f(2 + 2 * tl)}" fill="none" stroke-dasharray="7 5" opacity="${f(0.4 + 0.5 * tl)}" stroke-linecap="round"/><path d="M${f(x1 - 9)} ${y - 6} L${f(x1)} ${y} L${f(x1 - 9)} ${y + 6}" stroke="${RO}" stroke-width="${f(2 + 2 * tl)}" fill="none" opacity="${f(0.5 + 0.5 * tl)}" stroke-linejoin="round" stroke-linecap="round"/>`;
export const tRing = (rx, tl, x = 0, fill = 1) => `<ellipse cx="${f(x)}" cy="1" rx="${f(rx)}" ry="${f(rx * 0.36)}" fill="${RO}" opacity="${f(0.08 + 0.1 * tl)}"/><ellipse cx="${f(x)}" cy="1" rx="${f(rx)}" ry="${f(rx * 0.36)}" fill="none" stroke="${RO}" stroke-width="2.6" opacity="${f(0.5 + 0.4 * tl)}"/><ellipse cx="${f(x)}" cy="1" rx="${f(rx * tl * fill)}" ry="${f(rx * 0.36 * tl * fill)}" fill="${RO}" opacity=".22"/>`;
export const tLane = (x0, len, tl, w = 16) => `<rect x="${f(x0)}" y="${f(-w / 2)}" width="${f(len)}" height="${f(w)}" rx="${f(w / 2)}" fill="${RO}" opacity="${f(0.1 + 0.1 * tl)}"/><path d="M${f(x0)} 0 L${f(x0 + len)} 0" stroke="${RO}" stroke-width="2.6" stroke-dasharray="10 6" opacity="${f(0.5 + 0.4 * tl)}"/><path d="M${f(x0 + len - 12)} -8 L${f(x0 + len)} 0 L${f(x0 + len - 12)} 8" stroke="${RO}" stroke-width="3" fill="none" opacity="${f(0.5 + 0.4 * tl)}" stroke-linejoin="round"/>`;
export const tAim = (x0, y0, x1, y1, tl) => `<path d="M${f(x0)} ${f(y0)} L${f(x1)} ${f(y1)}" stroke="${RO}" stroke-width="2.2" stroke-dasharray="5 5" opacity="${f(0.45 + 0.45 * tl)}" stroke-linecap="round"/><circle cx="${f(x1)}" cy="${f(y1)}" r="4" fill="none" stroke="${RO}" stroke-width="2" opacity="${f(0.5 + 0.4 * tl)}"/>`;

// ---- finish: hurt + death (shared by every Husk). o: w,h,seed, mask (svg of the mask in local coords, translated by mx,my), elite (sprout+flower) ----
// HURT: white flash + squash-recoil + eyes squint (handled by the caller). DEATH: mask pops off and tumbles, cracks in two; body sinks and
// breaks into ink wisps + ash flakes; a small WARM MOTE rises (every kill, colour returns). Sprout/flower ONLY when o.elite (locked 2026-10-18).
export function finish(st, body, eyes, o = {}) {
  const die = st.die || 0, hurt = st.hurt || 0, W = o.w || 40, H = o.h || 40;
  let b = body, e = eyes;
  if (hurt) { const tr = `translate(${f(-W * 0.06)},0) scale(1.06,0.92) rotate(-5 ${f(-W * 0.3)} 0)`; b = `<g transform="${tr}">${b}</g>`; /* game: no baked whitening (the hit flash is the white tint fill at runtime) */ e = `<g transform="${tr}">${e}</g>`; }
  if (die > 0) {
    const r = rng(o.seed || 5); let fx = '';
    for (let i = 0; i < 8; i++) { const x = (r() - 0.5) * W * 1.2, y0 = -H * (0.25 + 0.5 * r()), up = die * (18 + 26 * r()); fx += `<path d="M${f(x)} ${f(y0 - up)} q${f(4 + r() * 4)} ${f(-6 - r() * 6)} ${f(-1)} ${f(-13 - r() * 8)}" stroke="${K.ink}" stroke-width="${f(5 * (1 - die) + 1.4)}" fill="none" stroke-linecap="round" opacity="${f(0.8 * (1 - die * 0.75))}"/>`; }
    for (let i = 0; i < 7; i++) { const x = (r() - 0.5) * W * 1.5, y = -H * r() - die * 16 * r(); fx += `<rect x="${f(x)}" y="${f(y)}" width="3" height="2" fill="#b9bdc8" opacity="${f(0.7 * (1 - die * 0.6))}" transform="rotate(${f(r() * 90)} ${f(x)} ${f(y)})"/>`; }
    b = `<g opacity="${f(Math.max(0, 1 - die * 1.15))}" transform="translate(0,${f(die * H * 0.22)}) scale(1,${f(1 - die * 0.5)})">${b}</g>` + fx;
    const dm = Math.min(1, die * 1.25);
    if (o.mask) { const tx = o.mx + dm * (o.mdx ?? 10), ty = o.my + (-o.my - 4) * dm, rot = dm * (o.mrot ?? 75); const split = die > 0.8 ? (die - 0.8) * 5 : 0;
      b += `<g transform="translate(${f(tx)},${f(ty)}) rotate(${f(rot)})"><g transform="translate(${f(-split * 3)},0)">${o.mask}</g></g>` + (split ? `<path d="M${f(tx - 3)} ${f(ty - 10)} l3 6 l-2 5 l3 6" stroke="${VOID}" stroke-width="1.6" fill="none"/>` : ''); }
    if (die > 0.45) { const g = Math.min(1, (die - 0.45) / 0.45); b += glow(-2, -H * 0.35 - g * 12, 16 * g + 4, 16 * g + 4, '#ffd27a', 0.55) + `<circle cx="-2" cy="${f(-H * 0.35 - g * 12)}" r="${f(1.6 + 1.6 * g)}" fill="#fff1c8"/>`; }
    if (o.elite && die > 0.6) { const g = (die - 0.6) / 0.4; b += `<path d="M-8 0 q-1 -8 2 -${f(14 * g)}" stroke="#6fae5a" stroke-width="2.2" fill="none"/><path d="M-6 ${f(-11 * g)} q6 -4 9 0 q-5 3 -9 0Z" fill="#8fd06a" stroke="#3f7a46" stroke-width=".8"/><circle cx="-6" cy="${f(-14 * g)}" r="${f(3 * g)}" fill="#ffd98a" stroke="#c98a3a" stroke-width=".8"/>`; }
    e = `<g opacity="${f(Math.max(0, 1 - die * 1.7))}">${e}</g>`;
  }
  return { b, e };
}
export const EXTRA_DEFS = `<radialGradient id="hkVoid" cx=".5" cy=".62" r=".6"><stop offset="0" stop-color="#2b1a33" stop-opacity=".95"/><stop offset=".7" stop-color="${VOID}" stop-opacity=".2"/><stop offset="1" stop-color="${VOID}" stop-opacity="0"/></radialGradient>`;
