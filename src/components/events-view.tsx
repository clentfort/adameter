'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Event } from '@/types/event';
import AddEventDialog from './add-event-dialog';
import EventsList from './events-list';

interface EventsViewProps {
	events: Event[];
	onEventAdd: (event: Event) => void;
	onEventDelete: (eventId: string) => void;
	onEventUpdate: (event: Event) => void;
}

export default function EventsView({
	events = [],
	onEventAdd,
	onEventDelete,
	onEventUpdate,
}: EventsViewProps) {
	// Ensure events is an array
	const eventsArray = Array.isArray(events) ? events : [];

	return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
				<h2 className="text-xl font-semibold"><fbt desc="events">Events</fbt></h2>
				<AddEventDialog onSave={onEventAdd} />
			</div>
            <Card>
				<CardHeader className="p-4 pb-2">
					<CardTitle className="text-base"><fbt desc="allEvents">All Events</fbt></CardTitle>
				</CardHeader>
				<CardContent className="p-4 pt-0">
					<EventsList
						events={eventsArray}
						onEventDelete={onEventDelete}
						onEventUpdate={onEventUpdate}
					/>
				</CardContent>
			</Card>
        </div>
    );
}
