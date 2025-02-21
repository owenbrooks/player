// Follows guidance at https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Tutorials/js13kGames/Offline_Service_workers

const DEV_MODE_DISABLE_CACHING = false;

const cacheName = "replay-v3";
const appShellFiles = [
  "/",
  "/index.html",
  "/script.js",
  "/styles.css",
  "/player_logo.svg",
  "/icons/apple-touch-icon.png",
  "/icons/favicon-96x96.png",
  "/icons/favicon.ico",
  "/icons/favicon.svg",
  "/icons/web-app-manifest-192x192.png",
  "/icons/web-app-manifest-512x512.png",
];
const contentToCache = appShellFiles;

self.addEventListener("install", (e) => {
  console.log("[Service Worker] Install");
  e.waitUntil(
    (async () => {
      const cache = await caches.open(cacheName);
      console.log("[Service Worker] Caching all: app shell and content");
      await cache.addAll(contentToCache);
    })(),
  );
});

self.addEventListener("fetch", (e) => {
  console.log(`[Service Worker] Fetched resource ${e.request.url}`);
  // We just serve the fetch from the cache
  e.respondWith(
    (async () => {
      if (!DEV_MODE_DISABLE_CACHING) {
        const r = await caches.match(e.request);
        console.log(`[Service Worker] Fetching resource: ${e.request.url}`);
        if (r) {
          return r;
        }
      }
      const response = await fetch(e.request);
      const cache = await caches.open(cacheName);
      console.log(`[Service Worker] Caching new resource: ${e.request.url}`);
      cache.put(e.request, response.clone());
      return response;
    })(),
  );
});

// Clear out the old cache if it is no longer needed
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key === cacheName) {
            return;
          }
          return caches.delete(key);
        }),
      );
    }),
  );
});

