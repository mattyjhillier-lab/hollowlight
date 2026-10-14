// ELIAS design takes A / B / C: static mock-up drawing code, not game code.
// Hollowlight Style v1 via ../style-lab/lab.mjs shp(). Origin = ground under feet, y up = negative. Faces +x; dir:-1 mirrors.
// view: front | 3q | side | back.   Imports (never edits) the style-lab helpers.
import { shp, stk, cap as cap0, ell, circ, glow as glow0, mix } from '../style-lab/lab.mjs';
let NOGLOW = false; export const setNoGlow = (v) => { NOGLOW = !!v; };
const glow = (...a) => (NOGLOW ? '' : glow0(...a));
const cap = (...a) => cap0(...a.map(Number));

export const f1 = (n) => (+n).toFixed(1);
const VW = { front: 0, '3q': 0.6, side: 1.2, back: Math.PI };
const g = (view) => { const th = VW[view || 'front']; return { th, c: Math.cos(th), s: Math.sin(th), xs: 1 - 0.36 * Math.abs(Math.sin(th)) }; };
const fin = (o, body) => { const q = o.sil ? `<g filter="url(#wsil)">${body}</g>` : body; return o.dir === -1 ? `<g transform="scale(-1,1)">${q}</g>` : q; };
const INK = '#4a3238';

// ---------------- shared light bits ----------------
// A flame: base at (x,y), height about 22*s*fl. lean pushes the tip sideways (wind / running).
export function flame(x, y, s = 1, o = {}) {
  const fl = o.fl ?? 1, lean = o.lean ?? 0, h = 22 * s * Math.max(fl, 0.2), w = 7 * s * (0.75 + 0.25 * Math.min(fl, 1.3));
  const d = (k) => { const hh = h * k, ww = w * k; return `M${f1(x)} ${f1(y)} C${f1(x - ww)} ${f1(y - hh * 0.1)} ${f1(x - ww * 0.9 + lean * k * 0.3)} ${f1(y - hh * 0.55)} ${f1(x + lean * k)} ${f1(y - hh)} C${f1(x + ww * 0.9 + lean * k * 0.3)} ${f1(y - hh * 0.55)} ${f1(x + ww)} ${f1(y - hh * 0.1)} ${f1(x)} ${f1(y)}Z`; };
  let r = o.sil ? '' : glow(x + lean * 0.4, y - h * 0.5, (22 * s * fl + 8) * (o.gk ?? 1), (22 * s * fl + 8) * (o.gk ?? 1), '#ffc96b', o.ga ?? 0.85);
  r += `<path d="${d(1)}" fill="#ff9d3a"/><path d="${d(0.74)}" fill="#ffd05a"/><path d="${d(0.44)}" fill="#fff6d0"/>`;
  return r;
}
// A Holy Orbit light: lavender-white core with a warm bloom (weapons.json colour #e8e0ff)
export function orb(x, y, r, o = {}) {
  return (o.sil ? '' : glow(x, y, r * 3.4, r * 3.4, '#d9ccff', 0.7) + glow(x, y, r * 2.1, r * 2.1, '#ffe3a6', 0.7)) + `<circle cx="${f1(x)}" cy="${f1(y)}" r="${r}" fill="#e8e0ff" stroke="#9a8cc8" stroke-width="1"/><circle cx="${f1(x - r * 0.15)}" cy="${f1(y - r * 0.15)}" r="${f1(r * 0.55)}" fill="#fffdf2"/>`;
}
// Holy Orbit ring around the body: returns { back, front } so the orbs pass behind and in front.
export function orbit(o, cx, cy, R) {
  const n = o.n ?? 3, ph = o.ph ?? 0.6, ry = R * 0.36, rr = o.r ?? 4.4; let back = '', front = '';
  if (!o.sil) { const tr = `<ellipse cx="${cx}" cy="${cy}" rx="${R}" ry="${ry}" fill="none" stroke="#d9ccff" stroke-width="1.2" stroke-dasharray="1.4 5" opacity=".5"/>`; back += tr; }
  for (let i = 0; i < n; i++) {
    const a = ph + (i * 2 * Math.PI) / n, x = cx + R * Math.cos(a), y = cy + ry * Math.sin(a), k = 0.85 + 0.15 * Math.sin(a);
    const comet = o.sil ? '' : `<path d="M${f1(x)} ${f1(y)} Q${f1(cx + R * Math.cos(a - 0.35))} ${f1(cy + ry * Math.sin(a - 0.35) - 1)} ${f1(cx + R * Math.cos(a - 0.7))} ${f1(cy + ry * Math.sin(a - 0.7))}" fill="none" stroke="#ffe3a6" stroke-width="2.4" stroke-linecap="round" opacity=".4"/>`;
    (Math.sin(a) < 0 ? (back += comet + orb(x, y, rr * k, o)) : (front += comet + orb(x, y, rr * k, o)));
  }
  return { back, front };
}
// Iron ring lying flat (ellipse) with candle sockets; back/front halves. Used by C's collar and every ground wheel.
export function flatRing(cx, cy, rx, ry, o = {}) {
  const col = o.col ?? '#4d5160', n = o.n ?? 8, ph = o.ph ?? Math.PI / 8, wd = o.w ?? 4.4, fs = o.fs ?? 0.55, fl = o.fl ?? 1, lean = o.lean ?? 0;
  let back = '', front = '';
  back += stk(`M${f1(cx - rx)} ${f1(cy)} A${f1(rx)} ${f1(ry)} 0 0 1 ${f1(cx + rx)} ${f1(cy)}`, col, wd);
  front += stk(`M${f1(cx + rx)} ${f1(cy)} A${f1(rx)} ${f1(ry)} 0 0 1 ${f1(cx - rx)} ${f1(cy)}`, col, wd);
  if (!o.sil) front += `<path d="M${f1(cx + rx - 1)} ${f1(cy + 1)} A${f1(rx)} ${f1(ry)} 0 0 1 ${f1(cx - rx + 1)} ${f1(cy + 1)}" fill="none" stroke="${mix(col, '#ffffff', 0.4)}" stroke-width="1" opacity=".6" transform="translate(0,-1.4)"/>`;
  for (let i = 0; i < n; i++) {
    const a = ph + (i * 2 * Math.PI) / n, x = cx + rx * Math.cos(a), y = cy + ry * Math.sin(a), fr = Math.sin(a) >= 0, k = fr ? 1 : 0.85;
    const sk = shp(`M${f1(x - 3.4 * k)} ${f1(y)} L${f1(x + 3.4 * k)} ${f1(y)} L${f1(x + 2.6 * k)} ${f1(y + 3 * k)} L${f1(x - 2.6 * k)} ${f1(y + 3 * k)}Z`, col, { w: 0.5, nl: false })
      + shp(`M${f1(x - 1.9 * k)} ${f1(y)} L${f1(x - 1.9 * k)} ${f1(y - 5 * k)} L${f1(x + 1.9 * k)} ${f1(y - 5 * k)} L${f1(x + 1.9 * k)} ${f1(y)}Z`, '#f6efe0', { w: 0.4 })
      + (fl > 0 ? flame(x, y - 5 * k, fs * k, { fl, sil: o.sil, lean, ga: 0.6, gk: 0.8 }) : '');
    (fr ? (front += sk) : (back += sk));
  }
  return { back, front };
}
// bright ground wheel for the Candle Wheel keyframes
function bloomGround(cx, cy, R, ry, t, seed) {
  // restored grass disc growing with t (W2 look), radial gradient + tufts, over hollow-grey ground
  if (t <= 0.01) return '';
  const rr = R * t, ryy = ry * t, id = 'bg' + Math.round(R) + seed + Math.round(t * 100);
  const tufts = []; for (let i = 0; i < 26; i++) { const a = i * 2.399 + seed, d = Math.sqrt(((i * 37) % 26) / 26) * 0.92; const x = cx + Math.cos(a) * rr * d, y = cy + Math.sin(a) * ryy * d; tufts.push(`<path d="M${f1(x)} ${f1(y)} l-1.6 -4.6 l1.6 2 l1.4 -4 l.8 4 l1.8 -2.2 l-1.4 4.8z" fill="${i % 3 ? '#4f8f46' : '#b4e07e'}"/>`); if (i % 5 === 0) tufts.push(`<circle cx="${f1(x + 3)}" cy="${f1(y - 1)}" r="1.5" fill="${['#ffb347', '#ff8fa3', '#fff1c4'][i % 3]}"/>`); }
  return `<defs><radialGradient id="${id}"><stop offset="0" stop-color="#b6e684"/><stop offset=".6" stop-color="#6fb257"/><stop offset="1" stop-color="#3f7a46"/></radialGradient><clipPath id="${id}c"><ellipse cx="${cx}" cy="${cy}" rx="${f1(rr)}" ry="${f1(ryy)}"/></clipPath></defs><ellipse cx="${cx}" cy="${cy}" rx="${f1(rr)}" ry="${f1(ryy)}" fill="url(#${id})"/><g clip-path="url(#${id}c)">${tufts.join('')}</g><ellipse cx="${cx}" cy="${cy}" rx="${f1(rr)}" ry="${f1(ryy)}" fill="none" stroke="#e9d49a" stroke-width="1.6" opacity=".7"/>`;
}
const hollowGround = (cx, cy, R, ry) => { let v = ''; for (let i = 0; i < 9; i++) { const a = i * 0.7 + 0.3, x = cx + Math.cos(a) * R * 0.85 * ((i * 5 % 9) / 9 + 0.1), y = cy + Math.sin(a) * ry * 0.8; v += `<path d="M${f1(x)} ${f1(y)} q4 -2 8 1 t7 -1" stroke="#1d1626" stroke-width="1.2" fill="none" opacity=".55"/>`; } return `<ellipse cx="${cx}" cy="${cy}" rx="${R * 1.22}" ry="${ry * 1.22}" fill="#59657a"/><ellipse cx="${cx}" cy="${cy}" rx="${R * 1.22}" ry="${ry * 1.22}" fill="none" stroke="#6b788d" stroke-width="1.2"/>${v}`; };

