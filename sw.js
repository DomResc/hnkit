/**
 * Service Worker for PWA Support
 */

const CACHE_NAME = 'hn-client-v1';
const STATIC_CACHE = 'hn-static-v1';
const DYNAMIC_CACHE = 'hn-dynamic-v1';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/src/css/variables.css',
  '/src/css/base.css',
  '/src/css/components.css',
  '/src/css/animations.css',
  '/src/js/app.js',
  '/src/js/api.js',
  '/src/js/state.js',
  '/src/js/ui.js',
  '/src/js/utils.js',
  '/src/js/comments.js',
  '/manifest.json'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => self.skipWaiting())
      .catch((err) => {
        console.error('[SW] Failed to cache static assets:', err);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== STATIC_CACHE && name !== DYNAMIC_CACHE)
            .map((name) => caches.delete(name))
        );
      })
      .then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    // For API requests, use network-first strategy
    if (url.hostname === 'hacker-news.firebaseio.com') {
      event.respondWith(networkFirstStrategy(request));
      return;
    }
    
    // For other cross-origin, just fetch
    return;
  }

  // For same-origin requests, use cache-first strategy
  event.respondWith(cacheFirstStrategy(request));
});

/**
 * Cache-first strategy
 * Try cache first, fallback to network, then cache the response
 */
async function cacheFirstStrategy(request) {
  try {
    // Try cache first
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    // If not in cache, fetch from network
    const networkResponse = await fetch(request);
    
    // Cache the response for future use
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.error('[SW] Fetch failed:', error);
    
    // Return a fallback response
    return new Response('Offline - content not available', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: new Headers({
        'Content-Type': 'text/plain'
      })
    });
  }
}

/**
 * Network-first strategy
 * Try network first, fallback to cache
 */
async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    // If network fails, try cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }

    throw error;
  }
}

// Handle messages from clients
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys()
        .then((cacheNames) => {
          return Promise.all(
            cacheNames.map((name) => caches.delete(name))
          );
        })
        .then(() => {
          event.ports[0].postMessage({ success: true });
        })
    );
  }
});

// Background sync (if supported)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-stories') {
    event.waitUntil(syncStories());
  }
});

async function syncStories() {
  try {
    const response = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json');
    const data = await response.json();
    
    // Cache the result
    const cache = await caches.open(DYNAMIC_CACHE);
    await cache.put('https://hacker-news.firebaseio.com/v0/topstories.json', new Response(JSON.stringify(data)));
    
    console.log('[SW] Stories synced in background');
  } catch (error) {
    console.error('[SW] Background sync failed:', error);
  }
}
