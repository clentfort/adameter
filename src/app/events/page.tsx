'use client';

import { Share2 } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import HistoryHeader from '@/components/history-header';
import { Button } from '@/components/ui/button';
import { useUpsertEvent } from '@/hooks/use-events';
import EventForm from './components/event-form';
import EventsList from './components/events-list';

export default function EventsPage() {
	const upsertEvent = useUpsertEvent();
	const [isAddEntryDialogOpen, setIsAddEntryDialogOpen] = useState(false);
	return (
		<>
			<div className="w-full">
				<div className="flex items-center justify-between mb-4">
					<HistoryHeader
						onAddEntry={() => setIsAddEntryDialogOpen(true)}
						title={<fbt desc="Title of the events page">Events</fbt>}
					/>
					<Link href="/timeline">
						<Button size="sm" variant="ghost">
							<Share2 className="h-4 w-4 mr-2" />
							<fbt desc="Link to timeline export page">Export Timeline</fbt>
						</Button>
					</Link>
				</div>

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
