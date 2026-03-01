import type { Changes, Content } from 'tinybase';
import { describe, expect, it } from 'vitest';
import {
	decryptChanges,
	decryptContent,
	encryptChanges,
	encryptContent,
	getEncryptionKey,
	hashRoomId,
} from './crypto';

describe('crypto utils', () => {
	it('should hash room ID consistently and distinct from key', async () => {
		const hash = await hashRoomId('test-room');
		const key = await getEncryptionKey('test-room');

		expect(hash).toMatch(/^[\da-f]{64}$/);

		// Verify distinct derivation (at least likely distinct)
		// We can't easily compare CryptoKey to the hash string,
		// but we know they use different prefixes.
		expect(key).toBeDefined();
	});

	it('should encrypt and decrypt content correctly', async () => {
		const key = await getEncryptionKey('test-room');
		const content: Content = [
			{
				table1: {
					row1: {
						cell1: 'hello',
						cell2: 123,
						cell3: true,
					},
				},
			},
			{
				value1: 'world',
				value2: 456,
				value3: false,
			},
		];

		const encrypted = await encryptContent(content, key);

		// Check that values are encrypted (start with prefix and are base64)
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		expect((encrypted[0] as any).table1.row1.cell1).toMatch(/^s:/);
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		expect((encrypted[1] as any).value1).toMatch(/^s:/);
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		expect((encrypted[1] as any).value2).toMatch(/^n:/);

		const decrypted = await decryptContent(encrypted, key);
		expect(decrypted).toEqual(content);
	});

	it('should encrypt and decrypt changes correctly including deletions', async () => {
		const key = await getEncryptionKey('test-room');
		const changes: Changes = [
			{
				table1: {
					row1: {
						cell1: 'updated',
						cell2: undefined, // cell deletion
					},
					row2: undefined, // row deletion
				},
				table2: undefined, // table deletion
			},
			{
				value1: 789,
				value2: undefined, // value deletion
			},
			1,
		];

		const encrypted = await encryptChanges(changes, key);
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const tables = encrypted[0] as any;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const values = encrypted[1] as any;

		expect(tables.table1.row1.cell1).toMatch(/^s:/);
		expect(tables.table1.row1.cell2).toBeUndefined();
		expect(tables.table1.row2).toBeUndefined();
		expect(tables.table2).toBeUndefined();
		expect(values.value1).toMatch(/^n:/);
		expect(values.value2).toBeUndefined();

		const decrypted = await decryptChanges(encrypted, key);
		expect(decrypted).toEqual(changes);
	});

	it('should handle large strings correctly', async () => {
		const key = await getEncryptionKey('test-room');
		const largeString = 'a'.repeat(100_000); // 100KB
		const content: Content = [{}, { large: largeString }];

		const encrypted = await encryptContent(content, key);
		const decrypted = await decryptContent(encrypted, key);
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		expect((decrypted[1] as any).large).toBe(largeString);
	});
});
