import type { DateRange } from '@/utils/get-range-dates';
import { isWithinInterval } from 'date-fns';

export function filterByRange<T>(
	items: readonly T[],
	range: DateRange | undefined,
	getTimestamp: (item: T) => number | string | Date,
): T[] {
	if (!range) {
		return [];
	}

	return items.filter((item) =>
		isWithinInterval(new Date(getTimestamp(item)), {
			end: range.to,
			start: range.from,
		}),
	);
}
