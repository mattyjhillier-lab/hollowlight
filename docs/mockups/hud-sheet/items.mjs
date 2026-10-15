// World-space items drawn over the shared battle frames (same for every direction): Holy Orbit lights, pickups, damage numbers.
// Positions are tied to the enemies/gems in scenes.mjs. Direction style only changes the number style.
import { K, emblem, dmg, num, worldOverlay } from './kit.mjs';
import { HERO } from './scenes.mjs';

const U = { desk: 1, land: 2 / 3, port: 2 / 3 };
const heart = (x, y, s) => `<circle cx="${x}" cy="${y}" r="${24 * s}" fill="url(#hGlowR)"/>${emblem('heart', 26 * s, { x, y })}`;
const magnet = (x, y, s) => `<ellipse cx="${x}" cy="${y + 8 * s}" rx="${30 * s}" ry="${11 * s}" fill="none" stroke="${K.lilac}" stroke-opacity=".55" stroke-width="${2 * s}"/><ellipse cx="${x}" cy="${y + 8 * s}" rx="${19 * s}" ry="${7 * s}" fill="none" stroke="${K.lilac}" stroke-opacity=".8" stroke-width="${2 * s}"/><circle cx="${x}" cy="${y}" r="${22 * s}" fill="url(#hGlowL)"/>${emblem('magnet', 25 * s, { x, y })}`;
const arc = (x0, y0, x1, y1, s) => `<path d="M${x0} ${y0} Q${(x0 + x1) / 2} ${Math.min(y0, y1) - 40 * s} ${x1} ${y1}" fill="none" stroke="#ffe0a0" stroke-width="${1.6 * s}" stroke-dasharray="${1.4 * s} ${4 * s}" stroke-linecap="round" opacity=".85"/>`;

export function sceneItems(mode, o = {}) {
  const u = U[mode], hero = HERO[mode], slim = !!o.slim, [hx, hy] = hero;
  let s = worldOverlay(hero, mode === 'desk' ? 1 : u * 1.05);
  const d = (x, y, t, k, e = {}) => dmg(x, y, t, k, { sc: mode === 'desk' ? 1 : 0.8, slim, ...e });
  if (mode === 'desk') {
    s += arc(868, 470, 745, 372, 1) + heart(572, 528, 1) + magnet(852, 532, 1);
    s += d(468, 322, '124', 'crit') + d(536, 233, '38', 'hit') + d(392, 262, '71', 'big', { rot: -4 }) + d(383, 372, '22', 'hit', { rot: 3 }) + d(458, 452, '17', 'hit') + d(487, 438, '19', 'hit', { rot: 5 }) + d(748, 332, '-9', 'taken') + d(720, 300, '+30', 'heal', { sc: 0 + 1 });
  } else if (mode === 'land') {
    s += arc(420, 148, 480, 200, u) + heart(578, 292, u) + magnet(506, 296, u);
    s += d(250, 128, '124', 'crit') + d(350, 84, '38', 'hit') + d(196, 215, '22', 'hit', { rot: 3 }) + d(486, 178, '-9', 'taken');
  } else {
    s += arc(190, 352, 238, 436, u) + heart(272, 544, u) + magnet(300, 500, u);
    s += d(150, 290, '124', 'crit') + d(62, 322, '38', 'hit') + d(124, 396, '22', 'hit', { rot: 3 }) + d(250, 432, '-9', 'taken');
  }
  return s;
}
export { num };
