// Pause screen in the Lantern Glass, Lit look (U4): lantern-glass panel over the frozen game, Resume as the big primary, Settings, Quit to menu
// (with a confirm, because quitting loses the run). createElement + textContent only. Summary comes from pauseView(sim, data).
import { el, kitRoot, panel, button, pips } from './kit.js';
import { mk, emblem, EMBLEM_OF } from './hudsvg.js';
import { PAUSE } from './u4copy.js';
import { CX } from './codexcopy.js';

const add = (p, ...kids) => { for (const k of kids) if (k) p.appendChild(k); return p; };

const weaponEmblem = (id) => {
  const doc = globalThis.document;
  return mk(doc, 'svg', { viewBox: '-26 -26 52 52', class: 'u4-emb', 'aria-hidden': 'true', focusable: 'false' }, [emblem(doc, EMBLEM_OF[id] || 'sanctuary', 44)]);
};

/** view: from pauseView(). extras: optional nodes (full screen button, update notice). */
export function buildPause({ view, onResume, onSettings, onQuit, onAlmanac = null, extras = [] } = {}) {
  const root = kitRoot();
  root.classList.add('u4-wrap');
  const v = view || { time: '0:00', level: 1, hero: '', weapons: [], whisper: PAUSE.whispers[0] };
  const sum = el('div', 'u4-sum');
  add(sum, add(el('p', 'u4-sum__line'), el('span', 'u4-sum__time', PAUSE.walked(v.time)), el('span', 'u4-sum__dot', '·', { 'aria-hidden': 'true' }), el('span', 'u4-sum__lvl', PAUSE.level(v.level))));
  if (v.weapons.length) {
    const ul = el('ul', 'u4-weps', null, { 'aria-label': PAUSE.weaponsLabel });
    for (const w of v.weapons) {
      const li = el('li', `u4-wep${w.evo ? ' is-evo' : ''}`);
      add(li, weaponEmblem(w.id), el('span', 'u4-wep__name', w.name), pips({ total: 5, filled: w.pips, evolve: w.evo, label: PAUSE.rank }));
      add(ul, li);
    }
    add(sum, ul);
  }
  const menu = el('nav', 'u4-menu', null, { 'aria-label': PAUSE.title });
  const resume = button({ label: PAUSE.resume.label, hint: PAUSE.resume.hint, variant: 'primary', onClick: () => { if (onResume) onResume(); } });
  const settings = button({ label: PAUSE.settings.label, whisper: PAUSE.settings.whisper, onClick: () => { if (onSettings) onSettings(); } });
  const quit = button({ label: PAUSE.quit.label, whisper: PAUSE.quit.whisper, variant: 'danger', onClick: () => openConfirm() });
  // CX3: the Almanac, read only while the night waits (J)
  const alm = onAlmanac ? button({ label: CX.open, whisper: CX.readOnly, hint: CX.openHint, onClick: () => onAlmanac() }) : null;
  add(menu, resume, settings, alm, quit);
  const confirmBox = el('div', 'u4-confirm', null, { role: 'alertdialog', 'aria-label': PAUSE.confirm.title });
  confirmBox.hidden = true;
  const stay = button({ label: PAUSE.confirm.stay, hint: 'Esc', variant: 'primary', onClick: () => closeConfirm() });
  const leave = button({ label: PAUSE.confirm.leave, variant: 'danger', onClick: () => { if (onQuit) onQuit(); } });
  add(confirmBox, el('h3', 'u4-confirm__h ty-label', PAUSE.confirm.title), el('p', 'u4-confirm__t', PAUSE.confirm.text), add(el('div', 'u4-confirm__row'), stay, leave));
  let confirming = false;
  function openConfirm() { confirming = true; menu.hidden = true; confirmBox.hidden = false; stay.focus(); }
  function closeConfirm() { confirming = false; confirmBox.hidden = true; menu.hidden = false; quit.focus(); }
  const foot = el('div', 'u4-extras');
  for (const x of extras) add(foot, x);
  add(root, panel({ title: PAUSE.title, whisper: v.whisper, body: [sum, add(el('div', 'u4-act'), menu, confirmBox, foot)] }));
  // Up/Down walk the menu like a list; Tab still works.
  const order = [resume, settings, alm, quit].filter(Boolean);
  menu.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    const a = globalThis.document && globalThis.document.activeElement;
    const i = order.indexOf(a);
    if (i < 0) return;
    e.preventDefault();
    order[(i + (e.key === 'ArrowDown' ? 1 : order.length - 1)) % order.length].focus();
  });
  return {
    root, resume, settings, quit, almanac: alm, stay, leave, menu, confirmBox,
    isConfirming: () => confirming, cancelConfirm: () => { if (!confirming) return false; closeConfirm(); return true; },
    focusResume: () => resume.focus(), focusSettings: () => settings.focus(),
  };
}
