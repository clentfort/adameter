'use client';

import GrowthView from '@/components/growth-view';
import { useAppState } from '@/hooks/use-app-state';

export default function GrowthPage() {
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
		<div className="w-full" value="growth">
			<GrowthView
				events={events}
				measurements={measurements}
				onMeasurementAdd={addMeasurement}
				onMeasurementDelete={deleteMeasurement}
				onMeasurementUpdate={updateMeasurement}
			/>
		</div>
	);
}
