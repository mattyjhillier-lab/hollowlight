// elias-take-<x>-sheet.png: banner, turnaround, 3 states, Candle Wheel keyframes, black silhouettes (60px / 40px), key props, hex callouts, code legend. Mock-up only.
// Re-uses (never edits) ../style-lab, ../wren-sheet/common.mjs and the card/crop/lbl helpers from ../wren-v2/sheet.mjs.
import { begin, use, T, FONT, glow } from '../style-lab/lab.mjs';
import { STYLES } from '../style-lab/scene.mjs';
import { svgPage, bg, card, stage, shadow } from '../wren-sheet/common.mjs';
import { crop, lbl, CODE, CODE2 } from '../wren-v2/sheet.mjs';
import { TAKES, EXPRS, wheelFrame, eliasA, eliasB, eliasC, setNoGlow } from './elias.mjs';
const nog = (f) => { setNoGlow(true); const r = f(); setNoGlow(false); return r; };

export const INFO = {
  A: {
    title: 'ELIAS TAKE A: KEEPER OF THE WHEEL',
    concept: 'Gentle old candle-bearer in a wide bell robe; the iron candle-wheel is his halo. Spectacles, white beard.',
    bold: 'Closest to the bible (priest with a candle-wheel halo), but the wheel becomes a lit halo and he gets a real face.',
    sw: [['Robe', '#5d5189'], ['Robe shade', '#3f3768'], ['Lining', '#8a7fc0'], ['Stole cream', '#f2efe2'], ['Beard white', '#f5f1e8'], ['Skin', '#ecc7a9'], ['Iron wheel', '#565c6e'], ['Skullcap', '#45396f'], ['Candle flame', '#ffd05a'], ['Flame glow', '#ffb84a'], ['Boot', '#2a2838'], ['Orb light', '#e8e0ff']],
    six: [0, 3, 6, 4, 8, 11],
    dots: [[1, -22, -30], [2, 34, -14], [3, -36, -9], [4, 2, -33], [5, 0, -64], [6, -9, -102], [7, 32, -97], [8, 2, -116]],
    legend: [['L2', 'tinted outline, no black (iron ring: dark slate ink)'], ['H2', 'soft gradient + rim light on every part'], ['P1', 'chibi: big head, bell body, short stubby boots'], ['W2', 'painted ground under the figures'], ['G1+G2', 'halo flame pool behind him; flame streaks when he walks'], ['ORBS', 'Holy Orbit = flames that lift off the wheel (lilac-white)']],
    why: [['TELL @40px', 'a ring of flame dots behind a wide indigo bell: "a circle behind a triangle" (bible tell, now lit)'], ['SHAPE', 'BELL: widest at the hem. Wren is a low pointed wolf shape'], ['FACE', 'beard + spectacles + closed-eye arcs; 5 states carry the feeling'], ['COLOUR', 'indigo + beard white + flame; Wren is grey-blue + dark navy + amber'], ['MOOD', 'calm, a bit tired, jokes quietly: the grown-up']],
    props: [['HALO WHEEL', 'front', [-42, -136, 84, 84], 0.9], ['CAP + GLASSES', 'front', [-30, -122, 60, 52], 1.35], ['FLAME STOLE', 'front', [-16, -72, 32, 66], 1.6], ['HAND CANDLE', 'front', [-14, -72, 30, 34], 2.2]],
    stateBox: [-52, -152, 104, 116],
  },
  B: {
    title: 'ELIAS TAKE B: THE LAMPLIGHTER',
    concept: 'Stout gravedigger-turned-lamplighter: lantern-staff with a spade foot, patched coat, light spills from pockets.',
    bold: 'Bold departure: no priest, no wheel on the back; the wheel is made by the staff (spade foot driven into the ground).',
    sw: [['Coat rust', '#9a5a3c'], ['Coat shade', '#6e3d2a'], ['Patch slate', '#6f8aa3'], ['Patch cream', '#e8dcc0'], ['Patch sage', '#7d9a6a'], ['Flat cap', '#3d4a5c'], ['Skin', '#e4b794'], ['Moustache', '#cfc8bb'], ['Staff wood', '#7a5a3c'], ['Lantern iron', '#3b4250'], ['Pocket glow', '#ffcf70'], ['Orb light', '#e8e0ff']],
    six: [0, 2, 5, 8, 10, 11],
    dots: [[1, -27, -36], [2, 27, -17], [3, 17, -40], [4, -19, -21], [5, -21, -53], [6, 0, -109], [7, -18, -76], [8, 10, -65]],
    legend: [['L2', 'tinted outline, no black (iron lantern: dark slate ink)'], ['H2', 'soft gradient + rim light on every part'], ['P1', 'chibi: stout block, big head, short boots'], ['W2', 'painted ground under the figures'], ['G1+G2', 'lantern pool up high + pocket glows + lantern streak'], ['ORBS', 'Holy Orbit = fireflies lifting out of his pockets (lilac-white)']],
    why: [['TELL @40px', 'a wide rust block with a tall pole: big warm lantern dot ABOVE his head, a spade-point at the ground'], ['SHAPE', 'BLOCK + POLE (T / hammer). Wren is low and pointed'], ['FACE', 'walrus moustache, cap, kind arcs / tender brows; 5 states'], ['COLOUR', 'rust + slate patches + lantern; Wren is grey-blue + navy'], ['MOOD', 'gravedigger who chose to light the dead\'s road: kind, gruff, tender']],
    props: [['LANTERN STAFF', 'front', [20, -152, 42, 52], 1.9], ['PATCH POCKETS', 'front', [-40, -64, 56, 60], 1.35], ['CAP + STACHE', 'front', [-32, -114, 64, 56], 1.3], ['SPADE FOOT', 'front', [28, -34, 26, 36], 2.5]],
    stateBox: [-44, -148, 110, 118],
  },
  C: {
    title: 'ELIAS TAKE C: THE WAX SAINT',
    concept: 'He IS the candle: rose-wax saint, flame for hair, a wheel of flames as a ring collar. Gives light, melts a little.',
    bold: 'Boldest departure: no robe, no priest costume. A living votive candle; his flame doubles as his health, the ring is the Candle Wheel.',
    sw: [['Wax rose', '#ecb9b4'], ['Wax light', '#f7d9d2'], ['Wax shade', '#c98a8c'], ['Drip cream', '#fbeede'], ['Iron ring', '#4d5160'], ['Wick', '#3a2e30'], ['Face ink', '#5a3238'], ['Cheek', '#f08a8a'], ['Flame', '#ffd05a'], ['Flame glow', '#ffb84a'], ['Ring ink', '#8f95a8'], ['Orb light', '#e8e0ff']],
    six: [0, 3, 4, 8, 7, 11],
    dots: [[1, -20, -30], [2, -21, -58], [3, 22, -34], [4, -14, -78], [5, -40, -45], [6, 1, -100], [7, -11, -66], [8, 1, -118]],
    legend: [['L2', 'tinted outline, no black (the wick and ring: dark plum ink)'], ['H2', 'soft gradient + rim light on every part'], ['P1', 'chibi: one round column, head is the top of the candle'], ['W2', 'painted ground under the figures'], ['G1+G2', 'flame pool above him + ring-of-flames glow + flame streak'], ['ORBS', 'Holy Orbit = flames that lift off the ring sockets (lilac-white)']],
    why: [['TELL @40px', 'a rose-pink column with a flame on top and a ring of flame dots at the waist: nothing else on screen is a candle'], ['SHAPE', 'ROUND COLUMN (a cylinder + ring). Wren is low and pointed'], ['FACE', 'sleepy-closed, small smile, flame shrinks when hurt (HP flame)'], ['COLOUR', 'dusty rose + cream drips + flame; Wren is grey-blue + navy'], ['MOOD', 'tender and a little sad: a light that gives itself away']],
    props: [['FLAME + WICK', 'front', [-20, -134, 40, 44], 1.9], ['RING COLLAR', 'front', [-48, -62, 96, 34], 0.86], ['DRIP COWL', 'front', [-30, -104, 60, 56], 1.3], ['MELT SKIRT', 'front', [-44, -34, 88, 38], 0.9]],
    stateBox: [-52, -142, 104, 122],
  },
};

