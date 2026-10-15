// World sheet #2 mock-up engine (Chapter 1 Cursed Forest, Hollowlight Style v1 / Warm Lantern). MOCK-UPS ONLY, no game code.
// Draws a full game frame as SVG: Hollow ground + restored ground (life map), props, trails, corruption, fog, fireflies,
// lightmap (real ARC keyframes from src/gfx/palette.js), then lit sprites. Units: 1 design px = 1 px at the 1280x720 desktop frame (= 0.5 game unit).
// Reuses the style-lab engine and the approved Wren v2 / Elias v2 rigs (imports only, nothing edited).
import { begin, use, T, FONT, glow, lgU, rgU, rnd, nid, addDef, mix, wolf, raven, crawler, gem } from '../style-lab/lab.mjs';
import { STYLES, tuft, flower, blade, sparkle } from '../style-lab/scene.mjs';
import { ARC } from './arc.mjs';

export const ol = (c, t = 0.45) => mix(c, '#17222c', t);
let GC = new Map();
const bb = (key, stops, o = {}) => {
  if (!GC.has(key)) { const id = nid('w'); GC.set(key, id); addDef(`<linearGradient id="${id}" x1="${o.x1 ?? 0}" y1="${o.y1 ?? 0}" x2="${o.x2 ?? 1}" y2="${o.y2 ?? 0}">${stops.map(([off, c, a = 1]) => `<stop offset="${off}" stop-color="${c}" stop-opacity="${a}"/>`).join('')}</linearGradient>`); }
  return `url(#${GC.get(key)})`;
};
const rb = (key, stops, o = {}) => {
  if (!GC.has(key)) { const id = nid('w'); GC.set(key, id); addDef(`<radialGradient id="${id}" cx="${o.cx ?? 0.34}" cy="${o.cy ?? 0.3}" r="${o.r ?? 0.8}">${stops.map(([off, c, a = 1]) => `<stop offset="${off}" stop-color="${c}" stop-opacity="${a}"/>`).join('')}</radialGradient>`); }
  return `url(#${GC.get(key)})`;
};
const SH = (rx, ry = rx * 0.22, a = 0.3, dy = 2) => `<ellipse cx="0" cy="${dy}" rx="${rx}" ry="${ry}" fill="#000" opacity="${a}" filter="url(#b4)"/>`;

// ---------- palette per take and state ----------
export function PC(alive, K = 'A') {
  if (alive) return K === 'A'
    ? { leaf: ['#b8e47e', '#5fa94e', '#2f6a3a'], bark: ['#a07a54', '#5a3e2a'], stone: ['#c4c8b0', '#7d866e'], moss: '#79a85a', warm: '#ffd88a', flo: ['#ffb347', '#ff8fa3', '#fff1c4', '#ffd86b'], root: '#6a4a34' }
    : { leaf: ['#9cc874', '#4a8a48', '#245a3a'], bark: ['#8a6a4c', '#4a3626'], stone: ['#b0b8a0', '#6e7862'], moss: '#6a9a52', warm: '#ffcf7a', flo: ['#ffcf7a', '#f3e7cf', '#ff9fb0', '#ffb347'], root: '#5a4030' };
  return K === 'A'
    ? { leaf: ['#aab6c4', '#6f7c8d', '#46525f'], bark: ['#8a94a3', '#555f6d'], stone: ['#aab4c0', '#6d7886'], moss: '#6d7a88', warm: '#9aa8b8', flo: ['#8d99a8'], root: '#59636f' }
    : { leaf: ['#8e9aaa', '#5d6a7b', '#3a4553'], bark: ['#7a8594', '#464f5c'], stone: ['#9aa4b2', '#5f6a78'], moss: '#5f6c7a', warm: '#8a98a8', flo: ['#7a8898'], root: '#505a67' };
}

// ---------- ground ----------
// kind: 'hollow' | 'alive'; K: take. Screen-space (no scrolling); counts scale with area.
export function groundLayer(kind, K, w, h, u, seed) {
  const r = rnd(seed), alive = kind === 'alive';
  let o = '';
  const base = K === 'A'
    ? (alive ? [['0', '#92d273'], ['.5', '#70b858'], ['1', '#4f9a52']] : [['0', '#8a98ab'], ['.5', '#788aa0'], ['1', '#66768e']])
    : (alive ? [['0', '#6f9f4c'], ['.5', '#58893f'], ['1', '#437640']] : [['0', '#6a7a8e'], ['.5', '#5a6a7e'], ['1', '#4a596c']]);
  o += `<rect width="${w}" height="${h}" fill="url(#${lgU(`gb${kind}${K}${h}`, 0, 0, 0, h, base.map(([a, b]) => [+a, b]))})"/>`;
  o += `<rect width="${w}" height="${h}" filter="url(#mottle)" opacity="${alive ? 0.5 : 0.5}"/>`;
  // low-frequency painted blotches (two scales)
  for (let i = 0; i < Math.round(w * h / 36000); i++) { const x = r() * w, y = r() * h, rr = (40 + r() * 90) * u; o += `<ellipse cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" rx="${rr.toFixed(0)}" ry="${(rr * 0.55).toFixed(0)}" fill="${r() > 0.5 ? (alive ? '#c0ec90' : '#a2afc0') : (alive ? '#3a8a44' : '#4a5668')}" opacity="${(0.12 + r() * 0.12).toFixed(2)}" filter="url(#b16)"/>`; }
  if (K === 'A') {
    if (!alive) {
      for (let i = 0; i < Math.round(w * h / 22000); i++) { const x = r() * w, y = r() * h; let d = `M${x.toFixed(0)} ${y.toFixed(0)}`, px = x, py = y, a = r() * 6.28; for (let q = 0; q < 5; q++) { a += (r() - 0.5) * 1.3; px += Math.cos(a) * 14 * u; py += Math.sin(a) * 8 * u; d += ` L${px.toFixed(0)} ${py.toFixed(0)}`; } o += `<path d="${d}" fill="none" stroke="#4a566c" stroke-width="${(1.3 * u + 0.4).toFixed(1)}" stroke-linecap="round" opacity=".6"/>`; }
      for (let i = 0; i < Math.round(w * h / 2600); i++) { const x = r() * w, y = r() * h, c = i % 2 ? '#9aa8ba' : '#aab6c6'; o += `<path d="${blade(x, y, (5 + r() * 8) * u, (r() - 0.5) * 7, 1.3)}" fill="${c}"/><path d="${blade(x + 2.2, y + 0.4, (4 + r() * 6) * u, (r() - 0.5) * 7, 1.1)}" fill="${c}"/>`; }
      for (let i = 0; i < Math.round(w * h / 9000); i++) { const x = r() * w, y = r() * h; o += `<path d="M${x.toFixed(0)} ${y.toFixed(0)} v${(-7 * u).toFixed(0)}" stroke="#8d99a8" stroke-width="${(1.2 * u + 0.3).toFixed(1)}" stroke-linecap="round"/><circle cx="${x.toFixed(0)}" cy="${(y - 8 * u).toFixed(0)}" r="${(2.2 * u).toFixed(1)}" fill="#a9b4c0" opacity=".8"/>`; } // closed grey buds (flowers that have not woken)
      for (let i = 0; i < 6; i++) { const x = r() * w, y = r() * h; o += `<ellipse cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" rx="${(5 * u).toFixed(1)}" ry="${(3 * u).toFixed(1)}" fill="#8b97a3"/>`; }
    } else {
      const cols = ['#b8e878', '#7cc25c', '#d6f59a', '#4a9a50'];
      for (let i = 0; i < Math.round(w * h / 2600); i++) { const x = r() * w, y = r() * h, l = (14 + r() * 24) * u; o += `<path d="M${x.toFixed(0)} ${y.toFixed(0)} q${(l * 0.5).toFixed(0)} ${(-3 - r() * 4).toFixed(0)} ${l.toFixed(0)} ${(r() * 4 - 2).toFixed(0)}" stroke="${r() > 0.5 ? '#9ad66b' : '#3f7a46'}" stroke-width="${(1.1 * u + 0.3).toFixed(1)}" fill="none" opacity=".45" stroke-linecap="round"/>`; }
      for (let i = 0; i < Math.round(w * h / 1500); i++) o += tuft(r() * w, r() * h, 0.56 * u + 0.05, cols, r);
      // flower DRIFTS (clusters), not an even sprinkle
      for (let i = 0; i < Math.round(w * h / 38000); i++) { const cx = r() * w, cy = r() * h, col = PC(true, 'A').flo[i % 4]; for (let q = 0; q < 8; q++) o += flower(cx + (r() - 0.5) * 100 * u, cy + (r() - 0.5) * 50 * u, 0.8 * u + 0.05, col); }
      for (let i = 0; i < Math.round(w * h / 7000); i++) o += flower(r() * w, r() * h, 0.7 * u + 0.05, PC(true, 'A').flo[i % 4]);
      for (let i = 0; i < 6; i++) { const x = r() * w, y = r() * h; o += `<ellipse cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" rx="${(5 * u).toFixed(1)}" ry="${(3 * u).toFixed(1)}" fill="#b6bdb0"/>`; }
    }
  } else {
    // TAKE B: forest floor. Leaf litter, roots, moss, ferns, dapples.
    const lit = alive ? ['#c8923a', '#a8672e', '#e0b060', '#8a5a2a'] : ['#7f8b9a', '#6f7a89', '#8d98a6', '#5f6a78'];
    for (let i = 0; i < Math.round(w * h / 18000); i++) { // roots creeping across the floor
      const x = r() * w, y = r() * h; let d = `M${x.toFixed(0)} ${y.toFixed(0)}`, px = x, py = y, a = r() * 6.28; const n = 4 + (r() * 3 | 0);
      for (let q = 0; q < n; q++) { a += (r() - 0.5) * 1.1; px += Math.cos(a) * 26 * u; py += Math.sin(a) * 11 * u; d += ` L${px.toFixed(0)} ${py.toFixed(0)}`; }
      o += `<path d="${d}" fill="none" stroke="${alive ? '#3a2a22' : '#27303c'}" stroke-width="${(5 * u + 1).toFixed(1)}" stroke-linecap="round" stroke-linejoin="round" opacity=".7"/><path d="${d}" fill="none" stroke="${alive ? '#8a6a4c' : '#6d7886'}" stroke-width="${(1.3 * u + 0.3).toFixed(1)}" stroke-linecap="round" opacity=".5" transform="translate(-1,-1.6)"/>`;
    }
    for (let i = 0; i < Math.round(w * h / 380); i++) { const x = r() * w, y = r() * h, c = lit[i % 4]; o += `<ellipse cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" rx="${((3 + r() * 3) * u).toFixed(1)}" ry="${((1.6 + r() * 1.4) * u).toFixed(1)}" fill="${c}" opacity="${(0.55 + r() * 0.35).toFixed(2)}" transform="rotate(${(r() * 180).toFixed(0)} ${x.toFixed(0)} ${y.toFixed(0)})"/>`; }
    for (let i = 0; i < Math.round(w * h / 26000); i++) { const x = r() * w, y = r() * h, rr = (24 + r() * 34) * u; o += `<ellipse cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" rx="${rr.toFixed(0)}" ry="${(rr * 0.5).toFixed(0)}" fill="${alive ? '#6a9a52' : '#6a7684'}" opacity=".42" filter="url(#wobS)"/>`; } // moss pads
    for (let i = 0; i < Math.round(w * h / 9000); i++) { const x = r() * w, y = r() * h; for (let q = 0; q < 6; q++) o += `<path d="${blade(x, y, (13 + r() * 8) * u, (q - 2.5) * 6 * u, 1.6 * u)}" fill="${alive ? (q % 2 ? '#7fb35a' : '#4f8a48') : (q % 2 ? '#7d8a9a' : '#66748a')}" stroke="${ol(alive ? '#4f8a48' : '#66748a', 0.35)}" stroke-width=".6"/>`; } // fern fans
    if (alive) for (let i = 0; i < Math.round(w * h / 30000); i++) { const x = r() * w, y = r() * h; o += glow(x, y, 26 * u, 14 * u, '#ffe3a6', 0.25); } // sun dapples
    for (let i = 0; i < Math.round(w * h / 14000); i++) { const x = r() * w, y = r() * h; o += `<ellipse cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" rx="${(4 * u).toFixed(1)}" ry="${(2.4 * u).toFixed(1)}" fill="${alive ? '#a8a898' : '#8b97a3'}"/>`; }
  }
  return o;
}

