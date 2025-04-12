'use client';

import EventsView from '@/components/events-view';
import { useAppState } from '@/hooks/use-app-state';

export default function EventsPage() {
	const {
		addDiaperChange,
		addEvent,
		addMeasurement,
		deleteDiaperChange,
		deleteEvent,
		deleteMeasurement,
		deleteSession,
		diaperChanges,
		events,
		measurements,
		nextBreast,
		saveSession,
		sessions,
		updateDiaperChange,
		updateEvent,
		updateMeasurement,
		updateSession,
	} = useAppState();
	return (
		<div className="w-full" value="events">
			<EventsView
				events={events}
				onEventAdd={addEvent}
				onEventDelete={deleteEvent}
				onEventUpdate={updateEvent}
			/>
		</div>
	);
}
