// Wren alternative takes A/B/C (static mock-up drawing code, not game code). Hollowlight Style v1 via ../style-lab/lab.mjs shp().
// Origin = ground under feet, y up = negative. Faces +x; dir:-1 mirrors. view: front | 3q | side | back.
import { shp, stk, cap, ell, circ, glow, mix, eyeG } from '../style-lab/lab.mjs';

const VW = { front: 0, '3q': 0.6, side: 1.2, back: Math.PI };
const g = (view) => { const th = VW[view || 'front']; return { th, c: Math.cos(th), s: Math.sin(th), xs: 1 - 0.36 * Math.abs(Math.sin(th)) }; };
const fin = (o, body) => { const q = o.sil ? `<g filter="url(#wsil)">${body}</g>` : body; return o.dir === -1 ? `<g transform="scale(-1,1)">${q}</g>` : q; };
const f1 = (n) => n.toFixed(1);

// ---- soft knit ribbon: scalloped edge, V-stitch rows, colour bands, fringe (fixes "scarf reads as a strap") ----
export function ribbonPts(sx, sy, len, amp, phase, sag, ang, n = 46) {
  const p = []; for (let i = 0; i < n; i++) { const t = i / (n - 1), d = len * t, w = amp * Math.sin(phase + t * 6) * (0.25 + t); p.push([sx + Math.cos(ang) * d - Math.sin(ang) * w, sy + Math.sin(ang) * d + Math.cos(ang) * w + sag * t * t]); } return p;
}
export function knit(pts, w0, w1, col, o = {}) {
  const n = pts.length, Lp = [], Rp = []; let ex = '', tn = [1, 0];
  const bands = o.bands || [], cream = o.cream || '#fbe9bd', dk = mix(col, '#7a3a0a', 0.45), hi = mix(col, '#fff2c0', 0.5);
  const pj = (a) => a.map((p) => f1(p[0]) + ' ' + f1(p[1])).join(' L');
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n - 1, i + 1)]; let tx = b[0] - a[0], ty = b[1] - a[1]; const l = Math.hypot(tx, ty) || 1; tx /= l; ty /= l;
    const nx = -ty, ny = tx, t = i / (n - 1), ww = (w0 + (w1 - w0) * t) / 2, w = ww + (o.sc ?? 0.9) * Math.abs(Math.sin(i * 1.15));
    Lp.push([pts[i][0] + nx * w, pts[i][1] + ny * w]); Rp.push([pts[i][0] - nx * w, pts[i][1] - ny * w]);
    if (i === n - 1) tn = [tx, ty];
    if (i % 2 === 0 && i < n - 1) for (const k of [-0.62, -0.2, 0.22, 0.64]) {
      const bx = pts[i][0] + nx * ww * k, by = pts[i][1] + ny * ww * k;
      ex += `<path d="M${f1(bx - nx * 1.7 - tx * 1.5)} ${f1(by - ny * 1.7 - ty * 1.5)} L${f1(bx + tx)} ${f1(by + ty)} L${f1(bx + nx * 1.7 - tx * 1.5)} ${f1(by + ny * 1.7 - ty * 1.5)}" fill="none" stroke="${dk}" stroke-width=".8" stroke-linecap="round" opacity=".6"/>`;
    }
  }
  for (const [t0, t1] of bands) { const i0 = Math.floor(t0 * (n - 1)), i1 = Math.ceil(t1 * (n - 1)); ex += `<path d="M${pj(Lp.slice(i0, i1 + 1))} L${pj(Rp.slice(i0, i1 + 1).reverse())}Z" fill="${cream}" opacity=".92"/>`; }
  ex += `<path d="M${pj(Lp)}" fill="none" stroke="${hi}" stroke-width="1.6" opacity=".6" stroke-linecap="round"/>`;
  const tail = pts[n - 1], R2 = Rp.slice();
  let out = shp(`M${pj(Lp)} L${pj(R2.reverse())}Z`, col, { w: 0.8, x: ex, so: 3 });
  if (o.fringe) for (let k = -2; k <= 2; k++) { const nx = -tn[1], ny = tn[0], hw = w1 / 2, bx = tail[0] + nx * hw * (k / 2.4), by = tail[1] + ny * hw * (k / 2.4); out += stk(`M${f1(bx)} ${f1(by)} q${f1(tn[0] * 5 + nx * k)} ${f1(tn[1] * 5 + ny * k)} ${f1(tn[0] * 7.5)} ${f1(tn[1] * 7.5 + 1)}`, k % 2 ? mix(col, '#fff', 0.25) : col, 1.9); }
  return out;
}

