import { afterEach, describe, expect, it, vi } from 'vitest';
import { generateId } from './generate-id';

describe('generateId', () => {
	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it('generates a valid UUID string using crypto.randomUUID when available', () => {
		const id = generateId();
		expect(typeof id).toBe('string');
		expect(id).toMatch(
			/^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i,
		);
	});

	it('uses fallback pseudo-random UUID generator when crypto is undefined', () => {
		vi.stubGlobal('crypto', undefined);

		const id = generateId();
		expect(typeof id).toBe('string');
		expect(id).toMatch(
			/^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i,
		);
	});

	it('uses fallback pseudo-random UUID generator when crypto exists but randomUUID is undefined', () => {
		vi.stubGlobal('crypto', {});

		const id = generateId();
		expect(typeof id).toBe('string');
		expect(id).toMatch(
			/^[\da-f]{8}-[\da-f]{4}-4[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/i,
		);
	});
});
