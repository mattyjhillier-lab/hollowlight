// SUMMONS ART: (3) Spirit Bolt glyphs, (4) Chain Lightning, (5) Holy Orbit lights, (6) shared FX. Options A/B/C each.
// Mock-up drawing code only (NOT game code). Origin = the centre of the effect, heading +x.
import { SP, ROLE, WARM, EMBER, GOLD, GOLDHOT, G, sEye, wrap, star, heart } from './spirits.mjs';
import { blob, poly, circ, ell, limb, line, rng, tick, f, TAU, mix, lin } from '../enemies-art2/paint.mjs';

// ---------------- 3. SPIRIT BOLTS ----------------
// five invented letter-glyphs (not a real alphabet), drawn as cream strokes on a 14x14 box centred on 0,0
export const GLYPHS = [
  'M-5 -5 Q0 -1 5 -5 M0 -2 V6 M-3 6 H3',
  'M-5 5 Q-4 -6 0 -6 Q4 -6 5 5 M0 -1 V3',
  'M0 -6 V6 M-5 -2 Q0 2 5 -2',
  'M-5 -4 H5 M-3 -4 Q-3 4 3 6 M3 -4 V1',
  'M-5 -4 L0 5 L5 -4 M-3 -6 H3',
];
const glyphPath = (i, x, y, s, col, w = 2.2) => `<path d="${GLYPHS[i % GLYPHS.length]}" transform="translate(${f(x)},${f(y)}) scale(${f(s)})" stroke="${col}" stroke-width="${f(w / s)}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
// curling ink tail (the bible's 'thin ink-line comet tail that curls as it homes')
export const inkTail = (len, curl, R, a = 1) => {
  const p = [[-6, 0], [-len * 0.35, curl * 0.4], [-len * 0.7, curl], [-len, curl * 0.4 - 4]];
  return `<path d="${line(p)}" stroke="${R.glow}" stroke-width="9" fill="none" opacity="${f(0.35 * a)}" stroke-linecap="round" filter="url(#blur3)"/><path d="${line(p)}" stroke="${R.ink}" stroke-width="3.2" fill="none" opacity="${f(0.85 * a)}" stroke-linecap="round"/><path d="${line(p.slice(0, 3))}" stroke="${R.c}" stroke-width="1.4" fill="none" opacity="${f(0.9 * a)}" stroke-linecap="round"/>`
    + `<circle cx="${f(-len * 0.85)}" cy="${f(curl * 0.7 - 6)}" r="1.6" fill="${R.ink}" opacity="${f(0.7 * a)}"/>`;
};
// A INK GLYPH ORB (recommended): a cream letter-glyph inside a soft cyan orb with a dark ink rim; a curling ink tail behind it.
export function boltA(st = {}) {
  const R = ROLE.bolt, i = st.v || 0, s = st.s || 1;
  let b = (st.tail === 0 ? '' : inkTail(38 * s, st.curl ?? 8, R, st.ta ?? 1)) + G(0, 0, 22 * s, 22 * s, R.glow, 0.7);
  b += SP(circ(0, 0, 10 * s), R, { sh: 2, rim: 1.6, lt: '#ffffff', lw: 2.2 }) + `<circle r="${f(7 * s)}" fill="${mix(R.c, '#ffffff', 0.5)}" opacity=".6"/>`;
  b += glyphPath(i, 0, 0, 0.95 * s, R.ink, 3.6) + glyphPath(i, -0.4, -0.5, 0.95 * s, WARM, 1.8);
  return wrap(b, st);
}
// B TORN PAGE SCRAPS: a tumbling scrap of cream paper with one cyan glyph; edges glow cyan; a few paper flecks trail behind.
export function boltB(st = {}) {
  const R = ROLE.bolt, i = st.v || 0, rot = st.rot ?? -14, q = rng(3 + i);
  let b = G(0, 0, 22, 18, R.glow, 0.55);
  for (let k = 0; k < 4; k++) b += `<rect x="${f(-18 - k * 7)}" y="${f((q() - 0.5) * 10)}" width="3" height="2.4" fill="${WARM}" opacity="${f(0.8 - k * 0.18)}" transform="rotate(${f(q() * 90)} ${f(-18 - k * 7)} 0)"/>`;
  b += `<g transform="rotate(${rot})">` + SP(poly([[-9, -11], [6, -12], [10, -6], [8, 2], [11, 10], [-2, 11], [-10, 8], [-8, 0]]), R, { col: '#fbf3df', lt: '#ffffff', dk: '#e3d2ad', ink: R.ink, sh: 2, rim: 0, lw: 2 })
    + `<path d="M-9 -11 L6 -12 L10 -6" stroke="${R.c}" stroke-width="1.6" fill="none" opacity=".9"/>` + glyphPath(i, 0, 0, 0.8, R.dk, 2.4) + '</g>';
  return wrap(b, st);
}
// C STAR SEEDS: a hard white 4-point spark with a cyan halo and a short straight streak (fast, clean, least characterful).
export function boltC(st = {}) {
  const R = ROLE.bolt;
  let b = `<path d="M-44 0 L-6 0" stroke="${R.glow}" stroke-width="7" opacity=".45" stroke-linecap="round" filter="url(#blur1)"/><path d="M-30 0 L-4 0" stroke="#ffffff" stroke-width="1.6" opacity=".8" stroke-linecap="round"/>` + G(0, 0, 20, 20, R.glow, 0.8);
  b += star(0, 0, 13, R.c) + star(0, 0, 9, '#ffffff') + `<circle r="2.4" fill="${WARM}"/>`;
  return wrap(b, st);
}
// evolution set pieces for A
export function lanceA(st = {}) { // Soul Lance: a written line of light; glyph row inside a pale capsule, gold edges
  const R = ROLE.bolt, L = st.len || 150; let b = G(L / 2 - 10, 0, L * 0.65, 22, R.glow, 0.55);
  b += `<path d="M0 0 H${L}" stroke="${R.glow}" stroke-width="22" opacity=".35" stroke-linecap="round" filter="url(#blur3)"/>`;
  b += `<path d="M4 -7 H${L - 14} Q${L + 6} 0 ${L - 14} 7 H4 Q-6 0 4 -7Z" fill="url(#${lin([[0, '#ffffff', 0.4], [0.5, '#e8fdff'], [1, R.c]], [0, 0, 0, 1])})" stroke="${R.ink}" stroke-width="2"/>`;
  for (let k = 0; k * 13 + 14 < L - 18; k++) b += glyphPath(k + 1, 14 + k * 13, 0, 0.55, R.dk, 1.8);
  b += `<path d="M4 -7.6 H${L - 14} Q${L + 6.4} 0 ${L - 14} 7.6 H4" fill="none" stroke="${GOLD}" stroke-width="1.2" opacity=".95"/>`;
  return b;
}
export function pageA(st = {}) { // Returning Pages: a folded page with a cyan glyph; ink trail out, dotted curl home
  const R = ROLE.bolt, back = st.back; let b = '';
  b += back ? `<path d="M-6 0 Q-30 -4 -36 -18 Q-40 -30 -28 -30" stroke="${R.c}" stroke-width="1.8" fill="none" stroke-dasharray="2 4" opacity=".8" stroke-linecap="round"/>` : inkTail(46, -6, R, 1);
  b += G(0, 0, 20, 18, R.glow, back ? 0.35 : 0.6);
  b += `<g transform="rotate(${back ? 160 : -10})">` + SP(poly([[-8, -10], [5, -10], [9, -6], [9, 10], [-8, 10]]), R, { col: back ? '#e4f1f7' : '#fbf3df', lt: '#ffffff', dk: '#e0d0ae', ink: R.ink, sh: 2, rim: 0, lw: 2 })
    + `<path d="M5 -10 V-6 H9" fill="#e3d4b2" stroke="${R.ink}" stroke-width="1.2"/>` + glyphPath(st.v || 2, 0, 1, 0.7, R.dk, 2.2) + `<path d="M-8.6 -10.6 H5.4 L9.6 -6.4 V10.6 H-8.6Z" fill="none" stroke="${GOLD}" stroke-width="1" opacity=".9"/></g>`;
  return b;
}

// ---------------- 4. CHAIN LIGHTNING ----------------
const jag = (x1, y1, x2, y2, seed, amp = 7, n = 7) => { const q = rng(seed), dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy), nx = -dy / L, ny = dx / L; const p = [[x1, y1]];
  for (let i = 1; i < n; i++) { const t = i / n, o = (q() - 0.5) * 2 * amp * Math.sin(t * Math.PI) ** 0.5; p.push([x1 + dx * t + nx * o, y1 + dy * t + ny * o]); } p.push([x2, y2]); return p; };
const pl = (p) => 'M' + p.map(([x, y]) => f(x) + ' ' + f(y)).join(' L');
// A STORM THREAD (recommended): 3 layers = wide violet fringe (blurred) + cyan glow + white-hot core; little forks; a crack-star where it lands
export function arcA(x1, y1, x2, y2, seed = 1, o = {}) {
  const R = ROLE.chain, p = jag(x1, y1, x2, y2, seed, o.amp ?? 8, o.n ?? 8), d = pl(p), q = rng(seed + 9); let s = '';
  s += `<path d="${d}" stroke="${R.fringe}" stroke-width="14" fill="none" opacity=".35" stroke-linejoin="round" filter="url(#blur3)"/><path d="${d}" stroke="${R.glow}" stroke-width="6" fill="none" opacity=".8" stroke-linejoin="round" filter="url(#blur1)"/><path d="${d}" stroke="${R.core}" stroke-width="2.2" fill="none" stroke-linejoin="round"/>`;
  if (o.forks !== 0) for (let k = 2; k < p.length - 2; k += 3) { const [x, y] = p[k], a = q() * TAU, l = 8 + q() * 8; s += `<path d="M${f(x)} ${f(y)} l${f(Math.cos(a) * l * 0.6)} ${f(Math.sin(a) * l * 0.6)} l${f(Math.cos(a + 0.6) * l * 0.5)} ${f(Math.sin(a + 0.6) * l * 0.5)}" stroke="${R.c}" stroke-width="1.4" fill="none" opacity=".85"/>`; }
  if (o.end !== 0) s += crack(x2, y2, seed);
  return s;
}
export const crack = (x, y, seed = 1, k = 1) => { const q = rng(seed + 3), R = ROLE.chain; let s = G(x, y, 18 * k, 12 * k, R.glow, 0.65);
  for (let i = 0; i < 5; i++) { const a = i / 5 * TAU + q(), l = (8 + q() * 7) * k; s += `<path d="M${f(x)} ${f(y)} l${f(Math.cos(a) * l * 0.5)} ${f(Math.sin(a) * l * 0.3)} l${f(Math.cos(a + 0.4) * l * 0.5)} ${f(Math.sin(a + 0.4) * l * 0.3)}" stroke="#1a2440" stroke-width="2" fill="none" opacity=".55"/><path d="M${f(x)} ${f(y)} l${f(Math.cos(a) * l * 0.5)} ${f(Math.sin(a) * l * 0.3)}" stroke="${R.c}" stroke-width="1" opacity=".9"/>`; }
  return s + star(x, y, 7 * k, '#ffffff'); };
// B SPIRIT ROPE: smooth glowing curves (a lasso of light) instead of jags: calm, cosy, but less 'lightning'
export function arcB(x1, y1, x2, y2, seed = 1) { const R = ROLE.chain, mx = (x1 + x2) / 2, my = (y1 + y2) / 2 - 16 + (seed % 3) * 8;
  const d = `M${f(x1)} ${f(y1)} Q${f(mx)} ${f(my)} ${f(x2)} ${f(y2)}`;
  return `<path d="${d}" stroke="${R.glow}" stroke-width="10" fill="none" opacity=".45" filter="url(#blur3)"/><path d="${d}" stroke="${R.c}" stroke-width="4" fill="none" stroke-linecap="round"/><path d="${d}" stroke="#ffffff" stroke-width="1.4" fill="none" stroke-dasharray="6 5" stroke-linecap="round"/>` + G(x2, y2, 14, 10, R.glow, 0.7) + `<circle cx="${f(x2)}" cy="${f(y2)}" r="3" fill="#fff"/>`; }
// C SPARK SPRITES: the strike is a bright spark-head that zips foe to foe leaving a zigzag streak (reads as a projectile)
export function arcC(x1, y1, x2, y2, seed = 1) { const R = ROLE.chain, p = jag(x1, y1, x2, y2, seed, 5, 4), d = pl(p);
  return `<path d="${d}" stroke="${R.glow}" stroke-width="5" fill="none" opacity=".5" filter="url(#blur1)"/><path d="${d}" stroke="#ffffff" stroke-width="1.2" fill="none" opacity=".7"/>` + G(x2, y2, 14, 14, R.glow, 0.9) + star(x2, y2, 9, R.c) + star(x2, y2, 5, '#fff'); }
// Thunder Judgment pillars
export function pillarA(x, y, h = 260, seed = 1) { const R = ROLE.chain; let s = '';
  s += `<path d="M${f(x)} ${f(y - h)} V${f(y)}" stroke="${R.fringe}" stroke-width="30" opacity=".25" filter="url(#blur3)"/><path d="M${f(x)} ${f(y - h)} V${f(y)}" stroke="${R.glow}" stroke-width="14" opacity=".55" filter="url(#blur1)"/>`;
  s += `<path d="${pl(jag(x, y - h, x, y, seed, 3, 10))}" stroke="#ffffff" stroke-width="5" fill="none" stroke-linejoin="round"/>`;
  s += `<path d="M${f(x - 7.5)} ${f(y - h)} V${f(y - 6)} M${f(x + 7.5)} ${f(y - h)} V${f(y - 6)}" stroke="${GOLD}" stroke-width="1.1" opacity=".85"/>`;
  s += `<path d="M${f(x - 24)} ${f(y - h)} Q${f(x)} ${f(y - h - 7)} ${f(x + 24)} ${f(y - h)}" stroke="#ffffff" stroke-width="2" fill="none" opacity=".8"/>`; // sky crack
  return s + `<ellipse cx="${f(x)}" cy="${f(y)}" rx="22" ry="8" fill="none" stroke="${R.c}" stroke-width="2" opacity=".8"/>` + crack(x, y, seed, 1.3); }
export function pillarB(x, y, h = 260) { const R = ROLE.chain; return `<path d="M${f(x)} ${f(y - h)} V${f(y)}" stroke="${R.glow}" stroke-width="26" opacity=".35" filter="url(#blur3)"/><path d="M${f(x)} ${f(y - h)} V${f(y)}" stroke="#ffffff" stroke-width="6" opacity=".7" stroke-linecap="round"/>` + G(x, y, 30, 12, R.glow, 0.8); }
export function pillarC(x, y, h = 260) { const R = ROLE.chain; return `<path d="M${f(x - 10)} ${f(y - h * 0.6)} L${f(x)} ${f(y - 8)}" stroke="${R.glow}" stroke-width="8" opacity=".5" filter="url(#blur1)" stroke-linecap="round"/>` + G(x, y - 10, 18, 18, R.glow, 0.9) + star(x, y - 10, 12, '#fff') + G(x, y, 26, 9, R.glow, 0.6); }
// Static Storm field ring (A: crackling hex dome edge + gold hairline; small strikes inside)
export function fieldA(r, seed = 2) { const R = ROLE.chain, q = rng(seed); let s = `<ellipse rx="${r}" ry="${f(r * 0.62)}" fill="${R.glow}" opacity=".06"/><ellipse rx="${r}" ry="${f(r * 0.62)}" fill="none" stroke="${R.c}" stroke-width="1.6" stroke-dasharray="3 7" opacity=".7"/><ellipse rx="${r - 4}" ry="${f(r * 0.62 - 3)}" fill="none" stroke="${GOLD}" stroke-width=".9" opacity=".7"/>`;
  for (let i = 0; i < 7; i++) { const a = q() * TAU; s += star(Math.cos(a) * r, Math.sin(a) * r * 0.62, 3.4, '#ffffff'); }
  return s; }
// Storm Tether (A: braided steady cord with knot beads; does not flicker)
export function tetherA(x1, y1, x2, y2, seed = 3) { const R = ROLE.chain, p1 = jag(x1, y1, x2, y2, seed, 4, 10), p2 = jag(x1, y1, x2, y2, seed + 5, 4, 10); let s = '';
  s += `<path d="M${f(x1)} ${f(y1)} L${f(x2)} ${f(y2)}" stroke="${R.fringe}" stroke-width="12" opacity=".3" filter="url(#blur3)"/>`;
  for (const p of [p1, p2]) s += `<path d="${pl(p)}" stroke="${R.glow}" stroke-width="4" fill="none" opacity=".7" filter="url(#blur1)"/><path d="${pl(p)}" stroke="#ffffff" stroke-width="1.4" fill="none"/>`;
  for (let t = 0.25; t < 1; t += 0.25) s += `<circle cx="${f(x1 + (x2 - x1) * t)}" cy="${f(y1 + (y2 - y1) * t)}" r="2.6" fill="${R.c}" stroke="#fff" stroke-width="1"/>`;
  return s + `<path d="M${f(x1)} ${f(y1)} L${f(x2)} ${f(y2)}" stroke="${GOLD}" stroke-width=".8" opacity=".6"/>` + G(x2, y2, 16, 12, R.glow, 0.7); }

// ---------------- 5. HOLY ORBIT ----------------
// A CANDLE FLAMES (recommended; the locked Elias v2 flame ring, polished): lilac-white teardrop flame, cream core, a tiny wick and wax bead
export function flameA(st = {}) {
  const R = ROLE.orbit, k = st.s || 1, lean = st.lean || 0, flick = Math.sin((st.ph || 0) * TAU) * 1.2;
  let b = G(0, -6 * k, 18 * k, 18 * k, R.glow, 0.7) + G(0, -4 * k, 9 * k, 9 * k, EMBER, 0.35);
  const fl = (s, col, ink) => { const h = 22 * s * k + flick, w = 8 * s * k; return `<path d="M0 ${f(4 * k)} C${f(-w * 1.3)} ${f(2 * k)} ${f(-w)} ${f(-h * 0.5)} ${f(lean * s * k)} ${f(-h)} C${f(w)} ${f(-h * 0.5)} ${f(w * 1.3)} ${f(2 * k)} 0 ${f(4 * k)}Z" fill="${col}"${ink ? ` stroke="${ink}" stroke-width="${f(2.2)}" stroke-linejoin="round"` : ''}/>`; };
  b += fl(1, `url(#${lin([[0, '#ffffff'], [0.45, R.c], [1, R.dk]], [0.5, 0, 0.5, 1])})`, R.ink) + fl(0.66, mix(R.c, '#ffffff', 0.6)) + fl(0.36, WARM);
  b += `<path d="M0 ${f(4 * k)} v${f(3 * k)}" stroke="#4a3a5e" stroke-width="${f(1.4 * k)}"/><ellipse cx="0" cy="${f(8 * k)}" rx="${f(4 * k)}" ry="${f(2 * k)}" fill="#efe6d4" stroke="${R.ink}" stroke-width="1.2"/>`;
  return wrap(b, st);
}
// B LANTERN MOTHS: each light is a moth of candle light with lilac wings round a flame body (CONFLICTS with the locked Elias v2 flame ring)
export function flameB(st = {}) {
  const R = ROLE.orbit, wf = 0.6 + 0.4 * Math.abs(Math.sin((st.ph || 0) * TAU));
  let b = G(0, 0, 20, 16, R.glow, 0.6);
  for (const s of [-1, 1]) b += SP(blob([[0, -2], [s * 16 * wf, -12], [s * 20 * wf, -2], [s * 12 * wf, 6], [0, 3]]), R, { col: '#e3d9ff', sh: 1, rim: 0, lw: 2, tex: `<circle cx="${f(s * 12 * wf)}" cy="-3" r="2.6" fill="${EMBER}" opacity=".7"/>` });
  b += SP(ell(0, 0, 3.6, 8), R, { col: '#fff7e6', lt: '#ffffff', dk: '#f1d9a8', sh: 1, rim: 0, lw: 1.6 }) + `<path d="M-1 -8 q-3 -5 -6 -6 M1 -8 q3 -5 6 -6" stroke="${R.ink}" stroke-width="1" fill="none"/>`;
  return wrap(b, st);
}
// C GLASS ROSETTES: small lilac stained-glass rosettes with a candle glow behind; hard facets, chapel feel
export function flameC(st = {}) {
  const R = ROLE.orbit, rot = (st.ph || 0) * 60; let b = G(0, 0, 18, 18, R.glow, 0.75);
  let g = ''; for (let i = 0; i < 6; i++) { const a = i / 6 * TAU, a2 = (i + 1) / 6 * TAU; g += `<path d="M0 0 L${f(Math.cos(a) * 10)} ${f(Math.sin(a) * 10)} L${f(Math.cos(a2) * 10)} ${f(Math.sin(a2) * 10)}Z" fill="${i % 2 ? '#d9ccff' : '#f6f1ff'}" stroke="${R.ink}" stroke-width="1.4" stroke-linejoin="round"/>`; }
  b += `<g transform="rotate(${f(rot)})">${g}</g><circle r="3" fill="${WARM}" stroke="${R.ink}" stroke-width="1"/>`;
  return wrap(b, st);
}
// flame-of-flame burst (Judgement Wheel): 6 petals + returning sparks
export function burstA(k = 1, t = 0.4) { const R = ROLE.orbit; let s = G(0, 0, 40 * k, 30 * k, R.glow, 0.7 * (1 - t * 0.5));
  for (let i = 0; i < 6; i++) { const a = i / 6 * TAU, L = (16 + 18 * t) * k; s += `<path d="M0 0 Q${f(Math.cos(a - 0.35) * L * 0.6)} ${f(Math.sin(a - 0.35) * L * 0.45)} ${f(Math.cos(a) * L)} ${f(Math.sin(a) * L * 0.72)} Q${f(Math.cos(a + 0.35) * L * 0.6)} ${f(Math.sin(a + 0.35) * L * 0.45)} 0 0Z" fill="${i % 2 ? R.c : '#ffffff'}" stroke="${R.dk}" stroke-width="1.2" opacity="${f(1 - t * 0.6)}"/>`; }
  return s + `<circle r="${f(5 * k)}" fill="${WARM}"/>` + `<circle r="${f((24 + 10 * t) * k)}" fill="none" stroke="${GOLD}" stroke-width="1" opacity="${f(0.8 - t * 0.5)}" transform="scale(1,.72)"/>`; }
