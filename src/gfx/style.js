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