// ---- the Candle Wheel keyframe: plant / bloom / orbs lock / fade.  take = 'A'|'B'|'C'; fig = function(opts) -> svg (character at origin, scale already applied by caller)
export function wheelFrame(take, step, cx, cy, R, charFn, k) {
  const ry = R * 0.4, sc = k;
  const bloom = [0.16, 0.72, 1, 1][step], glowK = [0.4, 1, 0.9, 0.35][step], ringA = [0.95, 1, 1, 0.38][step];
  let o = hollowGround(cx, cy, R, ry);
  o += bloomGround(cx, cy + 0, R, ry, bloom, 3 + step);
  // light pool of the wheel
  o += glow(cx, cy, R * 1.25, ry * 2.1, '#ffc45a', 0.55 * glowK);
  // the ring itself
  const ringCol = take === 'B' ? '#ffe3a6' : take === 'C' ? '#4d5160' : '#565c6e';
  const rrx = step === 0 ? R * 0.34 : R, rry = step === 0 ? ry * 0.34 : ry;
  let ringBack = '', ringFront = '';
  if (take === 'B') {
    // a wheel of pure lantern light: a bright rope ring with 8 small lantern dots + spokes of light from the spade foot
    const sp = []; for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 + Math.PI / 8; sp.push(`<path d="M${cx} ${cy} L${f1(cx + rrx * Math.cos(a))} ${f1(cy + rry * Math.sin(a))}" stroke="#ffe3a6" stroke-width="1.6" stroke-dasharray="1.4 3" stroke-linecap="round" opacity="${0.8 * ringA}"/>`); }
    ringBack = `<g style="mix-blend-mode:screen"><ellipse cx="${cx}" cy="${cy}" rx="${f1(rrx)}" ry="${f1(rry)}" fill="none" stroke="#ffc45a" stroke-width="9" opacity="${0.3 * ringA}" filter="url(#b4)"/></g>${sp.join('')}<ellipse cx="${cx}" cy="${cy}" rx="${f1(rrx)}" ry="${f1(rry)}" fill="none" stroke="#fff2c0" stroke-width="2.8" opacity="${ringA}"/>`;
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 + Math.PI / 8, x = cx + rrx * Math.cos(a), y = cy + rry * Math.sin(a); ringFront += `<g opacity="${ringA}">` + shp(`M${f1(x - 3)} ${f1(y + 3)} L${f1(x + 3)} ${f1(y + 3)} L${f1(x + 2.4)} ${f1(y - 3)} L${f1(x - 2.4)} ${f1(y - 3)}Z`, '#3b4250', { w: 0.4 }) + `<circle cx="${f1(x)}" cy="${f1(y)}" r="1.7" fill="#fff2c0"/>` + '</g>' + glow(x, y - 2, 9, 9, '#ffc96b', 0.8 * ringA); }
  } else {
    const rg = flatRing(cx, cy, rrx, rry, { col: ringCol, n: 8, fs: step === 0 ? 0.4 : 0.58, fl: step === 3 ? 0.35 : step === 1 ? 1.15 : 1, w: 4 });
    // spokes
    let spokes = ''; for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 + Math.PI / 8; spokes += `<path d="M${cx} ${cy} L${f1(cx + rrx * Math.cos(a))} ${f1(cy + rry * Math.sin(a))}" stroke="${take === 'A' ? '#ffe3a6' : '#fff2c0'}" stroke-width="1.5" stroke-dasharray="1.4 3.2" stroke-linecap="round" opacity="${0.75 * ringA}"/>`; }
    ringBack = spokes + `<g opacity="${ringA}">${rg.back}</g>`; ringFront = `<g opacity="${ringA}">${rg.front}</g>`;
  }
  o += ringBack;
  // orbs: step 2 locked on the ring (5 evenly spaced hovering 12 above it); step 3 lifting away; step 1 arriving from the figure
  const orbs = [];
  const n = 5;
  for (let i = 0; i < n; i++) {
    const a = i * 2 * Math.PI / n + 0.5;
    let x = cx + R * Math.cos(a), y = cy + ry * Math.sin(a) - 9;
    if (step === 1) { const q = 0.55; x = cx + R * 0.55 * Math.cos(a + 0.9); y = cy + ry * 0.55 * Math.sin(a + 0.9) - 26; }
    if (step === 3) { x = cx + R * 0.72 * Math.cos(a + 0.4); y = cy + ry * 0.72 * Math.sin(a + 0.4) - 30; }
    if (step === 0) { x = cx + 34 * Math.cos(a + 1.2); y = cy - 38 + 13 * Math.sin(a + 1.2); }
    orbs.push([x, y, Math.sin(a)]);
  }
  const orbSvg = (arr) => arr.map(([x, y]) => `<g opacity="${step === 3 ? 0.65 : 1}">${orb(x, y, 4.2)}</g>`).join('');
  o += orbSvg(orbs.filter((q) => q[1] < cy - 12 || q[2] < 0 && step !== 0));
  // figure
  o += `<g transform="translate(${cx},${cy + 3}) scale(${sc})">${charFn(step)}</g>`;
  o += ringFront;
  o += orbSvg(orbs.filter((q) => !(q[1] < cy - 12 || q[2] < 0 && step !== 0)));
  // heal motes rising inside the ring (step 2), faint at step 1/3
  if (step >= 1 && step <= 3) for (let i = 0; i < 4; i++) { const x = cx + (i - 1.5) * R * 0.36, y = cy - 6 - (i % 2) * 14 - 16 * (step === 3 ? 1.2 : 0.4); o += `<path d="M${f1(x - 2.5)} ${f1(y)} h5 M${f1(x)} ${f1(y - 2.5)} v5" stroke="#d6ffb0" stroke-width="1.7" stroke-linecap="round" opacity="${step === 2 ? 0.95 : 0.5}"/>`; }
  // plant impact ticks
  if (step === 0) o += `<path d="M${cx - 30} ${cy + 4} l-8 3 M${cx + 30} ${cy + 4} l8 3 M${cx - 18} ${cy + 12} l-5 6 M${cx + 18} ${cy + 12} l5 6" stroke="#ffe3a6" stroke-width="1.8" stroke-linecap="round" opacity=".8"/>`;
  return o;
}

