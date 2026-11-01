// SUMMONS ART sheet pages (mock-up tooling only, NOT game code). Every page = one HTML string, rendered by build.mjs.
import { resetAll, defs, f, rng, mix } from '../enemies-art2/paint.mjs';
import * as S from './spirits.mjs';
import * as RV from './ravens.mjs';
import * as MO from './more.mjs';
import { AUDIT, AUDIT_COMMON, FAM, FX } from './roster.mjs';
const { ROLE, WARM, EMBER, GOLD, G } = S;
const FN = { ...S, ...RV, ...MO };
export const DESK = 2.34, PHONE = 1.3; // px per world unit (desktop 1280x720, phone css px)
const du = (k) => k / 4; // design units are 1/4 world unit
// recommended true-size scales (decision 2): wolf A ~18 wu long incl. tail = ~42 px desktop (0.8x a Fell Wolf), raven ~13 wu = ~30 px
export const WOLF_K = 0.72, RAVEN_K = 0.85;

const CSS = `*{box-sizing:border-box}html,body{margin:0;background:#0f1320;color:#e9e4f6;font:13px/1.32 'Segoe UI',system-ui,sans-serif}
h1{font:700 30px Georgia,serif;margin:0;color:#fff3dc;letter-spacing:.5px}h2{font:700 19px Georgia,serif;margin:0 0 4px;color:#fff3dc}h3{font:700 13px 'Segoe UI';margin:0 0 3px;letter-spacing:.6px;color:#c9bff0;text-transform:uppercase}
.top{display:flex;justify-content:space-between;align-items:flex-start;padding:14px 18px 8px;border-bottom:2px solid #d8b26a55}.sub{color:#bfb7d8;font-size:14px;margin-top:3px}
.role{font-size:12px;color:#fff3dc;max-width:620px;text-align:right}.card{background:#1a2032;border:1px solid #2e3650;border-radius:10px;padding:10px;position:relative}
.rec{border:2px solid #9fe0a8}.recl{position:absolute;right:12px;top:10px;color:#9fe0a8;font:700 12px 'Segoe UI';letter-spacing:.6px}
.t b{color:#ffcf7a;font-size:11px;letter-spacing:.5px}.t{font-size:12px;color:#d8d2ea}.risk{color:#ffb38a}.pill{display:inline-block;padding:1px 7px;border-radius:9px;background:#2a3150;margin-right:4px;font-size:11px}
.crop{position:relative;overflow:hidden;border-radius:6px;border:1px solid #39415e}.crop span,.lab{position:absolute;left:6px;bottom:4px;background:#0009;color:#fff;font:600 11px 'Segoe UI';padding:1px 6px;border-radius:4px}
.lab{position:static;display:inline-block;margin:2px 0}.note{color:#9fb3c8;font-size:11.5px}.grid{display:grid;gap:10px}`;
export const page = (w, h, body) => `<!doctype html><html><head><meta charset="utf-8"><style>${CSS}body{width:${w}px;height:${h}px;overflow:hidden}</style></head><body><svg width="0" height="0" style="position:absolute">${defs()}<defs>${S.SPIRIT_DEFS}</defs></svg>${body}</body></html>`;
const svg = (w, h, inner, bg = '') => `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" style="display:block">${bg}${inner}</svg>`;
const at = (x, y, k, s, o = {}) => `<g transform="translate(${f(x)},${f(y)}) scale(${f(o.flip ? -k : k)},${f(k)})${o.rot ? ` rotate(${o.rot})` : ''}"${o.filter ? ` filter="url(#${o.filter})"` : ''}${o.op != null ? ` opacity="${o.op}"` : ''}>${s}</g>`;
const NIGHT_BG = (w, h) => `<rect width="${w}" height="${h}" fill="#151b2e"/><ellipse cx="${w * 0.5}" cy="${h * 0.7}" rx="${w * 0.45}" ry="${h * 0.3}" fill="#3a4060" opacity=".45"/>`;
const SPLIT_BG = (w, h) => `<rect width="${w}" height="${h}" fill="#151b2e"/><ellipse cx="${w * 0.3}" cy="${h * 0.72}" rx="${w * 0.3}" ry="${h * 0.24}" fill="#3a4060" opacity=".5"/><rect x="${w * 0.62}" width="${w * 0.38}" height="${h}" fill="#6f7c62"/><rect x="${w * 0.62}" width="${w * 0.38}" height="${h}" filter="url(#mottle)" opacity=".4"/>`;
// dummy foe silhouettes (dark cold Husk shapes) for context in big renders
const foe = (x, y, k = 1) => `<g transform="translate(${f(x)},${f(y)}) scale(${k})"><ellipse cx="0" cy="2" rx="22" ry="5" fill="#000" opacity=".35"/><path d="M-20 -6 Q-18 -24 0 -24 Q14 -24 20 -16 L34 -12 L20 -6 Q10 0 -16 0Z" fill="#3b4462" stroke="#1b1f33" stroke-width="2.4"/><path d="M14 -20 L34 -13 L18 -8Z" fill="#c8c3ad" stroke="#5a5446" stroke-width="1.4"/><circle cx="22" cy="-14" r="2.2" fill="#ff5a3c"/></g>`;

