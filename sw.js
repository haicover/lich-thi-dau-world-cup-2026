// ========== SERVICE WORKER — World Cup 2026 PWA (US-23 Enhanced) ==========
const CACHE_NAME = 'wc2026-v5';
const OFFLINE_URL = './index.html';

// Files to pre-cache on install
const PRE_CACHE = [
    './',
    './index.html',
    './style.css',
    './app.js',
    './teams.json',
    './matches.json',
    './venues.json',
    './manifest.json',
    './icon-192.png',
    './icon-512.png',
    'https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800&family=Inter:wght@400;500;600;700&display=swap'
];

// Flag images to cache (all 48 teams)
const FLAG_URLS = [
    'mx','za','kr','cz','ca','ba','qa','ch','br','ma','ht','gb-sct',
    'us','py','au','tr','de','cw','ci','ec','nl','jp','se','tn',
    'be','eg','ir','nz','es','cv','sa','uy','fr','sn','iq','no',
    'ar','dz','at','jo','pt','cd','uz','co','gb-eng','hr','gh','pa'
].map(c => `https://flagcdn.com/w40/${c}.png`);

// Install: pre-cache essential files (US-23: NO auto-skipWaiting — let app prompt user)
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll([...PRE_CACHE, ...FLAG_URLS]);
        })
        // NOT calling self.skipWaiting() here — user will click "Update" button
    );
});

// Activate: clean old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
        ).then(() => self.clients.claim())
    );
});

// Fetch handler
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);

    // Skip non-GET requests
    if (event.request.method !== 'GET') return;

    // US-23: Network-first for API routes (live scores need fresh data)
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    // Cache successful API responses for offline fallback
                    if (response && response.ok) {
                        const clone = response.clone();
                        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                    }
                    return response;
                })
                .catch(() => {
                    // Offline: return cached API data if available
                    return caches.match(event.request).then(cached => {
                        if (cached) return cached;
                        // No cache: return empty JSON so app doesn't crash
                        return new Response(JSON.stringify({ matches: [], note: 'offline', cached: true }), {
                            headers: { 'Content-Type': 'application/json' }
                        });
                    });
                })
        );
        return;
    }

    // For same-origin and flagcdn: stale-while-revalidate
    if (url.origin === self.location.origin || url.hostname === 'flagcdn.com' || url.hostname.includes('fonts.g')) {
        event.respondWith(
            caches.match(event.request).then(cached => {
                if (cached) {
                    // Return cached, but also update in background
                    const fetchPromise = fetch(event.request).then(response => {
                        if (response && response.ok) {
                            const clone = response.clone();
                            caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                        }
                        return response;
                    }).catch(() => {});
                    return cached;
                }
                // Not in cache — fetch and cache
                return fetch(event.request).then(response => {
                    if (response && response.ok) {
                        const clone = response.clone();
                        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
                    }
                    return response;
                }).catch(() => caches.match(OFFLINE_URL));
            })
        );
    }
});

// Listen for messages from app (US-23: user-triggered skipWaiting)
self.addEventListener('message', event => {
    if (event.data === 'skipWaiting') {
        self.skipWaiting();
    }
});

// ========== WEB PUSH NOTIFICATION (Phase 7) ==========
self.addEventListener('push', event => {
    if (!event.data) return;

    let payload;
    try {
        payload = event.data.json();
    } catch (e) {
        payload = {
            title: '⚽ World Cup 2026',
            body: event.data.text(),
            icon: '/icon-192.png'
        };
    }

    const options = {
        body: payload.body || '',
        icon: payload.icon || '/icon-192.png',
        badge: '/icon-192.png',
        tag: payload.tag || 'wc2026-default',
        vibrate: payload.vibrate || [200, 100, 200],
        requireInteraction: payload.requireInteraction || false,
        data: payload.data || { url: '/' },
        actions: payload.actions || []
    };

    event.waitUntil(
        self.registration.showNotification(payload.title || '⚽ World Cup 2026', options)
    );
});

self.addEventListener('notificationclick', event => {
    event.notification.close();

    const targetUrl = event.notification.data?.url || '/';

    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
            // Tìm tab đang mở app → focus vào đó
            for (const client of windowClients) {
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    client.navigate(targetUrl);
                    return client.focus();
                }
            }
            // Không có tab nào → mở tab mới
            return clients.openWindow(targetUrl);
        })
    );
});
