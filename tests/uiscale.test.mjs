// DESKTOP D1: UI scale (pure function, save whitelist, build-time viewport-unit pass, CSS contract).
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import './helpers.mjs';
import { uiScaleFor, cleanUiScale, UI_SCALES, UI_SCALE_MAX } from '../src/ui/uiscale.js';
import { scaleViewportCss, unitScalePlugin } from '../scripts/unitscale.mjs';
import { sanitize, defaultSave } from '../src/save/schema.js';
import { safeFrameInset } from '../src/ui/desktop.js';

const css = (f) => readFileSync(new URL('../src/' + f, import.meta.url), 'utf8');

test('auto scale follows window height, 1 .. 1.5, never on phones', () => {
  assert.equal(uiScaleFor({ w: 1440, h: 900 }), 1);
  assert.equal(uiScaleFor({ w: 1280, h: 720 }), 1);
  assert.ok(Math.abs(uiScaleFor({ w: 1920, h: 1001 }) - 1.112) < 0.002);
  assert.equal(uiScaleFor({ w: 2560, h: 1440 }), 1.5);
  assert.equal(uiScaleFor({ w: 3840, h: 2160 }), UI_SCALE_MAX);
  assert.equal(uiScaleFor({ w: 2560, h: 1440, phone: true }), 1);
  assert.equal(uiScaleFor({ w: 844, h: 390 }), 1);
});

test('fixed choices are capped so the virtual window never drops below 960x600', () => {
  assert.equal(uiScaleFor({ w: 1920, h: 1080, pref: '1' }), 1);
  assert.equal(uiScaleFor({ w: 1920, h: 1080, pref: '1.25' }), 1.25);
  assert.equal(uiScaleFor({ w: 1920, h: 1080, pref: '1.5' }), 1.5);
  assert.equal(uiScaleFor({ w: 1280, h: 720, pref: '1.5' }), 1.2); // 720/600
  assert.equal(uiScaleFor({ w: 1024, h: 768, pref: '1.5' }), 1.066); // 1024/960 (floored)
  for (const w of [800, 1024, 1366, 1920, 2560]) for (const h of [500, 600, 768, 1080, 1440]) for (const pref of UI_SCALES) {
    const k = uiScaleFor({ w, h, pref });
    assert.ok(k >= 1 && k <= UI_SCALE_MAX);
    if (k > 1) assert.ok(w / k >= 959.9 && h / k >= 599.9, `${w}x${h} ${pref} -> ${k}`);
  }
});

test('bad input never throws and gives 1', () => {
  for (const [w, h] of [[NaN, 1], [1, NaN], [0, 0], [-5, 100], [Infinity, 100], [undefined, undefined], ['a', 'b']]) assert.equal(uiScaleFor({ w, h }), 1);
  assert.equal(uiScaleFor(), 1);
  assert.equal(uiScaleFor({ w: 1920, h: 1080, pref: '9' }), uiScaleFor({ w: 1920, h: 1080 }));
});

test('save whitelist: only the four values; hostile values fall back to auto', () => {
  assert.equal(defaultSave().settings.uiScale, 'auto');
  for (const v of UI_SCALES) assert.equal(sanitize({ settings: { uiScale: v } }).settings.uiScale, v);
  for (const v of ['2', '', null, 1.5, ['1.5'], { a: 1 }, '__proto__', '1.5 ', 'constructor']) assert.equal(sanitize({ settings: { uiScale: v } }).settings.uiScale, 'auto');
  assert.equal(sanitize({}).settings.uiScale, 'auto');
  assert.equal(cleanUiScale('toString'), 'auto');
});

test('safe frame is measured in the zoomed window', () => {
  // 2560x1080 at k 1.2: virtual 2133x900; inset in virtual px is the real inset / k
  const k = uiScaleFor({ w: 2560, h: 1080 });
  assert.equal(safeFrameInset(2560 / k, 1080 / k), Math.round((2560 / k - 1080 / k * 2.1) / 2));
});

test('unit pass: vh / vw become calc(N * var(--vh1|--vw1)); at-rule conditions and keep-vw lines are untouched; idempotent', () => {
  const cases = [
    ['a { height: 50vh; }', 'a { height: calc(50 * var(--vh1)); }'],
    ['a { width: min(72vw, 360px); }', 'a { width: min(calc(72 * var(--vw1)), 360px); }'],
    ['a { padding: clamp(16px, 3vh, 26px) clamp(16px, 3vw, 28px); }', 'a { padding: clamp(16px, calc(3 * var(--vh1)), 26px) clamp(16px, calc(3 * var(--vw1)), 28px); }'],
    ['a { margin: -2.5vh .5vw; }', 'a { margin: calc(-2.5 * var(--vh1)) calc(.5 * var(--vw1)); }'],
    ['a { width: calc(100vw - 20px); }', 'a { width: calc(calc(100 * var(--vw1)) - 20px); }'],
  ];
  for (const [i, o] of cases) { assert.equal(scaleViewportCss(i), o); assert.equal(scaleViewportCss(o), o, 'idempotent'); }
  for (const keep of ['@media (min-height: 40vh) { a { color: red; } }', '@container (min-width: 50vw) { a { color: red; } }', 'a { --tb-r: calc(100vw / var(--uik)); /* keep-vw */ }', 'a { width: 10px; height: 2em; }', '.v100vh { color: red }', 'a { color: #1vh; }'.replace('#1vh', 'red') ])
    assert.equal(scaleViewportCss(keep), keep, keep);
  assert.equal(scaleViewportCss(7), 7);
  const p = unitScalePlugin();
  assert.equal(p.enforce, 'pre');
  assert.equal(p.transform('a{height:1vh}', '/x/src/ui/a.css').code, 'a{height:calc(1 * var(--vh1))}');
  assert.equal(p.transform('a{height:1vh}', '/x/node_modules/y.css'), null);
});

test('CSS contract: #ui is zoomed by --uik and is its own container; --vh1 / --vw1 divide by the zoom; the row is hidden on phones', () => {
  const d = css('ui/desktop.css');
  assert.match(d, /#ui\s*\{[^}]*zoom:\s*var\(--uik\)[^}]*container-type:\s*inline-size/);
  assert.match(d, /--vh1:\s*calc\(1vh \/ var\(--uik\)\)/);
  assert.match(d, /--vw1:\s*calc\(1vw \/ var\(--uik\)\)/);
  assert.match(d, /html\.phone \.u4-row--desk\s*\{\s*display:\s*none/);
  assert.match(d, /--tb-r:[^;]*\/ var\(--uik, 1\)/);
});

test('every game CSS file survives both passes with balanced braces and no stray viewport units outside conditions', () => {
  for (const f of ['style.css', 'cards.css', 'hud.css', 'ui/results.css', 'ui/title.css', 'ui/charsui.css', 'ui/u4.css', 'ui/kit.css', 'ui/codex.css']) {
    const o = scaleViewportCss(css(f));
    const open = (o.match(/\{/g) || []).length, close = (o.match(/\}/g) || []).length;
    assert.equal(open, close, f);
    const body = o.replace(/\/\*[\s\S]*?\*\//g, '').replace(/@(?:media|container|supports)[^{]*/g, '').split('\n').filter((l) => !l.includes('keep-vw')).join('\n');
    assert.doesNotMatch(body, /[\d.]v[hw]\b/, f);
  }
});
