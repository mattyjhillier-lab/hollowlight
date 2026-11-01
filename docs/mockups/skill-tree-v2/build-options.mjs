// Three-options sheets (structure, node/emblem look, evolution sockets). node build-options.mjs && node shoot.mjs mock
import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mapSVG, defs, page, C, esc, NODES, nodeSVG, clusterCentre, hubLantern, glyph, SAVE } from './lib.mjs';
import { EMBLEMS } from './inventory.mjs';
const HERE = dirname(fileURLToPath(import.meta.url));
const W = (name, html) => { writeFileSync(join(HERE, name), html); console.log('wrote', name); };
const byId = (id) => NODES.find((n) => n.id === id);
const PW = 400, PH = 520; // panel art size
const frame = (x, letter, title, sub, art, pros, cons, rec) => `<div class="glass panel" style="left:${x}px;top:64px;width:${PW}px;height:640px;padding:10px 12px">
  <div style="display:flex;align-items:baseline;gap:8px"><span class="h" style="font-size:22px;margin:0">${letter}. ${esc(title)}</span>${rec ? '<span class="sealb">RECOMMENDED</span>' : ''}</div>
  <div class="small mute" style="margin:2px 0 6px">${esc(sub)}</div>
  <svg width="${PW - 24}" height="380" viewBox="0 0 ${PW - 24} 380" style="border-radius:12px;background:#0d1322;display:block">${defs()}${art}</svg>
  <div class="small" style="margin-top:8px;line-height:1.4"><b style="color:#9fe9dd">+</b> ${esc(pros)}</div>
  <div class="small" style="margin-top:4px;line-height:1.4"><b style="color:#ff9a8f">&minus;</b> ${esc(cons)}</div></div>`;
const head = (t, s) => `<div class="cap" style="left:24px;top:16px;font-size:13px">${esc(t)}</div><div class="whisper" style="position:absolute;left:24px;top:34px;font-size:15px">${esc(s)}</div>`;
const AW = PW - 24, AH = 380;

