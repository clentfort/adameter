// Service worker that lets the app start without a network connection.
//
// Pages are fetched from the network first and fall back to the cache, so an
// online device always gets the latest deploy. Build assets under
// /_next/static are immutable and served from the cache first. The worker is
// registered as /sw.js?v=<build id>, so every deploy installs a new worker
// that precaches the pages and build assets of that build and removes the
// previous cache. If precaching fails, e.g. because the connection drops, the
// new worker is not installed and the previous one keeps working; the browser
// tries again on a later visit.
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
// Build assets refer to lazily loaded chunks without the /_next/ prefix.
const RELATIVE_ASSET_PATTERN =
	/(?<![\w/])static\/(?:chunks|css|media)\/[\w./-]+\.(?:js|css|woff2?|ttf|otf|png|jpe?g|gif|svg|webp|avif|ico)\b/g;
const MAX_PRECACHED_ASSETS = 2000;

function findAssets(text) {
	return [
		...(text.match(STATIC_ASSET_PATTERN) ?? []),
		...(text.match(RELATIVE_ASSET_PATTERN) ?? []).map(
			(path) => `/_next/${path}`,
		),
	];
}

async function fetchForCache(url, { isOptional = false } = {}) {
	const response = await fetch(url, { cache: 'reload' });
	// A path found in a build asset that does not exist is not worth failing
	// the install for; anything else, e.g. a dropped connection, is.
	if (isOptional && response.status === 404) return undefined;
	if (!response.ok) {
		throw new Error(`Precaching ${url} failed (${response.status})`);
	}
	return response;
}

/**
 * Precaches the pages and every build asset they load, including chunks that
 * are only imported lazily, so features work offline before their first use.
 * Rejects if anything fails.
 */
async function precache(cache) {
	const assets = new Set();
	const queue = [];
	const enqueue = (text) => {
		for (const asset of findAssets(text)) {
			if (assets.has(asset)) continue;
			if (assets.size >= MAX_PRECACHED_ASSETS) {
				throw new Error('Too many build assets to precache');
			}
			assets.add(asset);
			queue.push(asset);
		}
	};

	await Promise.all(
		PAGES.map(async (page) => {
			const response = await fetchForCache(page);
			enqueue(await response.clone().text());
			await cache.put(page, response);
		}),
	);

	while (queue.length > 0) {
		const batch = queue.splice(0, 20);
		await Promise.all(
			batch.map(async (asset) => {
				const response = await fetchForCache(asset, { isOptional: true });
				if (!response) return;
				if (/\.(?:js|css)$/.test(new URL(asset, self.location.href).pathname)) {
					enqueue(await response.clone().text());
				}
				await cache.put(asset, response);
			}),
		);
	}
}

self.addEventListener('install', (event) => {
	event.waitUntil(
		(async () => {
			const cache = await caches.open(CACHE_NAME);
			try {
				await precache(cache);
			} catch (error) {
				// Fail the install, so the working worker and its cache stay.
				await caches.delete(CACHE_NAME);
				throw error;
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
	// Room invite links carry the room in the query, so match by path.
	let response;
	try {
		response = await fetchWithTimeout(request, NAVIGATION_TIMEOUT_MS);
	} catch (error) {
		const cached = await cache.match(url.pathname);
		if (cached) return cached;
		throw error;
	}
	if (response.ok && response.type === 'basic') {
		await cache.put(url.pathname, response.clone());
		return response;
	}
	// The app runs from local data, so a cached page beats a server error or
	// rate limit page.
	if (response.status >= 500 || response.status === 429) {
		const cached = await cache.match(url.pathname);
		if (cached) return cached;
	}
	return response;
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
