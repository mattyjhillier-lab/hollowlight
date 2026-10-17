// Enemies art round 2: page builders (static SVG -> PNG through ../wren-sheet/render.mjs). Mock-ups only, not game code.
import { resetAll, defs, f, glow, mix } from './paint.mjs';
import { TAKES, KEYS, ROLES, G } from './roster.mjs';

export const DESK_K = 2.34 / 4; // css px per du on desktop 1280x720 (camera zoom 2.34 px per world unit, 4 du per world unit) - same rule as round 1
export const PHONE_K = 1.3 / 4; // css px per du, phone landscape 844x390 @DPR2
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const FT = "Georgia,'Palatino Linotype',serif", FU = "'Segoe UI',Arial,sans-serif";
export const T = (s, x, y, o = {}) => `<text x="${x}" y="${y}" font-family="${o.f || FU}" font-size="${o.s || 14}" font-weight="${o.w || 600}" fill="${o.c || '#e8edf3'}" text-anchor="${o.a || 'start'}"${o.ls ? ` letter-spacing="${o.ls}"` : ''}${o.i ? ' font-style="italic"' : ''}>${esc(s)}</text>`;
export const wrap = (s, n) => { const w = String(s).split(' '), out = []; let l = ''; for (const x of w) { if ((l + ' ' + x).trim().length > n) { out.push(l.trim()); l = x; } else l += ' ' + x; } if (l.trim()) out.push(l.trim()); return out; };
const lines = (s, x, y, n, o = {}) => wrap(s, n).map((l, i) => T(l, x, y + i * (o.lh || 15), o)).join('');
export const page = (w, h, body, bg = '#0f141c') => `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;overflow:hidden;background:${bg}}svg{display:block}</style></head><body><svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${defs()}${body}</svg></body></html>`;

// draw a creature: light = day | dusk | night | lit | sil ; flip faces left
export function draw(fn, st, x, y, k, light = 'day', flip = false) {
  const p = fn(st), sx = flip ? -k : k, tr = `translate(${f(x)},${f(y)}) scale(${sx.toFixed(4)},${k.toFixed(4)})`;
  if (light === 'sil') return `<g transform="${tr}"><g filter="url(#silF)">${p.b}</g></g>`;
  const flt = { day: 'dayF', dusk: 'duskF', night: 'nightF', lit: '' }[light];
  let body = flt ? `<g filter="url(#${flt})">${p.b}</g>` : p.b;
  if (light === 'night' || light === 'dusk') body = `<g filter="url(#nightRim)" opacity=".75">${p.b}</g>` + body;
  const ea = light === 'lit' ? 0.55 : 1;
  return { b: `<g transform="${tr}">${body}</g>`, e: `<g transform="${tr}" opacity="${ea}">${p.e}</g>` };
}
const both = (d) => (typeof d === 'string' ? d : d.b + d.e);
const ground = (x, y, w, h, night, r = 10) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${night ? '#171a2e' : '#585e74'}"/><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" filter="url(#mottle)" opacity="${night ? 0.3 : 0.4}"/>`;
const card = (x, y, w, h, title, sub = '', hi = '#3a4757') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12" fill="#161e29" stroke="${hi}"/>${T(title, x + 12, y + 22, { s: 15, f: FT, w: 900, c: '#ffd98a' })}${sub ? T(sub, x + w - 12, y + 21, { s: 11, c: '#9fb0c2', a: 'end' }) : ''}`;
const MBIG = { wolf: 4.6, crow: 5.2, crawler: 4.3, spit: 4.9, bulb: 4.8, hart: 3.2, alpha: 2.6, treant: 1.0, chest: 4.9 };
const BIGY = { crow: -10, treant: 18, hart: 6 };

