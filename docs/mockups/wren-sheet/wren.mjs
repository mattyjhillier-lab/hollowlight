// Wren: ONE parametric, layered vector character (Hollowlight Style v1 = L2 + H2 + P1 + W2 + G1/G2).
// Built on ../style-lab/lab.mjs (shp = tinted outline + soft gradient + rim light). Origin = ground under her feet, y up = negative.
import { use, shp, stk, cap, ell, circ, glow, mix, lgU, eyeG, addDef } from '../style-lab/lab.mjs';
import { STYLES } from '../style-lab/scene.mjs';

export const PAL = {
  hood: '#74a09b', hoodDk: '#3f6b6e', coat: '#5f8f93', fur: '#f3e7cf', skin: '#f6c9a6', hair: '#5a3a2e', earIn: '#efd0bc',
  scarf: '#f2a335', scarfHi: '#ffd07a', scarfDk: '#c9701f', boot: '#8a5530', sock: '#5a4638', brass: '#d2a24c', flame: '#ffd05a', patch: '#bfa079', bone: '#efe4cc',
};
export const SWATCHES = [
  ['Hood / ears', PAL.hood], ['Coat', PAL.coat], ['Hood trim (fur)', PAL.fur], ['Scarf amber', PAL.scarf], ['Scarf stripe', PAL.scarfDk],
  ['Lantern flame', PAL.flame], ['Brass', PAL.brass], ['Skin', PAL.skin], ['Hair', PAL.hair], ['Boots', PAL.boot], ['Patch / cord', PAL.patch], ['Bone whistle', PAL.bone],
];
export const WREN_UNITS_TALL = 112; // feet to ear tips

export function wrenDefs() {
  const lt = (k) => `<filter id="wlt${Math.round(k * 100)}" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="${1 - k} 0 0 0 ${k}  0 ${1 - k} 0 0 ${(k * 0.92).toFixed(3)}  0 0 ${1 - k} 0 ${(k * 0.7).toFixed(3)}  0 0 0 1 0"/></filter>`;
  return `<defs>
<filter id="wbl8" filterUnits="userSpaceOnUse" x="-600" y="-500" width="1200" height="900"><feGaussianBlur stdDeviation="8"/></filter><filter id="wbl2" filterUnits="userSpaceOnUse" x="-600" y="-500" width="1200" height="900"><feGaussianBlur stdDeviation="2"/></filter>
<filter id="wsil" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="0 0 0 0 .05  0 0 0 0 .07  0 0 0 0 .1  0 0 0 1 0"/></filter>
<filter id="whurt" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values=".35 0 0 0 .65  0 .35 0 0 .58  0 0 .35 0 .58  0 0 0 1 0"/></filter>
<filter id="whurtR" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values=".85 0 0 0 .22  0 .5 0 0 .02  0 0 .5 0 .02  0 0 0 1 0"/></filter>
${lt(0.25)}${lt(0.5)}${lt(0.75)}${lt(1)}</defs>`;
}

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const f1 = (n) => n.toFixed(1);