// ---------------- option renders (big) ----------------
export function optArt(fam, k, W = 300, H = 220, BK = 3) {
  const o = FAM[fam].opts.find((x) => x.k === k), F = FN[o.fn];
  if (fam === 'wolves') return at(W * 0.46, H * 0.86, BK, F({ ph: 0.15 })) + at(W * 0.86, H * 0.9, BK * 0.42, F({ ph: 0.6, v: 1 }), { flip: 1 });
  if (fam === 'ravens') return at(W * 0.42, H * 0.48, BK, F({ pose: 'up' })) + at(W * 0.86, H * 0.78, BK * 0.45, F({ pose: 'swoop' }));
  if (fam === 'bolts') return at(W * 0.6, H * 0.45, BK, F({ v: 0 })) + at(W * 0.3, H * 0.78, BK * 0.5, F({ v: 3, curl: -6 }));
  if (fam === 'orbit') { let s = MO.ringStamp(0, 0); s = at(W * 0.5, H * 0.62, 1, MO.ringStamp(W * 0.36, 0.45)); for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2 + 0.4, x = W * 0.5 + Math.cos(a) * W * 0.36, y = H * 0.62 + Math.sin(a) * W * 0.36 * 0.55; s += at(x, y - 8, i === 1 ? BK * 0.95 : BK * 0.55, F({ ph: i * 0.2, lean: 3 })); } return s; }
  if (fam === 'chain') { const p = [[W * 0.1, H * 0.45], [W * 0.42, H * 0.6], [W * 0.62, H * 0.35], [W * 0.9, H * 0.62]]; let s = p.slice(1).map(([x, y]) => foe(x, y + 6, 0.9)).join(''); for (let i = 0; i < 3; i++) s += F(p[i][0], p[i][1], p[i + 1][0], p[i + 1][1] - 10, 3 + i); return s + G(p[0][0], p[0][1], 16, 16, ROLE.chain.glow, 0.7); }
  return '';
}
const small = (fam, k, sc, st = {}) => { const o = FAM[fam].opts.find((x) => x.k === k), F = FN[o.fn];
  if (fam === 'chain') return F(-40, 0, 40, 0, 5, {}); if (fam === 'wolves') return F({ ph: 0.3, ...st }); return F({ pose: 'up', ...st }); };

