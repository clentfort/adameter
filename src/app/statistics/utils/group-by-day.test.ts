import { describe, expect, it } from 'vitest';
import { getDayKey, groupByDay, maxEntry, minEntry } from './group-by-day';

describe('group-by-day utils', () => {
	describe('getDayKey', () => {
		it('returns yyyy-MM-dd for valid ISO timestamp strings', () => {
			expect(getDayKey('2025-05-10T14:30:00.000Z')).toBe('2025-05-10');
			expect(getDayKey('2024-01-01T00:00:00')).toBe('2024-01-01');
		});

		it('returns undefined for invalid timestamp strings', () => {
			expect(getDayKey('invalid-date')).toBeUndefined();
			expect(getDayKey('')).toBeUndefined();
		});

		it('returns undefined for non-string timestamps', () => {
			expect(getDayKey(null)).toBeUndefined();
			expect(getDayKey(undefined)).toBeUndefined();
			expect(getDayKey(1_234_567_890)).toBeUndefined();
			expect(getDayKey(new Date())).toBeUndefined();
		});
	});

	describe('groupByDay', () => {
		it('groups items by valid day key and skips invalid/excluded dates', () => {
			const items = [
				{ id: '1', timestamp: '2025-05-10T08:00:00Z', val: 5 },
				{ id: '2', timestamp: '2025-05-10T12:00:00Z', val: 10 },
				{ id: '3', timestamp: '2025-05-11T10:00:00Z', val: 3 },
				{ id: '4', timestamp: '2025-05-12T09:00:00Z', val: 7 }, // exclude day
				{ id: '5', timestamp: 'invalid-date', val: 1 },
			];

			const grouped = groupByDay(
				items,
				(item) => item.timestamp,
				() => ({ count: 0, total: 0 }),
				(acc, item) => ({
					count: acc.count + 1,
					total: acc.total + item.val,
				}),
				{ excludeDayKey: '2025-05-12' },
			);

			expect(grouped.size).toBe(2);
			expect(grouped.get('2025-05-10')).toEqual({ count: 2, total: 15 });
			expect(grouped.get('2025-05-11')).toEqual({ count: 1, total: 3 });
			expect(grouped.has('2025-05-12')).toBe(false);
		});
	});

	describe('maxEntry', () => {
		it('returns null for empty entries', () => {
			expect(maxEntry([])).toBeNull();
			expect(maxEntry(new Map())).toBeNull();
		});

		it('finds max entry using numeric values directly', () => {
			const map = new Map<string, number>([
				['2025-05-10', 5],
				['2025-05-11', 12],
				['2025-05-12', 8],
			]);

			expect(maxEntry(map.entries())).toEqual(['2025-05-11', 12]);
		});

		it('finds max entry using a custom value getter and breaks ties with earliest entry', () => {
			const entries: Array<[string, { count: number }]> = [
				['2025-05-10', { count: 5 }],
				['2025-05-11', { count: 10 }],
				['2025-05-12', { count: 10 }],
			];

			expect(maxEntry(entries, (v) => v.count)).toEqual([
				'2025-05-11',
				{ count: 10 },
			]);
		});
	});

	describe('minEntry', () => {
		it('returns null for empty entries', () => {
			expect(minEntry([])).toBeNull();
			expect(minEntry(new Map())).toBeNull();
		});

		it('finds min entry using numeric values directly', () => {
			const map = new Map<string, number>([
				['2025-05-10', 5],
				['2025-05-11', 2],
				['2025-05-12', 8],
			]);

			expect(minEntry(map.entries())).toEqual(['2025-05-11', 2]);
		});

		it('finds min entry using a custom value getter and breaks ties with earliest entry', () => {
			const entries: Array<[string, { count: number }]> = [
				['2025-05-10', { count: 5 }],
				['2025-05-11', { count: 2 }],
				['2025-05-12', { count: 2 }],
			];

			expect(minEntry(entries, (v) => v.count)).toEqual([
				'2025-05-11',
				{ count: 2 },
			]);
		});
	});
});