// ---------- props (origin = base centre, +y down, units = px at u=1). Return {trunk, crown, ground}. ----------
// A leafy mass: ONE merged outline (outline circles first, fills clipped to the union), vertical light-to-dark shading, a dark belly,
// lighter leaf clusters on the sun side, leaf marks, sun-side rim light. Same silhouette for Hollow and restored so the swap never pops.
function cloud(C, P, key, o = {}) {
  const id = nid('cp'), x0 = Math.min(...C.map((c) => c[0] - c[2])), x1 = Math.max(...C.map((c) => c[0] + c[2])), y0 = Math.min(...C.map((c) => c[1] - c[2])), y1 = Math.max(...C.map((c) => c[1] + c[2]));
  addDef(`<clipPath id="${id}">${C.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join('')}</clipPath>`);
  const r = o.r || rnd(7), oc = ol(P.leaf[2], 0.4);
  let s = C.map(([x, y, rr]) => `<circle cx="${x}" cy="${y}" r="${rr}" fill="${oc}" stroke="${oc}" stroke-width="${o.small ? 2.6 : 3.6}" stroke-linejoin="round"/>`).join('');
  s += `<g clip-path="url(#${id})"><rect x="${x0}" y="${y0}" width="${x1 - x0}" height="${y1 - y0}" fill="${bb(key + 'v', [[0, P.leaf[0]], [0.42, P.leaf[1]], [1, P.leaf[2]]], { x1: 0.15, y1: 0, x2: 0.3, y2: 1 })}"/>`;
  s += `<ellipse cx="${(x0 + x1) / 2}" cy="${y1 - (y1 - y0) * 0.1}" rx="${(x1 - x0) * 0.6}" ry="${(y1 - y0) * 0.26}" fill="${P.leaf[2]}" opacity=".55" filter="url(#b8)"/>`;
  C.forEach(([x, y, rr]) => { s += `<circle cx="${(x - rr * 0.3).toFixed(1)}" cy="${(y - rr * 0.34).toFixed(1)}" r="${(rr * 0.6).toFixed(1)}" fill="${P.leaf[0]}" opacity="${o.alive ? 0.4 : 0.32}"/><circle cx="${(x + rr * 0.34).toFixed(1)}" cy="${(y + rr * 0.4).toFixed(1)}" r="${(rr * 0.5).toFixed(1)}" fill="${P.leaf[2]}" opacity=".3"/>`; });
  const n = o.small ? 10 : 26;
  for (let i = 0; i < n; i++) { const [x, y, rr] = C[(r() * C.length) | 0], a = r() * 6.283, d = rr * 0.7 * Math.sqrt(r()), px = x + Math.cos(a) * d, py = y + Math.sin(a) * d, lt = r() > 0.5; s += `<path d="M${px.toFixed(1)} ${py.toFixed(1)} l${lt ? 2.4 : -2.4} -4.2" stroke="${lt ? P.leaf[0] : P.leaf[2]}" stroke-width="1.5" fill="none" opacity="${lt ? 0.8 : 0.5}" stroke-linecap="round"/>`; }
  s += '</g>';
  C.forEach(([x, y, rr]) => { s += `<path d="M${(x - rr * 0.84).toFixed(1)} ${(y - rr * 0.22).toFixed(1)} A${rr} ${rr} 0 0 1 ${(x - rr * 0.18).toFixed(1)} ${(y - rr * 0.96).toFixed(1)}" stroke="${o.alive ? '#f0ffc0' : '#e0e8f0'}" stroke-width="${o.small ? 1.8 : 2.4}" fill="none" opacity="${o.alive ? 0.6 : 0.42}" stroke-linecap="round"/>`; });
  if (o.alive) for (let i = 0; i < (o.small ? 3 : 8); i++) { const [x, y, rr] = C[(r() * C.length) | 0]; s += `<circle cx="${(x + (r() - 0.7) * rr).toFixed(1)}" cy="${(y - r() * rr * 0.6).toFixed(1)}" r="2.2" fill="#fff1a8" opacity=".9"/>`; }
  return s;
}

