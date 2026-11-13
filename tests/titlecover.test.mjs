// Title cover (Lantern Vigil): locked tune values, hero choice from a hostile loadout, Calm / low-power rules, bloom + parallax maths, contrast rule,
// and the front-door promises (the cover never swallows a key, never gates Continue, never writes a save, no new deps or image files).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { data } from './helpers.mjs';
import * as L from '../src/gfx/titlelogic.js';

const R = (p) => new URL('../' + p, import.meta.url);
const read = (p) => readFileSync(R(p), 'utf8');
const lock = JSON.parse(read('docs/design/title-tune-v1.json'));

test('tune: the built values equal Matt\'s locked sandbox Copy settings (title-tune-v1.json)', () => {
  for (const [k, v] of Object.entries(lock.tune)) assert.equal(L.TUNE[k], v, `tune.${k}`);
  assert.deepEqual(Object.keys(L.TUNE).sort(), Object.keys(lock.tune).sort(), 'no extra or missing keys');
  const depth = Object.values(lock.layerDepth);
  assert.deepEqual([...L.LAYER_DEPTH], depth, 'per-layer depth, back to front');
  assert.equal(L.LAYER_DEPTH.length, 7);
  assert.equal(L.TUNE.grain, 0, 'no grain');
  assert.equal(L.TUNE.bloomT, 1.45);
  assert.ok(Object.isFrozen(L.TUNE) && Object.isFrozen(L.LAYER_DEPTH), 'frozen: nothing can tune it at run time');
});

test('cover hero: last-played, known and awake; Wren on first launch; hostile loadouts read as Wren', () => {
  const known = data.characters;
  const awake = (ids) => (id) => ids.includes(id);
  assert.equal(L.coverHeroId('elias', known, awake(['wren', 'elias'])), 'elias');
  assert.equal(L.coverHeroId('wren', known, awake(['wren'])), 'wren');
  assert.equal(L.coverHeroId(undefined, known, awake(['wren'])), 'wren', 'first launch');
  assert.equal(L.coverHeroId('elias', known, awake(['wren'])), 'wren', 'a sleeping hero is not shown');
  for (const bad of ['__proto__', 'constructor', 'toString', 'hasOwnProperty', 'ELIAS', ' elias', 'elias\0', 'elias ', '', null, 7, {}, [], ['elias'], { hero: 'elias' }, true, Symbol('x')])
    assert.equal(L.coverHeroId(bad, known, () => true), 'wren', 'hostile ' + String(typeof bad === 'symbol' ? 'symbol' : JSON.stringify(bad)));
  assert.equal(L.coverHeroId('elias', null, () => true), 'wren', 'no character table');
  assert.equal(L.coverHeroId('elias', { wren: {} }, () => true), 'wren', 'unknown to the data');
  assert.equal(L.coverHeroId('elias', known, () => { throw new Error('boom'); }), 'wren', 'a throwing check never breaks the title');
  const proto = Object.create({ elias: {} });
  assert.equal(L.coverHeroId('elias', proto, () => true), 'wren', 'inherited keys do not count');
  assert.ok(L.COVER_HEROES.every((id) => Object.hasOwn(known, id)), 'every cover hero exists in characters.json');
});

test('flame colours: only #rrggbb is accepted, anything else is the Hearth flame', () => {
  const f = data.cosmetics.flames;
  for (const id of Object.keys(f)) assert.deepEqual(L.coverFlame(f[id].glow, f[id].core), { glow: f[id].glow, core: f[id].core }, id);
  for (const bad of [['red', '#fff1c8'], ['#fff', '#fff1c8'], ['url(x)', 'expression(1)'], ['#gggggg', '#ffffff'], [null, null], [{}, []], ['#ffcf7a;x', '#fff1c8'], [7, 8]])
    assert.deepEqual(L.coverFlame(...bad), { ...L.HEARTH });
  assert.deepEqual(L.HEARTH, { glow: f.hearth.glow, core: f.hearth.core }, 'the default flame matches cosmetics.json');
});