// ---------------- evolutions (recommended A) at 2x ----------------
export function evoPieces(fam) {
  const R = ROLE;
  if (fam === 'wolves') return [
    ['pack variety + pup link', 280, 150, at(70, 130, 1.0, S.wolfA({ ph: 0.1 })) + at(165, 130, 0.92, S.wolfA({ ph: 0.5, v: 1 })) + at(248, 132, 0.8, S.wolfA({ ph: 0.8, v: 2 }), { flip: 1 }) + `<text x="8" y="16" fill="#9fb3c8" font-size="10.5">3 variants = overlay frames; pup (cream) leads Rally</text>`],
    ['THE ALPHA (1.7x, mane, amber eyes, gold rim)', 260, 150, at(120, 138, 1.25, S.wolfA({ ph: 0.2, evo: 'alpha', gold: 1 })) + at(225, 138, 0.62, S.wolfA({ ph: 0.6, v: 2 }), { op: 0.55 }) + `<text x="196" y="150" fill="#9fb3c8" font-size="10">+2 shades</text>`],
    ['ECHO PACK (hollow light, rises, fades)', 220, 150, at(110, 120, 0.95, S.wolfA({ ph: 0.4 }), { filter: 'hollowF' }) + S.motes(6, 110, 70, 60, 30, R.wolf.glow, 4) + foe(60, 140, 0.5) + `<path d="M60 128 v-14" stroke="${WARM}" stroke-width="1.4" stroke-dasharray="2 3"/>`],
    ['LIGHT TRAILS (pawprint ribbon, bleeds)', 300, 150, `<path d="M10 120 Q80 92 150 112 T290 96" stroke="${R.wolf.glow}" stroke-width="14" fill="none" opacity=".28" filter="url(#blur3)"/><path d="M10 120 Q80 92 150 112 T290 96" stroke="${WARM}" stroke-width="2" fill="none" opacity=".5"/>` + [[24, 116], [58, 104], [92, 100], [126, 108], [160, 112], [194, 106]].map(([x, y], i) => S.paw(x, y + (i % 2 ? -5 : 5), 0.8, R.wolf.glow, 0.5 + i * 0.08)).join('') + at(250, 118, 0.9, S.wolfA({ ph: 0.3, evo: 'trail', gold: 1 }))],
  ];
  if (fam === 'ravens') return [
    ['scout cycle: perch / swoop / peck', 290, 150, at(40, 70, 1, RV.ravenA({ pose: 'perch' })) + at(130, 90, 1, RV.ravenA({ pose: 'swoop' })) + at(220, 110, 1, RV.ravenA({ pose: 'peck' })) + foe(260, 140, 0.55)],
    ['WALL OF WINGS (spread ring + paper feathers)', 280, 150, `<ellipse cx="140" cy="86" rx="118" ry="52" fill="none" stroke="${R.raven.c}" stroke-width="1.4" stroke-dasharray="2 9" opacity=".7"/>` + [0, 1, 2, 3, 4, 5].map((i) => { const a = i / 6 * Math.PI * 2; return at(140 + Math.cos(a) * 118, 86 + Math.sin(a) * 52, 0.62, RV.ravenA({ pose: 'spread', gold: 1 }), { flip: Math.sin(a) > 0 }); }).join('') + [0.4, 1.5, 2.6, 3.7, 4.8].map((a) => `<path d="M${f(140 + Math.cos(a) * 92)} ${f(86 + Math.sin(a) * 40)} q4 -3 8 0 q-4 2 -8 0Z" fill="${WARM}" opacity=".8"/>`).join('')],
    ['TALON MARK (dive dart + wax-seal omen)', 220, 150, foe(140, 140, 0.8) + `<ellipse cx="140" cy="140" rx="26" ry="7" fill="${R.raven.dk}" opacity=".35"/>` + at(132, 52, 1, RV.ravenA({ pose: 'dive', gold: 1 })) + `<g transform="translate(176,92)">${G(0, 0, 14, 14, R.raven.glow, 0.6)}<circle r="8" fill="${R.raven.c}" stroke="${R.raven.ink}" stroke-width="2"/><path d="M-4 -2 L0 3 L4 -2" stroke="${WARM}" stroke-width="2" fill="none"/></g>`],
    ['SPEARHEAD (wedge + violet wake)', 280, 150, [[220, 70, 1], [170, 48, 0.8], [170, 96, 0.8], [124, 28, 0.7], [124, 116, 0.7]].map(([x, y, k], i) => `<path d="M${x - 10} ${y} L${x - 80} ${y + 2}" stroke="${R.raven.glow}" stroke-width="7" opacity=".35" stroke-linecap="round" filter="url(#blur3)"/>` + at(x, y, k, RV.ravenA({ pose: 'swoop', gold: i === 0 }))).join('')],
  ];
  if (fam === 'bolts') return [
    ['glyph set (5 letters, invented)', 260, 120, [0, 1, 2, 3, 4].map((v) => at(30 + v * 50, 60, 1.2, MO.boltA({ v, tail: 0 }))).join('')],
    ['SPIRIT TEMPEST (torn-page burst, 8 seek)', 260, 150, `<g transform="translate(130,78)">${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => { const a = i / 8 * Math.PI * 2; return at(Math.cos(a) * 58, Math.sin(a) * 50, 0.7, MO.boltA({ v: i, gold: 1, s: 0.9, curl: 4 }), { rot: a * 57.3 }); }).join('')}${[0, 1, 2, 3, 4, 5].map((i) => `<rect x="${-4 + i * 1.5}" y="${-4 + (i % 3) * 2}" width="5" height="4" fill="${WARM}" transform="rotate(${i * 50})"/>`).join('')}</g>`],
    ['SOUL LANCE (a written line of light)', 280, 120, at(18, 60, 1, MO.lanceA({ len: 240 })) + foe(150, 76, 0.5) + foe(210, 70, 0.5)],
    ['RETURNING PAGES (out: ink / home: dotted)', 240, 140, at(160, 50, 1.3, MO.pageA({ v: 2 })) + at(70, 110, 1.2, MO.pageA({ v: 1, back: 1 }))],
  ];
  if (fam === 'chain') return [
    ['landing: crack-star scorch (0.5 s)', 200, 130, MO.arcA(20, 30, 120, 90, 3) + foe(160, 110, 0.5)],
    ['THUNDER JUDGMENT (capped pillar, gold edges)', 260, 170, MO.pillarA(80, 150, 140, 2) + MO.pillarA(190, 140, 120, 5) + foe(80, 154, 0.5) + foe(190, 144, 0.5)],
    ['STATIC STORM (living field edge)', 260, 160, `<g transform="translate(130,84)">${MO.fieldA(110)}${MO.arcA(-30, -10, -60, 20, 4, { amp: 4, n: 4 })}${MO.arcA(40, 4, 70, -20, 6, { amp: 4, n: 4 })}</g>`],
    ['STORM TETHER (braided, steady)', 260, 140, MO.tetherA(20, 40, 230, 100, 3) + foe(240, 118, 0.6)],
  ];
  if (fam === 'orbit') return [
    ['flicker + lean + bead', 220, 120, [0, 0.33, 0.66].map((ph, i) => at(50 + i * 60, 80, 1.5, MO.flameA({ ph, lean: i * 2 }))).join('')],
    ['SANCTUM HALO (12 candles, consecrated ground)', 280, 170, `<g transform="translate(140,92)">${MO.groundHaloA(118)}${[...Array(12)].map((_, i) => { const a = i / 12 * Math.PI * 2; return at(Math.cos(a) * 118, Math.sin(a) * 73 - 6, 0.7, MO.flameA({ ph: i * 0.1, gold: 1 })); }).join('')}</g>`],
    ['JUDGEMENT WHEEL (flower of flame, reforms)', 260, 160, `<g transform="translate(80,90)">${MO.burstA(1, 0.35)}</g>` + at(190, 92, 1.4, MO.flameA({ ph: 0.2, gold: 1, s: 1.3 })) + `<path d="M120 90 Q150 70 172 86" stroke="${ROLE.orbit.c}" stroke-width="1.4" stroke-dasharray="2 4" fill="none"/>`],
    ['VESPER TIDE (breathes out, streaks, crest ripple)', 280, 170, `<g transform="translate(140,90)">${MO.ringStamp(70, 0.35)}<ellipse rx="118" ry="73" fill="none" stroke="${ROLE.orbit.c}" stroke-width="2" opacity=".45"/><ellipse rx="124" ry="77" fill="none" stroke="${ROLE.orbit.c}" stroke-width="1" opacity=".25"/>${[0, 1, 2, 3, 4].map((i) => { const a = i / 5 * Math.PI * 2 + 0.3; return `<path d="M${f(Math.cos(a) * 118)} ${f(Math.sin(a) * 73 - 8)} L${f(Math.cos(a) * 92)} ${f(Math.sin(a) * 57 - 8)}" stroke="${ROLE.orbit.glow}" stroke-width="6" opacity=".5" stroke-linecap="round" filter="url(#blur1)"/>` + at(Math.cos(a) * 118, Math.sin(a) * 73 - 8, 0.8, MO.flameA({ ph: i * 0.2, gold: 1 })); }).join('')}</g>`],
  ];
  return [];
}
// motion strip (4 frames, A)
export function motion(fam) {
  if (fam === 'wolves') return { label: 'Ghost wolf A: lope x4 then bite', frames: [0, 0.25, 0.5, 0.75].map((ph) => S.wolfA({ ph })).concat([S.wolfA({ ph: 0.1, pose: 'bite' })]), y: 0.8, k: 0.55 };
  if (fam === 'ravens') return { label: 'Raven A: perch, wings up, swoop, peck', frames: ['perch', 'up', 'down', 'swoop', 'peck'].map((pose) => RV.ravenA({ pose })), y: 0.5, k: 1.1 };
  if (fam === 'bolts') return { label: 'Glyph A: launch pulse, homing curl, hit = ink spatter', frames: [MO.boltA({ v: 1, tail: 0, s: 1.25 }), MO.boltA({ v: 1, curl: 2 }), MO.boltA({ v: 1, curl: 14 }), MO.boltA({ v: 1, curl: -10 }), MO.hitA.bolt(1.6)], y: 0.5, k: 1.2 };
  if (fam === 'chain') return { label: 'Arc A: strike, re-jag flicker, core fades, scorch stays 0.5 s', frames: [3, 4, 5].map((sd) => MO.arcA(-50, -10, 50, 10, sd)).concat([`<g opacity=".5">${MO.arcA(-50, -10, 50, 10, 5, { forks: 0 })}</g>`, MO.crack(0, 0, 4, 1)]), y: 0.5, k: 0.9 };
  return { label: 'Flame A: flicker x3, flare on hit, Burn licks on the foe', frames: [0, 0.33, 0.66].map((ph) => MO.flameA({ ph, s: 1.3 })).concat([MO.flameA({ ph: 0.2, s: 1.6 }) + MO.hitA.orbit(1.2), foe(0, 16, 0.7) + [-8, 0, 8].map((x) => `<path d="M${x} 0 q-3 -6 0 -12 q3 6 0 12Z" fill="${ROLE.orbit.burn}" opacity=".9"/>`).join('')]), y: 0.55, k: 1.3 };
}

