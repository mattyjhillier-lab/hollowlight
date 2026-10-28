// A2 TEXT SIZE: the player's text-size choice -> <html data-text> -> the --ts factor (src/ui/a11y.css). Every CSS font size is multiplied by
// --ts at build time (scripts/textscale.mjs), so this is the only runtime piece. Whitelisted value only.
export const TEXT_SCALE = Object.freeze({ normal: 1, large: 1.15, larger: 1.3 });

export function applyTextSize(root, value) {
  const v = Object.hasOwn(TEXT_SCALE, value) ? value : 'normal';
  if (root && root.dataset) { if (v === 'normal') delete root.dataset.text; else root.dataset.text = v; }
  return v;
}

export const TEXT_COPY = Object.freeze({ label: 'Text size', help: 'Bigger words on the HUD, cards, menus, Almanac and tree', opts: [['normal', 'Normal'], ['large', 'Large'], ['larger', 'Larger']] });
