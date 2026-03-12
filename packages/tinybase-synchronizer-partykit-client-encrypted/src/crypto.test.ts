import { describe, expect, it } from 'vitest';
import {
	decrypt,
	encrypt,
	getEncryptionKey,
	hashRoomId,
	jsonParseWithUndefined,
	jsonStringWithUndefined,
} from './crypto';

describe('hashRoomId', () => {
	it('produces a consistent 64-char hex hash', async () => {
		const hash1 = await hashRoomId('test-room');
		const hash2 = await hashRoomId('test-room');

		expect(hash1).toMatch(/^[\da-f]{64}$/);
		expect(hash1).toBe(hash2);
	});

	it('produces different hashes for different rooms', async () => {
		const hash1 = await hashRoomId('room-a');
		const hash2 = await hashRoomId('room-b');

		expect(hash1).not.toBe(hash2);
	});
});

describe('getEncryptionKey', () => {
	it('derives a CryptoKey', async () => {
		const key = await getEncryptionKey('test-room');
		expect(key).toBeDefined();
		expect(key.type).toBe('secret');
	});

	it('derives a working key for the same room', async () => {
		const key1 = await getEncryptionKey('test-room');
		const key2 = await getEncryptionKey('test-room');

		// Both keys should decrypt each other's ciphertext
		const encrypted = await encrypt('test', key1);
		const decrypted = await decrypt(encrypted, key2);
		expect(decrypted).toBe('test');
	});
});

describe('encrypt / decrypt', () => {
	it('round-trips a string', async () => {
		const key = await getEncryptionKey('test-room');
		const plaintext = 'hello world';

		const encrypted = await encrypt(plaintext, key);
		expect(encrypted).not.toBe(plaintext);

		const decrypted = await decrypt(encrypted, key);
		expect(decrypted).toBe(plaintext);
	});

	it('produces different ciphertexts for the same input (random IV)', async () => {
		const key = await getEncryptionKey('test-room');
		const plaintext = 'same input';

		const a = await encrypt(plaintext, key);
		const b = await encrypt(plaintext, key);

		expect(a).not.toBe(b);
	});

	it('handles large payloads', async () => {
		const key = await getEncryptionKey('test-room');
		const large = 'x'.repeat(100_000);

		const encrypted = await encrypt(large, key);
		const decrypted = await decrypt(encrypted, key);

		expect(decrypted).toBe(large);
	});

	it('fails to decrypt with the wrong key', async () => {
		const key1 = await getEncryptionKey('room-a');
		const key2 = await getEncryptionKey('room-b');

		const encrypted = await encrypt('secret', key1);

		await expect(decrypt(encrypted, key2)).rejects.toThrow();
	});
});

describe('jsonStringWithUndefined / jsonParseWithUndefined', () => {
	it('round-trips undefined values', () => {
		const value = {
			a: 1,
			b: undefined,
			c: [1, undefined, 3],
			d: { e: undefined, f: 2 },
		};

		const serialized = jsonStringWithUndefined(value);
		expect(serialized).toContain('\uFFFC');

		const deserialized = jsonParseWithUndefined<typeof value>(serialized);
		expect(deserialized).toEqual(value);
		expect(deserialized.b).toBeUndefined();
		expect(deserialized.c[1]).toBeUndefined();
		expect(deserialized.d.e).toBeUndefined();
	});

	it('handles plain values without undefined', () => {
		const value = { a: 1, b: 'hello', c: [true, false] };
		const serialized = jsonStringWithUndefined(value);
		const deserialized = jsonParseWithUndefined<typeof value>(serialized);
		expect(deserialized).toEqual(value);
	});
});
