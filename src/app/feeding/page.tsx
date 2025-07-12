'use client';

import { PlusCircle } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useFeedingSessions } from '@/hooks/use-feeding-sessions';
import { useLatestFeedingSession } from '@/hooks/use-latest-feeding-session';
import { useNextBreast } from '@/hooks/use-next-breast';
import FeedingForm from './components/feeding-form';
import HistoryList from './components/feeding-history-list';
import BreastfeedingTracker from './components/feeding-tracker';

export default function Feedings() {
	const [isAddEntryDialogOpen, setIsAddEntryDialogOpen] = useState(false);
	const { add, remove, update, value: sessions } = useFeedingSessions();
	const nextBreast = useNextBreast();
	const latestFeedingSession = useLatestFeedingSession();

	return (
		<>
			<div className="w-full">
				<BreastfeedingTracker
					latestFeedingSession={latestFeedingSession}
					nextBreast={nextBreast}
					onCreateSession={add}
					onUpdateSession={update}
				/>

				<div className="w-full mt-8">
					<div className="flex justify-between items-center mb-4">
						<h2 className="text-xl font-semibold">
							<fbt desc="Descedingly ordered history of events (i.e. diaper changes or feeding sessions)">
								History
							</fbt>
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
					<HistoryList
						onSessionDelete={remove}
						onSessionUpdate={update}
						sessions={sessions}
					/>
				</div>
			</div>

			{isAddEntryDialogOpen && (
				<FeedingForm
					onClose={() => setIsAddEntryDialogOpen(false)}
					onSave={(change) => {
						add(change);
						setIsAddEntryDialogOpen(false);
					}}
					title={
						<fbt desc="Title of the dialog to manually add a previous feeding session">
							Add Feeding
						</fbt>
					}
				/>
			)}
		</>
	);
}
