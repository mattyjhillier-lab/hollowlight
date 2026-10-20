// SUMMONS ART sheet #3: code-drawn spirit creatures + effects, three options per weapon (mock-up drawing code only, NOT game code).
// Hollowlight Style v1 for FRIENDLY spirits: L2 tinted outline (a deep shade of the role colour, never black) + H2 soft gradient with a WARM
// lantern rim (enemies get cold rims) + P1 chibi proportions + G1/G2 glow and trails. Spirits are LIGHT bodies (high value) with a warm
// ember heart; Husk enemies are dark bodies with pale bark masks and red-orange eyes: value inversion is the friend/foe read.
// Units: design units (du), 4 du = 1 world unit. Origin = ground under the feet (or the centre for flyers/lights), facing +x, y up negative.
// Every fn(st) returns an svg string. st: { ph run phase 0..1, pose, v variant, evo, gold }.
import { part, rod, blob, line, poly, ell, circ, limb, glow, mix, rng, furry, tuft, lin, rad, f, TAU, addDef, nid, tick } from '../enemies-art2/paint.mjs';
export { f, TAU, mix, glow };

export const WARM = '#fff1c8', EMBER = '#ffcf7a', GOLD = '#ffd36b', GOLDHOT = '#fff3c4';
export const ROLE = {
  wolf: { lt: '#f2faff', c: '#a9dcff', dk: '#5f9fd6', ink: '#2c5a92', glow: '#9fd8ff' },
  raven: { lt: '#efe8ff', c: '#b79cff', dk: '#7458d0', ink: '#34236e', glow: '#b79cff' },
  bolt: { lt: '#effeff', c: '#7ff0ff', dk: '#2cb6cf', ink: '#145a72', glow: '#7ff0ff' },
  chain: { core: '#ffffff', c: '#b8f2ff', glow: '#7fdcff', fringe: '#9a7cff' },
  orbit: { lt: '#fbf8ff', c: '#e8e0ff', dk: '#a996e8', ink: '#5b4a9e', glow: '#d9ccff', burn: '#c79bff' },
};
// friendly painter: warm rim, tinted ink, light grain only
export const SP = (d, R, o = {}) => part(d, o.col || R.c, { lw: 2.6, rim: 2.4, rimA: 0.9, rimC: WARM, grain: 0.035, shA: 0.35, sh: 4, lt: o.lt || R.lt, dk: o.dk || R.dk, ink: o.ink || R.ink, ...o });
// faint tinted rod
export const SR = (d, R, w = 4, o = {}) => rod(d, o.col || R.c, w, { lw: 2.2, ink: R.ink, ...o });
// filters used by the sheets (gold evolution rim, hollow echo look, Low-tier flat bake, reduced-detail)
export const SPIRIT_DEFS = `
<filter id="goldRim" x="-30%" y="-30%" width="160%" height="160%"><feMorphology in="SourceAlpha" operator="dilate" radius="2.6" result="d"/><feFlood flood-color="${GOLD}"/><feComposite in2="d" operator="in" result="g"/><feComposite in="g" in2="SourceAlpha" operator="out" result="r"/><feGaussianBlur in="r" stdDeviation="1.4" result="rb"/><feMorphology in="SourceAlpha" operator="dilate" radius="1.1" result="d2"/><feFlood flood-color="${GOLDHOT}"/><feComposite in2="d2" operator="in" result="h"/><feComposite in="h" in2="SourceAlpha" operator="out" result="hr"/><feMerge><feMergeNode in="rb"/><feMergeNode in="hr"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
<filter id="hollowF" x="-20%" y="-20%" width="140%" height="140%"><feMorphology in="SourceAlpha" operator="erode" radius="2.4" result="e"/><feComposite in="SourceAlpha" in2="e" operator="out" result="edge"/><feFlood flood-color="#e6f6ff"/><feComposite in2="edge" operator="in" result="line"/><feGaussianBlur in="line" stdDeviation="0.6" result="lb"/><feComponentTransfer in="SourceGraphic" result="ghost"><feFuncA type="linear" slope="0.28"/></feComponentTransfer><feMerge><feMergeNode in="ghost"/><feMergeNode in="lb"/></feMerge></filter>
<filter id="flatF" x="-10%" y="-10%" width="120%" height="120%"><feComponentTransfer><feFuncR type="discrete" tableValues="0 .2 .4 .6 .8 1"/><feFuncG type="discrete" tableValues="0 .2 .4 .6 .8 1"/><feFuncB type="discrete" tableValues="0 .2 .4 .6 .8 1"/></feComponentTransfer></filter>
<filter id="blur1" filterUnits="userSpaceOnUse" x="-3000" y="-3000" width="6000" height="6000"><feGaussianBlur stdDeviation="1.2"/></filter>
<filter id="blur3" filterUnits="userSpaceOnUse" x="-3000" y="-3000" width="6000" height="6000"><feGaussianBlur stdDeviation="3"/></filter>
`;
export const G = (x, y, rx, ry, col, a = 0.6) => glow(x, y, rx, ry, col, a);
const motes = (n, cx, cy, rx, ry, col, seed = 3, r0 = 1.6) => { const q = rng(seed); let s = ''; for (let i = 0; i < n; i++) { const x = cx + (q() - 0.5) * rx * 2, y = cy + (q() - 0.5) * ry * 2, r = r0 * (0.5 + q()); s += G(x, y, r * 3, r * 3, col, 0.5) + `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r * 0.55)}" fill="${WARM}" opacity=".9"/>`; } return s; };
export { motes };
// mist leg: tapered limb filled with the body colour fading to nothing at the paw (spirits have no ink socks: they fade to mist)
function mistLeg(x1, y1, x2, y2, r1, r2, R, a = 1) {
  const d = limb(x1, y1, x2, y2, r1, r2, 0);
  return `<path d="${d}" fill="url(#${lin([[0, R.c, 0.95 * a], [0.55, R.c, 0.6 * a], [1, R.glow, 0]], [0, 0, 0, 1])})"/>`
    + `<path d="${limb(x1, y1, x1 + (x2 - x1) * 0.45, y1 + (y2 - y1) * 0.45, r1, (r1 + r2) / 2, 0)}" fill="none" stroke="${R.ink}" stroke-width="2" opacity=".55"/>`
    + G(x2, y2 - 1, r2 * 2.6, r2 * 1.3, R.glow, 0.35 * a);
}
// ember heart: the warm lantern light every spirit carries (its tie to the hero)
export const heart = (x, y, s = 1, a = 1) => G(x, y, 9 * s, 8 * s, EMBER, 0.75 * a) + `<path d="M${f(x)} ${f(y + 2.6 * s)} c${f(-3.8 * s)} ${f(-2.6 * s)} ${f(-3.2 * s)} ${f(-6 * s)} 0 ${f(-4.6 * s)} c${f(3.2 * s)} ${f(-1.4 * s)} ${f(3.8 * s)} ${f(2 * s)} 0 ${f(4.6 * s)}Z" fill="${WARM}" opacity="${f(0.95 * a)}"/>`;
// cute spirit eye: deep tinted ink oval + cream glint (never red: red-orange belongs to enemy eyes/tells)
export const sEye = (x, y, r, R, o = {}) => (o.shut ? `<path d="M${f(x - r * 1.1)} ${f(y)} q${f(r * 1.1)} ${f(-r * 1.1)} ${f(r * 2.2)} 0" stroke="${R.ink}" stroke-width="${f(r * 0.6)}" fill="none" stroke-linecap="round"/>`
  : `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(r * 0.8)}" ry="${f(r)}" fill="${o.col || R.ink}"/><ellipse cx="${f(x - r * 0.25)}" cy="${f(y - r * 0.35)}" rx="${f(r * 0.32)}" ry="${f(r * 0.36)}" fill="${WARM}"/>`);