// ---------------- composites over the real build plates ----------------
// items: [fn-svg, wx, wy, scale (px per du), opts] placed relative to the hero feet at (hx, hy) in plate px
export function plateCrop(plateUrl, PW, PH, cx, cy, w, h, inner, label) {
  return `<div class="crop" style="width:${w}px;height:${h}px"><img src="${plateUrl}" style="position:absolute;left:${-cx}px;top:${-cy}px;width:${PW}px;height:${PH}px"><svg style="position:absolute;left:${-cx}px;top:${-cy}px" width="${PW}" height="${PH}" viewBox="0 0 ${PW} ${PH}">${inner}</svg><span>${label}</span></div>`;
}
// recommended-look scene for a family around the hero (world units)
export function sceneA(fam, hx, hy, K, opt = {}) {
  const k = du(K), q = rng(opt.seed || 11), s = [];
  const put = (svgs, wx, wy, m = 1, o = {}) => s.push(at(hx + wx * K, hy + wy * K, k * m, svgs, o));
  const pool = (wx, wy, col, r = 14) => s.push(G(hx + wx * K, hy + wy * K, r * K, r * K * 0.45, col, 0.45));
  if (fam === 'wolves') { const P = [[42, -18, 0], [-46, -30, 1], [60, 30, 2], [-30, 40, 0], [10, -56, 1]]; for (const [x, y, v] of P) { pool(x, y, ROLE.wolf.glow); put(S.wolfA({ ph: q(), v, pose: v === 2 ? 'bite' : '' }), x, y, WOLF_K, { flip: x < 0 }); } }
  if (fam === 'ravens') { const P = [[-14, -22, 'perch'], [16, -24, 'perch'], [52, -40, 'swoop'], [-64, 12, 'peck'], [70, 26, 'up']]; for (const [x, y, p] of P) put(RV.ravenA({ pose: p, ph: q() }), x, y - 10, RAVEN_K, { flip: x < 0 }); }
  if (fam === 'bolts') { const P = [[34, -30, 0, 0.3], [64, 6, 2, -0.2], [-40, -44, 4, 3.6], [-60, 20, 1, 2.8]]; for (const [x, y, v, r] of P) put(MO.boltA({ v, curl: 6 }), x, y - 14, 1, { rot: r * 57.3 }); }
  if (fam === 'chain') { const pts = [[0, -16], [48, -26], [86, 6], [120, -20]]; let c = ''; for (let i = 0; i < 3; i++) c += MO.arcA(hx + pts[i][0] * K, hy + pts[i][1] * K, hx + pts[i + 1][0] * K, hy + pts[i + 1][1] * K, 3 + i, { amp: 5 }); s.push(c); }
  if (fam === 'orbit') { const r = 44; s.push(at(hx, hy - 4 * K, 1, MO.ringStamp(r * K, 0.35))); for (let i = 0; i < 5; i++) { const a = i / 5 * Math.PI * 2 + 0.5; put(MO.flameA({ ph: i * 0.2, lean: 3, s: 1.6 }), Math.cos(a) * r, Math.sin(a) * r * 0.62 - 6, 1); } }
  return s.join('');
}
const HERO = { desk: [640, 383], land: [422, 197], port: [195, 424] };

