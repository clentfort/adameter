import { addDays, differenceInDays, startOfDay, endOfDay, subDays } from 'date-fns';

export type TimeRange = '7' | '14' | '30' | 'all' | 'custom';

export interface DateRange {
	from: Date;
	to: Date;
}

export function getRangeDates(
	timeRange: TimeRange,
	customRange?: { from: string; to: string },
): { primary: DateRange; secondary?: DateRange } {
	const now = new Date();
	let primary: DateRange;
	let secondary: DateRange | undefined;

	if (timeRange === 'all') {
		primary = {
			from: new Date(0), // Beginning of time
			to: now,
		};
		return { primary };
	}

	if (timeRange === 'custom' && customRange) {
		primary = {
			from: startOfDay(new Date(customRange.from)),
			to: endOfDay(new Date(customRange.to)),
		};
		const daysDiff = differenceInDays(primary.to, primary.from) + 1;
		secondary = {
			from: subDays(primary.from, daysDiff),
			to: subDays(primary.to, daysDiff),
		};
	} else {
		const daysToLookBack = Number.parseInt(timeRange as string);
		primary = {
			from: startOfDay(subDays(now, daysToLookBack - 1)),
			to: endOfDay(now),
		};
		secondary = {
			from: subDays(primary.from, daysToLookBack),
			to: subDays(primary.to, daysToLookBack),
		};
	}

	return { primary, secondary };
}