// ---- lantern family ----
export function lamp(x, y, s, kind, o = {}) {
  const fl = kind === 'bone' ? '#ffb347' : '#ffd05a', metal = kind === 'bone' ? '#efe4cc' : '#d2a24c';
  let r = o.sil ? '' : glow(x, y, (o.gr || 52) * s, (o.gr || 52) * 0.9 * s, '#ffc96b', 0.95);
  const gr = `<linearGradient id="lg_${kind}" x1="0" y1="-8" x2="0" y2="8" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#fff6c8"/><stop offset=".5" stop-color="${fl}"/><stop offset="1" stop-color="#ff9d3a"/></linearGradient>`;
  r += `<g transform="translate(${x},${y}) scale(${s})"><defs>${gr}</defs>`;
  if (kind === 'round') r += shp(circ(0, 0, 8.5), metal, { w: 0.7, so: 3 }) + `<circle r="6.4" fill="url(#lg_round)"/>` + shp('M-3.5 -8 L3.5 -8 L2.5 -11.5 L-2.5 -11.5Z', metal, { w: 0.6 }) + '<path d="M0 -3.5 Q3 1 0 5 Q-3 1 0 -3.5Z" fill="#fff"/>';
  else r += '<path d="M0 -17 L0 -11" stroke="#5a3a1a" stroke-width="1.3" fill="none"/>' + shp('M-6 -9 L6 -9 L4 -13.5 L-4 -13.5Z', metal, { w: 0.6 }) + shp('M-6.5 -8 L6.5 -8 L7.5 8 L-7.5 8Z', metal, { w: 0.7, so: 3 }) + `<path d="M-4.6 -6 L4.6 -6 L5.4 6 L-5.4 6Z" fill="url(#lg_${kind})"/><path d="M0 -3.8 Q3.3 1 0 5 Q-3.3 1 0 -3.8Z" fill="#fff"/><path d="M-1.8 -6 L-2.2 6 M1.8 -6 L2.2 6" stroke="${mix(metal, '#3a2410', 0.5)}" stroke-width=".9"/>` + shp(ell(0, 9, 7.5, 2.2), metal, { w: 0.5 });
  return r + '</g>';
}
export const pawPrint = (x, y, k, col, op = 1) => `<g transform="translate(${x},${y}) scale(${k})" opacity="${op}"><ellipse cx="0" cy="2" rx="4.6" ry="3.7" fill="${col}"/><ellipse cx="-5" cy="-3" rx="1.9" ry="2.5" fill="${col}"/><ellipse cx="-1.7" cy="-5.6" rx="1.9" ry="2.6" fill="${col}"/><ellipse cx="1.9" cy="-5.6" rx="1.9" ry="2.6" fill="${col}"/><ellipse cx="5.2" cy="-3" rx="1.9" ry="2.5" fill="${col}"/></g>`;

// ---- face: eyes on a sphere (yaw th), brows, blush, mouth. R = sphere radius, (cx,cy) head centre ----
function face(cx, cy, R, th, expr, o = {}) {
  if (Math.cos(th) < -0.3) return '';
  const s = Math.sin(th), er = o.er || [4.4, 5.4], ink = '#2b1c20'; let out = '';
  for (const sg of [-1, 1]) {
    const a = th + sg * 0.55, cs = Math.cos(a); if (cs < 0.12) continue;
    const x = cx + R * Math.sin(a), y = cy, rx = er[0] * (0.4 + 0.6 * cs), ry = er[1];
    if (expr === 'smile') out += `<path d="M${x - rx} ${y + 1.2} Q${x} ${y - ry * 1.15} ${x + rx} ${y + 1.2}" fill="none" stroke="${ink}" stroke-width="2" stroke-linecap="round"/>`;
    else if (expr === 'sleepy') out += `<path d="M${x - rx} ${y - 0.8} Q${x} ${y + ry * 0.9} ${x + rx} ${y - 0.8}" fill="none" stroke="${ink}" stroke-width="2" stroke-linecap="round"/>`;
    else out += eyeG(x, y, rx, expr === 'determined' ? ry * 0.82 : ry);
    const k = expr === 'determined' ? 1.6 : expr === 'worried' ? -1.8 : 0;
    if (k) { const by = y - ry - 3, l = sg === -1 ? -k * 0.8 : k, r = sg === -1 ? k : -k * 0.8; out += `<path d="M${f1(x - rx - 0.5)} ${f1(by + l)} L${f1(x + rx + 0.5)} ${f1(by + r)}" stroke="#4a2e24" stroke-width="1.5" stroke-linecap="round"/>`; }
    const a2 = th + sg * 1.0; if (Math.cos(a2) > 0.25 && expr !== 'determined') out += `<ellipse cx="${f1(cx + R * Math.sin(a2))}" cy="${f1(cy + R * 0.42)}" rx="${f1(3.4 * Math.cos(a2))}" ry="2.6" fill="#ff8a8a" opacity=".5"/>`;
  }
  const mx = cx + R * Math.sin(th) * 1.02, my = cy + R * (o.my ?? 0.52);
  if (expr === 'smile') out += `<path d="M${f1(mx - 3)} ${f1(my - 1)} Q${f1(mx)} ${f1(my + 3.4)} ${f1(mx + 3)} ${f1(my - 1)}" fill="none" stroke="#8a4a3a" stroke-width="1.4" stroke-linecap="round"/>`;
  else if (expr === 'worried') out += `<path d="M${f1(mx - 2.4)} ${f1(my + 1)} Q${f1(mx)} ${f1(my - 1.2)} ${f1(mx + 2.4)} ${f1(my + 1)}" fill="none" stroke="#8a4a3a" stroke-width="1.3" stroke-linecap="round"/>`;
  else if (expr === 'determined') out += `<path d="M${f1(mx - 2.6)} ${f1(my)} L${f1(mx + 2.6)} ${f1(my)}" stroke="#8a4a3a" stroke-width="1.4" stroke-linecap="round"/>`;
  else out += `<path d="M${f1(mx - 2)} ${f1(my - 0.5)} Q${f1(mx)} ${f1(my + 1.6)} ${f1(mx + 2)} ${f1(my - 0.5)}" fill="none" stroke="#8a4a3a" stroke-width="1.2" stroke-linecap="round"/>`;
  if (s > 0.85) out += `<path d="M${f1(cx + R * 1.0)} ${f1(cy + R * 0.25)} q3 2.5 0 4.6" fill="none" stroke="#d99a76" stroke-width="1.2" stroke-linecap="round"/>`;
  return out;
}

