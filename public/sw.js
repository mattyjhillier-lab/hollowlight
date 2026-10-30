// Wispwick service worker (hand-written, no dependencies). Own files only: same-origin GET, nothing else.
// VERSION is stamped at build time by vite.config.js (package version + hash of index.html). No auto skipWaiting:
// a new version waits until the player accepts it from a menu (page posts SKIP_WAITING).
const VERSION = '__SW_VERSION__';
const CACHE = 'hollowlight-' + VERSION;
// The page is cached under './' only: some hosts (Cloudflare Pages) answer ./index.html with a 308 to ./, and a redirected response
// cannot be served to a navigation (the installed app then shows an error page offline).
const INDEX = './';
const STATIC = ['./manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-maskable-512.png', './apple-touch-icon.png', './favicon.svg', './favicon-32.png'];
let firstInstall = false;
let accepted = false;

self.addEventListener('install', (e) => {
  firstInstall = !self.registration.active;
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll([INDEX, ...STATIC])));
});

self.addEventListener('message', (e) => {
  if (e.data === 'SKIP_WAITING') { accepted = true; self.skipWaiting(); }
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k.startsWith('hollowlight-') && k !== CACHE) await caches.delete(k);
    if (firstInstall || accepted) await self.clients.claim();
  })());
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || req.headers.has('range')) return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (req.mode === 'navigate') {
    // Network first so a fresh deploy always wins online; cached copy keeps the game playable offline.
    e.respondWith((async () => {
      try {
        const res = await fetch(req);
        if (res.ok && res.status === 200 && res.type === 'basic') { const c = await caches.open(CACHE); await c.put(INDEX, res.clone()); }
        return res;
      } catch {
        const hit = await caches.match(INDEX);
        if (!hit) return Response.error();
        // never hand a redirected response to a navigation; rebuild it as a plain 200
        return hit.redirected ? new Response(await hit.blob(), { status: 200, headers: hit.headers }) : hit;
      }
    })());
    return;
  }
  const scope = new URL('./', self.location.href).pathname;
  if (STATIC.some((p) => url.pathname === scope + p.slice(2))) {
    e.respondWith(caches.match(req).then((hit) => hit || fetch(req)));
  }
});
