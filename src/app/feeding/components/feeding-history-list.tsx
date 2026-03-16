import type { FeedingSession } from '@/types/feeding';
import {
	addDays,
	endOfDay,
	format,
	isSameDay,
	parseISO,
	startOfDay,
	subDays,
} from 'date-fns';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';
import DeleteEntryDialog from '@/components/delete-entry-dialog';
import HistoryEntryCard from '@/components/history-entry-card';
import HistoryFilterIndicator from '@/components/history-filter-indicator';
import IndexedHistoryList from '@/components/indexed-history-list';
import { useFeedingSession } from '@/hooks/use-feeding-sessions';
import { useFeedingSessionsByDate } from '@/hooks/use-tinybase-indexes';
import { formatDurationAbbreviated } from '@/utils/format-duration-abbreviated';
import { formatEntryTime } from '@/utils/format-history-date';
import FeedingForm from './feeding-form';

interface HistoryListProps {
	onSessionDelete: (sessionId: string) => void;
	onSessionUpdate: (session: FeedingSession) => void;
}

function FeedingHistoryEntry({
	onDelete,
	onEdit,
	sessionId,
}: {
	onDelete: (sessionId: string) => void;
	onEdit: (sessionId: string) => void;
	sessionId: string;
}) {
	const session = useFeedingSession(sessionId);

	if (!session) {
		return null;
	}

	const isLeftBreast = session.breast === 'left';
	const borderColor = isLeftBreast
		? 'border-left-breast/30'
		: 'border-right-breast/30';
	const bgColor = isLeftBreast ? 'bg-left-breast/5' : 'bg-right-breast/5';
	const textColor = isLeftBreast
		? 'text-left-breast-dark'
		: 'text-right-breast-dark';
	const startDate = new Date(session.startTime);
	const endDate = new Date(session.endTime);
	const crossesMidnight = !isSameDay(startDate, endDate);

	return (
		<HistoryEntryCard
			className={`${borderColor} ${bgColor}`}
			data-testid="feeding-history-entry"
			formattedTime={
				<div className="flex items-center gap-2">
					<span>{formatEntryTime(session.startTime)}</span>
					<span className="mx-1">•</span>
					<div className="flex items-center gap-0.5">
						<span>⏳</span>
						<span>{formatDurationAbbreviated(session.durationInSeconds)}</span>
					</div>
				</div>
			}
			header={
				<span className={textColor}>
					{isLeftBreast ? (
						<fbt desc="Label indicating a feeding was done with the left breast">
							Left Breast
						</fbt>
					) : (
						<fbt desc="Label indicating a feeding was done with the right breast">
							Right Breast
						</fbt>
					)}
				</span>
			}
			onDelete={() => onDelete(session.id)}
			onEdit={() => onEdit(session.id)}
		>
			<div className="space-y-1">
				{session.notes && (
					<p className="text-sm text-muted-foreground whitespace-pre-wrap">
						{session.notes}
					</p>
				)}
				{crossesMidnight && (
					<p className="text-xs text-muted-foreground italic">
						<fbt desc="A note describing that the feeding session crosses midnight">
							This session crosses midnight
						</fbt>
					</p>
				)}
			</div>
		</HistoryEntryCard>
	);
}

export default function HistoryList({
	onSessionDelete,
	onSessionUpdate,
}: HistoryListProps) {
	const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
	const [sessionToEditId, setSessionToEditId] = useState<string | null>(null);
	const sessionToEdit = useFeedingSession(sessionToEditId ?? undefined);
	const { dateKeys, indexes, indexId } = useFeedingSessionsByDate();

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
			router.push(`/feeding?${params.toString()}`);
		},
		[router, searchParams],
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

	return (
		<>
			{(from || to) && (
				<HistoryFilterIndicator
					baseUrl="/feeding"
					color={eventColor}
					eventTitle={eventTitle}
					from={effectiveRange.from.toISOString()}
					to={effectiveRange.to.toISOString()}
				/>
			)}

			<IndexedHistoryList
				dateKeys={filteredDateKeys}
				hasMoreNewerInStore={hasMoreNewerInStore}
				hasMoreOlderInStore={hasMoreOlderInStore}
				indexes={indexes}
				indexId={indexId}
				newerRangeDescription={newerRangeDescription}
				olderRangeDescription={olderRangeDescription}
				onLoadMoreNewer={handleLoadMoreNewer}
				onLoadMoreOlder={handleLoadMoreOlder}
			>
				{(sessionId) => (
					<FeedingHistoryEntry
						key={sessionId}
						onDelete={setSessionToDelete}
						onEdit={setSessionToEditId}
						sessionId={sessionId}
					/>
				)}
			</IndexedHistoryList>
			{sessionToDelete && (
				<DeleteEntryDialog
					entry={sessionToDelete}
					onClose={() => setSessionToDelete(null)}
					onDelete={onSessionDelete}
				/>
			)}
			{sessionToEdit && (
				<FeedingForm
					feeding={sessionToEdit}
					onClose={() => setSessionToEditId(null)}
					onSave={onSessionUpdate}
					title={
						<fbt desc="Title of a dialog that allows the user to edit a feeding session">
							Edit Feeding Session
						</fbt>
					}
				/>
			)}
		</>
	);
}
