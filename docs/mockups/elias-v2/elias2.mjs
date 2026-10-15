// ELIAS v2: "THE LAMPLIGHTER" + candle-wheel chandelier + flame ring. Static mock-up drawing code, not game code.
// Hollowlight Style v1 via ../style-lab/lab.mjs shp(). Origin = ground under feet, y up = negative. Faces +x; dir:-1 mirrors.
// view: front | 3q | side | back.  Imports (never edits) the style-lab helpers.
import { shp, stk, cap as cap0, ell, circ, glow as glow0, mix, addDef, nid } from '../style-lab/lab.mjs';
let NOGLOW = false; export const setNoGlow = (v) => { NOGLOW = !!v; };
const glow = (...a) => (NOGLOW ? '' : glow0(...a));
const cap = (...a) => cap0(...a.map(Number));
export const f1 = (n) => (+n).toFixed(1);
const lerp = (a, b, t) => a + (b - a) * t;
const VW = { front: 0, '3q': 0.6, side: 1.2, back: Math.PI };
const g = (view) => { const th = VW[view || 'front']; return { th, c: Math.cos(th), s: Math.sin(th), xs: 1 - 0.26 * Math.abs(Math.sin(th)) }; };
const fin = (o, body) => { const q = o.sil ? `<g filter="url(#wsil)">${body}</g>` : body; return o.dir === -1 ? `<g transform="scale(-1,1)">${q}</g>` : q; };
const INK = '#4a3238';

export const PE = { coat: '#9a5a3c', coatDk: '#6e3d2a', coatLt: '#bd7a52', slate: '#6f8aa3', cream: '#e8dcc0', sage: '#7d9a6a', cap: '#3d4a5c', skin: '#e4b794', mous: '#cfc8bb', wood: '#7a5a3c', iron: '#3b4250', brass: '#d6a94c', brassDk: '#8a6a2c', pocketGlow: '#ffcf70', pants: '#4a4034', boot: '#2e2622', cheek: '#e88a7a', orb: '#e8e0ff', candle: '#f6efe0', flame: '#ffd05a' };

export const EX = {
  kind: { name: 'KIND (IDLE)', eye: 'arc', brow: 0, hy: 0, tilt: 0, fl: 1, note: 'smile-arcs, chandelier steady' },
  tender: { name: 'TENDER (SAD)', eye: 'open', brow: -1, hy: 2, tilt: -4, fl: 0.78, note: 'brows up, head dips, flames lean in' },
  hurt: { name: 'HURT', eye: 'x', brow: -1, hy: 1, tilt: -7, fl: 0.42, note: 'squint, wheel gutters, pockets dim' },
  glad: { name: 'GLAD (LEVEL UP)', eye: 'arc', brow: 1, hy: -1, tilt: 4, fl: 1.25, note: 'moustache lifts, sparks leap off the wheel' },
  brace: { name: 'BRACE (CAST)', eye: 'closed', brow: 1, hy: 1, tilt: 0, fl: 1.45, note: 'jaw set, spade driven in, wheel flares' },
  blink: { name: 'BLINK', eye: 'closed', brow: 0, hy: 0, tilt: 0, fl: 1, note: '' },
  death: { name: 'FADE', eye: 'closed', brow: -1, hy: 3, tilt: -3, fl: 0.6, note: '' },
};

// ---------------- light bits ----------------
const fpath = (x, y, h, w, lean, k) => { const hh = h * k, ww = w * k; return `M${f1(x)} ${f1(y)} C${f1(x - ww)} ${f1(y - hh * 0.1)} ${f1(x - ww * 0.9 + lean * k * 0.3)} ${f1(y - hh * 0.55)} ${f1(x + lean * k)} ${f1(y - hh)} C${f1(x + ww * 0.9 + lean * k * 0.3)} ${f1(y - hh * 0.55)} ${f1(x + ww)} ${f1(y - hh * 0.1)} ${f1(x)} ${f1(y)}Z`; };
// warm candle flame: base at (x,y), about 22*s*fl high
export function flame(x, y, s = 1, o = {}) {
  const fl = o.fl ?? 1, lean = o.lean ?? 0, h = 22 * s * Math.max(fl, 0.2), w = 7 * s * (0.75 + 0.25 * Math.min(fl, 1.3));
  let r = o.sil ? '' : glow(x + lean * 0.4, y - h * 0.5, (22 * s * fl + 8) * (o.gk ?? 1), (22 * s * fl + 8) * (o.gk ?? 1), '#ffc96b', o.ga ?? 0.85);
  r += `<path d="${fpath(x, y, h, w, lean, 1)}" fill="#ff9d3a"/><path d="${fpath(x, y, h, w, lean, 0.74)}" fill="#ffd05a"/><path d="${fpath(x, y, h, w, lean, 0.44)}" fill="#fff6d0"/>`;
  return r;
}
// Holy Orbit light drawn as a small lilac-white FLAME (weapons.json colour #e8e0ff) with a warm bloom
export function orbFlame(x, y, s = 1, o = {}) {
  const h = 19 * s, w = 7.4 * s, lean = o.lean ?? 0;
  let r = o.sil ? '' : glow(x, y - h * 0.45, h * 1.5, h * 1.5, '#d9ccff', 0.65) + glow(x, y - h * 0.4, h * 0.95, h * 0.95, '#ffe3a6', 0.7);
  r += `<path d="${fpath(x, y, h, w, lean, 1)}" fill="#cbbaf5" stroke="#8576b8" stroke-width="1"/><path d="${fpath(x, y, h, w, lean, 0.72)}" fill="#ece6ff"/><path d="${fpath(x, y, h, w, lean, 0.4)}" fill="#ffffff"/>`;
  return r;
}
// ring of small flames circling his waist: {back, front} so they pass behind and in front
export function orbitRing(o, cx, cy, R) {
  const n = o.n ?? 3, ph = o.ph ?? 0.6, ry = R * 0.34, s = o.s ?? 1.1; let back = '', front = '';
  if (!o.sil) back += `<ellipse cx="${cx}" cy="${cy}" rx="${R}" ry="${f1(ry)}" fill="none" stroke="#d9ccff" stroke-width="1.2" stroke-dasharray="1.4 5" opacity=".5"/>`;
  for (let i = 0; i < n; i++) {
    const a = ph + (i * 2 * Math.PI) / n, x = cx + R * Math.cos(a), y = cy + ry * Math.sin(a), k = 0.86 + 0.14 * Math.sin(a);
    const comet = o.sil ? '' : `<path d="M${f1(x)} ${f1(y)} Q${f1(cx + R * Math.cos(a - 0.35))} ${f1(cy + ry * Math.sin(a - 0.35) - 1)} ${f1(cx + R * Math.cos(a - 0.7))} ${f1(cy + ry * Math.sin(a - 0.7))}" fill="none" stroke="#e6dcff" stroke-width="2.6" stroke-linecap="round" opacity=".38"/>`;
    (Math.sin(a) < 0 ? (back += comet + orbFlame(x, y + 2, s * k, o)) : (front += comet + orbFlame(x, y + 2, s * k, o)));
  }
  return { back, front };
}

