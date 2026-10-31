// PWA glue: platform, install prompt capture, fullscreen state, service-worker update state, dismissal storage.
// No analytics, no network calls of its own. Everything shown to the player is built in card.js with textContent.
import { detectPlatform } from './platform.js';
import { readDismissed, writeDismissed, shouldShowCard, showFooterLink } from './prompt.js';
import * as fs from './fullscreen.js';

const ownBuild = typeof __BUILD_ID__ === 'string' ? __BUILD_ID__ : '';

/** BLANK-FIX: ask the controlling worker which build it is (MessageChannel; no answer in 2 s = unknown, nothing shown). */
export function askBuild(worker, cb, setT = setTimeout, MC = globalThis.MessageChannel) {
  let done = false;
  const end = (v) => { if (!done) { done = true; cb(typeof v === 'string' ? v.slice(0, 64) : ''); } };
  try {
    if (!worker || !MC) return end('');
    const ch = new MC();
    ch.port1.onmessage = (m) => end(m && m.data);
    worker.postMessage('BUILD', [ch.port2]);
    setT(() => end(''), 2000);
  } catch { end(''); }
}

export function createPwa(win) {
  const doc = win.document;
  const nav = win.navigator || {};
  const listeners = new Set();
  const notify = () => { for (const cb of [...listeners]) { try { cb(); } catch { /* a bad listener must not break the rest */ } } };
  const mm = (q) => { try { return !!win.matchMedia(q).matches; } catch { return false; } };
  const platform = () => detectPlatform({
    ua: nav.userAgent, platform: nav.platform, maxTouchPoints: nav.maxTouchPoints, standalone: nav.standalone,
    displayModes: ['fullscreen', 'standalone', 'minimal-ui', 'window-controls-overlay'].filter((m) => mm(`(display-mode: ${m})`)),
  });
  const storage = (() => { try { return win.localStorage; } catch { return null; } })();
  let deferred = null;
  let appInstalled = false;
  let dismissedAt = storage ? readDismissed(storage, Date.now()) : 0;
  let waiting = null;
  let swapped = false; // BLANK-FIX: a newer worker took over while this page runs (sw.js no longer waits); the page itself is older
  let reloading = false;

  win.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); deferred = e; notify(); });
  win.addEventListener('appinstalled', () => { appInstalled = true; deferred = null; notify(); });
  fs.onChange(doc, notify);

  const api = {
    get platform() { return platform(); },
    canFullscreen: () => fs.isSupported(doc),
    isFullscreen: () => fs.isFullscreen(doc),
    toggleFullscreen: () => fs.toggle(doc, win),
    canInstall: () => !!deferred,
    async install() {
      const e = deferred;
      if (!e) return false;
      deferred = null; // a prompt event can be used once
      try { await e.prompt(); const c = await e.userChoice; notify(); return !!c && c.outcome === 'accepted'; } catch { notify(); return false; }
    },
    state() {
      const p = platform();
      return { installed: p.installed, appInstalled, canInstall: !!deferred, canFullscreen: fs.isSupported(doc), iosSteps: p.needsIosSteps, dismissedAt, now: Date.now() };
    },
    shouldShowCard() { return shouldShowCard(api.state()); },
    showFooterLink() { return showFooterLink(api.state()); },
    dismiss() { dismissedAt = Date.now(); if (storage) writeDismissed(storage, dismissedAt); notify(); },
    subscribe(cb) { listeners.add(cb); return () => listeners.delete(cb); },
    updateReady: () => !!waiting || swapped,
    applyUpdate() {
      // The worker may already have taken over (sw.js never waits), so no controllerchange would follow: always reload, with a short
      // fallback timer, so the Reload button can never do nothing.
      reloading = true;
      try { if (waiting) waiting.postMessage('SKIP_WAITING'); } catch { /* the timer below still reloads */ }
      setTimeout(() => { reloading = false; try { win.location.reload(); } catch { /* nothing more to do */ } }, 400);
    },
    // Production only (main.js decides). Relative URL + scope so it works under /hollowlight/.
    registerServiceWorker() {
      try {
        if (!nav.serviceWorker) return;
        let hadController = !!nav.serviceWorker.controller; // false on the very first visit: that first take-over is not an update
        nav.serviceWorker.addEventListener('controllerchange', () => {
          if (reloading) { reloading = false; win.location.reload(); return; }
          waiting = null;
          if (!hadController) { hadController = true; return; }
          askBuild(nav.serviceWorker.controller, (b) => { if (b && b !== ownBuild) { swapped = true; notify(); } });
        });
        nav.serviceWorker.register('./sw.js', { scope: './', updateViaCache: 'none' }).then((reg) => {
          const check = (w) => { if (w && nav.serviceWorker.controller) { waiting = w; notify(); } };
          check(reg.waiting);
          reg.addEventListener('updatefound', () => {
            const w = reg.installing;
            if (w) w.addEventListener('statechange', () => { if (w.state === 'installed') check(w); else if (w.state === 'activated' && waiting === w) { waiting = null; notify(); } });
          });
          doc.addEventListener('visibilitychange', () => { if (!doc.hidden) reg.update().catch(() => {}); });
        }).catch(() => {});
      } catch { /* unsupported: the game works without it */ }
    },
  };
  return api;
}
