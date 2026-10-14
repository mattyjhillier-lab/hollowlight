// Wren v2 "Pelt Walker" (refined Take C) + ghost wolf PUP + bone-cage EMBER. Static mock-up drawing code, not game code.
// Hollowlight Style v1 via ../style-lab/lab.mjs shp(). Origin = ground under feet, y up = negative. Faces +x; dir:-1 mirrors.
// view: front | 3q | side | back.  Imports (never edits) ../wren-alternatives/takes.mjs helpers.
import { shp, stk, cap, ell, circ, glow, mix, rgU, lgU } from '../style-lab/lab.mjs';
import { pawPrint } from '../wren-alternatives/takes.mjs';

export const PAL2 = {
  pelt: '#cdd9e2', peltDk: '#8da3b7', inner: '#59708a', tunic: '#34506a', void: '#121923', amber: '#ffb84a', glint: '#ffd98a',
  bone: '#efe4cc', skin: '#8a6e66', hand: '#e8c4a8', boot: '#2b3441', nose: '#2a3140',
  pup: '#ffe8b0', pupDk: '#f6c987', pupIn: '#ffd2a0', pupChest: '#fff6d8', pupEye: '#5a2e10', pupEmber: '#ffb84a',
};
export const H2 = 122; // feet to ear tips (design units); 112 units = 60px desktop in the shared actual-size rule
const VW = { front: 0, '3q': 0.6, side: 1.2, back: Math.PI };
const g = (view) => { const th = VW[view || 'front']; return { th, c: Math.cos(th), s: Math.sin(th), xs: 1 - 0.36 * Math.abs(Math.sin(th)) }; };
const f1 = (n) => (+n).toFixed(1);
const fin = (o, body) => { const q = o.sil ? `<g filter="url(#wsil)">${body}</g>` : body; return o.dir === -1 ? `<g transform="scale(-1,1)">${q}</g>` : q; };

// ---------------- expression table: glint shape + posture + ear angle + ember behaviour ----------------
export const EXPR = {
  neutral:    { name: 'NEUTRAL',     ear: 0,   tilt: 0,  hy: 0,   ember: { dx: 33, dy: -80, s: 0.95, gl: 62, fl: 1 },    pup: { pose: 'sit', expr: 'open', look: 1 },  note: 'steady ember, pup looks up' },
  determined: { name: 'DETERMINED',  ear: -6,  tilt: 5,  hy: 1.5, ember: { dx: 36, dy: -90, s: 1.08, gl: 80, fl: 1.25 }, pup: { pose: 'stand', expr: 'wide', look: 0 }, note: 'ember rises + flares, pup up on paws' },
  worried:    { name: 'WORRIED',     ear: 24,  tilt: -3, hy: 3,   ember: { dx: 23, dy: -62, s: 0.8, gl: 38, fl: 0.7, dim: 0.75 }, pup: { pose: 'sit', expr: 'worry', look: 1, press: 1 }, note: 'ember sinks close and dims, pup presses to her leg' },
  smile:      { name: 'SMALL SMILE', ear: 6,  tilt: -5, hy: 0,   ember: { dx: 37, dy: -93, s: 1.0, gl: 74, fl: 1.1, spark: 3 }, pup: { pose: 'sit', expr: 'happy', look: 1, wag: 1 }, note: 'ember bobs up with sparks, pup wags' },
  hurt:       { name: 'HURT',        ear: 40,  tilt: -9, hy: 1,   ember: { dx: 18, dy: -68, s: 0.65, gl: 30, fl: 0.45, dim: 0.6 }, pup: { pose: 'sit', expr: 'hurt', look: 0, flat: 1 }, note: 'ember gutters, pup flattens its ears' },
  blink:      { name: 'BLINK',       ear: 0,   tilt: 0,  hy: 0,   ember: { dx: 33, dy: -80, s: 0.95, gl: 62, fl: 1 },    pup: { pose: 'sit', expr: 'open' }, note: 'glints flatten for 0.12 s' },
  howl:       { name: 'HOWL',        ear: -10, tilt: -18, hy: -1, ember: { dx: 30, dy: -100, s: 1.15, gl: 96, fl: 1.5, spark: 5 }, pup: { pose: 'howl', expr: 'happy' }, note: 'head back, glints close, ember flares' },
  death:      { name: 'LETTING GO',  ear: 14,  tilt: -6, hy: 2,   ember: { dx: 30, dy: -76, s: 0.9, gl: 60, fl: 0.9 }, pup: { pose: 'sit', expr: 'worry', look: 1 }, note: 'glints soften to arcs' },
};