// ---------------- the chandelier wheel (hub on the pole, ring of 6 candles) ----------------
// sx = pole x; y = ring plane height (negative up); rx = ring radius; returns {back, front}
export function wheel(sx, y, rx, o = {}) {
  const ry = rx * (o.ratio ?? 0.3), n = o.n ?? 6, ph = o.ph ?? 0.5, fs = o.fs ?? 0.6, fl = o.fl ?? 1, lean = o.lean ?? 0, P = PE, sil = !!o.sil, ink = mix(P.brass, '#2a0f30', 0.62);
  const lk = o.lock || [], bk = o.dim ?? 1; // lock = socket indices that hold a Holy Orbit flame instead of a candle
  let back = '', front = '';
  const lw = o.w ?? Math.max(3.2, Math.min(5.5, rx * 0.06));
  back += stk(`M${f1(sx - rx)} ${f1(y)} A${f1(rx)} ${f1(ry)} 0 0 1 ${f1(sx + rx)} ${f1(y)}`, P.brass, lw);
  front += stk(`M${f1(sx + rx)} ${f1(y)} A${f1(rx)} ${f1(ry)} 0 0 1 ${f1(sx - rx)} ${f1(y)}`, P.brass, lw);
  if (!sil) front += `<path d="M${f1(sx + rx - 1)} ${f1(y + 0.8)} A${f1(rx)} ${f1(ry)} 0 0 1 ${f1(sx - rx + 1)} ${f1(y + 0.8)}" fill="none" stroke="#fff0b8" stroke-width="1" opacity=".7" transform="translate(0,-${f1(lw * 0.28)})"/>`;
  // four spokes to hub (left/right/back in back layer, front in front layer)
  const sp = (x2, y2, w = 1.9) => stk(`M${f1(sx)} ${f1(y)} L${f1(x2)} ${f1(y2)}`, P.brass, w);
  if (rx > 60) { // ground wheel: spokes are light, not iron
    const ls = (x2, y2) => `<path d="M${f1(sx)} ${f1(y)} L${f1(x2)} ${f1(y2)}" stroke="#fff0b8" stroke-width="2.4" stroke-dasharray="1.6 5" stroke-linecap="round" opacity=".7"/>`;
    for (let i = 0; i < n; i++) { const a = ph + (i * 2 * Math.PI) / n; (Math.sin(a) >= 0 ? (front += ls(sx + rx * 0.9 * Math.cos(a), y + ry * 0.9 * Math.sin(a))) : (back += ls(sx + rx * 0.9 * Math.cos(a), y + ry * 0.9 * Math.sin(a)))); }
  } else {
    back += sp(sx - rx * 0.97, y, lw * 0.5) + sp(sx + rx * 0.97, y, lw * 0.5) + sp(sx, y - ry * 0.97, lw * 0.5);
    front += sp(sx, y + ry * 0.97, lw * 0.5);
  }
  const sz = Math.min(rx * 0.14 + 1.5, 5.2);
  for (let i = 0; i < n; i++) {
    const a = ph + (i * 2 * Math.PI) / n, x = sx + rx * Math.cos(a), yy = y + ry * Math.sin(a), fr = Math.sin(a) >= 0, k = fr ? 1 : 0.86;
    let q = '';
    if (lk.includes(i)) q += orbFlame(x, yy - 1, fs * 1.45 * k, { sil, lean });
    else {
      const ch = 5.6 * k * (sz / 3.6);
      q += shp(`M${f1(x - sz * 0.46 * k)} ${f1(yy + 1.4)} L${f1(x - sz * 0.46 * k)} ${f1(yy - ch)} L${f1(x + sz * 0.46 * k)} ${f1(yy - ch)} L${f1(x + sz * 0.46 * k)} ${f1(yy + 1.4)}Z`, P.candle, { w: 0.4, nl: false });
      q += flame(x, yy - ch, fs * k * (sz / 3.6) ** 0.6, { fl: fl * bk, sil, lean, ga: 0.62, gk: o.gk ?? 0.8 });
    }
    // bracket cup under each candle
    const cup = shp(`M${f1(x - sz * 0.8 * k)} ${f1(yy - 0.2)} L${f1(x + sz * 0.8 * k)} ${f1(yy - 0.2)} L${f1(x + sz * 0.5 * k)} ${f1(yy + 2.6 * k)} L${f1(x - sz * 0.5 * k)} ${f1(yy + 2.6 * k)}Z`, P.brass, { w: 0.4, nl: false });
    (fr ? (front += cup + q) : (back = back + q + cup));
  }
  return { back, front, ink };
}

