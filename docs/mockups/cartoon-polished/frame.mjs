// Page frame: 1280x720 SVG, shared defs, big top-left direction banner + swatches (as in earlier rounds).
import { defs, T, FONT } from './core.mjs';
import { wolfMask } from './creatures.mjs';

export function banner(K, sub) {
  const sw = K.sw.map(([c, n], i) => `<circle cx="${1048 + i * 46}" cy="22" r="11" fill="${c}" stroke="#fff" stroke-opacity=".7" stroke-width="1.6"/>${T(c, 1048 + i * 46, 50, { s: 8.5, a: 'middle', c: '#cfd6e0', f: FONT.mono, w: 400 })}`).join('');
  return `<g><rect width="1280" height="62" fill="#07090d" opacity=".94"/><rect y="62" width="1280" height="2" fill="${K.edge}" opacity=".8"/>
${T(`DIRECTION ${K.id}: ${K.name}`, 14, 28, { s: 26, f: FONT.title, w: 900, c: '#fff', ls: 0.5 })}
${T(sub, 14, 45, { s: 12.5, c: K.edge, f: FONT.ui, w: 600 })}
${T(`${K.id} = W world+creatures · C colour · I icons · U UI plates · F type (Georgia titles, Segoe UI Black numerals) · L glow language  |  swatches:`, 14, 58, { s: 10.5, c: '#aab4c2', w: 400 })}
${sw}</g>`;
}

export function page(K, sub, body, extraDefs = '') {
  return `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;background:#000}svg{display:block}</style></head><body>
<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="720" viewBox="0 0 1280 720">${defs(K)}<defs>${wolfMask}${extraDefs}</defs>
${body}
${banner(K, sub)}
</svg></body></html>`;
}
