// Level-up: three icon-led cards over the dimmed, blurred run. Rarity glow; one gold EVOLVE card (gold reserved for evolutions).
import { T, FONT, rnd, nid } from './core.mjs';
import * as C from './creatures.mjs';
import { ic } from './icons.mjs';
import { world, worldDefs as wd } from './world.mjs';
export const worldDefs = wd;

export function levelup(K) {
  const GOLD = '#ffd36b', GOLD2 = '#ffb23a', GOLDD = '#8a5a12';
  const cards = [
    { x: 118, y: 176, k: 'common', tag: 'WOLVES  ·  STAT', name: 'Swift Pack', big: '+15%', unit: 'wolf speed', desc: 'The pack closes the gap before the Hollow can turn.', rank: [2, 5], art: 'wolf', col: K.wolf[1], rim: '#c9d2de', num: 1 },
    { x: 454, y: 148, k: 'evolve', tag: 'EVOLUTION  ·  WOLVES', name: 'Pouncing Pack', big: 'LEAP', unit: 'pin and maul', desc: 'Wolves spring in an arc, pin one foe flat, then maul it.', rank: [5, 5], art: 'wolf', col: GOLD, rim: GOLD, num: 2, w: 372, h: 504 },
    { x: 862, y: 176, k: 'rare', tag: 'NEW SPIRIT  ·  RAVENS', name: 'Raven Flock', big: '3', unit: 'ravens circle you', desc: 'Letter-winged ravens peck what comes near and drop feathers.', rank: [0, 5], art: 'raven', col: K.raven[1], rim: K.raven[0], num: 3 },
  ];
  let out = `<g filter="url(#b8)">${world(K, { hud: false })}</g><rect y="64" width="1280" height="656" fill="#06080d" opacity=".66"/><rect y="64" width="1280" height="656" fill="url(#gVig)"/>`;
  out += T('The light stirs', 640, 108, { s: 34, f: FONT.title, a: 'middle', c: '#fff', st: '#0a0d13', sw: 6, i: 1, w: 700 }) + T('LEVEL 8  ·  CHOOSE ONE', 640, 130, { s: 13, a: 'middle', c: K.warm, ls: 4, w: 700 });
  for (const c of cards) {
    const w = c.w || 300, h = c.h || 454, ev = c.k === 'evolve';
    const bc = ev ? GOLD : c.k === 'rare' ? K.raven[1] : '#9aa6b3';
    const id = nid('card');
    out += `<g>`;
    // rarity glow
    out += `<rect x="${c.x}" y="${c.y}" width="${w}" height="${h}" rx="26" fill="${bc}" opacity="${ev ? 0.55 : c.k === 'rare' ? 0.4 : 0.12}" filter="url(#b16)"/>`;
    if (ev) out += Array.from({ length: 14 }, (_, i) => `<path d="M0 0 L-14 -150 L14 -150Z" fill="${GOLD}" opacity=".07" transform="translate(${c.x + w / 2},${c.y + 150}) rotate(${i * 25.7})"/>`).join('');
    out += `<rect x="${c.x}" y="${c.y}" width="${w}" height="${h}" rx="26" fill="#05070b" transform="translate(0,6)" opacity=".5"/>`;
    out += `<linearGradient id="${id}b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${ev ? '#3a2e1a' : K.plate3}"/><stop offset=".5" stop-color="${ev ? '#241c12' : K.plate2}"/><stop offset="1" stop-color="${ev ? '#17110a' : K.plate}"/></linearGradient>`;
    out += `<rect x="${c.x}" y="${c.y}" width="${w}" height="${h}" rx="26" fill="url(#${id}b)" stroke="${ev ? GOLD : bc}" stroke-width="${ev ? 5 : 3.4}"/><rect x="${c.x + 7}" y="${c.y + 7}" width="${w - 14}" height="${h - 14}" rx="20" fill="none" stroke="${ev ? GOLD2 : bc}" stroke-opacity=".4" stroke-width="1.6"/>`;
    // medallion window with creature art
    const mx = c.x + w / 2, my = c.y + (ev ? 128 : 112), mr = ev ? 90 : 78;
    out += `<clipPath id="${id}m"><circle cx="${mx}" cy="${my}" r="${mr}"/></clipPath><circle cx="${mx}" cy="${my}" r="${mr + 8}" fill="#0a0d13" stroke="${ev ? GOLD : bc}" stroke-width="4"/><circle cx="${mx}" cy="${my}" r="${mr}" fill="#0c1018"/><g clip-path="url(#${id}m)"><circle cx="${mx}" cy="${my + 10}" r="${mr * 1.2}" fill="url(#gGlow${c.art === 'raven' ? 'R' : 'W'})" opacity="${ev ? 0.55 : 0.9}"/>`;
    if (ev) out += `<circle cx="${mx}" cy="${my + 10}" r="${mr * 1.1}" fill="url(#gGlowWarm)" opacity=".7"/>`;
    const sc = c.art === 'raven' ? 1.4 : ev ? 0.78 : 0.86;
    out += `<g transform="translate(${mx + (c.art === 'raven' ? 0 : ev ? -4 : 6)},${my + (c.art === 'raven' ? 58 : 38)}) scale(${sc}) ${ev ? 'rotate(-10)' : ''}">${C[c.art](K)}</g>`;
    if (ev) out += `<g transform="translate(${mx + 48},${my + 4})" opacity=".9"><path d="M0 -34 C16 -40 34 -32 40 -14 M10 -26 C22 -26 30 -18 34 -6" stroke="${GOLD}" stroke-width="4" fill="none" stroke-linecap="round" filter="url(#glowS)" opacity=".9"/></g>`;
    out += `</g><circle cx="${mx}" cy="${my}" r="${mr}" fill="none" stroke="#fff" stroke-opacity=".25" stroke-width="2"/>`;
    // sparkles on evolve
    if (ev) [[-100, -20, 1.2], [104, 20, 1], [-70, 84, 0.8], [86, -70, 0.9], [0, -108, 0.8]].forEach(([dx, dy, s]) => { out += `<path d="M0 -12 L3 -3 L12 0 L3 3 L0 12 L-3 3 L-12 0 L-3 -3Z" fill="#fff6d0" transform="translate(${mx + dx},${my + dy}) scale(${s})" filter="url(#glowS)"/>`; });
    // tag chip
    const ty = c.y + (ev ? 236 : 218);
    out += `<rect x="${c.x + 24}" y="${ty - 4}" width="${w - 48}" height="24" rx="12" fill="${bc}" opacity=".16" stroke="${bc}" stroke-width="1.4"/>` + T(c.tag, mx, ty + 13, { s: 12, a: 'middle', c: ev ? GOLD : '#fff', ls: 2 });
    // name
    out += T(c.name, mx, ty + 56, { s: ev ? 36 : 32, a: 'middle', f: FONT.title, w: 900, c: ev ? '#fff2c0' : '#fff', st: '#0a0d13', sw: 4 });
    // big stat
    out += T(c.big, mx, ty + (ev ? 112 : 108), { s: ev ? 44 : 48, a: 'middle', f: FONT.num, c: ev ? GOLD : K.warmHi, st: ev ? GOLDD : '#0a0d13', sw: 5 }) + T(c.unit.toUpperCase(), mx, ty + (ev ? 134 : 130), { s: 12, a: 'middle', c: K.txtD, ls: 2.4 });
    // rank pips
    const pips = 5; const [rk, mxk] = c.rank;
    for (let i = 0; i < pips; i++) out += `<circle cx="${mx - 40 + i * 20}" cy="${ty + (ev ? 154 : 150)}" r="5.2" fill="${i < rk ? (ev ? GOLD : K.warmHi) : '#10151c'}" stroke="${ev ? GOLD2 : K.edgeD}" stroke-width="1.4"/>`;
    if (!ev) out += `<circle cx="${mx - 40 + rk * 20}" cy="${ty + 150}" r="8" fill="none" stroke="#fff" stroke-width="1.6" opacity=".85"/>`;
    // description (2 lines)
    const words = c.desc.split(' '), lines = ['', '']; let li = 0; words.forEach((wd) => { if ((lines[li] + ' ' + wd).length > 32 && li === 0) li = 1; lines[li] += (lines[li] ? ' ' : '') + wd; });
    out += lines.map((l, i) => T(l, mx, ty + (ev ? 186 : 182) + i * 19, { s: 14.5, a: 'middle', c: ev ? '#f5e8c4' : K.txt, w: 500 })).join('');
    // key badge
    out += `<g transform="translate(${mx},${c.y + h})"><circle r="17" fill="#0a0d13" stroke="${ev ? GOLD : bc}" stroke-width="2.4"/>${T(String(c.num), 0, 7, { s: 20, f: FONT.num, a: 'middle', c: ev ? GOLD : '#fff' })}</g>`;
    // ribbon
    if (ev) out += `<g transform="translate(${c.x + w - 62},${c.y + 26}) rotate(18)"><rect x="-56" y="-14" width="112" height="28" rx="6" fill="${GOLD}" stroke="#fff6d0" stroke-width="2"/><rect x="-56" y="-14" width="112" height="12" rx="6" fill="#fff" opacity=".3"/>${T('EVOLVE', 0, 7, { s: 18, f: FONT.num, a: 'middle', c: '#4a2e06', ls: 2 })}</g>`;
    if (c.k === 'rare') out += `<g transform="translate(${c.x + w - 58},${c.y + 24})"><rect x="-38" y="-12" width="76" height="24" rx="12" fill="${K.raven[2]}" stroke="#fff" stroke-width="1.6"/>${T('NEW', 0, 6, { s: 13, f: FONT.num, a: 'middle', c: '#fff', ls: 2 })}</g>`;
    out += `</g>`;
  }
  // reroll / banish
  const pill = (x, label, sub) => `<g transform="translate(${x},688)"><rect x="-84" y="-18" width="168" height="36" rx="18" fill="${K.plate}" stroke="${K.edge}" stroke-width="2"/>${T(label, -14, 6, { s: 14, c: K.txt, w: 700, a: 'middle' })}${T(sub, 62, 6, { s: 14, f: FONT.num, c: K.warmHi, a: 'middle' })}<circle cx="-70" cy="0" r="0" /></g>`;
  out += pill(520, 'R   Reroll', '2') + pill(760, 'B   Banish', '1');
  return out;
}