// ---------------- ground helpers for the Candle Wheel (hollow grey -> restored colour) ----------------
export const hollowDisc = (cx, cy, R, ry) => { let v = ''; for (let i = 0; i < 9; i++) { const a = i * 0.7 + 0.3, x = cx + Math.cos(a) * R * 0.85 * ((i * 5 % 9) / 9 + 0.1), y = cy + Math.sin(a) * ry * 0.8; v += `<path d="M${f1(x)} ${f1(y)} q4 -2 8 1 t7 -1" stroke="#1d1626" stroke-width="1.2" fill="none" opacity=".55"/>`; } return `<ellipse cx="${cx}" cy="${cy}" rx="${f1(R * 1.2)}" ry="${f1(ry * 1.2)}" fill="#59657a"/><ellipse cx="${cx}" cy="${cy}" rx="${f1(R * 1.2)}" ry="${f1(ry * 1.2)}" fill="none" stroke="#6b788d" stroke-width="1.2"/>${v}`; };
export function bloomDisc(cx, cy, R, ry, t, seed = 3, tuftK = 1) {
  if (t <= 0.01) return '';
  const rr = R * t, ryy = ry * t, id = nid('bd');
  let tufts = ''; const nT = Math.round(30 * tuftK);
  for (let i = 0; i < nT; i++) { const a = i * 2.399 + seed, d = Math.sqrt(((i * 37) % nT) / nT) * 0.92; const x = cx + Math.cos(a) * rr * d, y = cy + Math.sin(a) * ryy * d; tufts += `<path d="M${f1(x)} ${f1(y)} l-1.6 -4.6 l1.6 2 l1.4 -4 l.8 4 l1.8 -2.2 l-1.4 4.8z" fill="${i % 3 ? '#4f8f46' : '#b4e07e'}"/>`; if (i % 5 === 0) tufts += `<circle cx="${f1(x + 3)}" cy="${f1(y - 1)}" r="1.5" fill="${['#ffb347', '#ff8fa3', '#fff1c4'][i % 3]}"/>`; }
  addDef(`<radialGradient id="${id}"><stop offset="0" stop-color="#b6e684"/><stop offset=".6" stop-color="#6fb257"/><stop offset="1" stop-color="#3f7a46"/></radialGradient><clipPath id="${id}c"><ellipse cx="${cx}" cy="${cy}" rx="${f1(rr)}" ry="${f1(ryy)}"/></clipPath>`);
  return `<ellipse cx="${cx}" cy="${cy}" rx="${f1(rr)}" ry="${f1(ryy)}" fill="url(#${id})"/><g clip-path="url(#${id}c)">${tufts}</g><ellipse cx="${cx}" cy="${cy}" rx="${f1(rr)}" ry="${f1(ryy)}" fill="none" stroke="#e9d49a" stroke-width="1.6" opacity=".7"/>`;
}

