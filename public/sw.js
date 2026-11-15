// 峠 Touge Inspect — service worker.
// Goal: the checklist opens at the car with no signal. No build plugin: on install
// (and after every successful online visit) we read the page we cache and pick up
// its hashed /_astro/ assets from the HTML, so a new deploy can't strand old files.
//
// Strategy
//   page (navigation)     network first, 3 s timeout, then the cached copy
//   own static assets     cache first (names are content-hashed)
//   Google Fonts          css: stale-while-revalidate · font files: cache first
//
// Bump VERSION only when this file's caching logic changes; content updates
// flow through the network-first page fetch on their own.

const VERSION = 'v2';
const CACHE = `touge-inspect-${VERSION}`;
const FONT_CACHE = 'touge-inspect-fonts-v1';
const NAV_TIMEOUT_MS = 3000;

const SCOPE = new URL(self.registration.scope);
const PAGE = new URL('./', SCOPE).href;
const EXTRA = ['favicon.svg', 'manifest.webmanifest', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png']
  .map((p) => new URL(p, SCOPE).href);

const inScope = (url) => url.origin === SCOPE.origin && url.pathname.startsWith(SCOPE.pathname);
// Only the app's own URL refreshes the cached page. Any other navigation in scope
// (a 404 page, a stray file) must never overwrite it or prune its assets.
const isAppPage = (url) =>
  url.origin === SCOPE.origin && (url.pathname === SCOPE.pathname || url.pathname === `${SCOPE.pathname}index.html`);
const isHashedAsset = (url) => inScope(url) && url.pathname.includes('/_astro/');

/** Same-origin, in-scope href/src values referenced by the page. */
function assetsIn(html) {
  const urls = new Set();
  for (const m of html.matchAll(/\b(?:href|src)="([^"#]+)"/g)) {
    try {
      const u = new URL(m[1], PAGE);
      if (inScope(u) && u.href !== PAGE) urls.add(u.href);
    } catch { /* ignore malformed */ }
  }
  return [...urls];
}

/** Store a fresh copy of the page plus everything it references; drop stale hashed files. */
async function cachePage(response) {
  const html = await response.text();
  const cache = await caches.open(CACHE);
  await cache.put(PAGE, new Response(html, { headers: { 'Content-Type': 'text/html; charset=utf-8' } }));
  const wanted = new Set([...assetsIn(html), ...EXTRA]);
  await Promise.all([...wanted].map(async (url) => {
    if (await cache.match(url, { ignoreVary: true })) return;
    try {
      const res = await fetch(url, { cache: 'no-cache' });
      if (res.ok) await cache.put(url, res);
    } catch { /* offline mid-refresh: keep what we have */ }
  }));
  for (const req of await cache.keys()) {
    const u = new URL(req.url);
    if (isHashedAsset(u) && !wanted.has(u.href)) await cache.delete(req);
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const res = await fetch(PAGE, { cache: 'reload' });
    if (!res.ok) throw new Error(`install: page fetch ${res.status}`);
    await cachePage(res);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) {
      if (key.startsWith('touge-inspect-') && key !== CACHE && key !== FONT_CACHE) await caches.delete(key);
    }
    await self.clients.claim();
  })());
});

const timeout = (ms) => new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms));

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // The page: try the network (fresh deploys win), but never leave someone at the
  // car staring at a spinner — after 3 s, or on failure, serve the cached page.
  if (req.mode === 'navigate' && isAppPage(url)) {
    let refresh = Promise.resolve();
    const network = fetch(req).then((res) => {
      if (res.ok) refresh = cachePage(res.clone());
      return res;
    });
    event.waitUntil(network.then(() => refresh).catch(() => {}));
    event.respondWith((async () => {
      const cached = await caches.match(PAGE, { ignoreVary: true });
      if (!cached) return network; // very first visit: nothing to fall back to
      try {
        return await Promise.race([network, timeout(NAV_TIMEOUT_MS)]);
      } catch {
        return cached;
      }
    })());
    return;
  }

  // Own static files: cache first. (Other page navigations go straight to the network.)
  if (inScope(url) && req.mode !== 'navigate') {
    event.respondWith((async () => {
      // ignoreVary: module scripts send an Origin header the install-time fetch didn't,
      // and servers answer with `Vary: Origin` — names are content-hashed, so it's safe.
      const cached = await caches.match(req, { ignoreSearch: true, ignoreVary: true });
      if (cached) return cached;
      let res;
      try {
        res = await fetch(req);
      } catch {
        return Response.error(); // offline and not cached
      }
      if (res.ok && (isHashedAsset(url) || EXTRA.includes(url.href))) {
        const copy = res.clone();
        event.waitUntil(caches.open(CACHE).then((c) => c.put(req, copy)));
      }
      return res;
    })());
    return;
  }

  // Google Fonts: the CSS can change (new unicode-range splits), the files can't.
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    const isCss = url.hostname === 'fonts.googleapis.com';
    event.respondWith((async () => {
      const cache = await caches.open(FONT_CACHE);
      const cached = await cache.match(req);
      const network = fetch(req).then((res) => {
        if (res.ok || res.type === 'opaque') cache.put(req, res.clone());
        return res;
      });
      if (cached) {
        if (isCss) event.waitUntil(network.catch(() => {}));
        return cached;
      }
      return network;
    })());
  }
});
