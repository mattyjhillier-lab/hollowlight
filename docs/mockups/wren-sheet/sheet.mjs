// wren-sheet.png: turnaround, expressions, props, silhouettes, colour callouts. Mock-up only.
import { begin, use, T, FONT, glow, nid, addDef } from '../style-lab/lab.mjs';
import { STYLES } from '../style-lab/scene.mjs';
import { wren, lanternSvg, scarfTrail, SWATCHES, PAL } from './wren.mjs';
import { svgPage, bg, banner, card, stage, shadow, note } from './common.mjs';

const clipRect = (x, y, w, h) => { const id = nid('cr'); addDef(`<clipPath id="${id}"><rect x="${x}" y="${y}" width="${w}" height="${h}"/></clipPath>`); return id; };
const lbl = (s, x, y, o = {}) => T(s, x, y, { s: o.s || 11.5, c: o.c || '#e8edf3', w: 800, a: 'middle', f: FONT.ui, ls: 1 });

export function sheetPage() {
  begin(); use(STYLES.S1);
  let b = bg(1280, 720);

  // ---- A: turnaround ----
  b += card(8, 98, 664, 292, 'TURNAROUND', 'ears + scarf + lantern read from every side');
  const views = [['front', 'FRONT'], ['3q', '3/4'], ['side', 'SIDE'], ['back', 'BACK']];
  const k = 1.62, base = 362;
  views.forEach(([v, name], i) => {
    const cx = 86 + i * 166;
    b += stage(cx, base, 64, 14, i + 11) + shadow(cx, base + 2, 36);
    b += `<g transform="translate(${cx},${base}) scale(${k})">${wren({ view: v, scarf: { len: 46, amp: 5, sag: 3, glow: 1 }, lantern: true })}</g>`;
    b += lbl(name, cx, 384);
  });
  // numbered colour dots on the front view (positions in figure space)
  const dots = [[1, -24, -76], [2, 12, -20], [3, -19, -52], [4, 26, -34], [6, -33, -12], [7, -37, -22], [8, 8, -56], [9, -10, -70], [10, 7, -4], [11, 11, -14]];
  for (const [n, x, y] of dots) { const px = 86 + x * k, py = base + y * k; b += `<circle cx="${px}" cy="${py}" r="7.2" fill="#0b1016" stroke="#ffd98a" stroke-width="1.4"/>` + T(String(n), px, py + 3.6, { s: 9.5, c: '#ffd98a', w: 900, a: 'middle', f: FONT.mono }); }

  // ---- B: expressions ----
  b += card(708, 8, 564, 140, 'EXPRESSIONS (eyes, brows, mouth)');
  const ex = [['neutral', 'NEUTRAL'], ['determined', 'DETERMINED'], ['worried', 'WORRIED'], ['smile', 'SMALL SMILE'], ['hurt', 'HURT']];
  ex.forEach(([e, name], i) => {
    const cx = 772 + i * 113, kk = 0.92, cid = clipRect(-50, -122, 100, 98);
    b += glow(cx, 84, 56, 40, '#ffc45a', 0.16);
    b += `<g transform="translate(${cx},127) scale(${kk})"><g clip-path="url(#${cid})">${wren({ view: 'front', expr: e, lantern: false, noTrail: true })}</g></g>`;
    b += lbl(name, cx, 142, { s: 9.2 });
  });

  // ---- C: key props ----
  b += card(680, 152, 592, 238, 'KEY PROPS', 'each is its own layer / sprite');
  const tiles = ['LANTERN', 'AMBER SCARF', 'WOLF-EAR HOOD', 'BOOTS'];
  tiles.forEach((t, i) => { const x = 690 + i * 144; b += `<rect x="${x}" y="176" width="136" height="168" rx="10" fill="#1d2733" stroke="#33414f"/>` + lbl(t, x + 68, 358, { s: 10.5 }); });
  // lantern
  b += glow(758, 262, 62, 62, '#ffc96b', 0.8) + `<g transform="translate(758,214) scale(3.3)">${lanternSvg(0, 0, 0, 0, false)}</g>`;
  // scarf
  b += `<g transform="translate(842,250) scale(1.45)">${scarfTrail({ sx: 0, sy: 0, ang: 0.12, len: 76, amp: 8, phase: 0.6, sag: 6, glow: 1.1 }, false)}</g>`;
  b += `<g transform="translate(842,296) scale(1.45)">${scarfTrail({ sx: 0, sy: 0, ang: 0.0, len: 76, amp: 0, phase: 0, sag: 0, w0: 10, w1: 10 }, false)}</g>`;
  // hood
  { const cid = clipRect(-48, -122, 96, 88); b += `<g transform="translate(1046,262) scale(1.6) translate(0,76)"><g clip-path="url(#${cid})">${wren({ view: '3q', expr: 'neutral', lantern: false, noTrail: true })}</g></g>`; }
  // boots
  { const cid = clipRect(-21, -14, 42, 17); b += shadow(1190, 332, 34) + `<g transform="translate(1190,330) scale(3.2)"><g clip-path="url(#${cid})">${wren({ view: 'front', lantern: false, noTrail: true })}</g></g>`; }
  const tn = [['brass cage, one flame:', 'her only warm light'], ['3 knit bands, frayed tip,', 'about 2x body when running'], ['ears folded + darned', 'with amber thread'], ['rolled fur cuffs,', 'round, soft toes']];
  tn.forEach((l, i) => { b += T(l[0], 758 + i * 144 - 68 + 68, 370, { s: 8.6, c: '#aebccb', w: 600, a: 'middle' }) + T(l[1], 758 + i * 144 - 68 + 68, 381, { s: 8.6, c: '#aebccb', w: 600, a: 'middle' }); });

  // ---- D: silhouettes ----
  b += card(8, 396, 664, 190, 'SILHOUETTES (black fill)', 'if it reads black, it reads at 40px');
  b += `<rect x="18" y="420" width="640" height="158" rx="8" fill="#d9e1e8"/>`;
  views.forEach(([v], i) => { const cx = 72 + i * 84; b += `<g transform="translate(${cx},566) scale(1.0)">${wren({ view: v, sil: true, scarf: { len: 40, amp: 4, sag: 3 } })}</g>`; });
  // running silhouette: long scarf + lantern swing
  b += `<g transform="translate(495,566) scale(1.08)">${wren({ view: 'side', sil: true, leg: 0.8, lean: 5, scarf: { len: 105, amp: 9, sag: 2, ang: Math.PI + 0.2 }, lanternAngle: -12 })}</g>`;
  // in-game sizes
  b += `<g transform="translate(572,566) scale(0.536)">${wren({ view: 'side', sil: true, leg: 0.8, lean: 5, scarf: { len: 105, amp: 9, sag: 2, ang: Math.PI + 0.2 }, lanternAngle: -12 })}</g>`;
  b += `<g transform="translate(626,566) scale(0.357)">${wren({ view: 'side', sil: true, leg: 0.8, lean: 5, scarf: { len: 105, amp: 9, sag: 2, ang: Math.PI + 0.2 }, lanternAngle: -12 })}</g>`;
  b += T('RUN', 495, 438, { s: 10, c: '#445', w: 800, a: 'middle' }) + T('60px', 572, 438, { s: 10, c: '#445', w: 800, a: 'middle' }) + T('40px', 626, 438, { s: 10, c: '#445', w: 800, a: 'middle' });
  b += T('front / 3/4 / side / back', 150, 438, { s: 10, c: '#445', w: 800, a: 'start' });

  // ---- E: colour callouts ----
  b += card(680, 396, 592, 190, 'COLOUR CALLOUTS (hex)', 'numbers match the dots on the front view');
  SWATCHES.forEach(([n, c], i) => {
    const col = i % 3, row = Math.floor(i / 3), x = 692 + col * 194, y = 426 + row * 39;
    b += `<rect x="${x}" y="${y}" width="186" height="35" rx="8" fill="#1d2733" stroke="#33414f"/><circle cx="${x + 20}" cy="${y + 18}" r="12.5" fill="${c}" stroke="#fff" stroke-opacity=".8" stroke-width="1.8"/>` + T(String(i + 1), x + 20, y + 22, { s: 10.5, w: 900, a: 'middle', c: '#10202a', f: FONT.mono }) + T(n, x + 40, y + 15, { s: 11, w: 800, c: '#fff' }) + T(c, x + 40, y + 29, { s: 11, f: FONT.mono, c: '#ffd98a', w: 700 });
  });

  // ---- F: legend strip ----
  b += card(8, 594, 1264, 118, 'CODE LEGEND + WHY SHE READS');
  const leg = [['L2', 'tinted outline: each fill gets its own darker shade, never black'], ['H2', 'soft 3-stop gradient + rim light, no hard cel shadow'], ['P1', 'chibi: head about 55% of her height, round and small'], ['W2', 'painted ground: grass tufts, flowers, pebbles'], ['G1+G2', 'lantern pool at her feet + long glow trails (scarf, lantern, wolves)']];
  leg.forEach(([c, t], i) => { b += T(c, 22, 628 + i * 15.5, { s: 11, f: FONT.mono, c: '#ffd98a', w: 900 }) + T(t, 78, 628 + i * 15.5, { s: 11, c: '#dfe7ef', w: 500 }); });
  const why = [['1 EARS', 'two pointed wolf ears, one folded: the only pointy-topped hero'], ['2 SCARF', 'one long amber streak, about 2x body length when running'], ['3 LANTERN', 'a warm dot low on one side, with a glow pool'], ['MOOD', 'P1 Warm Lantern: cosy gold on cool grey-blue; tender, quiet, a bit sad']];
  why.forEach(([c, t], i) => { b += T(c, 470, 628 + i * 15.5, { s: 11, f: FONT.mono, c: '#ffb84a', w: 900 }) + T(t, 548, 628 + i * 15.5, { s: 11, c: '#dfe7ef', w: 500 }); });
  b += banner();
  return svgPage(1280, 720, b);
}
