// E3 PAPERCUT DIORAMA
import { rnd, T, CR, ICON } from './lib2.mjs';
export const K = { navy: '#0b1026', n2: '#141a3c', n3: '#1d2650', cream: '#f4ead6', ember: '#ff7a3d', mint: '#5ef2d6', gold: '#ffd84a', slate: '#cfc6b0' };
export const HF = "Bahnschrift,'Segoe UI',Arial,sans-serif", BF = "'Segoe UI',Arial,sans-serif";
const RAR = { common: K.slate, rare: K.mint, epic: '#ff9d6e', evolve: K.gold };
const defs = `<defs>
<filter id="ds" x="-20%" y="-20%" width="150%" height="150%"><feDropShadow dx="2" dy="5" stdDeviation="3.2" flood-color="#000" flood-opacity=".6"/></filter>
<filter id="dl" x="-5%" y="-30%" width="110%" height="160%"><feDropShadow dx="0" dy="-7" stdDeviation="6" flood-color="#000" flood-opacity=".6"/></filter>
<filter id="dsb" x="-20%" y="-20%" width="150%" height="160%"><feDropShadow dx="3" dy="8" stdDeviation="5" flood-color="#000" flood-opacity=".6"/></filter>
<radialGradient id="warm" gradientUnits="userSpaceOnUse" cx="665" cy="330" r="360"><stop offset="0" stop-color="#ff8a4a" stop-opacity=".55"/><stop offset=".5" stop-color="#ff7a3d" stop-opacity=".16"/><stop offset="1" stop-color="#ff7a3d" stop-opacity="0"/></radialGradient>
<radialGradient id="gm"><stop offset="0" stop-color="#5ef2d6" stop-opacity=".45"/><stop offset="1" stop-color="#5ef2d6" stop-opacity="0"/></radialGradient>
</defs>`;
function ridge(base, hMin, hMax, wMin, wMax, seed, fill, jit = 0) {
  const r = rnd(seed); let x = -40; const top = [], bot = [];
  let d = `M-60 700 L-60 ${base}`;
  while (x < 1340) {
    const w = wMin + r() * (wMax - wMin), h = hMin + r() * (hMax - hMin), cx = x + w / 2;
    d += ` L${x} ${base} L${x + w * .08} ${base - h * .28} L${cx - w * .3} ${base - h * .28} L${cx - w * .24} ${base - h * .52} L${cx - w * .12} ${base - h * .52} L${cx} ${base - h} L${cx + w * .12} ${base - h * .52} L${cx + w * .24} ${base - h * .52} L${cx + w * .3} ${base - h * .28} L${x + w * .92} ${base - h * .28} L${x + w} ${base}`;
    x += w * 0.78;
  }
  return `<path d="${d} L1340 700Z" fill="${fill}" filter="url(#dl)"/>`;
}
function band(y, amp, seed, fill, ph = 0) {
  let d = `M-20 700 L-20 ${y}`; for (let x = 0; x <= 1300; x += 100) d += ` Q${x + 50} ${y + Math.sin(x * .01 + seed + ph) * amp} ${x + 100} ${y + Math.cos(x * .012 + seed) * amp * .6}`;
  return `<path d="${d} L1300 700Z" fill="${fill}" filter="url(#dl)"/>`;
}
const deadTree = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})" fill="#04060f" filter="url(#dsb)"><path d="M-14 0 C-8 -80 -12 -160 -4 -250 L4 -250 C14 -160 8 -80 16 0Z"/><path d="M-3 -200 L-60 -250 L-52 -258 L0 -222Z M3 -170 L66 -222 L74 -214 L8 -150Z M-2 -120 L-46 -150 L-40 -158 L0 -134Z M2 -240 L30 -290 L38 -286 L8 -232Z"/></g>`;
export function bg(mode) {
  let o = defs + `<rect width="1280" height="604" fill="#141a3d"/><rect y="150" width="1280" height="454" fill="#1c2452"/><rect y="250" width="1280" height="354" fill="#2b2a62"/><rect y="320" width="1280" height="284" fill="#4a3566"/><rect y="372" width="1280" height="240" fill="#7a4766" opacity=".7"/>`;
  if (mode === 'play') o += `<circle cx="940" cy="112" r="46" fill="${K.cream}" filter="url(#ds)"/>`;
  o += ridge(330, 130, 190, 70, 110, 3, '#2a3070') + ridge(390, 150, 230, 80, 120, 7, '#1d2459') + ridge(450, 170, 260, 90, 130, 11, '#141a44');
  o += band(430, 14, 1, '#0f1536') + `<ellipse cx="665" cy="400" rx="520" ry="150" fill="url(#warm)"/>` + band(500, 12, 4, '#0b1029');
  o += deadTree(250, 470, 1.0) + deadTree(1040, 480, 1.05);
  o += ridge(530, 190, 300, 100, 150, 21, '#060917') + band(560, 10, 9, '#04060f');
  o += `<g fill="#04060f" filter="url(#dsb)"><path d="M-30 604 C0 400 -6 200 20 -20 L110 -20 C84 200 96 400 120 604Z"/><path d="M1180 604 C1200 400 1190 200 1210 -20 L1310 -20 C1290 200 1280 400 1320 604Z"/></g>`;
  const pr = rnd(77); for (let i = 0; i < 26; i++) { const r = pr; o += `<circle cx="${(r() * 1280).toFixed(0)}" cy="${(r() * 540).toFixed(0)}" r="${(1.2 + r() * 1.6).toFixed(1)}" fill="${i % 3 ? K.mint : K.ember}" opacity=".75"/>`; }
  if (mode !== 'play') o += `<rect width="1280" height="604" fill="#04060f" opacity="${mode === 'dim' ? .6 : .38}"/>`;
  return o;
}
const COL = {
  wren: { f: '#1d2552', e: K.cream, a: K.ember, eye: K.ember }, elias: { f: K.cream, e: '#a79a80', a: K.mint, i: '#fff' },
  wolf: { f: K.mint, e: K.cream, i: '#d6fff6', a: K.mint }, raven: { f: K.mint, e: K.cream, i: '#d6fff6', a: K.mint },
  ewolf: { f: '#0a0e22', e: '#4a5590' }, crow: { f: '#12172f', e: '#5a6aa8' }, crawler: { f: '#0f1330', e: K.ember }, treant: { f: '#090d22', e: '#3b4682' },
};
export function cr(id, x, y, s, f = 1) {
  const c = CR[id], k = COL[id], sum = c.kind === 'summon', foe = c.kind === 'enemy' || c.kind === 'boss';
  let g = `<g transform="translate(${x} ${y}) scale(${s * f} ${s})" stroke-linejoin="round"><g filter="url(#${c.kind === 'boss' ? 'dsb' : 'ds'})">`;
  if (sum) g += `<circle cx="0" cy="${-c.h * .5}" r="${c.w * .58}" fill="url(#gm)"/>`;
  for (const e of c.extras) {
    if (e.r === 'soft') g += `<path d="${e.d}" fill="${K.mint}" opacity=".6"/>`;
    else if (e.r === 'acc') g += `<path d="${e.d}" fill="${k.a}" stroke="${K.cream}" stroke-width="2"/>`;
    else if (e.r === 'wing') g += `<path d="${e.d}" fill="#1b2146" stroke="${k.e}" stroke-width="2.4"/>`;
  }
  if (c.rings) c.rings.forEach(([cx, cy, rx, ry]) => { g += `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="none" stroke="${K.mint}" stroke-width="3.2"/>`; });
  g += `<path d="${c.body}" fill="none" stroke="${k.e}" stroke-width="${c.kind === 'boss' ? 7 : 4.2}"/><path d="${c.body}" fill="${k.f}"/>`;
  if (k.i) { const [cx, cy] = c.core || [0, -c.h * .5]; g += `<path d="${c.body}" fill="${k.i}" opacity="${sum ? .95 : .35}" transform="translate(${cx} ${cy}) scale(${sum ? .6 : .0}) translate(${-cx} ${-cy})"/>`; }
  if (id === 'wren') g += `<path d="M-12 -70 C-6 -40 -20 -20 -30 0 L-14 0 C-8 -20 -2 -40 -4 -70Z" fill="#2a3470"/><path d="M13 -80 C20 -50 28 -26 33 0 L20 0 C14 -26 10 -50 8 -78Z" fill="#12183c"/>`;
  if (id === 'elias') g += `<path d="M0 -92 L-12 -76 L-34 -66 L-42 -48 L-30 -46 L-21 -57 C-25 -34 -30 -14 -35 0 L-10 0 C-10 -30 -6 -60 0 -92Z" fill="#e0d3b6"/>`;
  for (const e of c.extras) if (e.r === 'face') g += `<path d="${e.d}" fill="#ffe2c0" stroke="${k.e}" stroke-width="2.4"/>`;
  if (c.voidD) g += `<path d="${c.voidD}" fill="#04060f"/>`;
  for (const [d, role] of c.lines) g += role === 'staff' ? `<path d="${d}" stroke="${K.cream}" stroke-width="3.4" fill="none" stroke-linecap="round"/>` : `<path d="${d}" stroke="${role === 'mark' ? K.mint : K.cream}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
  for (const [ex, ey, er] of c.eyes) g += `<circle cx="${ex}" cy="${ey}" r="${er}" fill="${sum ? '#0b1026' : foe ? K.ember : K.ember}"/>`;
  g += '</g>';
  if (c.orbs) c.orbs.forEach(([ox, oy, orr]) => { const lant = id === 'wren'; const col = lant ? K.ember : K.mint; g += `<circle cx="${ox}" cy="${oy}" r="${orr * (lant ? 5 : 3)}" fill="${lant ? 'url(#warm)' : 'url(#gm)'}"/><g filter="url(#ds)"><circle cx="${ox}" cy="${oy}" r="${orr}" fill="${col}" stroke="${K.cream}" stroke-width="2.2"/><circle cx="${ox}" cy="${oy}" r="${orr * .5}" fill="${lant ? '#ffe6a8' : '#e0fff8'}"/></g>`; });
  return g + '</g>';
}
export const gem = (x, y, k) => `<g transform="translate(${x} ${y})" filter="url(#ds)"><path d="M0 -13 L11 0 L0 13 L-11 0Z" fill="${K.mint}" stroke="${K.cream}" stroke-width="2.4" stroke-linejoin="round"/><path d="M0 -6 L5 0 L0 6 L-5 0Z" fill="#e0fff8"/></g>`;
export const dmg = (x, y, t, crit) => crit
  ? `<g transform="translate(${x} ${y}) rotate(-5)" filter="url(#ds)"><rect x="-58" y="-48" width="116" height="64" rx="10" fill="${K.cream}"/><circle cx="-44" cy="-36" r="4" fill="${K.navy}"/>${T(t, 4, 6, { f: HF, s: 56, w: 800, c: K.ember, a: 'middle' })}</g>`
  : `<g filter="url(#ds)">${T(t, x, y, { f: HF, s: 28, w: 800, c: K.cream, a: 'middle' })}</g>`;
export function ico(k, x, y, s) {
  const c = { wolf: K.mint, raven: K.mint, orb: K.mint, heart: K.ember, gem: K.mint }[k], i = ICON[k];
  return `<g transform="translate(${x} ${y}) scale(${s / 48})" filter="url(#ds)" stroke-linejoin="round"><path d="${i.f}" fill="${c}" stroke="${K.cream}" stroke-width="3.6"/><g transform="translate(24 25) scale(.56) translate(-24 -25)"><path d="${i.f}" fill="#fff" opacity=".7"/></g>${i.l ? `<path d="${i.l}" fill="none" stroke="${K.navy}" stroke-width="2.4" stroke-linecap="round"/>` : ''}</g>`;
}
export const panel = (x, y, w, h, o = {}) => `<g filter="url(#${o.sel ? 'dsb' : 'ds'})"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="16" fill="${K.cream}"/><rect x="${x + 7}" y="${y + 7}" width="${w - 14}" height="${h - 14}" rx="11" fill="${o.sel ? K.n3 : K.n2}"/>${o.sel ? `<rect x="${x + 7}" y="${y + h - 15}" width="${w - 14}" height="8" rx="4" fill="${K.mint}"/>` : ''}</g>`;
export const label = (s, x, y, sz, a, sel, small) => T(s, x, y, { f: HF, s: sz, w: small ? 500 : 800, c: small ? '#b8c0e6' : sel ? K.cream : '#c9c3b4', a, ls: small ? 1 : 1 });
export const btn = (x, y, w, h, t, kind) => `<g filter="url(#ds)"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2.6}" fill="${kind === 'primary' ? K.ember : K.cream}"/>${kind === 'primary' ? `<rect x="${x + 5}" y="${y + 5}" width="${w - 10}" height="${h * .42}" rx="${h / 4}" fill="#ff9a66"/>` : ''}</g>` + T(t, x + w / 2, y + h / 2 + h * .17, { f: HF, s: h * .46, w: 800, c: kind === 'primary' ? K.navy : K.n2, a: 'middle', ls: 3 });
export function bar(x, y, w, h, p, kind) {
  const c = kind === 'hp' ? K.ember : K.mint;
  return `<g filter="url(#ds)"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" fill="${K.navy}"/><rect x="${x + 3}" y="${y + 3}" width="${Math.max(h, (w - 6) * p)}" height="${h - 6}" rx="${(h - 6) / 2}" fill="${c}"/><rect x="${x + 7}" y="${y + 5}" width="${Math.max(h - 8, (w - 6) * p - 12)}" height="${Math.max(2, (h - 6) * .32)}" rx="${(h - 6) * .16}" fill="#fff" opacity=".45"/></g>`;
}
export const plate = (x, y, w, h) => `<g filter="url(#ds)"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12" fill="${K.cream}"/><circle cx="${x + 14}" cy="${y + h / 2}" r="5" fill="${K.navy}"/></g>`;
export function logo(cx, cy, s = 1) {
  const t = (dx, dy, c, st) => T('Hollowlight', dx, 40 + dy, { f: HF, s: 128, w: 800, c, a: 'middle', ls: 1, st, sw: st ? 14 : 0 });
  return `<g transform="translate(${cx} ${cy}) scale(${s})"><ellipse cx="0" cy="10" rx="360" ry="100" fill="url(#warm)" opacity=".7"/><g filter="url(#dsb)">${t(7, 9, K.navy, K.navy)}${t(4, 5, K.ember, K.ember)}${t(0, 0, K.cream)}</g><circle cx="300" cy="-6" r="0" fill="none"/></g>`;
}
export const sub = (s, cx, y) => `<g filter="url(#ds)"><rect x="${cx - 270}" y="${y - 26}" width="540" height="40" rx="8" fill="${K.cream}"/></g>` + T(s, cx, y + 2, { f: HF, s: 24, w: 700, c: K.n2, a: 'middle', ls: 9 });
export const heading = (s, cx, y) => `<g filter="url(#dsb)">${T(s, cx + 3, y + 4, { f: HF, s: 84, w: 800, c: K.ember, a: 'middle', ls: 8, st: K.ember, sw: 8 })}${T(s, cx, y, { f: HF, s: 84, w: 800, c: K.cream, a: 'middle', ls: 8 })}</g>`;
export const chip = (r, x, y) => `<g filter="url(#ds)"><rect x="${x}" y="${y}" width="84" height="30" rx="8" fill="${RAR[r]}"/></g>` + T(r.toUpperCase(), x + 42, y + 21, { f: HF, s: 15, w: 800, c: K.navy, a: 'middle', ls: 1.5 });
export function card(d) {
  const c = RAR[d.rar], ev = d.rar === 'evolve';
  let o = `<g filter="url(#dsb)"><rect width="330" height="400" rx="18" fill="${K.cream}"/></g><rect y="0" width="330" height="76" rx="18" fill="${c}"/><rect y="40" width="330" height="36" fill="${c}"/><circle cx="165" cy="22" r="8" fill="${K.navy}"/>`;
  o += T(d.tag, 165, 64, { f: HF, s: 22, w: 800, c: K.navy, a: 'middle', ls: 5 });
  o += `<g filter="url(#ds)"><circle cx="165" cy="164" r="76" fill="${K.n2}"/><circle cx="165" cy="164" r="62" fill="${K.n3}"/></g>` + ico(d.icon, 105, 106, 120);
  o += T(d.name, 165, 292, { f: HF, s: 36, w: 800, c: K.n2, a: 'middle' }) + T(d.lv, 165, 318, { f: HF, s: 17, w: 700, c: '#e0631f', a: 'middle', ls: 1 });
  d.desc.forEach((l, i) => { o += T(l, 165, 352 + i * 24, { f: BF, s: 17, w: 600, c: '#3a4066', a: 'middle' }); });
  return o;
}
export function hud() {
  let o = '';
  o += `<g filter="url(#ds)"><rect x="0" y="0" width="1280" height="12" fill="${K.navy}"/><rect x="0" y="0" width="790" height="12" fill="${K.mint}"/></g>`;
  o += plate(22, 28, 310, 60) + `<g transform="translate(42 40)">${ico('heart', 0, 0, 36)}</g>` + bar(90, 46, 228, 24, .72, 'hp') + T('86', 204, 66, { f: HF, s: 18, w: 800, c: K.navy, a: 'middle' });
  o += `<g filter="url(#ds)"><circle cx="58" cy="128" r="28" fill="${K.mint}"/><circle cx="58" cy="128" r="22" fill="${K.cream}"/></g>` + T('7', 58, 140, { f: HF, s: 32, w: 800, c: K.n2, a: 'middle' });
  o += plate(560, 28, 160, 54) + T('07:42', 645, 69, { f: HF, s: 38, w: 800, c: K.n2, a: 'middle' });
  o += plate(1120, 28, 140, 50) + `<g transform="translate(1138 38)">${ico('gem', 0, 0, 30)}</g>` + T('132', 1244, 65, { f: HF, s: 28, w: 800, c: K.n2, a: 'end' });
  [['wolf', 3], ['raven', 2], ['orb', 1]].forEach(([k, lv], i) => { const x = 22 + i * 74; o += `<g filter="url(#ds)"><rect x="${x}" y="508" width="62" height="62" rx="14" fill="${K.cream}"/></g><rect x="${x + 6}" y="514" width="50" height="50" rx="10" fill="${K.n2}"/>` + ico(k, x + 12, 520, 38) + [0, 1, 2].map((j) => `<circle cx="${x + 15 + j * 16}" cy="582" r="4.5" fill="${j < lv ? K.ember : K.cream}" opacity="${j < lv ? 1 : .35}"/>`).join(''); });
  return o;
}
export const E3 = {
  bg, cr, gem, dmg, ico, panel, label, btn, bar, plate, logo, sub, heading, chip, card, hud,
  ptxt: K.n2, acc: K.ember, sheetBg: '#0d1230', sheetBg2: '#080b20', txt: K.cream, hf: HF, bf: BF, codes: {},
  type: [[HF, 800, 'Spirits of the Dusk', 28, 'T3 display: Bahnschrift bold'], [BF, 600, 'Wolves circle, ravens dive, the dark closes in.', 19, 'T3 body: Segoe UI semibold'], [HF, 800, '22   31   74   07:42', 26, 'T3 numbers: Bahnschrift']],
  pal: [[K.navy, 'Night paper'], [K.cream, 'Cream'], [K.ember, 'Lantern ember'], [K.mint, 'Spirit mint'], [K.gold, 'Rare gold']],
  note: 'Wren navy cut-out + ember lantern / Elias cream robe + mint halo / enemies = dark paper with ember eyes, told apart by silhouette',
};
