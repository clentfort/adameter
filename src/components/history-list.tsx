'use client';

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import type { FeedingSession } from '@/types/feeding';
import { format, isSameDay } from 'date-fns';
import { de } from 'date-fns/locale';
import { Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import EditSessionDialog from './edit-session-dialog';

interface HistoryListProps {
	onSessionDelete: (sessionId: string) => void;
	onSessionUpdate: (session: FeedingSession) => void;
	sessions: FeedingSession[];
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

	// Ensure sessions is an array
	const sessionsArray = Array.isArray(sessions) ? sessions : [];

	if (sessionsArray.length === 0) {
		return (
			<p className="text-muted-foreground text-center py-4">
				<fbt desc="noFeedingRecorded">No feeding sessions recorded yet.</fbt>
			</p>
		);
	}

	const formatDuration = (seconds: number) => {
		const minutes = Math.floor(seconds / 60);
		const remainingSeconds = seconds % 60;

		if (minutes === 0) {
			return `${remainingSeconds} Sek.`;
		} else if (remainingSeconds === 0) {
			return `${minutes} Min.`;
		} else {
			return `${minutes} Min. ${remainingSeconds} Sek.`;
		}
	};

	const handleDeleteConfirm = () => {
		if (sessionToDelete) {
			onSessionDelete(sessionToDelete);
			setSessionToDelete(null);
		}
	};

	// Group sessions by date
	const groupedSessions: { [date: string]: FeedingSession[] } = {};

	sessionsArray.forEach((session) => {
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
							{format(new Date(date), 'EEEE, d. MMMM yyyy', { locale: de })}
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
													<fbt desc="leftBreast">Left Breast</fbt>
												) : (
													<fbt desc="rightBreast">Right Breast</fbt>
												)}
											</p>
											{crossesMidnight && (
												<p className="text-xs text-muted-foreground">
													<span className="font-medium">
														<fbt desc="note">Note</fbt>:
													</span>{' '}
													<fbt desc="sessionCrossesMidnight">
														This session crosses midnight
													</fbt>
												</p>
											)}
										</div>
										<div className="text-right flex flex-col items-end">
											<p className="font-bold">
												{formatDuration(session.durationInSeconds)}
											</p>
											<p className="text-xs text-muted-foreground">
												<fbt desc="start">Start</fbt>:{' '}
												{format(new Date(session.startTime), 'HH:mm', {
													locale: de,
												})}{' '}
												Uhr
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
														<fbt desc="edit">Edit</fbt>
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
														<fbt desc="delete">Delete</fbt>
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
			<AlertDialog
				onOpenChange={(open) => !open && setSessionToDelete(null)}
				open={!!sessionToDelete}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>
							<fbt desc="deleteEntry">Delete Entry</fbt>
						</AlertDialogTitle>
						<AlertDialogDescription>
							<fbt desc="deleteConfirmation">
								Do you really want to delete this entry? This action cannot be
								undone.
							</fbt>
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>
							<fbt desc="cancel">Cancel</fbt>
						</AlertDialogCancel>
						<AlertDialogAction onClick={handleDeleteConfirm}>
							<fbt desc="delete">Delete</fbt>
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
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
