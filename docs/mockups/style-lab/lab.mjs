// Style Lab engine: ONE drawing description, rendered through 5 axes (Line, Shade, Proportion, World, Light). Mock-ups only.
import { nid, ell, circ, glowStops, rnd, T, FONT } from '../cartoon-polished/core.mjs';
export { rnd, T, FONT, ell, circ, nid };
// ---------- colour ----------
const h2r = (h) => { if (h.length === 4) h = '#' + h[1] + h[1] + h[2] + h[2] + h[3] + h[3]; return [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)); };
const r2h = (a) => '#' + a.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
export const mix = (a, b, t) => { const x = h2r(a), y = h2r(b); return r2h(x.map((v, i) => v + (y[i] - v) * t)); };
export const adjust = (c, { sat = 1, gain = 1, lift = 0 }) => { const x = h2r(c), l = 0.3 * x[0] + 0.59 * x[1] + 0.11 * x[2]; return r2h(x.map((v) => (l + (v - l) * sat) * gain + lift)); };
// ---------- state ----------
export let S = null; let D = [], cache = new Map();
export const begin = () => { D = []; cache = new Map(); };
export const use = (s) => { S = s; };
const gid = (k, mk) => { if (!cache.has(k)) { const id = nid('g'); cache.set(k, id); D.push(mk(id)); } return cache.get(k); };
const lg3 = (a, b, c, d = [0.2, 0, 0.8, 1]) => gid('l' + a + b + c + d, (id) => `<linearGradient id="${id}" x1="${d[0]}" y1="${d[1]}" x2="${d[2]}" y2="${d[3]}"><stop offset="0" stop-color="${a}"/><stop offset=".5" stop-color="${b}"/><stop offset="1" stop-color="${c}"/></linearGradient>`);
export const lgU = (key, x1, y1, x2, y2, stops) => gid('u' + key, (id) => `<linearGradient id="${id}" gradientUnits="userSpaceOnUse" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${stops.map(([o, c, a = 1]) => `<stop offset="${o}" stop-color="${c}" stop-opacity="${a}"/>`).join('')}</linearGradient>`);
export const rgU = (key, cx, cy, r, stops) => gid('r' + key, (id) => `<radialGradient id="${id}" gradientUnits="userSpaceOnUse" cx="${cx}" cy="${cy}" r="${r}">${stops.map(([o, c, a = 1]) => `<stop offset="${o}" stop-color="${c}" stop-opacity="${a}"/>`).join('')}</radialGradient>`);
export const glowId = (col, a = 0.9) => gid('glow' + col + a, (id) => `<radialGradient id="${id}">${glowStops(col, a).map(([o, c, al]) => `<stop offset="${o}" stop-color="${c}" stop-opacity="${al}"/>`).join('')}</radialGradient>`);
export const glow = (x, y, rx, ry, col, a = 0.9, blend = true) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="url(#${glowId(col, a)})"${blend ? ' style="mix-blend-mode:screen"' : ''}/>`;
const spec = (a, b) => gid('sp' + a + b, (id) => `<radialGradient id="${id}" cx=".3" cy=".24" r=".42" fx=".28" fy=".2"><stop offset="0" stop-color="#fff" stop-opacity="${a}"/><stop offset=".55" stop-color="#fff" stop-opacity="${b}"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>`);
const dot = () => gid('dot', (id) => `<radialGradient id="${id}" cx=".27" cy=".2" r=".12"><stop offset="0" stop-color="#fff"/><stop offset=".7" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>`);
export const FILTERS = `<defs>
<filter id="wob" x="-8%" y="-8%" width="116%" height="116%"><feTurbulence type="fractalNoise" baseFrequency=".045" numOctaves="2" seed="4" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="4.5" xChannelSelector="R" yChannelSelector="G"/></filter>
<filter id="wobS" x="-8%" y="-8%" width="116%" height="116%"><feTurbulence type="fractalNoise" baseFrequency=".09" numOctaves="2" seed="9" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="3" xChannelSelector="R" yChannelSelector="G"/></filter>
<filter id="soft" x="-8%" y="-8%" width="116%" height="116%"><feGaussianBlur stdDeviation=".9"/></filter>
<filter id="paint" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency=".05" numOctaves="2" seed="3" result="n1"/><feDisplacementMap in="SourceGraphic" in2="n1" scale="3.5" xChannelSelector="R" yChannelSelector="G" result="d"/><feTurbulence type="fractalNoise" baseFrequency=".02 .3" numOctaves="3" seed="8" result="n2"/><feColorMatrix in="n2" type="matrix" values=".9 0 0 0 .52  .9 0 0 0 .52  .9 0 0 0 .52  0 0 0 0 1" result="tex"/><feBlend in="d" in2="tex" mode="multiply" result="m"/><feComposite in="m" in2="d" operator="in"/></filter>
<filter id="paintG" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".012 .06" numOctaves="4" seed="21"/><feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1.6 0 0 0 -.55"/></filter>
<filter id="mottle" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".008 .02" numOctaves="3" seed="11"/><feColorMatrix type="matrix" values="0 0 0 0 .1  0 0 0 0 .1  0 0 0 0 .1  1.5 0 0 0 -.55"/></filter>
<filter id="paper" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="5"/><feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .5 -.12"/></filter>
<filter id="b1"><feGaussianBlur stdDeviation="1"/></filter><filter id="b2" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="2"/></filter>
<filter id="b4" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4"/></filter>
<filter id="b8" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="8"/></filter>
<filter id="b16" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="16"/></filter>
<filter id="b30" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="30"/></filter>
<pattern id="hatch" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(40)"><line x1="0" y1="0" x2="0" y2="5" stroke="#2a2233" stroke-width="1.1" opacity=".7"/></pattern>
</defs>`;
export const defsOut = () => `<defs>${D.join('')}</defs>${FILTERS}`;
// ---------- shape engine ----------
const crescent = (d, dx, dy, fill, op = 1, f) => { const m = nid('m'); D.push(`<mask id="${m}" maskUnits="userSpaceOnUse" x="-4000" y="-4000" width="8000" height="8000"><rect x="-4000" y="-4000" width="8000" height="8000" fill="#fff"/><path d="${d}" fill="#000" transform="translate(${dx},${dy})"/></mask>`); const p = `<path d="${d}" fill="${fill}" opacity="${op}" mask="url(#${m})"/>`; return f ? `<g filter="url(#${f})">${p}</g>` : p; };
export const cap = (x1, y1, x2, y2, r1, r2 = r1) => { const a = Math.atan2(y2 - y1, x2 - x1), nx = -Math.sin(a), ny = Math.cos(a); const p = (x, y, r, s) => `${(x + nx * r * s).toFixed(1)} ${(y + ny * r * s).toFixed(1)}`; return `M${p(x1, y1, r1, 1)} L${p(x2, y2, r2, 1)} A${r2} ${r2} 0 0 0 ${p(x2, y2, r2, -1)} L${p(x1, y1, r1, -1)} A${r1} ${r1} 0 0 0 ${p(x1, y1, r1, 1)}Z`; };
export const fl = (d, f) => f === 1 ? d : d.replace(/([MLCQmlcqaA])([^MLCQZmlcqaAz]*)/g, (m, c, nums) => {
  const n = nums.trim().split(/[\s,]+/).filter(Boolean).map(parseFloat);
  if (c === 'a' || c === 'A') { for (let k = 0; k + 6 < n.length; k += 7) { n[k + 4] = 1 - n[k + 4]; n[k + 5] = -n[k + 5]; } return c + n.join(' '); }
  return c + n.map((v, q) => (q % 2 === 0 ? -v : v)).join(' ');
});
export function shp(d, c0, o = {}) {
  const s = S, c = s.adj(c0), lt = mix(c, '#fff6dc', 0.36), dk = mix(c, s.shTint, 0.4), w = (o.w ?? 1) * s.lw;
  const ink = o.spirit ? mix(c, '#5a3414', 0.62) : s.ink;
  const so = o.so ?? 5, clip = o.x ? nid('k') : null; if (clip) D.push(`<clipPath id="${clip}"><path d="${d}"/></clipPath>`);
  const extra = o.x ? `<g clip-path="url(#${clip})">${o.x}</g>` : '';
  let under = '', body = '', over = '';
  if (s.L === 'L1' && !o.nl) under = `<path d="${d}" fill="${ink}" stroke="${ink}" stroke-width="${(o.spirit ? 3.4 : 6) * w}" stroke-linejoin="round" stroke-linecap="round"/>`;
  if (s.L === 'L2' && !o.nl) under = `<path d="${d}" fill="${mix(c, '#2a0f30', 0.62)}" stroke="${mix(c, '#2a0f30', 0.62)}" stroke-width="${4.6 * w}" stroke-linejoin="round" stroke-linecap="round"/>`;
  if (s.L === 'L3' && !o.nl) under = `<path d="${d}" fill="none" stroke="${mix(c, '#1a1030', 0.62)}" stroke-width="${3.4 * w}" stroke-linejoin="round" opacity=".5" filter="url(#b1)"/>`;
  const rim = o.rim || mix(lt, '#fff2c0', 0.5);
  if (s.H === 'H1') body = `<path d="${d}" fill="${c}"/>${crescent(d, -so, -so * 1.15, dk, 1)}`;
  if (s.H === 'H2') body = `<path d="${d}" fill="url(#${lg3(lt, c, dk)})"/>${crescent(d, -2.8, -2.2, rim, 0.9)}`;
  if (s.H === 'H3') body = `<path d="${d}" fill="url(#${lg3(mix(c, lt, 0.2), c, mix(c, dk, 0.45))})"/>${crescent(d, 4, 4, lt, 0.5, 'b2')}${crescent(d, -4.5, -4.5, dk, 0.7, 'b2')}`;
  if (s.H === 'H4') body = `<path d="${d}" fill="url(#${lg3(mix(c, '#fff', 0.2), c, mix(c, s.shTint, 0.5))})"/>${crescent(d, -3.4, -3, mix(c, '#ffe9b0', 0.5), 0.75, 'b1')}<path d="${d}" fill="url(#${spec(0.7, 0.18)})"/><path d="${d}" fill="url(#${dot()})" opacity=".95"/>`;
  if (s.L === 'L3') over = crescent(d, 2.2, 2.2, '#fff8e0', 0.55, 'b1') + crescent(d, -2, -2, dk, 0.35, 'b1');
  if (s.L === 'L4') {
    over = `<path d="${d}" fill="none" stroke="${ink}" stroke-width="${2 * w}" stroke-linejoin="round" filter="url(#wob)"/><path d="${d}" fill="none" stroke="${ink}" stroke-width="${0.8 * w}" opacity=".6" transform="translate(1.8,1.2)" filter="url(#wobS)"/>`;
    if (s.H === 'H1' && !o.nl) body += crescent(d, -9, -10, 'url(#hatch)', 0.9);
    body = `<g transform="translate(1.6,1.2)" filter="url(#wob)">${body}</g>`;
  }
  if (s.H === 'H3') { body = `<g filter="url(#paint)">${under}${body}</g>`; under = ''; }
  let out = under + body + extra + over;
  if (s.L === 'L3') out = `<g filter="url(#soft)">${out}</g>`;
  return o.op != null ? `<g opacity="${o.op}">${out}</g>` : out;
}
// stroked limb (roots, twigs) in the same line language
export function stk(d, c0, wd = 4) {
  const s = S, c = s.adj(c0), ink = s.L === 'L2' ? mix(c, '#2a0f30', 0.62) : s.ink, lw = s.lw;
  const body = `<path d="${d}" fill="none" stroke="${c}" stroke-width="${wd}" stroke-linecap="round" stroke-linejoin="round"/>`;
  if (s.L === 'L1' || s.L === 'L2') return `<path d="${d}" fill="none" stroke="${ink}" stroke-width="${wd + 3.4 * lw}" stroke-linecap="round" stroke-linejoin="round"/>${body}`;
  if (s.L === 'L4') return `<g filter="url(#wob)"><path d="${d}" fill="none" stroke="${ink}" stroke-width="${wd + 2}" stroke-linecap="round" opacity=".85"/><path d="${d}" fill="none" stroke="${c}" stroke-width="${wd - 0.8}" stroke-linecap="round" transform="translate(1,1)"/></g>`;
  return body;
}
export const eyeG = (x, y, rx, ry, o = {}) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${o.c || '#2b1c20'}"/><ellipse cx="${x}" cy="${y + ry * 0.4}" rx="${rx * 0.66}" ry="${ry * 0.5}" fill="${o.c2 || '#7a4a3a'}" opacity=".75"/><circle cx="${x - rx * 0.3}" cy="${y - ry * 0.32}" r="${Math.max(0.9, rx * 0.36)}" fill="#fff"/>${rx > 3 ? `<circle cx="${x + rx * 0.36}" cy="${y + ry * 0.4}" r="${rx * 0.16}" fill="#fff" opacity=".8"/>` : ''}`;
const epoint = (x, y, r = 2.4) => `<circle cx="${x}" cy="${y}" r="${r * 3}" fill="url(#${glowId('#ff5a3c', 0.7)})"/><circle cx="${x}" cy="${y}" r="${r}" fill="#ffd2a8"/><circle cx="${x}" cy="${y}" r="${r * 0.5}" fill="#fff"/>`;
export const vein = (pts, w = 2) => `<path d="${pts}" fill="none" stroke="#150f1c" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" opacity=".9"/>`;
// ---------- WREN ----------
export const WREN_H = { P1: 94, P2: 98, P3: 116 };
export function wren() {
  const s = S, P = s.P, g = { P1: { ll: 13, bh: 32, ws: 38, wh: 44, hr: 30, hand: 6.5, foot: 11, leg: 11 }, P2: { ll: 32, bh: 38, ws: 34, wh: 30, hr: 17, hand: 6, foot: 11, leg: 9 }, P3: { ll: 48, bh: 46, ws: 25, wh: 27, hr: 14, hand: 10.5, foot: 22, leg: 7 } }[P];
  const top = -(g.ll + g.bh), hc = top - g.hr * 0.62, a = g.ws / 2, b = g.wh / 2; let o = '';
  const Ls = s.G === 'G2' ? 130 : 95;
  o += shp(`M${a * 0.3} ${top + 4} C${a + Ls * 0.3} ${top - 30} ${a + Ls * 0.62} ${top + 18} ${a + Ls} ${top - 12} C${a + Ls * 0.7} ${top + 30} ${a + Ls * 0.4} ${top + 10} ${a * 0.4} ${top + 14}Z`, '#f2a335', { w: 0.8 });
  o += shp(`M${-g.hr * 0.95} ${hc - g.hr * 0.25} L${-g.hr * 0.8} ${hc - g.hr * 1.5} L${-g.hr * 0.1} ${hc - g.hr * 0.95}Z`, '#74a09b', { w: 0.8 });
  o += shp(`M${g.hr * 0.95} ${hc - g.hr * 0.25} L${g.hr * 0.8} ${hc - g.hr * 1.5} L${g.hr * 0.1} ${hc - g.hr * 0.95}Z`, '#74a09b', { w: 0.8 });
  for (const sx of [-1, 1]) { const x0 = sx * b * 0.45; o += shp(cap(x0, -g.ll - 2, x0, -5, g.leg / 2, g.leg / 2 * 0.9), '#5a4638', { w: 0.8 }); o += shp(ell(x0 - 3, -4.5, g.foot * 0.7, 5.6), '#8a5530', { w: 0.8 }); }
  o += shp(cap(a - 3, top + 8, a + 3, top + g.bh * 0.78, g.hand * 0.78, g.hand * 0.7), '#5d8486', { w: 0.8 }) + shp(circ(a + 3, top + g.bh * 0.8 + 3, g.hand * 0.8), '#f6c9a6', { w: 0.7 });
  const sy = (top - g.ll) / 2;
  o += shp(`M${-a} ${top} Q0 ${top - 5} ${a} ${top} Q${a + 4} ${sy} ${b + 3} ${-g.ll + 3} Q0 ${-g.ll + 11} ${-b - 3} ${-g.ll + 3} Q${-a - 4} ${sy} ${-a} ${top}Z`, '#6f9a98', { w: 0.9, so: 6 });
  o += shp(`M${-b - 3} ${-g.ll - 3} Q0 ${-g.ll + 5} ${b + 3} ${-g.ll - 3} L${b + 3} ${-g.ll + 3} Q0 ${-g.ll + 11} ${-b - 3} ${-g.ll + 3}Z`, '#bfa079', { w: 0.6 });
  o += shp(`M${-b} ${top + g.bh * 0.62} L${b} ${top + g.bh * 0.62} L${b} ${top + g.bh * 0.62 + 4} L${-b} ${top + g.bh * 0.62 + 4}Z`, '#7a4a2e', { w: 0.5 });
  const hx = -a - 15, hy = top + g.bh * 0.52;
  o += shp(cap(-a + 3, top + 8, hx, hy, g.hand * 0.85, g.hand * 0.75), '#6f9a98', { w: 0.8 });
  const lx = hx - 1, ly = hy + 17;
  o += `<path d="M${hx} ${hy} Q${hx + 5} ${hy + 5} ${lx + 4} ${ly - 10}" fill="none" stroke="#5a3a1a" stroke-width="1.4"/>`;
  o += glow(lx, ly, 52, 46, '#ffc96b', 0.9);
  o += shp(`M${lx - 7} ${ly - 8} L${lx + 7} ${ly - 8} L${lx + 8.5} ${ly + 9} L${lx - 8.5} ${ly + 9}Z`, '#d2a24c', { w: 0.7, so: 3 });
  o += `<path d="M${lx - 4.6} ${ly - 5.5} L${lx + 4.6} ${ly - 5.5} L${lx + 5.5} ${ly + 6} L${lx - 5.5} ${ly + 6}Z" fill="url(#${lg3('#fff6c8', '#ffd05a', '#ff9d3a', [0, 0, 0, 1])})"/><path d="M${lx} ${ly - 4} Q${lx + 3.2} ${ly + 1} ${lx} ${ly + 5} Q${lx - 3.2} ${ly + 1} ${lx} ${ly - 4}Z" fill="#fff"/>`;
  o += shp(circ(hx, hy, g.hand * 0.9), '#f6c9a6', { w: 0.7 });
  o += shp(circ(0, hc, g.hr), '#74a09b', { w: 1, so: 7 });
  const fy = hc + g.hr * 0.14, frx = g.hr * 0.68, fry = g.hr * 0.62;
  o += `<ellipse cx="0" cy="${fy}" rx="${frx + 2.4}" ry="${fry + 2.4}" fill="#34585c"/>`;
  o += shp(ell(0, fy, frx, fry), '#f6c9a6', { w: 0.5, nl: s.L === 'L3', so: 3 });
  const hc2 = '#5a3a2e'; o += shp(`M${-frx - 1} ${fy - fry * 0.15} Q${-frx * 0.5} ${fy - fry * 1.35} 0 ${fy - fry * 1.0} Q${frx * 0.5} ${fy - fry * 1.35} ${frx + 1} ${fy - fry * 0.15} Q${frx * 0.5} ${fy - fry * 0.45} 0 ${fy - fry * 0.5} Q${-frx * 0.5} ${fy - fry * 0.45} ${-frx - 1} ${fy - fry * 0.15}Z`, hc2, { w: 0.5, so: 2 });
  const er = { P1: [4.4, 5.4], P2: [2.7, 3.4], P3: [2.2, 2.9] }[P], ex = g.hr * (P === 'P1' ? 0.28 : 0.3), ey = fy + g.hr * 0.12;
  o += eyeG(-ex, ey, er[0], er[1]) + eyeG(ex, ey, er[0], er[1]);
  if (P !== 'P1') o += `<path d="M${-ex - 3.5} ${ey - er[1] - 2.2} L${-ex + 3} ${ey - er[1] - 1.2} M${ex + 3.5} ${ey - er[1] - 2.2} L${ex - 3} ${ey - er[1] - 1.2}" stroke="${hc2}" stroke-width="1.2" stroke-linecap="round"/>`;
  if (P === 'P1') o += `<circle cx="${-ex - 4}" cy="${ey + 6}" r="3.8" fill="#ff8a8a" opacity=".5"/><circle cx="${ex + 4}" cy="${ey + 6}" r="3.8" fill="#ff8a8a" opacity=".5"/>`;
  o += `<path d="M${-2.2} ${ey + er[1] + 4} Q0 ${ey + er[1] + 6.2} 2.2 ${ey + er[1] + 4}" fill="none" stroke="#8a4a3a" stroke-width="1.2" stroke-linecap="round"/>`;
  o += shp(`M${-a - 3} ${top - 1} Q0 ${top + 8} ${a + 3} ${top - 1} L${a + 2} ${top + 8} Q0 ${top + 16} ${-a - 2} ${top + 8}Z`, '#f5a335', { w: 0.8, so: 3 });
  o += shp(`M${-a * 0.3} ${top + 8} L${-a * 0.9} ${top + 28} L${-a * 0.2} ${top + 24} L${a * 0.1} ${top + 12}Z`, '#e8932a', { w: 0.7, so: 3 });
  return o;
}
// ---------- WOLF (ghost or fell), faces +x unless f=-1 ----------
export function wolf({ enemy = false, f = 1 } = {}) {
  const s = S, P = s.P, p = { ...{ P1: { rx: 31, ry: 17, hr: 20, leg: 14, lw: 9, ear: 13 }, P2: { rx: 40, ry: 13.5, hr: 13.5, leg: 27, lw: 6.5, ear: 12 }, P3: { rx: 46, ry: 11, hr: 12.5, leg: 40, lw: 5, ear: 16 } }[P] };
  if (enemy) { p.ry *= 0.82; p.lw *= 0.85; }
  const { rx, ry, hr, leg, lw, ear } = p, by = -(leg + ry * 0.55), hx = rx * 0.92, hy = enemy ? by + ry * 0.35 : by - ry * 0.55;
  const F = (d) => fl(d, f), X = (x) => x * f;
  const ed = (c) => mix(c, '#14101e', s.ed || 0), base = enemy ? ed('#8f9cab') : '#ffdf9a', dark2 = enemy ? ed('#6b7888') : '#f3bf70', tailC = enemy ? ed('#7f8c9b') : '#ffcb7a';
  const sp = { spirit: !enemy }; let o = '';
  const mid = nid('mk'); D.push(`<mask id="${mid}" maskUnits="userSpaceOnUse" x="-250" y="-250" width="500" height="260"><rect x="-250" y="-250" width="500" height="260" fill="url(#${lgU('lf' + leg + by, 0, by, 0, 0, [[0, '#fff'], [0.6, '#fff'], [1, '#3a3a3a']])})"/></mask>`);
  const tail = enemy ? `M${-rx * 0.8} ${by - ry * 0.3} C${-rx * 1.05} ${by} ${-rx * 1.15} ${by + ry * 1.2} ${-rx * 1.2} ${by + ry * 2.1} L${-rx * 1.0} ${by + ry * 2.0} C${-rx * 0.95} ${by + ry * 1.2} ${-rx * 0.8} ${by + ry * 0.4} ${-rx * 0.7} ${by + ry * 0.3}Z`
    : `M${-rx * 0.75} ${by - ry * 0.1} C${-rx * 1.5} ${by - ry * 0.1} ${-rx * 1.95} ${by - ry * 1.8} ${-rx * 1.55} ${by - ry * 3.0} C${-rx * 1.75} ${by - ry * 1.6} ${-rx * 1.35} ${by + ry * 0.35} ${-rx * 0.7} ${by + ry * 0.7}Z`;
  const legs = [[0.62, 5], [0.32, -3], [-0.28, 3], [-0.58, -5]].map(([k, off], i) => { const x = rx * k; return shp(F(cap(x, by + ry * 0.2, x + off * 0.4, -2, lw / 2, lw / 2 * 0.78)), i % 2 ? dark2 : base, { w: 0.8, ...sp }) + shp(F(ell(x + off * 0.4 + 2, -2, lw * 0.75, 3.2)), i % 2 ? dark2 : base, { w: 0.7, ...sp }); }).join('');
  if (enemy) o += `<ellipse cx="0" cy="0" rx="${rx * 1.1}" ry="6" fill="#000" opacity=".32" filter="url(#b4)"/>`;
  o += shp(F(tail), tailC, { w: 0.9, ...sp });
  o += enemy ? legs : `<g mask="url(#${mid})">${legs}</g>`;
  if (enemy) { let sp2 = `M${X(-rx * 0.7)} ${by - ry * 0.7}`; for (let i = 0; i < 6; i++) sp2 += ` L${X(-rx * 0.7 + i * rx * 0.24 + 4)} ${by - ry * 1.45 - (i % 2) * 4} L${X(-rx * 0.7 + (i + 1) * rx * 0.24)} ${by - ry * 0.8}`; sp2 += ` L${X(rx * 0.4)} ${by + ry * 0.1} L${X(-rx * 0.6)} ${by + ry * 0.1}Z`; o += shp(sp2, ed('#6b7888'), { w: 0.8 }); }
  o += shp(F(ell(0, by, rx, ry)), base, { ...sp, so: 6 });
  if (enemy) { for (let i = 0; i < 3; i++) { const x = rx * (0.28 - i * 0.28); o += `<path d="${F(`M${x} ${by - ry * 0.55} Q${x + 5} ${by} ${x} ${by + ry * 0.55}`)}" fill="none" stroke="#3b4553" stroke-width="2" stroke-linecap="round" opacity=".85"/>`; } o += vein(F(`M${-rx * 0.4} ${by - ry * 0.8} L${-rx * 0.2} ${by - ry * 0.2} L${-rx * 0.5} ${by + ry * 0.5} M${-rx * 0.2} ${by - ry * 0.2} L${rx * 0.1} ${by + ry * 0.1}`), 1.6); }
  else o += shp(F(`M${rx * 0.5} ${by - ry * 0.7} L${rx * 0.58} ${by - ry * 1.35} L${rx * 0.3} ${by - ry * 0.95} L${rx * 0.28} ${by - ry * 1.5} L${rx * 0.05} ${by - ry * 0.9}Z`), '#fff0c4', { w: 0.6, ...sp });
  o += shp(F(cap(rx * 0.55, by - ry * 0.2, hx, hy, ry * 0.8, ry * 0.62)), base, { ...sp });
  o += shp(F(`M${hx - hr * 0.55} ${hy - hr * 0.55} L${hx - hr * 0.3} ${hy - hr * 0.55 - ear} L${hx + hr * 0.25} ${hy - hr * 0.85}Z`), dark2, { w: 0.7, ...sp });
  o += shp(F(circ(hx, hy, hr)), base, { ...sp });
  o += shp(F(ell(hx + hr * 0.85, hy + hr * 0.3, hr * (enemy ? 0.95 : 0.78), hr * (enemy ? 0.38 : 0.42))), enemy ? ed('#a3aebb') : '#fff0c8', { w: 0.8, ...sp });
  o += shp(F(`M${hx - hr * 0.1} ${hy - hr * 0.75} L${hx + hr * 0.3} ${hy - hr * 0.75 - ear} L${hx + hr * 0.7} ${hy - hr * 0.55}Z`), base, { w: 0.7, ...sp });
  if (enemy) { o += `<path d="${F(`M${hx + hr * 0.5} ${hy + hr * 0.42} L${hx + hr * 1.7} ${hy + hr * 0.42}`)}" stroke="#1c1424" stroke-width="3" stroke-linecap="round"/>` + `<path d="${F(`M${hx + hr * 0.9} ${hy + hr * 0.45} l${hr * 0.18} ${hr * 0.4} l${hr * 0.16} -${hr * 0.4}M${hx + hr * 1.35} ${hy + hr * 0.45} l${hr * 0.16} ${hr * 0.38} l${hr * 0.14} -${hr * 0.38}`)}" fill="#f4f1ea" stroke="#1c1424" stroke-width="1"/>`; o += epoint(X(hx + hr * 0.34), hy - hr * 0.12, 2.6); }
  else o += eyeG(X(hx + hr * 0.36), hy - hr * 0.1, hr * 0.17, hr * 0.2, { c: '#7a3a12', c2: '#e98a3a' });
  o += `<circle cx="${X(hx + hr * 1.62)}" cy="${hy + hr * 0.2}" r="${hr * 0.16}" fill="#3a2418"/>`;
  return o;
}
// ---------- RAVEN (faces left) ----------
export function raven() {
  const s = S, P = s.P, p = { P1: { rx: 17, ry: 13, wing: 48, tail: 24, hr: 10.5 }, P2: { rx: 19, ry: 9.5, wing: 62, tail: 32, hr: 8.5 }, P3: { rx: 19, ry: 7.5, wing: 74, tail: 44, hr: 7.5 } }[P];
  const { rx, ry, wing: L, tail, hr } = p, body = '#6a52b4', wc = '#8268d0', hx = -rx * 0.95, hy = -ry * 0.55, sp = { spirit: true, rim: '#ffd6ec' };
  const wp = (k) => `M0 0 C${L * 0.1 * k} ${-L * 0.5} ${L * 0.55 * k} ${-L * 0.85} ${L * k} ${-L * 0.8} L${L * 0.86 * k} ${-L * 0.62} L${L * 0.98 * k} ${-L * 0.5} L${L * 0.78 * k} ${-L * 0.38} L${L * 0.86 * k} ${-L * 0.22} L${L * 0.6 * k} ${-L * 0.15} C${L * 0.4 * k} ${-L * 0.08} ${L * 0.2 * k} ${L * 0.08} 0 ${L * 0.12}Z`;
  const tip = (k) => `M${L * 0.8 * k} ${-L * 0.8} L${L * k} ${-L * 0.8} L${L * 0.86 * k} ${-L * 0.62} L${L * 0.98 * k} ${-L * 0.5} L${L * 0.78 * k} ${-L * 0.38} L${L * 0.72 * k} ${-L * 0.6}Z`;
  let o = '';
  o += `<g transform="translate(${-rx * 0.2},${-ry * 0.5}) scale(-.85,.95) rotate(-12)">${shp(wp(1), '#5a44a0', { w: 0.9, ...sp })}</g>`;
  o += shp(`M${rx * 0.6} ${-ry * 0.3} L${rx + tail} ${-ry * 0.9} L${rx + tail * 0.9} ${-ry * 0.1} L${rx + tail} ${ry * 0.5} L${rx + tail * 0.8} ${ry * 0.95} L${rx * 0.5} ${ry * 0.6}Z`, '#5a44a0', { w: 0.9, ...sp });
  o += shp(ell(0, 0, rx, ry), body, { ...sp, so: 4 });
  o += shp(circ(hx, hy, hr), body, { ...sp, so: 3 });
  o += shp(`M${hx - hr * 0.7} ${hy - 1} L${hx - hr * 1.95} ${hy + hr * 0.3} L${hx - hr * 0.6} ${hy + hr * 0.62}Z`, '#ffb54a', { w: 0.7, rim: '#fff0b0' });
  o += eyeG(hx - hr * 0.15, hy - hr * 0.15, hr * 0.26, hr * 0.3, { c: '#2a1840', c2: '#8a5ad0' });
  o += `<g transform="translate(${rx * 0.05},${-ry * 0.55}) rotate(8)">${shp(wp(1), wc, { w: 0.9, ...sp })}${shp(tip(1), '#fff1dc', { w: 0.6, so: 2 })}</g>`;
  return o;
}
// ---------- ROOT CRAWLER ----------
export function crawler() {
  const s = S, P = s.P, p = { P1: { w: 42, h: 30, ll: 30, lift: 4 }, P2: { w: 38, h: 30, ll: 40, lift: 12 }, P3: { w: 30, h: 28, ll: 54, lift: 26 } }[P];
  const { w, h, ll, lift } = p, y0 = -lift; let o = `<ellipse cx="0" cy="0" rx="${w * 1.4}" ry="7" fill="#000" opacity=".3" filter="url(#b4)"/>`;
  const legsD = [[-1, 0.55, 0.9], [-1, 0.25, 1.1], [-1, -0.05, 0.9], [1, 0.55, 0.9], [1, 0.25, 1.1], [1, -0.05, 0.9]];
  for (const [sx, k, m] of legsD) { const x0 = sx * w * (0.55 + k * 0.4), yy = y0 - h * (0.25 + k * 0.1); o += stk(`M${x0} ${yy} Q${sx * (w + ll * m * 0.55)} ${yy - ll * 0.55} ${sx * (w + ll * m * (0.7 + k * 0.3))} ${-2 - k * 3}`, mix('#5d6a79', '#14101e', s.ed || 0), 4.6); }
  for (const sx of [-1, 1]) o += shp(`M${sx * w * 0.55} ${y0 - h * 1.35} L${sx * w * 0.8} ${y0 - h * 2.0} L${sx * w * 0.25} ${y0 - h * 1.6}Z`, '#58606d', { w: 0.8 });
  const d = `M${-w} ${y0 - h * 0.2} C${-w} ${y0 - h * 1.4} ${-w * 0.3} ${y0 - h * 1.75} ${w * 0.1} ${y0 - h * 1.75} C${w * 0.7} ${y0 - h * 1.75} ${w} ${y0 - h * 1.2} ${w} ${y0 - h * 0.2} Q0 ${y0 + h * 0.3} ${-w} ${y0 - h * 0.2}Z`;
  o += shp(d, mix('#8794a4', '#14101e', s.ed || 0), { so: 7 });
  o += vein(`M${-w * 0.7} ${y0 - h * 1.2} L${-w * 0.3} ${y0 - h * 0.9} L${-w * 0.5} ${y0 - h * 0.5} M${w * 0.5} ${y0 - h * 1.35} L${w * 0.7} ${y0 - h * 0.9} L${w * 0.45} ${y0 - h * 0.55}`, 1.8);
  o += `<ellipse cx="${w * 0.15}" cy="${y0 - h * 0.55}" rx="${w * 0.55}" ry="${h * 0.32}" fill="#16101c"/>`;
  o += `<path d="M${-w * 0.25} ${y0 - h * 0.74} l${w * 0.1} ${h * 0.26} l${w * 0.1} -${h * 0.26}M${w * 0.1} ${y0 - h * 0.78} l${w * 0.1} ${h * 0.28} l${w * 0.1} -${h * 0.28}M${w * 0.42} ${y0 - h * 0.72} l${w * 0.09} ${h * 0.24} l${w * 0.09} -${h * 0.24}" fill="#e9e6df" stroke="#16101c" stroke-width="1"/>`;
  for (const [ex, ey] of [[-0.3, -1.25], [0.05, -1.4], [0.4, -1.25]]) o += epoint(w * ex, y0 + h * ey, 2.4);
  return o;
}
// ---------- GEM ----------
export function gem() {
  const d = 'M0 -30 L16 -22 L18 -8 L0 8 L-18 -8 L-16 -22Z';
  return glow(0, -14, 40, 40, '#ffc35c', 0.9) + shp(d, '#ffb347', { so: 5, w: 0.9, x: `<path d="M0 -30 L16 -22 L0 -16 L-16 -22Z" fill="#fff0b8" opacity=".85"/><path d="M-16 -22 L0 -16 L-18 -8Z" fill="#ffd36b" opacity=".6"/><path d="M16 -22 L18 -8 L0 -16Z" fill="#e8892c" opacity=".55"/><path d="M0 -16 L18 -8 L0 8 L-18 -8Z" fill="#e8892c" opacity=".35"/>` });
}
export const addDef = (s) => { D.push(s); };
