// World sheet #2: page builders. Every page is 1280x720 (frames are rendered separately by headless Chrome, then embedded/cropped, same method as wren-v2 / elias-v2).
import { begin, use, T, FONT, glow, lgU, rgU, mix } from '../style-lab/lab.mjs';
import { STYLES } from '../style-lab/scene.mjs';
import { svgPage } from '../wren-sheet/common.mjs';
import { img, crop } from '../wren-alternatives/actual.mjs';
import { wrenRunPose } from '../elias-v2/actual.mjs';
import { worldFrame, PROPS, lamp, well, chapel, den, nest, deadGrove, ambientHex, lifeAt, PC, ol, groundLayer } from './world.mjs';
import { cfgFor, LIFE, drawHero, HERO_DESK, HERO_PHONE } from './scenes.mjs';
import { ARC } from './arc.mjs';
import { join } from 'node:path';

// ---------- shared chrome ----------
const SW = [['#8a98ab', 'Hollow'], ['#70b858', 'Restored'], ['#ffc45a', 'Lantern'], ['#0c0f1c', 'Corruption'], ['#8a7ab8', 'Vein'], ['#7f6cb9', 'Dusk'], ['#ffe2c4', 'Dawn']];
export const banner = (title, sub) => `<rect width="1280" height="86" fill="#07090d" opacity=".96"/><rect y="86" width="1280" height="3" fill="#ffb84a"/>${T(title, 12, 29, { s: 24, f: FONT.title, w: 900 })}${T(sub, 12, 47, { s: 10.2, f: FONT.mono, c: '#ffd98a', w: 700 })}${T('HOLLOWLIGHT STYLE v1: L2 tinted outline + H2 soft gradient/rim + P1 chibi + W2 painted ground | G1 lantern pool + G2 trails | mood P1 Warm Lantern', 12, 62, { s: 9.4, f: FONT.mono, c: '#b8c4d0', w: 600 })}${SW.map(([c, n], i) => `<circle cx="${1022 + (i % 4) * 60 - 770 + 770}" cy="${0}" r="0"/>`).join('')}${SW.map(([c, n], i) => `<circle cx="${22 + i * 150}" cy="77" r="6" fill="${c}" stroke="#fff" stroke-opacity=".7" stroke-width="1.3"/>${T(c + ' ' + n, 33 + i * 150, 81, { s: 9.4, f: FONT.mono, c: '#e8edf3', w: 600 })}`).join('')}`;
const bgR = () => `<rect width="1280" height="720" fill="url(#${lgU('wbg', 0, 0, 500, 720, [[0, '#121a24'], [1, '#222d3a']])})"/>`;
const card = (x, y, w, h, title, sub = '') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12" fill="#161e29" stroke="#3a4757"/>${T(title, x + 12, y + 19, { s: 12.5, f: FONT.title, w: 900, c: '#ffd98a', ls: 1 })}${sub ? T(sub, x + w - 12, y + 18, { s: 9.6, c: '#9fb0c2', w: 600, a: 'end' }) : ''}`;
const wrapL = (ls, n) => ls.flatMap((l) => { if (Array.isArray(l) || l.length <= n) return [l]; const out = []; let cur = ''; for (const w of l.split(' ')) { if ((cur + ' ' + w).length > n) { out.push(cur); cur = '  ' + w; } else cur = cur ? cur + ' ' + w : w; } out.push(cur); return out; });
const lines = (x, y, ls0, o = {}) => (o.wrap ? wrapL(ls0, o.wrap) : ls0).map((l, i) => { const hd = Array.isArray(l); return T(hd ? l[0] : l, x, y + i * (o.lh || 15), { s: hd ? (o.s || 10.4) : (o.s || 10.4), c: hd ? l[1] : (o.c || '#d3dce6'), w: hd ? 900 : 500, f: hd ? FONT.mono : undefined }); }).join('');
const lbl = (s, x, y, a = 'start') => T(s, x, y, { s: 10.5, c: '#fff4d8', w: 800, st: '#07090d', sw: 3.2, a });
const page = (body) => svgPage(1280, 720, bgR() + body);

// ---------- frames ----------
const cache = new Map();
export async function frame(ctx, K, mom, dev = 'desk', over = {}, tag = '') {
  const key = `${K}${mom}${dev}${tag}`; if (cache.has(key)) return cache.get(key);
  const phone = dev === 'phone', w = phone ? 390 : 1280, h = phone ? 844 : 720, u = phone ? 2 / 3 : 1;
  const body = worldFrame(w, h, u, cfgFor(K, mom, dev, over));
  const buf = await ctx.c.shot(join(ctx.tmp, `wf-${key}.html`), svgPage(w, h, body), w, h, phone ? 2 : 1);
  const r = { buf, src: img(buf), w: phone ? 780 : 1280, h: phone ? 1688 : 720 };
  cache.set(key, r); return r;
}
async function raw(ctx, name, w, h, cfg, dpr = 1) { // arbitrary frame
  const body = worldFrame(w, h, cfg.u || 1, cfg);
  const buf = await ctx.c.shot(join(ctx.tmp, `wr-${name}.html`), svgPage(w, h, body), w, h, dpr);
  return { buf, src: img(buf), w: w * dpr, h: h * dpr };
}

