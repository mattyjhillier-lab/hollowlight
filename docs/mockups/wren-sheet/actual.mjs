// wren-actual-size.png: Wren at the REAL in-game scale (60px desktop, 40px phone) in a mock game frame, 1:1 and 3x nearest-neighbour.
// Pass 1 renders the true-size frames (desktop 1280x720 @DPR1, phone 390x844 @DPR2); pass 2 crops them 1:1 and magnifies 3x.
import { begin, use, T, FONT, glow, lgU, rgU, mix, rnd, nid, addDef, wolf, raven, crawler, gem, vein } from '../style-lab/lab.mjs';
import { STYLES, tuft, flower, blade } from '../style-lab/scene.mjs';
import { wren } from './wren.mjs';
import { svgPage, bg, banner, card, note } from './common.mjs';

const WK = 60 / 112; // desktop: 60px tall incl. ear tips

function blobs(list, seed) {
  const r = rnd(seed), out = [];
  for (const [x, y, rr] of list) { out.push([x, y, rr]); for (let i = 0; i < 9; i++) { const a = (i / 9) * 6.283 + r(), d = rr * (0.8 + r() * 0.3); out.push([x + Math.cos(a) * d, y + Math.sin(a) * d * 0.9, rr * (0.2 + r() * 0.16)]); } }
  return out;
}
const dmgText = (x, y, t, fs, c = '#fff4dc', st = '#9a3a12') => `<text x="${x}" y="${y}" font-family="'Segoe UI Black','Arial Black',sans-serif" font-size="${fs}" font-weight="900" text-anchor="middle" fill="${c}" stroke="${st}" stroke-width="${fs * 0.2}" stroke-linejoin="round" paint-order="stroke" transform="rotate(-6 ${x} ${y})">${t}</text>`;

