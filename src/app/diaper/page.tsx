'use client';

import AddHistoricDiaper from '@/components/add-historic-diaper';
import DiaperHistoryList from '@/components/diaper-history-list';
import DiaperTracker from '@/components/diaper-tracker';
import { useAppState } from '@/hooks/use-app-state';

export default function DiaperPage() {
	const {
		addDiaperChange,
		deleteDiaperChange,
		diaperChanges,
		updateDiaperChange,
	} = useAppState();

	return (
		<div className="w-full">
			<div className="w-full">
				<DiaperTracker
					diaperChanges={diaperChanges}
					onDiaperChange={addDiaperChange}
				/>

				<div className="w-full mt-8">
					<div className="flex justify-between items-center mb-4">
						<h2 className="text-xl font-semibold">Verlauf</h2>
						<AddHistoricDiaper
							diaperChanges={diaperChanges}
							onDiaperAdd={addDiaperChange}
						/>
					</div>
					<DiaperHistoryList
						changes={diaperChanges}
						onDiaperDelete={deleteDiaperChange}
						onDiaperUpdate={updateDiaperChange}
					/>
				</div>
			</div>
		</div>
	);
}