// ---------- 1 overview ----------
export async function overview(ctx) {
  const A = await frame(ctx, 'A', 'night'), B = await frame(ctx, 'B', 'night');
  begin(); use(STYLES.S1);
  let b = '';
  b += card(8, 96, 636, 392, 'TAKE A: MEADOW GLADE', 'night, 6:30, desktop 1280x720 at 49%');
  b += crop(A.src, 1280, 720, 0, 0, 1280, 720, 18, 124, 616, 346, false);
  b += card(656, 96, 616, 392, 'TAKE B: DEEP FOREST FLOOR', 'night, 6:30, same battle, same time, same life map');
  b += crop(B.src, 1280, 720, 0, 0, 1280, 720, 666, 124, 596, 346, false);
  b += lbl('Hollow = cool grey-blue; colour = life', 30, 140);
  b += lines(16, 506, [
    ['TAKE A: open painted meadow', '#7fd68a'], 'Round storybook oaks, pale snags that BLOSSOM when restored, bushes, stumps, boulders.',
    'Light ground: flowers in drifts, tufts, a worn sandy path. Restored ground reads like a lit garden.',
    'Lanes stay open; every prop is low or single. Easiest to read the pack, gems and the pup on.',
    ['RISK', '#ff9a8a'], 'Bushes/boulders repeat across 15 min: needs 3 variants each. Less "forest", more "park".',
  ], { lh: 15 });
  b += lines(664, 506, [
    ['TAKE B: dark forest floor', '#7fd68a'], 'Leaf litter, roots, moss pads, ferns and tall bark PILLARS that run off the top of the screen.',
    'No canopy over play (the crown is only a soft shadow on the ground). Restored: mossy green, amber litter, dapples.',
    'Feels like a real cursed forest. Vertical trunks frame the hero; clear lanes between them.',
    ['RISK', '#ff9a8a'], 'Dark floor lowers enemy contrast; trunks add vertical clutter on a phone (fewer, wider-spaced there).',
  ], { lh: 15 });
  b += `<rect x="8" y="610" width="1264" height="100" rx="12" fill="#1c1812" stroke="#ffb84a" stroke-opacity=".6"/>`;
  b += lines(22, 632, [
    ['RECOMMENDATION', '#ffd98a'], 'Keep BOTH as ONE pipeline with two ground sets (same shader, same life map, same prop atlas rules):',
    'Take A for the Meadow / Old Road / Wells zones and the opening minutes, Take B for the Dead Grove, Root Thicket, Graves and the map-edge wall. Zones then look different for free,',
    'and the Hollow/restored swap is the same one idea everywhere. If Matt wants ONE look only: A (friendlier, easier to read, cheaper). The build chunks (sheet 8) work for either.',
  ], { lh: 16, s: 10.6 });
  return page(b + banner('WORLD SHEET #2: CHAPTER 1 CURSED FOREST', 'Two takes for the ground/prop look. Same battle (Wren + Elias, 2 ghost wolves, pup, 5 Fell Wolves, 2 crawlers, raven) at the same moment. MOCK-UP, no game code changed.'));
}

// ---------- 2 ground ----------
export async function ground(ctx) {
  const mk = (K) => raw(ctx, 'gr' + K, 1240, 196, { take: K, f: 0.5, ambLift: 1, hero: [620, 98], noHero: true, props: [], life: { blobs: [[-30, 0, 250], [120, 30, 150]], corr: [[510, 10, 130, 3]] }, paths: [], scene: {}, fx: { fog: false, flies: false }, sparks: [[372, -20, 3.4], [364, 26, 3], [384, 4, 2.8]], seed: 3 });
  const GA = await mk('A'), GB = await mk('B');
  begin(); use(STYLES.S1);
  let b = '';
  b += card(8, 96, 1264, 244, 'TAKE A: MEADOW GLADE ground (full daylight, true pixel size 1:1)', 'Hollow | colour wake line | restored | contested edge | corruption');
  b += crop(GA.src, 1240, 196, 0, 0, 1240, 196, 20, 126, 1240, 196, false);
  b += lbl('HOLLOW: blue-grey, dead tufts, grey buds', 28, 142); b += lbl('RESTORED: tufts, flower drifts, stones', 420, 142); b += lbl('CORRUPTED: ink, cracks, crumbs', 1000, 142);
  b += card(8, 346, 1264, 244, 'TAKE B: DEEP FOREST FLOOR ground (1:1)', 'Hollow | colour wake line | restored | corruption');
  b += crop(GB.src, 1240, 196, 0, 0, 1240, 196, 20, 376, 1240, 196, false);
  b += lbl('HOLLOW: slate floor, grey litter, roots', 28, 392); b += lbl('RESTORED: moss, amber litter, ferns, dapples', 420, 392); b += lbl('CORRUPTED', 1030, 392);
  b += lines(16, 614, [
    ['HOW IT IS MADE (feasible with the existing code-generated tile pipeline)', '#ffd98a'],
    'Two painted tiles per take (Hollow, Restored), authored at FULL daylight values (the lightmap multiplies them down at night), seamless, 2 texels per unit, plus a 128-unit decal sheet (flower drifts, stones, litter, roots).',
    'A 256x256 life texture (15.6 world units per cell) decides, per pixel, Hollow vs restored: blend with a noisy edge (breaks the circle into a painted blob), a warm 1-cell rim, and dark veins where life < 0.',
    'Detail sprites (tufts, flowers) are NOT per-instance: they are baked into the tile; only ~30 larger decals (stones, stumps) are sprites. Zero new draw calls on Low (Low keeps the Hollow tile only, no restore blend).',
  ], { lh: 15, s: 10.2 });
  return page(b + banner('GROUND: HOLLOW vs RESTORED vs CORRUPTED', 'Painted texture with grass and flower detail (W2). Colour = life: the restored paint only exists where the life map says so.'));
}

