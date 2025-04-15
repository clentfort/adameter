import type { FeedingSession } from '@/types/feeding';
import {
	format,
	formatDuration,
	intervalToDuration,
	isSameDay,
} from 'date-fns';
import { Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import DeleteEntryDialog from '@/components/delete-entry-dialog';
import HistoryListInternal from '@/components/history-list';
import { Button } from '@/components/ui/button';
import EditSessionDialog from './edit-session-dialog';

interface HistoryListProps {
	onSessionDelete: (sessionId: string) => void;
	onSessionUpdate: (session: FeedingSession) => void;
	sessions: ReadonlyArray<FeedingSession>;
}

function formatDurationInMinutes(start: string, end: string) {
	const startDate = new Date(start);
	const endDate = new Date(end);
	const duration = intervalToDuration({ end: endDate, start: startDate });
	duration.minutes = Math.max(duration.minutes ?? 0, 1);
	return formatDuration(duration, { format: ['minutes'] });
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
							className={`border rounded-lg p-4 shadow-sm ${borderColor} ${bgColor}`}
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
										{formatDurationInMinutes(
											session.startTime,
											session.endTime,
										)}
									</p>
									<p className="text-xs text-muted-foreground">
										<fbt desc="Label indicating when a feeding session started">
											Start
										</fbt>
										: {format(new Date(session.startTime), 'p')}
									</p>
									<div className="flex gap-1 mt-2">
										<Button
											className="h-7 w-7"
											onClick={() => setSessionToEdit(session)}
											size="icon"
											variant="ghost"
										>
											<Pencil className="h-4 w-4" />
											<span className="sr-only">
												<fbt common>Edit</fbt>
											</span>
										</Button>
										<Button
											className="h-7 w-7 text-destructive"
											onClick={() => setSessionToDelete(session.id)}
											size="icon"
											variant="ghost"
										>
											<Trash2 className="h-4 w-4" />
											<span className="sr-only">
												<fbt common>Delete</fbt>
											</span>
										</Button>
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
				<EditSessionDialog
					onClose={() => setSessionToEdit(null)}
					onUpdate={onSessionUpdate}
					session={sessionToEdit}
				/>
			)}
		</>
	);
}
