// HUD-2: pure card view helpers + a DOM-shaped test of OfferView on a tiny fake document + source rules.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { data } from './helpers.mjs';
import { clampText, cardClass, isQuiet, orderOffer, pipsOf, effectOf, cardModel, STIRS_TEXT, CLAMP } from '../src/ui/cardview.js';
import { iconSpec, cardIcon } from '../src/ui/cardicons.js';
import { OfferView, INPUT_LOCK_MS } from '../src/ui/cardsui.js';
import { buildPool, goldCards, newWeapon, fallbackCard } from '../src/sim/cards.js';
import { blessingCard } from '../src/sim/blessings.js';

const maxRank = data.balance.maxRank;
const wolves = () => newWeapon('ghost_wolves', data.weapons.ghost_wolves);
const statCard = (w, key, ranks = {}) => { Object.assign(w.ranks, ranks); return buildPool({ weapons: [w], data, banished: new Set(), unlockedEvolutions: new Set(Object.keys(data.evolutions)), unlockedWeapons: new Set() }).find((p) => p.card.key === `s:${w.id}:${key}`).card; };

test('HUD-2 effect numbers: percent / count / seconds / label per stat kind', () => {
  const w = wolves();
  const speed = statCard(w, 'speed'); // 110 -> 122 = +11%
  assert.deepEqual(effectOf(speed, data), { mode: 'percent', num: '+11%', unit: '110 → 122' });
  const count = statCard(w, 'count', { count: 1 }); // 3 wolves total
  assert.equal(effectOf(count, data).mode, 'count');
  assert.equal(effectOf(count, data).num, '4');
  const dur = statCard(w, 'duration'); // Rend: percentage POINTS of a bite per second, not a percent of a percent
  assert.deepEqual(effectOf(dur, data), { mode: 'percent', num: '+4%', unit: '15% → 19%' });
  const chain = newWeapon('chain_lightning', data.weapons.chain_lightning);
  const cd = statCard(chain, 'cooldown');
  assert.equal(effectOf(cd, data).num, '-0.15s');
  const bolts = newWeapon('spirit_bolts', data.weapons.spirit_bolts);
  const pierce = statCard(bolts, 'pierce'); // base 0: never a divide-by-zero percent
  assert.equal(effectOf(pierce, data).mode, 'count');
  assert.equal(effectOf(pierce, data).num, '1');
  const evo = goldCards({ weapons: [Object.assign(wolves(), { ranks: { count: 5, power: 5, speed: 5, duration: 5 } })], data, unlockedEvolutions: new Set(Object.keys(data.evolutions)) });
  assert.ok(evo.length >= 1);
  const e = effectOf(evo.find((c) => c.evoId === 'phantom_stampede'), data);
  assert.deepEqual([e.mode, e.num, e.unit], ['label', 'TRAILS', 'light that bleeds']);
  const nw = effectOf({ kind: 'weapon', weaponId: 'spirit_bolts' }, data);
  assert.deepEqual([nw.num, nw.unit], ['1', 'Bolt count']);
  assert.equal(effectOf(blessingCard('dawnlit_soles', data.blessings, 0), data).num, '+2%');
  assert.equal(effectOf(fallbackCard('heal', data), data).num, '+35%');
  assert.equal(effectOf(fallbackCard('gold', data), data).num, '+25');
  assert.equal(effectOf(fallbackCard('xp', data), data).num, 'XP');
  // garbage in -> empty, never a throw
  for (const bad of [null, undefined, {}, { kind: 'stat' }, { kind: 'stat', weaponId: 'nope', stat: 'x', rank: 0 }, { kind: 'evolution', evoId: 'zzz' }]) {
    const r = effectOf(bad, data); assert.equal(typeof r.num, 'string'); assert.ok(!/NaN|Infinity|undefined/.test(r.num + r.unit));
  }
});

test('HUD-2 every stat of every weapon yields a clean effect number', () => {
  for (const [id, def] of Object.entries(data.weapons)) {
    const w = newWeapon(id, def);
    for (const key of Object.keys(def.stats)) {
      for (let r = 0; r < maxRank; r++) {
        const c = { kind: 'stat', weaponId: id, stat: key, rank: r, nextRank: r + 1, maxRank, title: 'x', desc: 'x', key: `s:${id}:${key}` };
        const e = effectOf(c, data);
        assert.ok(e.num.length > 0 && e.num.length <= CLAMP.num, `${id}.${key}@${r}: ${e.num}`);
        assert.ok(!/NaN|Infinity/.test(e.num + e.unit));
      }
    }
    assert.ok(w);
  }
});

