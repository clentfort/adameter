import type { DateRange } from '@/utils/get-range-dates';
import { describe, expect, it } from 'vitest';
import { filterByRange } from './filter-by-range';

describe('filterByRange', () => {
	const range: DateRange = {
		from: new Date('2025-01-01T00:00:00.000Z'),
		to: new Date('2025-01-07T23:59:59.999Z'),
	};

	const items = [
		{ id: '1', timestamp: '2024-12-31T23:59:59.000Z' }, // before
		{ id: '2', timestamp: '2025-01-01T00:00:00.000Z' }, // start exact
		{ id: '3', timestamp: '2025-01-03T12:00:00.000Z' }, // inside
		{ id: '4', timestamp: '2025-01-07T23:59:59.999Z' }, // end exact
		{ id: '5', timestamp: '2025-01-08T00:00:00.000Z' }, // after
	];

	it('returns filtered items within range', () => {
		const filtered = filterByRange(items, range, (item) => item.timestamp);
		expect(filtered).toEqual([
			{ id: '2', timestamp: '2025-01-01T00:00:00.000Z' },
			{ id: '3', timestamp: '2025-01-03T12:00:00.000Z' },
			{ id: '4', timestamp: '2025-01-07T23:59:59.999Z' },
		]);
	});

	it('returns an empty array when range is undefined', () => {
		const filtered = filterByRange(items, undefined, (item) => item.timestamp);
		expect(filtered).toEqual([]);
	});

	it('returns an empty array when items array is empty', () => {
		const filtered = filterByRange(
			[],
			range,
			(item: { timestamp: string }) => item.timestamp,
		);
		expect(filtered).toEqual([]);
	});

	it('handles Date objects and numeric timestamps', () => {
		const mixedItems: Array<{ date?: Date; timestampNum?: number }> = [
			{ date: new Date('2025-01-03T12:00:00.000Z') },
			{ timestampNum: new Date('2025-01-05T12:00:00.000Z').getTime() },
			{ timestampNum: new Date('2025-01-10T12:00:00.000Z').getTime() },
		];

		const filteredDate = filterByRange(
			[mixedItems[0]],
			range,
			(item) => item.date ?? '',
		);
		expect(filteredDate).toHaveLength(1);

		const filteredNum = filterByRange(
			[mixedItems[1], mixedItems[2]],
			range,
			(item) => item.timestampNum ?? 0,
		);
		expect(filteredNum).toEqual([
			{ timestampNum: new Date('2025-01-05T12:00:00.000Z').getTime() },
		]);
	});
});
