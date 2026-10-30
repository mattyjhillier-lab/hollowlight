// PWA glue: platform, install prompt capture, fullscreen state, service-worker update state, dismissal storage.
// No analytics, no network calls of its own. Everything shown to the player is built in card.js with textContent.
import { detectPlatform } from './platform.js';
import { readDismissed, writeDismissed, shouldShowCard, showFooterLink } from './prompt.js';
import * as fs from './fullscreen.js';

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
    updateReady: () => !!waiting,
    applyUpdate() {
      if (!waiting) return;
      reloading = true;
      try { waiting.postMessage('SKIP_WAITING'); } catch { reloading = false; }
    },
    // Production only (main.js decides). Relative URL + scope so it works under /hollowlight/.
    registerServiceWorker() {
      try {
        if (!nav.serviceWorker) return;
        nav.serviceWorker.addEventListener('controllerchange', () => { if (reloading) { reloading = false; win.location.reload(); } });
        nav.serviceWorker.register('./sw.js', { scope: './', updateViaCache: 'none' }).then((reg) => {
          const check = (w) => { if (w && nav.serviceWorker.controller) { waiting = w; notify(); } };
          check(reg.waiting);
          reg.addEventListener('updatefound', () => {
            const w = reg.installing;
            if (w) w.addEventListener('statechange', () => { if (w.state === 'installed') check(w); });
          });
          doc.addEventListener('visibilitychange', () => { if (!doc.hidden) reg.update().catch(() => {}); });
        }).catch(() => {});
      } catch { /* unsupported: the game works without it */ }
    },
  };
  return api;
}
