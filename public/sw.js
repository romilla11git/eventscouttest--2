self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  // Pass through all requests to network
  event.respondWith(fetch(event.request));
});
