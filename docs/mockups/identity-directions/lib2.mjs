// Shared helpers + hand-authored creature DATA + generic screen layouts (mock-ups only; not game code).
export const rnd = (s) => () => { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296; };
export const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
export const T = (s, x, y, o = {}) => `<text x="${x}" y="${y}" font-family="${o.f || 'Segoe UI,Arial'}" font-size="${o.s || 20}" font-weight="${o.w || 700}" fill="${o.c || '#fff'}" text-anchor="${o.a || 'start'}"${o.ls ? ` letter-spacing="${o.ls}"` : ''}${o.st ? ` stroke="${o.st}" stroke-width="${o.sw || 3}" stroke-linejoin="round" paint-order="stroke"` : ''}${o.tr ? ` transform="${o.tr}"` : ''}${o.op ? ` opacity="${o.op}"` : ''}${o.i ? ' font-style="italic"' : ''}>${o.raw ? s : esc(s)}</text>`;
export const circ = (cx, cy, r) => `M${cx - r} ${cy} a${r} ${r} 0 1 0 ${2 * r} 0 a${r} ${r} 0 1 0 ${-2 * r} 0Z`;
const sym = (p) => { const r = p.map(([x, y]) => `${x} ${y}`); const l = p.slice(1, -1).reverse().map(([x, y]) => `${-x} ${y}`); return 'M' + r.join('L') + 'L' + l.join('L') + 'Z'; };

