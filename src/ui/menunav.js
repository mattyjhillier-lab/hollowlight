// Persistent menu tab bar: Character, Tree, Goals, Almanac, Settings. Shown over every menu screen (never in a run), always reachable.
// Pure DOM, labels are fixed strings (no untrusted data). The UI class owns navigation (UI.navTo); this only draws and reports taps.
export const NAV_TABS = [
  { id: 'character', label: 'Character' },
  { id: 'tree', label: 'Tree' },
  { id: 'goals', label: 'Goals' },
  { id: 'almanac', label: 'Almanac' },
  { id: 'settings', label: 'Settings' },
];

export function buildMenuNav(doc, onGo) {
  const root = doc.createElement('nav');
  root.className = 'mnav';
  root.setAttribute('aria-label', 'Menu');
  root.style.display = 'none';
  const btns = {};
  for (const t of NAV_TABS) {
    const b = doc.createElement('button');
    b.type = 'button';
    b.className = 'mnav__tab';
    b.textContent = t.label;
    b.dataset.nav = t.id;
    b.addEventListener('click', () => onGo(t.id));
    root.appendChild(b);
    btns[t.id] = b;
  }
  return {
    root,
    set(visible, active) {
      root.style.display = visible ? 'flex' : 'none';
      for (const id of Object.keys(btns)) {
        const on = id === active;
        btns[id].classList.toggle('is-on', on);
        if (on) btns[id].setAttribute('aria-current', 'page'); else btns[id].removeAttribute('aria-current');
      }
    },
  };
}
