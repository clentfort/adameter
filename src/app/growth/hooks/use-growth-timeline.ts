import { useMemo } from 'react';
import { useStore, useTable } from 'tinybase/ui-react';
import { INDEX_IDS } from '@/contexts/tinybase-indexes-context';
import {
	useDateSliceRowIds,
	useGrowthMeasurementsByDate,
	useTeethByDate,
} from '@/hooks/use-tinybase-indexes';
import { TABLE_IDS } from '@/lib/tinybase-sync/constants';

export function useGrowthTimelineDateKeys(): string[] {
	const { dateKeys: growthDateKeys } = useGrowthMeasurementsByDate();
	const { dateKeys: teethDateKeys } = useTeethByDate();

	return useMemo(() => {
		const keys = new Set([...growthDateKeys, ...teethDateKeys]);
		return Array.from(keys)
			.filter((k) => k !== '')
			.sort((a, b) => b.localeCompare(a));
	}, [growthDateKeys, teethDateKeys]);
}

export function useGrowthTimelineItems(
	dateKey: string,
): Array<{ id: string; type: 'growth' | 'teething' }> {
	const growthRowIds = useDateSliceRowIds(
		INDEX_IDS.GROWTH_MEASUREMENTS_BY_DATE,
		dateKey,
	);
	const teethRowIds = useDateSliceRowIds(INDEX_IDS.TEETH_BY_DATE, dateKey);
	const store = useStore();
	const growthTable = useTable(TABLE_IDS.GROWTH_MEASUREMENTS, store);
	const teethTable = useTable(TABLE_IDS.TEETHING, store);

	return useMemo(() => {
		const items = [
			...growthRowIds.map((id) => {
				const value = growthTable[id]?.date;
				const date = typeof value === 'string' ? value : undefined;
				return { date, id, type: 'growth' as const };
			}),
			...teethRowIds.map((id) => {
				const value = teethTable[id]?.date;
				const date = typeof value === 'string' ? value : undefined;
				return { date, id, type: 'teething' as const };
			}),
		];

		items.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

		return items.map(({ id, type }) => ({ id, type }));
	}, [growthRowIds, teethRowIds, growthTable, teethTable]);
}