export function gameFrame(w, h, u, cfg) {
  begin(); use(STYLES.S1);
  const r = rnd(cfg.seed || 5), k = WK * u, W = cfg.wren;
  const rest = blobs(cfg.rest, 21);
  const idc = nid('rc'), idm = nid('rm');
  addDef(`<clipPath id="${idc}">${rest.map(([x, y, rr]) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${rr.toFixed(1)}"/>`).join('')}</clipPath>`);
  addDef(`<mask id="${idm}" maskUnits="userSpaceOnUse" x="0" y="0" width="${w}" height="${h}"><rect width="${w}" height="${h}" fill="#000"/>${rest.map(([x, y, rr]) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(rr + 5 * u).toFixed(1)}" fill="#fff"/>`).join('')}${rest.map(([x, y, rr]) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(rr - 1.5 * u).toFixed(1)}" fill="#000"/>`).join('')}</mask>`);
  let o = '';
  // hollow ground (W2 textured, grey-blue, veined)
  o += `<rect width="${w}" height="${h}" fill="url(#${lgU('hg' + w, 0, 0, 0, h, [[0, '#5d6a7a'], [0.5, '#4a5565'], [1, '#3a4452']])})"/><rect width="${w}" height="${h}" filter="url(#mottle)" opacity=".5"/>`;
  let hv = '';
  for (let i = 0; i < Math.round(w * h / 22000); i++) { const x = r() * w, y = r() * h; let d = `M${x} ${y}`, px = x, py = y, a = r() * 6.28; for (let q = 0; q < 5; q++) { a += (r() - 0.5) * 1.3; px += Math.cos(a) * 14 * u; py += Math.sin(a) * 8 * u; d += ` L${px.toFixed(0)} ${py.toFixed(0)}`; } hv += `<path d="${d}" fill="none" stroke="#150f1c" stroke-width="${(1.1 + r() * 0.9) * Math.max(u, 0.7)}" stroke-linecap="round" opacity=".5"/>`; }
  o += hv;
  let ht = '';
  for (let i = 0; i < Math.round(w * h / 1700); i++) { const x = r() * w, y = r() * h, c = i % 2 ? '#6a7686' : '#7d8a9a'; ht += `<path d="${blade(x, y, 3 + r() * 5, (r() - 0.5) * 5, 0.9)}" fill="${c}"/><path d="${blade(x + 1.6, y + 0.4, 2.5 + r() * 4, (r() - 0.5) * 5, 0.8)}" fill="${c}"/>`; }
  o += ht;
  // restored ground
  let g = `<rect width="${w}" height="${h}" fill="url(#${rgU('rg' + w, W[0], W[1], Math.max(w, h) * 0.45, [[0, '#9ad66b'], [0.55, '#63a54f'], [1, '#3f7a46']])})"/><rect width="${w}" height="${h}" filter="url(#mottle)" opacity=".45"/>`;
  let bs = ''; for (let i = 0; i < Math.round(w * h / 2600); i++) { const x = r() * w, y = r() * h, l = (14 + r() * 24) * u, c = r() > 0.5 ? '#9ad66b' : '#3f7a46'; bs += `<path d="M${x.toFixed(0)} ${y.toFixed(0)} q${(l * 0.5).toFixed(0)} ${(-3 - r() * 4).toFixed(1)} ${l.toFixed(0)} ${((r() - 0.5) * 4).toFixed(1)}" stroke="${c}" stroke-width="${(2 + r() * 2.4) * u}" stroke-linecap="round" fill="none" opacity="${0.2 + r() * 0.2}"/>`; }
  g += bs;
  const cols = ['#9ad66b', '#63a54f', '#bde68a', '#3f7a46'];
  let det = '';
  for (let i = 0; i < Math.round(w * h / 520); i++) det += tuft(r() * w, r() * h, 0.27 * u + 0.05, cols, r);
  for (let i = 0; i < Math.round(w * h / 3800); i++) det += flower(r() * w, r() * h, 0.34 * u + 0.05, ['#ffb347', '#ff8fa3', '#fff1c4', '#ffd86b'][i % 4]);
  for (let i = 0; i < 6; i++) { const x = r() * w, y = r() * h; det += `<ellipse cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" rx="${(5 * u).toFixed(1)}" ry="${(3 * u).toFixed(1)}" fill="#9aa4ac"/>`; }
  g += det;
  o += `<g clip-path="url(#${idc})">${g}</g>`;
  // boundary: amber glow + light-green lip
  o += `<g mask="url(#${idm})"><rect width="${w}" height="${h}" fill="#ffc45a" opacity=".65" filter="url(#b4)" style="mix-blend-mode:screen"/></g>`;
  o += `<g mask="url(#${idm})"><rect width="${w}" height="${h}" fill="#e4f7b8" opacity=".55"/></g>`;
  // lantern pool + trail glow
  o += glow(W[0] - 12 * u, W[1] - 4 * u, 150 * u, 100 * u, '#ffc45a', 0.55);
  o += `<path d="M${W[0] + 22 * u} ${W[1] - 18 * u} Q${W[0] + 90 * u} ${W[1] - 24 * u} ${W[0] + 150 * u} ${W[1] - 2 * u}" stroke="#ffb84a" stroke-width="${12 * u}" fill="none" opacity=".18" filter="url(#b4)" style="mix-blend-mode:screen"/>`;
  // entities, sorted by y
  const E = [];
  const sh = (x, y, rx) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${rx * 0.2}" fill="#000" opacity=".35" filter="url(#b2)"/>`;
  for (const [x, y, f] of cfg.fell) E.push([y, sh(x, y, 32 * u * 0.9) + `<g transform="translate(${x},${y}) scale(${(0.675 * u).toFixed(3)})">${wolf({ enemy: true, f })}</g>`]);
  for (const [x, y] of cfg.crawlers) E.push([y, sh(x, y, 22 * u) + `<g transform="translate(${x},${y}) scale(${(0.58 * u).toFixed(3)})">${crawler()}</g>`]);
  for (const [x, y, f] of cfg.ghost) E.push([y, glow(x, y - 12 * u, 46 * u, 30 * u, '#ffc45a', 0.55) + sh(x, y, 30 * u) + `<g transform="translate(${x},${y}) scale(${(0.675 * u).toFixed(3)})">${wolf({ enemy: false, f })}</g>`]);
  for (const [x, y] of cfg.gems) E.push([y, `<g transform="translate(${x},${y}) scale(${(0.3 * u).toFixed(3)})">${gem()}</g>`]);
  E.push([W[1], sh(W[0], W[1] + 1, 24 * u) + `<g transform="translate(${W[0]},${W[1]}) scale(${k.toFixed(4)})">${wren({ view: '3q', dir: -1, leg: 0.5, stride: 8, lean: 4, lanternAngle: 8, scarf: { len: 150, amp: 9, phase: 0.8, sag: 2, ang: Math.PI + 0.16, glow: 1.2, w0: 11.5, w1: 8.5 } })}</g>`]);
  E.sort((a, b) => a[0] - b[0]);
  // spirit threads (ghost wolves back to Wren)
  for (const [x, y] of cfg.ghost) o += `<path d="M${x + 14 * u} ${y - 22 * u} Q${(x + W[0]) / 2} ${y - 40 * u} ${W[0] - 8 * u} ${W[1] - 30 * u}" fill="none" stroke="#ffb84a" stroke-width="${1.1}" stroke-dasharray="1 3.4" stroke-linecap="round" opacity=".9"/>`;
  o += E.map((e) => e[1]).join('');
  for (const [x, y] of cfg.ravens) o += sh(x, y + 34 * u, 14 * u) + `<g transform="translate(${x},${y}) scale(${(0.5 * u).toFixed(3)})">${raven()}</g>`;
  for (const [x, y, t, fs, c, st] of cfg.dmg) o += dmgText(x, y, t, fs * u, c, st);
  o += `<rect width="${w}" height="${h}" fill="url(#${rgU('vg' + w, w / 2, h / 2, Math.max(w, h) * 0.75, [[0.55, '#000', 0], [1, '#10101c', 0.5]])})"/>`;
  return o;
}

