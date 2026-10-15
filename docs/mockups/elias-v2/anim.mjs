// elias-v2-animation.png: idle 4, walk 6 (flame ring orbiting), hurt, fade-to-light, full CANDLE WHEEL sequence (10 keyframes), code-driven notes, rig + pivots. Mock-up only.
import { begin, use, T, FONT, glow } from '../style-lab/lab.mjs';
import { STYLES } from '../style-lab/scene.mjs';
import { svgPage, bg, shadow } from '../wren-sheet/common.mjs';
import { elias2, orbFlame, hollowDisc, bloomDisc, poleX } from './elias2.mjs';
import { banner } from './sheet.mjs';

const X0 = 14, WIDTH = 842;
const spark = (x, y, r, c = '#fff6d0', a = 1) => `<path d="M${x} ${y - r} Q${x + r * 0.15} ${y - r * 0.15} ${x + r} ${y} Q${x + r * 0.15} ${y + r * 0.15} ${x} ${y + r} Q${x - r * 0.15} ${y + r * 0.15} ${x - r} ${y} Q${x - r * 0.15} ${y - r * 0.15} ${x} ${y - r}Z" fill="${c}" opacity="${a}" style="mix-blend-mode:screen"/>`;
const cross = (x, y, r = 2.6, a = 0.95) => `<path d="M${x - r} ${y} h${2 * r} M${x} ${y - r} v${2 * r}" stroke="#d6ffb0" stroke-width="1.7" stroke-linecap="round" opacity="${a}"/>`;
function rowBox(y, h, tags) {
  let o = `<rect x="8" y="${y}" width="${WIDTH + 12}" height="${h}" rx="10" fill="#161e29" stroke="#3a4757"/>`;
  for (const [x, t, s] of tags) o += T(t, x, y + 13, { s: 12.5, f: FONT.title, w: 900, c: '#ffd98a' }) + T(s, x + 14 + t.length * 9.6, y + 13, { s: 9, c: '#9fb0c2', w: 600 });
  return o;
}
const cellBox = (x, y, w, h, n, label = '') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="7" fill="#1b2430" stroke="#2c3948"/>` + T(String(n), x + 6, y + 12, { s: 9, c: '#6e7f92', w: 800, f: FONT.mono }) + (label ? T(label, x + w - 5, y + 12, { s: 8.6, c: '#8fa0b2', w: 700, a: 'end', f: FONT.mono }) : '');
const dot = (x, y, col) => `<circle cx="${x}" cy="${y}" r="2.3" fill="${col}" stroke="#fff" stroke-width=".8"/>`;

// the full Candle Wheel frame in unit coordinates (figure origin = feet). cell centre cx, ground by, scale K
const SX = 40; // pole x while planted (staffX param); ring is centred on the pole
export function wheelCell(cx, by, K, p) {
  const R = 149, ry = R * 0.4, px = poleX('3q', SX);
  let o = `<g transform="translate(${(cx - px * K).toFixed(1)},${by}) scale(${K})">`;
  const bloom = p.bloom ?? 0;
  if (bloom > 0 || p.hollow) o += hollowDisc(px, 0, R, ry) + bloomDisc(px, 0, R, ry, bloom, 4, 1.3);
  if (p.pool) o += glow(px, -4, R * 1.3, ry * 2.2, '#ffc45a', p.pool);
  if (p.shock) o += `<ellipse cx="${px}" cy="1" rx="${p.shock * 60}" ry="${p.shock * 20}" fill="none" stroke="#ffe3a6" stroke-width="3" opacity="${1 - p.shock * 0.5}"/>`;
  const fig = elias2({ view: '3q', expr: p.expr || 'brace', staffX: p.staffX ?? 47, staffUp: p.up || 0, lean: p.lean ?? 0, fl: p.fl, orbs: p.orbs, wheel: p.wheel });
  o += `<ellipse cx="0" cy="2" rx="40" ry="7" fill="#000" opacity=".3" filter="url(#b2)"/>` + fig;
  // flying / lifting orbs
  for (const [x, y, s] of p.fly || []) o += orbFlame(x, y, s || 0.95);
  // dust at the spade
  if (p.dust) for (let i = 0; i < 6; i++) { const a = i * 1.05, d = 8 + p.dust * 18 + (i % 2) * 6; o += `<ellipse cx="${(px + Math.cos(a) * d).toFixed(1)}" cy="${(-3 - Math.abs(Math.sin(a)) * 6 * p.dust).toFixed(1)}" rx="${(4 + (i % 3)).toFixed(1)}" ry="2.6" fill="#d9ccb0" opacity="${(0.8 - p.dust * 0.35).toFixed(2)}"/>`; }
  if (p.flash) o += glow(px, -6, 40, 28, '#fff2c0', p.flash) + spark(px, -8, 9, '#fff6d0', 0.9);
  // heal crosses
  if (p.heal) for (let i = 0; i < 5; i++) o += cross(-30 + i * 22 + (i % 2) * 6, -70 - (i % 3) * 14 - p.heal * 14, 3, 0.9);
  o += '</g>';
  return o;
}
const socket = (i, ph = 0.5, R = 149) => { const a = ph + i * Math.PI / 3, px = poleX('3q', SX); return [px + R * Math.cos(a), -5.5 + R * 0.4 * Math.sin(a)]; };

export function animPage() {
  begin(); use(STYLES.S1);
  let b = bg(1280, 720);
  const Y = [100, 226, 352, 488], H = [122, 122, 132, 132];
  const K = 0.62, CW = 92;
  // ---------- row 0: IDLE (4) + FADE (5) ----------
  b += rowBox(Y[0], H[0], [[14, 'IDLE', 'loop 3.0 s'], [14 + 4 * CW + 10, 'FADE TO LIGHT', 'the lamp stays']]);
  const cellY0 = Y[0] + 18, ch0 = H[0] - 24;
  const idle = [{ sy: 1, fl: 1, ph: 0.9, ex: 'kind', tilt: 0, bob: 0 }, { sy: 1.02, fl: 1.12, ph: 2.1, ex: 'kind', tilt: 2, bob: -0.8 }, { sy: 1.03, fl: 0.94, ph: 3.3, ex: 'blink', tilt: 0, bob: -1.4 }, { sy: 1.01, fl: 1.06, ph: 4.5, ex: 'tender', tilt: -3, bob: -0.5 }];
  idle.forEach((f, i) => {
    const x = X0 + i * CW, cx = x + (CW - 4) / 2 - 12, by = Y[0] + H[0] - 14;
    b += cellBox(x, cellY0, CW - 4, ch0, i) + glow(cx + 14, by - 70, 30, 40, '#ffc45a', 0.22) + shadow(cx, by + 2, 26) + `<g transform="translate(${cx.toFixed(1)},${by}) scale(${K})">${elias2({ view: '3q', expr: f.ex, sy: f.sy, fl: f.fl, tilt: f.tilt, bob: f.bob, orbs: { n: 3, ph: f.ph } })}</g>`;
  });
  { const x = X0, cx = x + (CW - 4) / 2 - 12, by = Y[0] + H[0] - 14, pts = [[0, 0, '#ff4fa0'], [0, -60, '#ff4fa0'], [poleX('3q', 47), -48, '#4fd0ff'], [poleX('3q', 47), -104, '#ffd05a'], [0, -46, '#7fe08a']]; for (const [px, py, col] of pts) b += dot(cx + px * K, by + py * K, col); }
  // fade-to-light: staff stays planted and lit while he goes
  const fx0 = X0 + 4 * CW + 10, fade = [
    { expr: 'hurt', sy: 0.96, sx: 1.03, lean: -6, light: 0, alpha: 1, up: 0 },
    { expr: 'death', sy: 0.8, sx: 1.1, lean: -2, light: 0.25, alpha: 1, up: 0 },
    { expr: 'death', sy: 0.98, sx: 1, lean: 0, light: 0.5, alpha: 0.8, up: 1 },
    { expr: 'death', sy: 1.1, sx: 0.94, lean: 0, light: 0.75, alpha: 0.55, up: 2 },
    { expr: 'death', sy: 1.14, sx: 0.9, lean: 0, light: 1, alpha: 0.22, up: 3 },
  ];
  fade.forEach((f, i) => {
    const x = fx0 + i * CW, cx = x + (CW - 4) / 2 - 12, by = Y[0] + H[0] - 14, rise = f.up * 4;
    b += cellBox(x, cellY0, CW - 4, ch0, i) + glow(cx, by - 40, 26 + f.up * 8, 40 + f.up * 8, '#ffd98a', 0.15 + f.up * 0.14);
    b += `<g transform="translate(${cx.toFixed(1)},${by}) scale(${K})">${elias2({ view: '3q', staff: false, expr: f.expr, sy: f.sy, sx: f.sx, lean: f.lean, light: f.light || undefined, alpha: f.alpha, fl: 0.6, pk: 1 - f.light * 0.4 })}</g>`.replace('translate(', `translate(0,${-rise}) translate(`);
    // the staff stays planted where he stood: lantern + chandelier keep burning, wheel slides to the ground by itself (last light to go)
    b += `<g transform="translate(${cx.toFixed(1)},${by}) scale(${K})">${elias2({ view: '3q', noBody: true, expr: 'death', fl: 0.85 + i * 0.06, wheel: { low: Math.min(1, i / 3.5), open: Math.min(0.3, i * 0.08), R: 60, fs: 0.8 } })}</g>`;
    if (i >= 2) for (let k = 0; k < 4 + i; k++) b += spark(cx + ((k * 37) % 40) - 28, by - 24 - ((k * 23) % 56) - rise, 2 + (k % 3), '#fff0c0', 0.9);
  });

  // ---------- row 1: WALK (6) + HURT (3) ----------
  b += rowBox(Y[1], H[1], [[14, 'WALK', 'cycle 0.9 s, slow and heavy'], [14 + 6 * CW + 10, 'HURT', '0.25 s']]);
  for (let i = 0; i < 6; i++) {
    const x = X0 + i * CW, p = (i / 6) * Math.PI * 2, cx = x + (CW - 4) / 2 - 10, by = Y[1] + H[1] - 14, pass = 1 - Math.abs(Math.cos(p));
    b += cellBox(x, Y[1] + 18, CW - 4, H[1] - 24, i) + glow(cx + 10, by - 70, 30, 40, '#ffc45a', 0.22) + shadow(cx, by + 2, 26);
    b += `<g transform="translate(${cx.toFixed(1)},${by}) scale(0.58)">${elias2({ view: '3q', run: true, leg: p, bob: -pass * 2.6, sway: Math.sin(p) * 4, lean: 3 + Math.sin(p) * 1.2, staffTilt: 3.5 + Math.sin(p) * 3, orbs: { n: 3, ph: 0.9 + p * 0.9 }, fl: 1 + Math.sin(p * 2) * 0.08 })}</g>`;
  }
  const hx0 = X0 + 6 * CW + 10, hurt = [{ expr: 'tender', flash: 0, sx: 1, sy: 1, lean: 0, dx: 0 }, { expr: 'hurt', flash: true, sx: 1.1, sy: 0.9, lean: -8, dx: -4 }, { expr: 'hurt', flash: 'red', sx: 0.96, sy: 1.05, lean: -10, dx: -7 }];
  hurt.forEach((f, i) => {
    const x = hx0 + i * CW, cx = x + (CW - 4) / 2 - 10 + f.dx, by = Y[1] + H[1] - 14;
    b += cellBox(x, Y[1] + 18, CW - 4, H[1] - 24, i) + shadow(cx, by + 2, 26);
    b += `<g transform="translate(${cx.toFixed(1)},${by}) scale(0.58)">${elias2({ view: '3q', expr: f.expr, flash: f.flash, sx: f.sx, sy: f.sy, lean: f.lean, orbs: { n: 3, ph: 0.9 + i * 0.6, s: i ? 0.7 : 1.1 }, fl: i ? 0.45 : 1, pk: i ? 0.5 : 1 })}</g>`;
    if (i === 1) { const sx = cx + 22, sy = by - 74; b += `<path d="M${sx} ${sy - 16} L${sx + 4} ${sy - 4} L${sx + 16} ${sy - 6} L${sx + 8} ${sy + 3} L${sx + 14} ${sy + 14} L${sx + 2} ${sy + 8} L${sx - 8} ${sy + 16} L${sx - 5} ${sy + 4} L${sx - 16} ${sy - 2} L${sx - 4} ${sy - 5}Z" fill="#fff4dc" stroke="#ff8a3a" stroke-width="1.6" opacity=".95"/>`; }
  });

  // ---------- rows 2-3: CANDLE WHEEL (10 keyframes) ----------
  const WK = 0.48, WC = 166.4;
  b += rowBox(Y[2], H[2], [[14, 'CANDLE WHEEL', 'Sanctuary: plant, lower, open, bloom (frames 0-4)']]);
  b += rowBox(Y[3], H[3], [[14, 'CANDLE WHEEL', 'orbs lock, 6 s hold, fade, after (frames 5-9)']]);
  const orbitA = (ph) => [0, 1, 2].map((q) => { const a = ph + q * 2.094; return [52 * Math.cos(a) + 0, -46 + 52 * 0.34 * Math.sin(a) + 2, 0.95 * (0.86 + 0.14 * Math.sin(a))]; });
  const frames = [
    { n: 'READY', t: '0.0 s', p: { expr: 'brace', hollow: true, orbs: { n: 3, ph: 0.9 }, pool: 0.25 } },
    { n: 'LIFT', t: '0.25 s', p: { expr: 'brace', hollow: true, up: 17, lean: -3, fl: 1.35, orbs: { n: 3, ph: 2.3 }, pool: 0.25 } },
    { n: 'PLANT (spade drives in)', t: '0.45 s', p: { expr: 'brace', hollow: true, staffX: SX, lean: 4, fl: 1.5, dust: 0.8, flash: 0.8, shock: 0.5, orbs: { n: 3, ph: 3.5 }, pool: 0.3 } },
    { n: 'LOWER (wheel slides down)', t: '0.7 s', p: { expr: 'brace', hollow: true, staffX: SX, lean: 3, fl: 1.4, wheel: { low: 0.62, open: 0.2, R: 149, fs: 0.9, ph: 0.5 }, orbs: { n: 3, ph: 4.3 }, pool: 0.4, shock: 1 } },
    { n: 'OPEN (grey ground wakes)', t: '1.0 s', p: { expr: 'brace', hollow: true, staffX: SX, bloom: 0.38, wheel: { low: 1, open: 0.6, R: 149, fs: 1.0, ph: 0.8 }, orbs: { n: 3, ph: 5.1 }, pool: 0.55 } },
    { n: 'BLOOM (orbs fly in)', t: '1.5 s', p: { expr: 'kind', hollow: true, staffX: SX, bloom: 1, wheel: { low: 1, open: 1, R: 149, fs: 1.1, ph: 0.5 }, pool: 0.8, fly: [[-36, -64, 1], [10, -88, 1], [66, -60, 1]].map(([x, y, s], i) => { const t = 0.5, [tx, ty] = socket(i * 2); return [x + (tx - x) * t, y + (ty - y) * t - 20, 0.95]; }) } },
    { n: 'LOCK (orbs in the ring)', t: '2.0 s', p: { expr: 'kind', hollow: true, staffX: SX, bloom: 1, wheel: { low: 1, open: 1, R: 149, fs: 1.1, ph: 0.5, lock: [0, 2, 4] }, pool: 1, heal: 0.4 } },
    { n: 'HOLD (heals 6 s)', t: '2.0 - 8.0 s', p: { expr: 'glad', hollow: true, staffX: SX, bloom: 1, wheel: { low: 1, open: 1, R: 149, fs: 1.1, ph: 1.0, lock: [0, 2, 4] }, pool: 1, heal: 1 } },
    { n: 'FADE (orbs lift back)', t: '8.0 s', p: { expr: 'kind', hollow: true, staffX: SX, bloom: 1, wheel: { low: 1, open: 1, R: 149, fs: 1.1, ph: 1.4, bk: 0.4 }, pool: 0.45, fl: 0.8, fly: [[-30, -66], [12, -84], [58, -64]].map(([x, y], i) => { const [tx, ty] = socket(i * 2, 1.4); return [x + (tx - x) * 0.45, y + (ty - y) * 0.45 - 14, 0.9]; }) } },
    { n: 'AFTER (colour stays)', t: '8.6 s', p: { expr: 'kind', hollow: true, staffX: 47, up: 6, bloom: 1, wheel: { low: 0.15, open: 0, ph: 0.5 }, orbs: { n: 3, ph: 1.2 }, pool: 0.25 } },
  ];
  frames.forEach((F, i) => {
    const r = i < 5 ? 2 : 3, col = i % 5, x = X0 + col * WC, y = Y[r] + 18, w = WC - 4, h = H[r] - 24, cx = x + w / 2 + 2, by = y + h - 30;
    b += cellBox(x, y, w, h, i, F.t) + T(F.n, x + w / 2, y + h - 5, { s: 9.4, c: '#e8edf3', w: 800, a: 'middle', f: FONT.ui });
    b += `<clipPath id="wcl${i}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="7"/></clipPath><g clip-path="url(#wcl${i})">${wheelCell(cx, by, WK, F.p)}</g>`;
  });

  // ---------- right: notes ----------
  const NX = 866, NW = 406, NH = Y[3] + H[3] - Y[0];
  b += `<rect x="${NX}" y="${Y[0]}" width="${NW}" height="${NH}" rx="10" fill="#161e29" stroke="#3a4757"/>` + T('HOW IT IS ANIMATED IN CODE', NX + 12, Y[0] + 20, { s: 12.5, f: FONT.title, w: 900, c: '#ffd98a' });
  const notes = [
    ['IDLE', ['body.scaleY = 1 + .03*sin(t), pivot at feet; head tilt +-3 deg (neck)', 'chandelier flames flicker (scale .94-1.12, 2 phases, never in step)', 'flame ring: 3 orbit flames, phase += 2.2 rad/s (Holy Orbit speed)', 'pocket glow breathes +-12% on its own slow sine; blink 0.12 s / 4 s']],
    ['WALK', ['phase advances with DISTANCE, 0.9 s cycle (Wren 0.6): heavy steps', 'boot lift 3px, bob 2.6px, coat hem sways +-4, staff tilts +-3 deg', 'flames lean back opposite the move; ring orbits on, 0.9 rad/step', 'a soft gold wake streams behind the chandelier (G2 trail)']],
    ['HURT / FADE', ['0-60 ms white tint, red tint to 0.25 s; squash 1.1 x .9; knock 4-7px', 'wheel gutters (fl .45), pockets dim .5, orbit flames shrink', 'FADE: body alpha 1 -> .22 + cream-light filter, rises 12px, sparks', 'the STAFF stays planted and lit: the wheel slides down by itself']],
    ['CANDLE WHEEL', ['0 ready: brace face, flames flare. 1 lift: staffUp +17, lean -3', '2 plant: pole slides in to x 40, spade tip 0.0 at 0.45 s; dust x6, shock', '3 lower: collar y -104 -> -5.5 over 0.3 s (ease-out); ring r 21 -> 149', '4-5 open/bloom: grass disc radius lerp 0 -> 149 (80px), 0.5 s each', '6 lock: 3 flames ease from orbit to sockets 0/2/4 (lilac among gold)', '7 hold 6 s: orbit locked, 5 heal crosses rise; ring turns .15 rad/s', '8 fade: dim ring .4, orbs lift back to the waist; 9: collar up, ring', '    r -> 21, hollow edge heals; the grass disc STAYS (colour is kept)']],
  ];
  let ny = Y[0] + 38;
  notes.forEach(([t, ls]) => {
    b += T(t, NX + 12, ny + 8, { s: 11, f: FONT.mono, w: 900, c: '#ffb84a' });
    ls.forEach((l, j) => { b += T(l, NX + 12, ny + 23 + j * 12.6, { s: 9.2, c: '#d3dce6', w: 500 }); });
    ny += 23 + ls.length * 12.6 + 12;
  });
  // ---------- rig ----------
  const RY = Y[3] + H[3] + 4;
  b += `<rect x="8" y="${RY}" width="1264" height="${720 - RY - 4}" rx="10" fill="#161e29" stroke="#3a4757"/>` + T('RIG', 20, RY + 15, { s: 12, f: FONT.title, w: 900, c: '#ffd98a' });
  const rig = [
    ['ELIAS', 'wheel-back (half ring + back candles) > pole + 3 bands > spade > lantern top > [spare candles] > trousers + boots (2) > coat + patches + 4 pockets (glow + spill fan each) > far arm+hand > near arm+hand'],
    ['', '> head [ears(2) > hair > cap + brim > face > brows(2) > moustache(2)] > collar hub > wheel-front (front candles) > flame ring [3-6 orbit flames, back / front halves]. Origin = feet, unit = 0.536px at desktop.'],
    ['PIVOTS', 'root (0,0) | body squash (0,-13) | neck (0,-60) | near hand (47,-48) | pole x 47 (40 planted) | collar rides y -104 -> -5.5 | spade tip (47,0) | chandelier ring c (47,-104) r 21 (ground ring r 149 = 80px)'],
    ['', 'lantern flame (47,-124) | orbit c (0,-46) R 52, ry .34R | pockets (-18,-26) (18,-26) (-13,-45) (15,-46) | ring sockets 6 at 60 deg, orbs lock into 0/2/4. IDLE 0 dots: pink root+neck, blue hand, amber ring centre, green orbit centre.'],
  ];
  rig.forEach(([k, tx], i) => { b += T(k, 62, RY + 15 + i * 12.4, { s: 9.2, f: FONT.mono, w: 900, c: '#ffb84a' }) + T(tx, 112, RY + 15 + i * 12.4, { s: 9.2, c: '#d3dce6', w: 500 }); });
  b += banner('ELIAS v2 ANIMATION: Lamplighter + Candle Wheel', 'Code-driven strips: idle, walk with flame ring, hurt, fade-to-light, the full Candle Wheel.');
  return svgPage(1280, 720, b);
}
