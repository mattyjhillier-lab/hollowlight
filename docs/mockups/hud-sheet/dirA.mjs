// DIRECTION A: LANTERN & THREAD. Lantern plate (flame = HP, thread = XP) top-left, moon arc top-centre, coin + pause top-right,
// weapon tiles bottom-left (desktop) or under the lantern (phone), ability ring bottom-right. Plates are the contrast device.
import { K, HDEFS, plate, lantern, thread, knot, moonArc, digits, coinChip, pauseBtn, tile, ability, bossBar, num, txt, FONT, frost } from './kit.mjs';

export const META = {
  id: 'A', name: 'LANTERN & THREAD', tag: 'A brass lantern whose flame is your health, a cream thread that ties a knot per level, a moon walking the arc to dawn.', concept: 'One brass lantern whose flame IS your health, a cream spirit thread that ties a knot each level, a moon that walks the arc to dawn. Dark-warm plates, ornament only on the lantern.',
  legend: 'CODE S Style v1 | P dark-warm plates | L lantern flame = HP | T spirit thread = XP | M moon arc | F Georgia + Segoe UI Black',
  sw: [['#1c1714', 'plate'], ['#d8b26a', 'brass'], ['#ffab3a', 'flame HP'], ['#ffe0a0', 'thread XP'], ['#ffd36b', 'evolve gold (reserved)']],
};
export const SAFE = { desk: { l: 20, t: 16, r: 20, b: 20 }, land: { l: 47, t: 8, r: 47, b: 21 }, port: { l: 12, t: 47, r: 12, b: 34 } };
export const DIM = { desk: [1280, 720], land: [844, 390], port: [390, 844] };

export const ST = { hp: 0.78, hpMax: 110, xp: 0.62, lv: 7, tfrac: 0.52, time: '07:42', gold: '1,284', ab: { ready: false, frac: 0.72, sec: 17 }, weapons: [['wolf', 3], ['raven', 2], ['orb', 1], ['bolt', 2, { cd: 62 }]], wfade: 1, boss: null, frost: 0, flare: false, pulseSlot: -1 };

