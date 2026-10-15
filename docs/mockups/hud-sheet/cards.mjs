// Level-up screen: icon-led cards (EVOLVE gold, 'Something stirs' hairline, NEW, stat) + quiet BLESSING row + reroll/banish. desk / phone-land / phone-port.
import { P1, T, FONT } from '../cartoon-polished/core.mjs';
import * as Cr from '../cartoon-polished/creatures.mjs';
import { K, ic, orbit, num, txt, ROLE } from './kit.mjs';
import { DIRS, DIM, stFor } from './compose.mjs';
import { HERO } from './scenes.mjs';
import { frameSvg, SAFE as SAFEC } from './dirC.mjs';

export const CARDS = [
  { k: 'evo', art: 'wolf', tag: 'EVOLUTION', name: 'Pouncing Pack', big: 'LEAP', unit: 'PIN AND MAUL', unit2: 'pin and maul', d: ['Wolves spring in an arc, pin', 'one foe flat, then maul it.'], rank: 5, role: K.gold },
  { k: 'stirs', art: 'orb', tag: 'HOLY ORBIT', name: 'Wider Light', big: '+12%', unit: 'ORBIT RADIUS', unit2: 'orbit radius', d: ['A softer, wider ring of', 'orbiting light.'], rank: 3, role: ROLE.orb },
  { k: 'stat', art: 'wolf', tag: 'GHOST WOLVES', name: 'Swift Pack', big: '+15%', unit: 'WOLF SPEED', unit2: 'wolf speed', d: ['The pack closes the gap', 'before the Hollow can turn.'], rank: 2, role: ROLE.wolf },
  { k: 'new', art: 'bolt', tag: 'NEW SPIRIT', name: 'Spirit Bolts', big: '2', unit: 'BOLTS PER VOLLEY', unit2: 'bolts per volley', d: ['Cyan bolts seek the', 'nearest foe.'], rank: 0, role: ROLE.bolt },
];
export const BLESS = [{ art: 'boot', name: 'Dawnlit Soles', big: '+3%', unit: 'move speed' }, { art: 'flame', name: 'Wrapped Warmth', big: '+6%', unit: 'max HP' }];

// medallion art at origin, base radius r
export function art(kind, r) {
  const f = r / 78;
  if (kind === 'wolf') return `<g transform="translate(${6 * f},${38 * f}) scale(${0.86 * f})">${Cr.wolf(P1)}</g>`;
  if (kind === 'raven') return `<g transform="translate(0,${58 * f}) scale(${1.4 * f})">${Cr.raven(P1)}</g>`;
  if (kind === 'orb') return `<circle r="${r * 0.9}" fill="url(#hGlowF)" opacity=".8"/><g transform="scale(${2.5 * f})">${orbit({ c: '#fff4d2', hi: '#ffc766', ol: '#6a4a1a' })}</g>`;
  if (kind === 'bolt') return `<circle r="${r * 0.95}" fill="url(#hGlowCy)"/><g transform="scale(${2.5 * f})">${ic('bolt', { c: '#7ff0ff', hi: '#eaffff', ol: '#1f5f80' })}</g>`;
  if (kind === 'boot') return `<g transform="scale(${1.5 * f})">${ic('boot', { c: '#e8d9b0', hi: '#fff', ol: '#6a5a3a' })}</g>`;
  if (kind === 'flame') return `<circle r="${r * 0.9}" fill="url(#hGlowF)" opacity=".6"/><g transform="scale(${1.5 * f})">${ic('flame', { c: '#ffab3a', hi: '#fff3b0', ol: '#8a3a0c' })}</g>`;
  return '';
}
let mcN = 0;
const medal = (kind, cx, cy, r, ring, S) => { const id = 'mc' + (++mcN); return `<g transform="translate(${cx},${cy})"><circle r="${r + 6}" fill="#0b0907" stroke="${ring}" stroke-width="${S.ringW}" ${S.ring === false ? 'opacity="0"' : ''}/><clipPath id="${id}"><circle r="${r}"/></clipPath><circle r="${r}" fill="#0e0b09" opacity="${S.medalOp}"/><g clip-path="url(#${id})">${art(kind, r)}</g><circle r="${r}" fill="none" stroke="#fff" stroke-opacity=".18" stroke-width="1.6"/></g>`; };
const spark = (x, y, s) => `<path d="M0 -12 L3 -3 L12 0 L3 3 L0 12 L-3 3 L-12 0 L-3 -3Z" fill="#fff6d0" transform="translate(${x},${y}) scale(${s})" filter="url(#hGlowFx)"/>`;
const pips = (cx, y, n, r, evo) => Array.from({ length: 5 }, (_, i) => `<circle cx="${cx - 2 * r * 2.1 + i * r * 2.1}" cy="${y}" r="${r}" fill="${evo || i < n ? (evo ? K.gold : K.cream) : '#0c0908'}" stroke="${evo ? '#8a5a12' : K.brassD}" stroke-width="1.2"/>`).join('') + (!evo && n < 5 ? `<circle cx="${cx - 2 * r * 2.1 + n * r * 2.1}" cy="${y}" r="${r + 3}" fill="none" stroke="#fff" stroke-width="1.6" opacity=".85"/>` : '');

