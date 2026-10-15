// hud-fixes-before-after.png: the current build's HUD/card problems (docs/screenshots, read-only) next to Direction A's fixes.
import { readFileSync } from 'node:fs';
import { page, frame, stFor, T, FONT } from './compose.mjs';
import { levelScreen } from './cards.mjs';

const shot = (p) => 'data:image/jpeg;base64,' + readFileSync(new URL(p, import.meta.url)).toString('base64');
const badge = (n, x, y) => `<g transform="translate(${x},${y})"><circle r="13" fill="#ff6a3c" stroke="#fff" stroke-width="2"/>${T(String(n), 0, 6, { s: 16, f: FONT.num, c: '#fff', a: 'middle' })}</g>`;
export function fixesPage(sc) {
  let b = `<rect width="1280" height="64" fill="#07090d"/><rect y="64" width="1280" height="2" fill="#d8b26a" opacity=".8"/>${T('HUD FIXES: CURRENT BUILD vs DIRECTION A (the same fixes apply to B and C)', 14, 29, { s: 23, f: FONT.title, w: 900, c: '#fff' })}${T('Left = screenshots of the live dev build (docs/screenshots, untouched). Right = this sheet. Red numbers match the list below.', 14, 47, { s: 12.5, c: '#ffd98a', w: 600 })}`;
  const colW = 540, cx = [100, 640], k = colW / 1280;
  b += T('BEFORE: level-up with 5 cards (bless1)', cx[0], 84, { s: 12, c: '#ff9a8a', w: 800 }) + T('AFTER: A, 4 cards + 2 Blessings', cx[1], 84, { s: 12, c: '#a8e6a0', w: 800 });
  b += `<svg x="${cx[0]}" y="90" width="${colW}" height="${colW * 720 / 1280}" viewBox="0 0 1280 720"><image href="${shot('../../screenshots/bless1/blessing-offer.jpg')}" width="1280" height="720"/></svg>`;
  b += `<svg x="${cx[1]}" y="90" width="${colW}" height="${colW * 720 / 1280}" viewBox="0 0 1280 720">${levelScreen('desk', 'A', sc)}</svg>`;
  b += badge(1, 227, 187) + badge(2, 294, 271) + badge(3, 182, 143);
  b += badge(1, 752, 132) + badge(2, 910, 343) + badge(3, 700, 160);
  const py = 412;
  b += T('BEFORE: phone landscape (touch1)', cx[0], py - 6, { s: 12, c: '#ff9a8a', w: 800 }) + T('AFTER: A, phone landscape, notch (47px) simulated', cx[1], py - 6, { s: 12, c: '#a8e6a0', w: 800 });
  const ph = colW * 780 / 1688, pk = colW / 844;
  b += `<svg x="${cx[0]}" y="${py}" width="${colW}" height="${ph}" viewBox="0 0 1688 780"><image href="${shot('../../screenshots/touch1/land-2-run-stick.jpg')}" width="1688" height="780"/></svg>`;
  const f = frame('land', 'A', stFor('A'), sc, { x: cx[1], y: py, s: pk });
  b += f.svg + `<rect x="${cx[1] - 14}" y="${py + 390 * pk * 0.34}" width="${47 * pk * 0.55 + 14}" height="${390 * pk * 0.32}" rx="10" fill="#000"/>`;
  b += badge(4, 196, 636) + badge(5, 112, 438) + badge(6, 330, 432) + badge(7, 601, 617);
  b += badge(4, 770, 474) + badge(5, 660, 560) + badge(6, 790, 440) + badge(7, 1086, 600);
  void k;
  const L = ['1 cards had no icons -> icon medallion first, big number second   2 Blessing row wrapped like an error -> deliberate quiet row, smaller, cream, own label', '3 EVOLVE/BLESSING badges were clipped by the card top -> ribbons sit inside the card   4 weapon slots sat under the joystick -> strip moves up under the lantern plate', '5 HUD had no safe-area padding -> max(12px, env(safe-area-inset)) on every edge item   6 red HP bar + gold-yellow Gold counter broke the colour rules -> flame HP, brass coin; gold = evolutions only', '7 ability name text was 11px -> icon + key chip, HUD numerals >= 16px, words >= 14px   (also: Kills counter removed from the in-run HUD; the strip fades after ~8s)'];
  L.forEach((l, i) => { b += T(l, 12, 676 + i * 14, { s: 10.9, c: '#e8dfcf', w: 600 }); });
  return { html: page(b), w: 1280, h: 720 };
}
