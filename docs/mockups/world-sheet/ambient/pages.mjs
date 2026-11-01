// Sheet pages for the ambient-life design (mock-ups only). Called by build.mjs after the frames exist.
import { join } from 'node:path';
import { begin, use, T, FONT, glow, mix, wolf, crawler, gem } from '../../style-lab/lab.mjs';
import { STYLES } from '../../style-lab/scene.mjs';
import { svgPage } from '../../wren-sheet/common.mjs';
import { crop } from '../../wren-alternatives/actual.mjs';
import { banner } from '../sheets.mjs';
import { wind, tuft, bloom, sparrow, hare, moth, butterfly, birdV, pollen, firefly, petal, pushLean } from './ambient.mjs';

const card = (x, y, w, h, title, sub = '') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12" fill="#161e29" stroke="#3a4757"/>${T(title, x + 12, y + 19, { s: 12.5, f: FONT.title, w: 900, c: '#ffd98a', ls: 1 })}${sub ? T(sub, x + w - 12, y + 18, { s: 9.6, c: '#9fb0c2', w: 600, a: 'end' }) : ''}`;
const wrapL = (ls, n) => ls.flatMap((l) => { if (Array.isArray(l) || l.length <= n) return [l]; const o = []; let cur = ''; for (const w of l.split(' ')) { if ((cur + ' ' + w).length > n) { o.push(cur); cur = '  ' + w; } else cur = cur ? cur + ' ' + w : w; } o.push(cur); return o; });
const lines = (x, y, ls0, o = {}) => (o.wrap ? wrapL(ls0, o.wrap) : ls0).map((l, i) => { const hd = Array.isArray(l); return T(hd ? l[0] : l, x, y + i * (o.lh || 15), { s: o.s || 10.4, c: hd ? l[1] : (o.c || '#d3dce6'), w: hd ? 900 : 500, f: hd ? FONT.mono : undefined }); }).join('');
const bgR = () => '<rect width="1280" height="720" fill="#121a24"/>';
const page = (b) => svgPage(1280, 720, bgR() + b);
const frameClip = (id, x, y, w, h) => `<clipPath id="${id}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="6"/></clipPath>`;

