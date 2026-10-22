// S1 Ghost Wolf A "Lantern-Heart Pack" (LOCKED Summons art #3, docs/design/summons-art-v1.md 3.1): game port of the mock-up painter
// docs/mockups/summons-art/spirits.mjs wolfA on the shared Husk paint engine (src/gfx/husk/paint.js). Pure JS: builds SVG strings only (no DOM);
// atlas.js rasterises them once at boot into the wolf frames of `sum_atlas`. Friendly recipe: L2 tinted outline, H2 soft gradient with a WARM
// rim, P1 chibi (big round head, short muzzle, tall ears with warm inner glow), plume tail streaming light, legs fading to mist, ember heart.
// Units: du (design units), origin = ground under the feet, facing +x, y up negative. Frame box = WOLF_BOX (1 texel per du at bake).
// Game change vs the mock-up: no grain (0.035 multiply grain is invisible at 2.7x downsample and costs bake time); pack variety is three
// overlay frames (notched ear, chest tuft, curl tail) drawn over the base frame at a per-pose offset (OV_OFF), never recolours.
import { part, furry, blob, limb, lin, glow, mix, tick, ell, f, TAU, resetAll, defs, setGrainBox, rng } from '../husk/paint.js';

export const WARM = '#fff1c8', EMBER = '#ffcf7a';
// S2 evolutions (LOCKED Summons art #3: same creature + gold rim + ONE signature change). Gold #ffd36b is used ONLY on evolved rims.
export const GOLD = '#ffd36b', GOLD_HOT = '#fff3c4', AMBER_EYE = '#b8742a';
// body palette lifted vs the mock-up (c #a9dcff -> #c4e9ff, dk #5f9fd6 -> #8cc3ee): the High bloom pass pulls small bright sprites down ~20 L*, so the
// mock-up values failed the 3:1 body/ground gate in game; the tinted ink outline stays dark for the daylight edge
export const R = { lt: '#ffffff', c: '#c4e9ff', dk: '#8cc3ee', ink: '#2c5a92', glow: '#9fd8ff' };
export const WOLF_BOX = [-64, -90, 128, 96]; // du: x0, y0, w, h (frames are 128 x 96 texels: 1 texel per du)
export const WOLF_LEN_DU = 106; // tail tip to muzzle tip on the lope frames (du)
// world units per du: 16.8 u long = 40.3 px on the 1280x720 desktop (zoom 2.4) -> 38.7-41.9 px with the 4% jitter (LOCKED 36-42 px, ~0.78x a Fell Wolf; the upper end, nearest the approved true-size mock-ups)
export const WOLF_WPD = 16.8 / WOLF_LEN_DU;
export const WOLF_FOOT = 3; // world units from the sim position down to the feet (body centre sits on the hit circle)
export const WOLF_JITTER = 0.04;
// The Alpha: 1.7x the wolf (render size only; its hit radius stays the sim's). Baked at 1 texel per du in a 132 x 96 box, drawn 1.7x.
export const ALPHA_K = 1.7;
export const ALPHA_BOX = [-66, -90, 132, 96];
// Light Trails frames: the box shifts 8 du back so the streaming tail fits (origin = feet, ax = 72 / 128)
export const LF_BOX = [-72, -90, 128, 96];
// gold rim widths (du, LOCKED shared FX: 2.6 du soft + 1.1 du hot line, evolved units only)
export const RIM_SOFT = 2.6, RIM_HOT = 1.1;
// frame order (index = runtime frame): lope x4, bite, sit
export const WOLF_POSES = [{ ph: 0 }, { ph: 0.25 }, { ph: 0.5 }, { ph: 0.75 }, { ph: 0, pose: 'bite' }, { ph: 0, pose: 'sit' }];

