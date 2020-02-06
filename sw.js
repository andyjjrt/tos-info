const filesToCache = [
  "/index.html",
  "file/bootstrap.min.css",
  "file/bootstrap.min.js",
  "file/jquery-3.4.1.min.js",
  "file/popper.min.js",
  "file/manifest.json",
  "app.js",
  "https://cdn.glitch.com/514798f5-1354-4db7-abc9-6d6ebef3f69c%2Fpic.JPEG?v=1580718068811",
  "https://vignette.wikia.nocookie.net/tos/images/8/83/000i.png/revision/latest/scale-to-width-down/60?path-prefix=zh",
  "https://cdn.glitch.com/514798f5-1354-4db7-abc9-6d6ebef3f69c%2Fbrand.png?v=1580732619329"
];

const cacheName = "static-online";
const newName = "static-offline";

var dlog = [];
function logdate(msg) {
  dlog.push(msg);
  console.warn(dlog); // if you need to print the output
}

// activate
self.addEventListener("activate", event => {
  console.log("[ServiceWorker]Cache updated/installed,now waiting...");
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      var promiseArr = cacheNames.map(function(item) {
        if (item !== cacheName) {
          // Delete that cached file
          return caches.delete(item);
          console.log("[ServiceWorker] Removing old cache", item);
        }
      });
      return Promise.all(promiseArr);
    })
  ); // end e.waitUntil
});

self.addEventListener("install", event => {
  console.log("[ServiceWorker] Cache updating/installing");
  self.skipWaiting();
  event.waitUntil(
    caches.open(cacheName).then(cache => {
      return cache.addAll(filesToCache);
    })
  );
});

// fetch
self.addEventListener("fetch", event => {
  console.log("[Service Worker] Fetch (data) :", event.request.url);
  if (event.request.url.includes(".jpg") || event.request.url.includes(".png") || event.request.url.includes(".JPEG")) {
    event.respondWith(
      caches.open(cacheName).then(cache => {
        return fetch(event.request)
          .then(response => {
            return response;
          })
          .catch(err => {
            // Network request failed, try to get it from the cache.
            return cache.match(event.request);
            console.log("[Service Worker] Error.");
          });
      })
    );
    return;
  }
  if (event.request.url.includes("test.json")) {
    event.respondWith(
      caches.open(cacheName).then(cache => {
        return fetch(event.request)
          .then(response => {
            // If the response was good, clone it and store it in the cache.

            if (response.status === 200) {
              cache.put(event.request.url, response.clone());
            }
            console.log("[Service Worker] New data cached.");
            return response;
          })
          .catch(err => {
            // Network request failed, try to get it from the cache.
            return cache.match(event.request);
            console.log("[Service Worker] Error.");
          });
      })
    );
    return;
  }
  event.respondWith(
    caches.match(event.request).then(function(response) {
      return (
        response ||
        fetch(event.request).then(res =>
          // 存 caches 之前，要先打開 caches.open(dataCacheName)
          caches.open(cacheName).then(function(cache) {
            // cache.put(key, value)
            // 下一次 caches.match 會對應到 event.request
            cache.put(event.request, res.clone());
            return res;
          })
        )
      );
    })
  );
});
