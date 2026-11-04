import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = path.resolve(__dirname, '../..');

function findPages(directory: string, route = ''): string[] {
	return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
		if (entry.isDirectory()) {
			return findPages(
				path.join(directory, entry.name),
				`${route}/${entry.name}`,
			);
		}
		return entry.name === 'page.tsx' ? [route || '/'] : [];
	});
}

describe('service worker', () => {
	it('precaches every page of the app', () => {
		const serviceWorker = readFileSync(path.join(ROOT, 'public/sw.js'), 'utf8');
		const pageList = serviceWorker.match(/const PAGES = \[([^\]]*)]/)?.[1];
		const precachedPages = [...(pageList ?? '').matchAll(/'([^']+)'/g)].map(
			([, page]) => page,
		);

		expect(precachedPages.toSorted()).toEqual(
			findPages(path.join(ROOT, 'src/app')).toSorted(),
		);
	});
});
