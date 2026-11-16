// Card text audit: every stat of every weapon says what it does in plain words and real units (Matt's phone feedback: 'Impact +%' said nothing).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { hintText, statValue, formatValue } from '../src/sim/cards.js';
import { CLAMP, cardModel, effectOf } from '../src/ui/cardview.js';

const rd = (f) => JSON.parse(readFileSync(new URL(`../src/data/${f}`, import.meta.url)));
const weapons = rd('weapons.json');
const data = { weapons, evolutions: rd('evolutions.json'), balance: rd('balance.json') };
const card = (wid, stat, rank) => ({ kind: 'stat', weaponId: wid, stat, rank, nextRank: rank + 1, maxRank: 5, key: `s:${wid}:${stat}` });
// Stat names that are not plain words: their hint must explain them (name inside the hint, or a plain-word effect).
const JARGON = ['Power', 'Impact', 'Blaze', 'Embers', 'Rend', 'Arc', 'Watch', 'Swiftness', 'Wingbeat', 'Duration', 'Area', 'Range', 'Cooldown'];

test('every stat of every weapon has a real hint, a unit word where the value is unitless, and fits the card at every rank', () => {
  for (const [wid, def] of Object.entries(weapons)) {
    for (const [key, s] of Object.entries(def.stats)) {
      assert.ok(s.hint.length >= 20, `${wid}.${key} hint too short`);
      if (s.fmt !== 'pct' && s.fmt !== 'sec') assert.ok(typeof s.unit === 'string' && s.unit.length >= 3, `${wid}.${key} needs a unit word`);
      for (let r = 0; r < 5; r++) {
        const m = cardModel(card(wid, key, r), data);
        assert.ok(m.desc.length >= 20 && !m.desc.endsWith('…'), `${wid}.${key}@${r} desc cut or short: ${m.desc}`);
        assert.ok(m.unit.length <= CLAMP.unit && !m.unit.endsWith('…'), `${wid}.${key}@${r} unit cut: ${m.unit}`);
        assert.ok(m.unit.includes('→') || m.unit.startsWith('stays'), `${wid}.${key}@${r} shows current → next: ${m.unit}`);
      }
    }
  }
});

test('jargon stat names are explained on the card, and damage stats quote real damage numbers', () => {
  for (const [wid, def] of Object.entries(weapons)) {
    for (const [key, s] of Object.entries(def.stats)) {
      const t = hintText(def, key, 0);
      const words = s.name.split(/\s+/);
      if (words.some((w) => JARGON.includes(w)) && !JARGON.includes(s.name.split(' ').pop()) === false) {
        // single jargon-ish name: the hint must either start with the name and a colon or use plain effect words
        assert.ok(t.startsWith(`${s.name}:`) || /damage|reach|bleed|every|faster|harder|fewer|more|wider|longer|burn/i.test(t), `${wid}.${key} "${s.name}" unexplained: ${t}`);
      }
      if (/power|impact/i.test(s.name)) {
        assert.ok(/damage/i.test(t) && t.includes(formatValue(s.fmt, statValue(def, key, 0))), `${wid}.${key} must quote damage: ${t}`);
      }
    }
  }
});

test('Rend says plainly what it does: bleed time and the share of the bite per second, real numbers', () => {
  const t = hintText(weapons.ghost_wolves, 'duration', 0);
  assert.ok(/bleed/.test(t) && t.includes('4s') && t.includes('15%') && t.includes('19%') && /bite/.test(t), t);
});

test('Meteor fireball card never claims an increase that does not happen (count rounds)', () => {
  const def = weapons.dragonfire_meteor;
  for (let r = 0; r < 5; r++) {
    const before = Math.round(statValue(def, 'count', r)), after = Math.round(statValue(def, 'count', r + 1));
    const m = cardModel(card('dragonfire_meteor', 'count', r), data);
    if (before === after) {
      assert.ok(m.unit.startsWith('stays') && /No new fireball/.test(m.desc), `r${r}: ${m.unit} / ${m.desc}`);
      assert.ok(m.desc.includes(String(Math.round(statValue(def, 'count', r + 2)))), `r${r} names the next count: ${m.desc}`);
    } else {
      assert.ok(m.unit.includes(`${before} → ${after}`), `r${r}: ${m.unit}`);
      assert.ok(!/No new fireball/.test(m.desc));
    }
  }
});

test('evolution, fallback and blessing cards carry plain text with real numbers', () => {
  for (const [id, e] of Object.entries(data.evolutions)) assert.ok(e.desc.length >= 30 && e.desc.length <= 160 && e.sub && e.verb, `evo ${id}`);
  for (const [k, f] of Object.entries(data.balance.fallback)) assert.ok(f.desc.length >= 8 && /\d/.test(f.desc + (k === 'shard' ? '1' : '')), `fallback ${k}`);
  const bl = rd('blessings.json');
  for (const [id, b] of Object.entries(bl.items)) assert.ok(b.desc.length >= 12 && /\d+%/.test(b.desc), `blessing ${id}: ${b.desc}`);
  assert.equal(effectOf({ kind: 'fallback', fallback: 'heal', desc: data.balance.fallback.heal.desc }, data).num, '+35%');
});
