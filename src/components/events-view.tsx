'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import EventsList from './events-list';
import AddEventDialog from './add-event-dialog';
import type { Event } from '@/types/event';
import { useTranslate } from '@/utils/translate';

interface EventsViewProps {
	events: Event[];
	onEventAdd: (event: Event) => void;
	onEventUpdate: (event: Event) => void;
	onEventDelete: (eventId: string) => void;
}

export default function EventsView({
	events = [],
	onEventAdd,
	onEventUpdate,
	onEventDelete,
}: EventsViewProps) {
	// Ensure events is an array
	const eventsArray = Array.isArray(events) ? events : [];
	const t = useTranslate();

	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<h2 className="text-xl font-semibold">{t('events')}</h2>
				<AddEventDialog onSave={onEventAdd} />
			</div>

			<Card>
				<CardHeader className="p-4 pb-2">
					<CardTitle className="text-base">{t('allEvents')}</CardTitle>
				</CardHeader>
				<CardContent className="p-4 pt-0">
					<EventsList
						events={eventsArray}
						onEventUpdate={onEventUpdate}
						onEventDelete={onEventDelete}
					/>
				</CardContent>
			</Card>
		</div>
	);
}
