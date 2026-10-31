// PWA-FIX: startup guard (blank installed-app window) + service-worker navigation fallback.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { errText, bootLines, installBootGuard, BOOT_LIMIT_MS } from '../src/ui/bootguard.js';

const el = () => { const e = { style: {}, children: [], attrs: {}, textContent: '', removed: false };
  e.appendChild = (c) => { e.children.push(c); return c; }; e.append = (...c) => { e.children.push(...c); };
  e.setAttribute = (k, v) => { e.attrs[k] = v; }; e.addEventListener = () => {}; e.remove = () => { e.removed = true; }; return e; };
function fakeWin({ hidden = false } = {}) {
  const ls = {}, ivs = [];
  const doc = { hidden, body: el(), createElement: el };
  const win = {
    document: doc, innerWidth: 1280, innerHeight: 720, devicePixelRatio: 1,
    navigator: { userAgent: 'UA', serviceWorker: { controller: null } },
    matchMedia: (q) => ({ matches: q === '(display-mode: standalone)' }),
    addEventListener: (t, f) => { (ls[t] ||= []).push(f); },
    setInterval: (f) => { ivs.push(f); return ivs.length; }, clearInterval: (i) => { ivs[i - 1] = null; },
    location: { reload() {} },
  };
  const tick = (ms) => { for (let t = 0; t < ms; t += 500) for (const f of ivs) if (f) f(); };
  const fire = (t, e = {}) => { for (const f of ls[t] || []) f(e); };
  return { win, doc, tick, fire };
}

test('errText: clips, strips control characters, reads error/reason shapes', () => {
  assert.equal(errText(null), 'unknown error');
  assert.equal(errText('a\nb\u0000c'), 'a b c');
  assert.equal(errText(new Error('boom')), 'boom');
  assert.equal(errText({ reason: new Error('rej') }), 'rej');
  assert.ok(errText('x'.repeat(1000)).length <= 240);
});

test('guard: shows the failure panel after the limit (wall clock, BLANK-FIX: also in a window reported hidden), never after boot-done', () => {
  const a = fakeWin();
  const st = installBootGuard(a.win, a.doc, '0.4.0');
  a.tick(BOOT_LIMIT_MS - 1000);
  assert.equal(st.shown, null);
  a.tick(1500);
  assert.ok(st.shown, 'panel shown');
  const text = JSON.stringify(st.shown);
  assert.ok(text.includes('Wispwick did not start') && text.includes('Repair and reload') && text.includes('display-mode standalone'));
  a.fire('boot-done', { detail: {} });
  assert.equal(st.shown, null, 'late ready removes the panel');

  const h = fakeWin({ hidden: true });
  const sh = installBootGuard(h.win, h.doc);
  h.tick(BOOT_LIMIT_MS + 500);
  assert.ok(sh.shown, 'a window the OS reports as hidden still gets the panel (it used to wait for ever)');
  h.fire('boot-done', { detail: {} });
  assert.equal(sh.shown, null, 'and a late boot removes it');

  const r = fakeWin();
  const sr = installBootGuard(r.win, r.doc);
  r.fire('boot-done', { detail: {} });
  r.tick(BOOT_LIMIT_MS * 2);
  assert.equal(sr.shown, null);
  assert.ok(sr.ready);
});

test('guard: a failed title shows the message at once; main.js guards the pre-bake and reports boot-done', () => {
  const a = fakeWin();
  const st = installBootGuard(a.win, a.doc);
  a.fire('boot-done', { detail: { error: new Error('showMenu broke') } });
  assert.ok(st.shown && st.failed && !st.ready);
  assert.ok(JSON.stringify(st.shown).includes('showMenu broke'));
  const main = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
  const h = main.slice(main.indexOf("addEventListener('scene-ready'"));
  assert.ok(/try \{ startPrebake\(\); \} catch/.test(h), 'pre-bake cannot stop the title');
  assert.ok(h.indexOf('app.showMenu()') < h.indexOf('bootDone();'));
});

test('guard: errors are collected (capped) and listed', () => {
  const a = fakeWin();
  const st = installBootGuard(a.win, a.doc);
  for (let i = 0; i < 20; i++) a.fire('error', { error: new Error('e' + i) });
  a.fire('unhandledrejection', { reason: 'late' });
  assert.equal(st.errors.length, 8);
  assert.ok(bootLines(a.win, st).some((l) => l === 'error: e0'));
});

test('guard source: textContent only, no network, saves untouched by Repair', () => {
  const src = readFileSync(new URL('../src/ui/bootguard.js', import.meta.url), 'utf8');
  assert.ok(!/innerHTML|insertAdjacentHTML|fetch\(|XMLHttpRequest/.test(src));
  // BLANK-FIX: storage is touched only through storeOf() (reset buttons + the auto-repair flag); Repair itself never touches it
  assert.ok(!/localStorage\./.test(src) && !/sessionStorage\./.test(src), 'no direct storage calls');
  const rep = src.slice(src.indexOf('export async function repair'), src.indexOf('export function installBootGuard'));
  assert.ok(!/storeOf|Storage|removeItem|setItem/.test(rep), 'Repair keeps saves');
  assert.ok(src.includes("k.startsWith('hollowlight-')"));
  const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  assert.ok(html.includes('bootnoscript') && !/innerHTML/.test(html));
  const entry = readFileSync(new URL('../src/entry.js', import.meta.url), 'utf8');
  assert.ok(entry.indexOf('installBootGuard(') < entry.indexOf("import('./main.js')"), 'guard before the game loads');
});

test('sw.js: never caches ./index.html (308 on Cloudflare Pages) and never serves a redirected response to a navigation', () => {
  const sw = readFileSync(new URL('../public/sw.js', import.meta.url), 'utf8');
  assert.ok(!sw.includes("'./index.html'"));
  assert.ok(sw.includes("const INDEX = './';"));
  assert.ok(sw.includes('hit.redirected'));
});