export const DESK = { w: 1280, h: 720, u: 1, wren: [730, 392], rest: [[730, 392, 150], [850, 410, 140], [930, 340, 110], [630, 430, 95], [590, 380, 60]],
  fell: [[395, 300, 1], [380, 410, 1], [455, 485, 1], [530, 250, 1], [470, 365, 1]], crawlers: [[400, 520], [440, 215]],
  ghost: [[622, 420, -1], [640, 350, -1]], gems: [[430, 345], [405, 455], [520, 440], [575, 470]], ravens: [[800, 275]],
  dmg: [[490, 322, '124', 21, '#fff4dc', '#9a3a12'], [405, 262, '37', 15, '#e9f3ff', '#3a4a6a'], [350, 372, '12', 13, '#e9f3ff', '#3a4a6a']] };
export const PHONE = { w: 390, h: 844, u: 2 / 3, wren: [232, 470], rest: [[232, 472, 118], [300, 520, 90], [168, 540, 65], [330, 420, 60]],
  fell: [[70, 360, 1], [150, 330, 1], [56, 520, 1], [124, 430, 1]], crawlers: [[62, 640]],
  ghost: [[164, 478, -1], [178, 424, -1]], gems: [[100, 382], [112, 452], [190, 352]], ravens: [[322, 360]],
  dmg: [[150, 302, '124', 21, '#fff4dc', '#9a3a12'], [66, 334, '37', 15, '#e9f3ff', '#3a4a6a']] };

const img = (buf) => 'data:image/png;base64,' + buf.toString('base64');
// nested-svg crop of an image: shows source region (sx,sy,sw,sh) at (x,y) size (w,h); pixelated when magnified
const crop = (src, iw, ih, sx, sy, sw, sh, x, y, w, h, px = true) => `<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="${sx} ${sy} ${sw} ${sh}" preserveAspectRatio="none"><image href="${src}" width="${iw}" height="${ih}"${px ? ' style="image-rendering:pixelated"' : ''}/></svg><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="#ffd98a" stroke-opacity=".5"/>`;