export const wrap = (s, st, extraFilter) => { let o = s; if (st.gold) o = `<g filter="url(#goldRim)">${o}</g>`; if (extraFilter) o = `<g filter="url(#${extraFilter})">${o}</g>`; return o; };

// =============================== 1. GHOST WOLF ===============================
// A LANTERN-HEART PACK (recommended): chibi moon-blue wolf of light, big round head, short muzzle, tall ears, plume tail streaming light,
// legs fade to mist below the knee, a warm ember heart in the chest (Wren's light it follows). Value-inverse of the dark Husk wolf.
export function wolfA(st = {}) {
  const R = ROLE.wolf, v = st.v || 0, a = (st.ph || 0) * TAU, s1 = Math.sin(a), bite = st.pose === 'bite' ? 1 : 0, sit = st.pose === 'sit';
  const alpha = st.evo === 'alpha', trail = st.evo === 'trail';
  const bob = sit ? 0 : -Math.abs(s1) * 3, by = (sit ? -24 : -26) + bob, hx = 24 + bite * 7, hy = -44 + bob * 0.6 + bite * 5;
  let b = '';
  b += G(0, -24, 50, 30, R.glow, 0.42);
  // tail: plume that streams into light
  const tw = s1 * 4 + (trail ? 6 : 0), tl = trail ? 1.4 : 1;
  b += `<path d="M-26 ${f(by - 4)} Q${f(-46 * tl)} ${f(-44 + tw)} ${f(-70 * tl)} ${f(-40 + tw * 1.4)}" stroke="${R.glow}" stroke-width="10" fill="none" opacity=".35" stroke-linecap="round" filter="url(#blur3)"/>`;
  const tail = furry([[-22, by - 2], [-34, by - 14 + tw * 0.3], [-46, -48 + tw * 0.7], [-54 - (v === 2 ? -4 : 0), -40 + tw], [-48, -32 + tw * 0.7], [-36, by + 2], [-26, by + 6]], 2.6, -1, 12 + v, [0, 1, 1, 0, 0, 0, 0], 0.7);
  b += SP(tail, R, { lt: '#ffffff', sh: 3 });
  if (v === 2) b += `<path d="M-50 ${f(-44 + tw)} q-6 -4 -2 -9" stroke="${R.lt}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
  // legs (far then near)
  const leg = (x, ph, far) => { const sw = sit ? 0 : Math.sin(ph) * 7, lift = sit ? 0 : Math.max(0, -Math.cos(ph)) * 4; return mistLeg(x, by + 6, x + sw, -2 - lift, far ? 4.6 : 5.4, far ? 3 : 3.6, far ? { ...R, c: R.dk } : R); };
  b += leg(12, a + Math.PI, 1) + leg(-16, a, 1) + leg(-12, a + Math.PI, 0) + leg(16, a, 0);
  // body bean
  const body = furry([[18, by + 9], [21, by - 3], [10, by - 12], [-8, by - 12], [-22, by - 8], [-27, by + 2], [-20, by + 10], [0, by + 11]], 2.2, -1, 5 + v, [0, 0, 1, 1, 0, 0, 0, 0], 0.6);
  b += SP(body, R, { sh: 5, tex: `<ellipse cx="-4" cy="${f(by + 10)}" rx="24" ry="5" fill="${R.dk}" opacity=".45" filter="url(#sb2)"/><path d="M-24 ${f(by - 2)} Q-8 ${f(by - 12)} 10 ${f(by - 9)}" stroke="#ffffff" stroke-width="2.4" fill="none" opacity=".6" stroke-linecap="round"/>` });
  // alpha frost mane of drifting light
  if (alpha) { const q = rng(9); for (let i = 0; i < 9; i++) { const x = 12 - i * 4.4, y = by - 10 + i * 0.6; b += tick(x, y, 12 + q() * 6, -2.3 - q() * 0.4, 2.4, i % 2 ? '#e8f7ff' : R.c, 0.85); } }
  // chest ruff
  b += SP(blob([[hx - 18, hy + 10], [hx - 6, hy + 15], [hx - 2, hy + 24], [hx - 10, by + 10], [hx - 22, by + 4]]), R, { col: '#d9f0ff', sh: 2, tex: `<path d="M${f(hx - 14)} ${f(hy + 16)} l3 4 M${f(hx - 9)} ${f(hy + 19)} l2 4" stroke="${R.dk}" stroke-width="1.4" stroke-linecap="round" opacity=".6"/>` });
  if (v === 1) b += tick(hx - 9, hy + 24, 8, 1.9, 2, '#ffffff', 0.8);
  // head: big round chibi head, ears on top, short muzzle
  const H = 19, ear = (dx, far) => { const back = (trail ? 9 : 0) + (bite ? 6 : 0), s0 = far ? 0.8 : 1;
    const tip = v === 1 && !far ? [[hx + dx - back * 0.6 - 1, hy - H - 15], [hx + dx - back * 0.6 + 2, hy - H - 11], [hx + dx - back * 0.6 + 4, hy - H - 16]] : [[hx + dx - back * 0.6, hy - H - 18 * s0]];
    return SP(blob([[hx + dx - 9 * s0, hy - H + 7], [hx + dx - 8 * s0, hy - H - 4], ...tip, [hx + dx + 7 * s0, hy - H - 2], [hx + dx + 8 * s0, hy - H + 8]]), R, { col: far ? R.dk : R.c, sh: 2, rim: far ? 0 : 2,
      tex: far ? '' : `<path d="${blob([[hx + dx - 4, hy - H + 6], [hx + dx - 3, hy - H - 4], [hx + dx - back * 0.55 + 0.5, hy - H - 12], [hx + dx + 3, hy - H - 2], [hx + dx + 3.5, hy - H + 6]])}" fill="${mix(EMBER, R.c, 0.45)}" opacity=".7" filter="url(#sb1)"/>` }); };
  b += ear(-9, 1);
  b += SP(furry([[hx - 18, hy + 6], [hx - 19, hy - 6], [hx - 12, hy - 16], [hx, hy - 19], [hx + 12, hy - 16], [hx + 18, hy - 6], [hx + 17, hy + 6], [hx + 8, hy + 15], [hx - 8, hy + 15]], 2.6, -1, 31 + v, [1, 0, 0, 0, 0, 0, 0, 1, 1], 0.5), R, { sh: 6, lt: '#ffffff' });
  b += ear(5, 0);
  const mx = hx + 15, my = hy + 6, bo = bite ? 2 : 0;
  if (bite) b += `<path d="M${f(mx - 6)} ${f(my + 2)} Q${f(mx + 6)} ${f(my + 13)} ${f(mx + 12)} ${f(my + 7)} L${f(mx + 4)} ${f(my + 4)}Z" fill="${R.ink}"/>` + SP(ell(mx + 1, my + 10, 7, 3), R, { sh: 1, rim: 1 });
  b += SP(ell(mx, my - bo, 9.5, 6.6), R, { col: '#e6f5ff', sh: 2, lt: '#ffffff', lw: 2.2 });
  b += `<ellipse cx="${f(mx + 8.4)}" cy="${f(my - 3 - bo)}" rx="3.2" ry="2.5" fill="${R.ink}"/><ellipse cx="${f(mx + 7.6)}" cy="${f(my - 4 - bo)}" rx="1" ry=".8" fill="#fff"/>`;
  if (!bite) b += `<path d="M${f(mx - 3)} ${f(my + 3)} q3.4 2.6 7 0.4" stroke="${R.ink}" stroke-width="1.6" fill="none" stroke-linecap="round" opacity=".8"/>`;
  b += sEye(hx + 5, hy - 2, 4, R, { col: alpha ? '#b8742a' : R.ink, shut: sit && v === 2 });
  b += `<ellipse cx="${f(hx - 5)}" cy="${f(hy + 6)}" rx="4.4" ry="2.6" fill="${EMBER}" opacity=".35"/>`;
  // ember heart on the chest, in front of the ruff
  b += heart(hx - 8, hy + 22, alpha ? 1.3 : 1.05);
  if (bite) b += crescents(hx + 32, hy + 6, 1, R);
  return wrap(b, st);
}
// bite = two crescent flashes (jaws closing)
export const crescents = (x, y, k, R) => `<g transform="translate(${f(x)},${f(y)}) scale(${k})" opacity=".95">${G(0, 0, 18, 18, R.glow, 0.5)}<path d="M-6 -12 Q8 -10 9 2 Q4 -6 -6 -6Z" fill="#ffffff"/><path d="M-6 12 Q8 10 9 -2 Q4 6 -6 6Z" fill="#ffffff"/></g>`;

// B PAPER-LANTERN WOLVES: each wolf is a folded paper lantern shaped like a wolf, lit from inside (warm glow through pale-blue paper ribs).
export function wolfB(st = {}) {
  const R = ROLE.wolf, v = st.v || 0, a = (st.ph || 0) * TAU, s1 = Math.sin(a), bob = -Math.abs(s1) * 2.4, by = -27 + bob, hx = 22 + (st.pose === 'bite' ? 6 : 0), hy = -44 + bob;
  let b = G(0, -26, 46, 30, EMBER, 0.32) + G(0, -26, 52, 32, R.glow, 0.3);
  // tassel tail with ember bead
  b += SR(`M-26 ${f(by - 2)} Q-40 ${f(by - 10 + s1 * 3)} -44 ${f(by + 4 + s1 * 3)}`, R, 3, { col: '#d8ecff' }) + `<circle cx="-44" cy="${f(by + 8 + s1 * 3)}" r="3.4" fill="${EMBER}" stroke="#b07a2a" stroke-width="1.2"/>`;
  for (let i = 0; i < 4; i++) b += `<path d="M-44 ${f(by + 11 + s1 * 3)} l${f(-2 + i * 1.4)} 9" stroke="#d8ecff" stroke-width="1.4" opacity=".8"/>`;
  // legs: short paper tubes with dark rims (stiff hop)
  for (const [x, ph] of [[12, a + Math.PI], [-16, a], [-12, a + Math.PI], [16, a]]) { const sw = Math.sin(ph) * 4; b += SP(`M${f(x - 3.5)} ${f(by + 6)} L${f(x - 3.2 + sw)} -2 L${f(x + 3.2 + sw)} -2 L${f(x + 3.5)} ${f(by + 6)}Z`, R, { col: '#cfe6fa', sh: 1, rim: 0 }) + `<path d="M${f(x - 3.4 + sw)} -2.6 h7" stroke="${R.ink}" stroke-width="2"/>`; }
  // body: rounded lantern with rib bands + inner warm light
  const body = blob([[20, by + 8], [22, by - 6], [8, by - 14], [-12, by - 14], [-26, by - 8], [-28, by + 4], [-14, by + 11], [6, by + 11]]);
  b += SP(body, R, { col: '#d6ecff', lt: '#ffffff', dk: '#8fbde6', sh: 3, tex: G(-4, by - 2, 26, 12, EMBER, 0.8) + G(-4, by - 2, 12, 7, WARM, 0.9) + [-18, -8, 2, 12].map((x) => `<path d="M${x} ${f(by - 14)} Q${x + 3} ${f(by - 1)} ${x} ${f(by + 12)}" stroke="${R.ink}" stroke-width="1.6" fill="none" opacity=".55"/>`).join('') });
  b += `<path d="M-14 ${f(by - 15)} h20" stroke="${R.ink}" stroke-width="3" stroke-linecap="round"/>`; // top rim
  // head: rounded box lantern, paper-fold ears
  b += SP(poly([[hx - 6, hy - 14], [hx + 2, hy - 30], [hx + 6, hy - 14]]), R, { col: '#c9e2f8', sh: 1, tex: `<path d="M${f(hx + 2)} ${f(hy - 29)} V${f(hy - 14)}" stroke="${R.ink}" stroke-width="1" opacity=".6"/>` });
  b += SP(blob([[hx - 14, hy - 10], [hx - 2, hy - 16], [hx + 12, hy - 12], [hx + 22, hy - 2], [hx + 22, hy + 8], [hx + 4, hy + 13], [hx - 12, hy + 10], [hx - 16, hy]]), R, { col: '#d6ecff', lt: '#ffffff', sh: 3, tex: G(hx, hy, 14, 10, EMBER, 0.7) + `<path d="M${f(hx + 8)} ${f(hy - 13)} Q${f(hx + 11)} ${f(hy)} ${f(hx + 8)} ${f(hy + 12)}" stroke="${R.ink}" stroke-width="1.4" fill="none" opacity=".5"/>` });
  b += SP(poly([[hx - 12, hy - 10], [hx - 6, hy - 30], [hx + 0, hy - 12]]), R, { col: '#e2f2ff', sh: 1, tex: `<path d="M${f(hx - 6)} ${f(hy - 29)} V${f(hy - 11)}" stroke="${R.ink}" stroke-width="1" opacity=".6"/>` });
  b += `<ellipse cx="${f(hx + 21)}" cy="${f(hy + 1)}" rx="2.6" ry="2.2" fill="${R.ink}"/>` + sEye(hx + 8, hy - 2, 3.2, R);
  if (st.pose === 'bite') b += crescents(hx + 32, hy + 4, 1, R);
  return wrap(b, st);
}

// C MOON-MIST RUNNERS: sleek, fast spirit hounds: solid bright head + forequarters, the hindquarters dissolve into a streaming comet of mist.
export function wolfC(st = {}) {
  const R = ROLE.wolf, a = (st.ph || 0) * TAU, s1 = Math.sin(a), bob = -Math.abs(s1) * 2, by = -26 + bob, hx = 26 + (st.pose === 'bite' ? 6 : 0), hy = -40 + bob;
  let b = G(-14, -26, 60, 22, R.glow, 0.45);
  // comet mist body
  for (let i = 0; i < 5; i++) { const y = by - 8 + i * 4, l = 40 + i * 6 - Math.abs(i - 2) * 10; b += `<path d="M6 ${f(y)} Q${f(-20)} ${f(y - 2 + s1 * 2)} ${f(-20 - l)} ${f(y + s1 * 4)}" stroke="${i % 2 ? R.c : '#e8f6ff'}" stroke-width="${f(7 - Math.abs(i - 2) * 1.6)}" fill="none" stroke-linecap="round" opacity="${f(0.75 - Math.abs(i - 2) * 0.15)}"/>`; }
  b += `<path d="M10 ${f(by)} Q-30 ${f(by - 4)} -70 ${f(by + s1 * 5)}" stroke="${R.glow}" stroke-width="16" fill="none" opacity=".35" stroke-linecap="round" filter="url(#blur3)"/>`;
  // front legs reaching
  for (const [x, ph] of [[10, a + Math.PI], [16, a]]) { const sw = Math.sin(ph) * 9; b += mistLeg(x, by + 6, x + sw + 4, -2, 4.4, 3, R); }
  // forequarters
  b += SP(blob([[22, by + 8], [26, by - 6], [14, by - 14], [-2, by - 12], [-10, by - 4], [-6, by + 8], [8, by + 11]]), R, { lt: '#ffffff', sh: 4, tex: `<path d="M-8 ${f(by - 6)} Q-30 ${f(by - 6)} -36 ${f(by)}" stroke="${R.c}" stroke-width="8" opacity=".0"/>` });
  b += heart(18, by + 2, 0.9);
  // sleek head with swept ears
  b += SP(blob([[hx - 12, hy - 4], [hx - 18, hy - 22], [hx - 6, hy - 12]]), R, { col: R.dk, sh: 1, rim: 0 });
  b += SP(blob([[hx - 12, hy + 6], [hx - 12, hy - 8], [hx - 2, hy - 14], [hx + 12, hy - 10], [hx + 24, hy - 2], [hx + 24, hy + 4], [hx + 8, hy + 10]]), R, { lt: '#ffffff', sh: 4 });
  b += SP(blob([[hx - 8, hy - 8], [hx - 14, hy - 26], [hx - 2, hy - 12]]), R, { sh: 1 });
  b += `<ellipse cx="${f(hx + 23)}" cy="${f(hy - 1)}" rx="2.4" ry="2" fill="${R.ink}"/>` + `<path d="M${f(hx + 2)} ${f(hy - 4)} q4 -3 8 -1" stroke="${R.ink}" stroke-width="2.6" fill="none" stroke-linecap="round"/><circle cx="${f(hx + 7)}" cy="${f(hy - 4.4)}" r="1" fill="${WARM}"/>`;
  if (st.pose === 'bite') b += crescents(hx + 34, hy + 2, 1, R);
  return wrap(b, st);
}

// pawprint light stamp (Light Trails A) and the evolution ground marks
export const paw = (x, y, s, col, a) => `<g transform="translate(${f(x)},${f(y)}) scale(${f(s)})" opacity="${f(a)}">${G(0, 0, 9, 6, col, 0.6)}<ellipse cx="0" cy="1.2" rx="3" ry="2.3" fill="${WARM}"/>${[-3.4, -1.2, 1.2, 3.4].map((dx, i) => `<circle cx="${dx}" cy="${f(-2.6 - (i === 1 || i === 2 ? 1 : 0))}" r="1.2" fill="${WARM}"/>`).join('')}</g>`;
export const star = (x, y, r, col, n = 4) => { let d = ''; for (let i = 0; i < n * 2; i++) { const a = (i / (n * 2)) * TAU - Math.PI / 2, rr = i % 2 ? r * 0.28 : r; d += (i ? 'L' : 'M') + f(x + Math.cos(a) * rr) + ' ' + f(y + Math.sin(a) * rr); } return `<path d="${d}Z" fill="${col}"/>`; };
