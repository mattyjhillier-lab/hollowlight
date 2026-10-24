// EXTRAS v1 Endless Dusk (C1-A 'Stay in the dark'): the dawn choice after the boss falls. Lantern Glass kit; createElement + textContent only.
// Enter = see the dawn (the safe default: results as before); S = stay in the dark (the run continues; the dawn is already earned).
import { el, kitRoot, button } from './kit.js';

export const DARK = {
  kicker: 'Dawn',
  title: 'The dawn is yours.',
  line: 'Will you stay in the dark a little longer? The night returns and keeps growing; your dawn is already kept.',
  rules: 'In the dark: a quarter of the gold (up to half your dawn gold again), no extra shards or Dawnglass. A fall here is never a defeat.',
  dawn: 'See the dawn', stay: 'Stay in the dark',
  toast: 'The night returns. Your dawn is kept.',
  hud: (t) => `Dawn + ${t}`,
  result: (t) => `You held the dark ${t} past dawn.`,
  best: 'longest night',
};

/** opts: { onDawn(), onStay() } -> { root, dawn, stay, onKey(e), focus() } */
export function buildDarkChoice({ onDawn, onStay } = {}) {
  const root = kitRoot();
  root.classList.add('dk-wrap');
  const tid = `dk-t${Math.floor(Math.random() * 1e6)}`;
  const card = el('section', 'dk-card lg-frame', null, { role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': tid });
  const dawn = button({ label: DARK.dawn, hint: 'Enter', variant: 'primary', onClick: () => { if (onDawn) onDawn(); } });
  const stay = button({ label: DARK.stay, hint: 'S', variant: 'secondary', onClick: () => { if (onStay) onStay(); } });
  const acts = el('div', 'dk-acts');
  acts.appendChild(stay); acts.appendChild(dawn);
  for (const n of [el('div', 'dk-k ty-kicker', DARK.kicker), el('h2', 'dk-title', DARK.title, { id: tid }), el('p', 'dk-line', DARK.line), el('p', 'dk-rules', DARK.rules), acts]) card.appendChild(n);
  root.appendChild(card);
  const onKey = (e) => {
    if (e.ctrlKey || e.altKey || e.metaKey) return false;
    const a = globalThis.document && globalThis.document.activeElement;
    const onBtn = !!(a && a.closest && a.closest('.lg-btn'));
    if (e.key === 'Enter' && !onBtn) { e.preventDefault(); dawn.click(); return true; }
    if (e.key === 's' || e.key === 'S') { e.preventDefault(); stay.click(); return true; }
    return false;
  };
  return { root, dawn, stay, onKey, focus: () => dawn.focus() };
}
