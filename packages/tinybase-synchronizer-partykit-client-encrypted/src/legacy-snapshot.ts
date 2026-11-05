import type { MergeableContent } from 'tinybase';
import { CellRequestError } from './cell-sync';
import { decrypt, jsonParseWithUndefined } from './crypto';

const REQUEST_TIMEOUT_MS = 15_000;

export type LegacySnapshotResult =
	| { content?: MergeableContent; etag?: string; status: 'loaded' }
	| { status: 'unchanged' };

/**
 * Reads the encrypted full snapshot that clients of the snapshot protocol
 * store at `/store`. With the ETag of the last read, an unchanged snapshot
 * costs a 304 without a body.
 */
export async function fetchLegacySnapshot(
	storeUrl: string,
	encryptionKey: CryptoKey,
	etag?: string,
): Promise<LegacySnapshotResult> {
	const response = await fetch(storeUrl, {
		cache: 'no-store',
		headers: etag ? { 'If-None-Match': etag } : undefined,
		mode: 'cors',
		signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
	});
	if (response.status === 304) {
		return { status: 'unchanged' };
	}
	if (!response.ok) {
		throw new CellRequestError(
			`Snapshot GET failed (${response.status})`,
			response.status,
		);
	}

	const nextEtag = response.headers.get('ETag')?.replace(/^W\//, '');
	const encrypted = await response.text();
	if (!encrypted || encrypted === 'null') {
		return { etag: nextEtag, status: 'loaded' };
	}
	const content = jsonParseWithUndefined<MergeableContent>(
		await decrypt(encrypted, encryptionKey),
	);
	return { content: content ?? undefined, etag: nextEtag, status: 'loaded' };
}
