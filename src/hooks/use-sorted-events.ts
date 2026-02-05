import groupBy from '@nkzw/core/groupBy';
import { format, parseISO } from 'date-fns';
import { useMemo } from 'react';
import { logPerformanceEvent } from '@/lib/performance-logging';

// Make the hook generic for any item type T that has an id
interface ItemWithId {
	id: string;
}

export function useSortedEvents<T extends ItemWithId>(
	items: ReadonlyArray<T>,
	dateAccessor: (item: T) => string, // Function to get the date string from an item
) {
	return useMemo(() => {
		if (!items || items.length === 0) {
			logPerformanceEvent(
				'ui.history.group-and-sort',
				{
					metadata: {
						groupCount: 0,
						itemCount: 0,
					},
				},
				{ throttleKey: 'ui.history.group-and-sort:empty', throttleMs: 10_000 },
			);
			return {};
		}

		// Sort all items by date initially, using the dateAccessor
		const sortedItems = [...items].sort(
			(a, b) =>
				parseISO(dateAccessor(b)).getTime() -
				parseISO(dateAccessor(a)).getTime(),
		);

		// Group items by date string, using the dateAccessor
		const groupedByDate = groupBy(sortedItems, (item) =>
			format(parseISO(dateAccessor(item)), 'yyyy-MM-dd'),
		);

		// Convert Map to object
		const result: Record<string, T[]> = {};
		for (const [date, itemArray] of groupedByDate.entries()) {
			result[date] = itemArray;
		}

		if (items.length >= 200) {
			logPerformanceEvent(
				'ui.history.group-and-sort',
				{
					metadata: {
						groupCount: Object.keys(result).length,
						itemCount: items.length,
					},
				},
				{ throttleKey: 'ui.history.group-and-sort:heavy', throttleMs: 3000 },
			);
		}
		return result;
	}, [items, dateAccessor]);
}
