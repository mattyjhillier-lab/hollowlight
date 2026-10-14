// Shared helpers, palettes, gradient/filter defs for the polished-cartoon mock-ups (round 3). Mock-ups only, not game code.
export const rnd = (s) => () => { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296; };
export const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
let uid = 0;
export const nid = (p = 'i') => p + (++uid);
export const FONT = { title: "Georgia,'Palatino Linotype',serif", ui: "'Segoe UI',Arial,sans-serif", num: "'Segoe UI Black','Arial Black','Segoe UI',sans-serif", mono: "Consolas,'Courier New',monospace" };
export const T = (s, x, y, o = {}) => `<text x="${x}" y="${y}" font-family="${o.f || FONT.ui}" font-size="${o.s || 20}" font-weight="${o.w || 700}" fill="${o.c || '#fff'}" text-anchor="${o.a || 'start'}"${o.ls ? ` letter-spacing="${o.ls}"` : ''}${o.st ? ` stroke="${o.st}" stroke-width="${o.sw || 3}" stroke-linejoin="round" paint-order="stroke"` : ''}${o.tr ? ` transform="${o.tr}"` : ''}${o.op ? ` opacity="${o.op}"` : ''}${o.i ? ' font-style="italic"' : ''}${o.fl ? ` filter="url(#${o.fl})"` : ''}>${esc(s)}</text>`;

// ---------- palettes ----------
export const P1 = {
  id: 'P1', name: 'WARM LANTERN', line: 'Cosy-sad storybook cartoon. Amber lantern light on a cool grey-blue Hollow; colour returns as warm greens, gold leaves and wildflowers.',
  sw: [['#2b3441', 'Hollow slate'], ['#8fa0b2', 'Hollow mist'], ['#ffb84a', 'Lantern amber'], ['#7fbf5f', 'Restored green'], ['#ffd36b', 'Evolve gold (reserved)']],
  hBg: '#1c2430', hG1: '#56626f', hG2: '#3a4552', hG3: '#2a3340', hMid: '#6d7a88', hLight: '#a4b0bd', hFog: '#b9c6d4', vein: '#110c16',
  rG1: '#88c864', rG2: '#5a9a4c', rG3: '#376e44', rLight: '#d6ee86', leafA: '#e9a93d', leafB: '#79b653', leafC: '#c9742e', trunk: '#8a6240', trunkD: '#4e3626',
  flowers: ['#ffb347', '#ff8fa3', '#fff1c4', '#ffd86b'],
  sp: '#ffb84a', spHi: '#fff4d2', spDeep: '#e0701f', warm: '#ffc96b', warmHi: '#fff0c4',
  wolf: ['#fffaf0', '#ffe3a6', '#ffb457', '#e98a3a'], wolfRim: '#fff6dc', raven: ['#fff0e8', '#e8a0c0', '#9a5cb8', '#4f2f80'], ravenRim: '#ffe8f0',
  gem: ['#fff6d8', '#ffc35c', '#e8892c'], hex: '#ffb84a',
  coat: ['#8fb3b0', '#5d8486', '#385c63'], hood: ['#a9c9c2', '#74a09b', '#48767a'], scarf: ['#ffd27a', '#f5a335', '#c46f1c'],
  robe: ['#fff6e0', '#eadcb8', '#bfae8a'], stole: ['#6b8fb5', '#456a92', '#2d4b70'],
  plate: '#1a212b', plate2: '#2a3441', plate3: '#3a4757', edge: '#d8b26a', edgeD: '#8d6c34', txt: '#fff3dc', txtD: '#a9b3bf', hp: ['#fff0a8', '#ffab3a', '#e0601b'], xp: ['#fff3c8', '#ffc766', '#e88a30'],
  moon: '#fff3d2', bad: '#ff5a3c', cardTint: '#ffcf8a', night: '#10161e', glowBg: '#ffb84a', node: '#ffc766', nodeHi: '#fff1c0', branch: ['#ff9f5a', '#ffd36b', '#9cd8a0'],
};
export const P2 = {
  id: 'P2', name: 'MOONWELL', line: 'Moonlit mystical storybook. Cool cyan-teal and violet spirit light on a deep blue-grey Hollow, with a few warm lantern accents for the humans.',
  sw: [['#161c2e', 'Hollow midnight'], ['#7a89a8', 'Hollow mist'], ['#7ff0ff', 'Spirit cyan'], ['#b79cff', 'Spirit violet'], ['#ffc46b', 'Lantern accent / gold']],
  hBg: '#121828', hG1: '#44516c', hG2: '#2c3750', hG3: '#1f2840', hMid: '#5d6b8a', hLight: '#8e9cbb', hFog: '#a5b4d4', vein: '#0b0814',
  rG1: '#52cfb0', rG2: '#2fa08f', rG3: '#1d6f77', rLight: '#b4f6d8', leafA: '#9a86f0', leafB: '#3fc9b0', leafC: '#d06fcf', trunk: '#6b5c8f', trunkD: '#33294f',
  flowers: ['#ff9fcf', '#ffd27a', '#c8b8ff', '#9ff4ff'],
  sp: '#7ff0ff', spHi: '#f0ffff', spDeep: '#1fa0d0', warm: '#ffc46b', warmHi: '#fff0c4',
  wolf: ['#f4ffff', '#a8f6ff', '#4fd2ee', '#2a8fc8'], wolfRim: '#e8ffff', raven: ['#f2eaff', '#b49cff', '#7550e0', '#3b2594'], ravenRim: '#f4eeff',
  gem: ['#eaffff', '#6fe8ff', '#2a9fd8'], hex: '#7ff0ff',
  coat: ['#8a7fc8', '#5f55a0', '#3c3478'], hood: ['#a89ce0', '#7468b8', '#4b4290'], scarf: ['#ffd27a', '#f5a335', '#c46f1c'],
  robe: ['#f4f0ff', '#d6d0ee', '#a59fc8'], stole: ['#4fb8d0', '#2f8aa8', '#1f5f80'],
  plate: '#0f1628', plate2: '#1a2442', plate3: '#27345c', edge: '#7fe0f4', edgeD: '#3c7fa0', txt: '#eaf6ff', txtD: '#8f9fc0', hp: ['#fff0b8', '#ffb347', '#e0602a'], xp: ['#eaffff', '#7ff0ff', '#6a8cff'],
  moon: '#e8f4ff', bad: '#ff5a3c', cardTint: '#9fe8ff', night: '#0a0f1c', glowBg: '#7ff0ff', node: '#7ff0ff', nodeHi: '#eaffff', branch: ['#b79cff', '#7ff0ff', '#ffc46b'],
};