const SP = (d, o = {}) => part(d, o.col || R.c, { lw: 2.6, rim: 2.4, rimA: 0.9, rimC: WARM, grain: 0, shA: 0.2, sh: 4, lt: o.lt || R.lt, dk: o.dk || R.dk, ink: o.ink || R.ink, ...o });
const G = (x, y, rx, ry, col, a = 0.6) => glow(x, y, rx, ry, col, a);
function mistLeg(x1, y1, x2, y2, r1, r2, C) {
  return `<path d="${limb(x1, y1, x2, y2, r1, r2, 0)}" fill="url(#${lin([[0, C.c, 0.95], [0.55, C.c, 0.6], [1, R.glow, 0]], [0, 0, 0, 1])})"/>`
    + `<path d="${limb(x1, y1, x1 + (x2 - x1) * 0.45, y1 + (y2 - y1) * 0.45, r1, (r1 + r2) / 2, 0)}" fill="none" stroke="${R.ink}" stroke-width="2" opacity=".55"/>`
    + G(x2, y2 - 1, r2 * 2.6, r2 * 1.3, R.glow, 0.35);
}
const heart = (x, y, s = 1) => G(x, y, 9 * s, 8 * s, EMBER, 0.75) + `<path d="M${f(x)} ${f(y + 2.6 * s)} c${f(-3.8 * s)} ${f(-2.6 * s)} ${f(-3.2 * s)} ${f(-6 * s)} 0 ${f(-4.6 * s)} c${f(3.2 * s)} ${f(-1.4 * s)} ${f(3.8 * s)} ${f(2 * s)} 0 ${f(4.6 * s)}Z" fill="${WARM}" opacity=".95"/>`;
const sEye = (x, y, r, col = R.ink) => `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(r * 0.8)}" ry="${f(r)}" fill="${col}"/><ellipse cx="${f(x - r * 0.25)}" cy="${f(y - r * 0.35)}" rx="${f(r * 0.32)}" ry="${f(r * 0.36)}" fill="${WARM}"/>`;
const crescents = (x, y, k) => `<g transform="translate(${f(x)},${f(y)}) scale(${k})" opacity=".95">${G(0, 0, 14, 14, R.glow, 0.5)}<path d="M-6 -12 Q8 -10 9 2 Q4 -6 -6 -6Z" fill="#ffffff"/><path d="M-6 12 Q8 10 9 -2 Q4 6 -6 6Z" fill="#ffffff"/></g>`;

// Light Trails streamer: a tapered ribbon of light (soft glow + white core) trailing back off an ear or the tail tip
const streamer = (p, w) => { const d = `M${f(p[0][0])} ${f(p[0][1])} Q${f(p[1][0])} ${f(p[1][1])} ${f(p[2][0])} ${f(p[2][1])}`;
  return `<path d="${d}" stroke="${R.glow}" stroke-width="${f(w * 1.6)}" fill="none" opacity=".45" stroke-linecap="round" filter="url(#blur1)"/>`
    + `<path d="${d}" stroke="#ffffff" stroke-width="${f(w * 0.5)}" fill="none" opacity=".8" stroke-linecap="round"/>`; };

// pose geometry shared by the base painter and the overlay offsets
export function wolfGeom(st = {}) {
  const a = (st.ph || 0) * TAU, s1 = Math.sin(a), bite = st.pose === 'bite' ? 1 : 0, sit = st.pose === 'sit';
  const bob = sit ? 0 : -Math.abs(s1) * 3;
  const stream = st.stream ? 1 : 0; // Light Trails: ears swept back, tail lifted and streaming
  return { a, s1, bite, sit, bob, stream, by: (sit ? -24 : -26) + bob, hx: 24 + bite * 7, hy: -44 + bob * 0.6 + bite * 5, tw: s1 * 4 + stream * 6, back: (bite ? 6 : 0) + stream * 9 };
}

