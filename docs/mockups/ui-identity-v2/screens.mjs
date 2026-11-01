// Shared screen markup for the three takes. Each take supplies O (ornaments) + CSS; structure and copy are identical
// so the takes compare like for like. Copy follows the v1 voice guide (plain label + whisper).
import { icon, lantern, wordmark, portrait } from './lib.mjs';

export function components(O) {
  const pips = (on, of) => `<span class="pips" aria-label="rank ${on} of ${of}">${Array.from({ length: of }, (_, i) => O.pip(i < on)).join('')}</span>`;
  const panel = (inner, cls = '', top = true) => `<section class="panel ${cls}"><i class="frame"></i>${top ? O.panelTop() : ''}<div class="pin">${inner}</div></section>`;
  const btn = ({ label, whisper = '', key = '', kind = 'secondary', cls = '' }) =>
    `<button class="btn ${kind} ${cls}"><i class="frame"></i>${O.btnMark(kind)}<span class="bt"><span class="lbl">${label}</span>${whisper ? `<span class="wh">${whisper}</span>` : ''}</span>${key ? `<kbd>${key}</kbd>` : ''}</button>`;
  const card = (c) => `<article class="card ${c.kind}${c.stirs ? ' stirs' : ''}"><i class="frame"></i>${O.cardTop(c.kind)}${c.kind === 'evo' ? O.badgeEvo() : ''}${c.kind === 'new' ? O.badgeNew() : ''}<kbd class="ck">${c.key}</kbd>
<div class="medal">${icon(c.icon, 46)}</div><div class="cbody"><div class="ctype">${c.type}</div><h3 class="nm">${c.name}</h3><div class="big">${c.big}</div><div class="unit">${c.unit}</div>${pips(c.pips[0], c.pips[1])}<p class="desc">${c.desc}</p>${c.stirs ? '<p class="stir">Something stirs...</p>' : ''}${c.from ? `<p class="from">${c.from}</p>` : ''}</div></article>`;
  const bless = (b) => `<button class="bless"><i class="frame"></i>${icon(b.icon, 30)}<span class="bt"><span class="bn">${b.name}</span><span class="bl">${b.line}</span></span><kbd>${b.key}</kbd></button>`;
  const pill = (l, n, k) => `<button class="pill"><i class="frame"></i><kbd>${k}</kbd><span class="pt">${l} <b>x${n}</b></span></button>`;
  return { pips, panel, btn, card, bless, pill, divider: () => O.divider() };
}

const LEVEL_CARDS = [
  { kind: 'evo', key: '1', icon: 'wolf', type: 'Evolution', name: 'Pouncing Pack', big: 'Leap', unit: 'pin and maul', pips: [5, 5], desc: 'Wolves spring onto a foe, pin it flat, then maul it.', from: 'from Ghost Wolves' },
  { kind: 'up', key: '2', icon: 'orbit', type: 'Holy Orbit', name: 'Wider Orbit', big: '+12%', unit: '50 to 56 reach', pips: [3, 5], desc: 'The flames circle further out.', stirs: true },
  { kind: 'new', key: '3', icon: 'bolt', type: 'New spirit', name: 'Spirit Bolts', big: '1', unit: 'bolt at a time', pips: [0, 5], desc: 'Homing sparks seek out the nearest foe.' },
];

