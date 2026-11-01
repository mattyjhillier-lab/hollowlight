// TAKE C "SNUFFED": the Hollow snuffed the forest's little lights; what was left set as cold wax and walks. Glossy blue-grey wax bodies that
// drip and slump, a charred WICK on every head trailing a curl of cold smoke, faces melted into soft hollows with ember eye-points.
// On the tell the wick catches a red-orange flame (the danger colour, telegraph only). On death they melt and the wick gives back a warm spark.
// Mock-up drawing code only (not game code). Units du (4 du = 1 world unit). Origin = feet on ground, facing +x.
import { furry, part, rod, specks, ticks, eye, socket, shadow, glow, mix, blob, line, poly, ell, circ, limb, rng, f, TAU, VOID, BOSS_EYE } from './paint.mjs';

export const PC = { wax: '#5f6a82', waxLt: '#aab5c6', waxDk: '#3d4558', old: '#7f8a9e', wick: '#1e1a22', smoke: '#9aa3b2', iron: '#3a3f4c', ironLt: '#6b7385', soot: '#2a2632' };
const P = PC;
// wax paint: glossy, low grain, translucent inner edge (subsurface), cold white rim
export const wax = (d, col = P.wax, o = {}) => part(d, col, { gloss: o.gloss ?? 0.3, grain: 0.05, rimC: '#d9e3f6', rimA: 0.7, ink: mix(col, '#1a1030', 0.5), sh: o.sh ?? 5, lw: o.lw, nl: o.nl, lt: mix(col, '#dfe7f5', 0.22), tex: `<path d="${d}" fill="none" stroke="${mix(col, '#c9d6ee', 0.45)}" stroke-width="5" opacity=".22" filter="url(#sb2)"/>` + (o.tex || '') });
// hanging drips from an edge: list of [x, y, len, w]
// classic wax drip: thin neck from inside the body edge, rounded bulb at the end; no outline on the top so it merges with the body
export const drips = (list, col = P.wax) => list.map(([x, y, len, w = 3]) => { const n = w * 0.6, by = y + len - w, ink = mix(col, '#170c26', 0.6);
  const d = `M${f(x - w * 1.3)} ${f(y - 5)} Q${f(x - n)} ${f(y + len * 0.3)} ${f(x - n)} ${f(by - w * 0.6)} A${f(w)} ${f(w)} 0 1 0 ${f(x + n)} ${f(by - w * 0.6)} Q${f(x + n)} ${f(y + len * 0.3)} ${f(x + w * 1.3)} ${f(y - 5)}Z`;
  const side = `M${f(x - w * 1.0)} ${f(y - 1)} Q${f(x - n)} ${f(y + len * 0.3)} ${f(x - n)} ${f(by - w * 0.6)} A${f(w)} ${f(w)} 0 1 0 ${f(x + n)} ${f(by - w * 0.6)} Q${f(x + n)} ${f(y + len * 0.3)} ${f(x + w * 1.0)} ${f(y - 1)}`;
  return `<path d="${side}" fill="none" stroke="${ink}" stroke-width="3.6" stroke-linejoin="round"/>` + wax(d, col, { sh: 1, gloss: 0.6, nl: true, rim: 0 }) + `<ellipse cx="${f(x - w * 0.3)}" cy="${f(by - w * 0.3)}" rx="${f(w * 0.3)}" ry="${f(w * 0.4)}" fill="#f2f6ff" opacity=".7"/>`; }).join('');