// ---------- 3 props ----------
function propSvg(type, alive, K, s = 1) {
  if (type === 'lamp') return lamp(alive, K);
  const P = PROPS[type]; return P(alive, K, 3);
}
export async function props(ctx) {
  const HER = await raw(ctx, 'heroref', 360, 140, { take: 'A', f: 0.5, ambLift: 1, hero: [90, 126], drawHero, props: [], life: { all: true }, scene: {}, fx: { fog: false, flies: false }, noHero: false, seed: 2 });
  begin(); use(STYLES.S1);
  let b = '';
  const wOf = (t, K) => { const d = propSvg(t, false, K); return (d.w || 80); };
  const pair = (type, K, cx, base, label, sc = 1) => {
    const h = propSvg(type, false, K), a = propSvg(type, true, K), dx = (h.w || 80) * sc * 0.5 + 12;
    let o = `<g transform="translate(${cx - dx},${base}) scale(${sc})">${h.ground || ''}${h.trunk}${h.crown || ''}</g><g transform="translate(${cx + dx},${base}) scale(${sc})">${a.ground || ''}${a.trunk}${a.crown || ''}</g>`;
    o += T(label, cx, base + 15, { s: 10.2, c: '#e8edf3', a: 'middle', w: 800 }) + T('Hollow', cx - dx, base + 27, { s: 8.6, c: '#9fb0c2', a: 'middle', w: 600 }) + T('restored', cx + dx, base + 27, { s: 8.6, c: '#b8e47e', a: 'middle', w: 600 });
    return o;
  };
  const row = (items, x0, x1, base) => { // spread pairs by their widths
    const ws = items.map(([t, K]) => wOf(t, K) + 24 + 70), tot = ws.reduce((p, q) => p + q, 0), gap = Math.max(0, ((x1 - x0) - tot) / items.length);
    let x = x0, o = ''; items.forEach(([t, K, lab], i) => { const w = ws[i] + gap; o += pair(t, K, x + w / 2, base, lab); x += w; }); return o;
  };
  const pairAt = (type, K, xh, xa, base, label) => { const h = propSvg(type, false, K), a = propSvg(type, true, K); return `<g transform="translate(${xh},${base})">${h.ground || ''}${h.trunk}${h.crown || ''}</g><g transform="translate(${xa},${base})">${a.ground || ''}${a.trunk}${a.crown || ''}</g>` + T(label, (xh + xa) / 2, base + 15, { s: 10.2, c: '#e8edf3', a: 'middle', w: 800 }) + T('Hollow', xh, base + 27, { s: 8.6, c: '#9fb0c2', a: 'middle', w: 600 }) + T('restored', xa, base + 27, { s: 8.6, c: '#b8e47e', a: 'middle', w: 600 }); };
  b += `<rect x="8" y="96" width="1264" height="284" rx="12" fill="#161e29" stroke="#3a4757"/>` + T('TALL PROPS (true size)', 990, 118, { s: 12.5, f: FONT.title, w: 900, c: '#ffd98a' });
  b += `<clipPath id="pclip"><rect x="14" y="100" width="970" height="274"/></clipPath><g clip-path="url(#pclip)">`;
  b += pairAt('oak', 'A', 140, 400, 340, 'Gnarled Oak (Take A)') + pairAt('snag', 'A', 590, 700, 340, 'Pale Snag (A): blossoms') + pairAt('pillar', 'B', 835, 925, 372, 'Bark Pillar (B)');
  b += '</g>';
  b += crop(HER.src, 360, 140, 40, 0, 270, 140, 990, 134, 270, 140, false);
  b += T('Wren 60 px', 1040, 258, { s: 10, c: '#ffd98a', w: 800, st: '#07090d', sw: 3 }) + T('Elias 75 px', 1140, 258, { s: 10, c: '#ffd98a', w: 800, st: '#07090d', sw: 3 });
  b += lines(992, 296, ['Oak 230 px = 3.8x hero, snag 205 px.', 'Crowns are drawn UNDER every creature: nothing', 'ever hides behind a tree. What you can bump', 'into is the trunk base, ~40 px wide.'], { lh: 14, s: 9.8, c: '#c9d3df' });
  b += card(8, 388, 1264, 152, 'LOW PROPS (set dressing: single objects, never walls)', 'each shown Hollow | restored');
  b += row([['bush', 'A', 'Bush'], ['stump', 'A', 'Stump + mushrooms'], ['log', 'A', 'Fallen log'], ['boulder', 'A', 'Mossy boulder'], ['grave', 'A', 'Leaning grave'], ['fern', 'A', 'Fern fan']], 20, 1262, 500);
  b += card(8, 548, 750, 168, 'STORY + TERRAIN PROPS', 'lamp post cold | lit, mushroom ring, bramble');
  b += row([['lamp', 'A', 'Lamp post'], ['mush', 'A', 'Mushroom ring'], ['bramble', 'A', 'Bramble thicket']], 20, 750, 684);
  b += card(766, 548, 506, 168, 'SILHOUETTE TEST (flat black, true size)', 'can you name each?');
  b += `<rect x="776" y="570" width="486" height="138" rx="8" fill="#8a94a0"/>`;
  const sil = [['bush', 36], ['boulder', 112], ['stump', 180], ['log', 248], ['grave', 322], ['lamp', 372], ['bramble', 430]];
  b += `<g style="filter:brightness(0)">` + sil.map(([t, x]) => { const d = propSvg(t, false, 'A'); return `<g transform="translate(${776 + x},696) scale(${t === 'lamp' ? 0.85 : 0.9})">${d.trunk}</g>`; }).join('') + '</g>';
  b += `<g style="filter:brightness(0)" transform="translate(1228,696) scale(0.54)">${wrenRunPose()}</g>` + T('Wren 60 px', 1228, 584, { s: 9, c: '#07090d', a: 'middle', w: 800 });
  return page(b + banner('PROP SET: CHAPTER 1 CURSED FOREST', '14 props, each with a Hollow and a restored variant that share ONE silhouette (the swap never pops). Drawn from code (SVG here, canvas in the game).'));
}

