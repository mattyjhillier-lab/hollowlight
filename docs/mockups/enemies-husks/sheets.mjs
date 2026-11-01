// HUSKS options round: page builders (static SVG -> PNG via ../wren-sheet/render.mjs). Mock-ups only, not game code.
import { resetAll, defs, f, glow } from '../enemies-art2/paint.mjs';
import { EXTRA_DEFS } from './kit.mjs';
import { PIECES, FAMILY } from './roster.mjs';

export const DESK_K = 2.34 / 4, PHONE_K = 1.3 / 4; // css px per du (same true-size rule as rounds 1-2)
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const FT = "Georgia,'Palatino Linotype',serif", FU = "'Segoe UI',Arial,sans-serif";
const T = (s, x, y, o = {}) => `<text x="${f(x)}" y="${f(y)}" font-family="${o.f || FU}" font-size="${o.s || 13}" font-weight="${o.w || 600}" fill="${o.c || '#e8edf3'}" text-anchor="${o.a || 'start'}"${o.i ? ' font-style="italic"' : ''}>${esc(s)}</text>`;
const wrap = (s, n) => { const w = String(s).split(' '), out = []; let l = ''; for (const x of w) { if ((l + ' ' + x).trim().length > n) { out.push(l.trim()); l = x; } else l += ' ' + x; } if (l.trim()) out.push(l.trim()); return out; };
const para = (s, x, y, n, o = {}) => { const L = wrap(s, n); return { svg: L.map((l, i) => T(l, x, y + i * (o.lh || 14), o)).join(''), h: L.length * (o.lh || 14) }; };
const page = (w, h, body) => `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;overflow:hidden;background:#0f141c}svg{display:block}</style></head><body><svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${defs()}<defs>${EXTRA_DEFS}</defs>${body}</svg></body></html>`;
const PL = (rel, name) => `${rel}/${name}.jpg`;

