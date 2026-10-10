/* eslint-disable no-console */
/**
 * Copies encrypted room snapshots from the retired managed PartyKit deployment
 * into the `legacy-store` slot of the Cloudflare PartyServer, where clients
 * CRDT-merge them on their next start. Snapshots are opaque ciphertext, so no
 * room keys are needed; every snapshot is also written to ./export/ as a backup.
 *
 * The rooms file lists one room per line, either the room name as entered in
 * the app or its 64-character hashed ID.
 *
 * Usage:
 *   LEGACY_HOST=adameter-party.clentfort.partykit.dev \
 *   NEW_HOST=adameter-party.adameter.workers.dev \
 *   LEGACY_IMPORT_SECRET=... \
 *   pnpm exec tsx scripts/migrate-legacy-rooms.mts rooms.txt
 *
 * Leave out NEW_HOST to only export.
 */
import fs from 'node:fs';
import path from 'node:path';
import { hashRoomId } from 'tinybase-synchronizer-partykit-client-encrypted';

const HASHED_ROOM_ID = /^[\da-f]{64}$/;
const PARTY = 'tinybase';

const { LEGACY_HOST, LEGACY_IMPORT_SECRET, NEW_HOST } = process.env;
const roomsFile = process.argv[2];

if (!LEGACY_HOST || !roomsFile || (NEW_HOST && !LEGACY_IMPORT_SECRET)) {
	console.error(
		'Usage: LEGACY_HOST=... [NEW_HOST=... LEGACY_IMPORT_SECRET=...] tsx scripts/migrate-legacy-rooms.mts rooms.txt',
	);
	process.exit(1);
}

const baseUrl = (host: string) =>
	`${/^(localhost|127\.)/.test(host) ? 'http' : 'https'}://${host}`;

async function toHashedRoomId(entry: string) {
	return HASHED_ROOM_ID.test(entry) ? entry : hashRoomId(entry);
}

async function migrateRoom(hashedRoomId: string): Promise<string> {
	const legacyResponse = await fetch(
		`${baseUrl(LEGACY_HOST!)}/parties/${PARTY}/${hashedRoomId}/store`,
		{ cache: 'no-store' },
	);
	if (!legacyResponse.ok) {
		throw new Error(
			`export: ${legacyResponse.status} ${await legacyResponse.text()}`,
		);
	}
	const snapshot = await legacyResponse.text();
	if (!snapshot || snapshot === 'null') {
		return 'empty, skipped';
	}
	fs.writeFileSync(path.join('export', `${hashedRoomId}.txt`), snapshot);

	if (!NEW_HOST) {
		return `exported ${snapshot.length} bytes`;
	}

	const importUrl = `${baseUrl(NEW_HOST)}/parties/${PARTY}/${hashedRoomId}/legacy-store`;
	const importResponse = await fetch(importUrl, {
		body: snapshot,
		headers: { Authorization: `Bearer ${LEGACY_IMPORT_SECRET}` },
		method: 'PUT',
	});
	if (!importResponse.ok) {
		throw new Error(
			`import: ${importResponse.status} ${await importResponse.text()}`,
		);
	}

	const verifyResponse = await fetch(importUrl, { cache: 'no-store' });
	if ((await verifyResponse.text()) !== snapshot) {
		throw new Error('verify: imported snapshot does not match');
	}
	return `migrated ${snapshot.length} bytes`;
}

const entries = fs
	.readFileSync(roomsFile, 'utf8')
	.split('\n')
	.map((line) => line.trim())
	.filter(Boolean);
const hashedRoomIds = [
	...new Set(await Promise.all(entries.map(toHashedRoomId))),
];

fs.mkdirSync('export', { recursive: true });

let failures = 0;
for (const hashedRoomId of hashedRoomIds) {
	try {
		console.log(`✓ ${hashedRoomId}: ${await migrateRoom(hashedRoomId)}`);
	} catch (error) {
		failures += 1;
		console.error(
			`✗ ${hashedRoomId}: ${error instanceof Error ? error.message : String(error)}`,
		);
	}
}

console.log(
	`${hashedRoomIds.length - failures}/${hashedRoomIds.length} rooms done`,
);
process.exitCode = failures > 0 ? 1 : 0;
