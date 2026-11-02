// R2: code-made MEDALLIONS of the Lantern Web (docs/design/skill-tree-rework-v2.md 7, A3 hybrid staged; look: docs/mockups/tree-v3/R2-web-zoomed-*.png).
// A medallion = a lantern-glass coin with a PICTURE (emblem) inside, drawn in the game's recipe: tinted outline (a darker shade of each fill) + soft
// gradient shade with a rim light. Pictures are drawn in code (no image files, no fonts), baked ONCE each into a lazy atlas (max 4 bakes per frame),
// and drawn per frame as one drawImage. The gold rim, progress ring, glow and padlock are cheap arcs drawn per frame by the tree screen.
// SECURITY (E-sec): `medallion` ids that arrive from data are ALLOW-LISTED against MANIFEST below. An unknown / hostile / non-string id falls back to the
// tier emblem; no path, URL or markup is ever built from a tree string, and nothing here touches the DOM (the canvas factory is injected).
export const MANIFEST = Object.freeze({
  // weapon hearts (ids match the emblem ids of the constellations)
  wolf: 1, raven: 1, bolt: 1, chain: 1, orbit: 1,
  // seals, keys, fog
  evolution: 1, veil: 1, key: 1, fog: 1, hero: 1, hub: 1,
  // nights (Twilight / Deep Dusk / Long Night / Dawn) and chapters
  moon_dusk: 1, moon_deep: 1, moon_long: 1, moon_dawn: 1, forest: 1, bell: 1,
  // tools
  almanac: 1, satchel: 1, wardrobe: 1, cardfan: 1, hearthkey: 1, nightgate: 1,
});
export const MEDALLION_IDS = Object.freeze(Object.keys(MANIFEST));
const ALIAS = Object.freeze({ nightgate: 'moon_deep' }); // art shared with another id
export const TIER_EMBLEM = Object.freeze({ landmark: 'key', diamond: 'evolution', dot: 'key' });
const own = (o, k) => Object.hasOwn(o, k);
const HEX = /^#[0-9a-f]{6}$/i;
export const safeTint = (t, fb = '#ffd9a0') => (typeof t === 'string' && HEX.test(t) ? t.toLowerCase() : fb);

/** Allow-listed art id: anything not in the manifest (hostile, wrong type, inherited keys like '__proto__') becomes the fallback. */
export function resolveMedallion(id, fallback = 'key') {
  const fb = typeof fallback === 'string' && own(MANIFEST, fallback) ? fallback : 'key';
  return typeof id === 'string' && id.length <= 24 && own(MANIFEST, id) ? id : fb;
}

/** Which picture a node wears. Pure: kind + effects + masked flag + the region's art id. Never reads a name or an id string of a weapon / chapter. */
export function emblemFor(node, masked, regionArt) {
  const kind = node && typeof node.kind === 'string' ? node.kind : '';
  if (kind === 'teaser') return 'fog';
  if (kind === 'socket') return masked ? 'veil' : 'evolution';
  if (kind === 'heart') return resolveMedallion(regionArt, 'key');
  if (kind === 'gate') {
    const fx = Array.isArray(node.effects) ? node.effects.find((e) => e && e.unlock === 'tier') : null;
    const t = fx && typeof fx.tier === 'string' ? fx.tier : '';
    return t === 'hard' ? 'moon_deep' : t === 'expert' ? 'moon_long' : t === 'dawn' ? 'moon_dawn' : 'moon_dusk';
  }
  if (kind === 'hero' || kind === 'kin') return 'hero';
  if (kind === 'key') return 'key';
  return resolveMedallion(regionArt, TIER_EMBLEM[kind === 'mastery' || kind === 'bead' ? 'diamond' : 'landmark']);
}

