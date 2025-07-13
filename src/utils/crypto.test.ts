import { describe, expect, it } from 'vitest';
import { decrypt, encrypt } from './crypto';

describe('crypto', () => {
	it('deeply encrypts an object', () => {
		const object = {
			a: 'test',
			b: 0,
			c: null,
			d: true,
			e: undefined,
			f: { fa: 'test1', fb: 0, fc: { fca: 'test' } },
			g: [
				'test',
				0,
				null,
				true,
				undefined,
				{ ga: 'test1', gb: 0 },
				['test', 0, null, true, undefined],
			],
		};
		const encrypted = encrypt(object, 'secret');
		expect(decrypt(encrypted, 'secret')).toEqual(object);
	});

	it('handles empty objects', () => {
		const object = {};
		const encrypted = encrypt(object, 'secret');
		expect(decrypt(encrypted, 'secret')).toEqual(object);
	});

	it('handles arrays', () => {
		const arr = [1, 'two', { three: 3 }];
		const encrypted = encrypt(arr, 'secret');
		expect(decrypt(encrypted, 'secret')).toEqual(arr);
	});
});
