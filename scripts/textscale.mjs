// A2 TEXT SIZE: build-time CSS pass (used by vite.config.js in dev and build). Every font size written in the game's CSS is multiplied by
// the player's text-size factor --ts (1 / 1.15 / 1.3, set on <html data-text>, src/ui/textsize.js), so Settings > Picture > Text size
// scales the HUD, cards, menus, Almanac and tree panels without touching each screen's source CSS.
// Rules: font-size and the size inside the font shorthand. Relative sizes (em, %, keywords, inherit) are left alone: they follow the
// parent, which is already scaled. Pure string -> string, no deps; tested in tests/textsize.test.mjs.

const LEN = String.raw`\d*\.?\d+(?:px|rem|vw|vh|vmin|vmax|cqw|cqh|cqi|cqb|cqmin|cqmax)`;
const FN = String.raw`(?:clamp|max|min|calc)\((?:[^()]|\((?:[^()]|\([^()]*\))*\))*\)`;
const SIZE = new RegExp(String.raw`(^|\s)(var\(--fs-[a-z0-9-]+\)|${FN}|${LEN})(?=\s*\/|\s)`);
const WRAP = (v) => `calc(${v} * var(--ts, 1))`;
const scaled = (v) => /var\(--ts\b/.test(v);

// font-size: value -> scaled when it is an absolute length / function / size token
function scaleSize(value) {
  const m = value.match(/^\s*(.*?)(\s*!important)?\s*$/s);
  const v = m[1];
  if (!v || scaled(v) || /^(inherit|initial|unset|revert|smaller|larger|xx?-small|small|medium|large|xx?x?-large)$/i.test(v)) return value;
  if (/^-?\d*\.?\d+(em|%|ex|ch)$/.test(v)) return value;
  if (!new RegExp(`^(?:var\\(--fs-[a-z0-9-]+\\)|${FN}|${LEN})$`).test(v)) return value;
  return ` ${WRAP(v)}${m[2] || ''}`;
}

// font: shorthand -> scale the first size token (the one before /line-height or before the family)
function scaleShorthand(value) {
  if (scaled(value) || /^\s*var\(--[a-z0-9-]+\)\s*$/.test(value) || /^\s*(inherit|initial|unset|revert)\s*$/.test(value)) return value;
  return value.replace(SIZE, (_, pre, v) => `${pre}${WRAP(v)}`);
}

export function scaleFontsCss(css) {
  if (typeof css !== 'string') return css;
  return css
    .replace(/(font-size\s*:)([^;}]*)/g, (_, k, v) => k + scaleSize(v))
    .replace(/((?:^|[\s;{])font\s*:)([^;}]*)/g, (_, k, v) => k + scaleShorthand(v));
}

/** Vite plugin: applies the pass to the game's own CSS (src/**.css) before Vite's CSS handling, in dev and build. */
export function textScalePlugin() {
  return {
    name: 'a11y-text-scale',
    enforce: 'pre',
    transform(code, id) {
      const path = id.split('?')[0].replace(/\\/g, '/');
      if (!/\/src\/.*\.css$/.test(path)) return null;
      return { code: scaleFontsCss(code), map: null };
    },
  };
}