// ---------------- bone-cage EMBER (a rib-cage orb with a live flame; floats on a thread) ----------------
export function ember(x, y, s, o = {}) {
  const fl = o.fl ?? 1, bone = PAL2.bone, dim = o.dim ?? 1;
  let r = o.sil ? '' : glow(x, y, (o.gl ?? 62) * s, (o.gl ?? 62) * 0.9 * s, '#ffc96b', 0.95 * dim);
  const cg = rgU('emb', 0, 0, 7, [[0, '#fffbe2'], [0.35, '#ffd05a'], [0.8, '#ff9d3a'], [1, '#d9651e']]);
  r += `<g transform="translate(${f1(x)},${f1(y)}) scale(${s})">`;
  r += shp('M-2.8 -9.2 L2.8 -9.2 L1.8 -12.6 L-1.8 -12.6Z', bone, { w: 0.6 }) + `<circle cx="0" cy="-14.6" r="1.9" fill="none" stroke="${mix(bone, '#7a5a3a', 0.5)}" stroke-width="1.1"/>`;
  r += shp(circ(0, 0, 8.8), bone, { w: 0.7, so: 3 }) + `<circle r="6.4" fill="url(#${cg})" opacity="${(0.65 + 0.35 * Math.min(1, fl)).toFixed(2)}"/>`;
  const fh = 3.2 + 2.6 * fl; r += `<path d="M0 ${f1(-fh)} Q${f1(2.2 + 0.8 * fl)} 0.5 0 ${f1(fh * 0.8)} Q${f1(-2.2 - 0.8 * fl)} 0.5 0 ${f1(-fh)}Z" fill="#fff" opacity="${Math.min(1, 0.55 + 0.4 * fl).toFixed(2)}"/>`;
  const rb = mix(bone, '#8a6a46', 0.35);
  r += `<path d="M-3.5 -6.1 Q-6.6 0 -3.5 6.1 M3.5 -6.1 Q6.6 0 3.5 6.1 M0 -6.4 L0 6.4" fill="none" stroke="${bone}" stroke-width="1.7" stroke-linecap="round"/><path d="M-3.5 -6.1 Q-6.6 0 -3.5 6.1 M3.5 -6.1 Q6.6 0 3.5 6.1" fill="none" stroke="${rb}" stroke-width=".5" opacity=".7" transform="translate(.4 .3)"/>`;
  r += shp('M-2.2 8.4 L2.2 8.4 L0 12.6Z', bone, { w: 0.5 });
  for (let i = 0; i < (o.spark || 0); i++) { const a = i * 2.4 + 0.6; r += `<circle cx="${f1(Math.cos(a) * (10 + i * 2.5))}" cy="${f1(-8 - i * 4.5)}" r="${(1.2 - i * 0.1).toFixed(2)}" fill="#fff0c0" opacity="${(0.9 - i * 0.12).toFixed(2)}"/>`; }
  return r + '</g>';
}

