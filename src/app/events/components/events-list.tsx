import { format } from 'date-fns';
import { ArrowRight, Calendar } from 'lucide-react';
import { useState } from 'react';
import DeleteEntryDialog from '@/components/delete-entry-dialog';
import HistoryEntryCard from '@/components/history-entry-card';
import IndexedHistoryList from '@/components/indexed-history-list';
import Markdown from '@/components/markdown';
import { useEvent, useRemoveEvent, useUpsertEvent } from '@/hooks/use-events';
import { useEventsByDate } from '@/hooks/use-tinybase-indexes';
import AddEventDialog from './event-form';

function EventListItem({
	eventId,
	onDelete,
	onEdit,
}: {
	eventId: string;
	onDelete: (id: string) => void;
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
			formattedTime={
				event.type === 'period' ? (
					<div className="flex items-center gap-1">
						<Calendar className="h-3 w-3" />
						<span>
							{format(startDate, 'dd.MM.yyyy')}
							{endDate && (
								<>
									<ArrowRight className="h-2 w-2 inline mx-1" />
									{format(endDate, 'dd.MM.yyyy')}
								</>
							)}
							{isOngoing && (
								<span className="ml-1 text-[10px]">
									<fbt desc="Label on an event that is still ongoing">
										ongoing
									</fbt>
								</span>
							)}
						</span>
					</div>
				) : null
			}
			header={event.title}
			onDelete={() => onDelete(event.id)}
			onEdit={() => onEdit(event.id)}
			style={{
				borderLeftColor: event.color || '#6366f1',
				borderLeftWidth: '4px',
			}}
		>
			{event.notes && (
				<Markdown className="text-sm text-muted-foreground">
					{event.notes}
				</Markdown>
			)}
		</HistoryEntryCard>
	);
}

export default function EventsList() {
	const [eventToDelete, setEventToDelete] = useState<string | null>(null);
	const [eventToEditId, setEventToEditId] = useState<string | null>(null);
	const removeEvent = useRemoveEvent();
	const upsertEvent = useUpsertEvent();
	const { dateKeys, indexes, indexId } = useEventsByDate();
	const eventToEdit = useEvent(eventToEditId ?? undefined);

	return (
		<>
			<IndexedHistoryList
				dateKeys={dateKeys}
				indexes={indexes}
				indexId={indexId}
			>
				{(eventId) => (
					<EventListItem
						eventId={eventId}
						key={eventId}
						onDelete={setEventToDelete}
						onEdit={setEventToEditId}
					/>
				)}
			</IndexedHistoryList>
			{eventToDelete && (
				<DeleteEntryDialog
					entry={eventToDelete}
					onClose={() => setEventToDelete(null)}
					onDelete={(id) => {
						removeEvent(id);
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
