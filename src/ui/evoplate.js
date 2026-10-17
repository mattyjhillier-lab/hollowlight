// E9: the evolution pick plate. A small kit-style name plate (kicker, evolution name, codex whisper, and on the FIRST ever take the recipe)
// shown for a moment after an evolution is picked. DOM via createElement/textContent only (kit.el), one pooled element, never blocks input
// (pointer-events none), announced politely to screen readers. Pure model helper below is unit-tested in Node.
import { el } from './kit.js';
import { clampText } from './cardview.js';

export const PLATE_CLAMP = { kicker: 14, name: 28, codex: 90, recipe: 44 };
export const PLATE_MS = 3200;
export const KICKER = 'Evolved';

/** Safe plate text for an evolution id. Returns null for an unknown id. `first` = never taken before (reveals the recipe, once). */
export function plateModel(evoId, data, first = false) {
  const evos = data && data.evolutions;
  const evo = evos && typeof evoId === 'string' && Object.hasOwn(evos, evoId) ? evos[evoId] : null;
  if (!evo || typeof evo !== 'object') return null;
  let recipe = '';
  if (first && Array.isArray(evo.pair)) {
    const stats = data.weapons && data.weapons[evo.weapon] && data.weapons[evo.weapon].stats;
    const names = evo.pair.map((k) => (stats && stats[k] && stats[k].name) || '').filter(Boolean);
    if (names.length === 2) recipe = clampText(`Recipe: ${names[0]} + ${names[1]}`, PLATE_CLAMP.recipe);
  }
  return {
    kicker: KICKER,
    name: clampText(evo.name, PLATE_CLAMP.name),
    codex: clampText(evo.codex, PLATE_CLAMP.codex),
    recipe,
    cue: typeof evo.cue === 'string' && /^evo_[a-z0-9_]{1,40}$/.test(evo.cue) ? evo.cue : '',
  };
}

export class EvoPlate {
  constructor(host) {
    this.timer = null;
    this.root = el('div', 'lg-kit u9-plate', null, { role: 'status', 'aria-live': 'polite', 'aria-atomic': 'true' });
    this.kicker = el('div', 'u9-plate__kicker ty-kicker');
    this.title = el('div', 'u9-plate__title ty-title');
    this.whisper = el('div', 'u9-plate__whisper ty-whisper');
    this.recipe = el('div', 'u9-plate__recipe ty-small');
    this.root.append(this.kicker, this.title, this.whisper, this.recipe);
    host.appendChild(this.root);
  }

  /** model from plateModel (null is ignored). calm = Calm motion: static, fade only. */
  show(model, calm = false) {
    if (!model) return;
    clearTimeout(this.timer);
    this.kicker.textContent = model.kicker;
    this.title.textContent = model.name;
    this.whisper.textContent = model.codex;
    this.recipe.textContent = model.recipe;
    this.recipe.hidden = !model.recipe;
    this.whisper.hidden = !model.codex;
    this.root.classList.toggle('lg-calm', !!calm);
    this.root.classList.add('on');
    this.timer = setTimeout(() => this.hide(), PLATE_MS);
  }

  hide() {
    clearTimeout(this.timer);
    this.root.classList.remove('on');
    // keep the text until the fade finishes, then clear so nothing stale is left for screen readers
    this.timer = setTimeout(() => {
      this.kicker.textContent = ''; this.title.textContent = ''; this.whisper.textContent = ''; this.recipe.textContent = '';
    }, 400);
  }
}
