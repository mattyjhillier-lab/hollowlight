// Content pipeline scaffold: scripts/new-content.mjs is print-only, rejects bad / existing ids, and its skeletons match the real data shape.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { build, KINDS, ID_RE } from '../scripts/new-content.mjs';
import { data } from './helpers.mjs';

const SCRIPT = fileURLToPath(new URL('../scripts/new-content.mjs', import.meta.url));
const D = { ...data, weapons: { ...data.weapons, zz_w: { stats: { a: {}, b: {}, c: {}, d: {} } } } };
const keysOf = (o) => Object.keys(o).sort().join();

test('NC every kind builds a skeleton whose keys match a real entry', () => {
  const real = { weapon: data.weapons.ghost_wolves, evolution: data.evolutions.dire_alpha, hero: data.characters.wren, enemy: data.enemies.wolf, chapter: data.chapters.cursed_forest, blessing: data.blessings.items.kindled_spirits };
  for (const k of KINDS) {
    const r = build(k, 'zz_new', k === 'evolution' ? { weapon: 'zz_w' } : {}, D);
    assert.ok(r.checklist.length >= 5 && r.file.includes('zz_new'), k);
    const s = r.snippet.zz_new;
    assert.ok(s && JSON.parse(JSON.stringify(s)), k);
    const want = Object.keys(real[k]);
    for (const key of keysOf(s).split(',')) if (!['sites', 'fight', 'ai', 'boss', 'fixed', 'codexBit', 'tree'].includes(key)) assert.ok(want.includes(key) || (k === 'evolution' && key === 'treeGate'), `${k}: unexpected key ${key}`);
  }
});

test('NC evolution skeleton pre-fills the pair from the weapon and refuses a 4th evolution', () => {
  const r = build('evolution', 'zz_evo', { weapon: 'zz_w' }, D);
  assert.deepEqual(r.snippet.zz_evo.pair, ['a', 'b']);
  assert.throws(() => build('evolution', 'zz_evo', { weapon: 'holy_orbit' }, D), /already has 3/);
  assert.throws(() => build('evolution', 'zz_evo', { weapon: 'nope' }, D), /not in weapons/);
});

test('NC bad and existing ids are refused, hostile ids never reach the output', () => {
  for (const bad of ['', 'A', 'a b', '../x', '__proto__', 'x'.repeat(60), 'x;rm', '1abc']) assert.throws(() => build('weapon', bad), /must match/, bad);
  assert.throws(() => build('weapon', 'ghost_wolves'), /already exists/);
  assert.throws(() => build('hero', 'wren'), /already exists/);
  assert.throws(() => build('blessing', 'kindled_spirits'), /already exists/);
  assert.throws(() => build('nope', 'abc'), /kind must be/);
  assert.ok(ID_RE.test('zz_new'));
});

test('NC the script is print-only (no file writes, no src edits) and the CLI works', () => {
  const src = readFileSync(SCRIPT, 'utf8');
  assert.ok(!/writeFileSync|appendFileSync|mkdirSync|rmSync|unlinkSync|renameSync|child_process|eval\(/.test(src.replace(/\/\/.*$/gm, '')), 'no write / exec calls');
  const out = execFileSync(process.execPath, [SCRIPT, 'weapon', 'zz_probe'], { encoding: 'utf8' });
  assert.match(out, /Print-only/);
  assert.match(out, /"zz_probe"/);
  assert.throws(() => execFileSync(process.execPath, [SCRIPT, 'weapon', 'ghost_wolves'], { stdio: 'pipe' }));
});
