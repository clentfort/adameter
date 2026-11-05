import type {
	CellOrUndefined,
	MergeableChanges,
	MergeableContent,
	ValueOrUndefined,
} from 'tinybase';
import {
	base64ToUint8Array,
	getEncryptionKey,
	jsonParseWithUndefined,
	jsonStringWithUndefined,
	uint8ArrayToBase64,
} from './crypto';

const ALGORITHM = 'AES-GCM';
const IV_LENGTH = 12;
const DECRYPT_CHUNK_SIZE = 500;
const TEXT_DECODER = new TextDecoder();
const TEXT_ENCODER = new TextEncoder();

/** `t` for table cells, `v` for values. */
export type CellKind = 't' | 'v';

/** Identifies a table cell or a value. Values use '' as table and row ID. */
export interface CellAddress {
	cell: string;
	kind: CellKind;
	row: string;
	table: string;
}

/** A cell or value with its HLC. Deletions have an undefined value. */
export interface PlainCell extends CellAddress {
	hlc: string;
	value: CellOrUndefined | ValueOrUndefined;
}

/** A cell or value as stored on and exchanged with the server. */
export interface EncryptedCell extends CellAddress {
	data: string;
	hlc: string;
}

export interface CellKeys {
	encryptionKey: CryptoKey;
	ivKey: CryptoKey;
}

/**
 * Derives the keys for per-cell encryption from the room name. The AES key is
 * the same as for snapshots; the IV key is derived separately.
 */
export async function getCellKeys(roomName: string): Promise<CellKeys> {
	const ivKeyMaterial = await crypto.subtle.digest(
		'SHA-256',
		TEXT_ENCODER.encode(`iv:${roomName}`),
	);
	const [encryptionKey, ivKey] = await Promise.all([
		getEncryptionKey(roomName),
		crypto.subtle.importKey(
			'raw',
			ivKeyMaterial,
			{ hash: 'SHA-256', name: 'HMAC' },
			false,
			['sign'],
		),
	]);
	return { encryptionKey, ivKey };
}

/** A stable string key for a cell address, e.g. for maps. */
export function getCellKey({ cell, kind, row, table }: CellAddress): string {
	return JSON.stringify([kind, table, row, cell]);
}

export function parseCellKey(key: string): CellAddress {
	const [kind, table, row, cell] = JSON.parse(key) as [
		CellKind,
		string,
		string,
		string,
	];
	return { cell, kind, row, table };
}

function getAdditionalData(
	address: CellAddress,
	hlc: string,
): Uint8Array<ArrayBuffer> {
	return TEXT_ENCODER.encode(
		JSON.stringify([
			address.kind,
			address.table,
			address.row,
			address.cell,
			hlc,
		]),
	);
}

async function getIv(
	ivKey: CryptoKey,
	additionalData: Uint8Array<ArrayBuffer>,
	plaintext: Uint8Array<ArrayBuffer>,
): Promise<Uint8Array<ArrayBuffer>> {
	// The IV is derived from everything that is encrypted, so the same write
	// always produces the same ciphertext (and the same TinyBase hashes) on
	// every device, while different plaintexts never share an IV.
	const input = new Uint8Array(
		additionalData.byteLength + 1 + plaintext.byteLength,
	);
	input.set(additionalData);
	input.set(plaintext, additionalData.byteLength + 1);
	const mac = await crypto.subtle.sign('HMAC', ivKey, input);
	return new Uint8Array(mac, 0, IV_LENGTH);
}

/**
 * Encrypts one cell. The address and HLC are authenticated, so a value cannot
 * be moved to another cell or timestamp.
 */
export async function encryptCell(
	keys: CellKeys,
	cell: PlainCell,
): Promise<EncryptedCell> {
	const { hlc, value, ...address } = cell;
	const additionalData = getAdditionalData(address, hlc);
	const plaintext = TEXT_ENCODER.encode(jsonStringWithUndefined(value));
	const iv = await getIv(keys.ivKey, additionalData, plaintext);
	const ciphertext = new Uint8Array(
		await crypto.subtle.encrypt(
			{ additionalData, iv, name: ALGORITHM },
			keys.encryptionKey,
			plaintext,
		),
	);
	const combined = new Uint8Array(IV_LENGTH + ciphertext.byteLength);
	combined.set(iv);
	combined.set(ciphertext, IV_LENGTH);
	return { ...address, data: uint8ArrayToBase64(combined), hlc };
}

