'use client';

import type { DiaperChange } from '@/types/diaper';
import AddHistoricDiaper from './add-historic-diaper';
import DiaperHistoryList from './diaper-history-list';
import DiaperTracker from './diaper-tracker';

interface DiaperViewProps {
	diaperChanges: DiaperChange[];
	onDiaperAdd: (change: DiaperChange) => void;
	onDiaperDelete: (changeId: string) => void;
	onDiaperUpdate: (change: DiaperChange) => void;
}

export default function DiaperView({
	diaperChanges = [],
	onDiaperAdd,
	onDiaperDelete,
	onDiaperUpdate,
}: DiaperViewProps) {
	return (
		<div className="w-full">
			<DiaperTracker
				diaperChanges={diaperChanges}
				onDiaperChange={onDiaperAdd}
			/>

			<div className="w-full mt-8">
				<div className="flex justify-between items-center mb-4">
					<h2 className="text-xl font-semibold">Verlauf</h2>
					<AddHistoricDiaper
						diaperChanges={diaperChanges}
						onDiaperAdd={onDiaperAdd}
					/>
				</div>
				<DiaperHistoryList
					changes={diaperChanges}
					onDiaperDelete={onDiaperDelete}
					onDiaperUpdate={onDiaperUpdate}
				/>
			</div>
		</div>
	);
}