export function oakA(alive, K = 'A', seed = 1) {
  const r = rnd(seed), P = PC(alive, K);
  const fk = `${alive}${K}`;
  let trunk = SH(54, 12, 0.32);
  trunk += `<path d="M-30 5 Q-19 -6 -15 -38 Q-12 -80 -11 -120 L14 -120 Q16 -80 17 -40 Q21 -6 34 5 Q2 13 -30 5Z" fill="${bb('bk' + fk, [[0, P.bark[0]], [0.55, mix(P.bark[0], P.bark[1], 0.5)], [1, P.bark[1]]])}" stroke="${ol(P.bark[1])}" stroke-width="1.8" stroke-linejoin="round"/>`;
  trunk += `<path d="M-13 -34 Q-12 -74 -10 -112" stroke="${mix(P.bark[0], '#fff', 0.4)}" stroke-width="2.4" fill="none" opacity=".55" stroke-linecap="round"/>`;
  trunk += `<path d="M3 -18 Q5 -52 3 -96 M10 -26 Q12 -62 9 -104" stroke="${ol(P.bark[1], 0.15)}" stroke-width="1.4" fill="none" opacity=".5" stroke-linecap="round"/><ellipse cx="2" cy="-58" rx="5" ry="7" fill="${ol(P.bark[1], 0.55)}" opacity=".7"/>`;
  if (alive) trunk += `<path d="M-24 2 Q-18 -10 -14 -16 Q-8 -8 -4 2Z" fill="${P.moss}" opacity=".75"/>`;
  const C = [[-48, -130, 44], [46, -134, 42], [0, -178, 54], [-22, -112, 40], [30, -106, 36], [-70, -164, 30], [66, -166, 28], [0, -128, 46]];
  let crown = cloud(C, P, 'oak' + fk, { alive, r });
  if (!alive) crown += `<path d="M-86 -168 q-14 -10 -20 -26 M-84 -166 q-18 2 -30 -6 M80 -176 q16 -12 22 -28 M-10 -228 q-6 -14 -2 -28" stroke="${P.bark[1]}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
  return { trunk, crown, ground: '', h: 230, w: 240 };
}

export function snag(alive, K = 'A', seed = 2) {
  const P = PC(alive, K), fk = `${alive}${K}`, pale = alive ? ['#d9c8aa', '#8a7458'] : ['#c5ccd4', '#7a8593'];
  let trunk = SH(34, 8, 0.3);
  trunk += `<path d="M-14 4 Q-9 -4 -8 -40 Q-7 -90 -5 -150 L4 -150 Q6 -90 8 -40 Q9 -4 18 4 Q2 9 -14 4Z" fill="${bb('sn' + fk, [[0, pale[0]], [1, pale[1]]])}" stroke="${ol(pale[1])}" stroke-width="1.5" stroke-linejoin="round"/>`;
  trunk += `<path d="M-5 -30 Q-4 -80 -3 -140" stroke="#fff" stroke-width="2" fill="none" opacity=".4" stroke-linecap="round"/>`;
  trunk += `<path d="M-6 -22 h8 M-6 -58 h7 M-5 -96 h8" stroke="${ol(pale[1], 0.3)}" stroke-width="1.6" stroke-linecap="round" opacity=".6"/>`;
  const br = [[-6, -118, -52, -168, 7], [-3, -96, 42, -150, 6], [-4, -140, -26, -196, 5], [0, -150, 30, -204, 5], [-5, -70, -44, -104, 5], [-52, -168, -70, -176, 3], [42, -150, 66, -156, 3]];
  let crown = br.map(([x1, y1, x2, y2, wd]) => `<path d="M${x1} ${y1} Q${(x1 + x2) / 2 - 4} ${(y1 + y2) / 2 - 12} ${x2} ${y2}" stroke="${ol(pale[1], 0.35)}" stroke-width="${wd + 1.6}" fill="none" stroke-linecap="round"/><path d="M${x1} ${y1} Q${(x1 + x2) / 2 - 4} ${(y1 + y2) / 2 - 12} ${x2} ${y2}" stroke="${pale[0]}" stroke-width="${wd}" fill="none" stroke-linecap="round"/>`).join('');
  if (alive) { const bl = [[-52, -168], [42, -150], [-26, -196], [30, -204], [-44, -104], [-70, -176], [66, -156]]; bl.forEach(([x, y], i) => { for (let q = 0; q < 5; q++) crown += `<circle cx="${x + Math.cos(q * 1.9 + i) * 11}" cy="${y + Math.sin(q * 1.9 + i) * 9 - 3}" r="${5 + (q % 2) * 2}" fill="${q % 3 === 0 ? '#ffb8c8' : q % 3 === 1 ? '#fff1c4' : '#9ad66b'}" stroke="${ol('#ffb8c8', 0.35)}" stroke-width=".8"/>`; }); }
  return { trunk, crown, ground: '', h: 206, w: 150 };
}

// TAKE B pillar trunk: very tall, narrow footprint; canopy is only a shadow on the ground (nothing ever hides a creature).
export function pillar(alive, K = 'B', seed = 3) {
  const P = PC(alive, 'B'), fk = `${alive}B`;
  let trunk = SH(66, 14, 0.34);
  const roots = [[-40, 6, -16, -30], [38, 6, 14, -32], [-22, 12, -8, -22], [18, 12, 6, -24]];
  trunk += roots.map(([x1, y1, x2, y2]) => `<path d="M${x1} ${y1} Q${(x1 + x2) / 2} ${y1 - 6} ${x2} ${y2}" stroke="${ol(P.bark[1], 0.4)}" stroke-width="12" fill="none" stroke-linecap="round"/><path d="M${x1} ${y1} Q${(x1 + x2) / 2} ${y1 - 6} ${x2} ${y2}" stroke="${P.bark[0]}" stroke-width="8" fill="none" stroke-linecap="round"/>`).join('');
  trunk += `<path d="M-22 4 Q-17 -20 -16 -60 L-15 -2000 L15 -2000 L16 -60 Q17 -20 24 4 Q2 11 -22 4Z" fill="${bb('pl' + fk, [[0, P.bark[0]], [0.5, mix(P.bark[0], P.bark[1], 0.55)], [1, P.bark[1]]])}" stroke="${ol(P.bark[1])}" stroke-width="1.8" stroke-linejoin="round"/>`;
  trunk += `<path d="M-12 -20 Q-10 -150 -11 -1980 M-2 -10 Q0 -140 -1 -1980 M8 -16 Q10 -150 9 -1980" stroke="${ol(P.bark[1], 0.1)}" stroke-width="2" fill="none" opacity=".5" stroke-linecap="round"/><path d="M-13 -30 Q-12 -150 -12 -1960" stroke="${mix(P.bark[0], '#fff', 0.35)}" stroke-width="2.4" fill="none" opacity=".5" stroke-linecap="round"/>`;
  trunk += `<ellipse cx="3" cy="-70" rx="6" ry="9" fill="${ol(P.bark[1], 0.6)}"/>`;
  if (alive) trunk += `<path d="M-20 -4 Q-14 -50 -12 -64 Q-6 -34 -2 -4Z" fill="${P.moss}" opacity=".75"/><path d="M6 -8 Q10 -30 14 -40 Q16 -20 18 -6Z" fill="${P.moss}" opacity=".6"/>`;
  const ground = `<ellipse cx="46" cy="-8" rx="170" ry="64" fill="#0b1018" opacity="${alive ? 0.24 : 0.3}" filter="url(#b16)"/>`;
  return { trunk, crown: '', ground, h: 2000, w: 50 };
}

export function bush(alive, K = 'A', seed = 4) {
  const P = PC(alive, K), fk = `${alive}${K}`, r = rnd(seed);
  let t = SH(38, 8, 0.28);
  t += cloud([[-26, -18, 21], [2, -32, 26], [27, -18, 21], [-4, -14, 22]], P, 'bu' + fk, { alive, r, small: true });
  for (let i = 0; i < 6; i++) t += `<circle cx="${(-24 + r() * 48).toFixed(0)}" cy="${(-44 + r() * 30).toFixed(0)}" r="${alive ? 3.4 : 2.4}" fill="${alive ? ['#ff8fa3', '#ffd86b', '#fff1c4'][i % 3] : '#c0cad6'}"${alive ? ` stroke="${ol('#ff8fa3', 0.4)}" stroke-width=".7"` : ' opacity=".8"'}/>`;
  return { trunk: t, crown: '', ground: '', h: 56, w: 76 };
}

export function stump(alive, K = 'A') {
  const P = PC(alive, K), fk = `${alive}${K}`;
  let t = SH(36, 8, 0.3);
  t += `<path d="M-24 2 Q-20 -6 -19 -26 L19 -26 Q20 -6 26 2 Q2 9 -24 2Z" fill="${bb('st' + fk, [[0, P.bark[0]], [1, P.bark[1]]])}" stroke="${ol(P.bark[1])}" stroke-width="1.6" stroke-linejoin="round"/>`;
  t += `<ellipse cx="0" cy="-27" rx="20" ry="8" fill="${alive ? '#d8b284' : '#bcc4cd'}" stroke="${ol(P.bark[1])}" stroke-width="1.4"/><ellipse cx="0" cy="-27" rx="13" ry="5" fill="none" stroke="${ol(P.bark[1], 0.25)}" stroke-width="1" opacity=".6"/><ellipse cx="0" cy="-27" rx="6" ry="2.4" fill="none" stroke="${ol(P.bark[1], 0.25)}" stroke-width="1" opacity=".6"/>`;
  if (alive) { t += `<path d="M-19 -26 Q-12 -34 -4 -28 Q-12 -22 -19 -26Z" fill="${P.moss}"/>`; for (const [x, y, s] of [[14, -1, 1], [22, -4, 0.7]]) t += `<g transform="translate(${x},${y}) scale(${s})"><rect x="-1.6" y="-8" width="3.2" height="9" rx="1.4" fill="#efe2c2"/><ellipse cx="0" cy="-9" rx="7" ry="4.4" fill="#ffd88a" stroke="${ol('#ffd88a', 0.4)}" stroke-width=".9"/><circle cx="-2" cy="-10" r="1.1" fill="#fff4dc"/>${glow(0, -8, 14, 9, '#ffc45a', 0.45)}</g>`; }
  else for (const [x, y, s] of [[14, -1, 1], [22, -4, 0.7]]) t += `<g transform="translate(${x},${y}) scale(${s})"><rect x="-1.6" y="-8" width="3.2" height="9" rx="1.4" fill="#b8c2cc"/><ellipse cx="0" cy="-9" rx="7" ry="4.4" fill="#8e9aaa" stroke="${ol('#8e9aaa', 0.4)}" stroke-width=".9"/></g>`;
  return { trunk: t, crown: '', ground: '', h: 38, w: 70 };
}

export function logP(alive, K = 'A') {
  const P = PC(alive, K), fk = `${alive}${K}`;
  let t = SH(64, 10, 0.3);
  t += `<path d="M-58 -2 Q-60 -24 -50 -26 L48 -26 Q58 -24 58 -2 Q56 4 46 4 L-48 4 Q-58 4 -58 -2Z" fill="${bb('lg' + fk, [[0, P.bark[0]], [1, P.bark[1]]], { x1: 0, y1: 0, x2: 0, y2: 1 })}" stroke="${ol(P.bark[1])}" stroke-width="1.6" stroke-linejoin="round"/>`;
  t += `<ellipse cx="52" cy="-12" rx="7" ry="14" fill="${alive ? '#d8b284' : '#bcc4cd'}" stroke="${ol(P.bark[1])}" stroke-width="1.4"/><ellipse cx="52" cy="-12" rx="3" ry="7" fill="none" stroke="${ol(P.bark[1], 0.25)}" stroke-width="1" opacity=".6"/>`;
  t += `<path d="M-40 -22 Q-10 -26 24 -22 M-44 -12 Q-10 -15 28 -10" stroke="${ol(P.bark[1], 0.15)}" stroke-width="1.5" fill="none" opacity=".5"/><path d="M-20 -26 Q-16 -42 -8 -48" stroke="${ol(P.bark[1])}" stroke-width="4" fill="none" stroke-linecap="round"/>`;
  if (alive) t += `<path d="M-46 -24 Q-30 -34 -12 -26 Q-30 -20 -46 -24Z" fill="${P.moss}"/><circle cx="-8" cy="-48" r="5" fill="${P.leaf[1]}"/>`;
  return { trunk: t, crown: '', ground: '', h: 46, w: 124 };
}

export function boulder(alive, K = 'A') {
  const P = PC(alive, K), fk = `${alive}${K}`;
  let t = SH(46, 9, 0.3);
  t += `<path d="M-40 2 Q-46 -18 -28 -34 Q-6 -48 18 -38 Q42 -28 44 -6 Q44 4 30 5 Z" fill="${rb('bo' + fk, [[0, P.stone[0]], [1, P.stone[1]]], { cx: 0.35, cy: 0.25, r: 0.9 })}" stroke="${ol(P.stone[1])}" stroke-width="1.6" stroke-linejoin="round"/>`;
  t += `<path d="M-26 -30 Q-8 -42 12 -35" stroke="#fff" stroke-width="2.4" fill="none" opacity=".4" stroke-linecap="round"/><path d="M-8 -22 l6 10 l-4 8 M16 -26 l-3 8" stroke="${ol(P.stone[1], 0.3)}" stroke-width="1.3" fill="none" opacity=".6" stroke-linecap="round"/>`;
  if (alive) t += `<path d="M-30 -26 Q-14 -44 8 -38 Q-4 -30 -16 -30 Q-22 -22 -30 -26Z" fill="${P.moss}"/>`;
  return { trunk: t, crown: '', ground: '', h: 46, w: 90 };
}

export function gravestone(alive, K = 'A') {
  const P = PC(alive, K), fk = `${alive}${K}`;
  let t = SH(26, 6, 0.28) + `<g transform="rotate(-6)">`;
  t += `<path d="M-17 2 L-17 -34 Q-17 -52 0 -52 Q17 -52 17 -34 L17 2 Z" fill="${bb('gr' + fk, [[0, P.stone[0]], [1, P.stone[1]]])}" stroke="${ol(P.stone[1])}" stroke-width="1.6" stroke-linejoin="round"/>`;
  t += `<path d="M0 -42 v16 M-7 -35 h14" stroke="${ol(P.stone[1], 0.25)}" stroke-width="2.2" stroke-linecap="round" opacity=".7"/><path d="M-14 -40 Q-14 -50 -4 -50" stroke="#fff" stroke-width="2" fill="none" opacity=".4" stroke-linecap="round"/>`;
  if (alive) t += `<path d="M-19 0 Q-12 -14 -4 -2Z" fill="${P.moss}"/><circle cx="-9" cy="-12" r="2.4" fill="#fff1c4"/><circle cx="-5" cy="-9" r="2" fill="#ff8fa3"/>`;
  t += `</g>`;
  return { trunk: t, crown: '', ground: '', h: 54, w: 42 };
}

export function fern(alive, K = 'A', seed = 6) {
  const P = PC(alive, K), fk = alive ? ['#9ad66b', '#63a54f', '#bde68a'] : ['#8696a8', '#6a7686', '#7d8a9a'];
  let t = SH(24, 5, 0.22);
  for (let q = 0; q < 8; q++) t += `<path d="${blade(0, 0, 26 + (q % 3) * 6, (q - 3.5) * 8, 3)}" fill="${fk[q % 3]}" stroke="${ol(fk[1], 0.35)}" stroke-width=".8"/>`;
  return { trunk: t, crown: '', ground: '', h: 34, w: 50 };
}

export function mushRing(alive, K = 'A') {
  let t = '', g = '';
  const n = 9;
  const items = [];
  for (let i = 0; i < n; i++) { const a = (i / n) * 6.283 + 0.3; items.push([Math.cos(a) * 46, Math.sin(a) * 16, 0.7 + ((i * 7) % 5) / 10]); }
  items.sort((a, b) => a[1] - b[1]);
  g += `<ellipse cx="0" cy="0" rx="52" ry="19" fill="none" stroke="${alive ? '#ffe3a6' : '#a8b4c0'}" stroke-width="1.4" stroke-dasharray="2 5" opacity="${alive ? 0.5 : 0.3}" stroke-linecap="round"/>`;
  for (const [x, y, s] of items) {
    const cap = alive ? '#ffd88a' : '#8e9aaa', st = alive ? '#efe2c2' : '#b8c2cc';
    t += `<g transform="translate(${x.toFixed(1)},${y.toFixed(1)}) scale(${s.toFixed(2)})">${alive ? glow(0, -8, 18, 10, '#ffc45a', 0.5) : ''}<rect x="-2" y="-9" width="4" height="10" rx="1.6" fill="${st}" stroke="${ol(st, 0.35)}" stroke-width=".8"/><ellipse cx="0" cy="-11" rx="8.4" ry="5" fill="${cap}" stroke="${ol(cap, 0.4)}" stroke-width="1"/><circle cx="-2.6" cy="-12.4" r="1.2" fill="#fff4dc" opacity=".9"/><circle cx="3" cy="-10.4" r=".9" fill="#fff4dc" opacity=".8"/></g>`;
  }
  return { trunk: t, crown: '', ground: g, h: 30, w: 110 };
}

export function bramble(alive, K = 'A', seed = 8) {
  const col = alive ? '#3a4a3a' : '#2c3441', hi = alive ? '#7d9a6a' : '#6d7886';
  let t = SH(44, 8, 0.3);
  const st = ['M-40 2 Q-46 -26 -20 -34 Q0 -44 -6 -22', 'M-6 2 Q-14 -34 12 -46 Q34 -50 30 -28', 'M10 2 Q28 -22 48 -14 Q58 -4 44 2', 'M-30 -6 Q-20 -44 4 -40'];
  st.forEach((d) => { t += `<path d="${d}" stroke="${ol(col, 0.3)}" stroke-width="7" fill="none" stroke-linecap="round"/><path d="${d}" stroke="${col}" stroke-width="4.6" fill="none" stroke-linecap="round"/><path d="${d}" stroke="${hi}" stroke-width="1.2" fill="none" stroke-linecap="round" opacity=".5" transform="translate(-1,-1.4)"/>`; });
  for (const [x, y, a] of [[-34, -26, 200], [-20, -38, 280], [8, -46, 300], [30, -48, 340], [40, -14, 20], [-8, -20, 250]]) t += `<path d="M${x} ${y} l${Math.cos(a * 0.01745) * 9} ${Math.sin(a * 0.01745) * 9} l-3 3Z" fill="${hi}" opacity=".85"/>`;
  if (alive) for (const [x, y] of [[-12, -34], [20, -42], [40, -18]]) t += `<circle cx="${x}" cy="${y}" r="2.6" fill="#ff8fa3" stroke="${ol('#ff8fa3', 0.4)}" stroke-width=".7"/>`;
  return { trunk: t, crown: '', ground: '', h: 50, w: 100 };
}

export function lamp(lit, K = 'A') {
  let t = SH(24, 6, 0.3);
  t += `<path d="M-4 3 L-3 -96 L3 -96 L4 3 Z" fill="${bb('lp', [[0, '#7a6a5a'], [1, '#3a3028']])}" stroke="#241c16" stroke-width="1.4"/><path d="M-3 -94 Q-3 -108 8 -108 L20 -108" stroke="#2a2018" stroke-width="3.4" fill="none" stroke-linecap="round"/>`;
  t += `<path d="M-8 3 Q0 -2 8 3" stroke="#2a2018" stroke-width="5" fill="none"/>`;
  const fl = lit ? '#ffd27a' : '#8a96a6';
  t += `<g transform="translate(20,-100)"><path d="M0 0 v6" stroke="#2a2018" stroke-width="1.6"/><rect x="-9" y="6" width="18" height="24" rx="4" fill="${lit ? '#ffe9b0' : '#9aa6b4'}" fill-opacity="${lit ? 0.5 : 0.35}" stroke="#2a2018" stroke-width="2"/><path d="M-9 14 h18 M0 6 v24" stroke="#2a2018" stroke-width="1.2" opacity=".7"/><ellipse cx="0" cy="22" rx="4.4" ry="6" fill="${fl}"${lit ? '' : ' opacity=".55"'}/>${lit ? `<ellipse cx="0" cy="22" rx="2" ry="3.4" fill="#fffbe6"/>` : `<circle cx="1" cy="20" r="1.2" fill="#d8e4ee"/>`}<path d="M-6 6 Q0 -4 6 6Z" fill="#2a2018"/></g>`;
  return { trunk: t, crown: '', ground: '', h: 110, w: 60, light: lit ? [20, -78, 150, '#ffc45a', 0.9] : null, halo: lit ? [20, -78, 90, 70, '#ffc45a', 0.55] : null };
}

export function well(state, K = 'A') { // state: 'hollow' | 'woken' (restored, ember lit)
  const al = state !== 'hollow', P = PC(al, K), st = al ? ['#c4c8b0', '#7d866e'] : ['#aab4c0', '#6d7886'];
  let g = '', t = SH(60, 11, 0.32);
  t += `<path d="M-46 0 Q-48 -26 -44 -36 L44 -36 Q48 -26 46 0 Q0 14 -46 0Z" fill="${bb('wl' + al, [[0, st[0]], [1, st[1]]], { x1: 0, y1: 0, x2: 1, y2: 0 })}" stroke="${ol(st[1])}" stroke-width="1.8" stroke-linejoin="round"/>`;
  for (let i = 0; i < 8; i++) { const x = -40 + i * 11.4; t += `<path d="M${x} -4 L${x + 6} -4 M${x + 2} -14 L${x + 10} -14 M${x - 2} -24 L${x + 6} -24" stroke="${ol(st[1], 0.2)}" stroke-width="1.2" opacity=".55"/>`; }
  t += `<ellipse cx="0" cy="-36" rx="44" ry="14" fill="${bb('wlr' + al, [[0, st[0]], [1, mix(st[0], st[1], 0.6)]])}" stroke="${ol(st[1])}" stroke-width="1.6"/><ellipse cx="0" cy="-34" rx="34" ry="10" fill="${al ? '#2a3a38' : '#222b36'}"/>`;
  if (al) t += glow(0, -32, 34, 12, '#ffc45a', 0.9) + `<ellipse cx="0" cy="-33" rx="14" ry="4" fill="#fff0c0" opacity=".85"/>`;
  t += `<path d="M-44 -34 L-44 -92 M44 -34 L44 -92" stroke="#3a2c20" stroke-width="7" stroke-linecap="round"/><path d="M-44 -34 L-44 -92 M44 -34 L44 -92" stroke="#8a6a4c" stroke-width="2.4" stroke-linecap="round" transform="translate(-1.2,0)"/>`;
  t += `<path d="M-52 -86 L0 -108 L52 -86 Z" fill="${bb('wlroof' + al, [[0, al ? '#9a7250' : '#7f8a98'], [1, al ? '#5a3e2a' : '#4a5462']], { x1: 0, y1: 0, x2: 0, y2: 1 })}" stroke="${ol('#4a3626', 0.2)}" stroke-width="1.8" stroke-linejoin="round"/>`;
  t += `<path d="M0 -96 L0 -62" stroke="${al ? '#d8c8a8' : '#9aa6b4'}" stroke-width="1.6"/><path d="M-9 -62 h18 l-2 14 h-14Z" fill="${al ? '#8a6a4c' : '#6f7a88'}" stroke="${ol('#4a3626', 0.2)}" stroke-width="1.4"/>`; // bucket half-raised
  if (al) t += `<path d="M-46 -2 Q-34 -22 -22 -4Z" fill="${P.moss}"/><path d="M26 -2 Q38 -26 48 -6Z" fill="${P.moss}"/>`;
  if (al) g += `<ellipse cx="0" cy="8" rx="78" ry="22" fill="none" stroke="#ffe3a6" stroke-width="2" stroke-dasharray="3 6" opacity=".7" stroke-linecap="round"/><path d="M-78 8 A78 22 0 0 1 40 -12" stroke="#ffd88a" stroke-width="4" fill="none" opacity=".9" stroke-linecap="round"/>`; // hold-ring arc fill (visual)
  else g += `<ellipse cx="0" cy="8" rx="78" ry="22" fill="none" stroke="#b8c4d0" stroke-width="1.6" stroke-dasharray="3 6" opacity=".5" stroke-linecap="round"/>`;
  return { trunk: t, crown: '', ground: g, h: 110, w: 110, light: al ? [0, -30, 130, '#ffc45a', 0.9] : null };
}

export function chapel(lit) {
  const al = lit, w0 = al ? ['#d8cbb0', '#8a7e66'] : ['#a7b1be', '#5f6a78'];
  let t = SH(110, 16, 0.34);
  t += `<path d="M-84 4 L-84 -120 L-52 -120 L-52 -330 L-40 -380 L-28 -330 L-28 -120 L84 -120 L84 4 Q0 20 -84 4Z" fill="${bb('ch' + al, [[0, w0[0]], [1, w0[1]]], { x1: 0, y1: 0, x2: 1, y2: 0.3 })}" stroke="${ol(w0[1])}" stroke-width="2.4" stroke-linejoin="round"/>`;
  t += `<path d="M-90 -118 L0 -176 L90 -118 Z" fill="${bb('chr' + al, [[0, al ? '#9a6a4c' : '#6f7a88'], [1, al ? '#5a3a2a' : '#414b58']], { x1: 0, y1: 0, x2: 0, y2: 1 })}" stroke="${ol('#4a3626', 0.2)}" stroke-width="2.2" stroke-linejoin="round"/><path d="M-90 -118 L0 -176" stroke="#fff" stroke-width="2.4" opacity=".3"/>`;
  t += `<path d="M-60 -300 L-40 -380 L-20 -300Z" fill="${al ? '#9a6a4c' : '#6f7a88'}" stroke="${ol('#4a3626', 0.2)}" stroke-width="2" stroke-linejoin="round"/><path d="M-40 -380 v-22 M-48 -394 h16" stroke="${ol(w0[1], 0.2)}" stroke-width="3" stroke-linecap="round"/>`;
  t += `<path d="M-50 -2 L-50 -62 Q-50 -86 -26 -86 Q-2 -86 -2 -62 L-2 -2Z" fill="#0f141c" stroke="${ol(w0[1])}" stroke-width="2.2"/>`;
  t += `<path d="M-46 -262 Q-40 -282 -34 -262 L-34 -240 L-46 -240Z" fill="#0f141c" stroke="${ol(w0[1])}" stroke-width="1.6"/>`; // belfry slit
  t += `<path d="M30 -66 Q30 -92 46 -92 Q62 -92 62 -66 L62 -40 L30 -40Z" fill="#0f141c" stroke="${ol(w0[1])}" stroke-width="2"/>`;
  t += al ? glow(46, -64, 40, 40, '#ffc45a', 0.9) + `<circle cx="46" cy="-62" r="12" fill="none" stroke="#ffe9b0" stroke-width="2"/><path d="M46 -74 v24 M34 -62 h24" stroke="#ffe9b0" stroke-width="1.6"/>` : `<circle cx="46" cy="-62" r="12" fill="none" stroke="#6f7a88" stroke-width="2"/><path d="M46 -74 v24 M34 -62 h24" stroke="#6f7a88" stroke-width="1.6"/>`;
  t += `<path d="M64 -110 l12 -10 l-6 18Z M-82 -120 l8 -8 l4 12Z" fill="${ol(w0[1], 0.1)}" opacity=".7"/>`; // broken edges
  if (al) t += `<path d="M-84 0 Q-60 -22 -36 -4Z" fill="#79a85a"/><path d="M40 0 Q64 -26 84 -2Z" fill="#79a85a"/>`;
  return { trunk: t, crown: '', ground: '', h: 400, w: 180, light: al ? [46, -62, 190, '#ffc45a', 0.9] : null };
}

export function den(alive) {
  const st = alive ? ['#b8bca6', '#6f7860'] : ['#9aa4b2', '#5f6a78'];
  let t = SH(80, 12, 0.32);
  t += `<path d="M-84 4 Q-90 -34 -52 -64 Q-10 -90 38 -68 Q86 -44 88 4 Q0 18 -84 4Z" fill="${rb('dn' + alive, [[0, st[0]], [1, st[1]]], { cx: 0.35, cy: 0.2, r: 0.95 })}" stroke="${ol(st[1])}" stroke-width="2" stroke-linejoin="round"/>`;
  t += `<path d="M-30 4 Q-34 -30 -6 -42 Q26 -48 36 -22 Q40 -4 34 6Z" fill="#0d121a" stroke="${ol(st[1])}" stroke-width="1.8"/><path d="M-60 -50 Q-30 -76 14 -70" stroke="#fff" stroke-width="2.6" fill="none" opacity=".35" stroke-linecap="round"/>`;
  // pups curled inside (grey asleep / woken coloured)
  const pc = alive ? ['#f3e7cf', '#d9a679'] : ['#9aa6b4', '#7a8694'];
  for (const [x, y, s] of [[-8, -8, 1], [14, -6, 0.85]]) t += `<g transform="translate(${x},${y}) scale(${s})"><ellipse cx="0" cy="0" rx="13" ry="8" fill="${pc[0]}" stroke="${ol(pc[0], 0.4)}" stroke-width="1.2"/><circle cx="-9" cy="-3" r="6" fill="${pc[0]}" stroke="${ol(pc[0], 0.4)}" stroke-width="1.2"/><path d="M-13 -8 l-2 -6 l5 3Z M-6 -9 l1 -7 l4 5Z" fill="${pc[1]}"/>${alive ? '<circle cx="-11" cy="-4" r="1.1" fill="#2b1c20"/>' : '<path d="M-12 -4 h3" stroke="#46525f" stroke-width="1.2"/>'}</g>`;
  if (alive) t += glow(0, -14, 40, 24, '#ffc45a', 0.55) + `<path d="M-86 2 Q-60 -22 -30 -4Z" fill="#79a85a"/>`;
  return { trunk: t, crown: '', ground: '', h: 90, w: 180, light: alive ? [0, -14, 110, '#ffc45a', 0.7] : null };
}

export function nest() { // Hollow Nest: root-knot mound pulsing with COLD light (no warm light from enemies), vein ring on the ground
  let t = SH(70, 11, 0.4), g = '';
  g += `<ellipse cx="0" cy="2" rx="120" ry="38" fill="#0a0d18" opacity=".55" filter="url(#b8)"/>`;
  for (let i = 0; i < 12; i++) { const a = i * 0.52 + 0.2, l = 70 + (i * 37 % 50); g += `<path d="M${Math.cos(a) * 36} ${Math.sin(a) * 12} q${Math.cos(a + 0.5) * l * 0.5} ${Math.sin(a + 0.5) * l * 0.2} ${Math.cos(a) * l} ${Math.sin(a) * l * 0.34}" stroke="#0a0c18" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M${Math.cos(a) * 36} ${Math.sin(a) * 12} q${Math.cos(a + 0.5) * l * 0.5} ${Math.sin(a + 0.5) * l * 0.2} ${Math.cos(a) * l} ${Math.sin(a) * l * 0.34}" stroke="#7a6aa8" stroke-width="1" fill="none" stroke-linecap="round" opacity=".45" transform="translate(-.8,-1.2)"/>`; }
  t += `<path d="M-52 4 Q-58 -24 -30 -44 Q0 -60 30 -42 Q56 -24 52 4 Q0 14 -52 4Z" fill="${rb('nst', [[0, '#5a4f6c'], [0.7, '#34303f'], [1, '#1c1a26']], { cx: 0.35, cy: 0.25, r: 0.9 })}" stroke="#12101a" stroke-width="2" stroke-linejoin="round"/>`;
  for (const d of ['M-40 -6 Q-20 -30 -6 -38', 'M30 -4 Q22 -28 8 -40', 'M-20 0 Q0 -20 14 -14', 'M-46 -14 Q-36 -32 -22 -44']) t += `<path d="${d}" stroke="#12101a" stroke-width="5" fill="none" stroke-linecap="round"/><path d="${d}" stroke="#6a5e86" stroke-width="1.4" fill="none" stroke-linecap="round" opacity=".6" transform="translate(-1,-1.2)"/>`;
  t += `<ellipse cx="0" cy="-30" rx="12" ry="9" fill="#12101a"/><ellipse cx="0" cy="-31" rx="7" ry="5" fill="#6ae0e8" opacity=".9"/><ellipse cx="0" cy="-31" rx="3" ry="2.2" fill="#e8ffff"/>${glow(0, -30, 46, 30, '#6ae0e8', 0.5)}`;
  return { trunk: t, crown: '', ground: g, h: 66, w: 140, light: [0, -30, 70, '#6ad8e8', 0.35] };
}

