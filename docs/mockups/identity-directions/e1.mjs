// E1 INK & SPIRIT
import { rnd, T, circ, CR, ICON, ACT, world, layout, CARDS } from './lib2.mjs';
export const K = { ink: '#050507', paper: '#e9e2d0', cy: '#2ee6ff', vi: '#a35cff', red: '#ff2b3a', gold: '#ffcf4a', bg: '#0b0b0f' };
export const HF = "'Ink Free','Segoe Print','Bradley Hand ITC','Comic Sans MS',cursive", BF = "Georgia,'Times New Roman',serif";
const ACC = { wren: K.cy, elias: K.vi, wolf: K.cy, raven: K.vi };
const RAR = { common: K.paper, rare: K.cy, epic: K.vi, evolve: K.gold };

export const defs = `<defs>
<filter id="rg" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency=".035" numOctaves="2" seed="4" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="5"/></filter>
<filter id="rg2" x="-15%" y="-15%" width="130%" height="130%"><feTurbulence type="fractalNoise" baseFrequency=".05" numOctaves="2" seed="9" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="3"/></filter>
<filter id="grain"><feTurbulence type="fractalNoise" baseFrequency=".8" numOctaves="2" seed="3"/><feColorMatrix values="0 0 0 0 .9  0 0 0 0 .87  0 0 0 0 .78  0 0 0 .55 -.26"/></filter>
<pattern id="hx" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(38)"><path d="M0 0V8" stroke="#e9e2d0" stroke-width="1" opacity=".3"/></pattern>
<pattern id="hy" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(-40)"><path d="M0 0V7" stroke="#e9e2d0" stroke-width="1" opacity=".5"/></pattern>
<radialGradient id="fade" gradientUnits="userSpaceOnUse" cx="640" cy="350" r="560"><stop offset=".25" stop-color="#000"/><stop offset="1" stop-color="#fff"/></radialGradient>
<mask id="edge"><rect width="1280" height="604" fill="url(#fade)"/></mask>
<radialGradient id="pool" gradientUnits="userSpaceOnUse" cx="640" cy="360" r="380"><stop offset="0" stop-color="#3b3b48"/><stop offset=".6" stop-color="#1c1c24"/><stop offset="1" stop-color="#0b0b0f"/></radialGradient>
<radialGradient id="gcy"><stop offset="0" stop-color="#2ee6ff" stop-opacity=".35"/><stop offset="1" stop-color="#2ee6ff" stop-opacity="0"/></radialGradient>
<radialGradient id="gvi"><stop offset="0" stop-color="#a35cff" stop-opacity=".35"/><stop offset="1" stop-color="#a35cff" stop-opacity="0"/></radialGradient>
<radialGradient id="grd"><stop offset="0" stop-color="#ff2b3a" stop-opacity=".3"/><stop offset="1" stop-color="#ff2b3a" stop-opacity="0"/></radialGradient>
</defs>`;

export function blob(x, y, w, h, seed = 1, j = 2.2) {
  const r = rnd(seed), p = [], st = 24;
  for (let i = 0; i < w; i += st) p.push([x + i, y + (r() - .5) * j * 2]);
  for (let i = 0; i < h; i += st) p.push([x + w + (r() - .5) * j * 2, y + i]);
  for (let i = w; i > 0; i -= st) p.push([x + i, y + h + (r() - .5) * j * 2]);
  for (let i = h; i > 0; i -= st) p.push([x + (r() - .5) * j * 2, y + i]);
  return 'M' + p.map((q) => q[0].toFixed(1) + ' ' + q[1].toFixed(1)).join('L') + 'Z';
}
const jag = (cx, cy, rx, ry, seed, n = 16) => { const r = rnd(seed); let d = ''; for (let i = 0; i < n; i++) { const a = (i / n) * 6.283, k = 0.78 + r() * 0.35; d += (i ? 'L' : 'M') + (cx + Math.cos(a) * rx * k).toFixed(0) + ' ' + (cy + Math.sin(a) * ry * k).toFixed(0); } return d + 'Z'; };

