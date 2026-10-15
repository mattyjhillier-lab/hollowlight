// DIRECTION B: HEARTH EDGE. No corner chrome: a thin spirit thread along the very top edge (XP), small moon + digits top-centre,
// HP as a flame ring at the hero's feet, weapon icons that fade after ~8s, nothing else. The world gets the screen.
import { K, plate, lantern, thread, knot, digits, coinChip, pauseBtn, tile, ability, bossBar, num, txt, emblem, frost } from './kit.mjs';
export { DIM } from './dirA.mjs';
import { DIM } from './dirA.mjs';

export const META = {
  id: 'B', name: 'HEARTH EDGE', concept: 'Almost no chrome. XP is one thread along the top edge, HP is a flame ring that follows the hero, weapons fade away when nothing changes.',
  tag: 'Almost no chrome: one thread on the top edge, a flame ring at the hero\'s feet, weapon icons that fade after ~8s.',
  legend: 'CODE S Style v1 | E edge thread = XP | R flame ring = HP (on the hero) | M small moon + digits | W weapons fade 8s | F Georgia + Segoe UI Black',
  sw: [['#fff3dc', 'cream line'], ['#ffab3a', 'flame ring'], ['#ffe0a0', 'thread XP'], ['#2b231d', 'soft scrim'], ['#ffd36b', 'evolve gold (reserved)']],
};
export const SAFE = { desk: { l: 20, t: 14, r: 20, b: 20 }, land: { l: 47, t: 8, r: 47, b: 21 }, port: { l: 12, t: 47, r: 12, b: 34 } };

// bare cream-outlined tile (no plate) for the fading strip
function bare(x, y, s, w, op, pulse) {
  if (!w) return `<circle cx="${x + s / 2}" cy="${y + s / 2}" r="${s * 0.4}" fill="none" stroke="${K.creamD}" stroke-opacity=".3" stroke-width="1.6" stroke-dasharray="3 4"/>`;
  const [kind, rank, o = {}] = w, pr = Math.max(2, s * 0.045), gap = pr * 3.1, px0 = x + s / 2 - gap * 2;
  let g = `<g opacity="${op}"><circle cx="${x + s / 2}" cy="${y + s * 0.46}" r="${s * 0.47}" fill="#140f0c" fill-opacity=".6" stroke="${o.evo ? K.gold : K.cream}" stroke-opacity=".8" stroke-width="${o.evo ? 2.6 : 1.8}"/>${emblem(kind, s * 0.62, { x: x + s / 2, y: y + s * 0.46 })}`;
  for (let i = 0; i < 5; i++) g += `<circle cx="${px0 + i * gap}" cy="${y + s + pr * 0.8}" r="${pr}" fill="${i < rank ? K.cream : '#0c0908'}" stroke="${K.creamD}" stroke-width="1"/>`;
  if (pulse) g += `<circle cx="${x + s / 2}" cy="${y + s * 0.46}" r="${s * 0.58}" fill="none" stroke="${K.cream}" stroke-opacity=".75" stroke-width="2"/>`;
  return g + '</g>';
}
// flame ring at the hero's feet: the ring + a small flame that shrinks with HP
function ring(hx, hy, u, hp, hpTxt) {
  const rx = 34 * u, ry = 12.5 * u, low = hp < 0.35;
  return `<ellipse cx="${hx}" cy="${hy + 3 * u}" rx="${rx}" ry="${ry}" fill="none" stroke="#0c0908" stroke-opacity=".7" stroke-width="${6.5 * u}"/><ellipse cx="${hx}" cy="${hy + 3 * u}" rx="${rx}" ry="${ry}" fill="none" stroke="${K.brassD}" stroke-opacity=".6" stroke-width="${1.6 * u}"/>
<ellipse cx="${hx}" cy="${hy + 3 * u}" rx="${rx}" ry="${ry}" fill="none" stroke="url(#${low ? 'hEmber' : 'hFlame'})" stroke-width="${4.4 * u}" pathLength="100" stroke-dasharray="${hp * 100} ${100 - hp * 100}" stroke-linecap="round" filter="url(#hGlowFx)"/>
<g transform="translate(${hx},${hy + 3 * u + ry + 12 * u})">${lantern(0, 0, 0.46 * u, hp, { glow: 0.5 })}${num(hpTxt, 17 * u, 6, 16, { sw: 3.6 })}</g>`;
}

