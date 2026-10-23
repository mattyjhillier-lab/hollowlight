// S5 Spirit Bolt A "Ink Glyph Orb" (LOCKED Summons art #3, docs/design/summons-art-v1.md 3.3): game port of the mock-up painter
// docs/mockups/summons-art/more.mjs boltA / lanceA / pageA on the shared Husk paint engine. Pure JS: builds SVG strings only (no DOM); atlas.js
// rasterises them lazily (first time the run owns Spirit Bolts; each evolution's frames on that evolution) into the glyph frames of `sum_atlas`.
// Look: a cream invented letter-glyph in a soft cyan orb with a dark ink rim; a curling INK tail behind it (the dark tail separates it from the mint
// XP gem). Evolved = same orb + gold rim (2.6 du soft + 1.1 du hot) + one signature change: Tempest = 8 glyphs bursting from a torn page;
// Lance = a written line of glyphs in a pale capsule with gold edges; Pages = a folded page with a glyph, ink trail out, dotted curl home.
// Units: du, origin = orb centre, heading +x (tail / lance), y down. Glyphs stay upright (readable); only the tail / lance turn with the heading.
import { part, glow, circ, poly, line, f, resetAll, defs, setGrainBox, mix } from '../husk/paint.js';
import { RIM_DEFS, GOLD, GOLD_HOT, RIM_SOFT, RIM_HOT } from './wolf.js';

export const WARM = '#fff1c8';
// role colour cyan #7ff0ff (locked); ink = the dark tinted outline / tail
export const R = { lt: '#effeff', c: '#7ff0ff', dk: '#2cb6cf', ink: '#145a72', glow: '#7ff0ff' };
// five invented letter-glyphs (not a real alphabet), cream strokes on a 14 x 14 box centred on 0,0
export const GLYPHS = [
  'M-5 -5 Q0 -1 5 -5 M0 -2 V6 M-3 6 H3',
  'M-5 5 Q-4 -6 0 -6 Q4 -6 5 5 M0 -1 V3',
  'M0 -6 V6 M-5 -2 Q0 2 5 -2',
  'M-5 -4 H5 M-3 -4 Q-3 4 3 6 M3 -4 V1',
  'M-5 -4 L0 5 L5 -4 M-3 -6 H3',
];
export const ORB_R = 10; // du (orb body radius; the ink outline adds 2.2)
export const GLYPH_BOX = [-16, -16, 32, 32]; // orb / page frames (64 texels: 2 per du); rim overlay and Low flat 48 texels
export const TAIL_BOX = [-44, -10, 46, 20]; // tail frames 74 x 32 (1.6 per du); anchor = the orb centre (x 44 / 46)
export const LANCE_LEN = 160; // du: capsule from x 0 (tail end) to the rounded head at x 166
export const LANCE_BOX = [-6, -14, 176, 28]; // 144 x 23 texels (0.82 per du); anchor = the head tip (x 172 / 176)
export const TORN_BOX = [-24, -24, 48, 48]; // 48 x 48 texels (1 per du)
// World size: ORB_R du -> 2.5 u at 1.0x = a 12 px orb on the 1280x720 desktop (zoom 2.4). GLYPH_K = the render size picked by the S5 gem-confusion
// check (1.0x 12 px vs 1.3x 16 px); see docs/LOCKED.md 'S5 BUILT'.
export const GLYPH_WPD = 2.5 / ORB_R;
export const GLYPH_K = 1.3;
export const LANCE_U = 34; // world units: drawn lance length (as today's lance body)

