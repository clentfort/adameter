import type { FeedingSession } from '@/types/feeding';
import { endOfDay, isSameDay, parseISO, startOfDay } from 'date-fns';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import DeleteEntryDialog from '@/components/delete-entry-dialog';
import HistoryEntryCard from '@/components/history-entry-card';
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

	const filteredDateKeys = useMemo(() => {
		if (!from || !to) return dateKeys;

		const fromDate = startOfDay(parseISO(from));
		const toDate = endOfDay(parseISO(to));

		return dateKeys.filter((dateKey) => {
			const date = parseISO(dateKey);
			return date >= fromDate && date <= toDate;
		});
	}, [dateKeys, from, to]);

	const hasNewerEntries = useMemo(() => {
		if ((!from && !to) || filteredDateKeys.length === 0 || dateKeys.length === 0)
			return false;
		return dateKeys[0] > filteredDateKeys[0];
	}, [dateKeys, filteredDateKeys, from, to]);

	return (
		<>
			{hasNewerEntries && (
				<div className="flex justify-center mb-4">
					<button
						className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
						onClick={() => router.push('/feeding')}
						type="button"
					>
						<fbt desc="Button to show newer entries after filtering">
							Show newer entries
						</fbt>
					</button>
				</div>
			)}
			<IndexedHistoryList
				dateKeys={filteredDateKeys}
				indexes={indexes}
				indexId={indexId}
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
