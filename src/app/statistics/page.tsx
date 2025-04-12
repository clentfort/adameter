'use client';

import StatisticsView from '@/components/statistics-view';
import { useAppState } from '@/hooks/use-app-state';

export default function StatisticsPage() {
	const {
		addDiaperChange,
		addEvent,
		addMeasurement,
		deleteDiaperChange,
		deleteEvent,
		deleteMeasurement,
		deleteSession,
		diaperChanges,
		events,
		measurements,
		nextBreast,
		saveSession,
		sessions,
		updateDiaperChange,
		updateEvent,
		updateMeasurement,
		updateSession,
	} = useAppState();
	return (
		<div className="w-full" value="statistics">
			<StatisticsView
				diaperChanges={diaperChanges}
				events={events}
				measurements={measurements}
				sessions={sessions}
			/>
		</div>
	);
}
