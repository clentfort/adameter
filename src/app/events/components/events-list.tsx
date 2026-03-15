import type { DiaperChange } from '@/types/diaper';
import type { FeedingSession } from '@/types/feeding';
import { format, isWithinInterval, parseISO } from 'date-fns';
import { ArrowRight, Calendar, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import DeleteEntryDialog from '@/components/delete-entry-dialog';
import HistoryEntryCard from '@/components/history-entry-card';
import IndexedHistoryList from '@/components/indexed-history-list';
import Markdown from '@/components/markdown';
import {
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu';
import { useDiaperChangesSnapshot } from '@/hooks/use-diaper-changes';
import { useEvent, useRemoveEvent, useUpsertEvent } from '@/hooks/use-events';
import { useFeedingSessionsSnapshot } from '@/hooks/use-feeding-sessions';
import { useEventsByDate } from '@/hooks/use-tinybase-indexes';
import { formatEntryTime } from '@/utils/format-history-date';
import AddEventDialog from './event-form';

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

	const relatedItems = useMemo(() => {
		if (!event || event.type !== 'period') {
			return [];
		}

		const start = parseISO(event.startDate);
		const interval = {
			end: event.endDate ? parseISO(event.endDate) : new Date(),
			start,
		};

		const filteredDiapers = diaperChanges
			.filter((change) =>
				isWithinInterval(parseISO(change.timestamp), interval),
			)
			.map((change) => ({
				data: change,
				timestamp: parseISO(change.timestamp),
				type: 'diaper' as const,
			}));

		const filteredFeedings = feedingSessions
			.filter((session) =>
				isWithinInterval(parseISO(session.startTime), interval),
			)
			.map((session) => ({
				data: session,
				timestamp: parseISO(session.startTime),
				type: 'feeding' as const,
			}));

		return [...filteredDiapers, ...filteredFeedings].sort(
			(a, b) => a.timestamp.getTime() - b.timestamp.getTime(),
		);
	}, [event, diaperChanges, feedingSessions]);

	if (!event) {
		return null;
	}

	const startDate = new Date(event.startDate);
	const endDate = event.endDate ? new Date(event.endDate) : null;
	const isOngoing = event.type === 'period' && !event.endDate;

	const extraActions = relatedItems.length > 0 && (
		<>
			<DropdownMenuSub>
				<DropdownMenuSubTrigger>
					<ExternalLink className="mr-2 h-4 w-4" />
					<fbt desc="Label for menu item to jump to related activity">
						Related Activity
						(<fbt:param name="count">{relatedItems.length}</fbt:param>)
					</fbt>
				</DropdownMenuSubTrigger>
				<DropdownMenuSubContent className="max-w-[250px]">
					{relatedItems.map((item) => {
						const label =
							item.type === 'feeding' ? (
								<div className="flex flex-col">
									<span className="font-medium">
										{item.data.breast === 'left' ? (
											<fbt desc="Left breast label">Left Breast</fbt>
										) : (
											<fbt desc="Right breast label">Right Breast</fbt>
										)}
									</span>
									<span className="text-[10px] text-muted-foreground">
										{formatEntryTime(item.timestamp.toISOString())}
									</span>
								</div>
							) : (
								<div className="flex flex-col">
									<span className="font-medium">
										{item.data.containsUrine && item.data.containsStool ? (
											<fbt desc="Urine & Stool label">Urine & Stool</fbt>
										) : item.data.containsUrine ? (
											<fbt desc="Urine label">Urine</fbt>
										) : item.data.containsStool ? (
											<fbt desc="Stool label">Stool</fbt>
										) : (
											<fbt desc="Dry label">Dry</fbt>
										)}
									</span>
									<span className="text-[10px] text-muted-foreground">
										{formatEntryTime(item.timestamp.toISOString())}
									</span>
								</div>
							);

						return (
							<DropdownMenuItem key={item.data.id}>
								<Link
									className="w-full"
									href={item.type === 'feeding' ? '/feeding' : '/diaper'}
								>
									{label}
								</Link>
							</DropdownMenuItem>
						);
					})}
				</DropdownMenuSubContent>
			</DropdownMenuSub>
			<DropdownMenuSeparator />
		</>
	);

	return (
		<HistoryEntryCard
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
