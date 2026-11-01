// BLANK-FIX (2026-10-31): the dev build stayed blank in Matt's installed app / tab until a hard refresh (Ctrl+Shift+R).
// Covers: the service worker runs for real (Node vm, fake caches/fetch) - never waits, never holds a navigation on the cache,
// revalidates the page, offline fallback, manifest network first; boot guard auto-repair once + the two reset buttons on
// realistic old saves; main.js optional stages; applySettings puts a broken setting back to its default.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { installBootGuard, resetSettingsOnly, resetEverything, SAVE_KEYS, AUTO_REPAIR_MS, AUTO_FLAG, BOOT_LIMIT_MS } from '../src/ui/bootguard.js';
import { parseSave, defaultSettings, sanitize, serializeSave } from '../src/save/schema.js';
import { askBuild } from '../src/pwa/index.js';
import './helpers.mjs'; // sets the real tree definition for the save schema (as the game does)

const ORIGIN = 'https://dev.example.test';
function loadSw({ fetchImpl, putImpl } = {}) {
  const h = {}, store = new Map(), waits = [];
  const calls = { skip: 0, claim: 0, fetched: [] };
  const cache = {
    put: putImpl || (async (k, r) => { store.set(typeof k === 'string' ? new URL(k, ORIGIN + '/').href : k.url, r); }),
    addAll: async (list) => { for (const k of list) store.set(new URL(k, ORIGIN + '/').href, new Response('pre ' + k)); },
  };
  const self = {
    location: { href: ORIGIN + '/sw.js', origin: ORIGIN }, registration: { active: null },
    addEventListener: (t, f) => { h[t] = f; },
    skipWaiting: () => { calls.skip++; }, clients: { claim: async () => { calls.claim++; } },
  };
  const ctx = {
    self, URL, Request, Response, console,
    caches: {
      open: async () => cache, keys: async () => ['hollowlight-old', 'other-app'], delete: async (k) => { calls.deleted = k; return true; },
      match: async (k) => store.get(typeof k === 'string' ? new URL(k, ORIGIN + '/').href : k.url),
    },
    fetch: async (r) => { calls.fetched.push(r); return fetchImpl ? fetchImpl(r) : new Response('net page', { status: 200 }); },
  };
  vm.createContext(ctx);
  vm.runInContext(readFileSync(new URL('../public/sw.js', import.meta.url), 'utf8').replace('__SW_VERSION__', 'v2').replace('__BUILD_ID__', 'b2'), ctx);
  const fire = async (type, e) => { e.waitUntil = (p) => waits.push(p); await h[type](e); };
  const fetchEv = async (path, mode = 'navigate') => {
    let p = null;
    const req = new Request(ORIGIN + path); // a real Request (the worker copies it with cache: 'no-cache'); mode as the browser sets it
    Object.defineProperty(req, 'mode', { value: mode });
    await fire('fetch', { request: req, respondWith: (x) => { p = x; } });
    return p;
  };
  return { h, store, calls, waits, fire, fetchEv };
}
// Node's Response has type 'default'; the worker only caches 'basic' responses, as browsers give for same-origin
const basic = (body, init) => { const r = new Response(body, init); Object.defineProperty(r, 'type', { value: 'basic' }); return r; };

test('sw: a new version never waits (skipWaiting at install), claims pages and drops older hollowlight- caches only', async () => {
  const sw = loadSw();
  await sw.fire('install', {});
  assert.equal(sw.calls.skip, 1);
  await sw.fire('activate', {}); await Promise.all(sw.waits);
  assert.equal(sw.calls.claim, 1);
  assert.equal(sw.calls.deleted, 'hollowlight-old');
});

test('sw: navigation returns the network page at once even when the cache write hangs or fails (it used to wait for it)', async () => {
  for (const putImpl of [() => new Promise(() => {}), async () => { throw new Error('QuotaExceededError'); }]) {
    const sw = loadSw({ putImpl, fetchImpl: () => basic('fresh B', { status: 200 }) });
    const res = await Promise.race([sw.fetchEv('/'), new Promise((r) => setTimeout(() => r('TIMEOUT'), 300))]);
    assert.notEqual(res, 'TIMEOUT', 'never held by the cache');
    assert.equal(await res.text(), 'fresh B', 'the new deploy, not the cached copy');
  }
});