// ======================================================================================
// TAKE A: "KEEPER OF THE WHEEL"  (wide bell robe, iron candle-wheel as a halo, spectacles, white beard)
// ======================================================================================
export const PA = { robe: '#5d5189', robeDk: '#3f3768', lining: '#8a7fc0', stole: '#f2efe2', beard: '#f5f1e8', skin: '#ecc7a9', iron: '#565c6e', ironLt: '#98a0b8', cap: '#45396f', boot: '#2a2838', flame: '#ffd05a', amber: '#ffb84a', orb: '#e8e0ff', cheek: '#f0a090', glass: '#cfd6e4', rope: '#d8cfb8' };
export const EXA = {
  prayer: { name: 'PRAYER (IDLE)', eye: 'closed', brow: 0, mouth: 'hint', tilt: 2, hy: 1.5, fl: 1, note: 'eyes closed, halo flames steady' },
  wry: { name: 'WRY JOKE', eye: 'open', brow: 1, mouth: 'smirk', tilt: -5, hy: 0, fl: 1.1, note: 'one brow up, halo flames bob' },
  weary: { name: 'WEARY (HURT)', eye: 'x', brow: -1, mouth: 'open', tilt: -8, hy: 2, fl: 0.5, note: 'squint, flames gutter low' },
  cast: { name: 'CAST', eye: 'up', brow: 1, mouth: 'open', tilt: 0, hy: -1, fl: 1.35, note: 'eyes up, flames flare' },
  worried: { name: 'WORRIED', eye: 'open', brow: -1, mouth: 'hint', tilt: -3, hy: 2, fl: 0.7, note: 'brows slant, flames shrink' },
};
export function eliasA(o = {}) {
  const view = o.view || 'front', X = EXA[o.expr || 'prayer'], sil = !!o.sil, run = !!o.run, P = PA;
  const { th, c, s, xs } = g(view), sw = o.sway ?? (run ? 6 : 0), bob = o.bob ?? 0, lean = o.lean ?? (run ? 2.5 : 0), tilt = o.tilt ?? X.tilt, fl = o.fl ?? X.fl, haloOn = o.halo !== false;
  const hb = -2 * s, fx = 15 * s, hc = -92, flLean = run ? -3.2 : 0;
  // ----- halo: iron candle-wheel strapped on his back; faces the camera in front view, edge-on in side view -----
  const R = 32, hcx = -7 * s, hcy = -93, hrx = Math.max(Math.abs(c) * R, 3.4);
  let halo = '';
  if (haloOn) {
    if (!sil) halo += glow(hcx, hcy, 76, 66, '#ffc45a', 0.4 * Math.min(1.2, fl));
    if (run && !sil && view !== 'back') for (const a of [0.4, 1.2, 2.0, 2.7]) { const px = hcx + hrx * Math.cos(a) * 1.05, py = hcy - R * Math.sin(a) * 1.05 - 8; halo += `<g style="mix-blend-mode:screen"><path d="M${f1(px)} ${f1(py)} q-16 -2 -34 2" stroke="#ffb84a" stroke-width="3.4" stroke-linecap="round" fill="none" opacity=".35" filter="url(#b2)"/></g>`; }
    halo += stk(`M${f1(hcx - hrx)} ${hcy} A${f1(hrx)} ${R} 0 1 1 ${f1(hcx + hrx)} ${hcy} A${f1(hrx)} ${R} 0 1 1 ${f1(hcx - hrx)} ${hcy}Z`, P.iron, 5.2);
    halo += `<ellipse cx="${f1(hcx)}" cy="${hcy}" rx="${f1(Math.max(hrx - 4.2, 0.8))}" ry="${R - 4.2}" fill="none" stroke="${P.ironLt}" stroke-width="1" opacity=".55"/>`;
    for (let i = 0; i < 8; i++) {
      const a = Math.PI / 8 + (i * Math.PI) / 4, px = hcx + hrx * Math.cos(a), py = hcy - R * Math.sin(a);
      let dx = Math.cos(a) * (0.3 + 0.7 * Math.abs(c)), dy = -Math.sin(a); const dl = Math.hypot(dx, dy); dx /= dl; dy /= dl;
      const ex = px + dx * 8, ey = py + dy * 8;
      halo += stk(`M${f1(px)} ${f1(py)} L${f1(ex)} ${f1(ey)}`, '#f6efe0', 4.2);
      halo += flame(ex, ey - 1, 0.62, { fl, lean: flLean, sil, ga: 0.55, gk: 0.9 });
    }
  }
  // ----- robe: wide bell -----
  const shW = 15 * xs, hemW = 46 * xs, ph = run ? 1 : 0;
  const hem = `Q${f1(-hemW * 0.66 + sw)} -1 ${f1(-hemW * 0.33 + sw)} -5 Q${f1(sw)} 1 ${f1(hemW * 0.33 + sw)} -5 Q${f1(hemW * 0.66 + sw)} -1 ${f1(hemW + sw)} -6`;
  const robeD = `M${f1(-shW)} -66 C${f1(-shW - 7)} -46 ${f1(-hemW * 0.72 + sw * 0.3)} -26 ${f1(-hemW + sw)} -6 ${hem} C${f1(hemW * 0.72 + sw * 0.3)} -26 ${f1(shW + 7)} -46 ${f1(shW)} -66 Q0 -71 ${f1(-shW)} -66Z`;
  const lin = `<path d="M${f1(-hemW * 1.3 + sw)} -15 Q${f1(sw)} -7 ${f1(hemW * 1.3 + sw)} -15 L${f1(hemW * 1.3)} 6 L${f1(-hemW * 1.3)} 6Z" fill="${P.lining}"/><path d="M${f1(-hemW * 1.3 + sw)} -15 Q${f1(sw)} -7 ${f1(hemW * 1.3 + sw)} -15" fill="none" stroke="#f2efe2" stroke-width="1.6" stroke-dasharray="3 2.4" opacity=".8"/>`;
  const folds = [-0.6, -0.2, 0.25, 0.62].map((q) => `<path d="M${f1(q * shW * 0.9)} -62 Q${f1(q * hemW * 0.55)} -34 ${f1(q * hemW * 0.95 + sw)} -9" fill="none" stroke="${P.robeDk}" stroke-width="1.2" opacity=".5"/>`).join('');
  let body = '';
  // boots peeking
  body += shp(ell(f1(-9 * xs + sw * 0.4), -3, 7, 3.6), P.boot, { w: 0.7 }) + shp(ell(f1(9 * xs + sw * 0.4), -3, 7, 3.6), P.boot, { w: 0.7 });
  body += shp(robeD, P.robe, { w: 1, so: 7, x: lin + folds });
  const sx3 = 3 * s;
  if (view !== 'back') {
    // stole with flame embroidery + fringe
    body += shp(`M${f1(-5.5 + sx3)} -69 L${f1(5.5 + sx3)} -69 L${f1(8.5 + sx3 + sw * 0.6)} -9 L${f1(-8.5 + sx3 + sw * 0.6)} -9Z`, P.stole, { w: 0.8, so: 4, x: [-52, -34, -18].map((y) => `<path d="M${f1(sx3)} ${y} c-3 -3 -1.5 -6 0 -8 c1.5 2 3 5 0 8z" fill="${P.amber}"/>`).join('') + `<path d="M${f1(-8 + sx3)} -12 h16" stroke="${P.amber}" stroke-width="1.6" stroke-dasharray="2 1.6" opacity=".9"/>` });
    // harness strap + rope belt
    body += `<path d="M${f1(-14 * xs)} -64 L${f1(9 * xs + sx3)} -44" stroke="${P.iron}" stroke-width="3.2" stroke-linecap="round"/><path d="M${f1(-14 * xs)} -64 L${f1(9 * xs + sx3)} -44" stroke="${P.ironLt}" stroke-width="1" stroke-linecap="round" opacity=".6" transform="translate(0,-1)"/>`;
    body += shp(`M${f1(-17 * xs)} -46 Q0 -41 ${f1(17 * xs)} -46 L${f1(17.5 * xs)} -42 Q0 -37 ${f1(-17.5 * xs)} -42Z`, P.rope, { w: 0.6 }) + shp(circ(f1(sx3 + 9 * s), -41, 2.6), P.rope, { w: 0.5 });
  } else {
    // back: harness crossing, strap buckles to the wheel frame
    body += `<path d="M${f1(-12)} -66 L8 -44 M12 -66 L-8 -44" stroke="${P.iron}" stroke-width="3" stroke-linecap="round"/><path d="M-9 -34 h18" stroke="${P.rope}" stroke-width="3"/>` + shp(circ(0, -55, 2.4), P.ironLt, { w: 0.5 });
  }
  // sleeves + clasped hands holding one little candle
  if (view !== 'back') {
    const hx = 5 * s + sx3 * 0.4, hy = -54;
    for (const q of [-1, 1]) { if (view === 'side' && q < 0) continue; body += shp(cap(f1(q * 13 * xs), -62, f1(hx + q * 5), hy + 1, 6.6, 5.2), P.robe, { w: 0.8 }) + shp(ell(f1(hx + q * 5), hy + 2, 5.6, 3.8), P.lining, { w: 0.6 }); }
    body += shp(`M${f1(hx - 2)} ${hy - 1} h4 v-9 h-4z`, '#f6efe0', { w: 0.5 }) + flame(hx, hy - 10, 0.55, { fl: Math.min(fl, 1.3), lean: flLean * 0.6, sil, ga: 0.8 });
    body += shp(circ(f1(hx - 2.6), hy + 0.6, 3.6), P.skin, { w: 0.6 }) + shp(circ(f1(hx + 2.6), hy + 0.6, 3.6), P.skin, { w: 0.6 });
  }
  // ----- head -----
  let head = '';
  const hxs = 25 * (1 - 0.1 * s);
  head += shp(ell(f1(hb - hxs + 2), hc + 3, 6, 9), P.beard, { w: 0.7 }) + shp(ell(f1(hb + hxs - 2), hc + 3, 6, 9), P.beard, { w: 0.7 });
  head += shp(ell(hb, hc, f1(hxs), 23), P.skin, { w: 1, so: 6 });
  const capD = `M${f1(hb - hxs * 0.86)} ${hc - 9} Q${f1(hb - hxs * 0.8)} ${hc - 27} ${hb} ${hc - 27} Q${f1(hb + hxs * 0.8)} ${hc - 27} ${f1(hb + hxs * 0.86)} ${hc - 9} Q${hb} ${hc - 14} ${f1(hb - hxs * 0.86)} ${hc - 9}Z`;
  if (view === 'back') {
    head += shp(ell(hb, hc + 3, f1(hxs * 0.99), 21), P.beard, { w: 0.8, x: `<path d="M${hb - 12} ${hc - 4} q3 10 0 18 M${hb} ${hc - 2} q2 10 0 18 M${hb + 12} ${hc - 4} q-3 10 0 18" fill="none" stroke="#a9a2c4" stroke-width="1.1" opacity=".7" />` });
    head += shp(capD, P.cap, { w: 0.9 });
  } else {
    const bd = `M${f1(hb - hxs * 0.9)} ${hc + 1} C${f1(hb - hxs * 1.15)} ${hc + 24} ${f1(hb - 12)} ${hc + 36} ${f1(hb + fx * 0.25)} ${hc + 42} C${f1(hb + 12)} ${hc + 36} ${f1(hb + hxs * 1.15)} ${hc + 24} ${f1(hb + hxs * 0.9)} ${hc + 1} Q${f1(hb + fx * 0.3)} ${hc + 10} ${f1(hb - hxs * 0.9)} ${hc + 1}Z`;
    head += shp(bd, P.beard, { w: 0.9, so: 6, x: `<path d="M${f1(hb + fx * 0.2)} ${hc + 14} q-3 12 0 24 M${f1(hb - 8)} ${hc + 14} q-1 10 2 20 M${f1(hb + 9 + fx * 0.3)} ${hc + 14} q1 10 -2 20" fill="none" stroke="${mix(P.beard, '#7a7394', 0.5)}" stroke-width="1" opacity=".6"/>` });
    head += shp(capD, P.cap, { w: 0.9, x: `<path d="M${f1(hb)} ${hc - 24} c-2.4 -2.6 -1 -5 0 -6.4 c1 1.4 2.4 3.8 0 6.4z" fill="${P.amber}"/>` });
    head += shp(ell(f1(fx), hc + 4, 4.4, 3.8), '#eba596', { w: 0.5 });
    // spectacles + eyes
    const brows = [], lens = [];
    for (const sg of [-1, 1]) {
      const a = th + sg * 0.5, cs = Math.cos(a); if (cs < 0.12) continue; const x = 21 * Math.sin(a) + hb, y = hc - 3, k = 0.5 + 0.5 * cs, rx = 7.2 * k;
      lens.push(`<ellipse cx="${f1(x)}" cy="${y}" rx="${f1(rx)}" ry="7.2" fill="#fff" opacity=".2"/><ellipse cx="${f1(x)}" cy="${y}" rx="${f1(rx)}" ry="7.2" fill="none" stroke="#8a91a6" stroke-width="1.7"/>`);
      let e = '';
      if (X.eye === 'closed') e = `<path d="M${f1(x - 4.2 * k)} ${y - 0.5} Q${f1(x)} ${y + 3.6} ${f1(x + 4.2 * k)} ${y - 0.5}" fill="none" stroke="${INK}" stroke-width="1.9" stroke-linecap="round"/>`;
      else if (X.eye === 'x') e = `<path d="M${f1(x + sg * 4 * k)} ${y - 3} L${f1(x - sg * 3 * k)} ${y} L${f1(x + sg * 4 * k)} ${y + 3}" fill="none" stroke="${INK}" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>` + (sg > 0 && cs > 0.5 ? `<path d="M${f1(x + 2)} ${y + 5} q2 2.4 0 4.2" fill="${'#bfe4ff'}" stroke="none"/>` : '');
      else if (X.eye === 'up') e = `<ellipse cx="${f1(x)}" cy="${y - 1}" rx="${f1(2.8 * k)}" ry="3.6" fill="${INK}"/><circle cx="${f1(x - 0.8)}" cy="${y - 2.4}" r="1.2" fill="#fff"/>`;
      else e = `<ellipse cx="${f1(x)}" cy="${y}" rx="${f1(2.5 * k)}" ry="3.2" fill="${INK}"/><circle cx="${f1(x - 0.7)}" cy="${y - 1.2}" r="1" fill="#fff"/>`;
      lens.push(e);
      const raise = X.brow === 1 && (sg > 0 || X.eye === 'up') ? -3 : 0, slant = X.brow === -1 ? -sg * 2.4 : (X.brow === 1 && sg > 0 ? -1.2 : 0);
      brows.push(`<path d="M${f1(x - 5.6 * k)} ${f1(y - 10 + raise + slant)} Q${f1(x)} ${f1(y - 13.4 + raise)} ${f1(x + 5.6 * k)} ${f1(y - 10 + raise - slant)}" fill="none" stroke="${P.beard}" stroke-width="3.8" stroke-linecap="round"/><path d="M${f1(x - 5.6 * k)} ${f1(y - 10 + raise + slant)} Q${f1(x)} ${f1(y - 13.4 + raise)} ${f1(x + 5.6 * k)} ${f1(y - 10 + raise - slant)}" fill="none" stroke="${mix(P.beard, '#7a7394', 0.5)}" stroke-width="1" opacity=".6"/>`);
    }
    head += `<ellipse cx="${f1(fx - 12)}" cy="${hc + 6}" rx="4.4" ry="3" fill="${P.cheek}" opacity=".4"/><ellipse cx="${f1(fx + 13)}" cy="${hc + 6}" rx="4.4" ry="3" fill="${P.cheek}" opacity=".4"/>`;
    if (view === 'front' || view === '3q') head += `<path d="M${f1(fx - 11)} ${hc - 3} L${f1(fx + 11)} ${hc - 3}" stroke="#8a91a6" stroke-width="1.5"/>`;
    head += lens.join('') + brows.join('');
    // moustache
    const mo = X.mouth === 'smirk' ? -2.2 : 0;
    head += shp(`M${f1(fx)} ${hc + 6} Q${f1(fx - 10)} ${hc + 3} ${f1(fx - 15)} ${hc + 10 + mo * -1} Q${f1(fx - 9)} ${hc + 14} ${f1(fx)} ${hc + 10}Z`, P.beard, { w: 0.6 }) + shp(`M${f1(fx)} ${hc + 6} Q${f1(fx + 10)} ${hc + 3} ${f1(fx + 15)} ${hc + 10 + mo} Q${f1(fx + 9)} ${hc + 14} ${f1(fx)} ${hc + 10}Z`, P.beard, { w: 0.6 });
    if (X.mouth === 'open') head += `<ellipse cx="${f1(fx)}" cy="${hc + 15}" rx="3" ry="3.6" fill="#7a3a42"/>`;
    else head += `<path d="M${f1(fx - 3)} ${hc + 13.4} Q${f1(fx)} ${hc + (X.mouth === 'smirk' ? 16.4 : 15.4)} ${f1(fx + 3)} ${hc + 13.4}" fill="none" stroke="${INK}" stroke-width="1.3" stroke-linecap="round" opacity=".8"/>`;
  }
  const bodyG = `<g transform="translate(0,${f1(bob)}) rotate(${f1(lean)})">${body}<g transform="translate(0,${f1(X.hy)}) rotate(${f1(tilt)} 0 -66)">${head}</g></g>`;
  const orbs = o.orbs ? orbit({ ...o.orbs, sil }, 0, -58, o.orbs.R ?? 62) : { back: '', front: '' };
  const ringTop = view === 'back' ? halo : '';
  return fin(o, orbs.back + (view === 'back' ? '' : halo) + bodyG + ringTop + orbs.front);
}