// ---- Creature data. Origin = feet / bottom centre, y negative = up. One hand-authored definition each. ----
// extras: ordered shapes {d, r: 'soft'|'acc'|'face'}; eyes [x,y,r]; lines [d, role]; rings [cx,cy,rx,ry]; orbs [x,y,r]; core [cx,cy,k] (white-hot copy of body)
export const CR = {
  wren: {
    name: 'WREN', kind: 'hero', h: 112, w: 70, sx: 1.15,
    idea: 'Tall pointed hood, scarf, lantern', pers: 'Light-footed, glances back',
    extras: [{ d: 'M-12 -68 C-30 -70 -42 -58 -58 -66 C-46 -52 -30 -50 -12 -58Z', r: 'acc' }],
    body: 'M0 -114 C-9 -106 -14 -94 -13 -80 C-22 -58 -30 -26 -33 0 L-24 -6 L-17 2 L-8 -5 L0 3 L9 -5 L17 2 L25 -6 L33 0 C30 -26 22 -58 13 -80 C14 -94 9 -106 0 -114Z',
    voidD: 'M0 -94 C-7 -94 -9 -84 -8 -77 C-5 -71 5 -71 8 -77 C9 -84 7 -94 0 -94Z',
    eyes: [[-3.5, -81, 2], [3.5, -81, 2]], lines: [['M31 -96 L31 0', 'staff']], orbs: [[31, -102, 8]],
  },
  elias: {
    name: 'ELIAS', kind: 'hero', h: 112, w: 100, sx: 1.15,
    idea: 'Wide T-robe, halo, orbit ring', pers: 'Calm, steady, never rushes',
    extras: [{ d: 'M-10 -102 a10 10 0 1 0 20 0 a10 10 0 1 0 -20 0Z', r: 'face' }],
    body: 'M0 -92 C-9 -92 -12 -84 -11 -76 L-34 -66 L-42 -48 L-30 -46 L-21 -57 C-25 -34 -30 -14 -35 0 L35 0 C30 -14 25 -34 21 -57 L30 -46 L42 -48 L34 -66 L11 -76 C12 -84 9 -92 0 -92Z',
    voidD: null, eyes: [], lines: [['M0 -80 V-44 M-9 -70 H9', 'mark']],
    rings: [[0, -123, 15, 4], [0, -55, 52, 14]], orbs: [[52, -55, 7], [-26, -43, 6], [-26, -67, 6]],
  },
  wolf: {
    name: 'GHOST WOLF', kind: 'summon', h: 52, w: 160, sx: 0.85, core: [5, -28, 0.55],
    idea: 'Sleek long body, wisp tail', pers: 'Lopes, circles, howls',
    extras: [{ d: 'M-40 -26 C-62 -34 -82 -22 -108 -38 C-86 -14 -60 -10 -36 -14Z', r: 'soft' }],
    body: 'M-44 -26 C-38 -34 -28 -34 -20 -38 C-12 -46 -2 -48 10 -44 C18 -50 28 -50 36 -46 L44 -58 L47 -42 C52 -38 58 -34 64 -30 L52 -28 L56 -22 L44 -22 C40 -16 34 -16 30 -20 L30 0 L24 0 L22 -18 C14 -16 6 -16 0 -18 L-4 0 L-10 0 L-10 -18 C-18 -16 -26 -12 -34 -2 C-34 -10 -42 -16 -44 -26Z',
    voidD: null, eyes: [[46, -38, 2.2]], lines: [],
  },
  raven: {
    name: 'RAVEN', kind: 'summon', h: 48, w: 110, sx: 0.95, core: [0, -20, 0.5],
    idea: 'Wide V wings, fan tail', pers: 'Swoops, flutters, dives',
    extras: [],
    body: 'M0 -46 L-4 -40 C-6 -36 -6 -32 -6 -28 C-20 -38 -38 -38 -56 -26 C-42 -26 -34 -22 -30 -14 C-24 -18 -16 -16 -11 -12 L-9 -2 L-3 -8 L0 4 L3 -8 L9 -2 L11 -12 C16 -16 24 -18 30 -14 C34 -22 42 -26 56 -26 C38 -38 20 -38 6 -28 C6 -32 6 -36 4 -40Z',
    voidD: null, eyes: [[-2, -36, 1.5], [2, -36, 1.5]], lines: [],
  },
  ewolf: {
    name: 'FELL WOLF', kind: 'enemy', h: 54, w: 110, sx: 0.85,
    idea: 'Hunched, spiked back ridge', pers: 'Stalks, lunges in packs',
    extras: [],
    body: 'M-40 -20 L-50 -34 L-37 -30 L-35 -46 L-25 -35 L-19 -53 L-9 -39 L1 -56 L10 -40 L22 -46 L25 -35 C33 -35 41 -31 49 -25 L60 -30 L53 -21 L59 -14 L45 -16 C39 -9 31 -11 29 -16 L31 0 L22 0 L18 -14 C8 -12 -4 -12 -10 -14 L-12 0 L-21 0 L-23 -14 C-31 -12 -37 -14 -40 -20Z',
    voidD: null, eyes: [[45, -24, 2.6]], lines: [['M50 -16 L52 -9 M55 -16 L56 -10', 'fang']],
  },
  crow: {
    name: 'GRAVE CROW', kind: 'enemy', h: 40, w: 90, sx: 0.95,
    idea: 'Round body, hooked beak, ragged wing', pers: 'Erratic zig-zag flapping',
    extras: [{ d: 'M-10 -22 C-24 -36 -42 -36 -54 -26 C-47 -26 -43 -22 -41 -17 C-37 -19 -33 -17 -31 -13 C-25 -13 -17 -15 -10 -22Z', r: 'wing' }],
    body: 'M-18 -16 C-18 -27 -8 -33 2 -31 C6 -37 14 -40 20 -35 L34 -30 L22 -27 C22 -18 14 -10 4 -8 L9 0 L2 -3 L-3 0 L-4 -8 C-12 -6 -20 -8 -18 -16Z',
    voidD: null, eyes: [[14, -32, 2.6]], lines: [],
  },
  crawler: {
    name: 'ROOT CRAWLER', kind: 'enemy', h: 46, w: 124, sx: 0.95,
    idea: 'Low bulb, thorn-root legs', pers: 'Skitters, bursts spores',
    extras: [],
    body: sym([[0, -48], [3, -35], [10, -33], [16, -27], [32, -38], [46, -36], [34, -28], [26, -22], [50, -22], [62, -10], [48, -14], [30, -14], [42, 0], [30, -4], [18, -8], [14, -2], [8, -10], [0, -9]]),
    voidD: null, eyes: [[-6, -24, 2.4], [6, -24, 2.4], [0, -17, 1.8]], lines: [],
  },
  treant: {
    name: 'ELDER TREANT', kind: 'boss', h: 282, w: 220, sx: 0.62,
    idea: 'Antler crown, huge raised arms', pers: 'Slow, stomping, rumbling',
    extras: [],
    body: sym([[0, -262], [6, -236], [14, -276], [22, -232], [40, -262], [38, -222], [52, -205], [74, -216], [84, -252], [92, -212], [110, -238], [108, -196], [126, -180], [96, -170], [70, -150], [48, -132], [52, -100], [46, -80], [54, -40], [72, -6], [44, 2], [32, -10], [18, 2], [0, -6]]),
    voidD: 'M-24 -186 C-20 -204 20 -204 24 -186 C22 -170 14 -160 0 -160 C-14 -160 -22 -170 -24 -186Z',
    eyes: [[-13, -188, 6], [13, -188, 6]], lines: [['M-14 -168 L-6 -162 L0 -168 L6 -162 L14 -168', 'fang']],
  },
};
export const ORDER = ['wren', 'elias', 'wolf', 'raven', 'ewolf', 'crow', 'crawler', 'treant'];

