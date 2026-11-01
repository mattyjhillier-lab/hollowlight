// Boss sheet #7 page builders (static SVG over the REAL build plates; mock-ups only, not game code).
import { resetAll, defs, f, glow, mix, rng, circ, ell, line, blob } from '../enemies-art2/paint.mjs';
import { EXTRA_DEFS, K, S, P } from '../enemies-husks/kit.mjs';
import { treantA, treantB, treantC, treantDeath, seedPod } from './treant.mjs';
import * as SC from './scenes.mjs';

export const DESK = 2.34, PHONE = 1.3; // css px per WORLD unit (same true-size rule as the enemy sheets; 4 du = 1 world unit)
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const FT = "Georgia,'Palatino Linotype',serif", FU = "'Segoe UI',Arial,sans-serif";
export const T = (s, x, y, o = {}) => `<text x="${f(x)}" y="${f(y)}" font-family="${o.f || FU}" font-size="${o.s || 13}" font-weight="${o.w || 600}" fill="${o.c || '#e8edf3'}" text-anchor="${o.a || 'start'}"${o.i ? ' font-style="italic"' : ''}${o.op ? ` opacity="${o.op}"` : ''}>${esc(s)}</text>`;
const wrap = (s, n) => { const w = String(s).split(' '), out = []; let l = ''; for (const x of w) { if ((l + ' ' + x).trim().length > n) { out.push(l.trim()); l = x; } else l += ' ' + x; } if (l.trim()) out.push(l.trim()); return out; };
export const para = (s, x, y, n, o = {}) => { const L = wrap(s, n); return { svg: L.map((l, i) => T(l, x, y + i * (o.lh || 15), o)).join(''), h: L.length * (o.lh || 15) }; };
export const page = (w, h, body, bg = '#0f141c') => `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;overflow:hidden;background:${bg}}svg{display:block}</style></head><body><svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${defs()}<defs>${EXTRA_DEFS}</defs>${body}</svg></body></html>`;
// place a creature (du units) at px x,y with css px per du k
export const put = (d, x, y, k, flip = false) => ({ b: `<g transform="translate(${f(x)},${f(y)}) scale(${f(flip ? -k : k)},${f(k)})">${d.b}</g>`, e: d.e ? `<g transform="translate(${f(x)},${f(y)}) scale(${f(flip ? -k : k)},${f(k)})">${d.e}</g>` : '' });
const card = (x, y, w, h, title, rec, col = '#2a3446') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12" fill="#151b26" stroke="${rec ? '#7fd49a' : col}" stroke-width="${rec ? 2.2 : 1.2}"/>` + T(title, x + 16, y + 30, { f: FT, s: 21, w: 700, c: '#ffe2a8' }) + (rec ? T('RECOMMENDED', x + w - 16, y + 28, { s: 12, w: 800, c: '#7fd49a', a: 'end' }) : '');
const stage = (x, y, w, h) => `<svg x="${x}" y="${y}" width="${w}" height="${h}" viewBox="${x} ${y} ${w} ${h}" overflow="hidden"><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="#1d2433"/><ellipse cx="${x + w / 2}" cy="${y + h * 0.35}" rx="${w * 0.6}" ry="${h * 0.5}" fill="#3a4a70" opacity=".3"/><rect x="${x}" y="${y + h * 0.78}" width="${w}" height="${h * 0.22}" fill="#4a5064"/><rect x="${x}" y="${y + h * 0.78}" width="${w}" height="${h * 0.22}" filter="url(#mottle)" opacity=".4"/></svg>`;
const header = (n, title, sub, right = '') => T(n + '  ' + title, 24, 40, { f: FT, s: 28, w: 700, c: '#ffe2a8' }) + T(sub, 24, 64, { s: 14, c: '#aab4c4' }) + (right ? T(right, 1576, 40, { s: 13, c: '#ffb84a', a: 'end' }) : '') + `<rect x="0" y="78" width="1600" height="2" fill="#2a3446"/>`;

