import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { detectPlatform } from '../src/pwa/platform.js';
import { parseDismissed, readDismissed, writeDismissed, shouldShowCard, showFooterLink, REPROMPT_MS, DISMISS_KEY } from '../src/pwa/prompt.js';
import * as fs from '../src/pwa/fullscreen.js';

const UA = {
  iosSafari: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1',
  iosChrome: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/124.0.0.0 Mobile/15E148 Safari/604.1',
  ipad: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15',
  android: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
  desktop: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
};

test('platform: iOS Safari, not installed', () => {
  const p = detectPlatform({ ua: UA.iosSafari, maxTouchPoints: 5 });
  assert.equal(p.os, 'ios'); assert.ok(p.iosSafari); assert.ok(p.needsIosSteps); assert.equal(p.installed, false);
});
test('platform: iOS standalone (navigator.standalone)', () => {
  const p = detectPlatform({ ua: UA.iosSafari, standalone: true });
  assert.ok(p.installed); assert.equal(p.needsIosSteps, false);
});
test('platform: iOS Chrome is iOS but not Safari; iPadOS detected via touch points', () => {
  const c = detectPlatform({ ua: UA.iosChrome });
  assert.ok(c.ios); assert.equal(c.iosSafari, false); assert.ok(c.needsIosSteps);
  assert.ok(detectPlatform({ ua: UA.ipad, maxTouchPoints: 5 }).ios);
  assert.equal(detectPlatform({ ua: UA.ipad, maxTouchPoints: 0 }).ios, false);
});
test('platform: Android Chrome and desktop Chrome', () => {
  const a = detectPlatform({ ua: UA.android, maxTouchPoints: 5 });
  assert.equal(a.os, 'android'); assert.ok(a.chromium); assert.equal(a.needsIosSteps, false);
  const d = detectPlatform({ ua: UA.desktop, displayModes: [] });
  assert.equal(d.os, 'other'); assert.ok(d.chromium); assert.equal(d.installed, false);
  assert.ok(detectPlatform({ ua: UA.desktop, displayModes: ['standalone'] }).installed);
  assert.ok(detectPlatform({ ua: UA.android, displayModes: ['fullscreen'] }).installed);
});
test('platform: garbage input does not throw', () => {
  for (const e of [undefined, {}, { ua: 5 }, { ua: 'x'.repeat(100000) }, { ua: null, displayModes: 'nope', maxTouchPoints: 'x' }]) assert.doesNotThrow(() => detectPlatform(e));
});

const NOW = 1.8e12;
const base = { installed: false, appInstalled: false, canInstall: false, canFullscreen: true, iosSteps: false, dismissedAt: 0, now: NOW };
test('prompt: first visit shows; dismissed hides; after 14 days shows again', () => {
  assert.equal(shouldShowCard(base), true);
  assert.equal(shouldShowCard({ ...base, dismissedAt: NOW - 1000 }), false);
  assert.equal(shouldShowCard({ ...base, dismissedAt: NOW - REPROMPT_MS + 1 }), false);
  assert.equal(shouldShowCard({ ...base, dismissedAt: NOW - REPROMPT_MS }), true);
});
test('prompt: hidden when standalone/fullscreen or after appinstalled; hidden when nothing to offer', () => {
  assert.equal(shouldShowCard({ ...base, installed: true }), false);
  assert.equal(shouldShowCard({ ...base, appInstalled: true }), false);
  assert.equal(shouldShowCard({ ...base, canFullscreen: false }), false);
  assert.equal(shouldShowCard({ ...base, canFullscreen: false, iosSteps: true }), true);
  assert.equal(shouldShowCard({ ...base, canFullscreen: false, canInstall: true }), true);
  assert.equal(showFooterLink({ ...base, dismissedAt: NOW }), true);
  assert.equal(showFooterLink({ ...base, installed: true }), false);
});
test('dismissal storage: validation, clamp, tamper', () => {
  assert.equal(parseDismissed(String(NOW - 5), NOW), NOW - 5);
  assert.equal(parseDismissed(String(NOW + 1e12), NOW), NOW); // future clamped to now: cannot hide longer than 14 days
  for (const bad of [null, undefined, '', '-5', '0', '1.5', 'abc', '{"a":1}', '1e12', '9'.repeat(30), '99999999999999999999', 12345, ' 123', '__proto__']) assert.equal(parseDismissed(bad, NOW), 0, String(bad));
  const mem = new Map();
  const st = { getItem: (k) => (mem.has(k) ? mem.get(k) : null), setItem: (k, v) => mem.set(k, String(v)) };
  assert.equal(readDismissed(st, NOW), 0);
  assert.ok(writeDismissed(st, NOW));
  assert.equal(mem.get(DISMISS_KEY), String(NOW));
  assert.equal(readDismissed(st, NOW + 1000), NOW);
  const boom = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); } };
  assert.equal(readDismissed(boom, NOW), 0);
  assert.equal(writeDismissed(boom, NOW), false);
});

