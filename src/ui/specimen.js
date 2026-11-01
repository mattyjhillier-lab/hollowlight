// Dev type specimen (?specimen=1): proves the real self-hosted fonts, the type scale floors and the Lantern Glass role tokens.
// Static strings only, built with DOM calls (no innerHTML). Never starts the game, the sim or touches the save.
import { applyCssPalette } from '../gfx/palette.js';

const el = (tag, cls, text, attrs) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  if (attrs) for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  return e;
};

const STYLE = `
#specimen { position: fixed; inset: 0; overflow: auto; background: var(--lg-glass-solid); color: var(--lg-text); padding: max(16px, var(--sa-t)) 16px 32px; }
#specimen .wrap { max-width: 1100px; margin: 0 auto; display: grid; gap: 18px; grid-template-columns: repeat(auto-fit, minmax(min(100%, 340px), 1fr)); }
#specimen .head { grid-column: 1 / -1; }
#specimen .pane { position: relative; padding: 16px 18px; background: var(--lg-glass); border: 1px solid var(--lg-hairline); box-shadow: inset 0 0 40px var(--lg-leak); }
#specimen .pane > * + * { margin-top: .5em; }
#specimen .dim { color: var(--lg-text-dim); }
#specimen .rule { height: 1px; background: linear-gradient(90deg, transparent, var(--brass), transparent); margin: .6em 0; }
#specimen .sw { display: flex; flex-wrap: wrap; gap: 8px; }
#specimen .sw span { display: inline-flex; align-items: center; gap: 6px; font: var(--fw-body) var(--fs-small)/1 var(--font-body); }
#specimen .sw i { width: 22px; height: 22px; border: 1px solid var(--lg-hairline); display: inline-block; }
#specimen .wrow { display: flex; flex-wrap: wrap; gap: 14px; align-items: baseline; }
#specimen .sys { font-family: var(--font-ui); font-size: var(--fs-small); color: var(--lg-text-dim); }
`;

export function mountSpecimen(root) {
  applyCssPalette(document.documentElement);
  const st = el('style', null, STYLE);
  document.head.appendChild(st);
  document.title = 'Wispwick type specimen';
  const page = el('div', null, null, { id: 'specimen' });
  const wrap = el('div', 'wrap');
  page.appendChild(wrap);

  const head = el('div', 'head pane');
  head.append(el('div', 'ty-kicker dim', 'Chapter 1 - The Cursed Forest', { 'data-size': '' }),
    el('div', 'ty-wordmark', 'Wispwick', { 'data-size': '' }),
    el('div', 'ty-whisper dim', 'Spirits of the Dusk', { 'data-size': '' }));
  wrap.appendChild(head);

  const a = el('div', 'pane');
  a.append(el('div', 'ty-kicker dim', 'Display: Fondamento (shipped as Hollowlight Chancery)', { 'data-size': '' }),
    el('div', 'ty-title', 'Choose your keeper', { 'data-size': '' }),
    el('div', 'ty-card', 'Ghost Wolves - Lightfoot Pack', { 'data-size': '' }),
    el('div', 'ty-big', '0123456789 12:48 x2.1', { 'data-size': '' }),
    el('div', 'rule'),
    el('div', 'ty-card', 'One weight (400); no faux bold', { 'data-size': '' }));
  const w = el('div', 'wrow');
  for (const n of [400]) w.appendChild(el('span', 'ty-card', 'Lantern ' + n, { 'data-size': '' }));
  a.appendChild(w);
  wrap.appendChild(a);

  const b = el('div', 'pane');
  b.append(el('div', 'ty-kicker dim', 'Body: Alegreya Sans', { 'data-size': '' }),
    el('div', 'ty-label', 'Begin the night', { 'data-size': '' }),
    el('div', 'ty-body', 'Wolves of light hunt the nearest corruption. Each rank sharpens one stat: power, speed, reach or bite.', { 'data-size': '' }),
    el('div', 'ty-small dim', 'Small print: 1,234 gold - 56 shards - level 12 - Esc to pause (12px floor)', { 'data-size': '' }),
    el('div', 'ty-body', 'Tabular numerals: 1111 / 8888 / 0000', { 'data-size': '' }),
    el('div', 'ty-body', 'Latin-1: café naïve über — “quoted” … × · ← →', { 'data-size': '' }));
  wrap.appendChild(b);

  const c = el('div', 'pane');
  c.append(el('div', 'ty-kicker dim', 'Whisper: Fondamento Italic (flavour only)', { 'data-size': '' }),
    el('div', 'ty-whisper', 'Pick a hero and walk the Hollow', { 'data-size': '' }),
    el('div', 'ty-whisper dim', 'The light remembers who carried it.', { 'data-size': '' }),
    el('div', 'rule'),
    el('div', 'sys', 'System fallback (HUD A, unchanged): Palatino / Trebuchet stack', { 'data-size': '' }));
  wrap.appendChild(c);

  const d = el('div', 'pane');
  d.append(el('div', 'ty-kicker dim', 'Lantern Glass roles', { 'data-size': '' }));
  const sw = el('div', 'sw');
  for (const [name, v] of [['plate', '--plate'], ['brass', '--brass'], ['brass-d', '--brass-d'], ['cream', '--cream'], ['thread', '--thread'], ['flame', '--flame'], ['ember', '--lg-ember'], ['wick-dark', '--lg-wick-dark'], ['teal (NEW)', '--teal'], ['evo gold', '--lg-evo'], ['danger', '--lg-danger'], ['frost', '--frost']]) {
    const s = el('span');
    const i = el('i');
    i.style.background = 'var(' + v + ')';
    s.append(i, el('b', null, name, { 'data-size': '' }));
    sw.appendChild(s);
  }
  d.appendChild(sw);
  wrap.appendChild(d);

  root.appendChild(page);
  // data-size marks every proofed text node; the script checks the smallest rendered size.
  for (const n of page.querySelectorAll('[data-size=""]')) n.setAttribute('data-size', '1');
}
