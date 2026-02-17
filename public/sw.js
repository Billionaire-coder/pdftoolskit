const CACHE_NAME = 'pdftoolkit-v2';
const ASSETS_TO_CACHE = [
    '/',
    '/manifest.json',
    '/icon-192.png',
    '/pdf-lib.min.js',
    '/pdf.worker.min.mjs',
    // We add common tool pages later or rely on runtime caching
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(ASSETS_TO_CACHE);
        })
    );
});

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // Skip API routes, Next.js internals, and extension schemes
    if (url.pathname.startsWith('/api/') ||
        url.pathname.startsWith('/_next/') ||
        url.protocol.startsWith('chrome-extension')) {
        return;
    }

    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});