// ---------------- SHEET 1: bestiary (large detail + true size + silhouette + story/hook/personality) ----------------
export function bestiaryPage(id) {
  resetAll(); const t = TAKES[id], W = 1600, H = 1000; let b = `<rect width="${W}" height="${H}" fill="#0f141c"/>`;
  b += `<rect width="${W}" height="118" fill="#080b10"/><rect y="118" width="${W}" height="3" fill="${t.accent}"/>`;
  b += T(`TAKE ${id}: ${t.name}`, 20, 40, { s: 30, f: FT, w: 900, c: '#ffd98a', ls: 0.5 }) + T(t.tag, 36 + (t.name.length + 8) * 21, 39, { s: 16, i: 1, c: '#c9d3df' });
  b += lines(t.story, 20, 64, 175, { s: 13, c: '#c9d3df', w: 500 });
  b += T('LOOK: ' + t.look, 20, 108, { s: 12, c: '#9fb0c2', w: 600 });
  t.pal.forEach(([c, n], i) => { b += `<circle cx="${1230 + (i % 3) * 120}" cy="${i < 3 ? 28 : 54}" r="8" fill="${c}" stroke="#fff" stroke-opacity=".7"/>` + T(`${c} ${n}`, 1243 + (i % 3) * 120, i < 3 ? 32 : 58, { s: 10.5, f: 'Consolas,monospace', w: 700 }); });
  KEYS.forEach((key, i) => {
    const col = i % 3, row = Math.floor(i / 3), x = 16 + col * 528, y = 132 + row * 288, w = 516, h = 278, role = ROLES[i];
    b += card(x, y, w, h, t.names[key], role[1]);
    // stage: hollow ground + soft night-blue back light, big render
    b += `<ellipse cx="${x + 170}" cy="${y + 238}" rx="150" ry="22" fill="#4e566a"/><ellipse cx="${x + 170}" cy="${y + 238}" rx="150" ry="22" filter="url(#mottle)" opacity=".45"/>` + glow(x + 170, y + 150, 170, 110, '#3a4a70', 0.35, false);
    const fn = t.f[key], k = DESK_K * G[key] * MBIG[key];
    b += both(draw(fn, { ph: 0.15 }, x + 170 - (key === 'crawler' ? 6 : 0), y + 238 + (BIGY[key] || 0), k, 'lit'));
    // right column: true size day + night (+ silhouette at true size) and text
    const rx = x + 340, kk = DESK_K * G[key];
    b += ground(rx, y + 34, 164, 70, false, 8) + ground(rx, y + 108, 164, 70, true, 8);
    if (key === 'alpha') {
      b += both(draw(fn, { ph: 0.3 }, rx + 78, y + 98, kk, 'day')) + both(draw(fn, { ph: 0.3 }, rx + 78, y + 172, kk, 'lit')) + T('true size (miniboss: always fully lit)', rx + 4, y + 48, { s: 9, c: '#d9e1ea' });
    } else if (key !== 'treant') {
      b += both(draw(fn, { ph: 0.3 }, rx + 52, y + 96, kk, 'day')) + both(draw(fn, { ph: 0.3 }, rx + 52, y + 170, kk, 'night'));
      b += both(draw(fn, { ph: 0.3 }, rx + 128, y + 96, kk, 'sil')) + both(draw(fn, { ph: 0.3 }, rx + 128, y + 170, PHONE_K * G[key], 'night'));
      b += T('true size', rx + 4, y + 48, { s: 9.5, c: '#d9e1ea' }) + T('black', rx + 112, y + 48, { s: 9.5, c: '#d9e1ea' }) + T('night', rx + 4, y + 122, { s: 9.5, c: '#d9e1ea' }) + T('phone', rx + 112, y + 122, { s: 9.5, c: '#d9e1ea' });
    } else {
      b += both(draw(fn, {}, rx + 82, y + 102, kk * 0.28, 'day')) + both(draw(fn, {}, rx + 82, y + 176, kk * 0.28, 'night')) + T('shown at 0.28x true (boss is 150 px wide)', rx + 4, y + 48, { s: 9, c: '#d9e1ea' });
    }
    b += T('HOOK', rx, y + 196, { s: 10, c: t.accent === '#1e1a22' ? '#9aa3b2' : t.accent, w: 800 }) + lines(t.hooks[key], rx + 36, y + 196, 27, { s: 10, lh: 12, c: '#dfe6ee' });
    b += T('MOVES', rx, y + 238, { s: 10, c: '#9fb0c2', w: 800 }) + lines(t.moves[key], rx + 42, y + 238, 26, { s: 10, lh: 12, c: '#c9d3df', i: 1 });
    b += T(role[2], x + 12, y + 270, { s: 10, c: '#7f8fa2' });
  });
  return page(W, H, b);
}