// a puddle under the feet (wax pooling)
export const puddle = (x, rx, col = P.wax) => wax(ell(x, -0.5, rx, rx * 0.22), mix(col, '#2a2f3c', 0.15), { sh: 1, gloss: 0.9, lw: 2 });
// charred wick + cold smoke curl; lit = telegraph flame (red-orange) 0..1
export function wick(x, y, ang = -1.4, len = 9, lit = 0, ph = 0, o = {}) {
  const c = Math.cos(ang), s = Math.sin(ang), x2 = x + c * len, y2 = y + s * len, bend = 2.5;
  let r = rod(`M${f(x)} ${f(y)} Q${f(x + c * len * 0.5 + bend)} ${f(y + s * len * 0.5)} ${f(x2)} ${f(y2)}`, P.wick, o.w || 2.6, { lw: 1.6, hi: 0 }) + `<circle cx="${f(x2)}" cy="${f(y2)}" r="${f((o.w || 2.6) * 0.7)}" fill="#4a3c44"/>`;
  if (lit > 0) { const h = 7 + 9 * lit; r += glow(x2, y2 - h * 0.4, 10 + 10 * lit, 12 + 12 * lit, '#ff5a3c', 0.85) + `<path d="M${f(x2)} ${f(y2 - h)} Q${f(x2 + 4 * lit + 2)} ${f(y2 - h * 0.35)} ${f(x2)} ${f(y2 + 1)} Q${f(x2 - 4 * lit - 2)} ${f(y2 - h * 0.35)} ${f(x2)} ${f(y2 - h)}Z" fill="#ff5a3c"/><path d="M${f(x2)} ${f(y2 - h * 0.6)} Q${f(x2 + 1.6)} ${f(y2 - h * 0.25)} ${f(x2)} ${f(y2)} Q${f(x2 - 1.6)} ${f(y2 - h * 0.25)} ${f(x2)} ${f(y2 - h * 0.6)}Z" fill="#ffd2b0"/>`; }
  else { const sw = Math.sin(ph) * 3; r += `<path d="M${f(x2)} ${f(y2 - 1)} q${f(-4 + sw)} -6 ${f(0)} -11 q${f(5 - sw)} -5 ${f(-1)} -12 q${f(-5)} -4 ${f(1)} -9" stroke="${P.smoke}" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".55" filter="url(#sb1)"/>`; }
  return r;
}
// a little stub candle (for crowns / antlers): base x,y, height h, width w
export const stub = (x, y, h, w, lit = 0, ph = 0, col = P.old) => wax(`M${f(x - w)} ${f(y)} L${f(x - w)} ${f(y - h + 2)} Q${f(x - w)} ${f(y - h)} ${f(x - w * 0.4)} ${f(y - h + 0.6)} L${f(x + w * 0.2)} ${f(y - h + 2.2)} Q${f(x + w)} ${f(y - h)} ${f(x + w)} ${f(y - h + 2)} L${f(x + w)} ${f(y)}Z`, col, { sh: 1.5, lw: 2, tex: `<path d="M${f(x + w * 0.4)} ${f(y - h + 2)} l0 ${f(h * 0.45)}" stroke="${mix(col, '#e8eefa', 0.5)}" stroke-width="${f(w * 0.5)}" stroke-linecap="round" opacity=".6"/>` }) + wick(x, y - h + 1, -1.5, 4, lit, ph, { w: 1.8 });
export const teleRingC = (rx, tl, x = 0) => `<ellipse cx="${x}" cy="1" rx="${f(rx)}" ry="${f(rx * 0.36)}" fill="#ff5a3c" opacity="${f(0.1 + 0.12 * tl)}"/><ellipse cx="${x}" cy="1" rx="${f(rx)}" ry="${f(rx * 0.36)}" fill="none" stroke="#ff5a3c" stroke-width="2.6" opacity="${f(0.5 + 0.4 * tl)}"/><ellipse cx="${x}" cy="1" rx="${f(rx * tl)}" ry="${f(rx * 0.36 * tl)}" fill="#ff5a3c" opacity=".22"/>`;
// melted face hollow (soft-edged void) for eyes
export const hollow = (d) => `<path d="${d}" fill="${mix(P.waxDk, '#0d0a14', 0.4)}" opacity=".9" filter="url(#sb1)"/><path d="${d}" fill="${VOID}" transform="scale(1)"/>`;

