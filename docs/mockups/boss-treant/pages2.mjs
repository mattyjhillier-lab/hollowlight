// Boss sheet #7: phases, arena, moves, fight frames, victory and defeat pages (mock-ups only, not game code).
import { resetAll, f, glow, mix, rng, circ } from '../enemies-art2/paint.mjs';
import { treantA, treantDeath, seedPod } from './treant.mjs';
import * as SC from './scenes.mjs';
import { T, para, page, put, DESK, PHONE } from './pages.mjs';

const FT = "Georgia,'Palatino Linotype',serif";
const header = (n, title, sub, right = '') => T(n + '  ' + title, 24, 40, { f: FT, s: 27, w: 700, c: '#ffe2a8' }) + T(sub, 24, 64, { s: 13.5, c: '#aab4c4' }) + (right ? T(right, 1576, 40, { s: 12.5, c: '#ffb84a', a: 'end' }) : '') + `<rect x="0" y="78" width="1600" height="2" fill="#2a3446"/>`;
const HD = [640, 382], HP = [422, 207]; // hero feet on the desktop / phone-landscape plates (px)
const W = (wx, wy, k = DESK, H = HD) => [H[0] + wx * k, H[1] + wy * k];
const boss = (st, x, y, k) => { const d = put(treantA(st), x, y, k / 4); return SC.bossPool(x, y, k) + d.b + d.e; };

// ================= 02 PHASES + TELLS + DEATH (Take A) =================
function phasesPage() {
  resetAll();
  let b = header('#7', 'ELDER TREANT (Take A): three phases, the tell poses, the death', 'Phase look carries the fight story: P1 Awakening (grey crown, memory-green) -> P2 Blight (cold veins, crown thins, crack widens) -> P3 Wrath (bare branches, chest glows cold). Tells are POSES first, decals second.', 'Big = 0.62 css px per du');
  const stg = (x, y, w, h) => `<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="${x} ${y} ${w} ${h}"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="#1d2433"/><rect x="${x}" y="${y + h * 0.8}" width="${w}" height="${h * 0.2}" fill="#4a5064"/><rect x="${x}" y="${y + h * 0.8}" width="${w}" height="${h * 0.2}" filter="url(#mottle)" opacity=".4"/></svg>`;
  const row1 = [['P1 AWAKENING 100-66%', { ph: 1 }], ['P2 BLIGHT 66-33%', { ph: 2 }], ['P3 WRATH 33-0%', { ph: 3 }]];
  row1.forEach(([lab, st], i) => { const x = 20 + i * 255, y = 96; b += stg(x, y, 245, 300); const d = put(treantA(st), x + 122, y + 286, 0.6); b += d.b + d.e + T(lab, x + 10, y + 20, { s: 12, w: 800, c: '#ffd98a' }); });
  const tells = [['TELL: BARK SLAM (arms up 0.9 s)', { ph: 1, tele: 'slam' }], ['TELL: VINE SWEEP (arm back 1.0 s)', { ph: 2, tele: 'sweep' }], ['TELL: THORN VOLLEY (chest flares 0.7 s)', { ph: 3, tele: 'thorn' }]];
  tells.forEach(([lab, st], i) => { const x = 795 + i * 262, y = 96; b += stg(x, y, 252, 300); const d = put(treantA(st), x + 126, y + 286, 0.6); b += d.b + d.e + T(lab, x + 10, y + 20, { s: 11.5, w: 800, c: '#ffb08a' }); });
  // death strip
  b += T('DEATH (victory beat, 0.0 -> 3.5 s): kneels, the First Husk mask cracks and FALLS OFF (the Husk rule), living heartwood underneath, one green leaf from the chest, colour runs down into the ground', 24, 430, { s: 13, w: 700, c: '#ffe2a8' });
  [0, 0.3, 0.5, 0.7, 0.85, 1].forEach((k, i) => { const x = 20 + i * 262, y = 442; b += stg(x, y, 252, 300); const d = put(treantDeath({ k }), x + 126, y + 286, 0.6); b += d.b + d.e + T(['0.0 s killing blow (hit-stop)', '0.6 s kneel', '1.2 s mask cracks', '1.8 s mask falls', '2.6 s leaf + colour runs', '3.5 s at rest (restored)'][i], x + 10, y + 20, { s: 11.5, w: 700, c: '#cfe6c0' }); });
  // adds + notes
  b += T('ADDS the boss makes (Seed Toss): pod lands (tell ring 1.1 s) -> sapling Husk (tiny bark mask, 2 red-orange eye dots: an ordinary foe)', 24, 774, { s: 13, w: 700, c: '#ffe2a8' });
  [0, 0.3, 0.7, 1].forEach((g, i) => { const x = 20 + i * 130, y = 786; b += stg(x, y, 120, 110); const d = put(seedPod({ g }), x + 60, y + 96, 2.2); b += d.b + d.e; });
  const notes = ['Phase change = 1.0 s stagger (immune, no damage, a crack of light through the bark, shed bark drops ONE heart). Never heals, never resets HP.', 'Eyes: amber #ffb84a, baked socket + socket-shaped glow (no round balls); brighter only during a tell (x1.3), so the face itself is a tell.', 'Always fully lit (own light 90, never tinted by the arc). Red-orange stays on DECALS only; the boss body never turns red.', 'Bosses ignore fear / pin / shove (locked); Bleed / Burn / Mark apply; phase staggers are not control.'];
  let ny = 800; for (const n of notes) { const p = para('- ' + n, 560, ny, 140, { s: 12.5, w: 500, lh: 15 }); b += p.svg; ny += p.h + 6; }
  return page(1600, 1000, b);
}

