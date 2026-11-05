import { readFileSync } from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { describe, expect, it } from 'vitest';

const SOURCE = readFileSync(
	path.resolve(__dirname, '../../public/sw.js'),
	'utf8',
);
const ORIGIN = 'https://app.example';

type Handler = (event: unknown) => void;

function cacheKey(request: Request | string) {
	return new URL(typeof request === 'string' ? request : request.url, ORIGIN)
		.pathname;
}
type Routes = Record<string, () => Response | Promise<Response>>;

/** Runs public/sw.js against in-memory caches and a routed fetch. */
function loadServiceWorker(routes: Routes) {
	const cacheStorage = new Map<string, Map<string, Response>>();
	const handlers = new Map<string, Handler>();
	const requested: string[] = [];
	const caches = {
		delete: async (name: string) => cacheStorage.delete(name),
		keys: async () => [...cacheStorage.keys()],
		open: async (name: string) => {
			if (!cacheStorage.has(name)) cacheStorage.set(name, new Map());
			const entries = cacheStorage.get(name)!;
			return {
				match: async (request: Request | string) =>
					entries.get(cacheKey(request))?.clone(),
				put: async (request: Request | string, response: Response) => {
					entries.set(cacheKey(request), response);
				},
			};
		},
	};
	const fetch = async (input: Request | string) => {
		const url = new URL(typeof input === 'string' ? input : input.url, ORIGIN);
		requested.push(url.pathname);
		const route = routes[url.pathname];
		if (!route) return new Response('Not found', { status: 404 });
		return route();
	};
	const self = {
		addEventListener: (type: string, handler: Handler) => {
			handlers.set(type, handler);
		},
		clients: { claim: async () => {} },
		location: new URL(`${ORIGIN}/sw.js?v=build-2`),
		skipWaiting: async () => {},
	};
	vm.runInNewContext(SOURCE, {
		caches,
		clearTimeout,
		console: { warn: () => {} },
		fetch,
		Response,
		self,
		setTimeout,
		URL,
	});

	const dispatch = async (type: string, extra: object = {}) => {
		let pending: Promise<unknown> = Promise.resolve();
		let response: Promise<Response> | undefined;
		handlers.get(type)!({
			...extra,
			respondWith: (value: Promise<Response>) => {
				response = value;
			},
			waitUntil: (value: Promise<unknown>) => {
				pending = value;
			},
		});
		await pending;
		return response;
	};
	return { cacheStorage, dispatch, requested };
}

function page(html: string) {
	return () => new Response(html, { headers: { 'Content-Type': 'text/html' } });
}

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

function appRoutes(overrides: Routes = {}): Routes {
	const routes: Routes = {
		'/_next/static/chunks/lazy.js': () => new Response('lazy()'),
		'/_next/static/chunks/main.js': () =>
			new Response(
				'load("static/chunks/lazy.js"); load("static/chunks/gone.js"); "static/chunks/"+id',
			),
	};
	for (const path of PAGES) {
		routes[path] = page('<script src="/_next/static/chunks/main.js"></script>');
	}
	return { ...routes, ...overrides };
}

describe('service worker', () => {
	it('precaches pages and lazily loaded chunks', async () => {
		const worker = loadServiceWorker(appRoutes());

		await worker.dispatch('install');

		const cache = worker.cacheStorage.get('adameter-build-2')!;
		expect(cache.has('/feeding')).toBe(true);
		expect(cache.has('/_next/static/chunks/main.js')).toBe(true);
		expect(cache.has('/_next/static/chunks/lazy.js')).toBe(true);
		// A missing chunk is skipped and a path prefix is not fetched.
		expect(worker.requested).toContain('/_next/static/chunks/gone.js');
		expect(worker.requested).not.toContain('/_next/static/chunks/');
	});

	it('keeps the previous cache when precaching fails', async () => {
		const worker = loadServiceWorker(
			appRoutes({
				'/_next/static/chunks/lazy.js': () => {
					throw new TypeError('Failed to fetch');
				},
			}),
		);
		worker.cacheStorage.set('adameter-build-1', new Map());

		await expect(worker.dispatch('install')).rejects.toThrow('Failed to fetch');

		expect([...worker.cacheStorage.keys()]).toEqual(['adameter-build-1']);
	});

	it('keeps the cached page of its own build when a newer one is served', async () => {
		let html = 'build 2';
		const worker = loadServiceWorker(
			appRoutes({ '/feeding': () => new Response(html) }),
		);
		await worker.dispatch('install');
		html = 'build 3';
		const request = new Request(`${ORIGIN}/feeding`);
		Object.defineProperty(request, 'mode', { value: 'navigate' });

		const response = await worker.dispatch('fetch', { request });

		expect(await response!.text()).toBe('build 3');
		const cached = worker.cacheStorage.get('adameter-build-2')!.get('/feeding');
		expect(await cached!.text()).toBe('build 2');
	});

	it('serves a cached page when the server answers with an error', async () => {
		let status = 200;
		const worker = loadServiceWorker(
			appRoutes({
				'/feeding': () =>
					new Response(status === 200 ? 'fresh' : 'Service unavailable', {
						status,
					}),
			}),
		);
		await worker.dispatch('install');
		status = 503;

		const request = new Request(`${ORIGIN}/feeding?room=x`);
		// Request cannot be constructed with mode 'navigate'.
		Object.defineProperty(request, 'mode', { value: 'navigate' });

		const response = await worker.dispatch('fetch', { request });

		expect(await response!.text()).toBe('fresh');
	});
});
