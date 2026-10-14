// wren-v2-sheet.png: turnaround, 5 expression/glint states, key props, black silhouettes (60px/40px), hex callouts, pup turnaround + states. Mock-up only.
import { begin, use, T, FONT, glow, nid, addDef, shp, circ } from '../style-lab/lab.mjs';
import { STYLES } from '../style-lab/scene.mjs';
import { svgPage, bg, card, stage, shadow } from '../wren-sheet/common.mjs';
import { pawPrint } from '../wren-alternatives/takes.mjs';
import { wren2, pup2, ember, PAL2, EXPR, H2 } from './wren2.mjs';

export const SW = [['Pelt', '#cdd9e2'], ['Pelt shade', '#8da3b7'], ['Cape lining', '#59708a'], ['Tunic', '#34506a'], ['Face void', '#121923'], ['Amber thread', '#ffb84a'], ['Eye glint', '#ffd98a'], ['Bone ember', '#efe4cc'], ['Pup cream', '#ffe8b0'], ['Pup shade', '#f6c987'], ['Ember flame', '#ffd05a'], ['Pup ear in', '#ffd2a0']];
export const CODE = 'STYLE CODE: L2 tinted outline + H2 soft gradient/rim + P1 chibi + W2 textured ground';
export const CODE2 = 'G1 lantern pool + G2 glow trails | mood P1 Warm Lantern (golden light on cool grey-blue)';
export const lbl = (s, x, y, o = {}) => T(s, x, y, { s: o.s || 11, c: o.c || '#e8edf3', w: 800, a: 'middle', f: FONT.ui, ls: 1 });
const clipRect = (x, y, w, h) => { const id = nid('cr'); addDef(`<clipPath id="${id}"><rect x="${x}" y="${y}" width="${w}" height="${h}"/></clipPath>`); return id; };
export const crop = (svg, box, cx, cy, k) => { const id = clipRect(box[0], box[1], box[2], box[3]); return `<g transform="translate(${cx - (box[0] + box[2] / 2) * k},${cy - (box[1] + box[3] / 2) * k}) scale(${k})"><g clip-path="url(#${id})">${svg}</g></g>`; };

export function banner(title = 'WREN v2: PELT WALKER + PUP', sub = 'Matt\'s pick: Take C + a ghost wolf pup. Shadowed face, amber glints, ember on a thread.', w = 700) {
  const six = [SW[0], SW[3], SW[4], SW[5], SW[8], SW[7]];
  const sw = six.map(([n, c], i) => `<circle cx="${22 + i * 112}" cy="80" r="9" fill="${c}" stroke="#fff" stroke-opacity=".75" stroke-width="1.6"/>${T(c + ' ' + n.split(' ')[0].toLowerCase(), 36 + i * 112, 84, { s: 10.5, f: FONT.mono, c: '#e8edf3', w: 600 })}`).join('');
  return `<rect width="${w}" height="92" fill="#07090d" opacity=".95"/><rect y="92" width="${w}" height="3" fill="#ffb84a"/>${T(title, 12, 29, { s: 25, f: FONT.title, w: 900 })}${T(sub, 12, 45, { s: 9.6, f: FONT.mono, c: '#ffd98a', w: 700 })}${T(CODE, 12, 57, { s: 9.4, f: FONT.mono, c: '#b8c4d0', w: 600 })}${T(CODE2, 12, 68, { s: 9.4, f: FONT.mono, c: '#b8c4d0', w: 600 })}${sw}`;
}

// pup placement for each Wren view (same x in every sheet so the pair stays consistent)
export const pupFor = (view, extra = {}) => ({ x: view === 'side' ? -50 : -46, y: view === 'side' ? 2 : 6, view: view === '3q' ? '3q' : view, pose: 'sit', expr: 'open', thread: true, ...extra });

