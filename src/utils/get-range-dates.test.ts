import { endOfDay, startOfDay, subDays } from 'date-fns';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getRangeDates } from './get-range-dates';

describe('getRangeDates', () => {
	const mockNow = new Date('2024-05-20T12:00:00Z');

	beforeEach(() => {
		vi.useFakeTimers();
		vi.setSystemTime(mockNow);
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it('returns correct dates for all supported ranges', () => {
		// 7 days
		const result7 = getRangeDates('7');
		expect(result7.primary.from).toEqual(startOfDay(subDays(mockNow, 6)));
		expect(result7.primary.to).toEqual(endOfDay(mockNow));
		expect(result7.secondary?.from).toEqual(subDays(result7.primary.from, 7));
		expect(result7.secondary?.to).toEqual(subDays(result7.primary.to, 7));

		// 14 days
		const result14 = getRangeDates('14');
		expect(result14.primary.from).toEqual(startOfDay(subDays(mockNow, 13)));
		expect(result14.primary.to).toEqual(endOfDay(mockNow));
		expect(result14.secondary?.from).toEqual(
			subDays(result14.primary.from, 14),
		);
		expect(result14.secondary?.to).toEqual(subDays(result14.primary.to, 14));

		// 30 days
		const result30 = getRangeDates('30');
		expect(result30.primary.from).toEqual(startOfDay(subDays(mockNow, 29)));
		expect(result30.primary.to).toEqual(endOfDay(mockNow));
		expect(result30.secondary?.from).toEqual(
			subDays(result30.primary.from, 30),
		);
		expect(result30.secondary?.to).toEqual(subDays(result30.primary.to, 30));

		// "all"
		const resultAll = getRangeDates('all');
		expect(resultAll.primary.from).toEqual(new Date(0));
		expect(resultAll.primary.to).toEqual(mockNow);
		expect(resultAll.secondary).toBeUndefined();

		// "custom"
		const customRange = {
			from: '2024-05-01',
			to: '2024-05-10',
		};
		const resultCustom = getRangeDates('custom', customRange);
		expect(resultCustom.primary.from).toEqual(
			startOfDay(new Date('2024-05-01')),
		);
		expect(resultCustom.primary.to).toEqual(endOfDay(new Date('2024-05-10')));
		expect(resultCustom.secondary?.from).toEqual(
			subDays(resultCustom.primary.from, 10),
		);
		expect(resultCustom.secondary?.to).toEqual(
			subDays(resultCustom.primary.to, 10),
		);

		// Edge case: custom without range
		const resultCustomMissing = getRangeDates('custom');
		expect(resultCustomMissing.primary.from).toEqual(new Date(Number.NaN));
	});
});
