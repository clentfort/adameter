'use client';

import AddHistoricSession from '@/components/add-historic-session';
import BreastfeedingTracker from '@/components/breastfeeding-tracker';
import HistoryList from '@/components/history-list';
import { useAppState } from '@/hooks/use-app-state';

export default function Feedings() {
	const { deleteSession, nextBreast, saveSession, sessions, updateSession } =
		useAppState();
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
