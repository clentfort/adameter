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

export function useHistoryRange({ baseUrl, dateKeys }: UseHistoryRangeOptions) {
	const searchParams = useSearchParams();
	const router = useRouter();
	const from = searchParams.get('from');
	const to = searchParams.get('to');
	const eventTitle = searchParams.get('event');
	const eventColor = searchParams.get('color');

	const effectiveRange = useMemo(() => {
		if (from && to) {
			return {
				from: startOfDay(parseISO(from)),
				to: endOfDay(parseISO(to)),
			};
		}

		// Default to last 7 days
		const end = endOfDay(new Date());
		const start = startOfDay(subDays(end, 6));
		return { from: start, to: end };
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
			const params = new URLSearchParams(searchParams.toString());
			params.set('from', newFrom.toISOString());
			params.set('to', newTo.toISOString());
			router.replace(`${baseUrl}?${params.toString()}`, { scroll: false });
		},
		[baseUrl, router, searchParams],
	);

	const handleLoadMoreNewer = () => {
		const nextTo = addDays(effectiveRange.to, 7);
		updateRange(effectiveRange.from, nextTo);
	};

	const handleLoadMoreOlder = () => {
		const nextFrom = subDays(effectiveRange.from, 7);
		updateRange(nextFrom, effectiveRange.to);
	};

	const newerRangeDescription = useMemo(() => {
		if (!hasMoreNewerInStore) return undefined;
		const nextTo = addDays(effectiveRange.to, 7);
		const start = addDays(effectiveRange.to, 1);
		return `${format(start, 'MMM d')} - ${format(nextTo, 'MMM d')}`;
	}, [hasMoreNewerInStore, effectiveRange.to]);

	const olderRangeDescription = useMemo(() => {
		if (!hasMoreOlderInStore) return undefined;
		const nextFrom = subDays(effectiveRange.from, 7);
		const end = subDays(effectiveRange.from, 1);
		return `${format(nextFrom, 'MMM d')} - ${format(end, 'MMM d')}`;
	}, [hasMoreOlderInStore, effectiveRange.from]);

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
		effectiveRange,
		filteredDateKeys,
		handleLoadMoreNewer,
		handleLoadMoreOlder,
		hasMoreNewerInStore,
		hasMoreOlderInStore,
		historyFilterIndicatorProps,
		indexedHistoryListProps,
		newerRangeDescription,
		olderRangeDescription,
		updateRange,
	};
}
