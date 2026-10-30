// T6: the inert tool clusters go live (Card Fan, Almanac, Hearth-key). Design: docs/design/difficulty-tiers-economy-v1.md 8.2 (effects are
// exactly the locked ones). Pending (still inert, a feature they need is not built): cd_radar (cd_bars live since DT2), cd_fourth, rs_slot5, bs_crow3,
// bs_crawl3, bs_page and the Night Gate. Saves / settings are hostile input.
import test from 'node:test';
import assert from 'node:assert/strict';
import { data, treeDef as def } from './helpers.mjs';
import { aggregateMods, sanitizeTree, conditionProgress } from '../src/meta/tree.js';
import { composeTree } from '../src/meta/treedata.js';
import { readTreeFiles } from '../src/meta/treefs.mjs';
import { connectIssues } from '../src/meta/treelayout.js';
import { Sim, AUTO_RULES, AUTO_NEAR, AUTO_CROWD, TELL_EARLY, WOLF_TELL } from '../src/sim/Sim.js';
import { buildPool, newWeapon, goldCards, FAVOUR_WEIGHT, offerFromPreview, startOffer, generateOffer } from '../src/sim/cards.js';
import { createRng } from '../src/sim/rng.js';
import { cardClass, cardModel, cardLabel, peekLine } from '../src/ui/cardview.js';
import { OfferView, START_COPY } from '../src/ui/cardsui.js';
import { defaultSave, sanitize, AUTO_RULE_NAMES } from '../src/save/schema.js';

const own = (ids) => Object.fromEntries(ids.map((i) => [i, 1]));
const fx = (ids, opts) => aggregateMods(own(ids), def, data, opts);
const composed = composeTree(readTreeFiles(), data);
const sim = (ids = [], extra = {}) => new Sim({ data, characterId: 'wren', seed: 7, tree: ids === null ? null : fx(ids), ...extra });
const pickAll = (s) => { while (s.state === 'levelup' && s.offer && s.offer.start) s.pickCard(s.offer.cards[0].key); };

// ------------------------------------------------------------------ data + connected rule
test('T6 the three groups go live: bridges + built lanterns live, each group has one gold-only way in, pending set is the unbuilt features only', () => {
  for (const id of ['br_almanac', 'br_cardfan', 'br_hearthkey', 'cd_stir', 'cd_peek', 'cd_favour', 'rs_autoset', 'rs_start', 'rs_bless', 'bs_wolf1', 'bs_wolf2', 'bs_wolf3', 'bs_crow1', 'bs_crow2', 'bs_crawl1', 'bs_crawl2', 'bs_treant1', 'bs_treant2', 'bs_treant3']) assert.ok(def.nodes[id], `${id} live`);
  assert.deepEqual(def.pendingList.slice().sort(), ['df_star', 'df_vigil', 'df_ward']);
  for (const id of ['cd_peek', 'bs_wolf1', 'rs_autoset']) { assert.equal(def.nodes[id].unlock, null, `${id} gold-only`); assert.deepEqual(def.nodes[id].requires, [`br_${id.startsWith('cd') ? 'cardfan' : id.startsWith('bs') ? 'almanac' : 'hearthkey'}`]); }
  assert.deepEqual(connectIssues(composed.info, def), []);
  // every other T6 lantern keeps its locked challenge
  assert.deepEqual(def.nodes.bs_wolf2.unlock, { t: 'killEnemy', id: 'wolf', n: 4000 });
  assert.deepEqual(def.nodes.cd_favour.unlock, { t: 'evolveWeapon', id: 'any', n: 8 });
  assert.equal(def.nodes.rs_bless.unlock.t, 'blessings');
  // still-pending lanterns stay unbuyable and are dropped from a forged save (full refund path is tests/t3b)
  assert.deepEqual(sanitizeTree(own(['cd_radar', 'df_vigil', 'df_star', 'df_ward', 'br_almanac']), { killsByEnemy: {} }, def, data), { br_almanac: 1 }, 'links gate buying only (T3c), so an owned bridge is kept; the pending ids always go');
});

