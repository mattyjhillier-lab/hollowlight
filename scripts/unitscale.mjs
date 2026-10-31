// DESKTOP D1 UI SCALE: build-time CSS pass (used by vite.config.js in dev and build). The UI layer (#ui) is zoomed by --uik (src/ui/desktop.css); a viewport unit written
// inside it (12vh, 40vw) would still measure the real window and then be zoomed again, so every vh / vw in the game's own CSS declarations becomes
// calc(N * var(--vh1)) / calc(N * var(--vw1)), where --vh1 = 1vh / --uik. At --uik 1 (phones, small windows, Menu size = Normal) the value is identical to before.
// Not touched: media / container / supports conditions (they must stay real window / container measures), and any line marked "keep-vw" (a value already divided by hand).
// Pure string -> string, no deps; tested in tests/unitscale.test.mjs.
const UNIT = /(^|[^\w.-])(-?(?:\d+\.?\d*|\.\d+))(vh|vw)\b/g;
const KEEP = 'keep-vw';

export function scaleViewportCss(css) {
  if (typeof css !== 'string') return css;
  const held = [];
  // hold at-rule conditions out of the way (@media (min-height: 40vh) must stay a real viewport query)
  let out = css.replace(/@(?:media|container|supports|import|layer)\b[^{;]*/g, (m) => { held.push(m); return `\u0000${held.length - 1}\u0000`; });
  out = out.split('\n').map((line) => (line.includes(KEEP) ? line : line.replace(UNIT, (_, pre, n, u) => `${pre}calc(${n} * var(--${u}1))`))).join('\n');
  return out.replace(/\u0000(\d+)\u0000/g, (_, i) => held[Number(i)]);
}

/** Vite plugin: applies the pass to the game's own CSS (src/**.css) before Vite's CSS handling, in dev and build. */
export function unitScalePlugin() {
  return {
    name: 'ui-unit-scale',
    enforce: 'pre',
    transform(code, id) {
      const path = id.split('?')[0].replace(/\\/g, '/');
      if (!/\/src\/.*\.css$/.test(path)) return null;
      return { code: scaleViewportCss(code), map: null };
    },
  };
}
