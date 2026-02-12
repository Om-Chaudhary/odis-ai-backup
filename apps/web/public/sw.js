// @ts-nocheck
// Cache static assets for instant repeat visits
const CACHE_NAME = "odis-desktop-v1";
const STATIC_ASSETS = ["/", "/images/hero/bg.webp", "/images/hero/hero-1.webp"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)),
  );
});

self.addEventListener("fetch", (event) => {
  // Only cache GET requests
  if (event.request.method !== "GET") return;

  event.respondWith(
    caches.match(event.request).then((response) => {
      // Return cached version or fetch new
      return response || fetch(event.request);
    }),
  );
});
