// ========== SERVICE WORKER — World Cup 2026 PWA ==========
const CACHE_NAME = 'wc2026-v2';
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
    'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Inter:wght@300;400;500;600;700&display=swap'
];

// Flag images to cache (all 48 teams)
const FLAG_URLS = [
    'mx','za','kr','cz','ca','ba','qa','ch','br','ma','ht','gb-sct',
    'us','py','au','tr','de','cw','ci','ec','nl','jp','se','tn',
    'be','eg','ir','nz','es','cv','sa','uy','fr','sn','iq','no',
    'ar','dz','at','jo','pt','cd','uz','co','gb-eng','hr','gh','pa'
].map(c => `https://flagcdn.com/w40/${c}.png`);

// Install: pre-cache essential files
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll([...PRE_CACHE, ...FLAG_URLS]);
        }).then(() => self.skipWaiting())
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

// Fetch: cache-first for static, network-first for API
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);

    // Skip non-GET requests
    if (event.request.method !== 'GET') return;

    // For same-origin and flagcdn: cache-first
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

// Listen for messages from app
self.addEventListener('message', event => {
    if (event.data === 'skipWaiting') {
        self.skipWaiting();
    }
});