// ---------------- SHEET 2: motion (walk x4, TELL, HURT, DEATH x3) ----------------
export function motionPage(id) {
  resetAll(); const t = TAKES[id], rows = ['wolf', 'crow', 'crawler', 'spit', 'bulb', 'hart', 'alpha'], W = 1600, RH = 122, H = 96 + rows.length * RH + 14;
  let b = `<rect width="${W}" height="${H}" fill="#0f141c"/><rect width="${W}" height="62" fill="#080b10"/><rect y="62" width="${W}" height="3" fill="${t.accent}"/>`;
  b += T(`TAKE ${id}: ${t.name} / MOTION + STATES`, 20, 40, { s: 26, f: FT, w: 900, c: '#ffd98a' }) + T('walk/idle x4 (code-driven bob, leg swing, tail/rag/smoke follow-through) | TELL (red-orange = danger only) | HURT (white flash + recoil) | DEATH x3', 640, 38, { s: 12.5, c: '#c9d3df' });
  const heads = ['WALK 1', 'WALK 2', 'WALK 3', 'WALK 4', 'TELL', 'HURT', 'DEATH 1', 'DEATH 2', 'DEATH 3'];
  heads.forEach((h, i) => { b += T(h, 330 + i * 140, 86, { s: 12, w: 800, c: i === 4 ? '#ff8a6a' : i === 5 ? '#ffffff' : i > 5 ? '#ffd27a' : '#9fb0c2', a: 'middle' }); });
  rows.forEach((key, r) => {
    const y = 96 + r * RH, fn = t.f[key], m = key === 'hart' ? 1.45 : key === 'alpha' ? 1.15 : key === 'crow' ? 2.1 : 1.9, k = DESK_K * G[key] * m;
    b += `<rect x="12" y="${y}" width="${W - 24}" height="${RH - 8}" rx="10" fill="#151c27" stroke="#2c3644"/>`;
    b += T(t.names[key], 24, y + 26, { s: 15, f: FT, w: 900, c: '#ffd98a' }) + lines(t.moves[key], 24, y + 46, 34, { s: 11, lh: 13, c: '#c9d3df', i: 1 });
    b += `<rect x="252" y="${y + 6}" width="${W - 276}" height="${RH - 20}" rx="8" fill="#525a6e"/><rect x="252" y="${y + 6}" width="${W - 276}" height="${RH - 20}" rx="8" filter="url(#mottle)" opacity=".4"/>`;
    const sts = [{ ph: 0 }, { ph: 0.25 }, { ph: 0.5 }, { ph: 0.75 }, { tele: 1 }, { hurt: 1, ph: 0.1 }, { die: 0.35 }, { die: 0.7 }, { die: 1 }];
    const gx = { crow: -4, crawler: 6, spit: 6, bulb: 4 }[key] || 0;
    sts.forEach((st, i) => { b += `<g clip-path="url(#clipRow${r}_${i})">` + both(draw(fn, st, 326 + i * 140 + gx, y + RH - 22, k, 'lit')) + '</g>'; });
    let cl = ''; sts.forEach((st, i) => { cl += `<clipPath id="clipRow${r}_${i}"><rect x="${258 + i * 140}" y="${y + 6}" width="138" height="${RH - 20}"/></clipPath>`; }); b += `<defs>${cl}</defs>`;
  });
  b += T('death story: ' + t.death, 24, H - 6, { s: 11.5, c: '#ffd98a', i: 1 });
  return page(W, H + 8, b);
}

// ---------------- WORLD: composite on a REAL build plate at true size ----------------
export const ITEMS = [
  ['wolf', -95, -20, { ph: 0.1 }], ['wolf', -122, 12, { ph: 0.45 }], ['wolf', -150, -42, { ph: 0.7 }], ['wolf', 62, 42, { ph: 0.3, tele: 1 }],
  ['crow', 72, -72, { ph: 0.2 }], ['crow', -42, -96, { ph: 0.6 }], ['crow', 188, -42, { ph: 0.8 }],
  ['crawler', 160, 74, { ph: 0.3 }], ['crawler', -205, 72, { ph: 0.7 }],
  ['spit', 214, -100, { tele: 0.8 }], ['bulb', -48, 64, { tele: 0.6 }], ['hart', 236, 18, { tele: 1 }],
  ['alpha', -236, -14, { ph: 0.3 }], ['chest', 44, 98, {}],
];
export function worldPage(id, plate, w, h, k, night, label = '') {
  resetAll(); const t = TAKES[id], cx = w / 2, cy = h / 2 + 22 * (k / DESK_K), R = 130;
  let b = `<image href="${plate}" x="0" y="0" width="${w}" height="${h}"/>`, eyes = '';
  const items = [...ITEMS].sort((p, q) => p[2] - q[2]);
  for (const [key, wx, wy, st] of items) {
    const x = cx + wx * 4 * k, y = cy + wy * 4 * k, d = Math.hypot(wx, wy), lit = d < R * 0.75 ? 1 : d > R * 1.25 ? 0 : 1 - (d - R * 0.75) / (R * 0.5);
    const light = key === 'chest' ? 'lit' : key === 'alpha' ? (night ? 'lit' : 'day') : night ? (lit > 0.5 ? 'lit' : lit > 0.15 ? 'dusk' : 'night') : 'day';
    const p = draw(t.f[key], st, x, y, k * G[key], light, wx > 0 && key !== 'chest');
    b += p.b; eyes += p.e;
  }
  b += eyes;
  if (label) b += `<rect x="${w / 2 - 230 * (k / DESK_K)}" y="${h - 34 * (k / DESK_K)}" width="${460 * (k / DESK_K)}" height="${24 * (k / DESK_K)}" rx="${12 * (k / DESK_K)}" fill="#080b10" opacity=".8"/>` + T(label, w / 2, h - 17 * (k / DESK_K), { s: 12 * (k / DESK_K), a: 'middle', c: '#ffd98a', w: 700 });
  return page(w, h, b);
}

