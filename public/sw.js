const CACHE_NAME = "wanderplan-v1";
const OFFLINE_URL = "/offline";

// Assets to cache immediately on install
const PRECACHE_ASSETS = [
    "/",
    "/dashboard",
    "/offline",
];

// Install: precache critical assets
self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(PRECACHE_ASSETS);
        })
    );
    self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(
                keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
            )
        )
    );
    self.clients.claim();
});

// Fetch: network-first for API, cache-first for static assets
self.addEventListener("fetch", (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip non-GET requests
    if (request.method !== "GET") return;

    // Skip convex websocket and API calls — they need to be live
    if (url.pathname.startsWith("/api/") || url.hostname.includes("convex")) return;

    // For navigation requests: network first, then cache, then offline page
    if (request.mode === "navigate") {
        event.respondWith(
            fetch(request)
                .then((response) => {
                    // Cache the page for offline
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
                    return response;
                })
                .catch(() => {
                    return caches.match(request).then((cached) => {
                        return cached || caches.match(OFFLINE_URL);
                    });
                })
        );
        return;
    }

    // For static assets: cache-first strategy
    if (
        url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|ico|woff2?|ttf)$/) ||
        url.pathname.startsWith("/_next/static/")
    ) {
        event.respondWith(
            caches.match(request).then((cached) => {
                if (cached) return cached;
                return fetch(request).then((response) => {
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
                    return response;
                });
            })
        );
        return;
    }
});