test('HUD-2 pips: show where this pick lands', () => {
  assert.deepEqual(pipsOf({ kind: 'stat', maxRank: 5, nextRank: 3 }), { total: 5, filled: 3, fresh: 2 });
  assert.deepEqual(pipsOf({ kind: 'stat', maxRank: 5, nextRank: 5 }), { total: 5, filled: 5, fresh: 4 });
  assert.deepEqual(pipsOf({ kind: 'weapon' }, 5), { total: 5, filled: 0, fresh: 0 });
  assert.deepEqual(pipsOf({ kind: 'evolution' }, 5), { total: 5, filled: 5, fresh: -1 });
  assert.deepEqual(pipsOf({ kind: 'blessing', maxRank: 3, nextRank: 1 }), { total: 3, filled: 1, fresh: 0 });
  assert.equal(pipsOf({ kind: 'fallback' }).total, 0);
  const p = pipsOf({ kind: 'stat', maxRank: 999, nextRank: NaN });
  assert.ok(p.total <= 8 && p.filled === 0);
  assert.equal(pipsOf(null).total, 0);
});

test('HUD-2 classification + order: gold first, blessings (and swapped heal) in the quiet row', () => {
  const w = wolves();
  const stirs = { ...statCard(w, 'speed'), stirs: true };
  assert.equal(cardClass(stirs), 'stirs');
  assert.equal(cardClass(statCard(w, 'power')), 'stat');
  assert.equal(cardClass({ kind: 'weapon' }), 'new');
  assert.equal(cardClass({ kind: 'evolution' }), 'evolve');
  assert.equal(cardClass(blessingCard('wider_glow', data.blessings, 0)), 'blessing');
  assert.equal(cardClass(fallbackCard('gold', data)), 'fallback');
  assert.equal(cardClass({ ...fallbackCard('heal', data), swapped: true }), 'blessing');
  assert.ok(isQuiet({ kind: 'blessing' }) && !isQuiet({ kind: 'stat' }) && !isQuiet(null));
  const gold = [{ kind: 'evolution', key: 'e:a' }];
  const cards = [{ kind: 'blessing', key: 'b:1' }, { kind: 'stat', key: 's:1' }, { kind: 'blessing', key: 'b:2' }];
  const o = orderOffer({ gold, cards });
  assert.deepEqual(o.all.map((c) => c.key), ['e:a', 's:1', 'b:1', 'b:2']);
  assert.equal(o.main.length, 2); assert.equal(o.quiet.length, 2);
  assert.deepEqual(orderOffer(null).all, []);
});

test('HUD-2 text clamps: bounded, control chars dropped, non-strings safe', () => {
  assert.equal(clampText('abc', 10), 'abc');
  assert.equal(clampText('a'.repeat(50), 10).length, 10);
  assert.ok(clampText('a'.repeat(50), 10).endsWith('…'));
  assert.equal(clampText('a\u0000b\nc', 20), 'a b c');
  for (const bad of [null, undefined, {}, [], NaN, Infinity]) assert.equal(clampText(bad, 10), '');
  assert.equal(clampText(12, 10), '12');
  // every real card in the game fits its clamps without being cut (titles/units/tags)
  for (const [id, d] of Object.entries(data.weapons)) { assert.ok(d.name.length <= CLAMP.tag, id); for (const s of Object.values(d.stats)) assert.ok(s.name.length <= CLAMP.title); }
  for (const e of Object.values(data.evolutions)) assert.ok(e.name.length <= CLAMP.title && e.verb.length <= CLAMP.num && e.sub.length <= CLAMP.unit && e.desc.length <= CLAMP.desc, e.name);
});