// ================= 03 ARENA OPTIONS (top-down, to scale) =================
function arenaPage(plates) {
  resetAll();
  let b = header('#7', 'ARENA: three options, drawn to scale with the real view sizes', 'View in world units (camera zoomFor): desktop 1280x720 = 533 x 300; phone landscape 844x390 = 620 x 287; phone portrait 390x844 = 250 x 541. Hero speed Elias 76, Wren 106 u/s; boss 18-30 u/s.', 'Diagram scale 0.62 px per world unit');
  const opts = [
    ['A  ROOT RING (recommended)', 'circle r 230 (460 across); camera follows the hero, clamped so the view never shows more than 40 u past the wall; HARD wall (no damage, soft push-back), the Treant\'s own roots', 1, 230],
    ['B  OLD CLEARING, fixed camera', 'oval 520 x 290 that fits the whole desktop view; the camera stops following and frames the whole clearing (phone portrait must zoom out to 0.48x: tiny sprites)', 0, 0],
    ['C  THORN HEDGE, shrinking', 'circle r 300 -> 250 (P2) -> 200 (P3); edge = damaging hedge (4 dmg + shove back each touch); pressure built into the arena', 0, 300],
  ];
  const s = 0.62;
  opts.forEach(([title, txt, rec, R], i) => {
    const x0 = 16 + i * 528, y0 = 92, w = 512, h = 560, cx = x0 + w / 2, cy = y0 + 250;
    b += `<rect x="${x0}" y="${y0}" width="${w}" height="${h}" rx="12" fill="#151b26" stroke="${rec ? '#7fd49a' : '#2a3446'}" stroke-width="${rec ? 2.2 : 1.2}"/>` + T(title, x0 + 16, y0 + 28, { f: FT, s: 19, w: 700, c: '#ffe2a8' });
    b += `<rect x="${x0 + 10}" y="${y0 + 40}" width="${w - 20}" height="420" rx="8" fill="#22283a"/>`;
    if (i === 1) { b += `<ellipse cx="${cx}" cy="${cy}" rx="${260 * s}" ry="${145 * s}" fill="#3a4a3a" opacity=".55" stroke="#8a8496" stroke-width="5"/>`; }
    else if (i === 2) { for (const [r, a] of [[300, 0.9], [250, 0.6], [200, 0.45]]) b += `<circle cx="${cx}" cy="${cy}" r="${r * s}" fill="${r === 300 ? '#3a4a3a' : 'none'}" fill-opacity=".55" stroke="${r === 300 ? '#ff7a5c' : '#c96a5c'}" stroke-width="${r === 300 ? 4 : 2}" stroke-dasharray="${r === 300 ? '' : '6 5'}" opacity="${a}"/>`; b += T('P2 250', cx + 250 * s * 0.7, cy - 250 * s * 0.7, { s: 11, c: '#ffb08a' }) + T('P3 200', cx + 200 * s * 0.55, cy - 200 * s * 0.55 + 14, { s: 11, c: '#ffb08a' }); }
    else b += `<circle cx="${cx}" cy="${cy}" r="${R * s}" fill="#3a4a3a" fill-opacity=".55" stroke="#8a8496" stroke-width="6"/>`;
    // view rectangles around a hero standing 60 u right of centre
    const hx = cx + 60 * s, hy = cy + 40 * s;
    for (const [vw, vh, col, lab] of [[533, 300, '#ffd98a', 'desktop'], [620, 287, '#8fd0ff', 'phone land'], [250, 541, '#f4a6b8', 'phone port']]) {
      let vx = hx, vy = hy; if (i === 1) { vx = cx; vy = cy; }
      b += `<rect x="${f(vx - vw * s / 2)}" y="${f(vy - vh * s / 2)}" width="${f(vw * s)}" height="${f(vh * s)}" fill="none" stroke="${col}" stroke-width="1.6" stroke-dasharray="5 4" opacity=".9"/>` + T(lab, vx - vw * s / 2 + 4, vy - vh * s / 2 + 12, { s: 10, c: col });
    }
    b += `<circle cx="${f(hx)}" cy="${f(hy)}" r="4" fill="#ffd27a"/><circle cx="${f(cx - 50 * s)}" cy="${f(cy - 40 * s)}" r="${26 * s}" fill="#5f5f69" stroke="#ffb84a" stroke-width="1.5"/>` + T('boss r 26', cx - 50 * s - 22, cy - 40 * s - 22, { s: 10, c: '#ffb84a' });
    // kiting loop
    if (i !== 1) { const rr = (i === 0 ? 180 : 240); b += `<circle cx="${cx}" cy="${cy}" r="${rr * s}" fill="none" stroke="#cfe6c0" stroke-width="1.2" stroke-dasharray="2 5" opacity=".8"/>`; }
    const p = para(txt, x0 + 16, y0 + 482, 78, { s: 12.5, w: 500, lh: 15 }); b += p.svg;
  });
  // kiting table
  const rows = [['', 'A Root Ring r230', 'B Clearing 520x290', 'C Hedge 300/250/200'],
    ['kite lap (path r = R - 50)', '1131 u: Elias 14.9 s, Wren 10.7 s', 'oval ~1200 u: 15.8 / 11.3 s', '1508 / 1194 / 942 u: Elias 19.8 / 15.7 / 12.4 s'],
    ['boss crosses the arena (24 u/s)', '19 s', '22 s long axis, 12 s short', '25 / 21 / 17 s'],
    ['hero crosses (Elias 76)', '6.1 s', '6.8 s / 3.8 s', '7.9 / 6.6 / 5.3 s'],
    ['wall in view (desktop)', 'only near it (needs a boss arrow off-screen)', 'always (whole arena framed)', 'only near it'],
    ['phone portrait 250 wide', 'fine (follows the hero)', 'zoom 0.48x: sprites too small', 'fine'],
    ['edge rule', 'hard wall, no damage (fair on touch)', 'hard wall', 'damage 4 + shove (punishes joystick slop)'],
    ['Low-tier cost', '~110 root sprites pooled (Med 70, Low 36 + ring stroke)', 'cheapest (static stumps)', '~130 thorn sprites + damage checks']];
  const tx = 16, ty = 668, cw = [300, 420, 400, 420];
  rows.forEach((r, j) => { let xx = tx; r.forEach((c, m) => { b += T(c, xx + 8, ty + 18 + j * 21, { s: 12, w: j === 0 || m === 0 ? 800 : 500, c: j === 0 ? '#ffd98a' : m === 0 ? '#aab4c4' : '#e8edf3' }); xx += cw[m]; }); if (j) b += `<rect x="${tx}" y="${ty + 4 + j * 21}" width="1568" height="1" fill="#2a3446"/>`; });
  b += T('Gems / pickups: on arrival every gem in the world flies to the hero (one free magnet) and nothing new drops outside the ring. Inside: adds drop gems and level-ups still happen; each phase change sheds ONE heart; boss death drops heart + magnet (kept) + shards.', 24, 860 + 20, { s: 12.5, w: 600, c: '#cfe6c0' });
  b += T('Props: none inside (no hiding behind trees; the life map starts inside the ring as your light paints it). Ambient: critters hush (AL-6 hush rule), fog thin, fireflies off; outside the ring the Hollow stays grey until the victory flood.', 24, 900, { s: 12.5, w: 600, c: '#cfe6c0' });
  return page(1600, 1000, b);
}

