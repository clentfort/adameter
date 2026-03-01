import type {
	Cell,
	CellOrUndefined,
	Changes,
	Content,
	Id,
	Tables,
	ValueOrUndefined,
	Values,
} from 'tinybase';

const ALGORITHM = 'AES-GCM';
const IV_LENGTH = 12;

function uint8ArrayToBase64(array: Uint8Array): string {
	let binary = '';
	const len = array.byteLength;
	for (let i = 0; i < len; i++) {
		binary += String.fromCharCode(array[i]);
	}
	return btoa(binary);
}

function base64ToUint8Array(base64: string): Uint8Array {
	const binaryString = atob(base64);
	const len = binaryString.length;
	const bytes = new Uint8Array(len);
	for (let i = 0; i < len; i++) {
		bytes[i] = binaryString.charCodeAt(i);
	}
	return bytes;
}

export async function hashRoomId(roomName: string): Promise<string> {
	const msgUint8 = new TextEncoder().encode(`room:${roomName}`);
	const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function getEncryptionKey(roomName: string): Promise<CryptoKey> {
	const msgUint8 = new TextEncoder().encode(`key:${roomName}`);
	const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
	return await crypto.subtle.importKey('raw', hashBuffer, ALGORITHM, false, [
		'encrypt',
		'decrypt',
	]);
}

async function encryptValue(
	value: boolean | number | string,
	key: CryptoKey,
): Promise<string> {
	const type = typeof value;
	let prefix = '';
	let strValue = '';

	if (type === 'string') {
		prefix = 's:';
		strValue = value as string;
	} else if (type === 'number') {
		prefix = 'n:';
		strValue = value.toString();
	} else if (type === 'boolean') {
		prefix = 'b:';
		strValue = value ? '1' : '0';
	}

	const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
	const encodedValue = new TextEncoder().encode(strValue);

	const encryptedBuffer = await crypto.subtle.encrypt(
		{ iv, name: ALGORITHM },
		key,
		encodedValue,
	);

	const combined = new Uint8Array(IV_LENGTH + encryptedBuffer.byteLength);
	combined.set(iv);
	combined.set(new Uint8Array(encryptedBuffer), IV_LENGTH);

	return prefix + uint8ArrayToBase64(combined);
}

async function decryptValue(
	encryptedValue: string,
	key: CryptoKey,
): Promise<boolean | number | string> {
	const prefix = encryptedValue.slice(0, 2);
	const base64 = encryptedValue.slice(2);

	const combined = base64ToUint8Array(base64);

	const iv = combined.slice(0, IV_LENGTH);
	const ciphertext = combined.slice(IV_LENGTH);

	const decryptedBuffer = await crypto.subtle.decrypt(
		{ iv, name: ALGORITHM },
		key,
		ciphertext,
	);

	const strValue = new TextDecoder().decode(decryptedBuffer);

	if (prefix === 's:') {
		return strValue;
	} else if (prefix === 'n:') {
		return Number(strValue);
	} else if (prefix === 'b:') {
		return strValue === '1';
	}

	throw new Error('Unknown encrypted value prefix');
}

export async function encryptContent(
	content: Content,
	key: CryptoKey,
): Promise<Content> {
	const [tables, values] = content;
	const encryptedTables: Tables = {};
	const encryptedValues: Values = {};

	for (const [tableId, table] of Object.entries(tables)) {
		const encryptedTable: Record<Id, Record<Id, Cell>> = {};
		for (const [rowId, row] of Object.entries(table)) {
			const encryptedRow: Record<Id, Cell> = {};
			for (const [cellId, cell] of Object.entries(row)) {
				encryptedRow[cellId] = await encryptValue(
					cell as boolean | number | string,
					key,
				);
			}
			encryptedTable[rowId] = encryptedRow;
		}
		encryptedTables[tableId] = encryptedTable;
	}

	for (const [valueId, value] of Object.entries(values)) {
		encryptedValues[valueId] = await encryptValue(
			value as boolean | number | string,
			key,
		);
	}

	return [encryptedTables, encryptedValues];
}

export async function decryptContent(
	content: Content,
	key: CryptoKey,
): Promise<Content> {
	const [tables, values] = content;
	const decryptedTables: Tables = {};
	const decryptedValues: Values = {};

	for (const [tableId, table] of Object.entries(tables)) {
		const decryptedTable: Record<Id, Record<Id, Cell>> = {};
		for (const [rowId, row] of Object.entries(table)) {
			const decryptedRow: Record<Id, Cell> = {};
			for (const [cellId, cell] of Object.entries(row)) {
				decryptedRow[cellId] = await decryptValue(cell as string, key);
			}
			decryptedTable[rowId] = decryptedRow;
		}
		decryptedTables[tableId] = decryptedTable;
	}

	for (const [valueId, value] of Object.entries(values)) {
		decryptedValues[valueId] = await decryptValue(value as string, key);
	}

	return [decryptedTables, decryptedValues];
}

export async function encryptChanges(
	changes: Changes,
	key: CryptoKey,
): Promise<Changes> {
	const [tableChanges, valueChanges, internal] = changes;
	const encryptedTableChanges: Record<
		Id,
		Record<Id, Record<Id, CellOrUndefined> | undefined> | undefined
	> = {};
	const encryptedValueChanges: Record<Id, ValueOrUndefined> = {};

	for (const [tableId, table] of Object.entries(tableChanges)) {
		if (table === undefined) {
			encryptedTableChanges[tableId] = undefined;
		} else {
			const encryptedTable: Record<
				Id,
				Record<Id, CellOrUndefined> | undefined
			> = {};
			for (const [rowId, row] of Object.entries(table)) {
				if (row === undefined) {
					encryptedTable[rowId] = undefined;
				} else {
					const encryptedRow: Record<Id, CellOrUndefined> = {};
					for (const [cellId, cell] of Object.entries(row)) {
						encryptedRow[cellId] =
							cell === undefined
								? undefined
								: await encryptValue(cell as boolean | number | string, key);
					}
					encryptedTable[rowId] = encryptedRow;
				}
			}
			encryptedTableChanges[tableId] = encryptedTable;
		}
	}

	for (const [valueId, value] of Object.entries(valueChanges)) {
		encryptedValueChanges[valueId] =
			value === undefined
				? undefined
				: await encryptValue(value as boolean | number | string, key);
	}

	return [encryptedTableChanges, encryptedValueChanges, internal];
}

export async function decryptChanges(
	changes: Changes,
	key: CryptoKey,
): Promise<Changes> {
	const [tableChanges, valueChanges, internal] = changes;
	const decryptedTableChanges: Record<
		Id,
		Record<Id, Record<Id, CellOrUndefined> | undefined> | undefined
	> = {};
	const decryptedValueChanges: Record<Id, ValueOrUndefined> = {};

	for (const [tableId, table] of Object.entries(tableChanges)) {
		if (table === undefined) {
			decryptedTableChanges[tableId] = undefined;
		} else {
			const decryptedTable: Record<
				Id,
				Record<Id, CellOrUndefined> | undefined
			> = {};
			for (const [rowId, row] of Object.entries(table)) {
				if (row === undefined) {
					decryptedTable[rowId] = undefined;
				} else {
					const decryptedRow: Record<Id, CellOrUndefined> = {};
					for (const [cellId, cell] of Object.entries(row)) {
						decryptedRow[cellId] =
							cell === undefined
								? undefined
								: await decryptValue(cell as string, key);
					}
					decryptedTable[rowId] = decryptedRow;
				}
			}
			decryptedTableChanges[tableId] = decryptedTable;
		}
	}

	for (const [valueId, value] of Object.entries(valueChanges)) {
		decryptedValueChanges[valueId] =
			value === undefined
				? undefined
				: await decryptValue(value as string, key);
	}

	return [decryptedTableChanges, decryptedValueChanges, internal];
}