// ---- Scene composition. st = style object with cr(id,x,y,s,flip), gem, dmg ----
export const ACT = {
  hero: [[660, 362, 'wren'], [515, 388, 'elias']],
  sum: [[570, 312, 'wolf', 1], [805, 398, 'wolf', 1], [425, 440, 'wolf', -1], [618, 218, 'raven'], [748, 255, 'raven']],
  foe: [[985, 345, 'ewolf', -1], [230, 450, 'ewolf', 1], [1040, 495, 'ewolf', -1], [892, 205, 'crow', -1], [335, 235, 'crow', 1], [1115, 285, 'crow', -1], [312, 350, 'crawler', 1], [890, 515, 'crawler', 1], [585, 538, 'crawler', 1]],
  boss: [1085, 278, 'treant', -1],
  gem: [[610, 432, 0], [705, 466, 1], [775, 308, 0], [560, 380, 1], [838, 262, 0], [432, 492, 1], [948, 432, 0], [650, 512, 0], [725, 250, 1]],
  dmg: [[600, 172, '22'], [875, 320, '16'], [300, 392, '31'], [1015, 425, '18']],
  crit: [940, 275, '74'],
};
export function world(st, A = ACT) {
  const it = [];
  for (const [x, y, id, f] of [...A.hero, ...A.sum, ...A.foe, A.boss]) it.push([y + (id === 'raven' || id === 'crow' ? 120 : 0), st.cr(id, x, y, CR[id].sx, f || 1)]);
  it.sort((a, b) => a[0] - b[0]);
  return A.gem.map((g) => st.gem(...g)).join('') + it.map((i) => i[1]).join('') + A.dmg.map((d) => st.dmg(...d, false)).join('') + st.dmg(...A.crit, true);
}

// ---- Page wrapper ----
export function page(d) {
  const sw = d.pal.map(([h, n]) => `<div class="s"><i style="background:${h}"></i><em>${h}</em></div>`).join('');
  const hexes = d.pal.map(([h, n]) => `${n} ${h}`).join('  /  ');
  const st = d.screens.map((s, i) => `<div class="stage" id="${s.id}"${i ? ' style="display:none"' : ''}>
<div class="banner"><div class="bn"><b>${d.label}</b><span>${d.line}</span><code>${d.legend}</code></div><div class="sw">${sw}</div></div>
<div class="mock"><svg viewBox="0 0 1280 604" width="1280" height="604" xmlns="http://www.w3.org/2000/svg">${s.svg}</svg></div>
<div class="cap"><b>${s.cap}</b><span>${hexes}</span></div></div>`).join('');
  return `<!doctype html><html><head><meta charset="utf-8"><title>${d.label}</title><style>
*{box-sizing:border-box;margin:0;padding:0}html,body{background:#000;width:1280px;height:720px;overflow:hidden}
.stage{position:relative;width:1280px;height:720px;background:#06070c;overflow:hidden;font-family:"Segoe UI",Arial,sans-serif}
.banner{position:absolute;left:0;top:0;width:1280px;height:80px;background:#050508;display:flex;align-items:center;gap:20px;padding:0 16px;border-bottom:3px solid ${d.acc};z-index:50}
.bn{display:flex;flex-direction:column;gap:1px}.bn b{font-size:27px;font-weight:900;letter-spacing:1px;color:#fff;line-height:1.1;white-space:nowrap}
.bn span{font-size:13px;color:#d3d6e4}.bn code{font-family:Consolas,monospace;font-size:12px;color:${d.acc};white-space:nowrap}
.sw{margin-left:auto;display:flex;gap:10px}.s{display:flex;flex-direction:column;align-items:center;gap:2px}.s i{width:30px;height:30px;border-radius:50%;border:2px solid rgba(255,255,255,.75);display:block}.s em{font:10px Consolas,monospace;color:#cfd3e2;font-style:normal}
.mock{position:absolute;left:0;top:80px;width:1280px;height:604px;overflow:hidden}
.cap{position:absolute;left:0;top:684px;width:1280px;height:36px;background:#050508;display:flex;align-items:center;gap:20px;padding:0 16px;color:#e6e9f5;border-top:1px solid #222}
.cap b{font-size:16px;color:#fff;white-space:nowrap}.cap span{font-size:11px;color:#9aa3bd;white-space:nowrap;overflow:hidden}
</style></head><body>${st}<script>const q=new URLSearchParams(location.search).get('s');if(q){document.querySelectorAll('.stage').forEach(e=>{if(e.id!==q)e.remove()});document.getElementById(q).style.display='block'}</script></body></html>`;
}

