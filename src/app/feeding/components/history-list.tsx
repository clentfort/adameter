'use client';

import { Button } from '@/components/ui/button';
import type { FeedingSession } from '@/types/feeding';
import {
	format,
	formatDuration,
	intervalToDuration,
	isSameDay,
} from 'date-fns';
import { Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import DeleteSessionDialog from './delete-session-dialog';
import EditSessionDialog from './edit-session-dialog';

interface HistoryListProps {
	onSessionDelete: (sessionId: string) => void;
	onSessionUpdate: (session: FeedingSession) => void;
	sessions: readonly FeedingSession[];
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

	if (sessions.length === 0) {
		return (
			<p className="text-muted-foreground text-center py-4">
				<fbt desc="Note that tells the user that no feedings have been recorded yet">
					No feeding sessions recorded yet.
				</fbt>
			</p>
		);
	}

	// Group sessions by date
	const groupedSessions: { [date: string]: FeedingSession[] } = {};

	sessions.forEach((session) => {
		const date = format(new Date(session.startTime), 'yyyy-MM-dd');
		if (!groupedSessions[date]) {
			groupedSessions[date] = [];
		}
		groupedSessions[date].push(session);
	});

	return (
		<>
			<div className="space-y-4">
				{Object.entries(groupedSessions).map(([date, dateSessions]) => (
					<div className="space-y-2" key={date}>
						<div className="bg-muted/50 px-4 py-2 rounded-md text-sm font-medium">
							{format(new Date(date), 'EEEE, d. MMMM yyyy')}
						</div>

						{dateSessions.map((session) => {
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
														<fbt desc="Label for an icon button that allows the user to edit a feeding session">
															Edit
														</fbt>
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
														<fbt desc="Label for an icon button that allows the user to delete a feeding session">
															Delete
														</fbt>
													</span>
												</Button>
											</div>
										</div>
									</div>
								</div>
							);
						})}
					</div>
				))}
			</div>
			{sessionToDelete && (
				<DeleteSessionDialog
					onClose={() => setSessionToDelete(null)}
					onDelete={onSessionDelete}
					session={sessionToDelete}
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
