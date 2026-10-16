// E1: stat hints are templates over the real per-rank numbers; every hint renders with the data's own values.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { hintText, statValue, formatValue, BLEED_RATE } from '../src/sim/cards.js';
import { CLAMP, cardModel } from '../src/ui/cardview.js';

const weapons = JSON.parse(readFileSync(new URL('../src/data/weapons.json', import.meta.url)));
const evolutions = JSON.parse(readFileSync(new URL('../src/data/evolutions.json', import.meta.url)));
const data = { weapons, evolutions };
const num = (t) => (t.match(/-?\d+(\.\d+)?/g) || []).map(Number);

test('E1 every stat hint at every rank: fits the card clamp, no leftover tokens, and quotes the real numbers', () => {
  for (const [wid, def] of Object.entries(weapons)) {
    for (const [key, s] of Object.entries(def.stats)) {
      assert.ok(s.name.length <= CLAMP.title, `${wid}.${key} name`);
      for (let r = 0; r < 5; r++) {
        const t = hintText(def, key, r);
        assert.ok(t.length > 0 && t.length <= CLAMP.desc, `${wid}.${key}@${r} length ${t.length}: ${t}`);
        assert.ok(!/[{}]/.test(t) && !/undefined|NaN/.test(t), `${wid}.${key}@${r}: ${t}`);
        if (s.hint.includes('{old}')) {
          assert.ok(t.includes(formatValue(s.fmt, statValue(def, key, r))), `${wid}.${key}@${r} old: ${t}`);
          assert.ok(t.includes(formatValue(s.fmt, statValue(def, key, r + 1))), `${wid}.${key}@${r} new: ${t}`);
        }
        // the percent token matches the real change
        if (s.hint.includes('{upct}')) {
          const cur = statValue(def, key, r), nxt = statValue(def, key, r + 1);
          assert.ok(t.includes(`${Math.round(((nxt - cur) / cur) * 100)}%`) && !t.includes('+'), `${wid}.${key}@${r} upct: ${t}`);
        }
        if (s.hint.includes('{pct}')) {
          const cur = statValue(def, key, r), nxt = statValue(def, key, r + 1);
          assert.ok(t.includes(`+${Math.round(((nxt - cur) / cur) * 100)}%`), `${wid}.${key}@${r} pct: ${t}`);
        }
      }
      if (/\{\w+\}/.test(s.hint)) {
        // templated: the numbers follow the data
        const alt = { ...def, stats: { ...def.stats, [key]: { ...s, base: s.base + 7 } } };
        assert.notEqual(hintText(alt, key, 1), hintText(def, key, 1), `${wid}.${key} is data-driven`);
      } else {
        // plain wording: it must still be true of the data
        if (/one more/i.test(s.hint)) assert.equal(s.perRank, 1, `${wid}.${key} says one more`);
        if (/harder/i.test(s.hint)) assert.ok(s.perRank > 0, `${wid}.${key} says harder`);
      }
    }
  }
});

test('E1 bleed hint quotes the sim bleed rate; card view uses the same text', () => {
  assert.equal(BLEED_RATE, 0.35);
  assert.ok(hintText(weapons.ghost_wolves, 'duration', 0).includes('35%'));
  const card = { kind: 'stat', weaponId: 'holy_orbit', stat: 'radius', rank: 2, nextRank: 3, maxRank: 5 };
  assert.equal(cardModel(card, data).desc, hintText(weapons.holy_orbit, 'radius', 2));
});

test('E1 honest text: no heal / burn claims the sim does not keep', () => {
  assert.ok(!/heal/i.test(evolutions.sanctum_halo.desc + evolutions.sanctum_halo.sub));
  assert.ok(!/burn anything/i.test(weapons.holy_orbit.desc));
});
