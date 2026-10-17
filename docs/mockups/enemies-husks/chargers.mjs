// HUSKS options: (6) CHARGER, Bramble Hart role (tall; stands still, then 0.8 s tell: head down + hoof scrape + long red-orange lane,
// direction locked; charges ~180 u straight; 0.6 s stagger after. 2 eyes HIGH that swing LOW on the tell). Mock-up drawing code only.
import { K, P, S, locks, sock, husk, knotSocket, strap, sprout, moss, lichen, thorn, finish, tLane, furry, blob, line, ell, circ, limb, eye, shadow, mix, rng, specks, f, TAU, VOID } from './kit.mjs';

// shared hooved rig: body bean on slim legs, neck to a big chibi head; C.crown draws antlers/horns (in head space, rotates with the head).
function hoofRig(st, C) {
  const a = (st.ph || 0) * TAU, tl = st.tele || 0, s1 = Math.sin(a), bob = -Math.abs(s1) * 2;
  const FU = C.fur, DK = C.dk, LH = C.legH || 34;
  let b = shadow(42, 0) + `<ellipse cx="0" cy="0" rx="32" ry="5" fill="${K.ink}" opacity=".3"/>`;
  if (tl > 0) b = tLane(34, 150 * tl + 40, tl, 18) + `<path d="M14 2 q4 -5 9 -2 M18 -1 q3 -4 7 -2" stroke="#8a8f99" stroke-width="2" fill="none" opacity="${f(tl)}"/>` + b;
  const by = -LH - 8 + bob + tl * 3;
  const leg = (x, ph, far, back) => { const sw = Math.sin(ph) * 6 * (1 - tl), lift = Math.max(0, -Math.cos(ph)) * 5 * (1 - tl), px = x + sw + (back ? -tl * 3 : tl * 5), py = -lift;
    const pts = back ? [[x, by + 4], [x - 4, by + LH * 0.45], [px + 1, -LH * 0.3 - lift], [px, py - 4]] : [[x, by + 4], [x + 1, by + LH * 0.5], [px, py - 4]];
    return S(line(pts), far ? DK : FU, C.legW || 6.4, { lw: 2.4 }) + sock(px, py, 3.8, C.sockH ?? 12); };
  b += leg(16, a + Math.PI, true) + leg(-18, a, true, true) + leg(-22, a + Math.PI, false, true) + leg(12, a, false);
  b += C.body(by, tl, a);
  // neck + head (lowered on the tell)
  const hx = 28 + tl * 12 + (C.hx || 0), hy = by - 20 + tl * 26 + (C.hy || 0), rot = tl * (C.dip ?? 48);
  b += P(limb(12, by - 2, hx - 4, hy + 6, C.neck || 8, 7), C.neckC || FU, { sh: 3 });
  let h = C.crown(hx, hy, tl, a, true) + C.head(hx, hy, tl) + (C.hornsBack ? C.crown(hx, hy, tl, a, false) : '');
  const m = C.mask(hx, hy, tl);
  h += m.svg + (C.hornsBack ? '' : C.crown(hx, hy, tl, a, false));
  b += `<g transform="rotate(${f(rot)} ${f(hx)} ${f(hy)})">${h}</g>`;
  const R = (p) => { const t = rot * Math.PI / 180, dx = p[0] - hx, dy = p[1] - hy; return [hx + dx * Math.cos(t) - dy * Math.sin(t), hy + dx * Math.sin(t) + dy * Math.cos(t)]; };
  const E1 = R(m.E1), E2 = R(m.E2), sh = tl > 0.3 ? 'slit' : 'almond';
  const e = st.hurt ? eye(...E1, 2.3, { shape: 'squint' }) + eye(...E2, 1.7, { shape: 'squint' }) : eye(...E1, 2.5 + tl * 0.8, { shape: sh, rot: -12 + rot }) + eye(...E2, 1.8 + tl * 0.5, { shape: sh, rot: -12 + rot });
  return finish(st, b, e, { w: 70, h: C.h || 110, seed: C.seed || 41, mask: st.die ? `<g transform="translate(${f(-hx)},${f(-hy)})">${m.svg}</g>` : '', mx: hx, my: hy });
}
const deerBody = (FU, DK, o = {}) => (by, tl) => P(furry([[24, by + 6], [22, by - 8], [4, by - 12], [-16, by - 11], [-28, by - 4], [-26, by + 8], [0, by + 10]], 2.8, -1, o.seed || 19, [0, 0, 0, 0, 0, 1, 1], 0.6), FU, { sh: 6, rim: 3, rimA: 1,
  tex: locks([[-18, by - 4, 10, 2.9], [-6, by - 6, 10, 3.0], [6, by - 6, 9, 3.0]], mix(FU, '#0e0a1c', 0.5), 0.5) + `<ellipse cx="0" cy="${f(by + 9)}" rx="22" ry="4" fill="${K.ink}" opacity=".35" filter="url(#sb2)"/>` + (o.tex ? o.tex(by) : '') })
  + P(blob([[-26, by - 6], [-34, by - 10], [-33, by - 2], [-27, by]]), '#d9dccf', { lw: 2, sh: 1 });

