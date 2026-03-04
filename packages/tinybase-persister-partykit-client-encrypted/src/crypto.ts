import type { Changes, Content, Tables, Values } from 'tinybase';
import { logger } from './logger';

const ALGORITHM = 'AES-GCM';
const IV_LENGTH = 12;
const UNDEFINED_MARKER = '\uFFFC';
type EncryptableValue = boolean | number | string | null;
const TEXT_DECODER = new TextDecoder();
const TEXT_ENCODER = new TextEncoder();

function uint8ArrayToBase64(array: Uint8Array): string {
	let binary = '';
	for (let index = 0; index < array.byteLength; index++) {
		binary += String.fromCharCode(array[index]);
	}

	return btoa(binary);
}

function base64ToUint8Array(base64: string): Uint8Array {
	const binaryString = atob(base64);
	const bytes = new Uint8Array(binaryString.length);

	for (let index = 0; index < binaryString.length; index++) {
		bytes[index] = binaryString.charCodeAt(index);
	}

	return bytes;
}

export async function hashRoomId(roomName: string): Promise<string> {
	const msgUint8 = TEXT_ENCODER.encode(`room:${roomName}`);
	const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
	const hashArray = Array.from(new Uint8Array(hashBuffer));

	return hashArray.map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function getEncryptionKey(roomName: string): Promise<CryptoKey> {
	const msgUint8 = TEXT_ENCODER.encode(`key:${roomName}`);
	const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);

	return crypto.subtle.importKey('raw', hashBuffer, ALGORITHM, false, [
		'encrypt',
		'decrypt',
	]);
}

async function encryptValue(
	value: EncryptableValue,
	key: CryptoKey,
): Promise<string> {
	let prefix = '';
	let serializedValue = '';

	if (typeof value === 'string') {
		prefix = 's:';
		serializedValue = value;
	} else if (typeof value === 'number') {
		prefix = 'n:';
		serializedValue = value.toString();
	} else if (typeof value === 'boolean') {
		prefix = 'b:';
		serializedValue = value ? '1' : '0';
	} else {
		prefix = 'l:';
		serializedValue = '';
	}

	const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
	const encodedValue = TEXT_ENCODER.encode(serializedValue);
	const encryptedBuffer = await crypto.subtle.encrypt(
		{ iv, name: ALGORITHM },
		key,
		encodedValue,
	);

	const encryptedBytes = new Uint8Array(encryptedBuffer);
	const combined = new Uint8Array(IV_LENGTH + encryptedBytes.byteLength);
	combined.set(iv);
	combined.set(encryptedBytes, IV_LENGTH);

	return prefix + uint8ArrayToBase64(combined);
}

async function decryptValue(
	encryptedValue: string,
	key: CryptoKey,
): Promise<EncryptableValue> {
	const prefix = encryptedValue.slice(0, 2);
	const encryptedPayload = encryptedValue.slice(2);
	const combined = base64ToUint8Array(encryptedPayload);
	const iv = combined.slice(0, IV_LENGTH);
	const ciphertext = combined.slice(IV_LENGTH);

	const decryptedBuffer = await crypto.subtle.decrypt(
		{ iv, name: ALGORITHM },
		key,
		ciphertext,
	);
	const value = TEXT_DECODER.decode(decryptedBuffer);

	if (prefix === 's:') {
		return value;
	}

	if (prefix === 'n:') {
		return Number(value);
	}

	if (prefix === 'b:') {
		return value === '1';
	}

	if (prefix === 'l:') {
		return null;
	}

	throw new Error('Unknown encrypted value prefix');
}

