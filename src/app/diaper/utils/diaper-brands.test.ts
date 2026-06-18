import { describe, expect, it } from 'vitest';
import {
	DEFAULT_DIAPER_BRAND,
	DIAPER_BRAND_LABELS,
	DIAPER_BRANDS,
} from './diaper-brands';

describe('diaper-brands', () => {
	it('should have a list of diaper brands', () => {
		expect(DIAPER_BRANDS).toBeDefined();
		expect(Array.isArray(DIAPER_BRANDS)).toBe(true);
		expect(DIAPER_BRANDS.length).toBeGreaterThan(0);
	});

	it('should have correct brand labels mapping', () => {
		expect(DIAPER_BRAND_LABELS).toBeDefined();
		DIAPER_BRANDS.forEach((brand) => {
			expect(DIAPER_BRAND_LABELS[brand.value]).toBe(brand.label);
		});
	});

	it('should have a default diaper brand', () => {
		expect(DEFAULT_DIAPER_BRAND).toBeDefined();
		expect(typeof DEFAULT_DIAPER_BRAND).toBe('string');
		expect(DIAPER_BRANDS.some((b) => b.value === DEFAULT_DIAPER_BRAND)).toBe(
			true,
		);
	});
});
