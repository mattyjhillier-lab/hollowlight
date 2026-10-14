// elias-v2-sheet.png: turnaround, 5 states, wheel mechanism + flame ring parts, key props, black silhouettes (60px/40px), hex callouts, code legend. Mock-up only.
// Re-uses (never edits) ../style-lab, ../wren-sheet/common.mjs and the card/crop/lbl helpers from ../wren-v2/sheet.mjs.
import { begin, use, T, FONT, glow } from '../style-lab/lab.mjs';
import { STYLES } from '../style-lab/scene.mjs';
import { svgPage, bg, card, stage, shadow } from '../wren-sheet/common.mjs';
import { crop, lbl, CODE, CODE2 } from '../wren-v2/sheet.mjs';
import { elias2, EX, orbitRing, bloomDisc, hollowDisc, setNoGlow, PE } from './elias2.mjs';
export const nog = (fn) => { setNoGlow(true); const r = fn(); setNoGlow(false); return r; };

export const SW = [['Coat rust', '#9a5a3c'], ['Coat shade', '#6e3d2a'], ['Patch slate', '#6f8aa3'], ['Patch sage', '#7d9a6a'], ['Flat cap', '#3d4a5c'], ['Skin', '#e4b794'], ['Moustache', '#cfc8bb'], ['Staff wood', '#7a5a3c'], ['Brass wheel', '#d6a94c'], ['Pocket glow', '#ffcf70'], ['Candle flame', '#ffd05a'], ['Orbit flame', '#e8e0ff']];
const LIGHT = new Set(['#e8e0ff', '#ffd05a', '#ffcf70', '#d6a94c', '#cfc8bb', '#e4b794']);
export function banner(title = 'ELIAS v2: THE LAMPLIGHTER + CANDLE WHEEL', sub = 'Matt\'s pick: Take B + the flame ring. Lantern-staff is a candle-wheel chandelier; pockets leak light.', w = 700) {
  const six = [SW[0], SW[8], SW[9], SW[11], SW[4], SW[2]];
  const sw = six.map(([n, c], i) => `<circle cx="${22 + i * 112}" cy="80" r="9" fill="${c}" stroke="#fff" stroke-opacity=".75" stroke-width="1.6"/>${T(c + ' ' + n.split(' ')[0].toLowerCase(), 36 + i * 112, 84, { s: 10.5, f: FONT.mono, c: '#e8edf3', w: 600 })}`).join('');
  return `<rect width="${w}" height="92" fill="#07090d" opacity=".95"/><rect y="92" width="${w}" height="3" fill="#ffb84a"/>${T(title, 12, 29, { s: 24, f: FONT.title, w: 900 })}${T(sub, 12, 45, { s: 9.2, f: FONT.mono, c: '#ffd98a', w: 700 })}${T(CODE, 12, 57, { s: 9.4, f: FONT.mono, c: '#b8c4d0', w: 600 })}${T(CODE2, 12, 68, { s: 9.4, f: FONT.mono, c: '#b8c4d0', w: 600 })}${sw}`;
}
export const ORB = { n: 3, ph: 0.9 };

