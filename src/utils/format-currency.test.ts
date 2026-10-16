import { describe, expect, it } from 'vitest';
import { formatCurrency } from './format-currency';

describe('formatCurrency', () => {
	it('formats EUR in de_DE correctly', () => {
		const formatted = formatCurrency(12.34, 'EUR', 'de_DE');
		expect(formatted).toContain('12,34');
		expect(formatted).toContain('€');
	});

	it('formats GBP in en_GB correctly', () => {
		const formatted = formatCurrency(12.34, 'GBP', 'en_GB');
		expect(formatted).toBe('£12.34');
	});

	it('formats USD in en_US correctly', () => {
		const formatted = formatCurrency(12.34, 'USD', 'en_US');
		expect(formatted).toBe('$12.34');
	});
});