// ---------- 4 life map, trails, corruption, air ----------
export async function life(ctx) {
  const A = await frame(ctx, 'A', 'night');
  begin(); use(STYLES.S1);
  let b = '';
  // 1 restore boundary
  b += card(8, 96, 628, 292, 'THE COLOUR WAKE (2x zoom)', 'warm rim = light eating the Hollow');
  b += crop(A.src, 1280, 720, 440, 340, 303, 146, 18, 122, 606, 262, true);
  b += lbl('rim glow, sparkle sprouts', 30, 140); b += lbl('painted noisy edge, not a circle', 330, 372, 'start');
  // 2 trail + fireflies
  b += card(644, 96, 628, 292, 'TRAILS FADE, FIREFLIES READ THE MAP (2x)', 'trail memory ~25 s, then the Hollow grows back');
  b += crop(A.src, 1280, 720, 860, 320, 303, 146, 654, 122, 606, 262, true);
  b += lbl('restored strip left by the lantern fades along the path', 666, 140); b += lbl('warm fireflies inside, cold outside', 666, 372);
  // 3 corruption
  b += card(8, 396, 628, 316, 'CORRUPTION UNDER THE PACK (1.4x)', 'ink + cracked veins, never red; light burns it back');
  b += crop(A.src, 1280, 720, 70, 290, 433, 233, 18, 424, 606, 270, false);
  b += lbl('cracks creep from each Fell Wolf', 30, 442); b += lbl('cream sparks where the lantern burns it', 30, 690);
  // 4 life map debug
  const R = 20, cols = 64, rows = 26, gx0 = -640, gy0 = -290, X0 = 654, Y0 = 424, sc = 606 / 1280;
  let dbg = '';
  for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
    const wx = gx0 + (i + 0.5) * R, wy = gy0 + (j + 0.5) * R, v = lifeAt(LIFE.night, wx, wy);
    const col = v > 0 ? mix('#4a5565', '#9ad66b', Math.min(1, v)) : v < 0 ? mix('#4a5565', '#1a1030', Math.min(1, -v * 1.2)) : '#4a5565';
    dbg += `<rect x="${(X0 + i * R * sc).toFixed(1)}" y="${(Y0 + j * R * sc).toFixed(1)}" width="${(R * sc + 0.4).toFixed(1)}" height="${(R * sc + 0.4).toFixed(1)}" fill="${col}"/>`;
  }
  b += card(644, 396, 628, 316, 'WHAT THE GAME STORES (debug view of the life map)', 'grey 0 | green alive | violet-black corrupted');
  b += dbg;
  b += lines(656, 690, ['256x256 values over 4000x4000 (shown 64x32 cells here). Hero lantern, spirits, wells and lit lanterns ADD life;', 'enemies and time add corruption; both decay. Props sample it on a timer to swap Hollow <-> restored. Pure visual (no gameplay).'], { lh: 13, s: 9.4, c: '#c9d3df' });
  b += `<rect x="${X0 + 3}" y="${Y0 + 3}" width="46" height="14" rx="4" fill="#07090d" opacity=".8"/>` + T('1 cell', X0 + 8, Y0 + 14, { s: 9, c: '#fff', w: 700 });
  return page(b + banner('LIFE MAP, GLOWING TRAILS, CORRUPTION, AIR', 'One low-res texture drives everything. Colour returns where spirits have been; corruption spreads where enemies are; fog and fireflies follow the same map.'));
}

