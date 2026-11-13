// Lucinda (option A Ember Horns) + Ophimber (option 1 Hatchling) final art, LOCKED 2026-11-13 (docs/design/lucinda-ophimber-look-v1.md): reserved-colour rule on both palettes,
// the pure follow / perch / expression / cast-arm logic, the atlas lists, no placeholder flag left, she/her everywhere, render-only (no sim import), still hidden.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { data } from './helpers.mjs';
import { RESERVED, dist } from '../src/meta/cosmetics.js';
import { LP, BODY_COLOURS, LUCINDA_FRAMES, L_EXPR, L_ANCHOR, L_FLAT } from '../src/gfx/lucindaart.js';
import { OP, OPH_BODY_COLOURS, OPHIMBER_FRAMES, O_BB } from '../src/gfx/ophimberart.js';
import { PET, TROT_FRAMES, newPet, petStep, petFrame, pickLucindaExpr, castArm } from '../src/gfx/lucindapet.js';

const ENEMY = ['#5b4f63', '#8a7d92', '#3e3a58', '#6c6890', '#4e3b34'];
const txt = (f) => readFileSync(new URL('../' + f, import.meta.url), 'utf8');

test('RESERVED-COLOUR check: no Lucinda or Ophimber body colour sits on a reserved colour; the big colours stay clear of enemy bodies', () => {
  for (const [P, L, who] of [[LP, BODY_COLOURS, 'Lucinda'], [OP, OPH_BODY_COLOURS, 'Ophimber']]) {
    for (const k of L) for (const r of RESERVED) assert.ok(dist(P[k], r) >= 24, `${who}.${k} ${P[k]} too close to reserved ${r}`);
  }
  for (const k of ['cloak', 'tunic', 'skin', 'scale', 'hair', 'horn', 'fin']) for (const e of ENEMY) assert.ok(dist(LP[k], e) >= 40, `Lucinda.${k} ${LP[k]} vs enemy ${e}: ${dist(LP[k], e).toFixed(1)}`);
  for (const k of OPH_BODY_COLOURS) for (const e of ENEMY) assert.ok(dist(OP[k], e) >= 60, `Ophimber.${k} vs enemy ${e}`); // she is the small bright thing: well clear
  assert.equal(LP.accent, '#ef8a5a'); // the locked rose-gold accent
});

test('atlas lists: Lucinda parts + 5 heads, Ophimber poses; unique names; boxes contain their pivots', () => {
  const names = LUCINDA_FRAMES.map((f) => f.name);
  assert.deepEqual(names.filter((n) => n.startsWith('l_head_')).sort(), Object.keys(L_EXPR).map((e) => `l_head_${e}`).sort());
  for (const n of ['l_tail', 'l_boot', 'l_body', 'l_arm']) assert.ok(names.includes(n), n);
  assert.equal(new Set(names).size, names.length);
  for (const f of LUCINDA_FRAMES) { assert.ok(f.bb[0] < f.pv[0] && f.pv[0] < f.bb[2] && f.bb[1] < f.pv[1] && f.pv[1] < f.bb[3] + 0.001, `${f.name} pivot inside its box`); assert.equal(typeof f.draw, 'function'); }
  const on = OPHIMBER_FRAMES.map((f) => f.name);
  for (const n of [...TROT_FRAMES, 'o_stand', 'o_sit0', 'o_sit1', 'o_sleep', 'o_fly0', 'o_fly1']) assert.ok(on.includes(n), n);
  assert.equal(new Set(on).size, on.length);
  assert.ok(O_BB[0] < 0 && O_BB[2] > 0 && O_BB[1] < 0 && O_BB[3] >= 0, 'her feet origin is inside every pose box');
  assert.ok(L_FLAT.x0 < -80 && L_FLAT.x0 + L_FLAT.w > 70, 'the flat sprite holds the tail and the flame');
  assert.ok(L_ANCHOR.perch[0] < 0 && L_ANCHOR.perch[1] < -40, 'Ophimber perches on her back shoulder');
});

test('Ophimber follow: 26 units behind with a 0.15 s lag, never ahead; perches after 0.8 s still; leaves the shoulder when she moves again', () => {
  assert.equal(PET.behind, 26); assert.equal(PET.lag, 0.15); assert.equal(PET.still, 0.8);
  const st = newPet(); const sx = (x) => x - 7; const sy = -12; // shoulder point of a hero at x
  let x = 100; const y = 50; const dt = 1 / 60;
  petStep(st, x, y, 1, dt, 0, sx(x), sy, false, false); // first call places her on the shoulder
  assert.equal(st.perched, true);
  for (let i = 0; i < 90; i++) { x += 80 * dt; petStep(st, x, y, 1, dt, 80 * dt, sx(x), sy, false, false); }
  assert.equal(st.perched, false, 'trotting while she walks');
  const behind = x - st.x; assert.ok(behind > 26 && behind < 26 + 80 * 0.15 + 4, `steady lag: ${behind.toFixed(1)}`); // 26 + v * 0.15 = 38 at 80 u/s
  assert.ok(st.dir === 1 && st.x < x, 'behind her facing');
  assert.ok(TROT_FRAMES.includes(petFrame(st, false, 1)));
  for (let i = 0; i < 40; i++) petStep(st, x, y, 1, dt, 0, sx(x), sy, false, false); // 0.67 s still: not perched yet
  assert.equal(st.perched, false); assert.equal(petFrame(st, false, 1), 'o_stand');
  for (let i = 0; i < 90; i++) petStep(st, x, y, 1, dt, 0, sx(x), sy, false, false);
  assert.equal(st.perched, true); assert.ok(['o_sit0', 'o_sit1'].includes(petFrame(st, false, 1)));
  assert.ok(Math.hypot(st.x - sx(x), st.y - sy) < 1.5);
  for (let i = 0; i < 20; i++) { x += 80 * dt; petStep(st, x, y, 1, dt, 80 * dt, sx(x), sy, false, false); }
  assert.equal(st.perched, false, 'steps off the shoulder when she moves');
  const l = newPet(); petStep(l, 0, 0, -1, dt, 0, 7, -12, false, false); x = 0;
  for (let i = 0; i < 120; i++) { x -= 80 * dt; petStep(l, x, 0, -1, dt, 80 * dt, x + 7, -12, false, false); }
  assert.ok(l.x > x && l.dir === -1, 'behind her when she faces left');
});

