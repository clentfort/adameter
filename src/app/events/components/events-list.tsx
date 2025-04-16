import type { Event } from '@/types/event';
import { format } from 'date-fns';
import { ArrowRight, Calendar, Clock } from 'lucide-react';
import { useState } from 'react';
import DeleteEntryDialog from '@/components/delete-entry-dialog';
import DeleteIconButton from '@/components/icon-buttons/delete';
import EditIconButton from '@/components/icon-buttons/edit';
import AddEventDialog from './event-form';

interface EventsListProps {
	events: ReadonlyArray<Event>;
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
				<fbt desc="Info message that no event data has been recorded yet">
					No events recorded yet.
				</fbt>
			</p>
		);
	}

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
											{format(startDate, 'dd.MM.yyyy')}
											{event.type === 'period' && endDate && (
												<>
													<ArrowRight className="h-3 w-3 inline mx-1" />
													{format(endDate, 'dd.MM.yyyy')}
												</>
											)}
											{isOngoing && (
												<span className="ml-1 text-xs">
													<fbt desc="Label on an event that is still ongoing">
														ongoing
													</fbt>
												</span>
											)}
										</span>
									</div>
									<div className="flex items-center gap-1 text-sm text-muted-foreground">
										<Clock className="h-4 w-4" />
										<span>
											{format(startDate, 'HH:mm')}
											{event.type === 'period' && endDate && (
												<>
													<ArrowRight className="h-3 w-3 inline mx-1" />
													{format(endDate, 'HH:mm')}
												</>
											)}
										</span>
									</div>
								</div>
								<div className="flex gap-1">
									<EditIconButton onClick={() => setEventToEdit(event)} />
									<DeleteIconButton
										onClick={() => setEventToDelete(event.id)}
									/>
								</div>
							</div>
						</div>
					);
				})}
			</div>
			{eventToDelete && (
				<DeleteEntryDialog
					entry={eventToDelete}
					onClose={() => setEventToDelete(null)}
					onDelete={onEventDelete}
				/>
			)}
			{eventToEdit && (
				<AddEventDialog
					event={eventToEdit}
					onClose={() => setEventToEdit(null)}
					onSave={onEventUpdate}
					title={
						<fbt desc="Title of the dialog to edit a measurement">Edit Measurement</fbt>
					}
				/>
			)}
		</>
	);
}
