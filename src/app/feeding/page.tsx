'use client';

import { PlusCircle } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
	useRemoveFeedingSession,
	useSortedFeedingSessionListEntries,
	useUpsertFeedingSession,
} from '@/hooks/use-feeding-sessions';
import FeedingForm from './components/feeding-form';
import HistoryList from './components/feeding-history-list';
import BreastfeedingTracker from './components/feeding-tracker';
import { useNextBreast } from './hooks/use-next-breast';
import { useResumableSession } from './hooks/use-resumable-session';

export default function Feedings() {
	const [isAddEntryDialogOpen, setIsAddEntryDialogOpen] = useState(false);
	const upsertFeedingSession = useUpsertFeedingSession();
	const removeFeedingSession = useRemoveFeedingSession();
	const sessionEntries = useSortedFeedingSessionListEntries();
	const nextBreast = useNextBreast();
	const resumableSession = useResumableSession();

	return (
		<>
			<div className="w-full">
				<BreastfeedingTracker
					nextBreast={nextBreast}
					onCreateSession={upsertFeedingSession}
					onUpdateSession={upsertFeedingSession}
					resumableSession={resumableSession}
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
						onSessionDelete={removeFeedingSession}
						onSessionUpdate={upsertFeedingSession}
						sessionEntries={sessionEntries}
					/>
				</div>
			</div>

			{isAddEntryDialogOpen && (
				<FeedingForm
					onClose={() => setIsAddEntryDialogOpen(false)}
					onSave={(change) => {
						upsertFeedingSession(change);
						setIsAddEntryDialogOpen(false);
					}}
					title={
						<fbt desc="Title of the dialog to manually add a previous feeding session">
							Add Feeding Entry
						</fbt>
					}
				/>
			)}
		</>
	);
}
