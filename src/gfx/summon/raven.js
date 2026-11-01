// S3 Raven A "Letter Ravens" (LOCKED Summons art #3, docs/design/summons-art-v1.md 3.2): game port of the mock-up painter
// docs/mockups/summons-art/ravens.mjs ravenA on the shared Husk paint engine. Pure JS: builds SVG strings only (no DOM); atlas.js rasterises them
// lazily (first time the flock is owned; gold frames on first evolution) into the raven frames of `sum_atlas`.
// Look: round chibi violet raven, big head, short pale beak, warm-grey LETTER-PAPER wing tips with ink lines (#cdbd9c, BL1; was #efe1c0; never white), warm wax-seal ember
// on the chest; light body + dark tinted ink outline (value-inverse of the near-black Grave Crow, cream/ink eye, never red).
// Units: du, origin = body centre (flyer), facing +x, y up negative. Frame box = RAVEN_BOX (64 texels for 88 du).
// Game change vs the mock-up: no grain, no swoop/dive streak and no peck star inside the frame (the scene draws the wake; hit stars are S7).
import { part, blob, limb, glow, circ, f, resetAll, defs, setGrainBox } from '../husk/paint.js';
import { RIM_DEFS } from './wolf.js';

export const WARM = '#fff1c8', EMBER = '#ffcf7a', SEAL_INK = '#b5762a';
export const PAPER = '#cdbd9c', PAPER_FAR = '#b3a586'; // letter-paper tips: warm grey (BL1, Matt 2026-10-23: darker than the old #efe1c0 so the tips separate from the cream lantern pool), never white (not numbers / pickups)
// mock-up palette (ROLE.raven) with the body lifted a little (the High bloom pulls small bright sprites down, as on the wolves)
export const R = { lt: '#faf7ff', c: '#d9caff', dk: '#b9a5f7', ink: '#34236e', glow: '#b79cff', wing: '#e3d8ff' };
export const RAVEN_BOX = [-44, -44, 88, 88];
export const RAVEN_LEN_DU = 65; // tail tip (-34) to beak tip (+31) on the level poses
// world units per du: 12.5 u long = 30 px on the 1280x720 desktop (zoom 2.4), LOCKED decision 2 'ravens ~30 px'
export const RAVEN_WPD = 12.5 / RAVEN_LEN_DU;
export const LEAD_K = 1.2; // Spearhead lead raven drawn 1.2x (render only)
export const POSES = ['perch', 'up', 'down', 'swoop', 'peck', 'spread', 'dive'];
export const GOLD_POSES = ['perch', 'up', 'down', 'swoop', 'spread', 'dive']; // evolved units never peck (Talon strikes once, ring/lead fly)
export const BAKED_ROT = { perch: 0, up: 0, down: 0, swoop: 28, peck: 22, spread: 0, dive: 78 }; // degrees baked into the frame
export const LOW_POSE = 'up';

const SP = (d, o = {}) => part(d, o.col || R.c, { lw: 1.9, rim: 2.4, rimA: 0.9, rimC: WARM, grain: 0, shA: 0.22, sh: 4, lt: o.lt || R.lt, dk: o.dk || R.dk, ink: o.ink || R.ink, ...o });
const G = (x, y, rx, ry, col, a = 0.6) => glow(x, y, rx, ry, col, a);
const sEye = (x, y, r) => `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(r * 0.8)}" ry="${f(r)}" fill="${R.ink}"/><ellipse cx="${f(x - r * 0.25)}" cy="${f(y - r * 0.35)}" rx="${f(r * 0.32)}" ry="${f(r * 0.36)}" fill="${WARM}"/>`;
// wing = a fan of 4 rounded primaries from the shoulder; the last third of each is cream LETTER PAPER with an ink line
const FAN = { up: [[-148, 27], [-135, 32], [-121, 31], [-107, 25]], down: [[156, 25], [142, 30], [128, 29], [114, 23]], spread: [[-172, 31], [-158, 36], [-143, 35], [-128, 28]], fold: [[176, 26], [168, 29], [160, 25], [152, 20]] };
export const isFolded = (p) => p === 'perch' || p === 'swoop' || p === 'peck' || p === 'dive';

