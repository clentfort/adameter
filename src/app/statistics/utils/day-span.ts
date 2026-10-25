import { differenceInDays } from 'date-fns';

/** Number of calendar days covered by the timestamps, inclusive; never less than 1. */
export function getDaySpan(
	timestamps: readonly (string | number | Date)[],
): number {
	if (timestamps.length === 0) return 1;
	const times = timestamps.map((t) => new Date(t).getTime());
	const oldest = new Date(Math.min(...times));
	const newest = new Date(Math.max(...times));
	return Math.max(1, differenceInDays(newest, oldest) + 1);
}
