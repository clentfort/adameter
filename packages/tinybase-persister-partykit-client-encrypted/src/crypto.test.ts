import type { Changes, Content } from 'tinybase';
import { describe, expect, it } from 'vitest';
import {
	decryptChanges,
	decryptContent,
	encryptChanges,
	encryptContent,
	getEncryptionKey,
	hashRoomId,
	jsonParseWithUndefined,
	jsonStringWithUndefined,
} from './crypto';

describe('crypto', () => {
	it('hashes room IDs consistently', async () => {
		const hash1 = await hashRoomId('test-room');
		const hash2 = await hashRoomId('test-room');

		expect(hash1).toMatch(/^[\da-f]{64}$/);
		expect(hash1).toBe(hash2);
	});

	it('derives encryption keys', async () => {
		const key = await getEncryptionKey('test-room');

		expect(key).toBeDefined();
	});

	it('encrypts and decrypts content', async () => {
		const key = await getEncryptionKey('test-room');
		const content: Content = [
			{
				table1: {
					row1: {
						cell1: 'hello',
						cell2: 123,
						cell3: true,
						cell4: null,
					},
				},
			},
			{
				value1: 'world',
				value2: 456,
				value3: false,
				value4: null,
			},
		];

		const encrypted = await encryptContent(content, key);
		expect((encrypted[0] as Content[0]).table1.row1.d).toMatch(/^s:/);
		expect((encrypted[1] as Content[1]).value2).toMatch(/^n:/);
		expect((encrypted[1] as Content[1]).value3).toMatch(/^b:/);
		expect((encrypted[1] as Content[1]).value4).toMatch(/^l:/);

		const decrypted = await decryptContent(encrypted, key);
		expect(decrypted).toEqual(content);
	});

	it('encrypts and decrypts changes with deletions', async () => {
		const key = await getEncryptionKey('test-room');
		const changes: Changes = [
			{
				table1: {
					row1: {
						cell1: 'updated',
						cell2: undefined,
					},
					row2: undefined,
				},
				table2: undefined,
			},
			{
				value1: 789,
				value2: undefined,
			},
			1,
		];

		const encrypted = await encryptChanges(changes, key);
		const decrypted = await decryptChanges(encrypted, key);

		expect(decrypted).toEqual(changes);
	});

	it('encrypts and decrypts changes with row context', async () => {
		const key = await getEncryptionKey('test-room');
		const fullRow = { cell1: 'updated', cell2: 42 };
		const changes: Changes = [
			{
				table1: {
					row1: {
						cell1: 'updated',
					},
				},
			},
			{},
			1,
		];

		const encrypted = await encryptChanges(changes, key, () => fullRow);
		expect(
			(encrypted[0] as Record<string, Record<string, Record<string, string>>>)
				.table1.row1.d,
		).toBeDefined();

		const decrypted = await decryptChanges(encrypted, key);
		expect(decrypted[0]).toEqual({
			table1: {
				row1: fullRow,
			},
		});
	});

	it('supports large string payloads', async () => {
		const key = await getEncryptionKey('test-room');
		const largeString = 'a'.repeat(100_000);
		const content: Content = [{}, { large: largeString }];

		const encrypted = await encryptContent(content, key);
		const decrypted = await decryptContent(encrypted, key);

		expect((decrypted[1] as Content[1]).large).toBe(largeString);
	});

	it('round-trips undefined values through JSON marker', () => {
		const value = {
			a: 1,
			b: undefined,
			c: [1, undefined, 3],
			d: {
				e: undefined,
				f: 2,
			},
		};

		const serialized = jsonStringWithUndefined(value);
		expect(serialized).toContain('\uFFFC');

		const deserialized = jsonParseWithUndefined<typeof value>(serialized);
		expect(deserialized).toEqual(value);
		expect(deserialized.b).toBeUndefined();
		expect(deserialized.c[1]).toBeUndefined();
		expect(deserialized.d.e).toBeUndefined();
	});

	it('preserves deletion changes through JSON serialization', async () => {
		const key = await getEncryptionKey('test-room');
		const changes: Changes = [
			{
				table1: {
					row1: {
						added: 'new-value',
						deleted: undefined,
						updated: 42,
					},
					row2: undefined,
				},
				table2: undefined,
			},
			{
				addedValue: true,
				deletedValue: undefined,
				updatedValue: 'next',
			},
			1,
		];

		const encrypted = await encryptChanges(changes, key);
		const serialized = jsonStringWithUndefined(encrypted);
		expect(serialized).toContain('\uFFFC');

		const parsed = jsonParseWithUndefined<Changes>(serialized);
		const decrypted = await decryptChanges(parsed, key);

		expect(decrypted).toEqual(changes);
	});
});
