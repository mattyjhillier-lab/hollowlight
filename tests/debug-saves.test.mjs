// Security: URL debug params can never write to or alter a real save slot (docs/security-review-v1.md).
// app.js pulls in JSON and DOM modules Node cannot load, so its guards are lifted from the source and run for real.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseParams, KNOWN_KEYS } from '../src/params.js';

const appSrc = readFileSync(new URL('../src/app.js', import.meta.url), 'utf8').split('\r\n').join('\n');
const m = appSrc.match(/\n  isDebugRun\(\) \{[\s\S]*?\n  \},\n/);
assert.ok(m, 'isDebugRun not found in app.js');
const isDebugRun = new Function('return {' + m[0] + '}.isDebugRun')();
const dbg = (q) => isDebugRun.call({ params: parseParams(q) });

// One URL per param that can change a run.
const DEBUG_QUERIES = ['?auto=wren', '?god=1', '?seed=5', '?seed=0', '?t=540', '?rr=3', '?ban=2', '?grant=ghost_wolves:speed=5,power=5:phantom_stampede', '?bless=wider_glow:2', '?meta=full', '?meta=half', '?debug=1', '?tier=hard', '?tier=expert', '?assist=1', '?sites=0'];

test('every run-changing param makes the run a debug run', () => {
  for (const q of DEBUG_QUERIES) assert.equal(dbg(q), true, q);
  assert.equal(dbg(''), false);
  assert.equal(dbg('?bright=clear&touch=1&trails=0&ground=flat&tips=1&life=1'), false, 'pure render/UI flags stay normal runs');
});

test('bankRun and the other save writers are gated by isDebugRun / readOnly in app.js', () => {
  assert.ok(/bankRun\(sim\) \{\n\s*if \(this\.banked \|\| this\.isDebugRun\(\)\) return null;/.test(appSrc), 'bankRun must start with the debug guard');
  assert.ok(/canKeepHints\(\) \{ return !this\.isDebugRun\(\) && !this\.save\.readOnly; \}/.test(appSrc));
  assert.ok(/canKeepCodex\(\) \{ return !this\.isDebugRun\(\) && !this\.save\.readOnly; \}/.test(appSrc), 'codex/titles writes are debug-gated');
  assert.ok(/isDebugRun\(\) \? 0 : bondLevel/.test(appSrc) && /isDebugRun\(\) \? \[\] : keepsakeEligible/.test(appSrc), 'bond / keepsakes are not read into debug runs');
  assert.ok(/!p\.auto && !this\.save\.readOnly && !this\.isDebugRun\(\)\) \{ s0\.notes\.loadout/.test(appSrc), 'loadout memory is not written on debug runs');
  assert.ok(/!this\.save\.readOnly && !this\.isDebugRun\(\)\) this\.save\.saveNow\(\)/.test(appSrc), 'wardrobe save is debug-gated');
});

test('params.js has no storage access at all (parsing a URL can never touch a save)', () => {
  const ps = readFileSync(new URL('../src/params.js', import.meta.url), 'utf8');
  assert.equal(/localStorage|sessionStorage|indexedDB|document\.cookie|\.setItem|\.saveNow/.test(ps), false);
});

test('every known param key is a debug trigger or a pure render/UI flag (new params must be classified)', () => {
  const RENDER_UI = new Set(['ground', 'bright', 'touch', 'style', 'specimen', 'kit', 'mem', 'tips', 'intros', 'life', 'trails', 'props', 'push', 'sway', 'fog', 'motes', 'dawn', 'critters', 'edge', 'corr', 'bloom', 'arc', 'vib', 'night', 'lm', 'nums', 'husks', 'summons']);
  const DEBUG = new Set(['auto', 'seed', 't', 'rr', 'ban', 'grant', 'bless', 'meta', 'tier', 'god', 'debug', 'assist', 'sites']); // sites: ?sites=0 plays without map events (a run-changing switch)
  for (const k of KNOWN_KEYS) assert.ok(RENDER_UI.has(k) || DEBUG.has(k), `param ${k} is unclassified: decide if it can touch a save`);
  for (const k of DEBUG) assert.ok(KNOWN_KEYS.includes(k), k);
});

test('a hostile query yields only null / default values; a prototype-name auto id cannot start a run', () => {
  const q = '?seed=%3Cb%3E&grant=%22%3E&tier=__proto__&meta=constructor';
  const p = parseParams(q);
  for (const k of ['grant', 'tier', 'meta', 'seed']) assert.equal(p[k], null, k);
  assert.equal(dbg(q), false);
  // ?auto=__proto__ passes the id charset, so the lookup in main.js must be an own-property check (never a truthy inherited key).
  assert.ok(readFileSync(new URL('../src/main.js', import.meta.url), 'utf8').includes('Object.hasOwn(app.data.characters, app.params.auto)'));
  assert.equal(dbg('?auto=__proto__'), true, 'and it is a debug run regardless');
});
