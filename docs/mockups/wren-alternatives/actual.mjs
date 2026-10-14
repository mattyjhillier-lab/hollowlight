// Actual in-game size panel per take: real renders (desktop 1280x720 @DPR1, phone 390x844 @DPR2) in a battle context, 1:1 and 3x. Mock-up only.
// gameFrame is a copy of ../wren-sheet/actual.mjs gameFrame with the Wren drawer injected (that file is untouched).
import { begin, use, T, FONT, glow, lgU, rgU, rnd, nid, addDef, wolf, raven, crawler, gem } from '../style-lab/lab.mjs';
import { STYLES, tuft, flower, blade } from '../style-lab/scene.mjs';
import { wren as wrenV1 } from '../wren-sheet/wren.mjs';
import { DESK, PHONE } from '../wren-sheet/actual.mjs';
import { svgPage, bg, card } from '../wren-sheet/common.mjs';
import { TAKES } from './takes.mjs';
import { banner } from './sheet.mjs';

const WK = 60 / 112; // same unit scale for every take: 112 design units = 60px desktop; taller/shorter takes are honestly taller/shorter

function blobs(list, seed) {
  const r = rnd(seed), out = [];
  for (const [x, y, rr] of list) { out.push([x, y, rr]); for (let i = 0; i < 9; i++) { const a = (i / 9) * 6.283 + r(), d = rr * (0.8 + r() * 0.3); out.push([x + Math.cos(a) * d, y + Math.sin(a) * d * 0.9, rr * (0.2 + r() * 0.16)]); } }
  return out;
}
const dmgText = (x, y, t, fs, c = '#fff4dc', st = '#9a3a12') => `<text x="${x}" y="${y}" font-family="'Segoe UI Black','Arial Black',sans-serif" font-size="${fs}" font-weight="900" text-anchor="middle" fill="${c}" stroke="${st}" stroke-width="${fs * 0.2}" stroke-linejoin="round" paint-order="stroke" transform="rotate(-6 ${x} ${y})">${t}</text>`;

export function gameFrame(w, h, u, cfg, drawWren) {
  begin(); use(STYLES.S1);
  const r = rnd(cfg.seed || 5), k = WK * u, W = cfg.wren;
  const rest = blobs(cfg.rest, 21);
  const idc = nid('rc'), idm = nid('rm');
  addDef(`<clipPath id="${idc}">${rest.map(([x, y, rr]) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${rr.toFixed(1)}"/>`).join('')}</clipPath>`);
  addDef(`<mask id="${idm}" maskUnits="userSpaceOnUse" x="0" y="0" width="${w}" height="${h}"><rect width="${w}" height="${h}" fill="#000"/>${rest.map(([x, y, rr]) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(rr + 5 * u).toFixed(1)}" fill="#fff"/>`).join('')}${rest.map(([x, y, rr]) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(rr - 1.5 * u).toFixed(1)}" fill="#000"/>`).join('')}</mask>`);
  let o = '';
  o += `<rect width="${w}" height="${h}" fill="url(#${lgU('hg' + w, 0, 0, 0, h, [[0, '#5d6a7a'], [0.5, '#4a5565'], [1, '#3a4452']])})"/><rect width="${w}" height="${h}" filter="url(#mottle)" opacity=".5"/>`;
  let hv = '';
  for (let i = 0; i < Math.round(w * h / 22000); i++) { const x = r() * w, y = r() * h; let d = `M${x} ${y}`, px = x, py = y, a = r() * 6.28; for (let q = 0; q < 5; q++) { a += (r() - 0.5) * 1.3; px += Math.cos(a) * 14 * u; py += Math.sin(a) * 8 * u; d += ` L${px.toFixed(0)} ${py.toFixed(0)}`; } hv += `<path d="${d}" fill="none" stroke="#150f1c" stroke-width="${(1.1 + r() * 0.9) * Math.max(u, 0.7)}" stroke-linecap="round" opacity=".5"/>`; }
  o += hv;
  let ht = '';
  for (let i = 0; i < Math.round(w * h / 1700); i++) { const x = r() * w, y = r() * h, c = i % 2 ? '#6a7686' : '#7d8a9a'; ht += `<path d="${blade(x, y, 3 + r() * 5, (r() - 0.5) * 5, 0.9)}" fill="${c}"/><path d="${blade(x + 1.6, y + 0.4, 2.5 + r() * 4, (r() - 0.5) * 5, 0.8)}" fill="${c}"/>`; }
  o += ht;
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
  o += `<g mask="url(#${idm})"><rect width="${w}" height="${h}" fill="#ffc45a" opacity=".65" filter="url(#b4)" style="mix-blend-mode:screen"/></g>`;
  o += `<g mask="url(#${idm})"><rect width="${w}" height="${h}" fill="#e4f7b8" opacity=".55"/></g>`;
  o += glow(W[0] - 12 * u, W[1] - 4 * u, 150 * u, 100 * u, '#ffc45a', 0.55);
  const E = [];
  const sh = (x, y, rx) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${rx * 0.2}" fill="#000" opacity=".35" filter="url(#b2)"/>`;
  for (const [x, y, f] of cfg.fell) E.push([y, sh(x, y, 32 * u * 0.9) + `<g transform="translate(${x},${y}) scale(${(0.675 * u).toFixed(3)})">${wolf({ enemy: true, f })}</g>`]);
  for (const [x, y] of cfg.crawlers) E.push([y, sh(x, y, 22 * u) + `<g transform="translate(${x},${y}) scale(${(0.58 * u).toFixed(3)})">${crawler()}</g>`]);
  for (const [x, y, f] of cfg.ghost) E.push([y, glow(x, y - 12 * u, 46 * u, 30 * u, '#ffc45a', 0.55) + sh(x, y, 30 * u) + `<g transform="translate(${x},${y}) scale(${(0.675 * u).toFixed(3)})">${wolf({ enemy: false, f })}</g>`]);
  for (const [x, y] of cfg.gems) E.push([y, `<g transform="translate(${x},${y}) scale(${(0.3 * u).toFixed(3)})">${gem()}</g>`]);
  E.push([W[1], sh(W[0], W[1] + 1, 24 * u) + `<g transform="translate(${W[0]},${W[1]}) scale(${k.toFixed(4)})">${drawWren()}</g>`]);
  E.sort((a, b) => a[0] - b[0]);
  for (const [x, y] of cfg.ghost) o += `<path d="M${x + 14 * u} ${y - 22 * u} Q${(x + W[0]) / 2} ${y - 40 * u} ${W[0] - 8 * u} ${W[1] - 30 * u}" fill="none" stroke="#ffb84a" stroke-width="${1.1}" stroke-dasharray="1 3.4" stroke-linecap="round" opacity=".9"/>`;
  o += E.map((e) => e[1]).join('');
  for (const [x, y] of cfg.ravens) o += sh(x, y + 34 * u, 14 * u) + `<g transform="translate(${x},${y}) scale(${(0.5 * u).toFixed(3)})">${raven()}</g>`;
  for (const [x, y, t, fs, c, st] of cfg.dmg) o += dmgText(x, y, t, fs * u, c, st);
  o += `<rect width="${w}" height="${h}" fill="url(#${rgU('vg' + w, w / 2, h / 2, Math.max(w, h) * 0.75, [[0.55, '#000', 0], [1, '#10101c', 0.5]])})"/>`;
  return o;
}