// =====================================================================================
// TAKE A: LANTERN KEEPER (taller chibi, patched trailing coat, lantern on a crook staff, open face under a floppy-ear cowl)
export const PAL_A = { coat: '#46707a', hood: '#7aa7a3', lining: '#efe2c8', ochre: '#c9a066', rose: '#d08f8c', sage: '#8fae7e', scarf: '#f2a335', cream: '#fbe9bd', wood: '#8a6a45', brass: '#d2a24c', skin: '#f6c9a6', hair: '#5a3a2e', boot: '#7a4e2e' };
export const H_A = 133;
export function wrenA(o = {}) {
  const view = o.view || 'front', expr = o.expr || 'neutral', run = !!o.run, sil = !!o.sil; const { th, c, s, xs } = g(view), P = PAL_A, leg = o.leg ?? (run ? 0.8 : 0), sw = o.sway ?? 0;
  const hx = -24 * c + 14 * s + (run ? 4 : 0), ox = -12 * c + 16 * s, sg = hx >= 0 ? 1 : -1; let b = '';
  const lx = hx + ox, ly = -113, armC = mix(P.coat, '#8fc0c0', 0.12);
  const tx = -(26 + (run ? 34 : 0)) * Math.sin(Math.min(th, 1.3)) + sw;
  if (Math.abs(tx) > 5 && view !== 'back') b += shp(`M-6 -58 Q${f1(tx * 0.5)} -44 ${f1(tx)} -8 L${f1(tx * 0.72)} -13 L${f1(tx * 0.52)} -4 L${f1(tx * 0.3)} -11 L${f1(tx * 0.12 - 2)} -4 L-4 -6Z`, mix(P.coat, '#1b2a3a', 0.25), { w: 0.8 });
  if (!o.bare) b += stk(`M${hx + 2} 1 L${hx - 1} -124`, P.wood, 3.4) + stk(`M${hx - 1} -124 Q${hx - 1} -133 ${f1(hx + ox * 0.8)} -131 Q${lx} -129 ${lx} -121`, P.wood, 2.8) + lamp(lx, ly, 1.05, 'cage', { sil, gr: 58 });
  for (const q of [-1, 1]) b += shp(ell(q * 7 * xs + q * leg * 5 + 3 * s, -2.6, 7.8, 4.3), P.boot, { w: 0.8 });
  const stitch = (x, y, w, h, rot = 0) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="1.4" fill="none" stroke="#fff6dc" stroke-width=".7" stroke-dasharray="1.3 1.2" opacity=".85" transform="rotate(${rot} ${x + w / 2} ${y + h / 2})"/>`;
  const patches = `<rect x="-20" y="-33" width="11" height="10" rx="1.5" fill="${P.ochre}"/>${stitch(-20, -33, 11, 10)}<circle cx="12" cy="-19" r="6" fill="${P.rose}"/><circle cx="12" cy="-19" r="6" fill="none" stroke="#fff6dc" stroke-width=".7" stroke-dasharray="1.3 1.2" opacity=".85"/><rect x="-2" y="-49" width="10" height="9" rx="1.5" transform="rotate(8 3 -45)" fill="${P.sage}"/>${stitch(-2, -49, 10, 9, 8)}<rect x="-30" y="-39" width="60" height="4" fill="${P.wood}"/><circle cx="3" cy="-37" r="2.6" fill="${P.brass}"/>`;
  b += `<g transform="scale(${xs.toFixed(3)},1)">${shp('M-13 -62 Q-16 -40 -29 -9 L-22 -4 L-14 -9 L-6 -4 L2 -9 L10 -4 L18 -9 L29 -8 Q16 -40 13 -62 Q0 -67 -13 -62Z', P.coat, { w: 0.9, so: 6, x: patches })}</g>`;
  if (view !== 'side') b += shp(cap(-sg * 12 * xs, -57, -sg * 15 * xs, -38, 5.2, 4.6), armC, { w: 0.8 }) + shp(circ(-sg * 15 * xs, -35, 4.3), P.skin, { w: 0.7 });
  const ang = view === 'front' ? 1.55 : Math.PI - 0.1, sx0 = view === 'front' ? 9 : view === '3q' ? -3 : view === 'side' ? -9 : -6;
  const collar = []; for (let i = 0; i < 26; i++) { const t = i / 25; collar.push([(-15 + 30 * t) * xs, -62 + 5.5 * Math.sin(Math.PI * t)]); }
  b += knit(ribbonPts(sx0, -58, run ? 128 : 40, run ? 9 : 4, 0.8 + sw * 0.1, run ? 2 : 6, ang), 11, 9, P.scarf, { bands: [[0.45, 0.58], [0.78, 0.9]], cream: P.cream, fringe: true });
  b += knit(collar, 9.5, 9.5, P.scarf, { bands: [[0.1, 0.2], [0.8, 0.9]], cream: P.cream, sc: 0.8 });
  b += shp(cap(sg * 12 * xs, -57, hx, -42, 5.8, 5), armC, { w: 0.8 }) + shp(circ(hx, -40, 4.7), P.skin, { w: 0.7 });
  const hb = -4 * s, kk = 0.4 + 0.6 * Math.abs(c), e1 = -12 * c - 6 * s + hb, e2 = 12 * c - 14 * s + hb;
  b += shp(`M${f1(e1 - 7)} -96 Q${f1(e1 - 9)} -111 ${f1(e1 - 4)} -124 Q${f1(e1 + 4)} -111 ${f1(e1 + 7)} -95Z`, P.hood, { w: 0.8 }) + shp(`M${f1(e1 - 3.6)} -100 Q${f1(e1 - 4.4)} -110 ${f1(e1 - 3)} -118 Q${f1(e1 + 1)} -110 ${f1(e1 + 3.4)} -99Z`, P.lining, { w: 0.4, nl: true });
  b += shp(`M${f1(e2 - 7)} -96 Q${f1(e2 - 5)} -111 ${f1(e2 + 3)} -116 Q${f1(e2 + 12 * c)} -118 ${f1(e2 + 17 * c)} -103 Q${f1(e2 + 10 * c)} -108 ${f1(e2 + 7)} -97Z`, P.hood, { w: 0.8 }) + shp(`M${f1(e2 - 3)} -99 Q${f1(e2 - 1)} -108 ${f1(e2 + 4)} -111 Q${f1(e2 + 9 * c)} -110 ${f1(e2 + 11 * c)} -103 Q${f1(e2 + 6)} -105 ${f1(e2 + 4)} -98Z`, P.lining, { w: 0.4, nl: true });
  if (view === 'back') {
    b += shp(ell(hb, -80, 21.5, 21), P.hood, { w: 1, so: 6 }) + `<path d="M${hb} -101 L${hb} -60" stroke="${mix(P.hood, '#2a4448', 0.5)}" stroke-width="1.3" stroke-dasharray="2 1.6" opacity=".8"/>` + pawPrint(hb, -78, 1.5, '#f2a335');
  } else {
    const lapX = (side) => hb + side * 21 * kk;
    for (const q of [-1, 1]) b += shp(`M${f1(lapX(q))} -88 Q${f1(lapX(q) + q * 4)} -72 ${f1(lapX(q) - q)} -60 L${f1(lapX(q) - q * 6)} -63 Q${f1(lapX(q) - q * 2)} -74 ${f1(lapX(q) - q * 5)} -88Z`, mix(P.hood, '#4f7f7c', 0.2), { w: 0.8 });
    const fx = 8 * s;
    b += shp(ell(fx, -75, 15.4 * (1 - 0.16 * s), 15.2), P.skin, { w: 0.6, so: 3 });
    b += shp(`M${f1(fx - 16)} -80 Q${f1(fx - 8)} -98 ${f1(fx + 2)} -92 Q${f1(fx + 10)} -96 ${f1(fx + 16)} -80 Q${f1(fx + 9)} -84 ${f1(fx + 1)} -85 Q${f1(fx - 8)} -84 ${f1(fx - 16)} -80Z`, P.hair, { w: 0.5, so: 2 });
    b += face(0, -75, 15, th, expr, { my: 0.5 });
    b += shp(`M${f1(hb - 23)} -82 Q${f1(hb - 25)} -109 ${f1(hb)} -111 Q${f1(hb + 25)} -109 ${f1(hb + 23)} -82 Q${f1(hb + 13)} -94 ${f1(hb)} -94 Q${f1(hb - 13)} -94 ${f1(hb - 23)} -82Z`, P.hood, { w: 1, so: 5 });
    b += shp(`M${f1(hb - 20)} -85 Q${f1(hb)} -99 ${f1(hb + 20)} -85 Q${f1(hb)} -95 ${f1(hb - 20)} -85Z`, P.lining, { w: 0.4, nl: true });
  }
  return fin(o, b);
}

// =====================================================================================
// TAKE B: PACK PUP WREN (small and round, giant chunky scarf, knit beanie with round ears, mittens, a ghost-wolf pup on her shoulder)
export const PAL_B = { parka: '#7d8fb8', hat: '#a9bfd2', hatDk: '#7c95ad', scarf: '#f2a335', cream: '#fff0c4', mitt: '#f2a335', skin: '#f6c9a6', hair: '#5a3a2e', boot: '#6a4a3a', pup: '#ffdf9a', pupDk: '#f3bf70', thread: '#ffb84a' };
export const H_B = 101;
function pup(x, y, k, o) {
  const P = PAL_B, sp = { spirit: true }; let r = o.sil ? '' : glow(x, y - 2, 20 * k, 16 * k, '#ffc45a', 0.55);
  r += `<g transform="translate(${x},${y}) scale(${k})">`;
  r += shp('M-7 -2 C-16 -6 -16 -16 -9 -17 C-13 -12 -9 -8 -4 -6Z', P.pupDk, { w: 0.7, ...sp });
  r += shp(ell(0, 0, 10.5, 7.5), P.pup, { w: 0.8, so: 4, ...sp });
  r += shp(circ(7, 0, 6), P.pup, { w: 0.8, ...sp }) + shp('M3 -4 L2.4 -11.4 L7.4 -6.6Z', P.pup, { w: 0.6, ...sp }) + shp('M8 -5.4 L11.6 -11 L12.4 -3.4Z', P.pup, { w: 0.6, ...sp });
  r += `<path d="M3.6 -0.5 Q5.4 1.6 7.4 -0.5" fill="none" stroke="#7a3a12" stroke-width="1.2" stroke-linecap="round"/><ellipse cx="11" cy="2" rx="1.5" ry="1.1" fill="#3a2418"/><circle cx="-1" cy="4" r="1.6" fill="${P.thread}"/>`;
  return r + '</g>';
}
export function wrenB(o = {}) {
  const view = o.view || 'front', expr = o.expr || 'smile', run = !!o.run, sil = !!o.sil; const { th, c, s, xs } = g(view), P = PAL_B, leg = o.leg ?? (run ? 0.8 : 0), sw = o.sway ?? 0; let b = '';
  const hx = -25 * c + 12 * s, hyy = -25, hb = -3 * s, fx = 9 * s, sgn = hx >= 0 ? 1 : -1;
  const lpx = hx + (view === 'back' ? 3 : -2 * c + 3 * s), lpy = -7;
  if (!o.bare) b += lamp(lpx, lpy, 0.8, 'round', { sil, gr: 60 });
  if (!o.bare) b += stk(`M${hx} ${hyy + 3} Q${hx - 1} -17 ${f1(lpx)} ${lpy - 9}`, '#5a3a1a', 1.3);
  for (const q of [-1, 1]) b += shp(ell(q * 8.5 * xs + q * leg * 4 + 3 * s, -3.4, 8.8, 5.2), P.boot, { w: 0.8 });
  if (view !== 'side') b += shp(cap(-sgn * 18 * xs, -37, -sgn * 24 * xs, -26, 5, 4.6), P.parka, { w: 0.8 }) + shp(circ(-sgn * 24 * xs, -23, 6.2), P.mitt, { w: 0.8 });
  const puff = `<path d="M-26 -22 Q0 -20 26 -22 M-23 -31 Q0 -28 23 -31" fill="none" stroke="${mix(P.parka, '#2a3a60', 0.45)}" stroke-width="1.2" opacity=".7"/><rect x="-1" y="-42" width="2" height="38" fill="${mix(P.parka, '#2a3a60', 0.4)}" opacity=".5"/>`;
  b += `<g transform="scale(${(1 - 0.22 * Math.abs(s)).toFixed(3)},1)">${shp('M-20 -38 Q-29 -24 -22 -9 Q0 -3 22 -9 Q29 -24 20 -38 Q0 -44 -20 -38Z', P.parka, { w: 1, so: 6, x: puff })}</g>`;
  const ear = (x0, lean) => shp(`M${f1(x0 - 7)} -84 Q${f1(x0 - 7 + lean)} -99 ${f1(x0 + lean * 1.3)} -101 Q${f1(x0 + 7 + lean)} -99 ${f1(x0 + 7)} -84Z`, P.hat, { w: 0.9 }) + shp(`M${f1(x0 - 3.6)} -87 Q${f1(x0 - 3 + lean)} -95 ${f1(x0 + lean)} -96.6 Q${f1(x0 + 3.4 + lean)} -94 ${f1(x0 + 3.6)} -87Z`, '#f6d7cf', { w: 0.4, nl: true });
  if (view === 'back') {
    b += ear(-13, -2) + ear(13, 2) + shp(ell(0, -62, 24, 23), P.hat, { w: 1, so: 6 }) + `<path d="M0 -86 L0 -42" stroke="${P.hatDk}" stroke-width="1.3" stroke-dasharray="2 1.6" opacity=".8"/>` + shp('M-25 -62 Q0 -48 25 -62 L25 -69 Q0 -55 -25 -69Z', P.hatDk, { w: 0.8 });
  } else {
    const ek = 0.45 + 0.55 * Math.abs(c);
    b += ear(-13 * ek + hb, -2) + ear(13 * ek - 6 * s + hb, 2);
    b += shp(ell(fx, -58, 19.5 * (1 - 0.14 * s), 17.4), P.skin, { w: 0.6, so: 3 });
    b += shp(`M${f1(fx - 18)} -64 Q${f1(fx - 8)} -80 ${f1(fx + 1)} -74 Q${f1(fx + 9)} -80 ${f1(fx + 18)} -64 Q${f1(fx + 8)} -68 ${f1(fx)} -68 Q${f1(fx - 8)} -68 ${f1(fx - 18)} -64Z`, P.hair, { w: 0.5, so: 2 });
    b += face(0, -58, 17.5, th, expr, { er: [4.9, 5.8], my: 0.5 });
    let rib = ''; for (let x = -26; x <= 26; x += 6) rib += `M${x} -92 L${x} -62 `;
    b += `<g transform="translate(${f1(hb)},0) scale(${(1 - 0.08 * s).toFixed(3)},1)">${shp('M-25 -63 Q-28 -94 0 -94 Q28 -94 25 -63 Q14 -71 0 -71 Q-14 -71 -25 -63Z', P.hat, { w: 1, so: 5, x: `<path d="${rib}" stroke="${P.hatDk}" stroke-width="1.2" opacity=".55"/>` })}</g>`;
    b += shp(`M${f1(hb - 26)} -64 Q${f1(hb)} -75 ${f1(hb + 26)} -64 L${f1(hb + 25)} -70 Q${f1(hb)} -81 ${f1(hb - 25)} -70Z`, P.hatDk, { w: 0.8 });
    for (const q of [-1, 1]) { if (q > 0 && s > 0.8) continue; const t0 = hb + q * 25 * (0.5 + 0.5 * Math.abs(c)); b += stk(`M${f1(t0)} -66 Q${f1(t0 + q * 3)} -56 ${f1(t0 + q)} -46`, P.hatDk, 2.4) + `<circle cx="${f1(t0 + q)}" cy="-45" r="3" fill="${P.scarf}" stroke="#c9701f" stroke-width=".8"/>`; }
  }
  const ring = []; for (let i = 0; i < 28; i++) { const t = i / 27; ring.push([(-25 + 50 * t) * xs, -41 + 6.3 * Math.sin(Math.PI * t)]); }
  const sx0 = view === 'front' ? 14 : view === '3q' ? 4 : view === 'side' ? -6 : 10, ang = view === 'front' ? 1.62 : view === 'back' ? 1.7 : Math.PI - 0.5;
  b += knit(ring, 14, 14, P.scarf, { bands: [[0.18, 0.28], [0.72, 0.82]], cream: P.cream, sc: 1.2 });
  b += knit(ribbonPts(sx0, -36, run ? 78 : 44, run ? 7 : 3, 1 + sw * 0.1, run ? 4 : 2, run ? Math.PI - 0.05 : ang), 16, 14, P.scarf, { bands: [[0.4, 0.52], [0.7, 0.82]], cream: P.cream, sc: 1.2, fringe: true });
  b += shp(cap(sgn * 19 * xs, -37, hx, hyy - 2, 5.4, 4.8), P.parka, { w: 0.8 }) + shp(circ(hx, hyy, 6.4), P.mitt, { w: 0.8, x: `<path d="M${hx - 7} ${hyy - 2} h14 M${hx - 7} ${hyy + 2.4} h14" stroke="${P.cream}" stroke-width="1.8"/>` }) + shp(ell(hx + 4.4, hyy - 4.2, 2.6, 3.2), P.mitt, { w: 0.6 });
  if (!o.bare) b += pup(22 * c - 7 * s, -41 + (view === 'side' ? 2 : 0), 1.05, { sil });
  return fin(o, b);
}

// =====================================================================================
// TAKE C: PELT WALKER (bold departure: no scarf, no ear-hood; the pack's alpha pelt as a wolf-head hood and mantle, shadowed face with two amber glints,
// stitched amber paw prints, a bone-cage ember floating on a thread, loose threads from her fingers that her wolves follow)
export const PAL_C = { tunic: '#34506a', pelt: '#cdd9e2', peltDk: '#8da3b7', inner: '#59708a', void: '#141b27', amber: '#ffb84a', glint: '#ffd98a', bone: '#efe4cc', skin: '#8a6e66', skinHand: '#e8c4a8', boot: '#2b3441', nose: '#2a3140' };
export const H_C = 122;
export function wrenC(o = {}) {
  const view = o.view || 'front', expr = o.expr || 'neutral', run = !!o.run, sil = !!o.sil; const { th, c, s, xs } = g(view), P = PAL_C, leg = o.leg ?? (run ? 0.8 : 0), sw = o.sway ?? 0, bob = o.bob ?? 0; let b = '';
  const Lx = 33 + 6 * s, Ly = -80 + bob, Hx = Lx * 0.5, Hy = -47, fhx = -17 * xs - 3 * s, fhy = -34;
  if (!o.bare) b += `<path d="M${f1(Hx)} ${Hy} Q${f1(Lx * 0.95)} ${f1(Ly + 14)} ${f1(Lx)} ${f1(Ly - 11)}" fill="none" stroke="${P.amber}" stroke-width="1.2" stroke-dasharray="1.2 2.4" stroke-linecap="round"/>` + lamp(Lx, Ly, 0.95, 'bone', { sil, gr: 62 });
  if (view !== 'back' && !o.bare) for (const [dx, dy, q] of [[-20, -3, 0], [-30, -10, 1], [-18, -14, 2]]) b += `<path d="M${f1(fhx)} ${fhy} Q${f1(fhx + dx * 0.5)} ${fhy + 22 + q * 3} ${f1(fhx + dx)} ${fhy + dy + 20}" fill="none" stroke="${P.amber}" stroke-width="1.2" stroke-dasharray="1.2 2.6" stroke-linecap="round" opacity=".85"/>`;
  const W = 32 * xs, zig = []; for (let i = 0; i <= 8; i++) zig.push(`L${f1(-W + (2 * W * i) / 8)} ${i % 2 ? -7 : -14}`);
  const tx = -(30 + (run ? 40 : 0)) * Math.max(s, 0.5) + sw, ty = -26 - (run ? 14 : 0);
  if (view !== 'back') b += shp(`M-6 -42 C${f1(tx * 0.4)} -48 ${f1(tx * 0.8)} -38 ${f1(tx)} ${ty} C${f1(tx * 0.75)} -20 ${f1(tx * 0.4)} -22 -6 -22Z`, P.pelt, { w: 0.9 });
  b += shp(`M${f1(-13 * xs)} -62 Q${f1(-W * 1.05)} -46 ${f1(-W)} -14 ${zig.join(' ')} Q${f1(W * 1.05)} -46 ${f1(13 * xs)} -62 Q0 -67 ${f1(-13 * xs)} -62Z`, view === 'back' ? P.pelt : P.inner, { w: 0.9, so: 6, x: view === 'back' ? pawPrint(0, -34, 3.2, P.amber, 0.95) + `<path d="M0 -62 L0 -14" stroke="${P.peltDk}" stroke-width="1.2" stroke-dasharray="2 2"/>` : '' });
  if (view !== 'back') {
    for (const q of [-1, 1]) b += shp(ell(q * 6.5 * xs + q * leg * 5 + 3 * s, -2.6, 6.8, 4), P.boot, { w: 0.8 });
    b += shp(`M${f1(-11 * xs)} -58 Q${f1(-13 * xs)} -36 ${f1(-17 * xs)} -8 L${f1(-11 * xs)} -3 L-5 -8 L2 -3 L${f1(9 * xs)} -8 L${f1(17 * xs)} -6 Q${f1(13 * xs)} -36 ${f1(11 * xs)} -58Z`, P.tunic, { w: 0.9, so: 5, x: `<path d="M-20 -7 Q0 -3 20 -7" fill="none" stroke="${P.amber}" stroke-width="1.4" stroke-dasharray="2.2 2" opacity=".95"/>` });
    if (view === 'front' || view === '3q') b += (sil ? '' : `<ellipse cx="${f1(-21 * xs)}" cy="-24" rx="9" ry="8" fill="${P.amber}" opacity=".3" filter="url(#wbl2)"/>`) + pawPrint(f1(-21 * xs), -24, 0.95, P.amber, 0.95) + pawPrint(f1(20 * xs), -31, 0.8, P.amber, 0.9);
  }
  const mz = []; for (let i = 0; i <= 8; i++) mz.push(`L${f1(W * 0.8 - (2 * W * 0.8 * i) / 8)} ${i % 2 ? -38 : -45}`);
  b += shp(`M${f1(-W * 0.8)} -50 Q${f1(-W * 0.88)} -60 ${f1(-12 * xs)} -66 Q0 -70 ${f1(12 * xs)} -66 Q${f1(W * 0.88)} -60 ${f1(W * 0.8)} -50 ${mz.join(' ')}Z`, P.pelt, { w: 0.9, so: 5 });
  b += shp(circ(Hx, Hy, 4), P.skinHand, { w: 0.7 }) + (view !== 'back' ? shp(circ(fhx, fhy, 3.8), P.skinHand, { w: 0.7 }) : '');
  const hb = -3 * s, fx = 8 * s;
  const ear = (x0, dx) => shp(`M${f1(x0 - 7)} -96 L${f1(x0 + dx)} -122 L${f1(x0 + 8)} -97Z`, P.pelt, { w: 0.9 }) + shp(`M${f1(x0 - 3.6)} -98 L${f1(x0 + dx * 0.9)} -115 L${f1(x0 + 4)} -98Z`, P.inner, { w: 0.4, nl: true });
  const ek = 0.5 + 0.5 * Math.abs(c);
  b += ear(-13 * ek + hb - 3 * s, -1) + ear(13 * ek + hb - 8 * s, 2);
  if (view === 'back') b += shp(ell(hb, -82, 22, 21), P.pelt, { w: 1, so: 6, x: `<path d="M-6 -100 q-2 8 2 12 M7 -97 q2 6 -1 10 M0 -70 q-3 5 0 9" stroke="${P.peltDk}" stroke-width="1.2" fill="none"/>` });
  else {
    b += shp(ell(hb, -84, 22 * (1 - 0.08 * s), 20), P.pelt, { w: 1, so: 6 });
    for (const q of [-1, 1]) b += shp(`M${f1(fx + q * 14)} -86 L${f1(fx + q * 22)} -70 L${f1(fx + q * 15)} -73 L${f1(fx + q * 20)} -60 L${f1(fx + q * 11)} -66Z`, P.pelt, { w: 0.8 });
    b += `<ellipse cx="${f1(fx)}" cy="-76" rx="${f1(14 * (1 - 0.18 * s))}" ry="12.5" fill="${P.void}" stroke="${mix(P.pelt, '#2a3a50', 0.5)}" stroke-width="1.2"/>`;
    b += shp(ell(fx, -67, 7 * (1 - 0.3 * s), 3.2), P.skin, { w: 0.3, nl: true });
    for (const sg of [-1, 1]) {
      const a = th + sg * 0.55, cs = Math.cos(a); if (cs < 0.12) continue; const x = 12 * Math.sin(a), y = -77, rx = 2.6 * (0.5 + 0.5 * cs); let sh;
      if (expr === 'determined') sh = `<path d="M${f1(x - rx * 1.5)} ${f1(y - sg * 0.9)} L${f1(x + rx * 1.5)} ${f1(y + sg * 0.9)}" stroke="${P.glint}" stroke-width="2.4" stroke-linecap="round"/>`;
      else if (expr === 'sorrow') sh = `<ellipse cx="${f1(x)}" cy="${y + 0.6}" rx="${f1(rx)}" ry="2.6" fill="${P.glint}" transform="rotate(${sg * 18} ${f1(x)} ${y})"/><circle cx="${f1(x + sg * 1.2)}" cy="${y + 7}" r="1.2" fill="#bfe6ff"/>`;
      else sh = `<ellipse cx="${f1(x)}" cy="${y}" rx="${f1(rx)}" ry="3.1" fill="${P.glint}"/><circle cx="${f1(x - 0.6)}" cy="${y - 0.9}" r="0.9" fill="#fff"/>`;
      b += (sil ? '' : glow(x, y, 9, 9, '#ffb84a', 0.6)) + sh;
    }
    if (view === 'side' || view === '3q') { const mxx = 6 + 12 * s; b += shp(`M${f1(mxx - 12)} -97 Q${f1(mxx)} -99 ${f1(mxx + 10)} -93 Q${f1(mxx + 15)} -90 ${f1(mxx + 14)} -86 Q${f1(mxx + 8)} -83 ${f1(mxx - 2)} -85 Q${f1(mxx - 10)} -86 ${f1(mxx - 12)} -97Z`, P.pelt, { w: 0.9 }) + shp(ell(mxx + 13, -87.5, 2.8, 2.3), P.nose, { w: 0.4, nl: true }); }
    else b += shp(`M${fx - 6.5} -102 Q${fx - 9} -92 ${fx - 3.6} -85 Q${fx} -83 ${fx + 3.6} -85 Q${fx + 9} -92 ${fx + 6.5} -102 Q${fx} -105 ${fx - 6.5} -102Z`, P.pelt, { w: 0.9 }) + shp(ell(fx, -85.5, 3.6, 2.7), P.nose, { w: 0.4, nl: true }) + `<path d="M${fx} -101 L${fx} -92" stroke="${P.peltDk}" stroke-width="1.3" opacity=".6"/>`;
  }
  return fin(o, b);
}
export const TAKES = {
  A: { id: 'A', name: 'LANTERN KEEPER', fn: wrenA, H: H_A, pal: PAL_A, head: [0, -92, 60, 72], exprs: ['neutral', 'determined', 'smile'], tell: 'tall coat + lantern ABOVE head' },
  B: { id: 'B', name: 'PACK PUP WREN', fn: wrenB, H: H_B, pal: PAL_B, head: [0, -71, 64, 64], exprs: ['smile', 'sleepy', 'worried'], tell: 'round ball + huge scarf + pale pup' },
  C: { id: 'C', name: 'PELT WALKER', fn: wrenC, H: H_C, pal: PAL_C, head: [0, -93, 64, 62], exprs: ['neutral', 'determined', 'sorrow'], tell: 'wolf-muzzle hood + pelt tail + floating ember' },
};