// base frame (variant 0)
export function wolfSvg(st = {}) {
  const { a, bite, sit, by, hx, hy, tw, back, stream } = wolfGeom(st);
  const alpha = !!st.alpha;
  let b = G(0, -24, 50, 30, R.glow, 0.42);
  // tail: plume streaming into light (Light Trails: a longer glow plus a bright streamer off the tip)
  b += `<path d="M-26 ${f(by - 4)} Q${f(stream ? -52 : -46)} ${f(-44 + tw)} ${f(stream ? -68 : -62)} ${f(-40 + tw * 1.4)}" stroke="${R.glow}" stroke-width="10" fill="none" opacity=".35" stroke-linecap="round" filter="url(#blur3)"/>`;
  if (stream) b += streamer([[-50, -42 + tw], [-60, -45 + tw * 1.2], [-69, -40 + tw * 1.4]], 6);
  b += SP(furry([[-22, by - 2], [-34, by - 14 + tw * 0.3], [-46, -48 + tw * 0.7], [-54, -40 + tw], [-48, -32 + tw * 0.7], [-36, by + 2], [-26, by + 6]], 2.6, -1, 12, [0, 1, 1, 0, 0, 0, 0], 0.7), { lt: '#ffffff', sh: 3 });
  // legs (far pair darker), fading to mist below the knee
  const leg = (x, ph, far) => { const sw = sit ? 0 : Math.sin(ph) * 7, lift = sit ? 0 : Math.max(0, -Math.cos(ph)) * 4; return mistLeg(x, by + 6, x + sw, -2 - lift, far ? 4.6 : 5.4, far ? 3 : 3.6, far ? { c: R.dk } : R); };
  b += leg(12, a + Math.PI, 1) + leg(-16, a, 1) + leg(-12, a + Math.PI, 0) + leg(16, a, 0);
  // body bean
  b += SP(furry([[18, by + 9], [21, by - 3], [10, by - 12], [-8, by - 12], [-22, by - 8], [-27, by + 2], [-20, by + 10], [0, by + 11]], 2.2, -1, 5, [0, 0, 1, 1, 0, 0, 0, 0], 0.6),
    { sh: 5, tex: `<ellipse cx="-4" cy="${f(by + 10)}" rx="24" ry="5" fill="${R.dk}" opacity=".45" filter="url(#sb2)"/><path d="M-24 ${f(by - 2)} Q-8 ${f(by - 12)} 10 ${f(by - 9)}" stroke="#ffffff" stroke-width="2.4" fill="none" opacity=".6" stroke-linecap="round"/>` });
  if (alpha) { // The Alpha's signature: a frost mane of drifting pale light along the neck and back
    const q = rng(9);
    for (let i = 0; i < 9; i++) { const x = 12 - i * 4.4, y = by - 10 + i * 0.6; b += tick(x, y, 12 + q() * 6, -2.3 - q() * 0.4, 2.4, i % 2 ? '#e8f7ff' : R.c, 0.9); }
    b += `<path d="M14 ${f(by - 12)} Q-6 ${f(by - 22)} -26 ${f(by - 12)}" stroke="#ffffff" stroke-width="1.6" fill="none" opacity=".7" stroke-linecap="round"/>`;
  }
  // chest ruff
  b += SP(blob([[hx - 18, hy + 10], [hx - 6, hy + 15], [hx - 2, hy + 24], [hx - 10, by + 10], [hx - 22, by + 4]]), { col: '#d9f0ff', sh: 2, tex: `<path d="M${f(hx - 14)} ${f(hy + 16)} l3 4 M${f(hx - 9)} ${f(hy + 19)} l2 4" stroke="${R.dk}" stroke-width="1.4" stroke-linecap="round" opacity=".6"/>` });
  // head: big round chibi head, tall ears with a warm inner glow, short muzzle
  const H = 19;
  const ear = (dx, far) => { const s0 = far ? 0.8 : 1;
    return SP(blob([[hx + dx - 9 * s0, hy - H + 7], [hx + dx - 8 * s0, hy - H - 4], [hx + dx - back * 0.6, hy - H - 18 * s0], [hx + dx + 7 * s0, hy - H - 2], [hx + dx + 8 * s0, hy - H + 8]]), { col: far ? R.dk : R.c, sh: 2, rim: far ? 0 : 2,
      tex: far ? '' : `<path d="${blob([[hx + dx - 4, hy - H + 6], [hx + dx - 3, hy - H - 4], [hx + dx - back * 0.55 + 0.5, hy - H - 12], [hx + dx + 3, hy - H - 2], [hx + dx + 3.5, hy - H + 6]])}" fill="${mix(EMBER, R.c, 0.45)}" opacity=".7" filter="url(#sb1)"/>` }); };
  b += ear(-9, 1);
  b += SP(furry([[hx - 18, hy + 6], [hx - 19, hy - 6], [hx - 12, hy - 16], [hx, hy - 19], [hx + 12, hy - 16], [hx + 18, hy - 6], [hx + 17, hy + 6], [hx + 8, hy + 15], [hx - 8, hy + 15]], 2.6, -1, 31, [1, 0, 0, 0, 0, 0, 0, 1, 1], 0.5), { sh: 6, lt: '#ffffff' });
  b += ear(5, 0);
  if (stream) for (const [dx, s0] of [[-9, 0.8], [5, 1]]) { const x = hx + dx - back * 0.6, y = hy - H - 18 * s0; b += streamer([[x, y + 2], [x - 9, y + 5], [x - 16, y + 12]], s0 > 0.9 ? 3.4 : 2.6); }
  const mx = hx + 15, my = hy + 6, bo = bite ? 2 : 0;
  if (bite) b += `<path d="M${f(mx - 6)} ${f(my + 2)} Q${f(mx + 6)} ${f(my + 13)} ${f(mx + 12)} ${f(my + 7)} L${f(mx + 4)} ${f(my + 4)}Z" fill="${R.ink}"/>` + SP(ell(mx + 1, my + 10, 7, 3), { sh: 1, rim: 1 });
  b += SP(ell(mx, my - bo, 9.5, 6.6), { col: '#e6f5ff', sh: 2, lt: '#ffffff', lw: 2.2 });
  b += `<ellipse cx="${f(mx + 8.4)}" cy="${f(my - 3 - bo)}" rx="3.2" ry="2.5" fill="${R.ink}"/><ellipse cx="${f(mx + 7.6)}" cy="${f(my - 4 - bo)}" rx="1" ry=".8" fill="#fff"/>`;
  if (!bite) b += `<path d="M${f(mx - 3)} ${f(my + 3)} q3.4 2.6 7 0.4" stroke="${R.ink}" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".8"/>`;
  b += sEye(hx + 5, hy - 2, 4, alpha ? AMBER_EYE : R.ink);
  b += `<ellipse cx="${f(hx - 5)}" cy="${f(hy + 6)}" rx="4.4" ry="2.6" fill="${EMBER}" opacity=".35"/>`;
  b += heart(hx - 8, hy + 22, alpha ? 1.3 : 1.05); // ember heart: Wren's light it follows
  if (bite) b += crescents(hx + (stream ? 22 : 28), hy + 7, 0.7); // jaws closing: two small crescents in front of the muzzle (inside the frame)
  return b;
}

