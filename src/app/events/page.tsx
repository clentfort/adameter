'use client';

import AddEventDialog from '@/components/add-event-dialog';
import EventsList from '@/components/events-list';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppState } from '@/hooks/use-app-state';

export default function EventsPage() {
	const { addEvent, deleteEvent, events, updateEvent } = useAppState();
	return (
		<div className="w-full">
			<div className="space-y-6">
				<div className="flex justify-between items-center">
					<h2 className="text-xl font-semibold">
						<fbt desc="events">Events</fbt>
					</h2>
					<AddEventDialog onSave={addEvent} />
				</div>
				<Card>
					<CardHeader className="p-4 pb-2">
						<CardTitle className="text-base">
							<fbt desc="allEvents">All Events</fbt>
						</CardTitle>
					</CardHeader>
					<CardContent className="p-4 pt-0">
						<EventsList
							events={events}
							onEventDelete={deleteEvent}
							onEventUpdate={updateEvent}
						/>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