export async function run({ c, tmp, here, FR, what, img, savePng }) {
  if (what === 'frames') return;
  const out = async (name, html, w = 1280, h = 720, dpr = 1) => { const buf = await c.shot(join(tmp, name + '.html'), html, w, h, dpr); savePng(join(here, name + '.png'), buf, 520); };
  const D = (k) => FR[k].src;
  const dcrop = (k, sx, sy, sw, sh, x, y, w = sw, h = sh) => crop(D(k), 1280, 720, sx, sy, sw, sh, x, y, w, h, false);

  // ---------- am1: today vs recommended ----------
  begin(); use(STYLES.S1);
  let b = '';
  b += card(8, 96, 640, 292, 'TODAY (W0 look)', 'existing fog + 22 fireflies, 2x = in-game window');
  b += dcrop('base', 380, 200, 616, 250, 20, 126, 616, 250);
  b += card(656, 96, 616, 292, 'RECOMMENDED AMBIENT LAYER', 'same moment, same crop');
  b += dcrop('rec', 380, 200, 616, 250, 664, 126, 600, 250);
  b += card(8, 396, 420, 316, 'WHAT YOU SEE (all visual, no sim link)', '');
  b += lines(20, 446, [['MOTION = LIFE', '#7fd68a'], 'Restored ground sways in one shared wind; the Hollow stays still.', 'Colour, motion and critters all follow the same life map.', ['LAYERS', '#ffd98a'], '1 grass tufts sway (rotation about the base)', '2 flowers pop open where colour returns', '3 pollen motes + fireflies (warm in life, faint cold dust)', '4 a sparrow, a hare, two moths by the lamp (fade in combat)', '5 wind petals; crowns lean +-0.8 deg; foliage parts for hero/spirits', ['LOOK', '#ffd98a'], 'Style v1: tinted outlines, soft gradient, cosy chibi critters.'], { lh: 15, s: 10, wrap: 74 });
  b += card(436, 396, 420, 316, 'WHAT STAYS CLEAR (readability)', '');
  b += lines(448, 446, [['BELOW CREATURES', '#7fd68a'], 'Tufts and flowers are ground decals under every creature, low contrast,', 'none under Wren/Elias (their pool + backing stay clean).', ['PICKUP COLOURS RESERVED', '#7fd68a'], 'Mint (gems), rose (hearts), violet (magnet), gold (evolve/dawn) are never', 'used by ambient. Motes are cream; Hollow dust is pale and glowless.', ['COMBAT HUSH', '#7fd68a'], 'Critters and petals fade out when enemies are close or many.', 'Cold glowing eye-points stay an enemy-only signal.'], { lh: 15, s: 10, wrap: 74 });
  b += card(864, 396, 408, 316, 'COST AT A GLANCE (OPINION until W-A proves it)', '');
  b += lines(876, 446, [['High  ~165 ambient sprites, 2 extra draw calls', '#ffd98a'], ['Med   ~85 sprites, motes + critters, no petals', '#ffd98a'], ['Low   3 critters only; world is baked + still', '#ffd98a'], 'All pooled, all on one small atlas + the shared glow texture, culled', 'to camera. One wind function, no shader, no new dependency.', 'Visual RNG is its own stream: the sim and bot sweeps are untouched', '(sweeps must stay byte-identical).', ['SKEW IS NOT AN OPTION', '#ff9a8a'], 'Checked in Phaser 3.90 source: Images have no skew (only DOMElement).', 'Sway = rotation about the base (or 3 baked lean frames).'], { lh: 15, s: 10, wrap: 70 });
  await out('am1-today-vs-recommended', page(b + banner('AMBIENT LIFE v1: WHAT THE WORLD DOES WHILE YOU PLAY', 'Design only. Matt: "the world still needs to feel more alive". Night, Meadow Glade, Wren + Elias in the test frame (you play one hero).')));

  // ---------- am2: options ----------
  begin(); use(STYLES.S1);
  b = '';
  const tile = (i, title, sub, key, reg, notes) => {
    const x = 8 + (i % 3) * 427, y = 96 + Math.floor(i / 3) * 312;
    let s = card(x, y, 419, 304, title, sub);
    s += key ? dcrop(key, reg[0], reg[1], 395, 214, x + 12, y + 28, 395, 214) : '';
    s += lines(x + 12, y + 258, notes, { lh: 14, s: 9.6, wrap: 66 });
    return s;
  };
  b += tile(0, '1 GRASS + FLOWER SWAY', 'recommended: YES', 'sway', [480, 300], [['Tufts lean +-6 px by one shared wind, scaled by life.', '#7fd68a'], 'High 64 / Med 36 / Low 0 swaying (Low = baked still tiles).', 'Risk: motion under small wolves. Fix: ground depth, low contrast.']);
  b += tile(1, '2 MOTES + FIREFLIES', 'recommended: YES (small)', 'motes', [480, 300], [['Warm pollen inside colour, pale dust (no glow) in the Hollow.', '#7fd68a'], 'High 28 / Med 14 / Low 0, plus the existing fireflies (24 / 10).', 'Risk: look like gems. Fix: cream, <=2.5 px, alpha <=0.6.']);
  b += tile(2, '3 CRITTERS (AMBIENT ONLY)', 'recommended: YES, rules', 'critters', [800, 212], [['Perched sparrow, hare, moths at lit lamps. Warm tan, round dark eye.', '#7fd68a'], 'High 5 / Med 3 / Low 2 (plain sprites, no glow on Low).', 'Risk: read as enemies. Fix: warm, no glow, flee, hush in fights.']);
  // wind schematic
  const wx = 8, wy = 96 + 312;
  let ws = card(wx, wy, 419, 304, '4 SHARED WIND (props)', 'recommended: YES (cheap)');
  ws += `<rect x="${wx + 12}" y="${wy + 28}" width="395" height="214" rx="6" fill="#2a3a30"/>`;
  ws += `<path d="M${wx + 12} ${wy + 100} Q${wx + 120} ${wy + 60} ${wx + 230} ${wy + 100} T${wx + 407} ${wy + 90} L${wx + 407} ${wy + 140} Q${wx + 300} ${wy + 160} ${wx + 230} ${wy + 140} T${wx + 12} ${wy + 150}Z" fill="#ffffff" opacity=".07"/>`;
  ws += T('gust band travels across the screen', wx + 160, wy + 52, { s: 9, c: '#c9d3df', w: 700 });
  for (let i = 0; i < 18; i++) { const x = wx + 28 + i * 21.5, y = wy + 210 - (i % 3) * 6, w = wind(x * 3, y, 3.2); ws += tuft(x, y, 1, w * 9, true, i * 3 + 1); }
  for (let i = 0; i < 4; i++) { const x = wx + 70 + i * 90, w = wind(x * 3, 0, 3.2), a = w * 0.8; ws += `<g transform="translate(${x},${wy + 190}) rotate(${(a * 5).toFixed(1)})"><rect x="-5" y="-62" width="10" height="62" rx="3" fill="#6b5a48" stroke="#3a2a20" stroke-width=".9"/><circle cx="0" cy="-82" r="26" fill="#6fae62" stroke="#2c4a30" stroke-width="1.2"/></g>`; }
  for (let i = 0; i < 4; i++) ws += petal(wx + 90 + i * 80, wy + 92 + (i % 2) * 30, 1.2, 0.35 + i * 0.05);
  ws += lines(wx + 12, wy + 258, [['ONE wind(x, y, t): tufts, crowns, motes, petals all read it.', '#7fd68a'], 'Crowns rotate +-0.8 deg about the trunk (they are already a separate', 'layer in W4). Cost ~0; Low = still. Reduced motion = 25% amplitude.'], { lh: 14, s: 9.6 });
  b += ws;
  b += tile(4, '5 REACTIVE FOLIAGE', 'recommended: YES (capped)', 'reactive', [480, 300], [['Tufts within ~37 px lean away from hero, spirits, near enemies,', '#7fd68a'], 'then spring back. Read-only look at the sim (17 pushers max).', 'High + Med only. Risk: busy. Fix: lean only, capped.']);
  b += tile(5, '6 RESTORE-BLOOM', 'recommended: YES (best value)', 'bloom', [480, 330], [['Flowers pop open (bud, half, open, 0.5 s) where life crosses 0.5.', '#7fd68a'], 'High 32 / Med 16 pops; Low = colour only (flowers in tile).', 'Risk: edge flicker. Fix: one pop per cell, 6 spawns/s.']);
  await out('am2-options', page(b + banner('SIX OPTIONS, EACH SHOWN IN THE SAME NIGHT FRAME', 'Crops are 1:1 of the 1280x720 frame (= the 640x360 game view at 2x). Dawn chorus is the seventh option: see am5.')));

  // ---------- am3: anatomy ----------
  begin(); use(STYLES.S1);
  b = '';
  b += card(8, 96, 640, 300, 'SWAY: same patch at t = 0, 0.5, 1.0 s (3x) and the still Hollow', '');
  const patch = (x0, y0, t, alive) => { let s = `<rect x="${x0}" y="${y0}" width="150" height="116" rx="8" fill="${alive ? '#4a8a4a' : '#6a7a8e'}" opacity=".55"/>`; for (let i = 0; i < 14; i++) { const px = x0 + 14 + (i % 5) * 28 + (i % 2) * 8, py = y0 + 38 + Math.floor(i / 5) * 32, w = alive ? wind(px * 2, py, t) : 0; s += tuft(px, py, 2.1, w * 6 * 2.1, alive, i * 5 + 2); } return s; };
  [0, 0.5, 1.0].forEach((t, i) => { b += patch(20 + i * 156, 130, 3.2 + t, true) + T(`t = ${t.toFixed(1)} s`, 24 + i * 156, 258, { s: 9.6, c: '#c9d3df', w: 700 }); });
  b += patch(488, 130, 3.2, false) + T('Hollow: stillness', 492, 258, { s: 9.6, c: '#9fb0c2', w: 700 });
  b += lines(20, 282, [['Lean is +-6 px at 1x (+-3 logical px), period ~7 s, gust every ~10-14 s.', '#7fd68a'], 'Each tuft = 1 sprite rotated about its base; amplitude = wind x life (sampled 2 Hz).', 'The Hollow does not move: restored ground is the only thing that breathes.', 'Same wind everywhere, so it reads as weather, not as noise.'], { lh: 14, s: 9.8 });
  b += card(656, 96, 616, 300, 'BLOOM: the restore-pop (3x)', '0.5 s, ease-out-back');
  [0, 0.5, 1].forEach((st, i) => { const x = 700 + i * 120; b += `<g transform="translate(${x},262) scale(3.4)">${bloom(0, 0, 1, st, ['#ff9eb5', '#ffe08a', '#c8b4ff'][i], i)}</g>`; b += T(['bud', 'half', 'open'][i], x - 12, 290, { s: 9.6, c: '#c9d3df', w: 700 }); });
  b += `<g transform="translate(1076,262) scale(3.4)">${bloom(0, 0, 1.15, 1, '#ffe08a', 3)}</g>${glow(1076, 232, 44, 44, '#fff3c8', 0.5)}` + ['M1068 200 l3 -7', 'M1090 212 l8 -4', 'M1056 214 l-8 -5'].map((d) => `<path d="${d}" stroke="#fff3c8" stroke-width="1.6" stroke-linecap="round"/>`).join('') + T('pop + one sparkle', 1038, 290, { s: 9.6, c: '#c9d3df', w: 700 });
  b += lines(668, 316, [['Scale 0.4 > 1.15 > 1 over 0.5 s, one pop per flower, stays open.', '#7fd68a'], 'Trigger: a hash-cell candidate sees life cross 0.5 (rising) - no sim read.', 'Colours: rose, cream-yellow, lilac, white (no mint/rose-red/gold-glow: pickups).', 'Spawn cap 6/s; High 32 / Med 16 live pops; Low none (flowers baked).'], { lh: 14, s: 9.8 });
  b += card(8, 404, 640, 308, 'CRITTERS (4x) and where they live', '');
  const k = 4;
  b += `<g transform="translate(70,508) scale(${k})">${sparrow(0, 0, 1, 'perch', 1).replace(/scale\([^)]*\)/, 'scale(1.15,1.15)')}</g><g transform="translate(160,490) scale(${k})">${sparrow(0, 0, 1, 'fly', 1)}</g>`;
  b += `<g transform="translate(262,520) scale(3.2)">${hare(0, 0, 1, 0, 1)}</g>` + moth(380, 470, 4, 1) + moth(428, 492, 4, 0.5) + `<g transform="translate(500,470) scale(3.4)">${butterfly(0, 0, 1)}</g>` + `<g transform="translate(580,484) scale(3.2)">${birdV(0, 0, 1)}</g>`;
  b += ['perch sparrow', 'flying sparrow', 'hare', 'moths (lamp)', 'butterfly', 'dawn flock'].map((t, i) => T(t, [38, 128, 236, 350, 440, 548][i], 566, { s: 9.2, c: '#c9d3df', w: 700 })).join('');
  b += lines(20, 592, [['RULES: warm tan/cream, dark round eye, soft rim, never glow, never cold.', '#7fd68a'], 'Live only on restored ground (life > 0.6) or by a lit lamp; sparrow perches on stumps/stones.', 'Flee from the hero inside ~45 px and fly off; moths circle lamps. Never move toward anything.', 'Fade out (fly off) if any enemy is within ~100 px or 12+ enemies are on screen, return after ~6 s.', 'Own visual RNG stream (never the sim stream). Max 5 High / 3 Med / 2 Low. Silent for now.', 'Decor only: no collision, no targeting, no drops, not hit by weapons.'], { lh: 14, s: 9.6, wrap: 96 });
  b += card(656, 404, 616, 308, 'NOT-AN-ENEMY TEST (true size) and FOLIAGE PARTING', '');
  const fy = 506;
  b += `<g transform="translate(704,${fy}) scale(.675)">${wolf({ enemy: true, f: 1 })}</g><g transform="translate(792,${fy}) scale(.58)">${crawler()}</g><g transform="translate(868,${fy}) scale(.675)">${wolf({ enemy: false, f: -1 })}</g>`;
  b += hare(944, fy, 1, 0, -1) + sparrow(990, fy - 2, 1, 'perch', -1) + moth(1030, fy - 16, 1, 1);
  b += ['Fell Wolf', 'Crawler', 'Ghost wolf', 'hare', 'sparrow', 'moth'].map((t, i) => T(t, [690, 776, 850, 930, 976, 1016][i], fy + 22, { s: 8.8, c: '#c9d3df', w: 700 })).join('');
  b += lines(668, 552, [['Enemies: faceless, cold grey/ink, cold glowing eye-points. Ghost wolves: warm', '#ff9a8a'], 'cream + halo. Critters: <=10 px wide, tan, dark eye, no glow, no halo, flee.'], { lh: 13, s: 9.4 });
  // parting
  const hx = 1130, hy = 600;
  b += `<ellipse cx="${hx}" cy="${hy + 6}" rx="74" ry="62" fill="none" stroke="#ffd98a" stroke-width="1" stroke-dasharray="3 4" opacity=".6"/>`;
  const pts = [];
  for (let i = 0; i < 46; i++) { const a = i * 2.399, r = 22 + ((i * 37) % 70); const x = hx + Math.cos(a) * r * 1.7, y = hy + Math.sin(a) * r * 0.85 + 6; if (x > 980 && x < 1260 && y > 560 && y < 700) pts.push([x - hx, y - hy]); }
  const sc = { ghost: [[-60, 14], [58, -14]], fell: [] };
  for (const [dx, dy] of pts.sort((p, q) => p[1] - q[1])) b += tuft(hx + dx, hy + dy, 1.05, pushLean(dx, dy, sc, 1), true, Math.round(dx * 7 + dy));
  b += `<g transform="translate(${hx},${hy}) scale(.6)"><ellipse cx="0" cy="3" rx="22" ry="5" fill="#000" opacity=".35"/><circle cx="0" cy="-34" r="22" fill="#f3e7cf" stroke="#6a5a48" stroke-width="1.6"/><rect x="-16" y="-14" width="32" height="30" rx="10" fill="#74a09b" stroke="#3a5a56" stroke-width="1.6"/><path d="M-12 -52 l-4 -14 l12 8Z M12 -52 l4 -14 l-12 8Z" fill="#f3e7cf" stroke="#6a5a48" stroke-width="1.2"/></g>`;
  b += T('parting ring ~37 px', 1040, 686, { s: 9, c: '#ffd98a', w: 700 });
  b += lines(1010, 702, [['lean only, springs back in ~0.4 s', '#7fd68a']], { lh: 13, s: 9.4 });
  await out('am3-anatomy-and-rules', page(b + banner('HOW EACH PIECE WORKS, AT SIZE', 'Sway, bloom pop, critter set with their keep-away rules, and the not-an-enemy test. All drawn as code (SVG here, canvas textures in the game).')));

  // ---------- am4: readability + tiers ----------
  begin(); use(STYLES.S1);
  b = '';
  const sq = (k, x, y, label) => `<g style="filter:grayscale(1) contrast(1.15) blur(1.6px)">${dcrop(k, 380, 215, 380, 230, x, y, 380, 230)}</g>` + T(label, x + 6, y + 14, { s: 10, c: '#fff4d8', w: 800, st: '#07090d', sw: 3 });
  b += card(8, 96, 396, 272, 'SQUINT TEST: today', 'grey + blur');
  b += sq('base', 16, 128, 'TODAY');
  b += card(412, 96, 396, 272, 'SQUINT TEST: with ambient', 'grey + blur');
  b += sq('rec', 420, 128, 'WITH AMBIENT');
  b += card(816, 96, 456, 272, 'KEEP-CLEAR MAP (what ambient may not touch)', '');
  b += `<g opacity=".8">${dcrop('rec', 250, 205, 520, 265, 826, 128, 436, 222)}</g>`;
  const mx = (x) => 826 + (x + 390) * (436 / 520), my = (y) => 128 + (y + 191) * (222 / 265);
  const circ = (x, y, r, col, dash = '') => `<ellipse cx="${mx(x).toFixed(0)}" cy="${my(y).toFixed(0)}" rx="${(r * 0.838).toFixed(0)}" ry="${(r * 0.838 * 0.9).toFixed(0)}" fill="${col}" fill-opacity=".16" stroke="${col}" stroke-width="1.4" ${dash ? `stroke-dasharray="${dash}"` : ''}/>`;
  b += '<clipPath id="kc"><rect x="826" y="128" width="436" height="222"/></clipPath><g clip-path="url(#kc)">';
  b += circ(0, 4, 40, '#7fd68a') + circ(0, 4, 78, '#7fd68a', '4 3');
  for (const [x, y] of [[-330, -80], [-350, 30], [-250, 120], [-215, -130], [-290, -20]]) b += circ(x, y, 34, '#ff9a8a');
  for (const [x, y] of [[-215, -46], [-235, 70], [-130, 62], [-55, 80]]) b += circ(x, y, 26, '#7dffc4');
  b += '</g>';
  b += lines(826, 358, [['green hero 40/78 px | red foes 34 px | mint gems 26 px', '#c9d3df']], { s: 8.6 });
  b += card(8, 376, 628, 336, 'READABILITY RULES (OPINION; checked per chunk)', '');
  b += lines(20, 424, [
    ['R1 Ground ambient is a decal UNDER all creatures, contrast vs ground <= ~18%.', '#ffd98a'], '   Flowers <= 3 per 100x100 px (1280 frame); none within 78 px of the hero (her pool and backing stay clean). No per-enemy test (too costly): enemies have outline, rim and eye-points.',
    ['R2 Airborne motes: cream only, core <= 2.5 px (logical), alpha <= 0.6, <= 28.', '#ffd98a'], '   Pickup colours (mint gem, rose heart, violet magnet, gold evolve) are NEVER used by ambient.',
    ['R3 Critters: only restored ground / lamps; flee the hero; hush in combat.', '#ffd98a'], '   Enemies approach, critters leave: opposite motion is the second tell after colour and the eye.',
    ['R4 Motion budget: amplitude <= 6 px, period >= 6 s, no flicker, no strobing.', '#ffd98a'], '   Reduced motion: wind x0.25, critters perch still, motes slow drift, no petals, bloom = instant.',
    ['R5 The Hollow is still. Enemies come from still ground, so their motion reads', '#ffd98a'], '   MORE clearly, not less. This is the main reason the plan is safe.',
    ['R6 Phone: same view scaled 0.61, so tufts get small. Phone density x0.6, drop the', '#ffd98a'], '   smallest flowers, motes 0.6x. Verify on a real phone (still outstanding for W0).',
  ], { lh: 14, s: 9.6, wrap: 100 });
  b += card(644, 376, 628, 336, 'PER-TIER COST AND CAPS (OPINION until spiked)', '');
  const rows = [['', 'High', 'Med', 'Low'], ['Swaying tufts (sprites)', '64', '36', '0 (baked)'], ['Flower pops (sprites)', '32', '16', '0 (baked)'], ['Pollen motes (additive)', '28', '14', '0'], ['Fireflies (exists today)', '24', '10', '0'], ['Critters', '5', '3', '2 (plain)'], ['Wind petals / leaves', '8', '4', '0'], ['Prop crown sway', 'yes', 'yes', 'no'], ['Foliage parting', 'yes', 'yes', 'no'], ['Ambient sprites total', '~165', '~85', '~2'], ['Extra draw calls', '+2', '+2', '+0/1'], ['CPU per frame (estimate)', '<0.3 ms', '<0.2 ms', '~0']];
  rows.forEach((r, i) => { const y = 426 + i * 16; b += T(r[0], 656, y, { s: 9.8, c: i === 0 ? '#ffd98a' : '#d3dce6', w: i === 0 || i >= 9 ? 800 : 500 }) + [r[1], r[2], r[3]].map((v, j) => T(v, 930 + j * 112, y, { s: 9.8, c: i === 0 ? '#ffd98a' : '#d3dce6', w: i === 0 || i >= 9 ? 800 : 500 })).join(''); });
  b += lines(656, 624, ['Budgets: sprites <= 600 (ambient is <= 28% on High), draw calls <= 25. Everything pooled,', 'culled to camera + margin, one small atlas (tufts, blooms, critters) + the existing glow texture.', 'Quality auto-step already exists (src/gfx/quality.js CAPS): add caps.ambient = {tufts,pops,motes,critters,petals}.', 'Fill rate: motes are tiny; the real risk is ground blend + lightmap.'], { lh: 13.5, s: 9.4, wrap: 92 });
  await out('am4-readability-and-tiers', page(b + banner('READABILITY FIRST, THEN COST', 'Small wolves must stay readable: ambient lives below creatures, stays inside its own colour lane, and goes quiet when it matters.')));

  // ---------- am5: native, phone, dawn chorus ----------
  begin(); use(STYLES.S1);
  b = '';
  b += card(8, 96, 662, 388, 'TRUE SIZE: the 640x360 game view (1:1 pixels)', 'Wren + Elias test frame, night');
  b += crop(FR['rec-native'].src, 640, 360, 0, 0, 640, 360, 19, 118, 640, 360, true);
  b += card(678, 96, 594, 388, 'PHONE 390x844 @DPR2 (CSS size), same layer', '');
  b += crop(FR['rec-phone'].src, 780, 1688, 0, 560, 780, 720, 690, 122, 390, 360, false);
  b += lines(1092, 140, [['PHONE NOTES', '#ffd98a'], 'Tufts ~3 px: they read', 'as texture, not as', 'objects. Hero pool and', 'wolves stay the loudest.', '', ['TO CHECK', '#ff9a8a'], 'density x0.6 on phone,', 'real-phone fps.'], { lh: 14, s: 9.8 });
  b += card(8, 492, 790, 220, 'DAWN CHORUS (moment 3 of 3): the win beat', 'ARC dawn, same crop');
  b += crop(FR.dawn.src, 1280, 720, 257, 205, 766, 190, 20, 516, 766, 190, false);
  b += card(806, 492, 466, 220, 'THREE QUIET MOMENTS (once per run, <= 6 s)', '');
  b += lines(818, 544, [['1  FIRST COLOUR (~0:40)  the first time a flower pops, one sparrow lands', '#ffd98a'], '   nearby and the first fireflies appear. The Hollow starts to breathe.', ['2  BREATH OUT (boss/miniboss dies)  a short hush: a few birds return, a', '#ffd98a'], '   ripple of blooms from the kill spot, wind +20% for 5 s.', ['3  DAWN CHORUS (the win, ~14:30+)  8-10 bird silhouettes cross from the sun', '#ffd98a'], '   side, 3 butterflies, motes x1.5, a bloom wave sweeps from the dawn edge.', ['Gold/warm light only at moment 3 (dawn = gold). Audio hooks later.', '#9fb0c2'], 'Triggers read existing events (time, boss dead, victory). No sim link.'], { lh: 13.4, s: 9.4, wrap: 76 });
  await out('am5-true-size-phone-dawn', page(b + banner('TRUE SIZE, PHONE, AND THE DAWN CHORUS', 'The 640x360 render is a real 1:1 pixel render of the layer; the phone crop is the same night frame at 390 CSS px.')));
}
