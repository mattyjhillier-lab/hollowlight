// A2 TEXT SIZE: the build-time font pass (scripts/textscale.mjs), the setting whitelist, the runtime switch, and coverage of every game CSS file.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import './helpers.mjs';
import { scaleFontsCss, textScalePlugin } from '../scripts/textscale.mjs';
import { sanitize, defaultSave, TEXT_SIZES } from '../src/save/schema.js';
import { applyTextSize, TEXT_SCALE } from '../src/ui/textsize.js';

const R = (p) => new URL('../' + p, import.meta.url);

test('A2 pass: absolute font sizes are multiplied by --ts; relative ones and non-font rules are untouched; idempotent', () => {
  const cases = [
    ['a { font-size: 14px; }', 'a { font-size: calc(14px * var(--ts, 1)); }'],
    ['a { font-size: max(14px, calc(14 * var(--hu))) !important; }', 'a { font-size: calc(max(14px, calc(14 * var(--hu))) * var(--ts, 1)) !important; }'],
    ['a { font: 700 13px/1.2 var(--font-ui); }', 'a { font: 700 calc(13px * var(--ts, 1))/1.2 var(--font-ui); }'],
    ['a { font: var(--fw-body) var(--fs-small)/var(--lh-body) var(--font-body); }', 'a { font: var(--fw-body) calc(var(--fs-small) * var(--ts, 1))/var(--lh-body) var(--font-body); }'],
    ['a { font: italic 400 clamp(1rem, 2cqh, 2rem) "X", serif }', 'a { font: italic 400 calc(clamp(1rem, 2cqh, 2rem) * var(--ts, 1)) "X", serif }'],
    ['a { font: 400 18px Georgia }', 'a { font: 400 calc(18px * var(--ts, 1)) Georgia }'],
  ];
  for (const [i, o] of cases) { assert.equal(scaleFontsCss(i), o); assert.equal(scaleFontsCss(o), o, 'idempotent'); }
  for (const keep of ['a { font-size: .8em; }', 'a { font-size: 120%; }', 'a { font: inherit; }', 'a { font-size: inherit }', 'a { font-size: 0 }', '@font-face { font-family: X; }', ':root { --fs-body: max(13px, 1.06rem); --font-body: x; }', 'a { font-weight: 700; font-family: X; width: 14px; }'])
    assert.equal(scaleFontsCss(keep), keep, keep);
  assert.equal(scaleFontsCss(42), 42);
  const p = textScalePlugin();
  assert.equal(p.enforce, 'pre');
  assert.equal(p.transform('a{font-size:12px}', ['C:', 'x', 'src', 'ui', 'a.css'].join(String.fromCharCode(92))).code, 'a{font-size: calc(12px * var(--ts, 1))}');
  assert.equal(p.transform('a{font-size:12px}', '/x/node_modules/y.css'), null, 'only the game CSS');
  assert.equal(p.transform('x', '/x/src/a.js'), null);
});

test('A2 coverage: after the pass, every absolute font size in every game CSS file goes through --ts', () => {
  const files = readdirSync(R('src'), { recursive: true }).filter((f) => f.endsWith('.css'));
  assert.ok(files.length > 10);
  const missed = [];
  for (const f of files) {
    const out = scaleFontsCss(readFileSync(R('src/' + f), 'utf8')).replace(/\/\*[\s\S]*?\*\//g, '');
    for (const m of out.matchAll(/(?:^|[\s;{])(font(?:-size)?)\s*:([^;}]*)/g)) {
      const v = m[2].trim();
      if (/var\(--ts\b/.test(v) || /^(inherit|0)$/.test(v) || /^-?\d*\.?\d+(em|%)$/.test(v) || (m[1] === 'font' && /^(inherit|var\(--[a-z-]+\))$/.test(v))) continue;
      if (m[1] === 'font' && !/\d(px|rem|vw|vh|cq)|var\(--fs-/.test(v)) continue; // shorthand sized in em: follows its parent
      missed.push(`${f}: ${m[1]}: ${v}`);
    }
  }
  assert.deepEqual(missed, []);
});

test('A2 setting: whitelisted (normal / large / larger), defaults to normal, hostile values dropped; runtime switch sets data-text', () => {
  assert.deepEqual(TEXT_SIZES, Object.keys(TEXT_SCALE));
  assert.equal(defaultSave().settings.textSize, 'normal');
  for (const v of TEXT_SIZES) assert.equal(sanitize({ settings: { textSize: v } }).settings.textSize, v);
  for (const v of ['huge', '', null, 3, ['large'], { a: 1 }, '__proto__', 'large ']) assert.equal(sanitize({ settings: { textSize: v } }).settings.textSize, 'normal');
  const el = { dataset: {} };
  assert.equal(applyTextSize(el, 'larger'), 'larger'); assert.equal(el.dataset.text, 'larger');
  assert.equal(applyTextSize(el, 'normal'), 'normal'); assert.equal('text' in el.dataset, false);
  assert.equal(applyTextSize(el, '<b>x</b>'), 'normal'); assert.equal('text' in el.dataset, false);
  assert.equal(applyTextSize(null, 'large'), 'large');
  const css = readFileSync(R('src/ui/a11y.css'), 'utf8');
  for (const [k, v] of Object.entries(TEXT_SCALE)) if (k !== 'normal') assert.ok(css.includes(`:root[data-text="${k}"] { --ts: ${v}; }`), k);
  assert.ok(/textScalePlugin\(\)/.test(readFileSync(R('vite.config.js'), 'utf8')), 'the pass is wired into Vite');
});
