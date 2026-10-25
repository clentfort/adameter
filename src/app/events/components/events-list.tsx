import type { Event } from '@/types/event';
import { format } from 'date-fns';
import { ArrowRight, Baby, Calendar, Milk } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import DeleteEntryDialog from '@/components/delete-entry-dialog';
import HistoryEntryCard from '@/components/history-entry-card';
import IndexedHistoryList from '@/components/indexed-history-list';
import Markdown from '@/components/markdown';
import {
	DropdownMenuItem,
	DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useEvent, useRemoveEvent, useUpsertEvent } from '@/hooks/use-events';
import { useEventsByDate } from '@/hooks/use-tinybase-indexes';
import AddEventDialog from './event-form';

function buildEventHistoryUrl(
	basePath: '/feeding' | '/diaper',
	event: Event,
): string {
	const params = new URLSearchParams();
	params.set('from', event.startDate);
	params.set('to', event.endDate || event.startDate);
	params.set('event', event.title);
	if (event.color) {
		params.set('color', event.color);
	}
	return `${basePath}?${params}`;
}

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
	const router = useRouter();

	if (!event) {
		return null;
	}

	const startDate = new Date(event.startDate);
	const endDate = event.endDate ? new Date(event.endDate) : null;
	const isOngoing = event.type === 'period' && !event.endDate;

	const extraActions = (
		<>
			<DropdownMenuItem
				onClick={() => router.push(buildEventHistoryUrl('/feeding', event))}
			>
				<Milk className="mr-2 h-4 w-4" />
				<fbt desc="Menu item to show feeding sessions during an event">
					Show Feeding Sessions
				</fbt>
			</DropdownMenuItem>
			<DropdownMenuItem
				onClick={() => router.push(buildEventHistoryUrl('/diaper', event))}
			>
				<Baby className="mr-2 h-4 w-4" />
				<fbt desc="Menu item to show diaper changes during an event">
					Show Diaper Changes
				</fbt>
			</DropdownMenuItem>
			<DropdownMenuSeparator />
		</>
	);

	return (
		<HistoryEntryCard
			accentColor={event.color || '#6366f1'}
			data-testid="event-entry"
			extraActions={extraActions}
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
			location={{
				latitude: event.locationLatitude,
				longitude: event.locationLongitude,
			}}
			onDelete={() => onDelete(event.id)}
			onEdit={() => onEdit(event.id)}
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
	const { dateKeys, indexId } = useEventsByDate();
	const eventToEdit = useEvent(eventToEditId ?? undefined);

	const searchParams = useSearchParams();
	const from = searchParams.get('from');
	const to = searchParams.get('to');

	return (
		<>
			<IndexedHistoryList
				dateKeys={dateKeys}
				indexId={indexId}
				initialVisibleCount={from || to ? dateKeys.length : undefined}
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
					onDelete={removeEvent}
				/>
			)}
			{eventToEdit && (
				<AddEventDialog
					event={eventToEdit}
					onClose={() => setEventToEditId(null)}
					onSave={upsertEvent}
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
