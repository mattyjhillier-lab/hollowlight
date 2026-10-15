// Level-up pages: a 1280x720 board (desktop + phone landscape + phone portrait) and a desktop-only page, per direction.
import { page, banner, DIRS, note, T } from './compose.mjs';
import { levelScreen } from './cards.mjs';

export function cardsDeskPage(key, sc) {
  return { html: page(`<rect y="64" width="1280" height="656" fill="#070605"/><svg x="57" y="64" width="${1280 * 0.911}" height="${720 * 0.911}" viewBox="0 0 1280 720">${levelScreen('desk', key, sc)}</svg>${banner(DIRS[key])}`), w: 1280, h: 720 };
}
export function cardsPage(key, sc) {
  const D = DIRS[key], sD = 0.58, sL = 0.5, sP = 0.7;
  const desk = `<svg x="12" y="80" width="${1280 * sD}" height="${720 * sD}" viewBox="0 0 1280 720">${levelScreen('desk', key, sc)}</svg>`;
  const land = `<svg x="12" y="508" width="${844 * sL}" height="${390 * sL}" viewBox="0 0 844 390">${levelScreen('land', key, sc)}</svg>`;
  const port = `<svg x="994" y="84" width="${390 * sP}" height="${844 * sP}" viewBox="0 0 390 844">${levelScreen('port', key, sc)}</svg>`;
  const cap = (x, y, t) => T(t, x, y, { s: 11.5, c: '#ffd98a', w: 800 });
  let b = cap(12, 76, 'DESKTOP 1280x720 (shown 58%): 4 cards + 2 Blessings = the largest hand') + cap(12, 504, 'PHONE LANDSCAPE (50%)') + cap(994, 78, 'PHONE PORTRAIT (70%)');
  b += note(764, 80, 218, 418, 'HOW TO READ A CARD', ['1 EVOLVE: gold, taller, ribbon INSIDE', '   the card (no clipping), sparkles,', '   first slot', '2 STIRS: hairline gold edge + italic', '   line; NO badge, NO glow (must not', '   look like EVOLVE); names nothing', '3 STAT: slate line, role colour on ring', '4 NEW: notched tab in weapon colour', 'BLESSING: quiet cream line, smaller,', '   own row; never gold, never glows', 'Icon first: pick by icon + title,', '   text is for new players.', 'Pips show where this pick lands.', 'Reroll / Banish: 44px pills + counts,', '   under the row, away from cards.'], { fs: 11.2, lh: 17 });
  b += note(446, 508, 536, 197, 'WRAPPING RULES (how 5-6 cards fit)', ['Desktop: row A (<= 4 gold/normal cards) + quiet row B (<= 2 Blessings) + pills.', 'Phone landscape: 4 compact cards (150px); Blessings + Reroll/Banish share ONE', '   44px strip beneath; description hidden (icon + title + number stay).', 'Phone portrait: cards stack as wide rows (icon | name | big number); Blessings are', '   two half-width chips; Reroll/Banish sit low, where the thumb rests.', 'No second wrapped row of big cards anywhere (the bless1 bug).', '250ms input lock when the screen opens; single tap picks; pressed state on every card.'], { fs: 11.4, lh: 18 });
  return { html: page(`${desk}${land}${port}${b}${banner(D)}`), w: 1280, h: 720 };
}
