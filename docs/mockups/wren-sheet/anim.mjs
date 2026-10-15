// wren-animation.png: frame strips (idle, walk, hurt, death, Pack Howl) with code notes. Mock-up only.
import { begin, use, T, FONT, glow, wolf, nid, addDef } from '../style-lab/lab.mjs';
import { STYLES } from '../style-lab/scene.mjs';
import { wren, lanternSvg } from './wren.mjs';
import { svgPage, bg, banner, shadow } from './common.mjs';

const K = 0.7, ROW = 110, Y0 = 100, X0 = 112, CW = 105;
const spark = (x, y, r, c = '#fff6d0', a = 1) => `<path d="M${x} ${y - r} Q${x + r * 0.15} ${y - r * 0.15} ${x + r} ${y} Q${x + r * 0.15} ${y + r * 0.15} ${x} ${y + r} Q${x - r * 0.15} ${y + r * 0.15} ${x - r} ${y} Q${x - r * 0.15} ${y - r * 0.15} ${x} ${y - r}Z" fill="${c}" opacity="${a}" style="mix-blend-mode:screen"/>`;

function rowShell(ri, title, sub, n, sub2 = '') {
  const y = Y0 + ri * ROW;
  let o = `<rect x="8" y="${y}" width="768" height="${ROW - 6}" rx="10" fill="#161e29" stroke="#3a4757"/>`;
  o += T(title, 18, y + 24, { s: 14, f: FONT.title, w: 900, c: '#ffd98a' }) + T(sub, 18, y + 38, { s: 9.5, c: '#9fb0c2', w: 600 }) + T(sub2, 18, y + 50, { s: 9.5, c: '#9fb0c2', w: 600 });
  for (let i = 0; i < n; i++) { const cx = X0 + 8 + i * CW + CW / 2 - 4; o += `<rect x="${X0 + i * CW}" y="${y + 5}" width="${CW - 4}" height="${ROW - 16}" rx="7" fill="#1b2430" stroke="#2c3948"/>` + T(String(i), X0 + i * CW + 7, y + 17, { s: 9, c: '#6e7f92', w: 800, f: FONT.mono }); }
  return o;
}
const cell = (ri, i) => ({ cx: X0 + i * CW + (CW - 4) / 2, by: Y0 + ri * ROW + ROW - 16 });
const fig = (c, o, k = K) => `${shadow(c.cx, c.by + 2, 26)}<g transform="translate(${c.cx.toFixed(1)},${c.by})scale(${k})">${wren(o)}</g>`;

