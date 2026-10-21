import { format } from 'date-fns';

export function bucketByDay<T, A>(
	items: readonly T[],
	days: Date[],
	getTimestamp: (item: T) => number | string | Date,
	init: () => A,
	add: (acc: A, item: T) => void,
): A[] {
	const dayIndexMap = new Map<string, number>();
	days.forEach((day, index) => {
		dayIndexMap.set(format(day, 'yyyy-MM-dd'), index);
	});

	const buckets: A[] = Array.from({ length: days.length }, () => init());

	items.forEach((item) => {
		const rawTimestamp = getTimestamp(item);
		const date = new Date(rawTimestamp);
		const key = format(date, 'yyyy-MM-dd');
		const index = dayIndexMap.get(key);
		if (index !== undefined) {
			add(buckets[index], item);
		}
	});

	return buckets;
}