function tree(x, y, s, seed) {
  const r = rnd(seed), w = 16 + r() * 8, h = 190 + r() * 90, l = (r() - .5) * 40;
  const t = `M${-w - 16} 6 C${-w} -10 ${-w + 4} -50 ${-w + l * .2} ${-h * .55} C${-w - 14 + l} ${-h * .8} ${-34 + l} ${-h} ${l} ${-h - 36} C${34 + l} ${-h} ${w + 14 + l} ${-h * .8} ${w + l * .2} ${-h * .55} C${w - 4} -50 ${w} -10 ${w + 16} 6Z`;
  const can = jag(l - 28, -h - 6, 52, 40, seed + 1) + jag(l + 30, -h - 14, 56, 42, seed + 2) + jag(l, -h - 46, 58, 40, seed + 3);
  const br = `M${-w} ${-h * .5} C${-w - 40} ${-h * .55} ${-w - 60} ${-h * .7} ${-w - 80} ${-h * .66} M${w} ${-h * .42} C${w + 40} ${-h * .5} ${w + 70} ${-h * .6} ${w + 84} ${-h * .8}`;
  const sh = `<g transform="translate(${x} ${y}) scale(${s})"><ellipse cx="0" cy="8" rx="70" ry="12" fill="#000" opacity=".5"/>`;
  return sh + `<path d="${t}${can}" fill="${K.ink}" stroke="${K.paper}" stroke-opacity=".5" stroke-width="1.6" stroke-dasharray="46 12 14 22" stroke-linejoin="round"/><path d="${br}" fill="none" stroke="${K.ink}" stroke-width="9" stroke-linecap="round"/></g>`;
}

export function bg(mode) {
  const r = rnd(5); let o = defs + `<rect width="1280" height="604" fill="${K.bg}"/><rect width="1280" height="604" fill="url(#pool)"/>`;
  o += `<g mask="url(#edge)"><rect width="1280" height="604" fill="url(#hx)"/></g>`;
  const ts = [[70, 330, 1.35], [180, 190, 0.9], [360, 140, 0.75], [520, 120, 0.7], [800, 130, 0.72], [1000, 150, 0.8], [1190, 330, 1.3], [120, 560, 1.4], [330, 600, 1.1], [980, 600, 1.15], [1200, 580, 1.45], [260, 330, 0.85]];
  ts.sort((a, b) => a[1] - b[1]).forEach(([x, y, s], i) => { o += tree(x, y + 70, s, 10 + i); });
  for (let i = 0; i < 22; i++) { const x = r() * 1280, y = 200 + r() * 400; if (Math.hypot((x - 640) / 1.5, y - 350) < 190) continue; o += `<path d="M${x} ${y} l-4 -10 M${x + 5} ${y} l0 -13 M${x + 10} ${y} l5 -10" stroke="${K.paper}" stroke-opacity=".5" stroke-width="1.5" fill="none"/>`; }
  {const q=rnd(99);for(let i=0;i<340;i++)o+=`<circle cx="${(q()*1280).toFixed(0)}" cy="${(q()*604).toFixed(0)}" r="${(.5+q()*.9).toFixed(1)}" fill="#e9e2d0" opacity=".22"/>`;}
  if (mode === 'dim' || mode === 'title') o += `<rect width="1280" height="604" fill="#000" opacity="${mode === 'dim' ? .62 : .5}"/>`;
  return o;
}