test('sw: the page fetch revalidates (no-cache) so a host max-age never hands back an old page; offline falls back to the cached page', async () => {
  const sw = loadSw({ fetchImpl: () => basic('fresh', { status: 200 }) });
  await sw.fetchEv('/');
  assert.equal(sw.calls.fetched[0].cache, 'no-cache');
  const off = loadSw({ fetchImpl: () => { throw new TypeError('offline'); } });
  await off.fire('install', {}); await Promise.all(off.waits);
  assert.equal(await (await off.fetchEv('/')).text(), 'pre ./');
});

test('sw: the manifest is network first (a stale cached manifest kept an old display mode), icons stay cache first', async () => {
  const sw = loadSw({ fetchImpl: () => basic('{"new":1}', { status: 200 }) });
  await sw.fire('install', {}); await Promise.all(sw.waits);
  assert.equal(await (await sw.fetchEv('/manifest.webmanifest', 'no-cors')).text(), '{"new":1}');
  assert.equal(await (await sw.fetchEv('/icon-192.png', 'no-cors')).text(), 'pre ./icon-192.png');
  assert.equal(await sw.fetchEv('/other.js', 'no-cors'), null, 'anything else is not handled');
});

test('sw: answers BUILD on a message port; the page asks with a 2 s cap', async () => {
  const sw = loadSw();
  let got = null;
  sw.h.message({ data: 'BUILD', ports: [{ postMessage: (v) => { got = v; } }] });
  assert.equal(got, 'b2');
  class MC { constructor() { const p1 = {}; this.port1 = p1; this.port2 = { reply: (v) => p1.onmessage({ data: v }) }; } }
  let a = null; askBuild({ postMessage: (_m, [port]) => port.reply('b9') }, (v) => { a = v; }, () => {}, MC);
  assert.equal(a, 'b9');
  let b = 'x'; let late = null; askBuild({ postMessage: () => {} }, (v) => { b = v; }, (f) => { late = f; }, MC); late();
  assert.equal(b, '', 'no answer = unknown (no notice)');
  let c = 'x'; askBuild(null, (v) => { c = v; }); assert.equal(c, '');
});

test('public/_headers: page, worker and manifest are served no-cache (Cloudflare Pages)', () => {
  const t = readFileSync(new URL('../public/_headers', import.meta.url), 'utf8');
  for (const p of ['/', '/index.html', '/sw.js', '/manifest.webmanifest']) assert.match(t, new RegExp('^' + p.replace(/[./]/g, '\\$&') + '\\r?\\n  Cache-Control: no-cache', 'm'), p);
});

// ---- boot guard
const el = () => { const e = { style: {}, children: [], attrs: {}, textContent: '', removed: false, handlers: {} };
  e.appendChild = (c) => { e.children.push(c); return c; }; e.append = (...c) => { e.children.push(...c); };
  e.setAttribute = (k, v) => { e.attrs[k] = v; }; e.addEventListener = (t, f) => { e.handlers[t] = f; }; e.remove = () => { e.removed = true; }; return e; };
function memStore(init = {}) {
  const m = new Map(Object.entries(init));
  return { get length() { return m.size; }, key: (i) => [...m.keys()][i] ?? null, getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => { m.set(k, String(v)); }, removeItem: (k) => { m.delete(k); }, _m: m };
}
function fakeWin({ controller = true, session = memStore(), local = memStore() } = {}) {
  const ls = {}, ivs = [];
  const doc = { hidden: false, body: el(), createElement: el };
  const st = { reloads: 0, unregistered: 0 };
  const win = {
    document: doc, innerWidth: 1280, innerHeight: 720, devicePixelRatio: 1, sessionStorage: session, localStorage: local,
    navigator: { userAgent: 'UA', serviceWorker: { controller: controller ? {} : null, getRegistrations: async () => [{ unregister: async () => { st.unregistered++; } }] } },
    caches: { keys: async () => ['hollowlight-a', 'x'], delete: async () => true },
    matchMedia: () => ({ matches: false }),
    addEventListener: (t, f) => { (ls[t] ||= []).push(f); },
    setInterval: (f) => { ivs.push(f); return ivs.length; }, clearInterval: (i) => { ivs[i - 1] = null; },
    location: { reload() { st.reloads++; } },
  };
  const tick = (ms) => { for (let t = 0; t < ms; t += 500) for (const f of ivs) if (f) f(); };
  const fire = (t, e = {}) => { for (const f of ls[t] || []) f(e); };
  return { win, doc, tick, fire, st };
}
const flush = () => new Promise((r) => setTimeout(r, 0));
const buttons = (box) => { const out = {}; const walk = (n) => { if (!n || !n.children) return; for (const c of n.children) { if (c.handlers && c.handlers.click) out[c.textContent] = c; walk(c); } }; walk(box); return out; };

