'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
	useGrowthMeasurementsSnapshot,
	useRemoveGrowthMeasurement,
	useUpsertGrowthMeasurement,
} from '@/hooks/use-growth-measurements';
import { useTeethSnapshot, useUpsertTooth } from '@/hooks/use-teething';
import MeasurementForm from './components/growth-form';
import GrowthHistoryList from './components/growth-history-list';
import TeethingDialog from './components/teething-dialog';

export default function GrowthPage() {
	const [isAddEntryDialogOpen, setIsAddEntryDialogOpen] = useState(false);
	const [isTeethingDialogOpen, setIsTeethingDialogOpen] = useState(false);
	const upsertGrowthMeasurement = useUpsertGrowthMeasurement();
	const removeGrowthMeasurement = useRemoveGrowthMeasurement();
	const measurements = useGrowthMeasurementsSnapshot();
	const upsertTooth = useUpsertTooth();
	const teeth = useTeethSnapshot();

	return (
		<>
			<div className="w-full space-y-8">
				<div className="grid grid-cols-2 gap-4">
					<Button
						className="h-24 text-lg w-full bg-sky-600 hover:bg-sky-700 text-white"
						data-testid="tooth-button"
						onClick={() => setIsTeethingDialogOpen(true)}
						size="lg"
					>
						<span className="text-2xl mr-2">🦷</span>{' '}
						<fbt desc="Tooth button label">Tooth</fbt>
					</Button>
					<Button
						className="h-24 text-lg w-full bg-emerald-600 hover:bg-emerald-700 text-white"
						data-testid="growth-button"
						onClick={() => setIsAddEntryDialogOpen(true)}
						size="lg"
					>
						<span className="text-2xl mr-2">📏</span>{' '}
						<fbt desc="Growth button label">Growth</fbt>
					</Button>
				</div>

				<div>
					<div className="flex justify-between items-center mb-4">
						<h2 className="text-xl font-semibold">
							<fbt desc="Title for the Growth History section">History</fbt>
						</h2>
					</div>

					<GrowthHistoryList
						measurements={measurements}
						onMeasurementDelete={removeGrowthMeasurement}
						onMeasurementUpdate={upsertGrowthMeasurement}
						onToothUpdate={upsertTooth}
						teeth={teeth}
					/>
				</div>
			</div>

			{isTeethingDialogOpen && (
				<TeethingDialog onClose={() => setIsTeethingDialogOpen(false)} />
			)}

			{isAddEntryDialogOpen && (
				<MeasurementForm
					onClose={() => setIsAddEntryDialogOpen(false)}
					onSave={(measurement) => {
						upsertGrowthMeasurement(measurement);
						setIsAddEntryDialogOpen(false);
					}}
					title={
						<fbt desc="Title of the dialog to manually add a growth measurement">
							Add Growth Entry
						</fbt>
					}
				/>
			)}
		</>
	);
}