export async function encryptContent(
	content: Content,
	key: CryptoKey,
): Promise<Content> {
	const start = performance.now();
	const [tables, values] = content;
	const [encryptedTableEntries, encryptedValueEntries] = await Promise.all([
		Promise.all(
			Object.entries(tables).map(async ([tableId, table]) => [
				tableId,
				await encryptTableContent(
					table as Record<string, Record<string, unknown>>,
					key,
				),
			]),
		),
		Promise.all(
			Object.entries(values).map(async ([valueId, value]) => [
				valueId,
				await encryptValue(value as EncryptableValue, key),
			]),
		),
	]);

	const encryptedTables = Object.fromEntries(encryptedTableEntries) as Tables;
	const encryptedValues = Object.fromEntries(encryptedValueEntries) as Values;

	logger.log(
		`[PERF] encryptContent took ${(performance.now() - start).toFixed(2)}ms`,
	);

	return [encryptedTables, encryptedValues];
}

export async function decryptContent(
	content: Content,
	key: CryptoKey,
): Promise<Content> {
	const start = performance.now();
	const [tables, values] = content;
	const [decryptedTableEntries, decryptedValueEntries] = await Promise.all([
		Promise.all(
			Object.entries(tables).map(async ([tableId, table]) => [
				tableId,
				await decryptTableContent(
					table as Record<string, Record<string, unknown>>,
					key,
				),
			]),
		),
		Promise.all(
			Object.entries(values).map(async ([valueId, value]) => [
				valueId,
				await decryptValue(value as string, key),
			]),
		),
	]);

	const decryptedTables = Object.fromEntries(decryptedTableEntries) as Tables;
	const decryptedValues = Object.fromEntries(decryptedValueEntries) as Values;

	logger.log(
		`[PERF] decryptContent took ${(performance.now() - start).toFixed(2)}ms`,
	);

	return [decryptedTables, decryptedValues];
}

export async function encryptChanges(
	changes: Changes,
	key: CryptoKey,
): Promise<Changes> {
	const start = performance.now();
	const [tableChanges, valueChanges, internal] = changes;
	const [encryptedTableEntries, encryptedValueEntries] = await Promise.all([
		Promise.all(
			Object.entries(tableChanges).map(async ([tableId, table]) => [
				tableId,
				await encryptChangedTable(
					table as
						| Record<string, Record<string, unknown> | undefined>
						| undefined,
					key,
				),
			]),
		),
		Promise.all(
			Object.entries(valueChanges).map(async ([valueId, value]) => [
				valueId,
				value === undefined
					? undefined
					: await encryptValue(value as EncryptableValue, key),
			]),
		),
	]);

	const encryptedTableChanges = Object.fromEntries(
		encryptedTableEntries,
	) as Changes[0];
	const encryptedValueChanges = Object.fromEntries(
		encryptedValueEntries,
	) as Changes[1];

	logger.log(
		`[PERF] encryptChanges took ${(performance.now() - start).toFixed(2)}ms`,
	);

	return [encryptedTableChanges, encryptedValueChanges, internal];
}

export async function decryptChanges(
	changes: Changes,
	key: CryptoKey,
): Promise<Changes> {
	const start = performance.now();
	const [tableChanges, valueChanges, internal] = changes;
	const [decryptedTableEntries, decryptedValueEntries] = await Promise.all([
		Promise.all(
			Object.entries(tableChanges).map(async ([tableId, table]) => [
				tableId,
				await decryptChangedTable(
					table as
						| Record<string, Record<string, unknown> | undefined>
						| undefined,
					key,
				),
			]),
		),
		Promise.all(
			Object.entries(valueChanges).map(async ([valueId, value]) => [
				valueId,
				value === undefined
					? undefined
					: await decryptValue(value as string, key),
			]),
		),
	]);

	const decryptedTableChanges = Object.fromEntries(
		decryptedTableEntries,
	) as Changes[0];
	const decryptedValueChanges = Object.fromEntries(
		decryptedValueEntries,
	) as Changes[1];

	logger.log(
		`[PERF] decryptChanges took ${(performance.now() - start).toFixed(2)}ms`,
	);

	return [decryptedTableChanges, decryptedValueChanges, internal];
}

async function encryptTableContent(
	table: Record<string, Record<string, unknown>>,
	key: CryptoKey,
) {
	return transformTableContent(table, key, encryptRowContent);
}

async function decryptTableContent(
	table: Record<string, Record<string, unknown>>,
	key: CryptoKey,
) {
	return transformTableContent(table, key, decryptRowContent);
}

