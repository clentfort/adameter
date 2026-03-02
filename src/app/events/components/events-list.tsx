import type { Event } from '@/types/event';
import { format } from 'date-fns';
import { ArrowRight, Calendar, Clock } from 'lucide-react';
import { useState } from 'react';
import { useRowIds } from 'tinybase/ui-react';
import DeleteEntryDialog from '@/components/delete-entry-dialog';
import DeleteIconButton from '@/components/icon-buttons/delete';
import EditIconButton from '@/components/icon-buttons/edit';
import Markdown from '@/components/markdown';
import { useEventRow, useEvents } from '@/hooks/use-events';
import { TABLE_IDS } from '@/lib/tinybase-sync/constants';
import AddEventDialog from './event-form';

export default function EventsList() {
	const [eventToDelete, setEventToDelete] = useState<string | null>(null);
	const [eventToEdit, setEventToEdit] = useState<Event | null>(null);

	const { remove, update } = useEvents();
	const rowIds = useRowIds(TABLE_IDS.EVENTS);

	if (rowIds.length === 0) {
		return (
			<p className="text-muted-foreground text-center py-4">
				<fbt desc="Info message that no event data has been recorded yet">
					No events recorded yet.
				</fbt>
			</p>
		);
	}

	return (
		<>
			<div className="space-y-4">
				{rowIds.map((id) => (
					<EventEntry
						eventId={id}
						key={id}
						onDelete={setEventToDelete}
						onEdit={setEventToEdit}
					/>
				))}
			</div>
			{eventToDelete && (
				<DeleteEntryDialog
					entry={eventToDelete}
					onClose={() => setEventToDelete(null)}
					onDelete={(event) => {
						remove(event);
						setEventToDelete(null);
					}}
				/>
			)}
			{eventToEdit && (
				<AddEventDialog
					event={eventToEdit}
					onClose={() => setEventToEdit(null)}
					onSave={(event) => {
						update(event);
						setEventToEdit(null);
					}}
					title={
						<fbt desc="Title of the dialog to edit an event">
							Edit Event Entry
						</fbt>
					}
				/>
			)}
		</>
	);
}

interface EventEntryProps {
	eventId: string;
	onDelete: (id: string) => void;
	onEdit: (event: Event) => void;
}

function EventEntry({ eventId, onDelete, onEdit }: EventEntryProps) {
	const event = useEventRow(eventId);

	const startDate = new Date(event.startDate);
	const endDate = event.endDate ? new Date(event.endDate) : null;
	const isOngoing = event.type === 'period' && !event.endDate;

	return (
		<div
			className="border rounded-lg p-4 shadow-xs"
			data-testid="event-entry"
			style={{
				borderLeftColor: event.color || '#6366f1',
				borderLeftWidth: '4px',
			}}
		>
			<div className="flex justify-between items-start">
				<div>
					<p className="font-medium text-lg">{event.title}</p>
					{event.description && (
						<Markdown className="text-sm text-muted-foreground mt-1">
							{event.description}
						</Markdown>
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
					<EditIconButton onClick={() => onEdit(event)} />
					<DeleteIconButton onClick={() => onDelete(event.id)} />
				</div>
			</div>
		</div>
	);
}
