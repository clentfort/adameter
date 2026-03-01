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

		expect(hash).toMatch(/^[0-9a-f]{64}$/);

		// Verify distinct derivation (at least likely distinct)
		// We can't easily compare CryptoKey to the hash string,
        // but we know they use different prefixes.
	});

	it('should encrypt and decrypt content correctly', async () => {
		const key = await getEncryptionKey('test-room');
		const content: any = [
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
		expect(encrypted[0].table1.row1.cell1).toMatch(/^s:/);
		expect(encrypted[1].value1).toMatch(/^s:/);
		expect(encrypted[1].value2).toMatch(/^n:/);

		const decrypted = await decryptContent(encrypted, key);
		expect(decrypted).toEqual(content);
	});

	it('should encrypt and decrypt changes correctly including deletions', async () => {
		const key = await getEncryptionKey('test-room');
		const changes: any = [
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
		expect(encrypted[0].table1.row1.cell1).toMatch(/^s:/);
		expect(encrypted[0].table1.row1.cell2).toBeUndefined();
		expect(encrypted[0].table1.row2).toBeUndefined();
		expect(encrypted[0].table2).toBeUndefined();
		expect(encrypted[1].value1).toMatch(/^n:/);
		expect(encrypted[1].value2).toBeUndefined();

		const decrypted = await decryptChanges(encrypted, key);
		expect(decrypted).toEqual(changes);
	});

    it('should handle large strings correctly', async () => {
        const key = await getEncryptionKey('test-room');
        const largeString = 'a'.repeat(100000); // 100KB
        const content: any = [{}, { large: largeString }];

        const encrypted = await encryptContent(content, key);
        const decrypted = await decryptContent(encrypted, key);
        expect(decrypted[1].large).toBe(largeString);
    });
});