// neutral code tag used on parts sheets (same in every direction so labels stay readable)
export const tagc = (code, label, x, y, col) => `<g><rect x="${x}" y="${y}" width="${34 + label.length * 6.4 + code.length * 7}" height="19" rx="3" fill="#050508" stroke="${col}" stroke-width="1.2"/><text x="${x + 6}" y="${y + 14}" font-family="Consolas,monospace" font-size="12" font-weight="700" fill="${col}">${code}</text><text x="${x + 12 + code.length * 7.2}" y="${y + 14}" font-family="Consolas,monospace" font-size="11" fill="#cfd3e2">${label}</text></g>`;

export const CARDS = [
  { name: 'Raven Storm', tag: 'COMMON', rar: 'common', lv: 'NEW', desc: ['Ravens dive at', 'the nearest foe.'], icon: 'raven' },
  { name: 'Spirit Wolves', tag: 'RARE', rar: 'rare', lv: 'Lv 3 > 4', desc: ['+1 ghost wolf.', 'Bites hit 20% harder.'], icon: 'wolf' },
  { name: 'Dire Pack', tag: 'EVOLVE', rar: 'evolve', lv: 'Wolves + Moon Charm', desc: ['The pack howls: more', 'wolves, bigger bites.'], icon: 'wolf' },
];

export const ICON = {
  wolf: { f: 'M7 42 L5 7 L18 18 L30 18 L43 7 L41 42 L24 47Z', l: 'M15 29 L21 31 M33 29 L27 31 M24 37 V42' },
  raven: { f: 'M2 30 C12 28 18 18 24 3 C28 18 36 24 46 20 C38 31 32 34 28 44 L23 36 C16 36 8 35 2 30Z', l: '' },
  orb: { f: circ(24, 24, 13), l: 'M3 28 C3 14 45 14 45 28 C45 38 3 38 3 28' },
  heart: { f: 'M24 43 C5 28 5 11 17 10 C21 10 23 12 24 16 C25 12 27 10 31 10 C43 11 43 28 24 43Z', l: '' },
  gem: { f: 'M24 3 L39 24 L24 45 L9 24Z', l: 'M24 3 V45 M9 24 H39' },
};

