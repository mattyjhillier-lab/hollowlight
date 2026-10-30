// Dev view (?kit=1): every Lantern Glass, Lit kit component in every state. Static strings only, built with the kit helpers (no innerHTML).
// Never starts the game, the sim or touches the save. Forced states use the .is-* mirror classes so hover/focus/pressed show at once.
import '../style.css';
import './kit.css';
import { applyCssPalette } from '../gfx/palette.js';
import { el, kitRoot, panel, button, toggle, tabs, slider, divider, badge, pips, wick, withTooltip, tooltip, card, icon, wordmark } from './kit.js';

const STYLE = `
#kitpage { position: fixed; inset: 0; overflow: auto; color: var(--lg-text); padding: max(16px, var(--sa-t)) 16px 40px;
  background: radial-gradient(ellipse 60% 45% at 18% 8%, rgba(255, 171, 58, .18), transparent 70%), radial-gradient(ellipse 90% 70% at 70% 90%, #1d2433, transparent 75%), linear-gradient(180deg, #232b3c, #161c2a 60%, #0e121b); }
#kitpage .head { max-width: 1180px; margin: 0 auto 30px; display: flex; flex-wrap: wrap; gap: 14px 30px; align-items: center; justify-content: space-between; }
#kitpage .head .lg-wordmark { width: min(100%, 470px); }
#kitpage .head h1 { margin: 0; font: var(--fw-display) var(--fs-title)/1.1 var(--font-display); }
#kitpage .head p { margin: .3em 0 0; font: italic var(--fw-whisper) var(--fs-whisper)/1.3 var(--font-whisper); color: var(--lg-text-dim); max-width: 26em; }
#kitpage .wrap { max-width: 1180px; margin: 0 auto; display: grid; gap: 22px; grid-template-columns: repeat(auto-fit, minmax(min(100%, 340px), 1fr)); align-items: start; }
#kitpage .full { grid-column: 1 / -1; }
#kitpage .row { display: flex; flex-wrap: wrap; gap: 12px; align-items: center; }
#kitpage .col { display: grid; gap: 12px; }
#kitpage .cap { font: var(--fw-body-strong) var(--fs-small)/1.2 var(--font-body); letter-spacing: .08em; text-transform: uppercase; color: var(--lg-text-dim); }
#kitpage .cards { display: grid; gap: 30px 16px; grid-template-columns: repeat(auto-fit, minmax(min(100%, 190px), 1fr)); padding-top: 72px; }
@media (orientation: portrait) { #kitpage .cards { padding-top: 0; } }
#kitpage .ic { display: inline-flex; align-items: center; gap: .45em; min-width: 5.6em; }
#kitpage .tipbox { min-height: 9em; display: flex; align-items: flex-end; }
`;

const cap = (t) => el('div', 'cap', t);
const group = (c, ...kids) => { const d = el('div', 'col'); d.append(cap(c), ...kids); return d; };
const forced = (node, cls) => { node.classList.add(cls); return node; };
const rowOf = (...kids) => { const r = el('div', 'row'); r.append(...kids); return r; };

