// Робить так, щоб розклад відкривався без інтернету.
// Спочатку пробує мережу (щоб ти бачив нові зміни), якщо мережі нема — бере збережене.
const CACHE = "rozklad-v2";
const FILES = [
  "./",
  "index.html",
  "style.css",
  "app.js",
  "rozklad.js",
  "profil.js",
  "settings.js",
  "dostup.js",
  "info.js",
  "vhid.js",
  "manifest.json",
  "icon-180.png",
  "icon-192.png",
  "icon-512.png"
];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)));
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  if (!e.request.url.startsWith(self.location.origin)) return;   // чужі адреси не кешуємо
  e.respondWith(
    fetch(e.request)
      .then(res => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
        }
        return res;
      })
      .catch(() => caches.match(e.request).then(r => r || caches.match("index.html")))
  );
});