// draw one creature: light = day | dusk | night | lit | sil
export function draw(fn, st, x, y, k, light = 'lit', flip = false) {
  const p = fn(st), tr = `translate(${f(x)},${f(y)}) scale(${(flip ? -k : k).toFixed(4)},${k.toFixed(4)})`;
  if (light === 'sil') return { b: `<g transform="${tr}"><g filter="url(#silF)">${p.b}</g></g>`, e: '' };
  const flt = { day: 'dayF', dusk: 'duskF', night: 'nightF', lit: '' }[light];
  let body = flt ? `<g filter="url(#${flt})">${p.b}</g>` : p.b;
  if (light === 'night' || light === 'dusk') body = `<g filter="url(#nightRim)" opacity=".75">${p.b}</g>` + body;
  return { b: `<g transform="${tr}">${body}</g>`, e: p.e ? `<g transform="${tr}">${p.e}</g>` : '' };
}
const both = (d) => d.b + d.e;
const ground = (x, y, w, h, night, r = 8) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${night ? '#171a2e' : '#585e74'}"/><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" filter="url(#mottle)" opacity="${night ? 0.3 : 0.4}"/>`;
const states = (key) => key === 'chest' ? [{ tier: 0 }, { tier: 1 }, { tier: 2 }, { tier: 2, open: 0.35 }, { tier: 2, open: 0.7 }, { tier: 2, open: 1 }] : [{ ph: 0 }, { ph: 0.25 }, { ph: 0.5 }, { ph: 0.75 }, { tele: 1 }, { hurt: 1, ph: 0.1 }, { die: 0.3 }, { die: 0.65 }, { die: 1 }];
const heads = (key) => key === 'chest' ? ['SMALL', 'MEDIUM', 'LARGE', 'OPEN 1', 'OPEN 2', 'OPEN 3'] : ['WALK 1', 'WALK 2', 'WALK 3', 'WALK 4', 'TELL', 'HURT', 'DEATH 1', 'DEATH 2', 'DEATH 3'];
// crop placements (px from the hero's feet) per piece, facing the hero
const PLACE = {
  wolf: [[78, -18, { ph: 0.1 }], [150, 22, { tele: 1 }], [212, -34, { ph: 0.6 }], [262, 10, { ph: 0.35 }]],
  crow: [[90, -40, { ph: 0.2 }], [170, -10, { ph: 0.6 }], [244, -50, { ph: 0.85 }]],
  crawler: [[110, -6, { ph: 0.3 }], [222, 16, { tele: 0.8 }]],
  spit: [[120, -24, { ph: 0.3 }], [232, 14, { tele: 1 }]],
  bulb: [[100, -14, { ph: 0.2 }], [212, 18, { tele: 0.7 }]],
  hart: [[132, 20, { tele: 1 }], [236, -10, { ph: 0.3 }]],
  alpha: [[170, 14, { ph: 0.3 }]],
  chest: [[90, 22, { tier: 2 }], [170, -8, { tier: 1 }], [240, 22, { tier: 0 }]],
  treant: [[190, 40, {}]],
};
const crop = (plateUrl, iw, ih, hx, hy, w, h, key, fn, g, k, night, x, y, label) => {
  const vx = hx - 110, vy = hy - h + 50; let b = '', e = '';
  for (const [dx, dy, st] of PLACE[key]) { const d = Math.hypot(dx, dy * 2), light = key === 'chest' ? 'lit' : key === 'alpha' || key === 'treant' ? (night ? 'lit' : 'day') : night ? (d < 150 ? 'lit' : d < 230 ? 'dusk' : 'night') : 'day';
    const p = draw(fn, st, hx + dx, hy + dy, k * g, light, true); b += p.b; e += p.e; }
  return `<rect x="${x - 3}" y="${y - 3}" width="${w + 6}" height="${h + 6}" rx="6" fill="#1c2430"/><svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="${vx} ${vy} ${w} ${h}"><image href="${plateUrl}" x="0" y="0" width="${iw}" height="${ih}"/>${b}${e}</svg>`
    + `<rect x="${x}" y="${y + h - 18}" width="${w}" height="18" fill="#080b10" opacity=".72"/>` + T(label, x + 6, y + h - 5, { s: 10.5, w: 700, c: '#ffd98a' });
};

// ---------------- one PIECE sheet: A/B/C large, A at true size on real frames with Wren + Elias, A motion, cost ----------------
export function piecePage(pc, rel) {
  resetAll(); const W = 1600, H = 1000; let b = `<rect width="${W}" height="${H}" fill="#0f141c"/><rect width="${W}" height="66" fill="#080b10"/><rect y="66" width="${W}" height="3" fill="#bdbba6"/>`;
  b += T(`${pc.n} / 9   ${pc.title}`, 18, 30, { s: 24, f: FT, w: 900, c: '#ffd98a' }) + T(`HUSKS options round: three genuinely different designs, A recommended. ${pc.role}`, 18, 52, { s: 12.5, c: '#c9d3df' });
  b += para('BEHAVIOUR + TELL: ' + pc.beh, 840, 18, 124, { s: 10.5, c: '#c9d3df', lh: 12 }).svg + T('EYES: ' + pc.eyes, 840, 60, { s: 10.5, c: '#ff9a7a', w: 700 });
  const [dw, dh] = pc.dims, big = Math.min(400 / dw, 226 / dh);
  pc.opts.forEach((o, i) => {
    const x = 16 + i * 528, y = 78, w = 516, h = 482, fn = pc.fns[i];
    b += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12" fill="#161e29" stroke="${i === 0 ? '#7fd08a' : '#3a4757'}" stroke-width="${i === 0 ? 2 : 1}"/>`;
    b += T(`${o.id}  ${o.name}`, x + 14, y + 26, { s: 19, f: FT, w: 900, c: '#ffd98a' }) + (i === 0 ? T('RECOMMENDED', x + w - 14, y + 25, { s: 12, w: 900, c: '#7fd08a', a: 'end' }) : '');
    // stage
    const sx = x + w / 2 - 46, gy = y + 286;
    b += `<ellipse cx="${sx}" cy="${gy}" rx="180" ry="24" fill="#4e566a"/><ellipse cx="${sx}" cy="${gy}" rx="180" ry="24" filter="url(#mottle)" opacity=".45"/>` + glow(sx, gy - 110, 220, 130, '#3a4a70', 0.35, false);
    const st0 = pc.key === 'chest' ? { tier: 2 } : { ph: 0.15 };
    b += both(draw(fn, st0, sx - pc.cx * big, gy, big, 'lit'));
    // insets: true size day / night / silhouette 30 px + 60 px
    const ix = x + w - 74, k1 = DESK_K * pc.g * (pc.key === 'treant' ? 0.3 : 1), cl = (yy, hh, inner) => `<svg x="${ix}" y="${yy}" width="62" height="${hh}" viewBox="${ix} ${yy} 62 ${hh}" overflow="hidden">${inner}</svg>`;
    const st1 = pc.key === 'chest' ? { tier: 2 } : { ph: 0.3 };
    b += ground(ix, y + 40, 62, 58, false) + cl(y + 40, 58, both(draw(fn, st1, ix + 31 - pc.cx * k1, y + 90, k1, 'day'))) + T(pc.key === 'treant' ? '0.3x' : '1:1 day', ix + 3, y + 51, { s: 8.5, c: '#e6ecf3' });
    b += ground(ix, y + 104, 62, 58, true) + cl(y + 104, 58, both(draw(fn, st1, ix + 31 - pc.cx * k1, y + 154, k1, pc.key === 'alpha' || pc.key === 'treant' || pc.key === 'chest' ? 'lit' : 'night'))) + T(pc.key === 'alpha' ? 'night (lit)' : 'night', ix + 3, y + 115, { s: 8.5, c: '#e6ecf3' });
    const k30 = 30 / dh, k60 = 60 / dh;
    b += `<rect x="${ix}" y="${y + 168}" width="62" height="104" rx="6" fill="#d9dee6"/>` + both(draw(fn, st1, ix + 31 - pc.cx * k60, y + 236, k60, 'sil')) + both(draw(fn, st1, ix + 31 - pc.cx * k30, y + 266, k30, 'sil')) + T('black 60/30', ix + 4, y + 179, { s: 8.5, c: '#2a3240', w: 700 });
    // text
    let ty = y + 318;
    for (const [lab, txt, c] of [['STORY', o.story, '#c9d3df'], ['SILHOUETTE HOOK', o.hook, '#e8edf3'], ['PERSONALITY + ANIMATION', o.moves, '#c9d3df'], ['MASK', o.mask, '#d8d3bd'], ['RISK', o.risk, '#ffb08a']]) {
      b += T(lab, x + 14, ty, { s: 9, w: 800, c: '#8fa2b8' }); const p = para(txt, x + 14, ty + 12, 92, { s: 10.5, c, lh: 12.5, w: 500 }); b += p.svg; ty += 13 + p.h; }
  });
  // bottom left: A at TRUE size on the real build frames, next to Wren and Elias
  b += T(`A "${pc.opts[0].name}" at TRUE SIZE on the real build frames (1:1 css px, enemies composited on the round-1 plates, eyes above the night)`, 18, 584, { s: 12, w: 800, c: '#ffd98a' });
  const fnA = pc.fns[0], P = (n) => PL(rel, n);
  b += crop(P('desk-night-wren'), 1280, 720, 640, 382, 390, 188, pc.key, fnA, pc.g, DESK_K, true, 18, 594, 'DESKTOP 0:30 dark start + Wren (1:1)');
  b += crop(P('desk-day-elias'), 1280, 720, 640, 382, 390, 188, pc.key, fnA, pc.g, DESK_K, false, 416, 594, 'DESKTOP 11:30 grey light + Elias (1:1)');
  b += crop(P('desk-day-wren'), 1280, 720, 640, 382, 390, 188, pc.key, fnA, pc.g, DESK_K, false, 18, 798, 'DESKTOP day + Wren (1:1)');
  b += crop(P('phone-night-wren'), 844, 390, 422, 207, 390, 188, pc.key, fnA, pc.g, PHONE_K, true, 416, 798, 'PHONE 844x390 night + Wren (1:1 css px)');
  // bottom right: motion of A
  const mx = 822, mw = 762;
  b += `<rect x="${mx}" y="572" width="${mw}" height="420" rx="12" fill="#151c27" stroke="#2c3644"/>`;
  if (pc.key !== 'treant') {
    const sts = states(pc.key), hd = heads(pc.key), cw = mw / sts.length, mk = Math.min(2, 120 / (dh * pc.g * DESK_K), (cw - 6) / (dw * pc.g * DESK_K)) * DESK_K * pc.g;
    b += T(`A MOTION: ${(mk / (DESK_K * pc.g)).toFixed(1)}x true, then 1:1 below | tell = red-orange decal + body cue | hurt = flash + squash | death = mask pops off, warm mote`, mx + 12, 592, { s: 10.5, w: 700, c: '#c9d3df' });
    b += `<rect x="${mx + 8}" y="600" width="${mw - 16}" height="150" rx="8" fill="#525a6e"/><rect x="${mx + 8}" y="600" width="${mw - 16}" height="150" rx="8" filter="url(#mottle)" opacity=".4"/>`;
    b += `<rect x="${mx + 8}" y="758" width="${mw - 16}" height="60" rx="8" fill="#525a6e"/><rect x="${mx + 8}" y="758" width="${mw - 16}" height="60" rx="8" filter="url(#mottle)" opacity=".4"/>`;
    let cl = '';
    sts.forEach((st, i) => { const cx = mx + cw * (i + 0.5); cl += `<clipPath id="mc${i}"><rect x="${f(mx + 8 + cw * i)}" y="600" width="${f(cw)}" height="150"/></clipPath><clipPath id="md${i}"><rect x="${f(mx + 8 + cw * i)}" y="758" width="${f(cw)}" height="60"/></clipPath>`;
      b += T(hd[i], cx, 614, { s: 10, w: 800, a: 'middle', c: hd[i] === 'TELL' ? '#ff8a6a' : hd[i] === 'HURT' ? '#ffffff' : hd[i].startsWith('DEATH') ? '#ffd27a' : '#e6ecf3' });
      b += `<g clip-path="url(#mc${i})">${both(draw(fnA, st, cx - pc.cx * mk, 736, mk, 'lit'))}</g>` + `<g clip-path="url(#md${i})">${both(draw(fnA, st, cx - pc.cx * DESK_K * pc.g, 812, DESK_K * pc.g, 'day'))}</g>`; });
    b += `<defs>${cl}</defs>`;
  } else {
    // family line-up: the Treant hint beside every A husk at the same scale (shows where the masks come from)
    b += T('FAMILY LINE-UP at 1.4x true: every recommended Husk beside The First Husk (all masks come from its bark)', mx + 12, 592, { s: 10.5, w: 700, c: '#c9d3df' });
    b += `<rect x="${mx + 8}" y="600" width="${mw - 16}" height="218" rx="8" fill="#525a6e"/><rect x="${mx + 8}" y="600" width="${mw - 16}" height="218" rx="8" filter="url(#mottle)" opacity=".4"/>`;
    const k = 1.4 * DESK_K; b += both(draw(fnA, {}, mx + 110, 808, k * pc.g * 0.6, 'lit')) + T('Treant at 0.6 of that', mx + 60, 630, { s: 9, c: '#e6ecf3' });
    let xx = mx + 230; for (const q of PIECES.filter((p) => !['treant', 'chest'].includes(p.key))) { const kk = k * q.g; b += both(draw(q.fns[0], q.key === 'chest' ? { tier: 2 } : { ph: 0.3 }, xx + q.dims[0] * kk / 2 - q.cx * kk, 808, kk, 'lit')); xx += q.dims[0] * kk * 0.86 + 6; }
  }
  // cost + rig
  const fr = pc.frames, wpx = Math.ceil(pc.dims[0] * pc.g * DESK_K * 2) + 8, hpx = Math.ceil(pc.dims[1] * pc.g * DESK_K * 2) + 8, kb = Math.round(wpx * hpx * 4 * Math.max(1, fr) / 1024);
  const cost = pc.key === 'treant' ? 'BUILD: boss uses the live part rig (sheet #7); not in the chapter enemy atlas.'
    : pc.key === 'alpha' ? `BUILD: ${fr} baked frames at 2x (~${wpx}x${hpx} px each, ~${kb} KB RGBA) for Low; Med/High use the LIVE part rig (body, head+mask, mane/cages/plates, tail, 4 legs = ~9 parts) like the heroes. Amber eye images x3.`
    : pc.key === 'chest' ? `BUILD: 4 baked frames (3 tiers closed + open) at 2x (~${wpx}x${hpx} px, ~${kb} KB); open = lid tween + light spill sprite; no eyes.`
    : `BUILD: ${fr} baked frames (walk 4, tell 1, death 3, + 1 loose mask sprite) at 2x: ~${wpx}x${hpx} px each, ~${kb} KB RGBA in the ONE chapter atlas; hurt = shared tint + squash (0 frames).`;
  b += para(cost, mx + 12, 840, 120, { s: 10.5, c: '#d9e1ea', lh: 13 }).svg;
  b += para('TIERS: High = all frames, death wisps+ash (pool 40), mask-pop sprite (24), warm mote every kill (40). Med = all frames, wisps 20, mask-pop 12, motes 20. Low = walk x2 + tell + hurt tint, death = quick fade + mote (cap 8), no mask-pop, flat eyes (WL6b Low). Phone x0.6 on effect caps.', mx + 12, 872, 120, { s: 10.5, c: '#9fb0c2', lh: 13 }).svg;
  b += para(`RIG: enemyart.js (pure vector defs like wrenart.js) -> enemytex.js bakes every frame at boot into ONE chapter atlas (like rigtex.js) -> 1 sprite per enemy + frame swap, phase from distance moved, per-enemy offset; eyes = separate eye images above the night (WL6b); miniboss/boss = live part rig on Med/High. Death sprout+flower only on elites/minibosses (locked).`, mx + 12, 918, 120, { s: 10.5, c: '#9fb0c2', lh: 13 }).svg;
  return page(W, H, b);
}