export function screens(O) {
  const K = components(O);
  const bg = (cls = '') => `<div class="bg ${cls}"></div><div class="veil ${cls}"></div>`;
  return {
    title: () => `${bg('soft')}<div class="lay-title"><div class="brand"><div class="kick">Chapter 1 · The Cursed Forest</div>${wordmark(O.take)}<div class="tag">Spirits of the Dusk</div></div>
<nav class="menu">${K.btn({ label: 'Begin the night', whisper: 'Pick a hero and walk the Hollow', key: 'Enter', kind: 'primary' })}${K.btn({ label: 'The Thread', whisper: 'Spend what you carried home', key: 'T' })}${K.btn({ label: 'Lantern settings', whisper: 'Sound, motion, saves', key: 'S' })}</nav>
<footer class="foot"><span>v0.4.0</span><a>Install for full screen</a></footer></div>`,

    hero: () => {
      const hc = (h, sel) => `<article class="hcard ${sel ? 'sel' : ''}"><i class="frame"></i>${O.cardTop(sel ? 'evo' : 'up')}<div class="hwrap">${portrait(h.id)}<div class="hinfo"><div class="wickst">${O.wick(sel ? 'lit' : 'ember')}<span>${sel ? 'Chosen' : 'Ready'}</span></div><h3 class="nm">${h.name}</h3><div class="ep">${h.ep}</div><p class="desc">${h.line}</p>
<div class="stat"><span>Heart</span>${K.pips(h.heart, 5)}</div><div class="stat"><span>Stride</span>${K.pips(h.stride, 5)}</div>
<div class="kit"><span>${icon(h.icon, 26)}${h.spirit}</span><span>${icon('flame', 26)}${h.ability}</span></div><p class="gift">${h.gift}</p></div></div></article>`;
      return `${bg()}<div class="lay-hero"><header class="sh"><div class="kick">Night 1 · Cursed Forest</div><h1 class="h1">Who carries the lantern?</h1>${K.divider()}</header>
<div class="heroes">${hc({ id: 'wren', name: 'Wren', ep: 'the Pelt Walker', line: 'Quick on her feet, with a pack at her heels.', heart: 2, stride: 5, icon: 'wolf', spirit: 'Ghost Wolves', ability: 'Pack Howl', gift: 'Light-footed: +10% move speed' }, true)}
${hc({ id: 'elias', name: 'Elias', ep: 'the Lamplighter', line: 'Slow to move, and very hard to put out.', heart: 5, stride: 2, icon: 'orbit', spirit: 'Holy Orbit', ability: 'Candle Wheel', gift: 'Blessed flame: +15% holy damage' }, false)}</div>
<div class="bar">${K.btn({ label: 'Back', key: 'Esc', kind: 'quiet' })}${K.btn({ label: 'Walk with Wren', key: 'Enter', kind: 'primary' })}</div></div>`;
    },

    levelup: () => `${bg('dim')}<div class="lay-lvl"><header class="sh"><h1 class="h1">The light stirs</h1><div class="sub">Level 7 · choose one gift</div></header>
<div class="cards">${LEVEL_CARDS.map(K.card).join('')}</div>
<div class="blessrow"><div class="bhead">${O.divider('Blessings', 'quiet gifts')}</div><div class="bls">${K.bless({ icon: 'boots', name: 'Dawnlit Soles', line: '+2% move speed · 1/2', key: '4' })}${K.bless({ icon: 'heart', name: 'Wrapped Warmth', line: '+4% max HP · 2/3', key: '5' })}</div></div>
<div class="pills">${K.pill('Reroll', 2, 'R')}${K.pill('Banish', 1, 'B')}</div></div>`,

    pause: () => `${bg('dim')}<div class="lay-pause">${K.panel(`<div class="kick">The night waits</div><h1 class="h1">Paused</h1><p class="lead">The lantern holds its breath. Take your time.</p>${K.divider()}
<div class="runline"><span class="rl-t"><b>7:42</b> walked</span><span class="rl-w">${icon('wolf', 28)}${K.pips(3, 5)}</span><span class="rl-w">${icon('orbit', 28)}${K.pips(2, 5)}</span><span class="rl-l">Level <b>9</b></span></div>
<div class="pbtns">${K.btn({ label: 'Keep walking', key: 'Esc', kind: 'primary' })}${K.btn({ label: 'Lantern settings', whisper: 'Sound, motion, saves', key: 'S' })}${K.btn({ label: 'Leave the night', whisper: 'Back to the title; this run is lost', key: 'Q', kind: 'danger' })}</div>`, 'pp')}</div>`,

    results: () => `${bg('dim')}<div class="lay-res"><div class="rleft">${lantern(110, 0.32, O.take === 't3' ? 'felt' : 'brass')}<div class="rtx"><div class="kick">Night 1 · Cursed Forest · Wren</div><h1 class="h1 rt">The light dwindles</h1><p class="lead">The night is long. The lantern still burns, a little. Rest, then walk again.</p></div></div>
${K.panel(`<div class="rtime"><b>7:42</b><span>time walked</span></div><div class="rnear"><b>7:18</b> short of dawn · best <b>11:20</b></div>
<div class="arc"><div class="arcfill" style="width:51%"></div><i class="boss" style="left:66.6%"></i><i class="now" style="left:51%"></i></div><div class="arcl"><span>Dusk</span><span>Elder Treant 10:00</span><span>Dawn 15:00</span></div>
<div class="chips"><div class="chip"><i class="frame"></i><span>Level</span><b>9</b></div><div class="chip"><i class="frame"></i><span>Slain</span><b>412</b></div><div class="chip"><i class="frame"></i><span>Evolved</span><b class="none">none</b></div></div>
<div class="bank"><div class="chip"><i class="frame"></i><span>Gold carried home</span><b>${icon('coin', 28)}+312</b><small>total 1,840</small></div><div class="chip"><i class="frame"></i><span>Soul shards</span><b>${icon('shard', 28)}+2</b><small>total 7</small></div></div>
<div class="share"><div class="sr">${icon('wolf', 24)}<span>Ghost Wolves</span><i><u style="width:62%"></u></i><em>62%</em></div><div class="sr">${icon('orbit', 24)}<span>Holy Orbit</span><i><u style="width:24%"></u></i><em>24%</em></div><div class="sr s3">${icon('raven', 24)}<span>Raven Flock</span><i><u style="width:14%"></u></i><em>14%</em></div></div>
<div class="unl"><span>Closest unlock: <b>Raven Flock</b> · 120 crows slain</span><i><u style="width:86%"></u></i></div>`, 'rp', false)}
<div class="rbar">${K.btn({ label: 'Title', key: 'Esc', kind: 'quiet' })}${K.btn({ label: 'Walk again', key: 'R', kind: 'primary' })}${K.btn({ label: 'The Thread', key: 'T', kind: 'secondary', cls: 'dot' })}</div></div>`,
  };
}

