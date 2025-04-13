'use client';

import { useAppState } from '@/hooks/use-app-state';
import { FeedingSession } from '@/types/feeding';
import AddHistoricSession from './components/add-historic-session';
import BreastfeedingTracker from './components/breastfeeding-tracker';
import HistoryList from './components/history-list';

function getNextBreat(sessions: readonly FeedingSession[]) {
	if (sessions.length === 0) {
		return 'left'; // Default to left if no feedings exist
	}
	const lastFeeding = sessions[0];
	return lastFeeding.breast === 'left' ? 'right' : 'left';
}

export default function Feedings() {
	const { deleteSession, saveSession, sessions, updateSession } = useAppState();

	const nextBreast = getNextBreat(sessions);

	return (
		<div className="w-full">
			<BreastfeedingTracker
				nextBreast={nextBreast}
				onSessionComplete={saveSession}
			/>

			<div className="w-full mt-8">
				<div className="flex justify-between items-center mb-4">
					<h2 className="text-xl font-semibold">
						<fbt desc="History of feeding sessions">History</fbt>
					</h2>
					<AddHistoricSession onSessionAdd={saveSession} />
				</div>
				<HistoryList
					onSessionDelete={deleteSession}
					onSessionUpdate={updateSession}
					sessions={sessions}
				/>
			</div>
		</div>
	);
}
