'use client';

import { PlusCircle } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAppState } from '@/hooks/use-app-state';
import MeasurementForm from './components/growth-form';
import GrowthMeasurementsList from './components/growth-list';

export default function GrowthPage() {
	const [isAddEntryDialogOpen, setIsAddEntryDialogOpen] = useState(false);
	const { addMeasurement, deleteMeasurement, measurements, updateMeasurement } =
		useAppState();
	return (
		<>
			<div className="w-full">
				<div className="flex justify-between items-center mb-4">
					<h2 className="text-xl font-semibold">
						<fbt desc="growthTab">Growth</fbt>
					</h2>
					<Button
						onClick={() => setIsAddEntryDialogOpen(true)}
						size="sm"
						variant="outline"
					>
						<PlusCircle className="h-4 w-4 mr-1" />
						<fbt common>Add Entry</fbt>
					</Button>
				</div>
				<GrowthMeasurementsList
					measurements={measurements}
					onMeasurementDelete={deleteMeasurement}
					onMeasurementUpdate={updateMeasurement}
				/>
			</div>

			{isAddEntryDialogOpen && (
				<MeasurementForm
					onClose={() => setIsAddEntryDialogOpen(false)}
					onSave={(measurement) => {
						addMeasurement(measurement);
						setIsAddEntryDialogOpen(false);
					}}
					title={
						<fbt desc="Title of the dialog to manually add a previous feeding session">
							Add Feeding
						</fbt>
					}
				/>
			)}
		</>
	);
}