test('HUD-2 NO recipe leak: stat/stirs cards never show an evolution name, verb, partner stat or "evolve"', () => {
  for (const [evoId, evo] of Object.entries(data.evolutions)) {
    const def = data.weapons[evo.weapon];
    for (let i = 0; i < 2; i++) {
      const statKey = evo.pair[i];
      const partner = def.stats[evo.pair[1 - i]];
      for (const stirs of [false, true]) {
        const c = { kind: 'stat', weaponId: evo.weapon, stat: statKey, rank: 4, nextRank: 5, maxRank, key: `s:${evo.weapon}:${statKey}`, title: 'x', desc: 'x', ...(stirs ? { stirs: true } : {}) };
        const m = cardModel(c, data, maxRank);
        const text = [m.tag, m.title, m.num, m.unit, m.desc, m.stirs].join(' | ').toLowerCase();
        for (const [oid, o] of Object.entries(data.evolutions)) for (const needle of [o.name, o.verb, o.sub, oid]) assert.ok(!text.includes(String(needle).toLowerCase()), `${evoId}/${statKey}: leaks ${needle}`);
        if (partner.name.toLowerCase() !== def.stats[statKey].name.toLowerCase()) assert.ok(!text.includes(partner.name.toLowerCase()), `${evoId}/${statKey}: leaks partner ${partner.name}`);
        assert.ok(!/evolv|recipe/.test(text), text);
        assert.equal(m.stirs, stirs ? STIRS_TEXT : '');
      }
    }
  }
});

test('HUD-2 icons: every card kind has a glyph + ring; fallback coin is brass, never evolution gold', () => {
  for (const id of Object.keys(data.blessings.items)) { const s = iconSpec(blessingCard(id, data.blessings, 0)); assert.equal(s.type, 'blessing'); assert.equal(s.id, id); }
  const coin = iconSpec(fallbackCard('gold', data));
  assert.notEqual(coin.ring.toLowerCase(), '#ffd36b');
  assert.equal(iconSpec({ kind: 'evolution', weaponId: 'ghost_wolves' }).ring, '#ffd36b');
  assert.equal(iconSpec({ kind: 'stat', weaponId: 'spirit_bolts' }).id, 'bolt');
  assert.equal(iconSpec({ kind: 'weapon', weaponId: 'holy_orbit' }).id, 'orb');
  assert.equal(iconSpec(null).id, 'sanctuary');
});

// ---- tiny fake DOM ----
function fakeDoc() {
  const mkNode = (tag) => {
    const n = { tag, children: [], attrs: {}, style: { setProperty(k, v) { this[k] = v; } }, _cls: new Set(), _text: '', listeners: {},
      setAttribute(k, v) { this.attrs[k] = String(v); }, getAttribute(k) { return this.attrs[k]; },
      appendChild(c) { this.children.push(c); return c; }, append(...cs) { cs.forEach((c) => this.children.push(c)); },
      replaceChildren(...cs) { this.children = cs; }, addEventListener(t, f) { (this.listeners[t] ||= []).push(f); } };
    n.classList = { add: (c) => n._cls.add(c), remove: (c) => n._cls.delete(c), contains: (c) => n._cls.has(c), toggle: (c, on) => { if (on === undefined ? !n._cls.has(c) : on) n._cls.add(c); else n._cls.delete(c); } };
    Object.defineProperty(n, 'className', { get: () => [...n._cls].join(' '), set: (v) => { n._cls = new Set(String(v).split(/\s+/).filter(Boolean)); } });
    Object.defineProperty(n, 'textContent', { get: () => n._text, set: (v) => { n._text = String(v); n.children = []; } });
    return n;
  };
  return { createElement: mkNode, createElementNS: (_ns, t) => mkNode(t) };
}
const walk = (n, f) => { f(n); n.children.forEach((c) => walk(c, f)); };
const all = (root, cls) => { const out = []; walk(root, (n) => { if (n._cls && n._cls.has(cls)) out.push(n); }); return out; };
const textOf = (n) => { let t = n._text; n.children.forEach((c) => { t += ' ' + textOf(c); }); return t; };

