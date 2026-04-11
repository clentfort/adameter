import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getRangeDates } from './get-range-dates';

describe('getRangeDates', () => {
	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(new Date('2024-01-15T12:00:00Z'));
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('should return a range from Unix epoch to now when timeRange is "all"', () => {
		const result = getRangeDates('all');
		expect(result.primary.from.getTime()).toBe(0);
		expect(result.primary.to).toEqual(new Date('2024-01-15T12:00:00Z'));
		expect(result.secondary).toBeUndefined();
	});
});