// ---------------------------------------------------------------- STRUCTURE
{
  const a = mapSVG({ w: AW, h: AH, cx: 0, cy: 10, s: 0.165 }, { lod: 'far', names: false });
  // B: vertical lantern tree
  const b = [];
  b.push(`<rect width="${AW}" height="${AH}" fill="#0d1322"/><circle cx="${AW / 2}" cy="20" r="90" fill="url(#warm)" opacity=".5"/>`);
  b.push(`<path d="M${AW / 2} 370 C${AW / 2 - 6} 300 ${AW / 2 + 8} 220 ${AW / 2} 40" stroke="url(#brass)" stroke-width="7" fill="none"/>`);
  const br = [[300, -1, '#9fe8ff', 'Wolves'], [250, 1, '#e2ccff', 'Orbit'], [195, -1, '#b9a2ff', 'Ravens'], [145, 1, '#7ff0ff', 'Bolts'], [95, -1, '#d6ecff', 'Chain']];
  for (const [y, d, col, nm] of br) {
    const x2 = AW / 2 + d * 130;
    b.push(`<path d="M${AW / 2} ${y} Q${AW / 2 + d * 60} ${y - 30} ${x2} ${y - 20}" stroke="${C.thread}" stroke-opacity=".7" stroke-width="2.5" fill="none"/>`);
    for (let i = 1; i <= 4; i++) { const t = i / 5; b.push(`<circle cx="${AW / 2 + d * 130 * t}" cy="${y - 26 * t}" r="5" fill="${col}" stroke="${C.ink}" stroke-width="1.5"/>`); }
    for (let k = 0; k < 3; k++) b.push(`<circle cx="${x2 + d * (8 + k * 14)}" cy="${y - 20 + (k - 1) * 14}" r="6.5" fill="url(#seal)" stroke="#6b4512" stroke-width="1.5"/>`);
    b.push(`<text x="${x2 - d * 10}" y="${y + 2}" text-anchor="${d < 0 ? 'start' : 'end'}" font-family="HLC" font-size="13" fill="${col}">${nm}</text>`);
  }
  b.push(`<path d="M${AW / 2} 370 q-40 6 -70 -2 M${AW / 2} 370 q40 6 70 -2" stroke="url(#brass)" stroke-width="4" fill="none"/><text x="${AW / 2 - 110}" y="360" font-family="AS" font-size="11" fill="${C.dim}">Wren root</text><text x="${AW / 2 + 74}" y="360" font-family="AS" font-size="11" fill="${C.dim}">Elias root</text>`);
  b.push(hubLantern(AW / 2, 360, 0.5), `<text x="${AW / 2}" y="30" text-anchor="middle" font-family="HLC" font-size="14" fill="${C.gold}">Dawn (keystones)</text>`);
  // C: Hollow map
  const c = [];
  c.push(`<rect width="${AW}" height="${AH}" fill="#2a3040"/>`);
  const blobs = [[95, 120, 70, '#9fe8ff', 'Wolf Den', 1], [270, 95, 62, '#b9a2ff', 'Rookery', 0], [300, 250, 64, '#7ff0ff', 'Old Library', 0], [180, 300, 58, '#e2ccff', 'Chapel', 1], [80, 285, 52, '#d6ecff', 'Storm Hill', 0]];
  for (const [x, y, r, col, nm, lit] of blobs) {
    c.push(`<path d="M${x - r} ${y} C${x - r} ${y - r * 0.9} ${x + r * 0.7} ${y - r} ${x + r} ${y - r * 0.2} C${x + r * 1.1} ${y + r * 0.6} ${x + r * 0.2} ${y + r} ${x - r * 0.4} ${y + r * 0.8} C${x - r} ${y + r * 0.6} ${x - r} ${y + r * 0.3} ${x - r} ${y}Z" fill="${lit ? '#5f7a52' : '#454b58'}" stroke="${lit ? col : '#6c7590'}" stroke-opacity=".6" stroke-width="2"/>`);
    for (let i = 0; i < 6; i++) { const ang = i * 1.05; c.push(`<circle cx="${x + Math.cos(ang) * r * 0.55}" cy="${y + Math.sin(ang) * r * 0.5}" r="5" fill="${lit && i < 4 ? '#ffd27a' : '#2a3044'}" stroke="${C.ink}" stroke-width="1.4"/>`); }
    c.push(`<text x="${x}" y="${y + 4}" text-anchor="middle" font-family="HLC" font-size="13" fill="${lit ? C.cream : '#a8b0c4'}">${nm}</text>`);
  }
  c.push(`<path d="M190 190 L95 120 M190 190 L270 95 M190 190 L300 250 M190 190 L180 300 M190 190 L80 285" stroke="#d8c49a" stroke-opacity=".5" stroke-width="3" stroke-dasharray="6 5"/>`, hubLantern(190, 190, 0.6));
  const body = `<div class="stage">${head('Decision 1 of 3 - overall structure', 'How the whole tree is laid out. Same nodes, budget and gates in all three.')}
  ${frame(16, 'A', 'Lantern and five constellations', 'Hub lantern, two global rings, five weapon emblems around them, keystones on the outer dusk ring.', a, 'Matches the locked v2 row (clusters + global rings) and Matt\'s Spirit Hunters web; every weapon is its own place; grows outward forever (new sky band per chapter).', 'Widest canvas: needs zoom levels (far / mid / near) and a Next-lights board so new players are not lost.', true)}
  ${frame(440, 'B', 'Lantern tree (vertical)', 'One trunk rising from the heroes\' roots to dawn; each weapon is a branch, evolutions blossom at the tips.', b.join(''), 'Very easy on a phone (scroll up only); clear order; strong "tree" read.', 'Not a pannable web (conflicts with the locked meta-progression principle); emblems squashed into branches; long scroll at 500 nodes.', false)}
  ${frame(864, 'C', 'The Hollow map', 'The tree is a painted map of the Hollow: each weapon is a landmark region you restore; nodes are lanterns along paths.', c.join(''), 'Strongest identity link (colour returns to the map as you buy).', 'Heaviest art; emblem constellations get lost in terrain; confusable with the front-door map select; 2-3x the build cost.', false)}</div>`;
  W('st2-options-structure-desk.html', page('Options: structure', body));
}

