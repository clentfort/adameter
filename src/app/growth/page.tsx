'use client';

import { PlusCircle } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useGrowthMeasurements } from '@/hooks/use-growth-measurements';
import { useTeething } from '@/hooks/use-teething';
import MeasurementForm from './components/growth-form';
import GrowthHistoryList from './components/growth-history-list';
import TeethingDialog from './components/teething-dialog';

export default function GrowthPage() {
	const [isAddEntryDialogOpen, setIsAddEntryDialogOpen] = useState(false);
	const [isTeethingDialogOpen, setIsTeethingDialogOpen] = useState(false);
	const { add, remove, update, value: measurements } = useGrowthMeasurements();
	const { update: updateTooth, value: teeth } = useTeething();

	return (
		<>
			<div className="w-full space-y-8">
				<div>
					<div className="flex justify-between items-center mb-4">
						<h2 className="text-xl font-semibold">
							<fbt desc="Title for the Growth History section">History</fbt>
						</h2>
						<div className="flex gap-2">
							<Button
								onClick={() => setIsTeethingDialogOpen(true)}
								size="sm"
								variant="outline"
							>
								🦷 <fbt desc="Add tooth button">Add Tooth</fbt>
							</Button>
							<Button
								onClick={() => setIsAddEntryDialogOpen(true)}
								size="sm"
								variant="outline"
							>
								<PlusCircle className="h-4 w-4 mr-1" />
								<fbt common>Add Entry</fbt>
							</Button>
						</div>
					</div>

					<GrowthHistoryList
						measurements={measurements}
						onMeasurementDelete={remove}
						onMeasurementUpdate={update}
						onToothUpdate={updateTooth}
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
						add(measurement);
						setIsAddEntryDialogOpen(false);
					}}
					title={
						<fbt desc="Title of the dialog to manually add a growth measurement">
							Add Growth Measurement
						</fbt>
					}
				/>
			)}
		</>
	);
}
