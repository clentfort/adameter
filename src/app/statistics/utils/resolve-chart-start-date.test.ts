import { describe, expect, it, vi } from 'vitest';
import { resolveChartStartDate } from './resolve-chart-start-date';

describe('resolveChartStartDate', () => {
	it('returns normal from date when from is not sentinel Date(0)', () => {
		const normalFrom = new Date('2023-05-01T00:00:00Z');
		const items = [{ timestamp: '2023-05-10T00:00:00Z' }];
		const result = resolveChartStartDate(
			normalFrom,
			items,
			(item) => item.timestamp,
		);
		expect(result).toEqual(normalFrom);
	});

	it('returns earliest item timestamp when from is sentinel Date(0) and items are present', () => {
		const sentinelFrom = new Date(0);
		const items = [
			{ timestamp: '2023-06-15T12:00:00Z' },
			{ timestamp: '2023-01-10T08:00:00Z' },
			{ timestamp: '2023-03-20T10:00:00Z' },
		];
		const result = resolveChartStartDate(
			sentinelFrom,
			items,
			(item) => item.timestamp,
		);
		expect(result).toEqual(new Date('2023-01-10T08:00:00Z'));
	});

	it('returns 30 days ago when from is sentinel Date(0) and items array is empty', () => {
		const sentinelFrom = new Date(0);
		const now = new Date('2023-10-15T12:00:00Z');
		vi.useFakeTimers();
		vi.setSystemTime(now);

		try {
			const result = resolveChartStartDate(
				sentinelFrom,
				[],
				(item: { timestamp: string }) => item.timestamp,
			);
			const expected = new Date('2023-10-15T12:00:00Z');
			expected.setDate(expected.getDate() - 30);
			expect(result).toEqual(expected);
		} finally {
			vi.useRealTimers();
		}
	});
});