// kit sheet (1280x720 only)
export function kit(O, meta) {
  const K = components(O);
  return `<div class="bg dim"></div><div class="veil dim"></div><div class="lay-kit">
<div class="k-head"><div><div class="kick">Take ${meta.n} · kit sheet</div><h1 class="h1">${meta.name}</h1><p class="lead">${meta.line}</p></div>${wordmark(O.take, 470)}</div>
<div class="k-grid">
<div class="k-col">${K.panel(`<div class="kick">Panel</div><h2 class="h2">Lantern-lit surface</h2><p class="desc">${meta.panel}</p>${K.divider()}<div class="k-row">${O.wick('lit')}<span class="cap">lit</span>${O.wick('ember')}<span class="cap">ember</span>${O.wick('dark')}<span class="cap">dark</span></div>`, 'kp')}
<div class="k-tt">${O.tooltip()}</div></div>
<div class="k-col"><div class="k-lab">Buttons: primary / hover-focus / secondary / quiet / danger / disabled</div>
${K.btn({ label: 'Begin the night', whisper: 'Pick a hero and walk the Hollow', key: 'Enter', kind: 'primary' })}${K.btn({ label: 'Focused', key: 'T', kind: 'secondary', cls: 'focus' })}${K.btn({ label: 'The Thread', key: 'T', kind: 'secondary' })}
<div class="k-two">${K.btn({ label: 'Back', key: 'Esc', kind: 'quiet' })}${K.btn({ label: 'Forget', kind: 'danger' })}</div>${K.btn({ label: 'Locked', kind: 'secondary', cls: 'dis' })}
<div class="k-lab">Toggle / tabs / badges / pips / divider</div><div class="k-row">${O.toggle(true)}<span class="cap">Calm motion</span>${O.toggle(false)}<span class="cap">Shake</span></div>
<div class="k-row tabs">${O.tab('Spirits', true)}${O.tab('Gifts', false)}${O.tab('Locked', false, true)}</div>
<div class="k-row">${O.badgeEvo(true)}${O.badgeNew(true)}${K.pips(3, 5)}</div>${K.divider()}</div>
<div class="k-col k-cards">${K.card(LEVEL_CARDS[0])}${K.card(LEVEL_CARDS[2])}</div>
</div></div>`;
}
