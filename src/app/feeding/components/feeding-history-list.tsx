import type { FeedingSession } from '@/types/feeding';
import { format, isSameDay } from 'date-fns';
import { useState } from 'react';
import DeleteEntryDialog from '@/components/delete-entry-dialog';
import HistoryListInternal from '@/components/history-list';
import DeleteIconButton from '@/components/icon-buttons/delete';
import EditIconButton from '@/components/icon-buttons/edit';
import { formatDurationAbbreviated } from '@/utils/format-duration-abbreviated';
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

	const getSessionName = (session: FeedingSession) => {
		switch (session.source) {
			case 'left':
				return <fbt desc="Left breast">Left Breast</fbt>;
			case 'right':
				return <fbt desc="Right breast">Right Breast</fbt>;
			case 'bottle':
				return <fbt desc="Bottle">Bottle</fbt>;
			case 'pump':
				return <fbt desc="Pump">Pump</fbt>;
		}
	};

	return (
		<>
			<HistoryListInternal
				dateAccessor={(session) => session.startTime}
				entries={sessions}
			>
				{(session) => {
					const isLeftBreast = session.source === 'left';
					const isBottle = session.source === 'bottle';
					const isPump = session.source === 'pump';

					const borderColor = isBottle
						? 'border-yellow-200'
						: isPump
							? 'border-gray-200'
							: isLeftBreast
								? 'border-left-breast/30'
								: 'border-right-breast/30';
					const bgColor = isBottle
						? 'bg-yellow-50'
						: isPump
							? 'bg-gray-50'
							: isLeftBreast
								? 'bg-left-breast/5'
								: 'bg-right-breast/5';
					const textColor = isBottle
						? 'text-yellow-800'
						: isPump
							? 'text-gray-800'
							: isLeftBreast
								? 'text-left-breast-dark'
								: 'text-right-breast-dark';

					const crossesMidnight = !isSameDay(
						new Date(session.startTime),
						new Date(session.endTime),
					);

					return (
						<div
							className={`border rounded-lg p-4 shadow-xs ${borderColor} ${bgColor}`}
							key={session.id}
						>
							<div className="flex justify-between items-start">
								<div>
									<p className={`font-medium ${textColor}`}>
										{getSessionName(session)}
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
										{session.amountInMl ? (
											<fbt desc="Amount of milk in ml">
												<fbt:param name="amount">
													{session.amountInMl}
												</fbt:param>{' '}
												ml
											</fbt>
										) : (
											formatDurationAbbreviated(session.durationInSeconds ?? 0)
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