export async function decryptCell(
	keys: CellKeys,
	cell: EncryptedCell,
): Promise<PlainCell> {
	const { cell: cellId, data, hlc, kind, row, table } = cell;
	const address = { cell: cellId, kind, row, table };
	const combined = base64ToUint8Array(data);
	const plaintext = await crypto.subtle.decrypt(
		{
			additionalData: getAdditionalData(address, hlc),
			iv: combined.subarray(0, IV_LENGTH),
			name: ALGORITHM,
		},
		keys.encryptionKey,
		combined.subarray(IV_LENGTH),
	);
	const value = jsonParseWithUndefined<PlainCell['value']>(
		TEXT_DECODER.decode(plaintext),
	);
	return { ...address, hlc, value };
}

async function mapInChunks<Input, Output>(
	inputs: readonly Input[],
	transform: (input: Input) => Promise<Output>,
): Promise<Output[]> {
	const outputs: Output[] = [];
	for (let start = 0; start < inputs.length; start += DECRYPT_CHUNK_SIZE) {
		outputs.push(
			...(await Promise.all(
				inputs.slice(start, start + DECRYPT_CHUNK_SIZE).map(transform),
			)),
		);
	}
	return outputs;
}

export function encryptCells(
	keys: CellKeys,
	cells: readonly PlainCell[],
): Promise<EncryptedCell[]> {
	return mapInChunks(cells, (cell) => encryptCell(keys, cell));
}

export function decryptCells(
	keys: CellKeys,
	cells: readonly EncryptedCell[],
): Promise<PlainCell[]> {
	return mapInChunks(cells, (cell) => decryptCell(keys, cell));
}

/**
 * Lists every cell and value of MergeableChanges or MergeableContent that has
 * an HLC, including deletions.
 */
export function flattenChanges(
	changes: MergeableChanges | MergeableContent,
): PlainCell[] {
	const cells: PlainCell[] = [];
	const [[tables], [values]] = changes as MergeableChanges;
	for (const [table, [rows]] of Object.entries(tables)) {
		for (const [row, [rowCells]] of Object.entries(rows)) {
			for (const [cell, [value, hlc]] of Object.entries(rowCells)) {
				if (hlc) cells.push({ cell, hlc, kind: 't', row, table, value });
			}
		}
	}
	for (const [cell, [value, hlc]] of Object.entries(values)) {
		if (hlc) cells.push({ cell, hlc, kind: 'v', row: '', table: '', value });
	}
	return cells;
}

function getLatestHlc(current: string | undefined, hlc: string): string {
	return current === undefined || hlc > current ? hlc : current;
}

function stamp<Thing>(thing: Thing, hlc: string | undefined): [Thing, string?] {
	return hlc ? [thing, hlc] : [thing];
}

/**
 * Builds MergeableChanges from cells. Container stamps get the latest HLC of
 * their children.
 */
export function buildChanges(cells: readonly PlainCell[]): MergeableChanges {
	type Stamped<Thing> = [Thing, string | undefined];
	const tables: Record<
		string,
		Stamped<Record<string, Stamped<Record<string, [CellOrUndefined, string]>>>>
	> = {};
	const values: Record<string, [ValueOrUndefined, string]> = {};
	let tablesHlc: string | undefined;
	let valuesHlc: string | undefined;

	for (const { cell, hlc, kind, row, table, value } of cells) {
		if (kind === 'v') {
			values[cell] = [value, hlc];
			valuesHlc = getLatestHlc(valuesHlc, hlc);
			continue;
		}
		const tableStamp = (tables[table] ??= [{}, undefined]);
		const rowStamp = (tableStamp[0][row] ??= [{}, undefined]);
		rowStamp[0][cell] = [value as CellOrUndefined, hlc];
		rowStamp[1] = getLatestHlc(rowStamp[1], hlc);
		tableStamp[1] = getLatestHlc(tableStamp[1], hlc);
		tablesHlc = getLatestHlc(tablesHlc, hlc);
	}

	return [
		stamp(
			Object.fromEntries(
				Object.entries(tables).map(([tableId, [rows, tableHlc]]) => [
					tableId,
					stamp(
						Object.fromEntries(
							Object.entries(rows).map(([rowId, [rowCells, rowHlc]]) => [
								rowId,
								stamp(rowCells, rowHlc),
							]),
						),
						tableHlc,
					),
				]),
			),
			tablesHlc,
		),
		stamp(values, valuesHlc),
		1,
	];
}