// ---------------------------------------------------------------- colour helpers
const rgb = (hex) => { const v = parseInt(hex.slice(1), 16); return [(v >> 16) & 255, (v >> 8) & 255, v & 255]; };
export const mix = (a, b, k) => { const x = rgb(a), y = rgb(b); const h = (i) => Math.round(x[i] + (y[i] - x[i]) * k).toString(16).padStart(2, '0'); return `#${h(0)}${h(1)}${h(2)}`; };
const shade = (hex, k) => mix(hex, '#0a0e1c', k); // darker shade of a fill = its outline (LINE L2)
const light = (hex, k) => mix(hex, '#fff8e6', k);

// ---------------------------------------------------------------- glyphs (unit space: -1..1, scaled by the caller)
// Every glyph gets (g, f, s): g = ctx already translated/scaled, f = fill colour, s = outline colour. Strokes use lineWidth in unit space.
const fillStroke = (g, f, s, lw = 0.07) => { g.fillStyle = f; g.fill(); g.lineWidth = lw; g.strokeStyle = s; g.lineJoin = 'round'; g.stroke(); };
const poly = (g, pts) => { g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); };
const GLYPH = {
  wolf(g, f, s) { // a wolf head: two ears, long face, dark eyes and nose
    g.beginPath(); g.moveTo(-0.72, -0.98); g.lineTo(-0.28, -0.52); g.quadraticCurveTo(0, -0.62, 0.28, -0.52); g.lineTo(0.72, -0.98); g.lineTo(0.8, -0.1);
    g.quadraticCurveTo(0.72, 0.55, 0, 0.98); g.quadraticCurveTo(-0.72, 0.55, -0.8, -0.1); g.closePath(); fillStroke(g, f, s);
    poly(g, [[-0.62, -0.78], [-0.34, -0.5], [-0.66, -0.4]]); g.fillStyle = light(f, 0.55); g.fill(); poly(g, [[0.62, -0.78], [0.34, -0.5], [0.66, -0.4]]); g.fill();
    g.fillStyle = shade(f, 0.8); g.beginPath(); g.ellipse(-0.32, -0.02, 0.12, 0.16, 0.3, 0, 7); g.ellipse(0.32, -0.02, 0.12, 0.16, -0.3, 0, 7); g.fill();
    poly(g, [[-0.14, 0.5], [0.14, 0.5], [0, 0.66]]); g.fill();
  },
  raven(g, f, s) { // spread wings round a glowing eye
    for (const m of [1, -1]) {
      g.save(); g.scale(m, 1); g.beginPath(); g.moveTo(-0.08, -0.3); g.quadraticCurveTo(-0.5, -0.95, -1, -0.58); g.quadraticCurveTo(-0.8, -0.38, -0.96, -0.08);
      g.quadraticCurveTo(-0.62, -0.1, -0.74, 0.3); g.quadraticCurveTo(-0.36, 0.12, -0.08, 0.55); g.closePath(); fillStroke(g, f, s); g.restore();
    }
    g.beginPath(); g.ellipse(0, 0.02, 0.17, 0.34, 0, 0, 7); fillStroke(g, '#fff6e0', s, 0.06);
    g.fillStyle = shade(f, 0.85); g.beginPath(); g.ellipse(0, 0.06, 0.07, 0.16, 0, 0, 7); g.fill();
  },
  bolt(g, f, s) { // an eight-point compass star
    g.beginPath();
    for (let i = 0; i < 16; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 8; const r = i % 2 ? 0.26 : i % 4 === 0 ? 1 : 0.64; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
    g.closePath(); fillStroke(g, f, s); g.beginPath(); g.arc(0, 0, 0.2, 0, 7); g.fillStyle = light(f, 0.75); g.fill();
  },
  chain(g, f, s) { // a forked lightning bolt
    poly(g, [[0.26, -1], [-0.6, 0.12], [-0.08, 0.12], [-0.3, 1], [0.62, -0.2], [0.1, -0.2]]); fillStroke(g, f, s);
    poly(g, [[0.2, -0.7], [-0.3, 0.02], [0.06, 0.02]]); g.fillStyle = light(f, 0.7); g.fill();
  },
  orbit(g, f, s) { // a ring, a core, two circling lights
    g.beginPath(); g.arc(0, 0, 0.74, 0, 7); g.lineWidth = 0.17; g.strokeStyle = f; g.stroke(); g.lineWidth = 0.05; g.strokeStyle = s; g.beginPath(); g.arc(0, 0, 0.83, 0, 7); g.stroke(); g.beginPath(); g.arc(0, 0, 0.65, 0, 7); g.stroke();
    g.beginPath(); g.arc(0, 0, 0.26, 0, 7); fillStroke(g, f, s, 0.06); g.beginPath(); g.arc(0, 0, 0.1, 0, 7); g.fillStyle = light(f, 0.8); g.fill();
    for (const a of [-0.75, 2.4]) { g.beginPath(); g.arc(Math.cos(a) * 0.74, Math.sin(a) * 0.74, 0.15, 0, 7); fillStroke(g, light(f, 0.5), s, 0.05); }
  },
  evolution(g, f, s) { // a faceted diamond: the seal of an evolution
    poly(g, [[0, -1], [0.78, 0], [0, 1], [-0.78, 0]]); fillStroke(g, f, s);
    poly(g, [[0, -0.55], [0.4, 0], [0, 0.55], [-0.4, 0]]); g.fillStyle = light(f, 0.72); g.fill(); g.lineWidth = 0.04; g.strokeStyle = s; g.stroke();
  },
  veil(g, f, s) { // a veiled seal: only a question mark (no name, no cost, no recipe)
    g.lineCap = 'round'; g.lineWidth = 0.2; g.strokeStyle = f; g.beginPath(); g.arc(0, -0.28, 0.36, Math.PI * 1.1, Math.PI * 2.55); g.quadraticCurveTo(0.34, 0.2, 0, 0.38); g.lineTo(0, 0.44); g.stroke();
    g.beginPath(); g.arc(0, 0.8, 0.1, 0, 7); g.fillStyle = f; g.fill(); g.lineCap = 'butt';
  },
  key(g, f, s) { // a keystone: a cut gem
    poly(g, [[-0.5, -0.8], [0.5, -0.8], [0.95, -0.15], [0, 0.95], [-0.95, -0.15]]); fillStroke(g, f, s);
    g.lineWidth = 0.05; g.strokeStyle = shade(f, 0.45); g.beginPath(); g.moveTo(-0.95, -0.15); g.lineTo(0.95, -0.15); g.moveTo(-0.5, -0.8); g.lineTo(-0.3, -0.15); g.lineTo(0, 0.95); g.moveTo(0.5, -0.8); g.lineTo(0.3, -0.15); g.lineTo(0, 0.95); g.stroke();
    poly(g, [[-0.4, -0.7], [-0.15, -0.7], [-0.3, -0.25]]); g.fillStyle = light(f, 0.8); g.fill();
  },
  fog(g, f, s) { crescent(g, f, s, false); },
  hero(g, f, s) { // head and shoulders
    g.beginPath(); g.arc(0, -0.38, 0.4, 0, 7); fillStroke(g, f, s);
    g.beginPath(); g.moveTo(-0.85, 0.95); g.quadraticCurveTo(-0.85, 0.12, 0, 0.1); g.quadraticCurveTo(0.85, 0.12, 0.85, 0.95); g.closePath(); fillStroke(g, f, s);
  },
  hub(g, f, s) { // the hearth lantern: a hook, a cap, a glass body with a flame
    g.lineWidth = 0.07; g.strokeStyle = s; g.beginPath(); g.arc(0, -0.86, 0.2, Math.PI, 0); g.stroke();
    poly(g, [[-0.3, -0.62], [0.3, -0.62], [0.42, -0.42], [-0.42, -0.42]]); fillStroke(g, shade(f, 0.15), s);
    g.beginPath(); g.moveTo(-0.42, -0.42); g.lineTo(0.42, -0.42); g.lineTo(0.5, 0.52); g.lineTo(-0.5, 0.52); g.closePath(); fillStroke(g, mix(f, '#7a4a14', 0.1), s);
    poly(g, [[-0.62, 0.52], [0.62, 0.52], [0.5, 0.72], [-0.5, 0.72]]); fillStroke(g, shade(f, 0.15), s);
    g.beginPath(); g.moveTo(0, -0.28); g.quadraticCurveTo(0.34, 0.06, 0.2, 0.34); g.quadraticCurveTo(0, 0.5, -0.2, 0.34); g.quadraticCurveTo(-0.34, 0.06, 0, -0.28); g.fillStyle = '#fff3c8'; g.fill();
    g.beginPath(); g.ellipse(0, 0.22, 0.08, 0.14, 0, 0, 7); g.fillStyle = '#ffb347'; g.fill();
  },
  moon_dusk(g, f, s) { crescent(g, f, s, false); },
  moon_deep(g, f, s) { crescent(g, f, s, true); },
  moon_long(g, f, s) { // a full moon with craters
    g.beginPath(); g.arc(0, 0, 0.9, 0, 7); fillStroke(g, f, s);
    g.fillStyle = shade(f, 0.22); for (const [x, y, r] of [[-0.3, -0.25, 0.2], [0.3, 0.1, 0.26], [-0.15, 0.42, 0.14], [0.35, -0.42, 0.1]]) { g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); }
  },
  moon_dawn(g, f, s) { // a low sun between rays
    g.lineCap = 'round'; g.lineWidth = 0.12; g.strokeStyle = f; for (let i = 0; i < 8; i++) { const a = (i * Math.PI) / 4; g.beginPath(); g.moveTo(Math.cos(a) * 0.68, Math.sin(a) * 0.68); g.lineTo(Math.cos(a) * 0.96, Math.sin(a) * 0.96); g.stroke(); }
    g.lineCap = 'butt'; g.beginPath(); g.arc(0, 0, 0.5, 0, 7); fillStroke(g, f, s);
  },
  forest(g, f, s) { // a pine
    for (const [y, w] of [[-0.9, 0.5], [-0.5, 0.7], [-0.05, 0.9]]) { poly(g, [[0, y], [w, y + 0.75], [-w, y + 0.75]]); fillStroke(g, f, s, 0.06); }
    g.fillStyle = shade(f, 0.55); g.fillRect(-0.12, 0.7, 0.24, 0.3);
  },
  bell(g, f, s) { // a hushbell
    g.beginPath(); g.moveTo(-0.85, 0.62); g.quadraticCurveTo(-0.62, 0.55, -0.55, 0.15); g.quadraticCurveTo(-0.5, -0.78, 0, -0.78); g.quadraticCurveTo(0.5, -0.78, 0.55, 0.15); g.quadraticCurveTo(0.62, 0.55, 0.85, 0.62); g.closePath(); fillStroke(g, f, s);
    g.beginPath(); g.arc(0, 0.82, 0.16, 0, 7); fillStroke(g, light(f, 0.3), s, 0.05); g.beginPath(); g.arc(0, -0.9, 0.1, 0, 7); g.fillStyle = s; g.fill();
  },
  almanac(g, f, s) { // an open book
    g.beginPath(); g.moveTo(0, -0.55); g.quadraticCurveTo(-0.45, -0.8, -0.95, -0.6); g.lineTo(-0.95, 0.65); g.quadraticCurveTo(-0.45, 0.45, 0, 0.78); g.closePath(); fillStroke(g, f, s);
    g.beginPath(); g.moveTo(0, -0.55); g.quadraticCurveTo(0.45, -0.8, 0.95, -0.6); g.lineTo(0.95, 0.65); g.quadraticCurveTo(0.45, 0.45, 0, 0.78); g.closePath(); fillStroke(g, light(f, 0.3), s);
    g.lineWidth = 0.05; g.strokeStyle = shade(f, 0.5); for (const y of [-0.25, 0, 0.25]) { g.beginPath(); g.moveTo(-0.7, y - 0.05); g.lineTo(-0.2, y + 0.04); g.moveTo(0.2, y + 0.04); g.lineTo(0.7, y - 0.05); g.stroke(); }
  },
  satchel(g, f, s) { // a satchel with a flap and a strap
    g.lineWidth = 0.1; g.strokeStyle = shade(f, 0.2); g.beginPath(); g.arc(0, -0.2, 0.5, Math.PI, 0); g.stroke();
    g.beginPath(); g.moveTo(-0.8, -0.35); g.lineTo(0.8, -0.35); g.lineTo(0.9, 0.85); g.lineTo(-0.9, 0.85); g.closePath(); fillStroke(g, f, s);
    g.beginPath(); g.moveTo(-0.8, -0.35); g.lineTo(0.8, -0.35); g.lineTo(0.7, 0.15); g.quadraticCurveTo(0, 0.5, -0.7, 0.15); g.closePath(); fillStroke(g, light(f, 0.25), s);
    g.beginPath(); g.arc(0, 0.25, 0.1, 0, 7); g.fillStyle = s; g.fill();
  },
  wardrobe(g, f, s) { // a coat hanger
    g.lineCap = 'round'; g.lineWidth = 0.1; g.strokeStyle = f; g.beginPath(); g.moveTo(0, -0.2); g.lineTo(0, -0.42); g.arc(0, -0.62, 0.2, Math.PI / 2, Math.PI * 2.4); g.stroke();
    poly(g, [[0, -0.2], [0.95, 0.62], [-0.95, 0.62]]); g.lineWidth = 0.14; g.strokeStyle = f; g.stroke(); g.lineWidth = 0.04; g.strokeStyle = s; g.stroke(); g.lineCap = 'butt';
  },
  cardfan(g, f, s) { // three fanned cards
    for (const a of [-0.45, 0, 0.45]) { g.save(); g.translate(0, 0.75); g.rotate(a); g.beginPath(); g.roundRect(-0.38, -1.55, 0.76, 1.25, 0.1); fillStroke(g, a ? light(f, a < 0 ? 0.05 : 0.25) : f, s, 0.05); g.restore(); }
    g.save(); g.beginPath(); g.arc(0, -0.45, 0.14, 0, 7); g.fillStyle = shade(f, 0.45); g.fill(); g.restore();
  },
  hearthkey(g, f, s) { // a key
    g.beginPath(); g.arc(-0.5, -0.4, 0.4, 0, 7); g.arc(-0.5, -0.4, 0.17, 0, 7, true); g.fillStyle = f; g.fill('evenodd'); g.lineWidth = 0.06; g.strokeStyle = s; g.stroke();
    g.beginPath(); g.moveTo(-0.25, -0.15); g.lineTo(0.8, 0.9); g.lineWidth = 0.2; g.lineCap = 'round'; g.strokeStyle = f; g.stroke(); g.lineWidth = 0.06; g.strokeStyle = s; g.stroke(); g.lineCap = 'butt';
    for (const [x, y] of [[0.3, 0.35], [0.55, 0.6]]) { poly(g, [[x, y], [x + 0.28, y - 0.28], [x + 0.4, y - 0.16], [x + 0.16, y + 0.1]]); fillStroke(g, f, s, 0.05); }
  },
};
GLYPH.nightgate = GLYPH.moon_deep;
function crescent(g, f, s, star) {
  g.save(); g.beginPath(); g.arc(0, 0, 0.9, 0, 7); g.clip();
  g.beginPath(); g.rect(-2, -2, 4, 4); g.arc(0.34, -0.2, 0.7, 0, 7); g.fillStyle = f; g.fill('evenodd'); g.restore();
  g.beginPath(); g.arc(0, 0, 0.9, 0, 7); g.lineWidth = 0.05; g.strokeStyle = s; g.stroke();
  if (star) { g.beginPath(); for (let i = 0; i < 8; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 4; const r = i % 2 ? 0.07 : 0.2; g.lineTo(0.5 + Math.cos(a) * r * 1.5, -0.05 + Math.sin(a) * r * 1.5); } g.closePath(); g.fillStyle = light(f, 0.7); g.fill(); }
}

