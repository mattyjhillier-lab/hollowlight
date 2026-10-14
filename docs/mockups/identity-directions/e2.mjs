// E2 COMIC CEL
import { rnd, T, CR, ICON, layout } from './lib2.mjs';
export const K = { ol: '#0c0a14', cy: '#26e6ff', mag: '#ff2e63', gold: '#ffc400', ind: '#2b2152', gnd: '#34286a', white: '#ffffff' };
const P0 = { cy: K.cy, red: K.mag, plate: '#241a52', ol: K.ol, vi: K.cy };
export const HF = "Impact,'Arial Black','Haettenschweiler',sans-serif", BF = "'Segoe UI',Arial,sans-serif";
const COL = {
  wren: { f: '#6a55d8', s: '#3b2c94', a: K.cy }, elias: { f: '#f1edff', s: '#a79de2', a: '#7ff0ff' },
  wolf: { f: K.cy, s: '#0aa0c4', a: '#a8f7ff' }, raven: { f: '#b6f6ff', s: '#4fbcd8', a: K.cy },
  ewolf: { f: K.mag, s: '#a30f3e', a: '#fff' }, crow: { f: '#d91f55', s: '#860c32', a: '#fff' },
  crawler: { f: '#ff5c86', s: '#b21547', a: '#fff' }, treant: { f: '#4a1d5e', s: '#2b0f3a', a: K.mag },
};
const RAR = { common: '#d4d2e6', rare: K.cy, epic: K.mag, evolve: K.gold };
const defs = `<defs>
<pattern id="ht" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><circle cx="4.5" cy="4.5" r="1.9" fill="#0c0a14" opacity=".55"/></pattern>
<pattern id="htc" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><circle cx="4" cy="4" r="1.7" fill="#26e6ff"/></pattern>
<pattern id="htw" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><circle cx="4" cy="4" r="1.5" fill="#fff" opacity=".18"/></pattern>
<linearGradient id="vg" x1="0" y1="0" x2="0" y2="1"><stop offset=".55" stop-color="#fff"/><stop offset="1" stop-color="#000"/></linearGradient>
<mask id="vm"><rect width="1280" height="604" fill="url(#vg)"/></mask>
</defs>`;
const OL = K.ol;
const scallop = (cx, cy, r, n, seed) => { const rr = rnd(seed); const pts = []; for (let i = 0; i < n; i++) { const a = (i / n) * 6.283; pts.push([cx + Math.cos(a) * r * (0.92 + rr() * 0.16), cy + Math.sin(a) * r * 0.78 * (0.92 + rr() * 0.16)]); } const ch = r * 0.5; let d = `M${pts[0][0].toFixed(0)} ${pts[0][1].toFixed(0)}`; for (let i = 1; i <= n; i++) { const p = pts[i % n]; d += `A${ch.toFixed(0)} ${ch.toFixed(0)} 0 0 1 ${p[0].toFixed(0)} ${p[1].toFixed(0)}`; } return d + 'Z'; };
function tree(x, y, s, seed) {
  const r = rnd(seed), h = 150 + r() * 50, w = 22;
  const t = `M${-w - 18} 8 C${-w} -6 ${-w + 2} -50 ${-w + 6} ${-h} L${w - 6} ${-h} C${w - 2} -50 ${w} -6 ${w + 18} 8Z`;
  return `<g transform="translate(${x} ${y}) scale(${s})" stroke="${OL}" stroke-width="${5 / s}" stroke-linejoin="round"><path d="${t}" fill="#1c1448"/><path d="M${w} -${h - 10} C${w + 2} -50 ${w} -6 ${w + 18} 8 L4 8 C8 -50 10 -100 6 -${h - 10}Z" fill="#120d30" stroke="none"/><path d="${t}" fill="none"/>
<path d="${scallop(0, -h - 20, 92, 9, seed)}" fill="#2a2062"/><path d="${scallop(-6, -h - 34, 66, 7, seed + 2)}" fill="#3a2e86" stroke="none"/><path d="${scallop(0, -h - 20, 92, 9, seed)}" fill="url(#ht)" stroke="none" clip-path="url(#cl${seed})"/><clipPath id="cl${seed}"><rect x="20" y="${-h - 120}" width="100" height="160"/></clipPath></g>`;
}
export function bg(mode) {
  const r = rnd(8); let o = defs + `<rect width="1280" height="604" fill="${K.gnd}"/>`;
  o += `<g mask="url(#vm)"><rect width="1280" height="604" fill="url(#ht)" opacity=".9"/></g>`;
  o += `<g stroke="${OL}" stroke-width="5"><ellipse cx="660" cy="372" rx="400" ry="215" fill="#41338a"/><ellipse cx="660" cy="372" rx="250" ry="132" fill="#4d3da2"/></g>`;
  for (let i = 0; i < 14; i++) { const x = 40 + r() * 1200, y = 160 + r() * 420; o += `<path d="M${x} ${y} l-7 -16 l7 5 l5 -17 l5 17 l7 -5Z" fill="#241a52" stroke="${OL}" stroke-width="3" stroke-linejoin="round"/>`; }
  [[60, 330, 1.25], [190, 190, .85], [400, 150, .72], [560, 130, .7], [820, 120, .7], [1010, 150, .8], [1210, 330, 1.2], [110, 590, 1.3], [350, 610, 1.05], [940, 610, 1.1], [1210, 590, 1.35], [230, 330, .8]]
    .sort((a, b) => a[1] - b[1]).forEach(([x, y, s], i) => { o += tree(x, y + 60, s, 20 + i); });
  if (mode !== 'play') o += `<rect width="1280" height="604" fill="#0c0a14" opacity="${mode === 'dim' ? .66 : .5}"/>`;
  return o;
}
export function cr(id, x, y, s, f = 1) {
  const c = CR[id], k = COL[id], sum = c.kind === 'summon', foe = c.kind === 'enemy' || c.kind === 'boss', lw = c.kind === 'boss' ? 7 : 5;
  const cid = 'sc' + id;
  let g = `<g transform="translate(${x} ${y}) scale(${s * f} ${s})" stroke-linejoin="round" stroke-linecap="round"><clipPath id="${cid}"><rect x="-300" y="${-c.h * .4}" width="600" height="300"/></clipPath>`;
  if (id !== 'raven' && id !== 'crow') g += `<ellipse cx="0" cy="3" rx="${c.w * .4}" ry="7" fill="${OL}" opacity=".55"/>`;
  for (const e of c.extras) {
    if (e.r === 'soft') g += `<path d="${e.d}" fill="${k.a}" stroke="${OL}" stroke-width="${lw}"/>`;
    else if (e.r === 'acc') g += `<path d="${e.d}" fill="${k.a}" stroke="${OL}" stroke-width="${lw}"/>`;
    else if (e.r === 'wing') g += `<path d="${e.d}" fill="${k.s}" stroke="${OL}" stroke-width="${lw}"/>`;
  }
  if (c.rings) c.rings.forEach(([cx, cy, rx, ry]) => { g += `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="none" stroke="${OL}" stroke-width="${lw + 5}"/><ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="none" stroke="${k.a}" stroke-width="3.4"/>`; });
  g += `<path d="${c.body}" fill="${k.f}"/><path d="${c.body}" fill="${k.s}" clip-path="url(#${cid})"/><g clip-path="url(#${cid})"><path d="${c.body}" fill="url(#ht)"/></g>`;
  if (sum) { const [cx, cy, kk] = c.core; g += `<path d="${c.body}" fill="#fff" opacity=".85" transform="translate(${cx} ${cy - 6}) scale(${kk * .75}) translate(${-cx} ${-cy})"/>`; }
  g += `<path d="${c.body}" fill="none" stroke="${OL}" stroke-width="${lw}"/>`;
  for (const e of c.extras) if (e.r === 'face') g += `<path d="${e.d}" fill="#ffe9d6" stroke="${OL}" stroke-width="${lw}"/>`;
  if (c.voidD) g += `<path d="${c.voidD}" fill="${OL}"/>`;
  for (const [d, role] of c.lines) g += role === 'staff' ? `<path d="${d}" stroke="${OL}" stroke-width="9" fill="none"/><path d="${d}" stroke="#d9d0ff" stroke-width="3.6" fill="none"/>` : `<path d="${d}" stroke="${role === 'fang' ? '#fff' : OL}" stroke-width="3" fill="none"/>`;
  for (const [ex, ey, er] of c.eyes) g += foe ? `<ellipse cx="${ex}" cy="${ey}" rx="${er * 1.5}" ry="${er * 1.2}" fill="#fff" stroke="${OL}" stroke-width="2.4"/><circle cx="${ex + er * .4}" cy="${ey}" r="${er * .6}" fill="${OL}"/>` : `<circle cx="${ex}" cy="${ey}" r="${er}" fill="${sum ? OL : K.cy}"/>`;
  if (c.orbs) c.orbs.forEach(([ox, oy, orr]) => { g += `<circle cx="${ox}" cy="${oy}" r="${orr + 2.5}" fill="${OL}"/><circle cx="${ox}" cy="${oy}" r="${orr}" fill="${k.a}"/><circle cx="${ox - orr * .3}" cy="${oy - orr * .3}" r="${orr * .38}" fill="#fff"/>`; });
  return g + '</g>';
}
export const gem = (x, y, k) => `<g transform="translate(${x} ${y})" stroke-linejoin="round"><path d="M0 -13 L11 0 L0 13 L-11 0Z" fill="${K.cy}" stroke="${OL}" stroke-width="4.5"/><path d="M0 -13 L11 0 L0 0Z" fill="#0aa0c4"/><path d="M-6 -3 L0 -9 L2 -6Z" fill="#fff"/></g>`;
const star = (cx, cy, r1, r2, n) => Array.from({ length: n * 2 }, (_, i) => { const a = (i / (n * 2)) * 6.283 - 1.57, r = i % 2 ? r2 : r1; return `${(cx + Math.cos(a) * r).toFixed(1)},${(cy + Math.sin(a) * r).toFixed(1)}`; }).join(' ');
export const dmg = (x, y, t, crit) => crit
  ? `<g transform="translate(${x} ${y - 14}) rotate(-8)"><polygon points="${star(5, 5, 74, 46, 9)}" fill="${OL}" transform="translate(6 7)"/><polygon points="${star(0, 0, 74, 46, 9)}" fill="#fff" stroke="${OL}" stroke-width="5" stroke-linejoin="round"/>${T(t, 0, 20, { f: HF, s: 62, c: K.mag, a: 'middle', st: OL, sw: 3 })}</g>`
  : T(t, x, y, { f: HF, s: 28, c: '#fff', a: 'middle', st: OL, sw: 7, tr: `skewX(-8)`, x: ` transform-origin="${x}px ${y}px"` });
