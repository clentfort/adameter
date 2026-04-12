import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TABLE_IDS } from '@/lib/tinybase-sync/constants';
import {
	createTestStore,
	TinyBaseTestWrapper,
} from '@/test-utils/tinybase-test-wrapper';
import { useTodayDiaperStats } from './use-today-diaper-stats';

describe('useTodayDiaperStats', () => {
	it('should return zeros when no changes today', () => {
		const store = createTestStore();
		// Yesterday's change
		const yesterday = new Date();
		yesterday.setDate(yesterday.getDate() - 1);

		store.setRow(TABLE_IDS.DIAPER_CHANGES, 'd1', {
			containsUrine: true,
			timestamp: yesterday.toISOString(),
		});

		const { result } = renderHook(() => useTodayDiaperStats(), {
			wrapper: ({ children }) => (
				<TinyBaseTestWrapper store={store}>{children}</TinyBaseTestWrapper>
			),
		});

		expect(result.current).toEqual({ stoolCount: 0, urineCount: 0 });
	});

	it('should count urine and stool instances for today', () => {
		const store = createTestStore();
		const now = new Date();

		// Record 1: Urine in diaper
		store.setRow(TABLE_IDS.DIAPER_CHANGES, 'd1', {
			containsUrine: true,
			timestamp: now.toISOString(),
		});

		// Record 2: Stool in potty
		store.setRow(TABLE_IDS.DIAPER_CHANGES, 'd2', {
			pottyStool: true,
			timestamp: now.toISOString(),
		});

		// Record 3: Urine + Stool (merged types)
		store.setRow(TABLE_IDS.DIAPER_CHANGES, 'd3', {
			containsStool: true,
			containsUrine: true,
			pottyStool: true,
			timestamp: now.toISOString(),
		});

		const { result } = renderHook(() => useTodayDiaperStats(), {
			wrapper: ({ children }) => (
				<TinyBaseTestWrapper store={store}>{children}</TinyBaseTestWrapper>
			),
		});

		// d1: +1 urine
		// d2: +1 stool
		// d3: +1 urine, +1 stool
		// Total: 2 urine, 2 stool
		expect(result.current).toEqual({ stoolCount: 2, urineCount: 2 });
	});

	it('should handle missing timestamp gracefully', () => {
		const store = createTestStore();
		store.setRow(TABLE_IDS.DIAPER_CHANGES, 'd1', {
			containsUrine: true,
		});

		const { result } = renderHook(() => useTodayDiaperStats(), {
			wrapper: ({ children }) => (
				<TinyBaseTestWrapper store={store}>{children}</TinyBaseTestWrapper>
			),
		});

		expect(result.current).toEqual({ stoolCount: 0, urineCount: 0 });
	});
});