test('Ophimber in Calm sleeps on the shoulder (no follow, no hop); snap puts her back after the Rise; hostile numbers never poison her', () => {
  const st = newPet(); const dt = 1 / 60;
  petStep(st, 0, 0, 1, dt, 0, -7, -12, true, false);
  for (let i = 0; i < 60; i++) petStep(st, i * 1.3, 0, 1, dt, 1.3, i * 1.3 - 7, -12, true, false);
  assert.ok(Math.hypot(st.x - (59 * 1.3 - 7), st.y + 12) < 1.5, 'rides the shoulder'); assert.equal(st.hop, 0); assert.equal(st.lift, 0);
  assert.equal(petFrame(st, true, 3), 'o_sleep');
  const w = newPet(); petStep(w, 0, 0, 1, dt, 0, -7, -12, false, false); petStep(w, 500, 0, 1, dt, 500, 493, -12, false, true);
  assert.equal(w.perched, true); assert.equal(w.x, 493);
  for (const bad of [NaN, Infinity, -Infinity]) { petStep(w, bad, bad, 1, dt, bad, bad, bad, false, false); petStep(w, 0, 0, 1, dt, 0, -7, -12, false, false); assert.ok(Number.isFinite(w.x) && Number.isFinite(w.y), String(bad)); }
  const z = newPet(); petStep(z, 0, 0, 1, 0, 0, -7, -12, false, false); petStep(z, 5, 0, 1, 0, 5, -2, -12, false, false); assert.ok(Number.isFinite(z.x)); // zero dt
});

test('expression + cast arm: hurt beats cast, death beats all; the arm rises in 0.2 s, holds to settle, drops in 0.4 s', () => {
  assert.equal(pickLucindaExpr(false, false, false, false), 'kind'); assert.equal(pickLucindaExpr(false, false, false, true), 'blink');
  assert.equal(pickLucindaExpr(false, true, true, true), 'hurt'); assert.equal(pickLucindaExpr(false, false, true, false), 'cast'); assert.equal(pickLucindaExpr(true, true, true, true), 'death');
  for (const e of ['kind', 'blink', 'hurt', 'cast', 'death']) assert.ok(L_EXPR[e]);
  assert.equal(castArm(-1, 2.4), 0); assert.equal(castArm(0, 2.4), 0); assert.equal(castArm(0.2, 2.4), 1); assert.equal(castArm(2.0, 2.4), 1);
  assert.ok(castArm(2.6, 2.4) > 0 && castArm(2.6, 2.4) < 1); assert.equal(castArm(3, 2.4), 0); assert.equal(castArm(NaN, 2.4), 0); assert.equal(castArm(1, NaN), 1);
});

test('still hidden, no placeholder left, she/her everywhere, render-only art (never imports the sim)', () => {
  const h = data.hiddenCharacters.hearthwarden;
  assert.equal(h.unreleased, true); assert.equal(h.placeholder, undefined); assert.ok(!data.characters.hearthwarden, 'not selectable');
  const him = /\b(he|him|his|himself)\b/i;
  for (const f of ['src/gfx/ophimberart.js', 'src/gfx/lucindaart.js', 'src/gfx/lucindarig.js', 'src/gfx/lucindapet.js', 'src/gfx/risefx.js', 'src/sim/rise.js']) {
    const lines = txt(f).split('\n').filter((l) => him.test(l) && /ophimber|dragon|pet\b|hatchling/i.test(l));
    assert.deepEqual(lines, [], `${f}: Ophimber is a she`);
  }
  assert.ok(!him.test(h.blurb + ' ' + h.ability.desc + ' ' + JSON.stringify(h.bondPerks)), 'character text uses she / her');
  for (const f of ['src/gfx/lucindaart.js', 'src/gfx/ophimberart.js', 'src/gfx/lucindapet.js', 'src/gfx/lucindarig.js']) assert.ok(!/from '\.\.\/sim|sim\/Sim/.test(txt(f)), `${f} never imports the sim`);
  assert.ok(!/opha|ophb|PLACEHOLDER/.test(txt('src/gfx/risefx.js')), 'the old placeholder blob is gone');
});
