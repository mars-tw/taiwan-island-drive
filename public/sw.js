const ROOT = new URL('./', self.registration.scope);
const CACHE_PREFIX = `island-transport-${encodeURIComponent(ROOT.pathname)}-`;
const CACHE_NAME = `${CACHE_PREFIX}v3-2.9.0`;
const MANIFEST = new URL('./precache.json', ROOT).href;
const ASSET = /\.(?:html|js|css|json|txt|webmanifest|svg|png|jpe?g|webp|glb|woff2?|mp3|m4a|ogg|wav)$/i;
const PAGE_PATHS = new Map([['','index.html'], ['index.html','index.html'], ['car/','car/index.html'], ['car/index.html','car/index.html'], ['train/','train/index.html'], ['train/index.html','train/index.html'], ['flight/','flight/index.html'], ['flight/index.html','flight/index.html']]);
function localAsset(url) { return url.origin === ROOT.origin && url.pathname.startsWith(ROOT.pathname) && !url.pathname.includes('/downloads/') && ASSET.test(url.pathname); }
self.addEventListener('install', event => event.waitUntil((async () => {
  const response = await fetch(MANIFEST, { cache: 'no-store' });
  if (!response.ok) throw new Error('Precache manifest unavailable');
  const entries = await response.json();
  if (!Array.isArray(entries)) throw new Error('Invalid precache manifest');
  const urls = [...new Set([MANIFEST, ...entries.map(path => new URL(path, ROOT).href)])];
  if (urls.some(path => !localAsset(new URL(path)))) throw new Error('Nonlocal precache asset');
  const cache = await caches.open(CACHE_NAME);
  await cache.addAll(urls.map(url => new Request(url, { cache: 'reload' })));
  await self.skipWaiting();
})()));
self.addEventListener('activate', event => event.waitUntil((async () => {
  const names = await caches.keys();
  await Promise.all(names.filter(name => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME).map(name => caches.delete(name)));
  for (const name of ['island-drive-v1', 'island-transport-v2']) {
    if (!names.includes(name)) continue;
    const old = await caches.open(name);
    for (const request of await old.keys()) { const url = new URL(request.url); if (url.origin === ROOT.origin && url.pathname.startsWith(ROOT.pathname)) await old.delete(request); }
    if (!(await old.keys()).length) await caches.delete(name);
  }
  await self.clients.claim();
})()));
self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET' && request.method !== 'HEAD') return;
  const head = request.method === 'HEAD';
  const url = new URL(request.url);
  if (url.origin !== ROOT.origin || !url.pathname.startsWith(ROOT.pathname) || url.pathname.includes('/downloads/')) return;
  const relative = url.pathname.slice(ROOT.pathname.length);
  const page = PAGE_PATHS.get(relative);
  if (request.mode === 'navigate' && page) {
    const pageUrl = new URL(page, ROOT).href;
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      try {
        const response = await fetch(request);
        if (response.ok) { await cache.put(pageUrl, response.clone()); return response; }
        return (await cache.match(pageUrl)) || response;
      } catch (error) { const cached = await cache.match(pageUrl); if (cached) return cached; throw error; }
    })()); return;
  }
  if (!localAsset(url)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    // Static same-origin bundles have identical bytes for every request origin.
    // Preview/CDN servers may add Vary: Origin; anonymous module preloads then
    // differ from install-time requests even though this file is precached.
    const cached = await cache.match(head ? new Request(request.url) : request, { ignoreVary: true });
    if (cached) return head ? new Response(null, { status: cached.status, statusText: cached.statusText, headers: cached.headers }) : cached;
    const response = await fetch(request);
    if (!head && response.ok && response.type !== 'opaque') await cache.put(request, response.clone());
    return response;
  })());
});