const SP = (d, o = {}) => part(d, o.col || R.c, { lw: 2.2, rim: 1.6, rimA: 0.9, rimC: WARM, grain: 0, shA: 0.3, sh: 2, lt: o.lt || R.lt, dk: o.dk || R.dk, ink: o.ink || R.ink, ...o });
const G = (x, y, rx, ry, col, a = 0.6) => glow(x, y, rx, ry, col, a);
export const glyphPath = (i, x, y, s, col, w = 2.2) => `<path d="${GLYPHS[((i % GLYPHS.length) + GLYPHS.length) % GLYPHS.length]}" transform="translate(${f(x)},${f(y)}) scale(${f(s)})" stroke="${col}" stroke-width="${f(w / s)}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;

// the orb: soft cyan glow, cyan body with the dark ink rim and a warm top-left rim light, pale inner disc, ink-shadowed cream glyph
export function orbSvg(i = 0, { glowA = 0.55 } = {}) {
  let b = G(0, 0, 16, 16, R.glow, glowA);
  b += SP(circ(0, 0, ORB_R), { lt: '#ffffff' }) + `<circle r="7" fill="${mix(R.c, '#ffffff', 0.5)}" opacity=".6"/>`;
  b += glyphPath(i, 0.3, 0.4, 0.95, R.ink, 3.6) + glyphPath(i, -0.2, -0.3, 0.95, WARM, 1.9);
  return b;
}
// gold rim overlay (evolved glyphs only): a 2.6 du soft band and a 1.1 du hot line just outside the ink outline (same widths as the grim filter)
export function rimSvg() {
  const r0 = ORB_R + 2.2;
  return `<circle r="${f(r0 + RIM_SOFT / 2)}" fill="none" stroke="${GOLD}" stroke-width="${f(RIM_SOFT)}" opacity=".8" filter="url(#blur1)"/>`
    + `<circle r="${f(r0 + RIM_HOT / 2)}" fill="none" stroke="${GOLD_HOT}" stroke-width="${f(RIM_HOT)}"/>`;
}
// curling ink tail behind the orb (heading +x); curl > 0 bends it toward +y (the frame is flipped for the other side)
export function tailSvg(curl = 0) {
  const len = 38, p = curl ? [[-6, 0], [-len * 0.35, curl * 0.4], [-len * 0.7, curl], [-len, curl * 0.4 - 4]] : [[-6, 0], [-len * 0.35, 1.8], [-len * 0.7, -1.8], [-len, 1.2]]; // straight = a gentle ink S-wave (a ruler-straight line with an end dot read as a key)
  return `<path d="${line(p)}" stroke="${R.glow}" stroke-width="9" fill="none" opacity=".35" stroke-linecap="round" filter="url(#blur3)"/>`
    + `<path d="${line(p)}" stroke="${R.ink}" stroke-width="3.6" fill="none" opacity=".9" stroke-linecap="round"/>`
    + `<path d="${line(p.slice(0, 3))}" stroke="${R.c}" stroke-width="1.4" fill="none" opacity=".9" stroke-linecap="round"/>`
    + (curl ? `<circle cx="${f(-len * 0.88)}" cy="${f(curl * 0.7 - 6)}" r="1.8" fill="${R.ink}" opacity=".75"/>` : '');
}
// Returning Pages: a folded page (cream out, paler cool cream on the way home) with an ink glyph and gold edges (evolved weapon only)
export function pageSvg(back = false, i = 2) {
  let b = G(0, 0, 16, 15, R.glow, back ? 0.35 : 0.55);
  b += `<g transform="rotate(${back ? 8 : -10})">` + SP(poly([[-8, -10], [5, -10], [9, -6], [9, 10], [-8, 10]]), { col: back ? '#e4f1f7' : '#fbf3df', lt: '#ffffff', dk: '#e0d0ae', sh: 2, rim: 0, lw: 2 })
    + `<path d="M5 -10 V-6 H9" fill="#e3d4b2" stroke="${R.ink}" stroke-width="1.2"/>` + glyphPath(i, 0, 1, 0.7, R.dk, 2.4)
    + `<path d="M-9.6 -11.4 H5.8 L10.6 -6.6 V11.2 H-9.6Z" fill="none" stroke="${GOLD}" stroke-width="${f(RIM_HOT + 0.3)}" opacity=".95"/></g>`;
  return b;
}
// Soul Lance: a written line of glyphs inside a pale capsule, ink outline, gold edges (replaces the bare laser line)
export function lanceSvg() {
  const L = LANCE_LEN;
  let b = `<path d="M6 0 H${L - 4}" stroke="${R.glow}" stroke-width="12" opacity=".3" stroke-linecap="round" filter="url(#blur1)"/>`; // soft glow kept inside the 28 du frame (a wider blur was clipped into a visible box)
  const cap = `M4 -6 H${L - 6} Q${L + 6} 0 ${L - 6} 6 H4 Q-2 0 4 -6Z`;
  b += SP(cap, { col: '#e8fdff', lt: '#ffffff', dk: R.c, sh: 1, rim: 0, lw: 1.6, dir: [0, 0, 0, 1] });
  for (let k = 0; k * 12 + 12 < L - 12; k++) b += glyphPath(k + 1, 12 + k * 12, 0, 0.5, R.dk, 1.7);
  b += `<path d="M4 -7.8 H${L - 6} Q${L + 8} 0 ${L - 6} 7.8 H4" fill="none" stroke="${GOLD}" stroke-width="${f(RIM_HOT + 0.4)}" opacity=".95"/>`;
  return b;
}
// Spirit Tempest: the torn page the 8 glyphs burst out of (shown at the hero for the volley's 0.24 s burst; fades only)
export function tornSvg() {
  let b = G(0, 0, 22, 20, R.glow, 0.5);
  const sheet = [[-11, -13], [-3, -12], [0, -15], [4, -11], [11, -13], [10, -4], [13, 2], [9, 7], [11, 13], [2, 11], [-2, 14], [-6, 10], [-12, 12], [-10, 3], [-13, -4]];
  b += SP(poly(sheet), { col: '#fbf3df', lt: '#ffffff', dk: '#e0d0ae', sh: 2, rim: 0, lw: 2 });
  b += `<path d="M-6 -6 L5 4 M-3 6 L4 -5" stroke="${R.ink}" stroke-width="1.4" stroke-linecap="round" opacity=".7"/>`; // the tear
  b += glyphPath(1, -5, -4, 0.45, R.dk, 1.8) + glyphPath(3, 5, 5, 0.45, R.dk, 1.8);
  b += `<path d="M-11.6 -13.8 L-3 -12.8 L0 -15.8 L4 -11.8 L11.8 -13.8" fill="none" stroke="${GOLD}" stroke-width="1.2" opacity=".9"/>`;
  return b;
}

// bake kinds -> [frame names, box, painter(index)]
export const KIND = {
  gbase: (i) => (i < 5 ? orbSvg(i) : tailSvg(i === 5 ? 0 : 9)),
  gflat: () => orbSvg(0, { glowA: 0.75 }),
  grim: () => rimSvg(),
  gtorn: () => tornSvg(),
  gpage: (i) => pageSvg(i === 1),
  glance: () => lanceSvg(),
};
export const BOX_OF = (name) => (name.startsWith('gtail_') ? TAIL_BOX : name.startsWith('lance_') ? LANCE_BOX : name === 'gtorn' ? TORN_BOX : GLYPH_BOX);
// One SVG sheet holding the given glyph frames (page coordinates relative to the sheet). frames: [{ name, x, y, w, h, kind, i }].
export function glyphSheet(frames, pageW, pageH) {
  resetAll();
  setGrainBox(-64, -16, 240, 32);
  let body = '';
  for (const fr of frames) body += `<svg x="${fr.x}" y="${fr.y}" width="${fr.w}" height="${fr.h}" viewBox="${BOX_OF(fr.name).join(' ')}" overflow="hidden">${KIND[fr.kind](fr.i)}</svg>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${pageW}" height="${pageH}" viewBox="0 0 ${pageW} ${pageH}">${defs()}<defs>${RIM_DEFS}</defs>${body}</svg>`;
}
// Per-tier caps (docs/design/summons-art-v1.md section 5): tails ride the summon-body cap (none on Low: 'Low = orb only'), gold rims 40 / 24 / 12.
export const GLYPH_CAPS = { high: { tails: 40, rims: 40 }, med: { tails: 28, rims: 24 }, low: { tails: 0, rims: 12 } };

