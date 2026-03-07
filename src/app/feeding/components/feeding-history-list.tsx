import type { FeedingSession } from '@/types/feeding';
import { format, isSameDay } from 'date-fns';
import { useState } from 'react';
import DeleteEntryDialog from '@/components/delete-entry-dialog';
import HistoryListInternal from '@/components/history-list';
import DeleteIconButton from '@/components/icon-buttons/delete';
import EditIconButton from '@/components/icon-buttons/edit';
import { useFeedingSession } from '@/hooks/use-feeding-sessions';
import { formatDurationAbbreviated } from '@/utils/format-duration-abbreviated';
import FeedingForm from './feeding-form';

interface HistoryListProps {
	onSessionDelete: (sessionId: string) => void;
	onSessionUpdate: (session: FeedingSession) => void;
	sessionEntries: ReadonlyArray<{ id: string; startTime: string }>;
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
		<div
			className={`border rounded-lg p-4 shadow-xs ${borderColor} ${bgColor}`}
			data-testid="feeding-history-entry"
		>
			<div className="flex justify-between items-start">
				<div>
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
				</div>
				<div className="text-right flex flex-col items-end">
					<p className="font-bold">
						{formatDurationAbbreviated(session.durationInSeconds)}
					</p>
					<p className="text-xs text-muted-foreground">
						<fbt desc="Label indicating when a feeding session started">
							Start
						</fbt>
						: {format(new Date(session.startTime), 'p')}
					</p>
					<div className="flex gap-1 mt-2">
						<EditIconButton onClick={() => onEdit(session.id)} />
						<DeleteIconButton onClick={() => onDelete(session.id)} />
					</div>
				</div>
			</div>
		</div>
	);
}

export default function HistoryList({
	onSessionDelete,
	onSessionUpdate,
	sessionEntries = [],
}: HistoryListProps) {
	const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
	const [sessionToEditId, setSessionToEditId] = useState<string | null>(null);
	const sessionToEdit = useFeedingSession(sessionToEditId ?? undefined);

	return (
		<>
			<HistoryListInternal
				dateAccessor={(sessionEntry) => sessionEntry.startTime}
				entries={sessionEntries}
			>
				{(sessionEntry) => (
					<FeedingHistoryEntry
						key={sessionEntry.id}
						onDelete={setSessionToDelete}
						onEdit={setSessionToEditId}
						sessionId={sessionEntry.id}
					/>
				)}
			</HistoryListInternal>
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