// ---------- gradient helpers ----------
export const lin = (id, stops, c = [0, 0, 0, 1], u) => `<linearGradient id="${id}" x1="${c[0]}" y1="${c[1]}" x2="${c[2]}" y2="${c[3]}"${u ? ' gradientUnits="userSpaceOnUse"' : ''}>${stops.map(([o, col, a]) => `<stop offset="${o}" stop-color="${col}"${a != null ? ` stop-opacity="${a}"` : ''}/>`).join('')}</linearGradient>`;
export const rad = (id, stops, c = [0.5, 0.5, 0.5], u, f) => `<radialGradient id="${id}" cx="${c[0]}" cy="${c[1]}" r="${c[2]}"${f ? ` fx="${f[0]}" fy="${f[1]}"` : ''}${u ? ' gradientUnits="userSpaceOnUse"' : ''}>${stops.map(([o, col, a]) => `<stop offset="${o}" stop-color="${col}"${a != null ? ` stop-opacity="${a}"` : ''}/>`).join('')}</radialGradient>`;
const v3 = (a, op) => [[0, a[0], op], [0.5, a[1], op], [1, a[2], op]];
// quadratic-falloff glow: believable light, soft long tail
export const glowStops = (c, a = 1) => [[0, c, a], [0.18, c, a * 0.62], [0.4, c, a * 0.26], [0.7, c, a * 0.07], [1, c, 0]];