export function deadGrove(alive = false) {
  const parts = [[-70, -4], [66, 8], [0, 22], [-30, -26], [40, -22]];
  let t = '', g = alive ? '' : `<ellipse cx="0" cy="4" rx="130" ry="42" fill="#0a0d18" opacity=".42" filter="url(#b8)"/><ellipse cx="0" cy="4" rx="124" ry="36" fill="none" stroke="#7a6aa8" stroke-width="1.4" stroke-dasharray="3 6" opacity=".5"/>`;
  parts.sort((a, b) => a[1] - b[1]);
  let c = '';
  parts.forEach(([x, y], i) => { const s = snag(alive, 'A', i); t += `<g transform="translate(${x},${y}) scale(${0.7 + (i % 3) * 0.1})">${s.trunk}</g>`; c += `<g transform="translate(${x},${y}) scale(${0.7 + (i % 3) * 0.1})">${s.crown}</g>`; });
  if (!alive) t += `<g transform="translate(0,22)"><path d="M-2 -40 q-4 -26 4 -50" stroke="#bfe0a8" stroke-width="3" fill="none" opacity=".55"/>${glow(0, -70, 20, 20, '#9ad66b', 0.4)}<circle cx="2" cy="-92" r="7" fill="#9ad66b" opacity=".75"/></g>`; // the one memory of green
  return { trunk: t, crown: c, ground: g, h: 220, w: 280 };
}

