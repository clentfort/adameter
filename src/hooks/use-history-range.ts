import {
	addDays,
	endOfDay,
	format,
	parseISO,
	startOfDay,
	subDays,
} from 'date-fns';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo } from 'react';

interface UseHistoryRangeOptions {
	baseUrl: string;
	dateKeys: string[];
}

export function useHistoryRange({ baseUrl, dateKeys }: UseHistoryRangeOptions) {
	const searchParams = useSearchParams();
	const router = useRouter();
	const from = searchParams.get('from');
	const to = searchParams.get('to');

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
		return dateKeys.filter((dateKey) => {
			const date = parseISO(dateKey);
			return date >= effectiveRange.from && date <= effectiveRange.to;
		});
	}, [dateKeys, effectiveRange]);

	const hasMoreNewerInStore = useMemo(() => {
		if (dateKeys.length === 0) return false;
		return parseISO(dateKeys[0]) > effectiveRange.to;
	}, [dateKeys, effectiveRange.to]);

	const hasMoreOlderInStore = useMemo(() => {
		if (dateKeys.length === 0) return false;
		return parseISO(dateKeys.at(-1)!) < effectiveRange.from;
	}, [dateKeys, effectiveRange.from]);

	const updateRange = useCallback(
		(newFrom: Date, newTo: Date) => {
			const params = new URLSearchParams(searchParams.toString());
			params.set('from', newFrom.toISOString());
			params.set('to', newTo.toISOString());
			router.replace(`${baseUrl}?${params.toString()}`, { scroll: false });
		},
		[baseUrl, router, searchParams],
	);

	// Sync default range to URL if missing
	useEffect(() => {
		if (!from || !to) {
			updateRange(effectiveRange.from, effectiveRange.to);
		}
	}, [from, to, effectiveRange.from, effectiveRange.to, updateRange]);

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

	return {
		effectiveRange,
		filteredDateKeys,
		handleLoadMoreNewer,
		handleLoadMoreOlder,
		hasMoreNewerInStore,
		hasMoreOlderInStore,
		newerRangeDescription,
		olderRangeDescription,
		updateRange,
	};
}
