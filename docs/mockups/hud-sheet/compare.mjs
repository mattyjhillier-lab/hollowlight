// hud-compare.png: A | B | C in the same battle frame: full desktop frame, 1:1 desktop crop, 1:1 phone-landscape crop, measured screen area, honest pros/cons.
import { page, DIRS, crop, stFor, T, FONT, K } from './compose.mjs';
import { MEAS } from './measure.mjs';
import { HERO } from './scenes.mjs';

const PC = {
  A: ['+ clearest HP/XP/level at a glance; every item has one home; smallest build', '- plates read as "HUD boxes"; top-left AND top-centre are both decorated'],
  B: ['+ most world visible, calmest look, cheapest to build', '- HP ring on the hero is hard to read at 40px and sits in the action centre'],
  C: ['+ strongest own look: frost + dawn live in the frame; very "gaming"', '- biggest footprint; corner brackets cover edge enemies; ornament risk'],
};
export async function comparePage(sc, c, tmp) {
  void c; void tmp;
  const X = [12, 432, 852], W = 416; let b = '';
  b += `<rect width="1280" height="64" fill="#07090d"/><rect y="64" width="1280" height="2" fill="#d8b26a" opacity=".8"/>` + T('HUD DIRECTIONS COMPARED: A | B | C', 14, 29, { s: 25, f: FONT.title, w: 900, c: '#fff', ls: 0.5 }) + T('Same battle frame, same state (HP 78%, 7:42, weapon strip faded where the direction does it). Crops marked 1:1 are real pixels.', 14, 47, { s: 12.5, c: '#ffd98a', w: 600 }) + T('Screen area = % of pixels the HUD covers at >= 35% opacity (measured by rendering the HUD alone on transparent). Budget: desktop <= 12%, phone landscape <= 14%, portrait <= 16%.', 14, 60, { s: 10.2, c: '#aab4c2', w: 400 });
  ['A', 'B', 'C'].forEach((key, i) => {
    const x = X[i], D = DIRS[key], st = stFor(key), M = MEAS.v[key];
    b += `<rect x="${x}" y="72" width="${W}" height="644" rx="10" fill="#120e0b" stroke="#4a3d2c"/>`;
    b += T(`${key}  ${D.META.name}`, x + 10, 94, { s: 18, f: FONT.title, w: 900, c: '#ffd98a' });
    b += crop(key, 'desk', st, [0, 0, 1280, 720], x, 102, 0.325, {});
    b += T('desktop 1280x720, scaled to 32.5%', x + 6, 345, { s: 10.8, c: '#bfb4a2' });
    if (key === 'B') b += crop(key, 'desk', st, [0, 0, 208, 128], x, 356, 1, {}) + crop(key, 'desk', st, [HERO.desk[0] - 104, 330, 208, 128], x + 208, 356, 1, {});
    else b += crop(key, 'desk', st, [0, 0, 416, 128], x, 356, 1, {});
    b += T(key === 'B' ? 'desktop 1:1: top-left + hero ring' : 'desktop 1:1 pixels: top-left', x + 6, 498, { s: 10.8, c: '#bfb4a2' });
    b += crop(key, 'land', st, [0, 0, 416, 128], x, 506, 1, {});
    b += T('phone landscape 844x390, 1:1 CSS px: top-left', x + 6, 648, { s: 10.8, c: '#bfb4a2' });
    b += T(`HUD area: desktop ${M.desk.fp.toFixed(1)}%  |  land ${M.land.fp.toFixed(1)}%  |  port ${M.port.fp.toFixed(1)}%`, x + 6, 666, { s: 11.8, c: '#fff3dc', w: 800 });
    b += T(PC[key][0], x + 6, 683, { s: 10.8, c: '#a8e6a0', w: 600 }) + T(PC[key][1], x + 6, 698, { s: 10.8, c: '#ffb0a0', w: 600 });
    b += T(`faded weapons: desk ${M.desk.fpFaded.toFixed(1)}%${M.desk.centre > 0.05 ? `  |  centre 50% used ${M.desk.centre.toFixed(2)}%` : '  |  centre 50% kept clear'}`, x + 6, 712, { s: 10.4, c: '#bfb4a2', w: 600 });
  });
  return { html: page(b), w: 1280, h: 720 };
}
