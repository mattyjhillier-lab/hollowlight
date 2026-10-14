// In-run scene: The Hollow (grey, veined) vs restored colour, summons with light falloff + trails, calm lantern-style HUD.
import { rnd, T, FONT, shape, sh, hl, circ, ell, veins, lin, rad, glowStops, nid } from './core.mjs';
import * as C from './creatures.mjs';
import { ic, orbit, lock } from './icons.mjs';

export const worldDefs = (K) => `
${rad('gCanG', [[0, K.rLight], [0.45, K.leafB], [1, K.rG3]], [0.35, 0.3, 0.85])}
${rad('gCanA', [[0, '#fff0a0'], [0.45, K.leafA], [1, K.leafC]], [0.35, 0.3, 0.85])}
${rad('gCanV', [[0, K.rLight], [0.45, K.leafC], [1, K.trunkD]], [0.35, 0.3, 0.85])}
${rad('gCanH', [[0, K.hLight], [0.5, K.hMid], [1, K.hG2]], [0.35, 0.3, 0.85])}
${lin('gGrass', [[0, K.rG1], [0.55, K.rG2], [1, K.rG3]], [0, 0, 0, 1])}
${rad('gGroundR', [[0, K.rG1], [0.45, K.rG1], [0.85, K.rG2], [1, K.rG3]], [640, 450, 560], true)}
${rad('gGroundH', [[0, K.hG1], [0.55, K.hG2], [1, K.hG3]], [640, 380, 760], true)}
${rad('gVig', [[0.45, '#000', 0], [1, '#000', 0.62]], [640, 400, 760], true)}
${rad('gLight', [[0, K.warm, 0.5], [0.3, K.warm, 0.2], [0.65, K.warm, 0.06], [1, K.warm, 0]])}
${lin('gFogB', [[0, K.hFog, 0], [1, K.hFog, 0.5]], [0, 0, 0, 1])}
<filter id="edgeF" x="-30%" y="-30%" width="160%" height="160%"><feTurbulence type="fractalNoise" baseFrequency=".013" numOctaves="3" seed="8" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="70"/><feGaussianBlur stdDeviation="9"/></filter>
<filter id="edgeG" x="-30%" y="-30%" width="160%" height="160%"><feTurbulence type="fractalNoise" baseFrequency=".013" numOctaves="3" seed="8" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="70"/><feGaussianBlur stdDeviation="28"/></filter>
<symbol id="paw" viewBox="-10 -10 20 20"><ellipse cx="0" cy="3" rx="5" ry="4.2"/><circle cx="-5.4" cy="-2.6" r="2.2"/><circle cx="-1.8" cy="-5.6" r="2.2"/><circle cx="1.8" cy="-5.6" r="2.2"/><circle cx="5.4" cy="-2.6" r="2.2"/></symbol>
`;

// restored zone: soft organic blobs around the hero + glowing trails along the summons' paths
const ZONE = [[600, 440, 250], [420, 520, 170], [820, 470, 190], [690, 310, 150], [500, 340, 125], [300, 590, 120], [1000, 600, 130], [180, 450, 70], [730, 640, 150]];
const TRAILS = ['M470 520 C410 500 330 470 220 420', 'M790 430 C840 380 900 330 980 300', 'M560 290 C500 250 440 230 380 150'];
const zoneShapes = (fill) => ZONE.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}"/>`).join('') + TRAILS.map((d) => `<path d="${d}" fill="none" stroke="${fill}" stroke-width="64" stroke-linecap="round"/>`).join('');

