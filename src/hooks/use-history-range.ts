import {
	addDays,
	endOfDay,
	format,
	parseISO,
	startOfDay,
	subDays,
} from 'date-fns';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';

interface UseHistoryRangeOptions {
	baseUrl: string;
	dateKeys: string[];
}

export function getDefaultHistoryRange(): { from: Date; to: Date } {
	const end = endOfDay(new Date());
	const start = startOfDay(subDays(end, 6));
	return { from: start, to: end };
}

export function useHistoryRangeParams(baseUrl: string) {
	const searchParams = useSearchParams();
	const router = useRouter();
	const from = searchParams.get('from');
	const to = searchParams.get('to');

	const setRange = useCallback(
		(newFrom: string, newTo: string) => {
			const params = new URLSearchParams(searchParams.toString());
			params.set('from', newFrom);
			params.set('to', newTo);
			router.replace(`${baseUrl}?${params.toString()}`, { scroll: false });
		},
		[baseUrl, router, searchParams],
	);

	return {
		from,
		setRange,
		to,
	};
}

export function useHistoryRange({ baseUrl, dateKeys }: UseHistoryRangeOptions) {
	const searchParams = useSearchParams();
	const { from, setRange, to } = useHistoryRangeParams(baseUrl);
	const eventTitle = searchParams.get('event');
	const eventColor = searchParams.get('color');

	const effectiveRange = useMemo(() => {
		if (from && to) {
			return {
				from: startOfDay(parseISO(from)),
				to: endOfDay(parseISO(to)),
			};
		}

		return getDefaultHistoryRange();
	}, [from, to]);

	const filteredDateKeys = useMemo(() => {
		if (!from && !to) return dateKeys;
		return dateKeys.filter((dateKey) => {
			const date = parseISO(dateKey);
			return date >= effectiveRange.from && date <= effectiveRange.to;
		});
	}, [dateKeys, effectiveRange, from, to]);

	const hasMoreNewerInStore = useMemo(() => {
		if ((!from && !to) || dateKeys.length === 0) return false;
		return parseISO(dateKeys[0]) > effectiveRange.to;
	}, [dateKeys, effectiveRange.to, from, to]);

	const hasMoreOlderInStore = useMemo(() => {
		if ((!from && !to) || dateKeys.length === 0) return false;
		return parseISO(dateKeys.at(-1)!) < effectiveRange.from;
	}, [dateKeys, effectiveRange.from, from, to]);

	const updateRange = useCallback(
		(newFrom: Date, newTo: Date) => {
			setRange(newFrom.toISOString(), newTo.toISOString());
		},
		[setRange],
	);

	const nextTo = useMemo(
		() => addDays(effectiveRange.to, 7),
		[effectiveRange.to],
	);

	const nextFrom = useMemo(
		() => subDays(effectiveRange.from, 7),
		[effectiveRange.from],
	);

	const handleLoadMoreNewer = useCallback(() => {
		updateRange(effectiveRange.from, nextTo);
	}, [effectiveRange.from, nextTo, updateRange]);

	const handleLoadMoreOlder = useCallback(() => {
		updateRange(nextFrom, effectiveRange.to);
	}, [effectiveRange.to, nextFrom, updateRange]);

	const newerRangeDescription = useMemo(() => {
		if (!hasMoreNewerInStore) return undefined;
		const start = addDays(effectiveRange.to, 1);
		return `${format(start, 'MMM d')} - ${format(nextTo, 'MMM d')}`;
	}, [hasMoreNewerInStore, effectiveRange.to, nextTo]);

	const olderRangeDescription = useMemo(() => {
		if (!hasMoreOlderInStore) return undefined;
		const end = subDays(effectiveRange.from, 1);
		return `${format(nextFrom, 'MMM d')} - ${format(end, 'MMM d')}`;
	}, [hasMoreOlderInStore, effectiveRange.from, nextFrom]);

	const indexedHistoryListProps = {
		dateKeys: filteredDateKeys,
		hasMoreNewerInStore,
		hasMoreOlderInStore,
		initialVisibleCount: from || to ? filteredDateKeys.length : undefined,
		newerRangeDescription,
		olderRangeDescription,
		onLoadMoreNewer: from || to ? handleLoadMoreNewer : undefined,
		onLoadMoreOlder: from || to ? handleLoadMoreOlder : undefined,
	};

	const historyFilterIndicatorProps = {
		baseUrl,
		color: eventColor,
		eventTitle,
		from: effectiveRange.from.toISOString(),
		isVisible: !!(from || to),
		to: effectiveRange.to.toISOString(),
	};

	return {
		historyFilterIndicatorProps,
		indexedHistoryListProps,
	};
}