const V1 = { id: 'V1', name: 'v1 (current)', H: 112, fn: () => wrenV1({ view: '3q', dir: -1, leg: 0.5, stride: 8, lean: 4, lanternAngle: 8, scarf: { len: 150, amp: 9, phase: 0.8, sag: 2, ang: Math.PI + 0.16, glow: 1.2, w0: 11.5, w1: 8.5 } }) };
export const ALL = { V1, ...TAKES };
const runPose = (id) => (id === 'V1' ? V1.fn() : ALL[id].fn({ view: '3q', dir: -1, run: true }));
const cache = new Map();
export async function renderFrames(c, here, id) {
  if (cache.has(id)) return cache.get(id);
  const { join } = await import('node:path');
  const d = await c.shot(join(here, `pass1-${id}-d.html`), svgPage(1280, 720, gameFrame(1280, 720, 1, DESK, () => runPose(id))), 1280, 720, 1);
  const p = await c.shot(join(here, `pass1-${id}-p.html`), svgPage(390, 844, gameFrame(390, 844, PHONE.u, PHONE, () => runPose(id))), 390, 844, 2);
  const r = [d, p]; cache.set(id, r); return r;
}
export const img = (buf) => 'data:image/png;base64,' + buf.toString('base64');
export const crop = (src, iw, ih, sx, sy, sw, sh, x, y, w, h, px = true) => `<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="${sx} ${sy} ${sw} ${sh}" preserveAspectRatio="none"><image href="${src}" width="${iw}" height="${ih}"${px ? ' style="image-rendering:pixelated"' : ''}/></svg><rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="#ffd98a" stroke-opacity=".5"/>`;