// ---------- scarf: a ribbon along a wavy centre-line (also exported for the animation notes) ----------
export function scarfCurve(o) {
  const { sx, sy, ang, len, amp, phase, sag = 0 } = o, N = 18, pts = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N, wave = Math.sin(phase + t * 5.2) * amp * (0.2 + 0.8 * t);
    pts.push([sx + Math.cos(ang) * len * t - Math.sin(ang) * wave, sy + Math.sin(ang) * len * t + Math.cos(ang) * wave + sag * t * t]);
  }
  return pts;
}
export function scarfTrail(o, sil) {
  const pts = scarfCurve(o), N = pts.length - 1, L = [], R = [], w0 = o.w0 ?? 10, w1 = o.w1 ?? 7.4;
  for (let i = 0; i <= N; i++) {
    const a = pts[Math.max(0, i - 1)], b = pts[Math.min(N, i + 1)], tx = b[0] - a[0], ty = b[1] - a[1], m = Math.hypot(tx, ty) || 1, nx = -ty / m, ny = tx / m;
    const t = i / N, w = (w0 + (w1 - w0) * t) * (1 + 0.16 * Math.sin(t * 9 + 1)) * (i === 0 ? 0.8 : 1);
    L.push([pts[i][0] + nx * w, pts[i][1] + ny * w]); R.push([pts[i][0] - nx * w, pts[i][1] - ny * w]);
    if (i === N) { o._tx = tx / m; o._ty = ty / m; }
  }
  // frayed end: three little teeth
  const e = [], tx = o._tx, ty = o._ty;
  for (let k = 0; k <= 3; k++) { const u = k / 3, px = L[N][0] + (R[N][0] - L[N][0]) * u, py = L[N][1] + (R[N][1] - L[N][1]) * u; const out = k % 2 === 0 ? 6.5 : 1; e.push([px + tx * out, py + ty * out]); }
  const d = 'M' + L.map((p) => f1(p[0]) + ' ' + f1(p[1])).join(' L') + ' L' + e.map((p) => f1(p[0]) + ' ' + f1(p[1])).join(' L') + ' L' + R.slice().reverse().map((p) => f1(p[0]) + ' ' + f1(p[1])).join(' L') + 'Z';
  let st = '';
  for (let i = 2; i < N; i += 3) st += `<path d="M${f1(L[i][0])} ${f1(L[i][1])} L${f1(R[i][0])} ${f1(R[i][1])}" stroke="${PAL.scarfDk}" stroke-width="2.4" opacity=".6"/><path d="M${f1(L[i + 1][0])} ${f1(L[i + 1][1])} L${f1(R[i + 1][0])} ${f1(R[i + 1][1])}" stroke="${PAL.scarfHi}" stroke-width="1.2" opacity=".55"/>`;
  let out = '';
  if (o.glow && !sil) {
    const p0 = pts[0], pN = pts[N], gk = `sg${Math.round(p0[0])}_${Math.round(p0[1])}_${Math.round(pN[0])}_${Math.round(pN[1])}`;
    const g = lgU(gk, p0[0], p0[1], pN[0], pN[1], [[0, '#ffc45a', 0.85], [1, '#ffb84a', 0]]);
    const cd = 'M' + pts.map((p) => f1(p[0]) + ' ' + f1(p[1])).join(' L');
    out += `<g style="mix-blend-mode:screen"><path d="${cd}" stroke="url(#${g})" stroke-width="${o.glow * 24}" fill="none" stroke-linecap="round" opacity=".42" filter="url(#wbl8)"/><path d="${cd}" stroke="url(#${g})" stroke-width="${o.glow * 5}" fill="none" stroke-linecap="round" opacity=".85" filter="url(#wbl2)"/></g>`;
  }
  return out + shp(d, PAL.scarf, { w: 0.85, so: 3, x: st });
}

// ---------- hood ear (flat triangle seen at an angle) ----------
let _ec = 0;
function earClip(d) { const id = "wec" + (++_ec); addDef(`<clipPath id="${id}"><path d="${d}"/></clipPath>`); return id; }
function ear(x, y, wF, tilt, hr, showInner, bend, mend) {
  const w = hr * 0.44 * wF, h = hr * 0.95, tip = bend ? w * 0.7 : 0, th = bend ? h * 0.88 : h;
  const d = `M${f1(-w)} 4 C${f1(-w * 1.05)} ${f1(-h * 0.5)} ${f1(-w * 0.3 + tip * 0.4)} ${f1(-th * 0.93)} ${f1(tip)} ${f1(-th)} C${f1(w * 0.4 + tip * 0.35)} ${f1(-th * 0.9)} ${f1(w * 1.08)} ${f1(-h * 0.45)} ${f1(w)} 4Z`;
  let o = shp(d, PAL.hood, { w: 0.9, so: 4 });
  if (showInner) o += shp(`M${f1(-w * 0.56)} 1 C${f1(-w * 0.6)} ${f1(-h * 0.42)} ${f1(-w * 0.1 + tip * 0.4)} ${f1(-th * 0.7)} ${f1(tip * 0.75)} ${f1(-th * 0.76)} C${f1(w * 0.3 + tip * 0.3)} ${f1(-th * 0.66)} ${f1(w * 0.62)} ${f1(-h * 0.4)} ${f1(w * 0.56)} 1Z`, PAL.earIn, { w: 0.5, so: 2 });
  if (mend && showInner) o += `<g clip-path="url(#${earClip(d)})"><path d="M${f1(-w * 0.9)} ${f1(-h * 0.62)} L${f1(w * 0.5)} ${f1(-h * 0.7)} L${f1(w * 0.55)} ${f1(-h * 0.36)} L${f1(-w * 0.9)} ${f1(-h * 0.3)}Z" fill="${PAL.scarf}" stroke="${PAL.scarfDk}" stroke-width=".9"/><path d="M${f1(-w * 0.5)} ${f1(-h * 0.7)} v${f1(h * 0.4)}M${f1(-w * 0.05)} ${f1(-h * 0.7)} v${f1(h * 0.4)}M${f1(w * 0.4)} ${f1(-h * 0.7)} v${f1(h * 0.4)}" stroke="${PAL.scarfDk}" stroke-width="1" opacity=".8"/></g>`;

  return `<g transform="translate(${f1(x)},${f1(y)}) rotate(${f1(tilt)})">${o}</g>`;
}

