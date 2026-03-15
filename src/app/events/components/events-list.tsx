import type { DiaperChange } from '@/types/diaper';
import type { FeedingSession } from '@/types/feeding';
import { format } from 'date-fns';
import { ArrowRight, Calendar } from 'lucide-react';
import { useState } from 'react';
import DeleteEntryDialog from '@/components/delete-entry-dialog';
import HistoryEntryCard from '@/components/history-entry-card';
import IndexedHistoryList from '@/components/indexed-history-list';
import Markdown from '@/components/markdown';
import { useDiaperChangesSnapshot } from '@/hooks/use-diaper-changes';
import { useEvent, useRemoveEvent, useUpsertEvent } from '@/hooks/use-events';
import { useFeedingSessionsSnapshot } from '@/hooks/use-feeding-sessions';
import { useEventsByDate } from '@/hooks/use-tinybase-indexes';
import AddEventDialog from './event-form';
import RelatedActivity from './related-activity';

function EventListItem({
	diaperChanges,
	eventId,
	feedingSessions,
	onDelete,
	onEdit,
}: {
	diaperChanges: DiaperChange[];
	eventId: string;
	feedingSessions: FeedingSession[];
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
			<RelatedActivity
				diaperChanges={diaperChanges}
				event={event}
				feedingSessions={feedingSessions}
			/>
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

	const diaperChanges = useDiaperChangesSnapshot();
	const feedingSessions = useFeedingSessionsSnapshot();

	return (
		<>
			<IndexedHistoryList
				dateKeys={dateKeys}
				indexes={indexes}
				indexId={indexId}
			>
				{(eventId) => (
					<EventListItem
						diaperChanges={diaperChanges}
						eventId={eventId}
						feedingSessions={feedingSessions}
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
