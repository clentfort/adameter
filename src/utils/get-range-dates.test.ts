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

	it('should return primary and secondary ranges for numeric and custom timeRanges', () => {
		// Test numeric range ('7' days)
		const numericResult = getRangeDates('7');
		// Primary: 2024-01-09 to 2024-01-15
		expect(numericResult.primary.from).toEqual(
			new Date('2024-01-09T00:00:00.000Z'),
		);
		expect(numericResult.primary.to).toEqual(
			new Date('2024-01-15T23:59:59.999Z'),
		);
		// Secondary: 2024-01-02 to 2024-01-08
		expect(numericResult.secondary?.from).toEqual(
			new Date('2024-01-02T00:00:00.000Z'),
		);
		expect(numericResult.secondary?.to).toEqual(
			new Date('2024-01-08T23:59:59.999Z'),
		);

		// Test custom range
		const customResult = getRangeDates('custom', {
			from: '2024-01-10',
			to: '2024-01-12',
		});
		// Primary: 2024-01-10 to 2024-01-12 (3 days)
		expect(customResult.primary.from).toEqual(
			new Date('2024-01-10T00:00:00.000Z'),
		);
		expect(customResult.primary.to).toEqual(
			new Date('2024-01-12T23:59:59.999Z'),
		);
		// Secondary: 2024-01-07 to 2024-01-09 (3 days back)
		expect(customResult.secondary?.from).toEqual(
			new Date('2024-01-07T00:00:00.000Z'),
		);
		expect(customResult.secondary?.to).toEqual(
			new Date('2024-01-09T23:59:59.999Z'),
		);
	});
});