function tree(K, mode, x, y, s, seed) {
  const r = rnd(seed);
  const blobs = [[0, -118, 50], [-52, -136, 42], [54, -138, 44], [-26, -182, 42], [30, -184, 40], [0, -150, 58], [-72, -172, 30], [74, -174, 32]].sort((a, b) => a[1] - b[1]);
  const hollow = mode === 'h';
  const ol = hollow ? '#12161e' : K.rG3 === '#376e44' ? '#1f4a2c' : '#10424a';
  let g = `<g transform="translate(${x},${y}) scale(${s})">`;
  g += `<ellipse cx="6" cy="4" rx="64" ry="14" fill="#000" opacity="${hollow ? 0.42 : 0.35}" filter="url(#shd)"/>`;
  const trunk = 'M-30 8 C-18 -8 -16 -40 -14 -80 C-12 -100 -10 -116 -10 -130 L14 -130 C14 -110 14 -96 16 -72 C18 -40 20 -8 34 8 C14 18 -14 18 -30 8Z';
  g += shape(trunk, { f: hollow ? 'url(#gBark)' : 'url(#gTrunk)', rim: hollow ? K.hLight : K.warmHi, ol: hollow ? '#0d0a14' : K.trunkD, w: 3, x: hollow ? veins(K, 0, -40, 40, seed, 2.4, 3) : `<path d="M-6 -20 C-4 -60 -4 -100 -2 -140" stroke="${K.trunkD}" stroke-width="2.6" opacity=".5" fill="none"/>` });
  if (hollow) g += `<path d="M-2 -120 L-44 -160 M4 -120 L48 -156 M0 -130 L-6 -196 M-4 -110 L-66 -130" stroke="#0d0a14" stroke-width="9" stroke-linecap="round" fill="none"/><path d="M-2 -120 L-44 -160 M4 -120 L48 -156 M0 -130 L-6 -196 M-4 -110 L-66 -130" stroke="${K.hG1}" stroke-width="5" stroke-linecap="round" fill="none"/>`;
  if (hollow) g += '<g filter="url(#roughE)">';
  blobs.forEach(([bx, by, br], i) => {
    if (hollow && i % 3 === 1) return;
    const grad = hollow ? 'gCanH' : (K.id === 'P1' ? (i % 4 === 3 ? 'gCanA' : 'gCanG') : (i % 3 === 0 ? 'gCanV' : 'gCanG'));
    const wob = br * (0.92 + r() * 0.12);
    g += `<circle cx="${bx}" cy="${by}" r="${wob}" fill="${ol}" stroke="${ol}" stroke-width="${hollow ? 6 : 5}"/><circle cx="${bx}" cy="${by}" r="${wob}" fill="url(#${grad})" ${hollow ? 'opacity=".96"' : ''}/>`;
    g += `<ellipse cx="${bx - wob * 0.3}" cy="${by - wob * 0.4}" rx="${wob * 0.45}" ry="${wob * 0.28}" fill="#fff" opacity="${hollow ? 0.1 : 0.2}" filter="url(#b4)"/>`;
    if (!hollow) for (let k = 0; k < 3; k++) g += `<circle cx="${bx + (r() - 0.5) * wob}" cy="${by + (r() - 0.2) * wob}" r="2.4" fill="${r() > 0.5 ? K.warmHi : K.leafA}" opacity=".85"/>`;
    else g += veins(K, bx, by, wob * 0.8, seed + i, 2, 2);
  });
  if (hollow) g += '</g>';
  return g + '</g>';
}

function tuft(K, mode, x, y, s = 1, k = 0) {
  const c = mode === 'h' ? [K.hMid, K.hG1] : [K.rG1, K.rLight];
  const o = mode === 'h' ? '#12161e' : K.rG3;
  return `<g transform="translate(${x},${y}) scale(${s})"><path d="M-6 0 C-8 -10 -8 -14 -10 -18 C-4 -14 -2 -8 0 0Z M0 0 C-1 -12 2 -18 4 -24 C6 -16 5 -8 4 0Z M4 0 C6 -8 10 -12 14 -16 C12 -8 10 -4 8 0Z" fill="${c[0]}" stroke="${o}" stroke-width="1.8" stroke-linejoin="round"/><path d="M4 -4 C4 -12 4 -16 4 -22" stroke="${c[1]}" stroke-width="1.4" opacity=".8"/></g>`;
}
function flower(K, x, y, c, s = 1) {
  return `<g transform="translate(${x},${y}) scale(${s})"><path d="M0 0 V10" stroke="${K.rG3}" stroke-width="2"/>${[0, 1, 2, 3, 4].map((i) => `<circle cx="${(Math.cos(i * 1.256) * 4).toFixed(1)}" cy="${(Math.sin(i * 1.256) * 4).toFixed(1)}" r="3.2" fill="${c}" stroke="#00000044" stroke-width="1"/>`).join('')}<circle r="2.4" fill="#fff6c8"/></g>`;
}
function stone(K, x, y, s, mode) {
  return `<g transform="translate(${x},${y}) scale(${s})"><ellipse cx="2" cy="3" rx="22" ry="6" fill="#000" opacity=".35" filter="url(#shd)"/>${shape('M-20 2 C-22 -10 -10 -20 2 -18 C16 -18 24 -8 20 2 C10 6 -10 6 -20 2Z', { f: mode === 'h' ? 'url(#gHol)' : 'url(#gHolL)', rim: '#fff', ol: '#12161e', w: 2.6, x: sh('M6 -20 L30 -20 L30 8 L6 8Z', '#000', 0.3) })}</g>`;
}