// ---------- 5 dusk to dawn ----------
export async function arc(ctx) {
  const M = [['dusk', '0:30  DUSK', 'violet light, one small pool, the Hollow is lilac-grey', 0.03], ['night', '6:30  NIGHT', 'blue night, mural of trails, pack under corruption', 0.43], ['deep', '10:00  THE TREANT HOUR', 'biggest pool, heaviest fog, ring of corruption closing', 0.65], ['dawn', '14:50  DAWN', 'the sun floods the whole screen with colour', 0.99]];
  const F = []; for (const [m] of M) F.push(await frame(ctx, 'A', m));
  begin(); use(STYLES.S1);
  let b = '';
  const bandY = 112, bandH = 569;
  M.forEach(([m, t, d, f], i) => {
    const x = 8 + (i % 2) * 636, y = 96 + Math.floor(i / 2) * 296;
    b += `<rect x="${x}" y="${y}" width="628" height="288" rx="12" fill="#161e29" stroke="#3a4757"/>`;
    b += crop(F[i].src, 1280, 720, 0, bandY, 1280, bandH, x + 4, y + 4, 620, 276, false);
    b += `<rect x="${x + 4}" y="${y + 4}" width="620" height="36" fill="#07090d" opacity=".78"/>` + T(t, x + 14, y + 22, { s: 13, f: FONT.title, w: 900, c: '#ffd98a' }) + T(d, x + 14, y + 35, { s: 9.4, c: '#d3dce6', w: 600 });
    const amb = ambientHex(f).amb; b += `<circle cx="${x + 606}" cy="${y + 22}" r="8" fill="${amb}" stroke="#fff" stroke-opacity=".8"/>` + T('ARC ' + amb, x + 592, y + 26, { s: 9, f: FONT.mono, c: '#e8edf3', a: 'end', w: 700 });
  });
  // timeline
  const tx = 20, tw = 1240, ty = 690;
  const stops = ARC.map(([f, a]) => [f, '#' + a.toString(16).padStart(6, '0')]);
  b += `<rect x="${tx}" y="${ty}" width="${tw}" height="14" rx="7" fill="url(#${lgU('arcbar', tx, 0, tx + tw, 0, stops.map(([f, c]) => [f, mix(c, '#ffffff', 0.14)]))})" stroke="#fff" stroke-opacity=".5"/>`;
  [[0.03, '0:30'], [0.43, '6:30'], [0.55, '8:15 darkest'], [0.667, '10:00 boss'], [0.99, '14:50']].forEach(([f, l]) => { b += `<path d="M${tx + f * tw} ${ty - 3} v20" stroke="#fff" stroke-width="1.6"/>` + T(l, tx + f * tw, ty + 28 - (l.includes('darkest') ? 0 : 0), { s: 9.6, c: '#ffd98a', a: f > 0.95 ? 'end' : 'middle', w: 800 }); });
  return page(b + banner('DUSK TO DAWN: FOUR MOMENTS OF ONE RUN', 'Real ARC keyframes from src/gfx/palette.js (ambient multiply + light stamps), lifted +14% in this mock (see weak spots). Same hero, same forest; the life map and light do the story.'));
}