function wing(p, far, tips) {
  const fan = FAN[isFolded(p) ? 'fold' : p] || FAN.up, k = far ? 0.82 : 1, sx = far ? 6 : 2, sy = far ? -8 : (isFolded(p) ? -3 : -6), col = far ? R.wing : R.c;
  let s = '';
  fan.slice().reverse().forEach(([deg, L], i) => {
    const a = deg * Math.PI / 180, ex = sx + Math.cos(a) * L * k, ey = sy + Math.sin(a) * L * k, mx = sx + Math.cos(a) * L * k * 0.7, my = sy + Math.sin(a) * L * k * 0.7;
    s += SP(limb(sx, sy, ex, ey, 7.6 * k, 3.8 * k, 0), { col: i % 2 ? col : (far ? R.c : R.wing), sh: 2, rim: far ? 0 : 1.6, lw: 1.5 });
    s += SP(limb(mx, my, ex, ey, 4 * k, 3.4 * k, 0), { col: far ? tips.far : tips.near, lt: tips.lt, dk: tips.dk, sh: 1, rim: 0, lw: 1.3 });
    if (!far) s += `<path d="M${f(mx + Math.cos(a) * 2 - Math.sin(a) * 1.4)} ${f(my + Math.sin(a) * 2 + Math.cos(a) * 1.4)} l${f(Math.cos(a) * 4)} ${f(Math.sin(a) * 4)}" stroke="${R.ink}" stroke-width=".9" opacity=".8"/>`;
  });
  return s;
}
// paper tips (LOCKED) / violet-tinted fallback (if the paper ever fails the 'not numbers / pickups' check)
export const TIPS = { paper: { near: PAPER, far: PAPER_FAR, lt: '#e2d6bb', dk: '#b29f7c' }, violet: { near: '#ddd0ff', far: '#b8a6e8', lt: '#efe8ff', dk: '#a993e6' } };

export function ravenSvg(st = {}) {
  const p = st.pose || 'up', tips = TIPS[st.tips || 'paper'];
  const folded = isFolded(p);
  let b = G(0, 0, 34, 26, R.glow, 0.42);
  const rot = BAKED_ROT[p] || 0;
  let g = '';
  // tail fan with three cream paper tick ends
  g += SP(blob([[-12, 2], [-26, -2], [-30, 4], [-26, 9], [-12, 8]]), { col: R.wing, sh: 1 }) + `<path d="M-28 1 l-4 -1 M-29 5 l-5 1 M-27 8 l-4 3" stroke="${tips.near}" stroke-width="1.8" stroke-linecap="round" opacity=".9"/>`;
  if (!folded) g += wing(p, 1, tips);
  g += SP(blob([[14, -2], [10, -12], [-2, -14], [-14, -8], [-16, 2], [-8, 10], [6, 10]]), { sh: 4, lt: '#f8f4ff', tex: '<path d="M-12 -4 Q-2 -12 8 -9" stroke="#ffffff" stroke-width="2" fill="none" opacity=".55" stroke-linecap="round"/>' });
  // warm wax-seal ember on the chest (the friendly warm heart)
  g += G(8, 4, 8, 7, EMBER, 0.7) + `<circle cx="8" cy="4" r="3.8" fill="${EMBER}" stroke="${SEAL_INK}" stroke-width="1.3"/><path d="M6.3 4 h3.4 M8 2.3 v3.4" stroke="${SEAL_INK}" stroke-width="1"/>`;
  if (folded) g += wing(p, 0, tips);
  const hx = p === 'peck' ? 18 : 14, hy = p === 'peck' ? -4 : -14;
  g += SP(blob([[hx - 6, hy - 9], [hx - 2, hy - 15], [hx + 1, hy - 11]]), { col: R.dk, sh: 1, rim: 0 }); // crest tuft
  g += SP(circ(hx, hy, 11), { sh: 4, lt: '#ffffff' });
  // short pale beak
  g += SP(`M${f(hx + 8)} ${f(hy - 2.5)} Q${f(hx + 14)} ${f(hy - 1)} ${f(hx + 17)} ${f(hy + 1.5)} Q${f(hx + 13)} ${f(hy + 3.5)} ${f(hx + 8)} ${f(hy + 4)}Z`, { col: '#ece2f6', lt: '#ffffff', dk: '#b9a6d6', sh: 1, rim: 1, lw: 1.8 });
  g += sEye(hx + 3, hy - 2, 3.4);
  g += `<ellipse cx="${f(hx - 3)}" cy="${f(hy + 4)}" rx="3" ry="1.8" fill="${EMBER}" opacity=".35"/>`;
  if (!folded) g += wing(p, 0, tips);
  b += `<g transform="rotate(${rot})">${g}</g>`;
  return b;
}
export const goldRavenSvg = (st = {}) => `<g filter="url(#grim)">${ravenSvg(st)}</g>`;

