// Proof pages (brief checklist): measured true-size table, phone @2x crops, colour-blind simulation, damage-number rules.
import { page, DIRS, DIM, crop, stFor, T, FONT, K, note } from './compose.mjs';
import { MEAS } from './measure.mjs';
import { contrast, blend, dmg, tile, emblem, lantern } from './kit.mjs';
import { levelScreen, CARDS } from './cards.mjs';
import { HERO } from './scenes.mjs';

const lab = (s, x, y, o = {}) => T(s, x, y, { s: o.s || 11.5, c: o.c || '#d8cfc0', w: o.w || 600, a: o.a, st: '#0b0907', sw: 3 });
const hdr = (title, sub) => `<rect width="1280" height="64" fill="#07090d"/><rect y="64" width="1280" height="2" fill="#d8b26a" opacity=".8"/>${T(title, 14, 29, { s: 25, f: FONT.title, w: 900, c: '#fff', ls: 0.5 })}${T(sub, 14, 47, { s: 12.5, c: '#ffd98a', w: 600 })}`;
const box = (x, y, w, h, title) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="#15110e" stroke="#4a3d2c"/>${title ? T(title, x + 10, y + 19, { s: 12.5, f: FONT.title, w: 900, c: '#ffd98a', ls: 0.8 }) : ''}`;
const NAME = { A: 'A LANTERN & THREAD', B: 'B HEARTH EDGE', C: 'C DAWN FRAME' };

function proof1(sc) {
  let b = hdr('HUD PROOF 1: TRUE SIZE, 44px TARGETS, MEASURED NUMBERS', 'Real pixels (1:1) at the 1280x720 desktop camera: the hero is 60px tall (phone 40px). Cyan squares = 44px target minimum.');
  const X = [12, 432, 852];
  ['A', 'B', 'C'].forEach((key, i) => {
    const x = X[i], st = stFor(key, { wfade: 1, pulseSlot: -1 });
    b += box(x, 72, 416, 292, NAME[key]);
    // top-right 1:1 with a 44px reference square on pause
    b += crop(key, 'desk', st, [864, 0, 416, 110], x + 0, 98, 1, { noItems: true });
    const hud = DIRS[key].hud('desk', st, HERO.desk), pz = hud.zones.find((z) => z.n === 'pause');
    b += `<rect x="${x + (pz.x - 864)}" y="${98 + pz.y}" width="${pz.w}" height="${pz.h}" fill="none" stroke="#7fe8ff" stroke-width="2" stroke-dasharray="4 3"/>${lab('pause 48px', x + (pz.x - 864) + pz.w, 98 + pz.y + pz.h + 14, { s: 11, c: '#7fe8ff', a: 'end' })}`;
    // bottom-right 1:1 ability + hero 60px reference
    b += crop(key, 'desk', st, [864, 590, 416, 130], x, 218, 1, { noItems: true });
    const ab = hud.zones.find((z) => z.n === 'ability');
    b += `<rect x="${x + (ab.x - 864)}" y="${218 + (ab.y - 590)}" width="${ab.w}" height="${ab.h}" fill="none" stroke="#7fe8ff" stroke-width="2" stroke-dasharray="4 3"/>${lab(`ability ${ab.w}px`, x + (ab.x - 864) - 84, 218 + (ab.y - 590) + 50, { s: 11, c: '#7fe8ff' })}`;
    b += lab('1:1 crops: top-right and bottom-right; cyan dashes = tap target', x + 10, 358, { s: 10.8 });
  });
  // hero scale strip
  b += box(12, 372, 1256, 74, 'SCALE REFERENCE (1:1)');
  b += crop('A', 'desk', stFor('A'), [690, 328, 96, 66], 230, 378, 1, { noHud: true, noItems: true }) + lab('hero 60px (desktop)', 332, 410, { s: 11 });
  b += crop('A', 'land', stFor('A'), [438, 186, 64, 46], 460, 384, 1, { noHud: true, noItems: true }) + lab('hero 40px (phone)', 530, 410, { s: 11 });
  b += lab('HUD numerals 28px (HP) / 25px (timer) are ~half the hero height; words 14px; every tappable item >= 44px with 8px gaps.', 700, 402, { s: 11.5 }) + lab('Heroes stay readable because nothing in the centre 50% x 50% of the screen is HUD (except the optional B ring).', 700, 424, { s: 11.5 });
  // measured table
  const y0 = 456, rows = [];
  const cell = (key, f) => f(MEAS.v[key]);
  rows.push(['HUD area desktop / landscape / portrait', (k) => `${cell(k, (m) => m.desk.fp.toFixed(1))}% / ${cell(k, (m) => m.land.fp.toFixed(1))}% / ${cell(k, (m) => m.port.fp.toFixed(1))}%`, 'budget 12 / 14 / 16']);
  rows.push(['Centre 50% x 50% covered (desktop)', (k) => `${MEAS.v[k].desk.centre.toFixed(2)}%`, 'budget 0%']);
  rows.push(['Smallest numeral px (desktop / phone)', (k) => `${Math.min(...['desk'].map((q) => MEAS.v[k][q].minNum)).toFixed(1)} / ${Math.min(MEAS.v[k].land.minNum, MEAS.v[k].port.minNum).toFixed(1)}`, 'min 16']);
  rows.push(['Smallest HUD word px', (k) => `${MEAS.v[k].desk.minWord} (phone: none)`, 'min 14']);
  rows.push(['Smallest tap target px (all modes)', (k) => `${Math.min(MEAS.v[k].desk.minTap, MEAS.v[k].land.minTap, MEAS.v[k].port.minTap)}`, 'min 44']);
  const plate = (bgc) => blend('#231d19', bgc, 0.8);
  const cr = (bgc) => contrast('#fff3dc', plate(bgc)).toFixed(1);
  rows.push(['Cream text vs plate (worst ground)', (k) => (k === 'B' ? `outline only: ${contrast('#fff3dc', '#140f0c').toFixed(1)} vs ink` : `${cr('#c0e68a')} grass / ${cr('#7d8a9a')} Hollow`), 'min 4.5']);
  rows.push(['Plate edge vs ground', (k) => (k === 'B' ? 'n/a (outline + scrim)' : `grass ${contrast(plate('#c0e68a'), '#c0e68a').toFixed(1)} / Hollow ${contrast(plate('#7d8a9a'), '#7d8a9a').toFixed(1)}`), 'min 3']);
  rows.push(['Safe-area padding (all three)', (k) => (k === 'A' ? 'max(12px, env(safe-area-inset-*))' : 'same'), 'required']);
  b += box(12, y0, 1256, 256, 'MEASURED (screenshots rendered alone on transparent; contrast = WCAG formula on the real colours)');
  b += T('CHECK', 24, y0 + 44, { s: 12, c: '#ffd98a', w: 800 }) + ['A', 'B', 'C'].map((k, i) => T(NAME[k], 330 + i * 270, y0 + 44, { s: 12, c: '#ffd98a', w: 800 })).join('') + T('TARGET', 1150, y0 + 44, { s: 12, c: '#ffd98a', w: 800 });
  rows.forEach(([name, f, tgt], r) => {
    const y = y0 + 68 + r * 22;
    b += `<rect x="18" y="${y - 15}" width="1244" height="21" rx="4" fill="${r % 2 ? '#1a1511' : '#120e0b'}"/>` + T(name, 24, y, { s: 12, c: '#e8dfcf', w: 600 }) + ['A', 'B', 'C'].map((k, i) => T(f(k), 330 + i * 270, y, { s: 11.6, c: '#fff3dc', w: 700 })).join('') + T(tgt, 1150, y, { s: 11, c: '#bfb4a2', w: 600 });
  });
  return { html: page(b), w: 1280, h: 720 };
}

function proof2(sc) {
  let b = hdr('HUD PROOF 2: PHONE AT 2x DPR (device pixels), NOTCH + THUMB', 'Crops are CSS-pixel regions drawn at 2x, i.e. what a 2x phone screen shows. Top-left landscape (notch side) and top of portrait (notch/island).');
  const X = [12, 432, 852];
  ['A', 'B', 'C'].forEach((key, i) => {
    const x = X[i], st = stFor(key);
    b += box(x, 72, 416, 636, NAME[key]);
    // landscape: left notch inset 47 -> region x 30..238
    b += crop(key, 'land', st, [30, 0, 208, 140], x + 0, 96, 2, {}) + `<rect x="${x}" y="96" width="${(47 - 30) * 2}" height="280" fill="#000" opacity=".6"/>` + lab('notch-side inset 47px (black)', x + 8, 368, { s: 10.8, c: '#ff9a8a' });
    b += lab('landscape 844x390 @2x: top-left', x + 6, 392, { s: 11, c: '#ffd98a' });
    b += crop(key, 'port', st, [0, 0, 208, 140], x, 402, 2, {}) + `<rect x="${x}" y="402" width="416" height="94" fill="#000" opacity=".4"/><rect x="${x + 266}" y="416" width="150" height="68" rx="34" fill="#000"/>` + lab('portrait 390x844 @2x: top 47px = notch / island (shaded)', x + 6, 690, { s: 10.8, c: '#ff9a8a' });
  });
  return { html: page(b), w: 1280, h: 720 };
}

const CVD = {
  Normal: null,
  'Deuteranopia (approx.)': '0.367 0.861 -0.228 0 0  0.280 0.673 0.047 0 0  -0.012 0.043 0.969 0 0  0 0 0 1 0',
  'Protanopia (approx.)': '0.152 1.053 -0.205 0 0  0.115 0.786 0.099 0 0  -0.004 -0.048 1.052 0 0  0 0 0 1 0',
  'Tritanopia (approx.)': '1.256 -0.077 -0.179 0 0  -0.078 0.931 0.148 0 0  0.005 0.691 0.304 0 0  0 0 0 1 0',
  Greyscale: 'sat',
};
function proof3(sc) {
  let b = hdr('HUD PROOF 3: COLOUR-BLIND AND GREYSCALE SIMULATION', 'Amber flame, gold EVOLVE and cream BLESSING must still be told apart: by shape and word, not hue. Matrices are the Machado approximations (sRGB).');
  const defs = `<defs>${Object.entries(CVD).filter(([, v]) => v).map(([k, v], i) => `<filter id="cvd${i}" color-interpolation-filters="sRGB">${v === 'sat' ? '<feColorMatrix type="saturate" values="0"/>' : `<feColorMatrix type="matrix" values="${v}"/>`}</filter>`).join('')}</defs>`;
  const names = Object.keys(CVD);
  const st = stFor('A', { wfade: 1, pulseSlot: -1 }), stL = stFor('A', { hp: 0.18, noFade: true, wfade: 1, pulseSlot: -1 }), stE = stFor('A', { wfade: 1, pulseSlot: -1 });
  const cardsInner = levelScreen('port', 'A', sc);
  const tiles = [[12, 76], [432, 76], [852, 76], [12, 392], [432, 392]];
  names.forEach((nm, i) => {
    const [x, y] = tiles[i], fi = nm === 'Normal' ? null : Object.keys(CVD).filter((k) => CVD[k]).indexOf(nm);
    b += box(x, y, 416, 308, nm.toUpperCase());
    const inner = `<svg x="${x + 8}" y="${y + 28}" width="216" height="283" viewBox="12 222 366 480" overflow="hidden">${cardsInner}</svg>` +
      crop('A', 'desk', stL, [0, 0, 290, 92], x + 244, y + 30, 0.6, { noItems: true }) +
      crop('B', 'desk', stFor('B', { hp: 0.18, noFade: true }), [HERO.desk[0] - 100, HERO.desk[1] - 16, 200, 66], x + 244, y + 92, 0.84, { noItems: true }) +
      crop('A', 'desk', stFor('A', { weapons: [['wolf', 5, { evo: true }], ['raven', 2], ['orb', 3], ['bolt', 1]], wfade: 1 }), [10, 636, 280, 84], x + 244, y + 152, 0.6, { noItems: true }) +
      `<g transform="translate(${x + 252},${y + 214})"><rect x="-4" y="-2" width="160" height="72" fill="#222"/><circle cx="20" cy="30" r="14" fill="#ffab3a"/><circle cx="62" cy="30" r="14" fill="#ffd36b"/><circle cx="104" cy="30" r="14" fill="#efe2c0"/><circle cx="140" cy="30" r="14" fill="#dff1fa"/></g>` +
      lab('flame / gold / cream / frost', x + 246, y + 296, { s: 10.4 });
    b += fi == null ? inner : `<g filter="url(#cvd${fi})">${inner}</g>`;
  });
  const x = 852, y = 392;
  b += box(x, y, 416, 308, 'VERDICT (honest)') + ['Passes: EVOLVE = gold ribbon WORD + double line + sparkles;', 'BLESSING = single cream line + smaller row + word; stirs =', 'hairline + italic words. In every simulation each is distinct.', '', 'Watch: flame (orange) vs gold (yellow) collapse together under', 'protan/deutan. They stay apart by place and shape: the flame is', 'a flame inside a lantern; gold only appears on EVOLVE cards,', 'evolved tiles and the dawn sun, each with sparkles or a word.', 'Low HP: flame shrinks and frost texture appears (non-hue cues).', '', 'Weak: the stirs hairline (40% gold) is nearly invisible in', 'greyscale by design; the italic line is the real signal.', 'Matrices approximate; test with a real simulator before build.'].map((l, i) => T(l, x + 12, y + 44 + i * 18, { s: 11.6, c: l.startsWith('Watch') || l.startsWith('Weak') ? '#ffb4a0' : '#d8cfc0', w: 600 })).join('');
  return { html: page(defs + b), w: 1280, h: 720 };
}

function proof4(sc) {
  let b = hdr('HUD PROOF 4: DAMAGE NUMBERS, RULES AND VARIANTS', 'Numbers live in the canvas (pooled BitmapText, about 40), never the DOM. Cream-white with a dark outline: never gold. Style per direction: A and C chunky, B slimmer.');
  const bgH = (x, y, w, h) => `<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="40 60 ${w} ${h}" overflow="hidden"><use href="#scn-desk"/></svg>`;
  const bgR = (x, y, w, h) => `<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="640 400 ${w} ${h}" overflow="hidden"><use href="#scn-desk"/></svg>`;
  // 1 sizes
  b += box(12, 72, 420, 196, '1  SIZES AT THE 60px HERO SCALE');
  b += bgR(18, 98, 408, 164);
  const row = [[44, 'hit', '21', 'hit 21px'], [112, 'big', '71', 'big hit 29px'], [196, 'crit', '124', 'crit 40px'], [292, 'hit', '1.2k', '4-digit: 1.2k'], [372, 'taken', '-9', 'taken 17px']];
  row.forEach(([x, k, t, l]) => { b += dmg(x + 24, 150, t, k, {}) + lab(l, x + 24, 200, { a: 'middle', s: 10.4 }); });
  b += dmg(70, 246, '+30', 'heal', {}) + lab('heal +30 (rose lane)', 130, 244, { s: 10.4 });
  b += lab('A / C style', 240, 244, { s: 10.4, c: '#ffd98a' }) + dmg(330, 246, '38', 'hit', {}) + dmg(372, 246, '38', 'hit', { slim: true, white: true }) + lab('B', 396, 250, { s: 10.4, c: '#ffd98a' });
  // 2 merge
  b += box(444, 72, 420, 196, '2  SWARM MERGE: 12 HITS, ONE VOICE');
  b += bgH(450, 98, 408, 164);
  const hits = [[40, 40], [88, 64], [140, 36], [190, 70], [60, 100], [118, 118], [170, 104], [230, 124], [260, 50], [290, 94], [320, 126], [350, 70]];
  b += hits.map(([x, y], i) => dmg(470 + x - 40, 130 + y - 20, String(14 + i), 'hit', { sc: 0.8 })).join('');
  b += lab('raw: 12 numbers fight for space', 456, 258, { s: 10.4 });
  // merged
  b += `<g transform="translate(0,0)">` + `<rect x="1" y="1" width="0" height="0"/></g>`;
  b += box(876, 72, 392, 196, '   merged: rule = sum per enemy per 120ms');
  b += bgH(882, 98, 380, 164);
  b += hits.slice(0, 4).map(([x, y], i) => `<circle cx="${902 + x * 1.1}" cy="${150 + y * 0.5}" r="22" fill="none" stroke="#fff3dc" stroke-opacity=".5" stroke-width="2"/>`).join('') + dmg(960, 150, '64', 'big', {}) + dmg(1100, 190, '212', 'crit', { sc: 0.85 });
  b += lab('AoE hits > 5 enemies: show 1-2 numbers + a ring flash', 888, 258, { s: 10.4 });
  // 3 variants
  b += box(12, 276, 420, 150, '3  VARIANTS: OFF / CRITS ONLY / REDUCED MOTION');
  b += bgH(18, 302, 408, 118);
  b += lab('numbers off', 80, 330, { a: 'middle', s: 10.8, c: '#ffd98a' }) + lab('nothing drawn', 80, 348, { a: 'middle', s: 10 });
  b += lab('crits only', 210, 330, { a: 'middle', s: 10.8, c: '#ffd98a' }) + dmg(210, 380, '124', 'crit', { sc: 0.8 });
  b += lab('reduced motion', 350, 330, { a: 'middle', s: 10.8, c: '#ffd98a' }) + dmg(350, 372, '38', 'hit') + lab('fades in place: no rise, no pop', 350, 398, { a: 'middle', s: 10 });
  // 4 legibility on grounds
  b += box(444, 276, 824, 150, '4  LEGIBILITY ON EVERY GROUND (Hollow grey, restored green, bright gem, enemy)');
  const grounds = [['#59657a', 'Hollow grey'], ['#9ad66b', 'restored grass'], ['#d8e8a0', 'lantern pool (brightest)'], ['#2a2530', 'dark root veins']];
  grounds.forEach(([c, n], i) => { const x = 452 + i * 202; b += `<rect x="${x}" y="302" width="194" height="96" rx="6" fill="${c}"/>` + dmg(x + 60, 350, '38', 'hit', {}) + dmg(x + 138, 340, '124', 'crit', { sc: 0.7 }) + dmg(x + 100, 386, '-9', 'taken', {}) + lab(n, x + 97, 410, { a: 'middle', s: 10.4 }); });
  // 5 rules
  b += box(12, 434, 1256, 274, '5  RULES TO BUILD (research 28 s3)');
  const R = ['Size: base 14px-equivalent at the 60px hero; big hit (>= 3x median) x1.4 with a 2-frame pop; hard cap x2. Phone hero 40px: numbers scale with the camera (x0.8).', 'Colour: cream-white default, dark warm outline 2-6px; crit = bigger + brass outline + starburst, NOT gold (gold is evolutions). Taken damage: cool pale rose, small, near the hero, its own lane.', 'Clutter: jitter +/-6px, rise 20px over 450ms, one number per enemy per 120ms (sum), global cap 24 live numbers (drop the smallest first), AoE > 5 targets: 1-2 numbers + ring flash.', 'Format: k/M from 10,000; nowrap; fixed digit widths so numbers never wrap or jump.', 'Settings: Damage numbers (all / crits only / off), reduced motion (fade in place), reduce flashes. Keep numbers in a pooled canvas BitmapText font in Hollowlight style.', 'Placeholder note: numerals are Segoe UI Black; the build ships a self-hosted OFL rounded font baked to a bitmap font (research 13).'];
  R.forEach((l, i) => { b += T(l, 24, 478 + i * 31, { s: 11.8, c: '#e8dfcf', w: 600 }); });
  b += lab('UNVERIFIED: merge timing 120ms is common practice, no source fetched (research 28 s3). Tune in play.', 24, 690, { s: 11, c: '#ffb4a0' });
  return { html: page(b), w: 1280, h: 720 };
}

export async function proofPages(sc) {
  return [['hud-proof-1-actual-size', proof1(sc)], ['hud-proof-2-phone-2x', proof2(sc)], ['hud-proof-3-colour-blind', proof3(sc)], ['hud-proof-4-damage-numbers', proof4(sc)]];
}
void K; void DIM; void note; void tile; void emblem; void lantern; void CARDS;