// ---------------- 01 three art takes ----------------
function takesPage(plates) {
  resetAll();
  let b = header('#7', 'ELDER TREANT: three art takes (all The First Husk, as picked)', 'Hero-sheet bar: Style v1 tinted outline (L2), soft gradient + cold rim (H2), grown bark mask face, amber eyes BAKED into knot sockets (socket-shaped glow, no floating balls).', 'Phase 1 look shown. Big = 1.0 css px per du (4 du = 1 world unit)');
  const takes = [
    ['A  The First Husk, Elder', treantA, 1, 'The oldest, biggest mask in the forest, grown onto a tall grey elder with root straps. Branch arms, a cold split chest (the Hollow inside), a heavy grey crown that still holds a few leaves of memory-green.', 'tall trunk + big pale face + wide crown: reads as THE tree from across the arena', 'groaning sway; arms lift high for the slam, sweep low for the vine sweep; the face crack widens per phase', 'quietest of the three; needs its moves to bring the drama'],
    ['B  The Bowed Ancient', treantB, 0, 'Shorter, wider and bent forward like an old man; bigger, lower mask (more chibi); long arms that drag on the ground ending in root claws; a hunched back of dead branches and moss sheets.', 'a wide mound with two ground-dragging arms: the arms ARE the threat read', 'shuffles; drags both claws (sweep/slam wind-ups readable from the arm pose alone)', 'less "tree", more "creature"; hides the crown that carries the phase story'],
    ['C  The Lantern-Keeper', treantC, 0, 'Take A, but its branches hold the cold, UNLIT glass lanterns of Hollowlighters who did not come back. Grey glass, no warm light (warm stays the heroes\'). At victory they relight one by one.', 'A + six small hanging lantern shapes', 'lanterns swing on every step; at victory they kindle (best payoff)', 'busiest silhouette; lanterns on an enemy blur the "warm = ours" rule until they relight'],
  ];
  takes.forEach(([title, fn, rec, story, sil, anim, risk], i) => {
    const x = 16 + i * 528, y = 92, w = 512, h = 890;
    b += card(x, y, w, h, title, !!rec);
    b += stage(x + 14, y + 46, w - 28, 420);
    const d = put(fn({ ph: 1 }), x + w / 2, y + 46 + 400, 1.08);
    b += d.b + d.e;
    // true size row on the real plates: desktop day + phone night
    const tk = DESK / 4, pk = PHONE / 4;
    b += `<svg x="${x + 14}" y="${y + 476}" width="${w - 28}" height="190" viewBox="380 250 ${f((w - 28))} 190" overflow="hidden"><image href="${plates}/desk-day-wren.jpg" x="0" y="0" width="1280" height="720"/>` + `<rect x="0" y="0" width="1280" height="720" fill="#ffd9a8" opacity=".13"/>` + (() => { const q = put(fn({ ph: 1 }), 780, 428, tk); return q.b + q.e; })() + `</svg>`;
    b += T('TRUE SIZE desktop (2.34 px / world unit) beside Wren, 14:00 light (plate + warm wash)', x + 20, y + 682, { s: 11, c: '#ffd98a' });
    let yy = y + 706;
    for (const [lab, txt, c] of [['STORY', story], ['SILHOUETTE HOOK', sil], ['PERSONALITY + ANIMATION', anim], ['RISK', risk, '#ffb08a']]) {
      b += T(lab, x + 20, yy, { s: 10.5, w: 800, c: '#8fa0b8' }); const p = para(txt, x + 20, yy + 15, 76, { s: 12.5, w: 500, c: c || '#e8edf3', lh: 15 }); b += p.svg; yy += 18 + p.h;
    }
  });
  return page(1600, 1000, b);
}

export const PAGES = [
  { name: '01-art-takes', w: 1600, h: 1000, html: takesPage },
];
