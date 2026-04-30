import { useMemo } from 'react';
import { useSliceIds, useSliceRowIds } from 'tinybase/ui-react';
import {
	INDEX_IDS,
	useTinybaseIndexes,
} from '@/contexts/tinybase-indexes-context';
import { useSelectedProfileId } from './use-selected-profile-id';

/**
 * Factory function to create a hook that returns date keys for a specific index.
 */
function createByDateHook(indexId: string) {
	return function useByDate() {
		const indexes = useTinybaseIndexes();
		const allSliceIds = useSliceIds(indexId, indexes);
		const [selectedProfileId] = useSelectedProfileId();

		const dateKeys = useMemo(() => {
			if (!selectedProfileId) {
				return allSliceIds.filter((id) => !id.includes(':'));
			}
			const prefix = `${selectedProfileId}:`;
			return allSliceIds
				.filter((id) => id.startsWith(prefix))
				.map((id) => id.slice(prefix.length));
		}, [allSliceIds, selectedProfileId]);

		return {
			dateKeys,
			indexes,
			indexId,
		};
	};
}

/**
 * Hook to get diaper changes grouped by date using TinyBase Indexes.
 * Returns sorted date keys (most recent first) and a function to get row IDs for each date.
 */
export const useDiaperChangesByDate = createByDateHook(
	INDEX_IDS.DIAPER_CHANGES_BY_DATE,
);

/**
 * Hook to get teeth grouped by date using TinyBase Indexes.
 * Returns sorted date keys (most recent first) and a function to get row IDs for each date.
 */
export const useTeethByDate = createByDateHook(INDEX_IDS.TEETH_BY_DATE);

/**
 * Hook to get events grouped by date using TinyBase Indexes.
 * Returns sorted date keys (most recent first) and a function to get row IDs for each date.
 */
export const useEventsByDate = createByDateHook(INDEX_IDS.EVENTS_BY_DATE);

/**
 * Hook to get feeding sessions grouped by date using TinyBase Indexes.
 * Returns sorted date keys (most recent first) and a function to get row IDs for each date.
 */
export const useFeedingSessionsByDate = createByDateHook(
	INDEX_IDS.FEEDING_SESSIONS_BY_DATE,
);

/**
 * Hook to get growth measurements grouped by date using TinyBase Indexes.
 * Returns sorted date keys (most recent first) and a function to get row IDs for each date.
 */
export const useGrowthMeasurementsByDate = createByDateHook(
	INDEX_IDS.GROWTH_MEASUREMENTS_BY_DATE,
);

/**
 * Hook to get row IDs within a specific date slice.
 * This is a convenience wrapper around useSliceRowIds.
 */
export function useDateSliceRowIds(indexId: string, dateKey: string): string[] {
	const indexes = useTinybaseIndexes();
	const [selectedProfileId] = useSelectedProfileId();

	const sliceId = useMemo(() => {
		if (selectedProfileId && !dateKey.includes(':')) {
			return `${selectedProfileId}:${dateKey}`;
		}
		return dateKey;
	}, [selectedProfileId, dateKey]);

	return useSliceRowIds(indexId, sliceId, indexes);
}