export function hud(mode, st = ST, hero) {
  const [W, H] = DIM[mode], S = SAFE[mode], Z = []; const zone = (n, x, y, w, h, tap = false) => Z.push({ n, x, y, w, h, tap });
  const hp = st.hp, hpTxt = String(Math.round(hp * st.hpMax));
  let s = st.noFade ? '' : `<rect width="${W}" height="${mode === 'desk' ? 110 : 80}" fill="url(#hTopFade)"/><rect y="${H - (mode === 'desk' ? 130 : 100)}" width="${W}" height="${mode === 'desk' ? 130 : 100}" fill="url(#hBotFade)"/>`;
  const strip = (x, y, sz, gap, vertical = false) => st.weapons.map((w, i) => tile(vertical ? x : x + i * (sz + gap), vertical ? y + i * (sz + gap) : y, sz, w[0], w[1], { ...(w[2] || {}), op: i === st.pulseSlot ? 1 : st.wfade, pulse: i === st.pulseSlot }).replace(/ /, ' ')).join('') + (st.weapons.length < 4 ? Array.from({ length: 4 - st.weapons.length }, (_, k) => tile(x + (st.weapons.length + k) * (sz + gap), y, sz, null)).join('') : '');
  if (mode === 'desk') {
    const x0 = S.l, y0 = S.t;
    s += plate(x0, y0, 250, 70, 18) + lantern(x0 + 36, y0 + 40, 1.2, hp) + num(hpTxt, x0 + 82, y0 + 36, 28, { sw: 4.4 }) + txt('/ ' + st.hpMax, x0 + 82 + (hpTxt.length * 17 + 8), y0 + 36, 14, { c: K.muted, w: 600 });
    s += thread(x0 + 82, y0 + 47, 138, st.xp, 8) + knot(x0 + 250, y0 + 35, 20, st.lv, { flare: st.flare });
    zone('hp+xp', x0, y0, 270, 70);
    s += moonArc(640, 46, 190, 26, st.tfrac) + plate(584, 40, 112, 36, 18, { op: 0.78 }) + digits(st.time, 640, 67, 25);
    zone('timer', 545, 14, 190, 64);
    const cx0 = W - S.r - 48 - 10 - 138; s += coinChip(cx0, y0 + 2, 138, 40, st.gold, { size: 21 }) + pauseBtn(W - S.r - 48, y0 - 2, 48);
    zone('coin', cx0, y0 + 2, 138, 40); zone('pause', W - S.r - 48, y0 - 2, 48, 48, true);
    const ty = H - S.b - 56; s += strip(S.l, ty, 56, 8); zone('weapons', S.l, ty, 4 * 56 + 24, 56);
    const ar = 42, acx = W - S.r - ar - 2, acy = H - S.b - ar - 28;
    s += ability(acx, acy, ar, st.ab, { key: true }); zone('ability', acx - ar, acy - ar, 2 * ar, 2 * ar + 24, true);
    if (st.boss) s += bossBar(640, 108, 460, st.boss.frac, { h: 18 });
  } else if (mode === 'land') {
    const x0 = S.l + 8, y0 = S.t;
    s += plate(x0, y0, 210, 60, 16) + lantern(x0 + 30, y0 + 31, 0.76, hp) + num(hpTxt, x0 + 58, y0 + 33, 22, { sw: 3.8 });
    s += thread(x0 + 58, y0 + 42, 112, st.xp, 7) + knot(x0 + 210, y0 + 30, 16, st.lv, { flare: st.flare }); zone('hp+xp', x0, y0, 226, 60);
    s += strip(x0 + 2, y0 + 68, 32, 6); zone('weapons', x0 + 2, y0 + 68, 4 * 32 + 18, 32);
    s += moonArc(422, 34, 150, 16, st.tfrac, { tk: 7, mr: 9, sr: 12 }) + plate(366, 34, 112, 32, 16, { op: 0.78 }) + digits(st.time, 422, 58, 22); zone('timer', 340, 10, 164, 58);
    const px = W - S.r - 48, cw = 112; s += coinChip(px - 8 - cw, y0 + 10, cw, 34, st.gold, { size: 18 }) + pauseBtn(px, y0, 48); zone('coin', px - 8 - cw, y0 + 10, cw, 34); zone('pause', px, y0, 48, 48, true);
    const ar = 44, acx = W - S.r - ar - 6, acy = H - S.b - ar - 8; s += ability(acx, acy, ar, st.ab); zone('ability', acx - ar, acy - ar, 2 * ar, 2 * ar, true);
    if (st.boss) s += bossBar(422, 96, 300, st.boss.frac, { h: 14, ns: 17 });
  } else {
    const x0 = S.l, y0 = S.t + 6;
    s += plate(x0, y0, 132, 54, 16) + lantern(x0 + 28, y0 + 28, 0.72, hp) + num(hpTxt, x0 + 56, y0 + 36, 24, { sw: 4 }); zone('hp', x0, y0, 132, 54);
    s += plate(150, y0 + 2, 92, 46, 14, { op: 0.78 }) + digits(st.time, 196, y0 + 29, 22);
    s += `<path d="M164 ${y0 + 39} H228" stroke="${K.brassD}" stroke-width="2" stroke-dasharray="1 4" stroke-linecap="round"/><circle cx="${164 + 64 * st.tfrac}" cy="${y0 + 39}" r="4.4" fill="#fff3d2" stroke="${K.brassD}" stroke-width="1.4"/><circle cx="230" cy="${y0 + 39}" r="3.4" fill="${K.gold}"/>`; zone('timer', 150, y0 + 2, 92, 46);
    const px = W - S.r - 48; s += pauseBtn(px, y0 + 3, 48); zone('pause', px, y0 + 3, 48, 48, true);
    const ty = y0 + 66; s += thread(x0 + 32, ty, W - S.r - 32 - x0, st.xp, 8) + knot(x0 + 16, ty + 4, 15, st.lv, { flare: st.flare }); zone('xp', x0, ty - 8, W - 24, 24);
    s += strip(x0, ty + 22, 34, 6) + coinChip(W - S.r - 96, ty + 22, 96, 32, st.gold, { size: 17 }); zone('weapons', x0, ty + 22, 4 * 34 + 18, 34); zone('coin', W - S.r - 96, ty + 22, 96, 32);
    const ar = 44, acx = W - S.r - ar - 2, acy = H - S.b - ar - 14; s += ability(acx, acy, ar, st.ab); zone('ability', acx - ar, acy - ar, 2 * ar, 2 * ar, true);
    if (st.boss) s += bossBar(195, ty + 84, 330, st.boss.frac, { h: 14, ns: 17 });
  }
  if (st.frost) s += frost(W, H, st.frost);
  return { svg: s, zones: Z };
}
export { HDEFS };
