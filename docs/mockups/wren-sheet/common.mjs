// Shared helpers for the Wren sheets: page wrapper, banner, cards, grassy stage discs. Mock-ups only.
import { defsOut, addDef, glow, lgU, rgU, mix, rnd, T, FONT, nid } from '../style-lab/lab.mjs';
import { tuft, flower } from '../style-lab/scene.mjs';
import { wrenDefs } from './wren.mjs';

export const TITLE = 'WREN DESIGN SHEET v1 - Hollowlight Style v1';
export const CODE = 'STYLE CODE: L2 tinted outline + H2 soft gradient/rim + P1 chibi + W2 textured ground';
export const CODE2 = 'G1 lantern pool + G2 glow trails | mood P1 Warm Lantern (golden light on cool grey-blue)';
export const KEY = [['#74a09b', 'hood'], ['#f2a335', 'scarf'], ['#ffd05a', 'flame'], ['#f3e7cf', 'fur'], ['#2b3441', 'slate'], ['#8fa0b2', 'mist']];

export function svgPage(w, h, body, extraCss = '') {
  return `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;background:#0b1016}svg{display:block}${extraCss}</style></head><body><svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${defsOut()}${wrenDefs()}${body}</svg></body></html>`;
}
export const bg = (w, h) => `<rect width="${w}" height="${h}" fill="url(#${lgU('pbg' + w + h, 0, 0, w * 0.4, h, [[0, '#121a24'], [1, '#222d3a']])})"/>`;

export function banner(sub = CODE, w = 700) {
  const sw = KEY.map(([c, n], i) => `<circle cx="${22 + i * 108}" cy="80" r="9" fill="${c}" stroke="#fff" stroke-opacity=".75" stroke-width="1.6"/>${T(c + ' ' + n, 36 + i * 108, 84, { s: 11, f: FONT.mono, c: '#e8edf3', w: 600 })}`).join('');
  return `<rect x="0" y="0" width="${w}" height="92" fill="#07090d" opacity=".92"/><rect x="0" y="92" width="${w}" height="3" fill="#ffb84a"/>${T(TITLE, 12, 30, { s: 26, f: FONT.title, w: 900, ls: 0.3 })}${T(sub, 12, 48, { s: 10.5, f: FONT.mono, c: '#ffd98a', w: 700 })}${T(CODE2, 12, 62, { s: 10.5, f: FONT.mono, c: '#ffd98a', w: 700 })}${sw}`;
}
export const card = (x, y, w, h, title, sub = '') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12" fill="#161e29" stroke="#3a4757"/>${T(title, x + 12, y + 20, { s: 13, f: FONT.title, w: 900, c: '#ffd98a', ls: 1 })}${sub ? T(sub, x + w - 12, y + 19, { s: 10, c: '#9fb0c2', w: 600, a: 'end' }) : ''}`;

// restored-grass stage disc with lantern pool (W2 + G1), centre cx,cy
export function stage(cx, cy, rx, ry, seed = 3, pool = true) {
  const r = rnd(seed), id = nid('st');
  addDef(`<clipPath id="${id}"><ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}"/></clipPath>`);
  let o = '';
  if (pool) o += glow(cx, cy - 4, rx * 1.5, ry * 2.1, '#ffc45a', 0.42);
  o += `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#${rgU('stg' + rx + 'x' + ry, cx, cy, rx, [[0, '#9ad66b'], [0.6, '#63a54f'], [1, '#3f7a46']])})"/>`;
  const cols = ['#9ad66b', '#63a54f', '#bde68a', '#3f7a46'];
  let det = '';
  const n = Math.round(rx * ry / 120);
  for (let i = 0; i < n; i++) { const x = cx + (r() * 2 - 1) * rx, y = cy + (r() * 2 - 1) * ry; det += tuft(x, y + 4, 0.55, cols, r); if (i % 4 === 0) det += flower(x + 4, y + 2, 0.6, ['#ffb347', '#ff8fa3', '#fff1c4', '#ffd86b'][i % 4]); }
  o += `<g clip-path="url(#${id})">${det}</g>`;
  o += `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="none" stroke="#ffd98a" stroke-width="2" opacity=".5"/>`;
  return o;
}
export const shadow = (x, y, rx) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${rx * 0.2}" fill="#000" opacity=".4" filter="url(#b4)"/>`;
export const note = (x, y, lines, o = {}) => lines.map((l, i) => T(l, x, y + i * (o.lh || 14), { s: o.s || 11, c: o.c || '#c9d3df', w: o.w || 500, f: o.f })).join('');