// ================= desktop frames =================
const deskBase = (plates, plate = 'desk-day-wren', t = 14) => `<image href="${plates}/${plate}.jpg" x="0" y="0" width="1280" height="720"/>` + SC.wash(1280, 720, t);
// 04 ARRIVAL: 14:00 the ground shakes, ring tell, Husks crumble/flee, gems stream to the hero, banner
function arrivalPage(plates) {
  resetAll(); const k = DESK; const [ax, ay] = W(40, -110);
  let b = deskBase(plates);
  b += SC.outside(1280, 720, ax, ay, 230 * k, 0.32);
  b += SC.rootRing(1280, 720, ax, ay, 230, k, { prog: 0.35, tell: true, seed: 3 });
  // crumbling / fleeing husks
  const q = rng(4); for (let i = 0; i < 12; i++) { const x = 80 + q() * 1120, y = 120 + q() * 560; if (Math.hypot(x - 640, y - 382) < 120) continue; b += SC.husklet(x, y, k, 0.55) + SC.ash(x, y, k, 0.9, i); }
  // gems streaming to the hero
  for (let i = 0; i < 26; i++) { const a = q() * Math.PI * 2, d = 90 + q() * 420, x = 640 + Math.cos(a) * d, y = 382 + Math.sin(a) * d * 0.7; b += `<path d="M${f(x)} ${f(y)} L${f(x + (640 - x) * 0.12)} ${f(y + (382 - y) * 0.12)}" stroke="#8fd0ff" stroke-width="2" opacity=".55"/><path d="M${f(x)} ${f(y - 4)} l3 4 l-3 4 l-3 -4Z" fill="#bfe6ff" stroke="#3a6a9a" stroke-width=".8"/>`; }
  // the boss rising from the soil (half sunk) at the ring centre
  const [bx, by] = W(60, -70);
  b += `<svg x="0" y="0" width="1280" height="${f(by + 2)}" overflow="hidden">` + boss({ ph: 1 }, bx, by + 70, k) + `</svg>` + SC.spikes(bx, by, 40, k, 5) + `<ellipse cx="${f(bx)}" cy="${f(by)}" rx="${f(48 * k)}" ry="${f(12 * k)}" fill="#2a2232" opacity=".6"/>`;
  b += `<rect x="340" y="560" width="600" height="74" rx="14" fill="#0c1018" opacity=".78" stroke="#b98f4e" stroke-width="1.4"/>` + T('THE ELDER TREANT WAKES', 640, 594, { f: FT, s: 30, w: 700, c: '#efe6d2', a: 'middle' }) + T('the oldest mask in the forest', 640, 620, { s: 14, i: 1, c: '#c9b9a0', a: 'middle' });
  b += SC.heldPill(640, 67, 1);
  b += SC.cap(1280, 720, 1, 'ARRIVAL A at 14:00 (3.0 s beat, sim paused for 1.2 s of it): ring tell 1.5 s -> roots erupt in a sweep -> Treant rises; waves stop, Husks crumble to ash, every gem flies to you');
  return page(1280, 720, b);
}