function mkSim(extra = {}) {
  const w = Object.assign(wolves(), { ranks: { count: 5, power: 5, speed: 4, duration: 5 } });
  const ctx = { weapons: [w], data, banished: new Set(), unlockedEvolutions: new Set(Object.keys(data.evolutions)), unlockedWeapons: new Set() };
  const stat = { ...buildPool(ctx).find((p) => p.card.stat === 'speed').card };
  return {
    level: 8, pending: 1, balance: data.balance, rerollsLeft: 2, banishesLeft: 1,
    offer: {
      gold: goldCards(ctx).slice(0, 1),
      cards: [stat, { kind: 'weapon', key: 'w:spirit_bolts', weaponId: 'spirit_bolts', title: 'Spirit Bolts', desc: data.weapons.spirit_bolts.desc }, blessingCard('dawnlit_soles', data.blessings, 0), blessingCard('wrapped_warmth', data.blessings, 1)],
    },
    ...extra,
  };
}

test('HUD-2 OfferView on a fake DOM: structure, order, quiet row, keys, banish mode, input lock', () => {
  const doc = fakeDoc(), host = doc.createElement('div');
  const log = [];
  const v = new OfferView(doc, host, { pick: (k) => log.push(['pick', k]), reroll: () => log.push(['reroll']), banish: (k) => log.push(['banish', k]) });
  const sim = mkSim();
  const els = v.render(sim, data);
  assert.equal(els.length, 5); // 1 gold + 2 normal in the main row, 2 blessings in the quiet row
  assert.equal(all(host, 'lu-main').length, 1); assert.equal(all(host, 'lu-quiet').length, 1);
  const main = all(host, 'lu-main')[0], quiet = all(host, 'lu-quiet')[0];
  assert.equal(main.children.length, 3); assert.equal(quiet.children.length, 2);
  assert.ok(main.children[0].className.includes('is-evolve') && main.children[0].className.includes('gold'));
  assert.ok(main.children[1].className.includes('is-stirs') && main.children[1].className.includes('stirs'));
  assert.ok(main.children[2].className.includes('is-new'));
  assert.ok(quiet.children.every((c) => c.className.includes('quiet')));
  assert.ok(textOf(host).includes('The light stirs') && textOf(host).includes('LEVEL 8') && textOf(host).includes('Quiet gifts'));
  assert.ok(textOf(main.children[1]).includes(STIRS_TEXT));
  assert.ok(!textOf(main.children[0]).includes('NaN'));
  assert.equal(all(host, 'c-key').map((k) => k._text).join(''), '12345'); // keys 1..5 follow display order
  assert.equal(all(host, 'lu-btn').length, 2);
  assert.ok(textOf(all(host, 'lu-btn')[0]).includes('Reroll') && textOf(all(host, 'lu-btn')[0]).includes('×2'));
  // input lock: a pick right after opening is ignored; after the lock it goes through
  v.openAt = performance.now() + 1e9; // deterministic: pretend it opened 'just now' (a wall-clock race made this flaky under load)
  assert.equal(v.activate(0), false);
  v.openAt = performance.now() - INPUT_LOCK_MS - 5;
  assert.equal(v.activate(0), true);
  assert.deepEqual(log.pop(), ['pick', sim.offer.gold[0].key]);
  // keyboard: number picks display-order card; R rerolls
  v.onKey({ key: '2', preventDefault() {} });
  assert.deepEqual(log.pop(), ['pick', sim.offer.cards[0].key]);
  v.onKey({ key: 'r' });
  assert.deepEqual(log.pop(), ['reroll']);
  // banish mode: B toggles, a number banishes (not the gold evolution card), mode label changes
  v.onKey({ key: 'b' });
  assert.ok(host.classList.contains('banishing') && textOf(v.sub).includes('BANISH'));
  assert.equal(v.activate(0), false); // evolution cannot be banished
  assert.equal(log.length, 0);
  v.onKey({ key: '3', preventDefault() {} });
  assert.deepEqual(log.pop(), ['banish', sim.offer.cards[1].key]);
  v.onKey({ key: 'B' });
  assert.ok(!host.classList.contains('banishing'));
  // re-render resets the mode and the lock
  v.render(sim, data); assert.equal(v.banishing, false); assert.equal(v.activate(0), false);
});