// ======================================================================================
// ELIAS v2
// o: view expr run sil dir  | orbs {n,ph,R,s} (flame ring) | wheel {low 0..1, open 0..1, R, ph, lock[], fl, bk} | staffUp staffX fl | sway bob lean tilt leg(phase) | flash light alpha
// ======================================================================================
export function elias2(o = {}) {
  const view = o.view || 'front', X = EX[o.expr || 'kind'], sil = !!o.sil, run = !!o.run, P = PE, f = f1;
  const { th, c, s, xs } = g(view), side = view === 'side', bk = view === 'back';
  const sw = o.sway ?? (run ? 3 : 0), bob = o.bob ?? 0, lean = o.lean ?? (run ? 3 : 0), tilt = o.tilt ?? X.tilt, fl = o.fl ?? X.fl, up = o.staffUp ?? 0;
  const ph = o.leg ?? (run ? 0.8 : 0), sx0 = Math.sin(ph) * (run ? 5 : 0), lift = (v) => (run ? Math.max(0, v) * 3 : 0);
  const hb = -2 * s, fx = 14 * s, hc = -82, wx = (a, z) => a * c + z * s;
  const W = o.wheel || {}, low = W.low ?? 0, opn = W.open ?? 0;
  const staffX = o.staffX != null ? (side ? o.staffX * 0.45 + 6 : wx(o.staffX, 2)) : (side ? 21 : wx(47, 2)) + (run ? 3 : 0);
  // =============== STAFF: pole + spade + chandelier wheel + lantern top ===============
  let stBack = '', stFront = '';
  if (o.staff !== false) {
    const sxl = staffX, topY = -118 - up, footY = -up, tiltS = o.staffTilt ?? (run ? 4 : 0);
    const ringY0 = -104 - up, ringY = lerp(ringY0, -5.5 - Math.max(0, up) * 0.0, low), Rg = W.R ?? 25;
    const rx = lerp(21, Rg, opn), fs = lerp(0.6, W.fs ?? 1.05, opn), wl = wheel(sxl, ringY, rx, { n: 6, ph: W.ph ?? 0.5, fs, fl: (W.fl ?? fl), sil, lean: run ? -1.6 : 0, lock: W.lock, ratio: lerp(0.3, 0.4, opn), gk: lerp(0.8, 1.5, opn), dim: W.bk ?? 1, w: W.w });
    let pole = '';
    // pole: thick (r 4.4), iron bands + spade foot
    pole += shp(cap(f(sxl), topY + 6, f(sxl), footY - 12, 4.4, 4.6), P.wood, { w: 0.9, x: `<path d="M${f(sxl - 1.6)} ${topY} L${f(sxl - 1.6)} ${footY - 12}" stroke="#a4805a" stroke-width="1.4" opacity=".6"/>` });
    for (const by of [-86, -40, -20]) pole += shp(`M${f(sxl - 5.2)} ${by - up - 1.6} L${f(sxl + 5.2)} ${by - up - 1.6} L${f(sxl + 5.2)} ${by - up + 1.6} L${f(sxl - 5.2)} ${by - up + 1.6}Z`, P.iron, { w: 0.5, nl: false });
    pole += shp(`M${f(sxl - 6.4)} ${footY - 20} L${f(sxl + 6.4)} ${footY - 20} L${f(sxl + 6.8)} ${footY - 9} L${f(sxl)} ${footY + 0.5} L${f(sxl - 6.8)} ${footY - 9}Z`, '#8b93a6', { w: 0.9, x: `<path d="M${f(sxl)} ${footY - 18} L${f(sxl)} ${footY - 3}" stroke="#4d566a" stroke-width="1.2" opacity=".6"/>` });
    pole += shp(`M${f(sxl - 8.5)} ${footY - 14.5} L${f(sxl + 8.5)} ${footY - 14.5} L${f(sxl + 8.5)} ${footY - 11.6} L${f(sxl - 8.5)} ${footY - 11.6}Z`, '#6b7488', { w: 0.5, nl: false }); // foot-rest tread
    // lantern top (the old lantern, now the chandelier's centre flame)
    const ly = topY - 8, lw = 7.4;
    let lan = '';
    if (!sil) lan += glow(sxl, ly + 2, 70 * Math.min(fl, 1.35) + 12, 62 * Math.min(fl, 1.35) + 12, '#ffc96b', 0.95);
    lan += shp(`M${f(sxl - 3.6)} ${ly - 13} L${f(sxl + 3.6)} ${ly - 13} L${f(sxl + lw + 1.2)} ${ly - 9} L${f(sxl - lw - 1.2)} ${ly - 9}Z`, P.brassDk, { w: 0.8 }) + `<circle cx="${f(sxl)}" cy="${ly - 16}" r="2.7" fill="none" stroke="${P.brassDk}" stroke-width="1.7"/>`;
    lan += shp(`M${f(sxl - lw)} ${ly - 9} L${f(sxl + lw)} ${ly - 9} L${f(sxl + lw - 1)} ${ly + 11} L${f(sxl - lw + 1)} ${ly + 11}Z`, '#ffe7ae', { w: 0.9, so: 3 });
    lan += `<path d="M${f(sxl - lw + 1)} ${ly - 7} L${f(sxl - lw + 1.8)} ${ly + 9.5} M${f(sxl + lw - 1)} ${ly - 7} L${f(sxl + lw - 1.8)} ${ly + 9.5}" stroke="${P.iron}" stroke-width="1.8" stroke-linecap="round"/>`;
    lan += flame(sxl, ly + 8.6, 0.62, { fl, lean: run ? -1 : 0, sil, gk: 0.3, ga: 0.2 });
    lan += shp(`M${f(sxl - lw - 1.6)} ${ly + 11} L${f(sxl + lw + 1.6)} ${ly + 11} L${f(sxl + lw - 1)} ${ly + 15} L${f(sxl - lw + 1)} ${ly + 15}Z`, P.brassDk, { w: 0.7 });
    // collar hub where the wheel rides the pole
    const hub = shp(`M${f(sxl - 6.6)} ${f(ringY - 3.6)} L${f(sxl + 6.6)} ${f(ringY - 3.6)} L${f(sxl + 6.6)} ${f(ringY + 3.6)} L${f(sxl - 6.6)} ${f(ringY + 3.6)}Z`, P.brass, { w: 0.7 });
    stBack = `<g transform="rotate(${tiltS} ${f(sxl)} -50)">${wl.back}${pole}${lan}</g>`;
    stFront = `<g transform="rotate(${tiltS} ${f(sxl)} -50)">${hub}${wl.front}</g>`;
  }
  // =============== BODY ===============
  const shW = 27 * xs, hemW = 38 * xs;
  const coatD = `M${f(-shW)} -58 Q${f(-shW - 6)} -40 ${f(-hemW + sw * 0.5)} -16 Q${f(sw * 0.5 - 8)} -10 ${f(sw * 0.5)} -13 Q${f(sw * 0.5 + 8)} -10 ${f(hemW + sw * 0.5)} -16 Q${f(shW + 6)} -40 ${f(shW)} -58 Q0 -66 ${f(-shW)} -58Z`;
  let body = '';
  const lgx = side ? 8 : 11 * xs;
  const bt = (x, dir) => { const lf = lift(dir * Math.cos(ph)); return shp(ell(f(x + 3 * s), f(-4 - lf), 9.8, 5.2), P.boot, { w: 0.8 }); };
  body += shp(`M${f(-14 * xs)} -18 L${f(14 * xs)} -18 L${f(15 * xs + Math.abs(sx0))} -6 L${f(-15 * xs - Math.abs(sx0))} -6Z`, P.pants, { w: 0.8 });
  body += (side ? bt(-lgx - sx0 * 0.9, 1) + bt(lgx + sx0 * 0.9, -1) : bt(-lgx - Math.abs(sx0) * 0.5, 1) + bt(lgx + Math.abs(sx0) * 0.5, -1));
  // spare-candle bundle strapped to the back (shows on side / 3q / back)
  const candles = (x, y, rot, front) => { let q = ''; for (let i = 0; i < 5; i++) { const cx0 = x + (i - 2) * 4.3, h = 22 + (i % 2) * 5; q += shp(`M${f(cx0 - 1.9)} ${f(y)} L${f(cx0 - 1.9)} ${f(y - h)} L${f(cx0 + 1.9)} ${f(y - h)} L${f(cx0 + 1.9)} ${f(y)}Z`, P.candle, { w: 0.5 }) + `<path d="M${f(cx0)} ${f(y - h)} l0 -2.3" stroke="#3a2e30" stroke-width="1"/>`; } return `<g transform="rotate(${rot} ${f(x)} ${f(y)})">${q}</g>`; };
  if (side) body += `<g transform="translate(${f(-17)},-12)">${candles(0, -30, -16)}</g>`;
  if (view === '3q') body += `<g transform="translate(${f(-wx(14, 0) - 8)},-8)">${candles(0, -42, -10)}</g>`;
  const patches = bk
    ? `<rect x="-17" y="-54" width="25" height="21" fill="${P.slate}"/><path d="M-17 -54 h25 v21 h-25z" fill="none" stroke="${P.cream}" stroke-width="1.5" stroke-dasharray="3 2"/><rect x="8" y="-30" width="13" height="11" fill="${P.sage}"/><path d="M8 -30 h13 v11 h-13z" fill="none" stroke="${P.cream}" stroke-width="1.2" stroke-dasharray="2.4 2"/><path d="M-30 -36 L30 -44" stroke="#5a3a24" stroke-width="3.4" opacity=".9"/><path d="M-30 -36 L30 -44" stroke="#d6a94c" stroke-width="1" stroke-dasharray="2 2.4"/>`
    : `<rect x="${f(-shW + 3)}" y="-57" width="13" height="9" fill="${P.sage}" transform="rotate(-8 ${f(-shW + 9)} -51)"/><rect x="${f(shW - 15)}" y="-46" width="12" height="12" fill="${P.slate}"/><path d="M${f(shW - 15)} -46 h12 v12 h-12z" fill="none" stroke="${P.cream}" stroke-width="1.2" stroke-dasharray="2.4 2"/><rect x="${f(-shW + 1)}" y="-27" width="${f(15 * xs)}" height="9" fill="${P.cream}" opacity=".9"/>`;
  body += shp(coatD, P.coat, { w: 1.05, so: 7, x: patches + `<path d="M${f(-hemW - 4)} -18 Q0 -8 ${f(hemW + 4)} -18 L${f(hemW + 4)} -2 L${f(-hemW - 4)} -2Z" fill="${P.coatDk}" opacity=".4"/>` });
  if (bk) {
    body += candles(-6, -58, -12, true); // bundle poking above the shoulder line
    body += shp(`M-8 -22 q8 -4 16 0 l-3 11 q-5 2 -10 0z`, '#a38660', { w: 0.7 }) + `<path d="M0 -24 L0 -12" stroke="${P.coatDk}" stroke-width="1.2" opacity=".6"/>`; // snuffer cone at the hip
    body += `<path d="M${f(-hemW + 4)} -17 Q0 -9 ${f(hemW - 4)} -17" stroke="${P.coatDk}" stroke-width="1.6" fill="none" opacity=".6"/>`;
  }
  if (!bk) {
    body += `<path d="M${f(2 * s)} -60 L${f(2 * s)} -14" stroke="${P.coatDk}" stroke-width="1.6" opacity=".7"/>`;
    for (const y of [-50, -39, -28]) body += shp(circ(f(5 * s + 5 * xs), y, 2.4), P.cream, { w: 0.5 });
    body += shp(`M${f(-15 * xs)} -64 Q0 -52 ${f(15 * xs)} -64 L${f(11 * xs)} -57 Q0 -50 ${f(-11 * xs)} -57Z`, P.coatDk, { w: 0.7 });
    // 4 pockets, each leaking light: bright slit + spill fan below + motes
    const pk = [[-18 * xs, -26, 16, 12], [18 * xs, -26, 16, 12], [-13 * xs, -45, 12, 10], [15 * xs, -46, 9, 8]];
    const lit = Math.min(fl, 1.25) * (X === EX.hurt ? 0.55 : 1) * (o.pk ?? 1);
    pk.forEach(([px, py, pw, ph2], i) => {
      if (side && i % 2 === 1) return;
      if (side) { px = i === 0 ? 4 : -5; }
      const gl = !sil ? glow(f(px), f(py + ph2 * 0.9), pw * 1.5, pw * 2.1, '#ffcf70', Math.min(1, 0.9 * lit)) + glow(f(px), f(py - ph2 * 0.3), pw * 2.3, pw * 1.5, '#ffe2a0', 0.7 * lit) : '';
      body += gl + shp(`M${f(px - pw / 2)} ${f(py - ph2 / 2)} L${f(px + pw / 2)} ${f(py - ph2 / 2)} L${f(px + pw / 2 - 0.8)} ${f(py + ph2 / 2)} L${f(px - pw / 2 + 0.8)} ${f(py + ph2 / 2)}Z`, P.coatLt, { w: 0.7, x: `<path d="M${f(px - pw / 2)} ${f(py - ph2 / 2 + 2.4)} L${f(px + pw / 2)} ${f(py - ph2 / 2 + 2.4)}" stroke="${P.coatDk}" stroke-width="1" opacity=".7"/><path d="M${f(px - pw / 2 + 1.5)} ${f(py + ph2 / 2 - 1.5)} L${f(px + pw / 2 - 1.5)} ${f(py + ph2 / 2 - 1.5)}" stroke="${P.cream}" stroke-width="1" stroke-dasharray="2 1.6" opacity=".8"/>` });
      if (!sil) {
        body += `<path d="M${f(px - pw * 0.42)} ${f(py - ph2 / 2 - 0.2)} Q${f(px)} ${f(py - ph2 / 2 - 3.4)} ${f(px + pw * 0.42)} ${f(py - ph2 / 2 - 0.2)}" fill="none" stroke="#fff2c0" stroke-width="2.4" stroke-linecap="round"/>`;
        body += `<path d="M${f(px - pw * 0.34)} ${f(py - ph2 / 2 + 0.6)} L${f(px - pw * 0.6)} ${f(py + ph2 / 2 + 11)} L${f(px + pw * 0.6)} ${f(py + ph2 / 2 + 11)} L${f(px + pw * 0.34)} ${f(py - ph2 / 2 + 0.6)}Z" fill="#ffe9a8" opacity="${f(0.3 * lit)}"/>`; // spill fan
        body += `<circle cx="${f(px + (i % 2 ? 3 : -3))}" cy="${f(py - ph2 / 2 - 7 - (i % 3) * 2)}" r="1.5" fill="#fff2c0"/><circle cx="${f(px + (i % 2 ? -2 : 4))}" cy="${f(py + ph2 / 2 + 6 + (i % 2) * 3)}" r="1.1" fill="#fff2c0" opacity=".85"/>`;
      }
      if (i === 2 && !sil) body += shp(`M${f(px - 3)} ${f(py - ph2 / 2)} L${f(px - 3)} ${f(py - ph2 / 2 - 7)} L${f(px - 0.6)} ${f(py - ph2 / 2 - 7)} L${f(px - 0.6)} ${f(py - ph2 / 2)}Z`, P.candle, { w: 0.3, nl: true }) + flame(px - 1.8, py - ph2 / 2 - 7, 0.3 * lit, { fl: 1, gk: 0.3, ga: 0.2 }); // a stub candle poking from the breast pocket
    });
  }
  // arms: far one hangs, near one grips the pole
  const hxR = staffX, hyR = -48 - up * 0.3;
  if (!side) body += shp(cap(f(wx(-24, 0)), -54, f(wx(-33, 2)), -30, 7.8, 6.6), P.coat, { w: 0.9 }) + shp(circ(f(wx(-33, 2)), -26, 4.4), P.skin, { w: 0.6 });
  body += shp(cap(f(side ? 2 : wx(24, 0)), -54, f(hxR - 1), hyR, 7.8, 6.4), P.coat, { w: 0.9 }) + shp(circ(f(hxR), hyR, 5), P.skin, { w: 0.6 }) + shp(`M${f(hxR - 5.6)} ${hyR - 1} L${f(hxR + 5.6)} ${hyR - 1} L${f(hxR + 5.2)} ${hyR + 2.4} L${f(hxR - 5.2)} ${hyR + 2.4}Z`, P.skin, { w: 0, nl: true });
  // =============== HEAD ===============
  let head = '';
  const hxs = side ? 22 : 26 * (1 - 0.1 * s);
  if (side) {
    head += shp(ell(f(hb - 14), hc + 7, 6, 8), P.mous, { w: 0.7 }); // grey hair at the nape
    head += shp(ell(hb, hc, 22, 23), P.skin, { w: 1, so: 6 });
    head += shp(ell(f(hb - 3), hc + 3, 4.4, 6), '#d9a782', { w: 0.6 }); // ear
    head += shp(ell(f(hb + 21), hc + 4, 5, 4.6), '#ee9f8c', { w: 0.7 }); // nose
    head += shp(`M${f(hb - 23)} ${hc - 11} Q${f(hb - 23)} ${hc - 28} ${f(hb + 2)} ${hc - 28} Q${f(hb + 23)} ${hc - 27} ${f(hb + 24)} ${hc - 12} Q${f(hb)} ${hc - 16} ${f(hb - 23)} ${hc - 11}Z`, P.cap, { w: 0.9, x: `<path d="M${f(hb - 22)} ${hc - 15} Q${f(hb)} ${hc - 21} ${f(hb + 23)} ${hc - 15}" fill="none" stroke="${mix(P.cap, '#ffffff', 0.3)}" stroke-width="1" opacity=".5"/>` });
    head += shp(`M${f(hb + 4)} ${hc - 14} Q${f(hb + 26)} ${hc - 16} ${f(hb + 36)} ${hc - 10} Q${f(hb + 24)} ${hc - 8} ${f(hb + 4)} ${hc - 9}Z`, mix(P.cap, '#000', 0.14), { w: 0.8 }); // brim points forward
    head += shp(circ(f(hb + 2), hc - 28.5, 1.9), mix(P.cap, '#000', 0.14), { w: 0.5 });
    head += `<ellipse cx="${f(hb + 8)}" cy="${hc + 6}" rx="4.6" ry="3.2" fill="${P.cheek}" opacity=".55"/>`;
    const y = hc + 1, ex = hb + 13;
    head += X.eye === 'arc' ? `<path d="M${f(ex - 4)} ${y + 1.2} Q${f(ex)} ${y - 4} ${f(ex + 4)} ${y + 1.2}" fill="none" stroke="${INK}" stroke-width="2.1" stroke-linecap="round"/>` : X.eye === 'closed' ? `<path d="M${f(ex - 4)} ${y - 0.5} Q${f(ex)} ${y + 3} ${f(ex + 4)} ${y - 0.5}" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round"/>` : X.eye === 'x' ? `<path d="M${f(ex - 3)} ${y - 3} L${f(ex + 3)} ${y} L${f(ex - 3)} ${y + 3}" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>` : `<ellipse cx="${f(ex)}" cy="${y}" rx="2.6" ry="3.5" fill="${INK}"/><circle cx="${f(ex - 0.8)}" cy="${y - 1.2}" r="1.1" fill="#fff"/>`;
    const raise = X.brow === 1 ? -2 : 0, sl = X.brow === -1 ? 2.4 : 0;
    head += `<path d="M${f(ex - 5.2)} ${f(y - 6.4 + raise + sl)} Q${f(ex)} ${f(y - 9.4 + raise)} ${f(ex + 5.2)} ${f(y - 6.4 + raise - sl)}" fill="none" stroke="${P.mous}" stroke-width="3" stroke-linecap="round"/>`;
    const bn = X === EX.glad ? -1.6 : 0;
    head += shp(`M${f(hb + 17)} ${hc + 7 + bn} Q${f(hb + 28)} ${hc + 6 + bn} ${f(hb + 31)} ${hc + 13} Q${f(hb + 30)} ${hc + 21} ${f(hb + 20)} ${hc + 19} Q${f(hb + 12)} ${hc + 18} ${f(hb + 8)} ${hc + 13}Z`, P.mous, { w: 0.7 });
  } else {
    head += shp(ell(f(hb - hxs + 3), hc + 5, 5.6, 8.4), P.mous, { w: 0.7 }) + shp(ell(f(hb + hxs - 3), hc + 5, 5.6, 8.4), P.mous, { w: 0.7 });
    if (!bk) head += shp(ell(f(hb - hxs - 0.5), hc + 2, 3.8, 5.6), '#d9a782', { w: 0.5 }) + shp(ell(f(hb + hxs + 0.5), hc + 2, 3.8, 5.6), '#d9a782', { w: 0.5 });
    head += shp(ell(hb, hc, f(hxs), 23), P.skin, { w: 1, so: 6 });
    head += shp(`M${f(hb - hxs * 1.03)} ${hc - 11} Q${f(hb - hxs * 1.05)} ${hc - 28} ${hb} ${hc - 28} Q${f(hb + hxs * 1.05)} ${hc - 28} ${f(hb + hxs * 1.03)} ${hc - 11} Q${hb} ${hc - 16} ${f(hb - hxs * 1.03)} ${hc - 11}Z`, P.cap, { w: 0.9, x: `<path d="M${f(hb - hxs)} ${hc - 15} Q${hb} ${hc - 21} ${f(hb + hxs)} ${hc - 15}" fill="none" stroke="${mix(P.cap, '#ffffff', 0.3)}" stroke-width="1" opacity=".5"/>${bk ? `<path d="M${hb} ${hc - 30} L${hb} ${hc - 10}" stroke="${mix(P.cap, '#000', 0.3)}" stroke-width="1.2"/><path d="M${hb - 12} ${hc - 28} L${hb - 6} ${hc - 10} M${hb + 12} ${hc - 28} L${hb + 6} ${hc - 10}" stroke="${mix(P.cap, '#000', 0.3)}" stroke-width="1" opacity=".7"/>` : ''}` });
    head += shp(circ(hb, hc - 28.5, 1.9), mix(P.cap, '#000', 0.14), { w: 0.5 });
    if (!bk) {
      head += shp(ell(f(fx + 2 * s), hc + 2, f(hxs * 0.8), 18), P.skin, { w: 0, nl: true });
      head += shp(`M${f(hb - hxs * 1.02)} ${hc - 12} Q${f(fx - 2)} ${hc - 9} ${f(hb + hxs * 1.02 + 6 * s)} ${hc - 12} L${f(hb + hxs * 1.02 + 10 * s)} ${hc - 9} Q${f(fx)} ${hc - 6} ${f(hb - hxs * 1.02)} ${hc - 9}Z`, mix(P.cap, '#000', 0.14), { w: 0.8 });
      head += `<ellipse cx="${f(fx - 15)}" cy="${hc + 6}" rx="5" ry="3.4" fill="${P.cheek}" opacity=".55"/><ellipse cx="${f(fx + 15)}" cy="${hc + 6}" rx="5" ry="3.4" fill="${P.cheek}" opacity=".55"/>`;
      head += shp(ell(f(fx), hc + 5, 5.6, 4.8), '#ee9f8c', { w: 0.5 });
      for (const sg of [-1, 1]) {
        const a = th + sg * 0.5, cs = Math.cos(a); if (cs < 0.12) continue; const x = 20 * Math.sin(a) + hb, y = hc + 2, k = 0.5 + 0.5 * cs;
        let e = '';
        if (X.eye === 'arc') e = `<path d="M${f(x - 4.4 * k)} ${y + 1.2} Q${f(x)} ${y - 4} ${f(x + 4.4 * k)} ${y + 1.2}" fill="none" stroke="${INK}" stroke-width="2.1" stroke-linecap="round"/>`;
        else if (X.eye === 'closed') e = `<path d="M${f(x - 4.2 * k)} ${y - 0.5} Q${f(x)} ${y + 3} ${f(x + 4.2 * k)} ${y - 0.5}" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round"/>`;
        else if (X.eye === 'x') e = `<path d="M${f(x + sg * 4 * k)} ${y - 3} L${f(x - sg * 3 * k)} ${y} L${f(x + sg * 4 * k)} ${y + 3}" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;
        else e = `<ellipse cx="${f(x)}" cy="${y}" rx="${f(2.8 * k)}" ry="3.4" fill="${INK}"/><circle cx="${f(x - 0.8)}" cy="${y - 1.2}" r="1.1" fill="#fff"/>`;
        const raise = X.brow === 1 ? -2 : 0, slant = X.brow === -1 ? sg * 2.6 * -1 : 0;
        head += e + `<path d="M${f(x - 5.2 * k)} ${f(y - 6.4 + raise + slant)} Q${f(x)} ${f(y - 9.4 + raise)} ${f(x + 5.2 * k)} ${f(y - 6.4 + raise - slant)}" fill="none" stroke="${P.mous}" stroke-width="3" stroke-linecap="round"/>`;
      }
      const bounce = X === EX.glad ? -1.6 : 0;
      head += shp(`M${f(fx)} ${hc + 8 + bounce} Q${f(fx - 11)} ${hc + 6 + bounce} ${f(fx - 17)} ${hc + 14} Q${f(fx - 15)} ${hc + 21} ${f(fx - 7)} ${hc + 18} Q${f(fx - 2)} ${hc + 16} ${f(fx)} ${hc + 17}Z`, P.mous, { w: 0.7 }) + shp(`M${f(fx)} ${hc + 8 + bounce} Q${f(fx + 11)} ${hc + 6 + bounce} ${f(fx + 17)} ${hc + 14} Q${f(fx + 15)} ${hc + 21} ${f(fx + 7)} ${hc + 18} Q${f(fx + 2)} ${hc + 16} ${f(fx)} ${hc + 17}Z`, P.mous, { w: 0.7 });
      if (X === EX.glad || X === EX.hurt) head += `<path d="M${f(fx - 5)} ${hc + 18.5} Q${f(fx)} ${hc + 24} ${f(fx + 5)} ${hc + 18.5}Z" fill="#7a3a42"/>`;
    } else {
      head += shp(`M${f(hb - hxs * 0.95)} ${hc - 6} Q${f(hb - hxs * 0.98)} ${hc + 10} ${f(hb - hxs * 0.7)} ${hc + 16} Q${hb} ${hc + 21} ${f(hb + hxs * 0.7)} ${hc + 16} Q${f(hb + hxs * 0.98)} ${hc + 10} ${f(hb + hxs * 0.95)} ${hc - 6} Q${hb} ${hc - 12} ${f(hb - hxs * 0.95)} ${hc - 6}Z`, mix(P.mous, '#8a7a6a', 0.55), { w: 0.7, x: `<path d="M${hb - 14} ${hc - 4} q2 9 0 14 M${hb - 3} ${hc - 2} q2 9 0 16 M${hb + 9} ${hc - 3} q-2 8 0 14" fill="none" stroke="#4a3e34" stroke-width="1.1" opacity=".6"/>` });
    }
  }
  // =============== assemble ===============
  const bodyG = o.noBody ? '' : `<g transform="translate(0,${f(bob)}) rotate(${f(lean)})">${body}<g transform="translate(0,${f(X.hy)}) rotate(${f(tilt)} 0 -60)">${head}</g></g>`;
  const orbs = o.orbs && !o.noBody ? orbitRing({ ...o.orbs, sil }, 0, o.orbs.y ?? -46, o.orbs.R ?? 52) : { back: '', front: '' };
  const trail = run && !sil && !bk ? `<g style="mix-blend-mode:screen"><path d="M${f(staffX)} -120 Q${f(staffX - 26)} -122 ${f(staffX - 58)} -114" stroke="#ffb84a" stroke-width="9" fill="none" stroke-linecap="round" opacity=".3" filter="url(#b4)"/></g>` : '';
  let out = orbs.back + trail + stBack + bodyG + stFront + orbs.front;
  if (o.flash) out = `<g filter="url(#${o.flash === 'red' ? 'whurtR' : 'whurt'})">${out}</g>`;
  if (o.light) out = `<g filter="url(#wlt${Math.round(o.light * 100)})">${out}</g>`;
  if (o.alpha != null) out = `<g opacity="${o.alpha}">${out}</g>`;
  if (o.sx != null || o.sy != null) out = `<g transform="scale(${o.sx ?? 1},${o.sy ?? 1})">${out}</g>`;
  return fin(o, out);
}
export const poleX = (view, v) => { const { c, s } = g(view); return view === 'side' ? (v != null ? v * 0.45 + 6 : 21) : (v ?? 47) * c + 2 * s; };
export const ELIAS_H = 140; // units, feet to the top of the lantern cap (about 75px desktop / 50px phone at 112 units = 60px)
