// HUD-2: round card icons. Inline SVG built with createElementNS only (no innerHTML, no data in markup).
// Weapon emblems are the HUD-1 ones (hudsvg.js emblem); Blessing and fallback glyphs are drawn here in the same
// Style v1 language (tinted outline, soft fill, rim light). Colours: gold only on EVOLVE, cream on Blessings, brass coin.
import { mk, emblem, EMBLEM_OF, ROLE_COL } from './hudsvg.js';

const P = (doc, d, a) => mk(doc, 'path', { d, ...a });
const OL = (w = 3) => ({ 'stroke-linejoin': 'round', 'stroke-linecap': 'round', 'stroke-width': w });
export const GOLD = '#ffd36b';
export const CREAM = '#e8d9a8';
export const BRASS = '#d8b26a';
export const ROSE = '#f0708a';
export const TEAL = '#6fd3c5';

// Blessing glyphs, -24..24 box. Quiet cream/amber, no gold.
const BLESS = {
  // Wider Glow: a lantern flame with two soft rings of light spreading outward
  wider_glow: (d) => [
    mk(d, 'circle', { r: 20, fill: 'none', stroke: '#ffe0a0', 'stroke-opacity': 0.35, 'stroke-width': 2.4 }),
    mk(d, 'circle', { r: 14, fill: 'none', stroke: '#ffe0a0', 'stroke-opacity': 0.6, 'stroke-width': 2.4 }),
    P(d, 'M0 -9 C-6 -2 -7 5 0 8 C7 5 6 -2 0 -9Z', { fill: '#ffc766', stroke: '#8a4a12', ...OL(2.2) }),
    P(d, 'M0 -2 C-2 1 -2 4 0 5 C2 4 2 1 0 -2Z', { fill: '#fff6c8' })],
  // Wrapped Warmth: a small flame held in a cream scarf
  wrapped_warmth: (d) => [
    P(d, 'M0 -18 C-8 -8 -11 0 -5 6 C-3 8 3 8 5 6 C11 0 8 -8 0 -18Z', { fill: '#ffab3a', stroke: '#9a3a0c', ...OL(2.4) }),
    P(d, 'M0 -7 C-4 -2 -4 3 0 4 C4 3 4 -2 0 -7Z', { fill: '#fff0a0' }),
    P(d, 'M-15 8 C-8 14 8 14 15 8 L15 14 C8 20 -8 20 -15 14Z', { fill: '#f3e6c4', stroke: '#7a5a28', ...OL(2.2) }),
    P(d, 'M-6 17 L-8 24 L-2 22Z', { fill: '#f3e6c4', stroke: '#7a5a28', ...OL(1.8) })],
  // Kindled Spirits: a wisp with a trailing tail and one spark
  kindled_spirits: (d) => [
    P(d, 'M2 -18 C-8 -14 -10 -2 -5 4 C-8 8 -12 14 -18 16 C-8 18 -2 16 2 12 C10 12 14 2 10 -8 C8 -13 5 -16 2 -18Z', { fill: '#dff1fa', stroke: '#27465f', ...OL(2.4) }),
    mk(d, 'circle', { cx: 1, cy: -4, r: 1.9, fill: '#27465f' }), mk(d, 'circle', { cx: 7, cy: -3, r: 1.9, fill: '#27465f' }),
    P(d, 'M-14 -14 L-12 -10 L-8 -12 L-12 -14Z', { fill: '#ffe0a0', stroke: '#8a5a12', ...OL(1.2) })],
  // Kind Fortune: a four-leaf clover on a cream plate (kindness repaid; not a coin, so it never reads as gold)
  kind_fortune: (d) => [
    ...[[-6, -6], [6, -6], [-6, 6], [6, 6]].map(([x, y]) => mk(d, 'circle', { cx: x, cy: y, r: 7.2, fill: '#cfe6a8', stroke: '#47642a', 'stroke-width': 2.2 })),
    mk(d, 'circle', { r: 4, fill: '#e8f6c8' }),
    P(d, 'M1 8 C2 14 4 18 9 21', { fill: 'none', stroke: '#47642a', ...OL(2.6) })],
  // Dawnlit Soles: a boot with a little sunrise behind it
  dawnlit_soles: (d) => [
    P(d, 'M-16 14 A16 16 0 0 1 16 14Z', { fill: '#ffc766', 'fill-opacity': 0.55 }),
    P(d, 'M-7 -17 L3 -17 L3 -4 C8 -2 14 2 16 7 L16 14 L-10 14 L-10 6 L-7 6Z', { fill: '#f3e6c4', stroke: '#6a4a1a', ...OL(2.6) }),
    P(d, 'M-10 14 H16', { stroke: '#8d6c34', ...OL(3.2) }),
    P(d, 'M-7 -9 H3', { stroke: '#d8b26a', ...OL(1.8) })],
};