// ---------------------------------------------------------------- one baked coin face (the picture inside the rim)
export const COIN_PX = 160; // atlas sprite size; drawn scaled (the biggest on-screen coin is ~130 px)
export const VARIANTS = Object.freeze(['lit', 'open', 'dim']);

/** Draws the coin face + picture of `id` into a canvas context of size COIN_PX. Pure drawing, no state. */
export function drawCoinFace(g, id, tint, variant) {
  const S = COIN_PX, c = S / 2, R = c - 3;
  const art = own(ALIAS, id) ? ALIAS[id] : id;
  const t = safeTint(tint);
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.clearRect(0, 0, S, S);
  const lit = variant === 'lit', dim = variant === 'dim';
  const fg = g.createRadialGradient(c - R * 0.3, c - R * 0.4, 0, c, c, R);
  fg.addColorStop(0, dim ? '#2c3558' : lit ? mix('#3b4a86', t, 0.22) : '#34406e'); fg.addColorStop(1, dim ? '#151a30' : lit ? mix('#171c3a', t, 0.14) : '#1a2040');
  g.beginPath(); g.arc(c, c, R, 0, 7); g.fillStyle = fg; g.fill();
  const hi = g.createRadialGradient(c, c + R * 0.9, 0, c, c, R); // rim light from below: the glass glows where the lantern light enters
  hi.addColorStop(0.55, 'rgba(255,230,170,0)'); hi.addColorStop(1, `rgba(255,214,140,${lit ? 0.26 : 0.1})`);
  g.fillStyle = hi; g.beginPath(); g.arc(c, c, R, 0, 7); g.fill();
  g.save(); g.translate(c, c + (art === 'veil' ? 0 : 1)); g.scale(R * 0.58, R * 0.58);
  const body = dim ? mix(t, '#8d96b6', 0.55) : t;
  const f = art === 'veil' ? '#8e97b8' : dim ? body : lit ? t : mix(t, '#9aa3c4', 0.12);
  const gl = own(GLYPH, art) ? GLYPH[art] : GLYPH.key;
  g.globalAlpha = dim ? 0.82 : 1;
  gl(g, f, shade(f, 0.62));
  g.restore();
}