test('T6 aggregate: lore per type clamped at 2, Tells list the enemies, peek / stir flags; nothing tier-bought on Twilight', () => {
  const a = fx(['bs_wolf1', 'bs_wolf2', 'bs_crow1', 'bs_treant1', 'bs_treant2', 'bs_wolf3', 'bs_treant3', 'cd_peek', 'cd_stir', 'cd_favour', 'rs_start', 'rs_bless', 'rs_autoset']);
  assert.deepEqual({ ...a.lore }, { wolf: 2, crow: 1, elder_treant: 2 });
  assert.deepEqual(a.tells.slice().sort(), ['elder_treant', 'wolf']);
  assert.ok(a.info.includes('peek') && a.info.includes('stir'));
  assert.deepEqual([a.perks.favour, a.perks.startWeapon, a.perks.startBlessing, a.perks.autoRule, a.perks.offerSize, a.perks.weaponSlot], [true, true, true, true, 0, 0]);
  assert.deepEqual(fx([]).tells, []);
});

// ------------------------------------------------------------------ the default path is untouched
test('T6 no tree: no start offer, Twilight sizes, no lore / tells / peek / auto rule', () => {
  const s = sim(null);
  assert.equal(s.state, 'running');
  assert.deepEqual([s.offerSize, s.weaponSlots, s.autoRule, s.favour, s.peekNext, s.hasLore, s.wolfTell], [data.balance.offerSize, data.balance.weaponSlots, null, null, null, false, WOLF_TELL]);
});

// ------------------------------------------------------------------ Almanac
test('T6 Almanac lore: +2% against the known type only; forged lore is clamped / dropped', () => {
  const s = sim(['bs_wolf1', 'bs_wolf2']);
  const foe = (type) => ({ type, hp: 1000, maxHp: 1000, cd: {}, dead: false });
  const w = foe('wolf'), c = foe('crow');
  assert.ok(Math.abs(s.hurt(w, 100, { silent: true }) - 102) < 1e-9);
  assert.equal(s.hurt(c, 100, { silent: true }), 100);
  const bad = new Sim({ data, characterId: 'wren', seed: 1, tree: { lore: { wolf: 50, nobody: 5, crow: -3, root_crawler: 'x', __proto__: { elder_treant: 9 } } } });
  assert.deepEqual({ ...bad.tfx.lore }, { wolf: 2 });
  assert.ok(Math.abs(bad.hurt(foe('wolf'), 100, { silent: true }) - 102) < 1e-9);
});

test('T6 Almanac Tells: a Fell Wolf lunge tell lasts 0.1 s longer (shows earlier); the boss Tells flag is render only', () => {
  const s = sim(['bs_wolf3']);
  assert.equal(TELL_EARLY, 0.1);
  assert.ok(Math.abs(s.wolfTell - (WOLF_TELL + TELL_EARLY)) < 1e-12);
  const t = sim(['bs_treant3']);
  assert.equal(t.wolfTell, WOLF_TELL);
  assert.ok(t.tfx.tells.has('elder_treant'));
  // a wolf that starts its tell records the real windup for the renderer
  const r = sim(['bs_wolf3']);
  r.spawnEnemy('wolf', r.player.x + 60, r.player.y);
  const e = r.enemies[r.enemies.length - 1];
  e.chargeCd = 0;
  r.step(1 / 60, {});
  assert.equal(e.state, 'tele');
  assert.ok(Math.abs(e.teleT - (WOLF_TELL + TELL_EARLY)) < 1e-12);
});