export function banner(id, w = 700) {
  const I = INFO[id], six = I.six.map((i) => I.sw[i]);
  const sw = six.map(([n, c], i) => `<circle cx="${22 + i * 112}" cy="80" r="9" fill="${c}" stroke="#fff" stroke-opacity=".75" stroke-width="1.6"/>${T(c + ' ' + n.split(' ')[0].toLowerCase(), 36 + i * 112, 84, { s: 10.2, f: FONT.mono, c: '#e8edf3', w: 600 })}`).join('');
  return `<rect width="${w}" height="92" fill="#07090d" opacity=".95"/><rect y="92" width="${w}" height="3" fill="#ffb84a"/>${T(I.title, 12, 29, { s: 22.5, f: FONT.title, w: 900 })}${T(I.concept, 12, 45, { s: 9.2, f: FONT.mono, c: '#ffd98a', w: 700 })}${T(CODE, 12, 57, { s: 9.2, f: FONT.mono, c: '#b8c4d0', w: 600 })}${T(CODE2, 12, 68, { s: 9.2, f: FONT.mono, c: '#b8c4d0', w: 600 })}${sw}`;
}

export const figFn = (id) => TAKES[id].fn;
// 3 + ability keyframe figure drawer, per take (step 0..3). Figure drawn at origin in design units; caller scales.
export const wheelFig = (id) => (step) => {
  const ex = step <= 1 ? 'cast' : (id === 'A' ? 'prayer' : id === 'B' ? 'kind' : 'sleepy');
  if (id === 'A') return eliasA({ view: '3q', expr: ex, halo: false, lean: step === 0 ? 5 : 0 });
  if (id === 'B') return `<g transform="translate(-40,0)">${eliasB({ view: '3q', expr: ex, staffUp: step === 0 ? 16 : 0, fl: step === 1 ? 1.5 : undefined })}</g>`;
  return eliasC({ view: '3q', expr: ex, ring: false, lean: step === 0 ? 4 : 0, fl: step === 3 ? 0.8 : undefined });
};

