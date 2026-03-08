import { format } from 'date-fns';
import { ArrowRight, Calendar, Clock } from 'lucide-react';
import { useState } from 'react';
import DeleteEntryDialog from '@/components/delete-entry-dialog';
import { HistoryEntryCard } from '@/components/history-entry-card';
import Markdown from '@/components/markdown';
import {
	useEvent,
	useRemoveEvent,
	useSortedEventIds,
	useUpsertEvent,
} from '@/hooks/use-events';
import AddEventDialog from './event-form';

function EventListItem({
	eventId,
	onDelete,
	onEdit,
}: {
	eventId: string;
	onDelete: (eventId: string) => void;
	onEdit: (eventId: string) => void;
}) {
	const event = useEvent(eventId);

	if (!event) {
		return null;
	}

	const startDate = new Date(event.startDate);
	const endDate = event.endDate ? new Date(event.endDate) : null;
	const isOngoing = event.type === 'period' && !event.endDate;

	return (
		<HistoryEntryCard
			data-testid="event-entry"
			onDelete={() => onDelete(event.id)}
			onEdit={() => onEdit(event.id)}
			style={{
				borderLeftColor: event.color || '#6366f1',
				borderLeftWidth: '4px',
			}}
			title={event.title}
			variant="event"
		>
			<div>
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
		</HistoryEntryCard>
	);
}

export default function EventsList() {
	const [eventToDelete, setEventToDelete] = useState<string | null>(null);
	const [eventToEditId, setEventToEditId] = useState<string | null>(null);
	const removeEvent = useRemoveEvent();
	const upsertEvent = useUpsertEvent();
	const sortedEventIds = useSortedEventIds();
	const eventToEdit = useEvent(eventToEditId ?? undefined);

	if (sortedEventIds.length === 0) {
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
				{sortedEventIds.map((eventId) => (
					<EventListItem
						eventId={eventId}
						key={eventId}
						onDelete={setEventToDelete}
						onEdit={setEventToEditId}
					/>
				))}
			</div>
			{eventToDelete && (
				<DeleteEntryDialog
					entry={eventToDelete}
					onClose={() => setEventToDelete(null)}
					onDelete={(event) => {
						removeEvent(event);
						setEventToDelete(null);
					}}
				/>
			)}
			{eventToEdit && (
				<AddEventDialog
					event={eventToEdit}
					onClose={() => setEventToEditId(null)}
					onSave={(event) => {
						upsertEvent(event);
						setEventToEditId(null);
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