// ---------------- COMPARE: the three takes side by side at true size, day + night, silhouettes, 3x zoom ----------------
export function comparePage(plates) {
  resetAll(); const W = 1600, H = 1060; let b = `<rect width="${W}" height="${H}" fill="#0f141c"/><rect width="${W}" height="58" fill="#080b10"/>`;
  b += T('ROUND 2 COMPARE: the three takes, same line-up, TRUE desktop size (1:1) on real-build ground, day (11:30 grey light) and night (0:30 dark start)', 20, 36, { s: 19, f: FT, w: 900, c: '#ffd98a' });
  const lineup = ['wolf', 'crow', 'crawler', 'spit', 'bulb', 'hart', 'alpha', 'chest'];
  ['A', 'B', 'C'].forEach((id, r) => {
    const t = TAKES[id], y = 70 + r * 328;
    b += `<rect x="12" y="${y}" width="${W - 24}" height="318" rx="12" fill="#151c27" stroke="${r === 0 ? '#7fd08a' : '#2c3644'}"/>`;
    b += T(`TAKE ${id}: ${t.name}`, 26, y + 28, { s: 20, f: FT, w: 900, c: '#ffd98a' }) + T(t.tag, 26, y + 48, { s: 12, i: 1, c: '#c9d3df' }) + (r === 0 ? T('RECOMMENDED', W - 30, y + 28, { s: 13, w: 900, c: '#7fd08a', a: 'end' }) : '');
    // day strip (real plate crop as ground) and night strip
    for (const [j, night] of [[0, false], [1, true]]) {
      const sy = y + 60 + j * 116, sx = 26, sw = 1100, sh = 108;
      b += `<svg x="${sx}" y="${sy}" width="${sw}" height="${sh}" viewBox="${night ? '60 470 1100 108' : '60 470 1100 108'}"><image href="${night ? plates.night : plates.day}" x="0" y="0" width="1280" height="720"/></svg><rect x="${sx}" y="${sy}" width="${sw}" height="${sh}" rx="6" fill="none" stroke="#2c3644"/>`;
      b += T(night ? 'NIGHT 1:1' : 'DAY 1:1', sx + 8, sy + 16, { s: 10.5, w: 800, c: '#ffd98a' });
      lineup.forEach((key, i) => { const x = sx + 70 + i * 132 + (key === 'alpha' ? 20 : 0); const p = draw(t.f[key], { ph: 0.3 }, x, sy + sh - 14, DESK_K * G[key], key === 'chest' ? 'lit' : night ? (key === 'alpha' ? 'lit' : 'night') : 'day'); b += p.b + p.e; });
    }
    // silhouettes at 30 px tall (the readability rule) + names
    const sx2 = 1146; b += `<rect x="${sx2}" y="${y + 60}" width="430" height="224" rx="6" fill="#d9dee6"/>` + T('black fill at ~30 px tall (if it reads black, it reads)', sx2 + 8, y + 76, { s: 10.5, w: 700, c: '#2a3240' });
    ['wolf', 'crow', 'crawler', 'spit', 'bulb', 'hart', 'alpha'].forEach((key, i) => { const fn = t.f[key]; const hDu = { wolf: 70, crow: 70, crawler: 64, spit: 70, bulb: 56, hart: 125, alpha: 78 }[key]; const k = (key === 'alpha' ? 48 : 30) / hDu;
      const x = sx2 + 40 + (i % 4) * 104, yy = y + 140 + Math.floor(i / 4) * 92; b += both(draw(fn, { ph: 0.3 }, x, yy, k, 'sil')) + T(t.names[key].split(' (')[0], x, yy + 16, { s: 9.5, c: '#2a3240', a: 'middle', w: 700 }); });
  });
  return page(W, H, b);
}

