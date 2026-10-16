import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, statSync, readdirSync } from 'node:fs';

const R = (p) => new URL('../' + p, import.meta.url);
const FONTS = ['cormorant-garamond', 'figtree', 'caveat'];
const css = readFileSync(R('src/style.css'), 'utf8');

test('U1 fonts: woff2 files exist, are real woff2, sane size, with an OFL.txt each', () => {
  let total = 0;
  for (const f of FONTS) {
    const p = `src/assets/fonts/${f}.woff2`;
    assert.ok(existsSync(R(p)), p);
    const b = readFileSync(R(p));
    assert.equal(b.subarray(0, 4).toString('latin1'), 'wOF2', f);
    assert.ok(b.length > 5000 && b.length < 80000, `${f} ${b.length}`);
    total += b.length;
    const ofl = readFileSync(R(`src/assets/fonts/OFL-${f}.txt`), 'utf8');
    assert.match(ofl, /SIL OPEN FONT LICENSE Version 1\.1/i);
    assert.match(ofl, /^Copyright /);
  }
  assert.ok(total < 150000, 'font budget ' + total);
});

test('U1 fonts: CREDITS lists each font with licence and source', () => {
  const c = readFileSync(R('docs/CREDITS.md'), 'utf8');
  for (const n of ['Cormorant Garamond', 'Figtree', 'Caveat']) assert.ok(c.includes(n), n);
  assert.ok(c.includes('SIL Open Font License 1.1') && c.includes('github.com/google/fonts'));
});

test('U1 tokens: @font-face with swap, type + role CSS variables defined, old tokens kept', () => {
  assert.equal((css.match(/@font-face/g) || []).length, 3);
  assert.equal((css.match(/font-display: swap/g) || []).length, 3);
  for (const v of ['--font-display', '--font-body', '--font-whisper', '--fw-display', '--fw-body', '--fs-wordmark', '--fs-title', '--fs-big', '--fs-card', '--fs-body', '--fs-small', '--fs-whisper', '--lg-glass', '--lg-hairline', '--lg-evo', '--lg-ember', '--lg-wick-dark', '--lg-text', '--font-head', '--font-ui', '--brass', '--flame']) {
    assert.ok(new RegExp(`${v}:`).test(css), v);
  }
  assert.match(css, /--fs-small: max\(11px/);
  assert.match(css, /--fs-body: max\(12px/);
  assert.match(css, /--fs-whisper: max\(15px/);
});

test('U1: no external font URL or CDN in source, index.html or the built page', () => {
  const bad = /fonts\.googleapis|fonts\.gstatic|use\.typekit|cdnjs|jsdelivr|unpkg|@import\s+url\(\s*['"]?https?:/i;
  const files = ['index.html', 'src/style.css', 'src/hud.css', 'src/cards.css', 'src/ui/specimen.js', 'src/entry.js'];
  for (const f of files) assert.ok(!bad.test(readFileSync(R(f), 'utf8')), f);
  for (const url of css.matchAll(/url\(([^)]+)\)/g)) assert.ok(!/https?:/.test(url[1]), url[1]);
  if (existsSync(R('dist/index.html'))) {
    const d = readFileSync(R('dist/index.html'), 'utf8');
    assert.ok(!bad.test(d), 'dist');
    assert.ok(d.includes('data:font/woff2'), 'fonts inlined in single-file dist');
    assert.ok(!readdirSync(R('dist')).some((n) => n.endsWith('.woff2')), 'no loose font files');
  }
});

test('U1: specimen is behind ?specimen=1 only and the entry switch exists', () => {
  const e = readFileSync(R('src/entry.js'), 'utf8');
  assert.match(e, /specimen'\) === '1'/);
  assert.ok(readFileSync(R('index.html'), 'utf8').includes('/src/entry.js'));
  assert.ok(statSync(R('src/ui/specimen.js')).size > 500);
});
