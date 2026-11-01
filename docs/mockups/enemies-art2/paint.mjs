// Enemies art round 2: PREMIUM paint engine for code-drawn creatures (mock-ups only, not game code). Node built-ins only.
// Hollowlight Style v1: L2 tinted outline (darker shade of each fill, never black) + H2 soft gradient with a soft form shadow
// and a COLD rim light (enemies get cold rims, heroes warm) + procedural texture clipped inside each part + grain.
// Units: design units (du), 4 du = 1 world unit. Origin = ground under the feet, facing +x, y up is negative.
const f = (n) => (+n).toFixed(1);
let D = [], uid = 0;
export const reset = () => { D = []; uid = 0; };
export const nid = (p = 'p') => p + (++uid);
export const addDef = (s) => { D.push(s); };
export const TAU = Math.PI * 2;
export { f };

// ---------- colour ----------
const h2r = (h) => { if (h.length === 4) h = '#' + h[1] + h[1] + h[2] + h[2] + h[3] + h[3]; return [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)); };
const r2h = (a) => '#' + a.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
export const mix = (a, b, t) => { const x = h2r(a), y = h2r(b); return r2h(x.map((v, i) => v + (y[i] - v) * t)); };
export const lum = (c) => { const [r, g, b] = h2r(c).map((v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
export const Lstar = (c) => { const y = lum(c); return y > 0.008856 ? 116 * Math.cbrt(y) - 16 : 903.3 * y; };

// ---------- seeded rng ----------
export const rng = (s) => () => { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296; };

// ---------- paths ----------
export const blob = (p) => { const n = p.length; let d = `M${f(p[0][0])} ${f(p[0][1])}`; for (let i = 0; i < n; i++) { const p0 = p[(i - 1 + n) % n], p1 = p[i], p2 = p[(i + 1) % n], p3 = p[(i + 2) % n]; d += ` C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])} ${f(p2[1])}`; } return d + 'Z'; };
export const line = (p) => { let d = `M${f(p[0][0])} ${f(p[0][1])}`; for (let i = 0; i < p.length - 1; i++) { const p0 = p[Math.max(0, i - 1)], p1 = p[i], p2 = p[i + 1], p3 = p[Math.min(p.length - 1, i + 2)]; d += ` C${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])} ${f(p2[1])}`; } return d; };
export const poly = (p) => 'M' + p.map(([x, y]) => `${f(x)} ${f(y)}`).join(' L') + 'Z';
export const ell = (cx, cy, rx, ry) => `M${f(cx - rx)} ${f(cy)} A${f(rx)} ${f(ry)} 0 1 0 ${f(cx + rx)} ${f(cy)} A${f(rx)} ${f(ry)} 0 1 0 ${f(cx - rx)} ${f(cy)}Z`;
export const circ = (cx, cy, r) => ell(cx, cy, r, r);
// tufted ellipse (fur/feather/moss edges): n tufts, depth dep (0..1 of radius), wobble seed, rotation rot
export const tuft = (cx, cy, rx, ry, n, dep = 0.12, seed = 1, rot = 0, from = 0, to = TAU) => {
  const r = rng(seed), p = [];
  for (let i = 0; i < n * 2; i++) {
    const t = from + (to - from) * i / (n * 2), out = i % 2 === 0 ? 1 + dep * (0.6 + 0.6 * r()) : 1 - dep * 0.25 * r();
    const a = t + rot; p.push([cx + Math.cos(a) * rx * out, cy + Math.sin(a) * ry * out]);
  }
  return blob(p);
};
// pointy tufts (sharper than tuft): uses straight-ish spikes
export const spiky = (cx, cy, rx, ry, n, dep = 0.25, seed = 1, rot = 0) => {
  const r = rng(seed), p = [];
  for (let i = 0; i < n; i++) {
    const a0 = rot + TAU * i / n, a1 = rot + TAU * (i + 0.5) / n, o = 1 + dep * (0.7 + 0.5 * r());
    p.push([cx + Math.cos(a0) * rx * 0.97, cy + Math.sin(a0) * ry * 0.97]);
    p.push([cx + Math.cos(a1 - 0.08) * rx * (1 + dep * 0.3), cy + Math.sin(a1 - 0.08) * ry * (1 + dep * 0.3)]);
    p.push([cx + Math.cos(a1 + 0.12) * rx * o, cy + Math.sin(a1 + 0.12) * ry * o]);
  }
  return poly(p);
};
// fur edge: closed path through pts; segments flagged in 'on' (or all) get pointed swoosh tufts. sign=+1 if outward is to the left of travel
// in screen coords for the given order (try both). sweep>0 leans tips along travel.
export const furry = (pts, jag = 4, sign = 1, seed = 1, on = null, sweep = 0.5) => { const r = rng(seed); const P0 = pts[0]; let d = `M${f(P0[0])} ${f(P0[1])}`;
  for (let i = 0; i < pts.length; i++) { const p = pts[i], q = pts[(i + 1) % pts.length], dx = q[0] - p[0], dy = q[1] - p[1], L = Math.hypot(dx, dy) || 1, ux = dx / L, uy = dy / L, nx = uy * sign, ny = -ux * sign;
    if (on && !on[i]) { d += ` L${f(q[0])} ${f(q[1])}`; continue; }
    const n = Math.max(1, Math.round(L / (jag * 2))); let bx = p[0], by = p[1];
    for (let k = 1; k <= n; k++) { const ex = p[0] + dx * k / n, ey = p[1] + dy * k / n, mx = (bx + ex) / 2, my = (by + ey) / 2, j = jag * (0.65 + 0.7 * r()), sw = j * sweep;
      const tx = mx + nx * j + ux * sw, ty = my + ny * j + uy * sw;
      d += ` Q${f(bx + nx * j * 0.55)} ${f(by + ny * j * 0.55)} ${f(tx)} ${f(ty)} Q${f(ex + nx * j * 0.15 - ux * j * 0.2)} ${f(ey + ny * j * 0.15 - uy * j * 0.2)} ${f(ex)} ${f(ey)}`; bx = ex; by = ey; } }
  return d + 'Z'; };
// tapered limb as a filled outline (x1,y1 r1 -> x2,y2 r2) with a slight bend b (perpendicular offset of the middle)
export const limb = (x1, y1, x2, y2, r1, r2 = r1, b = 0) => {
  const a = Math.atan2(y2 - y1, x2 - x1), nx = -Math.sin(a), ny = Math.cos(a), mx = (x1 + x2) / 2 + nx * b, my = (y1 + y2) / 2 + ny * b, rm = (r1 + r2) / 2;
  const P = (x, y, r, s) => [x + nx * r * s, y + ny * r * s];
  const a1 = P(x1, y1, r1, 1), m1 = P(mx, my, rm, 1), b1 = P(x2, y2, r2, 1), b2 = P(x2, y2, r2, -1), m2 = P(mx, my, rm, -1), a2 = P(x1, y1, r1, -1);
  return `M${f(a1[0])} ${f(a1[1])} Q${f(m1[0] * 2 - (a1[0] + b1[0]) / 2)} ${f(m1[1] * 2 - (a1[1] + b1[1]) / 2)} ${f(b1[0])} ${f(b1[1])} A${f(r2)} ${f(r2)} 0 0 0 ${f(b2[0])} ${f(b2[1])} Q${f(m2[0] * 2 - (a2[0] + b2[0]) / 2)} ${f(m2[1] * 2 - (a2[1] + b2[1]) / 2)} ${f(a2[0])} ${f(a2[1])} A${f(r1)} ${f(r1)} 0 0 0 ${f(a1[0])} ${f(a1[1])}Z`;
};

// ---------- gradients ----------
const gcache = new Map();
const gid = (k, mk) => { const key = k + '|' + uid0(); if (!gcache.has(key)) { const id = nid('g'); gcache.set(key, id); D.push(mk(id)); } return gcache.get(key); };
let resetCount = 0; const uid0 = () => resetCount;
export const resetAll = () => { reset(); gcache.clear(); resetCount++; };
export const lin = (stops, dir = [0.3, 0, 0.7, 1]) => gid('l' + stops.join() + dir, (id) => `<linearGradient id="${id}" x1="${dir[0]}" y1="${dir[1]}" x2="${dir[2]}" y2="${dir[3]}">${stops.map(([o, c, a = 1]) => `<stop offset="${o}" stop-color="${c}" stop-opacity="${a}"/>`).join('')}</linearGradient>`);
export const rad = (stops, c = [0.5, 0.5, 0.5], fx) => gid('r' + stops.join() + c + fx, (id) => `<radialGradient id="${id}" cx="${c[0]}" cy="${c[1]}" r="${c[2]}"${fx ? ` fx="${fx[0]}" fy="${fx[1]}"` : ''}>${stops.map(([o, col, a = 1]) => `<stop offset="${o}" stop-color="${col}" stop-opacity="${a}"/>`).join('')}</radialGradient>`);
export const glowG = (col, a = 0.9) => rad([[0, col, a], [0.18, col, a * 0.62], [0.42, col, a * 0.24], [0.72, col, a * 0.06], [1, col, 0]]);
export const glow = (x, y, rx, ry, col, a = 0.9, screen = true) => `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(rx)}" ry="${f(ry)}" fill="url(#${glowG(col, a)})"${screen ? ' style="mix-blend-mode:screen"' : ''}/>`;

// ---------- the painter ----------
// part(d, col, o): one shape painted with L2 outline + H2 gradient + soft form shadow + cold rim + clipped texture + grain.
// o: lw outline width du (3), sh shadow offset (5), rim rim offset (2.2), rimC rim colour, rimA, lt/dk overrides, tex (svg, clipped), grain (0..1),
//    gloss (0..1 wax/glass spec), nl (no outline), op (opacity), ink (outline colour override), dir gradient direction, flat (skip shadow)
export const COLD_RIM = '#d4e2f6';
export function part(d, col, o = {}) {
  const lw = o.lw ?? 3, ink = o.ink || mix(col, '#170c26', 0.6), lt = o.lt || mix(col, '#eef3fb', 0.3), dk = o.dk || mix(col, '#140f2a', 0.5);
  const id = nid('c');
  D.push(`<clipPath id="${id}"><path d="${d}"/></clipPath>`);
  let s = '';
  if (!o.nl) s += `<path d="${d}" fill="${ink}" stroke="${ink}" stroke-width="${f(lw * 2)}" stroke-linejoin="round" stroke-linecap="round"/>`;
  s += `<path d="${d}" fill="url(#${lin([[0, lt], [0.45, col], [1, dk]], o.dir)})"/>`;
  let inner = '';
  if (!o.flat) { const sh = o.sh ?? 5; inner += `<g opacity="${o.shA ?? 0.75}"><path d="${d}" fill="${dk}" /></g><path d="${d}" transform="translate(${f(-sh * 0.8)},${f(-sh)})" fill="url(#${lin([[0, lt], [0.45, col], [1, mix(col, dk, 0.35)]], o.dir)})" filter="url(#sb2)"/>`; }
  if (o.tex) inner += o.tex;
  if (o.grain !== 0) inner += `<rect x="-600" y="-600" width="1200" height="1200" filter="url(#grain)" opacity="${o.grain ?? 0.1}" style="mix-blend-mode:multiply"/>`;
  if (o.gloss) inner += `<path d="${d}" fill="url(#${rad([[0, '#ffffff', 0.9 * o.gloss], [0.3, '#ffffff', 0.3 * o.gloss], [1, '#ffffff', 0]], [0.3, 0.24, 0.2])})"/>`;
  // rim: thin bright crescent top-left, via mask (shape minus shape shifted down-right)
  if (o.rim !== 0) {
    const r = o.rim ?? 2.2, m = nid('m');
    D.push(`<mask id="${m}" maskUnits="userSpaceOnUse" x="-2000" y="-2000" width="4000" height="4000"><path d="${d}" fill="#fff"/><path d="${d}" fill="#000" transform="translate(${f(r * 0.9)},${f(r)})"/></mask>`);
    inner += `<g filter="url(#sb1)"><path d="${d}" fill="${o.rimC || COLD_RIM}" opacity="${o.rimA ?? 0.8}" mask="url(#${m})"/></g>`;
  }
  s += `<g clip-path="url(#${id})">${inner}</g>`;
  return o.op != null ? `<g opacity="${o.op}">${s}</g>` : s;
}
// outlined stroke (twigs, roots, wicks, threads)
export function rod(d, col, w = 4, o = {}) {
  const ink = o.ink || mix(col, '#170c26', 0.6), lw = o.lw ?? 2.6;
  return (o.nl ? '' : `<path d="${d}" fill="none" stroke="${ink}" stroke-width="${f(w + lw * 2)}" stroke-linecap="round" stroke-linejoin="round"/>`)
    + `<path d="${d}" fill="none" stroke="${col}" stroke-width="${f(w)}" stroke-linecap="round" stroke-linejoin="round"/>`
    + (o.hi === 0 ? '' : `<path d="${d}" fill="none" stroke="${mix(col, '#eef3fb', 0.4)}" stroke-width="${f(Math.max(0.6, w * 0.32))}" stroke-linecap="round" transform="translate(${f(-w * 0.18)},${f(-w * 0.22)})" opacity=".75"/>`);
}
// texture strokes (drawn inside a clip): short strands following an angle field
export function strands(cx, cy, rx, ry, n, col, o = {}) {
  const r = rng(o.seed || 7), len = o.len || 7, w = o.w || 1.2, ang = o.ang ?? 0.6; let s = '';
  for (let i = 0; i < n; i++) {
    const a = r() * TAU, rr = Math.sqrt(r()), x = cx + Math.cos(a) * rx * rr, y = cy + Math.sin(a) * ry * rr;
    const th = ang + (r() - 0.5) * (o.jit ?? 0.6), l = len * (0.6 + 0.7 * r()), c = (r() - 0.5) * l * 0.5;
    const x2 = x + Math.cos(th) * l, y2 = y + Math.sin(th) * l;
    s += `<path d="M${f(x)} ${f(y)} Q${f((x + x2) / 2 - Math.sin(th) * c)} ${f((y + y2) / 2 + Math.cos(th) * c)} ${f(x2)} ${f(y2)}" stroke="${col}" stroke-width="${f(w * (0.7 + 0.5 * r()))}" stroke-linecap="round" fill="none" opacity="${f(o.a ?? 0.55)}"/>`;
  }
  return s;
}
// tapered fur/feather tick: a thin leaf from (x,y) along angle ang
export const tick = (x, y, len, ang, w, col, a = 0.6) => { const c = Math.cos(ang), s = Math.sin(ang), nx = -s * w, ny = c * w, x2 = x + c * len, y2 = y + s * len;
  return `<path d="M${f(x)} ${f(y)} Q${f(x + c * len * 0.45 + nx)} ${f(y + s * len * 0.45 + ny)} ${f(x2)} ${f(y2)} Q${f(x + c * len * 0.45 - nx * 0.4)} ${f(y + s * len * 0.45 - ny * 0.4)} ${f(x)} ${f(y)}Z" fill="${col}" opacity="${a}"/>`; };
export const ticks = (list, col, a = 0.6) => list.map(([x, y, l, an, w = 1.6]) => tick(x, y, l, an, w, col, a)).join('');
export function specks(cx, cy, rx, ry, n, col, o = {}) {
  const r = rng(o.seed || 3); let s = '';
  for (let i = 0; i < n; i++) { const a = r() * TAU, rr = Math.sqrt(r()); s += `<ellipse cx="${f(cx + Math.cos(a) * rx * rr)}" cy="${f(cy + Math.sin(a) * ry * rr)}" rx="${f((o.r || 1.6) * (0.5 + r()))}" ry="${f((o.r || 1.6) * (0.4 + 0.6 * r()))}" fill="${col}" opacity="${f((o.a ?? 0.6) * (0.5 + 0.5 * r()))}"/>`; }
  return s;
}

// ---------- eyes (WL6b: ember halo under a SOLID cream core, white hot centre). shape: round | almond | slit | squint | wide | x ----------
export const EYE = '#ff5a3c', BOSS_EYE = '#ffb84a', CORE = '#ffe9c4';
export function eye(x, y, r = 3, o = {}) {
  const col = o.col || EYE, a = o.a ?? 1, sh = o.shape || 'round', rot = o.rot || 0, halo = o.halo ?? 3.4;
  let core;
  if (sh === 'almond') core = `<path d="M${f(-r * 1.35)} 0 Q0 ${f(-r * 1.15)} ${f(r * 1.35)} 0 Q0 ${f(r * 0.85)} ${f(-r * 1.35)} 0Z" fill="${CORE}"/>`;
  else if (sh === 'slit') core = `<path d="M${f(-r * 1.5)} ${f(r * 0.2)} Q0 ${f(-r * 0.9)} ${f(r * 1.5)} ${f(-r * 0.25)} Q0 ${f(r * 0.45)} ${f(-r * 1.5)} ${f(r * 0.2)}Z" fill="${CORE}"/>`;
  else if (sh === 'squint') core = `<path d="M${f(-r * 1.3)} ${f(-r * 0.5)} L${f(r * 1.1)} ${f(r * 0.05)} L${f(-r * 1.3)} ${f(r * 0.55)}" fill="none" stroke="${CORE}" stroke-width="${f(r * 0.7)}" stroke-linecap="round" stroke-linejoin="round"/>`;
  else if (sh === 'wide') core = `<circle r="${f(r * 1.25)}" fill="${CORE}"/>`;
  else if (sh === 'ring') core = `<circle r="${f(r * 1.05)}" fill="none" stroke="${CORE}" stroke-width="${f(r * 0.55)}"/>`;
  else core = `<circle r="${f(r)}" fill="${CORE}"/>`;
  const hot = sh === 'squint' || sh === 'ring' ? '' : `<ellipse cx="${f(-r * 0.15)}" cy="${f(-r * 0.12)}" rx="${f(r * 0.5)}" ry="${f(r * 0.42)}" fill="#fff"/>`;
  return `<g opacity="${f(a)}" transform="translate(${f(x)},${f(y)}) rotate(${f(rot)})"><circle r="${f(r * halo)}" fill="url(#${glowG(col, 0.9)})"/><circle r="${f(r * 1.55)}" fill="${col}" opacity=".55"/>${core}${hot}</g>`;
}
// dark void socket behind an eye (the empty face), drawn in the BODY layer
export const VOID = '#0d0a14';
export const socket = (d) => `<path d="${d}" fill="none" stroke="#2a2230" stroke-width="5" stroke-linejoin="round" opacity=".38" filter="url(#sb1)"/><path d="${d}" fill="${VOID}"/><path d="${d}" fill="url(#${rad([[0, '#2a1830', 0.9], [0.7, VOID, 0.2], [1, VOID, 0]], [0.5, 0.6, 0.6])})"/>`;

// ---------- ground ----------
export const shadow = (rx, x = 0, a = 0.42) => `<ellipse cx="${f(x)}" cy="1" rx="${f(rx)}" ry="${f(rx * 0.24)}" fill="#07050d" opacity="${a}" filter="url(#sb4)"/>`;

// ---------- page-level filters ----------
export const FILT = `
<radialGradient id="vgn" cx=".38" cy=".3" r=".75"><stop offset="0" stop-color="#ffffff" stop-opacity=".12"/><stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#0a0812" stop-opacity=".55"/></radialGradient>
<filter id="sb1" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="1"/></filter>
<filter id="sb2" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="2.2"/></filter>
<filter id="sb4" x="-40%" y="-80%" width="180%" height="260%"><feGaussianBlur stdDeviation="3.5"/></filter>
<filter id="sb8" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="8"/></filter>
<filter id="grain" x="-600" y="-600" width="1200" height="1200" filterUnits="userSpaceOnUse"><feTurbulence type="fractalNoise" baseFrequency=".55" numOctaves="2" seed="7"/><feColorMatrix type="matrix" values="0 0 0 0 .55  0 0 0 0 .52  0 0 0 0 .6  0 0 0 -1.6 1.25"/></filter>
<filter id="mottle" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".008 .02" numOctaves="3" seed="11"/><feColorMatrix type="matrix" values="0 0 0 0 .1  0 0 0 0 .1  0 0 0 0 .1  1.5 0 0 0 -.55"/></filter>
<filter id="nightF" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values=".27 0 0 0 .012  0 .3 0 0 .016  0 0 .36 0 .03  0 0 0 1 0"/></filter>
<filter id="duskF" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values=".58 0 0 0 .01  0 .61 0 0 .014  0 0 .68 0 .025  0 0 0 1 0"/></filter>
<filter id="dayF" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values=".9 0 0 0 0  0 .9 0 0 0  0 0 .93 0 0  0 0 0 1 0"/></filter>
<filter id="hurtF" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values=".5 0 0 0 .5  0 .5 0 0 .5  0 0 .5 0 .53  0 0 0 1 0"/></filter>
<filter id="silF"><feColorMatrix type="matrix" values="0 0 0 0 .05  0 0 0 0 .05  0 0 0 0 .07  0 0 0 1 0"/></filter>
<filter id="nightRim" x="-30%" y="-30%" width="160%" height="160%"><feMorphology in="SourceAlpha" operator="dilate" radius="3" result="d"/><feFlood flood-color="#8fa2d8"/><feComposite in2="d" operator="in" result="o"/><feComposite in="o" in2="SourceAlpha" operator="out" result="r"/><feGaussianBlur in="r" stdDeviation="1.2"/></filter>
`;
export const defs = () => `<defs>${D.join('')}${FILT}</defs>`;