// ---------- eyes ----------
function eye(x, y, rx, ry, kind, inner, sx) {
  let o = '';
  const g = (s) => `<g transform="translate(${f1(x)},0) scale(${sx.toFixed(2)},1) translate(${f1(-x)},0)">${s}</g>`;
  if (kind === 'happy') o = `<path d="M${f1(x - rx)} ${f1(y + ry * 0.5)} Q${f1(x)} ${f1(y - ry * 1.15)} ${f1(x + rx)} ${f1(y + ry * 0.5)}" fill="none" stroke="#2b1c20" stroke-width="2" stroke-linecap="round"/>`;
  else if (kind === 'closed') o = `<path d="M${f1(x - rx)} ${f1(y)} Q${f1(x)} ${f1(y + ry * 0.85)} ${f1(x + rx)} ${f1(y)}" fill="none" stroke="#2b1c20" stroke-width="1.9" stroke-linecap="round"/>`;
  else if (kind === 'squint') { const s = inner; o = `<path d="M${f1(x - s * rx * 0.9)} ${f1(y - ry * 0.85)} L${f1(x + s * rx * 0.8)} ${f1(y)} L${f1(x - s * rx * 0.9)} ${f1(y + ry * 0.85)}" fill="none" stroke="#2b1c20" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>`; }
  else {
    const k = kind === 'wide' ? 1.12 : kind === 'narrow' ? 0.8 : 1;
    o = eyeG(x, y + (kind === 'narrow' ? 0.8 : 0), rx * (kind === 'wide' ? 1.06 : 1), ry * k * (kind === 'wide' ? 1.1 : 1));
    if (kind === 'narrow') o += `<path d="M${f1(x - rx * 1.4)} ${f1(y - ry * 1.5)} L${f1(x + rx * 1.4)} ${f1(y - ry * 1.5)} L${f1(x + inner * rx * 1.4)} ${f1(y - ry * 0.15)}Z" fill="${PAL.skin}"/>`;
  }
  return g(o);
}

