import { differenceInDays } from 'date-fns';

export function getDaySpan(timestamps: (string | number | Date)[]): number {
	if (timestamps.length === 0) return 0;
	const times = timestamps.map((t) => new Date(t).getTime());
	const oldest = new Date(Math.min(...times));
	const newest = new Date(Math.max(...times));
	return Math.max(1, differenceInDays(newest, oldest) + 1);
}
