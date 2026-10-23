/* Generated only after a production build. No credentials or private records are cached. */
const version = __VERSION__;
const assets = __ASSETS__;
const cacheName = 'kolegium-shell-' + version;
const routes =
  /^(?:\/|\/(?:login|schedule|attendance|courses|assessments|projects|todo|thesis|installments|settings|reminders)(?:\/[^?#]*)?)$/;
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(cacheName);
      for (const path of assets) {
        const response = await fetch(new Request(path, { cache: 'reload', credentials: 'omit' }));
        if (!response.ok || response.redirected) throw new Error('Incomplete public shell.');
        await cache.put(path, response);
      }
      // Updates wait for a deliberate request from the UI. First install activates normally.
    })(),
  );
});
self.addEventListener('activate', (event) => {
  // Keep prior public versions so other open tabs can finish unsaved work and lazy-load old chunks.
  event.waitUntil(self.clients.claim());
});
self.addEventListener('message', (event) => {
  if (event.data?.type === 'ACTIVATE_UPDATE') event.waitUntil(self.skipWaiting());
});
self.addEventListener('fetch', (event) => {
  const request = event.request,
    url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin || url.search) return;
  if (request.mode === 'navigate' && routes.test(url.pathname)) {
    event.respondWith(
      (async () => (await (await caches.open(cacheName)).match('/index.html')) || fetch(request))(),
    );
  } else if (
    assets.includes(url.pathname) ||
    /^\/[A-Za-z0-9_-]+-[A-Za-z0-9_-]+\.(?:js|css)$/.test(url.pathname)
  ) {
    event.respondWith(
      (async () => {
        const current = await (await caches.open(cacheName)).match(url.pathname);
        if (current) return current;
        for (const name of await caches.keys()) {
          if (!name.startsWith('kolegium-shell-')) continue;
          const old = await (await caches.open(name)).match(url.pathname);
          if (old) return old;
        }
        return fetch(request); // No runtime caching, including unknown assets.
      })(),
    );
  }
});
