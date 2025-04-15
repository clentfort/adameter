'use client';

import type { FeedingSession } from '@/types/feeding';
import { PlusCircle } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAppState } from '@/hooks/use-app-state';
import FeedingForm from './components/feeding-form';
import HistoryList from './components/feeding-history-list';
import BreastfeedingTracker from './components/feeding-tracker';

function getNextBreat(sessions: ReadonlyArray<FeedingSession>) {
	if (sessions.length === 0) {
		return 'left'; // Default to left if no feedings exist
	}
	const lastFeeding = sessions[0];
	return lastFeeding.breast === 'left' ? 'right' : 'left';
}

export default function Feedings() {
	const [isAddEntryDialogOpen, setIsAddEntryDialogOpen] = useState(false);
	const { deleteSession, saveSession, sessions, updateSession } = useAppState();

	const nextBreast = getNextBreat(sessions);

	return (
		<>
			<div className="w-full">
				<BreastfeedingTracker
					nextBreast={nextBreast}
					onSessionComplete={saveSession}
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
						onSessionDelete={deleteSession}
						onSessionUpdate={updateSession}
						sessions={sessions}
					/>
				</div>
			</div>

			{isAddEntryDialogOpen && (
				<FeedingForm
					onClose={() => setIsAddEntryDialogOpen(false)}
					onSave={(change) => {
						saveSession(change);
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
