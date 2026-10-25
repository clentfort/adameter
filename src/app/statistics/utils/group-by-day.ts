import { format, isValid, parseISO } from 'date-fns';

export interface GroupByDayOptions {
	excludeDayKey?: string;
}

export function getDayKey(timestamp: unknown): string | undefined {
	if (typeof timestamp !== 'string') {
		return undefined;
	}

	const parsedTimestamp = parseISO(timestamp);
	if (!isValid(parsedTimestamp)) {
		return undefined;
	}

	return format(parsedTimestamp, 'yyyy-MM-dd');
}

export function groupByDay<T, A>(
	items: readonly T[],
	getTimestamp: (item: T) => unknown,
	init: () => A,
	add: (accumulator: A, item: T) => A,
	options?: GroupByDayOptions,
): Map<string, A> {
	const result = new Map<string, A>();
	const excludeDayKey = options?.excludeDayKey;

	for (const item of items) {
		const dayKey = getDayKey(getTimestamp(item));
		if (!dayKey || dayKey === excludeDayKey) {
			continue;
		}

		const current = result.get(dayKey) ?? init();
		result.set(dayKey, add(current, item));
	}

	return result;
}

export function maxEntry(
	entries: Iterable<readonly [string, number]>,
): [string, number] | null;
export function maxEntry<T>(
	entries: Iterable<readonly [string, T]>,
	getValue: (val: T) => number,
): [string, T] | null;
export function maxEntry<T>(
	entries: Iterable<readonly [string, T]>,
	getValue?: (val: T) => number,
): [string, T] | null {
	let max: [string, T] | null = null;
	let maxVal = -Infinity;

	for (const entry of entries) {
		const val = getValue ? getValue(entry[1]) : Number(entry[1]);
		if (max === null || val > maxVal) {
			max = [entry[0], entry[1]];
			maxVal = val;
		}
	}

	return max;
}

export function minEntry(
	entries: Iterable<readonly [string, number]>,
): [string, number] | null;
export function minEntry<T>(
	entries: Iterable<readonly [string, T]>,
	getValue: (val: T) => number,
): [string, T] | null;
export function minEntry<T>(
	entries: Iterable<readonly [string, T]>,
	getValue?: (val: T) => number,
): [string, T] | null {
	let min: [string, T] | null = null;
	let minVal = Infinity;

	for (const entry of entries) {
		const val = getValue ? getValue(entry[1]) : Number(entry[1]);
		if (min === null || val < minVal) {
			min = [entry[0], entry[1]];
			minVal = val;
		}
	}

	return min;
}
