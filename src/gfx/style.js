// Visual style switch: ?style=a (smooth vector-glow, default) or ?style=b (modern HD pixel).
// Pure JS. The sim never reads this; it only changes how things are drawn.
export function parseStyle(search) {
  try {
    return new URLSearchParams(search || '').get('style') === 'b' ? 'b' : 'a';
  } catch { return 'a'; }
}

// Render scale: native window size x min(devicePixelRatio, 2). Bad values fall back to 1.
export function parseDpr(v) {
  const n = Number(v);
  if (!(n >= 1)) return 1;
  return Math.min(n, 2);
}

export const STYLE = typeof location !== 'undefined' ? parseStyle(location.search) : 'a';

// texture key -> world units per texel (set by the texture factory, read when sizing images).
export const INV = {};
export const inv = (key) => INV[key] || 1;

// Camera zoom (canvas px per world unit) from the screen's short side (docs/research/15 s3):
// ~300 world units fit on the short side in landscape, 250 in portrait; the long side shows at most 620 units.
export function zoomFor(W, H) {
  if (!(W > 0) || !(H > 0)) return 1;
  const z = Math.min(W, H) / (H >= W ? 250 : 300);
  return Math.max(z, Math.max(W, H) / 620);
}

// Display scale vs the drawn box (hitboxes unchanged) and texel density per displayed world unit.
export const VIS = {
  hero_wren: 1.43, hero_elias: 1.43, wolf: 1.44, wolfU: 1.56, crow: 1.29, root: 1.4, treant: 1.875, piper: 1.4, toad: 1.4,
  raven: 1.33, orb: 1.17, bolt: 1.2, gem: 0.875, heart: 1.1, magnet: 1.1, tree: 1.4,
};
export const DENS = { hero_wren: 5, hero_elias: 5, wolf: 4, wolfU: 4, crow: 4, root: 4, treant: 4, raven: 4, piper: 4, toad: 4 };
