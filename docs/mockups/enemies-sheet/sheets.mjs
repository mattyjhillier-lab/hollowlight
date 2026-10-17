// Enemies sheet #4 page builders (static SVG -> PNG via ../wren-sheet/render.mjs). Mock-ups only.
import { begin, use, T, FONT, glow } from '../style-lab/lab.mjs';
import { STYLES } from '../style-lab/scene.mjs';
import { svgPage } from '../wren-sheet/common.mjs';
import { enemyDefs, posed, fellWolf, graveCrow, rootCrawler, thornspitter, blightbulb, hart, miniboss, chest, bloom, thorn, ROSTER, TELE, eyeP } from './enemies.mjs';

export const DESK_K = 2.34 / 4; // css px per du on desktop 1280x720 (camera zoom 2.34 px per world unit, 4 du per unit)
export const PHONE_K = 1.3 / 4; // css px per du on phone landscape 844x390 (zoom 2.6 device px @DPR2)
const f = (n) => (+n).toFixed(1);
export const start = () => { begin(); use(STYLES.S1); enemyDefs(); };
const bgPage = (w, h) => `<rect width="${w}" height="${h}" fill="#10161f"/>`;
export const head = (title, sub, w) => `<rect x="0" y="0" width="${w}" height="64" fill="#0b1016"/>${T(title, 20, 30, { s: 22, f: FONT.title, w: 900, c: '#ffd98a', ls: 1 })}${T(sub, 20, 52, { s: 12.5, c: '#aab6c4', w: 500 })}`;
const lines = (arr, x, y, o = {}) => arr.map((l, i) => T(l, x, y + i * (o.lh || 14), { s: o.s || 11.5, c: o.c || '#c9d3df', w: o.w || 500 })).join('');
// ground tiles: day (grey Hollow + a little restored) and night (deep dusk), drawn simply; the in-world pages use REAL build plates
const tile = (x, y, w, h, night) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="${night ? '#141a2c' : '#5d6878'}"/><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" filter="url(#mottle)" opacity="${night ? 0.25 : 0.45}"/>`;
const at = (x, y, k, svg) => `<g transform="translate(${f(x)},${f(y)}) scale(${k.toFixed(4)})">${svg}</g>`;
const draw = (fn, opt, st, light, x, y, k) => { const p = posed(fn, opt, st, light); return at(x, y, k, p.body) + at(x, y, k, p.eyes); };

// ---- option card: big drawing (day) + night big + true size desktop/phone (day + night) + black silhouette + text
function optCard(x, y, w, h, fn, opt, label, rec, text, bigK = 1.5, extra = '') {
  let o = `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12" fill="${rec ? '#18222c' : '#141b24'}" stroke="${rec ? '#7fd68a' : '#334152'}" stroke-width="${rec ? 2 : 1}"/>`;
  o += T(`${opt}${rec ? ' (Recommended)' : ''}: ${label}`, x + 12, y + 22, { s: 14, f: FONT.title, w: 900, c: rec ? '#9ff0a8' : '#ffd98a' });
  o += lines(text, x + 12, y + 40, { s: 11, lh: 13.5 });
  const gy = y + h - 22;
  o += tile(x + 10, y + 72, 190, h - 84, false) + tile(x + 206, y + 72, 120, h - 84, true);
  o += draw(fn, opt, { ph: 0.15 }, 'day', x + 105, gy, bigK) + extra;
  o += draw(fn, opt, { ph: 0.15 }, 'night', x + 266, gy, bigK * 0.62);
  o += T('day / night', x + 14, y + 86, { s: 9.5, c: '#e8edf3', w: 700 });
  // true sizes
  const tx = x + 334, tw = w - 344;
  o += tile(tx, y + 72, tw, (h - 84) / 2 - 3, false) + tile(tx, y + 72 + (h - 84) / 2 + 3, tw, (h - 84) / 2 - 3, true);
  const th = (h - 84) / 2 - 3, clipT = (yy, s) => `<svg x="${tx}" y="${yy}" width="${tw}" height="${th}" viewBox="${tx} ${yy} ${tw} ${th}" overflow="hidden">${s}</svg>`;
  o += clipT(y + 72, draw(fn, opt, { ph: 0.15 }, 'day', tx + tw * 0.3, y + 72 + th - 10, DESK_K) + draw(fn, opt, { ph: 0.15 }, 'day', tx + tw * 0.72, y + 72 + th - 10, PHONE_K));
  o += clipT(y + 78 + th, draw(fn, opt, { ph: 0.15 }, 'night', tx + tw * 0.3, y + h - 22, DESK_K) + draw(fn, opt, { ph: 0.15 }, 'night', tx + tw * 0.72, y + h - 22, PHONE_K));
  o += T('desk 1:1', tx + 4, y + 84, { s: 9, c: '#e8edf3' }) + T('phone', tx + tw * 0.6, y + 84, { s: 9, c: '#e8edf3' });
  o += draw(fn, opt, { ph: 0.15 }, 'sil', x + w - 34, y + 34, 0.32);
  return o;
}

export const OPTS = {
  wolf: [['A', 'Hackled Hollow', ['Lean starving wedge, head low and long; ash hackle', 'ridge RISES on the 0.55 s lunge tell. Twitchy lope.']],
    ['B', 'Bark-Backed Wolf', ['Heavier; dead branches grow from its spine.', 'Reads "forest", but busier and close to crawler.']],
    ['C', 'Shade Wolf', ['Front solid, rear dissolves into ink wisps.', 'Eerie, but translucent = like YOUR ghost wolves.']]],
  crow: [['A', 'Ash Crow', ['Ragged V, wings too long, 2-beat flap then a stall,', 'sheds ash flakes; ONE big eye. Dark beak stub.']],
    ['B', 'Murmur', ['Arrives as a tight swirl of five small crows', '(one enemy, five bodies). Strong read, 5x sprites.']],
    ['C', 'Rag Crow', ['Torn black cloth on the wind, ribbon tail.', 'Spooky; drifts toward chapter 7 scarecrow tone.']]],
  root: [['A', 'Knot Crawler', ['Wide knotted dome on six root legs that PLANT', 'and pull (lurch, pause); wide eyes in a dark cleft.']],
    ['B', 'Stump Crawler', ['An old stump walking on roots, eyes in a knot-hole.', 'Clear, but looks like the W4 stump props.']],
    ['C', 'Tangle Spider', ['Small body slung high on six long arched legs.', 'Fast-looking, creepy; too scary for the tone?']]],
  spit: [['A', 'Thornspitter', ['Dead sapling, bone-pale seed bulb. Roots at range,', 'bulb swells with ember 0.7 s, spits ONE slow thorn.']],
    ['B', 'Spore Puffer', ['Grey mushroom lobs a spore ball onto a marked', 'ground circle (1.0 s). Overlaps the Blightbulb.']],
    ['C', 'Needle Fir', ['Small dead fir fires a fan of three needles', 'every 3 s; you slip between. Busier to read.']]],
  bulb: [['A', 'Blightbulb', ['Pallid puffball on stubby legs; plants, pulses', 'faster while a ring fills (1.0 s), bursts. Kill = fizzle.']],
    ['B', 'Mire Slug', ['Low ink slug; its trail hurts to stand in for 3 s.', 'Shapes paths; more perf (trail points).']],
    ['C', 'Seedpod', ['Pod that splits on death into six tiny fast', 'seedlings (splitter). Swarm filler, no new tell.']]],
  hart: [['A', 'Bramble Hart', ['HEAVY CHARGER. Stag with briar antlers 2x its head:', 'head down + hoof scrape 0.8 s line, long charge.']],
    ['B', 'Moss Mourner', ['SUPPORT. Hooded moss lump behind packs; wards', 'up to 3 allies. Weak in an auto-aim game.']],
    ['C', 'Seed Mother', ['SPAWNER. Walking seed husk plants sprouts that', 'grow into crawlers unless you stomp them.']]],
  alpha: [['A', 'Grey Alpha', ['2x Fell Wolf, mane of dead branches, amber eyes.', 'HOWL calls the pack; 0.7 s LINE CHARGE. Animal/lines.']],
    ['B', 'Briar Mother', ['Walking briar thicket, doorway mouth; root PULSE', 'circles, drops Blightbulbs. Steals Treant circles.']],
    ['C', 'Pale Hart King', ['Giant hart with a dead crown; charges leave', 'bramble walls. Only works if the Hart is picked.']]],
};
const FN = { wolf: fellWolf, crow: graveCrow, root: rootCrawler, spit: thornspitter, bulb: blightbulb, hart, alpha: miniboss };
const BIGK = { wolf: 1.45, crow: 1.6, root: 1.15, spit: 1.0, bulb: 1.4, hart: 0.68, alpha: 0.5 };

export function optionsPage(keys, title, sub) {
  start();
  const W = 1700, cw = 556, ch = 236, rows = keys.length;
  let b = bgPage(W, 80 + rows * (ch + 30)) + head(title, sub, W);
  keys.forEach((k, r) => {
    const y = 76 + r * (ch + 30);
    b += T(ROSTER[k].name.toUpperCase() + (k === 'alpha' ? ' (MINIBOSS)' : ''), 20, y + 12, { s: 13, w: 900, c: '#e8edf3', ls: 2 });
    OPTS[k].forEach(([opt, label, text], i) => { b += optCard(14 + i * (cw + 8), y + 20, cw, ch, FN[k], opt, label, i === 0, text, BIGK[k]); });
  });
  return svgPage(W, 80 + rows * (ch + 30), b);
}

// ---- animation strips for the recommended picks: walk x4, tell, attack, hurt, death x2, corruption bloom
export function animPage() {
  start();
  const keys = ['wolf', 'crow', 'root', 'spit', 'bulb', 'hart', 'alpha'];
  const W = 1700, rh = 150, H = 104 + keys.length * rh;
  let b = bgPage(W, H) + head('ANIMATION + PERSONALITY (recommended picks, A each)', 'Code-driven rig beats (transforms only): walk 4 frames, telegraph, attack, hurt (white flash + squash), death (sink + ash + cream spark), corruption bloom at the feet. Red-orange = danger tell only.', W);
  const cols = ['walk 1', 'walk 2', 'walk 3', 'walk 4', 'TELL', 'attack', 'hurt', 'death 1', 'death 2', 'bloom (W3 ink)'];
  const cx0 = 250, cwid = 140;
  cols.forEach((c, i) => { b += T(c, cx0 + i * cwid + cwid / 2, 80, { s: 11, c: i === 4 ? '#ff9a7a' : '#aab6c4', a: 'middle', w: 800 }); });
  const PERS = {
    wolf: ['FELL WOLF: twitchy, starving lope', 'all heads snap to you at once; hackles', 'rise on the tell; tail stays straight'],
    crow: ['GRAVE CROW: jerky, never glides', '2 quick beats then a stall; head tilts;', 'zig-zag in; ash falls behind'],
    root: ['ROOT CRAWLER: heavy, creaky, inevitable', 'legs plant then the dome pulls forward', '(lurch-pause); roots drive into soil'],
    spit: ['THORNSPITTER: rigid; roots in place,', 'bulb swells + glows ember (0.7 s),', 'rocks back on recoil, slow thorn'],
    bulb: ['BLIGHTBULB: waddles, wobbles, panting;', 'plants, pulse speeds up, ring fills', '1.0 s, bursts (killed early = fizzle)'],
    hart: ['BRAMBLE HART: proud and still, then', 'explosive; head down + hoof scrape', '0.8 s, straight charge, bramble scar'],
    alpha: ['GREY ALPHA (miniboss): commanding,', 'deliberate; HOWL (calls pack, vein ring)', 'and 0.7 s LINE CHARGE; never feared'],
  };
  const K = { wolf: 0.85, crow: 0.95, root: 0.75, spit: 0.72, bulb: 0.9, hart: 0.58, alpha: 0.42 };
  keys.forEach((k, r) => {
    const y = 96 + r * rh, gy = y + rh - 24, fn = FN[k], kk = K[k];
    b += `<rect x="10" y="${y}" width="${W - 20}" height="${rh - 8}" rx="10" fill="${r % 2 ? '#141b24' : '#17202b'}"/>`;
    b += lines(PERS[k], 20, y + 26, { s: 11.5, lh: 15 });
    for (let i = 0; i < 4; i++) b += draw(fn, 'A', { ph: i / 4 }, 'day', cx0 + i * cwid + 70, gy, kk);
    // tell
    const tx = cx0 + 4 * cwid + 70;
    if (k === 'wolf' || k === 'hart' || k === 'alpha') b += `<path d="M${tx + 10} ${gy - 4} L${tx + 66} ${gy - 4}" stroke="${TELE}" stroke-width="3" stroke-dasharray="6 4" opacity=".9"/><path d="M${tx + 66} ${gy - 9} l8 5 l-8 5Z" fill="${TELE}"/>`;
    if (k === 'bulb') b += `<ellipse cx="${tx}" cy="${gy}" rx="58" ry="17" fill="${TELE}" opacity=".16"/><ellipse cx="${tx}" cy="${gy}" rx="58" ry="17" fill="none" stroke="${TELE}" stroke-width="2"/><ellipse cx="${tx}" cy="${gy}" rx="38" ry="11" fill="none" stroke="${TELE}" stroke-width="1.4" opacity=".7"/>`;
    b += draw(fn, 'A', { ph: 0, tele: 1, howl: k === 'alpha' ? 1 : 0 }, 'day', tx, gy, kk);
    // attack
    const ax = cx0 + 5 * cwid + 70;
    b += draw(fn, 'A', { ph: 0.1, act: 1 }, 'day', ax - 10, gy, kk);
    if (k === 'spit') b += at(ax + 40, gy - 60, 0.9, thorn());
    if (k === 'bulb') b += `<ellipse cx="${ax}" cy="${gy}" rx="58" ry="17" fill="#e8dcc8" opacity=".35"/>` + bloom('bulb', 'A', 0.6, 2).replace(/^/, `<g transform="translate(${ax},${gy}) scale(.5)">`) + '</g>';
    if (k === 'crow') b += `<path d="M${ax - 40} ${gy - 46} q20 30 40 20" stroke="#8d8a9e" stroke-width="1.5" fill="none" stroke-dasharray="3 3"/>`;
    b += draw(fn, 'A', { ph: 0.1, hurt: 1 }, 'day', cx0 + 6 * cwid + 70, gy, kk);
    b += draw(fn, 'A', { ph: 0.1, die: 0.35 }, 'day', cx0 + 7 * cwid + 70, gy, kk);
    b += draw(fn, 'A', { ph: 0.1, die: 0.8 }, 'day', cx0 + 8 * cwid + 70, gy, kk);
    b += `<g transform="translate(${cx0 + 9 * cwid + 70},${gy}) scale(${(kk * 0.9).toFixed(2)})"><rect x="-120" y="-40" width="240" height="60" fill="#5d6878" opacity="0"/>${bloom(ROSTER[k].kind, 'A', 1, r + 1)}</g>`;
    b += draw(fn, 'A', { ph: 0.3 }, 'day', cx0 + 9 * cwid + 70, gy - 2, kk * 0.75);
  });
  return svgPage(W, H, b);
}

// ---- night: the eye constellation per type (the night identity system)
export function nightPage() {
  start();
  const W = 1700, H = 760;
  let b = bgPage(W, H) + head('NIGHT READ: EYE CONSTELLATIONS (each type has its own eye count, spacing, height and motion)', 'Dark start (0:00-3:00): far enemies are a dimmed cold silhouette (rim 0.30, body V 0.34) plus eyes ABOVE the vignette. You name the type from the eyes alone.', W);
  b += `<rect x="10" y="76" width="${W - 20}" height="${H - 86}" rx="12" fill="#0d1220"/><rect x="10" y="76" width="${W - 20}" height="${H - 86}" rx="12" filter="url(#mottle)" opacity=".2"/>`;
  const keys = ['wolf', 'crow', 'root', 'spit', 'bulb', 'hart', 'alpha'];
  const READ = {
    wolf: ['2 eyes, close, LOW and forward', 'bob together; packs = rows of pairs'],
    crow: ['1 big eye, HIGH (hovering)', 'zig-zags; boosted +20% size'],
    root: ['2 eyes WIDE apart, low', 'slow lurch-pause'],
    spit: ['1 eye, very HIGH (tall stick)', 'never moves while rooted; bulb glows'],
    bulb: ['3 tiny eyes in a triangle', 'waddle wobble; glows on the fuse'],
    hart: ['2 eyes HIGH, swing down on tell', 'stillness then a streak'],
    alpha: ['2 big AMBER eyes (boss colour)', 'pale cool outline, always lit'],
  };
  const KB = { wolf: 1.2, crow: 1.3, root: 0.95, spit: 0.85, bulb: 1.15, hart: 0.62, alpha: 0.45 };
  keys.forEach((k, i) => {
    const x = 20 + i * 238, cx = x + 115;
    b += T(ROSTER[k].name, cx, 104, { s: 14, f: FONT.title, w: 900, c: '#ffd98a', a: 'middle' });
    b += draw(FN[k], 'A', { ph: 0.2 }, 'night', cx, 290, KB[k] * (k === 'alpha' ? 1 : 1));
    b += T('big, outside the lantern', cx, 316, { s: 10, c: '#8fa0b2', a: 'middle' });
    b += draw(FN[k], 'A', { ph: 0.2 }, 'lit', cx, 470, KB[k] * 0.8);
    b += `<ellipse cx="${cx}" cy="470" rx="80" ry="30" fill="url(#${'x'})" opacity="0"/>`;
    b += T('inside the pool (lit, eyes 0.5)', cx, 494, { s: 10, c: '#8fa0b2', a: 'middle' });
    // true size desktop + phone, eyes only + dim body
    b += draw(FN[k], 'A', { ph: 0.2 }, 'night', cx - 40, 590, DESK_K) + draw(FN[k], 'A', { ph: 0.2 }, 'night', cx + 50, 590, PHONE_K);
    b += T('desk 1:1   phone', cx, 612, { s: 10, c: '#8fa0b2', a: 'middle' });
    b += lines(READ[k], x + 10, 650, { s: 11.5, lh: 15, c: '#e8edf3' });
  });
  b += lines(['Rules kept from WL6b/b2: eyes = ember halo + cream core (colour-blind safe), caps 200/120/40 count ENEMIES, blink 0.12 s irregular, drift toward you, closing-in cue. New: per-type eye layout is DATA (count, spacing, height) in the rig definition.'], 20, H - 22, { s: 11.5, c: '#aab6c4' });
  // lit pool glow behind the lit row
  b = b.replace(`<rect x="10" y="76" width="${W - 20}"`, `${glow(850, 470, 900, 70, '#ffc96b', 0.18)}<rect x="10" y="76" width="${W - 20}"`);
  return svgPage(W, H, b);
}

// ---- miniboss + chest + corruption bloom options
export function extrasPage() {
  start();
  const W = 1700, H = 1010;
  let b = bgPage(W, H) + head('MINIBOSS, CHEST REWARDS, CORRUPTION BLOOM (three options each)', 'Miniboss and chest are timed beats; the chest is a WARM friendly object (cream-amber light, brass bands), never gold. Corruption stays W3 ink (never red), now shaped per type.', W);
  // miniboss row
  b += T('MINIBOSS (timed: 3:20 and 7:00, then 12:30 after the Treant)', 20, 92, { s: 13, w: 900, c: '#e8edf3', ls: 2 });
  OPTS.alpha.forEach(([opt, label, text], i) => { b += optCard(14 + i * 564, 102, 556, 236, miniboss, opt, label, i === 0, text, 0.5); });
  // chests
  const cy = 372;
  b += T('CHEST (dropped by the miniboss; walk onto it to open)', 20, cy, { s: 13, w: 900, c: '#e8edf3', ls: 2 });
  const CH = [['A', 'Lantern Reliquary tiers (inside the LOCK)', true, ['Small: XP burst + heal + gold (floor). Medium: Blessing', 'choice 1 of 3. Large: Blessing + 1 free stat rank (pick 1', 'of 3 owned-weapon stats; never names an evolution).']],
    ['B', 'Choice Chest (free premium level-up)', false, ['Opens into 3 level-up cards from your normal pool,', 'evolution-partner stats weighted up. Simple, uses', 'the card UI; reopens the locked chest contents.']],
    ['C', 'Seed of Colour (meta only)', false, ['A grey bud blooms: gold + 1 soul shard + heart.', 'Zero in-run power, zero balance risk; least exciting', 'in the run. Reopens the locked chest contents.']]];
  CH.forEach(([opt, label, rec, text], i) => {
    const x = 14 + i * 564, y = cy + 10;
    b += `<rect x="${x}" y="${y}" width="556" height="250" rx="12" fill="${rec ? '#18222c' : '#141b24'}" stroke="${rec ? '#7fd68a' : '#334152'}" stroke-width="${rec ? 2 : 1}"/>`;
    b += T(`${opt}${rec ? ' (Recommended)' : ''}: ${label}`, x + 12, y + 22, { s: 14, f: FONT.title, w: 900, c: rec ? '#9ff0a8' : '#ffd98a' });
    b += lines(text, x + 12, y + 40, { s: 11, lh: 13.5 });
    b += tile(x + 10, y + 86, 536, 154, true);
    b += glow(x + 278, y + 200, 260, 60, '#ffc96b', 0.25);
    const tiers = opt === 'A' ? [0, 1, 2] : [1, 1, 1];
    [0, 1, 2].forEach((j) => { const t = tiers[j], op = j === 2 ? 1 : j === 1 && opt !== 'A' ? 0.5 : 0; b += at(x + 100 + j * 175, y + 220, 1.25, chest(opt, t, op)); });
    b += T(opt === 'A' ? 'small        medium        large (open)' : 'closed           opening           open', x + 278, y + 236, { s: 10, c: '#c9d3df', a: 'middle' });
    b += at(x + 500, y + 236, DESK_K, chest(opt, opt === 'A' ? 1 : 1, 0)) + T('1:1', x + 520, y + 236, { s: 9, c: '#8fa0b2' });
  });
  // bloom options
  const by = 660;
  b += T('CORRUPTION BLOOM AT THE FEET (ties to W3 ink corruption; visual only)', 20, by, { s: 13, w: 900, c: '#e8edf3', ls: 2 });
  const BL = [['A', 'Footprint stamps per type', true, ['Each type stamps the W3 corruption channel in its own', 'shape (wolf paw trail, crow specks, crawler radial roots,', 'bulb splash, hart scar line) + max 1 tiny pooled decal.']],
    ['B', 'Uniform W3 pool (today)', false, ['Same soft ink pool under every type, only radius and', 'strength differ. Cheapest; a screenshot cannot tell', 'what was there.']],
    ['C', 'Growing vein decals', false, ['Each enemy grows animated vein sprites from its feet.', 'Richest look; most sprites (caps needed), busier', 'under a 240-enemy swarm.']]];
  BL.forEach(([opt, label, rec, text], i) => {
    const x = 14 + i * 564, y = by + 10;
    b += `<rect x="${x}" y="${y}" width="556" height="330" rx="12" fill="${rec ? '#18222c' : '#141b24'}" stroke="${rec ? '#7fd68a' : '#334152'}" stroke-width="${rec ? 2 : 1}"/>`;
    b += T(`${opt}${rec ? ' (Recommended)' : ''}: ${label}`, x + 12, y + 22, { s: 14, f: FONT.title, w: 900, c: rec ? '#9ff0a8' : '#ffd98a' });
    b += lines(text, x + 12, y + 40, { s: 11, lh: 13.5 });
    b += tile(x + 10, y + 86, 536, 234, false);
    const set = [['wolf', fellWolf, 0.7, 120, 170], ['root', rootCrawler, 0.6, 330, 170], ['crow', graveCrow, 0.8, 480, 160], ['bulb', blightbulb, 0.6, 140, 290], ['hart', hart, 0.42, 380, 290]];
    for (const [kind, fn, k, dx, dy] of set) { b += at(x + dx, y + dy, k, bloom(kind, opt, 1, 3)) + draw(fn, 'A', { ph: 0.2 }, 'day', x + dx, y + dy, k); }
  });
  return svgPage(W, H, b);
}

// ---- in-world composite on a REAL build plate (true size). cfg: list of [key, worldX, worldY (relative to hero feet), st, extra]
export function worldPage(plate, w, h, k, night, items, hud = '') {
  start();
  if (typeof hud === 'function') hud = hud();
  const cx = w / 2, cy = h / 2 + 22 * (k / DESK_K); // hero feet sit a little below centre
  let b = `<image href="${plate}" x="0" y="0" width="${w}" height="${h}"/>`;
  const R = 130; // lantern radius (world units)
  const sorted = [...items].sort((a, b2) => a[2] - b2[2]);
  let eyes = '';
  for (const [key, wx, wy, st = {}, flip, extra = ''] of sorted) {
    const x = cx + wx * 4 * k, y = cy + wy * 4 * k, d = Math.hypot(wx, wy);
    const lit = d < R * 0.75 ? 1 : d > R * 1.25 ? 0 : 1 - (d - R * 0.75) / (R * 0.5);
    const light = night ? (lit > 0.5 ? 'lit' : lit > 0.15 ? 'dusk' : 'night') : 'day';
    const p = posed(FN[key], 'A', st, light === 'lit' ? 'day' : light);
    const sx = flip ? -1 : 1;
    if (extra) b += `<g transform="translate(${f(x)},${f(y)}) scale(${(k * sx).toFixed(4)},${k.toFixed(4)})">${extra}</g>`;
    b += `<g transform="translate(${f(x)},${f(y)}) scale(${(k * sx).toFixed(4)},${k.toFixed(4)})">${p.body}</g>`;
    const ea = night ? (light === 'lit' ? 0.5 : 1) : 1;
    eyes += `<g opacity="${ea}" transform="translate(${f(x)},${f(y)}) scale(${(k * sx).toFixed(4)},${k.toFixed(4)})">${p.eyes}</g>`;
  }
  b += eyes + hud;
  return svgPage(w, h, b);
}
export { FN, bloom, thorn, chest, eyeP, TELE };