// ------------------------------------------------------------------ Card Fan
test('T6 Louder Stirring (flow v2): the awakening comes one stat rank sooner; no card text changes; never below the floor', () => {
  const w = newWeapon('ghost_wolves', data.weapons.ghost_wolves);
  const ctx = { weapons: [w], data, banished: new Set(), unlockedEvolutions: new Set(Object.keys(data.evolutions)) };
  w.ranks.power = 5; w.ranks.speed = 5; w.ranks.duration = 4; // 14 of 15
  assert.equal(goldCards(ctx).length, 0);
  assert.equal(goldCards({ ...ctx, evoEarly: true }).length, 3);
  assert.ok(buildPool({ ...ctx, evoEarly: true }).filter((p) => p.card.kind === 'stat').every((p) => p.card.stirs === undefined && p.w === 1));
  // the tree effect reaches the Sim context
  const sim = new Sim({ data, characterId: 'wren', seed: 1, tree: { ...fx(['cd_stir']) } });
  assert.equal(sim.cardCtx.evoEarly, true);
  assert.equal(new Sim({ data, characterId: 'wren', seed: 1 }).cardCtx.evoEarly, false);
});

test('T6 Favoured Spirit: a start offer of every unlocked weapon (hero first); the mark weighs its stat cards x1.5', () => {
  const s = sim(['cd_favour', 'gt_ghost_wolves', 'gt_holy_orbit']); // the old run-1 pool (v2: both hearts owned)
  assert.deepEqual(sim(['cd_favour']).offer.cards.map((c) => c.weaponId), ['ghost_wolves'], 'v2 starter set: the held starting spirit can always be favoured');
  assert.equal(s.state, 'levelup');
  assert.equal(s.offer.start, 'favour');
  assert.deepEqual(s.offer.cards.map((c) => c.weaponId), ['ghost_wolves', 'holy_orbit'], 'only the unlocked weapons');
  assert.equal(s.canReroll(), false); assert.equal(s.canBanish(), false);
  s.pickCard('v:holy_orbit');
  assert.deepEqual([s.favour, s.state, s.pending, s.level], ['holy_orbit', 'running', 0, 1]);
  const w = newWeapon('holy_orbit', data.weapons.holy_orbit);
  const base = buildPool({ weapons: [w], data, banished: new Set(), unlockedEvolutions: new Set() });
  const fav = buildPool({ weapons: [w], data, banished: new Set(), unlockedEvolutions: new Set(), favour: 'holy_orbit' });
  base.forEach((p, i) => { assert.equal(fav[i].card.key, p.card.key); assert.ok(Math.abs(fav[i].w - p.w * (p.card.kind === 'stat' ? FAVOUR_WEIGHT : 1)) < 1e-12, p.card.key); });
  assert.equal(FAVOUR_WEIGHT, 1.5);
  assert.equal(s.pickCard('v:raven_flock'), false, 'no offer open');
});

test('T6 Second Sight: the next offer is drawn now and kept, except cards a pick removed', () => {
  const s = sim(['cd_peek']);
  s.xp = s.xpNeeded; s.checkLevelUp();
  assert.equal(s.state, 'levelup');
  const next = s.peekNext.map((c) => c.key);
  assert.equal(next.length, s.offerSize);
  const pick = s.offer.cards.find((c) => c.kind === 'stat' && !next.includes(c.key)) || s.offer.cards[0];
  s.pickCard(pick.key);
  s.xp = s.xpNeeded; s.checkLevelUp();
  const now = s.offer.cards.map((c) => c.key);
  const stillValid = next.filter((k) => buildPool(s.cardCtx).some((p) => p.card.key === k) || now.includes(k));
  for (const k of stillValid) if (!k.startsWith('w:') || s.weapons.every((w) => `w:${w.id}` !== k)) assert.ok(now.includes(k), `${k} kept from the preview`);
  // a removed card is replaced by a fresh draw
  const ctx = s.cardCtx;
  const fake = [{ key: 'w:nonexistent' }, ...buildPool(ctx).slice(0, 1).map((p) => p.card)];
  const o = offerFromPreview(ctx, createRng(3), fake);
  assert.equal(o.cards.length, s.offerSize);
  assert.ok(!o.cards.some((c) => c.key === 'w:nonexistent'));
  assert.equal(o.cards[0].key, fake[1].key);
});