// death = MELT: slumps into a glossy puddle, the wick tips over onto it and lets a warm spark go (colour returns); hurt = white flash + jelly squish
export function finishC(st, body, eyes, o = {}) {
  const die = st.die || 0; let b = body, e = eyes;
  if (st.hurt) { b = `<g transform="scale(1.12,.88)"><g filter="url(#hurtF)">${b}</g></g>`; e = `<g transform="scale(1.12,.88)">${e}</g>`; }
  if (die > 0) {
    const W = o.w || 50; const sq = Math.min(1, die * 1.25);
    b = `<g transform="scale(${f(1 + sq * 0.5)},${f(Math.max(0.06, 1 - sq * 0.94))})" opacity="${f(1 - Math.max(0, die - 0.7) * 2)}">${b}</g>`;
    b = wax(ell(0, -1, W * 0.5 * (0.4 + 0.8 * sq), W * 0.12 * (0.4 + 0.8 * sq)), mix(o.col || P.wax, '#2a2f3c', 0.1), { sh: 1, gloss: 0.9, lw: 2 }) + b;
    b += wick(W * 0.1, -2, -0.3, 8, 0, die * 4, { w: 2.2 }).replace(/<path d="M[^"]*" stroke="#9aa3b2"[^>]*\/>/, '');
    if (die > 0.45) { const g = (die - 0.45) / 0.55; b += glow(W * 0.1 + 8, -6 - g * 14, 10 + 16 * g, 10 + 16 * g, '#ffc45a', 0.85 * (1 - g * 0.4)) + `<circle cx="${f(W * 0.1 + 8)}" cy="${f(-6 - g * 14)}" r="${f(2.4 * (1 - g * 0.5))}" fill="#fff3c8"/>`; }
    if (die > 0.8) { const g = (die - 0.8) / 0.2; b += `<path d="M-6 0 q-1 -6 2 -${f(10 * g)}" stroke="#6fae5a" stroke-width="2" fill="none"/><path d="M-4 ${f(-8 * g)} q6 -4 9 0 q-5 3 -9 0Z" fill="#8fd06a" stroke="#3f7a46" stroke-width=".8"/>`; }
    e = `<g opacity="${f(Math.max(0, 1 - die * 1.8))}">${e}</g>`;
  }
  return { b, e };
}