export const PROPS = { oak: oakA, snag, pillar, bush, stump, log: logP, boulder, grave: gravestone, fern, mush: mushRing, bramble };

// ---------- life map (JS mirror, the source of truth in the build; the mock derives the same state) ----------
export function lifeAt(life, x, y) { // x,y world units relative to hero; returns -1..1
  let v = 0;
  if (life.all) return 1;
  for (const [bx, by, r] of life.blobs || []) { const d = Math.hypot(x - bx, y - by); if (d < r) v = Math.max(v, 1 - Math.max(0, d - r * 0.7) / (r * 0.3)); }
  for (const tr of life.trails || []) {
    for (let i = 0; i < tr.pts.length - 1; i++) {
      const [x1, y1] = tr.pts[i], [x2, y2] = tr.pts[i + 1], dx = x2 - x1, dy = y2 - y1, L = dx * dx + dy * dy || 1, t = Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / L)), d = Math.hypot(x - (x1 + dx * t), y - (y1 + dy * t));
      const a = (tr.fade ? 1 - (i + t) / (tr.pts.length - 1) * 0.85 : 1);
      if (d < tr.w / 2) v = Math.max(v, a);
    }
  }
  for (const [cx, cy, r] of life.corr || []) { const d = Math.hypot(x - cx, y - cy); if (d < r) v = Math.min(v, -(1 - d / r)); }
  return v;
}