async function transformTableContent(
	table: Record<string, Record<string, unknown>>,
	key: CryptoKey,
	transformRowContent: (
		row: Record<string, unknown>,
		key: CryptoKey,
	) => Promise<Record<string, unknown>>,
) {
	const transformedRowEntries = await Promise.all(
		Object.entries(table).map(async ([rowId, row]) => [
			rowId,
			await transformRowContent(row, key),
		]),
	);

	return Object.fromEntries(transformedRowEntries);
}

async function encryptRowContent(row: Record<string, unknown>, key: CryptoKey) {
	return transformRowContent(row, key, (cell, rowKey) =>
		encryptValue(cell as EncryptableValue, rowKey),
	);
}

async function decryptRowContent(row: Record<string, unknown>, key: CryptoKey) {
	return transformRowContent(row, key, (cell, rowKey) =>
		decryptValue(cell as string, rowKey),
	);
}

async function transformRowContent(
	row: Record<string, unknown>,
	key: CryptoKey,
	transformCell: (cell: unknown, key: CryptoKey) => Promise<unknown>,
) {
	const transformedCellEntries = await Promise.all(
		Object.entries(row).map(async ([cellId, cell]) => [
			cellId,
			await transformCell(cell, key),
		]),
	);

	return Object.fromEntries(transformedCellEntries);
}

async function encryptChangedTable(
	table: Record<string, Record<string, unknown> | undefined> | undefined,
	key: CryptoKey,
) {
	return transformChangedTable(table, key, encryptChangedRow);
}

async function decryptChangedTable(
	table: Record<string, Record<string, unknown> | undefined> | undefined,
	key: CryptoKey,
) {
	return transformChangedTable(table, key, decryptChangedRow);
}

async function transformChangedTable(
	table: Record<string, Record<string, unknown> | undefined> | undefined,
	key: CryptoKey,
	transformChangedRow: (
		row: Record<string, unknown> | undefined,
		key: CryptoKey,
	) => Promise<Record<string, unknown> | undefined>,
) {
	if (table === undefined) {
		return undefined;
	}

	const transformedRowEntries = await Promise.all(
		Object.entries(table).map(async ([rowId, row]) => [
			rowId,
			await transformChangedRow(row, key),
		]),
	);

	return Object.fromEntries(transformedRowEntries);
}

async function encryptChangedRow(
	row: Record<string, unknown> | undefined,
	key: CryptoKey,
) {
	if (row === undefined) {
		return undefined;
	}

	const encryptedCellEntries = await Promise.all(
		Object.entries(row).map(async ([cellId, cell]) => [
			cellId,
			cell === undefined
				? undefined
				: await encryptValue(cell as EncryptableValue, key),
		]),
	);

	return Object.fromEntries(encryptedCellEntries);
}

async function decryptChangedRow(
	row: Record<string, unknown> | undefined,
	key: CryptoKey,
) {
	if (row === undefined) {
		return undefined;
	}

	const decryptedCellEntries = await Promise.all(
		Object.entries(row).map(async ([cellId, cell]) => [
			cellId,
			cell === undefined ? undefined : await decryptValue(cell as string, key),
		]),
	);

	return Object.fromEntries(decryptedCellEntries);
}

export function jsonStringWithUndefined(value: unknown): string {
	return JSON.stringify(value, (_key, candidate) =>
		candidate === undefined ? UNDEFINED_MARKER : candidate,
	);
}

function replaceUndefinedMarker(value: unknown): unknown {
	if (value === UNDEFINED_MARKER) {
		return undefined;
	}

	if (Array.isArray(value)) {
		return value.map(replaceUndefinedMarker);
	}

	if (value !== null && typeof value === 'object') {
		return Object.fromEntries(
			Object.entries(value).map(([key, entry]) => [
				key,
				replaceUndefinedMarker(entry),
			]),
		);
	}

	return value;
}

export function jsonParseWithUndefined<T = unknown>(json: string): T {
	return replaceUndefinedMarker(JSON.parse(json)) as T;
}
