'use client';

import type { Indexes } from 'tinybase';
import { format, parseISO } from 'date-fns';
import { createContext, useContext } from 'react';
import { createIndexes } from 'tinybase';
import { useCreateIndexes } from 'tinybase/ui-react';
import { useTinybaseStore } from '@/hooks/use-tinybase-store';
import '@/hooks/use-tinybase-store';
import { TABLE_IDS } from '@/lib/tinybase-sync/constants';

/**
 * Index IDs for grouping records by date.
 * Each index groups rows from a table by the date portion of their timestamp.
 */
export const INDEX_IDS = {
	DIAPER_CHANGES_BY_DATE: 'diaperChangesByDate',
	EVENTS_BY_DATE: 'eventsByDate',
	FEEDING_SESSIONS_BY_DATE: 'feedingSessionsByDate',
	GROWTH_MEASUREMENTS_BY_DATE: 'growthMeasurementsByDate',
	TEETH_BY_DATE: 'teethByDate',
} as const;

/**
 * Extracts the date portion (yyyy-MM-dd) from a timestamp cell value.
 * Returns empty string for invalid or missing timestamps.
 */
function getDateSliceId(getCell: (cellId: string) => unknown, cellId: string) {
	const timestamp = getCell(cellId);
	if (typeof timestamp !== 'string' || timestamp === '') {
		return '';
	}

	const parsedDate = parseISO(timestamp);
	if (Number.isNaN(parsedDate.getTime())) {
		return '';
	}

	return format(parsedDate, 'yyyy-MM-dd');
}

/**
 * Gets a numeric sort key from a timestamp cell value.
 * Used to sort rows within a date slice by their full timestamp (descending).
 */
function getTimestampSortKey(
	getCell: (cellId: string) => unknown,
	cellId: string,
) {
	const timestamp = getCell(cellId);
	if (typeof timestamp !== 'string') {
		return 0;
	}

	const sortKey = Date.parse(timestamp);
	return Number.isNaN(sortKey) ? 0 : sortKey;
}

/**
 * Comparator for sorting slice IDs (dates) in descending order.
 * More recent dates come first.
 */
function descendingSliceIdSorter(sliceId1: string, sliceId2: string) {
	return sliceId2.localeCompare(sliceId1);
}

/**
 * Comparator for sorting row IDs within a slice by timestamp (descending).
 * More recent timestamps come first.
 */
function descendingRowIdSorter(sortKey1: unknown, sortKey2: unknown) {
	const key1 = typeof sortKey1 === 'number' ? sortKey1 : 0;
	const key2 = typeof sortKey2 === 'number' ? sortKey2 : 0;
	return key2 - key1;
}

export const TinybaseIndexesContext = createContext<{
	indexes: Indexes | undefined;
}>({
	indexes: undefined,
});

interface TinybaseIndexesProviderProps {
	children: React.ReactNode;
}

export function TinybaseIndexesProvider({
	children,
}: TinybaseIndexesProviderProps) {
	const store = useTinybaseStore();

	const indexes = useCreateIndexes(store, (store) => {
		const indexes = createIndexes(store);

		// Diaper changes grouped by date, sorted by timestamp descending
		indexes.setIndexDefinition(
			INDEX_IDS.DIAPER_CHANGES_BY_DATE,
			TABLE_IDS.DIAPER_CHANGES,
			(getCell) => getDateSliceId(getCell, 'timestamp'),
			(getCell) => getTimestampSortKey(getCell, 'timestamp'),
			descendingSliceIdSorter,
			descendingRowIdSorter,
		);

		// Events grouped by date, sorted by startDate descending
		indexes.setIndexDefinition(
			INDEX_IDS.EVENTS_BY_DATE,
			TABLE_IDS.EVENTS,
			(getCell) => getDateSliceId(getCell, 'startDate'),
			(getCell) => getTimestampSortKey(getCell, 'startDate'),
			descendingSliceIdSorter,
			descendingRowIdSorter,
		);

		// Feeding sessions grouped by date, sorted by startTime descending
		indexes.setIndexDefinition(
			INDEX_IDS.FEEDING_SESSIONS_BY_DATE,
			TABLE_IDS.FEEDING_SESSIONS,
			(getCell) => getDateSliceId(getCell, 'startTime'),
			(getCell) => getTimestampSortKey(getCell, 'startTime'),
			descendingSliceIdSorter,
			descendingRowIdSorter,
		);

		// Growth measurements grouped by date, sorted by date descending
		indexes.setIndexDefinition(
			INDEX_IDS.GROWTH_MEASUREMENTS_BY_DATE,
			TABLE_IDS.GROWTH_MEASUREMENTS,
			(getCell) => getDateSliceId(getCell, 'date'),
			(getCell) => getTimestampSortKey(getCell, 'date'),
			descendingSliceIdSorter,
			descendingRowIdSorter,
		);

		// Teeth grouped by date, sorted by date descending
		indexes.setIndexDefinition(
			INDEX_IDS.TEETH_BY_DATE,
			TABLE_IDS.TEETHING,
			(getCell) => getDateSliceId(getCell, 'date'),
			(getCell) => getTimestampSortKey(getCell, 'date'),
			descendingSliceIdSorter,
			descendingRowIdSorter,
		);

		return indexes;
	});

	return (
		<TinybaseIndexesContext.Provider value={{ indexes }}>
			{children}
		</TinybaseIndexesContext.Provider>
	);
}

export function useTinybaseIndexes() {
	const context = useContext(TinybaseIndexesContext);
	return context.indexes;
}
