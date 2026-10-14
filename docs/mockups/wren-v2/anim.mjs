// wren-v2-animation.png: frame strips (idle, run with pup following, hurt, death, Pack Howl) + code notes + rig/pivot list. Mock-up only.
import { begin, use, T, FONT, glow, wolf } from '../style-lab/lab.mjs';
import { STYLES } from '../style-lab/scene.mjs';
import { svgPage, bg, shadow } from '../wren-sheet/common.mjs';
import { wren2, pup2, ember } from './wren2.mjs';
import { banner } from './sheet.mjs';

const K = 0.7, ROW = 110, Y0 = 100, X0 = 112, CW = 105;
const spark = (x, y, r, c = '#fff6d0', a = 1) => `<path d="M${x} ${y - r} Q${x + r * 0.15} ${y - r * 0.15} ${x + r} ${y} Q${x + r * 0.15} ${y + r * 0.15} ${x} ${y + r} Q${x - r * 0.15} ${y + r * 0.15} ${x - r} ${y} Q${x - r * 0.15} ${y - r * 0.15} ${x} ${y - r}Z" fill="${c}" opacity="${a}" style="mix-blend-mode:screen"/>`;
function rowShell(ri, title, sub, n, sub2 = '') {
  const y = Y0 + ri * ROW;
  let o = `<rect x="8" y="${y}" width="768" height="${ROW - 6}" rx="10" fill="#161e29" stroke="#3a4757"/>`;
  o += T(title, 18, y + 24, { s: 14, f: FONT.title, w: 900, c: '#ffd98a' }) + T(sub, 18, y + 38, { s: 9.5, c: '#9fb0c2', w: 600 }) + T(sub2, 18, y + 50, { s: 9.5, c: '#9fb0c2', w: 600 });
  for (let i = 0; i < n; i++) o += `<rect x="${X0 + i * CW}" y="${y + 5}" width="${CW - 4}" height="${ROW - 16}" rx="7" fill="#1b2430" stroke="#2c3948"/>` + T(String(i), X0 + i * CW + 7, y + 17, { s: 9, c: '#6e7f92', w: 800, f: FONT.mono });
  return o;
}
const cell = (ri, i) => ({ cx: X0 + i * CW + (CW - 4) / 2, by: Y0 + ri * ROW + ROW - 16 });
const fig = (c, o, k = K) => `${shadow(c.cx, c.by + 2, 26)}<g transform="translate(${c.cx.toFixed(1)},${c.by})scale(${k})">${wren2(o)}</g>`;
const dot = (x, y, col) => `<circle cx="${x}" cy="${y}" r="2.3" fill="${col}" stroke="#fff" stroke-width=".8"/>`;

