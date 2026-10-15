// Style Lab scene: the same mini-scene for every style, plus the parts sheet. Mock-ups only.
import { begin, use, defsOut, addDef, shp, stk, cap, wren, wolf, raven, crawler, gem, glow, glowId, lgU, rgU, mix, adjust, rnd, T, FONT, ell, circ, vein, WREN_H, S as _S } from './lab.mjs';
import * as lab from './lab.mjs';
const cur = () => lab.S;
const INK = '#2a1d1a';
export const STYLES = {
  S1: { id: 'S1', name: 'STORYBOOK GLOW', L: 'L2', H: 'H2', P: 'P1', W: 'W2', G: 'G1', ink: INK, shTint: '#3a1f4a', lw: 1, adj: (c) => c,
    pal: { skyT: '#1c2430', skyB: '#7d8da0', hg1: '#6b7888', hg2: '#454f5e', rg1: '#9ad66b', rg2: '#63a54f', rg3: '#3f7a46', fog: '#b9c6d4', bgG: '#56626f', bgR: '#4f8a4a', fl: ['#ffb347', '#ff8fa3', '#fff1c4', '#ffd86b'], sw: ['#2b3441', '#8fa0b2', '#ffb84a', '#7fbf5f', '#ff8fa3'] } },
  S2: { id: 'S2', name: 'PAINTED FABLE', L: 'L3', H: 'H3', P: 'P3', W: 'W2', G: 'G3', ink: '#3a2a3a', shTint: '#3a2058', lw: 1, ed: 0.62, adj: (c) => adjust(c, { sat: 1.25, gain: 1.06 }),
    pal: { skyT: '#2a2a46', skyB: '#a69ab8', hg1: '#7a7c96', hg2: '#4a4d68', rg1: '#c4d878', rg2: '#7fa84e', rg3: '#4d7a48', fog: '#cbbfd8', bgG: '#5d5f7c', bgR: '#6a9a56', fl: ['#ff9fb8', '#ffe08a', '#fff', '#c8b8ff'], sw: ['#2a2a46', '#a69ab8', '#ffcf7a', '#8fb858', '#ff9fb8'] } },
  S3: { id: 'S3', name: 'TOY GLOSSY', L: 'L1', H: 'H4', P: 'P1', W: 'W1', G: 'G2', ink: '#241420', shTint: '#401a58', lw: 1.05, adj: (c) => adjust(c, { sat: 1.3, gain: 1.04 }),
    pal: { skyT: '#3a4a66', skyB: '#a9bdd6', hg1: '#8e9db4', hg2: '#6a7a94', rg1: '#8cf070', rg2: '#4fd05a', rg3: '#2fa44e', fog: '#d6e4f4', bgG: '#7a8aa6', bgR: '#4fc060', fl: ['#ffd23a', '#ff6f9a', '#fff', '#7fe0ff'], sw: ['#6a7a94', '#d6e4f4', '#ffc23a', '#4fd05a', '#ff6f9a'] } },
  S4: { id: 'S4', name: 'INKED LANTERN', L: 'L4', H: 'H1', P: 'P3', W: 'W3', G: 'G1', ink: '#2b2233', shTint: '#4a3a66', lw: 0.9, adj: (c) => adjust(c, { sat: 0.82, gain: 1.02 }),
    pal: { skyT: '#b9b3a6', skyB: '#e6dcc4', hg1: '#a9b0b8', hg2: '#8890a0', rg1: '#d8dc96', rg2: '#a9b868', rg3: '#7d9456', fog: '#efe6d0', bgG: '#9aa0ac', bgR: '#8aa060', fl: ['#e8742a', '#c9506a', '#fff6dc', '#e8b030'], sw: ['#2b2233', '#e6dcc4', '#9aa0ac', '#a9b868', '#e8742a'], paper: true } },
  S5: { id: 'S5', name: 'HEROIC CARTOON', L: 'L2', H: 'H1', P: 'P2', W: 'W3', G: 'G2', ink: '#10202a', shTint: '#1a2a5a', lw: 1, adj: (c) => adjust(c, { sat: 1.12, gain: 0.95 }),
    pal: { skyT: '#0c141c', skyB: '#4a6070', hg1: '#4a5a6a', hg2: '#2a3644', rg1: '#6fd070', rg2: '#2f9a5a', rg3: '#1a6a4a', fog: '#8ea8b8', bgG: '#34444f', bgR: '#2a8a58', fl: ['#ff9a3a', '#ffd86b', '#fff1c4', '#ff7a6a'], sw: ['#0c141c', '#4a6070', '#ff9a3a', '#2f9a5a', '#ffd86b'] } },
  S6: { id: 'S6', name: 'DAWN GLEAM', L: 'L3', H: 'H2', P: 'P2', W: 'W3', G: 'G3', ink: '#3a2030', shTint: '#5a2a58', lw: 1, ed: 0.34, adj: (c) => adjust(c, { sat: 1.12, gain: 1.04, lift: 3 }),
    pal: { skyT: '#3a3250', skyB: '#f0b894', hg1: '#8a8ca4', hg2: '#5a5c78', rg1: '#d6e66e', rg2: '#8cc050', rg3: '#4f8a4a', fog: '#f6d2b4', bgG: '#6a6c88', bgR: '#8ab85a', fl: ['#ffe08a', '#ff9f9f', '#fff6dc', '#ffb86a'], sw: ['#3a3250', '#f0b894', '#ffd36b', '#8cc050', '#ff9f9f'] } },
};
const HOR = 215, TX = 700, TY = 450;
const rawB = (y) => 36 * Math.sin(y / 52) + 22 * Math.sin(y / 21 + 1);
export const bx = (y) => TX + rawB(y) - rawB(TY);
const bpts = () => { const a = []; for (let y = HOR; y <= 724; y += 6) a.push([bx(y), y]); return a; };
const smooth = (pts) => { let d = `M${pts[0][0].toFixed(1)} ${pts[0][1]}`; for (let i = 1; i < pts.length; i++) d += ` L${pts[i][0].toFixed(1)} ${pts[i][1]}`; return d; };
const ISLES = [[500, 530, 46, 15], [430, 640, 62, 20], [330, 440, 30, 10]];
// ---------- world helpers ----------
export const blade = (x, y, h, lean, w) => `M${(x - w).toFixed(1)} ${y.toFixed(1)} Q${(x + lean * 0.3).toFixed(1)} ${(y - h * 0.6).toFixed(1)} ${(x + lean).toFixed(1)} ${(y - h).toFixed(1)} Q${(x + w * 0.2 + lean * 0.4).toFixed(1)} ${(y - h * 0.5).toFixed(1)} ${(x + w).toFixed(1)} ${y.toFixed(1)}Z`;
const stroke = (fill) => { const s = cur(); return s.L === 'L1' ? ` stroke="${s.ink}" stroke-width="1.1" stroke-linejoin="round"` : s.L === 'L2' ? ` stroke="${mix(fill, '#24402c', 0.4)}" stroke-width="0.9" stroke-linejoin="round"` : s.L === 'L4' ? ` stroke="${s.ink}" stroke-width="1.2"` : ''; };
export function tuft(x, y, sc, cols, r) { let o = ''; const n = 4 + Math.floor(r() * 2); for (let i = 0; i < n; i++) { const c = cols[Math.floor(r() * cols.length)]; o += `<path d="${blade(x + (i - n / 2) * 3.2 * sc, y, (11 + r() * 12) * sc, (r() - 0.5) * 10 * sc, 2.2 * sc)}" fill="${c}"${stroke(c)}/>`; } return o; }
export function flower(x, y, sc, col, ctr = '#ffd23a') { const s = cur(); let o = ''; for (let i = 0; i < 5; i++) { const a = i * 1.2566; o += `<circle cx="${(x + Math.cos(a) * 3.2 * sc).toFixed(1)}" cy="${(y + Math.sin(a) * 2.6 * sc).toFixed(1)}" r="${2.3 * sc}" fill="${col}"${s.L === 'L1' ? ` stroke="${s.ink}" stroke-width="1"` : ''}/>`; } return o + `<circle cx="${x}" cy="${y}" r="${1.8 * sc}" fill="${ctr}"/>`; }
function hollowTuft(x, y, sc, r) { let o = ''; for (let i = 0; i < 4; i++) { const c = i % 2 ? '#6a7686' : '#7d8a9a'; o += `<path d="${blade(x + (i - 2) * 3 * sc, y, (8 + r() * 9) * sc, (r() - 0.5) * 12 * sc, 1.8 * sc)}" fill="${c}"${stroke(c)}/>`; } return o; }
export function trunkTree(x, y, h, w, col, canopy, r, lean = 0) {
  let o = `<path d="M${x - w} ${y} Q${x - w * 0.5} ${y - h * 0.5} ${x - w * 0.35 + lean} ${y - h} L${x + w * 0.35 + lean} ${y - h} Q${x + w * 0.5} ${y - h * 0.5} ${x + w} ${y}Z" fill="${col}"/>`;
  if (canopy) for (let i = 0; i < 4; i++) o += `<circle cx="${x + lean + (r() - 0.5) * h * 0.55}" cy="${y - h - (r() - 0.3) * h * 0.22}" r="${h * (0.2 + r() * 0.12)}" fill="${canopy}"/>`;
  else { for (let i = 0; i < 4; i++) { const sx = r() > 0.5 ? 1 : -1; o += `<path d="M${x + lean} ${y - h * (0.7 + r() * 0.3)} q${sx * h * 0.2} ${-h * 0.15} ${sx * h * (0.2 + r() * 0.2)} ${-h * 0.3}" stroke="${col}" stroke-width="${w * 0.25}" fill="none" stroke-linecap="round"/>`; } }
  return o;
}
function sky(s) {
  const p = s.pal; let o = `<rect width="1280" height="${HOR + 40}" fill="url(#${lgU('sky' + s.id, 0, 0, 0, HOR + 40, [[0, p.skyT], [1, p.skyB]])})"/>`;
  const R = bx(HOR);
  o += `<rect x="${R - 260}" width="${1280 - R + 260}" height="${HOR + 40}" fill="url(#${lgU('skyw' + s.id, R - 260, 0, R + 160, 0, [[0, '#ffb84a', 0], [1, '#ffcf7a', s.id === 'S6' ? 0.5 : 0.3]])})"/>`;
  return o;
}
function backdrop(s) {
  const p = s.pal, r = rnd(7); let o = '';
  if (s.W === 'W1') {
    o += `<path d="M0 ${HOR} Q200 ${HOR - 70} 420 ${HOR - 10} T700 ${HOR - 20} T1000 ${HOR - 50} T1280 ${HOR - 20} L1280 ${HOR + 40} L0 ${HOR + 40}Z" fill="${mix(p.bgG, p.fog, 0.45)}"/>`;
    for (const [x, hh, side] of [[90, 120, 0], [250, 90, 0], [470, 110, 0], [1010, 100, 1], [1170, 130, 1]]) o += `<rect x="${x - 8}" y="${HOR - hh * 0.45}" width="16" height="${hh * 0.6}" rx="5" fill="${side ? '#7a5a40' : mix(p.bgG, '#fff', 0.1)}"/><ellipse cx="${x}" cy="${HOR - hh * 0.75}" rx="${hh * 0.5}" ry="${hh * 0.45}" fill="${side ? s.adj(p.bgR) : mix(p.bgG, p.fog, 0.25)}"/>`;
    return o;
  }
  const layers = s.W === 'W3' ? [[0.7, 150, 0.12], [0.45, 190, 0.38], [0.2, 235, 0.65]] : [[0.5, 170, 0.3], [0.2, 205, 0.55]];
  layers.forEach(([depth, baseY, fogA], li) => {
    let g = '';
    const n = 11 - li * 2;
    for (let i = 0; i < n; i++) {
      const x = 30 + (i / (n - 1)) * 1220 + (r() - 0.5) * 60, right = x > bx(baseY) + 10, h = (130 + r() * 80) * (1.1 - depth * 0.6) * (1.15 - li * 0.1);
      const c = mix(right ? p.bgR : p.bgG, p.fog, depth * 0.5);
      g += trunkTree(x, baseY + 30, h, 11 + r() * 6, mix(right ? '#5a4a3a' : p.bgG, p.fog, depth * 0.45), right ? c : null, r, (r() - 0.5) * 20);
    }
    o += `<g filter="url(#${li === 0 && s.W === 'W3' ? 'b4' : 'b2'})" opacity="${li === 0 ? 0.8 : 0.95}"${s.L === 'L4' ? ' filter="url(#wobS)"' : ''}>${g}</g>`;
    o += `<rect x="0" y="${baseY - 40}" width="1280" height="90" fill="url(#${lgU('fog' + s.id + li, 0, baseY - 40, 0, baseY + 50, [[0, p.fog, 0], [0.6, p.fog, fogA * 0.8], [1, p.fog, fogA * 0.2]])})"/>`;
  });
  return o;
}
function groundBase(s) {
  const p = s.pal, r = rnd(31), d = bpts();
  const bd = `${smooth(d)} L1280 724 L1280 ${HOR} Z`;
  addDef(`<clipPath id="rest"><path d="${bd}"/>${ISLES.map(([x, y, rx, ry]) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}"/>`).join('')}</clipPath>`);
  addDef(`<clipPath id="hol"><rect y="${HOR}" width="1280" height="520"/></clipPath>`);
  let o = '';
  // hollow
  o += `<rect y="${HOR}" width="1280" height="520" fill="url(#${lgU('hg' + s.id, 0, HOR, 0, 720, [[0, mix(p.hg1, p.fog, 0.35)], [0.3, p.hg1], [1, p.hg2]])})"/>`;
  if (s.W !== 'W1') o += `<rect y="${HOR}" width="1280" height="520" filter="url(#mottle)" opacity=".55" clip-path="url(#hol)"/>`;
  let hv = '';
  for (let i = 0; i < 9; i++) { const x = 40 + r() * 600, y = HOR + 60 + r() * 440; let dd = `M${x} ${y}`, px = x, py = y, a = r() * 6.28; for (let k = 0; k < 5; k++) { a += (r() - 0.5) * 1.2; px += Math.cos(a) * 24; py += Math.sin(a) * 12; dd += ` L${px.toFixed(0)} ${py.toFixed(0)}`; } hv += `<path d="${dd}" fill="none" stroke="#150f1c" stroke-width="${1.4 + r() * 1.4}" stroke-linecap="round" stroke-linejoin="round" opacity=".55"/>`; }
  o += `<g clip-path="url(#hol)">${hv}</g>`;
  const nT = s.W === 'W1' ? 8 : 34; let ht = '';
  for (let i = 0; i < nT; i++) { const y = HOR + 40 + r() * 470, x = 20 + r() * 700; if (x < bx(y) - 20) ht += hollowTuft(x, y, 0.55 + (y - HOR) / 420, r); }
  o += `<g${s.L === 'L4' ? ' filter="url(#wobS)"' : ''}>${ht}</g>`;
  // restored
  let g = `<rect y="${HOR}" width="1280" height="520" fill="url(#${rgU('rg' + s.id, 880, 560, 560, [[0, p.rg1], [0.55, p.rg2], [1, p.rg3]])})"/>`;
  if (s.W === 'W1') {
    g += `<path d="M0 520 Q300 470 640 520 T1280 500 L1280 724 L0 724Z" fill="${p.rg2}" opacity=".55"/><ellipse cx="880" cy="640" rx="360" ry="70" fill="${p.rg1}" opacity=".55"/>`;
  } else {
    g += `<rect y="${HOR}" width="1280" height="520" filter="url(#mottle)" opacity=".5"/>`;
    // brush strokes
    let bs = ''; for (let i = 0; i < (s.W === 'W2' ? 90 : 55); i++) { const x = 600 + r() * 700, y = HOR + 20 + r() * 500, l = 30 + r() * 50, c = r() > 0.5 ? p.rg1 : p.rg3; bs += `<path d="M${x} ${y} q${l * 0.5} ${-6 - r() * 8} ${l} ${(r() - 0.5) * 8}" stroke="${c}" stroke-width="${4 + r() * 5}" stroke-linecap="round" fill="none" opacity="${0.18 + r() * 0.2}"/>`; }
    g += bs;
    // dirt path (W2 only)
    if (s.W === 'W2') g += `<path d="M560 720 Q700 600 840 560 T1100 480 T1280 470 L1280 500 Q1100 520 900 600 T760 724Z" fill="#c9a86a" opacity=".32" filter="url(#b4)"/>`;
  }
  // restored details
  const cols = [p.rg1, p.rg2, mix(p.rg1, '#fff', 0.25), p.rg3];
  let det = '';
  const nR = s.W === 'W1' ? 16 : s.W === 'W2' ? 150 : 110;
  for (let i = 0; i < nR; i++) { const y = HOR + 30 + r() * 490, x = 560 + r() * 740; const sc = s.W === 'W1' ? 2.3 : s.W === 'W3' ? 0.55 + (y - HOR) / 320 : 0.7 + (y - HOR) / 520; if (x > bx(y) + 8) det += tuft(x, y, sc, cols, r); }
  const nF = s.W === 'W1' ? 14 : s.W === 'W2' ? 60 : 36;
  for (let i = 0; i < nF; i++) { const y = HOR + 60 + r() * 460, x = 560 + r() * 740; if (x > bx(y) + 8) det += flower(x, y, s.W === 'W1' ? 1.8 : 0.8 + (y - HOR) / 520, p.fl[i % 4]); }
  for (const [x, y] of ISLES) for (let i = 0; i < 5; i++) det += tuft(x + (r() - 0.5) * 80, y + (r() - 0.5) * 16, 0.9, cols, r) + (i % 2 ? flower(x + (r() - 0.5) * 70, y + (r() - 0.5) * 14, 1, p.fl[i % 4]) : '');
  for (const [x, y] of [[900, 620], [1180, 560], [610, 510]]) det += `<ellipse cx="${x}" cy="${y}" rx="14" ry="8" fill="#9aa4ac"${stroke('#9aa4ac')}/><ellipse cx="${x - 3}" cy="${y - 3}" rx="8" ry="3" fill="#cdd4da" opacity=".7"/>`;
  g += `<g${s.L === 'L4' ? ' filter="url(#wobS)"' : ''}>${det}</g>`;
  o += `<g clip-path="url(#rest)">${g}</g>`;
  // boundary lip
  const edge = `<path d="${smooth(d)}" fill="none"/>` ;
  o += `<g>${[...ISLES.map(([x, y, rx, ry]) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="none"/>`)].join('')}</g>`;
  const eg = s.G === 'G1' ? 0.55 : 0.8;
  o += `<path d="${smooth(d)}" fill="none" stroke="#ffc45a" stroke-width="16" opacity="${eg * 0.5}" filter="url(#b8)" style="mix-blend-mode:screen"/><path d="${smooth(d)}" fill="none" stroke="${mix(p.rg1, '#ffffff', 0.25)}" stroke-width="5" opacity=".85"${s.L === 'L4' ? ' filter="url(#wobS)"' : ''}/>`;
  for (const [x, y, rx, ry] of ISLES) o += `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="none" stroke="#ffc45a" stroke-width="6" opacity=".35" filter="url(#b4)" style="mix-blend-mode:screen"/><ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="none" stroke="${mix(p.rg1, '#fff', 0.25)}" stroke-width="3" opacity=".8"/>`;
  return o;
}
// ---------- the TREE ----------
function tree() {
  const s = cur(), r = rnd(5), trunk = 'M-84 0 C-54 -10 -46 -34 -41 -78 C-37 -130 -42 -176 -36 -222 L36 -222 C42 -176 37 -130 43 -78 C48 -34 62 -10 90 0 Q3 16 -84 0Z';
  addDef(`<clipPath id="tL"><rect x="-400" y="-500" width="400" height="560"/></clipPath><clipPath id="tR"><rect x="0" y="-500" width="400" height="560"/></clipPath>`);
  const br = (x1, y1, x2, y2, t, c) => shp(cap(x1, y1, x2, y2, t, t * 0.35), c, { w: 0.8, so: 3 });
  let L = '', R = '';
  const cg = mix('#7a8797', '#14101e', s.ed || 0), cb = '#a0703f';
  const bs = [[-18, -205, -120, -270, 13], [-22, -182, -150, -214, 10], [-12, -235, -64, -324, 9]];
  for (const [a, b, c, d, t] of bs) { L += br(a, b, c, d, t, cg); R += br(-a, b, -c, d, t, cb); }
  // twigs
  for (const [x, y, dx, dy] of [[-120, -270, -34, -34], [-120, -270, -20, -42], [-150, -214, -40, -16], [-150, -214, -26, 26], [-64, -324, -22, -32], [-64, -324, 10, -38], [-100, -245, -26, 36]]) L += stk(`M${x} ${y} q${dx * 0.5} ${dy * 0.2} ${dx} ${dy}`, '#6a7686', 3.2);
  L += shp(trunk, mix('#808c9c', '#14101e', s.ed || 0), { so: 9, x: `<path d="M-30 -60 Q-10 -100 -34 -150M-12 -40 Q4 -90 -14 -140M-20 -190 Q-6 -170 -22 -140" stroke="#2a2433" stroke-width="2.4" fill="none" opacity=".6"/><ellipse cx="-12" cy="-118" rx="12" ry="19" fill="#1a1522"/><ellipse cx="-12" cy="-112" rx="6" ry="10" fill="#8aa0b8" opacity=".35"/>` });
  L += vein('M-50 -4 L-92 6 L-130 0 M-92 6 L-112 22', 2.4) + vein('M-20 -222 L-34 -250 M-20 -222 L-8 -260', 1.6);
  const root = (sx, c) => shp(cap(sx * 40, -6, sx * 100, 6, 9, 3), c, { w: 0.8, so: 3 }) + shp(cap(sx * 30, -4, sx * 62, 16, 7, 3), c, { w: 0.8, so: 3 });
  L += root(-1, '#6c7888');
  R += root(1, '#8a5a34');
  R += shp(trunk, cb, { so: 9, x: `<path d="M18 -60 Q8 -100 24 -150M32 -30 Q24 -90 30 -140" stroke="#6a4224" stroke-width="3" fill="none" opacity=".5"/><ellipse cx="30" cy="-30" rx="14" ry="22" fill="#6aa84a" opacity=".7"/><ellipse cx="26" cy="-150" rx="10" ry="16" fill="#7cc058" opacity=".6"/>` });
  const can = [[40, -292, 62, '#5fa84e'], [112, -262, 50, '#78bd58'], [30, -350, 48, '#8ccb5e'], [146, -214, 38, '#4f9a48'], [88, -326, 44, '#e9a93d'], [-2, -302, 40, '#6fb653'], [102, -298, 40, '#9ad46a'], [60, -245, 34, '#4f9a48']];
  can.push([70,-270,46,'#6fb653'],[20,-262,34,'#78bd58'],[128,-300,34,'#5fa84e'],[60,-370,30,'#9ad46a'],[126,-240,30,'#8ccb5e']);
  for (const [cx, cy, rr, c] of can) R += shp(circ(cx, cy, rr), c, { so: 8, w: 0.9 });
  for (let i = 0; i < 26; i++) { const a = r() * 6.28, rr = 30 + r() * 55, cx = 70 + Math.cos(a) * rr * 1.1, cy = -290 + Math.sin(a) * rr * 0.9; if (cx > 6) R += `<circle cx="${cx.toFixed(0)}" cy="${cy.toFixed(0)}" r="${3.2 + r() * 1.6}" fill="${['#ffb347', '#ff8fa3', '#fff1c4', '#ffd86b'][i % 4]}"${s.L === 'L1' ? ` stroke="${s.ink}" stroke-width="1"` : ''}/>`; }
  for (let i = 0; i < 9; i++) R += flower(20 + i * 14, 6 + (i % 3) * 4, 1.2, ['#ffb347', '#ff8fa3', '#fff1c4'][i % 3]);
  for (let i = 0; i < 5; i++) R += `<path d="${blade(24 + i * 22, 4, 16 + (i % 3) * 5, (i - 2) * 4, 3)}" fill="#5aa84a"/>`;
  let o = `<ellipse cx="0" cy="4" rx="120" ry="16" fill="#000" opacity=".3" filter="url(#b8)"/>`;
  o += `<g clip-path="url(#tL)">${L}</g><g clip-path="url(#tR)">${R}</g>`;
  o += `<rect x="-5" y="-340" width="10" height="350" fill="url(#${lgU('seam', -5, 0, 5, 0, [[0, '#ffc45a', 0], [0.5, '#fff2c0', 1], [1, '#ffc45a', 0]])})" filter="url(#b2)" opacity=".45" style="mix-blend-mode:screen"/>`;
  o += glow(0, -120, 70, 200, '#ffc45a', 0.35);
  return o;
}
// ---------- damage number ----------
function dmg(x, y) {
  const s = cur(), t = '124'; let o = '';
    const burst = (c, c2) => { let p = ''; for (let i = 0; i < 24; i++) { const a = i * 0.2618, ro = i % 2 ? 62 : 88; p += `${i ? 'L' : 'M'}${(Math.cos(a) * ro).toFixed(1)} ${(Math.sin(a) * ro * 0.6 - 22).toFixed(1)} `; } return `<path d="${p}Z" fill="${c}" opacity="${c2}"/>`; };
  const f = { fontFamily: "'Segoe UI Black','Arial Black',sans-serif", fs: 70 };
  o += `<g transform="translate(${x},${y}) rotate(-7)">`;
  if (s.L === 'L1') o += burst('#ffb347', 0.55) + `<text x="2" y="9" font-family="${f.fontFamily}" font-size="${f.fs}" font-weight="900" text-anchor="middle" fill="#241420" stroke="#241420" stroke-width="16" stroke-linejoin="round">${t}</text><text font-family="${f.fontFamily}" font-size="${f.fs}" font-weight="900" text-anchor="middle" fill="url(#${lgU('dm1', 0, -50, 0, 10, [[0, '#fff6b0'], [0.5, '#ffd23a'], [1, '#ff8a1f']])})" stroke="#7a2a08" stroke-width="3" paint-order="stroke">${t}</text><ellipse cx="-24" cy="-40" rx="26" ry="5" fill="#fff" opacity=".7" transform="rotate(-4)"/>`;
  if (s.L === 'L2') o += burst('#ff8a3a', 0.3) + `<text font-family="${f.fontFamily}" font-size="${f.fs}" font-weight="900" text-anchor="middle" fill="#fff4dc" stroke="#9a3a12" stroke-width="12" stroke-linejoin="round" paint-order="stroke">${t}</text><text font-family="${f.fontFamily}" font-size="${f.fs}" font-weight="900" text-anchor="middle" fill="none" stroke="#ff8a3a" stroke-width="3" opacity=".8">${t}</text>`;
  if (s.L === 'L3') o += glow(0, -22, 100, 50, '#ffd36b', 0.7) + `<text x="3" y="6" font-family="Georgia,serif" font-size="${f.fs}" font-weight="900" font-style="italic" text-anchor="middle" fill="#3a1a30" opacity=".6" filter="url(#b2)">${t}</text><text font-family="Georgia,serif" font-size="${f.fs}" font-weight="900" font-style="italic" text-anchor="middle" fill="url(#${lgU('dm3', 0, -50, 0, 10, [[0, '#fff8d8'], [0.6, '#ffd36b'], [1, '#f0a030']])})">${t}</text>`;
  if (s.L === 'L4') o += `<g filter="url(#wob)"><text x="3" y="3" font-family="Georgia,serif" font-size="${f.fs}" font-weight="900" font-style="italic" text-anchor="middle" fill="#e8742a">${t}</text><text font-family="Georgia,serif" font-size="${f.fs}" font-weight="900" font-style="italic" text-anchor="middle" fill="none" stroke="#2b2233" stroke-width="3.2" stroke-linejoin="round">${t}</text></g>`;
  return o + '</g>';
}
// ---------- light ----------
export function sparkle(x, y, r, c = '#fff6d0') { return `<path d="M${x} ${y - r} Q${x + r * 0.15} ${y - r * 0.15} ${x + r} ${y} Q${x + r * 0.15} ${y + r * 0.15} ${x} ${y + r} Q${x - r * 0.15} ${y + r * 0.15} ${x - r} ${y} Q${x - r * 0.15} ${y - r * 0.15} ${x} ${y - r}Z" fill="${c}" style="mix-blend-mode:screen"/>`; }
const WX = 905, WY = 590, GX = 640, GY = 600;
function lightBack(s) { // behind characters
  let o = '';
  if (s.G === 'G1') o += glow(WX - 30, WY - 6, 300, 110, '#ffc45a', 0.7) + glow(GX, GY, 150, 50, '#ffe3a6', 0.5);
  if (s.G === 'G2') {
    o += `<g style="mix-blend-mode:screen" opacity=".55">${[[1010, 0, 760, 720, 60], [1160, 0, 980, 720, 50], [880, 0, 560, 720, 40]].map(([x1, y1, x2, y2, w]) => `<path d="M${x1 - w} ${y1} L${x1 + w} ${y1} L${x2 + w * 2.4} ${y2} L${x2 - w * 2.4} ${y2}Z" fill="url(#${lgU('beam' + x1, 0, 0, 0, 720, [[0, '#ffd890', 0.55], [1, '#ffd890', 0]])})" filter="url(#b8)"/>`).join('')}</g>`;
    o += glow(WX + 10, WY - 90, 190, 170, '#ffc45a', 0.75) + glow(GX, GY - 30, 200, 100, '#ffe3a6', 0.65);
  }
  if (s.G === 'G3') o += glow(WX - 20, WY - 50, 260, 170, '#ffc45a', 0.55) + glow(GX, GY - 20, 170, 90, '#ffe3a6', 0.4) + glow(700, 340, 150, 260, '#ffc45a', 0.28);
  return o;
}
function trail(s) {
  let o = ''; const pts = [];
  for (let i = 0; i <= 14; i++) { const t = i / 14; pts.push([GX + 70 + t * (s.G === 'G2' ? 250 : 130), GY - 60 + Math.sin(t * 3.4) * 14 + t * 30]); }
  if (s.G === 'G2') { const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(0)} ${p[1].toFixed(0)}`).join(' '); o += `<g style="mix-blend-mode:screen"><path d="${d}" stroke="#ffb84a" stroke-width="22" fill="none" stroke-linecap="round" opacity=".28" filter="url(#b8)"/><path d="${d}" stroke="#ffd98a" stroke-width="9" fill="none" stroke-linecap="round" opacity=".6" filter="url(#b2)"/><path d="${d}" stroke="#fff8e0" stroke-width="3" fill="none" stroke-linecap="round" opacity=".9"/></g>`; }
  else if (s.G === 'G3') pts.forEach((p, i) => { o += i % 2 ? sparkle(p[0], p[1] + (i % 3) * 6, 9 - i * 0.4) : glow(p[0], p[1], 10, 10, '#ffd98a', 0.8); });
  else pts.forEach((p, i) => { if (i % 2 === 0) o += glow(p[0], p[1] + 54, 14 - i * 0.6, 6, '#ffd98a', 0.8) + `<ellipse cx="${p[0]}" cy="${p[1] + 54}" rx="${5 - i * 0.2}" ry="2.4" fill="#fff0c0" opacity="${0.8 - i * 0.05}"/>`; });
  return o;
}
function thread() { return `<path d="M${GX + 38} ${GY - 82} Q${GX + 150} ${GY - 200} ${WX - 40} ${WY - 90}" fill="none" stroke="#ffb84a" stroke-width="2.4" stroke-dasharray="1 6" stroke-linecap="round"/><path d="M${GX + 38} ${GY - 82} Q${GX + 150} ${GY - 200} ${WX - 40} ${WY - 90}" fill="none" stroke="#ffd98a" stroke-width="7" opacity=".3" filter="url(#b2)" style="mix-blend-mode:screen"/>`; }
function lightFront(s) {
  const r = rnd(77); let o = '';
  if (s.G === 'G3') {
    o += `<rect width="1280" height="720" fill="url(#${rgU('bloom' + s.id, 800, 420, 620, [[0, '#ffd98a', 0.22], [1, '#ffd98a', 0]])})" style="mix-blend-mode:screen"/>`;
    for (let i = 0; i < 30; i++) { const x = 480 + r() * 800, y = 120 + r() * 560, rr = 2 + r() * 4; o += r() > 0.55 ? sparkle(x, y, 4 + r() * 6) : `<circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${rr.toFixed(1)}" fill="#fff0b8" opacity="${0.5 + r() * 0.4}" filter="url(#b1)" style="mix-blend-mode:screen"/><circle cx="${x.toFixed(0)}" cy="${y.toFixed(0)}" r="${(rr * 2.8).toFixed(1)}" fill="url(#${glowId('#ffd36b', 0.5)})" style="mix-blend-mode:screen"/>`; }
  }
  if (s.G === 'G2') for (let i = 0; i < 16; i++) o += `<circle cx="${(740 + r() * 520).toFixed(0)}" cy="${(120 + r() * 560).toFixed(0)}" r="${(1.4 + r() * 2).toFixed(1)}" fill="#fff0b8" opacity=".7" filter="url(#b1)" style="mix-blend-mode:screen"/>`;
  if (s.G === 'G1') for (let i = 0; i < 10; i++) o += `<circle cx="${(760 + r() * 380).toFixed(0)}" cy="${(380 + r() * 260).toFixed(0)}" r="${(1.2 + r() * 1.6).toFixed(1)}" fill="#fff0b8" opacity=".75" filter="url(#b1)" style="mix-blend-mode:screen"/>`;
  o += `<rect width="1280" height="720" fill="url(#${rgU('vig' + s.id, 640, 390, 840, [[0.55, '#000', 0], [1, s.id === 'S5' ? '#000' : '#10101c', s.id === 'S5' ? 0.7 : s.id === 'S4' ? 0.18 : 0.42]])})"/>`;
  return o;
}
function foreground(s) {
  if (s.W !== 'W3') return '';
  const r = rnd(99), c = mix(s.pal.skyT, '#000', 0.25); let o = '';
  const bl = (x, h, w, lean) => `<path d="${blade(x, 740, h, lean, w)}" fill="${c}"/>`;
  let g = ''; for (let i = 0; i < 12; i++) g += bl(r() * 480, 60 + r() * 80, 9 + r() * 7, (r() - 0.5) * 50); for (let i = 0; i < 10; i++) g += bl(880 + r() * 400, 50 + r() * 70, 9 + r() * 7, (r() - 0.5) * 50);
  return `<g filter="url(#b2)" opacity=".7">${g}</g>`;
}
// ---------- full scene ----------
const shadow = (x, y, rx) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${rx * 0.16}" fill="#000" opacity=".35" filter="url(#b4)"/>`;
export function sceneBody(s) {
  use(s); const cs = s.P; let o = '';
  o += sky(s) + backdrop(s) + groundBase(s);
  o += lightBack(s);
  const wsc = { P1: 1.85, P2: 1.75, P3: 1.45 }[cs], wsw = { P1: 2.3, P2: 2.0, P3: 1.95 }[cs], csc = { P1: 2.0, P2: 2.1, P3: 2.35 }[cs], rsc = { P1: 1.7, P2: 1.4, P3: 1.2 }[cs];
  const ents = [
    [TY, `<g transform="translate(${TX},${TY})">${tree()}</g>`],
    [525, `${shadow(310, 530, 120)}<g transform="translate(310,525) scale(${wsw})">${wolf({ enemy: true, f: 1 })}</g>`],
    [655, `<g transform="translate(190,655) scale(${csc})">${crawler()}</g>`],
    [GY, `${shadow(GX, GY, 110)}<g transform="translate(${GX},${GY}) scale(${wsw * 0.95})">${wolf({ enemy: false, f: -1 })}</g>`],
    [WY, `${shadow(WX, WY, 62)}<g transform="translate(${WX},${WY}) scale(${wsc * (170 / WREN_H[cs]) / (wsc)})">${'' }</g>`],
  ];
  // wren scale: normalise to ~172px tall
  ents[4][1] = `${shadow(WX, WY, 66)}<g transform="translate(${WX},${WY}) scale(${((cs === 'P3' ? 190 : 172) / WREN_H[cs]).toFixed(3)})">${wren()}</g>`;
  ents.push([700, `<g transform="translate(792,672)">${glow(0, -10, 56, 24, '#ffc35c', 0.5)}${shadow(0, 8, 24)}<g transform="scale(1.35)">${gem()}</g></g>`]);
  ents.push([470, `${shadow(1030, 462, 36)}<g transform="translate(1030,300) scale(${rsc})">${raven()}</g>`]);
  ents.sort((a, b) => a[0] - b[0]);
  o += trail(s) + thread();
  o += ents.map((e) => e[1]).join('');
  o += dmg(318, 392);
  o += lightFront(s) + foreground(s);
  if (s.pal.paper) o += `<rect width="1280" height="720" filter="url(#paper)" opacity=".12" style="mix-blend-mode:multiply"/>`;
  if (s.H === 'H3') o += `<rect width="1280" height="720" filter="url(#paintG)" opacity=".16" style="mix-blend-mode:multiply"/>`;
  return o;
}
function banner(s) {
  const legend = `${s.id} = Line ${s.L} + Shade ${s.H} + Prop ${s.P} + World ${s.W} + Light ${s.G}`;
  const sw = s.pal.sw.map((c, i) => `<circle cx="${36 + i * 102}" cy="94" r="13" fill="${c}" stroke="#fff" stroke-opacity=".8" stroke-width="2"/><text x="${54 + i * 102}" y="99" font-family="Consolas,monospace" font-size="13" fill="#e8edf3">${c}</text>`).join('');
  return `<g><rect x="0" y="0" width="570" height="116" rx="0" fill="#07090d" opacity=".9"/><rect x="0" y="116" width="570" height="3" fill="#ffb84a"/>${T(`STYLE ${s.id}: ${s.name}`, 14, 36, { s: 31, f: FONT.title, w: 900, c: '#fff', ls: 0.5 })}${T(legend, 14, 62, { s: 14, c: "#ffd98a", w: 700, f: FONT.mono })}${sw.replace(/<text x="(\d+)"/g, (m, x) => `<text x="${x}"`)}</g>`;
}
export function page(s) {
  begin(); use(s);
  const body = sceneBody(s);
  return `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;background:#000}svg{display:block}</style></head><body><svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">${defsOut()}${body}${banner(s)}</svg></body></html>`;
}
export { banner };