export function hud(mode, st, hero) {
  const [W, H] = DIM[mode], S = SAFE[mode], Z = []; const zone = (n, x, y, w, h, tap = false) => Z.push({ n, x, y, w, h, tap });
  const hp = st.hp, hpTxt = String(Math.round(hp * st.hpMax)), u = mode === 'desk' ? 1 : 0.68;
  let s = st.noFade ? '' : `<rect width="${W}" height="${mode === 'desk' ? 70 : 56}" fill="url(#hTopFade)" opacity=".8"/>`;
  const wr = (x, y, sz, gap, vert) => st.weapons.map((w, i) => bare(vert ? x : x + i * (sz + gap), vert ? y + i * (sz + gap) : y, sz, w, i === st.pulseSlot ? 1 : st.wfade, i === st.pulseSlot)).join('') + Array.from({ length: Math.max(0, 4 - st.weapons.length) }, (_, k) => bare(x + (st.weapons.length + k) * (sz + gap), y, sz, null)).join('');
  const topY = mode === 'port' ? S.t : 0;
  // edge thread
  const tx = mode === 'desk' ? 0 : S.l - 4 > 0 && mode === 'land' ? S.l : 0, tw = W - tx * (mode === 'land' ? 2 : 1);
  s += thread(tx, topY, tw, st.xp, mode === 'desk' ? 7 : 6, { railOp: 0.6 });
  const ky = topY + (mode === 'desk' ? 30 : 26);
  s += knot(tx + (mode === 'desk' ? 28 : 22), ky, mode === 'desk' ? 15 : 14, st.lv, { flare: st.flare }); zone('thread', tx, topY - 2, tw, 12);
  zone('level', tx + 8, ky - 15, 40, 30);
  const tcx = W / 2, ty = topY + (mode === 'desk' ? 40 : 34), sz = mode === 'desk' ? 24 : 22;
  s += `<ellipse cx="${tcx}" cy="${ty - 8}" rx="96" ry="30" fill="#0d0a08" opacity=".35" filter="url(#hSoft6)"/><circle cx="${tcx - (mode === 'desk' ? 62 : 56)}" cy="${ty - sz * 0.34}" r="${sz * 0.42}" fill="#fff3d2" stroke="#2a2320" stroke-width="2.2"/><circle cx="${tcx - (mode === 'desk' ? 62 : 56) - 3}" cy="${ty - sz * 0.34 + 2}" r="${sz * 0.12}" fill="#e6d4a6"/>`;
  s += digits(st.time, tcx, ty, sz);
  const tl = tcx - 38, tr = tcx + 38, ly = ty + 9;
  s += `<path d="M${tl} ${ly} H${tr}" stroke="#0c0908" stroke-opacity=".7" stroke-width="5" stroke-linecap="round"/><path d="M${tl} ${ly} H${tr}" stroke="${K.brassD}" stroke-width="2" stroke-dasharray="1 4" stroke-linecap="round"/><path d="M${tl} ${ly} H${tl + 76 * st.tfrac}" stroke="#ffd7a0" stroke-width="2.6" stroke-linecap="round"/><circle cx="${tr + 6}" cy="${ly}" r="4.6" fill="${K.gold}"/>`;
  zone('timer', tcx - 70, topY + 10, 140, 46);
  const pz = 48, px = W - S.r - pz, py = (mode === 'port' ? S.t + 8 : mode === 'desk' ? 18 : 12);
  s += pauseBtn(px, py, pz, { noPlate: true }) + `<circle cx="${px + pz / 2}" cy="${py + pz / 2}" r="${pz / 2 - 3}" fill="#140f0c" fill-opacity=".5" stroke="${K.cream}" stroke-opacity=".7" stroke-width="2"/>` + pauseBtn(px, py, pz, { noPlate: true }); zone('pause', px, py, pz, pz, true);
  const cw = mode === 'desk' ? 124 : 108, ch = mode === 'desk' ? 36 : 32;
  const cxp = mode === 'port' ? W - S.r - cw : px - 12 - cw, cyp = mode === 'port' ? S.t + 54 : py + pz / 2 - ch / 2;
  s += `<ellipse cx="${cxp + cw / 2}" cy="${cyp + ch / 2}" rx="${cw / 2 + 12}" ry="${ch / 2 + 6}" fill="#0d0a08" opacity=".4" filter="url(#hSoft6)"/>` + coinChip(cxp, cyp, cw, ch, st.gold, { size: mode === 'desk' ? 21 : 18, noPlate: true }); zone('coin', cxp, cyp, cw, ch);
  // weapons
  if (mode === 'desk') { const sz2 = 44, y = H - S.b - sz2 - 8; s += wr(S.l, y, sz2, 14); zone('weapons', S.l, y, 4 * sz2 + 42, sz2 + 8); }
  else if (mode === 'land') { const sz2 = 30; s += wr(S.l + 8, 52, sz2, 10); zone('weapons', S.l + 8, 52, 4 * sz2 + 30, sz2 + 6); }
  else { const sz2 = 32; s += wr(S.l, S.t + 54, sz2, 10); zone('weapons', S.l, S.t + 54, 4 * sz2 + 30, sz2 + 6); }
  // ability
  const ar = mode === 'desk' ? 42 : 44, acx = W - S.r - ar - (mode === 'desk' ? 2 : 6), acy = H - S.b - ar - (mode === 'desk' ? 28 : mode === 'land' ? 8 : 14);
  s += ability(acx, acy, ar, st.ab, mode === 'desk' ? { key: true } : {}); zone('ability', acx - ar, acy - ar, 2 * ar, 2 * ar + (mode === 'desk' ? 24 : 0), true);
  // HP ring on the hero
  if (hero) { s += ring(hero[0], hero[1], mode === 'desk' ? 1 : 0.7, hp, hpTxt); zone('hp-ring', hero[0] - 34 * u, hero[1] - 8 * u, 68 * u, 50 * u); }
  if (st.boss) s += bossBar(W / 2, topY + (mode === 'desk' ? 92 : 78), mode === 'desk' ? 420 : mode === 'land' ? 280 : 300, st.boss.frac, { h: mode === 'desk' ? 14 : 12, ns: mode === 'desk' ? 19 : 16 });
  if (st.frost) s += frost(W, H, st.frost);
  return { svg: s, zones: Z };
}