// ---------------------------------------------------------------- NODE / EMBLEM LOOK
{
  const [ccx, ccy] = clusterCentre('ghost_wolves');
  const a = mapSVG({ w: AW, h: AH, cx: ccx, cy: ccy + 6, s: 0.92 }, { lod: 'near', names: false, labels: false });
  // B leadlight wolf
  const em = EMBLEMS.wolf;
  const b = [`<rect width="${AW}" height="${AH}" fill="#0d1322"/>`];
  const P = (pts) => pts.map(([x, y]) => `${(x * 1.35 + AW / 2).toFixed(1)},${(y * 1.35 + AH / 2).toFixed(1)}`).join(' ');
  const panes = [
    [[-74, -108], [-30, -52], [-88, -26]], [[74, -108], [30, -52], [88, -26]], [[-30, -52], [30, -52], [0, -10]], [[-88, -26], [-30, -52], [-38, -2]], [[88, -26], [30, -52], [38, -2]],
    [[-88, -26], [-112, 18], [-52, 64]], [[88, -26], [112, 18], [52, 64]], [[-38, -2], [0, -10], [0, 42]], [[38, -2], [0, -10], [0, 42]], [[-52, 64], [0, 42], [0, 108]], [[52, 64], [0, 42], [0, 108]], [[-88, -26], [-38, -2], [-52, 64]], [[88, -26], [38, -2], [52, 64]], [[-52, 64], [-38, -2], [0, 42]], [[52, 64], [38, -2], [0, 42]],
  ];
  panes.forEach((pp, i) => { const lit = [0, 2, 3, 7, 8, 13, 5].includes(i); b.push(`<polygon points="${P(pp)}" fill="${lit ? (i % 2 ? '#9fe8ff' : '#6fb8d8') : '#3a4258'}" fill-opacity="${lit ? 0.85 : 0.7}" stroke="#14100c" stroke-width="5" stroke-linejoin="round"/>`); });
  b.push(`<polygon points="${P([[-74, -108], [-30, -52], [30, -52], [74, -108], [88, -26], [112, 18], [52, 64], [0, 108], [-52, 64], [-112, 18], [-88, -26]])}" fill="none" stroke="url(#brass)" stroke-width="5" stroke-linejoin="round"/>`);
  for (const [x, y] of [[-38, -2], [38, -2], [0, 42]]) b.push(`<circle cx="${x * 1.35 + AW / 2}" cy="${y * 1.35 + AH / 2}" r="13" fill="url(#seal)" stroke="#14100c" stroke-width="4"/>`);
  // C embroidered sampler
  const c = [`<rect width="${AW}" height="${AH}" fill="#2b2622"/>`];
  for (let y = 0; y < AH; y += 4) c.push(`<line x1="0" y1="${y}" x2="${AW}" y2="${y}" stroke="#352f2a" stroke-width="1"/>`);
  for (let x = 0; x < AW; x += 4) c.push(`<line x1="${x}" y1="0" x2="${x}" y2="${AH}" stroke="#312b26" stroke-width="1"/>`);
  const ol = em.outline.map((k) => em.slots[k]);
  c.push(`<polyline points="${P(ol)}" fill="none" stroke="#e8d6b0" stroke-width="3.2" stroke-dasharray="9 6" stroke-linecap="round"/>`);
  c.push(`<polyline points="${P(ol.slice(0, 5))}" fill="none" stroke="#ffd27a" stroke-width="3.6" stroke-dasharray="9 6" stroke-linecap="round" filter="url(#soft)"/>`);
  ol.forEach(([x, y], i) => { const X = x * 1.35 + AW / 2, Y = y * 1.35 + AH / 2; const lit = i < 5; c.push(`<circle cx="${X}" cy="${Y}" r="8" fill="${lit ? '#ffd27a' : '#6a5f52'}" stroke="#1d1814" stroke-width="2"/><path d="M${X - 4} ${Y} a4 4 0 1 1 4 4" stroke="#1d1814" stroke-width="1.4" fill="none"/>`); });
  for (const [x, y] of [[-38, -2], [38, -2], [0, 42]]) c.push(`<circle cx="${x * 1.35 + AW / 2}" cy="${y * 1.35 + AH / 2}" r="12" fill="none" stroke="#ffd36b" stroke-width="3" stroke-dasharray="3 3"/>`);
  const body = `<div class="stage">${head('Decision 2 of 3 - node and emblem look', 'How a constellation is drawn. Shown on the wolf; all five emblems use the same language.')}
  ${frame(16, 'A', 'Lantern stars on glowing thread', 'Brass-rimmed glass beads joined by a glowing thread that traces the emblem; a soft emblem watermark fills with role colour as you buy.', a, 'Reuses the locked kit (brass, glass, thread, wick glow) and the in-game trail glow; reads at phone size; cheap to draw (circles + lines).', 'The emblem is mostly implied by the thread, so it needs the watermark to read at far zoom.', true)}
  ${frame(440, 'B', 'Stained-glass emblem', 'The emblem is a leadlight window; each lantern is a pane that fills with colour when bought.', b.join(''), 'Huge wow; colour-returns reads instantly.', 'Conflicts with a lock: the leadlight border is reserved for evolution cards and the dawn screen (UI round 2); irregular panes are poor tap targets; far harder to author for every new weapon.', false)}
  ${frame(864, 'C', 'Embroidered sampler', 'The tree is cloth: the emblem is a running stitch, lanterns are French knots, owned stitches glow gold-cream.', c.join(''), 'Warm, handmade, leans on the thread signature.', 'Low contrast on phones; cloth is a new material not in the kit; gold stitches fight the evolution-only gold rule.', false)}</div>`;
  W('st2-options-emblem-desk.html', page('Options: node and emblem look', body));
}