export async function actualPages(c, here, out) {
  const { join } = await import('node:path');
  const dBuf = await c.shot(join(here, 'pass1-desktop.html'), svgPage(1280, 720, gameFrame(1280, 720, 1, DESK)), 1280, 720, 1);
  const pBuf = await c.shot(join(here, 'pass1-phone.html'), svgPage(390, 844, gameFrame(390, 844, PHONE.u, PHONE)), 390, 844, 2);
  const dI = img(dBuf), pI = img(pBuf);
  begin(); use(STYLES.S1);
  let b = bg(1280, 720);
  // row 1
  b += card(8, 100, 636, 300, 'DESKTOP 1280x720, 1:1 pixels', 'Wren about 60 px tall');
  b += crop(dI, 1280, 720, 330, 262, 620, 262, 16, 130, 620, 262, false);
  b += card(654, 100, 406, 300, 'PHONE 390x844 @DPR2, true CSS size', 'about 40 px tall');
  b += crop(pI, 780, 1688, 0, 2 * 292, 780, 524, 662, 130, 390, 262, false);
  // size reference
  b += card(1070, 100, 202, 300, 'SIZE REFERENCE', '1:1');
  b += `<rect x="1080" y="128" width="182" height="264" rx="8" fill="#3d4757"/>`;
  const ref = (px, x, lab) => `<g transform="translate(${x},330) scale(${(px / 112).toFixed(4)})">${wren({ view: '3q', dir: -1, scarf: { len: 120, amp: 8, ang: Math.PI + 0.12, sag: 2, glow: 1, w0: 11.5, w1: 8.5 }, leg: 0.5, lean: 4 })}</g>` + T(lab, x, 372, { s: 10, w: 800, c: '#e8edf3', a: 'middle' });
  b += ref(60, 1120, '60px desktop') + ref(40, 1208, '40px phone');
  b += `<path d="M1080 330 h182" stroke="#fff" stroke-opacity=".25"/>` + T('ground line', 1170, 345, { s: 8.5, c: '#9fb0c2', a: 'middle', w: 600 });
  b += T('same drawing, scaled', 1171, 150, { s: 9.5, c: '#c9d3df', a: 'middle', w: 600 }) + T('only vector shrinks', 1171, 163, { s: 9.5, c: '#c9d3df', a: 'middle', w: 600 });
  // row 2: 3x magnified
  b += card(8, 408, 380, 304, 'DESKTOP Wren 3x (nearest-neighbour)');
  b += crop(dI, 1280, 720, 668, 326, 120, 76, 18, 436, 360, 228);
  b += T('each square = 1 real screen pixel', 198, 686, { s: 10, c: '#9fb0c2', a: 'middle', w: 600 }) + T('(her face is about 12 px wide)', 198, 700, { s: 10, c: '#9fb0c2', a: 'middle', w: 600 });
  b += card(396, 408, 440, 304, 'PHONE Wren 3x (device pixels)', '80 device px = 40 CSS px');
  b += crop(pI, 780, 1688, 380, 855, 140, 90, 406, 436, 420, 270);
  // honest note
  b += card(844, 408, 428, 304, 'HONEST NOTE: WHAT SURVIVES');
  const L = [
    ['SURVIVES (60px)', '#7fd68a'], ['two ear points, amber scarf streak, lantern glow dot,', '#d3dce6'], ['teal hood against grey ground, wolf-ear + round head shape.', '#d3dce6'],
    ['SURVIVES (40px)', '#7fd68a'], ['ears as two bumps, ~25px amber streak, 3px flame dot with', '#d3dce6'], ['its halo. The streak is the tell. Hood loses contrast on green.', '#d3dce6'],
    ['DOES NOT SURVIVE', '#ff9a8a'], ['expressions, brows, mouth, blush, eye highlights; tinted', '#d3dce6'], ['outline (reads as a soft edge); rim light; knit stripes;', '#d3dce6'], ['folded ear and darned patch; whistle, belt, paw patch, fringe.', '#d3dce6'],
    ['SO', '#ffd98a'], ['Design by silhouette; bake sprites at 4x and mip-downscale;', '#d3dce6'], ['widen scarf +25% and brighten lantern halo for small zoom;', '#d3dce6'], ['show faces/expressions only in UI portraits and level-ups.', '#d3dce6'],
  ];
  L.forEach(([t, col], i) => { b += T(t, 858, 452 + i * 17.4, { s: /^[A-Z ()0-9px]+$/.test(t) ? 11 : 10.6, c: col, w: /^[A-Z ()0-9px]+$/.test(t) ? 900 : 500, f: /^[A-Z ()0-9px]+$/.test(t) ? FONT.mono : undefined }); });
  b += [['TRUE SCALE: game camera 640x360 logical, shown 2x on a 1280x720 window = Wren about 60px;', '#d3dce6'], ['zoomed out to about 40px on a 390px-wide phone. The mock-up scenes draw her 170px,', '#d3dce6'], ['which is 2.5-4x too large. Below is the honest view: real renders (desktop DPR1, phone', '#ffd98a'], ['390x844 CSS at DPR2), plus nearest-neighbour 3x zooms of one pixel = one real pixel.', '#d3dce6']].map(([t, c], i) => T(t, 716, 22 + i * 16, { s: 10.5, c, w: 600 })).join('');
  b += banner();
  await out('wren-actual-size', svgPage(1280, 720, b));
}