function pawTrail(color, pts, op = 0.9) {
  return pts.map(([x, y, a, s], i) => `<use href="#paw" x="${x - 13 * s}" y="${y - 13 * s}" width="${26 * s}" height="${26 * s}" fill="${color}" opacity="${(op * (1 - i / pts.length) ** 1.3).toFixed(2)}" transform="rotate(${a} ${x} ${y})" filter="url(#glowS)"/>`).join('');
}

function gem(K, x, y, s = 1) {
  return `<g transform="translate(${x},${y}) scale(${s})"><circle r="24" fill="url(#gGlowGem)"/><path d="M0 -12 L8 -3 L0 12 L-8 -3Z" fill="${K.gem[2]}" stroke="#2a1d14" stroke-width="2" stroke-linejoin="round"/><path d="M0 -12 L8 -3 L0 -3Z" fill="${K.gem[0]}"/><path d="M0 -12 L-8 -3 L0 -3Z" fill="${K.gem[1]}"/><path d="M0 -3 L8 -3 L0 12Z" fill="${K.gem[2]}"/><path d="M-4 -7 L-1 -9" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/></g>`;
}
function dmg(K, txt, x, y, s = 1, crit = false, rot = 0) {
  const fs = (crit ? 54 : 32) * s;
  return `<g transform="rotate(${rot} ${x} ${y})" filter="url(#drop)">${crit ? `<circle cx="${x}" cy="${y - fs * 0.32}" r="${fs * 0.9}" fill="url(#gGlowWarm)" opacity=".8"/>` : ''}${T(txt, x, y, { s: fs, f: FONT.num, c: crit ? K.warmHi : '#fff7e8', st: crit ? '#7a2a0c' : '#241a22', sw: crit ? 9 : 7, a: 'middle', w: 900 })}${T(txt, x, y - fs * 0.04, { s: fs, f: FONT.num, c: crit ? '#fff' : '#fff', a: 'middle', w: 900, op: 0 })}</g>`;
}
const cr = (name, K, x, y, s = 1, flip = false, extra = '') => `<g transform="translate(${x},${y}) scale(${flip ? -s : s},${s})"${extra}>${C[name](K)}</g>`;