const NOTES = {
  A: [['SURVIVES (60px)', '#7fd68a'], ['tall bell coat, ear points, amber scarf, and the lantern', ''], ['glowing on a pole beside her head (no other hero has one).', ''], ['SURVIVES (40px)', '#7fd68a'], ['pole + warm dot, coat bell, scarf streak. The dot-on-a-stick', ''], ['is the tell; ears shrink to bumps.', ''], ['DOES NOT SURVIVE', '#ff9a8a'], ['face detail, expressions, patches, stitching, knit rows,', ''], ['floppy ear, staff grain. Pole thins to ~2px at 40px.', ''], ['SO', '#ffd98a'], ['Make the staff 25% thicker and the lantern halo bigger;', ''], ['she is about 20% taller than v1 (a hit-box / scale decision).', '']],
  B: [['SURVIVES (60px)', '#7fd68a'], ['round blob, huge amber collar, pale pup bump, hat ears.', ''], ['Reads as the smallest, cosiest thing on screen.', ''], ['SURVIVES (40px)', '#7fd68a'], ['amber ball + pale glow dot on the shoulder. Scarf tail', ''], ['is a short fat streak, not a 2x-body line (weaker streak).', ''], ['DOES NOT SURVIVE', '#ff9a8a'], ['pup face, mitten stripes, beanie ribbing, bobbles, jar,', ''], ['expressions. The pup becomes a light smudge at 40px.', ''], ['SO', '#ffd98a'], ['Smallest hero: easiest to lose in a swarm. Needs a bright', ''], ['halo + outline boost; pup glow must stay on to read.', '']],
  C: [['SURVIVES (60px)', '#7fd68a'], ['pale wolf-head over a dark body, ears, pelt tail, ember dot.', ''], ['Most unique silhouette of the set.', ''], ['SURVIVES (40px)', '#7fd68a'], ['wolf-muzzle head + dark cloak + floating ember. Reads as', ''], ['"small wolf-person"; amber glints are lost, face is a dot.', ''], ['DOES NOT SURVIVE', '#ff9a8a'], ['glints, expressions, paw stitching, fur zig-zags, hand', ''], ['threads. Pale pelt can blend with the ghost wolves.', ''], ['SO', '#ffd98a'], ['Risk: confusable with a wolf at a glance. Keep the dark body', ''], ['and the ember beside her; ghost wolves stay cream-amber.', '']],
};

export async function actualPage(c, here, out, id) {
  const [dBuf, pBuf] = await renderFrames(c, here, id), dI = img(dBuf), pI = img(pBuf), t = ALL[id];
  begin(); use(STYLES.S1);
  let b = bg(1280, 720);
  b += card(8, 100, 636, 300, 'DESKTOP 1280x720, 1:1 pixels', 'Wren about 60 px tall');
  b += crop(dI, 1280, 720, 330, 262, 620, 262, 16, 130, 620, 262, false);
  b += card(654, 100, 406, 300, 'PHONE 390x844 @DPR2, true CSS size', 'about 40 px tall');
  b += crop(pI, 780, 1688, 0, 2 * 292, 780, 524, 662, 130, 390, 262, false);
  b += card(1070, 100, 202, 300, 'SIZE REFERENCE', '1:1');
  b += `<rect x="1080" y="128" width="182" height="264" rx="8" fill="#3d4757"/>`;
  const ref = (px, x, lab) => `<g transform="translate(${x},330) scale(${(px / 112).toFixed(4)})">${runPose(id)}</g>` + T(lab, x, 372, { s: 10, w: 800, c: '#e8edf3', a: 'middle' });
  b += ref(60, 1124, '60px desktop') + ref(40, 1212, '40px phone') + `<path d="M1080 330 h182" stroke="#fff" stroke-opacity=".25"/>`;
  b += T('same drawing, scaled', 1171, 150, { s: 9.5, c: '#c9d3df', a: 'middle', w: 600 }) + T('(112 units = 60px)', 1171, 163, { s: 9.5, c: '#c9d3df', a: 'middle', w: 600 });
  b += card(8, 408, 380, 304, 'DESKTOP Wren 3x (nearest-neighbour)');
  b += crop(dI, 1280, 720, 730 - 62, 392 - 82, 120, 76, 18, 436, 360, 228);
  b += T('each square = 1 real screen pixel', 198, 686, { s: 10, c: '#9fb0c2', a: 'middle', w: 600 });
  b += card(396, 408, 440, 304, 'PHONE Wren 3x (device pixels)', '80 device px = 40 CSS px');
  b += crop(pI, 780, 1688, 2 * 232 - 68, 2 * 470 - 84, 140, 90, 406, 436, 420, 270);
  b += card(844, 408, 428, 304, 'HONEST NOTE: WHAT SURVIVES');
  NOTES[id].forEach(([tx, col], i) => { const hd = col !== ''; b += T(tx, 858, 452 + i * 17.4, { s: hd ? 11 : 10.6, c: hd ? col : '#d3dce6', w: hd ? 900 : 500, f: hd ? FONT.mono : undefined }); });
  b += [['TRUE SCALE: camera 640x360 shown 2x on 1280x720 = about 60px for a 112-unit figure; about 40px on a', '#d3dce6'], ['390px phone. Scene = 2 ghost wolves + amber threads, raven, 5 Fell Wolves, root crawlers, gems,', '#d3dce6'], ['damage numbers, hollow/restored boundary. Same frame as v1; only the Wren drawing changes.', '#ffd98a'], [`Take ${id} stands ${Math.round(t.H * 60 / 112)}px tall on desktop (${Math.round(t.H * 40 / 112)}px phone) incl. staff/ears.`, '#d3dce6']].map(([tx, col], i) => T(tx, 716, 22 + i * 16, { s: 10, c: col, w: 600 })).join('');
  b += banner(id);
  await out(`wren-${id.toLowerCase()}-actual-size`, svgPage(1280, 720, b));
}
