'use client';

import { useState } from 'react';
import HistoryHeader from '@/components/history-header';
import { useUpsertEvent } from '@/hooks/use-events';
import EventForm from './components/event-form';
import EventsList from './components/events-list';

export default function EventsPage() {
	const upsertEvent = useUpsertEvent();
	const [isAddEntryDialogOpen, setIsAddEntryDialogOpen] = useState(false);
	return (
		<>
			<div className="w-full">
				<HistoryHeader
					onAddEntry={() => setIsAddEntryDialogOpen(true)}
					title={<fbt desc="Title of the events page">Events</fbt>}
				/>

				<EventsList />
			</div>

			{isAddEntryDialogOpen && (
				<EventForm
					onClose={() => setIsAddEntryDialogOpen(false)}
					onSave={(event) => {
						upsertEvent(event);
						setIsAddEntryDialogOpen(false);
					}}
					title={
						<fbt desc="Title of the dialog to add an event">
							Add Event Entry
						</fbt>
					}
				/>
			)}
		</>
	);
}