// ---------------- family sheet ----------------
export function familyPage(fam, P) {
  resetAll();
  const F = FAM[fam], hero = fam === 'orbit' || fam === 'bolts' || fam === 'chain' ? 'elias' : 'wren';
  const card = (o) => {
    const W = 512, H = 230, BK = fam === 'wolves' ? 1.9 : fam === 'ravens' ? 3 : fam === 'bolts' ? 3.4 : fam === 'orbit' ? 2.2 : 1;
    const k1 = du(DESK), sm = small(fam, o.k, 1), smg = small(fam, o.k, 1, { gold: 1, evo: fam === 'wolves' ? 'alpha' : '' });
    const ins = (lab, inner, bg) => `<div style="width:118px;height:66px;border-radius:6px;overflow:hidden;position:relative;margin-bottom:5px">${svg(118, 66, inner, bg)}<span style="position:absolute;left:4px;top:2px;font-size:10px;color:#fff">${lab}</span></div>`;
    const yy = fam === 'wolves' ? 52 : 34, ks = fam === 'chain' ? 0.6 : k1 * (fam === 'wolves' ? WOLF_K : fam === 'ravens' ? RAVEN_K : 1);
    const insets = ins(fam === 'chain' ? 'night (px-true)' : '1:1 night', at(59, yy, ks, sm), `<rect width="118" height="66" fill="#141a2c"/>`) + ins(fam === 'chain' ? 'day' : '1:1 day', at(59, yy, ks, sm), `<rect width="118" height="66" fill="#6f7c62"/>`)
      + ins('black 30 / 20 px', at(38, yy, ks * 1.3, sm, { filter: 'silF' }) + at(88, yy, ks * 0.9, sm, { filter: 'silF' }), `<rect width="118" height="66" fill="#d9dee6"/>`) + ins('evolved (x2)', at(59, yy, fam === 'chain' ? 0.6 : k1 * 2, fam === 'chain' ? MO.tetherA(-40, -6, 40, 6, 3) : smg), `<rect width="118" height="66" fill="#141a2c"/>`);
    return `<div class="card ${o.rec ? 'rec' : ''}" style="width:520px"><h2>${o.k} ${o.name}</h2>${o.rec ? '<div class="recl">RECOMMENDED</div>' : ''}
      <div style="display:flex;gap:6px"><div style="border-radius:6px;overflow:hidden">${svg(380, 230, optArt(fam, o.k, 380, 230, BK), SPLIT_BG(380, 230))}</div><div>${insets}</div></div>
      <div class="t" style="margin-top:6px"><b>LOOK</b> ${o.look}<br><b>SILHOUETTE HOOK</b> ${o.hook}<br><b>ANIMATION</b> ${o.anim}<br><b>CROWD 20-50 PX + NIGHT</b> ${o.crowd}<br><b>PERF</b> ${o.perf}<br><b>EVOLUTIONS</b> ${o.evo}<br><b>BUILD COST</b> ${o.cost} &nbsp; <span class="risk"><b style="color:#ffb38a">RISK</b> ${o.risk}</span></div></div>`;
  };
  const top = `<div class="top"><div><h1>${F.n} / 6 &nbsp;${F.title}</h1><div class="sub">SUMMONS ART options (sheet #3): three genuinely different directions, A recommended. ${F.sub}</div></div><div class="role"><b style="color:#ffcf7a">COLOUR ROLES</b> ${F.role}<br><span class="note">TODAY: ${AUDIT[fam].verdict.split(/[.;:]/)[0]} (see 00-audit).</span></div></div>`;
  const cards = `<div style="display:flex;gap:12px;padding:10px 18px">${F.opts.map(card).join('')}</div>`;
  // true size crops of A on the real build plates
  const pl = (n) => P + '/' + n + '.jpg';
  const [hx, hy] = HERO.desk, sc = (pn, cx, cy, w, h, lab, K = DESK, hh = HERO.desk, PW = 1280, PH = 720) => plateCrop(pl(pn), PW, PH, cx, cy, w, h, sceneA(fam, hh[0], hh[1], K, { seed: 11 }), lab);
  const crops = `<div class="grid" style="grid-template-columns:390px 390px">${sc(hero + '-night-desk', hx - 195, hy - 150, 390, 245, 'DESKTOP 1280x720 dark start, 1:1')}${sc(hero + '-day-desk', hx - 195, hy - 150, 390, 245, 'DESKTOP grey light 11:30, 1:1')}
    ${sc(hero + '-night-land', HERO.land[0] - 195, HERO.land[1] - 122, 390, 245, 'PHONE 844x390 night, 1:1 css px', PHONE, HERO.land, 844, 390)}${sc(hero + '-day-port', HERO.port[0] - 195, HERO.port[1] - 140, 390, 245, 'PHONE 390x844 day, 1:1 css px', PHONE, HERO.port, 390, 844)}</div>`;
  const ev = evoPieces(fam), mo = motion(fam);
  const evoHtml = `<div style="display:flex;flex-wrap:wrap;gap:8px">${ev.map(([lab, w, h, inner]) => `<div><div class="lab">${lab}</div><div style="border-radius:6px;overflow:hidden">${svg(Math.round(w * 0.9), Math.round(h * 0.9), `<g transform="scale(.9)">${inner}</g>`, NIGHT_BG(Math.round(w * 0.9), Math.round(h * 0.9)))}</div></div>`).join('')}</div>`;
  const fw = 140, fh = 96;
  const motionHtml = `<div class="lab">${mo.label} (2x, then 1:1)</div><div style="display:flex;gap:4px">${mo.frames.map((fr) => `<div style="border-radius:5px;overflow:hidden">${svg(fw, fh, at(fw / 2, fh * mo.y, mo.k * 1.1, fr) + at(fw - 22, fh - 14, du(DESK) * (fam === 'wolves' ? WOLF_K : fam === 'ravens' ? RAVEN_K : 1), fr), NIGHT_BG(fw, fh))}</div>`).join('')}</div>`;
  const bottom = `<div style="display:flex;gap:14px;padding:0 18px"><div><h3>A at TRUE SIZE on the real build (summon-free plates from HEAD, swarm staged, ${hero === 'wren' ? 'Wren' : 'Elias'})</h3>${crops}</div>
    <div style="width:760px"><h3>A: evolutions keep the creature, change the verb (gold only on the evolved rim)</h3>${evoHtml}<div style="margin-top:6px">${motionHtml}</div></div></div>`;
  return page(1600, 1250, top + cards + bottom);
}

