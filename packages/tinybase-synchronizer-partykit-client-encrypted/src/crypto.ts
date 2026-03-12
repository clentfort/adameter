const ALGORITHM = 'AES-GCM';
const IV_LENGTH = 12;
const UNDEFINED_MARKER = '\uFFFC';
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

export async function encrypt(
	plaintext: string,
	key: CryptoKey,
): Promise<string> {
	const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
	const encoded = TEXT_ENCODER.encode(plaintext);
	const ciphertext = await crypto.subtle.encrypt(
		{ iv, name: ALGORITHM },
		key,
		encoded,
	);
	const encryptedBytes = new Uint8Array(ciphertext);
	const combined = new Uint8Array(IV_LENGTH + encryptedBytes.byteLength);
	combined.set(iv);
	combined.set(encryptedBytes, IV_LENGTH);
	return uint8ArrayToBase64(combined);
}

export async function decrypt(
	encrypted: string,
	key: CryptoKey,
): Promise<string> {
	const combined = base64ToUint8Array(encrypted);
	const iv = combined.slice(0, IV_LENGTH);
	const ciphertext = combined.slice(IV_LENGTH);
	const decrypted = await crypto.subtle.decrypt(
		{ iv, name: ALGORITHM },
		key,
		ciphertext,
	);
	return TEXT_DECODER.decode(decrypted);
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
