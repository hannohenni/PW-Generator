// Offline-first: App-Dateien werden beim ersten Besuch gecacht und danach aus dem Cache geliefert.
// Im Hintergrund wird (wenn online) die neueste Version nachgeladen -> erscheint beim nächsten Start.
const CACHE = 'passwort-generator-v1';
const ASSETS = [
  './index.html',
  './styles.css',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
  './icons/apple-touch-icon-167.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(ASSETS.map((u) => new Request(u, { cache: 'reload' }))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;

  // Seitenaufrufe (auch "/" oder "?x=y") immer mit der gecachten index.html beantworten
  const key = req.mode === 'navigate' ? './index.html' : req;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const cached = await cache.match(key, { ignoreSearch: true });
    const update = fetch(req).then((res) => {
      if (res && res.ok && res.type === 'basic' && !res.redirected) cache.put(key, res.clone());
      return res;
    }).catch(() => null);

    if (cached) { event.waitUntil(update); return cached; }
    return (await update) || new Response('Offline', { status: 503 });
  })());
});
