// Service worker that lets the app start without a network connection.
//
// Pages are fetched from the network first and fall back to the cache, so an
// online device always gets the latest deploy. Build assets under
// /_next/static are immutable and served from the cache first. The worker is
// registered as /sw.js?v=<build id>, so every deploy installs a new worker
// that precaches the pages of that build and removes the previous cache.
//
// Only same-origin GET requests are handled. Requests to the sync relay and
// to other origins are never cached.

const VERSION = new URL(self.location.href).searchParams.get('v') ?? 'dev';
const CACHE_PREFIX = 'adameter-';
const CACHE_NAME = `${CACHE_PREFIX}${VERSION}`;
const NAVIGATION_TIMEOUT_MS = 4000;

// Keep in sync with the routes in src/app (checked by service-worker-registration.test.ts).
const PAGES = [
	'/',
	'/diaper',
	'/events',
	'/feeding',
	'/growth',
	'/legal/imprint',
	'/legal/privacy-policy',
	'/settings',
	'/settings/appearance',
	'/settings/children',
	'/settings/data',
	'/settings/diapers',
	'/settings/sharing',
	'/statistics',
];

const STATIC_ASSET_PATTERN = /\/_next\/static\/[^\s"')\\]+/g;

async function precachePage(cache, page) {
	const response = await fetch(page, { cache: 'reload' });
	if (!response.ok) {
		throw new Error(`Precaching ${page} failed (${response.status})`);
	}
	const html = await response.clone().text();
	await cache.put(page, response);

	const assets = new Set(html.match(STATIC_ASSET_PATTERN) ?? []);
	await Promise.all(
		[...assets].map(async (asset) => {
			if (await cache.match(asset)) return;
			const assetResponse = await fetch(asset);
			if (assetResponse.ok) {
				await cache.put(asset, assetResponse);
			}
		}),
	);
}

self.addEventListener('install', (event) => {
	event.waitUntil(
		(async () => {
			const cache = await caches.open(CACHE_NAME);
			const results = await Promise.allSettled(
				PAGES.map((page) => precachePage(cache, page)),
			);
			for (const result of results) {
				if (result.status === 'rejected') {
					// The worker cannot use the app's logger.
					// eslint-disable-next-line no-console
					console.warn('[SW]', result.reason);
				}
			}
			await self.skipWaiting();
		})(),
	);
});

self.addEventListener('activate', (event) => {
	event.waitUntil(
		(async () => {
			const cacheNames = await caches.keys();
			await Promise.all(
				cacheNames
					.filter(
						(name) => name.startsWith(CACHE_PREFIX) && name !== CACHE_NAME,
					)
					.map((name) => caches.delete(name)),
			);
			await self.clients.claim();
		})(),
	);
});

function fetchWithTimeout(request, timeout) {
	return new Promise((resolve, reject) => {
		const timer = setTimeout(
			() => reject(new Error('Network timeout')),
			timeout,
		);
		fetch(request).then(
			(response) => {
				clearTimeout(timer);
				resolve(response);
			},
			(error) => {
				clearTimeout(timer);
				reject(error);
			},
		);
	});
}

async function handleNavigation(request) {
	const cache = await caches.open(CACHE_NAME);
	const url = new URL(request.url);
	try {
		const response = await fetchWithTimeout(request, NAVIGATION_TIMEOUT_MS);
		if (response.ok && response.type === 'basic') {
			await cache.put(url.pathname, response.clone());
		}
		return response;
	} catch (error) {
		// Room invite links carry the room in the query, so match by path.
		const cached = await cache.match(url.pathname);
		if (cached) return cached;
		throw error;
	}
}

async function handleStaticAsset(request) {
	const cache = await caches.open(CACHE_NAME);
	const cached = await cache.match(request);
	if (cached) return cached;
	const response = await fetch(request);
	if (response.ok) {
		await cache.put(request, response.clone());
	}
	return response;
}

async function handleOtherAsset(event) {
	const cache = await caches.open(CACHE_NAME);
	const cached = await cache.match(event.request);
	const update = fetch(event.request).then(async (response) => {
		if (response.ok && response.type === 'basic') {
			await cache.put(event.request, response.clone());
		}
		return response;
	});
	if (cached) {
		event.waitUntil(update.catch(() => {}));
		return cached;
	}
	return update;
}

self.addEventListener('fetch', (event) => {
	const { request } = event;
	if (request.method !== 'GET') return;

	const url = new URL(request.url);
	if (url.origin !== self.location.origin) return;

	if (request.mode === 'navigate') {
		event.respondWith(handleNavigation(request));
		return;
	}

	// Server component payloads depend on router state headers. When they fail
	// offline, Next.js falls back to a full navigation served from the cache.
	if (request.headers.get('RSC') === '1' || url.searchParams.has('_rsc')) {
		return;
	}

	if (url.pathname.startsWith('/_next/static/')) {
		event.respondWith(handleStaticAsset(request));
		return;
	}

	if (url.pathname === '/sw.js') return;

	event.respondWith(handleOtherAsset(event));
});