/** The lazy atlas: key = art|tint|variant. At most `perFrame` bakes per frame; get() returns null when over budget (caller draws a plain coin and
 *  repaints next frame). Bounded size, so hostile or odd input cannot grow it. `make(w, h)` returns a canvas-like object. */
export class MedallionAtlas {
  constructor(make, perFrame = 4, cap = 160) {
    this.make = make; this.perFrame = perFrame; this.cap = cap;
    this.map = new Map(); this.bakes = 0; this.frameBakes = 0; this.pending = false;
  }
  beginFrame() { this.frameBakes = 0; this.pending = false; }
  keyOf(id, tint, variant) { return `${resolveMedallion(id)}|${safeTint(tint)}|${VARIANTS.includes(variant) ? variant : 'open'}`; }
  get(id, tint, variant) {
    const key = this.keyOf(id, tint, variant);
    const hit = this.map.get(key);
    if (hit) return hit;
    if (this.map.size >= this.cap) return null;
    if (this.frameBakes >= this.perFrame) { this.pending = true; return null; }
    this.frameBakes++; this.bakes++;
    const [a, t, v] = key.split('|');
    const cv = this.make(COIN_PX, COIN_PX);
    const g = cv && cv.getContext ? cv.getContext('2d') : null;
    if (g) drawCoinFace(g, a, t, v);
    this.map.set(key, cv);
    return cv;
  }
  get size() { return this.map.size; }
}