// Render look per bolt (pure; reads the sim projectile, never writes it). s = per-bolt render state. Tail curls toward the side the glyph is turning
// (smoothed turn rate with hysteresis, so it never flickers); Calm motion: always the straight tail. Returns { fr, tail, flipY, rot }.
export const CURL_ON = 1.2, CURL_OFF = 0.6; // rad/s of smoothed heading turn
export function glyphLook(s, b, dt, calm = false) {
  const ang = Math.atan2(b.vy ?? Math.sin(b.ang || 0), b.vx ?? Math.cos(b.ang || 0));
  if (s.ang === undefined) { s.ang = ang; s.turn = 0; s.side = 0; }
  let d = ang - s.ang; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI;
  s.ang = ang;
  if (dt > 0) s.turn += (d / dt - s.turn) * Math.min(1, dt * 10);
  const a = Math.abs(s.turn);
  if (s.side === 0 ? a > CURL_ON : a < CURL_OFF) s.side = s.side === 0 ? Math.sign(s.turn) : 0;
  const curl = !calm && s.side !== 0;
  const i = Math.abs(b.id | 0) % GLYPHS.length;
  return { fr: 'glyph_' + i, tail: curl ? 'gtail_1' : 'gtail_0', flipY: curl && s.side < 0, rot: ang };
}
