// Chunky icon glyphs, drawn in a -24..24 box. ic(name, K, {c,hi,ol}) -> svg group. Style: bold filled silhouette, dark outline, highlight tick, soft inner colour.
import { nid } from './core.mjs';
const P = {
  wolf: 'M-18 6 L-20 -16 L-9 -9 L0 -12 L9 -9 L20 -16 L18 6 C16 14 6 20 0 20 C-6 20 -16 14 -18 6Z',
  raven: 'M-22 -4 C-14 -14 -6 -12 -2 -8 C0 -14 6 -18 12 -14 L22 -10 L12 -6 C12 2 6 10 -2 12 L2 20 L-6 14 L-12 20 L-12 8 C-18 6 -22 2 -22 -4Z',
  bolt: 'M6 -22 L-12 2 L-2 2 L-8 22 L14 -4 L3 -4Z',
  heart: 'M0 18 C-24 2 -20 -16 -9 -16 C-4 -16 0 -12 0 -9 C0 -12 4 -16 9 -16 C20 -16 24 2 0 18Z',
  shard: 'M0 -22 L14 -4 L0 22 L-14 -4Z',
  star: 'M0 -22 L5 -7 L21 -7 L8 3 L13 19 L0 10 L-13 19 L-8 3 L-21 -7 L-5 -7Z',
  flame: 'M0 -22 C-6 -10 -16 -4 -14 8 C-12 18 -4 22 0 22 C6 22 14 18 14 8 C14 0 8 -2 6 -10 C4 -6 2 -4 0 -2 C2 -10 2 -16 0 -22Z',
  leaf: 'M-18 18 C-22 -6 -6 -20 18 -18 C20 6 6 22 -18 18Z',
  shield: 'M0 -22 L18 -14 C18 6 10 16 0 22 C-10 16 -18 6 -18 -14Z',
  boot: 'M-10 -20 L6 -20 L6 -2 C12 0 20 4 20 12 L20 18 L-14 18 L-14 4 C-12 0 -10 -2 -10 -4Z',
  hourglass: 'M-14 -22 H14 V-16 C14 -8 4 -4 0 0 C4 4 14 8 14 16 V22 H-14 V16 C-14 8 -4 4 0 0 C-4 -4 -14 -8 -14 -16Z',
  magnet: 'M-18 18 V-2 C-18 -20 18 -20 18 -2 V18 H8 V-2 C8 -8 -8 -8 -8 -2 V18Z',
  moon: 'M10 -20 C-8 -22 -22 -8 -20 8 C-18 20 -2 26 12 20 C0 16 -4 4 -2 -6 C0 -12 4 -18 10 -20Z',
  bell: 'M0 -22 C-4 -22 -4 -17 -4 -16 C-12 -14 -14 -6 -14 2 L-18 12 H18 L14 2 C14 -6 12 -14 4 -16 C4 -17 4 -22 0 -22Z M-5 15 H5 C5 21 -5 21 -5 15Z',
  paw: 'M0 20 C-12 20 -18 10 -12 2 C-8 -4 -4 -6 0 -6 C4 -6 8 -4 12 2 C18 10 12 20 0 20Z',
  coin: 'M0 -20 C12 -20 20 -12 20 0 C20 12 12 20 0 20 C-12 20 -20 12 -20 0 C-20 -12 -12 -20 0 -20Z',
  eye: 'M-22 0 C-12 -16 12 -16 22 0 C12 16 -12 16 -22 0Z',
  book: 'M-20 -16 C-10 -20 -4 -18 0 -14 C4 -18 10 -20 20 -16 V16 C10 12 4 14 0 18 C-4 14 -10 12 -20 16Z',
  skull: 'M0 -22 C14 -22 20 -12 18 -2 C17 4 14 6 12 8 V16 H-12 V8 C-14 6 -17 4 -18 -2 C-20 -12 -14 -22 0 -22Z',
  clock: 'M0 -20 C12 -20 20 -12 20 0 C20 12 12 20 0 20 C-12 20 -20 12 -20 0 C-20 -12 -12 -20 0 -20Z',
  zap: 'M-4 -22 L-16 4 H-4 L-8 22 L16 -6 H4 L10 -22Z',
};
export function ic(name, o = {}) {
  const c = o.c || '#ffc766', hi = o.hi || '#fff4d2', ol = o.ol || '#2a1d14', s = o.s ?? 1, id = nid('ic');
  const d = P[name] || P.star;
  let extra = '';
  if (name === 'wolf') extra = `<circle cx="-7" cy="-1" r="2.6" fill="${ol}"/><circle cx="7" cy="-1" r="2.6" fill="${ol}"/><path d="M-4 10 L0 14 L4 10 Z" fill="${ol}"/><path d="M-16 -12 L-9 -6 M16 -12 L9 -6" stroke="${hi}" stroke-width="2" opacity=".6"/>`;
  if (name === 'raven') extra = `<circle cx="8" cy="-10" r="2" fill="${ol}"/><path d="M-14 0 C-8 -6 -2 -4 0 0" stroke="${hi}" stroke-width="2" fill="none" opacity=".7"/>`;
  if (name === 'coin') extra = `<circle r="12" fill="none" stroke="${ol}" stroke-width="2" opacity=".5"/><path d="M-4 -6 L4 -6 M-4 0 L4 0 M-4 6 L4 6" stroke="${ol}" stroke-width="2.4" opacity=".6"/>`;
  if (name === 'eye') extra = `<circle r="8" fill="${hi}"/><circle r="4.4" fill="${ol}"/><circle cx="-1.6" cy="-1.6" r="1.4" fill="#fff"/>`;
  if (name === 'skull') extra = `<circle cx="-6.5" cy="-2" r="4" fill="${ol}"/><circle cx="6.5" cy="-2" r="4" fill="${ol}"/><path d="M-6 8 V16 M0 8 V16 M6 8 V16" stroke="${ol}" stroke-width="2"/>`;
  if (name === 'clock') extra = `<path d="M0 -12 V0 L8 6" stroke="${ol}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
  if (name === 'moon' || name === 'shard') extra = '';
  return `<g transform="scale(${s})"><clipPath id="${id}"><path d="${d}"/></clipPath>
<path d="${d}" fill="${ol}" stroke="${ol}" stroke-width="7" stroke-linejoin="round"/>
<g clip-path="url(#${id})"><rect x="-30" y="-30" width="60" height="60" fill="${c}"/><ellipse cx="-6" cy="-10" rx="22" ry="14" fill="${hi}" opacity=".55"/><ellipse cx="8" cy="22" rx="26" ry="10" fill="#000" opacity=".22"/></g>
<path d="${d}" fill="none" stroke="${hi}" stroke-width="1.4" opacity=".6" stroke-linejoin="round"/>${extra}</g>`;
}
// orbit icon (ring + candle flames), bespoke
export function orbit(o = {}) {
  const c = o.c || '#fff4d2', ol = o.ol || '#2a1d14';
  return `<ellipse rx="19" ry="8" fill="none" stroke="${ol}" stroke-width="7"/><ellipse rx="19" ry="8" fill="none" stroke="${c}" stroke-width="3"/>` + [[-19, 0], [19, 0], [0, 8]].map(([x, y]) => `<g transform="translate(${x},${y - 6})"><path d="M0 -12 C-6 -4 -6 4 0 6 C6 4 6 -4 0 -12Z" fill="${o.hi || '#ffc766'}" stroke="${ol}" stroke-width="2.4" stroke-linejoin="round"/><path d="M0 -5 C-2 -2 -2 1 0 2 C2 1 2 -2 0 -5Z" fill="#fff"/></g>`).join('');
}
export function lock(o = {}) {
  const c = o.c || '#9aa6b3', ol = o.ol || '#10151c';
  return `<path d="M-8 -4 V-9 C-8 -17 8 -17 8 -9 V-4" fill="none" stroke="${ol}" stroke-width="7" stroke-linecap="round"/><path d="M-8 -4 V-9 C-8 -17 8 -17 8 -9 V-4" fill="none" stroke="${c}" stroke-width="3" stroke-linecap="round"/><rect x="-12" y="-4" width="24" height="18" rx="4" fill="${c}" stroke="${ol}" stroke-width="2.6"/><circle cy="4" r="2.6" fill="${ol}"/><rect x="-1" y="4" width="2" height="6" fill="${ol}"/>`;
}
