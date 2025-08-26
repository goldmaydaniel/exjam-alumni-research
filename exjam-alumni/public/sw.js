// Enhanced Service Worker for EXJAM Alumni Association
// Implements advanced caching strategies and offline functionality

const CACHE_VERSION = "v1.0.0";
const STATIC_CACHE = `exjam-alumni-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `exjam-alumni-dynamic-${CACHE_VERSION}`;
const API_CACHE = `exjam-alumni-api-${CACHE_VERSION}`;

// Critical resources to cache on install
const STATIC_RESOURCES = [
  "/",
  "/manifest.json",
  "/favicon.ico",
  "/exjam-logo.svg",
  "/afms-logo.png",
];

// Network timeout in milliseconds
const NETWORK_TIMEOUT = 3000;

// Install event - cache static resources
self.addEventListener("install", (event) => {
  console.log("Enhanced Service Worker installing...");

  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => {
        console.log("Caching critical resources");
        return cache.addAll(STATIC_RESOURCES);
      })
      .then(() => {
        return self.skipWaiting();
      })
      .catch((error) => {
        console.warn("Cache installation failed:", error);
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("Enhanced Service Worker activating...");

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (
              cacheName.startsWith("exjam-alumni-") &&
              cacheName !== STATIC_CACHE &&
              cacheName !== DYNAMIC_CACHE &&
              cacheName !== API_CACHE
            ) {
              console.log("Deleting old cache:", cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        return self.clients.claim();
      })
  );
});

// Fetch event - implement intelligent caching strategies
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only handle same-origin GET requests
  if (url.origin !== location.origin || request.method !== "GET") {
    return;
  }

  // Route-specific caching strategies
  if (url.pathname.startsWith("/api/")) {
    // API routes - Network First with fallback
    event.respondWith(networkFirstStrategy(request, API_CACHE));
  } else if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.match(/\.(css|js|png|jpg|jpeg|gif|svg|ico|webp)$/)
  ) {
    // Static assets - Cache First
    event.respondWith(cacheFirstStrategy(request, STATIC_CACHE));
  } else {
    // HTML pages - Stale While Revalidate
    event.respondWith(staleWhileRevalidateStrategy(request, DYNAMIC_CACHE));
  }
});

// Cache First Strategy - for static assets
async function cacheFirstStrategy(request, cacheName) {
  try {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.error("Cache First strategy failed:", error);
    return new Response("Asset unavailable", { status: 404 });
  }
}

// Network First Strategy - for API calls
async function networkFirstStrategy(request, cacheName) {
  try {
    const cache = await caches.open(cacheName);

    try {
      // Try network first with timeout
      const networkResponse = await Promise.race([
        fetch(request),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Network timeout")), NETWORK_TIMEOUT)
        ),
      ]);

      if (networkResponse.ok) {
        // Cache successful responses (not error responses)
        if (networkResponse.status < 400) {
          cache.put(request, networkResponse.clone());
        }
        return networkResponse;
      }
    } catch (networkError) {
      console.warn("Network request failed, trying cache:", networkError);
    }

    // Fallback to cache
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Return offline fallback for API calls
    return new Response(
      JSON.stringify({
        error: "Network unavailable",
        offline: true,
        message: "You are currently offline. Some data may be outdated.",
      }),
      {
        status: 503,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Network First strategy failed:", error);
    return new Response("Service unavailable", { status: 503 });
  }
}

// Stale While Revalidate Strategy - for pages
async function staleWhileRevalidateStrategy(request, cacheName) {
  try {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);

    // Start network request in background
    const networkResponsePromise = fetch(request)
      .then((networkResponse) => {
        if (networkResponse.ok) {
          cache.put(request, networkResponse.clone());
        }
        return networkResponse;
      })
      .catch((error) => {
        console.warn("Background fetch failed:", error);
        return null;
      });

    // Return cached response immediately if available
    if (cachedResponse) {
      // Update cache in background
      networkResponsePromise;
      return cachedResponse;
    }

    // Wait for network if no cache
    const networkResponse = await networkResponsePromise;
    return (
      networkResponse ||
      new Response(
        "<!DOCTYPE html><html><head><title>Offline</title></head><body><h1>You are offline</h1><p>Please check your internet connection.</p></body></html>",
        { status: 503, headers: { "Content-Type": "text/html" } }
      )
    );
  } catch (error) {
    console.error("Stale While Revalidate strategy failed:", error);
    return new Response("Service unavailable", { status: 503 });
  }
}

// Message handling for manual operations
self.addEventListener("message", (event) => {
  if (event.data && event.data.type) {
    switch (event.data.type) {
      case "SKIP_WAITING":
        self.skipWaiting();
        break;
      case "CACHE_REFRESH":
        refreshCache(event.data.urls || []);
        break;
      case "CLEAR_CACHE":
        clearAllCaches();
        break;
      default:
        console.log("Unknown message type:", event.data.type);
    }
  }
});

// Refresh specific URLs in cache
async function refreshCache(urls) {
  try {
    const cache = await caches.open(DYNAMIC_CACHE);

    for (const url of urls) {
      try {
        const response = await fetch(url);
        if (response.ok) {
          await cache.put(url, response);
        }
      } catch (error) {
        console.warn("Failed to refresh cache for:", url, error);
      }
    }

    console.log("Cache refresh completed for", urls.length, "URLs");
  } catch (error) {
    console.error("Cache refresh failed:", error);
  }
}

// Clear all application caches
async function clearAllCaches() {
  try {
    const cacheNames = await caches.keys();
    await Promise.all(
      cacheNames
        .filter((name) => name.startsWith("exjam-alumni-"))
        .map((name) => caches.delete(name))
    );

    console.log("All application caches cleared");
  } catch (error) {
    console.error("Clear caches failed:", error);
  }
}