function hud(K) {
  const pl = (x, y, w, h, rx = 16) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${K.plate}" fill-opacity=".78" stroke="${K.edge}" stroke-opacity=".7" stroke-width="2"/><rect x="${x + 2}" y="${y + 2}" width="${w - 4}" height="${h / 2}" rx="${rx - 2}" fill="#fff" opacity=".05"/>`;
  // moon-arc timer
  const cx = 640, cy = 190, R = 96;
  const pt = (t) => { const a = Math.PI * (1.12 - 1.24 * t); return [cx + Math.cos(a) * R, cy - Math.sin(a) * R]; };
  const [mx, my] = pt(0.52), [x0, y0] = pt(0), [x1, y1] = pt(1);
  const arcTo = (t) => { const [x, y] = pt(t); return `${x.toFixed(1)} ${y.toFixed(1)}`; };
  let s = '';
  // XP spirit thread across the top
  s += `<rect x="0" y="64" width="1280" height="11" fill="#07090d" opacity=".7"/><path d="M0 70 H${1280 * 0.62}" stroke="url(#gXp)" stroke-width="5" stroke-linecap="round" filter="url(#glowS)"/><circle cx="${1280 * 0.62}" cy="70" r="9" fill="url(#gGlowWhite)"/><circle cx="${1280 * 0.62}" cy="70" r="4" fill="#fff"/>`;
  for (let i = 1; i < 10; i++) s += `<circle cx="${i * 128}" cy="70" r="2" fill="${i * 128 < 1280 * 0.62 ? '#fff' : K.txtD}" opacity=".6"/>`;
  // HP lantern plate
  s += pl(18, 84, 262, 62) + `<g transform="translate(52,116)"><circle r="40" fill="url(#gGlowWarm)" opacity=".8"/><path d="M0 -26 V-20" stroke="${K.edge}" stroke-width="3"/><path d="M-12 -20 L12 -20 L16 -6 L-16 -6Z" fill="#3a2a1a" stroke="${K.edge}" stroke-width="2.4" stroke-linejoin="round"/><path d="M-15 -6 H15 L17 18 L-17 18Z" fill="${K.warm}" opacity=".9" stroke="${K.edge}" stroke-width="2.6" stroke-linejoin="round"/><path d="M0 -3 C-8 5 -8 12 0 15 C8 12 8 5 0 -3Z" fill="#fff" opacity=".95" filter="url(#glowS)"/><path d="M-19 20 H19" stroke="${K.edge}" stroke-width="4" stroke-linecap="round"/></g>`;
  s += `<rect x="88" y="103" width="168" height="19" rx="9.5" fill="#0a0d13" stroke="${K.edgeD}" stroke-width="1.6"/><rect x="90" y="105" width="${164 * 0.86}" height="15" rx="7.5" fill="url(#gHp)"/><rect x="94" y="107" width="${150 * 0.86}" height="4" rx="2" fill="#fff" opacity=".4"/>` + T('86', 232, 117, { s: 13, f: FONT.num, c: '#fff', st: '#1a1018', sw: 3, a: 'end' }) + T('LANTERN', 90, 98, { s: 10, c: K.txtD, ls: 2 });
  // level badge
  s += `<g transform="translate(298,114)"><circle r="21" fill="${K.plate}" stroke="${K.edge}" stroke-width="2.4"/><circle r="17" fill="none" stroke="${K.edgeD}" stroke-width="1"/>${T('7', 0, 8, { s: 22, f: FONT.num, a: 'middle', c: K.warmHi })}${T('LV', 0, -9, { s: 8, a: 'middle', c: K.txtD, ls: 1.5 })}</g>`;
  // moon arc timer
  s += `<path d="M${x0} ${y0} A${R} ${R} 0 0 1 ${x1} ${y1}" fill="none" stroke="#0a0d13" stroke-width="12" stroke-linecap="round" opacity=".75"/><path d="M${x0} ${y0} A${R} ${R} 0 0 1 ${x1} ${y1}" fill="none" stroke="${K.edgeD}" stroke-width="3" stroke-dasharray="2 7" stroke-linecap="round"/><path d="M${x0} ${y0} A${R} ${R} 0 0 1 ${mx.toFixed(1)} ${my.toFixed(1)}" fill="none" stroke="${K.moon}" stroke-width="3" stroke-linecap="round" opacity=".85"/>`;
  s += `<g transform="translate(${x1},${y1})"><circle r="26" fill="url(#gGlowWarm)" opacity=".8"/><path d="M-14 6 A14 14 0 0 1 14 6Z" fill="#ffd36b" stroke="#fff" stroke-width="1.4"/><path d="M-22 6 H22" stroke="#ffd36b" stroke-width="2.4" stroke-linecap="round"/></g>`;
  s += `<g transform="translate(${mx.toFixed(1)},${my.toFixed(1)})"><circle r="34" fill="url(#gGlowWhite)" opacity=".5"/><circle r="15" fill="${K.moon}" stroke="#fff" stroke-width="2"/><circle cx="5" cy="-4" r="13" fill="${K.plate}" opacity="0"/><circle cx="-4" cy="-3" r="3" fill="#000" opacity=".12"/><circle cx="4" cy="5" r="4" fill="#000" opacity=".1"/></g>`;
  s += pl(580, 150, 120, 40, 20) + T('07:42', 640, 180, { s: 26, f: FONT.num, a: 'middle', c: '#fff', st: '#1a1018', sw: 4 });
  // currency
  s += pl(1020, 84, 242, 46, 23) + `<g transform="translate(1048,107)">${ic('coin', { c: '#d8b26a', hi: '#fff0c0', s: 0.55 })}</g>` + T('1,284', 1072, 116, { s: 20, f: FONT.num, c: '#fff' }) + `<g transform="translate(1176,107)">${ic('shard', { c: K.sp, hi: '#fff', s: 0.52 })}</g>` + T('3', 1196, 116, { s: 20, f: FONT.num, c: '#fff' }) + `<g transform="translate(1240,107) scale(.55)" opacity=".8">${ic('skull', { c: '#c9d2de', hi: '#fff', s: 0.9 })}</g>`;
  s += T('KILLS 412', 1262, 150, { s: 11, c: K.txtD, a: 'end', ls: 1.4 });
  // weapon slots
  const slots = [['wolf', 3], ['raven', 2], ['orbit', 1], ['bolt', 2]];
  slots.forEach(([n, rk], i) => {
    const x = 18 + i * 76, y = 622;
    const col = n === 'wolf' ? K.wolf[2] : n === 'raven' ? K.raven[2] : n === 'orbit' ? K.warm : K.gem[1];
    s += `<g><rect x="${x}" y="${y}" width="66" height="66" rx="16" fill="${K.plate}" fill-opacity=".85" stroke="${K.edge}" stroke-width="2.4"/><circle cx="${x + 33}" cy="${y + 33}" r="30" fill="url(#gGlowWhite)" opacity=".12"/><circle cx="${x + 33}" cy="${y + 31}" r="26" fill="${col}" opacity=".2"/><g transform="translate(${x + 33},${y + 31})">${n === 'orbit' ? orbit({ hi: K.warm }) : ic(n, { c: col, hi: '#fff', s: 1.1 })}</g>${[0, 1, 2, 3, 4].map((k) => `<circle cx="${x + 15 + k * 9}" cy="${y + 58}" r="2.6" fill="${k < rk ? K.warmHi : '#10151c'}" stroke="${K.edgeD}" stroke-width=".8"/>`).join('')}</g>`;
  });
  // ability button
  const ax = 1196, ay = 640, ar = 42, p = 0.72;
  s += `<g><circle cx="${ax}" cy="${ay}" r="${ar + 8}" fill="url(#gGlowWarm)" opacity=".5"/><circle cx="${ax}" cy="${ay}" r="${ar}" fill="${K.plate}" stroke="${K.edge}" stroke-width="3"/><circle cx="${ax}" cy="${ay}" r="${ar - 8}" fill="${K.warm}" opacity=".18"/><circle cx="${ax}" cy="${ay}" r="${ar - 3}" fill="none" stroke="#0a0d13" stroke-width="6"/><circle cx="${ax}" cy="${ay}" r="${ar - 3}" fill="none" stroke="${K.warmHi}" stroke-width="5" stroke-linecap="round" stroke-dasharray="${(2 * Math.PI * (ar - 3) * p).toFixed(1)} 999" transform="rotate(-90 ${ax} ${ay})" filter="url(#glowS)"/><g transform="translate(${ax},${ay - 2})">${ic('wolf', { c: K.warm, hi: '#fff', s: 1.1 })}<path d="M-30 -22 C-36 -12 -36 2 -30 12 M30 -22 C36 -12 36 2 30 12" stroke="${K.warmHi}" stroke-width="2.6" fill="none" stroke-linecap="round" opacity=".8"/></g></g>`;
  s += pl(1130, 690, 132, 26, 13) + T('SPACE  PACK HOWL', 1196, 708, { s: 10.5, a: 'middle', c: K.txt, ls: 1.2 });
  return s;
}

