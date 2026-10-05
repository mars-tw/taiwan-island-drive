/* Production-only worker. All URLs resolve against the application's scope. */
const CACHE_NAME = 'island-drive-v1';
const CACHE_PREFIX = 'island-drive-';
const ROOT = new URL('./', self.registration.scope);
const INDEX = new URL('./index.html', ROOT).href;
const MANIFEST = new URL('./precache.json', ROOT).href;
const ASSET = /\.(?:html|js|css|json|txt|webmanifest|svg|png|jpe?g|webp|glb|woff2?|mp3|ogg|wav)$/i;

function localAsset(url) {
  return url.origin === ROOT.origin && url.pathname.startsWith(ROOT.pathname)
    && !url.pathname.includes('/downloads/') && ASSET.test(url.pathname);
}

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const response = await fetch(MANIFEST, { cache: 'no-store' });
    if (!response.ok) throw new Error('The PWA precache manifest is unavailable.');
    const entries = await response.json();
    if (!Array.isArray(entries)) throw new Error('Invalid precache manifest.');
    const urls = [...new Set([INDEX, MANIFEST, ...entries.map(path => new URL(path, ROOT).href)])];
    if (urls.some(value => !localAsset(new URL(value)))) throw new Error('Precache contains a nonlocal asset.');
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(urls.map(url => new Request(url, { cache: 'reload' })));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter(name => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME)
      .map(name => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== ROOT.origin || !url.pathname.startsWith(ROOT.pathname)) return;
  if (url.pathname.includes('/downloads/')) return;
  if (request.mode === 'navigate' && (url.pathname === ROOT.pathname || url.pathname === new URL(INDEX).pathname)) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      try {
        const response = await fetch(request);
        if (response.ok) {
          await cache.put(INDEX, response.clone());
          return response;
        }
        return (await cache.match(INDEX)) || response;
      } catch (error) {
        const cached = await cache.match(INDEX);
        if (cached) return cached;
        throw error;
      }
    })());
    return;
  }
  if (!localAsset(url)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);
    if (cached) return cached;
    const response = await fetch(request);
    if (response.ok && response.type !== 'opaque') await cache.put(request, response.clone());
    return response;
  })());
});
