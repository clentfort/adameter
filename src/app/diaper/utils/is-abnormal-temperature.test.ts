import { describe, expect, it } from 'vitest';
import { isAbnormalTemperature } from './is-abnormal-temperature';

describe('isAbnormalTemperature', () => {
	it('returns false for normal temperature (36.5 - 37.5)', () => {
		expect(isAbnormalTemperature(36.5)).toBe(false);
		expect(isAbnormalTemperature(37.0)).toBe(false);
		expect(isAbnormalTemperature(37.5)).toBe(false);
	});

	it('returns true for low temperature (< 36.5)', () => {
		expect(isAbnormalTemperature(36.4)).toBe(true);
		expect(isAbnormalTemperature(35.0)).toBe(true);
	});

	it('returns true for high temperature (> 37.5)', () => {
		expect(isAbnormalTemperature(37.6)).toBe(true);
		expect(isAbnormalTemperature(38.5)).toBe(true);
	});
});
