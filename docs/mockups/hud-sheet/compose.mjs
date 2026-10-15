// Page wrapper, banner, and frame composer (scene image + world items + a direction's HUD) shared by every sheet page.
import { defs as coreDefs, P1 } from '../cartoon-polished/core.mjs';
import { wolfMask } from '../cartoon-polished/creatures.mjs';
import { HDEFS, T, FONT, K } from './kit.mjs';
import { sceneItems } from './items.mjs';
import { HERO } from './scenes.mjs';
import * as A from './dirA.mjs';
import * as B from './dirB.mjs';
import * as C from './dirC.mjs';
export const DIRS = { A, B, C };
export const DIM = A.DIM;
export const stFor = (key, o = {}) => ({ ...A.ST, ...(key === 'B' ? { wfade: 0.42, pulseSlot: 1 } : {}), ...o });

let SC = null; export const setScenes = (s) => { SC = s; };
export const page = (body, w = 1280, h = 720, bg = '#0b0907') => `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;background:${bg}}svg{display:block}</style></head><body><svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${coreDefs(P1)}<defs>${wolfMask}</defs>${HDEFS}${SC ? `<defs><image id="scn-desk" href="${SC.desk}" width="1280" height="720"/><image id="scn-land" href="${SC.land}" width="844" height="390"/><image id="scn-port" href="${SC.port}" width="390" height="844"/></defs>` : ''}<rect width="${w}" height="${h}" fill="${bg}"/>${body}</svg></body></html>`;

export function banner(D, sub, w = 1280) {
  const m = D.META, sw = m.sw.map(([c, n], i) => `<circle cx="${w - 262 + i * 52}" cy="21" r="11" fill="${c}" stroke="#fff" stroke-opacity=".7" stroke-width="1.6"/>${T(c, w - 262 + i * 52, 48, { s: 8.5, a: 'middle', c: '#cfd6e0', f: FONT.mono, w: 400 })}`).join('');
  return `<g><rect width="${w}" height="64" fill="#07090d" opacity=".96"/><rect y="64" width="${w}" height="2" fill="#d8b26a" opacity=".8"/>
${T(`HUD DIRECTION ${m.id}: ${m.name}`, 14, 27, { s: 25, f: FONT.title, w: 900, c: '#fff', ls: 0.5 })}
${T(sub || m.tag, 14, 44, { s: 12.5, c: '#ffd98a', w: 600 })}
${T(m.legend, 14, 58, { s: 10.2, c: '#aab4c2', w: 400 })}${sw}</g>`;
}

// one frame of the game (scene + items + HUD) at (x,y) scaled by s; returns {svg, zones}
export function frame(mode, key, st, scenes, o = {}) {
  const [W, H] = DIM[mode], hud = DIRS[key].hud(mode, st, HERO[mode]), s = o.s ?? 1;
  const inner = `<use href="#scn-${mode}"/>${o.noItems ? '' : sceneItems(mode, { slim: key === 'B' })}${o.noHud ? '' : hud.svg}${o.extra || ''}`;
  return { svg: `<svg x="${o.x ?? 0}" y="${o.y ?? 0}" width="${W * s}" height="${H * s}" viewBox="0 0 ${W} ${H}">${inner}</svg>`, zones: hud.zones, inner };
}
export const note = (x, y, w, h, title, lines, o = {}) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="#15110e" stroke="#4a3d2c"/>${T(title, x + 12, y + 20, { s: 13, f: FONT.title, w: 900, c: '#ffd98a', ls: 0.8 })}${lines.map((l, i) => T(l, x + 12, y + 40 + i * (o.lh || 16), { s: o.fs || 11.5, c: l.startsWith('!') ? '#ff9a8a' : '#d8cfc0', w: 500 }).replace('>!', '>')).join('')}`;
export { T, FONT, K };

// crop of a frame: shows rect [cx,cy,cw,ch] of (scene + items + HUD) at (x,y) scaled by s
export function crop(key, mode, st, rect, x, y, s, o = {}) {
  const [W, H] = DIM[mode], hud = DIRS[key].hud(mode, st, HERO[mode]);
  return `<svg x="${x}" y="${y}" width="${rect[2] * s}" height="${rect[3] * s}" viewBox="${rect.join(' ')}" overflow="hidden"><use href="#scn-${mode}"/>${o.noItems ? '' : sceneItems(mode, { slim: key === 'B' })}${o.noHud ? '' : hud.svg}${o.extra || ''}</svg>`;
}