// ---------- 6 points of interest ----------
export async function poi(ctx) {
  const mk = async (name, type, opts = {}) => {
    const base = { take: opts.K || 'A', f: 0.3, ambLift: 0.4, hero: [148, 190], noHero: true, props: [], scene: {}, paths: [], fx: { nFog: 3, nFly: 8, fogA: opts.fogA ?? 0.16 }, seed: 5, u: opts.u || 1 };
    const place = (state) => [[type, 0, 0, opts.s || 1, state]];
    const hol = await raw(ctx, `poi-${name}-h`, 296, 206, { ...base, life: { blobs: [] }, props: opts.hollowProps ? opts.hollowProps : [[type, 0, 0, 1, { state: false }]], extraLights: opts.lights || [] });
    const ali = await raw(ctx, `poi-${name}-a`, 296, 206, { ...base, life: { all: true }, props: opts.aliveProps ? opts.aliveProps : [[type, 0, 0, 1, { state: true }]], extraLights: opts.lights || [] });
    return { hol, ali };
  };
  const wellP = (st) => [['well', -50, 10, 1, { state: st ? 'woken' : 'hollow' }]];
  const POIS = [
    ['well', 'GREY WELL (hold a ring ~4 s)', await mk('well', 'well', { hollowProps: [['well', 0, -26, 0.9, { state: 'hollow' }]], aliveProps: [['well', 0, -26, 0.9, { state: 'woken' }]], u: 1 })],
    ['lamp', 'LANTERN SHRINE (touch to light)', await mk('lamp', 'lamp', { hollowProps: [['lamp', -70, -56, 1, { lit: false }], ['lamp', 10, -30, 1, { lit: false }], ['lamp', 80, -62, 1, { lit: false }]], aliveProps: [['lamp', -70, -56, 1, { lit: true }], ['lamp', 10, -30, 1, { lit: true }], ['lamp', 80, -62, 1, { lit: true }]] })],
    ['den', 'WOLF DEN (pups wake, trot off)', await mk('den', 'den', { hollowProps: [['den', 0, -20, 1, { state: false }]], aliveProps: [['den', 0, -20, 1, { state: true }]] })],
    ['nest', 'HOLLOW NEST (kill to stop a stream)', await mk('nest', 'nest', { K: 'B', hollowProps: [['nest', 0, -30, 1, {}]], aliveProps: [['nest', 0, -30, 1, { state: true }]] })],
    ['grove', 'DEAD GROVE (stand 6 s, pick a boon)', await mk('grove', 'grove', { K: 'B', hollowProps: [['grove', 0, -14, 0.92, { state: false }]], aliveProps: [['grove', 0, -14, 0.92, { state: true }]] })],
    ['chapel', 'RUINED CHAPEL (from afar, 42%)', await mk('chapel', 'chapel', { u: 0.42, fogA: 0.3, hollowProps: [['chapel', 0, -26, 1, { state: false }]], aliveProps: [['chapel', 0, -26, 1, { state: true }]] })],
  ];
  begin(); use(STYLES.S1);
  let b = '';
  // map
  b += card(8, 96, 372, 460, 'CHAPTER 1 MAP: 4000 x 4000', 'N up');
  const mx = 20, my = 128, ms = 348, k = ms / 4000;
  const zone = [['NW DEAD GROVE', 'B'], ['N MEADOW RUN', 'A'], ['NE ROOT THICKET', 'B'], ['W MOSSY HOLLOW', 'A'], ['CENTRE: START', 'A'], ['E OLD ROAD', 'A'], ['SW GRAVES / MIRE', 'B'], ['S MEADOW', 'A'], ['SE CHAPEL', 'A']];
  zone.forEach(([n, K], i) => { const zx = mx + (i % 3) * ms / 3, zy = my + Math.floor(i / 3) * ms / 3; b += `<rect x="${zx}" y="${zy}" width="${ms / 3}" height="${ms / 3}" fill="${K === 'A' ? '#4f7a4a' : '#2f3b4c'}" opacity=".55" stroke="#07090d" stroke-opacity=".6"/>` + T(n, zx + 4, zy + 11, { s: 7.6, c: '#e8edf3', w: 800 }); });
  b += `<rect x="${mx}" y="${my}" width="${ms}" height="${ms}" fill="none" stroke="#6a7684" stroke-width="6" stroke-dasharray="3 3" opacity=".8"/>` + T('dead-tree wall + fog (no POIs within 250)', mx + ms / 2, my + ms + 12, { s: 8.4, c: '#9fb0c2', a: 'middle', w: 600 });
  const P = (x, y) => [mx + x * k, my + y * k];
  const route = [[2000, 2000], [2300, 1900], [2800, 2100], [3200, 2500], [3500, 3300]];
  b += `<path d="${route.map((q, i) => `${i ? 'L' : 'M'}${P(...q).join(' ')}`).join(' ')}" fill="none" stroke="#cdb98e" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" opacity=".85"/>` + T('worn path', mx + 224, my + 232, { s: 8.2, c: '#ffe3a6', w: 700 });
  const mk2 = (t, x, y, c, ch) => { const [px, py] = P(x, y); return `<circle cx="${px}" cy="${py}" r="9" fill="${c}" stroke="#07090d" stroke-width="1.6"/>${T(ch, px, py + 3.4, { s: 9.4, a: 'middle', c: '#07090d', w: 900 })}`; };
  const L = [['W', 'Grey Well', 2000, 2900, '#ffe3a6'], ['W', 'w', 700, 1800, '#ffe3a6'], ['W', 'w', 1400, 3200, '#ffe3a6'], ['L', 'l', 2500, 1900, '#ffc45a'], ['L', 'l', 2900, 2150, '#ffc45a'], ['L', 'l', 3150, 2450, '#ffc45a'], ['D', 'den', 1900, 700, '#f3e7cf'], ['D', 'den', 700, 3300, '#f3e7cf'], ['N', 'nest', 3300, 700, '#8a7ab8'], ['N', 'nest', 600, 600, '#8a7ab8'], ['G', 'grove', 1000, 900, '#bfe0a8'], ['G', 'grove', 3400, 1300, '#bfe0a8'], ['C', 'chapel', 3500, 3300, '#ffd98a'], ['F', 'firefly', 2000, 3500, '#fff3c8'], ['F', 'f', 1400, 400, '#fff3c8']];
  L.forEach(([ch, , x, y, c]) => { b += mk2('', x, y, c, ch); });
  const [sx, sy] = P(2000, 2000); b += `<circle cx="${sx}" cy="${sy}" r="14" fill="none" stroke="#ffc45a" stroke-width="2.4"/>` + T('START', sx - 8, sy - 17, { s: 8.6, a: 'middle', c: '#ffd98a', w: 900 });
  b += lines(18, 500, [[`W well  L lantern  D den  N nest  G grove`, '#ffd98a'], 'C chapel  F firefly swarm. About 16 POIs; 4-5 within 500-900', 'of the start. Green zones = Take A ground, slate zones = Take B.'], { lh: 12, s: 8.8, c: '#c9d3df' });
  b += lines(18, 540, [], {});
  // POI cards
  POIS.forEach(([id, title, { hol, ali }], i) => {
    const x = 388 + (i % 3) * 296, y = 96 + Math.floor(i / 3) * 232;
    b += `<rect x="${x}" y="${y}" width="288" height="224" rx="10" fill="#161e29" stroke="#3a4757"/>` + T(title, x + 8, y + 15, { s: 9, f: FONT.title, w: 900, c: '#ffd98a' });
    b += crop(hol.src, 296, 206, 0, 0, 148, 206, x + 4, y + 20, 140, 198, false);
    b += crop(ali.src, 296, 206, 148, 0, 148, 206, x + 144, y + 20, 140, 198, false);
    b += `<path d="M${x + 144} ${y + 20} v198" stroke="#ffd88a" stroke-width="1.6" stroke-dasharray="2 4" opacity=".9"/>`;
    b += T('Hollow', x + 8, y + 212, { s: 8.6, c: '#c0cad6', w: 700 }) + T('restored / cleared', x + 280, y + 212, { s: 8.6, c: '#b8e47e', a: 'end', w: 700 });
  });
  b += `<rect x="388" y="564" width="884" height="148" rx="12" fill="#161e29" stroke="#3a4757"/><rect x="8" y="564" width="372" height="148" rx="12" fill="#161e29" stroke="#3a4757"/>`;
  b += lines(398, 584, [
    ['HOW POIs READ (all visual here; rewards and rules are the locked phased plan, research 30)', '#ffd98a'],
    'Seen from far: the chapel spire (400 px at true size) and one huge dead tree stand above the fog line, so there is always a place to walk toward.',
    'A POI is a ground-level set piece plus a ring decal (dashed) and an arc that fills while you hold it. Cleared = Hollow-to-colour flood + a small lasting glow.',
    'Enemy things (nest, grove ring) glow COLD and sit on corruption; friendly things glow warm. No gold: gold stays for evolutions/dawn.',
    'Phone: edge arrows + the ring decal carry it; POI art is 60-110 px wide, so the whole POI shows in a phone view. A worn path joins start, wells, lanterns and chapel.',
  ], { lh: 16.5, s: 10 });
  b += lines(18, 584, [['EDGE OF THE WORLD', '#ffd98a'], 'Hard clamp already exists. The edge is a', 'wall of dead pillars, heavier vignette and', 'low fog so nobody pushes an invisible wall.', 'Zones swap ground set A/B: meadow vs grove.'], { lh: 15, s: 9.8 });
  return page(b + banner('WHERE THE POINTS OF INTEREST SIT', 'Visual only: a 3x3 zone layout (authored zones, seeded landmark slots), a worn path, and six POI types shown Hollow | restored at true size (chapel at 42%).'));
}