// ============================ TALLOW WOLF (Fell Wolf, Snuffed) ============================
// story: the wolves slept by the shepherds' candles; when the Hollow snuffed the candles, the wolves set like wax. signature: a slumped glossy
// wax wolf with a charred WICK on its head trailing smoke, one ear melted down, belly drips, feet sinking in little puddles, a long drip tail.
// personality: oozing slink, drops of wax fall as it goes; on the lunge tell the wick catches red.
export function wolfC(st = {}, K = {}) {
  const a = (st.ph || 0) * TAU, tl = st.tele || 0, s1 = Math.sin(a), bob = -Math.abs(s1) * 2 + tl * 4, W = K.wax || P.wax;
  let b = shadow(42, 0) + puddle(-4, 34, W);
  // tail: a long melted drip, droops
  const tw = s1 * 2 - tl * 8;
  b += wax(blob([[-22, -38 + bob], [-34, -42 + bob], [-46, -36 + tw], [-52, -24 + tw], [-54, -12 + tw], [-50, -10 + tw], [-46, -20 + tw], [-38, -30 + bob], [-26, -30 + bob]]), W);
  b += drips([[-50, -12 + tw, 9, 2.6]], W);
  const leg = (x, ph, far) => { const sw = Math.sin(ph) * 5 * (1 - tl), lift = Math.max(0, -Math.cos(ph)) * 3 * (1 - tl), px = x + sw - tl * 3; const col = far ? mix(W, '#141020', 0.3) : W;
    return wax(limb(x, -24 + bob, px, -3 - lift, 7.6, 6.4, far ? 1 : -1), col, { sh: 2 }) + wax(ell(px + 1, -2 - lift * 0.5, 7, 3.2), col, { sh: 1, gloss: 0.8, lw: 2 }); };
  b += leg(14, a + Math.PI, true) + leg(-20, a, true);
  const body = blob([[24, -22 + bob], [24, -38 + bob], [12, -48 + bob], [-6, -47 + bob], [-24, -42 + bob], [-32, -30 + bob], [-24, -18 + bob], [0, -16 + bob]]);
  b += wax(body, W, { sh: 7, tex: specks(-4, -36 + bob, 18, 6, 6, P.soot, { seed: 4, r: 2.2, a: 0.35 }) + `<path d="M-20 ${f(-40 + bob)} Q-4 ${f(-50 + bob)} 14 ${f(-44 + bob)}" stroke="${mix(W, '#e8eefa', 0.55)}" stroke-width="3" fill="none" opacity=".3" stroke-linecap="round"/>` });
  b += drips([[-16, -19 + bob, 8, 2.6], [-5, -17 + bob, 11, 3], [8, -18 + bob, 7, 2.4]], W);
  // spine wax ridges (they rise as hardened drips on the tell)
  for (let i = 0; i < 3; i++) { const x = 6 - i * 11, y = -47 + bob + i * 1.5, h = 5 + tl * 5; b += wax(`M${f(x - 4)} ${f(y + 2)} Q${f(x - 3)} ${f(y - h)} ${f(x)} ${f(y - h - 1)} Q${f(x + 3)} ${f(y - h)} ${f(x + 4)} ${f(y + 2)}Z`, P.old, { sh: 1.4, lw: 2 }); }
  b += leg(-24, a + Math.PI, false) + leg(10, a, false);
  // head
  const hx = 36 - tl * 3, hy = -44 + bob * 0.6 + tl * 8;
  // far ear (upright), melted near ear (drooping)
  b += wax(blob([[hx - 12, hy - 8], [hx - 15, hy - 24 + tl * 4], [hx - 4, hy - 13]]), mix(W, '#141020', 0.3), { sh: 2, lw: 2.2 });
  b += drips([[hx + 4, hy + 6, 9, 2.6], [hx + 14, hy + 5, 6, 2.2]], W);
  const head = blob([[hx - 14, hy - 4], [hx - 10, hy - 13], [hx + 2, hy - 15], [hx + 14, hy - 9], [hx + 24, hy - 3], [hx + 26, hy + 3], [hx + 18, hy + 7], [hx + 4, hy + 8], [hx - 10, hy + 6]]);
  b += wax(head, W, { sh: 4, tex: `<path d="M${f(hx - 8)} ${f(hy - 10)} Q${f(hx + 6)} ${f(hy - 15)} ${f(hx + 22)} ${f(hy - 4)}" stroke="${mix(W, '#f0f4fc', 0.6)}" stroke-width="2.6" fill="none" opacity=".6" stroke-linecap="round"/>` });
  const flop = Math.sin(a + 0.6) * 2;
  b += wax(blob([[hx - 6, hy - 12], [hx - 2, hy - 22], [hx + 4, hy - 20 + tl * -2], [hx + 10 + flop, hy - 14], [hx + 12 + flop, hy - 8], [hx + 6, hy - 9]]), W, { sh: 2, lw: 2.3 }) + drips([[hx + 11 + flop, hy - 9, 6, 2]], W);
  // melted face hollow with two eye-points; the wick on the crown
  b += hollow(blob([[hx + 2, hy - 4], [hx + 9, hy - 8], [hx + 21, hy - 4], [hx + 19, hy + 1], [hx + 8, hy + 1]]));
  b += wick(hx - 4, hy - 13, -1.75 + tl * 0.2, 10, tl, a);
  const E1 = [hx + 8, hy - 3.2], E2 = [hx + 17, hy - 2.4];
  let e = eye(E1[0], E1[1], 2.5 + tl * 0.8, { shape: tl > 0.3 ? 'slit' : 'almond', rot: -10, col: K.eye }) + eye(E2[0], E2[1], 1.9 + tl * 0.6, { shape: tl > 0.3 ? 'slit' : 'almond', rot: -10, col: K.eye });
  if (K.eye3) e += eye(hx + 12, hy - 9, 1.7, { col: K.eye });
  if (st.hurt) e = eye(E1[0], E1[1], 2.3, { shape: 'squint', col: K.eye }) + eye(E2[0], E2[1], 1.8, { shape: 'squint', col: K.eye });
  // falling wax drop
  if (!tl) b += wax(ell(-8, -6 + (a % 1) * 2, 1.8, 2.4), W, { sh: 0.5, lw: 1.4 });
  if (tl > 0) b = `<path d="M40 3 Q70 ${f(-3 - 6 * tl)} ${f(90 + 40 * tl)} 3" stroke="#ff5a3c" stroke-width="${f(2 + 2 * tl)}" fill="none" stroke-dasharray="8 6" opacity="${f(0.4 + 0.5 * tl)}"/><ellipse cx="${f(84 + 40 * tl)}" cy="3" rx="${f(14 + 8 * tl)}" ry="5" fill="#ff5a3c" opacity="${f(0.15 + 0.2 * tl)}"/>` + b;
  return finishC(st, b, e, { w: 80, col: W });
}

