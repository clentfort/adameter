import type { DiaperChange } from '@/types/diaper';
import type { FeedingSession } from '@/types/feeding';
import type { DateRange } from '@/utils/get-range-dates';
import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useStatisticsRangeData } from './use-statistics-range-data';

describe('useStatisticsRangeData', () => {
	const primaryRange: DateRange = {
		from: new Date('2025-01-01T00:00:00.000Z'),
		to: new Date('2025-01-07T23:59:59.999Z'),
	};

	const secondaryRange: DateRange = {
		from: new Date('2024-12-25T00:00:00.000Z'),
		to: new Date('2024-12-31T23:59:59.999Z'),
	};

	const sessions: FeedingSession[] = [
		{
			breast: 'left',
			durationInSeconds: 600,
			endTime: '2024-12-28T10:10:00.000Z',
			id: 's1',
			startTime: '2024-12-28T10:00:00.000Z', // secondary
		},
		{
			breast: 'right',
			durationInSeconds: 600,
			endTime: '2025-01-02T10:10:00.000Z',
			id: 's2',
			startTime: '2025-01-02T10:00:00.000Z', // primary
		},
	];

	const diaperChanges: DiaperChange[] = [
		{
			containsStool: false,
			containsUrine: true,
			id: 'd1',
			timestamp: '2024-12-28T10:00:00.000Z', // secondary
		},
		{
			containsStool: true,
			containsUrine: false,
			id: 'd2',
			timestamp: '2025-01-02T10:00:00.000Z', // primary
		},
	];

	it('filters sessions and diaper changes for primary and secondary ranges', () => {
		const { result } = renderHook(() =>
			useStatisticsRangeData({
				diaperChanges,
				primary: primaryRange,
				secondary: secondaryRange,
				sessions,
			}),
		);

		expect(result.current.filteredSessions).toEqual([sessions[1]]);
		expect(result.current.comparisonSessions).toEqual([sessions[0]]);
		expect(result.current.filteredDiaperChanges).toEqual([diaperChanges[1]]);
		expect(result.current.comparisonDiaperChanges).toEqual([diaperChanges[0]]);
	});

	it('returns undefined comparison sessions and diaper changes when secondary range is undefined', () => {
		const { result } = renderHook(() =>
			useStatisticsRangeData({
				diaperChanges,
				primary: primaryRange,
				secondary: undefined,
				sessions,
			}),
		);

		expect(result.current.filteredSessions).toEqual([sessions[1]]);
		expect(result.current.comparisonSessions).toBeUndefined();
		expect(result.current.filteredDiaperChanges).toEqual([diaperChanges[1]]);
		expect(result.current.comparisonDiaperChanges).toBeUndefined();
	});
});