// ------------------------------------------------------------------ Hearth-key
test('T6 Kindred Start: three unlocked weapons not owned (a free weapon card); Lantern Blessing: one Blessing inside the caps; order Kindred > Favour > Blessing', () => {
  const s = new Sim({ data, characterId: 'wren', seed: 3, tree: { ...fx(['rs_start', 'cd_favour', 'rs_bless']), unlocks: { weapons: ['ghost_wolves', 'holy_orbit', 'raven_flock', 'spirit_bolts', 'chain_lightning'], evolutions: [], heroes: [], abilityUpgrades: [], modifiers: [], tiers: [] } } });
  assert.equal(s.offer.start, 'kindred');
  assert.equal(s.offer.cards.length, 3);
  assert.ok(s.offer.cards.every((c) => c.kind === 'weapon' && c.weaponId !== 'ghost_wolves'));
  const k = s.offer.cards[1];
  s.pickCard(k.key);
  assert.deepEqual(s.weapons.map((w) => w.id), ['ghost_wolves', k.weaponId]);
  assert.equal(s.offer.start, 'favour');
  assert.equal(s.offer.cards.length, 5);
  s.pickCard(s.offer.cards[0].key);
  assert.equal(s.offer.start, 'blessing');
  assert.ok(s.offer.cards.length === 3 && s.offer.cards.every((c) => c.kind === 'blessing'));
  const b = s.offer.cards[0];
  s.pickCard(b.key);
  assert.deepEqual([s.blessRanks[b.blessId], s.blessingsTaken, s.state, s.level, s.pending, s.time], [1, 1, 'running', 1, 0, 0]);
  // the old run-1 pool (both launch hearts): Kindred offers the one other launch weapon; v2 starter set alone: nothing to offer (skipped)
  const r1 = sim(['rs_start', 'gt_ghost_wolves', 'gt_holy_orbit']);
  assert.deepEqual(r1.offer.cards.map((c) => c.weaponId), ['holy_orbit']);
  assert.equal(sim(['rs_start']).state, 'running');
  // a pending level-up waits behind the start offers and opens after them
  const t = sim(['rs_bless']);
  t.pending = 1; pickAll(t);
  assert.equal(t.state, 'levelup'); assert.equal(t.offer.start, undefined);
});

test('T6 Chosen Moment: rules hp30 / hp50 / crowd25 / off; whitelisted; only when owned; Last Whistle alone keeps 30%', () => {
  assert.deepEqual(AUTO_RULES, AUTO_RULE_NAMES);
  const mk = (rule, ids = ['rs_autoset']) => sim(ids, { autoRule: rule });
  assert.equal(mk('hp50').autoRule, 'hp50');
  assert.equal(mk('evil()').autoRule, 'hp30', 'unknown rule -> the safe default');
  assert.equal(mk('hp50', []).autoRule, null, 'not owned: no rule at all');
  const s = mk('hp50');
  s.player.hp = s.player.maxHp * 0.45; s.ability.cdLeft = 0;
  assert.equal(s.autoFires(), true);
  s.setAutoRule('off'); assert.equal(s.autoFires(), false);
  s.setAutoRule('__proto__'); assert.equal(s.autoRule, 'off');
  s.setAutoRule('crowd25');
  s.player.hp = s.player.maxHp;
  for (let i = 0; i < AUTO_CROWD - 1; i++) s.spawnEnemy('wolf', s.player.x + 30, s.player.y + (i % 5));
  assert.equal(s.autoFires(), false);
  s.spawnEnemy('wolf', s.player.x - 30, s.player.y);
  assert.equal(s.autoFires(), true);
  s.spawnEnemy('wolf', s.player.x + AUTO_NEAR + 50, s.player.y);
  s.ability.cdLeft = 5; assert.equal(s.autoFires(), false, 'never while cooling down');
  const n = sim([]); n.setAutoRule('hp50'); assert.equal(n.autoRule, null, 'cannot be switched on without the lantern');
  const old = sim(['sp_auto']); assert.equal(old.autoRule, null); assert.equal(old.tfx.autoHp, 0.3);
});

