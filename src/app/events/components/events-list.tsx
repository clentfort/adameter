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
import type { Event } from '@/types/event';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { ArrowRight, Calendar, Clock, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import AddEventDialog from './add-event-dialog';

interface EventsListProps {
	events: Event[];
	onEventDelete: (eventId: string) => void;
	onEventUpdate: (event: Event) => void;
}

export default function EventsList({
	events = [],
	onEventDelete,
	onEventUpdate,
}: EventsListProps) {
	const [eventToDelete, setEventToDelete] = useState<string | null>(null);
	const [eventToEdit, setEventToEdit] = useState<Event | null>(null);

	// Ensure events is an array
	const eventsArray = Array.isArray(events)
		? Array.isArray(events)
			? events
			: []
		: [];

	if (eventsArray.length === 0) {
		return (
            <p className="text-muted-foreground text-center py-4">
                <fbt desc="noEventsRecorded">No events recorded yet.</fbt>
            </p>
        );
	}

	const handleDeleteConfirm = () => {
		if (eventToDelete) {
			onEventDelete(eventToDelete);
			setEventToDelete(null);
		}
	};

	// Sort events by start date (newest first)
	const sortedEvents = [...eventsArray].sort(
		(a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
	);

	return (
        <>
            <div className="space-y-4">
				{sortedEvents.map((event) => {
					const startDate = new Date(event.startDate);
					const endDate = event.endDate ? new Date(event.endDate) : null;
					const isOngoing = event.type === 'period' && !event.endDate;

					return (
                        <div
							className="border rounded-lg p-4 shadow-sm"
							key={event.id}
							style={{
								borderLeftColor: event.color || '#6366f1',
								borderLeftWidth: '4px',
							}}
						>
                            <div className="flex justify-between items-start">
								<div>
									<p className="font-medium text-lg">{event.title}</p>
									{event.description && (
										<p className="text-sm text-muted-foreground mt-1">
											{event.description}
										</p>
									)}
									<div className="flex items-center gap-1 mt-2 text-sm text-muted-foreground">
										<Calendar className="h-4 w-4" />
										<span>
											{format(startDate, 'dd.MM.yyyy', { locale: de })}
											{event.type === 'period' && endDate && (
												<>
													<ArrowRight className="h-3 w-3 inline mx-1" />
													{format(endDate, 'dd.MM.yyyy', { locale: de })}
												</>
											)}
											{isOngoing && (
												<span className="ml-1 text-xs"><fbt desc="ongoing">ongoing</fbt></span>
											)}
										</span>
									</div>
									<div className="flex items-center gap-1 text-sm text-muted-foreground">
										<Clock className="h-4 w-4" />
										<span>
											{format(startDate, 'HH:mm', { locale: de })}
											{event.type === 'period' && endDate && (
												<>
													<ArrowRight className="h-3 w-3 inline mx-1" />
													{format(endDate, 'HH:mm', { locale: de })}
												</>
											)}
										</span>
									</div>
								</div>
								<div className="flex gap-1">
									<Button
										className="h-7 w-7"
										onClick={() => setEventToEdit(event)}
										size="icon"
										variant="ghost"
									>
										<Pencil className="h-4 w-4" />
										<span className="sr-only"><fbt desc="edit">Edit</fbt></span>
									</Button>
									<Button
										className="h-7 w-7 text-destructive"
										onClick={() => setEventToDelete(event.id)}
										size="icon"
										variant="ghost"
									>
										<Trash2 className="h-4 w-4" />
										<span className="sr-only"><fbt desc="delete">Delete</fbt></span>
									</Button>
								</div>
							</div>
                        </div>
                    );
				})}
			</div>
            <AlertDialog
				onOpenChange={(open) => !open && setEventToDelete(null)}
				open={!!eventToDelete}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle><fbt desc="deleteEvent">Delete Event</fbt></AlertDialogTitle>
						<AlertDialogDescription>
							<fbt desc="deleteEventConfirmation">Do you really want to delete this event? This action cannot be undone.</fbt>
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel><fbt desc="cancel">Cancel</fbt></AlertDialogCancel>
						<AlertDialogAction onClick={handleDeleteConfirm}>
							<fbt desc="delete">Delete</fbt>
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
            {eventToEdit && (
				<AddEventDialog
					event={eventToEdit}
					onClose={() => setEventToEdit(null)}
					onSave={onEventUpdate}
				/>
			)}
        </>
    );
}