test('HUD-2 OfferView: no reroll/banish buttons when none left; 6 main cards + 3 blessings still render', () => {
  const doc = fakeDoc(), host = doc.createElement('div');
  const v = new OfferView(doc, host, { pick() {}, reroll() {}, banish() {} });
  const sim = mkSim({ rerollsLeft: 0, banishesLeft: 0 });
  const stat = sim.offer.cards[0];
  sim.offer = { gold: [{ kind: 'evolution', key: 'e:1', weaponId: 'ghost_wolves', evoId: 'phantom_stampede', title: 'Lightfoot Pack', desc: 'x' }, { kind: 'evolution', key: 'e:2', weaponId: 'ghost_wolves', evoId: 'howling_legion', title: 'Howling Legion', desc: 'x' }, { kind: 'evolution', key: 'e:3', weaponId: 'ghost_wolves', evoId: 'dire_alpha', title: 'Dire Alpha', desc: 'x' }],
    cards: [stat, { ...stat, key: 'x2' }, fallbackCard('gold', data), blessingCard('wider_glow', data.blessings, 0), blessingCard('kind_fortune', data.blessings, 0), blessingCard('kindled_spirits', data.blessings, 0)] };
  const els = v.render(sim, data);
  assert.equal(els.length, 9);
  assert.equal(all(host, 'lu-btn').length, 0);
  assert.equal(all(host, 'lu-main')[0].children.length, 6);
  assert.ok(all(host, 'lu-main')[0].classList.contains('many'));
  assert.equal(all(host, 'lu-quiet')[0].children.length, 3);
  // long hostile text never reaches the DOM unclamped
  sim.offer = { gold: [], cards: [{ kind: 'stat', key: 's', weaponId: 'ghost_wolves', stat: 'power', rank: 0, nextRank: 1, maxRank, title: 'T'.repeat(500), desc: 'D'.repeat(900) }, { kind: 'fallback', fallback: 'gold', key: 'f', title: '<img src=x onerror=1>'.repeat(30), desc: 'x'.repeat(900) }] };
  v.render(sim, data);
  walk(host, (n) => { assert.ok(n._text.length <= 120, 'unclamped text'); });
});

test('HUD-2 source: no innerHTML / outerHTML / insertAdjacentHTML / document.write in the new card modules', () => {
  for (const f of ['cardview.js', 'cardicons.js', 'cardsui.js']) {
    const src = readFileSync(new URL(`../src/ui/${f}`, import.meta.url), 'utf8').replace(/\/\/.*$/gm, '');
    assert.ok(!/innerHTML|outerHTML|insertAdjacentHTML|document\.write/.test(src), f);
  }
  const css = readFileSync(new URL('../src/cards.css', import.meta.url), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  for (const m of css.matchAll(/(?:^|[\s;{])(?:-webkit-)?(?:backdrop-)?filter\s*:\s*([^;}]+)/g)) assert.equal(m[1].trim(), 'none', 'no backdrop-filter / filter in the card CSS');
  const ui = readFileSync(new URL('../src/ui/ui.js', import.meta.url), 'utf8');
  const lu = ui.slice(ui.indexOf('level-up (HUD-2'), ui.indexOf('pause / end'));
  assert.ok(!/innerHTML|show\('levelup', `/.test(lu), 'level-up block builds no HTML strings');
  void cardIcon; void isQuiet;
});

test('FM2 OfferView teach: one line under the title in the whisper voice; the card it is about gets an outline and the line in its label', () => {
  const doc = fakeDoc(), host = doc.createElement('div');
  const v = new OfferView(doc, host, { pick() {}, reroll() {}, banish() {} });
  v.render(mkSim(), data, '', { id: 'evolve', title: 'Evolution', whisper: 'Your spirit changes its nature. One per weapon.', card: 'evolve' });
  const t = all(host, 'lu-teach');
  assert.equal(t.length, 1); assert.match(textOf(t[0]), /Evolution/);
  const taught = all(host, 'is-taught');
  assert.equal(taught.length, 1); assert.ok(taught[0]._cls.has('lg-card--evolve'));
  assert.match(taught[0].attrs['aria-label'], /changes its nature/);
  assert.match(host.attrs['aria-description'], /Evolution/);
  v.render(mkSim(), data, '', null);
  assert.equal(all(host, 'lu-teach').length, 0, 'no teach: nothing extra');
  v.render(mkSim(), data, '', { title: '<img src=x>'.repeat(9), whisper: 'w', note: 'Dots = rank, 5 is the most', card: null });
  assert.ok(textOf(all(host, 'lu-teach__t')[0]).length <= 48, 'clamped plain text');
});
