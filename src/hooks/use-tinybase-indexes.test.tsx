import { renderHook } from '@testing-library/react';
import { createStore } from 'tinybase';
import { Provider } from 'tinybase/ui-react';
import { describe, expect, it } from 'vitest';
import {
	INDEX_IDS,
	TinybaseIndexesProvider,
} from '@/contexts/tinybase-indexes-context';
import { TABLE_IDS } from '@/lib/tinybase-sync/constants';
import {
	useDateSliceRowIds,
	useDiaperChangesByDate,
	useEventsByDate,
	useFeedingSessionsByDate,
	useGrowthMeasurementsByDate,
} from './use-tinybase-indexes';

function createTestStore() {
	const store = createStore();

	// Add diaper changes
	store.setRow(TABLE_IDS.DIAPER_CHANGES, 'diaper-1', {
		containsUrine: true,
		timestamp: '2024-01-15T10:00:00Z',
	});
	store.setRow(TABLE_IDS.DIAPER_CHANGES, 'diaper-2', {
		containsStool: true,
		timestamp: '2024-01-15T14:00:00Z',
	});
	store.setRow(TABLE_IDS.DIAPER_CHANGES, 'diaper-3', {
		containsUrine: true,
		timestamp: '2024-01-14T09:00:00Z',
	});

	// Add events
	store.setRow(TABLE_IDS.EVENTS, 'event-1', {
		startDate: '2024-01-15T08:00:00Z',
		type: 'nap',
	});
	store.setRow(TABLE_IDS.EVENTS, 'event-2', {
		startDate: '2024-01-14T20:00:00Z',
		type: 'sleep',
	});

	// Add feeding sessions
	store.setRow(TABLE_IDS.FEEDING_SESSIONS, 'feeding-1', {
		breast: 'left',
		startTime: '2024-01-15T07:00:00Z',
	});
	store.setRow(TABLE_IDS.FEEDING_SESSIONS, 'feeding-2', {
		breast: 'right',
		startTime: '2024-01-15T12:00:00Z',
	});

	// Add growth measurements
	store.setRow(TABLE_IDS.GROWTH_MEASUREMENTS, 'growth-1', {
		timestamp: '2024-01-15T11:00:00Z',
		weight: 4500,
	});
	store.setRow(TABLE_IDS.GROWTH_MEASUREMENTS, 'growth-2', {
		timestamp: '2024-01-10T11:00:00Z',
		weight: 4400,
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

describe('useDiaperChangesByDate', () => {
	it('should return date keys sorted in descending order', () => {
		const { result } = renderHook(() => useDiaperChangesByDate(), {
			wrapper: TestWrapper,
		});

		expect(result.current.dateKeys).toEqual(['2024-01-15', '2024-01-14']);
		expect(result.current.indexId).toBe(INDEX_IDS.DIAPER_CHANGES_BY_DATE);
		expect(result.current.indexes).toBeDefined();
	});
});

describe('useEventsByDate', () => {
	it('should return date keys sorted in descending order', () => {
		const { result } = renderHook(() => useEventsByDate(), {
			wrapper: TestWrapper,
		});

		expect(result.current.dateKeys).toEqual(['2024-01-15', '2024-01-14']);
		expect(result.current.indexId).toBe(INDEX_IDS.EVENTS_BY_DATE);
		expect(result.current.indexes).toBeDefined();
	});
});

describe('useFeedingSessionsByDate', () => {
	it('should return date keys sorted in descending order', () => {
		const { result } = renderHook(() => useFeedingSessionsByDate(), {
			wrapper: TestWrapper,
		});

		expect(result.current.dateKeys).toEqual(['2024-01-15']);
		expect(result.current.indexId).toBe(INDEX_IDS.FEEDING_SESSIONS_BY_DATE);
		expect(result.current.indexes).toBeDefined();
	});
});

describe('useGrowthMeasurementsByDate', () => {
	it('should return date keys sorted in descending order', () => {
		const { result } = renderHook(() => useGrowthMeasurementsByDate(), {
			wrapper: TestWrapper,
		});

		expect(result.current.dateKeys).toEqual(['2024-01-15', '2024-01-10']);
		expect(result.current.indexId).toBe(INDEX_IDS.GROWTH_MEASUREMENTS_BY_DATE);
		expect(result.current.indexes).toBeDefined();
	});
});

describe('useDateSliceRowIds', () => {
	it('should return row IDs for a specific date slice sorted by timestamp descending', () => {
		const { result } = renderHook(
			() => useDateSliceRowIds(INDEX_IDS.DIAPER_CHANGES_BY_DATE, '2024-01-15'),
			{ wrapper: TestWrapper },
		);

		// diaper-2 (14:00) should come before diaper-1 (10:00)
		expect(result.current).toEqual(['diaper-2', 'diaper-1']);
	});

	it('should return empty array for non-existent date slice', () => {
		const { result } = renderHook(
			() => useDateSliceRowIds(INDEX_IDS.DIAPER_CHANGES_BY_DATE, '2024-01-01'),
			{ wrapper: TestWrapper },
		);

		expect(result.current).toEqual([]);
	});
});