// ---------------- DIAGNOSIS: why the current enemies and round 1 read as generic ----------------
export function diagnosisPage(img) {
  resetAll(); const W = 1600, H = 900; let b = `<rect width="${W}" height="${H}" fill="#0f141c"/><rect width="${W}" height="58" fill="#080b10"/>`;
  b += T('WHY THE CURRENT ENEMIES AND THE ROUND 1 MOCK-UPS READ AS GENERIC', 20, 38, { s: 24, f: FT, w: 900, c: '#ffd98a' });
  const crop = (src, vx, vy, vw, vh, x, y, w, h, title) => `<rect x="${x - 4}" y="${y - 24}" width="${w + 8}" height="${h + 30}" rx="8" fill="#151c27" stroke="#2c3644"/>${T(title, x + 4, y - 8, { s: 12, w: 800, c: '#ffd98a' })}<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="${vx} ${vy} ${vw} ${vh}" preserveAspectRatio="xMidYMid slice"><image href="${src}" x="0" y="0" width="${img.wl}" height="${img.hl}" style="image-rendering:pixelated"/></svg>`;
  const crop2 = (src, iw, ih, vx, vy, vw, vh, x, y, w, h, title) => `<rect x="${x - 4}" y="${y - 24}" width="${w + 8}" height="${h + 30}" rx="8" fill="#151c27" stroke="#2c3644"/>${T(title, x + 4, y - 8, { s: 12, w: 800, c: '#ffd98a' })}<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="${vx} ${vy} ${vw} ${vh}" preserveAspectRatio="xMidYMid slice"><image href="${src}" x="0" y="0" width="${iw}" height="${ih}"/></svg>`;
  b += crop(img.live, 455, 115, 140, 85, 24, 96, 360, 218, 'LIVE BUILD NOW (3x zoom): an enemy above your ghost wolf');
  b += crop(img.live, 150, 470, 140, 85, 24, 350, 360, 218, 'LIVE BUILD NOW (3x zoom): another enemy');
  b += crop2(img.r1, 1700, 878, 14, 96, 556, 236, 404, 96, 540, 228, 'ROUND 1 (rejected): Fell Wolf A, at its big size');
  b += crop2(img.r1, 1700, 878, 14, 628, 556, 236, 404, 350, 540, 228, 'ROUND 1 (rejected): Root Crawler A');
  b += crop2(img.hero, 1280, 720, 10, 100, 640, 290, 958, 96, 620, 282, 'THE BAR: Wren v2 sheet (same tools, hero quality)');
  const pts = [
    ['1 Template animals', 'every enemy is a realistic side-view wolf / crow / spider template with thin legs and a small head; the heroes are P1 chibi (big head, round). The enemies are drawn in a different proportion system, so they look borrowed.'],
    ['2 Flat value, one fill', 'one plum-grey fill per creature, a thin rim line, no form shadow and no second material. Heroes have 3-4 materials (pelt, cloth, bone, light). Same-value bodies melt into the grey ground.'],
    ['3 Detail = stripes', 'the only detail is rib stripes and spikes: the "skeleton dog" cliché that every dark-fantasy pack ships. No texture language (fur ticks, bark grain, weave, wax) of their own.'],
    ['4 No signature hook', 'nothing you could name from a black silhouette. The heroes each carry one story object (Wren\'s ember + pup, Elias\'s candle wheel); the enemies carry nothing.'],
    ['5 Eyes are stickers', 'two identical ember dots on a dark head, the same on every type. No socket, no void, no shape change: the face never reads as "hollowed", only as "red dots".'],
    ['6 No story, no world link', 'they do not show what the Hollow did to them, and nothing ties them to the restoring-colour myth or to the Treant boss. They could be from any game.'],
    ['7 Live build is worse', 'the in-game enemies are 18 x 12 world-unit canvas blobs from stage 1: at true size they are a dark smear + an eye. The new art must be a full replacement, not a polish pass.'],
  ];
  pts.forEach(([h, s], i) => { const x = 24 + (i % 2) * 790, y = 610 + Math.floor(i / 2) * 70; b += T(h, x, y, { s: 14, f: FT, w: 900, c: '#ffb08a' }) + lines(s, x, y + 18, 118, { s: 12, c: '#c9d3df', lh: 15 }); });
  b += T('Fix applied in round 2: chibi proportions like the heroes, 3-value material design (dark body / mid secondary / pale or dark signature piece), a nameable hook per creature, sockets + void faces, a family story, death that returns colour.', 24, 885, { s: 12.5, w: 700, c: '#7fd08a' });
  return page(W, H, b);
}