export function defs(K) {
  const g = [];
  const L3 = (id, a, dir = [0.2, 0, 0.8, 1]) => g.push(lin(id, v3(a), dir));
  L3('gCoat', K.coat); L3('gHood', K.hood); L3('gScarf', K.scarf, [0, 0, 1, 1]); L3('gRobe', K.robe); L3('gStole', K.stole);
  g.push(lin('gSkin', [[0, '#ffe0c4'], [0.6, '#f2b894'], [1, '#d98f6e']], [0.2, 0, 0.8, 1]));
  g.push(lin('gLeather', [[0, '#8a5a3a'], [1, '#4a2c1e']]));
  g.push(lin('gIron', [[0, '#6c7280'], [1, '#2c3039']]));
  g.push(lin('gWolf', [[0, K.wolf[0], 0.96], [0.4, K.wolf[1], 0.92], [0.8, K.wolf[2], 0.86], [1, K.wolf[3], 0.8]], [0.3, 0, 0.7, 1]));
  g.push(lin('gRaven', [[0, K.raven[0], 0.97], [0.4, K.raven[1], 0.93], [0.8, K.raven[2], 0.88], [1, K.raven[3], 0.82]], [0.3, 0, 0.7, 1]));
  g.push(rad('gCore', [[0, '#fff', 0.95], [0.5, K.spHi, 0.5], [1, K.spHi, 0]]));
  g.push(rad('gGlowSp', glowStops(K.sp, 0.85))); g.push(rad('gGlowW', glowStops(K.wolf[1], 0.75))); g.push(rad('gGlowR', glowStops(K.raven[1], 0.75)));
  g.push(rad('gGlowWarm', glowStops(K.warm, 0.95))); g.push(rad('gGlowWhite', glowStops('#ffffff', 0.9)));
  g.push(rad('gGlowBad', glowStops(K.bad, 0.7)));
  g.push(rad('gGlowGem', glowStops(K.gem[1], 0.8)));
  // hollow (enemy / drained) bodies: cool grey, light from top-left, no warm colour
  g.push(lin('gHol', [[0, K.hLight], [0.45, K.hMid], [1, K.hG2]], [0.2, 0, 0.8, 1]));
  g.push(lin('gHolD', [[0, K.hMid], [0.5, K.hG1], [1, K.hG3]], [0.2, 0, 0.8, 1]));
  g.push(lin('gHolL', [[0, K.hFog], [0.5, K.hLight], [1, K.hMid]], [0.2, 0, 0.8, 1]));
  g.push(lin('gBark', [[0, K.hMid], [0.5, K.hG1], [1, K.hG3]], [0, 0, 1, 0]));
  g.push(lin('gMoss', [[0, '#9fb592'], [0.5, '#6f8a6a'], [1, '#41574a']], [0.2, 0, 0.8, 1]));
  g.push(rad('gGround', [[0, K.hG1], [0.6, K.hG2], [1, K.hG3]]));
  g.push(lin('gLegFade', [[0, '#fff'], [0.55, '#fff'], [1, '#000']], [0, -40, 0, 2], true));
  g.push(lin('gLegFadeR', [[0, '#fff'], [0.5, '#fff'], [1, '#000']], [0, -20, 0, 1], true));
  g.push(lin('gTrunk', [[0, K.trunk], [0.5, K.trunkD], [1, K.trunkD]], [0, 0, 1, 0]));
  const F = `<filter id="b2" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="2"/></filter>
<filter id="b4" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4"/></filter>
<filter id="b8" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="8"/></filter>
<filter id="b16" x="-80%" y="-80%" width="260%" height="260%"><feGaussianBlur stdDeviation="16"/></filter>
<filter id="b30" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="30"/></filter>
<filter id="shd" x="-40%" y="-80%" width="180%" height="260%"><feGaussianBlur stdDeviation="4"/></filter>
<filter id="drop" x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#000" flood-opacity=".5"/></filter>
<filter id="glow" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="3.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
<filter id="glowS" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="1.6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
<filter id="grainF" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".75" numOctaves="2" seed="5"/><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .9 -.34"/></filter>
<filter id="mottle" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".012 .02" numOctaves="3" seed="11"/><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1.3 -.5"/></filter>
<filter id="roughE" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency=".06" numOctaves="2" seed="2" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="5"/></filter>`;
  return `<defs>${g.join('')}${F}</defs>`;
}

