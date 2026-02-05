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
		const start =
			typeof performance !== 'undefined' ? performance.now() : Date.now();

		if (!items || items.length === 0) {
			const durationMs =
				(typeof performance !== 'undefined' ? performance.now() : Date.now()) -
				start;
			logPerformanceEvent(
				'ui.history.group-and-sort',
				{
					durationMs,
					metadata: {
						groupCount: 0,
						itemCount: 0,
					},
				},
				{ throttleKey: 'ui.history.group-and-sort:empty', throttleMs: 10000 },
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

		const durationMs =
			(typeof performance !== 'undefined' ? performance.now() : Date.now()) -
			start;
		if (items.length >= 200 || durationMs >= 8) {
			logPerformanceEvent(
				'ui.history.group-and-sort',
				{
					durationMs,
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