// ---------------- the PUP: ghost wolf pup. Cream-amber, big ears, ember tail tip, amber thread collar ----------------
// origin = ground under the paws. Height about 46 units sitting incl. ears at k=1; default k 0.78. view/pose/expr/ph (run phase)
export function pup2(o = {}) {
  const view = o.view || 'side', pose = o.pose || 'sit', ex = o.expr || 'open', sil = !!o.sil, K = o.k ?? 0.78, P = PAL2;
  const { th, c, s } = g(view), sp = { spirit: true }; const ph = o.ph || 0, wag = o.wag ? Math.sin(o.wag) * 7 : 0;
  const ab = Math.abs(s); let b = '';
  const bob = o.bob || 0, head = o.head ?? 0; // head: tilt degrees for curious
  const flat = !!o.flat || ex === 'hurt';
  // geometry per pose (side coordinates; front shifts through th)
  const G = {
    sit: { by: -11, rx: 9.2, ry: 11, hx: 6.5 * ab, hy: -27, tailX: -9, tailY: -4 },
    stand: { by: -15, rx: 12.5, ry: 8, hx: 12 * ab, hy: -25, tailX: -12, tailY: -17 },
    run: { by: -17 + bob, rx: 13.5, ry: 7.2, hx: 13.5 * ab, hy: -24.5 + bob, tailX: -13, tailY: -19 + bob },
    sleep: { by: -8, rx: 14, ry: 8.4, hx: 8 * ab, hy: -10, tailX: -12, tailY: -7 },
    howl: { by: -11, rx: 9.2, ry: 11, hx: 5 * ab, hy: -27, tailX: -9, tailY: -4 },
  }[pose] || null;
  const { by, rx, ry, hx, hy } = G, R = pose === 'sleep' ? 9.2 : 9.8;
  const glw = sil ? '' : glow(0, -17, 30, 22, '#ffc45a', 0.5);
  // ---- tail with ember tip ----
  const tipPt = (() => {
    if (view === 'front') return [rx + 3 + wag * 0.4, -6 - Math.abs(wag) * 0.3];
    if (view === 'back') return [rx - 2 + wag, by - 4];
    if (pose === 'sit' || pose === 'howl') return [-22 + wag * 0.7, -17 - Math.abs(wag) * 0.5];
    if (pose === 'sleep') return [-1, -3];
    if (pose === 'run') return [-27, G.tailY - 8 + bob * 0.3 - 3];
    return [-23, -28 + wag * 0.3];
  })();
  const tailD = (() => {
    const [tx, ty] = tipPt;
    if (view === 'front') return `M${rx - 3} -6 Q${rx + 7} -3 ${f1(tx)} ${f1(ty)} Q${rx + 5} -8 ${rx - 3} -10Z`;
    if (view === 'back') return `M-4 ${by + 4} Q${f1(tx)} ${f1(by - 4)} ${f1(tx + 3)} ${f1(ty - 10)} Q${f1(tx + 5)} ${f1(ty - 3)} 4 ${by + 5}Z`;
    if (pose === 'sleep') return `M-10 -3 Q-24 -2 -19 -10 Q-12 -13 ${f1(tx + 9)} -9 Q-8 -6 -2 -5Z`;
    const x0 = G.tailX, y0 = G.tailY; return `M${x0 + 3} ${y0 - 3} C${x0 - 8} ${y0 - 7} ${f1(tx - 5)} ${f1(ty + 10)} ${f1(tx)} ${f1(ty)} C${f1(tx + 3)} ${f1(ty + 7)} ${x0 - 8} ${y0 + 4} ${x0 + 3} ${y0 + 3}Z`;
  })();
  const emberTip = (sc = 1) => (sil ? '' : glow(tipPt[0], tipPt[1], 12 * sc, 12 * sc, '#ffb84a', 0.95)) + `<circle cx="${f1(tipPt[0])}" cy="${f1(tipPt[1])}" r="${(3.1 * sc).toFixed(1)}" fill="${P.pupEmber}"/><circle cx="${f1(tipPt[0] - 0.4)}" cy="${f1(tipPt[1] - 0.5)}" r="${(1.5 * sc).toFixed(1)}" fill="#fff4c8"/>`;
  const earPair = (hxx, hyy, R_) => {
    // ears: base on the head sphere at angles th +- 1.1; far ear drawn first (darker)
    let out = '';
    const earSh = (bx, by2, lean, k, col, dark) => {
      const l = flat ? lean * 1.2 + Math.sign(lean || 1) * 11 : lean, h = (flat ? 6.5 : 14.2) * k, w = 5.6 * (0.85 + 0.15 * k);
      return shp(`M${f1(bx - w)} ${f1(by2)} Q${f1(bx - w * 0.7 + l * 0.5)} ${f1(by2 - h * 0.55)} ${f1(bx + l)} ${f1(by2 - h)} Q${f1(bx + w * 0.7 + l * 0.4)} ${f1(by2 - h * 0.5)} ${f1(bx + w)} ${f1(by2)}Z`, col, { w: 0.7, ...sp })
        + (flat ? '' : shp(`M${f1(bx - w * 0.55)} ${f1(by2 - 1)} Q${f1(bx - w * 0.3 + l * 0.5)} ${f1(by2 - h * 0.5)} ${f1(bx + l * 0.9)} ${f1(by2 - h * 0.78)} Q${f1(bx + w * 0.3 + l * 0.4)} ${f1(by2 - h * 0.45)} ${f1(bx + w * 0.55)} ${f1(by2 - 1)}Z`, P.pupIn, { w: 0.3, nl: true, spirit: true }));
    };
    const L = th - 1.12, Rr = th + 1.12;
    const side = (a, dark) => { const cs = Math.cos(a), bx = hxx + R_ * 0.78 * Math.sin(a) * (ab > 0.9 ? 0.72 : 1) - (ab > 0.9 ? 3.2 * (dark ? -1 : 1) : 0), by2 = hyy - R_ * (0.62 + 0.1 * Math.abs(cs)), lean = (Math.sin(a) > 0 ? 1 : -1) * (ab > 0.9 ? -1 : 1.6) * (dark ? 1 : 1) ; return [bx, by2, lean, cs]; };
    const A = side(L, true), B = side(Rr, false);
    const order = [A, B].sort((p, q) => p[3] - q[3]); // far (smaller cos) first
    for (const [bx, by2, lean, cs] of order) out += earSh(bx, by2, lean * (view === 'side' ? 1.5 : 2.4), 1 - (view === 'side' ? 0.0 : 0), cs < 0 && view !== 'back' ? P.pupDk : P.pup);
    return out;
  };
  const headParts = (hxx, hyy) => {
    let r = '';
    const rr = pose === 'sleep' ? 9.2 : R;
    r += earPair(hxx, hyy, rr);
    r += shp(circ(hxx, hyy, rr), P.pup, { w: 0.9, so: 4, ...sp });
    // forehead tuft
    if (view !== 'back') r += shp(`M${f1(hxx - 2 + 2 * s)} ${f1(hyy - rr + 1)} L${f1(hxx + 0.5 + 2 * s)} ${f1(hyy - rr - 4.6)} L${f1(hxx + 3 + 2 * s)} ${f1(hyy - rr + 1.2)}Z`, P.pup, { w: 0.5, ...sp });
    if (view === 'back') return r;
    // muzzle
    const mx = hxx + (rr + 1.2) * Math.sin(th) * 0.9, my = hyy + 3.4, mrx = 3.6 + 2.8 * ab, mry = 3.3;
    r += shp(ell(mx, my, mrx, mry), P.pupChest, { w: 0.7, ...sp });
    r += `<ellipse cx="${f1(mx + 1.3 * s + (mrx - 3) * 0.3 * ab)}" cy="${f1(my - 1.6)}" rx="1.7" ry="1.2" fill="#3a2418"/>`;
    if (ex === 'happy' || pose === 'run' || o.tongue) r += `<path d="M${f1(mx - 1.6)} ${f1(my + 1.2)} Q${f1(mx)} ${f1(my + 4.8)} ${f1(mx + 1.8)} ${f1(my + 1.2)}Z" fill="#ff9a8a" stroke="#c0605a" stroke-width=".5"/>`;
    else if (pose === 'howl') r += `<ellipse cx="${f1(mx + 1)}" cy="${f1(my + 2.6)}" rx="2" ry="2.8" fill="#4a2418"/>`;
    else r += `<path d="M${f1(mx - 1.8)} ${f1(my + 1.2)} Q${f1(mx)} ${f1(my + 2.8)} ${f1(mx + 1.8)} ${f1(my + 1.2)}" fill="none" stroke="#7a4222" stroke-width=".8" stroke-linecap="round"/>`;
    // eyes on the head sphere
    for (const sg of [-1, 1]) {
      const a = th + sg * 0.66, cs = Math.cos(a); if (cs < 0.1) continue;
      const x = hxx + rr * 0.95 * Math.sin(a), y = hyy - 0.8 - (o.look ? 0.8 : 0), rx2 = 2.2 * (0.45 + 0.55 * cs), ry2 = ex === 'wide' ? 3.1 : 2.6;
      if (ex === 'happy' || pose === 'howl') r += `<path d="M${f1(x - rx2 * 1.1)} ${f1(y + 1)} Q${f1(x)} ${f1(y - 3.3)} ${f1(x + rx2 * 1.1)} ${f1(y + 1)}" fill="none" stroke="${P.pupEye}" stroke-width="1.5" stroke-linecap="round"/>`;
      else if (ex === 'closed' || pose === 'sleep') r += `<path d="M${f1(x - rx2 * 1.1)} ${f1(y - 0.4)} Q${f1(x)} ${f1(y + 2.4)} ${f1(x + rx2 * 1.1)} ${f1(y - 0.4)}" fill="none" stroke="${P.pupEye}" stroke-width="1.4" stroke-linecap="round"/>`;
      else if (ex === 'hurt') r += `<path d="M${f1(x - rx2 * 1.0)} ${f1(y - 1.8)} L${f1(x + rx2 * 0.9)} ${f1(y)} L${f1(x - rx2 * 1.0)} ${f1(y + 1.8)}" transform="${sg > 0 ? `scale(-1,1) translate(${f1(-2 * x)},0)` : ''}" fill="none" stroke="${P.pupEye}" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>`;
      else {
        r += `<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${f1(rx2)}" ry="${ry2}" fill="${P.pupEye}"/><ellipse cx="${f1(x)}" cy="${f1(y + ry2 * 0.38)}" rx="${f1(rx2 * 0.62)}" ry="${f1(ry2 * 0.45)}" fill="#e98a3a" opacity=".85"/><circle cx="${f1(x - rx2 * 0.28)}" cy="${f1(y - ry2 * 0.3)}" r="${f1(Math.max(0.85, rx2 * 0.42))}" fill="#fff"/>`;
        if (ex === 'worry') r += `<path d="M${f1(x - rx2 - 0.6)} ${f1(y - ry2 - 1.4 + (sg === -1 ? 1.2 : -0.2))} L${f1(x + rx2 + 0.6)} ${f1(y - ry2 - 1.4 + (sg === -1 ? -0.2 : 1.2))}" stroke="#a8743a" stroke-width="1" stroke-linecap="round"/>`;
      }
    }
    // cheek blush
    if (ex === 'happy') for (const sg of [-1, 1]) { const a = th + sg * 1.05; if (Math.cos(a) > 0.25) r += `<ellipse cx="${f1(hxx + rr * Math.sin(a))}" cy="${f1(hyy + 4.2)}" rx="2.4" ry="1.7" fill="#ff9a7a" opacity=".5"/>`; }
    return r;
  };
  // ---- collar thread ----
  const collar = (hxx, hyy) => view === 'back' ? '' : `<path d="M${f1(hxx - 7.5 * (view === 'side' ? 0.4 : 1))} ${f1(hyy + 8.2)} Q${f1(hxx + 0.5)} ${f1(hyy + 11.8)} ${f1(hxx + 8 * (view === 'side' ? 0.6 : 1))} ${f1(hyy + 8)}" fill="none" stroke="${P.amber}" stroke-width="1.7" stroke-linecap="round"/><circle cx="${f1(hxx + 0.5)}" cy="${f1(hyy + 11.2)}" r="1.6" fill="${P.amber}" stroke="#a8541a" stroke-width=".5"/>`;

  b += glw;
  if (view === 'front' || view === '3q' || view === 'back') {
    // seated / standing facing the viewer
    const sit = pose !== 'stand' && pose !== 'run', cx0 = 0, bx = 0, by2 = pose === 'sleep' ? -8 : -11;
    const ang = view === '3q' ? 0.5 : 0;
    b += shp(tailD, P.pupDk, { w: 0.8, ...sp });
    // tail ember tip drawn after tail
    b += (view === 'back' ? '' : emberTip());
    // hind haunches
    for (const q of [-1, 1]) b += shp(ell(q * 8.6 + 1.5 * s, -4.4, 6.2, 4.6), q === (s >= 0 ? 1 : -1) ? P.pupDk : P.pup, { w: 0.8, ...sp });
    b += shp(ell(1.2 * s, by2, 9.6 - 1.4 * ab, 11.4), P.pup, { w: 0.9, so: 5, ...sp });
    if (view !== 'back') b += shp(`M${f1(-5 + s * 2)} ${by2 - 9} Q${f1(s * 2)} ${by2 - 3} ${f1(5 + s * 2)} ${by2 - 9} Q${f1(3 + s * 2)} ${by2 + 4} ${f1(s * 2)} ${by2 + 5} Q${f1(-3 + s * 2)} ${by2 + 4} ${f1(-5 + s * 2)} ${by2 - 9}Z`, P.pupChest, { w: 0.5, ...sp });
    if (view !== 'back') for (const q of [-1, 1]) { const px = q * 4.3 + 2.3 * s; b += shp(cap(px, -9, px, -2, 2.8, 2.5), P.pup, { w: 0.7, ...sp }) + shp(ell(px, -1.8, 3.6, 2.1), P.pup, { w: 0.6, ...sp }); }
    const hh = view === 'back' ? -26.5 : -26.5 + (flat ? 1.5 : 0);
    const hdx = 2.6 * s, tilt = (head || 0);
    b += `<g transform="rotate(${tilt} ${f1(hdx)} ${f1(hh + 9)})">${headParts(hdx, hh)}</g>` + collar(hdx, hh);
    if (view === 'back') b += emberTip(0.9);
  } else {
    // side view
    const legCol = (i) => (i % 2 ? P.pupDk : P.pup);
    if (pose === 'sit' || pose === 'howl') {
      b += shp(tailD, P.pupDk, { w: 0.8, ...sp }) + emberTip();
      b += shp(ell(-4.5, -5, 7.6, 5.2), P.pupDk, { w: 0.8, ...sp });
      b += shp(ell(-1.4, by + 0.5, 8.8, 11.2), P.pup, { w: 0.9, so: 5, ...sp });
      b += shp(`M3 ${by - 8} Q9 ${by - 4} 7.6 ${by + 5} Q3 ${by + 6} 1.5 ${by - 3}Z`, P.pupChest, { w: 0.5, ...sp });
      b += shp(cap(5.4, -11, 6.8, -2.4, 2.9, 2.5), P.pup, { w: 0.7, ...sp }) + shp(ell(8.2, -1.8, 4, 2.2), P.pup, { w: 0.6, ...sp });
      const hh = pose === 'howl' ? -26 : -27 + (flat ? 1.8 : 0), hxx = pose === 'howl' ? 7 : 6.8;
      b += `<g transform="rotate(${pose === 'howl' ? -28 : (head || 0)} ${f1(hxx - 2)} ${f1(hh + 9)})">${headParts(hxx, hh)}</g>` + collar(hxx - 1, hh + (pose === 'howl' ? 1 : 0));
    } else if (pose === 'sleep') {
      b += shp(tailD, P.pupDk, { w: 0.8, ...sp }) + emberTip();
      b += shp(ell(0, -8, 14.5, 8.6), P.pup, { w: 0.9, so: 5, ...sp });
      b += shp(ell(9.4, -4, 6, 3.6), P.pupDk, { w: 0.7, ...sp });
      b += `<g>${headParts(9, -10)}</g>` + collar(8, -9);
    } else {
      // stand / run: four legs on a stretched body
      const run = pose === 'run', legs = [[0.62, 0], [0.34, 1.6], [-0.4, 3.0], [-0.66, 4.6]];
      const lx = (k, i) => { const phi = ph + legs[i][1] * (run ? 1 : 0.0); return run ? [k * rx + 7 * Math.sin(phi) * (i < 2 ? 1 : 0.9), -1.8 - Math.max(0, -Math.cos(phi)) * 7] : [k * rx + (i % 2 ? -1 : 1) * 1.5, -2]; };
      b += shp(tailD, P.pupDk, { w: 0.8, ...sp }) + emberTip();
      const order = [1, 3, 0, 2]; // far legs first
      const drawLeg = (i) => { const [fx, fy] = lx(legs[i][0], i), hxl = legs[i][0] * rx; return shp(cap(hxl, by + 2, fx, fy + 0.5, 2.9, 2.4), legCol(i), { w: 0.7, ...sp }) + shp(ell(fx + 1.5, fy, 3.6, 2), legCol(i), { w: 0.6, ...sp }); };
      b += drawLeg(1) + drawLeg(3);
      b += shp(ell(0, by, rx, ry), P.pup, { w: 0.9, so: 5, ...sp });
      b += shp(`M${f1(rx * 0.5)} ${by - ry * 0.6} Q${f1(rx * 0.95)} ${by + ry * 0.2} ${f1(rx * 0.55)} ${by + ry * 0.9} Q${f1(rx * 0.2)} ${by + ry * 0.5} ${f1(rx * 0.3)} ${by - ry * 0.4}Z`, P.pupChest, { w: 0.5, ...sp });
      b += drawLeg(0) + drawLeg(2);
      b += `<g transform="rotate(${run ? 6 : (head || 0)} ${f1(hx - 2)} ${f1(hy + 8)})">${headParts(hx, hy)}</g>` + collar(hx - 1, hy);
    }
  }
  // wrap: scale about the paws; optional mirror; ghost-light fade of the feet is left to the real renderer (note in README)
  const out = `<g transform="translate(${f1(o.x || 0)},${f1(o.y || 0)}) scale(${K})">${b}</g>`;
  return sil ? `<g filter="url(#wsil)">${out}</g>` : out;
}