// 05 MOVES: six true-ish size panels (0.8x of desktop true size)
function movesPage(plates) {
  resetAll(); const k = DESK;
  let b = header('#7', 'MOVE SET (Take A): six moves over three phases, shared telegraph style', 'Panels are desktop true size x0.8. Red-orange at full strength only when the zone will reach the hero; others at 28%. Ground decals fill from centre over the tell; the boss POSE tells first.', 'tells >= 0.7 s; at most 2 boss tells live; 0.6 s gap between hits');
  const panels = [
    ['1 BARK SLAM  (P1+)', 'arms up 0.9 s -> disc r 74 around the feet, heavy (x1.4). Counter: step out. P3: leaves 4 root spikes for 4 s (small walls).', (o) => SC.tCircle(o.x(-45), o.y(-10), 74, k, 0.7, true) + o.boss({ ph: 1, tele: 'slam' }, -45, -10)],
    ['2 ROOT ERUPTION  (P1 3 / P2 4 / P3 5)', 'circles r 26 on your spot + near it; tell 1.0 s; mid (x1.0). Counter: keep moving. Only the circle that will catch you is bright.', (o) => [[0, 0, 1], [50, -28, 0], [-36, 40, 0]].map(([x, y, full]) => SC.tCircle(o.x(x), o.y(y), 26, k, 0.75, !!full)).join('') + SC.spikes(o.x(70), o.y(40), 22, k, 2) + o.boss({ ph: 1 }, -110, -30)],
    ['3 SEED TOSS  (P1, adds)', 'lobs 3 pods (landing ring 1.1 s, hurts nobody); a pod not killed in 3 s becomes a sapling Husk (hp 30, cap 8 live). Counter: kill pods; spirits auto-target them.', (o) => o.boss({ ph: 1 }, -110, -20) + SC.seedArc(o.x(-110), o.y(-75), o.x(40), o.y(20), k, 0.75) + SC.seedArc(o.x(-110), o.y(-75), o.x(90), o.y(-40), k, 0.5) + SC.sapling(o.x(-30), o.y(50), k) + SC.sapling(o.x(-5), o.y(64), k, 1, true)],
    ['4 VINE SWEEP  (P2+)', 'one arm swings back 1.1 s -> cone 90 deg r 130 toward you, heavy (x1.4). Counter: sidestep ~45 u or get behind it.', (o) => SC.tCone(o.x(-70), o.y(-25), 0.34, 1.571, 130, k, 0.55, true) + o.boss({ ph: 2, tele: 'sweep' }, -70, -25)],
    ['5 THORN VOLLEY / NOVA  (P2 fan 5, P3 nova)', 'chest flares 0.7 s -> fan of 5 aimed thorns (speed 120, light x0.5); P3 adds a ring of 14 with 4 wide gaps (tell 1.0 s). Counter: strafe; stand in a gap.', (o) => o.boss({ ph: 3, tele: 'thorn' }, -110, -15) + [-0.4, -0.2, 0, 0.2, 0.4].map((d) => SC.aimTick(o.x(-108), o.y(-48), 0.43 + d, 170, k, Math.abs(d) < 0.25)).join('') + [0.35, 0.6].map((u) => SC.bThorn(o.x(-108 + 170 * u * Math.cos(0.43)), o.y(-48 + 170 * u * Math.sin(0.43)), 0.43, k)).join('')],
    ['6 ROOT LANES  (P3)', '2 lanes (then 3) across the whole ring, 22 wide, tell 1.2 s; mid (x1.0); roots stay up 3 s as low walls. Counter: step out of the lane.', (o) => SC.tLaneW(o.x(-220), o.y(25), o.x(220), o.y(-5), 22, k, 0.7, true) + SC.tLaneW(o.x(-220), o.y(-90), o.x(220), o.y(-60), 22, k, 0.7, false) + o.boss({ ph: 3 }, -120, -50)],
  ];
  const PW = 512, PH = 300, sc = 0.8;
  panels.forEach(([title, txt, draw], i) => {
    const col = i % 3, row = Math.floor(i / 3), x0 = 16 + col * 528, y0 = 92 + row * 452;
    const vw = PW / sc, vh = PH / sc; // viewBox in desk px
    // put the hero at the plate's hero spot; the panel viewBox centres on (640 + hero offset)
    const vx = 640 - vw / 2 - 60, vy = 382 - vh / 2 - 10;
    const o = { x: (wx) => 640 + wx * k, y: (wy) => 382 + wy * k, boss: (st, wx, wy) => boss(st, 640 + wx * k, 382 + wy * k, k) };
    b += `<rect x="${x0}" y="${y0}" width="${PW}" height="440" rx="12" fill="#151b26" stroke="#2a3446"/>` + T(title, x0 + 14, y0 + 24, { f: FT, s: 17, w: 700, c: '#ffe2a8' });
    b += `<svg x="${x0}" y="${y0 + 34}" width="${PW}" height="${PH}" viewBox="${f(vx)} ${f(vy)} ${f(vw)} ${f(vh)}" overflow="hidden">` + deskBase(plates) + SC.outside(1280, 720, 640, 382 - 60 * k, 230 * k, 0.25) + draw(o) + `</svg>`;
    const p = para(txt, x0 + 14, y0 + 356, 74, { s: 12.5, w: 500, lh: 15 }); b += p.svg;
  });
  return page(1600, 1000, b);
}