export function mountKit(root) {
  applyCssPalette(document.documentElement);
  // The game shell stays in index.html; take it out of the tab order and the accessibility tree while this dev view is up.
  const shell = document.getElementById('app');
  if (shell) { shell.setAttribute('inert', ''); shell.setAttribute('aria-hidden', 'true'); }
  document.head.appendChild(el('style', null, STYLE));
  document.title = 'Wispwick UI kit';
  const page = el('div', null, null, { id: 'kitpage' });
  const kit = kitRoot();
  const wrap = el('div', 'wrap');
  kit.appendChild(wrap);
  page.appendChild(kit);

  const head = el('div', 'head');
  const hl = el('div');
  hl.append(el('div', 'cap', 'Kit sheet - U2b'), el('h1', null, 'Lantern Glass, Lit'), el('p', null, 'Chunky lantern windows, tinted outline, rim light, cool glass lit warm.'));
  head.append(hl, wordmark());
  kit.insertBefore(head, wrap);

  wrap.appendChild(panel({
    kicker: 'Panel', title: 'Lantern-lit surface', whisper: 'Pick a hero and walk the Hollow',
    body: [el('p', 'ty-body', 'Cool Hollow glass, lit warm from the lantern cap. Brass band with a dark tinted outline and a bright top edge, hand-wobbled.'),
      divider({ kind: 'hair', text: 'Hairline' }), el('p', 'ty-small', 'Small text stays at 12 px or more.'),
      rowOf(wick({ state: 'lit', label: 'Sanctuary' }), el('span', 'ty-small', 'lit'), wick({ state: 'ember', label: 'Sanctuary' }), el('span', 'ty-small', 'ember'), wick({ state: 'dark', label: 'Sanctuary' }), el('span', 'ty-small', 'dark'))],
  }));

  const btnPanel = panel({ title: 'Buttons', body: [] });
  const body = btnPanel.querySelector('.lg-panel__body');
  for (const v of ['primary', 'secondary', 'quiet', 'danger']) {
    const g = el('div', 'col');
    g.appendChild(cap(v));
    g.appendChild(button({ label: 'Begin the night', whisper: 'Pick a hero and walk the Hollow', hint: 'Enter', variant: v }));
    g.appendChild(rowOf(
      forced(button({ label: 'Hover', variant: v, inline: true }), 'is-hover'),
      forced(button({ label: 'Focus', variant: v, inline: true }), 'is-focus'),
      forced(button({ label: 'Pressed', variant: v, inline: true }), 'is-active'),
      button({ label: 'Disabled', variant: v, inline: true, disabled: true })));
    body.appendChild(g);
  }
  wrap.appendChild(btnPanel);

  wrap.appendChild(panel({ title: 'Toggle, tabs, slider', body: [
    toggle({ label: 'Calm motion', help: 'Less movement and flashing', checked: true }),
    toggle({ label: 'Damage numbers', checked: false }),
    forced(toggle({ label: 'Focused toggle', checked: true }), 'is-focus'),
    toggle({ label: 'Locked option', checked: false, disabled: true }),
    tabs({ label: 'Kit tabs', items: [{ id: 'a', label: 'Spirits' }, { id: 'b', label: 'Gifts' }, { id: 'c', label: 'Locked', disabled: true }], selected: 'a' }),
    slider({ label: 'Music', value: 60 }),
    slider({ label: 'Sounds (locked)', value: 30, disabled: true }),
  ] }));

  const marks = panel({ title: 'Marks', body: [] });
  marks.querySelector('.lg-panel__body').append(
    group('Divider: thread / hairline / labelled', divider(), divider({ kind: 'hair' }), divider({ text: 'Blessings' })),
    group('Badges', rowOf(badge({ kind: 'new' }), badge({ kind: 'evolve' }))),
    group('Pips (knotted)', rowOf(pips({ total: 5, filled: 0 }), pips({ total: 5, filled: 2 }), pips({ total: 5, filled: 5 }), pips({ total: 5, filled: 5, evolve: true }))),
    group('Wick-flame: lit / available / locked', rowOf(wick({ state: 'lit', label: 'Sanctuary' }), wick({ state: 'ember', label: 'Sanctuary' }), wick({ state: 'dark', label: 'Sanctuary' }))));
  wrap.appendChild(marks);

  const icons = panel({ title: 'Icons', body: [] });
  const ir = el('div', 'row');
  for (const n of ['flame', 'ember', 'star', 'bolt', 'shard', 'lock', 'check', 'enter']) { const w = el('span', 'ic'); w.append(icon(n, { label: n }), el('span', 'ty-small', n)); ir.append(w); }
  icons.querySelector('.lg-panel__body').append(group('Painted: tinted outline, fill, rim light', ir));
  wrap.appendChild(icons);

  wrap.appendChild(panel({ kicker: 'Dawn', title: 'Colour returns', variant: 'dawn', whisper: 'Grey far from the light, warm colour near it',
    body: [el('p', 'ty-body', 'Leadlight border for the Dawn / victory panel and evolution cards only. Static: no per-frame work.')] }));

  const tipPanel = panel({ title: 'Tooltip', body: [] });
  const tipData = { name: 'Ghost Wolves', verb: 'Wolves hunt separate foes.', rank: 'Rank 2 of 5 - next: +1 wolf', flavour: 'They remember the pack.' };
  const st = tooltip(tipData); st.classList.add('lg-tip--static'); st.removeAttribute('id');
  const box = el('div', 'tipbox');
  box.appendChild(withTooltip(button({ label: 'Hover, focus or hold', variant: 'secondary', inline: true }), tipData));
  tipPanel.querySelector('.lg-panel__body').append(group('Static', st), group('Opens on hover, keyboard focus or touch long-press', box));
  wrap.appendChild(tipPanel);

  const cp = panel({ kicker: 'Level 7 - choose one gift', title: 'The light stirs', body: [] });
  cp.classList.add('full');
  const cg = el('div', 'cards lg-cardrow');
  cg.append(
    card({ kicker: 'Stat', title: 'Wider orbit', icon: 'star', big: '+12%', line: '50 to 56 reach', pips: { total: 5, filled: 2 }, hint: '1' }),
    card({ kicker: 'Spirit', title: 'Spirit Bolts', icon: 'bolt', big: 'Bolt', line: 'Homing orbs seek the nearest foe.', badge: { kind: 'new' }, hint: '2', pips: { total: 5, filled: 0 } }),
    card({ kicker: 'from Ghost Wolves', title: 'Lightfoot Pack', icon: 'flame', big: 'Trails', line: 'Light that bleeds.', badge: { kind: 'evolve' }, evolve: true, hint: '3', pips: { total: 5, filled: 5, evolve: true } }),
    forced(card({ kicker: 'Stat', title: 'Selected', icon: 'shard', big: '+8%', line: 'Hover or focus lights the border.', selected: true, eyelet: false }), 'is-focus'),
    card({ kicker: 'Locked', title: 'Not yet', icon: 'lock', big: '-', line: 'Someone is still out there.', disabled: true, eyelet: false }));
  cp.querySelector('.lg-panel__body').appendChild(cg);
  wrap.appendChild(cp);

  root.appendChild(page);
}