// A (recommended) BRAMBLE HART: a stag drained mid-leap; its antlers kept growing, into BRAMBLE: a lyre of thorny tines twice the size of its
// head (the hook), a long deer-skull husk, a rag of moss on one tine. Proud and still, then explosive: lowers the crown, scrapes, charges.
export function hartA(st = {}) {
  const FU = '#56607a', DK = '#3a4157', AN = '#7c7883', AND = '#5a5662';
  return hoofRig(st, { fur: FU, dk: DK, seed: 41, h: 120, body: deerBody(FU, DK),
    head: (hx, hy) => P(blob([[hx - 8, hy - 4], [hx - 22, hy - 10], [hx - 12, hy + 0]]), DK, { lw: 2, sh: 1 }) + P(ell(hx - 4, hy - 1, 11, 10), FU, { sh: 4 }),
    crown: (hx, hy, tl, a, far) => { const c = far ? AND : AN, bx = hx - 3 + (far ? -5 : 0), by2 = hy - 8, dir = far ? -1 : 1;
      const main = [[bx, by2], [bx + dir * 6, by2 - 12], [bx + dir * 16, by2 - 22], [bx + dir * 22, by2 - 36], [bx + dir * 20, by2 - 50]];
      let s = S(line(main), c, 6.4, { lw: 2.4 });
      for (const [i, len, ang] of [[1.3, 14, -1.9], [2.2, 17, -1.6], [3.1, 13, -1.35]]) { const p = main[Math.floor(i)], q = main[Math.ceil(i)], t = i % 1, x = p[0] + (q[0] - p[0]) * t, y = p[1] + (q[1] - p[1]) * t, an = dir > 0 ? ang : Math.PI - ang;
        s += S(`M${f(x)} ${f(y)} q${f(Math.cos(an) * len * 0.3)} ${f(Math.sin(an) * len * 0.6)} ${f(Math.cos(an) * len)} ${f(Math.sin(an) * len)}`, c, 4, { lw: 2.1 }) + `<circle cx="${f(x + Math.cos(an) * len)}" cy="${f(y + Math.sin(an) * len)}" r="2.1" fill="#dcdccd"/>`; }
      s += `<circle cx="${f(main[4][0])}" cy="${f(main[4][1])}" r="2.7" fill="#dcdccd"/>`;
      for (let i = 0; i < 6; i++) { const p = main[1 + (i % 3)], sg = i % 2 ? 1 : -1; s += thorn(p[0], p[1] + 2 - i, sg > 0 ? -0.3 : 3.4, 6, 2, '#2f283a'); }
      if (!far) s += moss(bx + 10, by2 - 32, 9, 13, 6);
      return s; },
    mask: (hx, hy, tl) => { const M = (x, y) => [hx + x, hy + y];
      let s = strap([M(-6, -7), M(-12, -2), M(-10, 6)], 2.6, { seed: 4 });
      s += husk(blob([M(-8, -9), M(4, -11), M(16, -6), M(26, 1), M(27, 5), M(20, 7), M(6, 8), M(-6, 5)]), M, { grain: [[[0, -6], [12, -3], [24, 2]], [[-2, 3], [10, 5], [22, 5]]], crack: [[2, -10], [4, -6], [3, -3]], lichen: [[12, -3, 2.6]], chip: [[-7, 2, 3, 3.2]], under: [[-6, 4], [10, 8], [25, 5]], hi: [[-4, -9], [8, -8], [20, -2]] })
        + knotSocket(blob([M(-2, -5), M(4, -8), M(9, -5), M(6, -1), M(0, -1)])) + knotSocket(ell(...M(13, -3), 2.3, 2), 1.3);
      return { svg: s, E1: M(3.5, -4.5), E2: M(13, -3) };
    } });
}
// B BRIAR RAM: a stocky ram with a cold grey fleece; its horns are thick bark SPIRALS bristling with thorns (the hook: two big curls),
// its husk a blunt flat battering brow-plate. Stamps and snorts (no breath, a puff of ash), lowers its curls, charges like a battering ram.
export function hartB(st = {}) {
  const FU = '#8b93a6', DK = '#5d6578', HO = '#7b7682';
  return hoofRig(st, { fur: FU, dk: '#3c4256', seed: 43, legH: 26, legW: 7.4, sockH: 10, h: 90, hornsBack: 1, hx: -4, hy: 10, dip: 30, neck: 10, neckC: '#7b8397',
    body: (by, tl) => P(tuftBody(by), FU, { sh: 6, rim: 3, rimA: 1, rimC: '#f2f6ff', tex: [[-18, by - 4], [-6, by - 8], [8, by - 6], [-12, by + 4], [2, by + 3], [16, by + 2]].map(([x, y]) => `<path d="M${x - 4} ${y + 2} q4 -6 8 0" stroke="${DK}" stroke-width="1.6" fill="none" opacity=".7"/>`).join('') + `<ellipse cx="0" cy="${f(by + 12)}" rx="22" ry="4" fill="${K.ink}" opacity=".35" filter="url(#sb2)"/>` }),
    head: (hx, hy) => P(ell(hx - 3, hy, 12, 11), '#4a5165', { sh: 4 }) + P(tuftBody2(hx - 4, hy - 10), FU, { lw: 2.2, sh: 2 }),
    crown: (hx, hy, tl, a, far) => { if (far) return P(spiral(hx - 14, hy - 8, 10), mix(HO, '#1a1726', 0.3), { lw: 2.2, sh: 2, rim: 0 });
      let s = P(spiral(hx - 13, hy + 1, 14), '#9a94a0', { lw: 2.6, sh: 3, tex: [0, 1, 2, 3, 4].map((i) => { const t = i * 1.2; return `<path d="M${f(hx - 13 + Math.cos(t) * (14 - i * 2))} ${f(hy + 1 + Math.sin(t) * (14 - i * 2))} l${f(Math.cos(t) * 3)} ${f(Math.sin(t) * 3)}" stroke="#4e4957" stroke-width="1.6"/>`; }).join('') });
      for (const t of [-0.4, 1.4, 2.6, 3.8, 5]) s += thorn(hx - 13 + Math.cos(t) * 15.5, hy + 1 + Math.sin(t) * 15.5, t, 5.5, 2, '#2f283a');
      return s; },
    mask: (hx, hy, tl) => { const M = (x, y) => [hx + x, hy + y];
      let s = husk(blob([M(-2, -11), M(10, -10), M(16, -4), M(17, 6), M(10, 10), M(0, 9), M(-4, 0)]), M, { col: '#c6c1aa', grain: [[[0, -7], [8, -8], [14, -4]], [[1, 2], [3, 7]], [[13, 3], [15, 7]]], lichen: [[13, -7, 2.4], [4, 6, 2.2]], chip: [[17, 2, 3.4, 0]], hi: [[0, -10], [10, -9]] })
        + knotSocket(blob([M(1, -5), M(6, -6), M(8, -2), M(3, -1)]), 1.5) + knotSocket(blob([M(10, -5), M(14, -5), M(15, -1), M(11, -1)]), 1.4);
      return { svg: s, E1: M(4.6, -3.6), E2: M(12.4, -3.4) };
    } });
}
const tuftBody = (by) => { const p = []; const n = 14; for (let i = 0; i < n; i++) { const t = i / n * TAU, r = (i % 2 ? 1.06 : 0.96); p.push([Math.cos(t) * 28 * r - 2, by + Math.sin(t) * 14 * r]); } return blob(p); };
const tuftBody2 = (x, y) => { const p = []; for (let i = 0; i < 8; i++) { const t = i / 8 * TAU, r = i % 2 ? 1.15 : 0.9; p.push([x + Math.cos(t) * 7 * r, y + Math.sin(t) * 4.5 * r]); } return blob(p); };
const spiral = (cx, cy, R) => { const o = [], inn = []; for (let i = 0; i <= 16; i++) { const t = -0.6 + i / 16 * 5.2, r = R * (1 - i / 16 * 0.62), w = 4.2 * (1 - i / 16 * 0.5); o.push([cx + Math.cos(t) * (r + w), cy + Math.sin(t) * (r + w)]); inn.push([cx + Math.cos(t) * (r - w), cy + Math.sin(t) * (r - w)]); } return line(o) + ' L' + inn.reverse().map(([x, y]) => `${f(x)} ${f(y)}`).join(' L') + 'Z'; };