// consecrated ground (Sanctum Halo A): a soft cream-lilac disc with a stained-glass petal ring and a gold hairline edge
export function groundHaloA(r) { const R = ROLE.orbit; let s = `<ellipse rx="${r}" ry="${f(r * 0.62)}" fill="url(#${lin([[0, '#fff3dc', 0.28], [1, R.burn, 0.16]], [0, 0, 0, 1])})"/>`;
  for (let i = 0; i < 12; i++) { const a = i / 12 * TAU, a2 = (i + 0.85) / 12 * TAU, r1 = r * 0.72, r2 = r * 0.94; s += `<path d="M${f(Math.cos(a) * r1)} ${f(Math.sin(a) * r1 * 0.62)} L${f(Math.cos(a) * r2)} ${f(Math.sin(a) * r2 * 0.62)} L${f(Math.cos(a2) * r2)} ${f(Math.sin(a2) * r2 * 0.62)} L${f(Math.cos(a2) * r1)} ${f(Math.sin(a2) * r1 * 0.62)}Z" fill="${i % 2 ? R.burn : '#fff3dc'}" opacity=".22" stroke="${R.dk}" stroke-width=".8" stroke-opacity=".35"/>`; }
  return s + `<ellipse rx="${r}" ry="${f(r * 0.62)}" fill="none" stroke="${GOLD}" stroke-width="1.2" opacity=".85"/>`; }