// ======================================================================================
// TAKE B: "THE LAMPLIGHTER" (stout gravedigger-turned-lamplighter: lantern-staff with a spade foot, patched coat, light spills from the pockets)
// ======================================================================================
export const PB = { coat: '#9a5a3c', coatDk: '#6e3d2a', coatLt: '#bd7a52', slate: '#6f8aa3', cream: '#e8dcc0', sage: '#7d9a6a', cap: '#3d4a5c', skin: '#e4b794', mous: '#cfc8bb', wood: '#7a5a3c', iron: '#3b4250', pocketGlow: '#ffcf70', pants: '#4a4034', boot: '#2e2622', cheek: '#e88a7a', orb: '#e8e0ff' };
export const EXB = {
  kind: { name: 'KIND (IDLE)', eye: 'arc', brow: 0, hy: 0, tilt: 0, fl: 1, note: 'smile-arcs, lantern steady' },
  tender: { name: 'TENDER (SAD)', eye: 'open', brow: -1, hy: 2, tilt: -4, fl: 0.8, note: 'brows tilt up, lantern dips' },
  hurt: { name: 'HURT', eye: 'x', brow: -1, hy: 1, tilt: -7, fl: 0.45, note: 'squint, lantern gutters, pockets dim' },
  laugh: { name: 'LAUGH', eye: 'arc', brow: 1, hy: -1, tilt: 4, fl: 1.2, note: 'big moustache bounce, sparks leap' },
  cast: { name: 'BRACE (CAST)', eye: 'closed', brow: 1, hy: 1, tilt: 0, fl: 1.4, note: 'jaw set, spade driven in, lantern flares' },
};
export function eliasB(o = {}) {
  const view = o.view || 'front', X = EXB[o.expr || 'kind'], sil = !!o.sil, run = !!o.run, P = PB, f = f1;
  const { th, c, s, xs } = g(view), sw = o.sway ?? (run ? 4 : 0), bob = o.bob ?? 0, lean = o.lean ?? (run ? 3 : 0), tilt = o.tilt ?? X.tilt, fl = o.fl ?? X.fl, up = o.staffUp ?? 0;
  const hb = -2 * s, fx = 14 * s, hc = -82, wx = (X_, Z_) => X_ * c + Z_ * s, staffX = wx(40, 2) + (run ? 4 : 0), fLean = run ? -3.4 : 0;
  // ----- lantern staff -----
  let staff = '';
  if (o.staff !== false) {
    const top = -112 - up, sxl = staffX, tiltS = run ? 4 : 0;
    staff += `<g transform="rotate(${tiltS} ${f(sxl)} -50)">`;
    staff += shp(cap(f(sxl), top + 4, f(sxl), -12 - up * 0.4, 2.5, 2.7), P.wood, { w: 0.8 });
    // spade foot
    staff += shp(`M${f(sxl - 4.6)} ${-17 - up * 0.4} L${f(sxl + 4.6)} ${-17 - up * 0.4} L${f(sxl + 5.4)} ${-8 - up * 0.4} L${f(sxl)} ${-1 - up * 0.4} L${f(sxl - 5.4)} ${-8 - up * 0.4}Z`, '#7b8394', { w: 0.8 });
    // lantern: iron cage + glowing glass + big flame
    const ly = top - 15, lw = 11.5;
    if (!sil) staff += glow(sxl, ly + 2, 66 * Math.min(fl, 1.4) + 14, 62 * Math.min(fl, 1.4) + 14, '#ffc96b', 0.95);
    staff += shp(`M${f(sxl - 5)} ${ly - 15} L${f(sxl + 5)} ${ly - 15} L${f(sxl + lw + 1)} ${ly - 11} L${f(sxl - lw - 1)} ${ly - 11}Z`, P.iron, { w: 0.8 }) + `<circle cx="${f(sxl)}" cy="${ly - 18}" r="3" fill="none" stroke="${P.iron}" stroke-width="1.8"/>`;
    staff += shp(`M${f(sxl - lw)} ${ly - 11} L${f(sxl + lw)} ${ly - 11} L${f(sxl + lw - 1)} ${ly + 15} L${f(sxl - lw + 1)} ${ly + 15}Z`, '#ffe7ae', { w: 0.9, so: 3 });
    staff += `<path d="M${f(sxl - lw + 1)} ${ly - 9} L${f(sxl - lw + 2)} ${ly + 13} M${f(sxl + lw - 1)} ${ly - 9} L${f(sxl + lw - 2)} ${ly + 13} M${f(sxl)} ${ly - 10} L${f(sxl)} ${ly + 13}" stroke="${P.iron}" stroke-width="2" stroke-linecap="round"/>`;
    staff += flame(sxl, ly + 11, 0.9, { fl, lean: fLean * 0.5, sil, gk: 0.3, ga: 0.2 });
    staff += shp(`M${f(sxl - lw - 2)} ${ly + 15} L${f(sxl + lw + 2)} ${ly + 15} L${f(sxl + lw - 2)} ${ly + 19.4} L${f(sxl - lw + 2)} ${ly + 19.4}Z`, P.iron, { w: 0.7 });
    staff += `</g>`;
  }
  // ----- body: stout coat -----
  const shW = 25 * xs, hemW = 35 * xs;
  const coatD = `M${f(-shW)} -58 Q${f(-shW - 6)} -40 ${f(-hemW + sw * 0.5)} -16 Q${f(sw * 0.5 - 8)} -10 ${f(sw * 0.5)} -13 Q${f(sw * 0.5 + 8)} -10 ${f(hemW + sw * 0.5)} -16 Q${f(shW + 6)} -40 ${f(shW)} -58 Q0 -66 ${f(-shW)} -58Z`;
  let body = '';
  // trousers + boots
  const stp = run ? 4 : 0;
  body += shp(`M${f(-14 * xs)} -18 L${f(14 * xs)} -18 L${f(15 * xs + stp)} -6 L${f(-15 * xs - stp)} -6Z`, P.pants, { w: 0.8 });
  body += shp(ell(f(-11 * xs - stp + 3 * s), -4, 9.4, 5), P.boot, { w: 0.8 }) + shp(ell(f(11 * xs + stp + 3 * s), -4, 9.4, 5), P.boot, { w: 0.8 });
  const patches = view === 'back'
    ? `<rect x="-14" y="-52" width="22" height="19" fill="${P.slate}"/><path d="M-14 -52 h22 v19 h-22z" fill="none" stroke="${P.cream}" stroke-width="1.4" stroke-dasharray="3 2"/><rect x="6" y="-28" width="11" height="10" fill="${P.sage}"/><path d="M6 -28 h11 v10 h-11z" fill="none" stroke="${P.cream}" stroke-width="1.2" stroke-dasharray="2.4 2"/>`
    : `<rect x="${f(-shW + 3)}" y="-56" width="12" height="9" fill="${P.sage}" transform="rotate(-8 ${f(-shW + 8)} -50)"/><rect x="${f(shW - 14)}" y="-45" width="11" height="11" fill="${P.slate}"/><path d="M${f(shW - 14)} -45 h11 v11 h-11z" fill="none" stroke="${P.cream}" stroke-width="1.2" stroke-dasharray="2.4 2"/><rect x="${f(-shW + 1)}" y="-26" width="${f(14 * xs)}" height="9" fill="${P.cream}" opacity=".9"/>`;
  body += shp(coatD, P.coat, { w: 1.05, so: 7, x: patches + `<path d="M${f(-hemW - 4)} -18 Q0 -8 ${f(hemW + 4)} -18 L${f(hemW + 4)} -2 L${f(-hemW - 4)} -2Z" fill="${P.coatDk}" opacity=".4"/>` });
  if (view !== 'back') {
    // front opening seam, buttons, collar
    body += `<path d="M${f(2 * s)} -60 L${f(2 * s)} -14" stroke="${P.coatDk}" stroke-width="1.6" opacity=".7"/>`;
    for (const y of [-50, -39, -28]) body += shp(circ(f(5 * s + 5 * xs), y, 2.3), P.cream, { w: 0.5 });
    body += shp(`M${f(-14 * xs)} -64 Q0 -52 ${f(14 * xs)} -64 L${f(10 * xs)} -57 Q0 -50 ${f(-10 * xs)} -57Z`, P.coatDk, { w: 0.7 });
    // 4 pockets, each leaking light
    const pk = [[-17 * xs, -26, 15, 12], [17 * xs, -26, 15, 12], [-13 * xs, -45, 11, 9], [14 * xs, -47, 8, 7]];
    pk.forEach(([px, py, pw, ph], i) => {
      if (view === 'side' && i % 2 === 1) return;
      const gl = !sil ? glow(f(px), f(py - ph * 0.4), pw * 1.9, pw * 1.5, '#ffcf70', (0.8 * Math.min(fl, 1.2)) * (X === EXB.hurt ? 0.6 : 1)) : '';
      body += gl + shp(`M${f(px - pw / 2)} ${f(py - ph / 2)} L${f(px + pw / 2)} ${f(py - ph / 2)} L${f(px + pw / 2 - 0.8)} ${f(py + ph / 2)} L${f(px - pw / 2 + 0.8)} ${f(py + ph / 2)}Z`, P.coatLt, { w: 0.7, x: `<path d="M${f(px - pw / 2)} ${f(py - ph / 2 + 2.2)} L${f(px + pw / 2)} ${f(py - ph / 2 + 2.2)}" stroke="${P.coatDk}" stroke-width="1" opacity=".7"/><path d="M${f(px - pw / 2 + 1.5)} ${f(py + ph / 2 - 1.5)} L${f(px + pw / 2 - 1.5)} ${f(py + ph / 2 - 1.5)}" stroke="${P.cream}" stroke-width="1" stroke-dasharray="2 1.6" opacity=".8"/>` });
      if (!sil) body += `<path d="M${f(px - pw * 0.4)} ${f(py - ph / 2 - 0.3)} Q${f(px)} ${f(py - ph / 2 - 3)} ${f(px + pw * 0.4)} ${f(py - ph / 2 - 0.3)}" fill="none" stroke="#fff2c0" stroke-width="2" stroke-linecap="round" opacity=".95"/>` + `<circle cx="${f(px + (i % 2 ? 3 : -3))}" cy="${f(py - ph / 2 - 7 - (i % 3) * 2)}" r="1.5" fill="#fff2c0" opacity=".9"/>`;
    });
  } else {
    body += shp(`M${f(-9)} -22 q9 -5 18 0 q0 8 -9 8 q-9 0 -9 -8z`, '#a38660', { w: 0.7 }) + `<path d="M-12 -22 h24" stroke="${P.coatDk}" stroke-width="1.5" opacity=".6"/>`;
  }
  // arms: far (left) hanging, near (right) holding the staff
  const hxR = staffX, hyR = -48 - up * 0.5;
  if (view !== 'side') body += shp(cap(f(wx(-22, 0)), -54, f(wx(-31, 2)), -30, 7.4, 6.4), P.coat, { w: 0.9 }) + shp(circ(f(wx(-31, 2)), -26, 4.2), P.skin, { w: 0.6 });
  body += shp(cap(f(wx(22, 0)), -54, f(hxR - 1), hyR, 7.4, 6.2), P.coat, { w: 0.9 }) + shp(circ(f(hxR), hyR, 4.6), P.skin, { w: 0.6 });
  // ----- head -----
  let head = '';
  const hxs = 26 * (1 - 0.1 * s);
  head += shp(ell(f(hb - hxs + 3), hc + 5, 5.4, 8), P.mous, { w: 0.7 }) + shp(ell(f(hb + hxs - 3), hc + 5, 5.4, 8), P.mous, { w: 0.7 });
  head += shp(ell(hb, hc, f(hxs), 23), P.skin, { w: 1, so: 6 });
  head += shp(`M${f(hb - hxs * 0.95)} ${hc - 7} Q${f(hb - hxs * 0.9)} ${hc - 30} ${hb} ${hc - 30} Q${f(hb + hxs * 0.9)} ${hc - 30} ${f(hb + hxs * 0.95)} ${hc - 7} Q${hb} ${hc - 12} ${f(hb - hxs * 0.95)} ${hc - 7}Z`, P.cap, { w: 0.9, x: `<path d="M${f(hb - hxs)} ${hc - 15} Q${hb} ${hc - 21} ${f(hb + hxs)} ${hc - 15}" fill="none" stroke="${mix(P.cap, '#ffffff', 0.3)}" stroke-width="1" opacity=".5"/>` });
  if (view !== 'back') {
    head += shp(ell(f(fx + 2 * s), hc + 2, f(hxs * 0.8), 18), P.skin, { w: 0, nl: true });
    head += shp(`M${f(hb - hxs * 0.98)} ${hc - 8} Q${f(fx - 2)} ${hc - 4} ${f(hb + hxs * 0.98 + 6 * s)} ${hc - 8} L${f(hb + hxs * 0.98 + 10 * s)} ${hc - 5} Q${f(fx)} ${hc} ${f(hb - hxs * 0.98)} ${hc - 5}Z`, mix(P.cap, '#000', 0.12), { w: 0.8 }); // cap brim
    head += `<ellipse cx="${f(fx - 15)}" cy="${hc + 6}" rx="5" ry="3.4" fill="${P.cheek}" opacity=".55"/><ellipse cx="${f(fx + 15)}" cy="${hc + 6}" rx="5" ry="3.4" fill="${P.cheek}" opacity=".55"/>`;
    head += shp(ell(f(fx), hc + 5, 5.4, 4.6), '#ee9f8c', { w: 0.5 });
    for (const sg of [-1, 1]) {
      const a = th + sg * 0.5, cs = Math.cos(a); if (cs < 0.12) continue; const x = 20 * Math.sin(a) + hb, y = hc - 1, k = 0.5 + 0.5 * cs;
      let e = '';
      if (X.eye === 'arc') e = `<path d="M${f(x - 4.4 * k)} ${y + 1.2} Q${f(x)} ${y - 4} ${f(x + 4.4 * k)} ${y + 1.2}" fill="none" stroke="${INK}" stroke-width="2.1" stroke-linecap="round"/>`;
      else if (X.eye === 'closed') e = `<path d="M${f(x - 4.2 * k)} ${y - 0.5} Q${f(x)} ${y + 3} ${f(x + 4.2 * k)} ${y - 0.5}" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round"/>`;
      else if (X.eye === 'x') e = `<path d="M${f(x + sg * 4 * k)} ${y - 3} L${f(x - sg * 3 * k)} ${y} L${f(x + sg * 4 * k)} ${y + 3}" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`;
      else e = `<ellipse cx="${f(x)}" cy="${y}" rx="${f(2.8 * k)}" ry="3.4" fill="${INK}"/><circle cx="${f(x - 0.8)}" cy="${y - 1.2}" r="1.1" fill="#fff"/>`;
      const raise = X.brow === 1 ? -2.4 : 0, slant = X.brow === -1 ? sg * 2.8 * -1 : 0;
      head += e + `<path d="M${f(x - 5.4 * k)} ${f(y - 8 + raise + slant)} Q${f(x)} ${f(y - 11 + raise)} ${f(x + 5.4 * k)} ${f(y - 8 + raise - slant)}" fill="none" stroke="${P.mous}" stroke-width="3.6" stroke-linecap="round"/>`;
    }
    // walrus moustache
    const bounce = X === EXB.laugh ? -1.6 : 0;
    head += shp(`M${f(fx)} ${hc + 8 + bounce} Q${f(fx - 11)} ${hc + 6 + bounce} ${f(fx - 17)} ${hc + 14} Q${f(fx - 15)} ${hc + 21} ${f(fx - 7)} ${hc + 18} Q${f(fx - 2)} ${hc + 16} ${f(fx)} ${hc + 17}Z`, P.mous, { w: 0.7 }) + shp(`M${f(fx)} ${hc + 8 + bounce} Q${f(fx + 11)} ${hc + 6 + bounce} ${f(fx + 17)} ${hc + 14} Q${f(fx + 15)} ${hc + 21} ${f(fx + 7)} ${hc + 18} Q${f(fx + 2)} ${hc + 16} ${f(fx)} ${hc + 17}Z`, P.mous, { w: 0.7 });
    if (X === EXB.laugh || X === EXB.hurt) head += `<path d="M${f(fx - 5)} ${hc + 18.5} Q${f(fx)} ${hc + 24} ${f(fx + 5)} ${hc + 18.5}Z" fill="#7a3a42"/>`;
  } else head += shp(`M${f(hb - hxs * 0.95)} ${hc - 4} Q${f(hb - hxs * 1.0)} ${hc + 18} ${hb} ${hc + 21} Q${f(hb + hxs * 1.0)} ${hc + 18} ${f(hb + hxs * 0.95)} ${hc - 4} Q${hb} ${hc - 12} ${f(hb - hxs * 0.95)} ${hc - 4}Z`, mix(P.mous, '#5a4a3c', 0.5), { w: 0.7, x: `<path d="M${hb - 10} ${hc - 2} q2 9 0 16 M${hb + 2} ${hc} q2 9 0 16 M${hb + 13} ${hc - 2} q-2 8 0 14" fill="none" stroke="#3a2e26" stroke-width="1.1" opacity=".6"/>` });
  // ----- light motes from the pockets (Holy Orbit orbs are the 'fireflies' that lift out) -----
  const bodyG = `<g transform="translate(0,${f(bob)}) rotate(${f(lean)})">${body}<g transform="translate(0,${f(X.hy)}) rotate(${f(tilt)} 0 -60)">${head}</g></g>`;
  const orbs = o.orbs ? orbit({ ...o.orbs, sil }, 0, -54, o.orbs.R ?? 56) : { back: '', front: '' };
  const trail = run && !sil && view !== 'back' ? `<g style="mix-blend-mode:screen"><path d="M${f(staffX)} -128 Q${f(staffX - 24)} -128 ${f(staffX - 52)} -122" stroke="#ffb84a" stroke-width="9" fill="none" stroke-linecap="round" opacity=".28" filter="url(#b4)"/></g>` : '';
  const staffFront = view === 'back' ? '' : staff, staffBack = view === 'back' ? staff : '';
  return fin(o, orbs.back + trail + (view === 'back' ? '' : '') + (view === 'back' ? staff : '') + bodyG + (view === 'back' ? '' : staffFront) + orbs.front);
}