// ---------------- WREN v2 ----------------
export function wren2(o = {}) {
  const view = o.view || 'front', expr = o.expr || 'neutral', run = !!o.run, sil = !!o.sil, X = EXPR[expr] || EXPR.neutral;
  const { th, c, s, xs } = g(view), P = PAL2, leg = o.leg ?? (run ? 0.8 : 0), lift = o.lift ?? 0, sw = o.sway ?? 0, bob = o.bob ?? 0, lean = o.lean ?? 0, sx = o.sx ?? 1, sy = o.sy ?? 1;
  const tilt = o.tilt ?? X.tilt, hyo = (o.hy ?? X.hy), earA = o.ear ?? X.ear, E = { ...X.ember, ...(o.ember || {}) };
  const Lx = E.dx + 0 * s, Ly = E.dy + (o.emberBob || 0), Hx = 16, Hy = -47, fhx = -17 * xs - 3 * s, fhy = -34;
  let back = '', body = '', head = '', front = '';
  // ----- ember thread + ember (outside the body transform) -----
  const thread = `<path d="M${Hx} ${Hy} Q${f1(Lx * 0.9)} ${f1((Ly + Hy) / 2 + 4)} ${f1(Lx)} ${f1(Ly + 12)}" fill="none" stroke="${P.amber}" stroke-width="1.2" stroke-dasharray="1.2 2.4" stroke-linecap="round"/>`;
  const emb = o.bare ? '' : (view === 'back' ? '' : thread) + ember(Lx, Ly, E.s, { sil, gl: E.gl, fl: E.fl, dim: E.dim, spark: E.spark });
  // loose threads from her left hand (what the wolves follow)
  const threads = (view !== 'back' && !o.bare && !o.noThreads) ? [[-20, -3, 0], [-30, -10, 1], [-18, -14, 2]].map(([dx, dy, q]) => `<path d="M${f1(fhx)} ${fhy} Q${f1(fhx + dx * 0.5)} ${fhy + 22 + q * 3} ${f1(fhx + dx)} ${fhy + dy + 20}" fill="none" stroke="${P.amber}" stroke-width="1.2" stroke-dasharray="1.2 2.6" stroke-linecap="round" opacity=".85"/>`).join('') : '';
  // ----- pelt tail (the streak) -----
  const W = 32 * xs, zig = []; for (let i = 0; i <= 8; i++) zig.push(`L${f1(-W + (2 * W * i) / 8)} ${i % 2 ? -7 : -14}`);
  const tx = -(30 + (run ? 42 : 0)) * Math.max(s, 0.5) + sw, ty = -26 - (run ? 16 : 0) + (o.tailLift ?? 0);
  if (run && !sil && view !== 'back') back += `<g style="mix-blend-mode:screen"><path d="M${f1(tx)} ${f1(ty)} Q${f1(tx - 22)} ${f1(ty - 2)} ${f1(tx - 46)} ${f1(ty + 1)}" stroke="#ffb84a" stroke-width="9" fill="none" stroke-linecap="round" opacity=".28" filter="url(#wbl2)"/></g>`;
  if (view !== 'back') {
    back += shp(`M-6 -44 C${f1(tx * 0.4)} -52 ${f1(tx * 0.8)} -40 ${f1(tx)} ${f1(ty)} C${f1(tx * 0.75)} -19 ${f1(tx * 0.4)} -21 -6 -22Z`, P.pelt, { w: 0.9, x: `<path d="M-8 -33 C${f1(tx * 0.4)} -36 ${f1(tx * 0.7)} -31 ${f1(tx * 0.95)} ${f1(ty + 1)}" fill="none" stroke="${P.amber}" stroke-width="1.1" stroke-dasharray="2 2.2" opacity=".9"/><path d="M${f1(tx * 0.7)} -40 L${f1(tx * 1.05)} ${f1(ty - 3)} L${f1(tx * 0.7)} -22Z" fill="${P.peltDk}" opacity=".55"/>` });
  }
  // ----- body (tunic, mantle, hands) -----
  body += shp(`M${f1(-13 * xs)} -62 Q${f1(-W * 1.05)} -46 ${f1(-W)} -14 ${zig.join(' ')} Q${f1(W * 1.05)} -46 ${f1(13 * xs)} -62 Q0 -67 ${f1(-13 * xs)} -62Z`, view === 'back' ? P.pelt : P.inner, { w: 0.9, so: 6, x: view === 'back' ? pawPrint(0, -34, 3.2, P.amber, 0.95) + `<path d="M0 -62 L0 -14" stroke="${P.peltDk}" stroke-width="1.2" stroke-dasharray="2 2"/>` : '' });
  if (view !== 'back') {
    const l1 = leg * 6.5, l2 = -leg * 6.5, lf = [Math.max(0, leg) * lift, Math.max(0, -leg) * lift];
    body += shp(ell(-6.5 * xs + l2 + 3 * s, -2.6 - lf[1], 6.8, 4), P.boot, { w: 0.8 }) + shp(ell(6.5 * xs + l1 + 3 * s, -2.6 - lf[0], 6.8, 4), P.boot, { w: 0.8 });
    body += shp(`M${f1(-11 * xs)} -58 Q${f1(-13 * xs)} -36 ${f1(-17 * xs)} -8 L${f1(-11 * xs)} -3 L-5 -8 L2 -3 L${f1(9 * xs)} -8 L${f1(17 * xs)} -6 Q${f1(13 * xs)} -36 ${f1(11 * xs)} -58Z`, P.tunic, { w: 0.9, so: 5, x: `<path d="M-20 -7 Q0 -3 20 -7" fill="none" stroke="${P.amber}" stroke-width="1.4" stroke-dasharray="2.2 2" opacity=".95"/>` });
    if (view === 'front' || view === '3q') body += (sil ? '' : `<ellipse cx="${f1(-21 * xs)}" cy="-24" rx="9" ry="8" fill="${P.amber}" opacity=".3" filter="url(#wbl2)"/>`) + pawPrint(f1(-21 * xs), -24, 0.95, P.amber, 0.95) + pawPrint(f1(20 * xs), -31, 0.8, P.amber, 0.9);
  }
  // mantle (pelt shoulders) with the alpha's two forepaws tied at the throat
  const mz = []; for (let i = 0; i <= 8; i++) mz.push(`L${f1(W * 0.8 - (2 * W * 0.8 * i) / 8)} ${i % 2 ? -38 : -45}`);
  body += shp(`M${f1(-W * 0.8)} -50 Q${f1(-W * 0.88)} -60 ${f1(-12 * xs)} -66 Q0 -70 ${f1(12 * xs)} -66 Q${f1(W * 0.88)} -60 ${f1(W * 0.8)} -50 ${mz.join(' ')}Z`, P.pelt, { w: 0.9, so: 5, x: `<path d="M${f1(-W * 0.7)} -52 Q0 -47 ${f1(W * 0.7)} -52" fill="none" stroke="${P.peltDk}" stroke-width="1" opacity=".5"/>` });
  if (view !== 'back') {
    const px = (q) => q * 6.5 * xs + 2.5 * s;
    for (const q of [-1, 1]) { if (view === 'side' && q < 0) continue; const x0 = px(q); body += shp(`M${f1(x0 - 2.6)} -58 Q${f1(x0 - 4.8)} -50 ${f1(x0 - 3.6)} -45 Q${f1(x0)} -42 ${f1(x0 + 3.6)} -45 Q${f1(x0 + 4.8)} -50 ${f1(x0 + 2.6)} -58Z`, P.pelt, { w: 0.8 }) + `<path d="M${f1(x0 - 2)} -44.4 v3 M${f1(x0)} -43.4 v3.4 M${f1(x0 + 2)} -44.4 v3" stroke="${P.amber}" stroke-width="1.1" stroke-linecap="round"/>`; }
    body += shp(circ(f1(px(0)), -58, 2.3), P.bone, { w: 0.6 });
  }
  body += shp(circ(Hx, Hy, 4), P.hand, { w: 0.7 }) + (view !== 'back' ? shp(circ(fhx, fhy, 3.8), P.hand, { w: 0.7 }) : '');
  // ----- head: wolf-head hood, void face, glints -----
  const hb = -3 * s, fx = 8 * s, earK = 0.5 + 0.5 * Math.abs(c);
  const ear = (x0, dx, sgn) => `<g transform="rotate(${f1(sgn * earA)} ${f1(x0)} -96)">` + shp(`M${f1(x0 - 7)} -96 L${f1(x0 + dx)} -122 L${f1(x0 + 8)} -97Z`, P.pelt, { w: 0.9 }) + shp(`M${f1(x0 - 3.6)} -98 L${f1(x0 + dx * 0.9)} -115 L${f1(x0 + 4)} -98Z`, P.inner, { w: 0.4, nl: true }) + '</g>';
  head += ear(-13 * earK + hb - 3 * s, -1, -1) + ear(13 * earK + hb - 8 * s, 2, 1);
  if (view === 'back') head += shp(ell(hb, -82, 22, 21), P.pelt, { w: 1, so: 6, x: `<path d="M-6 -100 q-2 8 2 12 M7 -97 q2 6 -1 10 M0 -70 q-3 5 0 9" stroke="${P.peltDk}" stroke-width="1.2" fill="none"/>` });
  else {
    head += shp(ell(hb, -84, 22 * (1 - 0.08 * s), 20), P.pelt, { w: 1, so: 6 });
    for (const q of [-1, 1]) head += shp(`M${f1(fx + q * 14)} -86 L${f1(fx + q * 22)} -70 L${f1(fx + q * 15)} -73 L${f1(fx + q * 20)} -60 L${f1(fx + q * 11)} -66Z`, P.pelt, { w: 0.8 });
    const vg = rgU('void', 0, -76, 15, [[0, '#0a0f17'], [0.7, '#121923'], [1, '#1d2838']]);
    head += `<ellipse cx="${f1(fx)}" cy="-76" rx="${f1(14 * (1 - 0.18 * s))}" ry="12.5" fill="url(#${vg})" stroke="${mix(P.pelt, '#2a3a50', 0.5)}" stroke-width="1.2"/>`;
    // fur fringe hanging from the top rim of the hood opening, so the void reads as depth, not a sticker
    for (const q of [-1, 0, 1]) head += `<path d="M${f1(fx + q * 6.5 - 2.4)} -87.6 L${f1(fx + q * 6.5)} ${f1(-82.6 + (q === 0 ? 0.6 : 0))} L${f1(fx + q * 6.5 + 2.4)} -87.6Z" fill="${P.pelt}" stroke="${mix(P.pelt, '#2a3a50', 0.55)}" stroke-width=".6" stroke-linejoin="round"/>`;
    head += shp(ell(fx, -67, 7 * (1 - 0.3 * s), 3.2), P.skin, { w: 0.3, nl: true });
    for (const sg of [-1, 1]) {
      const a = th + sg * 0.55, cs = Math.cos(a); if (cs < 0.12) continue; const x = 12 * Math.sin(a), y = -77, rx = 2.6 * (0.5 + 0.5 * cs); let sh = '';
      const gl = (sil ? '' : glow(x, y, expr === 'worried' || expr === 'hurt' ? 7 : 9, expr === 'worried' || expr === 'hurt' ? 7 : 9, '#ffb84a', expr === 'worried' ? 0.4 : expr === 'hurt' ? 0.3 : 0.6));
      if (expr === 'determined') sh = `<path d="M${f1(x - rx * 1.6)} ${f1(y - sg * 1.2)} L${f1(x + rx * 1.6)} ${f1(y + sg * 1.2)}" stroke="${P.glint}" stroke-width="2.6" stroke-linecap="round"/>`;
      else if (expr === 'worried') sh = `<ellipse cx="${f1(x)}" cy="${y + 0.8}" rx="${f1(rx * 0.92)}" ry="3.5" fill="${P.glint}" opacity=".88" transform="rotate(${sg * 20} ${f1(x)} ${y})"/><circle cx="${f1(x - 0.5)}" cy="${y + 1.8}" r="1.1" fill="#fff" opacity=".8"/>`;
      else if (expr === 'smile') sh = `<path d="M${f1(x - rx * 1.25)} ${f1(y + 1.6)} Q${f1(x)} ${f1(y - 3.6)} ${f1(x + rx * 1.25)} ${f1(y + 1.6)}" fill="none" stroke="${P.glint}" stroke-width="2.4" stroke-linecap="round"/>`;
      else if (expr === 'hurt') sh = `<path d="M${f1(x + sg * rx * 1.3)} ${f1(y - 2.6)} L${f1(x - sg * rx * 1.2)} ${f1(y)} L${f1(x + sg * rx * 1.3)} ${f1(y + 2.6)}" fill="none" stroke="${P.glint}" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round"/>` + (sg > 0 ? `<path d="M${f1(x + 1)} ${f1(y + 4.5)} q1.8 2.2 0 4 q-1.8 -1.8 0 -4Z" fill="#bfe6ff"/>` : '');
      else if (expr === 'blink') sh = `<path d="M${f1(x - rx * 1.2)} ${y} L${f1(x + rx * 1.2)} ${y}" stroke="${P.glint}" stroke-width="1.8" stroke-linecap="round"/>`;
      else if (expr === 'howl' || expr === 'death') sh = `<path d="M${f1(x - rx * 1.25)} ${f1(y + 1.8)} Q${f1(x)} ${f1(y - 3.2)} ${f1(x + rx * 1.25)} ${f1(y + 1.8)}" fill="none" stroke="${P.glint}" stroke-width="${expr === 'death' ? 1.9 : 2.5}" stroke-linecap="round" opacity="${expr === 'death' ? 0.8 : 1}"/>`;
      else sh = `<ellipse cx="${f1(x)}" cy="${y}" rx="${f1(rx)}" ry="3.1" fill="${P.glint}"/><circle cx="${f1(x - 0.6)}" cy="${f1(y - 0.9)}" r="0.9" fill="#fff"/>`;
      head += gl + sh;
    }
    if (expr === 'smile' && cs0(th)) head += `<path d="M${f1(fx - 3.2)} -69.6 Q${f1(fx)} -66.4 ${f1(fx + 3.2)} -69.6" fill="none" stroke="${P.glint}" stroke-width="1.3" stroke-linecap="round" opacity=".85"/>`;
    if (expr === 'howl' && cs0(th)) head += `<ellipse cx="${f1(fx)}" cy="-68" rx="3.4" ry="3" fill="#ffb84a" opacity=".92"/><ellipse cx="${f1(fx)}" cy="-68.4" rx="1.6" ry="1.2" fill="#fff0c0"/>`;
    if (view === 'side' || view === '3q') { const mxx = 6 + 12 * s; head += shp(`M${f1(mxx - 12)} -97 Q${f1(mxx)} -99 ${f1(mxx + 10)} -93 Q${f1(mxx + 15)} -90 ${f1(mxx + 14)} -86 Q${f1(mxx + 8)} -83 ${f1(mxx - 2)} -85 Q${f1(mxx - 10)} -86 ${f1(mxx - 12)} -97Z`, P.pelt, { w: 0.9 }) + shp(ell(mxx + 13, -87.5, 2.8, 2.3), P.nose, { w: 0.4, nl: true }); }
    else head += shp(`M${fx - 6.5} -102 Q${fx - 9} -92 ${fx - 3.6} -85 Q${fx} -83 ${fx + 3.6} -85 Q${fx + 9} -92 ${fx + 6.5} -102 Q${fx} -105 ${fx - 6.5} -102Z`, P.pelt, { w: 0.9 }) + shp(ell(fx, -85.5, 3.6, 2.7), P.nose, { w: 0.4, nl: true }) + `<path d="M${fx} -101 L${fx} -92" stroke="${P.peltDk}" stroke-width="1.3" opacity=".6"/>`;
  }
  const bodyG = `<g transform="translate(0,${f1(bob)}) rotate(${f1(lean)}) scale(${sx},${sy})">${back}${body}<g transform="translate(0,${f1(hyo)}) rotate(${f1(tilt)} 0 -66)">${head}</g></g>`;
  // ----- pup (own placement; in front or behind) -----
  let pupS = '', thr = '';
  if (o.pup) {
    const p = o.pup, k = p.k ?? 0.78;
    pupS = pup2({ view: p.view || (view === 'front' ? 'front' : view), pose: p.pose || 'sit', expr: p.expr || 'open', ph: p.ph, bob: p.bob, x: p.x ?? -34, y: p.y ?? 3, k, sil, wag: p.wag, head: p.head, flat: p.flat, look: p.look, tongue: p.tongue });
    if (!sil && (p.y ?? 3) > -10 && !p.noShadow) pupS = `<ellipse cx="${f1(p.x ?? -34)}" cy="${f1((p.y ?? 3) + 1)}" rx="${f1(13 * k / 0.78 * 0.8)}" ry="2.6" fill="#000" opacity=".3" filter="url(#b2)"/>` + pupS;
    if (p.thread !== false && !sil) { const px = (p.x ?? -34) + 2 * k, py = (p.y ?? 3) - 26 * k; thr = `<path d="M${f1(fhx)} ${fhy} Q${f1((fhx + px) / 2)} ${f1(Math.max(fhy, py) + 10)} ${f1(px)} ${f1(py)}" fill="none" stroke="${P.amber}" stroke-width="1.1" stroke-dasharray="1.1 2.6" stroke-linecap="round" opacity=".85"/>`; }
  }
  const flash = o.flash ? `<g filter="url(#${o.flash === 'red' ? 'whurtR' : 'whurt'})">${bodyG}</g>` : bodyG;
  const lt = o.light ? `<g filter="url(#wlt${Math.round(o.light * 100)})">${flash}</g>` : flash;
  const al = o.alpha != null ? `<g opacity="${o.alpha}">${lt}${emb}</g>` : lt + emb;
  const pf = o.pup && o.pup.front;
  return fin(o, (o.pup && !pf ? pupS : '') + thr + (o.alpha != null ? al : al) + threads + (pf ? pupS : ''));
}
function cs0(th) { return Math.cos(th) > 0.5; }