test('T6 settings.autoRule is sanitised (whitelist, default hp30)', () => {
  assert.equal(defaultSave().settings.autoRule, 'hp30');
  for (const bad of ['', 'HP50', 'hp30 ', null, 7, {}, ['hp50'], '__proto__', '<img onerror=x>']) assert.equal(sanitize({ ...defaultSave(), settings: { autoRule: bad } }).settings.autoRule, 'hp30', String(bad));
  for (const ok of AUTO_RULE_NAMES) assert.equal(sanitize({ ...defaultSave(), settings: { autoRule: ok } }).settings.autoRule, ok);
});

// ------------------------------------------------------------------ tier-bought hooks (lanterns still pending)
test('T6 hooks for Fourth Card / Fifth Hook (lanterns pending): offer size and slots follow the perks; Twilight aggregate gives none', () => {
  const s = new Sim({ data, characterId: 'wren', seed: 2, tree: { perks: { offerSize: 1, weaponSlot: 1 } } });
  assert.deepEqual([s.offerSize, s.weaponSlots], [data.balance.offerSize + 1, data.balance.weaponSlots + 1]);
  assert.equal(generateOffer(s.cardCtx, createRng(1)).cards.length, data.balance.offerSize + 1);
  const f = new Sim({ data, characterId: 'wren', seed: 2, tree: { perks: { offerSize: 99, weaponSlot: -4 } } });
  assert.deepEqual([f.offerSize, f.weaponSlots], [data.balance.offerSize + 2, data.balance.weaponSlots], 'forged values clamp to 0..2');
  assert.equal(startOffer({ ...s.cardCtx, weapons: Array.from({ length: s.weaponSlots }, () => newWeapon('ghost_wolves', data.weapons.ghost_wolves)) }, createRng(1), 'kindred').length, 0, 'no free card when the slots are full');
});

// ------------------------------------------------------------------ UI
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
const textOf = (n) => { let t = n._text; n.children.forEach((c) => { t += ' ' + textOf(c); }); return t; };

test('T6 UI: start offers carry their own title; favour cards read FAVOUR x1.5; Second Sight prints one dimmed text line', () => {
  const doc = fakeDoc(), host = doc.createElement('div');
  const v = new OfferView(doc, host, { pick() {}, reroll() {}, banish() {} });
  const s = sim(['cd_favour', 'gt_ghost_wolves', 'gt_holy_orbit']);
  v.render(s, data);
  assert.ok(textOf(host).includes(START_COPY.favour[0]) && textOf(host).includes('MARK ONE SPIRIT'));
  assert.equal(host.attrs['aria-label'], 'Favoured Spirit: choose one');
  const fc = s.offer.cards[0];
  assert.equal(cardClass(fc), 'favour');
  const m = cardModel(fc, data);
  assert.deepEqual([m.tag, m.num, m.pips.total], ['FAVOUR', '×1.5', 0]);
  assert.ok(cardLabel(m).startsWith('Favour.'));
  const p = sim(['cd_peek']);
  p.xp = p.xpNeeded; p.checkLevelUp();
  v.render(p, data);
  const line = peekLine(p.peekNext, data);
  assert.ok(line.length > 0 && line.length <= 120);
  assert.ok(textOf(host).includes(line) && textOf(host).includes('Next'));
  assert.equal(peekLine([{ kind: 'weapon', weaponId: 'spirit_bolts', title: '<b>x</b>'.repeat(80) }], data).length <= 120, true, 'clamped (and only ever set through textContent)');
  assert.equal(peekLine('nope', data), '');
});

test('T6 progress readouts: the new gold-only entries have no condition; the remaining conditions still read', () => {
  assert.deepEqual(conditionProgress(def.nodes.bs_wolf1.unlock, {}, def, data), { done: true, frac: 1, lines: [] });
  const p = conditionProgress(def.nodes.bs_wolf2.unlock, { killsByEnemy: { wolf: 1000 } }, def, data);
  assert.deepEqual([p.done, p.lines[0].cur, p.lines[0].goal], [false, 1000, 4000]);
});
