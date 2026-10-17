// U5: level-up / Blessing / evolution cards in Lantern Glass, Lit. Hostile strings stay inert, clamps, hotkeys, focus, a11y labels,
// leadlight ONLY on evolution, no filters / external URLs / innerHTML, size + contrast floors, reduced motion.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { data } from './helpers.mjs';
import { OfferView, INPUT_LOCK_MS, QUIET_LABEL } from '../src/ui/cardsui.js';
import { cardModel, cardLabel, CLAMP, clampText } from '../src/ui/cardview.js';
import { blessingCard } from '../src/sim/blessings.js';
import { fallbackCard } from '../src/sim/cards.js';

const R = (p) => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const css = R('src/cards.css');
const cssNoComments = css.replace(/\/\*[\s\S]*?\*\//g, '');
const maxRank = data.balance.maxRank;

function fakeDoc() {
  const mk = (tag) => {
    const n = { tag, children: [], attrs: {}, style: { setProperty(k, v) { this[k] = v; } }, _cls: new Set(), _text: '', listeners: {}, focused: 0,
      setAttribute(k, v) { this.attrs[k] = String(v); }, getAttribute(k) { return this.attrs[k]; },
      appendChild(c) { this.children.push(c); return c; }, append(...cs) { cs.forEach((c) => this.children.push(c)); },
      replaceChildren(...cs) { this.children = cs; }, addEventListener(t, f) { (this.listeners[t] ||= []).push(f); },
      fire(t) { (this.listeners[t] || []).forEach((f) => f({})); }, focus() { this.focused++; } };
    n.classList = { add: (c) => n._cls.add(c), remove: (c) => n._cls.delete(c), contains: (c) => n._cls.has(c), toggle: (c, on) => { if (on === undefined ? !n._cls.has(c) : on) n._cls.add(c); else n._cls.delete(c); } };
    Object.defineProperty(n, 'className', { get: () => [...n._cls].join(' '), set: (v) => { n._cls = new Set(String(v).split(/\s+/).filter(Boolean)); } });
    Object.defineProperty(n, 'textContent', { get: () => n._text, set: (v) => { n._text = String(v); n.children = []; } });
    Object.defineProperty(n, 'innerHTML', { get() { throw new Error('innerHTML read'); }, set() { throw new Error('innerHTML write'); } });
    return n;
  };
  return { createElement: mk, createElementNS: (_n, t) => mk(t) };
}
const walk = (n, f) => { f(n); n.children.forEach((c) => walk(c, f)); };
const all = (root, cls) => { const o = []; walk(root, (n) => { if (n._cls && n._cls.has(cls)) o.push(n); }); return o; };
const textOf = (n) => { let t = n._text; n.children.forEach((c) => { t += ' ' + textOf(c); }); return t; };
const mkSim = (offer, extra = {}) => ({ level: 4, pending: 1, balance: data.balance, rerollsLeft: 1, banishesLeft: 1, offer, ...extra });
const stat = (extra = {}) => ({ key: 's:ghost_wolves:power', kind: 'stat', weaponId: 'ghost_wolves', stat: 'power', rank: 1, nextRank: 2, maxRank, title: 'x', desc: 'x', ...extra });
const evo = (extra = {}) => ({ key: 'e:phantom_stampede', kind: 'evolution', weaponId: 'ghost_wolves', evoId: 'phantom_stampede', title: 'Lightfoot Pack', desc: 'Trails', from: 'Ghost Wolves', ...extra });
const wpn = () => ({ key: 'w:spirit_bolts', kind: 'weapon', weaponId: 'spirit_bolts', title: 'Spirit Bolts', desc: 'x' });
const setup = (offer, extra) => { const doc = fakeDoc(), host = doc.createElement('div'); const log = []; const v = new OfferView(doc, host, { pick: (k) => log.push(['pick', k]), reroll: () => log.push(['reroll']), banish: (k) => log.push(['banish', k]) }); v.render(mkSim(offer, extra), data); return { doc, host, v, log }; };

test('U5 leadlight (lg-lead) and seal appear ONLY on the evolution card; Blessings are cream pills with no arch and no gold', () => {
  const { host } = setup({ gold: [evo()], cards: [stat({ stirs: true }), wpn(), fallbackCard('heal', data), blessingCard('dawnlit_soles', data.blessings, 0)] });
  const cards = all(host, 'card');
  assert.equal(cards.length, 5);
  for (const c of cards) {
    const isEvo = c._cls.has('is-evolve');
    assert.equal(c._cls.has('lg-lead'), isEvo, c.className);
    assert.equal(c._cls.has('lg-card--evolve'), isEvo);
    assert.equal(c._cls.has('gold'), isEvo);
    assert.equal(c._cls.has('lg-card'), !c._cls.has('quiet'), 'Blessing pills are not arched cards: ' + c.className);
    assert.equal(all(c, 'lg-badge--evolve').length, isEvo ? 1 : 0);
    assert.equal(all(c, 'lg-eyelet').length, c._cls.has('quiet') ? 0 : 1, 'eyelet only on arched cards');
  }
  assert.equal(all(host, 'lg-lead').length, 1);
  const bless = cards.find((c) => c._cls.has('quiet'));
  assert.ok(!/gold|lead|evolve/.test(bless.className + ' ' + all(bless, 'c-tag').map((t) => t.className).join(' ')));
  assert.equal(all(cards[0], 'lg-badge__seal').length, 1);
  assert.equal(textOf(all(cards[0], 'c-tag')[0]).trim(), 'EVOLVE');
  assert.equal(all(cards[2], 'lg-badge--new').length, 1);
  assert.equal(all(cards[2], 'lg-badge--new')[0]._text, 'NEW');
  // the evolution card whispers only its BASE weapon, never a recipe; the stirs hint still never names an evolution
  assert.equal(all(cards[0], 'c-from')[0]._text, 'from Ghost Wolves');
  assert.equal(all(cards[1], 'c-from').length, 0);
  assert.ok(textOf(cards[1]).includes('Something stirs'));
});

test('U5 accessibility: dialog host, labelled cards with key shortcuts, decorative bits hidden, labelled buttons', () => {
  const { host, v } = setup({ gold: [evo()], cards: [stat(), wpn(), blessingCard('wrapped_warmth', data.blessings, 1)] });
  assert.equal(host.getAttribute('role'), 'dialog'); assert.equal(host.getAttribute('aria-modal'), 'true'); assert.ok(host.classList.contains('lg-kit'));
  const cards = all(host, 'card');
  cards.forEach((c, i) => {
    assert.equal(c.getAttribute('role'), 'button'); assert.equal(c.getAttribute('tabindex'), '0');
    assert.equal(c.getAttribute('aria-keyshortcuts'), String(i + 1));
    const lab = c.getAttribute('aria-label');
    assert.ok(lab && lab.length > 3 && lab.length <= CLAMP.label, lab);
    assert.ok(!/NaN|undefined|\[object/.test(lab));
    for (const el of [...all(c, 'lg-eyelet'), ...all(c, 'c-icon'), ...all(c, 'c-key'), ...all(c, 'c-pips'), ...all(c, 'lg-badge__seal')]) assert.equal(el.getAttribute('aria-hidden'), 'true', el.className);
  });
  assert.match(cards[0].getAttribute('aria-label'), /^Evolution\./);
  assert.match(cards[1].getAttribute('aria-label'), /rank 2 of 5/);
  assert.match(cards[2].getAttribute('aria-label'), /^New spirit\./);
  assert.match(cards[3].getAttribute('aria-label'), /^Blessing\./);
  const btns = all(host, 'lu-btn');
  assert.deepEqual(btns.map((b) => b.getAttribute('aria-label')), ['Reroll, 1 left', 'Banish, 1 left']);
  assert.deepEqual(btns.map((b) => b.getAttribute('aria-keyshortcuts')), ['R', 'B']);
  assert.equal(btns[1].getAttribute('aria-pressed'), 'false'); v.toggleBanish(); assert.equal(btns[1].getAttribute('aria-pressed'), 'true');
  assert.ok(btns.every((b) => b._cls.has('lg-btn') && b.type === 'button'));
});

test('U5 hostile strings stay inert and clamped (no markup, no overflow in the DOM text)', () => {
  const evil = '<img src=x onerror=alert(1)>"\'`${7*7}\u0000‮' + 'Z'.repeat(400);
  const offer = { gold: [evo({ title: evil, desc: evil, from: evil })], cards: [{ key: 'h1', kind: 'weapon', weaponId: 'holy_orbit', title: evil, desc: evil }, { key: 'h2', kind: 'fallback', fallback: 'gold', title: evil, desc: evil + ' 99999999 %' }, { ...blessingCard('wider_glow', data.blessings, 0), title: evil, desc: evil }] };
  const { host } = setup(offer);
  walk(host, (n) => { assert.ok(n._text.length <= CLAMP.label, 'unclamped text ' + n._text.length); assert.ok(!/[\u0000-\u001f]/.test(n._text)); });
  for (const c of all(host, 'card')) assert.ok(c.getAttribute('aria-label').length <= CLAMP.label);
  const m = cardModel(offer.gold[0], data, maxRank);
  assert.ok(m.from.length <= CLAMP.from); assert.ok(m.title.length <= CLAMP.title);
  assert.equal(cardLabel({ cls: 'stat', tag: 'Holy Orbit', title: 'Wider', num: '+12%', unit: '50 → 56', pips: { total: 5, filled: 3 }, desc: 'x', stirs: '' }), 'Holy Orbit. Wider. +12% 50 → 56. rank 3 of 5. x');
  assert.equal(clampText({}, 10), ''); assert.equal(clampText(null, 10), '');
  const note = setup({ gold: [], cards: [wpn()] }).host; void note;
  const doc = fakeDoc(), host2 = doc.createElement('div'); const v2 = new OfferView(doc, host2, { pick() {}, reroll() {}, banish() {} });
  v2.render(mkSim({ gold: [], cards: [wpn()] }), data, evil);
  assert.ok(all(host2, 'lu-note')[0]._text.length <= 40);
  v2.render(mkSim({ gold: [], cards: [wpn()] }), data); assert.equal(all(host2, 'lu-note').length, 0, 'note only when given');
});

test('U5 keys and focus: 1-4 pick (after the lock), R reroll, B banish, arrows move selection AND focus, Tab focus syncs selection', () => {
  const { host, v, log } = setup({ gold: [evo()], cards: [stat(), wpn(), blessingCard('wrapped_warmth', data.blessings, 1)] });
  const cards = all(host, 'card');
  v.openAt -= INPUT_LOCK_MS + 5;
  v.onKey({ key: '3', preventDefault() {} }); assert.deepEqual(log.pop(), ['pick', 'w:spirit_bolts']);
  v.onKey({ key: '4', preventDefault() {} }); assert.equal(log.pop()[0], 'pick');
  v.onKey({ key: '5', preventDefault() {} }); assert.equal(log.length, 0, 'no card 5');
  v.onKey({ key: 'r' }); assert.deepEqual(log.pop(), ['reroll']);
  v.onKey({ key: 'ArrowRight', preventDefault() {} }); assert.equal(v.sel, 1); assert.equal(cards[1].focused, 1, 'arrow moves focus');
  v.onKey({ key: 'ArrowDown', preventDefault() {} }); assert.equal(v.sel, 2);
  v.onKey({ key: 'ArrowLeft', preventDefault() {} }); v.onKey({ key: 'ArrowLeft', preventDefault() {} }); v.onKey({ key: 'ArrowLeft', preventDefault() {} }); assert.equal(v.sel, 0, 'clamped at the start');
  cards[2].fire('focus'); assert.equal(v.sel, 2, 'Tab focus selects that card');
  assert.ok(cards[2]._cls.has('sel') && !cards[0]._cls.has('sel'));
  v.onKey({ key: 'Enter', preventDefault() {}, target: { closest: () => null } }); assert.deepEqual(log.pop(), ['pick', 'w:spirit_bolts'], 'Enter picks the focused card');
  v.onKey({ key: 'Enter', preventDefault() {}, target: { closest: (s) => (s === 'button' ? {} : null) } }); assert.equal(log.length, 0, 'Enter on a real button is left to the button');
  v.onKey({ key: 'b' }); v.onKey({ key: '1', preventDefault() {} }); assert.equal(log.length, 0, 'evolution cannot be banished');
  v.onKey({ key: '2', preventDefault() {} }); assert.deepEqual(log.pop(), ['banish', 's:ghost_wolves:power']);
});

test('U5 a keyboard user keeps their place after a reroll (focus returns to the first card), a mouse user is not given focus', () => {
  const doc = fakeDoc(), host = doc.createElement('div'); host.contains = (n) => n && n.inHost === true;
  const v = new OfferView(doc, host, { pick() {}, reroll() {}, banish() {} });
  const sim = mkSim({ gold: [], cards: [stat(), wpn()] });
  const els = v.render(sim, data); assert.equal(els[0].focused, 0);
  doc.activeElement = { inHost: true };
  const els2 = v.render(sim, data); assert.equal(els2[0].focused, 1);
});

test('U5 source: no innerHTML in the card modules, HUD under the offer is inert, Space works on focused cards', () => {
  for (const f of ['cardview.js', 'cardicons.js', 'cardsui.js']) assert.ok(!/innerHTML|outerHTML|insertAdjacentHTML|document\.write/.test(R(`src/ui/${f}`).replace(/\/\/.*$/gm, '')), f);
  const ui = R('src/ui/ui.js').replace(/\r\n/g, '\n');
  assert.ok(/layers\.hud\.inert = true/.test(ui) && /layers\.hud\.inert = false/.test(ui), 'HUD inert while the offer is open, restored after');
  assert.ok(/\.layer-levelup \.card\[role="button"\]/.test(ui), 'Space activates a focused card');
  assert.ok(!/toast\(NEW_CARD_TOAST\)/.test(ui), 'the hint is a line in the offer, not a hidden HUD toast');
  const cs = R('src/ui/cardsui.js');
  assert.equal((cs.replace(/\/\/.*$/gm, '').match(/lg-lead/g) || []).length, 1, 'lg-lead used in exactly one place (the evolution card)');
});

test('U5 CSS: no filter / backdrop-filter, no external or raster URLs, no @import, animation only as a short entrance gated for reduced motion', () => {
  for (const m of cssNoComments.matchAll(/(?:^|[\s;{])(?:-webkit-)?(?:backdrop-)?filter\s*:\s*([^;}]+)/g)) assert.equal(m[1].trim(), 'none');
  assert.ok(!/@import|url\(\s*['"]?(?!#|data:)/.test(cssNoComments), 'no external URLs');
  assert.ok(!/\.(png|jpe?g|webp|gif)/i.test(cssNoComments), 'no raster art');
  const anims = [...cssNoComments.matchAll(/(^|[;{\s])animation(?:-name)?\s*:\s*([^;}]+)/g)].map((m) => m[2].trim());
  assert.ok(anims.length >= 2);
  for (const a of anims) assert.ok(/^none$/.test(a) || /^luIn\s+\.3s/.test(a), a + ': only the 0.3s entrance');
  const noPref = cssNoComments.match(/@media \(prefers-reduced-motion: no-preference\) \{[\s\S]*?\n\}/)[0];
  assert.ok(/animation: luIn/.test(noPref), 'entrance is behind no-preference');
  assert.ok(/prefers-reduced-motion: reduce\) \{[^}]*animation: none/.test(cssNoComments), 'reduce turns it off');
  assert.ok(!/infinite/.test(cssNoComments), 'nothing loops');
});

test('U5 CSS floors: every text size >= 12px, buttons and cards >= 44px, kit tokens used for type', () => {
  const sizes = [];
  for (const m of cssNoComments.matchAll(/font(?:-size)?\s*:\s*([^;}]+)/g)) {
    const v = m[1];
    const mx = [...v.matchAll(/max\(\s*(\d+(?:\.\d+)?)px/g)].map((x) => +x[1]);
    const px = [...v.matchAll(/(?:^|\s)(\d+(?:\.\d+)?)px\s*\//g)].map((x) => +x[1]);
    const plain = /^\s*(\d+(?:\.\d+)?)px\s*;?$/.exec(v);
    for (const s of [...mx, ...px, ...(plain ? [+plain[1]] : [])]) sizes.push(s);
  }
  assert.ok(sizes.length > 20);
  assert.ok(Math.min(...sizes) >= 12, 'smallest declared text ' + Math.min(...sizes));
  for (const m of cssNoComments.matchAll(/\.lu-btn[^{]*\{[^}]*min-height:\s*(\d+)px/g)) assert.ok(+m[1] >= 44, 'button min-height ' + m[1]);
  assert.ok(/\.card\s*\{[^}]*min-height:\s*44px/.test(cssNoComments), 'cards >= 44px');
  assert.ok(/var\(--font-display\)/.test(cssNoComments) && /var\(--font-whisper\)/.test(cssNoComments) && /var\(--font-body\)/.test(cssNoComments));
  assert.ok(!/--font-num|var\(--font-head\)|var\(--font-ui\)/.test(cssNoComments), 'old fonts retired from the card CSS');
});

// ---- contrast on the surfaces the cards actually use ----
const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const lum = ([r, g, b]) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
const over = (rgba, under) => rgba.slice(0, 3).map((c, i) => c * rgba[3] + under[i] * (1 - rgba[3]));
test('U5 contrast >= 4.5:1: card text on arched glass (with lantern leak), on the evolution brown, on the cream Blessing pill, on the teal flag', () => {
  const style = R('src/style.css'), kit = R('src/ui/kit.css');
  const tok = (n, from) => hex(from.match(new RegExp(`${n}:\\s*(#[0-9a-fA-F]{6})`))[1]);
  const cream = tok('--lg-text', style), brass = tok('--lg-brass-text', kit), evo = tok('--lg-evo', style), thread = tok('--thread', style), top = tok('--lg-glass-top', kit);
  const dim = (bg) => over([255, 243, 220, .88], bg);
  const leak = over([255, 190, 110, .24], top);
  const evoBrown = over([255, 215, 110, .12], [84, 62, 30]); // evolution card: the top glow (.5 at the crown, fades to nothing by 70% of 60% of the height) is ~.1 where the text sits (below the icon)
  const cream2 = over([255, 226, 170, .22], top); // Blessing pill: cream tint (peak, behind the icon) over the glass; the pill has no lantern leak
  for (const [name, bg] of Object.entries({ glass: leak, evoBrown, blessing: cream2 })) {
    assert.ok(ratio(cream, bg) >= 4.5, `cream on ${name}: ${ratio(cream, bg).toFixed(2)}`);
    assert.ok(ratio(dim(bg), bg) >= 4.5, `dim on ${name}: ${ratio(dim(bg), bg).toFixed(2)}`);
    assert.ok(ratio(brass, bg) >= 4.5, `brass on ${name}: ${ratio(brass, bg).toFixed(2)}`);
  }
  assert.ok(ratio(evo, leak) >= 4.5 && ratio(evo, evoBrown) >= 4.5, 'gold effect number / stirs whisper');
  assert.ok(ratio(thread, leak) >= 4.5, 'thread note');
  assert.ok(ratio(tok('--lg-ink', kit), tok('--teal', style)) >= 4.5, 'NEW label');
});

// Blessing copy chunk: effect-first lines stay true to the numbers; whispers present, clamped, inert.
test('Blessing copy: effect lines match perRank/caps; whispers present and plain', () => {
  const b = data.blessings;
  const pctOf = (x) => Math.round(x * 100);
  for (const [id, d] of Object.entries(b.items)) {
    assert.ok(typeof d.whisper === 'string' && d.whisper.length > 0 && d.whisper.length <= 48 && !/[<>&"`]/.test(d.whisper), id);
    const nums = (d.desc.match(/\d+(?:\.\d+)?(?=%)/g) || []).map(Number);
    assert.deepEqual(nums, [pctOf(d.perRank)], `${id} desc number must equal perRank`);
    assert.ok(1 + d.perRank * d.ranks <= b.caps[d.effect] + 1e-9, `${id} ranks within cap`);
  }
});

test('Blessing copy: whisper shown under the effect line via textContent, clamped; label is two-part; hostile whisper inert', () => {
  const evil = '<img src=x onerror=alert(1)>' + 'Z'.repeat(300);
  const d2 = { ...data, blessings: { ...data.blessings, items: { ...data.blessings.items, wider_glow: { ...data.blessings.items.wider_glow, whisper: evil }, kind_fortune: { ...data.blessings.items.kind_fortune, whisper: 42 } } } };
  const doc = fakeDoc(), host = doc.createElement('div');
  const v = new OfferView(doc, host, { pick() {}, reroll() {}, banish() {} });
  v.render(mkSim({ gold: [], cards: [blessingCard('wider_glow', data.blessings, 0), blessingCard('kind_fortune', data.blessings, 0), blessingCard('dawnlit_soles', data.blessings, 0)] }), d2);
  const w = all(host, 'c-whisper');
  assert.equal(w.length, 2); // numeric whisper dropped, others shown
  assert.ok(w[0]._text.length <= 48);
  assert.equal(w[1]._text, data.blessings.items.dawnlit_soles.whisper);
  assert.equal(all(host, 'lu-qtitle')[0]._text, 'Quiet gifts');
  assert.equal(all(host, 'lu-qwhisper')[0]._text, 'Take one. They ask nothing.');
  assert.equal(QUIET_LABEL, 'Quiet gifts');
});

test('Blessing pill shows the effect-first line plus rank; compact line kept for the landscape strip; hostile desc inert', () => {
  const evil = '<img src=x onerror=alert(1)>' + 'Z'.repeat(300);
  const { host } = setup({ gold: [], cards: [blessingCard('wider_glow', data.blessings, 0), { ...blessingCard('kind_fortune', data.blessings, 1), desc: evil }] });
  const longs = all(host, 'u-long'), shorts = all(host, 'u-short');
  assert.equal(longs.length, 2);
  assert.equal(longs[0]._text, data.blessings.items.wider_glow.desc + ' · 1/3');
  assert.match(shorts[0]._text, /^\+8% pickup radius · 1\/3$/);
  assert.ok(longs[1]._text.length <= 64 + 6 && /2\/3$/.test(longs[1]._text));
  assert.ok(!/innerHTML/.test(readFileSync('src/ui/cardsui.js', 'utf8').replace(/\/\/.*$/gm, '')));
});