export function cr(id, x, y, s, f = 1, o = {}) {
  const c = CR[id], acc = ACC[id] || K.red, sum = c.kind === 'summon', foe = c.kind === 'enemy' || c.kind === 'boss';
  let g = `<g transform="translate(${x} ${y}) scale(${s * f} ${s})" filter="url(#rg2)">`;
  if (id === 'raven' || id === 'crow') g += ''; else g += `<ellipse cx="0" cy="3" rx="${c.w * .38}" ry="6" fill="#000" opacity=".6"/>`;
  if (sum) g += `<circle cx="0" cy="${-c.h * .5}" r="${c.w * .6}" fill="url(#g${acc === K.cy ? 'cy' : 'vi'})"/>`;
  if (c.kind === 'boss') g += `<ellipse cx="0" cy="-190" rx="60" ry="46" fill="url(#grd)"/>`;
  for (const e of c.extras) {
    if (e.r === 'soft') g += `<path d="${e.d}" fill="${acc}" opacity=".5"/>`;
    else if (e.r === 'acc') g += `<path d="${e.d}" fill="${acc}" stroke="${K.ink}" stroke-width="2.4" stroke-linejoin="round"/>`;
    else if (e.r === 'wing') g += `<path d="${e.d}" fill="${K.ink}" stroke="${K.paper}" stroke-width="1.6" stroke-linejoin="round"/><path d="${e.d}" fill="url(#hy)"/>`;
  }
  if (c.rings) c.rings.forEach(([cx, cy, rx, ry]) => { g += `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="none" stroke="${acc}" stroke-width="3"/>`; });
  g += sum ? `<path d="${c.body}" fill="${acc}" stroke="${K.ink}" stroke-width="3.2" stroke-linejoin="round"/>` : `<path d="${c.body}" fill="${K.ink}" stroke="${K.paper}" stroke-width="${c.kind === 'boss' ? 3 : 1.8}" stroke-linejoin="round"/><path d="${c.body}" fill="url(#hx)"/>`;
  if (sum) { const [cx, cy, k] = c.core; g += `<path d="${c.body}" fill="#fff" transform="translate(${cx} ${cy}) scale(${k}) translate(${-cx} ${-cy})"/>`; }
  for (const e of c.extras) if (e.r === 'face') g += `<path d="${e.d}" fill="${K.paper}" stroke="${K.ink}" stroke-width="2"/>`;
  if (c.voidD) g += `<path d="${c.voidD}" fill="#000"/>`;
  for (const [d, role] of c.lines) g += role === 'staff' ? `<path d="${d}" stroke="${K.paper}" stroke-width="3" fill="none" stroke-linecap="round"/>` : `<path d="${d}" stroke="${role === 'fang' ? K.paper : K.paper}" stroke-opacity=".8" stroke-width="1.8" fill="none" stroke-linecap="round"/>`;
  for (const [ex, ey, er] of c.eyes) g += `<circle cx="${ex}" cy="${ey}" r="${er}" fill="${sum ? K.ink : foe ? K.red : K.paper}"/>`;
  if (c.orbs) c.orbs.forEach(([ox, oy, orr]) => { g += `<circle cx="${ox}" cy="${oy}" r="${orr * 2.2}" fill="url(#g${acc === K.cy ? 'cy' : 'vi'})"/><circle cx="${ox}" cy="${oy}" r="${orr}" fill="${acc}" stroke="${K.ink}" stroke-width="2"/><circle cx="${ox}" cy="${oy}" r="${orr * .5}" fill="#fff"/>`; });
  return g + '</g>';
}
export const gem = (x, y, k) => { const c = k ? K.vi : K.cy; return `<g transform="translate(${x} ${y})"><circle r="17" fill="url(#g${k ? 'vi' : 'cy'})"/><path d="M0 -10 L8 0 L0 10 L-8 0Z" fill="${c}" stroke="${K.ink}" stroke-width="2.2" stroke-linejoin="round"/><path d="M0 -4 L3 0 L0 4 L-3 0Z" fill="#fff"/></g>`; };
export const dmg = (x, y, t, crit) => crit
  ? `<g transform="translate(${x} ${y}) rotate(-6)">${T(t, 0, 0, { f: HF, s: 68, c: '#fff', st: K.ink, sw: 9, a: 'middle' })}<path d="M-46 14 C-20 22 20 6 52 16" stroke="${K.red}" stroke-width="7" stroke-linecap="round" fill="none"/></g>`
  : T(t, x, y, { f: HF, s: 26, c: K.paper, st: K.ink, sw: 6, a: 'middle' });

