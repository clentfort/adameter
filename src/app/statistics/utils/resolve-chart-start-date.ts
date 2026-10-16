export function resolveChartStartDate<T>(
	from: Date,
	items: readonly T[],
	getTimestamp: (item: T) => number | string | Date,
): Date {
	if (from.getTime() !== 0) {
		return from;
	}

	if (items.length > 0) {
		const firstTime = items.reduce(
			(min, item) => {
				const t = new Date(getTimestamp(item)).getTime();
				return t < min ? t : min;
			},
			new Date(getTimestamp(items[0])).getTime(),
		);
		return new Date(firstTime);
	}

	const fallback = new Date();
	fallback.setDate(fallback.getDate() - 30);
	return fallback;
}
