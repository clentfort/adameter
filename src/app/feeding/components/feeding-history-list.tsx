import type { FeedingSession } from '@/types/feeding';
import { format, isSameDay } from 'date-fns';
import { useState } from 'react';
import DeleteEntryDialog from '@/components/delete-entry-dialog';
import { HistoryEntryCard } from '@/components/history-entry-card';
import IndexedHistoryList from '@/components/indexed-history-list';
import { useFeedingSession } from '@/hooks/use-feeding-sessions';
import { useFeedingSessionsByDate } from '@/hooks/use-tinybase-indexes';
import { cn } from '@/lib/utils';
import { formatDurationAbbreviated } from '@/utils/format-duration-abbreviated';
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
	const textColor = isLeftBreast
		? 'text-left-breast-dark'
		: 'text-right-breast-dark';
	const startDate = new Date(session.startTime);
	const endDate = new Date(session.endTime);
	const crossesMidnight = !isSameDay(startDate, endDate);

	return (
		<HistoryEntryCard
			className={cn(
				isLeftBreast
					? 'border-left-breast/30 bg-left-breast/5'
					: 'border-right-breast/30 bg-right-breast/5',
			)}
			data-testid="feeding-history-entry"
			formattedTime={format(new Date(session.startTime), 'p')}
			onDelete={() => onDelete(session.id)}
			onEdit={() => onEdit(session.id)}
			rightContent={
				<p className="font-bold">
					{formatDurationAbbreviated(session.durationInSeconds)}
				</p>
			}
			title={
				<p className={`font-medium ${textColor}`}>
					{isLeftBreast ? (
						<fbt desc="Label indicating a feeding was done with the left breast">
							Left Breast
						</fbt>
					) : (
						<fbt desc="Label indicating a feeding was done with the right breast">
							Right Breast
						</fbt>
					)}
				</p>
			}
			variant="feeding"
		>
			{crossesMidnight && (
				<p className="text-xs text-muted-foreground">
					<span className="font-medium">
						<fbt desc="Label for a note">Note</fbt>:
					</span>{' '}
					<fbt desc="A note describing that the feeding session crosses midnight">
						This session crosses midnight
					</fbt>
				</p>
			)}
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

	return (
		<>
			<IndexedHistoryList
				dateKeys={dateKeys}
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
