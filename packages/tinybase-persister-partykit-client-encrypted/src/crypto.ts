import type {
	Changes,
	Content,
	Tables,
	Values,
} from 'tinybase';

const ALGORITHM = 'AES-GCM';
const IV_LENGTH = 12;
const UNDEFINED_MARKER = '\uFFFC';
type EncryptableValue = boolean | number | string | null;

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
	const normalizedRoomName = roomName.trim().toLowerCase();
	const msgUint8 = new TextEncoder().encode(`room:${normalizedRoomName}`);
	const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
	const hashArray = Array.from(new Uint8Array(hashBuffer));

	return hashArray.map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export async function getEncryptionKey(roomName: string): Promise<CryptoKey> {
	const normalizedRoomName = roomName.trim().toLowerCase();
	const msgUint8 = new TextEncoder().encode(`key:${normalizedRoomName}`);
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
	const encodedValue = new TextEncoder().encode(serializedValue);
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
	const value = new TextDecoder().decode(decryptedBuffer);

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
	const [tables, values] = content;

	const encryptedTables: Tables = Object.fromEntries(
		await Promise.all(
			Object.entries(tables).map(async ([tableId, table]) => {
				const encryptedTable = Object.fromEntries(
					await Promise.all(
						Object.entries(table).map(async ([rowId, row]) => {
							const encryptedRow = Object.fromEntries(
								await Promise.all(
									Object.entries(row).map(async ([cellId, cell]) => [
										cellId,
										await encryptValue(cell as EncryptableValue, key),
									]),
								),
							);
							return [rowId, encryptedRow];
						}),
					),
				);
				return [tableId, encryptedTable];
			}),
		),
	);

	const encryptedValues: Values = Object.fromEntries(
		await Promise.all(
			Object.entries(values).map(async ([valueId, value]) => [
				valueId,
				await encryptValue(value as EncryptableValue, key),
			]),
		),
	);

	return [encryptedTables, encryptedValues];
}

export async function decryptContent(
	content: Content,
	key: CryptoKey,
): Promise<Content> {
	const [tables, values] = content;

	const decryptedTables: Tables = Object.fromEntries(
		await Promise.all(
			Object.entries(tables).map(async ([tableId, table]) => {
				const decryptedTable = Object.fromEntries(
					await Promise.all(
						Object.entries(table).map(async ([rowId, row]) => {
							const decryptedRow = Object.fromEntries(
								await Promise.all(
									Object.entries(row).map(async ([cellId, cell]) => [
										cellId,
										await decryptValue(cell as string, key),
									]),
								),
							);
							return [rowId, decryptedRow];
						}),
					),
				);
				return [tableId, decryptedTable];
			}),
		),
	);

	const decryptedValues: Values = Object.fromEntries(
		await Promise.all(
			Object.entries(values).map(async ([valueId, value]) => [
				valueId,
				await decryptValue(value as string, key),
			]),
		),
	);

	return [decryptedTables, decryptedValues];
}

export async function encryptChanges(
	changes: Changes,
	key: CryptoKey,
): Promise<Changes> {
	const [tableChanges, valueChanges, internal] = changes;

	const encryptedTableChanges = Object.fromEntries(
		await Promise.all(
			Object.entries(tableChanges).map(async ([tableId, table]) => {
				if (table === undefined) {
					return [tableId, undefined];
				}

				const encryptedTable = Object.fromEntries(
					await Promise.all(
						Object.entries(table).map(async ([rowId, row]) => {
							if (row === undefined) {
								return [rowId, undefined];
							}

							const encryptedRow = Object.fromEntries(
								await Promise.all(
									Object.entries(row).map(async ([cellId, cell]) => [
										cellId,
										cell === undefined
											? undefined
											: await encryptValue(cell as EncryptableValue, key),
									]),
								),
							);
							return [rowId, encryptedRow];
						}),
					),
				);
				return [tableId, encryptedTable];
			}),
		),
	);

	const encryptedValueChanges = Object.fromEntries(
		await Promise.all(
			Object.entries(valueChanges).map(async ([valueId, value]) => [
				valueId,
				value === undefined
					? undefined
					: await encryptValue(value as EncryptableValue, key),
			]),
		),
	);

	return [
		encryptedTableChanges as Changes[0],
		encryptedValueChanges as Changes[1],
		internal,
	];
}

export async function decryptChanges(
	changes: Changes,
	key: CryptoKey,
): Promise<Changes> {
	const [tableChanges, valueChanges, internal] = changes;

	const decryptedTableChanges = Object.fromEntries(
		await Promise.all(
			Object.entries(tableChanges).map(async ([tableId, table]) => {
				if (table === undefined) {
					return [tableId, undefined];
				}

				const decryptedTable = Object.fromEntries(
					await Promise.all(
						Object.entries(table).map(async ([rowId, row]) => {
							if (row === undefined) {
								return [rowId, undefined];
							}

							const decryptedRow = Object.fromEntries(
								await Promise.all(
									Object.entries(row).map(async ([cellId, cell]) => [
										cellId,
										cell === undefined
											? undefined
											: await decryptValue(cell as string, key),
									]),
								),
							);
							return [rowId, decryptedRow];
						}),
					),
				);
				return [tableId, decryptedTable];
			}),
		),
	);

	const decryptedValueChanges = Object.fromEntries(
		await Promise.all(
			Object.entries(valueChanges).map(async ([valueId, value]) => [
				valueId,
				value === undefined
					? undefined
					: await decryptValue(value as string, key),
			]),
		),
	);

	return [
		decryptedTableChanges as Changes[0],
		decryptedValueChanges as Changes[1],
		internal,
	];
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