// the plain orbit ring stamp (base): a faint halo ring pressed into the soil
export const ringStamp = (r, a = 0.5) => `<ellipse rx="${r}" ry="${f(r * 0.62)}" fill="none" stroke="${ROLE.orbit.c}" stroke-width="2" opacity="${f(a)}" filter="url(#blur1)"/>`;

// ---------------- 6. SHARED FX ----------------
// spawn (A): light gathers from the hero's lantern thread into the spirit (t 0..1)
export const spawnA = (t, col) => { let s = ''; const r = 26 * (1 - t) + 6; s += `<circle r="${f(r)}" fill="none" stroke="${col}" stroke-width="${f(2 + 2 * t)}" opacity="${f(0.3 + 0.6 * t)}"/>`;
  for (let i = 0; i < 6; i++) { const a = i / 6 * TAU + 0.3; s += `<circle cx="${f(Math.cos(a) * r * 1.2)}" cy="${f(Math.sin(a) * r * 1.2)}" r="1.8" fill="${WARM}" opacity="${f(1 - t * 0.6)}"/>`; }
  return G(0, 0, 20 * (0.5 + t), 20 * (0.5 + t), col, 0.7) + s; };
// despawn (A): the spirit lets go into 5 warm motes that drift up and fade
export const despawnA = (t, col) => { const q = rng(5); let s = G(0, -t * 10, 18 * (1 - t) + 4, 14 * (1 - t) + 4, col, 0.6 * (1 - t)); for (let i = 0; i < 5; i++) { const x = (q() - 0.5) * 26, y = -t * (20 + q() * 26); s += G(x, y, 5, 5, EMBER, 0.6 * (1 - t)) + `<circle cx="${f(x)}" cy="${f(y)}" r="1.6" fill="${WARM}" opacity="${f(1 - t)}"/>`; } return s; };
// hit sparks per family (A): each weapon's verb as a tiny shape, <= 0.15 s, role colour + white core
export const hitA = { wolf: (k = 1) => `<g transform="scale(${k})">${G(0, 0, 14, 14, ROLE.wolf.glow, 0.6)}<path d="M-6 -10 Q8 -9 9 2 Q4 -5 -6 -5Z" fill="#fff"/><path d="M-6 10 Q8 9 9 -2 Q4 5 -6 5Z" fill="#fff"/></g>`,
  raven: (k = 1) => `<g transform="scale(${k})">${G(0, 0, 12, 12, ROLE.raven.glow, 0.6)}${star(0, 0, 8, '#fff')}<path d="M6 6 q6 2 4 8 q-5 -2 -4 -8Z" fill="${ROLE.raven.c}" stroke="${ROLE.raven.ink}" stroke-width=".8"/></g>`,
  bolt: (k = 1) => { const q = rng(8); let s = G(0, 0, 12, 12, ROLE.bolt.glow, 0.6); for (let i = 0; i < 6; i++) { const a = q() * TAU, d = 5 + q() * 6; s += `<circle cx="${f(Math.cos(a) * d)}" cy="${f(Math.sin(a) * d)}" r="${f(1 + q() * 1.6)}" fill="${ROLE.bolt.ink}"/>`; } return `<g transform="scale(${k})">${s}<circle r="3" fill="#fff"/></g>`; },
  chain: (k = 1) => `<g transform="scale(${k})">${crack(0, 0, 4, 0.7)}</g>`,
  orbit: (k = 1) => `<g transform="scale(${k})">${G(0, 0, 12, 12, ROLE.orbit.glow, 0.7)}${[0, 1, 2, 3, 4].map((i) => { const a = -Math.PI / 2 + (i - 2) * 0.5; return `<path d="M0 0 L${f(Math.cos(a) * 10)} ${f(Math.sin(a) * 10)}" stroke="${i % 2 ? ROLE.orbit.burn : '#fff'}" stroke-width="2" stroke-linecap="round"/>`; }).join('')}<circle r="2.6" fill="${WARM}"/></g>` };
export { heart, star };