// per bake kind: painter(index) (index into POSES / GOLD_POSES)
export const KIND = {
  rbase: (i) => ravenSvg({ pose: POSES[i] }),
  rgold: (i) => goldRavenSvg({ pose: GOLD_POSES[i] }),
  rflat: () => ravenSvg({ pose: LOW_POSE }),
  rflatg: () => goldRavenSvg({ pose: LOW_POSE }),
};
// One SVG sheet holding the given raven frames (page coordinates relative to the sheet). frames: [{ x, y, w, h, kind, i }].
export function ravenSheet(frames, pageW, pageH) {
  resetAll();
  setGrainBox(RAVEN_BOX[0], RAVEN_BOX[1], RAVEN_BOX[2], RAVEN_BOX[3]);
  let body = '';
  for (const fr of frames) body += `<svg x="${fr.x}" y="${fr.y}" width="${fr.w}" height="${fr.h}" viewBox="${RAVEN_BOX.join(' ')}" overflow="hidden">${KIND[fr.kind](fr.i)}</svg>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${pageW}" height="${pageH}" viewBox="0 0 ${pageW} ${pageH}">${defs()}<defs>${RIM_DEFS}</defs>${body}</svg>`;
}

// Canvas decals (painted with the boot atlas, cheap 2D): a loose paper feather (Wall of Wings ring) and a violet wax-seal disc (Talon Mark omen;
// the locked violet chevron is drawn on top of it by the scene). Centred in their 48 x 48 frames.
const TAU = Math.PI * 2;
export function featherDecal(c, fr, ox, oy) {
  const cx = ox + fr.w / 2, cy = oy + fr.h / 2, s = fr.w / 48;
  c.save(); c.translate(cx, cy); c.rotate(-0.5); c.scale(s, s);
  const vane = () => { c.beginPath(); c.moveTo(0, -18); c.quadraticCurveTo(8, -8, 5, 10); c.quadraticCurveTo(2, 15, 0, 16); c.quadraticCurveTo(-6, 8, -5, -4); c.quadraticCurveTo(-4, -13, 0, -18); c.closePath(); };
  vane(); c.lineWidth = 3.2; c.strokeStyle = R.ink; c.lineJoin = 'round'; c.stroke();
  vane(); c.fillStyle = PAPER; c.fill();
  c.beginPath(); c.moveTo(0, 16); c.quadraticCurveTo(-4, 8, -2, -4); c.quadraticCurveTo(-1, -12, 0, -18); c.lineTo(5, 4); c.quadraticCurveTo(4, 12, 0, 16); c.fillStyle = 'rgba(194,171,255,0.55)'; c.fill(); // violet lower vane (still one of the flock)
  c.strokeStyle = R.ink; c.lineWidth = 1.1; c.globalAlpha = 0.75;
  for (const y of [-9, -3, 3]) { c.beginPath(); c.moveTo(0.5, y); c.lineTo(4, y - 3); c.stroke(); }
  c.globalAlpha = 1; c.beginPath(); c.moveTo(0, 21); c.quadraticCurveTo(-1, 0, 0, -17); c.lineWidth = 1.4; c.stroke(); // quill
  c.restore();
}
export function waxSealDecal(c, fr, ox, oy) {
  const cx = ox + fr.w / 2, cy = oy + fr.h / 2, s = fr.w / 48;
  const edge = (r, bump) => { c.beginPath(); for (let i = 0; i <= 48; i++) { const a = (i / 48) * TAU, rr = (r + Math.sin(a * 7) * bump + Math.sin(a * 3 + 1) * bump * 0.6) * s; if (i) c.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); else c.moveTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); } c.closePath(); };
  edge(21, 1.2); c.fillStyle = '#1e1530'; c.fill(); // ink outline
  edge(19, 1.2); const g = c.createRadialGradient(cx - 5 * s, cy - 6 * s, 2 * s, cx, cy, 20 * s); g.addColorStop(0, '#6a50b8'); g.addColorStop(1, '#3a2a6e'); c.fillStyle = g; c.fill(); // violet wax
  c.beginPath(); c.arc(cx, cy, 13 * s, 0, TAU); c.lineWidth = 2 * s; c.strokeStyle = 'rgba(30,21,48,0.75)'; c.stroke(); // pressed ring
  c.beginPath(); c.arc(cx - 6 * s, cy - 8 * s, 5 * s, Math.PI * 1.05, Math.PI * 1.75); c.lineWidth = 2.2 * s; c.strokeStyle = 'rgba(255,241,200,0.55)'; c.stroke(); // warm lit rim
}
