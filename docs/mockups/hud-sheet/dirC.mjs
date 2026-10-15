// DIRECTION C: DAWN FRAME. One thin continuous brass-and-slate rim around the screen; the lantern sits in the top-left corner bracket, the moon dips into a notch
// in the top rim, weapons are set into the bottom rim, the ability ring sits in the bottom-right corner. The Hollow's frost creeps in from the corners.
import { K, plate, lantern, thread, knot, moonArc, digits, coinChip, pauseBtn, tile, ability, bossBar, num, txt, frost } from './kit.mjs';
import { DIM } from './dirA.mjs';

export const META = {
  id: 'C', name: 'DAWN FRAME', concept: 'The HUD is a thin rim round the whole screen. Frost creeps in from its corners as HP falls; warm light fills the rim as dawn nears.',
  tag: 'The HUD is one thin rim round the screen: frost creeps in from the corners as HP falls, warm light fills it as dawn nears.',
  legend: 'CODE S Style v1 | F frame = brass + dark slate rim | L lantern in corner bracket | T thread runs in the top rim | M moon notch | F Georgia + Segoe UI Black',
  sw: [['#1c1714', 'rim slate'], ['#b89560', 'rim brass'], ['#ffab3a', 'flame HP'], ['#dff1fa', 'frost'], ['#ffd36b', 'evolve gold (reserved)']],
};
export const SAFE = { desk: { l: 20, t: 16, r: 20, b: 20 }, land: { l: 47, t: 8, r: 47, b: 21 }, port: { l: 12, t: 47, r: 12, b: 34 } };

// frame shapes: array of [x,y,w,h,r]; stroke layer under, fill layer over -> only the game-side edge shows a brass line
function frameShapes(mode, W, H, S, t) {
  const sh = []; const R = 16;
  if (mode === 'desk') {
    sh.push([0, 0, W, t, 0], [0, H - t, W, t, 0], [0, 0, t, H, 0], [W - t, 0, t, H, 0]);
    sh.push([0, 0, 272, 90, R + 6]);                 // lantern bracket
    sh.push([W / 2 - 128, 0, 256, 86, R + 8]);       // moon notch
    sh.push([W - 232, 0, 232, 66, R + 6]);           // coin + pause bracket
    sh.push([0, H - 90, 300, 90, R + 6]);            // weapon bracket
    sh.push([W - 140, H - 160, 140, 160, 22]);       // ability bracket
  } else if (mode === 'land') {
    const x0 = S.l - 6, x1 = W - S.r + 6;
    sh.push([x0, 0, x1 - x0, t, 0], [x1 - t, 0, t, H, 0], [x1 - 200, H - t - 12, 200, t + 12, 0]);
    sh.push([x0, 0, 226, 100, 14], [W / 2 - 88, 0, 176, 64, 14], [x1 - 172, 0, 172, 58, 14], [x1 - 106, H - 120, 106, 120, 18]);
    sh.push([x0, 0, t, 118, 0]);
  } else {
    sh.push([0, S.t - 6, W, t, 0], [0, H - S.b - t + 4, W, S.b + t, 0]);
    sh.push([0, S.t - 6, 148, 78, 14], [W / 2 - 62, S.t - 6, 124, 64, 14], [W - 92, S.t - 6, 92, 76, 14], [W - 120, H - 182, 120, 182, 18]);
    sh.push([0, S.t - 6, t, 168, 0], [W - t, S.t - 6, t, 168, 0]);
  }
  return sh;
}
const rect = ([x, y, w, h, r], extra) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" ${extra}/>`;
export function frameSvg(mode, W, H, S, t, st) {
  const sh = frameShapes(mode, W, H, S, t);
  const warm = Math.round(st.tfrac * 100) / 100;
  return `<g opacity=".94">${sh.map((q) => rect(q, `fill="#b89560" stroke="#b89560" stroke-width="5"`)).join('')}${sh.map((q) => rect(q, `fill="#1c1714"`)).join('')}${sh.map((q) => rect(q, `fill="url(#hPlate)" opacity=".6"`)).join('')}</g>
<g opacity="${0.12 + warm * 0.35}" style="mix-blend-mode:screen">${sh.map((q) => rect(q, `fill="none" stroke="#ffb23a" stroke-width="2" transform="translate(0,0)"`)).join('')}</g>`;
}

