// CX2 Almanac portraits: the REAL code-drawn Husk art (the same painters the game atlas bakes; no new art), one standing frame per foe as a
// standalone SVG string. Our own code only (no external references, no untrusted input). The UI shows it through <img src=blob:> (an SVG in an
// <img> runs no script), cached per id. Pure string building here; the Blob URL is made in portraitUrl() (browser only, null in Node).
import { HUSK_TYPES } from './frames.js';
import { resetAll, defs, setGrainBox, clearEyes, setEyeSpecies } from './paint.js';
import { EXTRA_DEFS } from './kit.js';
import { frameSvg, addSvg, BOX as BOSS_BOX } from '../boss/bossart.js';

const PX = 240; // portrait raster width (2x the largest card at true size)

export const PORTRAIT_IDS = Object.freeze([...Object.keys(HUSK_TYPES), 'elder_treant', 'treant_pod', 'treant_sapling', 'marks']);

export function portraitSvg(id) {
  if (Object.hasOwn(HUSK_TYPES, id) || id === 'marks') {
    const tid = id === 'marks' ? 'wolf' : id;
    const T = HUSK_TYPES[tid];
    const st = id === 'marks' ? { maskOnly: 1 } : { ph: 0 };
    const box = id === 'marks' ? T.mask : T.box;
    resetAll(); setEyeSpecies(tid); setGrainBox(box[0], box[1], box[2], box[3]); clearEyes();
    const r = T.fn(st);
    const h = Math.round((PX * box[3]) / box[2]);
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${PX}" height="${h}" viewBox="${box.join(' ')}">${defs()}<defs>${EXTRA_DEFS}</defs>${r.b}${id === 'marks' ? '' : r.e}</svg>`;
  }
  if (id === 'elder_treant') { const k = PX / BOSS_BOX[2]; return frameSvg({ ph: 1 }, PX, Math.round(BOSS_BOX[3] * k), k); }
  if (id === 'treant_pod') return addSvg(0);
  if (id === 'treant_sapling') return addSvg(1);
  return null;
}

const CACHE = new Map();
export function portraitUrl(id) {
  if (CACHE.has(id)) return CACHE.get(id);
  let url = null;
  try {
    const svg = PORTRAIT_IDS.includes(id) ? portraitSvg(id) : null;
    if (svg && typeof URL !== 'undefined' && URL.createObjectURL && typeof Blob !== 'undefined') url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
  } catch { url = null; }
  CACHE.set(id, url);
  return url;
}