// 06 DESKTOP FIGHT FRAME (P2): ring, boss bar, sweep tell aimed at Wren, an eruption elsewhere (faint), saplings, gems
function fightDesk(plates) {
  resetAll(); const k = DESK; const [ax, ay] = W(-30, -60);
  let b = deskBase(plates) + SC.outside(1280, 720, ax, ay, 230 * k, 0.32) + SC.rootRing(1280, 720, ax, ay, 230, k, { seed: 3 });
  const [bx, by] = W(-90, -30);
  b += SC.tCone(bx, by, 0.4, 1.571, 130, k, 0.6, true) + SC.tCircle(...W(150, -20), 26, k, 0.4, false) + SC.spikes(...W(120, 70), 22, k, 4);
  b += SC.sapling(...W(80, 40), k) + SC.sapling(...W(110, -60), k, 1, true) + SC.sapling(...W(-200, 60), k);
  b += boss({ ph: 2, tele: 'sweep' }, bx, by, k);
  b += SC.heldPill(640, 67, 1) + SC.bossBar(1280, 1, 0.55, 2, { sub: 'Blight', y: 96 });
  b += SC.cap(1280, 720, 1, 'DESKTOP 1280x720, true size: P2 Blight, Vine Sweep tell aimed at Wren (full), a far eruption (28%), saplings, inside the Root Ring');
  return page(1280, 720, b);
}
// 07 PHONE LANDSCAPE 844x390@2x (P3 lanes)
function fightPhoneL(plates) {
  resetAll(); const k = PHONE, w = 844, h = 390; const [ax, ay] = W(20, -40, k, HP);
  let b = `<image href="${plates}/phone-day-wren.jpg" x="0" y="0" width="${w}" height="${h}"/>` + SC.wash(w, h, 14) + SC.outside(w, h, ax, ay, 230 * k, 0.32) + SC.rootRing(w, h, ax, ay, 230, k, { seed: 5 });
  const [bx, by] = W(-95, -15, k, HP);
  b += SC.tLaneW(...W(-240, 20, k, HP), ...W(240, -10, k, HP), 22, k, 0.65, true) + SC.tLaneW(...W(-240, -100, k, HP), ...W(240, -80, k, HP), 22, k, 0.65, false);
  b += boss({ ph: 3 }, bx, by, k) + SC.bThorn(...W(-40, 30, k, HP), 0.3, k);
  b += SC.heldPill(422, 47, 0.6) + SC.bossBar(w, 0.8, 0.22, 3, { sub: 'Wrath', y: 82 });
  // touch controls ghost (joystick + ability)
  b += `<circle cx="90" cy="300" r="44" fill="#ffffff" opacity=".08" stroke="#ffffff" stroke-opacity=".25"/><circle cx="104" cy="292" r="18" fill="#ffffff" opacity=".18"/><circle cx="770" cy="310" r="30" fill="#0c1018" opacity=".6" stroke="#ffd27a" stroke-width="2"/>`;
  b += SC.cap(w, h, 0.8, 'PHONE LANDSCAPE 844x390, true size (1.3 px/u): P3 Root Lanes; the near lane is full, the far lane 28%');
  return page(w, h, b);
}
// 08 PHONE PORTRAIT 390x844@2x (P1 eruption) - painted ground (no portrait plate exists), hero cut from the phone plate
function fightPhoneP(plates) {
  resetAll(); const k = PHONE, w = 390, h = 844, H = [195, 470];
  let b = SC.groundPaint(w, h, 4);
  b += `<defs><radialGradient id="hm"><stop offset=".55" stop-color="#fff"/><stop offset="1" stop-color="#000"/></radialGradient><mask id="hmask"><circle cx="${H[0]}" cy="${H[1] - 14}" r="46" fill="url(#hm)"/></mask></defs><g mask="url(#hmask)"><image href="${plates}/phone-day-wren.jpg" x="${H[0] - HP[0]}" y="${H[1] - HP[1]}" width="844" height="390"/></g>`;
  b += SC.wash(w, h, 14);
  const [ax, ay] = [H[0] + 10 * k, H[1] - 90 * k];
  b += SC.outside(w, h, ax, ay, 230 * k, 0.32) + SC.rootRing(w, h, ax, ay, 230, k, { seed: 8 });
  const [bx, by] = [H[0] + 30 * k, H[1] - 150 * k];
  b += [[0, 0, 1], [40, -30, 0], [-45, 20, 0]].map(([x, y, full]) => SC.tCircle(H[0] + x * k, H[1] + y * k, 26, k, 0.7, !!full)).join('');
  b += boss({ ph: 1 }, bx, by, k) + SC.seedArc(bx, by - 60 * k, H[0] - 60 * k, H[1] + 80 * k, k, 0.6);
  b += SC.bossBar(w, 0.72, 0.85, 1, { sub: 'Awakening', y: 14 });
  b += `<circle cx="80" cy="740" r="46" fill="#ffffff" opacity=".08" stroke="#ffffff" stroke-opacity=".25"/><circle cx="310" cy="760" r="30" fill="#0c1018" opacity=".6" stroke="#ffd27a" stroke-width="2"/>`;
  b += SC.cap(w, h, 0.6, 'PORTRAIT 390x844: P1 eruption; ground painted (no portrait plate)');
  return page(w, h, b);
}