export function sheetPage() {
  begin(); use(STYLES.S1);
  let b = bg(1280, 720);
  // ---------- turnaround ----------
  b += card(8, 100, 640, 290, 'TURNAROUND', 'front / 3/4 / side / back, pup at heel');
  const views = [['front', 'FRONT'], ['3q', '3/4'], ['side', 'SIDE'], ['back', 'BACK']], k = 1.55, base = 366, cxs = [112, 267, 422, 577];
  views.forEach(([v, name], i) => {
    const cx = cxs[i];
    b += stage(cx - 8, base, 84, 14, i + 11) + shadow(cx, base + 2, 38);
    b += `<g transform="translate(${cx},${base}) scale(${k})">${wren2({ view: v, expr: v === 'back' ? 'neutral' : 'neutral', pup: pupFor(v, { front: v === 'front' }) })}</g>`;
    b += lbl(name, cx - 8, 386);
  });
  const dots = [[1, -17, -100], [2, 0, -58], [3, 27, -20], [4, 6, -28], [5, 0, -70], [6, -21, -24], [7, 14, -80], [8, 37, -86]];
  for (const [n, x, y] of dots) { const px = cxs[0] + x * k, py = base + y * k; b += `<circle cx="${px}" cy="${py}" r="7.2" fill="#0b1016" stroke="#ffd98a" stroke-width="1.4"/>` + T(String(n), px, py + 3.6, { s: 9.5, c: '#ffd98a', w: 900, a: 'middle', f: FONT.mono }); }

  // ---------- expressions: 5 glint states + posture + ember + pup ----------
  b += card(708, 8, 564, 184, '5 STATES: glints, posture, ember, pup', 'face stays in shadow');
  ['neutral', 'determined', 'worried', 'smile', 'hurt'].forEach((e, i) => {
    const X = EXPR[e], cx = 764 + i * 110, bx = cx - 54;
    const E = X.ember, gx = cx + 4 + (E.dx - 12) * 1.16, gy = 77 + (E.dy + 92) * 1.16;
    b += glow(cx, 78, 62, 40, '#ffc45a', 0.12) + glow(gx, gy, E.gl * 1.16, E.gl * 1.0, '#ffc96b', 0.9 * (E.dim ?? 1)) + crop(wren2({ view: 'front', expr: e, noThreads: true, ember: { gl: 0 } }), [-34, -132, 92, 80], cx + 4, 77, 1.16);
    b += `<g transform="translate(${cx - 26},162)">${pup2({ view: '3q', pose: X.pup.pose === 'stand' ? 'sit' : X.pup.pose, expr: X.pup.expr, flat: !!X.pup.flat, head: X.pup.look ? 0 : 0, k: 0.8, wag: X.pup.wag ? 1.3 : 0, tongue: false })}</g>`;
    b += lbl(X.name, cx, 176, { s: 9.6 });
  });
  // ---------- pup card ----------
  b += card(656, 198, 616, 192, 'PUP: ghost wolf pup', 'cream-amber, big ears, ember tail tip, thread collar');
  const pk = 1.7, pc = (i) => 700 + i * 112;
  [['front', 'FRONT'], ['3q', '3/4'], ['side', 'SIDE'], ['back', 'BACK']].forEach(([v, n], i) => {
    b += glow(pc(i), 274, 44, 30, '#ffc45a', 0.14) + `<g transform="translate(${pc(i)},292) scale(${pk})">${pup2({ view: v, pose: 'sit', expr: 'open' })}</g>` + lbl(n, pc(i), 304, { s: 9.6 });
  });
  const pd = [[9, -3, -12], [10, -14, -5], [11, 22, -9], [12, -9, -38]];
  for (const [n, x, y] of pd) { const px = pc(0) + x * 0.78 * pk * 0.9 + 0, py = 292 + y * 0.78 * pk * 0.9; b += `<circle cx="${px}" cy="${py}" r="6.4" fill="#0b1016" stroke="#ffd98a" stroke-width="1.3"/>` + T(String(n), px, py + 3.4, { s: 8.6, c: '#ffd98a', w: 900, a: 'middle', f: FONT.mono }); }
  // size vs Wren
  b += `<g transform="translate(${pc(4) - 12},290) scale(0.5)">${wren2({ view: '3q', bare: true, noThreads: true })}</g><g transform="translate(${pc(4) + 30},290) scale(0.5)">${pup2({ view: '3q', pose: 'sit', expr: 'open' })}</g>` + lbl('KNEE HIGH', pc(4) + 8, 304, { s: 9.6 });
  [['sit', 'SIT / IDLE', { view: '3q', ex: 'open' }], ['curious', 'CURIOUS TILT', { view: '3q', ex: 'wide', head: 16, pose: 'sit' }], ['run', 'BOUND (RUN)', { view: 'side', ph: 1.1, bob: -2 }], ['sleep', 'TUCKED SLEEP', { view: 'side' }], ['howl', 'TINY HOWL', { view: 'side' }]].forEach(([p, n, ov], i) => {
    const x = pc(0) + i * 112 + (i > 0 ? 0 : 0);
    const pose = p === 'curious' ? 'sit' : p;
    b += glow(x, 358, 44, 24, '#ffc45a', 0.14) + `<g transform="translate(${x},366) scale(${pk})">${pup2({ view: ov.view, pose, expr: ov.ex || 'open', ph: ov.ph, bob: ov.bob, head: ov.head || 0, tongue: p === 'run' })}</g>` + lbl(n, x, 381, { s: 9.6 });
  });
  // ---------- silhouettes ----------
  b += card(8, 396, 500, 190, 'SILHOUETTES (black fill)', 'if it reads black, it reads at 40px');
  b += `<rect x="18" y="420" width="480" height="158" rx="8" fill="#d9e1e8"/>`;
  const sk = 0.8, sb = 566;
  const sil = (v, ov = {}) => wren2({ view: v, sil: true, pup: pupFor(v, { ...ov }), ...ov.w });
  b += `<g transform="translate(60,${sb}) scale(${sk})">${wren2({ view: 'front', sil: true, pup: pupFor('front') })}</g>`;
  b += `<g transform="translate(140,${sb}) scale(${sk})">${wren2({ view: 'side', sil: true, pup: pupFor('side') })}</g>`;
  b += `<g transform="translate(212,${sb}) scale(${sk})">${wren2({ view: 'back', sil: true, pup: pupFor('back') })}</g>`;
  const runO = { view: 'side', sil: true, run: true, pup: { x: -78, y: 0, view: 'side', pose: 'run', ph: 1.2, bob: -2, thread: false } };
  b += `<g transform="translate(332,${sb}) scale(${sk})">${wren2(runO)}</g><g transform="translate(418,${sb}) scale(0.536)">${wren2(runO)}</g><g transform="translate(476,${sb}) scale(0.357)">${wren2(runO)}</g>`;
  b += T('front / side / back (pup sits at heel)', 30, 436, { s: 10, c: '#445', w: 800 }) + T('RUN + pup', 300, 436, { s: 10, c: '#445', w: 800 }) + T('60px', 418, 436, { s: 10, c: '#445', w: 800, a: 'middle' }) + T('40px', 476, 436, { s: 10, c: '#445', w: 800, a: 'middle' });
  b += T('pup = separate bump behind her', 290, 452, { s: 9, c: '#667', w: 600 });
  // ---------- key props ----------
  b += card(516, 396, 360, 190, 'KEY PROPS', 'each is its own layer / sprite');
  const tiles = ['BONE EMBER', 'WOLF-HOOD', 'PAW TIE', 'PUP TAIL'];
  tiles.forEach((p, i) => {
    const x = 524 + i * 87, cx = x + 41;
    b += `<rect x="${x}" y="420" width="83" height="136" rx="9" fill="#1d2733" stroke="#33414f"/>` + glow(cx, 488, 44, 44, '#ffc96b', i === 0 || i === 3 ? 0.3 : 0.06);
    if (i === 0) b += `<path d="M${cx} 440 L${cx} 462" stroke="#ffb84a" stroke-width="1.6" stroke-dasharray="1.4 3.2" stroke-linecap="round"/>` + ember(cx, 500, 3.2, { gl: 40, fl: 1.2, spark: 3 });
    if (i === 1) b += crop(wren2({ view: '3q', bare: true, noThreads: true }), [-32, -128, 64, 62], cx, 490, 1.22);
    if (i === 2) b += crop(wren2({ view: 'front', bare: true, noThreads: true }), [-27, -66, 54, 56], cx, 490, 1.45);
    if (i === 3) b += `<g transform="translate(${cx + 6},520) scale(2.4)">${pup2({ view: 'side', pose: 'sit', expr: 'open' })}</g>`;
    b += lbl(p, cx, 570, { s: 8.4 });
  });
  // ---------- hex callouts ----------
  b += card(884, 396, 388, 190, 'COLOUR CALLOUTS (hex)', '1-8 Wren front, 9-12 pup front');
  SW.forEach(([n, c], i) => {
    const col = i % 3, row = Math.floor(i / 3), x = 892 + col * 126, y = 420 + row * 41;
    b += `<rect x="${x}" y="${y}" width="122" height="37" rx="8" fill="#1d2733" stroke="#33414f"/><circle cx="${x + 17}" cy="${y + 19}" r="11.5" fill="${c}" stroke="#fff" stroke-opacity=".8" stroke-width="1.6"/>` + T(String(i + 1), x + 17, y + 23, { s: 10, w: 900, a: 'middle', c: i === 4 || i === 3 || i === 2 ? '#fff' : '#10202a', f: FONT.mono }) + T(n, x + 33, y + 16, { s: 10.4, w: 800, c: '#fff' }) + T(c, x + 33, y + 30, { s: 10.5, f: FONT.mono, c: '#ffd98a', w: 700 });
  });
  // ---------- legend ----------
  b += card(8, 594, 1264, 118, 'CODE LEGEND + WHY THIS READS');
  const legend = [['L2', 'tinted outline, no black (pup: warm brown ink)'], ['H2', 'soft gradient + rim light on every part'], ['P1', 'chibi, slender: dark body, pale wolf-head hood'], ['W2', 'painted ground under the figures'], ['G1+G2', 'ember pool beside her, pup glow + tail-tip trail'], ['PUP', 'same ghost-wolf cream-amber, a touch paler (younger)']];
  const why = [['TELL @40px', 'pale wolf-muzzle head, dark body, pelt tail, ember dot + a SECOND light dot (the pup) at her heel'], ['FACE', 'void + two amber glints: 5 glint shapes carry the feeling, no visor ring'], ['NEW vs C', 'forepaws tied at the throat, brow tufts, pelt ears that droop/prick, ember that behaves, pup'], ['PUP', 'big ears, ember tail tip, thread collar: curious, loyal, always at her heel'], ['MOOD', 'quiet, a bit sad; the pup carries the tenderness']];
  legend.forEach(([c, tx], i) => { b += T(c, 22, 626 + i * 14.2, { s: 10.6, f: FONT.mono, c: '#ffd98a', w: 900 }) + T(tx, 76, 626 + i * 14.2, { s: 10.4, c: '#dfe7ef', w: 500 }); });
  why.forEach(([c, tx], i) => { b += T(c, 470, 626 + i * 16.6, { s: 10.6, f: FONT.mono, c: '#ffb84a', w: 900 }) + T(tx, 566, 626 + i * 16.6, { s: 10, c: '#dfe7ef', w: 500 }); });
  b += banner();
  return svgPage(1280, 720, b);
}