// ---------- corruption patch ----------
export function corruption(cx, cy, r, u, seed) {
  const rg = rnd(seed); let o = '';
  o += `<ellipse cx="${cx}" cy="${cy}" rx="${r}" ry="${r * 0.5}" fill="#0c0f1c" opacity=".6" filter="url(#wob)"/><ellipse cx="${cx}" cy="${cy}" rx="${r * 0.7}" ry="${r * 0.35}" fill="#080a14" opacity=".55" filter="url(#b8)"/>`;
  for (let i = 0; i < 9; i++) {
    let a = (i / 9) * 6.283 + rg(), px = cx + Math.cos(a) * r * 0.1, py = cy + Math.sin(a) * r * 0.05, d = `M${px.toFixed(0)} ${py.toFixed(0)}`;
    for (let q = 0; q < 5; q++) { a += (rg() - 0.5) * 0.9; px += Math.cos(a) * r * 0.2; py += Math.sin(a) * r * 0.1; d += ` L${px.toFixed(0)} ${py.toFixed(0)}`; }
    o += `<path d="${d}" fill="none" stroke="#080a14" stroke-width="${(3.4 * u + 0.6).toFixed(1)}" stroke-linecap="round" stroke-linejoin="round"/><path d="${d}" fill="none" stroke="#8a7ab8" stroke-width="${(1 * u + 0.3).toFixed(1)}" stroke-linecap="round" opacity=".42" transform="translate(-.8,-1.2)"/>`;
  }
  for (let i = 0; i < 14; i++) { const a = rg() * 6.283, d = r * (0.9 + rg() * 0.3); o += `<circle cx="${(cx + Math.cos(a) * d).toFixed(0)}" cy="${(cy + Math.sin(a) * d * 0.5).toFixed(0)}" r="${(1.4 + rg() * 2) * u}" fill="#0c0f1c" opacity=".7"/>`; }
  return o;
}

