'use client';

import DiaperView from '@/components/diaper-view';
import { useAppState } from '@/hooks/use-app-state';

export default function DiaperPage() {
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
		<div className="w-full" value="diaper">
			<DiaperView
				diaperChanges={diaperChanges}
				onDiaperAdd={addDiaperChange}
				onDiaperDelete={deleteDiaperChange}
				onDiaperUpdate={updateDiaperChange}
			/>
		</div>
	);
}