test('guard: one automatic repair per session when a worker-controlled page never reaches the scene', async () => {
  const a = fakeWin();
  installBootGuard(a.win, a.doc);
  a.tick(AUTO_REPAIR_MS - 500); await flush();
  assert.equal(a.st.reloads, 0);
  a.tick(1000); await flush(); await flush();
  assert.equal(a.st.unregistered, 1); assert.equal(a.st.reloads, 1);
  assert.equal(a.win.sessionStorage.getItem(AUTO_FLAG), '1');
  // after the reload: flag set -> no second auto-repair, the panel shows instead
  const b = fakeWin({ session: a.win.sessionStorage });
  const sb = installBootGuard(b.win, b.doc);
  b.tick(BOOT_LIMIT_MS + 500); await flush();
  assert.equal(b.st.reloads, 0); assert.ok(sb.shown);
  assert.ok(JSON.stringify(sb.shown).includes('auto-repair tried'));
  // a slow boot that reached the scene, a page with no worker, or no session storage: never auto-repair
  for (const [name, w, pre] of [['scene', fakeWin(), (x) => x.fire('scene-ready')], ['no sw', fakeWin({ controller: false }), () => {}], ['no session', (() => { const x = fakeWin(); Object.defineProperty(x.win, 'sessionStorage', { get() { throw new Error('denied'); } }); return x; })(), () => {}]]) {
    installBootGuard(w.win, w.doc); pre(w); w.tick(AUTO_REPAIR_MS * 1.5); await flush();
    assert.equal(w.st.reloads, 0, name);
  }
});

// realistic old saves: the v2 fixture (migrated) and a v3 lantern save carrying odd settings values
const v2 = readFileSync(new URL('./fixtures/save-v2.json', import.meta.url), 'utf8');
const v3 = (() => { const r = parseSave(v2); assert.ok(r.ok, 'fixture parses'); const d = sanitize(r.save || r.data || r.value || r); d.settings = { ...d.settings, uiScale: 'huge??', keys: { fullscreen: ['F'], up: 42 }, textSize: { x: 1 } }; return JSON.stringify(serializeSave(d)); })();

test('a real localStorage dump from build 659be88 loads in the current schema and survives Reset settings only', () => {
  const { dump } = JSON.parse(readFileSync(new URL('./fixtures/ls-659be88.json', import.meta.url), 'utf8'));
  const r = parseSave(dump['hollowlight:lantern:l1:save']);
  assert.ok(r.ok, 'old save parses');
  assert.ok(Object.keys(r.save.tree).length >= 20, 'tree buys kept');
  assert.equal(r.save.settings.textSize, 'large');
  assert.deepEqual(r.save.settings.keys.up, ['KeyI', 'ArrowUp']);
  assert.ok(Array.isArray(r.save.settings.keys.fullscreen), 'the new fullscreen action is filled in');
  assert.equal(r.save.settings.uiScale, 'auto', 'a save from before Menu size gets the default');
  const local = memStore(dump);
  assert.equal(resetSettingsOnly(local), 1);
  const after = parseSave(local.getItem('hollowlight:lantern:l1:save'));
  assert.ok(after.ok); assert.deepEqual(after.save.settings, defaultSettings()); assert.deepEqual(after.save.tree, r.save.tree);
  assert.equal(local.getItem('hollowlight:pb'), null); assert.ok(local.getItem('hollowlight:lanterns'));
});

test('Reset settings only: drops settings in every save (incl. backups) and the small flags; progress and other keys stay', async () => {
  const local = memStore({ 'hollowlight:save': v2, 'hollowlight:lantern:l1:save': v3, 'hollowlight:lantern:l1:save:backup': v3, 'hollowlight:lanterns': '{"v":1}', 'hollowlight:pb': 'tripped', 'hollowlight:pb:ground': 'run', 'hollowlight:tree:pins': '[]', 'hollowlight.installCard.v1': '1', 'other-site': 'keep', 'hollowlight:lantern:l2:save': '{broken' });
  assert.equal(resetSettingsOnly(local), 3);
  for (const k of ['hollowlight:pb', 'hollowlight:pb:ground', 'hollowlight:tree:pins']) assert.equal(local.getItem(k), null, k);
  assert.equal(local.getItem('hollowlight:lanterns'), '{"v":1}'); assert.equal(local.getItem('other-site'), 'keep');
  assert.equal(local.getItem('hollowlight:lantern:l2:save'), '{broken', 'unreadable save left for the loader');
  const after = parseSave(local.getItem('hollowlight:lantern:l1:save'));
  assert.ok(after.ok);
  const d = sanitize(JSON.parse(local.getItem('hollowlight:lantern:l1:save')));
  assert.deepEqual(d.settings, defaultSettings(), 'settings come back as defaults');
  const before = sanitize(JSON.parse(v3));
  assert.equal(d.gold, before.gold); assert.deepEqual(d.tree, before.tree); assert.equal(d.stats.runs, before.stats.runs);
  assert.ok(SAVE_KEYS.includes('hollowlight:lantern:l3:save:backup'));
  assert.equal(resetSettingsOnly(null), 0);
});

