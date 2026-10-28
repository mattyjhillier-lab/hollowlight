// Evolution explanation text: one source (data.evolutions[id].desc) shown on the pick card, the Almanac entry (found only) and the tree lantern.
import test from 'node:test';
import assert from 'node:assert/strict';
import { data, treeDef } from './helpers.mjs';
import { cardModel, CLAMP } from '../src/ui/cardview.js';
import { goldCards } from '../src/sim/cards.js';
import { almanac } from '../src/meta/codex.js';
import { defaultSave, sanitize } from '../src/save/schema.js';
import { MARK_AMP, MARK_TIME } from '../src/sim/Sim.js';
import { readFileSync } from 'node:fs';

const evos = Object.entries(data.evolutions);

test('every evolution has a plain description under the card clamp, with no recipe stat named', () => {
  assert.equal(evos.length, 15);
  for (const [id, e] of evos) {
    assert.ok(typeof e.desc === 'string' && e.desc.trim().length >= 20, id);
    assert.ok(e.desc.length <= CLAMP.desc, `${id} ${e.desc.length}`);
    const w = data.weapons[e.weapon];
    for (const s of e.pair) assert.ok(!new RegExp(`\b${w.stats[s].name}\b`, 'i').test(e.desc), `${id} names recipe stat ${s}`);
  }
});

test('pick card renders the description (cardModel carries it, no recipe)', () => {
  for (const [id, e] of evos) {
    const w = { id: e.weapon, ranks: Object.fromEntries(Object.keys(data.weapons[e.weapon].stats).map((k) => [k, 5])) };
    const gold = goldCards({ weapons: [w], data, unlockedEvolutions: new Set([id]) }).find((c) => c.evoId === id);
    assert.ok(gold, id);
    const m = cardModel(gold, data);
    assert.equal(m.desc, e.desc);
  }
});

test('data-driven numbers in descriptions match the data', () => {
  const t = data.evolutions.thunder_judgment;
  assert.ok(t.desc.includes(`${t.tune.cd} s`) && t.desc.includes(`${t.tune.cap} nearest`) && t.desc.includes(`${t.tune.chains} times`));
  const d = data.evolutions.dive_bombers.desc;
  assert.ok(d.includes(`${Math.round(MARK_AMP * 100)}%`) && d.includes(`${MARK_TIME} s`));
});

test('Almanac shows the description only once the evolution is found', () => {
  const none = almanac(sanitize(defaultSave(1)), data, treeDef);
  for (const w of none.spirits) for (const e of w.evos) assert.equal(e.desc, undefined);
  const s = sanitize({ ...defaultSave(1), stats: { ...defaultSave(1).stats, evolved: { howling_legion: 2 } } });
  const hl = almanac(s, data, treeDef).spirits.find((w) => w.id === 'ghost_wolves').evos.find((e) => e.id === 'howling_legion');
  assert.equal(hl.desc, data.evolutions.howling_legion.desc);
});

test('tree evolution lanterns: gates unlock real evolutions; the lantern panel reads the same text (textContent only)', () => {
  const gates = Object.values(treeDef.nodes).filter((n) => (n.effects || []).some((f) => f && f.unlock === 'evolution'));
  assert.equal(gates.length, evos.filter(([, e]) => e.treeGate).length);
  for (const n of gates) { const f = n.effects.find((x) => x.unlock === 'evolution'); assert.ok(data.evolutions[f.id] && data.evolutions[f.id].desc, n.id); }
  const src = readFileSync(new URL('../src/ui/treescreen.js', import.meta.url), 'utf8');
  assert.ok(src.includes('this.pEvo.textContent'));
  assert.ok(!/pEvo\.innerHTML/.test(src));
  const cx = readFileSync(new URL('../src/ui/codexui.js', import.meta.url), 'utf8');
  assert.ok(cx.includes("el('p', 'cx-desc', e.desc || '')"));
});
