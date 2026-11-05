import { createMergeableStore } from 'tinybase';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { encrypt, getEncryptionKey, jsonStringWithUndefined } from './crypto';
import { fetchLegacySnapshot } from './legacy-snapshot';

const STORE_URL = 'https://relay.example/parties/tinybase/room/store';

afterEach(() => {
	vi.unstubAllGlobals();
});

describe('fetchLegacySnapshot', () => {
	it('decrypts the snapshot and returns its strong ETag', async () => {
		const key = await getEncryptionKey('room');
		const source = createMergeableStore('a');
		source.setCell('events', 'e1', 'title', 'Doctor');
		const body = await encrypt(
			jsonStringWithUndefined(source.getMergeableContent()),
			key,
		);
		vi.stubGlobal(
			'fetch',
			vi.fn(async () => new Response(body, { headers: { ETag: 'W/"4"' } })),
		);

		const result = await fetchLegacySnapshot(STORE_URL, key);

		expect(result).toEqual({
			content: source.getMergeableContent(),
			etag: '"4"',
			status: 'loaded',
		});
	});

	it('sends the last ETag and reports an unchanged snapshot', async () => {
		const fetchMock = vi.fn(async () => new Response(null, { status: 304 }));
		vi.stubGlobal('fetch', fetchMock);

		const result = await fetchLegacySnapshot(
			STORE_URL,
			await getEncryptionKey('room'),
			'"4"',
		);

		expect(result).toEqual({ status: 'unchanged' });
		expect(fetchMock).toHaveBeenCalledWith(
			STORE_URL,
			expect.objectContaining({ headers: { 'If-None-Match': '"4"' } }),
		);
	});

	it('returns no content for a room without a snapshot', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn(async () => new Response('null', { headers: { ETag: '"0"' } })),
		);

		expect(
			await fetchLegacySnapshot(STORE_URL, await getEncryptionKey('room')),
		).toEqual({ content: undefined, etag: '"0"', status: 'loaded' });
	});

	it('throws with the status on errors', async () => {
		vi.stubGlobal(
			'fetch',
			vi.fn(async () => new Response('Exceeded', { status: 429 })),
		);

		await expect(
			fetchLegacySnapshot(STORE_URL, await getEncryptionKey('room')),
		).rejects.toMatchObject({ status: 429 });
	});
});