test('Reset everything: only this game\'s keys, behind a second tap; the panel lists both resets separately from Repair', async () => {
  const local = memStore({ 'hollowlight:save': v2, 'hollowlight:lantern:l1:save': v3, 'hollowlight.installCard.v1': '1', 'other-site': 'keep' });
  const a = fakeWin({ local });
  const st = installBootGuard(a.win, a.doc);
  a.tick(BOOT_LIMIT_MS + 500);
  const b = buttons(st.shown);
  for (const l of ['Try again', 'Repair and reload', 'Reset settings only (keeps saves)', 'Reset everything', 'Copy details']) assert.ok(b[l], l);
  b['Reset everything'].handlers.click(); await flush();
  assert.equal(local.length, 4, 'first tap only arms it');
  assert.match(b['Reset everything'].textContent, /Tap again/);
  b['Reset everything'].handlers.click(); await flush(); await flush();
  assert.deepEqual([...local._m.keys()], ['other-site']);
  assert.equal(resetEverything(null), 0);
});

// ---- main.js optional stages + applySettings fallback
test('main.js: optional stages are guarded (desktop, menu size, audio, touch, phone, probe, SW, resize) so one failure never blocks the title', () => {
  const main = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
  for (const n of ['desktop', 'menu size', 'audio', 'touch', 'phone', 'probe', 'service worker', 'resize observer', 'vibe', 'input tracking', 'ui tick']) assert.ok(main.includes(`optional('${n}'`), n);
  assert.ok(!/\napp\.desktop\.setPref/.test(main), 'menu size only through the guard');
  // the helper itself: a throw is noted and the fallback returned
  const m = main.match(/const optional = \(name, fn, fallback = null\) => \{[\s\S]*?\n\};/);
  const optional = new Function('window', 'console', m[0] + '; return optional;')({ __boot: { errors: [] } }, { error() {} });
  assert.equal(optional('x', () => { throw new Error('boom'); }, 7), 7);
  assert.equal(optional('y', () => 3), 3);
});

test('applySettings: a stored value that throws is put back to its default (saved), retried, and noted once for the title', async () => {
  const src = readFileSync(new URL('../src/app.js', import.meta.url), 'utf8').split('\r\n').join('\n');
  const m = src.match(/\n  applySettings\(\) \{[\s\S]*?\n  \},\n/);
  assert.ok(m);
  const calls = [];
  const fakeDoc = { documentElement: { classList: { toggle() {} } } };
  const applyTextSize = (_el, v) => { if (typeof v !== 'string') throw new Error('bad text size'); calls.push('ts ' + v); };
  const setActiveKeymap = (k) => { if (k && k.broken) throw new Error('bad keys'); return {}; };
  const fn = new Function('document', 'applyTextSize', 'setActiveKeymap', 'dirMap', 'touchEnabled', 'defaultSettings', 'matchMedia', 'window', 'return {' + m[0] + '}.applySettings')(fakeDoc, applyTextSize, setActiveKeymap, () => ({}), () => false, defaultSettings, undefined, {});
  const data = { settings: { ...defaultSettings(), textSize: { x: 1 }, keys: { broken: 1 } } };
  const self = { save: { data, loadNote: null, setSettings(p) { data.settings = { ...data.settings, ...p }; } }, desktop: { setPref() { throw new Error('desktop broke'); } }, audio: { configure() {} }, touch: null, params: {} };
  fn.call(self);
  assert.equal(data.settings.textSize, 'normal'); assert.deepEqual(data.settings.keys, defaultSettings().keys);
  assert.ok(calls.includes('ts normal'));
  assert.match(self.save.loadNote, /text size/); assert.match(self.save.loadNote, /keys/);
  assert.equal(data.settings.uiScale, 'auto', 'menu size reset too; a desktop that keeps failing just stays off');
});