// ---------------------------------------------------------------- EVOLUTION SOCKETS
{
  const sock = byId('gt_dire_alpha');
  const a = [];
  [['dormant', 'sealed', 0], ['cond', 'stirring', 0.55], ['ready', 'ready', 1], ['lit', 'lit', 1]].forEach(([st, lab, p], i) => { const x = 52 + i * 92; a.push(nodeSVG(sock, x, 110, 1.6, st, { progress: p }), `<text x="${x}" y="170" text-anchor="middle" font-family="AS" font-weight="700" font-size="13" fill="${C.cream}">${lab}</text>`); });
  const [ccx, ccy] = clusterCentre('ghost_wolves');
  a.push(`<svg x="0" y="190" width="${AW}" height="190" viewBox="0 0 ${AW} 190">${mapSVG({ w: AW, h: 190, cx: ccx, cy: ccy + 10, s: 0.62 }, { lod: 'mid', names: false, labels: false }).replace(/<circle cx="[^"]*" cy="[^"]*" r="[0-9.]+" fill="#cfd8ff"[^>]*\/>/g, '')}</svg>`);
  // B: lantern door with keyholes
  const b = [`<rect width="${AW}" height="${AH}" fill="#0d1322"/>`];
  const dx = AW / 2;
  b.push(`<path d="M${dx - 90} 330 V140 Q${dx} 40 ${dx + 90} 140 V330Z" fill="url(#glass)" stroke="url(#brass)" stroke-width="9"/>`, `<path d="M${dx - 90} 330 V140 Q${dx} 40 ${dx + 90} 140 V330Z" fill="none" stroke="${C.ink}" stroke-width="2"/>`);
  [[dx, 140, 1], [dx - 45, 240, 0.55], [dx + 45, 240, 0]].forEach(([x, y, p]) => {
    b.push(`<circle cx="${x}" cy="${y}" r="20" fill="#0a0e18" stroke="url(#brass)" stroke-width="4"/><path d="M${x} ${y - 8} a5 5 0 1 1 0.1 0 M${x - 3} ${y} h6 l2 12 h-10z" fill="${p >= 1 ? C.gold : '#59627a'}"/>`);
    for (let k = 0; k < 4; k++) b.push(`<rect x="${x - 18 + k * 9}" y="${y + 26}" width="7" height="${k / 4 < p ? 10 : 4}" fill="${k / 4 < p ? C.teal : '#3a4258'}"/>`);
  });
  b.push(`<text x="${dx}" y="360" text-anchor="middle" font-family="HLC" font-size="15" fill="${C.cream}">The wolf's door: three keyholes</text>`);
  // C: moon phases
  const c = [`<rect width="${AW}" height="${AH}" fill="#0d1322"/>`];
  [[0, 'sealed'], [0.35, 'waxing'], [0.7, 'gibbous'], [1, 'full = lit']].forEach(([p, lab], i) => {
    const x = 52 + i * 92, y = 130, r = 26;
    c.push(`<circle cx="${x}" cy="${y}" r="${r}" fill="#1a2030" stroke="url(#brass)" stroke-width="3"/>`);
    if (p > 0 && p < 1) c.push(`<path d="M${x} ${y - r} A${r} ${r} 0 0 1 ${x} ${y + r} A${r * (1 - 2 * p) } ${r} 0 0 ${p > 0.5 ? 0 : 1} ${x} ${y - r}Z" fill="#e8eefc"/>`);
    if (p >= 1) c.push(`<circle cx="${x}" cy="${y}" r="${r - 2}" fill="${C.gold}"/>`);
    c.push(`<text x="${x}" y="186" text-anchor="middle" font-family="AS" font-weight="700" font-size="13" fill="${C.cream}">${lab}</text>`);
  });
  c.push(`<text x="${AW / 2}" y="260" text-anchor="middle" font-family="HLCI" font-size="16" fill="${C.dim}">No numbers on the map; the moon tells you.</text>`);
  const body = `<div class="stage">${head('Decision 3 of 3 - evolution sockets and unlock display', 'Three sockets per weapon; recipes stay hidden until taken in a run (locked).')}
  ${frame(16, 'A', 'Wax-seal sockets at the emblem\'s points', 'Sockets sit at meaningful points (wolf eyes + nose, raven eye / wing tip / beak, bolt tips + turn, the three forks, three orbit lights). Sealed -> stirring (teal arc) -> ready (NEW) -> gold wax seal.', a.join(''), 'Uses the locked gold wax-seal EVOLVE and teal NEW; exact progress in the panel; the emblem itself tells the story (the wolf opens its eyes).', 'Sockets inside small emblems need care at phone zoom (44 px hit areas, labels on select).', true)}
  ${frame(440, 'B', 'Lantern door with three keyholes', 'Each weapon has a central reliquary door; each evolution is a keyhole; key teeth fill with progress.', b.join(''), 'Very clear "three locks" metaphor; one place per weapon to look.', 'Sockets leave the emblem (the "eyes of the wolf" idea is lost); adds a new object type to draw per weapon.', false)}
  ${frame(864, 'C', 'Moon-phase sockets', 'Each socket is a moon that waxes with progress and turns gold when full.', c.join(''), 'Poetic, fits dusk-to-dawn; no clutter of numbers.', 'Imprecise (players asked for visible progress); moon is the HUD timer\'s language, so it would mean two things.', false)}</div>`;
  W('st2-options-sockets-desk.html', page('Options: evolution sockets', body));
}
