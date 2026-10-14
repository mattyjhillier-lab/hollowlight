// wren-compare.png: v1 + A + B + C side by side, big and at actual size. Mock-up only.
import { begin, use, T, FONT } from '../style-lab/lab.mjs';
import { STYLES } from '../style-lab/scene.mjs';
import { wren as wrenV1 } from '../wren-sheet/wren.mjs';
import { svgPage, bg, card, stage, shadow } from '../wren-sheet/common.mjs';
import { TAKES } from './takes.mjs';
import { ALL, renderFrames, img, crop } from './actual.mjs';

const COLS = [
  { id: 'V1', name: 'v1 (current)', sub: 'teal hood, scarf streak', draw: () => wrenV1({ view: '3q', scarf: { len: 46, amp: 5, sag: 3, glow: 1 }, lantern: true }), pro: 'PRO: proven scarf-streak tell, cute round head', con: 'CON: visor face, strap scarf, tiny generic body' },
  { id: 'A', name: 'A  LANTERN KEEPER', sub: 'tall, coat, staff lantern', draw: () => TAKES.A.fn({ view: '3q' }), pro: 'PRO: open face, tallest read, lantern + coat + knit', con: 'CON: tallest (scale/hit-box), lantern at ear height' },
  { id: 'B', name: 'B  PACK PUP WREN', sub: 'round, big scarf, pup', draw: () => TAKES.B.fn({ view: '3q' }), pro: 'PRO: cutest, pup = emotion, easy face, soft knit', con: 'CON: smallest, weak 40px streak, pup is a smudge' },
  { id: 'C', name: 'C  PELT WALKER', sub: 'wolf-head hood, ember', draw: () => TAKES.C.fn({ view: '3q' }), pro: 'PRO: most unique, pack made visible, eerie-tender', con: 'CON: wolf-like at a glance, face hidden, off-bible' },
];

export async function comparePage(c, here, out) {
  const frames = {}; for (const col of COLS) frames[col.id] = await renderFrames(c, here, col.id);
  begin(); use(STYLES.S1);
  let b = bg(1280, 720);
  b += `<rect width="1280" height="54" fill="#07090d" opacity=".95"/><rect y="54" width="1280" height="3" fill="#ffb84a"/>` + T('WREN COMPARE: v1 + TAKES A / B / C', 14, 32, { s: 25, f: FONT.title, w: 900 }) + T('same style (Hollowlight Style v1), same unit scale (112 units = 60px desktop), same battle frame; big view then true size', 560, 30, { s: 10.5, f: FONT.mono, c: '#ffd98a', w: 700 });
  b += card(8, 62, 1264, 332, 'BIG VIEW (same scale, so height differences are real)');
  COLS.forEach((col, i) => {
    const cx = 168 + i * 315, base = 290, k = 1.58;
    b += stage(cx, base, 74, 15, i + 31) + shadow(cx, base + 2, 42) + `<g transform="translate(${cx},${base}) scale(${k})">${col.draw()}</g>`;
    b += T(col.name, cx, 322, { s: 13, f: FONT.title, w: 900, c: '#ffd98a', a: 'middle', ls: 0.5 }) + T(col.pro, cx, 344, { s: 10, c: '#9fe0a8', w: 600, a: 'middle' }) + T(col.con, cx, 360, { s: 10, c: '#ffa99a', w: 600, a: 'middle' }) + T(col.sub, cx, 376, { s: 9.5, c: '#9fb0c2', w: 600, a: 'middle' });
  });
  b += card(8, 400, 1264, 312, 'ACTUAL SIZE', 'top row: desktop 60px, 1:1 screen px | bottom row: phone 40px, device px at DPR2');
  COLS.forEach((col, i) => {
    const x = 20 + i * 315, [d, p] = frames[col.id], dI = img(d), pI = img(p);
    b += crop(dI, 1280, 720, 590, 318, 296, 124, x, 432, 296, 124, false) + T(col.id === 'V1' ? 'v1' : 'TAKE ' + col.id, x + 6, 448, { s: 11, f: FONT.mono, w: 900, c: '#fff', st: '#000', sw: 3 });
    b += crop(pI, 780, 1688, 2 * 232 - 120, 2 * 470 - 118, 296, 124, x, 564, 296, 124, false);
  });
  b += T('Pale hood/pelt vs grass, amber streak, dots of light: judge which one you can find in the crowd.', 20, 704, { s: 10.5, c: '#d3dce6', w: 600 });
  await out('wren-compare', svgPage(1280, 720, b));
}