test('layout: portrait / landscape / desktop split and the locked hero placement per layout', () => {
  assert.equal(L.coverMode(390, 844), 'portrait'); assert.equal(L.coverMode(844, 390), 'landscape'); assert.equal(L.coverMode(1280, 720), 'desktop');
  assert.equal(L.coverMode(768, 1024), 'desktop', 'a tablet is not a phone layout');
  assert.deepEqual(L.heroPos('desktop'), { s: 0.5, x: 0.68, y: 0.84 });
  assert.deepEqual(L.heroPos('portrait'), { s: 0.36, x: 0.5, y: 0.62 });
  assert.deepEqual(L.heroPos('landscape'), { s: 0.6, x: 0.76, y: 0.88 });
  assert.ok(L.bakeMargin(390) >= 40 && L.bakeMargin(1280) >= L.bakeMargin(390));
});

test('entry bloom: 1.45 s eased, any key or tap skips it, Calm is a quick fade', () => {
  assert.equal(L.bloomProgress(0, { started: false }), 0, 'not started until the layers are baked');
  assert.equal(L.bloomProgress(0), 0);
  assert.equal(L.bloomProgress(1450), 1); assert.equal(L.bloomProgress(99999), 1);
  const mid = L.bloomProgress(725); assert.ok(mid > 0.5 && mid < 1, 'eased out');
  assert.equal(L.bloomProgress(10, { skipped: true }), 1, 'skipped = done at once');
  assert.equal(L.bloomProgress(0, { skipped: true, started: false }), 1, 'a key before the bake finishes also skips');
  assert.equal(L.bloomProgress(125, { calm: true }), 0.5, 'Calm: linear 0.25 s fade');
  assert.equal(L.bloomProgress(250, { calm: true }), 1);
});

test('Calm removes parallax, drift, flicker and motes; low power cuts motes; Battery saver and baking halve the frame rate', () => {
  assert.deepEqual(L.layerShift(4, 1, 1, { calm: true, margin: 60 }), [0, 0]);
  assert.deepEqual(L.driftTarget(5, { calm: true }), [0, 0]);
  assert.equal(L.flicker(3.3, { calm: true }), 1);
  assert.equal(L.moteCount({ calm: true }), 0);
  const n = L.moteCount({}), low = L.moteCount({ low: true }), saver = L.moteCount({ saver: true });
  assert.equal(n, 60); assert.ok(saver < low && low < n && saver > 0);
  assert.equal(L.frameGapMs({}), 0); assert.equal(L.frameGapMs({ saver: true }), 33); assert.equal(L.frameGapMs({ baking: true }), 33);
  const f = [3.1, 8.9, 0.2].map((t) => L.flicker(t, {}));
  assert.ok(f.every((v) => v >= 0.93 && v <= 1.07), 'flicker stays within a few percent');
});

test('parallax: per-layer depth, clamped to the bake margin so no edge ever shows', () => {
  const far = L.layerShift(1, 1, 0, { margin: 200 }), mid = L.layerShift(2, 1, 0, { margin: 200 }), hero = L.layerShift(4, 1, 0, { margin: 200 });
  assert.ok(Math.abs(far[0]) > Math.abs(mid[0]), 'far trees (depth 2.5) move more than mid trees (0.5), as locked');
  assert.equal(far[0], hero[0], 'hero and far trees share depth 2.5');
  assert.ok(Math.abs(L.layerShift(1, 1, 1, { margin: 40 })[0]) <= 39 && Math.abs(L.layerShift(1, -1, -1, { margin: 40 })[1]) <= 39);
  const d = L.driftTarget(1.234); assert.ok(Math.abs(d[0]) <= L.TUNE.drift && Math.abs(d[1]) <= L.TUNE.drift * 0.4 + 1e-9);
});