export function animPage() {
  begin(); use(STYLES.S1);
  let b = bg(1280, 720);
  const pupI = (v, ex = {}) => ({ x: -46, y: 6, view: v, pose: 'sit', expr: 'open', thread: true, ...ex });
  // ---- row 0: IDLE (4 frames, 2.4 s loop) ----
  b += rowShell(0, 'IDLE', 'loop 2.4 s', 4, '4 key poses + pup');
  const idle = [
    { sy: 1, ember: 0, expr: 'neutral', pup: { head: 0, wag: 0.2 } },
    { sy: 1.02, ember: -2, expr: 'neutral', pup: { head: 14, wag: 1.2, ex: 'wide' } },
    { sy: 1.03, ember: -3.5, expr: 'blink', pup: { head: 0, wag: 2.2, ex: 'closed' } },
    { sy: 1.01, ember: -1, expr: 'neutral', pup: { head: -12, wag: 0.9 } },
  ];
  idle.forEach((f, i) => { const c = cell(0, i); b += glow(c.cx - 10, c.by - 8, 34, 28, '#ffc45a', 0.3) + fig(c, { view: '3q', expr: f.expr, sy: f.sy, emberBob: f.ember, bob: -(f.sy - 1) * 4, tilt: i === 1 ? 3 : i === 3 ? -3 : 0, ear: i === 2 ? 8 : 0, pup: pupI('3q', { head: f.pup.head, wag: f.pup.wag, expr: f.pup.ex || 'open' }) }); });
  { const c = cell(0, 0), S = K, pts = [[0, 0, '#ff4fa0'], [0, -66, '#ff4fa0'], [-13, -96, '#4fd0ff'], [13, -96, '#4fd0ff'], [33, -80, '#ffd05a'], [-46, 0, '#7fe08a'], [-46 + 6 * 0.78, -27 * 0.78, '#7fe08a']]; for (const [x, y, col] of pts) b += dot(c.cx + x * S, c.by + y * S, col); }

  // ---- row 1: RUN (6 frames, 0.6 s cycle) with pup bounding behind ----
  b += rowShell(1, 'RUN', 'cycle 0.6 s', 6, 'pup lags .18s');
  for (let i = 0; i < 6; i++) {
    const c = cell(1, i); c.cx += 26; const p = (i / 6) * Math.PI * 2, lg = Math.cos(p), pass = 1 - Math.abs(lg);
    b += glow(c.cx - 10, c.by - 8, 34, 26, '#ffc45a', 0.28) + fig(c, { view: 'side', run: true, expr: 'neutral', leg: lg, lift: 5, sy: 0.95 + pass * 0.09, sx: 1.04 - pass * 0.07, bob: -pass * 3.5, lean: 6, tilt: -2 * lg, sway: Math.sin(p) * 5, tailLift: Math.sin(p) * 3, emberBob: Math.sin(p * 2) * 3, ember: { dx: 27, dy: -78 }, pup: { x: -80 + Math.sin(p - 1) * 5, y: 0, view: 'side', pose: 'run', ph: p - 1.6, bob: -Math.abs(Math.sin(p - 1.6)) * 4, thread: false, tongue: true } }, 0.56);
  }
  // ---- row 2: HURT ----
  b += rowShell(2, 'HURT', 'flash 0.25 s', 4, '+ 1.2 s i-frames');
  const hurt = [
    { expr: 'worried', flash: 0, sx: 1, sy: 1, lean: 0, dx: 0, pup: { expr: 'worry' } },
    { expr: 'hurt', flash: true, sx: 1.12, sy: 0.88, lean: -9, dx: -5, pup: { expr: 'hurt', flat: true } },
    { expr: 'hurt', flash: 'red', sx: 0.95, sy: 1.06, lean: -13, dx: -9, pup: { expr: 'hurt', flat: true } },
    { expr: 'worried', flash: 0, sx: 1, sy: 1, lean: -3, dx: -5, alpha: 0.65, pup: { expr: 'worry' } },
  ];
  hurt.forEach((f, i) => {
    const c = cell(2, i); c.cx += f.dx + 8;
    b += fig(c, { view: '3q', expr: f.expr, flash: f.flash, sx: f.sx, sy: f.sy, lean: f.lean, alpha: f.alpha, pup: pupI('3q', { expr: f.pup.expr, flat: f.pup.flat, y: i === 1 || i === 2 ? 8 : 6 }) });
    if (i === 1) { const x = c.cx + 24, y = c.by - 64; b += `<path d="M${x} ${y - 16} L${x + 4} ${y - 4} L${x + 16} ${y - 6} L${x + 8} ${y + 3} L${x + 14} ${y + 14} L${x + 2} ${y + 8} L${x - 8} ${y + 16} L${x - 5} ${y + 4} L${x - 16} ${y - 2} L${x - 4} ${y - 5}Z" fill="#fff4dc" stroke="#ff8a3a" stroke-width="1.6" opacity=".95"/>`; }
  });
  // ---- row 3: DEATH (fade to light; the pup stays, the ember is last to go) ----
  b += rowShell(3, 'DEATH', 'fade to light', 5, 'pup stays');
  const death = [
    { expr: 'hurt', sy: 0.96, sx: 1.03, lean: -6, light: 0, alpha: 1, up: 0, em: { dx: 18, dy: -68 } },
    { expr: 'death', sy: 0.78, sx: 1.12, lean: -2, light: 0.25, alpha: 1, up: 0, em: { dx: 16, dy: -56 } },
    { expr: 'death', sy: 0.98, sx: 1, lean: 0, light: 0.5, alpha: 0.85, up: 1, em: { dx: 14, dy: -40 } },
    { expr: 'death', sy: 1.1, sx: 0.94, lean: 0, light: 0.75, alpha: 0.7, up: 2, em: { dx: 10, dy: -22 } },
    { expr: 'death', sy: 1.14, sx: 0.9, lean: 0, light: 1, alpha: 0.4, up: 3, em: { dx: 4, dy: -12 } },
  ];
  death.forEach((f, i) => {
    const c = cell(3, i), rise = f.up * 4;
    b += glow(c.cx, c.by - 38, 30 + f.up * 8, 40 + f.up * 8, '#ffd98a', 0.15 + f.up * 0.18);
    b += `<g transform="translate(0,${-rise})">${fig(c, { view: '3q', expr: f.expr, sy: f.sy, sx: f.sx, lean: f.lean, light: f.light || undefined, alpha: f.alpha, ember: { ...f.em, s: 0.95, gl: 60 + i * 6 }, noThreads: true })}</g>`;
    // the pup does not rise: it stays on the ground and looks up (drawn outside the rise group)
    b += `<g transform="translate(${c.cx - 32},${c.by + 6}) scale(${K})">${pup2({ view: '3q', pose: 'sit', expr: i < 2 ? 'worry' : 'open', head: i < 2 ? 0 : -8 })}</g>`;
    if (i >= 2) for (let k = 0; k < 4 + i; k++) b += spark(c.cx + ((k * 37) % 50) - 25, c.by - 20 - ((k * 23) % 60) - rise, 2 + (k % 3), '#fff0c0', 0.9);
  });
  // ---- row 4: PACK HOWL (pup howls too, 2 ghost wolves answer) ----
  b += rowShell(4, 'PACK HOWL', 'ability', 5, '6 s buff, 60 s cd');
  const howl = [
    { expr: 'determined', sy: 0.93, lean: 4, tilt: 3, ring: 0, pup: { pose: 'sit', head: 0, expr: 'wide' }, wl: 0 },
    { expr: 'howl', sy: 1.02, lean: -3, tilt: -12, ring: 0.3, pup: { pose: 'howl' }, wl: 0.5 },
    { expr: 'howl', sy: 1.07, lean: -4, tilt: -20, ring: 0.7, pup: { pose: 'howl' }, wl: 1 },
    { expr: 'howl', sy: 1.04, lean: -2, tilt: -18, ring: 1, pup: { pose: 'howl' }, wl: 1 },
    { expr: 'smile', sy: 1, lean: 0, tilt: -3, ring: 1.2, pup: { pose: 'sit', expr: 'happy', wag: 1.5 }, wl: 0.6 },
  ];
  howl.forEach((f, i) => {
    const c = cell(4, i);
    if (f.ring > 0) { const rx = 22 + f.ring * 36, a = f.ring > 1 ? 0.35 : 0.9; b += `<ellipse cx="${c.cx}" cy="${c.by}" rx="${rx}" ry="${rx * 0.24}" fill="none" stroke="#ffb84a" stroke-width="8" opacity="${a * 0.5}" filter="url(#b4)" style="mix-blend-mode:screen"/><ellipse cx="${c.cx}" cy="${c.by}" rx="${rx}" ry="${rx * 0.24}" fill="none" stroke="#fff0c0" stroke-width="2" opacity="${a}"/>`; }
    if (f.wl > 0) for (const s of [-1, 1]) b += `<g opacity="${(0.55 + 0.4 * f.wl).toFixed(2)}"><g transform="translate(${c.cx + s * 47},${c.by + 1})scale(${s * -0.23},0.23)">${wolf({ enemy: false, f: 1 })}</g></g>`;
    const p = f.pup; b += fig(c, { view: 'front', expr: f.expr, sy: f.sy, lean: f.lean, tilt: f.tilt, ember: f.wl ? { dy: -100 + (i === 3 ? 3 : 0), s: 1.1 + f.wl * 0.1, gl: 80 + f.wl * 40, spark: 3 } : undefined, pup: pupI('front', { ...p, view: p.pose === 'howl' ? 'side' : 'front', x: p.pose === 'howl' ? -32 : -34, y: 9, front: true, thread: false }) });
    if (p.pose === 'howl') { const x = c.cx - 32 * K - 2, y = c.by - 50 * K; b += `<path d="M${x - 5} ${y + 3} q-5 -4 0 -8 M${x - 9} ${y + 6} q-8 -7 0 -14" fill="none" stroke="#ffd98a" stroke-width="1.2" stroke-linecap="round" opacity=".8"/>`; }
  });

  // ---- right: notes ----
  const NX = 788;
  b += `<rect x="${NX}" y="${Y0}" width="484" height="${ROW * 5 - 6}" rx="10" fill="#161e29" stroke="#3a4757"/>` + T('HOW IT IS ANIMATED IN CODE (no hand-drawn frames)', NX + 12, Y0 + 20, { s: 12.5, f: FONT.title, w: 900, c: '#ffd98a' });
  const notes = [
    ['IDLE', ['body.scaleY = 1 + .03*sin(t), pivot at feet; head tilt +-3 deg (pivot = neck)', 'ears lag the head 0.15 s; one ear flick per 4 s; glints blink 0.12 s every 3-5 s', 'ember = spring toward (33,-80) + bob 3px; thread is a 6-point verlet rope', 'PUP: sits, tail tip draws a small arc of light, head tilts at random (curious)']],
    ['RUN', ['phase advances with DISTANCE: foot.x = +-6.5*cos(phase), lift 5px, bob 3.5px', 'pelt tail = 3 segments, angle A*sin(phase), plus an additive amber streak behind', 'ember trails 6px behind and bobs at 2x frequency', 'PUP: spring-follows a heel point 46-80px behind (lag 0.18 s); 4-leg bound, ears back']],
    ['HURT', ['0-60 ms white tint, then red tint to 0.25 s; squash 1.12 x .88, knockback 6-9px', 'glints swap to "> <", ears fold flat, ember shrinks to 65% and flickers', 'then 1.2 s i-frames: alpha .65/1 at 10 Hz', 'PUP: ears flat + whimper pose for 0.6 s, then trots back to heel']],
    ['DEATH', ['squash to .78, glints soften to arcs; additive cream-amber copy fades in', 'body alpha 1 -> .4 while it stretches 14% and rises 16px; 8-12 sparks drift up', 'ember sinks to the ground and keeps glowing; it is the last light to go', 'PUP: does not fade; sits where she stood, head up (the saddest frame)']],
    ['HOWL', ['0.2 s crouch (scaleY .93), then pop: head -20 deg, glints close, mouth glows', 'ring = pooled additive ellipse, scale 0 -> R in .6 s; ember flares x1.3 + sparks', 'wolves: bright overlay + 1.1 scale pulse; amber threads flare upward', 'PUP: sits, throws its head back, tiny howl rings (visual only), wags on release']],
  ];
  notes.forEach(([t, ls], i) => {
    const y = Y0 + 34 + i * 102;
    b += T(t, NX + 12, y + 8, { s: 11, f: FONT.mono, w: 900, c: '#ffb84a' });
    ls.forEach((l, j) => { b += T(l, NX + 12, y + 24 + j * 13.2, { s: 9.6, c: '#d3dce6', w: 500 }); });
  });
  // ---- rig ----
  const RY = Y0 + ROW * 5;
  b += `<rect x="8" y="${RY}" width="1264" height="${720 - RY - 4}" rx="10" fill="#161e29" stroke="#3a4757"/>` + T('RIG', 20, RY + 16, { s: 12, f: FONT.title, w: 900, c: '#ffd98a' });
  const rig = [
    ['WREN', 'pelt-tail streak (3 seg) > legs+boots (2) > cape back > tunic + hem stitch > mantle + forepaw ties > hands (2) > head [ears(2) > hood > fringe > void > glints(2) > muzzle+nose]. Origin = feet.'],
    ['PUP', 'ember tail tip (own sprite + glow) > tail (2 seg) > hind legs (2) > body > fore legs (2) > head [ears(2) > face > thread collar]. Origin = paws. Spring-follows a heel point.'],
    ['EMBER', 'cage sprite pivot = centre, hang ring (0,-14.6). Thread = 6-point verlet rope from the right hand (16,-47); ember target (33,-80); glow = additive sprite alpha .6-1.'],
    ['PIVOTS', 'root (0,0) | body (0,-13) | neck (0,-66) | ear bases (+-13,-96) | hands (16,-47) and (-17,-34) | ember anchor (33,-80) | pup root (-46,0), pup neck (6,-27), pup tail root (-12,-14). IDLE 0 dots: pink root+neck, blue ears, amber ember, green pup root+neck.'],
  ];
  rig.forEach(([k, tx], i) => { b += T(k, 62, RY + 16 + i * 12.6, { s: 9.4, f: FONT.mono, w: 900, c: '#ffb84a' }) + T(tx, 116, RY + 16 + i * 12.6, { s: 9.4, c: '#d3dce6', w: 500 }); });
  b += banner('WREN v2 ANIMATION: Pelt Walker + Pup', 'Code-driven strips: idle, run with pup following, hurt, fade-to-light death, Pack Howl.');
  return svgPage(1280, 720, b);
}
