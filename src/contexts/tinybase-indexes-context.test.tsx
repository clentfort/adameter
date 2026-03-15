import { renderHook } from '@testing-library/react';
import { createStore } from 'tinybase';
import { Provider } from "tinybase/ui-react";
import { } from '@/hooks/use-tinybase-store';
import { describe, expect, it } from 'vitest';
import { TABLE_IDS } from '@/lib/tinybase-sync/constants';
import {
	INDEX_IDS,
	TinybaseIndexesProvider,
	useTinybaseIndexes,
} from './tinybase-indexes-context';

function createTestStore() {
	const store = createStore();

	// Add test data
	store.setRow(TABLE_IDS.DIAPER_CHANGES, 'diaper-1', {
		containsUrine: true,
		timestamp: '2024-01-15T10:00:00Z',
	});
	store.setRow(TABLE_IDS.DIAPER_CHANGES, 'diaper-2', {
		containsStool: true,
		timestamp: '2024-01-14T09:00:00Z',
	});

	store.setRow(TABLE_IDS.EVENTS, 'event-1', {
		startDate: '2024-01-15T08:00:00Z',
		type: 'nap',
	});

	store.setRow(TABLE_IDS.FEEDING_SESSIONS, 'feeding-1', {
		breast: 'left',
		startTime: '2024-01-15T07:00:00Z',
	});

	store.setRow(TABLE_IDS.GROWTH_MEASUREMENTS, 'growth-1', {
		date: '2024-01-15T11:00:00Z',
		weight: 4500,
	});

	return store;
}

function TestWrapper({ children }: { children: React.ReactNode }) {
	const store = createTestStore();
	return (
		<Provider store={store}>
			<TinybaseIndexesProvider>{children}</TinybaseIndexesProvider>
		</Provider>
	);
}

describe('TinybaseIndexesProvider', () => {
	it('should provide indexes through context', () => {
		const { result } = renderHook(() => useTinybaseIndexes(), {
			wrapper: TestWrapper,
		});

		expect(result.current).toBeDefined();
	});

	it('should return undefined when used outside provider', () => {
		const store = createTestStore();
		const wrapper = ({ children }: { children: React.ReactNode }) => (
			<Provider store={store}>{children}</Provider>
		);

		const { result } = renderHook(() => useTinybaseIndexes(), { wrapper });

		expect(result.current).toBeUndefined();
	});
});

describe('TinybaseIndexesProvider index definitions', () => {
	it('should create diaper changes index with correct configuration', () => {
		const { result } = renderHook(() => useTinybaseIndexes(), {
			wrapper: TestWrapper,
		});

		const indexes = result.current!;
		const sliceIds = indexes.getSliceIds(INDEX_IDS.DIAPER_CHANGES_BY_DATE);

		// Should be sorted descending
		expect(sliceIds).toEqual(['2024-01-15', '2024-01-14']);
	});

	it('should create events index with correct configuration', () => {
		const { result } = renderHook(() => useTinybaseIndexes(), {
			wrapper: TestWrapper,
		});

		const indexes = result.current!;
		const sliceIds = indexes.getSliceIds(INDEX_IDS.EVENTS_BY_DATE);

		expect(sliceIds).toEqual(['2024-01-15']);
	});

	it('should create feeding sessions index with correct configuration', () => {
		const { result } = renderHook(() => useTinybaseIndexes(), {
			wrapper: TestWrapper,
		});

		const indexes = result.current!;
		const sliceIds = indexes.getSliceIds(INDEX_IDS.FEEDING_SESSIONS_BY_DATE);

		expect(sliceIds).toEqual(['2024-01-15']);
	});

	it('should create growth measurements index with correct configuration', () => {
		const { result } = renderHook(() => useTinybaseIndexes(), {
			wrapper: TestWrapper,
		});

		const indexes = result.current!;
		const sliceIds = indexes.getSliceIds(INDEX_IDS.GROWTH_MEASUREMENTS_BY_DATE);

		expect(sliceIds).toEqual(['2024-01-15']);
	});

	it('should sort rows within a slice by timestamp descending', () => {
		// Create store with multiple entries on same day
		const store = createStore();
		store.setRow(TABLE_IDS.DIAPER_CHANGES, 'early', {
			containsUrine: true,
			timestamp: '2024-01-15T08:00:00Z',
		});
		store.setRow(TABLE_IDS.DIAPER_CHANGES, 'late', {
			containsUrine: true,
			timestamp: '2024-01-15T20:00:00Z',
		});
		store.setRow(TABLE_IDS.DIAPER_CHANGES, 'mid', {
			containsUrine: true,
			timestamp: '2024-01-15T14:00:00Z',
		});

		const wrapper = ({ children }: { children: React.ReactNode }) => (
			<Provider store={store}>
				<TinybaseIndexesProvider>{children}</TinybaseIndexesProvider>
			</Provider>
		);

		const { result } = renderHook(() => useTinybaseIndexes(), { wrapper });

		const indexes = result.current!;
		const rowIds = indexes.getSliceRowIds(
			INDEX_IDS.DIAPER_CHANGES_BY_DATE,
			'2024-01-15',
		);

		// Should be sorted by timestamp descending: late, mid, early
		expect(rowIds).toEqual(['late', 'mid', 'early']);
	});

	it('should handle invalid timestamps by assigning empty slice id', () => {
		const store = createStore();
		store.setRow(TABLE_IDS.DIAPER_CHANGES, 'valid', {
			containsUrine: true,
			timestamp: '2024-01-15T10:00:00Z',
		});
		store.setRow(TABLE_IDS.DIAPER_CHANGES, 'invalid', {
			containsUrine: true,
			timestamp: 'not-a-date',
		});
		store.setRow(TABLE_IDS.DIAPER_CHANGES, 'missing', {
			containsUrine: true,
		});

		const wrapper = ({ children }: { children: React.ReactNode }) => (
			<Provider store={store}>
				<TinybaseIndexesProvider>{children}</TinybaseIndexesProvider>
			</Provider>
		);

		const { result } = renderHook(() => useTinybaseIndexes(), { wrapper });

		const indexes = result.current!;
		const sliceIds = indexes.getSliceIds(INDEX_IDS.DIAPER_CHANGES_BY_DATE);

		// Valid date should be present, invalid/missing go to empty string slice
		expect(sliceIds).toContain('2024-01-15');
		expect(sliceIds).toContain(''); // empty slice for invalid timestamps

		// Check the valid row is in the correct slice
		const validRowIds = indexes.getSliceRowIds(
			INDEX_IDS.DIAPER_CHANGES_BY_DATE,
			'2024-01-15',
		);
		expect(validRowIds).toEqual(['valid']);

		// Check invalid rows are in the empty slice
		const invalidRowIds = indexes.getSliceRowIds(
			INDEX_IDS.DIAPER_CHANGES_BY_DATE,
			'',
		);
		expect(invalidRowIds).toContain('invalid');
		expect(invalidRowIds).toContain('missing');
	});
});

describe('INDEX_IDS', () => {
	it('should export all index IDs', () => {
		expect(INDEX_IDS.DIAPER_CHANGES_BY_DATE).toBe('diaperChangesByDate');
		expect(INDEX_IDS.EVENTS_BY_DATE).toBe('eventsByDate');
		expect(INDEX_IDS.FEEDING_SESSIONS_BY_DATE).toBe('feedingSessionsByDate');
		expect(INDEX_IDS.GROWTH_MEASUREMENTS_BY_DATE).toBe(
			'growthMeasurementsByDate',
		);
	});
});