// ============================ SNUFFER CROW (Grave Crow, Snuffed) ============================
// story: a crow that wore the chapel's candle-snuffer as a helmet and put out every light it found. signature: an iron SNUFFER BELL over its
// head whose long cone is the beak (dark), one eye glinting through a crack in the bell, wax wings that drip feather-drops, a smoke trail.
// personality: swoops then hangs still; smoke curls off the bell; on the tell it tips the bell down to snuff.
export function crowC(st = {}) {
  const a = (st.ph || 0) * TAU, tl = st.tele || 0, hov = -32 + Math.sin(a) * 3 - tl * 3, Y = (y) => y + hov, W = P.wax;
  let b = shadow(16, 0, 0.32);
  // smoke trail behind
  b += `<path d="${line([[-10, Y(-10)], [-26, Y(-14) + Math.sin(a) * 3], [-40, Y(-8)], [-54, Y(-14) - Math.sin(a) * 3]])}" stroke="${P.smoke}" stroke-width="5" fill="none" stroke-linecap="round" opacity=".4" filter="url(#sb2)"/>`;
  const wing = (far) => { const up = tl > 0 ? -0.6 - tl * 0.4 : Math.cos(a), sx = far ? -6 : 0, sy = far ? -3 : 0, col = far ? mix(W, '#141020', 0.3) : W;
    const ox = -2 + sx, oy = Y(-14) + sy, ang = -2.25 - up * 0.6 + tl * 0.9, L = 26, ex = ox + Math.cos(ang) * L, ey = oy + Math.sin(ang) * L;
    const d = `M${f(ox + 4)} ${f(oy + 3)} Q${f(ox + Math.cos(ang - 0.3) * L * 0.6)} ${f(oy + Math.sin(ang - 0.3) * L * 0.6 - 4)} ${f(ex)} ${f(ey)} Q${f(ex + 6)} ${f(ey + 10)} ${f(ox - 6)} ${f(oy + 6)}Z`;
    let s = drips([[ex + 4, ey + 6, 8, 2], [(ox + ex) / 2, (oy + ey) / 2 + 6, 10, 2.4], [ox - 3, oy + 5, 7, 2.2]], col);
    return s + wax(d, col, { sh: 3 }); };
  b += wing(true);
  // tail: two long wax drips
  b += wax(blob([[-8, Y(-8)], [-24, Y(-2)], [-28, Y(4)], [-22, Y(2)], [-8, Y(-2)]]), mix(W, '#141020', 0.2), { sh: 1.5, lw: 2.2 });
  b += wax(ell(2, Y(-10), 13, 10.5), W, { sh: 4 }) + drips([[-4, Y(-1), 7, 2.4], [6, Y(-1), 9, 2.6]], W);
  // feet: two small iron hooks
  b += rod(`M-2 ${f(Y(1))} l-1 6 l-3 1 M5 ${f(Y(1))} l0 6 l-3 1`, P.iron, 1.6, { lw: 1.3, hi: 0 });
  // the SNUFFER bell over the head: dome + long cone (beak) + small handle ring; eye through a crack
  const hx = 14 + tl * 2, hy = Y(-20) + tl * 4, rot = tl * 28 + Math.sin(a * 2) * 3;
  let h = wax(ell(hx - 2, hy + 3, 8, 7), W, { sh: 2 });
  h += part(`M${f(hx - 9)} ${f(hy + 4)} Q${f(hx - 10)} ${f(hy - 10)} ${f(hx + 2)} ${f(hy - 11)} Q${f(hx + 10)} ${f(hy - 9)} ${f(hx + 12)} ${f(hy - 2)} L${f(hx + 32)} ${f(hy + 4)} L${f(hx + 12)} ${f(hy + 6)} Q${f(hx)} ${f(hy + 9)} ${f(hx - 9)} ${f(hy + 4)}Z`, P.iron, { sh: 3, gloss: 0.45, rimC: '#c8d2ea', rimA: 0.9, grain: 0.12,
    tex: `<path d="M${f(hx - 8)} ${f(hy + 3)} Q${f(hx + 2)} ${f(hy + 6)} ${f(hx + 12)} ${f(hy + 4)}" stroke="${P.ironLt}" stroke-width="2" fill="none" opacity=".6"/>` });
  h += `<circle cx="${f(hx - 2)}" cy="${f(hy - 13)}" r="3" fill="none" stroke="${P.iron}" stroke-width="2.2"/>`;
  h += `<path d="M${f(hx + 1)} ${f(hy - 6)} l3 2 l-1 2 l3 1.6" stroke="${VOID}" stroke-width="2.6" fill="none" stroke-linejoin="round"/>` + `<ellipse cx="${f(hx + 4)}" cy="${f(hy - 2.4)}" rx="3.2" ry="2.6" fill="${VOID}"/>`;
  b += `<g transform="rotate(${f(rot)} ${f(hx)} ${f(hy)})">${h}</g>`;
  b += `<path d="M${f(hx - 2)} ${f(hy - 16)} q-4 -6 0 -11 q4 -4 -1 -9" stroke="${P.smoke}" stroke-width="2.2" fill="none" opacity=".5" filter="url(#sb1)"/>`;
  b += wing(false);
  const t = rot * Math.PI / 180, ex = hx + 4 * Math.cos(t) + 2.4 * Math.sin(t), ey = hy + 4 * Math.sin(t) - 2.4 * Math.cos(t);
  let e = eye(ex, ey, st.hurt ? 2.6 : 2.8 + tl * 0.8, { shape: st.hurt ? 'squint' : tl > 0.3 ? 'wide' : 'round' });
  if (tl > 0) b = `<circle cx="${f(44 + 26 * tl)}" cy="2" r="${f(7 + 4 * tl)}" fill="none" stroke="#ff5a3c" stroke-width="2.4" opacity="${f(0.5 + 0.4 * tl)}"/><path d="M${f(hx + 28)} ${f(hy + 6)} L${f(44 + 26 * tl)} 2" stroke="#ff5a3c" stroke-width="2" stroke-dasharray="5 5" opacity="${f(0.4 + 0.4 * tl)}"/>` + b;
  return finishC(st, b, e, { w: 44 });
}