// ---------- 7 actual size, per take ----------
export async function actual(ctx, K, tag) {
  const D = await frame(ctx, K, 'night'), Pn = await frame(ctx, K, 'night', 'phone');
  const Dp = await frame(ctx, K, 'dawn');
  begin(); use(STYLES.S1);
  const [hx, hy] = HERO_DESK;
  let b = '';
  b += card(8, 96, 636, 300, 'DESKTOP 1280x720, 1:1 pixels (night)', 'Wren 60 px, Elias 75 px');
  b += crop(D.src, 1280, 720, hx - 310, hy - 160, 620, 262, 16, 126, 620, 262, false);
  b += card(654, 96, 406, 300, 'PHONE 390x844 @DPR2, CSS size (night)', 'Wren about 44 px');
  b += crop(Pn.src, 780, 1688, 0, 2 * (HERO_PHONE[1] - 118), 780, 524, 662, 126, 390, 262, false);
  b += card(1070, 96, 202, 300, 'DAWN, same spot', '');
  b += crop(Dp.src, 1280, 720, hx - 100, hy - 170, 200, 262, 1074, 126, 194, 262, false);
  b += card(8, 404, 380, 308, 'HERO ZONE 2.8x (pixels)', 'light pool, rim, trail');
  b += crop(D.src, 1280, 720, hx - 70, hy - 72, 128, 92, 18, 432, 360, 258);
  b += card(396, 404, 440, 308, 'PHONE HERO ZONE (device pixels)', '');
  b += crop(Pn.src, 780, 1688, 2 * HERO_PHONE[0] - 122, 2 * HERO_PHONE[1] - 116, 196, 126, 406, 432, 420, 270);
  b += card(844, 404, 428, 308, 'HONEST NOTE');
  const notes = K === 'A'
    ? [['SURVIVES (60px desktop)', '#7fd68a'], 'Hero pair stays the brightest, warmest thing on screen: lantern', 'pool + light ring on the ground. The restored lawn is the lightest', 'surface, so pale Wren/Elias separate from it by their dark backing.', ['SURVIVES (44px phone)', '#7fd68a'], 'Pool + rim read at once; trees/bushes are big shapes, not noise.', ['WATCH', '#ff9a8a'], 'Flower specks near the hero add noise under 40 px wolves. Build', 'rule: keep flower drifts out of ~60 px around the hero.', 'Night is the real ARC lifted +14%; unlifted it is too dark.', 'Frame is a TEST: you play ONE hero, not both.']
    : [['SURVIVES (60px desktop)', '#7fd68a'], 'Pillars frame the hero; the warm pool is the only light. Cream', 'wolves pop against the dark floor (better than A).', ['SURVIVES (44px phone)', '#7fd68a'], 'Fewer pillars needed on a phone; the dark floor keeps the pool loud.', ['WATCH', '#ff9a8a'], 'Fell Wolves (cold grey) lose contrast on the dark floor: needs the', 'enemy rim light (A1 rule) and corruption must stay ink-black, not', 'lighter than the floor. Leaf litter is busy at 40 px: thin it.', 'Frame is a TEST: you play ONE hero, not both.'];
  b += lines(858, 446, notes, { lh: 15, s: 9.9 });
  return { html: page(b + banner(`ACTUAL SIZE: TAKE ${K} (${tag})`, 'Real renders in the shared battle frame: 1:1, 2.8x pixels, phone, and the same spot at dawn.')), D, Pn };
}