test('fullscreen: feature detection and enter/exit with a fake document', async () => {
  const noFs = { documentElement: {} };
  assert.equal(fs.isSupported(noFs), false); // iPhone Safari case
  assert.equal(fs.isSupported(null), false);
  assert.equal(fs.isSupported({ documentElement: { requestFullscreen() {} }, fullscreenEnabled: false }), false);
  let locked = null;
  const doc = { fullscreenEnabled: true, fullscreenElement: null, documentElement: { async requestFullscreen() { doc.fullscreenElement = {}; } }, async exitFullscreen() { doc.fullscreenElement = null; }, addEventListener() {}, removeEventListener() {} };
  const win = { screen: { orientation: { lock: async (o) => { locked = o; }, unlock() { locked = null; } } } };
  assert.ok(fs.isSupported(doc));
  assert.equal(await fs.enter(doc, win), true);
  assert.ok(fs.isFullscreen(doc)); assert.equal(locked, 'landscape');
  await fs.toggle(doc, win);
  assert.equal(fs.isFullscreen(doc), false); assert.equal(locked, null);
  const refused = { fullscreenEnabled: true, documentElement: { requestFullscreen: () => Promise.reject(new Error('no')) } };
  assert.equal(await fs.enter(refused, {}), false);
  const failLock = { screen: { orientation: { lock: () => Promise.reject(new Error('unsupported')) } } };
  assert.equal(await fs.enter(doc, failLock), true); // lock failure is silent
});

const manifest = JSON.parse(readFileSync(new URL('../public/manifest.webmanifest', import.meta.url), 'utf8'));
test('manifest: required fields, relative paths, icons exist, maskable present', () => {
  for (const k of ['id', 'name', 'short_name', 'start_url', 'scope', 'display', 'orientation', 'background_color', 'theme_color', 'icons']) assert.ok(manifest[k], k);
  assert.equal(manifest.name, 'Wispwick: Spirits of the Dusk');
  assert.equal(manifest.short_name, 'Wispwick');
  assert.equal(manifest.display, 'fullscreen');
  assert.deepEqual(manifest.display_override, ['fullscreen', 'standalone', 'minimal-ui']); // DESKTOP C1: desktop Chrome/Edge take WCO, phones skip it
  assert.ok(manifest.categories.includes('games'));
  for (const v of [manifest.id, manifest.start_url, manifest.scope]) assert.match(v, /^\.\/?$/);
  assert.match(manifest.theme_color, /^#[0-9a-f]{6}$/i);
  const sizes = manifest.icons.map((i) => i.sizes);
  assert.ok(sizes.includes('192x192') && sizes.includes('512x512'));
  assert.ok(manifest.icons.some((i) => i.purpose === 'maskable'));
  for (const i of manifest.icons) {
    assert.ok(!i.src.startsWith('/') && !/^[a-z]+:/i.test(i.src), 'relative: ' + i.src);
    assert.ok(existsSync(new URL('../public/' + i.src, import.meta.url)), i.src);
  }
  for (const f of ['apple-touch-icon.png', 'favicon.svg', 'favicon-32.png']) assert.ok(existsSync(new URL('../public/' + f, import.meta.url)), f);
});
test('index.html links manifest and iOS tags with relative paths, keeps viewport-fit=cover', () => {
  const h = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
  for (const s of ['rel="manifest" href="./manifest.webmanifest"', 'rel="apple-touch-icon" href="./apple-touch-icon.png"', 'apple-mobile-web-app-capable', 'apple-mobile-web-app-title', 'black-translucent', 'name="theme-color"', 'viewport-fit=cover']) assert.ok(h.includes(s), s);
});

const sw = readFileSync(new URL('../public/sw.js', import.meta.url), 'utf8');
test('sw.js: skipWaiting on install (BLANK-FIX) and on the old message, same-origin GET only, version placeholder', () => {
  const calls = [...sw.matchAll(/skipWaiting\(/g)];
  assert.equal(calls.length, 2);
  const ins = sw.indexOf("addEventListener('install'"), msg = sw.indexOf("addEventListener('message'");
  assert.ok(calls[0].index > ins && calls[0].index < sw.indexOf('});', ins), 'install never waits');
  assert.ok(calls[1].index > msg && calls[1].index < sw.indexOf('});', msg), 'older pages can still send SKIP_WAITING');
  assert.ok(sw.includes("'__BUILD_ID__'"));
  assert.ok(sw.includes("req.method !== 'GET'") && sw.includes('url.origin !== self.location.origin') && sw.includes("headers.has('range')"));
  assert.ok(sw.includes("'__SW_VERSION__'"));
  assert.ok(!/importScripts|XMLHttpRequest/.test(sw));
  assert.ok(sw.includes("k.startsWith('hollowlight-')") && sw.includes('caches.delete'));
});
test('sw.js: precache list files exist in public/', () => {
  const list = [...sw.matchAll(/'\.\/([a-z0-9-]+\.[a-z.]+)'/g)].map((m) => m[1]).filter((f) => f !== 'index.html');
  assert.ok(list.length >= 5);
  for (const f of list) assert.ok(existsSync(new URL('../public/' + f, import.meta.url)), f);
});