// C MOSS ELK: a tall gaunt elk; its antlers are broad flat PALMS of grey bark like split planks, hung with long beards of moss (the hook: a
// wide flat crown with drapes); a long drooping muzzle husk with a moss bell under the chin. Ponderous, sways; the drapes swing into the charge.
export function hartC(st = {}) {
  const FU = '#4f5872', DK = '#353c52', PA = '#8d8790';
  return hoofRig(st, { fur: FU, dk: DK, seed: 45, legH: 40, legW: 6.6, h: 124, body: deerBody(FU, DK, { seed: 23, tex: (by) => `<path d="M-6 ${f(by - 12)} q10 -8 22 -2" stroke="${DK}" stroke-width="4" fill="none" opacity=".5"/>` }),
    head: (hx, hy) => P(blob([[hx - 8, hy - 4], [hx - 20, hy - 6], [hx - 12, hy + 2]]), DK, { lw: 2, sh: 1 }) + P(ell(hx - 4, hy - 1, 11, 10), FU, { sh: 4 }),
    crown: (hx, hy, tl, a, far) => { const dir = far ? -1 : 1, bx = hx - 4 + (far ? -4 : 0), by2 = hy - 7, Z = 1.35, c = far ? mix(PA, '#1a1726', 0.3) : PA, sw = Math.sin(a) * 2;
      const pts = [[0, 0], [8, -4], [18, -2], [28, -8], [32, -18], [26, -20], [24, -14], [20, -24], [14, -22], [14, -14], [8, -18], [4, -10]].map(([x, y]) => [bx + dir * x * Z, by2 + y * Z]);
      let s = P(blob(pts), c, { lw: 2.4, sh: 3, rim: far ? 0 : 1.6, tex: `<path d="${line([[bx + dir * 6, by2 - 6], [bx + dir * 18, by2 - 8], [bx + dir * 28, by2 - 14]])}" stroke="#5a5560" stroke-width="1.3" fill="none"/>` + lichen(bx + dir * 20, by2 - 12, 2.6) });
      if (!far) s += moss(bx + 30, by2 - 10 + sw * 0.2, 9, 15 + sw, 7) + moss(bx + 40, by2 - 18, 7, 12 - sw, 8);
      else s += moss(bx - 18, by2 - 4, 8, 12, 9, '#53665b');
      return s; },
    mask: (hx, hy, tl) => { const M = (x, y) => [hx + x, hy + y];
      let s = strap([M(-6, -6), M(-12, 0), M(-10, 8)], 2.6, { seed: 7 });
      s += moss(...M(16, 12), 10, 12, 11);
      s += husk(blob([M(-8, -8), M(4, -10), M(14, -6), M(22, 0), M(26, 7), M(22, 12), M(12, 11), M(0, 8), M(-7, 3)]), M, { grain: [[[0, -6], [10, -4], [20, 2]], [[-2, 3], [10, 6], [22, 9]]], lichen: [[18, 8, 2.4]], chip: [[-7, 0, 3, 3.2]], under: [[-4, 6], [12, 10], [24, 10]], hi: [[-4, -8], [8, -7]] })
        + knotSocket(blob([M(-2, -4), M(4, -7), M(8, -3), M(3, 0)])) + knotSocket(ell(...M(12, -2), 2.1, 1.9), 1.3);
      return { svg: s, E1: M(3, -3.4), E2: M(12, -2) };
    } });
}