export function hud(mode, st, hero) {
  const [W, H] = DIM[mode], S = SAFE[mode], Z = []; const zone = (n, x, y, w, h, tap = false) => Z.push({ n, x, y, w, h, tap });
  const hp = st.hp, hpTxt = String(Math.round(hp * st.hpMax));
  const t = mode === 'desk' ? 18 : 10;
  let s = frameSvg(mode, W, H, S, t, st);
  const wk = (x, y, sz, gap, rimless) => st.weapons.map((w, i) => tile(x + i * (sz + gap), y, sz, w[0], w[1], { ...(w[2] || {}), op: i === st.pulseSlot ? 1 : st.wfade, pulse: i === st.pulseSlot })).join('') + Array.from({ length: Math.max(0, 4 - st.weapons.length) }, (_, k) => tile(x + (st.weapons.length + k) * (sz + gap), y, sz, null)).join('');
  if (mode === 'desk') {
    const L1 = W / 2 - 142 - 290, x2 = W / 2 + 142, L2 = W - 232 - 12 - x2, f = st.xp * (L1 + L2);
    s += thread(290, 5, L1, Math.min(1, f / L1), 8, { railOp: 0.9, bead: f < L1 }) + thread(x2, 5, L2, Math.max(0, (f - L1) / L2), 8, { railOp: 0.9, bead: f >= L1 });
    s += lantern(46, 44, 0.98, hp) + num(hpTxt, 84, 46, 28, { sw: 4.4 }) + txt('/ ' + st.hpMax, 84 + hpTxt.length * 17 + 8, 46, 14, { c: K.muted, w: 600 }) + knot(244, 44, 19, st.lv, { flare: st.flare });
    zone('hp+xp', 0, 0, 272, 90); zone('xp-rim', 290, 0, 700, 18);
    s += moonArc(W / 2, 40, 170, 22, st.tfrac, { tk: 8 }) + digits(st.time, W / 2, 70, 25); zone('timer', W / 2 - 100, 8, 200, 70);
    s += coinChip(W - 224, 12, 132, 40, st.gold, { size: 21, noPlate: true }) + pauseBtn(W - 68, 8, 48); zone('coin', W - 224, 12, 132, 40); zone('pause', W - 68, 8, 48, 48, true);
    s += wk(22, H - 76, 56, 10); zone('weapons', 22, H - 76, 4 * 56 + 30, 56);
    const ar = 42, acx = W - 70, acy = H - 80; s += ability(acx, acy, ar, st.ab, { key: true }); zone('ability', acx - ar, acy - ar, 2 * ar, 2 * ar + 24, true);
    if (st.boss) s += bossBar(W / 2, 112, 460, st.boss.frac, { h: 18 });
  } else if (mode === 'land') {
    const x0 = S.l - 6;
    s += lantern(x0 + 36, 34, 0.76, hp) + num(hpTxt, x0 + 64, 36, 22, { sw: 3.8 }) + knot(x0 + 214, 34, 16, st.lv, { flare: st.flare });
    s += thread(x0 + 64, 46, 124, st.xp, 7, { railOp: 0.9 }); zone('hp+xp', x0, 0, 236, 62);
    s += wk(x0 + 12, 70, 34, 6); zone('weapons', x0 + 12, 70, 4 * 34 + 18, 34);
    s += moonArc(W / 2, 30, 140, 14, st.tfrac, { tk: 7, mr: 9, sr: 12 }) + digits(st.time, W / 2, 56, 21); zone('timer', W / 2 - 80, 4, 160, 62);
    const px = W - S.r - 48; s += coinChip(px - 114, 14, 108, 34, st.gold, { size: 18, noPlate: true }) + pauseBtn(px, 6, 48); zone('coin', px - 114, 14, 108, 34); zone('pause', px, 6, 48, 48, true);
    const ar = 44, acx = W - S.r - 56, acy = H - S.b - 62; s += ability(acx, acy, ar, st.ab); zone('ability', acx - ar, acy - ar, 2 * ar, 2 * ar, true);
    if (st.boss) s += bossBar(W / 2, 92, 280, st.boss.frac, { h: 13, ns: 16 });
  } else {
    const y0 = S.t - 6;
    s += lantern(34, y0 + 36, 0.7, hp) + num(hpTxt, 62, y0 + 44, 23, { sw: 4 }); zone('hp', 0, y0, 148, 78);
    s += digits(st.time, W / 2, y0 + 34, 22) + `<path d="M${W / 2 - 34} ${y0 + 46} H${W / 2 + 34}" stroke="${K.brassD}" stroke-width="2" stroke-dasharray="1 4" stroke-linecap="round"/><circle cx="${W / 2 - 34 + 68 * st.tfrac}" cy="${y0 + 46}" r="4.4" fill="#fff3d2" stroke="${K.brassD}" stroke-width="1.4"/><circle cx="${W / 2 + 38}" cy="${y0 + 46}" r="3.4" fill="${K.gold}"/>`; zone('timer', W / 2 - 62, y0, 124, 58);
    s += pauseBtn(W - 70, y0 + 6, 48); zone('pause', W - 70, y0 + 6, 48, 48, true);
    const ty = y0 + 86; s += thread(14, ty, W - 28, st.xp, 8, { railOp: 0.9 }) + knot(24, ty + 4, 14, st.lv, { flare: st.flare }); zone('xp', 12, ty - 8, W - 24, 24);
    s += wk(16, ty + 22, 34, 6) + coinChip(W - 12 - 96, ty + 22, 96, 32, st.gold, { size: 17 }); zone('weapons', 16, ty + 22, 4 * 34 + 18, 34); zone('coin', W - 108, ty + 22, 96, 32);
    const ar = 44, acx = W - 60, acy = H - S.b - 62; s += ability(acx, acy, ar, st.ab); zone('ability', acx - ar, acy - ar, 2 * ar, 2 * ar, true);
    if (st.boss) s += bossBar(W / 2, ty + 94, 300, st.boss.frac, { h: 13, ns: 16 });
  }
  if (st.frost) s += frost(W, H, st.frost);
  return { svg: s, zones: Z };
}
