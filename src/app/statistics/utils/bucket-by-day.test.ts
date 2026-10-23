import { describe, expect, it } from 'vitest';
import { bucketByDay } from './bucket-by-day';

describe('bucketByDay', () => {
	const days = [
		new Date(2025, 0, 1, 10, 0, 0),
		new Date(2025, 0, 2, 10, 0, 0),
		new Date(2025, 0, 3, 10, 0, 0),
	];

	it('buckets items into daily array based on string timestamp', () => {
		const items = [
			{ count: 2, time: '2025-01-01T10:00:00' },
			{ count: 3, time: '2025-01-01T15:00:00' },
			{ count: 5, time: '2025-01-03T12:00:00' },
		];

		const buckets = bucketByDay(
			items,
			days,
			(item) => item.time,
			() => ({ total: 0 }),
			(acc, item) => {
				acc.total += item.count;
			},
		);

		expect(buckets).toEqual([{ total: 5 }, { total: 0 }, { total: 5 }]);
	});

	it('handles numeric and Date timestamps', () => {
		const items = [
			{ time: new Date(2025, 0, 1, 8, 0, 0), val: 1 },
			{ time: new Date(2025, 0, 2, 9, 0, 0).getTime(), val: 2 },
		];

		const buckets = bucketByDay(
			items,
			days,
			(item) => item.time,
			() => ({ sum: 0 }),
			(acc, item) => {
				acc.sum += item.val;
			},
		);

		expect(buckets).toEqual([{ sum: 1 }, { sum: 2 }, { sum: 0 }]);
	});

	it('ignores items outside the provided date range', () => {
		const items = [
			{ timestamp: new Date(2024, 11, 31, 23, 59, 59), value: 10 },
			{ timestamp: new Date(2025, 0, 2, 8, 0, 0), value: 20 },
			{ timestamp: new Date(2025, 0, 4, 0, 0, 1), value: 30 },
		];

		const buckets = bucketByDay(
			items,
			days,
			(item) => item.timestamp,
			() => ({ val: 0 }),
			(acc, item) => {
				acc.val += item.value;
			},
		);

		expect(buckets).toEqual([{ val: 0 }, { val: 20 }, { val: 0 }]);
	});

	it('returns initialized empty buckets when items list is empty', () => {
		const buckets = bucketByDay(
			[],
			days,
			(item: { time: string }) => item.time,
			() => ({ total: 0 }),
			(acc, item) => {
				acc.total += 1;
			},
		);

		expect(buckets).toEqual([{ total: 0 }, { total: 0 }, { total: 0 }]);
	});

	it('skips items with invalid date timestamps without throwing', () => {
		const items = [
			{ count: 1, time: 'not-a-date' },
			{ count: 2, time: '2025-01-02T09:00:00' },
		];

		const buckets = bucketByDay(
			items,
			days,
			(item) => item.time,
			() => ({ total: 0 }),
			(acc, item) => {
				acc.total += item.count;
			},
		);

		expect(buckets).toEqual([{ total: 0 }, { total: 2 }, { total: 0 }]);
	});
});