// ---------- 8 build / perf ----------
export async function build(ctx) {
  begin(); use(STYLES.S1);
  let b = '';
  b += card(8, 96, 520, 616, 'RENDER STACK (back to front)', 'maps to RunScene depths');
  const L = [['Ground (1 draw): Hollow tile + Restored tile + 256x256 life tex, noisy blend + rim + veins', '#4f7a4a', 'NEW: replaces the plain tileSprite; Low = Hollow tile only'], ['Ground decals: paths, ring decals, shadow blobs, flower/stone sprites (pooled)', '#6a8a5a', 'few dozen; baked into tile where possible'], ['Trunks + low props (sprite atlas, y-sorted with creatures)', '#7a6a58', 'cull to camera + margin, <= 120 live'], ['Crowns / snag branches (depth BELOW every creature)', '#5f9a58', 'never occlude play'], ['Enemies (world)', '#6a5f78', 'unchanged'], ['LIGHTMAP multiply (ARC ambient + light stamps)', '#8a7ab8', 'existing src/gfx/lightmap.js, unchanged'], ['Halos + lit sprites: heroes, spirits, gems', '#ffc45a', 'unchanged'], ['Trails/ribbons, particles, sprout sparkles', '#ffe3a6', 'existing pools'], ['Fog banks + fireflies (colour by life)', '#7aa0c0', 'existing buildAmbient(), tint only'], ['Dawn flood + vignette', '#ffd8a0', 'existing dawn + vignette']];
  L.forEach(([t, c, n], i) => { const y = 124 + i * 55; b += `<rect x="20" y="${y}" width="496" height="48" rx="8" fill="${c}" opacity=".35" stroke="${c}"/>` + T(`${i + 1}  ${t.split(':')[0].split('(')[0]}`, 30, y + 17, { s: 10, c: '#fff', w: 800 }) + T(t.includes(':') ? t.split(':').slice(1).join(':').trim() : '', 30, y + 31, { s: 8.6, c: '#d3dce6', w: 500 }) + T(n, 30, y + 43, { s: 8.4, c: '#ffd98a', w: 700 }); });
  b += card(536, 96, 736, 330, 'PERF BUDGET AND RISKS (honest)', 'Low tier must not regress');
  b += lines(548, 146, [
    ['COST (OPINION, to be proved by chunk W0 on a throttled phone)', '#ffd98a'],
    'Ground: 1 draw (was 1). Life texture: 256x256 RGBA = 256 KB per upload, at 10 Hz about 2.6 MB/s (trivial; dirty-rect upload possible). Props: <= 120 sprites on ONE atlas (batches to 1-2 calls). Total stays well inside 25 calls / 600 sprites.',
    ['RISKS', '#ff9a8a'],
    '1. The ground blend needs a custom fragment shader (Phaser 3.90 pipeline; UNPROVEN in this repo, no custom pipeline exists yet: that is chunk W0). Fallback if it fails or on Low: Hollow tile + warm pool sprites only (today\'s look).',
    '2. TileSprite and big textures have had mobile WebGL bugs: keep the tile <= 1024 and the life texture 256, never a world-sized texture.',
    '3. Life + corruption persist the whole run (CPU arrays, 128 KB) so trails/wells stay painted; decay must not stall at 8-bit alpha (do it in the CPU array, not on the GPU).',
    '4. Prop swap Hollow <-> restored: sample the CPU mirror every ~0.5 s staggered, not per frame. One atlas, two frames per prop, no extra textures.',
    '5. Dusk-to-dawn: ground tiles authored at FULL daylight (the multiply darkens them); the ARC night keyframes are too dark for the brighter tile (mock lifts +14%).',
    '6. Fireflies tint by life = a sample per firefly (24 max). Fine. More fog banks or more fireflies would cost fill rate on phones: caps stay.',
  ], { lh: 14, s: 9.6, wrap: 128 });
  b += card(536, 434, 736, 278, 'RECOMMENDED BUILD CHUNKS (small)', 'each shown to Matt before the next');
  b += lines(548, 480, [
    ['W0  Spike: life-texture + blend shader on Low/Med/High; prove >= 55 fps on a throttled phone.', '#ffd98a'],
    ['W1  Ground v1: Hollow + restored tiles (take chosen), hero lantern adds life, rim, veins. Tests + shots.', '#e8edf3'],
    ['W2  Trails: spirits/scarf paint life; decay; ribbon visuals; Low fallback.', '#e8edf3'],
    ['W3  Corruption: enemies add veins; light burns them; sparks. Tests (pure JS life map).', '#e8edf3'],
    ['W4  Props v1: oak/snag/bush/stump/boulder/log atlas, Hollow+restored, crowns under creatures.', '#e8edf3'],
    ['W5  Air: fog by zone, fireflies colour by life, edge wall + vignette.', '#e8edf3'],
    ['W6  Arc retune: lifted ARC keyframes + dawn colour flood from the edge.', '#e8edf3'],
    ['W7  Zones: 3x3 authored layout, seeded landmark slots (feeds the map-events phases).', '#e8edf3'],
    ['W8  POI art: well, lanterns, den, nest, grove, chapel (with their locked phases).', '#e8edf3'],
    'Every chunk: tests green, sweeps byte-identical (visual only), screenshots at 640x360 + phone, Low-tier fps check.',
  ], { lh: 17, s: 9.8 });
  return page(b + banner('HOW IT BUILDS ON WHAT ALREADY EXISTS', 'Uses the existing lightmap, ARC palette, fog/fireflies and pooled sprites. One new thing: the life map + ground blend. No new dependencies.'));
}
