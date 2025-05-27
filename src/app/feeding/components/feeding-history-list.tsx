import type { FeedingSession } from '@/types/feeding';
import {
	format,
	intervalToDuration,
	isSameDay,
} from 'date-fns';
import { useState } from 'react';
import { formatDurationLocale } from '../../../../utils/format-duration-locale';
import DeleteEntryDialog from '@/components/delete-entry-dialog';
import HistoryListInternal from '@/components/history-list';
import DeleteIconButton from '@/components/icon-buttons/delete';
import EditIconButton from '@/components/icon-buttons/edit';
import FeedingForm from './feeding-form';

interface HistoryListProps {
	onSessionDelete: (sessionId: string) => void;
	onSessionUpdate: (session: FeedingSession) => void;
	sessions: ReadonlyArray<FeedingSession>;
}

export default function HistoryList({
	onSessionDelete,
	onSessionUpdate,
	sessions = [],
}: HistoryListProps) {
	const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
	const [sessionToEdit, setSessionToEdit] = useState<FeedingSession | null>(
		null,
	);

	return (
		<>
			<HistoryListInternal
				entries={sessions}
				keySelector={(session) => session.startTime}
			>
				{(session) => {
					const isLeftBreast = session.breast === 'left';
					const borderColor = isLeftBreast
						? 'border-left-breast/30'
						: 'border-right-breast/30';
					const bgColor = isLeftBreast
						? 'bg-left-breast/5'
						: 'bg-right-breast/5';
					const textColor = isLeftBreast
						? 'text-left-breast-dark'
						: 'text-right-breast-dark';

					// Check if session crosses midnight
					const startDate = new Date(session.startTime);
					const endDate = new Date(session.endTime);
					const crossesMidnight = !isSameDay(startDate, endDate);

					return (
						<div
							className={`border rounded-lg p-4 shadow-xs ${borderColor} ${bgColor}`}
							key={session.id}
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
										{formatDurationLocale(
											intervalToDuration({
												start: new Date(session.startTime),
												end: new Date(session.endTime),
											}),
										)}
									</p>
									<p className="text-xs text-muted-foreground">
										<fbt desc="Label indicating when a feeding session started">
											Start
										</fbt>
										: {format(new Date(session.startTime), 'p')}
									</p>
									<div className="flex gap-1 mt-2">
										<EditIconButton onClick={() => setSessionToEdit(session)} />
										<DeleteIconButton
											onClick={() => setSessionToDelete(session.id)}
										/>
									</div>
								</div>
							</div>
						</div>
					);
				}}
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
					onClose={() => setSessionToEdit(null)}
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
