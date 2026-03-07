import { useSliceIds, useSliceRowIds } from 'tinybase/ui-react';
import {
	INDEX_IDS,
	useTinybaseIndexes,
} from '@/contexts/tinybase-indexes-context';

/**
 * Hook to get diaper changes grouped by date using TinyBase Indexes.
 * Returns sorted date keys (most recent first) and a function to get row IDs for each date.
 */
export function useDiaperChangesByDate() {
	const indexes = useTinybaseIndexes();
	const dateKeys = useSliceIds(INDEX_IDS.DIAPER_CHANGES_BY_DATE, indexes);

	return {
		dateKeys,
		indexes,
		indexId: INDEX_IDS.DIAPER_CHANGES_BY_DATE,
	};
}

/**
 * Hook to get events grouped by date using TinyBase Indexes.
 * Returns sorted date keys (most recent first) and a function to get row IDs for each date.
 */
export function useEventsByDate() {
	const indexes = useTinybaseIndexes();
	const dateKeys = useSliceIds(INDEX_IDS.EVENTS_BY_DATE, indexes);

	return {
		dateKeys,
		indexes,
		indexId: INDEX_IDS.EVENTS_BY_DATE,
	};
}

/**
 * Hook to get feeding sessions grouped by date using TinyBase Indexes.
 * Returns sorted date keys (most recent first) and a function to get row IDs for each date.
 */
export function useFeedingSessionsByDate() {
	const indexes = useTinybaseIndexes();
	const dateKeys = useSliceIds(INDEX_IDS.FEEDING_SESSIONS_BY_DATE, indexes);

	return {
		dateKeys,
		indexes,
		indexId: INDEX_IDS.FEEDING_SESSIONS_BY_DATE,
	};
}

/**
 * Hook to get growth measurements grouped by date using TinyBase Indexes.
 * Returns sorted date keys (most recent first) and a function to get row IDs for each date.
 */
export function useGrowthMeasurementsByDate() {
	const indexes = useTinybaseIndexes();
	const dateKeys = useSliceIds(INDEX_IDS.GROWTH_MEASUREMENTS_BY_DATE, indexes);

	return {
		dateKeys,
		indexes,
		indexId: INDEX_IDS.GROWTH_MEASUREMENTS_BY_DATE,
	};
}

/**
 * Hook to get row IDs within a specific date slice.
 * This is a convenience wrapper around useSliceRowIds.
 */
export function useDateSliceRowIds(indexId: string, dateKey: string): string[] {
	const indexes = useTinybaseIndexes();
	return useSliceRowIds(indexId, dateKey, indexes);
}