export function ico(k, x, y, s) {
  const c = { wolf: K.cy, raven: K.vi, orb: K.cy, heart: K.red, gem: K.vi }[k], i = ICON[k];
  return `<g transform="translate(${x} ${y}) scale(${s / 48})" filter="url(#rg2)"><path d="${i.f}" fill="${c}" stroke="${K.ink}" stroke-width="3.4" stroke-linejoin="round"/>${i.l ? `<path d="${i.l}" fill="none" stroke="${K.ink}" stroke-width="2.6" stroke-linecap="round"/>` : ''}<g transform="translate(24 26) scale(.42) translate(-24 -26)"><path d="${i.f}" fill="#fff" opacity="${k === 'heart' ? .5 : .95}"/></g></g>`;
}
export const panel = (x, y, w, h, o = {}) => `<g filter="url(#rg)"><path d="${blob(x, y, w, h, x + y)}" fill="#08080b" stroke="${o.sel ? K.cy : K.paper}" stroke-opacity="${o.sel ? 1 : .6}" stroke-width="${o.sel ? 3.4 : 1.6}"/><path d="${blob(x, y, w, h, x + y)}" fill="url(#hx)" opacity=".35"/></g>`;
export const label = (s, x, y, sz, a, sel, small) => T(s, x, y, { f: small ? BF : HF, s: sz, w: 400, c: sel ? '#fff' : K.paper, a, st: small ? undefined : K.ink, sw: 5, op: small ? .75 : 1, i: small });
export const btn = (x, y, w, h, t, kind) => `<g filter="url(#rg)"><path d="${blob(x, y, w, h, x + 3)}" fill="#08080b" stroke="${K.paper}" stroke-width="${kind === 'primary' ? 2.4 : 1.4}" stroke-opacity="${kind === 'primary' ? 1 : .6}"/></g>${kind === 'primary' ? `<path d="M${x + 18} ${y + h - 9} C${x + w * .3} ${y + h - 3} ${x + w * .7} ${y + h - 14} ${x + w - 18} ${y + h - 8}" stroke="${K.cy}" stroke-width="5" stroke-linecap="round" fill="none"/><path d="M${x + 60} ${y + h - 8} C${x + w * .4} ${y + h - 6} ${x + w * .6} ${y + h - 11} ${x + w - 60} ${y + h - 9}" stroke="#fff" stroke-width="1.8" stroke-linecap="round" fill="none"/>` : ''}${T(t[0] + t.slice(1).toLowerCase(), x + w / 2, y + h / 2 + 9, { f: HF, s: h > 50 ? 32 : 22, w: 400, c: K.paper, a: 'middle', st: K.ink, sw: 4 })}`;
export function bar(x, y, w, h, p, kind) {
  const c = kind === 'hp' ? K.red : K.cy;
  return `<g filter="url(#rg2)"><path d="${blob(x, y, w, h, x + 9, 1.4)}" fill="#08080b" stroke="${K.paper}" stroke-opacity=".5" stroke-width="1.4"/><path d="${blob(x + 3, y + 3, (w - 6) * p, h - 6, x + 5, 1.2)}" fill="${c}"/>${kind === 'xp' ? `<circle cx="${x + 3 + (w - 6) * p}" cy="${y + h / 2}" r="${h * .5}" fill="#fff"/>` : `<path d="M${x + 8} ${y + h * .38} H${x + w * p - 6}" stroke="#fff" stroke-opacity=".6" stroke-width="2"/>`}</g>`;
}
export const plate = (x, y, w, h) => panel(x, y, w, h);
export function logo(cx, cy, s = 1) {
  return `<g transform="translate(${cx} ${cy}) scale(${s})"><g filter="url(#rg2)"><path d="M-300 40 C-200 62 -60 24 60 48 C150 62 240 34 306 46" stroke="${K.cy}" stroke-width="15" stroke-linecap="round" fill="none"/><path d="M-250 43 C-150 56 -40 34 60 48 C150 56 220 40 270 46" stroke="#fff" stroke-width="4" stroke-linecap="round" fill="none"/></g>
${T('Hollowlight', 0, 20, { f: HF, s: 128, w: 400, c: K.paper, a: 'middle', st: K.ink, sw: 16 })}<circle cx="318" cy="-8" r="12" fill="${K.vi}" stroke="${K.ink}" stroke-width="3"/><circle cx="318" cy="-8" r="5" fill="#fff"/></g>`;
}
export const sub = (s, cx, y) => `<path d="M${cx - 300} ${y - 8} H${cx - 190} M${cx + 190} ${y - 8} H${cx + 300}" stroke="${K.paper}" stroke-opacity=".5" stroke-width="2" stroke-linecap="round"/>` + T(s[0] + s.slice(1).toLowerCase(), cx, y, { f: HF, s: 28, w: 400, c: K.paper, a: 'middle', st: K.ink, sw: 6, ls: 3 });
export const heading = (s, cx, y) => T(s[0] + s.slice(1).toLowerCase() + '!', cx, y, { f: HF, s: 76, w: 400, c: '#fff', a: 'middle', st: K.ink, sw: 14 }) + `<path d="M${cx - 150} ${y + 16} C${cx - 50} ${y + 26} ${cx + 60} ${y + 8} ${cx + 150} ${y + 20}" stroke="${K.vi}" stroke-width="8" stroke-linecap="round" fill="none"/><path d="M${cx - 110} ${y + 18} C${cx - 20} ${y + 22} ${cx + 40} ${y + 12} ${cx + 110} ${y + 18}" stroke="#fff" stroke-width="2.4" stroke-linecap="round" fill="none"/>`;
export const chip = (r, x, y) => `<g filter="url(#rg2)"><path d="${blob(x, y, 84, 30, x)}" fill="${RAR[r]}" stroke="${K.ink}" stroke-width="2"/></g>` + T(r === 'evolve' ? 'EVOLVE' : r[0].toUpperCase() + r.slice(1), x + 42, y + 22, { f: HF, s: 18, w: 400, c: K.ink, a: 'middle' });
export function card(d) {
  const c = RAR[d.rar], ev = d.rar === 'evolve';
  let o = `<g filter="url(#rg)"><path d="${blob(0, 0, 330, 400, d.name.length)}" fill="#08080b" stroke="${c}" stroke-width="${d.rar === 'common' ? 2 : 5}"/><path d="${blob(0, 0, 330, 400, d.name.length)}" fill="url(#hx)" opacity=".4"/></g>`;
  o += `<circle cx="165" cy="130" r="86" fill="url(#g${d.rar === 'rare' || d.icon === 'wolf' ? 'cy' : 'vi'})"/>` + ico(d.icon, 105, 70, 120);
  o += T(d.name, 165, 262, { f: HF, s: 36, w: 400, c: '#fff', a: 'middle', st: K.ink, sw: 6 });
  o += T(d.lv, 165, 294, { f: HF, s: 20, w: 400, c: c, a: 'middle' });
  o += `<path d="M60 308 C120 314 210 304 270 310" stroke="${c}" stroke-opacity=".6" stroke-width="2" fill="none"/>`;
  d.desc.forEach((l, i) => { o += T(l, 165, 342 + i * 26, { f: BF, s: 18, w: 400, c: K.paper, a: 'middle', i: 1 }); });
  o += `<g transform="translate(${ev ? 76 : 18} ${ev ? -14 : -10}) rotate(${ev ? -3 : -4})"><g filter="url(#rg2)"><path d="${blob(0, 0, ev ? 178 : 112, 36, 5)}" fill="${c}" stroke="${K.ink}" stroke-width="2.4"/></g>${T(d.tag, ev ? 89 : 56, 26, { f: HF, s: 24, w: 400, c: K.ink, a: 'middle' })}</g>`;
  return o;
}
export function hud() {
  let o = '';
  o += `<g filter="url(#rg2)"><path d="M0 8 H1280" stroke="${K.paper}" stroke-opacity=".25" stroke-width="4"/><path d="M0 8 H790" stroke="${K.cy}" stroke-width="5" stroke-linecap="round"/></g><circle cx="790" cy="8" r="6" fill="#fff"/>`;
  o += panel(20, 26, 300, 52) + `<g transform="translate(34 36)">${ico('heart', 0, 0, 32)}</g>` + bar(78, 40, 226, 24, .72, 'hp') + T('86', 298, 61, { f: HF, s: 22, c: '#fff', st: K.ink, sw: 5, a: 'end' });
  o += panel(20, 88, 90, 40) + T('Lv 7', 65, 118, { f: HF, s: 26, c: K.paper, a: 'middle' });
  o += panel(570, 22, 140, 48) + T('07:42', 640, 58, { f: HF, s: 36, c: '#fff', a: 'middle' });
  o += panel(1140, 26, 120, 42) + `<g transform="translate(1152 32)">${ico('gem', 0, 0, 28)}</g>` + T('132', 1244, 58, { f: HF, s: 26, c: K.paper, a: 'end' });
  [['wolf', 3], ['raven', 2], ['orb', 1]].forEach(([k, lv], i) => { const x = 22 + i * 70; o += `<g filter="url(#rg2)"><circle cx="${x + 28}" cy="548" r="29" fill="#08080b" stroke="${K.paper}" stroke-opacity=".6" stroke-width="1.6"/></g>` + ico(k, x + 8, 528, 40) + [0, 1, 2].map((j) => `<circle cx="${x + 18 + j * 10}" cy="590" r="3.2" fill="${j < lv ? K.cy : '#333'}"/>`).join(''); });
  return o;
}
export const E1 = {
  bg, cr, gem, dmg, ico, panel, label, btn, bar, plate, logo, sub, heading, chip, card, hud,
  acc: K.cy, sheetBg: '#0b0b0f', sheetBg2: '#101015', txt: K.paper, hf: HF, bf: BF,
  codes: { W: 'W1', U: 'U1', T: 'T1', C: 'C1', I: 'I1', L: 'L1', B: 'B1' },
  type: [[HF, 400, 'Spirits of the Dusk', 28, 'T1 display: Ink Free (hand)'], [BF, 400, 'Wolves circle, ravens dive, the dark closes in.', 17, 'T1 body: Georgia italic'], [HF, 400, '22   31   74   07:42', 26, 'T1 numbers: Ink Free']],
  pal: [[K.bg, 'Ink'], [K.paper, 'Paper'], [K.cy, 'Spirit cyan'], [K.vi, 'Spirit violet'], [K.red, 'Danger red'], [K.gold, 'Rare gold']],
  note: 'Wren cyan lantern + scarf / Elias violet halo + orbit / enemies = black ink + red eyes, told apart by silhouette',
};
