// elias-compare.png: Wren v2 (reference) + Elias takes A / B / C at the same scale (big), real-size crops of the battle frames (desktop 60px 1:1, phone 40px CSS 1:1) and black silhouettes at 60/40px.
// The battle frames are rendered by actual.mjs (cached in the OS temp dir); if missing they are rendered here.
import { join } from 'node:path';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { begin, use, T, FONT, glow } from '../style-lab/lab.mjs';
import { STYLES } from '../style-lab/scene.mjs';
import { DESK, PHONE } from '../wren-sheet/actual.mjs';
import { svgPage, bg, card, stage, shadow } from '../wren-sheet/common.mjs';
import { gameFrame, img, crop } from '../wren-alternatives/actual.mjs';
import { wren2 } from '../wren-v2/wren2.mjs';
import { TAKES } from './elias.mjs';
import { pair } from './actual.mjs';

const COL = {
  W: { name: 'WREN v2 (reference)', pro: 'the approved quality bar: pelt hood + ember + pup', con: 'pointed, low, pale: what Elias must NOT be' },
  A: { name: 'A KEEPER OF THE WHEEL', pro: 'closest to the bible; halo = the wheel; clear priest read', con: 'wizard-ish beard; spiky halo at 40px; busiest face' },
  B: { name: 'B THE LAMPLIGHTER', pro: 'most personality; spade plants the wheel; best light dot', con: 'tallest; thin pole at 40px; coat detail is lost' },
  C: { name: 'C THE WAX SAINT', pro: 'boldest, simplest shape; flame = health; best 40px read', con: 'cute before sad; no priest cue; pink near damage orange' },
};
const wrenBig = (o = {}) => wren2({ view: '3q', pup: { x: -46, y: 6, view: '3q', pose: 'sit', expr: 'open', thread: true }, ...o });

export async function comparePage(c, tmp, out) {
  const frames = {};
  for (const id of ['A', 'B', 'C']) {
    const fd = join(tmp, `elias-frame-${id}-d.png`), fp = join(tmp, `elias-frame-${id}-p.png`);
    if (!existsSync(fd) || !existsSync(fp)) {
      writeFileSync(fd, await c.shot(join(tmp, `elias-pass-${id}-d.html`), svgPage(1280, 720, gameFrame(1280, 720, 1, DESK, pair(id))), 1280, 720, 1));
      writeFileSync(fp, await c.shot(join(tmp, `elias-pass-${id}-p.html`), svgPage(390, 844, gameFrame(390, 844, PHONE.u, PHONE, pair(id))), 390, 844, 2));
    }
    frames[id] = [img(readFileSync(fd)), img(readFileSync(fp))];
  }
  begin(); use(STYLES.S1);
  let b = bg(1280, 720);
  b += `<rect width="1280" height="58" fill="#07090d" opacity=".95"/><rect y="58" width="1280" height="3" fill="#ffb84a"/>` + T('ELIAS COMPARE: TAKES A / B / C vs WREN v2', 12, 30, { s: 25, f: FONT.title, w: 900 }) + T('same style (Hollowlight Style v1), same unit scale (112 units = 60px desktop), same battle frame; big view, then true size, then black shapes', 12, 48, { s: 10, f: FONT.mono, c: '#ffd98a', w: 700 });
  // ---------- big view ----------
  b += card(8, 66, 1264, 270, 'BIG VIEW (same scale, so height differences are real)', 'one line of PRO / CON each');
  const k = 1.3, base = 264, ids = ['W', 'A', 'B', 'C'];
  ids.forEach((id, i) => {
    const cx = 166 + i * 316 - (id === 'B' ? 22 : 0), I = COL[id];
    b += stage(cx + (id === 'B' ? 22 : 0), base, 100, 15, 5 + i) + shadow(cx, base + 2, 44);
    b += `<g transform="translate(${cx},${base}) scale(${k})">${id === 'W' ? wrenBig() : TAKES[id].fn({ view: '3q' })}</g>`;
    const tx = 166 + i * 316;
    b += T(I.name, tx, 292, { s: 12.5, f: FONT.title, w: 900, c: '#ffd98a', a: 'middle', ls: 0.6 });
    b += T('PRO: ' + I.pro, tx, 307, { s: 9.4, c: '#8fe0a0', a: 'middle', w: 600 }) + T('CON: ' + I.con, tx, 320, { s: 9.4, c: '#ffab9c', a: 'middle', w: 600 });
  });
  // ---------- actual size ----------
  b += card(8, 342, 1264, 370, 'ACTUAL SIZE (each crop is 1:1 true pixels; Elias walks beside Wren v2, ghost wolves on the left)', 'top: desktop 60px | bottom: phone 40px (CSS px)');
  const xs = [16, 324, 632];
  ['A', 'B', 'C'].forEach((id, i) => {
    const [dI, pI] = frames[id], x = xs[i];
    b += crop(dI, 1280, 720, 620, 282, 300, 150, x, 372, 300, 150, false);
    b += T(`TAKE ${id} desktop`, x + 6, 386, { s: 10, c: '#fff', w: 900, st: '#07090d', sw: 3 });
    b += crop(pI, 780, 1688, 164, 760, 600, 300, x, 540, 300, 150, false);
    b += T(`TAKE ${id} phone`, x + 6, 554, { s: 10, c: '#fff', w: 900, st: '#07090d', sw: 3 });
  });
  b += T('Wren v2 (left, with pup) is the same in every crop: the new hero must stand apart from her at a glance.', 16, 704, { s: 10, c: '#ffd98a', w: 700 });
  // ---------- silhouettes ----------
  b += `<rect x="944" y="368" width="320" height="332" rx="10" fill="#1d2733" stroke="#33414f"/>` + T('BLACK SHAPES, true size', 1104, 388, { s: 12, f: FONT.title, w: 900, c: '#ffd98a', a: 'middle', ls: 0.8 });
  b += `<rect x="954" y="398" width="300" height="140" rx="8" fill="#d9e1e8"/><rect x="954" y="546" width="300" height="102" rx="8" fill="#d9e1e8"/>`;
  const sil = (id, kk, x, y) => `<g transform="translate(${x},${y}) scale(${kk})">${id === 'W' ? wren2({ view: '3q', sil: true, run: true, pup: { x: -78, y: 0, view: 'side', pose: 'run', ph: 1.2, bob: -2, thread: false } }) : TAKES[id].fn({ view: '3q', sil: true, run: true })}</g>`;
  ids.forEach((id, i) => { const x = 1010 + i * 72; b += sil(id, 0.536, x, 506) + T(id === 'W' ? 'Wren' : id, x, 526, { s: 10, c: '#334', w: 900, a: 'middle' }); b += sil(id, 0.357, x, 622) + T(id === 'W' ? 'Wren' : id, x, 638, { s: 10, c: '#334', w: 900, a: 'middle' }); });
  b += T('60px desktop', 960, 412, { s: 9.5, c: '#445', w: 800 }) + T('40px phone', 960, 560, { s: 9.5, c: '#445', w: 800 });
  b += T('Wren = pointed low wolf + pup bump.', 1104, 668, { s: 9.4, c: '#d3dce6', a: 'middle', w: 600 }) + T('A = bell + spiked ring, B = block + pole,', 1104, 681, { s: 9.4, c: '#d3dce6', a: 'middle', w: 600 }) + T('C = round column + flame: all four differ.', 1104, 694, { s: 9.4, c: '#d3dce6', a: 'middle', w: 600 });
  await out('elias-compare', svgPage(1280, 720, b));
}
