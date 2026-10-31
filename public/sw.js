// Wispwick service worker (hand-written, no dependencies). Own files only: same-origin GET, nothing else.
// VERSION is stamped at build time by vite.config.js (package version + hash of index.html).
// BLANK-FIX (2026-10-31): a new version activates at once (skipWaiting on install). The game is one self-contained page, so a
// new worker can never break a page that is already running, while a worker left WAITING kept the old fetch rules in charge
// with the only 'accept' button on a title screen that never appeared. The page shows 'New version ready' and reloads when
// the player taps it (src/pwa/index.js).
const VERSION = '__SW_VERSION__';
const BUILD = '__BUILD_ID__'; // same id as the page's __BUILD_ID__ (vite.config.js)
const CACHE = 'hollowlight-' + VERSION;
// The page is cached under './' only: some hosts (Cloudflare Pages) answer ./index.html with a 308 to ./, and a redirected response
// cannot be served to a navigation (the installed app then shows an error page offline).
const INDEX = './';
const STATIC = ['./manifest.webmanifest', './icon-192.png', './icon-512.png', './icon-maskable-512.png', './apple-touch-icon.png', './favicon.svg', './favicon-32.png'];
// Network first for these (a stale manifest kept an old display mode in the installed app); the rest of STATIC is cache first.
const FRESH = ['./manifest.webmanifest'];

self.addEventListener('install', (e) => {
  self.skipWaiting(); // BLANK-FIX: never wait (see top)
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll([INDEX, ...STATIC])));
});

self.addEventListener('message', (e) => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting(); // kept for pages from older builds
  else if (e.data === 'BUILD' && e.ports && e.ports[0]) e.ports[0].postMessage(BUILD);
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k.startsWith('hollowlight-') && k !== CACHE) await caches.delete(k);
    await self.clients.claim();
  })());
});

/** Plain 200 copy of a cached response (a redirected response must never be handed to a navigation). */
async function plain(hit) {
  return hit.redirected ? new Response(await hit.blob(), { status: 200, headers: hit.headers }) : hit;
}

/** Store a copy in the background: the response goes to the page at once and a failing or slow cache never holds it up. */
function keep(e, key, res) {
  if (!(res && res.ok && res.status === 200 && res.type === 'basic' && !res.redirected)) return;
  const copy = res.clone();
  e.waitUntil(caches.open(CACHE).then((c) => c.put(key, copy)).catch(() => {}));
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || req.headers.has('range')) return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  const scope = new URL('./', self.location.href).pathname;
  const isFresh = FRESH.some((p) => url.pathname === scope + p.slice(2));
  if (req.mode === 'navigate' || isFresh) {
    // Network first (revalidated, so a host's max-age never hands back an old page) so a fresh deploy always wins online;
    // the cached copy keeps the game playable offline. The response is returned before it is cached (BLANK-FIX).
    e.respondWith((async () => {
      let res;
      try {
        let net = req;
        try { net = new Request(req, { cache: 'no-cache' }); } catch { net = req; }
        res = await fetch(net);
      } catch {
        try {
          const hit = await caches.match(isFresh ? req : INDEX);
          if (hit) return await plain(hit);
        } catch { /* cache unreadable: fall through */ }
        return Response.error();
      }
      keep(e, isFresh ? req : INDEX, res);
      return res;
    })());
    return;
  }
  if (STATIC.some((p) => url.pathname === scope + p.slice(2))) {
    e.respondWith(caches.match(req).then((hit) => hit || fetch(req)).catch(() => fetch(req)));
  }
});