export function sheetPage(id) {
  const I = INFO[id], fn = figFn(id), ST = TAKES[id].states, EX = EXPRS[id];
  begin(); use(STYLES.S1);
  let b = bg(1280, 720);
  // ---------- turnaround ----------
  b += card(8, 100, 640, 290, 'TURNAROUND', `front / 3/4 / side / back (same scale; ${TAKES[id].H} units = about ${Math.round(TAKES[id].H * 60 / 112)}px desktop, ${Math.round(TAKES[id].H * 40 / 112)}px phone)`);
  const k = 1.5, base = 366, cxs = [112, 267, 422, 577];
  [['front', 'FRONT'], ['3q', '3/4'], ['side', 'SIDE'], ['back', 'BACK']].forEach(([v, name], i) => {
    const cx = cxs[i];
    b += stage(cx - 4, base, 82, 13, i + 11 + id.charCodeAt(0)) + shadow(cx, base + 2, 40);
    b += `<g transform="translate(${cx},${base}) scale(${k})">${fn({ view: v })}</g>`;
    b += lbl(name, cx - 4, 386);
  });
  for (const [n, x, y] of I.dots) { const px = cxs[0] + x * k, py = base + y * k; b += `<circle cx="${px}" cy="${py}" r="7.2" fill="#0b1016" stroke="#ffd98a" stroke-width="1.4"/>` + T(String(n), px, py + 3.6, { s: 9.5, c: '#ffd98a', w: 900, a: 'middle', f: FONT.mono }); }

  // ---------- 3 states ----------
  b += card(708, 8, 564, 184, '3 STATES: face, posture, light', 'what the flames and the glow do');
  ST.forEach((e, i) => {
    const X = EX[e], cx = 802 + i * 188, bx = I.stateBox, kk = 1.1;
    b += glow(cx, 96, 70, 50, '#ffc45a', 0.1) + crop(nog(() => fn({ view: 'front', expr: e })), bx, cx, 92, kk);
    b += lbl(X.name, cx, 172, { s: 9.6 }) + T(X.note, cx, 185, { s: 8.4, c: '#9fb0c2', w: 600, a: 'middle' });
  });
  // ---------- candle wheel keyframes ----------
  b += card(656, 198, 616, 192, 'CANDLE WHEEL (Sanctuary)', 'plant / bloom / orbs lock / fade: 6 s, ring r about 80px');
  const R = 50, fk = 0.56, lab = ['1 PLANT', '2 BLOOM', '3 ORBS LOCK', '4 FADE'];
  for (let st = 0; st < 4; st++) {
    const fx0 = 730 + st * 152, cy = 348;
    b += `<clipPath id="wfc${id}${st}"><rect x="${fx0 - 70}" y="222" width="140" height="150"/></clipPath><g clip-path="url(#wfc${id}${st})">${wheelFrame(id, st, fx0, cy, R, wheelFig(id), fk)}</g>`;
    b += lbl(lab[st], fx0, 383, { s: 9.6 });
    if (st < 3) b += `<path d="M${fx0 + 70} 300 l8 0 m-3 -3 l3 3 l-3 3" stroke="#ffd98a" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".7"/>`;
  }
  // ---------- silhouettes ----------
  b += card(8, 396, 500, 190, 'SILHOUETTES (black fill)', 'if it reads black, it reads at 40px');
  b += `<rect x="18" y="420" width="480" height="158" rx="8" fill="#d9e1e8"/>`;
  const sk = 0.8, sb = 566;
  const S = (v, ex = {}) => fn({ view: v, sil: true, ...ex });
  b += `<g transform="translate(62,${sb}) scale(${sk})">${S('front')}</g><g transform="translate(142,${sb}) scale(${sk})">${S('side')}</g><g transform="translate(222,${sb}) scale(${sk})">${S('back')}</g>`;
  b += `<g transform="translate(334,${sb}) scale(${sk})">${S('side', { run: true })}</g><g transform="translate(420,${sb}) scale(0.536)">${S('side', { run: true })}</g><g transform="translate(476,${sb}) scale(0.357)">${S('side', { run: true })}</g>`;
  b += T('front / side / back', 30, 436, { s: 10, c: '#445', w: 800 }) + T('WALK', 310, 436, { s: 10, c: '#445', w: 800 }) + T('60px', 420, 436, { s: 10, c: '#445', w: 800, a: 'middle' }) + T('40px', 476, 436, { s: 10, c: '#445', w: 800, a: 'middle' });
  b += T('orbs / glow are separate light sprites, not in the black', 30, 452, { s: 9, c: '#667', w: 600 });
  // ---------- key props ----------
  b += card(516, 396, 360, 190, 'KEY PROPS', 'each is its own layer / sprite');
  I.props.forEach(([name, view, box, kk2], i) => {
    const x = 524 + i * 87, cx = x + 41;
    b += `<rect x="${x}" y="420" width="83" height="136" rx="9" fill="#1d2733" stroke="#33414f"/>` + glow(cx, 488, 44, 44, '#ffc96b', 0.22);
    b += crop(nog(() => fn({ view, expr: TAKES[id].states[0] })), box, cx, 488, Math.min(kk2, 76 / box[2], 120 / box[3]));
    b += lbl(name, cx, 570, { s: name.length > 12 ? 7.6 : 8.4 });
  });
  // ---------- hex callouts ----------
  b += card(884, 396, 388, 190, 'COLOUR CALLOUTS (hex)', '1-8 on the front view');
  I.sw.forEach(([n, c], i) => {
    const col = i % 3, row = Math.floor(i / 3), x = 892 + col * 126, y = 420 + row * 41;
    b += `<rect x="${x}" y="${y}" width="122" height="37" rx="8" fill="#1d2733" stroke="#33414f"/><circle cx="${x + 17}" cy="${y + 19}" r="11.5" fill="${c}" stroke="#fff" stroke-opacity=".8" stroke-width="1.6"/>` + T(String(i + 1), x + 17, y + 23, { s: 10, w: 900, a: 'middle', c: ['#f2efe2', '#f5f1e8', '#ffd05a', '#ffb84a', '#e8e0ff', '#f7d9d2', '#fbeede', '#e8dcc0', '#ffcf70', '#cfc8bb', '#ecc7a9', '#e4b794', '#ecb9b4', '#f08a8a', '#8f95a8', '#98a0b8', '#8a7fc0'].includes(c) ? '#10202a' : '#fff', f: FONT.mono }) + T(n, x + 33, y + 16, { s: 10.2, w: 800, c: '#fff' }) + T(c, x + 33, y + 30, { s: 10.5, f: FONT.mono, c: '#ffd98a', w: 700 });
  });
  // ---------- legend ----------
  b += card(8, 594, 1264, 118, 'CODE LEGEND + WHY THIS READS');
  I.legend.forEach(([c, tx], i) => { b += T(c, 22, 626 + i * 14.2, { s: 10.6, f: FONT.mono, c: '#ffd98a', w: 900 }) + T(tx, 76, 626 + i * 14.2, { s: 10.2, c: '#dfe7ef', w: 500 }); });
  I.why.forEach(([c, tx], i) => { b += T(c, 470, 626 + i * 16.6, { s: 10.6, f: FONT.mono, c: '#ffb84a', w: 900 }) + T(tx, 566, 626 + i * 16.6, { s: 9.6, c: '#dfe7ef', w: 500 }); });
  b += banner(id);
  return svgPage(1280, 720, b);
}