export function sheetPage() {
  begin(); use(STYLES.S1);
  let b = bg(1280, 720);
  // ---------- turnaround ----------
  b += card(8, 100, 640, 290, 'TURNAROUND', 'front / 3/4 / side / back, flame ring on (140 units = 75px desktop / 50px phone)');
  const k = 1.3, base = 366, cxs = [100, 262, 418, 574];
  [['front', 'FRONT'], ['3q', '3/4'], ['side', 'SIDE'], ['back', 'BACK']].forEach(([v, name], i) => {
    const cx = cxs[i];
    b += stage(cx + 10, base, 84, 14, i + 21) + shadow(cx, base + 2, 42);
    b += `<g transform="translate(${cx},${base}) scale(${k})">${elias2({ view: v, orbs: { ...ORB, ph: 0.9 + i * 0.5 } })}</g>`;
    b += lbl(name, cx + 10, 386);
  });
  const dots = [[1, -26, -42], [2, -24, -14], [3, 18, -42], [4, -22, -54], [5, -12, -108], [6, 17, -74], [7, 11, -70], [8, 47, -62], [9, 66, -106], [10, 17, -26], [11, 47, -128], [12, -50, -56]];
  for (const [n, x, y] of dots) { const px = cxs[0] + x * k, py = base + y * k; b += `<circle cx="${px}" cy="${py}" r="7.2" fill="#0b1016" stroke="#ffd98a" stroke-width="1.4"/>` + T(String(n), px, py + 3.6, { s: 9.5, c: '#ffd98a', w: 900, a: 'middle', f: FONT.mono }); }

  // ---------- 5 states ----------
  b += card(708, 8, 564, 184, '5 STATES: face, posture, light', 'what the wheel and the pockets do');
  ['kind', 'tender', 'hurt', 'glad', 'brace'].forEach((e, i) => {
    const X = EX[e], cx = 764 + i * 110;
    b += glow(cx, 96, 56, 40, '#ffc45a', 0.14) + glow(cx + 34, 54, 34, 30, '#ffc96b', 0.5 * Math.min(1, X.fl)) + crop(nog(() => elias2({ view: 'front', expr: e, staffUp: e === 'brace' ? 6 : 0 })), [-34, -148, 110, 104], cx + 4, 96, 0.98);
    b += lbl(X.name, cx, 172, { s: 9 });
  });
  // ---------- wheel mechanism + flame ring parts ----------
  b += card(656, 198, 616, 192, 'THE WHEEL + THE FLAME RING', 'two light systems, drawn as separate parts');
  const mk = 0.36, mb = 354;
  [['CARRY', { wheel: { low: 0 } }, 712], ['LOWER', { wheel: { low: 0.62, open: 0.25, R: 80 }, staffX: 40 }, 796], ['PLANT', { wheel: { low: 1, open: 1, R: 149, fs: 1.25 }, staffX: 40, expr: 'brace' }, 905]].forEach(([n, ov, cx], i) => {
    if (i === 2) b += hollowDisc(cx, mb - 2, 149 * mk, 149 * mk * 0.4) + bloomDisc(cx, mb - 2, 149 * mk, 149 * mk * 0.4, 1, 7, 0.6);
    b += `<g transform="translate(${cx - (ov.staffX ? ov.staffX * mk : 0)},${mb}) scale(${mk})">${elias2({ view: '3q', ...ov, wheel: ov.wheel })}</g>` + lbl(n, cx, 383, { s: 9 });
    if (i < 2) b += `<path d="M${cx + 38} 330 l9 0 m-3 -3 l3 3 l-3 3" stroke="#ffd98a" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".7"/>`;
  });
  [['RANK 1: 2 flames', 2], ['RANK 3: 4', 4], ['RANK 5: 6', 6]].forEach(([n, cnt], i) => {
    const cx = 1010 + i * 82, cy = 306 + (i % 2) * 4;
    const r = orbitRing({ n: cnt, ph: 0.8, s: 0.62 }, cx, cy, 34);
    b += r.back + `<ellipse cx="${cx}" cy="${cy + 16}" rx="12" ry="5" fill="#000" opacity=".25"/>` + r.front + T(n, cx, 346, { s: 8.4, c: '#e8edf3', w: 800, a: 'middle', f: FONT.ui });
  });
  b += T('HOLY ORBIT lights = lilac-white flames (weapons.json #e8e0ff)', 1140, 368, { s: 8.6, c: '#b8a8f0', w: 700, a: 'middle', f: FONT.ui });
  b += T('count follows the weapon rank (visual only)', 1140, 380, { s: 8.4, c: '#9fb0c2', w: 600, a: 'middle', f: FONT.ui });

  // ---------- silhouettes ----------
  b += card(8, 396, 500, 190, 'SILHOUETTES (black fill)', 'if it reads black, it reads at 40px');
  b += `<rect x="18" y="420" width="480" height="158" rx="8" fill="#d9e1e8"/>`;
  const sk = 0.76, sb = 570, S = (v, ex = {}) => elias2({ view: v, sil: true, ...ex });
  b += `<g transform="translate(58,${sb}) scale(${sk})">${S('front')}</g><g transform="translate(138,${sb}) scale(${sk})">${S('side')}</g><g transform="translate(216,${sb}) scale(${sk})">${S('back')}</g>`;
  b += `<g transform="translate(318,${sb}) scale(${sk})">${S('3q', { run: true, leg: 1.2 })}</g><g transform="translate(420,${sb}) scale(0.536)">${S('3q', { run: true, leg: 1.2, orbs: { n: 3, ph: 0.9 } })}</g><g transform="translate(476,${sb}) scale(0.357)">${S('3q', { run: true, leg: 1.2, orbs: { n: 3, ph: 0.9 } })}</g>`;
  b += T('front / side / back (spare candles poke up behind)', 28, 436, { s: 10, c: '#445', w: 800 }) + T('WALK', 296, 466, { s: 10, c: '#445', w: 800 }) + T('60px', 420, 436, { s: 10, c: '#445', w: 800, a: 'middle' }) + T('40px', 476, 436, { s: 10, c: '#445', w: 800, a: 'middle' });
  b += T('flame ring is in the 60/40 shapes; glows are separate light sprites', 28, 450, { s: 9, c: '#667', w: 600 });
  // ---------- key props ----------
  b += card(516, 396, 360, 190, 'KEY PROPS', 'each is its own layer / sprite');
  const props = [['CHANDELIER', [22, -150, 64, 66], 1.2], ['POCKET LIGHT', [-42, -64, 60, 56], 1.35], ['CAP + STACHE', [-34, -116, 68, 56], 1.3], ['SPADE FOOT', [40, -34, 30, 38], 2.4]];
  props.forEach(([name, box, kk], i) => {
    const x = 524 + i * 87, cx = x + 41;
    b += `<rect x="${x}" y="420" width="83" height="136" rx="9" fill="#1d2733" stroke="#33414f"/>` + glow(cx, 488, 44, 44, '#ffc96b', i === 0 || i === 1 ? 0.3 : 0.06);
    b += crop(nog(() => elias2({ view: 'front' })), box, cx, 488, Math.min(kk, 76 / box[2], 118 / box[3]));
    b += lbl(name, cx, 570, { s: name.length > 11 ? 7.8 : 8.4 });
  });
  // ---------- hex callouts ----------
  b += card(884, 396, 388, 190, 'COLOUR CALLOUTS (hex)', '1-12 on the front view');
  SW.forEach(([n, c], i) => {
    const col = i % 3, row = Math.floor(i / 3), x = 892 + col * 126, y = 420 + row * 41;
    b += `<rect x="${x}" y="${y}" width="122" height="37" rx="8" fill="#1d2733" stroke="#33414f"/><circle cx="${x + 17}" cy="${y + 19}" r="11.5" fill="${c}" stroke="#fff" stroke-opacity=".8" stroke-width="1.6"/>` + T(String(i + 1), x + 17, y + 23, { s: 10, w: 900, a: 'middle', c: LIGHT.has(c) ? '#10202a' : '#fff', f: FONT.mono }) + T(n, x + 33, y + 16, { s: 10.4, w: 800, c: '#fff' }) + T(c, x + 33, y + 30, { s: 10.5, f: FONT.mono, c: '#ffd98a', w: 700 });
  });
  // ---------- legend ----------
  b += card(8, 594, 1264, 118, 'CODE LEGEND + WHY THIS READS');
  const legend = [['L2', 'tinted outline, no black (brass/iron: dark plum ink)'], ['H2', 'soft gradient + rim light on every part'], ['P1', 'chibi: stout block, big head, short boots'], ['W2', 'painted ground under the figures'], ['G1+G2', 'chandelier pool up high + pocket spills + flame-ring trails'], ['ORBS', 'Holy Orbit = ring of lilac-white flames round his waist']];
  const why = [['TELL @40px', 'wide rust block + a bright brass CROWN (ring of candle dots) on a thick pole + 3 lilac flames at the waist'], ['SHAPE', 'BLOCK + CROWNED POLE (hammer / T). Wren is low and pointed'], ['FACE', 'walrus moustache, flat cap, kind arcs / tender brows; 5 states'], ['COLOUR', 'rust + brass gold + lilac flames; Wren is grey-blue + navy + amber'], ['MOOD', 'gravedigger who chose to light the dead\'s road: kind, gruff, tender']];
  legend.forEach(([c, tx], i) => { b += T(c, 22, 626 + i * 14.2, { s: 10.6, f: FONT.mono, c: '#ffd98a', w: 900 }) + T(tx, 76, 626 + i * 14.2, { s: 10.4, c: '#dfe7ef', w: 500 }); });
  why.forEach(([c, tx], i) => { b += T(c, 470, 626 + i * 16.6, { s: 10.6, f: FONT.mono, c: '#ffb84a', w: 900 }) + T(tx, 566, 626 + i * 16.6, { s: 9.6, c: '#dfe7ef', w: 500 }); });
  b += banner();
  return svgPage(1280, 720, b);
}