export function ico(k, x, y, s) {
  const c = { wolf: K.cy, raven: '#b6f6ff', orb: '#fff', heart: K.mag, gem: K.cy }[k], i = ICON[k];
  return `<g transform="translate(${x} ${y}) scale(${s / 48})" stroke-linejoin="round" stroke-linecap="round"><path d="${i.f}" fill="${c}" stroke="${OL}" stroke-width="5"/>${i.l ? `<path d="${i.l}" fill="none" stroke="${OL}" stroke-width="3.4"/>` : ''}<path d="M12 14 L18 9" stroke="#fff" stroke-width="3" opacity=".9"/></g>`;
}
const chamf = (x, y, w, h, c) => `M${x + c} ${y}H${x + w}V${y + h - c}L${x + w - c} ${y + h}H${x}V${y + c}Z`;
export const plateWith = (x, y, w, h, P, o = {}) => `<path d="${chamf(x + 6, y + 7, w, h, 14)}" fill="${OL}"/><path d="${chamf(x, y, w, h, 14)}" fill="${o.fill || P.plate}" stroke="${o.sel ? K.cy : OL}" stroke-width="${o.sel ? 7 : 5}" stroke-linejoin="round"/>${o.sel ? `<path d="${chamf(x, y, w, h, 14)}" fill="none" stroke="${OL}" stroke-width="2" transform="translate(0 0)"/>` : ''}<path d="M${x + 16} ${y + 6}H${x + w - 6}" stroke="#fff" stroke-opacity=".16" stroke-width="3"/>`;
export const panel = (x, y, w, h, o = {}) => plateWith(x, y, w, h, P0, o) + (o.sel ? `<g opacity=".5"><path d="${chamf(x + 8, y + h * .5, w - 16, h * .5 - 8, 10)}" fill="url(#htc)" opacity=".3"/></g>` : '');
export const label = (s, x, y, sz, a, sel, small) => small ? T(s, x, y, { f: BF, s: sz, w: 700, c: '#cdbff5', a }) : T(s.toUpperCase(), x, y, { f: HF, s: sz * 1.12, c: sel ? '#fff' : '#d4d2e6', a, st: OL, sw: 6, ls: 1 });
export const btnWith = (x, y, w, h, t, kind, P) => plateWith(x, y, w, h, P, { fill: kind === 'primary' ? P.cy : P.plate }) + T(t, x + w / 2 + 2, y + h / 2 + h * .17, { f: HF, s: h * .52, c: kind === 'primary' ? OL : '#fff', a: 'middle', ls: 2, st: kind === 'primary' ? undefined : OL, sw: 5 });
export const btn = (x, y, w, h, t, kind) => btnWith(x, y, w, h, t, kind, P0);
export function barWith(x, y, w, h, p, kind, P) {
  const c = kind === 'hp' ? P.red : P.cy, n = Math.round(w / 22);
  let o = `<path d="${chamf(x + 4, y + 5, w, h, 6)}" fill="${OL}"/><path d="${chamf(x, y, w, h, 6)}" fill="#120d30" stroke="${OL}" stroke-width="4"/>`;
  o += `<clipPath id="bc${x}${y}"><path d="${chamf(x + 3, y + 3, (w - 6) * p, h - 6, 4)}"/></clipPath><g clip-path="url(#bc${x}${y})"><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${c}"/><rect x="${x}" y="${y + h * .55}" width="${w}" height="${h}" fill="#000" opacity=".25"/><rect x="${x}" y="${y + 3}" width="${w}" height="${Math.max(2, h * .22)}" fill="#fff" opacity=".5"/>`;
  for (let i = 1; i < n; i++) o += `<rect x="${x + i * (w / n)}" y="${y}" width="3" height="${h}" fill="${OL}"/>`;
  return o + '</g>';
}
export const bar = (x, y, w, h, p, kind) => barWith(x, y, w, h, p, kind, P0);
export const plate = (x, y, w, h) => plateWith(x, y, w, h, P0);
export function logo(cx, cy, s = 1) {
  const sk = 'skewX(-9)';
  return `<g transform="translate(${cx} ${cy}) scale(${s})"><circle cx="0" cy="-10" r="190" fill="url(#htc)" opacity=".25"/>
<g transform="${sk}">${T('HOLLOW<tspan fill="#26e6ff">LIGHT</tspan>', 9, 38, { f: HF, s: 132, c: '#fff', a: 'middle', st: OL, sw: 22, raw: 1, ls: 2 }).replace('stroke="' + OL + '"', 'stroke="' + OL + '" transform="translate(8 9)"')}${T('HOLLOW<tspan fill="#26e6ff">LIGHT</tspan>', 0, 38, { f: HF, s: 132, c: '#fff', a: 'middle', st: OL, sw: 22, raw: 1, ls: 2 })}</g></g>`;
}
export const sub = (s, cx, y) => `<g transform="skewX(-9)"><path d="M${cx - 190} ${y - 28}H${cx + 200}L${cx + 184} ${y + 12}H${cx - 206}Z" fill="${OL}" transform="translate(6 6)"/><path d="M${cx - 190} ${y - 28}H${cx + 200}L${cx + 184} ${y + 12}H${cx - 206}Z" fill="${K.mag}" stroke="${OL}" stroke-width="5" stroke-linejoin="round"/>${T(s, cx - 3, y + 2, { f: HF, s: 30, c: '#fff', a: 'middle', ls: 6, st: OL, sw: 4 })}</g>`;
export const heading = (s, cx, y) => `<g transform="skewX(-8)">${T(s + '!', cx + 5, y + 6, { f: HF, s: 96, c: K.cy, a: 'middle', st: OL, sw: 20, ls: 4 })}${T(s + '!', cx, y, { f: HF, s: 96, c: '#fff', a: 'middle', st: OL, sw: 20, ls: 4 })}</g>`;
export const chip = (r, x, y) => `<path d="${chamf(x + 3, y + 4, 84, 30, 8)}" fill="${OL}"/><path d="${chamf(x, y, 84, 30, 8)}" fill="${RAR[r]}" stroke="${OL}" stroke-width="4"/>` + T(r.toUpperCase(), x + 42, y + 22, { f: HF, s: 18, c: r === 'epic' ? '#fff' : OL, a: 'middle', ls: 1 });
export function card(d) {
  const c = RAR[d.rar], ev = d.rar === 'evolve';
  let o = plateWith(0, 0, 330, 400, P0, { fill: '#1f1649' });
  o += `<path d="${chamf(0, 0, 330, 60, 14)}" fill="${c}" stroke="${OL}" stroke-width="5" stroke-linejoin="round"/>` + T(d.tag, 24, 43, { f: HF, s: 34, c: d.rar === 'epic' ? '#fff' : OL, ls: 3, st: d.rar === 'epic' ? OL : undefined, sw: 4 });
  o += `<circle cx="165" cy="150" r="82" fill="${OL}" transform="translate(5 6)"/><circle cx="165" cy="150" r="82" fill="#33288a" stroke="${OL}" stroke-width="5"/><circle cx="165" cy="150" r="76" fill="url(#htc)" opacity=".35"/>` + ico(d.icon, 105, 90, 120);
  o += T(d.name.toUpperCase(), 165, 288, { f: HF, s: 40, c: '#fff', a: 'middle', st: OL, sw: 9, ls: 1, tr: 'skewX(-8) translate(26 0)' });
  o += T(d.lv.toUpperCase(), 165, 318, { f: HF, s: 18, c: c === '#d4d2e6' ? '#d4d2e6' : c, a: 'middle', ls: 1.5, st: OL, sw: 4 });
  d.desc.forEach((l, i) => { o += T(l, 165, 346 + i * 24, { f: BF, s: 18, w: 700, c: '#d9d0ff', a: 'middle' }); });
  if (ev) o += `<g transform="translate(300 40) rotate(12)"><polygon points="${star(4, 5, 66, 46, 10)}" fill="${OL}"/><polygon points="${star(0, 0, 66, 46, 10)}" fill="${K.gold}" stroke="${OL}" stroke-width="5" stroke-linejoin="round"/>${T('EVOLVE', 0, 9, { f: HF, s: 25, c: OL, a: 'middle' })}</g>`;
  return o;
}
export function hudWith(P) {
  let o = '';
  o += `<path d="M0 0H1280V18H0Z" fill="${OL}"/>` + `<clipPath id="xc"><path d="${chamf(0, 3, 790, 12, 0)}"/></clipPath><rect x="0" y="3" width="790" height="12" fill="${P.cy}"/><rect x="0" y="3" width="790" height="4" fill="#fff" opacity=".5"/>`;
  o += plateWith(20, 30, 330, 56, P) + `<g transform="translate(34 40)">${ico('heart', 0, 0, 34)}</g>` + barWith(80, 46, 258, 26, .72, 'hp', P) + T('86', 326, 67, { f: HF, s: 22, c: '#fff', a: 'end', st: OL, sw: 5 });
  o += `<path d="${chamf(24, 100, 76, 52, 12)}" fill="${OL}" transform="translate(5 5)"/><path d="${chamf(24, 100, 76, 52, 12)}" fill="${P.cy}" stroke="${OL}" stroke-width="5" stroke-linejoin="round"/>` + T('7', 62, 142, { f: HF, s: 46, c: OL, a: 'middle' }) + T('LV', 36, 118, { f: HF, s: 14, c: OL });
  o += plateWith(560, 30, 160, 54, P) + T('07:42', 640, 72, { f: HF, s: 40, c: '#fff', a: 'middle', ls: 2, st: OL, sw: 5 });
  o += plateWith(1120, 30, 140, 50, P) + `<g transform="translate(1132 38)">${ico('gem', 0, 0, 32)}</g>` + T('132', 1244, 69, { f: HF, s: 30, c: '#fff', a: 'end', st: OL, sw: 5 });
  [['wolf', 3], ['raven', 2], ['orb', 1]].forEach(([k, lv], i) => { const x = 22 + i * 74; o += plateWith(x, 508, 60, 60, P) + ico(k, x + 8, 514, 44) + [0, 1, 2].map((j) => `<rect x="${x + 7 + j * 17}" y="576" width="13" height="9" fill="${j < lv ? P.cy : '#120d30'}" stroke="${OL}" stroke-width="3"/>`).join(''); });
  return o;
}
export const hud = () => hudWith(P0);
export const E2 = {
  bg, cr, gem, dmg, ico, panel, label, btn, bar, plate, logo, sub, heading, chip, card, hud, hudWith,
  acc: K.cy, sheetBg: '#1a1240', sheetBg2: '#120d30', txt: '#fff', hf: HF, bf: BF,
  codes: {},
  type: [[HF, 400, 'SPIRITS OF THE DUSK', 28, 'T2 display: Impact caps, skewed'], [BF, 700, 'Wolves circle, ravens dive, the dark closes in.', 19, 'T2 body: Segoe UI bold'], [HF, 400, '22   31   74   07:42', 26, 'T2 numbers: Impact']],
  pal: [[OL, 'Ink'], [K.gnd, 'Indigo'], [K.cy, 'Spirit cyan'], [K.mag, 'Danger magenta'], [K.gold, 'Rare gold']],
  note: 'Wren indigo cloak + cyan scarf / Elias pale robe + halo / enemies = magenta, told apart by silhouette and eye shape',
};