// per-direction chrome for the card screen
export const STYLE = {
  A: { fillOp: 0.97, edge: '#9a9284', edgeW: 2.6, ring: true, ringW: 3.6, medalOp: 1, btn: 'brass', dim: 0.66, rail: false },
  B: { fillOp: 0.78, edge: '#cbbfa6', edgeW: 1.6, ring: false, ringW: 0, medalOp: 0.55, btn: 'ghost', dim: 0.5, rail: false },
  C: { fillOp: 0.97, edge: '#8d7a56', edgeW: 2.4, ring: true, ringW: 3, medalOp: 1, btn: 'rim', dim: 0.62, rail: true },
};

// ---- desktop card (w=262) ----
function cardD(c, x, y, w, h, S, n) {
  const ev = c.k === 'evo', st = c.k === 'stirs', nw = c.k === 'new', edge = ev ? K.gold : S.edge;
  let g = '';
  if (ev) g += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="24" fill="${K.gold}" opacity=".5" filter="url(#hSoft6)"/>` + Array.from({ length: 12 }, (_, i) => `<path d="M0 0 L-12 -170 L12 -170Z" fill="${K.gold}" opacity=".06" transform="translate(${x + w / 2},${y + 120}) rotate(${i * 30})"/>`).join('');
  g += `<rect x="${x}" y="${y + 6}" width="${w}" height="${h}" rx="24" fill="#000" opacity=".5"/>`;
  g += `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="24" fill="url(#${ev ? 'hGoldCard' : 'hCard'})" fill-opacity="${S.fillOp}" stroke="${edge}" stroke-width="${ev ? 5 : S.edgeW}"/>`;
  if (ev) g += `<rect x="${x + 8}" y="${y + 8}" width="${w - 16}" height="${h - 16}" rx="18" fill="none" stroke="${K.gold}" stroke-opacity=".45" stroke-width="1.6"/>`;
  if (st) g += `<rect x="${x - 3.5}" y="${y - 3.5}" width="${w + 7}" height="${h + 7}" rx="27" fill="none" stroke="${K.stirs}" stroke-opacity=".5" stroke-width="1.3"/>`;
  if (S.rail && !ev) g += `<path d="M${x + 26} ${y + 3} H${x + w - 26}" stroke="#ffb23a" stroke-opacity=".55" stroke-width="3" stroke-linecap="round"/>`;
  const my = y + (ev ? 108 : 98), mr = ev ? 60 : 54;
  g += medal(c.art, x + w / 2, my, mr, ev ? K.gold : c.role, S);
  if (ev) g += spark(x + w / 2 - 78, my - 8, 1.2) + spark(x + w / 2 + 80, my + 22, 1) + spark(x + w / 2 + 52, my - 62, 0.8) + spark(x + w / 2 - 52, my + 56, 0.7);
  if (ev) g += `<g transform="translate(${x + 14},${y + 14})"><rect width="92" height="28" rx="7" fill="${K.gold}" stroke="#fff6d0" stroke-width="2"/><rect width="92" height="11" rx="6" fill="#fff" opacity=".3"/>${T('EVOLVE', 46, 20, { s: 16, f: FONT.num, a: 'middle', c: '#4a2e06', ls: 1.5 })}</g>`;
  else if (nw) g += `<g transform="translate(${x + 14},${y + 14})"><path d="M0 0 H72 L82 14 L72 28 H0Z" fill="${c.role}" stroke="#0b0907" stroke-width="1.6" stroke-linejoin="round"/>${T('NEW', 38, 20, { s: 16, f: FONT.num, a: 'middle', c: '#0b2a30', ls: 1.5 })}</g>`;
  else g += txt(c.tag, x + 16, y + 32, 13, { c: K.muted, w: 700, noStroke: true, ls: 1.6 });
  g += `<g transform="translate(${x + w - 26},${y + 26})"><circle r="14" fill="#0b0907" stroke="${edge}" stroke-width="2"/>${T(String(n), 0, 6, { s: 17, f: FONT.num, a: 'middle', c: ev ? K.gold : K.cream })}</g>`;
  const o = ev ? 14 : 0;
  g += T(c.name, x + w / 2, y + 198 + o, { s: 25, f: FONT.title, w: 800, c: ev ? '#fff2c0' : K.cream, a: 'middle', st: K.ink, sw: 4 });
  g += num(c.big, x + w / 2, y + 248 + o, 40, { a: 'middle', c: ev ? K.gold : K.cream, st: ev ? K.goldD : K.ink, sw: 6 });
  g += txt(c.unit, x + w / 2, y + 268 + o, 13, { a: 'middle', c: K.muted, noStroke: true, ls: 2 });
  g += pips(x + w / 2, y + 292 + o, c.rank, 5.6, ev);
  g += c.d.map((l, i) => txt(l, x + w / 2, y + 322 + o + i * 19, 14.5, { a: 'middle', c: ev ? '#f5e8c4' : K.cream, w: 500, noStroke: true })).join('');
  if (st) g += txt('Something stirs…', x + w / 2, y + h - 16, 14.5, { a: 'middle', c: K.stirs, i: true, w: 600, noStroke: true });
  return g;
}
const blessD = (b, x, y, w, h, S, n) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="18" fill="url(#hBless)" fill-opacity="${S.fillOp}" stroke="${K.bless}" stroke-opacity=".7" stroke-width="1.8"/>${medal(b.art, x + 40, y + h / 2, 24, K.bless, { ...S, ringW: 1.6, medalOp: 0.8 })}${T(b.name, x + 78, y + 29, { s: 19, f: FONT.title, w: 800, c: K.bless, st: K.ink, sw: 3 })}${txt(b.big + ' ' + b.unit, x + 78, y + 52, 15, { c: K.creamD, w: 600, noStroke: true })}<g transform="translate(${x + w - 24},${y + 24})"><circle r="12" fill="#0b0907" stroke="${K.bless}" stroke-opacity=".7" stroke-width="1.6"/>${T(String(n), 0, 5.5, { s: 15, f: FONT.num, a: 'middle', c: K.bless })}</g>`;

export function btn(x, y, w, h, key, label, count, S, off) {
  const st = S.btn, e = off ? 0.4 : 1;
  const base = st === 'ghost' ? `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" fill="#140f0c" fill-opacity=".45" stroke="${K.cream}" stroke-opacity=".6" stroke-width="1.6"/>` : `<rect x="${x}" y="${y + 2}" width="${w}" height="${h}" rx="${h / 2}" fill="#000" opacity=".35"/><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${h / 2}" fill="url(#hPlate)" stroke="${K.brass}" stroke-width="2"/>`;
  return `<g opacity="${e}">${base}${key ? `<rect x="${x + 10}" y="${y + h / 2 - 12}" width="24" height="24" rx="6" fill="#0b0907" stroke="${K.brassD}" stroke-width="1.4"/>${T(key, x + 22, y + h / 2 + 6, { s: 15, f: FONT.num, a: 'middle', c: K.cream })}` : ''}${txt(label, x + (key ? 44 : 18), y + h / 2 + 5.5, 16, { c: K.cream, noStroke: true })}${T(count, x + w - 22, y + h / 2 + 7, { s: 19, f: FONT.num, a: 'middle', c: K.cream })}</g>`;
}

// phone landscape card (w150)
function cardL(c, x, y, w, h, S) {
  const ev = c.k === 'evo', st = c.k === 'stirs', nw = c.k === 'new', edge = ev ? K.gold : S.edge;
  let g = ev ? `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="18" fill="${K.gold}" opacity=".45" filter="url(#hSoft6)"/>` : '';
  g += `<rect x="${x}" y="${y + 4}" width="${w}" height="${h}" rx="18" fill="#000" opacity=".5"/><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="18" fill="url(#${ev ? 'hGoldCard' : 'hCard'})" fill-opacity="${S.fillOp}" stroke="${edge}" stroke-width="${ev ? 4 : S.edgeW}"/>`;
  if (ev) g += `<rect x="${x + 6}" y="${y + 6}" width="${w - 12}" height="${h - 12}" rx="13" fill="none" stroke="${K.gold}" stroke-opacity=".45" stroke-width="1.4"/>`;
  if (st) g += `<rect x="${x - 3}" y="${y - 3}" width="${w + 6}" height="${h + 6}" rx="21" fill="none" stroke="${K.stirs}" stroke-opacity=".5" stroke-width="1.2"/>`;
  const tagTxt = ev ? 'EVOLVE' : nw ? 'NEW' : null;
  if (tagTxt) g += `<g transform="translate(${x + 10},${y + 10})"><rect width="${ev ? 74 : 52}" height="24" rx="6" fill="${ev ? K.gold : c.role}" stroke="${ev ? '#fff6d0' : '#0b0907'}" stroke-width="1.6"/>${T(tagTxt, ev ? 37 : 26, 17, { s: 14.5, f: FONT.num, a: 'middle', c: ev ? '#4a2e06' : '#0b2a30', ls: 1 })}</g>`;
  g += medal(c.art, x + w / 2, y + 74, 36, ev ? K.gold : c.role, { ...S, ringW: 3 });
  g += T(c.name, x + w / 2, y + 140, { s: 16, f: FONT.title, w: 800, c: ev ? '#fff2c0' : K.cream, a: 'middle', st: K.ink, sw: 3.4 });
  g += num(c.big, x + w / 2, y + 178, 28, { a: 'middle', c: ev ? K.gold : K.cream, st: ev ? K.goldD : K.ink, sw: 4.6 });
  g += txt(c.unit2, x + w / 2, y + 198, 14, { a: 'middle', c: K.muted, noStroke: true, w: 600 });
  g += pips(x + w / 2, y + 218, c.rank, 4.4, ev);
  if (st) g += `<path d="M${x + 30} ${y + h - 6} H${x + w - 30}" stroke="${K.stirs}" stroke-opacity=".7" stroke-width="2" stroke-linecap="round"/>`;
  return g;
}
const blessL = (b, x, y, w, h, S) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" fill="url(#hBless)" fill-opacity="${S.fillOp}" stroke="${K.bless}" stroke-opacity=".7" stroke-width="1.6"/>${medal(b.art, x + 26, y + h / 2, 16, K.bless, { ...S, ringW: 1.4, medalOp: 0.8 })}${T(b.name, x + 50, y + 19, { s: 14.5, f: FONT.title, w: 800, c: K.bless, st: K.ink, sw: 3 })}${txt(b.big + ' ' + b.unit, x + 50, y + 37, 14, { c: K.creamD, w: 600, noStroke: true })}`;
// phone portrait: horizontal wide card
function cardP(c, x, y, w, h, S) {
  const ev = c.k === 'evo', st = c.k === 'stirs', nw = c.k === 'new', edge = ev ? K.gold : S.edge;
  let g = ev ? `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="18" fill="${K.gold}" opacity=".45" filter="url(#hSoft6)"/>` : '';
  g += `<rect x="${x}" y="${y + 3}" width="${w}" height="${h}" rx="18" fill="#000" opacity=".5"/><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="18" fill="url(#${ev ? 'hGoldCard' : 'hCard'})" fill-opacity="${S.fillOp}" stroke="${edge}" stroke-width="${ev ? 4 : S.edgeW}"/>`;
  if (ev) g += `<rect x="${x + 6}" y="${y + 6}" width="${w - 12}" height="${h - 12}" rx="13" fill="none" stroke="${K.gold}" stroke-opacity=".45" stroke-width="1.4"/>`;
  if (st) g += `<rect x="${x - 3}" y="${y - 3}" width="${w + 6}" height="${h + 6}" rx="21" fill="none" stroke="${K.stirs}" stroke-opacity=".5" stroke-width="1.2"/>`;
  g += medal(c.art, x + 52, y + h / 2, 34, ev ? K.gold : c.role, { ...S, ringW: 3 });
  g += T(c.name, x + 100, y + 33, { s: 19, f: FONT.title, w: 800, c: ev ? '#fff2c0' : K.cream, st: K.ink, sw: 3.6 });
  g += txt(c.unit2, x + 100, y + 56, 14, { c: K.muted, noStroke: true, w: 600 });
  g += pips(x + 100 + 28, y + h - 16, c.rank, 4.2, ev);
  g += num(c.big, x + w - 18, y + h / 2 + 14, 30, { a: 'end', c: ev ? K.gold : K.cream, st: ev ? K.goldD : K.ink, sw: 4.8 });
  const tagTxt = ev ? 'EVOLVE' : nw ? 'NEW' : null;
  if (tagTxt) g += `<g transform="translate(${x + w - 18 - (ev ? 74 : 52)},${y + 8})"><rect width="${ev ? 74 : 52}" height="22" rx="6" fill="${ev ? K.gold : c.role}" stroke="${ev ? '#fff6d0' : '#0b0907'}" stroke-width="1.4"/>${T(tagTxt, ev ? 37 : 26, 16, { s: 14, f: FONT.num, a: 'middle', c: ev ? '#4a2e06' : '#0b2a30', ls: 1 })}</g>`;
  if (st) g += txt('Something stirs…', x + w - 18, y + h - 10, 14, { a: 'end', c: K.stirs, i: true, w: 600, noStroke: true });
  return g;
}
const blessP = (b, x, y, w, h, S) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="14" fill="url(#hBless)" fill-opacity="${S.fillOp}" stroke="${K.bless}" stroke-opacity=".7" stroke-width="1.6"/>${medal(b.art, x + 24, y + h / 2, 15, K.bless, { ...S, ringW: 1.4, medalOp: 0.8 })}${T(b.name, x + 46, y + 26, { s: 14, f: FONT.title, w: 700, c: K.bless, st: K.ink, sw: 3 })}${txt(b.big + ' ' + b.unit, x + 46, y + 47, 14, { c: K.creamD, w: 600, noStroke: true })}`;

// ---- screens ----
export function levelScreen(mode, key, sc, o = {}) {
  const [W, H] = DIM[mode], S = STYLE[key], D = DIRS[key];
  const st = stFor(key, { xp: 1, lv: 8, flare: true, wfade: 1, pulseSlot: -1 });
  let s = `<use href="#scn-${mode}" filter="url(#b8)"/>` + D.hud(mode, st, HERO[mode]).svg;
  const gid = `lvg${mode}${key}`;
  s += `<rect width="${W}" height="${H}" fill="#07060a" opacity="${S.dim}"/><radialGradient id="${gid}" cx=".5" cy=".42" r=".6"><stop offset="0" stop-color="#ffb23a" stop-opacity=".16"/><stop offset="1" stop-color="#000" stop-opacity=".5"/></radialGradient><rect width="${W}" height="${H}" fill="url(#${gid})"/>`;
  if (key === 'C') s += frameSvg(mode, W, H, SAFEC[mode], mode === 'desk' ? 18 : 10, st);
  const cards = o.cards || CARDS, bless = o.noBless ? [] : (o.bless || BLESS), rr = o.rerolls ?? 2, bn = o.banish ?? 1;
  if (mode === 'desk') {
    s += T('The light stirs', W / 2, 98, { s: 32, f: FONT.title, a: 'middle', c: K.cream, st: K.ink, sw: 6, i: 1, w: 700 }) + txt(`LEVEL ${st.lv}  ·  CHOOSE ONE`, W / 2, 121, 13, { a: 'middle', c: '#ffc766', ls: 3, noStroke: true });
    const cw = 262, gap = 14, tot = cards.length * cw + (cards.length - 1) * gap, x0 = (W - tot) / 2;
    cards.forEach((c, i) => { const ev = c.k === 'evo', h = ev ? 408 : 380; s += cardD(c, x0 + i * (cw + gap), ev ? 128 : 142, cw, h, S, i + 1); });
    if (bless.length) {
      const bw = 300, bx = (W - (2 * bw + 14)) / 2;
      s += txt('BLESSINGS  ·  quiet gifts', bx, 556, 13, { c: K.bless, ls: 2.4, noStroke: true, op: 0.85 }) + `<path d="M${bx + 215} 551 H${bx + 2 * bw + 14}" stroke="${K.bless}" stroke-opacity=".3" stroke-width="1.2"/>`;
      bless.forEach((b, i) => { s += blessD(b, bx + i * (bw + 14), 566, bw, 70, S, cards.length + i + 1); });
    }
    const by = 654; s += btn(W / 2 - 168, by, 156, 44, 'R', 'Reroll', '×' + rr, S, rr === 0) + btn(W / 2 + 12, by, 156, 44, 'B', 'Banish', '×' + bn, S, bn === 0);
  } else if (mode === 'land') {
    s += T('The light stirs', W / 2, 30, { s: 22, f: FONT.title, a: 'middle', c: K.cream, st: K.ink, sw: 5, i: 1, w: 700 });
    const cw = 150, gap = 8, tot = cards.length * cw + (cards.length - 1) * gap, x0 = (W - tot) / 2;
    cards.forEach((c, i) => { s += cardL(c, x0 + i * (cw + gap), c.k === 'evo' ? 38 : 46, cw, c.k === 'evo' ? 252 : 238, S); });
    const by = 300;
    s += btn(x0, by, 112, 44, null, 'Reroll', '×' + rr, S, rr === 0) + btn(x0 + 120, by, 112, 44, null, 'Banish', '×' + bn, S, bn === 0);
    bless.forEach((b, i) => { const bw = (tot - 240 - 8) / 2; s += blessL(b, x0 + 240 + i * (bw + 8), by, bw, 44, S); });
  } else {
    s += T('The light stirs', W / 2, 182, { s: 26, f: FONT.title, a: 'middle', c: K.cream, st: K.ink, sw: 5, i: 1, w: 700 }) + txt(`LEVEL ${st.lv}`, W / 2, 204, 14, { a: 'middle', c: '#ffc766', ls: 3, noStroke: true });
    let y = 222; const cw = 366, x = 12;
    cards.forEach((c) => { const h = c.k === 'evo' ? 100 : 92; s += cardP(c, x, y, cw, h, S); y += h + 8; });
    if (bless.length) { const bw = (cw - 8) / 2; bless.forEach((b, i) => { s += blessP(b, x + i * (bw + 8), y + 2, bw, 66, S); }); }
    s += btn(x, 744, 179, 48, null, 'Reroll', '×' + rr, S, rr === 0) + btn(x + 187, 744, 179, 48, null, 'Banish', '×' + bn, S, bn === 0);
  }
  return s;
}
