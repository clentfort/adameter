'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import HistoryHeader from '@/components/history-header';
import {
	useRemoveFeedingSession,
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
	const nextBreast = useNextBreast();
	const resumableSession = useResumableSession();
	const router = useRouter();
	const searchParams = useSearchParams();

	const handleRangeChange = (from: string, to: string) => {
		const params = new URLSearchParams(searchParams.toString());
		params.set('from', from);
		params.set('to', to);
		router.replace(`/feeding?${params.toString()}`, { scroll: false });
	};

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
					<HistoryHeader
						from={searchParams.get('from')}
						onAddEntry={() => setIsAddEntryDialogOpen(true)}
						onRangeChange={handleRangeChange}
						title={
							<fbt desc="Descedingly ordered history of events (i.e. diaper changes or feeding sessions)">
								History
							</fbt>
						}
						to={searchParams.get('to')}
					/>
					<HistoryList
						onSessionDelete={removeFeedingSession}
						onSessionUpdate={upsertFeedingSession}
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