// ---------------- audit sheet ----------------
export function auditPage(audDir) {
  resetAll();
  const rows = Object.entries(AUDIT).map(([k, a]) => `<div style="display:flex;gap:8px;align-items:stretch;margin-bottom:8px"><div style="width:250px" class="card"><h2>${a.title}</h2><div class="t">${a.verdict}</div></div>
    ${a.cases.map(([tag, fr, lab]) => `<div class="crop" style="width:327px;height:218px"><img src="${audDir}/${tag}-${fr.endsWith('-b') ? fr.slice(0, -2) + '-desk-b' : fr + '-desk'}-crop2x.png" width="327" height="218" style="position:absolute;left:0;top:0"><span>${lab} (2x crop, ${fr.startsWith('night') ? '0:30 dark' : '11:30 light'})</span></div>`).join('')}</div>`).join('');
  return page(1600, 1290, `<div class="top"><div><h1>0 / 6 &nbsp;AUDIT: summons in the game today</h1><div class="sub">Real build (HEAD 25efa05), ?auto + ?grant per weapon/evolution, staged swarm, High tier, desktop 1280x720, crops at 2x around the hero. node audit.mjs.</div></div><div class="role" style="max-width:700px">${AUDIT_COMMON}</div></div><div style="padding:10px 18px">${rows}</div>`);
}