// ---------------- OVERVIEW: all 27 options at one honest scale (2x true) + silhouettes + the mask rules ----------------
export function overviewPage(rel) {
  resetAll(); const W = 1600, H = 1000; let b = `<rect width="${W}" height="${H}" fill="#0f141c"/><rect width="${W}" height="62" fill="#080b10"/><rect y="62" width="${W}" height="3" fill="#bdbba6"/>`;
  b += T('HUSKS: 9 pieces x 3 options (A recommended, top row) at ONE scale (2x true desktop size), so relative sizes are honest', 18, 30, { s: 20, f: FT, w: 900, c: '#ffd98a' });
  b += T('Mask rules (anti Hollow Knight): ' + FAMILY.maskRules.slice(0, 3).join(' | '), 18, 46, { s: 10, c: '#d8d3bd' }) + T(FAMILY.maskRules.slice(3).join(' | '), 18, 58, { s: 10, c: '#d8d3bd' });
  const cw = 156, x0 = 190, k2 = 2 * DESK_K;
  // hero reference column: Wren + Elias crops from the real build at 2x (upscaled, honest blur)
  b += `<rect x="12" y="74" width="168" height="912" rx="10" fill="#151c27" stroke="#2c3644"/>` + T('HEROES at 2x', 22, 96, { s: 12, w: 800, c: '#ffd98a' }) + T('(real build, upscaled)', 22, 110, { s: 9.5, c: '#9fb0c2' });
  for (const [j, n, lab] of [[0, 'desk-day-wren', 'Wren'], [1, 'desk-day-elias', 'Elias']]) b += `<svg x="30" y="${130 + j * 160}" width="132" height="140" viewBox="607 316 66 70"><image href="${PL(rel, n)}" x="0" y="0" width="1280" height="720"/></svg>` + T(lab, 96, 286 + j * 160, { s: 11, a: 'middle', w: 700 });
  b += para('Enemies are sized so the wolf is about hero-sized (~50 px), as Matt locked. The miniboss is the wolf x1.7; the Treant is shown at 0.35x of 2x.', 22, 480, 26, { s: 10, c: '#9fb0c2', lh: 13 }).svg;
  PIECES.forEach((pc, c) => {
    const x = x0 + c * cw;
    b += T(`${pc.n} ${pc.title.split(' (')[0].replace(' ROLE', '')}`, x + cw / 2, 88, { s: 10.5, w: 800, a: 'middle', c: '#ffd98a' });
    pc.opts.forEach((o, r) => {
      const y = 96 + r * 296, k = Math.min(k2 * pc.g * (pc.key === 'treant' ? 0.35 : 1), (cw - 16) / pc.dims[0], 176 / pc.dims[1]);
      b += `<rect x="${x + 2}" y="${y}" width="${cw - 4}" height="286" rx="8" fill="${r === 0 ? '#1b2633' : '#161e29'}" stroke="${r === 0 ? '#7fd08a' : '#2c3644'}"/>`;
      b += `<rect x="${x + 6}" y="${y + 8}" width="${cw - 12}" height="186" rx="6" fill="#525a6e"/><rect x="${x + 6}" y="${y + 8}" width="${cw - 12}" height="186" rx="6" filter="url(#mottle)" opacity=".4"/>`;
      const st = pc.key === 'chest' ? { tier: 2 } : { ph: 0.2 };
      b += `<svg x="${x + 6}" y="${y + 8}" width="${cw - 12}" height="186" viewBox="${x + 6} ${y + 8} ${cw - 12} 186" overflow="hidden">${both(draw(pc.fns[r], st, x + cw / 2 - pc.cx * k, y + 182, k, 'lit'))}</svg>`;
      b += T(`${o.id} ${o.name}`, x + cw / 2, y + 210, { s: 11, w: 800, a: 'middle', c: r === 0 ? '#7fd08a' : '#e8edf3' });
      // silhouette 30 px + true size day + night
      b += `<rect x="${x + 8}" y="${y + 218}" width="44" height="60" rx="5" fill="#d9dee6"/>` + both(draw(pc.fns[r], st, x + 30 - pc.cx * (30 / pc.dims[1]), y + 268, 30 / pc.dims[1], 'sil'));
      const k1 = DESK_K * pc.g * (pc.key === 'treant' ? 0.3 : 1), clipB = (bx, inner) => `<svg x="${bx}" y="${y + 218}" width="44" height="60" viewBox="${bx} ${y + 218} 44 60" overflow="hidden">${inner}</svg>`;
      if (k < k2 * pc.g * (pc.key === 'treant' ? 0.35 : 1) * 0.98) b += T(`shown at ${(k / (DESK_K * pc.g)).toFixed(1)}x`, x + cw - 10, y + 22, { s: 9, a: 'end', c: '#ffd98a' });
      b += ground(x + 56, y + 218, 44, 60, false, 5) + clipB(x + 56, both(draw(pc.fns[r], st, x + 78 - pc.cx * k1, y + 270, k1, 'day')));
      b += ground(x + 104, y + 218, 44, 60, true, 5) + clipB(x + 104, both(draw(pc.fns[r], st, x + 126 - pc.cx * k1, y + 270, k1, pc.key === 'alpha' || pc.key === 'chest' || pc.key === 'treant' ? 'lit' : 'night')));
    });
  });
  b += T('each card: big = 2x true | bottom: black at 30 px | 1:1 day | 1:1 night', x0, 994, { s: 10, c: '#9fb0c2' });
  return page(W, H, b);
}