export function lanternSvg(lhx, lhy, lAng, lg, sil) {
    let s = '';
    const gy = lhy + 20;
    if (!sil && lg > 0) s += glow(lhx, gy - 2, 54 * lg, 48 * lg, '#ffc96b', 0.9);
    s += `<g transform="translate(${f1(lhx)},${f1(lhy)}) rotate(${f1(lAng)})">`;
    s += `<path d="M0 3 L0 8" stroke="#4a3a24" stroke-width="1.4"/><circle cx="0" cy="3" r="2.6" fill="none" stroke="${mix(PAL.brass, '#2a0f30', 0.55)}" stroke-width="1.3"/>`;
    s += shp(`M-4.4 8 L4.4 8 L6.4 11.5 L-6.4 11.5Z`, PAL.brass, { w: 0.6, so: 1.5 });
    s += `<path d="M-5.2 11.5 L5.2 11.5 L6.3 24.5 L-6.3 24.5Z" fill="url(#${lgU('wlg', 0, 11, 0, 25, [[0, '#fff6c8'], [0.55, '#ffd05a'], [1, '#ff9d3a']])})"/>`;
    s += `<path d="M0 14 Q3.4 19.5 0 23.5 Q-3.4 19.5 0 14Z" fill="#fff"/>`;
    s += `<path d="M-5.2 11.5 L-6.3 24.5 M5.2 11.5 L6.3 24.5 M0 11.5 L0 24.5" stroke="${mix(PAL.brass, '#2a0f30', 0.45)}" stroke-width="1.15" opacity=".9"/>`;
    s += shp(`M-7 24.5 L7 24.5 L6 27.5 L-6 27.5Z`, PAL.brass, { w: 0.6, so: 1.5 });
    s += '</g>';
    return s;
    return s;
}
// ---------- the figure ----------
export function wren(o = {}) {
  use(STYLES.S1);
  const V = { front: 0, '3q': 0.78, side: 1.38, back: Math.PI };
  const th = o.th ?? V[o.view || 'front'], dir = o.dir ?? 1, sil = !!o.sil;
  const sT = Math.sin(th), cT = Math.cos(th), aC = Math.abs(cT), aS = Math.abs(sT);
  const wf = 0.64 + 0.36 * aC, a = 19 * wf, b = 23 * wf, hr = 30, hc = -60 + (o.bob || 0), neckY = -38;
  const expr = o.expr || 'neutral';
  const pose = o.pose || {};
  const bg = (s) => s; // placeholder for readability
  let out = '', back = '';

  // scarf trail (behind everything)
  const sc = o.scarf || {};
  const defAng = th > 2.5 ? 0.1 : th > 0.4 ? Math.PI + 0.12 : -0.14;
  const sct = { sx: sc.sx ?? (th > 2.5 ? 6 : th > 1 ? -9 : th > 0.4 ? -5 : 10), sy: sc.sy ?? -38, ang: sc.ang ?? defAng, len: sc.len ?? 96, amp: sc.amp ?? 7, phase: sc.phase ?? 0, sag: sc.sag ?? 6, glow: sc.glow ?? 0, w0: sc.w0, w1: sc.w1 };
  if (!o.noTrail) back += scarfTrail(sct, sil);

  // legs + boots
  const p = o.leg || 0, stride = o.stride ?? 8, lift = o.lift ?? 4;
  const legOrder = [-1, 1].sort((x, y) => x * p - y * p);
  let legs = '';
  for (const k of legOrder) {
    const ph = k * p, x0 = k * 5.6 * (0.45 + 0.55 * aC), dx = ph * stride * aS, ly = Math.max(0, ph) * lift;
    const fx = x0 + dx + 2.4 * aS, fy = -6 - ly;
    legs += shp(cap(x0, -17, x0 + dx * 0.55, fy + 1, 3.6, 3.3), PAL.sock, { w: 0.8, so: 2 });
    legs += shp(ell(fx, fy, 6.4 + 2.8 * aS, 5), PAL.boot, { w: 0.85, so: 3 });
    legs += shp(ell(x0 + dx * 0.55 + 1.4 * aS, fy - 3.6, 4.7, 2.1), PAL.fur, { w: 0.5, so: 1 });
  }

  // arms
  const up = o.armsUp || 0, hwy = -26 - up * 36, free = (kk) => {
    const hx = kk * (a + 3.5 + up * 6) * aC + (th > 1.2 && th < 2 ? -3 : 0), hy = -21 - up * 40 + (o.leg ? -p * kk * 2 * aS : 0);
    const sx0 = kk * (a - 2) * aC;
    return shp(cap(sx0, -36, hx, hy - 2, 5.6, 5.0), PAL.coat, { w: 0.85, so: 3 }) + shp(ell(hx, hy - 1, 5.6, 2.6), '#8fbab4', { w: 0.5, so: 1 }) + shp(circ(hx, hy + 3, 4.1), PAL.skin, { w: 0.6, so: 2 });
  };
  const farSide = th > 1.2 && th < 2.2;
  const lan = o.lantern !== false;
  const lhx = -(a + 14 + up * 5) * cT + 15 * sT * (1 - up * 0.6), lhy = hwy - (o.leg ? Math.abs(p) * 0 : 0);

  // body (coat)
  const body = shp(`M${f1(-a)} -42 Q0 -47 ${f1(a)} -42 Q${f1(a + 3)} -28 ${f1(b)} -13 Q0 -8 ${f1(-b)} -13 Q${f1(-a - 3)} -28 ${f1(-a)} -42Z`, PAL.coat, {
    w: 0.95, so: 6,
    x: `<ellipse cx="0" cy="-40" rx="${f1(a + 4)}" ry="9" fill="#2a4a52" opacity=".38"/><path d="M${f1(-b + 1)} -17 Q0 -12 ${f1(b - 1)} -17" fill="none" stroke="${PAL.hoodDk}" stroke-width="1.4" stroke-dasharray="3 2.4" opacity=".7"/>` +
      (aC > 0.3 && cT > 0 ? `<path d="M${f1(sT * 6)} -34 L${f1(sT * 6)} -14" stroke="${PAL.hoodDk}" stroke-width="1.2" opacity=".6"/><circle cx="${f1(sT * 6 + 3 * wf)}" cy="-29" r="1.7" fill="${PAL.brass}"/><circle cx="${f1(sT * 6 + 3 * wf)}" cy="-22" r="1.7" fill="${PAL.brass}"/>` : '') +
      (cT < 0.3 ? `<path d="M0 -36 L0 -14" stroke="${PAL.hoodDk}" stroke-width="1.2" opacity=".5"/>` : ''),
  });
  const belt = shp(`M${f1(-b * 0.92)} -24 Q0 -20 ${f1(b * 0.92)} -24 L${f1(b * 0.9)} -20.5 Q0 -16.5 ${f1(-b * 0.9)} -20.5Z`, '#7a4a2e', { w: 0.5, so: 1.5 });
  const patch = cT > -0.2 ? shp(`M${f1(sT * 6 + 5 * wf)} -18 l${f1(9 * wf)} 0 l0 7 l${f1(-9 * wf)} 0Z`, PAL.patch, { w: 0.55, so: 1.5, x: `<path d="M${f1(sT * 6 + 5.8 * wf)} -17.2 h${f1(7.6 * wf)} v5.6 h${f1(-7.6 * wf)}Z" fill="none" stroke="${PAL.scarfDk}" stroke-width=".9" stroke-dasharray="1.8 1.6"/>` }) : shp(`M-8 -31 l16 0 l0 12 l-16 0Z`, PAL.patch, { w: 0.55, so: 1.5, x: `<path d="M-7 -30 h14 v10 h-14Z" fill="none" stroke="${PAL.scarfDk}" stroke-width=".9" stroke-dasharray="2 1.7"/><path d="M-3 -27 l6 6 M3 -27 l-6 6" stroke="${PAL.scarf}" stroke-width="1.3"/>` });

  // lantern
  const lg = o.lanternGlow ?? 1, lAng = o.lanternAngle || 0;
  const lantern = lan ? lanternSvg(lhx, lhy, lAng, lg, sil) : '';
  const lHand = lan ? (shp(cap(-(a - 2) * cT + 12 * sT * 0, -36, lhx, lhy - 2, 5.8, 5.0), PAL.coat, { w: 0.85, so: 3 }) + shp(ell(lhx, lhy - 1.5, 5.8, 2.6), '#8fbab4', { w: 0.5, so: 1 }) + shp(circ(lhx, lhy + 2, 4.2), PAL.skin, { w: 0.6, so: 2 })) : free(-1);

  // whistle cord
  const whistle = cT > 0.15 ? `<path d="M${f1(-6 * cT + sT * 4)} -36 Q${f1(sT * 4)} -22 ${f1(6 * cT + sT * 4)} -36" fill="none" stroke="${PAL.patch}" stroke-width="1.2"/>` + shp(cap(sT * 4 - 3.2 * cT, -25.6, sT * 4 + 3.2 * cT, -25.6, 1.7, 1.7), PAL.bone, { w: 0.5, so: 1 }) : '';

  // assemble body layers
  out += back + (farSide ? free(1) : '') + legs + body + belt + patch + whistle;
  out += lHand;
  if (!farSide) out += free(1);
  out += lantern;

  // head group
  const tilt = o.tilt || 0, tx = o.headX || 0;
  let h = '';
  const earTilt = (e) => e * 14 + (o.earFlick || 0) * e;
  const ears = [-1, 1].map((e) => {
    const ang = e * 1.12 + th, z = Math.cos(ang), x = 0.7 * hr * Math.sin(ang), y = hc - 0.8 * hr + 0.02 * hr;
    return { e, z, x, y, wF: 0.55 + 0.45 * Math.abs(z) };
  }).sort((p1, p2) => p1.z - p2.z);
  const drawEar = (q) => ear(q.x, q.y, q.wF, earTilt(q.e) - (q.x < 0 ? 0 : 0) + (q.x < 0 ? -2 : 2), hr, q.z > 0, q.e === 1, q.e === -1);
  h += drawEar(ears[0]) + drawEar(ears[1]);
  h += shp(circ(0, hc, hr), PAL.hood, { w: 1, so: 7 });
  const fs = 0.4 + 0.6 * Math.max(0, cT), fcx = 0.55 * hr * sT, fy = hc + hr * 0.14;
  if (cT < 0.3) {
    // back / far side: crown stitch, seam and hair tuft
    h += `<path d="M${f1(sT * -4)} ${f1(hc - hr)} Q${f1(sT * -8)} ${f1(hc - hr * 0.2)} ${f1(sT * -2)} ${f1(hc + hr * 0.7)}" fill="none" stroke="${PAL.hoodDk}" stroke-width="1.6" stroke-dasharray="3.4 2.6" opacity=".75"/>`;
    h += `<path d="M${f1(-hr * 0.55)} ${f1(hc - hr * 0.55)} q${f1(hr * 0.5)} ${f1(-hr * 0.16)} ${f1(hr * 1.1)} 0" fill="none" stroke="${PAL.hoodDk}" stroke-width="1.2" opacity=".5"/>`;
  }
  if (cT < -0.3) { const py = hc + 4; h += `<g transform="translate(0,${f1(py)})" fill="${PAL.scarf}" stroke="${PAL.scarfDk}" stroke-width="1.1" stroke-dasharray="2.4 1.5"><ellipse cx="0" cy="4" rx="7" ry="5.6"/><ellipse cx="-9" cy="-3" rx="2.8" ry="3.4"/><ellipse cx="-3.2" cy="-8" rx="2.8" ry="3.6"/><ellipse cx="3.2" cy="-8" rx="2.8" ry="3.6"/><ellipse cx="9" cy="-3" rx="2.8" ry="3.4"/></g>`; }
  if (cT > -0.05) {
    const frx = hr * 0.68 * fs, fry = hr * 0.62, cx0 = fcx;
    h += `<ellipse cx="${f1(cx0)}" cy="${f1(fy)}" rx="${f1(frx + 4.6)}" ry="${f1(fry + 4.4)}" fill="${PAL.hoodDk}" opacity=".55"/>`;
    h += shp(ell(cx0, fy, frx + 2.7, fry + 2.6), PAL.fur, { w: 0.6, so: 2.5 });
    h += shp(ell(cx0, fy, frx, fry), PAL.skin, { w: 0.5, so: 3 });
    // hair fringe (scalloped)
    const fl = fs;
    h += shp(`M${f1(cx0 - frx - 0.5)} ${f1(fy - fry * 0.12)} Q${f1(cx0 - frx * 0.7)} ${f1(fy - fry * 1.1)} ${f1(cx0 - frx * 0.1)} ${f1(fy - fry * 0.98)} Q${f1(cx0 + frx * 0.6)} ${f1(fy - fry * 1.2)} ${f1(cx0 + frx + 0.5)} ${f1(fy - fry * 0.1)} Q${f1(cx0 + frx * 0.72)} ${f1(fy - fry * 0.34)} ${f1(cx0 + frx * 0.42)} ${f1(fy - fry * 0.5)} Q${f1(cx0 + frx * 0.2)} ${f1(fy - fry * 0.24)} ${f1(cx0 - frx * 0.04)} ${f1(fy - fry * 0.5)} Q${f1(cx0 - frx * 0.3)} ${f1(fy - fry * 0.22)} ${f1(cx0 - frx * 0.5)} ${f1(fy - fry * 0.46)} Q${f1(cx0 - frx * 0.8)} ${f1(fy - fry * 0.28)} ${f1(cx0 - frx - 0.5)} ${f1(fy - fry * 0.12)}Z`, PAL.hair, { w: 0.5, so: 2 });
    // eyes by sphere projection
    const Rf = 0.74 * hr, ey = fy + hr * 0.12 + (o.eyeDy || 0);
    const kinds = { neutral: 'open', determined: 'narrow', worried: 'wide', smile: 'happy', hurt: 'squint', blink: 'closed', howl: 'closed' };
    const ek = o.eye || kinds[expr] || 'open';
    let eyes = '', brows = '';
    for (const k of [-1, 1]) {
      const ang = k * 0.4 + th, cz = Math.cos(ang);
      if (cz < 0.14) continue;
      const ex = Rf * Math.sin(ang), sx = clamp(cz / 0.92, 0.5, 1);
      eyes += eye(ex, ey, 4.4, 5.4, ek, -k, sx);
      const bdy = { neutral: 0, determined: 2.8, worried: -3.2, smile: -0.6, hurt: -2.6, blink: 0, howl: -1.2 }[expr] ?? 0, by0 = ey - 9.6;
      brows += `<path d="M${f1(ex + k * 5.4 * sx)} ${f1(by0 + (expr === 'determined' ? -0.8 : 0))} L${f1(ex - k * 5.4 * sx)} ${f1(by0 + bdy)}" stroke="${PAL.hair}" stroke-width="1.9" stroke-linecap="round" opacity="${expr === 'neutral' ? 0.5 : 0.95}"/>`;
    }
    h += `<g>${eyes}</g>${brows}`;
    // blush, nose, mouth in turned face frame
    const mx = fcx + (Rf * 0.0), g2 = (s) => `<g transform="translate(${f1(cx0)},0) scale(${fs.toFixed(2)},1) translate(${f1(-cx0)},0)">${s}</g>`;
    const nx = Rf * Math.sin(th) * 0.95;
    let feat = '';
    for (const k of [-1, 1]) { const ang = k * 0.5 + th; if (Math.cos(ang) > 0.25) feat += `<ellipse cx="${f1(Rf * Math.sin(ang) * 1.04)}" cy="${f1(ey + 6.6)}" rx="${f1(3.7 * clamp(Math.cos(ang) / 0.88, 0.5, 1))}" ry="2.9" fill="#ff8a8a" opacity="${expr === 'hurt' ? 0.7 : 0.5}"/>`; }
    feat += `<ellipse cx="${f1(nx)}" cy="${f1(ey + 5.2)}" rx="${f1(1.2 + 1 * aS)}" ry="1" fill="#c98a6a" opacity=".8"/>`;
    const my = ey + 9.6, mc = nx;
    const mouth = {
      neutral: `<path d="M${f1(mc - 2.4)} ${f1(my)} Q${f1(mc)} ${f1(my + 2)} ${f1(mc + 2.4)} ${f1(my)}" fill="none" stroke="#8a4a3a" stroke-width="1.3" stroke-linecap="round"/>`,
      determined: `<path d="M${f1(mc - 3)} ${f1(my + 0.6)} L${f1(mc + 3)} ${f1(my + 0.6)}" fill="none" stroke="#8a4a3a" stroke-width="1.5" stroke-linecap="round"/>`,
      worried: `<path d="M${f1(mc - 3.4)} ${f1(my + 1.6)} Q${f1(mc - 1.7)} ${f1(my - 0.8)} ${f1(mc)} ${f1(my + 1)} Q${f1(mc + 1.7)} ${f1(my + 2.8)} ${f1(mc + 3.4)} ${f1(my + 0.4)}" fill="none" stroke="#8a4a3a" stroke-width="1.3" stroke-linecap="round"/>`,
      smile: `<path d="M${f1(mc - 3.4)} ${f1(my - 0.4)} Q${f1(mc)} ${f1(my + 4.4)} ${f1(mc + 3.4)} ${f1(my - 0.4)}" fill="none" stroke="#8a4a3a" stroke-width="1.4" stroke-linecap="round"/>`,
      hurt: `<ellipse cx="${f1(mc)}" cy="${f1(my + 1.2)}" rx="2.6" ry="3.1" fill="#7a2f30"/><ellipse cx="${f1(mc)}" cy="${f1(my + 2.6)}" rx="1.5" ry="1.1" fill="#e07a7a"/>`,
      howl: `<ellipse cx="${f1(mc)}" cy="${f1(my + 1.6)}" rx="3.4" ry="4.4" fill="#7a2f30"/><ellipse cx="${f1(mc)}" cy="${f1(my + 3.4)}" rx="2" ry="1.7" fill="#e07a7a"/>`,
      blink: `<path d="M${f1(mc - 2.4)} ${f1(my)} Q${f1(mc)} ${f1(my + 2)} ${f1(mc + 2.4)} ${f1(my)}" fill="none" stroke="#8a4a3a" stroke-width="1.3" stroke-linecap="round"/>`,
    }[expr] || '';
    h += g2(feat) + g2(mouth);
    if (expr === 'hurt') h += `<path d="M${f1(Rf * Math.sin(0.4 + th) + 1)} ${f1(ey + 4)} q-1.6 3.4 0 5.2 q1.6 -1.8 0 -5.2Z" fill="#bfe6ff" opacity=".9"/>`;
    if (expr === 'worried') h += `<path d="M${f1(fcx + frx * 0.95 + 2)} ${f1(fy - fry * 0.62)} q-2 3.6 0 5.6 q2 -2 0 -5.6Z" fill="#bfe6ff" opacity=".85"/>`;
    // hood centre seam on crown
    h += `<path d="M${f1(fcx * 0.9)} ${f1(hc - hr + 1)} L${f1(fcx * 0.95)} ${f1(fy - fry - 5)}" stroke="${PAL.hoodDk}" stroke-width="1.3" stroke-dasharray="3 2.4" opacity=".6"/>`;
  }
  // far-side: if ears[1] is behind, order handled by sort; ear drawn after hood only if it faces viewer
  // (the first, far ear is drawn before the hood, the near ear after it)

  // collar + front tail
  const cw = a + 4;
  let collar = shp(`M${f1(-cw)} ${f1(neckY + 2)} Q0 ${f1(neckY - 4)} ${f1(cw)} ${f1(neckY + 2)} L${f1(cw - 1)} ${f1(neckY + 10)} Q0 ${f1(neckY + 17)} ${f1(-cw + 1)} ${f1(neckY + 10)}Z`, PAL.scarf, {
    w: 0.85, so: 3, x: `<path d="M${f1(-cw * 0.6)} ${f1(neckY + 2)} v10M${f1(-cw * 0.2)} ${f1(neckY + 1)} v12M${f1(cw * 0.2)} ${f1(neckY + 1)} v12M${f1(cw * 0.6)} ${f1(neckY + 2)} v10" stroke="${PAL.scarfDk}" stroke-width="1.5" opacity=".5"/>`,
  });
  if (cT > 0.25) {
    const kx = -cw * 0.35 * cT + sT * 5;
    collar += shp(`M${f1(kx - 4)} ${f1(neckY + 8)} L${f1(kx + 6)} ${f1(neckY + 8)} L${f1(kx + 7)} ${f1(neckY + 25)} L${f1(kx + 3)} ${f1(neckY + 22)} L${f1(kx + 0.5)} ${f1(neckY + 26)} L${f1(kx - 3.5)} ${f1(neckY + 22)}Z`, '#e8932a', { w: 0.75, so: 2, x: `<path d="M${f1(kx - 4)} ${f1(neckY + 17)} h12" stroke="${PAL.scarfDk}" stroke-width="1.8" opacity=".6"/>` });
    collar += shp(ell(kx + 1, neckY + 7.5, 5.2, 4.4), PAL.scarf, { w: 0.7, so: 2 });
  }
  const headG = `<g transform="translate(${f1(tx)},0) rotate(${f1(tilt)},0,${neckY + 4})">${h}</g>`;
  out += collar + headG;

  // final wrap
  let g = out;
  const fxs = [];
  if (sil) fxs.push('wsil');
  else if (o.hurt === 'red') fxs.push('whurtR');
  else if (o.hurt) fxs.push('whurt');
  else if (o.light) fxs.push('wlt' + Math.round(clamp(o.light, 0.25, 1) * 4) * 25);
  const filt = fxs.length ? ` filter="url(#${fxs[0]})"` : '';
  const tr = `rotate(${f1(o.lean || 0)}) scale(${(o.sx ?? 1).toFixed(3)},${(o.sy ?? 1).toFixed(3)})`;
  const al = o.alpha != null ? ` opacity="${o.alpha}"` : '';
  const inner = `<g transform="${tr}"${filt}${al}>${g}</g>`;
  return dir < 0 ? `<g transform="scale(-1,1)">${inner}</g>` : inner;
}