// ======================================================================================
// TAKE C: "THE WAX SAINT" (he IS the candle: rose-wax column, cream drip-cowl, flame for hair, iron wheel of flames as a ring collar)
// ======================================================================================
export const PC = { wax: '#ecb9b4', waxLt: '#f7d9d2', waxDk: '#c98a8c', drip: '#fbeede', iron: '#4d5160', ironLt: '#8f95a8', wick: '#3a2e30', face: '#5a3238', cheek: '#f08a8a', flame: '#ffd05a', amber: '#ffb84a', orb: '#e8e0ff' };
export const EXC = {
  sleepy: { name: 'SLEEPY CALM (IDLE)', eye: 'closed', hy: 1.5, tilt: 3, fl: 1, mouth: 'hint', note: 'eyes closed, flame tall and steady' },
  smile: { name: 'SMALL SMILE', eye: 'open', hy: 0, tilt: -3, fl: 1.1, mouth: 'smile', note: 'flame bobs, ring flames flick' },
  hurt: { name: 'GUTTER (HURT)', eye: 'x', hy: 2, tilt: -7, fl: 0.4, mouth: 'open', note: 'flame shrinks to a bead, a wax tear' },
  cast: { name: 'CAST', eye: 'closed', hy: -1, tilt: 0, fl: 1.4, mouth: 'hint', note: 'flame stretches, ring flames flare' },
  worried: { name: 'WORRIED', eye: 'open', hy: 2, tilt: -4, fl: 0.7, mouth: 'wobble', note: 'flame leans and dims' },
};
export function eliasC(o = {}) {
  const view = o.view || 'front', X = EXC[o.expr || 'sleepy'], sil = !!o.sil, run = !!o.run, P = PC, f = f1;
  const { th, c, s, xs } = g(view), sw = o.sway ?? (run ? 5 : 0), bob = o.bob ?? 0, lean = o.lean ?? (run ? 3.5 : 0), tilt = o.tilt ?? X.tilt, fl = o.fl ?? X.fl, ringOn = o.ring !== false, fLean = run ? -4.5 : (o.flameLean ?? 0);
  const topY = -92, W = 26 * (1 - 0.0 * s);
  // ring collar (the candle wheel): flat ellipse around the body at y=-48; back half behind the body, front half in front
  const ry0 = -46, rrx = 44, rry = 10.5;
  const ring = ringOn ? flatRing(0, ry0 + (run ? 0 : 0), rrx, rry, { col: P.iron, n: 8, fs: 0.58, fl: Math.min(fl, 1.35), lean: fLean * 0.4, sil, w: 4.6 }) : { back: '', front: '' };
  const ringGlow = (!sil && ringOn) ? glow(0, ry0 - 6, 74, 36, '#ffc45a', 0.4) : '';
  // base melt skirt
  let body = '';
  const sk = sw;
  const skirt = (() => { const pts = []; const n = 10; for (let i = 0; i <= n; i++) { const a = Math.PI + (i / n) * Math.PI; pts.push([Math.cos(a) * 38 * xs + sk, -3 + Math.sin(a) * 6 * -1]); } return ''; })();
  body += shp(`M${f(-38 * xs + sk)} -5 Q${f(-40 * xs + sk)} -13 ${f(-30 * xs + sk)} -13 L${f(30 * xs + sk)} -13 Q${f(40 * xs + sk)} -13 ${f(38 * xs + sk)} -5 Q${f(34 * xs + sk)} 3 ${f(24 * xs + sk)} 1.4 Q${f(14 * xs + sk)} 5 ${f(4 * xs + sk)} 1.6 Q${f(-8 * xs + sk)} 5 ${f(-18 * xs + sk)} 1.6 Q${f(-30 * xs + sk)} 4 ${f(-38 * xs + sk)} -5Z`, P.drip, { w: 1, so: 6 });
  // tiny wax feet
  body += shp(ell(f(-11 * xs + sk), -2, 7, 4), P.waxLt, { w: 0.7 }) + shp(ell(f(11 * xs + sk), -2, 7, 4), P.waxLt, { w: 0.7 });
  // candle column (head + body in one) with slight lean
  const bw = W * xs * 0.2 + W * 0.8;
  const col = `M${f(-bw * 1.04 + sk * 0.4)} -10 C${f(-bw * 1.12)} -34 ${f(-bw * 1.04)} -60 ${f(-bw)} -78 C${f(-bw * 0.98)} -90 ${f(-bw * 0.5)} ${topY - 4} 0 ${topY - 4} C${f(bw * 0.5)} ${topY - 4} ${f(bw * 0.98)} -90 ${f(bw)} -78 C${f(bw * 1.04)} -60 ${f(bw * 1.12)} -34 ${f(bw * 1.04 + sk * 0.4)} -10 Q0 -3 ${f(-bw * 1.04 + sk * 0.4)} -10Z`;
  const shade = `<path d="M${f(bw * 0.5)} -88 C${f(bw * 1.2)} -60 ${f(bw * 1.2)} -30 ${f(bw * 0.8)} -8 L${f(bw * 1.2)} -8 L${f(bw * 1.2)} -90Z" fill="${P.waxDk}" opacity=".45"/>`;
  const shine = `<path d="M${f(-bw * 0.8)} -72 Q${f(-bw * 0.92)} -52 ${f(-bw * 0.8)} -30" fill="none" stroke="#fff6e8" stroke-width="2.4" stroke-linecap="round" opacity=".5"/>`;
  body += shp(col, P.wax, { w: 1.05, so: 8, x: shade + shine });
  // drip cowl: cream melt hanging from the top rim, uneven, over the "head"
  const dr = [[-1.02, 15, 5], [-0.7, 9, 4.2], [-0.4, 20, 5.4], [0.05, 7, 4], [0.45, 18, 5.2], [0.78, 10, 4.4], [1.04, 15, 5]];
  const dtop = topY + 6;
  let drips = `M${f(-bw * 1.06)} ${dtop - 6}`;
  for (const [q, len, wd] of dr) { const x = q * bw * 0.96; drips += ` L${f(x - wd - 1)} ${dtop} Q${f(x - wd)} ${f(dtop + len)} ${f(x)} ${f(dtop + len + 2)} Q${f(x + wd)} ${f(dtop + len)} ${f(x + wd + 1)} ${dtop}`; }
  drips += ` L${f(bw * 1.06)} ${dtop - 6} Q0 ${topY - 16} ${f(-bw * 1.06)} ${dtop - 6}Z`;
  if (view !== 'back') body += shp(drips, P.drip, { w: 0.9, so: 5 });
  else body += shp(drips, P.drip, { w: 0.9, so: 5 });
  // molten top pool + wick
  body += shp(ell(0, f(topY - 3), f(bw * 0.8), f(5.6 + 1.2 * Math.abs(c))), P.drip, { w: 0.8 }) + `<ellipse cx="0" cy="${f(topY - 3)}" rx="${f(bw * 0.52)}" ry="${f(3 + 0.6 * Math.abs(c))}" fill="${P.waxLt}" opacity=".9"/>`;
  body += shp(`M-1.6 ${topY - 3} L1.6 ${topY - 3} L1.2 ${topY - 11} L-1.2 ${topY - 11}Z`, P.wick, { w: 0.5 });
  // face
  const fcy = -63;
  if (view !== 'back') {
    for (const sg of [-1, 1]) {
      const a = th + sg * 0.5, cs = Math.cos(a); if (cs < 0.12) continue; const x = 20 * Math.sin(a), y = fcy, k = 0.5 + 0.5 * cs;
      body += `<ellipse cx="${f(x + sg * 3.2 * Math.sin(a + 0.3 * sg))}" cy="${f(y + 8)}" rx="${f(5.4 * k)}" ry="3.6" fill="${P.cheek}" opacity=".55"/>`;
      if (X.eye === 'closed') body += `<path d="M${f(x - 4.4 * k)} ${y - 0.4} Q${f(x)} ${y + 3.8} ${f(x + 4.4 * k)} ${y - 0.4}" fill="none" stroke="${P.face}" stroke-width="2.1" stroke-linecap="round"/>`;
      else if (X.eye === 'x') body += `<path d="M${f(x + sg * 4 * k)} ${y - 3.2} L${f(x - sg * 3 * k)} ${y} L${f(x + sg * 4 * k)} ${y + 3.2}" fill="none" stroke="${P.face}" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/>`;
      else body += `<ellipse cx="${f(x)}" cy="${y}" rx="${f(3 * k)}" ry="3.8" fill="${P.face}"/><circle cx="${f(x - 0.9)}" cy="${y - 1.4}" r="1.2" fill="#fff"/>`;
      if (X === EXC.worried) body += `<path d="M${f(x - 5 * k)} ${y - 8 + sg * 2} L${f(x + 5 * k)} ${y - 8 - sg * 2}" stroke="${P.face}" stroke-width="1.6" stroke-linecap="round" opacity=".8"/>`;
    }
    const mx = 14 * s;
    if (X.mouth === 'smile') body += `<path d="M${f(mx - 4.4)} ${fcy + 9} Q${f(mx)} ${fcy + 14} ${f(mx + 4.4)} ${fcy + 9}" fill="none" stroke="${P.face}" stroke-width="1.8" stroke-linecap="round"/>`;
    else if (X.mouth === 'open') body += `<ellipse cx="${f(mx)}" cy="${fcy + 11}" rx="2.8" ry="3.2" fill="#8a3a46"/>`;
    else if (X.mouth === 'wobble') body += `<path d="M${f(mx - 4)} ${fcy + 11} q2 -2.4 4 0 t4 0" fill="none" stroke="${P.face}" stroke-width="1.6" stroke-linecap="round"/>`;
    else body += `<path d="M${f(mx - 2.6)} ${fcy + 10.6} Q${f(mx)} ${fcy + 12.6} ${f(mx + 2.6)} ${fcy + 10.6}" fill="none" stroke="${P.face}" stroke-width="1.5" stroke-linecap="round" opacity=".9"/>`;
    if (X === EXC.hurt && Math.cos(th) > 0.5) body += shp(`M${f(mx + 14)} ${fcy + 4} q3 5 0 8 q-3 -3 0 -8z`, '#fbeede', { w: 0.4 });
  } else {
    body += `<path d="M-8 -64 q8 5 16 0 M-5 -52 q5 3 10 0" fill="none" stroke="${P.waxDk}" stroke-width="1.4" opacity=".6"/>`;
  }
  // stubby wax arms folded in front (front / 3q / side), little cream mitten hands
  if (view !== 'back') {
    const hx = 4 * s * 1.4, hy = -34;
    for (const q of [-1, 1]) { if (view === 'side' && q < 0) continue; body += shp(cap(f(q * bw * 0.86 * xs), -48, f(hx + q * 4.4), hy, 6.4, 5.2), P.wax, { w: 0.8 }); }
    body += shp(circ(f(hx - 2.6), hy + 1, 4.4), P.drip, { w: 0.6 }) + shp(circ(f(hx + 2.6), hy + 1, 4.4), P.drip, { w: 0.6 });
  }
  // flame hair
  const fy = topY - 11, flameS = 1.45;
  const flm = flame(0, fy, flameS, { fl, lean: fLean + (o.flameLean ?? 0), sil, ga: 0.9, gk: 1.25 });
  const flmWrap = `<g transform="rotate(${f(tilt * 0.4)} 0 ${fy})">${flm}</g>`;
  const bodyG = `<g transform="translate(0,${f(bob)}) rotate(${f(lean)})">${body}<g transform="translate(0,${f(X.hy * 0.4)}) rotate(${f(tilt * 0.5)} 0 -40)"></g></g>`;
  const orbs = o.orbs ? orbit({ ...o.orbs, sil }, 0, -54, o.orbs.R ?? 60) : { back: '', front: '' };
  const trail = run && !sil && view !== 'back' ? `<g style="mix-blend-mode:screen"><path d="M0 ${fy - 20} Q-22 ${fy - 22} -50 ${fy - 14}" stroke="#ffb84a" stroke-width="9" fill="none" stroke-linecap="round" opacity=".3" filter="url(#b4)"/></g>` : '';
  return fin(o, orbs.back + ringGlow + ring.back + `<g transform="translate(0,${f(bob)}) rotate(${f(lean)})">` + body + ring.front + `<g transform="translate(0,0)">${trail}${flmWrap}</g></g>` + orbs.front);
}

export const TAKES = {
  A: { id: 'A', fn: eliasA, name: 'KEEPER OF THE WHEEL', H: 143, states: ['prayer', 'wry', 'weary'], pal: PA },
  B: { id: 'B', fn: eliasB, name: 'THE LAMPLIGHTER', H: 141, states: ['kind', 'tender', 'hurt'], pal: PB },
  C: { id: 'C', fn: eliasC, name: 'THE WAX SAINT', H: 130, states: ['sleepy', 'smile', 'hurt'], pal: PC },
};
export const EXPRS = { A: EXA, B: EXB, C: EXC };
