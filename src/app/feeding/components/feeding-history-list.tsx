import type { FeedingSession } from '@/types/feeding';
import { isSameDay } from 'date-fns';
import { useState } from 'react';
import DeleteEntryDialog from '@/components/delete-entry-dialog';
import HistoryEntryCard from '@/components/history-entry-card';
import HistoryFilterIndicator from '@/components/history-filter-indicator';
import IndexedHistoryList from '@/components/indexed-history-list';
import { BREAST_COLORS } from '@/constants/colors';
import { useFeedingSession } from '@/hooks/use-feeding-sessions';
import { useHistoryRange } from '@/hooks/use-history-range';
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
	const accentColor = isLeftBreast ? BREAST_COLORS.left : BREAST_COLORS.right;
	const startDate = new Date(session.startTime);
	const endDate = new Date(session.endTime);
	const crossesMidnight = !isSameDay(startDate, endDate);

	return (
		<HistoryEntryCard
			accentColor={accentColor}
			data-testid="feeding-history-entry"
			formattedTime={<span>{formatEntryTime(session.startTime)}</span>}
			header={
				<span>
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
			<div className="text-sm space-y-1">
				<div className="flex items-center gap-1">
					<span>⏳</span>
					<span className="font-medium">
						{formatDurationAbbreviated(session.durationInSeconds)}
					</span>
				</div>
				{session.notes && (
					<p className="text-muted-foreground whitespace-pre-wrap">
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

	const { historyFilterIndicatorProps, indexedHistoryListProps } =
		useHistoryRange({
			baseUrl: '/feeding',
			dateKeys,
		});

	return (
		<>
			<HistoryFilterIndicator {...historyFilterIndicatorProps} />

			<IndexedHistoryList
				{...indexedHistoryListProps}
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