// overlay frames, drawn in the REST pose (lope frame 0); OV_OFF moves them onto every other pose. 0 notched ear, 1 chest tuft, 2 curl tail.
export function wolfOverlaySvg(k) {
  const { hx, hy } = wolfGeom({ ph: 0 }), H = 19;
  if (k === 0) { // a nick out of the near ear's front edge: ink notch + cream lip (reads as a torn ear at 2x)
    const ex = hx + 5, ey = hy - H;
    return `<path d="M${f(ex + 2.6)} ${f(ey - 11.5)} L${f(ex + 7.6)} ${f(ey - 9.4)} L${f(ex + 3.4)} ${f(ey - 7.2)}Z" fill="${R.ink}" stroke="${R.ink}" stroke-width="1.6" stroke-linejoin="round"/>`
      + `<path d="M${f(ex + 3.6)} ${f(ey - 7.4)} L${f(ex + 6.6)} ${f(ey - 8.8)}" stroke="${WARM}" stroke-width="1" opacity=".8" stroke-linecap="round"/>`;
  }
  if (k === 1) { // white chest tuft below the ruff
    const x = hx - 9, y = hy + 24;
    return tick(x - 3, y - 1, 8, 2.2, 2.2, R.ink, 0.5) + tick(x, y, 9, 1.9, 2.4, '#ffffff', 0.95) + tick(x + 3.5, y - 1, 7, 1.6, 2, '#ffffff', 0.9);
  }
  // curl tail: the plume tip rolls into a small curl (ink under-stroke + pale top stroke)
  const tw = 0, x = -52, y = -43 + tw;
  return `<path d="M${f(x)} ${f(y)} q-7 -4 -3 -10 q3 -3 6 0" stroke="${R.ink}" stroke-width="5.4" fill="none" stroke-linecap="round" opacity=".85"/>`
    + `<path d="M${f(x)} ${f(y)} q-7 -4 -3 -10 q3 -3 6 0" stroke="${R.lt}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
}

// per base frame, per overlay: [dx, dy] in du from the rest pose
const ovOff = (st) => {
  const g = wolfGeom(st), g0 = wolfGeom({ ph: 0 });
  const dh = [g.hx - g0.hx, g.hy - g0.hy];
  return [[dh[0] - g.back * 0.6, dh[1]], dh, [0, g.tw - g0.tw]];
};
export const OV_OFF = WOLF_POSES.map((st) => ovOff(st));
export const OV_OFF_LF = WOLF_POSES.map((st) => ovOff({ ...st, stream: 1 })); // Light Trails frames (ears swept back, tail lifted)

// grim = gold rim: threshold the body (alpha >= 0.5, so the soft halo and the mist feet never get a rim), then a 2.6 du soft band (blurred) and a
// 1.1 du hot line OUTSIDE the silhouette. hollow = the Echo look: a faint ghost body (0.22) + a pale 2.2 du edge line, no rim.
const FU = 'filterUnits="userSpaceOnUse" x="-3000" y="-3000" width="6000" height="6000" color-interpolation-filters="sRGB"';
const MASK = '<feComponentTransfer in="SourceAlpha" result="m"><feFuncA type="discrete" tableValues="0 0 1 1"/></feComponentTransfer>';
const EXTRA = '<filter id="blur3" filterUnits="userSpaceOnUse" x="-3000" y="-3000" width="6000" height="6000"><feGaussianBlur stdDeviation="3"/></filter>'
  + '<filter id="blur1" filterUnits="userSpaceOnUse" x="-3000" y="-3000" width="6000" height="6000"><feGaussianBlur stdDeviation="1.2"/></filter>'
  + `<filter id="grim" ${FU}>${MASK}<feMorphology in="m" operator="dilate" radius="${RIM_SOFT}" result="d2"/><feGaussianBlur in="d2" stdDeviation=".8" result="d2b"/>`
  + `<feMorphology in="m" operator="dilate" radius="${RIM_HOT}" result="d1"/><feComposite in="d2b" in2="m" operator="out" result="soft"/><feComposite in="d1" in2="m" operator="out" result="hot"/>`
  + `<feFlood flood-color="${GOLD}" flood-opacity=".8"/><feComposite in2="soft" operator="in" result="sc"/><feFlood flood-color="${GOLD_HOT}"/><feComposite in2="hot" operator="in" result="hc"/>`
  + '<feMerge><feMergeNode in="sc"/><feMergeNode in="SourceGraphic"/><feMergeNode in="hc"/></feMerge></filter>'
  + `<filter id="hollow" ${FU}>${MASK}<feMorphology in="m" operator="erode" radius="2.2" result="e"/><feComposite in="m" in2="e" operator="out" result="edge"/>`
  + '<feFlood flood-color="#e6f6ff"/><feComposite in2="edge" operator="in" result="line"/><feGaussianBlur in="line" stdDeviation=".5" result="lb"/>'
  + '<feComponentTransfer in="SourceGraphic" result="ghost"><feFuncA type="linear" slope="0.22"/></feComponentTransfer><feMerge><feMergeNode in="ghost"/><feMergeNode in="lb"/><feMergeNode in="lb"/></feMerge></filter>';

// Echo Pack: the same wolf as a hollow outline of light; it keeps a pale eye and its warm heart (friendly, never red), soft glow behind
export function echoSvg(st = {}) {
  const { hx, hy } = wolfGeom(st);
  return G(0, -24, 46, 28, R.glow, 0.3) + `<g filter="url(#hollow)">${wolfSvg(st)}</g>`
    + `<ellipse cx="${f(hx + 5)}" cy="${f(hy - 2)}" rx="2.4" ry="3" fill="#e6f6ff" opacity=".9"/>` + heart(hx - 8, hy + 22, 0.8);
}
// evolved wolf (gold rim); The Alpha (frost mane, amber eyes, gold rim); Light Trails wolf (streaming ears/tail, gold rim)
export const goldSvg = (st = {}) => `<g filter="url(#grim)">${wolfSvg(st)}</g>`;
// per bake kind: [painter(index), du box]
export const KIND = {
  base: [(i) => wolfSvg(WOLF_POSES[i]), WOLF_BOX], ov: [(i) => wolfOverlaySvg(i), WOLF_BOX], flat: [() => wolfSvg(WOLF_POSES[0]), WOLF_BOX],
  gold: [(i) => goldSvg(WOLF_POSES[i]), WOLF_BOX], flatg: [() => goldSvg(WOLF_POSES[0]), WOLF_BOX],
  lfoot: [(i) => goldSvg({ ...WOLF_POSES[i], stream: 1 }), LF_BOX],
  alpha: [(i) => goldSvg({ ...WOLF_POSES[i], alpha: 1 }), ALPHA_BOX],
  echo: [(i) => echoSvg(WOLF_POSES[i]), WOLF_BOX],
};

// One SVG sheet holding every wolf frame at its packed atlas rect (page coordinates). frames: [{ x, y, w, h, kind: 'base'|'ov'|'flat', i }].
export function wolfSheet(frames, pageW, pageH) {
  resetAll();
  setGrainBox(WOLF_BOX[0], WOLF_BOX[1], WOLF_BOX[2], WOLF_BOX[3]);
  let body = '';
  for (const fr of frames) {
    const [paint, box] = KIND[fr.kind];
    // the viewBox is the du box: a 128 x 96 frame is 1 texel per du, the 96 x 72 Low flats are 0.75
    body += `<svg x="${fr.x}" y="${fr.y}" width="${fr.w}" height="${fr.h}" viewBox="${box.join(' ')}" overflow="hidden">${paint(fr.i)}</svg>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${pageW}" height="${pageH}" viewBox="0 0 ${pageW} ${pageH}">${defs()}<defs>${EXTRA}</defs>${body}</svg>`;
}