// ---------------- shared FX sheet ----------------
export function fxPage() {
  resetAll();
  const R = ROLE, cell = (lab, inner, w = 150, h = 110) => `<div><div class="lab">${lab}</div><div style="border-radius:6px;overflow:hidden">${svg(w, h, inner, NIGHT_BG(w, h))}</div></div>`;
  const spawn = [0, 0.33, 0.66, 1].map((t) => cell(`spawn ${Math.round(t * 250)} ms`, at(75, 62, 1, MO.spawnA(t, R.wolf.glow)) + (t === 1 ? at(75, 88, 0.8, S.wolfA({ ph: 0.2 })) : ''))).join('');
  const despawn = [0, 0.33, 0.66, 1].map((t) => cell(`despawn ${Math.round(t * 400)} ms`, (t < 0.5 ? at(75, 90, 0.8, S.wolfA({ ph: 0.2 }), { op: 1 - t * 1.6 }) : '') + at(75, 60, 1, MO.despawnA(t, R.wolf.glow)))).join('');
  const hits = Object.entries(MO.hitA).map(([k, fn]) => cell(`hit: ${k}`, at(75, 55, 2, fn(1)) + at(130, 95, du(DESK) * 2, fn(1)), 150, 110)).join('');
  const goldRow = [['wolf', S.wolfA({ ph: 0.2 }), 0.42, 0.7], ['raven', RV.ravenA({ pose: 'up' }), 0.75, 0.42], ['glyph', MO.boltA({ v: 1, tail: 0 }), 1.3, 0.42], ['flame', MO.flameA({}), 1.3, 0.5]].map(([lab, s0, k, y]) => {
    const ev = lab === 'wolf' ? S.wolfA({ ph: 0.2, gold: 1 }) : lab === 'raven' ? RV.ravenA({ pose: 'up', gold: 1 }) : lab === 'glyph' ? MO.boltA({ v: 1, tail: 0, gold: 1 }) : MO.flameA({ gold: 1 });
    return cell(`${lab}: base | evolved (gold rim)`, at(44, 110 * y, k, s0) + at(116, 110 * y, k, ev) + at(60, 100, du(DESK) * 2, s0) + at(130, 100, du(DESK) * 2, ev), 160, 110); }).join('');
  const tier = (lab, inner) => cell(lab, inner, 170, 120);
  const w = S.wolfA({ ph: 0.2 });
  const tiers = tier('HIGH: rig frame + halo + ribbon', `<path d="M10 92 Q50 80 80 90" stroke="${R.wolf.glow}" stroke-width="9" opacity=".3" fill="none" filter="url(#blur3)"/>` + at(110, 100, 0.85, w)) + tier('MED: frame + halo, short ribbon', `<path d="M50 92 Q65 86 80 90" stroke="${R.wolf.glow}" stroke-width="7" opacity=".25" fill="none" filter="url(#blur3)"/>` + at(110, 100, 0.85, w))
    + tier('LOW: one flat baked frame, no halo/ribbon', at(110, 100, 0.85, w, { filter: 'flatF' })) + tier('CALM (reduced motion): no bob, no flicker, static rim', at(110, 100, 0.85, S.wolfA({ ph: 0 })));
  const opts = FX.opts.map((o) => `<div class="card ${o.rec ? 'rec' : ''}" style="width:500px">${o.rec ? '<div class="recl">RECOMMENDED</div>' : ''}<h2>${o.k} ${o.name}</h2><div class="t">${o.look}${o.risk ? `<br><span class="risk"><b style="color:#ffb38a">RISK</b> ${o.risk}</span>` : ''}</div></div>`).join('');
  const budget = `<table style="border-collapse:collapse;font-size:12px;width:100%">${[
    ['', 'HIGH', 'MED', 'LOW', 'phone'],
    ['summon images on screen (bodies)', '40', '28', '20 (nearest)', 'tier x0.85'],
    ['additive halos (shared with gems)', '160', '90', '40', 'x0.6'],
    ['spirit ribbons (trails)', '12 x 1.3 s', '6 x 1.1 s', 'none (Light Trails keeps 70 pts)', 'x0.85'],
    ['echo wolves drawn', '10', '6', '3', '-'],
    ['impact decals (scorch, ink, crescents)', '40', '24', '12', 'x0.6'],
    ['spawn/despawn beats in flight', '12', '8', '3', '-'],
    ['gold rims (evolved units)', '40', '24', '12 (flat 1 px)', '-'],
    ['clarity rule (8+ foes in 120 u)', 'ribbon/glow alpha <= 0.6, no new spawn beats near hero', '', '', ''],
  ].map((r, i) => `<tr>${r.map((c) => `<td style="border-bottom:1px solid #2e3650;padding:3px 6px;${i === 0 ? 'color:#ffcf7a;font-weight:700' : ''}">${c}</td>`).join('')}</tr>`).join('')}</table>`;
  const body = `<div class="top"><div><h1>6 / 6 &nbsp;SHARED FX LANGUAGE</h1><div class="sub">One grammar for every summon: light in, light out, a tiny verb-shaped hit, a gold rim only when evolved. Friendly effects never hide enemies, pickups or numbers (damage-readability-v1).</div></div><div class="role">friendly = warm-hearted role colours; enemies = cold; red-orange only for enemy eyes/tells; light red only for damage taken; bleed blood red; burn lilac; gold ONLY on evolved rims</div></div>
  <div style="display:flex;gap:12px;padding:10px 18px">${opts}</div>
  <div style="padding:0 18px"><h3>A in motion (2x, 1:1 inset)</h3><div style="display:flex;gap:6px;flex-wrap:wrap">${spawn}${despawn}</div><div style="display:flex;gap:6px;margin-top:6px">${hits}</div>
  <h3 style="margin-top:8px">Gold rim treatment (evolved units only; 2.6 du soft gold + 1.1 du hot line; never enemies)</h3><div style="display:flex;gap:6px">${goldRow}</div>
  <div style="display:flex;gap:16px;margin-top:8px"><div><h3>Tiers + reduced motion</h3><div style="display:flex;gap:6px">${tiers}</div></div><div style="width:640px"><h3>Per-tier caps (proposal; extends quality.js CAPS, nearest-first)</h3>${budget}</div></div></div>`;
  return page(1600, 1060, body);
}

