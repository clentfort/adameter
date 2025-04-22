'use client';

import { PlusCircle } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useEvents } from '@/hooks/use-events';
import EventForm from './components/event-form';
import EventsList from './components/events-list';

export default function EventsPage() {
	const { add } = useEvents();
	const [isAddEntryDialogOpen, setIsAddEntryDialogOpen] = useState(false);
	return (
		<>
			<div className="w-full">
				<div className="flex justify-between items-center mb-4">
					<h2 className="text-xl font-semibold">
						<fbt desc="Title of the events page">Events</fbt>
					</h2>
					<Button
						onClick={() => setIsAddEntryDialogOpen(true)}
						size="sm"
						variant="outline"
					>
						<PlusCircle className="h-4 w-4 mr-1" />
						<fbt common>Add Entry</fbt>
					</Button>
				</div>

				<EventsList />
			</div>

			{isAddEntryDialogOpen && (
				<EventForm
					onClose={() => setIsAddEntryDialogOpen(false)}
					onSave={(event) => {
						add(event);
						setIsAddEntryDialogOpen(false);
					}}
					title={
						<fbt desc="Title of the dialog to add a measurement">
							Add Measurement
						</fbt>
					}
				/>
			)}
		</>
	);
}