// ---------- the frame ----------
const lerpHex = (a, b, t) => mix(a, b, t);
export const ambientHex = (f) => { // mirrors palette.js arcAt on ARC column 1 (ambient) / 3 (fog)
  let i = 1; while (i < ARC.length - 1 && f > ARC[i][0]) i++;
  const A = ARC[i - 1], B = ARC[i], t = Math.max(0, Math.min(1, (f - A[0]) / (B[0] - A[0])));
  const h = (n) => '#' + n.toString(16).padStart(6, '0');
  return { amb: lerpHex(h(A[1]), h(B[1]), t), fog: lerpHex(h(A[3]), h(B[3]), t) };
};

// cfg: {take, f, life, scene:{props, pois, enemies, ghost, gems, ravens, dmg}, hero:{draw, k}, noHero, sil, fx:{fog,flies,dawn}}
export function worldFrame(w, h, u, cfg) {
  begin(); use(STYLES.S1); GC = new Map();
  const K = cfg.take || 'A', f = cfg.f ?? 0.2, life = cfg.life || {}, hero = cfg.hero || [w / 2, h / 2 + 20];
  const [hx, hy] = hero, X = (x) => hx + x * u, Y = (y) => hy + y * u;
  const r = rnd(cfg.seed || 11);
  const A0 = ambientHex(f), amb = mix(A0.amb, '#ffffff', cfg.ambLift ?? 0.14), fog = A0.fog;
  let o = '';
  // 1. hollow ground, rim glow, alive ground masked by the life map
  const sil = !!cfg.sil;
  o += sil ? `<rect width="${w}" height="${h}" fill="#8a94a0"/>` : `<g>${groundLayer('hollow', K, w, h, u, 31)}</g>`;
  const idm = nid('lm'), idr = nid('lr');
  const shapes = (grow, fillc = '#fff') => {
    let s = '';
    if (life.all) return `<rect width="${w}" height="${h}" fill="${fillc}"/>`;
    for (const [bx, by, rr] of life.blobs || []) s += `<ellipse cx="${X(bx)}" cy="${Y(by)}" rx="${(rr + grow) * u}" ry="${(rr + grow) * u * 0.86}" fill="${fillc}"/>`;
    for (const tr of life.trails || []) for (let i = 0; i < tr.pts.length - 1; i++) { const a = tr.fade ? 1 - i / (tr.pts.length - 1) * 0.85 : 1; s += `<path d="M${X(tr.pts[i][0])} ${Y(tr.pts[i][1])} L${X(tr.pts[i + 1][0])} ${Y(tr.pts[i + 1][1])}" stroke="${fillc}" stroke-opacity="${a.toFixed(2)}" stroke-width="${(tr.w + grow * 2) * u}" stroke-linecap="round" fill="none"/>`; }
    return s;
  };
  addDef(`<mask id="${idm}" maskUnits="userSpaceOnUse" x="0" y="0" width="${w}" height="${h}"><rect width="${w}" height="${h}" fill="#000"/><g filter="url(#wobS)">${shapes(0)}</g></mask><mask id="${idr}" maskUnits="userSpaceOnUse" x="0" y="0" width="${w}" height="${h}"><rect width="${w}" height="${h}" fill="#000"/><g filter="url(#wobS)">${shapes(9)}</g></mask><mask id="${idm}q" maskUnits="userSpaceOnUse" x="0" y="0" width="${w}" height="${h}"><rect width="${w}" height="${h}" fill="#000"/><g filter="url(#wobS)">${shapes(7)}</g><g filter="url(#wobS)">${shapes(-2, '#000')}</g></mask>`);
  const pth = (key) => (cfg.paths || []).map((p) => `<path d="${p.pts.map((q, i) => `${i ? 'L' : 'M'}${X(q[0])} ${Y(q[1])}`).join(' ')}" fill="none" stroke="${p[key]}" stroke-width="${p.w * u}" stroke-linecap="round" stroke-linejoin="round" opacity="${p.a ?? 0.6}" filter="url(#wobS)"/>`).join('');
  if (!sil) o += pth('hol');
  if (!sil && !life.all) o += `<g mask="url(#${idr})"><rect width="${w}" height="${h}" fill="#ffc45a" opacity=".7" filter="url(#b4)" style="mix-blend-mode:screen"/></g>`;
  if (!sil) o += `<g mask="url(#${idm})">${groundLayer('alive', K, w, h, u, 77)}${pth('ali')}<rect width="${w}" height="${h}" fill="#e4f7b8" opacity="${K === 'A' ? 0.12 : 0.08}"/></g>`;
  // scar under restored layer? (no: corruption drawn on top, it is the opposite force) -> after
  // 2. world-space decals: paths, corruption, ground bits of props
  for (const [cx, cy, rr, sd] of life.corr || []) o += corruption(X(cx), Y(cy), rr * u, u, sd || 4);
  // contested edge sparks (light eating corruption)
  for (const [sx, sy, sr] of cfg.sparks || []) o += sparkle(X(sx), Y(sy), sr * u, '#fff3c8');
  // 3. props: scatter + authored
  const items = [];
  const add = (type, wx, wy, s = 1, extra = {}) => { const sx = X(wx), sy = Y(wy); if (sx < -220 * u || sx > w + 220 * u || sy < -60 * u || sy > h + 900 * u) return; items.push({ type, wx, wy, sx, sy, s, ...extra }); };
  for (const it of cfg.props || []) add(it[0], it[1], it[2], it[3] || 1, it[4] || {});
  items.sort((a, b) => a.sy - b.sy);
  let gnd = '', trunks = '', crowns = '', lights = [], halos = '';
  for (const it of items) {
    const alive = it.state != null ? it.state : (life.all || lifeAt(life, it.wx, it.wy) > 0.45);
    let d;
    if (it.type === 'lamp') d = lamp(it.lit ?? alive, K); else if (it.type === 'well') d = well(it.state ?? (alive ? 'woken' : 'hollow'), K); else if (it.type === 'chapel') d = chapel(alive); else if (it.type === 'den') d = den(alive); else if (it.type === 'nest') d = alive ? stump(true, K) : nest(); else if (it.type === 'grove') d = deadGrove(alive); else d = PROPS[it.type](alive, K, it.sd || 3);
    const tf = `translate(${it.sx.toFixed(1)},${it.sy.toFixed(1)}) scale(${(it.s * u).toFixed(3)})`;
    if (d.ground) gnd += `<g transform="${tf}">${d.ground}</g>`;
    trunks += `<g transform="${tf}">${d.trunk}</g>`;
    if (d.crown) crowns += `<g transform="${tf}">${d.crown}</g>`;
    if (d.light) lights.push([it.sx + d.light[0] * it.s * u, it.sy + d.light[1] * it.s * u, d.light[2] * it.s * u, d.light[3], d.light[4]]);
  }
  const propsG = `${gnd}${trunks}${crowns}`;
  o += sil ? `<g style="filter:brightness(0)">${propsG}</g>` : propsG;
  // 4. enemies (world, darkened by the lightmap)
  const E = [], sh = (x, y, rx) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${rx * 0.2}" fill="#000" opacity=".35" filter="url(#b2)"/>`;
  const sc = cfg.scene || {};
  for (const [x, y, ff] of sc.fell || []) E.push([Y(y), sh(X(x), Y(y), 32 * u * 0.9) + `<g transform="translate(${X(x)},${Y(y)}) scale(${(0.675 * u).toFixed(3)})">${wolf({ enemy: true, f: ff })}</g>`]);
  for (const [x, y] of sc.crawlers || []) E.push([Y(y), sh(X(x), Y(y), 22 * u) + `<g transform="translate(${X(x)},${Y(y)}) scale(${(0.58 * u).toFixed(3)})">${crawler()}</g>`]);
  E.sort((a, b) => a[0] - b[0]);
  o += E.map((e) => e[1]).join('');
  for (const [x, y] of sc.ravensE || []) o += sh(X(x), Y(y) + 34 * u, 14 * u) + `<g transform="translate(${X(x)},${Y(y)}) scale(${(0.5 * u).toFixed(3)})">${raven()}</g>`;
  // 5. lightmap: ambient multiply with light stamps
  const L = [];
  if (!cfg.noHero) { L.push([X(0), Y(-10), 300 * u, '#ffcf7a', 1]); L.push([X(88), Y(-6), 70 * u, '#b8f2ff', 0.55]); }
  for (const [x, y] of sc.ghost || []) L.push([X(x), Y(y), 62 * u, '#ffcf7a', 0.7]);
  for (const [x, y] of sc.gems || []) L.push([X(x), Y(y), 34 * u, '#7dffc4', 0.7]);
  for (const l of lights) L.push(l);
  for (const l of cfg.extraLights || []) L.push([X(l[0]), Y(l[1]), l[2] * u, l[3], l[4]]);
  if (cfg.dawn) L.push([w * 0.82, h * 0.1, Math.max(w, h) * 0.9, '#ffe2c4', 0.9]);
  const lmId = sil ? '' : `<g style="mix-blend-mode:multiply"><rect width="${w}" height="${h}" fill="${amb}"/>${L.map(([x, y, rr, c, a]) => glow(x, y, rr, rr * 0.82, c, a)).join('')}</g>`;
  o += lmId;
  if (!sil && !life.all) o += `<g mask="url(#${idm}q)" opacity=".3"><rect width="${w}" height="${h}" fill="#ffe3a6" filter="url(#b1)" style="mix-blend-mode:screen"/></g>`;
  // 6. halos + lit sprites (above the lightmap)
  const lit = [];
  for (const [x, y, ff] of sc.ghost || []) lit.push([Y(y), sh(X(x), Y(y), 30 * u) + glow(X(x), Y(y) - 12 * u, 46 * u, 30 * u, '#ffc45a', 0.55) + `<g transform="translate(${X(x)},${Y(y)}) scale(${(0.675 * u).toFixed(3)})">${wolf({ enemy: false, f: ff })}</g>`]);
  for (const [x, y] of sc.gems || []) lit.push([Y(y), `<g transform="translate(${X(x)},${Y(y)}) scale(${(0.3 * u).toFixed(3)})">${gem()}</g>`]);
  const hk = cfg.heroK ?? 60 / 112;
  if (!cfg.noHero) lit.push([Y(0), sh(X(0), Y(1), 24 * u) + `<g transform="translate(${X(0)},${Y(0)}) scale(${(hk * u).toFixed(4)})">${cfg.drawHero()}</g>`]);
  lit.sort((a, b) => a[0] - b[0]);
  if (!cfg.noHero) o += glow(X(-12), Y(-4), 150 * u, 100 * u, '#ffc45a', 0.5);
  for (const hh of lights) if (hh[3] === '#ffc45a') o += glow(hh[0], hh[1], hh[2] * 0.55, hh[2] * 0.4, '#ffc45a', 0.35);
  // spirit threads (G1/G2): warm dotted line from ghost wolves to hero
  for (const [x, y] of sc.ghost || []) o += `<path d="M${X(x) + 14 * u} ${Y(y) - 22 * u} Q${(X(x) + X(0)) / 2} ${Y(y) - 40 * u} ${X(0) - 8 * u} ${Y(0) - 30 * u}" fill="none" stroke="#ffb84a" stroke-width="1.1" stroke-dasharray="1 3.4" stroke-linecap="round" opacity=".9" style="mix-blend-mode:screen"/>`;
  o += lit.map((e) => e[1]).join('');
  for (const [x, y] of sc.ravens || []) o += sh(X(x), Y(y) + 34 * u, 14 * u) + `<g transform="translate(${X(x)},${Y(y)}) scale(${(0.5 * u).toFixed(3)})">${raven()}</g>`;
  // 7. glowing trails (lantern / scarf wake) : soft ribbon + dotted core, fading with distance
  for (const tr of cfg.ribbons || []) {
    const d = tr.pts.map((q, i) => `${i ? 'L' : 'M'}${X(q[0])} ${Y(q[1])}`).join(' ');
    const gx = lgU('rib' + w + tr.pts[0][0] + hx, X(tr.pts[0][0]), 0, X(tr.pts[tr.pts.length - 1][0]), 0, [[0, tr.col || '#ffb84a', 0.55], [1, tr.col || '#ffb84a', 0]]);
    o += `<g style="mix-blend-mode:screen"><path d="${d}" stroke="url(#${gx})" stroke-width="${(tr.w || 14) * u}" fill="none" stroke-linecap="round" stroke-linejoin="round" filter="url(#b8)"/><path d="${d}" stroke="${tr.core || '#ffe3a6'}" stroke-width="${2.6 * u}" fill="none" stroke-dasharray="1 ${(9 * u).toFixed(1)}" stroke-linecap="round" opacity=".7"/></g>`;
  }
  // 8. fog banks + fireflies (colour = life: cold in the Hollow, warm where restored)
  if (cfg.fx?.fog !== false && !sil) for (let i = 0; i < (cfg.fx?.nFog ?? 6); i++) { const x = r() * w, y = h * (0.15 + r() * 0.75); o += `<ellipse cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" rx="${((200 + r() * 160) * u).toFixed(0)}" ry="${((26 + r() * 20) * u).toFixed(0)}" fill="${fog}" opacity="${(cfg.fx?.fogA ?? 0.17).toFixed(2)}" filter="url(#b30)" style="mix-blend-mode:screen"/>`; }
  if (cfg.fx?.flies !== false && !sil) for (let i = 0; i < (cfg.fx?.nFly ?? 22); i++) { const x = r() * w, y = r() * h, al = life.all || lifeAt(life, (x - hx) / u, (y - hy) / u) > 0.3, c = al ? '#ffd88a' : '#bfe0ee'; o += glow(x, y, 7 * u, 7 * u, c, al ? 0.75 : 0.5) + `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${(1.4 * u + 0.4).toFixed(1)}" fill="${al ? '#fff3c8' : '#eaf6ff'}"/>`; }
  // 9. dawn flood: sun glow from the upper-right + soft shafts
  if (cfg.dawn) {
    o += glow(w * 0.88, h * 0.02, Math.max(w, h) * 0.6, Math.max(w, h) * 0.45, '#ffcf8a', 0.55);
    for (let i = 0; i < 5; i++) { const a = 1.95 + i * 0.13; o += `<path d="M${w * 0.88} ${h * 0.02} L${w * 0.88 + Math.cos(a) * 1500} ${h * 0.02 + Math.sin(a) * 1500} L${w * 0.88 + Math.cos(a + 0.05) * 1500} ${h * 0.02 + Math.sin(a + 0.05) * 1500}Z" fill="#fff0c8" opacity=".10" filter="url(#b16)" style="mix-blend-mode:screen"/>`; }
    for (let i = 0; i < 26; i++) { const x = r() * w, y = h * 0.3 + r() * h * 0.7; o += sparkle(x, y, (1.4 + r() * 2.6) * u, '#fff6d8'); }
  }
  // 10. particles at the restore boundary (sprouting sparkle) + vignette
  for (const [px, py] of cfg.sprouts || []) { for (let i = 0; i < 6; i++) o += sparkle(X(px) + (r() - 0.5) * 40 * u, Y(py) + (r() - 0.5) * 24 * u, (1.5 + r() * 2.2) * u, '#fff3c8'); }
  o += `<rect width="${w}" height="${h}" fill="url(#${rgU('vg' + w + h, w / 2, h / 2, Math.max(w, h) * 0.75, [[0.55, '#000', 0], [1, '#10101c', cfg.dawn ? 0.25 : 0.5]])})"/>`;
  if (cfg.debugLife) o += cfg.debugLife(X, Y);
  return o;
}

