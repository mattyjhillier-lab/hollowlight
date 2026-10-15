// Page builders for the HUD sheet: world, touch board, cards, states. Each returns {html, w, h}.
import { page, banner, frame, DIRS, DIM, note, T, FONT, K, stFor } from './compose.mjs';
import { ST } from './dirA.mjs';
import { HERO } from './scenes.mjs';
import { sceneItems } from './items.mjs';

export { stFor };

export function worldPage(key, sc) {
  const D = DIRS[key];
  const f = frame('desk', key, stFor(key), sc, { x: 57, y: 64, s: 0.911 });
  // boss inset: crop of the top-centre HUD with the boss bar showing
  const b = frame('desk', key, stFor(key, { boss: { frac: 0.72 } }), sc, { noItems: true, x: 0, y: 0, s: 1 });
  const iw = 520, ih = 150, is = 0.8, ix = (1280 - iw * is) / 2, iy = 598;
  const inset = `<svg x="${ix}" y="${iy}" width="${iw * is}" height="${ih * is}" viewBox="380 0 ${iw} ${ih}" overflow="hidden"><use href="#scn-desk"/>${D.hud('desk', stFor(key, { boss: { frac: 0.72 } }), HERO.desk).svg}</svg><rect x="${ix}" y="${iy}" width="${iw * is}" height="${ih * is}" rx="6" fill="none" stroke="#ff8a6a" stroke-width="2" stroke-dasharray="6 4"/>${T('INSET: BOSS FIGHT (Elder Treant 72%)', ix + 8, iy - 6, { s: 11, c: '#ffb4a0', w: 800, st: '#0b0907', sw: 3 })}`;
  void b;
  return { html: page(`<rect y="64" width="1280" height="656" fill="#070605"/>${f.svg}${inset}${banner(D)}`), w: 1280, h: 720 };
}
