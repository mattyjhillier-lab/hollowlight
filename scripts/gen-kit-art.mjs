// U2b: bakes the Lantern Glass, Lit art (hand-wobbled 9-slice frames, leadlight border, painted icons, cap, seal, flag, wick) into src/ui/kit.css
// between the ART markers, as inline SVG data-URI custom properties (--lg-a-*). Deterministic (seeded): same output every run. No raster, no network.
// Run: node scripts/gen-kit-art.mjs   (writes src/ui/kit.css; commit the result)
import { readFileSync, writeFileSync } from 'node:fs';
const FILE = new URL('../src/ui/kit.css', import.meta.url);
const R = (v) => Math.round(v * 10) / 10;
const BR = '#3a2412'; // tinted outline (a darker shade of the brass), never black
function rng(seed) { let a = seed >>> 0; return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

// ---- rounded rect with elliptical corners, as points with outward normals, clockwise ----
function outline(x, y, w, h, c, step = 14) {
  const pts = [];
  const arc = (cx, cy, rx, ry, a0, a1) => {
    const n = Math.max(4, Math.ceil((Math.max(rx, ry) * Math.PI) / 2 / step));
    for (let i = 0; i <= n; i++) { const a = a0 + ((a1 - a0) * i) / n; let nx = Math.cos(a) / rx, ny = Math.sin(a) / ry; const m = Math.hypot(nx, ny); pts.push({ x: cx + rx * Math.cos(a), y: cy + ry * Math.sin(a), nx: nx / m, ny: ny / m }); }
  };
  const edge = (x0, y0, x1, y1, nx, ny) => { const L = Math.hypot(x1 - x0, y1 - y0); const n = Math.max(1, Math.round(L / (step * 2))); for (let i = 1; i < n; i++) pts.push({ x: x0 + ((x1 - x0) * i) / n, y: y0 + ((y1 - y0) * i) / n, nx, ny }); };
  const { tl, tr, br, bl } = c; const P = Math.PI;
  arc(x + tl[0], y + tl[1], tl[0], tl[1], P, 1.5 * P);
  edge(x + tl[0], y, x + w - tr[0], y, 0, -1);
  arc(x + w - tr[0], y + tr[1], tr[0], tr[1], 1.5 * P, 2 * P);
  edge(x + w, y + tr[1], x + w, y + h - br[1], 1, 0);
  arc(x + w - br[0], y + h - br[1], br[0], br[1], 0, 0.5 * P);
  edge(x + w - br[0], y + h, x + bl[0], y + h, 0, 1);
  arc(x + bl[0], y + h - bl[1], bl[0], bl[1], 0.5 * P, P);
  edge(x, y + h - bl[1], x, y + tl[1], -1, 0);
  return pts;
}
function wobble(pts, amp, seed) {
  const r = rng(seed); const p1 = r() * 6.28, p2 = r() * 6.28, p3 = r() * 6.28; let s = 0;
  return pts.map((p, i) => { if (i) s += Math.hypot(p.x - pts[i - 1].x, p.y - pts[i - 1].y); const o = amp * (0.55 * Math.sin(s / 19 + p1) + 0.3 * Math.sin(s / 8.1 + p2) + 0.15 * Math.sin(s / 3.7 + p3)); return { ...p, x: p.x + p.nx * o, y: p.y + p.ny * o }; });
}
function spline(pts) { // closed Catmull-Rom -> cubic bezier
  const n = pts.length; const g = (i) => pts[(i + n) % n]; let d = `M${R(g(0).x)} ${R(g(0).y)}`;
  for (let i = 0; i < n; i++) { const a = g(i - 1), b = g(i), c = g(i + 1), e = g(i + 2); d += `C${R(b.x + (c.x - a.x) / 6)} ${R(b.y + (c.y - a.y) / 6)} ${R(c.x - (e.x - b.x) / 6)} ${R(c.y - (e.y - b.y) / 6)} ${R(c.x)} ${R(c.y)}`; }
  return d + 'Z';
}
const shrink = (c, d) => Object.fromEntries(Object.entries(c).map(([k, v]) => [k, [Math.max(2, v[0] - d), Math.max(2, v[1] - d)]]));

const uri = (svg) => `url("data:image/svg+xml,${svg.replace(/\s*\n\s*/g, '').replace(/%/g, '%25').replace(/#/g, '%23').replace(/</g, '%3C').replace(/>/g, '%3E').replace(/"/g, "'")}")`;
const svgDoc = (vb, inner, extra = '') => { const [,, w, h] = vb.split(' '); return `<svg xmlns='http://www.w3.org/2000/svg' viewBox='${vb}' width='${w}' height='${h}'${extra}>${inner}</svg>`; };

// ---- brass band 9-slice: dark tinted outline, brass gradient, bright rim on the top edge, hand-wobbled ----
function bandArt({ CW, CH, c, st, sb, b, amp = 0.7, seed }) {
  const sw = b + 3.2, d = sw / 2 + 0.4;
  const path = spline(wobble(outline(d, d, CW - 2 * d, CH - 2 * d, shrink(c, d)), amp, seed));
  const defs = `<linearGradient id='g' gradientUnits='userSpaceOnUse' x1='0' y1='0' x2='0' y2='${CH}'><stop offset='0' stop-color='#fff3cc'/><stop offset='${R(st / CH)}' stop-color='#e8bf6c'/><stop offset='${R((CH - sb) / CH)}' stop-color='#b07c35'/><stop offset='1' stop-color='#6e4a1f'/></linearGradient>` +
    `<linearGradient id='r' gradientUnits='userSpaceOnUse' x1='0' y1='0' x2='0' y2='${R(st * 1.5)}'><stop offset='0' stop-color='#fffbe8' stop-opacity='.95'/><stop offset='1' stop-color='#fffbe8' stop-opacity='0'/></linearGradient><path id='p' d='${path}' fill='none'/>`;
  return svgDoc(`0 0 ${CW} ${CH}`, `<defs>${defs}</defs><use href='#p' stroke='${BR}' stroke-width='${R(sw)}'/><use href='#p' stroke='url(#g)' stroke-width='${b}'/><use href='#p' stroke='url(#r)' stroke-width='1.3' transform='translate(0 ${R(-b / 2 + 0.9)})'/>`);
}

// ---- leadlight border 9-slice: lead came (dark tinted lines) with transparent windows; the colour comes from the element's own background (T2) ----
function leadArt({ CW, CH, c, sl, st, sr, sb, T, seed }) {
  const o = 1.9, i0 = T - 1.9;
  const outer = wobble(outline(o, o, CW - 2 * o, CH - 2 * o, shrink(c, o)), 0.5, seed);
  const inner = wobble(outline(T - 1.8, T - 1.8, CW - 2 * (T - 1.8), CH - 2 * (T - 1.8), shrink(c, T - 1.8)), 0.5, seed + 7);
  let ticks = '';
  const tk = (x0, y0, x1, y1) => { ticks += `M${R(x0)} ${R(y0)}L${R(x1)} ${R(y1)}`; };
  for (const x of [sl, CW - sr]) { tk(x, 2, x, T - 1); tk(x, CH - T + 1, x, CH - 2); }
  for (const y of [st, CH - sb]) { tk(2, y, T - 1, y); tk(CW - T + 1, y, CW - 2, y); }
  // interior ticks along each corner arc (outer point -> matching inner point by angle)
  const arcTicks = (cx, cy, rx, ry, a0, a1) => {
    const n = Math.max(0, Math.round((Math.PI / 2) * Math.hypot(rx, ry) / 0.707 / 24) - 1);
    for (let k = 1; k <= n; k++) { const a = a0 + ((a1 - a0) * k) / (n + 1); tk(cx + rx * Math.cos(a), cy + ry * Math.sin(a), cx + (rx - T + 3) * Math.cos(a), cy + (ry - T + 3) * Math.sin(a)); }
  };
  const P = Math.PI;
  arcTicks(c.tl[0], c.tl[1], c.tl[0] - 1, c.tl[1] - 1, P, 1.5 * P); arcTicks(CW - c.tr[0], c.tr[1], c.tr[0] - 1, c.tr[1] - 1, 1.5 * P, 2 * P);
  arcTicks(CW - c.br[0], CH - c.br[1], c.br[0] - 1, c.br[1] - 1, 0, 0.5 * P); arcTicks(c.bl[0], CH - c.bl[1], c.bl[0] - 1, c.bl[1] - 1, 0.5 * P, P);
  return svgDoc(`0 0 ${CW} ${CH}`, `<path d='${spline(outer)}' fill='none' stroke='${BR}' stroke-width='3.8'/><path d='${spline(inner)}' fill='none' stroke='${BR}' stroke-width='3.2'/><path d='${ticks}' stroke='${BR}' stroke-width='2.8' stroke-linecap='round'/>` +
    `<path d='${spline(outer)}' fill='none' stroke='#aab2c4' stroke-opacity='.3' stroke-width='1' transform='translate(0 .6)'/>`);
}

// ---- painted icons: tinted outline + fill gradient + rim light crescent (a copy of the shape shifted down-right and clipped to the shape) ----
function shape(vb, dPath, c1, c2, { id = 's' } = {}) {
  return svgDoc(vb, `<defs><path id='${id}' d='${dPath}'/><clipPath id='c'><use href='#${id}'/></clipPath><linearGradient id='f' x2='0' y2='1'><stop offset='0' stop-color='${c1}'/><stop offset='1' stop-color='${c2}'/></linearGradient></defs>` +
    `<use href='#${id}' fill='${BR}' stroke='${BR}' stroke-width='3.2' stroke-linejoin='round'/><g clip-path='url(#c)'><use href='#${id}' fill='#fff8dc'/><use href='#${id}' fill='url(#f)' transform='translate(1.1 1.5)'/></g>`);
}
function lineIcon(vb, dPath, color) {
  return svgDoc(vb, `<path d='${dPath}' fill='none' stroke='${BR}' stroke-width='5.4' stroke-linecap='round' stroke-linejoin='round'/><path d='${dPath}' fill='none' stroke='${color}' stroke-width='2.8' stroke-linecap='round' stroke-linejoin='round'/><path d='${dPath}' fill='none' stroke='#fffbe8' stroke-opacity='.6' stroke-width='1' stroke-linecap='round' stroke-linejoin='round' transform='translate(-.5 -.7)'/>`);
}
const FLAME = 'M10 1C15 8 18 12 17 17C16 22 13 25 10 25C7 25 4 22 3 17C2 12 6 9 8 5C9 9 10 10 11 10C12 7 11 4 10 1Z';
const flameIcon = (lit) => svgDoc('0 0 20 26', `<defs><radialGradient id='h' cx='.5' cy='.62' r='.6'><stop offset='0' stop-color='#ffab3a' stop-opacity='${lit ? '.5' : '0'}'/><stop offset='1' stop-color='#ffab3a' stop-opacity='0'/></radialGradient></defs><path id='s' d='${FLAME}' fill='${lit ? '#ffab3a' : '#5a4636'}' stroke='${lit ? '#7a3510' : '#2a1d14'}' stroke-width='1.9' stroke-linejoin='round'/>` +
  (lit ? `<path d='M10 13C13 16 13 20 10 22C7 20 7 16 10 13Z' fill='#fff4d0'/><path d='M5.5 14C5.6 11 7 8.5 8.2 7' stroke='#fffbe8' stroke-opacity='.7' stroke-width='1.3' fill='none' stroke-linecap='round'/>` : `<path d='M5.5 15C5.6 12 7 10 8.2 8.5' stroke='#9aa4b8' stroke-opacity='.5' stroke-width='1.2' fill='none' stroke-linecap='round'/>`));

const CAP = svgDoc('0 0 74 46', `<defs><linearGradient id='cb' x1='0' y1='0' x2='0' y2='1'><stop offset='0' stop-color='#fff0c4'/><stop offset='.5' stop-color='#d9ab5c'/><stop offset='1' stop-color='#8a5d27'/></linearGradient><radialGradient id='cw'><stop offset='0' stop-color='#fff2c8'/><stop offset='1' stop-color='#ff9a2e'/></radialGradient></defs>` +
  `<circle cx='37' cy='9' r='6' fill='none' stroke='${BR}' stroke-width='6'/><circle cx='37' cy='9' r='6' fill='none' stroke='url(#cb)' stroke-width='2.6'/>` +
  `<path d='M10 40Q37 4 64 40Z' fill='url(#cb)' stroke='${BR}' stroke-width='3' stroke-linejoin='round'/><rect x='29' y='27' width='16' height='11' rx='5' fill='url(#cw)' stroke='${BR}' stroke-width='2'/><path d='M18 30Q37 12 56 30' stroke='#fff' stroke-opacity='.55' stroke-width='2' fill='none'/>`);
const SEAL = svgDoc('0 0 44 44', `<defs><radialGradient id='sg' cx='.35' cy='.3'><stop offset='0' stop-color='#fff2b8'/><stop offset='.55' stop-color='#ffcf5a'/><stop offset='1' stop-color='#b47c1e'/></radialGradient></defs>` +
  `<path d='M22 2C27 4 30 2 33 6C36 9 41 10 40 15C39 19 43 23 40 27C37 31 39 36 34 38C30 40 27 43 22 41C17 43 13 40 10 38C5 36 6 31 4 27C1 23 5 19 4 15C3 10 8 9 11 6C14 2 17 4 22 2Z' fill='url(#sg)' stroke='#6b4512' stroke-width='2.2'/>` +
  `<circle cx='22' cy='22' r='11' fill='none' stroke='#a8741e' stroke-width='1.6'/><path d='M22 13L24.6 19.5L31 20L26 24.2L27.6 31L22 27.3L16.4 31L18 24.2L13 20L19.4 19.5Z' fill='#8a5d18'/><path d='M10 13Q14 6 21 5' stroke='#fff' stroke-opacity='.7' stroke-width='2' fill='none' stroke-linecap='round'/>`);
const FLAG = svgDoc('0 0 64 30', `<path d='M2 3H62L54 15L62 27H2Z' fill='#6fd3c5' stroke='#1f5a52' stroke-width='2.4' stroke-linejoin='round' vector-effect='non-scaling-stroke'/><path d='M5 6H52' stroke='#fff' stroke-opacity='.55' stroke-width='2' vector-effect='non-scaling-stroke'/>`, " preserveAspectRatio='none'");
const wick = (s) => svgDoc('0 0 22 30', `<defs><radialGradient id='w'><stop offset='0' stop-color='#ffab3a' stop-opacity='.55'/><stop offset='1' stop-color='#ffab3a' stop-opacity='0'/></radialGradient></defs>` +
  (s === 'lit' ? `<circle cx='11' cy='11' r='11' fill='url(#w)'/><path d='M11 1C16 7 18 11 17 15C16 19 13 21 11 21C9 21 6 19 5 15C4 11 7 7 11 1Z' fill='#ffab3a' stroke='#7a3510' stroke-width='1.7'/><path d='M11 10C13 12 13 15 11 17C9 15 9 12 11 10Z' fill='#fff4d0'/>`
    : s === 'ember' ? `<circle cx='11' cy='19' r='6' fill='url(#w)'/><circle cx='11' cy='19' r='2.6' fill='#ff8a3a' stroke='#6b2a0c' stroke-width='1.2'/>`
      : `<path d='M11 13C13 15 12 18 11 20' stroke='#4a3a2e' stroke-width='2' fill='none' stroke-linecap='round'/>`) + `<rect x='9.6' y='20' width='2.8' height='8' rx='1' fill='#2a1d14' stroke='${BR}' stroke-width='.8'/>`);

const A = {
  panel: bandArt({ CW: 96, CH: 96, c: { tl: [26, 26], tr: [26, 26], br: [26, 26], bl: [26, 26] }, st: 26, sb: 26, b: 6, seed: 11 }),
  pill: bandArt({ CW: 84, CH: 66, c: { tl: [22, 22], tr: [22, 22], br: [22, 22], bl: [22, 22] }, st: 22, sb: 22, b: 4, amp: 0.55, seed: 5 }),
  arch: bandArt({ CW: 220, CH: 160, c: { tl: [90, 70], tr: [90, 70], br: [24, 24], bl: [24, 24] }, st: 70, sb: 24, b: 6, seed: 23 }),
  lead: leadArt({ CW: 96, CH: 96, c: { tl: [26, 26], tr: [26, 26], br: [26, 26], bl: [26, 26] }, sl: 36, st: 36, sr: 36, sb: 36, T: 16, seed: 3 }),
  leadarch: leadArt({ CW: 204, CH: 134, c: { tl: [90, 70], tr: [90, 70], br: [24, 24], bl: [24, 24] }, sl: 90, st: 70, sr: 90, sb: 36, T: 16, seed: 9 }),
  cap: CAP, seal: SEAL, flag: FLAG, flame: flameIcon(1), ember: flameIcon(0),
  wickLit: wick('lit'), wickEmber: wick('ember'), wickDark: wick('dark'),
  star: shape('0 0 24 24', 'M12 2.5l2.6 5.2 5.8.8-4.2 4 1 5.7L12 15.5l-5.2 2.7 1-5.7-4.2-4 5.8-.8z', '#ffe9a0', '#e0a030'),
  bolt: shape('0 0 24 24', 'M13.5 2L5 13.5H11L10 22L19 10H13Z', '#bff4ec', '#4fb3a4'),
  shard: shape('0 0 24 24', 'M12 2L19 10L12 22L5 10Z', '#d8c4ff', '#8a5cff'),
  lock: shape('0 0 24 24', 'M6 11h12v10H6z', '#c9d2e4', '#7a869e') .replace("</svg>", `<path d='M8.5 11V8a3.5 3.5 0 0 1 7 0v3' fill='none' stroke='${BR}' stroke-width='5' stroke-linecap='round'/><path d='M8.5 11V8a3.5 3.5 0 0 1 7 0v3' fill='none' stroke='#c9d2e4' stroke-width='2.4' stroke-linecap='round'/></svg>`),
  check: lineIcon('0 0 24 24', 'M5 12.5l4.5 4.5L19 7', '#9fe9dd'),
  enter: lineIcon('0 0 24 24', 'M19 5v7H6M6 12l4.5-4.5M6 12l4.5 4.5', '#ffe0a0'),
};
const NAMES = { panel: 'panel', pill: 'pill', arch: 'arch', lead: 'lead', leadarch: 'leadarch', cap: 'cap', seal: 'seal', flag: 'flag', flame: 'flame', ember: 'ember', wickLit: 'wick-lit', wickEmber: 'wick-ember', wickDark: 'wick-dark', star: 'star', bolt: 'bolt', shard: 'shard', lock: 'lock', check: 'check', enter: 'enter' };
let block = ':root {\n';
for (const [k, v] of Object.entries(A)) block += `  --lg-a-${NAMES[k]}: ${uri(v)};\n`;
block += '}\n';
const css = readFileSync(FILE, 'utf8');
const BEGIN = '/* ART:BEGIN (generated by scripts/gen-kit-art.mjs, do not edit by hand) */', END = '/* ART:END */';
const i = css.indexOf(BEGIN), j = css.indexOf(END);
if (i < 0 || j < 0) throw new Error('ART markers missing in kit.css');
writeFileSync(FILE, css.slice(0, i) + BEGIN + '\n' + block + css.slice(j));
console.log('art block bytes', block.length, Object.fromEntries(Object.entries(A).map(([k, v]) => [k, uri(v).length])));