test('text contrast rule (the sandbox probe): cream text needs 4.5:1 against the lightest 5% of the art behind it', () => {
  const dark = new Uint8Array(4 * 400).fill(24); for (let i = 3; i < dark.length; i += 4) dark[i] = 255;
  assert.ok(L.lightestContrast(dark).contrast >= 4.5, 'dark art passes');
  const bright = new Uint8Array(4 * 400).fill(230); for (let i = 3; i < bright.length; i += 4) bright[i] = 255;
  assert.ok(L.lightestContrast(bright).contrast < 4.5, 'bright art fails');
  assert.equal(L.lightestContrast(new Uint8Array(0)).contrast, 21, 'empty region is not a failure');
  assert.ok(L.contrast('#fff3dc', '#000000') > 15);
});

test('seeded rng is deterministic (the picture is the same every launch)', () => {
  const a = L.rng(13), b = L.rng(13); for (let i = 0; i < 20; i++) assert.equal(a(), b());
});

test('security + front door: no innerHTML, no network, no storage, never swallows or gates input, no new image files or deps', () => {
  const files = ['src/gfx/titlecover.js', 'src/gfx/titlepaint.js', 'src/gfx/titlelogic.js'];
  for (const f of files) {
    const s = read(f);
    assert.ok(!/innerHTML|outerHTML|insertAdjacentHTML|document\.write|eval\(|new Function|\bfetch\(|XMLHttpRequest|WebSocket|localStorage|sessionStorage|indexedDB|\.src\s*=|new Image\(/.test(s), f + ' touches nothing risky');
    assert.ok(!/preventDefault|stopPropagation|stopImmediatePropagation/.test(s), f + ' never swallows an event');
    assert.ok(!/from '(?!\.\/)[^']+'/.test(s), f + ' imports only its own gfx modules');
  }
  const cover = read('src/gfx/titlecover.js');
  assert.ok(/addEventListener\('keydown', this\.onSkip, true\)/.test(cover) && /addEventListener\('pointerdown', this\.onSkip, true\)/.test(cover), 'any key or tap skips the bloom');
  assert.ok(/this\.onSkip = \(\) => this\.skip\(\)/.test(cover), 'the skip handler returns nothing (never cancels a press)');
  assert.ok(/visibilitychange/.test(cover) && /document\.hidden/.test(cover), 'pauses when the tab is hidden');
  assert.ok(/destroy\(\)/.test(cover) && /disconnect\(\)/.test(cover), 'tears everything down');
  assert.ok(!/app\.save|this\.save\b|\.notes\b|\.gold\b|\.shards\b|setItem/.test(cover.replace(/\/\/.*$/gm, '')), 'the cover never reads or writes the save');
  const ui = read('src/ui/ui.js');
  const i = ui.indexOf('this.mountCover(el, t, h);'), j = ui.indexOf("t.begin.focus({ preventScroll: true });", i);
  assert.ok(i > 0 && j > i && j - i < 200, 'Continue (begin) keeps the focus right after the cover mounts');
  assert.ok(/mountCover\(el, t, h\) \{[\s\S]*?try \{[\s\S]*?catch \(e\) \{ this\.dropCover\(\); \}/.test(ui), 'a cover failure falls back to the plain title');
  assert.ok(/if \(name === 'start' && this\.cover\) this\.dropCover\(\);/.test(ui), 'leaving the title stops the cover');
  assert.ok(/titleCover: \(\) => this\.titleCover\(\)/.test(read('src/app.js')));
  const css = read('src/ui/titlecover.css');
  assert.ok(!/url\(/.test(css) && !/@import/.test(css), 'css loads nothing');
  assert.ok(!existsSync(R('src/gfx/title.png')) && !existsSync(R('src/gfx/title.webp')), 'no image files');
  const pkg = JSON.parse(read('package.json')); assert.deepEqual(Object.keys(pkg.dependencies), ['phaser'], 'no new dependency'); assert.deepEqual(Object.keys(pkg.devDependencies), ['vite']);
});

test('title DOM (fake DOM, as before) is unchanged by the cover: it only adds classes from ui.js', async () => {
  const t = read('src/ui/title.js');
  assert.ok(!/titlecover|TitleCover|canvas/.test(t), 'title.js stays pure DOM text (Node-testable)');
});
