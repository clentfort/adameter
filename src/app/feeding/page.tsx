'use client';

import { useState } from 'react';
import HistoryHeader from '@/components/history-header';
import { useUpsertFeedingSession } from '@/hooks/use-feeding-sessions';
import { useHistoryRangeParams } from '@/hooks/use-history-range';
import FeedingForm from './components/feeding-form';
import FeedingHistoryList from './components/feeding-history-list';
import BreastfeedingTracker from './components/feeding-tracker';
import { useNextBreast } from './hooks/use-next-breast';
import { useResumableSession } from './hooks/use-resumable-session';

export default function Feedings() {
	const [isAddEntryDialogOpen, setIsAddEntryDialogOpen] = useState(false);
	const upsertFeedingSession = useUpsertFeedingSession();
	const nextBreast = useNextBreast();
	const resumableSession = useResumableSession();
	const { from, setRange, to } = useHistoryRangeParams('/feeding');

	return (
		<>
			<div className="w-full">
				<BreastfeedingTracker
					nextBreast={nextBreast}
					onSaveSession={upsertFeedingSession}
					resumableSession={resumableSession}
				/>

				<div className="w-full mt-8">
					<HistoryHeader
						from={from}
						onAddEntry={() => setIsAddEntryDialogOpen(true)}
						onRangeChange={setRange}
						title={
							<fbt desc="Descedingly ordered history of events (i.e. diaper changes or feeding sessions)">
								History
							</fbt>
						}
						to={to}
					/>
					<FeedingHistoryList />
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