// ---------- drawing primitives ----------
export const circ = (cx, cy, r) => `M${cx - r} ${cy} a${r} ${r} 0 1 0 ${2 * r} 0 a${r} ${r} 0 1 0 ${-2 * r} 0Z`;
export const ell = (cx, cy, rx, ry) => `M${cx - rx} ${cy} a${rx} ${ry} 0 1 0 ${2 * rx} 0 a${rx} ${ry} 0 1 0 ${-2 * rx} 0Z`;
// shape: outlined, gradient-filled, with rim light on the lower-right edge (via shifted fill over a rim colour) and optional clipped extras (shade/highlight blobs)
export function shape(d, o = {}) {
  const id = nid('c');
  const w = o.w ?? 2.6, ol = o.ol ?? '#2a1d1a';
  const rx = o.rx ?? -2.4, ry = o.ry ?? -1.8;
  const outline = w > 0 ? `<path d="${d}" fill="${ol}" stroke="${ol}" stroke-width="${w * 2}" stroke-linejoin="round" stroke-linecap="round"/>` : '';
  const base = o.rim ? `<rect x="-600" y="-600" width="1200" height="1200" fill="${o.rim}"/><path d="${d}" fill="${o.f}" transform="translate(${rx},${ry})"/>` : `<path d="${d}" fill="${o.f}"/>`;
  return `<clipPath id="${id}"><path d="${d}"/></clipPath>${outline}<g clip-path="url(#${id})"${o.op != null ? ` opacity="${o.op}"` : ''}>${base}${o.x || ''}</g>`;
}
// soft clipped blob helpers for shade / highlight (use inside shape's `x`)
export const sh = (d, c = '#000', a = 0.25, b = 'b4') => `<path d="${d}" fill="${c}" opacity="${a}" filter="url(#${b})"/>`;
export const hl = (d, c = '#fff', a = 0.5, b = 'b2') => `<path d="${d}" fill="${c}" opacity="${a}" filter="url(#${b})"/>`;
// big glossy cartoon eye
export const eye = (x, y, rx, ry, o = {}) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="${o.c || '#2b1c20'}"/><ellipse cx="${x}" cy="${y + ry * 0.35}" rx="${rx * 0.7}" ry="${ry * 0.55}" fill="${o.c2 || '#5a3a3c'}" opacity=".7"/><circle cx="${x - rx * 0.35}" cy="${y - ry * 0.35}" r="${Math.max(1, rx * 0.38)}" fill="#fff"/><circle cx="${x + rx * 0.35}" cy="${y + ry * 0.4}" r="${Math.max(0.6, rx * 0.17)}" fill="#fff" opacity=".85"/>`;
export const ground = (rx = 24, ry = 6, a = 0.42, dy = 0) => `<ellipse cx="0" cy="${dy}" rx="${rx}" ry="${ry}" fill="#000" opacity="${a}" filter="url(#shd)"/>`;
// cold enemy eye-point (the only red-orange outside telegraphs)
export const epoint = (K, x, y, r = 2.4) => `<circle cx="${x}" cy="${y}" r="${r * 3.2}" fill="url(#gGlowBad)"/><circle cx="${x}" cy="${y}" r="${r}" fill="#ffd2a8"/><circle cx="${x}" cy="${y}" r="${r * 0.55}" fill="#fff"/>`;
// dark corruption veins: branching stroked paths
export function veins(K, x, y, len = 60, seed = 1, w = 2.2, n = 4, spread = 6.28) {
  const r = rnd(seed); let s = '';
  for (let i = 0; i < n; i++) {
    let a = (i / n) * spread + r() * 0.8, px = x, py = y, d = `M${px} ${py}`, ww = w;
    const segs = 5 + Math.floor(r() * 3);
    for (let k = 0; k < segs; k++) {
      a += (r() - 0.5) * 1.1; const l = (len / segs) * (0.7 + r() * 0.7);
      px += Math.cos(a) * l; py += Math.sin(a) * l * 0.62; d += ` L${px.toFixed(1)} ${py.toFixed(1)}`;
      if (k === 2 && r() > 0.35) { const a2 = a + (r() > 0.5 ? 0.9 : -0.9); d += ` M${px.toFixed(1)} ${py.toFixed(1)} L${(px + Math.cos(a2) * l * 1.2).toFixed(1)} ${(py + Math.sin(a2) * l * 0.75).toFixed(1)} M${px.toFixed(1)} ${py.toFixed(1)}`; }
    }
    s += `<path d="${d}" fill="none" stroke="${K.vein}" stroke-width="${ww}" stroke-linecap="round" stroke-linejoin="round" opacity=".92"/>`;
  }
  return s;
}