export function world(K, o = {}) {
  const r = rnd(9);
  const hollowTrees = [[90, 250, 0.95, 1], [250, 200, 0.8, 2], [1120, 230, 0.9, 3], [1230, 330, 0.8, 9], [960, 190, 0.75, 4], [30, 450, 0.9, 5]];
  const mixTrees = [[420, 210, 0.78, 6], [780, 200, 0.8, 7], [610, 170, 0.62, 8]];
  const frontTrees = [[40, 700, 1.1, 11], [1262, 720, 0.95, 12], [300, 716, 0.7, 13]];
  const backTrees = [...hollowTrees, ...mixTrees];
  const layer = (mode, list) => list.map(([x, y, s, sd]) => tree(K, mode, x, y, s, sd)).join('');
  // ground cover
  const covH = [], covR = [];
  for (let i = 0; i < 70; i++) { const x = r() * 1280, y = 260 + r() * 440; covH.push(tuft(K, 'h', x, y, 0.8 + r() * 0.5)); }
  for (let i = 0; i < 90; i++) { const x = r() * 1280, y = 240 + r() * 470; covR.push(tuft(K, 'r', x, y, 0.8 + r() * 0.6)); }
  const fl = []; for (let i = 0; i < 60; i++) fl.push(flower(K, r() * 1280, 270 + r() * 430, K.flowers[i % 4], 0.8 + r() * 0.5));
  const stones = [[170, 590, 1.1], [1040, 520, 1.3], [330, 330, 0.9], [1180, 600, 1], [860, 330, 0.8]].map(([x, y, s]) => stone(K, x, y, s, 'h'));
  const stonesR = [[560, 610, 0.9], [720, 560, 0.7]].map(([x, y, s]) => stone(K, x, y, s, 'r'));
  // hollow ground
  let h = `<rect width="1280" height="720" fill="${K.hBg}"/><rect y="64" width="1280" height="656" fill="url(#gGroundH)"/><rect y="64" width="1280" height="656" filter="url(#mottle)" opacity=".16"/>`;
  for (let i = 0; i < 22; i++) h += veins(K, 40 + r() * 1200, 240 + r() * 470, 80 + r() * 90, 100 + i, 3 + r() * 2, 4);
  h += covH.join('') + stones.join('');
  // hollow village well (storytelling prop, grey half-raised bucket)
  h += `<g transform="translate(150,330)"><ellipse cx="0" cy="8" rx="44" ry="10" fill="#000" opacity=".4" filter="url(#shd)"/>${shape('M-32 6 V-24 C-32 -36 32 -36 32 -24 V6 C20 14 -20 14 -32 6Z', { f: 'url(#gHol)', rim: K.hLight, ol: '#12161e', w: 3, x: `<path d="M-30 -10 H30 M-30 -2 H30" stroke="${K.hG3}" stroke-width="2" opacity=".6"/>` })}<ellipse cx="0" cy="-24" rx="30" ry="9" fill="#0a0d14" stroke="#12161e" stroke-width="2.6"/><path d="M-30 -24 V-70 H30 V-24 M-34 -70 H34" stroke="#12161e" stroke-width="9" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M-30 -24 V-70 H30 V-24 M-34 -70 H34" stroke="${K.hMid}" stroke-width="4" fill="none" stroke-linecap="round" stroke-linejoin="round"/><path d="M0 -70 V-40" stroke="#12161e" stroke-width="3"/><path d="M-8 -40 H8 L6 -28 H-6Z" fill="${K.hG2}" stroke="#12161e" stroke-width="2.4" stroke-linejoin="round"/></g>`;
  // mist
  h += `<ellipse cx="200" cy="300" rx="260" ry="50" fill="${K.hFog}" opacity=".12" filter="url(#b30)"/><ellipse cx="1100" cy="420" rx="260" ry="60" fill="${K.hFog}" opacity=".14" filter="url(#b30)"/>`;
  // distant Elder Treant silhouette (foggy)
  h += `<g transform="translate(1085,372) scale(.62)" opacity=".92">${C.treant(K)}</g><ellipse cx="1090" cy="360" rx="200" ry="110" fill="${K.hFog}" opacity=".3" filter="url(#b30)"/>`;
  h += layer('h', backTrees);
  // restored layer
  let rl = `<rect y="64" width="1280" height="656" fill="url(#gGroundR)"/><rect y="64" width="1280" height="656" filter="url(#mottle)" opacity=".14"/>`;
  rl += covR.join('') + fl.join('') + stonesR.join('') + layer('r', backTrees);
  rl += `<g transform="translate(150,330)"><ellipse cx="0" cy="8" rx="44" ry="10" fill="#000" opacity=".3"/></g>`;
  const frontH = layer('h', frontTrees.filter((t) => t[0] < 100 || t[0] > 1100));
  const frontR = layer('r', frontTrees);
  // --- characters (y-sorted manually) ---
  const gl = (x, y, rr, g, a = 1) => `<circle cx="${x}" cy="${y}" r="${rr}" fill="url(#${g})" opacity="${a}" style="mix-blend-mode:screen"/>`;
  const trails = pawTrail(K.wolf[1], [[410, 508, -15, 1.1], [380, 498, -15, 1.0], [348, 486, -18, 0.95], [318, 472, -20, 0.9], [288, 458, -22, 0.85], [260, 444, -24, 0.8], [232, 430, -26, 0.7]], 0.95)
    + pawTrail(K.wolf[1], [[836, 396, -35, 1.0], [866, 372, -38, 0.95], [896, 346, -40, 0.9], [926, 322, -42, 0.8], [954, 306, -44, 0.7]], 0.9)
    + `<path d="M560 290 C500 262 450 240 400 190" fill="none" stroke="${K.raven[1]}" stroke-width="5" stroke-linecap="round" opacity=".35" filter="url(#b4)"/>` + [0, 1, 2, 3, 4, 5, 6, 7].map((i) => `<path d="M${520 - i * 17} ${262 - i * 9} l-8 4 l3 -7Z" fill="${K.raven[0]}" opacity="${(0.8 - i * 0.09).toFixed(2)}" transform="rotate(${i * 25} ${520 - i * 17} ${262 - i * 9})" filter="url(#glowS)"/>`).join('')
    + `<path d="M590 440 C520 470 470 500 430 540" fill="none" stroke="${K.scarf[1]}" stroke-width="3" stroke-linecap="round" opacity=".35" filter="url(#b4)"/>`;
  const blots = [[930, 470, 70, 31], [250, 330, 56, 32], [1000, 610, 80, 33], [860, 600, 60, 34], [1130, 480, 50, 35], [150, 500, 48, 36], [1000, 335, 40, 37]].map(([x, y, l, sd]) => `<ellipse cx="${x}" cy="${y + 4}" rx="${l * 0.8}" ry="${l * 0.26}" fill="${K.vein}" opacity=".6" filter="url(#b4)"/>` + veins(K, x, y + 4, l, sd, 3, 6)).join('');
  const entities = [
    [250, cr('fellwolf', K, 250, 340, 0.85)],
    [180, cr('mourner', K, 150, 395, 0.7)],
    [335, cr('crow', K, 1000, 345, 0.75, true, ' opacity="1"')],
    [320, cr('crow', K, 190, 500, 0.7)],
    [430, cr('thornspitter', K, 1130, 480, 0.85, true)],
    [470, cr('fellwolf', K, 930, 470, 1.0, true)],
    [600, cr('blightbulb', K, 850, 612, 0.95)],
    [610, cr('crawler', K, 1010, 618, 1.0)],
    [440, cr('wolf', K, 790, 430, 0.8)],
    [520, cr('wolf', K, 470, 520, 0.85, true)],
    [470, cr('wren', K, 620, 474, 1.35)],
    [300, cr('raven', K, 560, 290, 0.72)],
    [310, cr('raven', K, 770, 300, 0.7, true)],
    [380, cr('raven', K, 430, 392, 0.62)],
  ].sort((a, b) => a[0] - b[0]).map((e) => e[1]).join('');
  // blightbulb telegraph ring + thorn projectile
  const tele = `<ellipse cx="860" cy="600" rx="84" ry="30" fill="${K.bad}" opacity=".1"/><ellipse cx="860" cy="600" rx="84" ry="30" fill="none" stroke="${K.bad}" stroke-width="3" stroke-dasharray="9 6" opacity=".8"/><ellipse cx="860" cy="600" rx="52" ry="18" fill="${K.bad}" opacity=".18"/>`;
  const thorn = `<g transform="translate(1000,436) rotate(-176)"><path d="M0 0 L40 0" stroke="${K.bad}" stroke-width="6" opacity=".25" filter="url(#b4)"/><path d="M-14 -5 L18 0 L-14 5Z" fill="#d9c9ff" stroke="#120d16" stroke-width="2" stroke-linejoin="round"/><circle cx="-14" r="4" fill="${K.bad}"/></g>`;
  // bite flashes (two crescents) at the lunging wolf
  const bite = `<g transform="translate(858,446)"><path d="M-14 -18 C10 -18 16 8 -4 18 C6 4 2 -8 -14 -18Z" fill="#fff" filter="url(#glowS)"/><path d="M12 -14 C-10 -10 -14 12 2 20 C-6 6 -2 -4 12 -14Z" fill="${K.wolf[1]}" opacity=".9"/></g>`;
  const gems = [[560, 560], [700, 540], [880, 520], [520, 400], [700, 400], [960, 530], [640, 640]].map(([x, y], i) => gem(K, x, y, 0.9 + (i % 3) * 0.12)).join('');
  const heart = `<g transform="translate(450,610)"><circle r="26" fill="url(#gGlowBad)" opacity="0"/><g transform="scale(.7)">${ic('heart', { c: '#ff8f8f', hi: '#fff', ol: '#4a1a22', s: 1 })}</g></g>`;
  const nums = dmg(K, '38', 905, 405, 1) + dmg(K, '124', 862, 360, 1, true, -6) + dmg(K, '22', 520, 235, 0.9) + dmg(K, '17', 1010, 318, 0.8, false, 4) + dmg(K, '41', 290, 300, 0.85);
  const lights = gl(630, 462, 270, 'gGlowWarm', 0.55) + gl(790, 440, 140, 'gGlowW', 0.7) + gl(470, 520, 140, 'gGlowW', 0.7) + gl(560, 285, 90, 'gGlowR', 0.8) + gl(770, 295, 90, 'gGlowR', 0.8) + gl(430, 390, 70, 'gGlowR', 0.7);
  const motes = Array.from({ length: 34 }, () => `<circle cx="${(300 + r() * 700).toFixed(0)}" cy="${(250 + r() * 420).toFixed(0)}" r="${(1 + r() * 2).toFixed(1)}" fill="${K.warmHi}" opacity="${(0.3 + r() * 0.6).toFixed(2)}" filter="url(#glowS)"/>`).join('');
  return `<defs><mask id="rm" maskUnits="userSpaceOnUse" x="0" y="0" width="1280" height="720"><rect width="1280" height="720" fill="#000"/><g filter="url(#edgeF)">${zoneShapes('#fff')}</g></mask></defs>
<g id="world">${h}
<g filter="url(#edgeG)" opacity=".34" style="mix-blend-mode:screen">${zoneShapes(K.warm)}</g>
<g mask="url(#rm)">${rl}</g>
${blots}
${trails}
${tele}
${lights}
${entities}
${bite}
${thorn}
${frontH}
<g mask="url(#rm)">${frontR}</g>
${motes}
<rect y="64" width="1280" height="656" fill="url(#gVig)"/>
${gems}${heart}${nums}
</g>
${o.hud === false ? '' : hud(K)}
<defs>${lin('gXp', [[0, K.xp[2]], [0.6, K.xp[1]], [1, K.xp[0]]], [0, 0, 1, 0])}${lin('gHp', [[0, K.hp[2]], [0.5, K.hp[1]], [1, K.hp[0]]], [0, 0, 1, 0])}</defs>`;
}