// 09 VICTORY: six frames of option A (radial from the boss) + B / C thumbnails
function victoryFrame(plates, t, opt = 'A') {
  const k = DESK; const [bx, by] = W(-60, -40); const [ax, ay] = W(-30, -60);
  let b = deskBase(plates, 'desk-day-wren', t >= 3.5 ? 15 : 14);
  const kd = Math.min(1, t / 3.5);
  if (opt === 'A') {
    const R = t < 2.5 ? 0 : Math.min(1500, (t - 2.5) * 420);
    if (t < 3) b += SC.outside(1280, 720, ax, ay, 230 * k, 0.32 * (1 - Math.max(0, t - 2) )) + SC.rootRing(1280, 720, ax, ay, 230, k, { seed: 3, low: t > 1.5 });
    if (R > 0) b += SC.flood(1280, 720, bx, by - 60, R, { k: 3, blooms: 150, tag: 'a' + t, greyOut: 0.85 });
    else b += `<rect width="1280" height="720" fill="#7a7f8a" style="mix-blend-mode:saturation" opacity="${f(0.5 * (1 - kd))}"/>`;
  } else if (opt === 'B') { const [hx, hy] = HD; const R = Math.max(0, (t - 2.5) * 420); b += R > 0 ? SC.flood(1280, 720, hx, hy, R, { k: 2.2, tag: 'b' + t }) : ''; }
  else { const wv = t < 2.5 ? 0 : t < 3.3 ? (t - 2.5) / 0.8 : Math.max(0, 1 - (t - 3.3) / 1.2); b += SC.flood(1280, 720, 640, 360, t >= 3.3 ? 1600 : 0, { k: 2.2, tag: 'c' + t, greyOut: t >= 3.3 ? 0 : 0.6 }) + `<rect width="1280" height="720" fill="#fff8e6" opacity="${f(wv * 0.92)}"/>`; }
  const d = put(treantDeath({ k: kd }), bx, by, k / 4); b += d.b + d.e;
  const mid = 'hc' + String(t).replace('.', '_') + opt;
  b += `<defs><radialGradient id="${mid}g"><stop offset=".6" stop-color="#fff"/><stop offset="1" stop-color="#000"/></radialGradient><mask id="${mid}"><circle cx="${HD[0]}" cy="${HD[1] - 18}" r="40" fill="url(#${mid}g)"/></mask></defs><g mask="url(#${mid})"><image href="${plates}/desk-day-wren.jpg" x="0" y="0" width="1280" height="720"/></g>` + glow(HD[0], HD[1] - 10, 50, 40, '#ffd27a', 0.35);
  if (t >= 4) b += SC.birds(1280, 720, 9, 1.6, 6, 0.1, 0.6) + SC.petals(1280, 720, 26, 1.6) + SC.shafts(1280, 720, 0.06);
  b += SC.heldPill(640, 67, 1);
  if (t >= 0 && t < 0.4) b += `<rect width="1280" height="720" fill="#ffffff" opacity=".18"/>`;
  if (t >= 5.5) b += `<rect x="440" y="120" width="400" height="44" rx="22" fill="#0c1018" opacity=".7"/>` + T('"We made it, pup."', 640, 149, { f: FT, s: 20, i: 1, c: '#ffe2a8', a: 'middle' });
  return b;
}
function victoryPage(plates) {
  resetAll();
  let b = header('#7', 'VICTORY BEAT: the whole screen fills with light and life', 'A (recommended) radial flood FROM THE BOSS: the life it held runs out of it into the ground. Each frame = the 1280x720 desktop view at 0.4x. Sim stops at the killing blow; any key after 1.5 s skips to results.', 'gold only in the dawn sun wash (locked rule)');
  const times = [[0, '0.0 s killing blow: 120 ms hit-stop, white tick, adds crumble to ash'], [1.2, '1.2 s slow kneel, mask cracks; music cuts to a held note'], [2.6, '2.6 s mask falls, leaf; roots in the ring sink; flood starts at the trunk'], [3.4, '3.4 s flood sweeps the view at ~420 u/s (beyond the view: whole map set restored)'], [4.6, '4.6 s everything in view restored: blooms, critters, birds burst, light shafts'], [6.0, '6.0 s hero bark, then results slide in (gold dawn layout)']];
  times.forEach(([t, lab], i) => { const col = i % 3, row = Math.floor(i / 3), x = 16 + col * 528, y = 92 + row * 330, s = 0.4; b += `<svg x="${x}" y="${y}" width="${1280 * s}" height="${720 * s}" viewBox="0 0 1280 720">` + victoryFrame(plates, t, 'A') + `</svg>` + T(lab, x + 2, y + 720 * s + 16, { s: 12, w: 700, c: '#cfe6c0' }); });
  b += T('B  sweep from the HERO (your light wins)', 16, 770, { f: FT, s: 16, w: 700, c: '#ffe2a8' }) + T('C  whiteout -> colour (sun crests)', 816, 770, { f: FT, s: 16, w: 700, c: '#ffe2a8' });
  [[2.6, 'B', 16], [3.4, 'B', 280], [3.0, 'C', 816], [4.0, 'C', 1080]].forEach(([t, o, x]) => { const s = 0.2; b += `<svg x="${x}" y="782" width="${1280 * s}" height="${720 * s}" viewBox="0 0 1280 720">` + victoryFrame(plates, t, o) + `</svg>`; });
  b += para('B: hero-centred wave: simplest to read on phones, but the boss death is off-centre and "the life it held" story is lost. C: a full-screen white flash fading into colour: biggest single hit, but a white flash breaks the "no flashes" arc rule and Calm motion has to remove it.', 16, 948, 220, { s: 12, w: 500, lh: 15 }).svg;
  return page(1600, 1000, b);
}
function victoryKey(plates) { resetAll(); return page(1280, 720, victoryFrame(plates, 4.6, 'A') + SC.cap(1280, 720, 1, 'VICTORY A key frame 4.6 s (desktop true size): flood done, Treant at rest, blooms, birds, shafts; results next')); }