const FALLBACK = {
  heal: (d) => [P(d, 'M0 17 C-18 4 -17 -12 -8 -14 C-3 -15 0 -11 0 -8 C0 -11 3 -15 8 -14 C17 -12 18 4 0 17Z', { fill: ROSE, stroke: '#7a2540', ...OL(3) }),
    P(d, 'M-9 -8 C-12 -6 -12 -1 -10 1', { fill: 'none', stroke: '#fff', 'stroke-opacity': 0.6, ...OL(2) })],
  gold: (d) => [emblem(d, 'coin', 40)], // brass coin (never evolution gold)
  // Soul shard: a chunky faceted crystal of lantern light (cream-amber, brown tinted outline) with a small flame held inside and a rim glint
  shard: (d) => [
    mk(d, 'circle', { r: 20, fill: '#ffc766', 'fill-opacity': 0.18 }),
    P(d, 'M0 -20 L11 -9 L13 4 L0 20 L-13 4 L-11 -9Z', { fill: '#f6d9a0', stroke: '#7a4a18', ...OL(2.8) }),
    P(d, 'M0 -20 L-11 -9 L-4 -4 L0 -20 L4 -4 L11 -9Z', { fill: '#fff1cf', 'fill-opacity': 0.9, stroke: '#7a4a18', ...OL(1.4) }),
    P(d, 'M-4 -4 L0 20 L4 -4Z M-13 4 L-4 -4 L0 20Z', { fill: '#e9b867', 'fill-opacity': 0.75 }),
    P(d, 'M0 -2 C-4 3 -4 8 0 10 C4 8 4 3 0 -2Z', { fill: '#ffab3a', stroke: '#9a3a0c', ...OL(1.2) }),
    P(d, 'M0 3 C-1.5 5 -1.5 7 0 8 C1.5 7 1.5 5 0 3Z', { fill: '#fff6c8' }),
    P(d, 'M-8 -10 L-10 -3', { fill: 'none', stroke: '#fff', 'stroke-opacity': 0.85, ...OL(1.8) })],
};

const star = (d, x, y, r) => P(d, `M${x} ${y - r} L${x + r * 0.28} ${y - r * 0.28} L${x + r} ${y} L${x + r * 0.28} ${y + r * 0.28} L${x} ${y + r} L${x - r * 0.28} ${y + r * 0.28} L${x - r} ${y} L${x - r * 0.28} ${y - r * 0.28}Z`, { fill: '#fff3c8', stroke: GOLD, 'stroke-width': 1 });

// Which glyph + ring colour a card uses. Pure: also used by tests.
export function iconSpec(card) {
  const k = card && card.kind;
  if (k === 'blessing') return { type: 'blessing', id: card.blessId, ring: CREAM };
  if (k === 'fallback') return { type: 'fallback', id: card.fallback, ring: card.fallback === 'heal' ? ROSE : card.fallback === 'gold' ? BRASS : '#ffc766' };
  const kind = EMBLEM_OF[card && card.weaponId] || 'sanctuary';
  if (k === 'evolution') return { type: 'weapon', id: kind, ring: GOLD, sparkles: true };
  return { type: 'weapon', id: kind, ring: ROLE_COL[kind] || BRASS };
}

// The round icon: dark plate, tinted ring, glyph. `quiet` = thinner ring, no outer glow (Blessings).
export function cardIcon(doc, card) {
  const s = iconSpec(card);
  const g = mk(doc, 'g');
  g.appendChild(mk(doc, 'circle', { r: 52, fill: 'url(#hlPlate)' }));
  g.appendChild(mk(doc, 'circle', { r: 52, fill: 'none', stroke: s.ring, 'stroke-width': s.type === 'blessing' ? 3 : 5 }));
  g.appendChild(mk(doc, 'circle', { r: 45, fill: 'none', stroke: s.ring, 'stroke-opacity': 0.3, 'stroke-width': 1.5 }));
  const inner = mk(doc, 'g');
  if (s.type === 'weapon') inner.appendChild(emblem(doc, s.id, 62));
  else {
    const draw = (s.type === 'blessing' ? BLESS : FALLBACK)[s.id];
    if (draw) for (const n of draw(doc)) inner.appendChild(n);
    else inner.appendChild(emblem(doc, 'sanctuary', 56));
    inner.setAttribute('transform', 'scale(1.55)');
  }
  g.appendChild(inner);
  if (s.sparkles) for (const [x, y, r] of [[-56, -34, 9], [58, -48, 7], [60, 22, 8], [-46, 50, 5]]) g.appendChild(star(doc, x, y, r));
  const svg = mk(doc, 'svg', { viewBox: '-68 -68 136 136', 'aria-hidden': 'true', focusable: 'false' }, [g]);
  return svg;
}