// ---------------- WORLD: the whole recommended (A) roster at true size on a real build plate ----------------
const ITEMS = [
  ['wolf', -95, -20, { ph: 0.1 }], ['wolf', -122, 12, { ph: 0.45 }], ['wolf', -150, -42, { ph: 0.7 }], ['wolf', 62, 42, { ph: 0.3, tele: 1 }], ['wolf', -60, 70, { ph: 0.6 }],
  ['crow', 72, -72, { ph: 0.2 }], ['crow', -42, -96, { ph: 0.6 }], ['crow', 188, -42, { ph: 0.8 }],
  ['crawler', 160, 74, { ph: 0.3 }], ['crawler', -205, 72, { ph: 0.7 }],
  ['spit', 214, -100, { tele: 0.8 }], ['bulb', -48, 64, { tele: 0.6 }], ['hart', 236, 18, { tele: 1 }],
  ['alpha', -236, -14, { ph: 0.3 }], ['chest', 44, 98, { tier: 2 }],
];
export function worldPage(plateUrl, w, h, k, night, label = '') {
  resetAll(); const cx = w / 2, cy = h / 2 + 22 * (k / DESK_K), R = 130, by = Object.fromEntries(PIECES.map((p) => [p.key, p]));
  let b = `<image href="${plateUrl}" x="0" y="0" width="${w}" height="${h}"/>`, eyes = '';
  for (const [key, wx, wy, st] of [...ITEMS].sort((p, q) => p[2] - q[2])) {
    const pc = by[key], x = cx + wx * 4 * k, y = cy + wy * 4 * k, d = Math.hypot(wx, wy), lit = d < R * 0.75 ? 1 : d > R * 1.25 ? 0 : 1 - (d - R * 0.75) / (R * 0.5);
    const light = key === 'chest' ? 'lit' : key === 'alpha' ? (night ? 'lit' : 'day') : night ? (lit > 0.5 ? 'lit' : lit > 0.15 ? 'dusk' : 'night') : 'day';
    const p = draw(pc.fns[0], st, x, y, k * pc.g, light, wx > 0 && key !== 'chest'); b += p.b; eyes += p.e;
  }
  b += eyes;
  const s = k / DESK_K;
  if (label) b += `<rect x="${w / 2 - 260 * s}" y="${h - 34 * s}" width="${520 * s}" height="${24 * s}" rx="${12 * s}" fill="#080b10" opacity=".8"/>` + T(label, w / 2, h - 17 * s, { s: 12 * s, a: 'middle', c: '#ffd98a', w: 700 });
  return page(w, h, b);
}