// 11 DEFEAT at the boss: grey 2 s beat, lantern dims (not out), recap line
function defeatPage(plates) {
  resetAll(); const k = DESK; const [ax, ay] = W(-30, -60), [bx, by] = W(-70, -50);
  let b = deskBase(plates) + SC.outside(1280, 720, ax, ay, 230 * k, 0.3) + SC.rootRing(1280, 720, ax, ay, 230, k, { seed: 3 }) + boss({ ph: 3 }, bx, by, k);
  b += `<rect width="1280" height="720" fill="#6a6f7a" style="mix-blend-mode:saturation" opacity=".95"/><rect width="1280" height="720" fill="#0c1018" opacity=".38"/>` + glow(640, 370, 60, 40, '#ffc45a', 0.55);
  b += SC.heldPill(640, 67, 1) + `<rect x="330" y="470" width="620" height="150" rx="16" fill="#101520" opacity=".9" stroke="#3a4560"/>` + T('The lantern dims', 640, 512, { f: FT, s: 28, w: 700, c: '#d8d2c4', a: 'middle' }) + T("Struck down by the Elder Treant's Vine Sweep, 1:21 into the fight", 640, 545, { s: 16, w: 600, c: '#ffb0a0', a: 'middle' }) + T('The Elder Treant was at 18% (Wrath)', 640, 571, { s: 13.5, c: '#c9b9a0', a: 'middle' }) + `<rect x="540" y="584" width="200" height="26" rx="13" fill="#d8c8a0"/>` + T('Again  (R)', 640, 602, { s: 14, w: 800, c: '#1a1410', a: 'middle' });
  b += SC.cap(1280, 720, 1, 'DEFEAT at the boss: locked quiet grey 2 s beat + dimmed lantern, then the results card (DR4 recap line + boss progress line)');
  return page(1280, 720, b);
}

export const PAGES2 = [
  { name: '02-phases-tells-death', w: 1600, h: 1000, html: phasesPage },
  { name: '03-arena-options', w: 1600, h: 1000, html: arenaPage },
  { name: '04-arrival-desktop-1280x720', w: 1280, h: 720, html: arrivalPage, cap: 750 },
  { name: '05-moves', w: 1600, h: 1000, html: movesPage },
  { name: '06-fight-desktop-1280x720', w: 1280, h: 720, html: fightDesk, cap: 750 },
  { name: '07-fight-phone-landscape-844x390', w: 844, h: 390, dpr: 2, html: fightPhoneL, cap: 750 },
  { name: '08-fight-phone-portrait-390x844', w: 390, h: 844, dpr: 2, html: fightPhoneP, cap: 750 },
  { name: '09-victory-flood', w: 1600, h: 1000, html: victoryPage },
  { name: '10-victory-key-desktop-1280x720', w: 1280, h: 720, html: victoryKey, cap: 750 },
  { name: '11-defeat-desktop-1280x720', w: 1280, h: 720, html: defeatPage, cap: 750 },
];