// ---------------- whole roster at true size ----------------
export function worldPage(P, view, hero, mood, title) {
  resetAll();
  const dims = { desk: [1280, 720, DESK], land: [844, 390, PHONE], port: [390, 844, PHONE] }[view], [W, H, K] = dims, [hx, hy] = HERO[view];
  let inner = '';
  if (hero === 'wren') inner += sceneA('wolves', hx, hy, K, { seed: 3 }) + sceneA('ravens', hx, hy, K, { seed: 5 }) + sceneA('chain', hx - 10 * K, hy + 20 * K, K, { seed: 7 });
  else inner += sceneA('orbit', hx, hy, K) + sceneA('bolts', hx, hy, K) + `<g transform="translate(${hx + (view === 'port' ? 70 : 120) * K},${hy + 30 * K})">${MO.pillarA(0, 0, 70 * K, 2)}</g>`;
  const plate = P + '/' + (view === 'desk' ? `${hero}-${mood}-desk` : view === 'land' ? 'wren-night-land' : 'elias-day-port') + '.jpg';
  return page(W, H, `<div style="position:relative;width:${W}px;height:${H}px"><img src="${plate}" style="position:absolute;width:${W}px;height:${H}px"><svg style="position:absolute" width="${W}" height="${H}">${inner}</svg><div style="position:absolute;left:8px;bottom:${view === 'port' ? 120 : 70}px;background:#000b;color:#fff3dc;font:600 12px 'Segoe UI';padding:3px 8px;border-radius:5px">${title}</div></div>`);
}