export function animPage() {
  begin(); use(STYLES.S1);
  let b = bg(1280, 720);
  // ---- row 0: IDLE ----
  b += rowShell(0, 'IDLE', 'loop 2.4 s', 4, '4 key poses');
  const idle = [
    { sy: 1, bob: 0, ph: 0, lan: 0, tilt: 0, expr: 'neutral' },
    { sy: 1.02, bob: -1, ph: 1.3, lan: 5, tilt: 1.5, expr: 'neutral' },
    { sy: 1.03, bob: -1.6, ph: 2.6, lan: 7, tilt: 0, expr: 'blink' },
    { sy: 1.01, bob: -0.6, ph: 3.9, lan: 2, tilt: -1.5, expr: 'neutral' },
  ];
  idle.forEach((f, i) => { const c = cell(0, i); b += glow(c.cx - 14, c.by - 8, 34, 28, '#ffc45a', 0.35) + fig(c, { view: '3q', expr: f.expr, sy: f.sy, sx: 2 - f.sy > 1 ? 1 : 1, bob: f.bob, tilt: f.tilt, lanternAngle: f.lan, earFlick: f.tilt * 2, scarf: { len: 50, amp: 5, phase: f.ph, sag: 12, ang: Math.PI - 0.5, glow: 0.6 } }); });
  // pivot dots on idle frame 0
  { const c = cell(0, 0), P = [[0, -4, 'root'], [0, -38, 'neck'], [-17, -78, 'earL'], [19, -78, 'earR'], [-9, -36, 'scarf'], [-14, -34, 'hand']]; for (const [x, y] of P.slice(0, 2)) b += `<circle cx="${c.cx + x * K}" cy="${c.by + y * K}" r="2.2" fill="#ff4fa0" stroke="#fff" stroke-width=".8"/>`; for (const [x, y] of P.slice(2, 4)) b += `<circle cx="${c.cx + x * K}" cy="${c.by + y * K}" r="2.2" fill="#4fd0ff" stroke="#fff" stroke-width=".8"/>`; }

  // ---- row 1: WALK ----
  b += rowShell(1, 'WALK', 'cycle 0.6 s', 6, '6 frames');
  for (let i = 0; i < 6; i++) {
    const c = cell(1, i); c.cx += 16; const p = Math.cos((i / 6) * Math.PI * 2), pass = 1 - Math.abs(p);
    b += glow(c.cx - 10, c.by - 8, 34, 26, '#ffc45a', 0.3) + fig(c, { view: 'side', expr: 'neutral', leg: p, stride: 9, lift: 4, sy: 0.95 + pass * 0.09, sx: 1.04 - pass * 0.07, bob: -pass * 3, lean: 6, tilt: -2 * p, earFlick: -p * 6, lanternAngle: -p * 14, scarf: { len: 88, amp: 7, phase: i * 1.05, sag: 3, ang: Math.PI + 0.2, glow: 1 } }, 0.67);
  }
  // ---- row 2: HURT ----
  b += rowShell(2, 'HURT', 'flash 0.25 s', 4, '+ 1.2 s i-frames');
  const hurt = [
    { expr: 'worried', hurt: 0, sx: 1, sy: 1, lean: 0, dx: 0 },
    { expr: 'hurt', hurt: true, sx: 1.12, sy: 0.88, lean: -9, dx: -5 },
    { expr: 'hurt', hurt: 'red', sx: 0.95, sy: 1.06, lean: -13, dx: -9 },
    { expr: 'worried', hurt: 0, sx: 1, sy: 1, lean: -3, dx: -5, alpha: 0.65 },
  ];
  hurt.forEach((f, i) => {
    const c = cell(2, i); c.cx += f.dx + 10;
    b += fig(c, { view: '3q', expr: f.expr, hurt: f.hurt, sx: f.sx, sy: f.sy, lean: f.lean, alpha: f.alpha, scarf: { len: 70, amp: 7, phase: i * 1.5, sag: 8, ang: Math.PI - 0.15 + i * 0.12, glow: 0.8 }, lanternGlow: i === 1 || i === 2 ? 0.3 : 1 });
    if (i === 1) { const x = c.cx + 22, y = c.by - 62; b += `<path d="M${x} ${y - 16} L${x + 4} ${y - 4} L${x + 16} ${y - 6} L${x + 8} ${y + 3} L${x + 14} ${y + 14} L${x + 2} ${y + 8} L${x - 8} ${y + 16} L${x - 5} ${y + 4} L${x - 16} ${y - 2} L${x - 4} ${y - 5}Z" fill="#fff4dc" stroke="#ff8a3a" stroke-width="1.6" opacity=".95"/>`; }
  });
  // ---- row 3: DEATH ----
  b += rowShell(3, 'DEATH', 'fade to light', 5, '1.6 s, 5 poses');
  const death = [
    { expr: 'hurt', sy: 0.96, sx: 1.03, lean: -6, light: 0, alpha: 1, up: 0 },
    { expr: 'blink', sy: 0.78, sx: 1.12, lean: -2, light: 0.25, alpha: 1, up: 0 },
    { expr: 'blink', sy: 0.98, sx: 1, lean: 0, light: 0.5, alpha: 0.85, up: 1 },
    { expr: 'smile', sy: 1.1, sx: 0.94, lean: 0, light: 0.75, alpha: 0.7, up: 2 },
    { expr: 'smile', sy: 1.14, sx: 0.9, lean: 0, light: 1, alpha: 0.4, up: 3 },
  ];
  death.forEach((f, i) => {
    const c = cell(3, i), rise = f.up * 4;
    b += glow(c.cx, c.by - 38, 30 + f.up * 8, 40 + f.up * 8, '#ffd98a', 0.15 + f.up * 0.18);
    b += `<g transform="translate(0,${-rise})">${fig(c, { view: '3q', expr: f.expr, sy: f.sy, sx: f.sx, lean: f.lean, light: f.light || undefined, alpha: f.alpha, lantern: i < 4, scarf: { len: 70 - f.up * 4, amp: 4 + f.up, phase: i, sag: 8 - f.up * 8, ang: f.up >= 2 ? -1.1 - f.up * 0.12 : Math.PI - 0.2, glow: 0.8 + f.up * 0.4 } })}</g>`;
    if (i >= 2) for (let k = 0; k < 4 + i; k++) b += spark(c.cx + ((k * 37) % 50) - 25, c.by - 20 - ((k * 23) % 60) - rise, 2 + (k % 3), '#fff0c0', 0.9);
    if (i === 4) b += `<g transform="translate(${c.cx + 12},${c.by})scale(${K})">${lanternSvg(0, -24, 0, 0.9, false)}</g>`;
  });
  // ---- row 4: PACK HOWL ----
  b += rowShell(4, 'PACK HOWL', 'ability', 5, '6 s buff, 60 s cd');
  const howl = [
    { expr: 'determined', sy: 0.93, lean: 4, tilt: 3, arms: 0, ring: 0, sc: { len: 60, ang: Math.PI - 0.3, amp: 5, sag: 10 } },
    { expr: 'howl', sy: 1.02, lean: -3, tilt: -14, arms: 0.55, ring: 0.3, sc: { len: 60, ang: -1.0, amp: 4, sag: 0 } },
    { expr: 'howl', sy: 1.07, lean: -4, tilt: -22, arms: 1, ring: 0.7, sc: { len: 78, ang: -1.45, amp: 3, sag: 0 } },
    { expr: 'howl', sy: 1.04, lean: -2, tilt: -20, arms: 1, ring: 1, sc: { len: 74, ang: -1.45, amp: 4, sag: 0 } },
    { expr: 'smile', sy: 1, lean: 0, tilt: -3, arms: 0.2, ring: 1.2, sc: { len: 70, ang: -0.9, amp: 6, sag: 6 } },
  ];
  howl.forEach((f, i) => {
    const c = cell(4, i);
    if (f.ring > 0) { const rx = 22 + f.ring * 36, a = f.ring > 1 ? 0.35 : 0.9; b += `<ellipse cx="${c.cx}" cy="${c.by}" rx="${rx}" ry="${rx * 0.24}" fill="none" stroke="#ffb84a" stroke-width="8" opacity="${a * 0.5}" filter="url(#b4)" style="mix-blend-mode:screen"/><ellipse cx="${c.cx}" cy="${c.by}" rx="${rx}" ry="${rx * 0.24}" fill="none" stroke="#fff0c0" stroke-width="2" opacity="${a}"/>`; }
    if (i >= 2 && i <= 3) for (const s of [-1, 1]) b += `<g opacity=".85"><g transform="translate(${c.cx + s * 40},${c.by + 3})scale(${s * -0.3},0.3)">${wolf({ enemy: false, f: 1 })}</g></g>`;
    b += fig(c, { view: 'front', expr: f.expr, sy: f.sy, lean: f.lean, tilt: f.tilt * 0.6, armsUp: f.arms, lanternGlow: 1 + f.arms * 0.6, scarf: { ...f.sc, phase: i * 0.8, glow: 1.2 } });
  });

  // ---- right: notes ----
  const NX = 788;
  b += `<rect x="${NX}" y="${Y0}" width="484" height="${ROW * 5 - 6}" rx="10" fill="#161e29" stroke="#3a4757"/>` + T('HOW IT IS ANIMATED IN CODE (no hand-drawn frames)', NX + 12, Y0 + 20, { s: 12.5, f: FONT.title, w: 900, c: '#ffd98a' });
  const notes = [
    ['IDLE', ['body.scaleY = 1 + .025*sin(t), pivot at the feet (breathing)', 'head.y -1.2px, head.angle +-1.5 deg (pivot = neck); ears lag 0.15 s', 'scarf = 5 linked segments, angle = A*sin(t - i*.6); lantern = damped pendulum', 'blink = swap the eye texture for 0.12 s every 3-5 s']],
    ['WALK', ['phase advances with DISTANCE: foot.x = +-stride*sin(phase), lift 4px', 'contact frames squash (x1.04, y.95), passing frames stretch; bob 3px; lean 6 deg', 'scarf follows a ring-buffer of past root positions, so it always streams', 'behind her (about 2x body length at speed); lantern swings against the legs']],
    ['HURT', ['0-60 ms white tint (setTintFill), then red tint until 0.25 s', 'squash 1.12 x .88 with spring-back; knockback 6-9px, ease-out', 'swap to the hurt face, lantern glow dips to 30%', 'then 1.2 s i-frames: alpha blinks .65/1 at 10 Hz']],
    ['DEATH', ['squash to .78 + closed-eyes face; an additive cream-amber copy fades in', 'body alpha 1 -> .4 while it stretches 14% and rises 16px', 'scarf segments unwind to -90 deg, staggered 40 ms; 8-12 sparks drift up', 'the lantern stays on the ground and keeps glowing']],
    ['HOWL', ['0.2 s crouch (scaleY .93, lean 4 deg), then pop: head -22 deg, lantern arm up', 'howl mouth texture; scarf segments snap to -90 deg and stiffen (like a flame)', 'ring = pooled additive ellipse, scale 0 -> R in .6 s, alpha 1 -> 0', 'wolves: bright overlay + 1.1 scale pulse; enemies in range flee']],
  ];
  notes.forEach(([t, ls], i) => {
    const y = Y0 + 34 + i * 102;
    b += T(t, NX + 12, y + 8, { s: 11, f: FONT.mono, w: 900, c: '#ffb84a' });
    ls.forEach((l, j) => { b += T(l, NX + 12, y + 24 + j * 13.2, { s: 9.8, c: '#d3dce6', w: 500 }); });
  });
  // rig line
  b += `<rect x="8" y="${Y0 + ROW * 5}" width="1264" height="${720 - (Y0 + ROW * 5) - 6}" rx="10" fill="#161e29" stroke="#3a4757"/>` + T('RIG', 20, Y0 + ROW * 5 + 20, { s: 12, f: FONT.title, w: 900, c: '#ffd98a' });
  b += T('layers: scarf (5 seg) > legs+boots (2) > body/coat > belt+patch+whistle > lantern arm > head [ears(2) > hood > fur trim > face > fringe] > collar+knot. Origin = feet.', 62, Y0 + ROW * 5 + 20, { s: 10, c: '#d3dce6', w: 500 });
  b += T('pivots: root (0,0) | body (0,-13) | head/neck (0,-38) | ear bases (+-19,-78) | scarf root (back of neck) | lantern/shoulder hands (+-23,-36). Dots on IDLE 0: pink = root + neck, blue = ear bases.', 62, Y0 + ROW * 5 + 36, { s: 10, c: '#d3dce6', w: 500 });
  b += banner();
  return svgPage(1280, 720, b);
}
