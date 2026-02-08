import { format, parseISO } from 'date-fns';
import { useMemo } from 'react';
import { logPerformanceEvent } from '@/lib/performance-logging';

// Make the hook generic for any item type T that has an id
interface ItemWithId {
	id: string;
}

function getDateKey(timestamp: string) {
	if (timestamp.length >= 10 && timestamp[4] === '-' && timestamp[7] === '-') {
		return timestamp.slice(0, 10);
	}

	const parsedDate = parseISO(timestamp);
	if (Number.isNaN(parsedDate.getTime())) {
		return timestamp;
	}

	return format(parsedDate, 'yyyy-MM-dd');
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
				{ throttleKey: 'ui.history.group-and-sort:empty', throttleMs: 10_000 },
			);
			return {};
		}

		const preparedItems = items.map((item) => {
			const timestamp = dateAccessor(item);
			const sortKey = Date.parse(timestamp);

			return {
				dateKey: getDateKey(timestamp),
				item,
				sortKey: Number.isNaN(sortKey) ? undefined : sortKey,
				timestamp,
			};
		});

		preparedItems.sort((a, b) => {
			if (a.sortKey !== undefined && b.sortKey !== undefined) {
				return b.sortKey - a.sortKey;
			}

			if (a.sortKey !== undefined) {
				return -1;
			}

			if (b.sortKey !== undefined) {
				return 1;
			}

			if (a.timestamp < b.timestamp) {
				return 1;
			}

			if (a.timestamp > b.timestamp) {
				return -1;
			}

			return 0;
		});

		const result: Record<string, T[]> = {};
		for (const preparedItem of preparedItems) {
			const existingItems = result[preparedItem.dateKey] ?? [];
			existingItems.push(preparedItem.item);
			result[preparedItem.dateKey] = existingItems;
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