// ---- Generic screen layouts driven by a direction object D ----
export const layout = {
  title(D) {
    let o = D.bg('title') + D.logo(640, 118) + D.sub('SPIRITS OF THE DUSK', 640, 196);
    for (const [who, cx, role] of [['wren', 450, 'Ghost-wolf caller'], ['elias', 830, 'Holy orbit warden']]) {
      const sel = who === 'wren';
      o += D.panel(cx - 130, 228, 260, 256, { sel });
      o += D.cr(who, cx, 408, 1.28, 1);
      o += D.label(CR[who].name[0] + CR[who].name.slice(1).toLowerCase(), cx, 438, 26, 'middle', sel);
      o += D.label(role, cx, 460, 15, 'middle', false, true);
    }
    o += D.btn(420, 512, 270, 54, 'PLAY', 'primary') + D.btn(710, 512, 150, 54, 'SETTINGS', 'secondary');
    return o;
  },
  levelup(D) {
    let o = D.bg('dim') + D.heading('LEVEL UP', 640, 86);
    CARDS.forEach((c, i) => { o += `<g transform="translate(${85 + i * 390} 128)">${D.card(c)}</g>`; });
    return o;
  },
  parts(D) {
    const tc = D.acc; let o = `<rect width="1280" height="604" fill="${D.sheetBg}"/>`;
    o += tagc(D.codes.L, 'LOGO', 14, 8, tc) + D.logo(215, 74, 0.5);
    o += tagc(D.codes.C, 'COLOUR', 440, 8, tc);
    D.pal.forEach(([h, n], i) => { const x = 470 + i * 84; o += `<circle cx="${x}" cy="62" r="23" fill="${h}" stroke="#fff" stroke-opacity=".8" stroke-width="2"/><text x="${x}" y="104" text-anchor="middle" font-family="Consolas,monospace" font-size="11" fill="#e6e9f5">${h}</text><text x="${x}" y="118" text-anchor="middle" font-family="Segoe UI" font-size="10" fill="#9aa3bd">${n}</text>`; });
    o += tagc('R', 'RARITY', 900, 8, tc);
    ['common', 'rare', 'epic', 'evolve'].forEach((r, i) => { o += D.chip(r, 912 + i * 92, 36); });
    o += tagc(D.codes.T, 'TYPE', 14, 134, tc);
    D.type.forEach(([f, w, s, sz, lab], i) => { o += T(s, 20, 184 + i * 38, { f, w, s: sz, c: D.txt }) + T(lab, 22, 184 + i * 38 + 13, { f: 'Consolas', s: 10, w: 400, c: '#8b93ad' }); });
    o += tagc(D.codes.B, 'BARS', 440, 134, tc) + D.bar(440, 164, 330, 24, 0.7, 'hp') + D.bar(440, 202, 330, 14, 0.45, 'xp') + T('HP 84/120', 446, 240, { f: D.bf, s: 13, c: D.txt, w: 600 });
    o += tagc(D.codes.I, 'ICONS', 800, 134, tc);
    ['wolf', 'raven', 'orb', 'heart', 'gem'].forEach((k, i) => { o += D.ico(k, 804 + i * 66, 160, 52); });
    o += tagc(D.codes.U, 'BUTTONS', 14, 282, tc) + D.btn(14, 308, 170, 44, 'PLAY', 'primary') + D.btn(196, 308, 130, 44, 'SETTINGS', 'secondary');
    o += tagc(D.codes.U, 'CARD', 350, 282, tc) + `<g transform="translate(350 306) scale(.24)">${D.card(CARDS[2])}</g>`;
    o += tagc(D.codes.U, 'HUD PLATE + DMG', 500, 282, tc) + D.plate(500, 308, 190, 44) + T('Lv 7', 524, 338, { f: D.hf, s: 22, c: D.ptxt || D.txt });
    o += D.dmg(740, 340, '22', false) + D.dmg(830, 350, '74', true) + D.gem(920, 330, 0) + D.gem(950, 330, 1);
    // creature sheet
    o += `<rect x="0" y="404" width="1280" height="200" fill="${D.sheetBg2}"/>` + tagc(D.codes.W, 'CREATURE SHEET (each its own vector definition)', 14, 410, tc);
    ORDER.forEach((id, i) => {
      const c = CR[id], cx = 80 + i * 160, base = 514, s = Math.min(70 / c.h, 118 / c.w, 1.15);
      o += `<line x1="${cx - 70}" x2="${cx + 70}" y1="${base + 2}" y2="${base + 2}" stroke="#fff" stroke-opacity=".12"/>` + D.cr(id, cx, base, s, 1);
      o += T(c.name, cx, 536, { f: 'Segoe UI', s: 12, w: 800, c: '#fff', a: 'middle' }) + T(c.idea, cx, 551, { f: 'Segoe UI', s: 10, w: 500, c: '#c9cfe6', a: 'middle' }) + T(c.pers, cx, 566, { f: 'Segoe UI', s: 10, w: 500, c: '#8b93ad', a: 'middle', i: 1 });
      o += T(c.kind === 'hero' ? 'HERO' : c.kind === 'summon' ? 'SUMMON' : c.kind === 'boss' ? 'BOSS' : 'ENEMY', cx, 581, { f: 'Consolas', s: 10, w: 700, c: D.acc, a: 'middle' });
    });
    o += T(D.note, 14, 598, { f: 'Segoe UI', s: 11, w: 500, c: '#8b93ad' });
    return o;
  },
};
