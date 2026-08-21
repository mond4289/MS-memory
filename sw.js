const CACHE_NAME = "photo-memory-v1";
const CORE_ASSETS = ["/", "/index.html", "/css/style.css", "/js/app.js", "/js/i18n.js", "/manifest.json"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(CORE_ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

// ໂຫລດຈາກເນັດກ່ອນ, ຖ້າອິນເຕີເນັດຂາດຄ່ອຍໃຊ້ຈາກ cache (ບໍ່ cache ຂໍ້ມູນຮູບ/API)
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const resClone = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(e.request, resClone));
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
