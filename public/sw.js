// Offline support: cache the app shell and serve it when the network is unavailable.
// Bump VERSION on release (the Docker build stamps it automatically via CACHE_VERSION if you wish).
const VERSION = 'psle-otter-v1.0.0';
const SHELL = ['/', '/index.html', '/css/style.css', '/manifest.webmanifest', '/icons/icon.svg'];

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const cache = await caches.open(VERSION);
    let files = SHELL;
    try { files = (await (await fetch('/asset-manifest.json', { cache: 'no-store' })).json()).files; } catch { /* fall back to the shell only */ }
    await Promise.all(files.map((f) => cache.add(f).catch(() => {})));
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin) return; // never touch AI calls
  // Network-first for our own files (so updates show up), falling back to cache when offline.
  e.respondWith(
    fetch(req).then((res) => {
      if (res.ok) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); }
      return res;
    }).catch(() => caches.match(req).then((hit) => hit || (req.mode === 'navigate' ? caches.match('/index.html') : Response.error()))));
});