// ============================ STUBHEAP (Root Crawler, Snuffed) ============================
// story: the chapel's last candles, melted into one heap; the Hollow gave the heap legs of root. signature: a wide melted MOUND crowned with
// five snuffed candle STUBS of different heights (a candelabra skyline), drip skirt, root feet, a three-eye cluster in a melted hollow.
// personality: slow creeping slide, leaves a wax trail; on the tell all its wicks catch red (root slam ring).
export function crawlerC(st = {}) {
  const a = (st.ph || 0) * TAU, tl = st.tele || 0, bob = -Math.abs(Math.sin(a)) * 1.2 + tl * 1.5, W = P.wax;
  let b = shadow(46, 0) + wax(ell(-20, -0.5, 44, 7), mix(W, '#2a2f3c', 0.2), { sh: 1, gloss: 0.9, lw: 2 });
  // root feet
  for (let i = 0; i < 5; i++) { const x = -26 + i * 13, sw = Math.sin(a + i * 1.4) * 3; b += rod(line([[x, -10 + bob], [x - 3 + sw, -4], [x - 6 + sw * 1.4, 0]]), '#4a4652', 3.6, { lw: 1.9 }); }
  const mound = blob([[30, -14 + bob], [28, -28 + bob], [14, -38 + bob], [-6, -42 + bob], [-24, -38 + bob], [-36, -26 + bob], [-34, -14 + bob], [0, -11 + bob]]);
  b += wax(mound, W, { sh: 7, tex: specks(-4, -28 + bob, 22, 8, 8, P.soot, { seed: 9, r: 2.4, a: 0.3 }) });
  b += drips([[-30, -15 + bob, 9, 3], [-18, -12 + bob, 11, 3.2], [-6, -11 + bob, 8, 2.8], [6, -12 + bob, 10, 3.2], [18, -13 + bob, 7, 2.6]], W);
  // stub skyline
  for (const [x, h, w, d] of [[-22, 14, 4.5, 0], [-10, 24, 5.2, 1], [2, 18, 4.6, 2], [13, 11, 4, 3], [-30, 8, 3.6, 4]]) b += stub(x, -36 + bob + Math.abs(x) * 0.12, h + (tl ? 2 : 0), w, tl * (d % 2 ? 1 : 0.8), a + d);
  // melted hollow face + 3 eyes
  const hx = 22, hy = -24 + bob;
  b += hollow(blob([[hx - 6, hy - 2], [hx - 1, hy - 8], [hx + 7, hy - 7], [hx + 9, hy - 1], [hx + 4, hy + 4], [hx - 3, hy + 3]]));
  let e = eye(hx - 1, hy - 3, 2.1 + tl * 0.6) + eye(hx + 5, hy - 3.5, 1.8 + tl * 0.5) + eye(hx + 2, hy + 1, 1.5 + tl * 0.4);
  if (st.hurt) e = eye(hx - 1, hy - 3, 2, { shape: 'squint' }) + eye(hx + 5, hy - 3.5, 1.7, { shape: 'squint' });
  if (tl > 0) b = teleRingC(54, tl) + b;
  return finishC(st, b, e, { w: 80 });
}
