// Creature sheet: 11 creatures, names + one-line silhouette note.
import { T, FONT } from './core.mjs';
import * as C from './creatures.mjs';

// [fn, name, role, note, scale, dx, dy(feet offset inside cell), cell]
const LIST = [
  ['wren', 'WREN', 'HERO', 'Small and round: wolf-ear hood, long amber scarf', 1.12, 26],
  ['elias', 'ELIAS', 'HERO', 'Broad square robe, candle-wheel circle behind', 1.04, 0],
  ['wolf', 'GHOST WOLF', 'SUMMON', 'Lean light-wolf, mist legs, amber neck-thread', 1.3, 14],
  ['treant', 'ELDER TREANT', 'BOSS', 'Antler crown, raised arms, hollow chest glows cold', 0.92, 0],
  ['raven', 'RAVEN', 'SUMMON', 'Wide V wings with letter-paper tips, fan tail', 1.2, 0],
  ['fellwolf', 'FELL WOLF', 'ENEMY', 'Ribby, head low and long, tail hangs straight', 1.7, -6],
  ['crow', 'GRAVE CROW', 'ENEMY', 'Ragged triangle, wings too long, ash flakes', 1.1, 0],
  ['crawler', 'ROOT CRAWLER', 'ENEMY', 'Wide low root mass, many legs, thorn horns', 1.6, 0],
  ['blightbulb', 'BLIGHTBULB', 'NEW', 'Pale puffball on stubby legs, cracks leak light', 1.42, 0],
  ['thornspitter', 'THORNSPITTER', 'NEW', 'Thin upright stick, bulb head, twig arms', 1.1, 0],
  ['mourner', 'MOSS MOURNER', 'NEW', 'Hooded hunched lump, dangling moss sleeves', 1.4, 0],
];

export function sheet(K) {
  const roleCol = { HERO: K.warm, SUMMON: K.sp, ENEMY: '#c9d2de', BOSS: '#c9d2de', NEW: '#c9d2de' };
  const cells = [];
  const colW = 320, top = 64, rowH = (720 - top) / 3;
  const pos = { wren: [0, 0], elias: [1, 0], wolf: [2, 0], treant: [3, 0, 2], raven: [0, 1], fellwolf: [1, 1], crow: [2, 1], crawler: [0, 2], blightbulb: [1, 2], thornspitter: [2, 2], mourner: [3, 2] };
  let out = `<rect width="1280" height="720" fill="${K.night}"/>`;
  for (const [fn, name, role, note, sc, dx] of LIST) {
    const [c, r, span = 1] = pos[fn];
    const x = c * colW, y = top + r * rowH, w = colW, h = rowH * span;
    const hero = role === 'HERO', spirit = role === 'SUMMON', enemy = !hero && !spirit;
    const cx = x + w / 2 + dx, base = y + h - 76;
    const bgGlow = hero ? K.warm : spirit ? K.sp : '#8e9cb8';
    const cardId = 'cd' + fn;
    out += `<g>
<defs><radialGradient id="${cardId}" cx=".5" cy=".62" r=".7"><stop offset="0" stop-color="${hero ? K.glowBg : spirit ? K.sp : K.hG1}" stop-opacity="${enemy ? 0.55 : 0.32}"/><stop offset="1" stop-color="${K.plate}" stop-opacity="0"/></radialGradient>
<linearGradient id="${cardId}b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${K.plate2}"/><stop offset="1" stop-color="${K.plate}"/></linearGradient></defs>
<rect x="${x + 6}" y="${y + 6}" width="${w - 12}" height="${h - 12}" rx="20" fill="url(#${cardId}b)" stroke="${K.edge}" stroke-opacity=".45" stroke-width="2"/>
<rect x="${x + 6}" y="${y + 6}" width="${w - 12}" height="${h - 12}" rx="20" fill="url(#${cardId})"/>
<ellipse cx="${cx - dx}" cy="${base + 4}" rx="${110}" ry="${enemy ? 16 : 14}" fill="${enemy ? K.hG2 : K.rG3}" opacity=".55"/>
${enemy ? '' : `<ellipse cx="${cx - dx}" cy="${base + 4}" rx="92" ry="11" fill="${hero ? K.warm : K.sp}" opacity=".22"/>`}
<g transform="translate(${cx},${base}) scale(${sc})">${C[fn](K)}</g>
${T(name, x + 24, y + h - 40, { s: 24, f: FONT.title, w: 900, c: '#fff', st: '#000', sw: 3 })}
<rect x="${x + w - 24 - 82}" y="${y + 18}" width="82" height="22" rx="11" fill="${roleCol[role]}" opacity=".18" stroke="${roleCol[role]}" stroke-width="1.4"/>
${T(role, x + w - 24 - 41, y + 34, { s: 12, a: 'middle', c: roleCol[role], ls: 1.4 })}
${T(note, x + 24, y + h - 20, { s: 12.5, c: K.txtD, i: 1, w: 500 })}
</g>`;
  }
  return out;
}
