import type { Row } from 'tinybase';
import type { DiaperChange } from '@/types/diaper';
import type { Event } from '@/types/event';
import type { FeedingSession } from '@/types/feeding';
import type { GrowthMeasurement } from '@/types/growth';
import { isWithinInterval, parseISO } from 'date-fns';
import { useMemo } from 'react';
import { useTable } from 'tinybase/ui-react';
import { useTinybaseStore } from '@/hooks/use-tinybase-store';
import '@/hooks/use-tinybase-store';
import {
	INDEX_IDS,
	useTinybaseIndexes,
} from '@/contexts/tinybase-indexes-context';
import { TABLE_IDS } from '@/lib/tinybase-sync/constants';
import { diaperChangeSchema } from '@/types/diaper';
import { eventSchema } from '@/types/event';
import { feedingSessionSchema } from '@/types/feeding';
import { growthMeasurementSchema } from '@/types/growth';

function toEntity<T>(
	id: string,
	row: Row | undefined,
	schema: { safeParse: (data: unknown) => { data?: T; success: boolean } },
): T | null {
	if (!row) return null;
	const result = schema.safeParse({ ...row, id });
	return result.success ? (result.data as T) : null;
}

export function useStatsData(
	primary: { from: Date; to: Date },
	secondary?: { from: Date; to: Date },
) {
	const store = useTinybaseStore();
	const indexes = useTinybaseIndexes();

	// We subscribe to the whole tables to ensure reactivity
	const diaperChangesTable = useTable(TABLE_IDS.DIAPER_CHANGES, store);
	const feedingSessionsTable = useTable(TABLE_IDS.FEEDING_SESSIONS, store);
	const eventsTable = useTable(TABLE_IDS.EVENTS, store);
	const growthMeasurementsTable = useTable(
		TABLE_IDS.GROWTH_MEASUREMENTS,
		store,
	);

	return useMemo(() => {
		const getRowsInRange = <T>(
			indexId: string,
			tableId: string,
			table: Record<string, Row>,
			range: { from: Date; to: Date },
			schema: { safeParse: (data: unknown) => { data?: T; success: boolean } },
		): T[] => {
			if (!indexes) return [];
			const sliceIds = indexes.getSliceIds(indexId);
			const filteredSliceIds = sliceIds.filter((dateStr) => {
				const date = parseISO(dateStr);
				return isWithinInterval(date, {
					end: range.to,
					start: range.from,
				});
			});

			const results: T[] = [];
			filteredSliceIds.forEach((sliceId) => {
				const rowIds = indexes.getSliceRowIds(indexId, sliceId);
				rowIds.forEach((rowId) => {
					const row = table[rowId];
					const entity = toEntity<T>(rowId, row, schema);
					if (entity) results.push(entity);
				});
			});
			return results;
		};

		const primarySessions = getRowsInRange<FeedingSession>(
			INDEX_IDS.FEEDING_SESSIONS_BY_DATE,
			TABLE_IDS.FEEDING_SESSIONS,
			feedingSessionsTable,
			primary,
			feedingSessionSchema,
		);
		const secondarySessions = secondary
			? getRowsInRange<FeedingSession>(
					INDEX_IDS.FEEDING_SESSIONS_BY_DATE,
					TABLE_IDS.FEEDING_SESSIONS,
					feedingSessionsTable,
					secondary,
					feedingSessionSchema,
				)
			: undefined;

		const primaryDiaperChanges = getRowsInRange<DiaperChange>(
			INDEX_IDS.DIAPER_CHANGES_BY_DATE,
			TABLE_IDS.DIAPER_CHANGES,
			diaperChangesTable,
			primary,
			diaperChangeSchema,
		);
		const secondaryDiaperChanges = secondary
			? getRowsInRange<DiaperChange>(
					INDEX_IDS.DIAPER_CHANGES_BY_DATE,
					TABLE_IDS.DIAPER_CHANGES,
					diaperChangesTable,
					secondary,
					diaperChangeSchema,
				)
			: undefined;

		const primaryEvents = getRowsInRange<Event>(
			INDEX_IDS.EVENTS_BY_DATE,
			TABLE_IDS.EVENTS,
			eventsTable,
			primary,
			eventSchema,
		);

		const primaryMeasurements = getRowsInRange<GrowthMeasurement>(
			INDEX_IDS.GROWTH_MEASUREMENTS_BY_DATE,
			TABLE_IDS.GROWTH_MEASUREMENTS,
			growthMeasurementsTable,
			primary,
			growthMeasurementSchema,
		);

		return {
			primaryDiaperChanges,
			primaryEvents,
			primaryMeasurements,
			primarySessions,
			secondaryDiaperChanges,
			secondarySessions,
		};
	}, [
		indexes,
		primary,
		secondary,
		diaperChangesTable,
		feedingSessionsTable,
		eventsTable,
		growthMeasurementsTable,
	]);
}
