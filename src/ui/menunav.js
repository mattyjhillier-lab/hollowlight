// Persistent menu tab row (C1, docs/design/tree-phone-v1.md T1): Home, Character, Tree, Goals, Almanac, Settings as lantern-glass pills with code-drawn glyphs.
// ONE component for phone and desktop (the stylesheet lays it out by the stage's own width). Shown over every menu screen (never in a run).
// Pure DOM, labels and glyph paths are fixed strings (no untrusted data, no innerHTML). The UI class owns navigation (UI.navTo); this only draws and reports taps.
import { keyLabel } from '../input/keymap.js';
export const NAV_TABS = [
  { id: 'home', label: 'Home', iconOnly: true },
  { id: 'character', label: 'Character' },
  { id: 'tree', label: 'Tree' },
  { id: 'goals', label: 'Goals' },
  { id: 'almanac', label: 'Almanac' },
  { id: 'settings', label: 'Settings' },
];

// 24x24 line glyphs (stroke = currentColor). Each entry: [tag, attrs].
export const NAV_GLYPHS = {
  home: [['path', { d: 'M12 2.8v2.2M9.2 7.2 10 5h4l.8 2.2M8.2 7.2h7.6l1 3.2v6.1a2 2 0 0 1-2 2H9.2a2 2 0 0 1-2-2v-6.1z' }], ['circle', { cx: 12, cy: 13.2, r: 2.1, fill: 'currentColor', stroke: 'none' }]],
  character: [['circle', { cx: 12, cy: 8, r: 3.4 }], ['path', { d: 'M5.5 20c.6-4 3.2-6 6.5-6s5.9 2 6.5 6' }]],
  tree: [['path', { d: 'M12 3l2.2 6.8L21 12l-6.8 2.2L12 21l-2.2-6.8L3 12l6.8-2.2z' }]],
  goals: [['circle', { cx: 12, cy: 12, r: 8 }], ['circle', { cx: 12, cy: 12, r: 4.2 }], ['circle', { cx: 12, cy: 12, r: 1.2, fill: 'currentColor', stroke: 'none' }]],
  almanac: [['path', { d: 'M4 5.6C6.5 4.6 9.6 4.6 12 6.1c2.4-1.5 5.5-1.5 8-.5V19c-2.5-1-5.6-1-8 .5-2.4-1.5-5.5-1.5-8-.5z' }], ['path', { d: 'M12 6.1v13.4' }]],
  settings: [['path', { d: 'M12 3.4l1.4 2.2 2.5-.7.7 2.5 2.2 1.4-1.2 2.3 1.2 2.3-2.2 1.4-.7 2.5-2.5-.7-1.4 2.2-1.4-2.2-2.5.7-.7-2.5-2.2-1.4 1.2-2.3-1.2-2.3 2.2-1.4.7-2.5 2.5.7z' }], ['circle', { cx: 12, cy: 12, r: 2.8 }]],
};

const SVG_NS = 'http://www.w3.org/2000/svg';
function glyph(doc, id) {
  const mk = (tag) => (doc.createElementNS ? doc.createElementNS(SVG_NS, tag) : doc.createElement(tag));
  const svg = mk('svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('class', 'mnav__ico');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('focusable', 'false');
  for (const [tag, attrs] of NAV_GLYPHS[id] || []) {
    const n = mk(tag);
    for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, String(v));
    svg.appendChild(n);
  }
  return svg;
}

export function buildMenuNav(doc, onGo) {
  const root = doc.createElement('nav');
  root.className = 'mnav';
  root.setAttribute('aria-label', 'Menu');
  root.style.display = 'none';
  const inner = doc.createElement('div');
  inner.className = 'mnav__in';
  const tabs = doc.createElement('div');
  tabs.className = 'mnav__tabs';
  const slot = doc.createElement('div');
  slot.className = 'mnav__slot';
  slot.setAttribute('aria-label', 'Your purse');
  const btns = {};
  const keyEls = {};
  const order = [];
  for (const t of NAV_TABS) {
    const b = doc.createElement('button');
    b.type = 'button';
    b.className = `mnav__tab${t.iconOnly ? ' mnav__tab--ico' : ''}`;
    b.setAttribute('aria-label', t.label);
    b.setAttribute('title', t.label);
    const pill = doc.createElement('span');
    pill.className = 'mnav__pill';
    pill.appendChild(glyph(doc, t.id));
    if (!t.iconOnly) { const l = doc.createElement('span'); l.className = 'mnav__lbl'; l.textContent = t.label; pill.appendChild(l); }
    b.appendChild(pill);
    const kb = doc.createElement('span'); kb.className = 'mnav__key'; kb.setAttribute('aria-hidden', 'true'); b.appendChild(kb); keyEls[t.id] = kb; // D5: number-key badge (CSS shows it for keyboard users)
    b.dataset.nav = t.id;
    b.addEventListener('click', () => onGo(t.id));
    // roving arrows: Left/Right move focus between tabs (desktop keyboard mirror)
    b.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      const i = order.indexOf(b), n = order[(i + (e.key === 'ArrowRight' ? 1 : order.length - 1)) % order.length];
      if (n && n.focus) { if (e.preventDefault) e.preventDefault(); n.focus(); }
    });
    tabs.appendChild(b);
    btns[t.id] = b;
    order.push(b);
  }
  inner.appendChild(tabs);
  inner.appendChild(slot);
  root.appendChild(inner);
  let purse = null;
  return {
    root, tabs: btns, slot,
    /** Tree screen hands over its gold / shards pills; they live in the row's right slot (strip under the row on narrow screens). */
    setPurse(el) { purse = el || null; slot.replaceChildren(...(purse ? [purse] : [])); },
    /** Returns true when the purse slot is showing (tree / goals with a purse), so the UI can reserve the strip height. */
    set(visible, active, keys = false) {
      root.classList.toggle('has-keys', !!(visible && keys));
      NAV_TABS.forEach((t, i) => { const k = keyLabel(`pick${i + 1}`); const kbEl = keyEls[t.id]; if (kbEl) kbEl.textContent = k; btns[t.id].setAttribute('title', keys && k ? `${t.label} (${k})` : t.label); });
      root.style.display = visible ? 'flex' : 'none';
      for (const id of Object.keys(btns)) {
        const on = id === active;
        btns[id].classList.toggle('is-on', on);
        if (on) btns[id].setAttribute('aria-current', 'page'); else btns[id].removeAttribute('aria-current');
      }
      const showPurse = !!(visible && purse && (active === 'tree' || active === 'goals'));
      root.classList.toggle('has-purse', showPurse);
      if (visible && !(active === 'tree' || active === 'goals') && purse) { purse = null; slot.replaceChildren(); }
      return showPurse;
    },
  };
}