// seeded world scatter (relative to hero), used by every frame so desktop and phone show the same forest
export function scatter(K, seed, R = 1500, opt = {}) {
  const r = rnd(seed), out = [], taken = [];
  const weights = K === 'A'
    ? [['oak', 12], ['snag', 8], ['bush', 30], ['stump', 8], ['log', 5], ['boulder', 8], ['grave', 5], ['mush', 4], ['fern', 24], ['bramble', 4]]
    : [['pillar', 18], ['bush', 12], ['stump', 8], ['log', 10], ['boulder', 8], ['mush', 6], ['fern', 30], ['bramble', 8], ['snag', 5]];
  const tot = weights.reduce((a, b) => a + b[1], 0);
  const minD = { oak: 120, snag: 80, pillar: 150, log: 90, bramble: 70, mush: 80, boulder: 60 };
  for (let n = 0; n < (opt.n || 700); n++) {
    const x = (r() - 0.5) * R * 2, y = (r() - 0.5) * R * 2;
    if (Math.abs(x) < 190 && y > -140 && y < 80) continue; // keep the hero's lane clear
    let pick = r() * tot, type = weights[0][0]; for (const [t, wgt] of weights) { if ((pick -= wgt) < 0) { type = t; break; } }
    const md = minD[type] || 46;
    if (taken.some(([tx, ty, td]) => Math.hypot(tx - x, (ty - y) * 1.3) < Math.max(md, td) * 0.9)) continue;
    taken.push([x, y, md]);
    out.push([type, x, y, type === 'oak' ? 0.78 + r() * 0.45 : type === 'pillar' ? 0.9 + r() * 0.25 : 0.85 + r() * 0.3, { sd: (r() * 1000) | 0 }]);
  }
  return out;
}
