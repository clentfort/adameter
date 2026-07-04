import { describe, expect, it } from 'vitest';
import { cn } from './utils';

describe('cn', () => {
	it('should merge tailwind classes correctly', () => {
		expect(cn('px-2 py-2', 'p-4')).toBe('p-4');
		expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
		expect(cn('flex items-center', 'justify-between')).toBe(
			'flex items-center justify-between',
		);
	});

	it('should handle conditional classes', () => {
		expect(cn('base', true && 'is-true', false && 'is-false')).toBe(
			'base is-true',
		);
	});

	it('should handle undefined and null values', () => {
		expect(cn('base', undefined, null)).toBe('base');
	});
});
