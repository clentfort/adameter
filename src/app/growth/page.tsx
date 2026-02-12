'use client';

import { PlusCircle } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useGrowthMeasurements } from '@/hooks/use-growth-measurements';
import { useTeething } from '@/hooks/use-teething';
import MeasurementForm from './components/growth-form';
import GrowthHistoryList from './components/growth-history-list';
import TeethingProgress from './components/teething-progress';

export default function GrowthPage() {
	const [isAddEntryDialogOpen, setIsAddEntryDialogOpen] = useState(false);
	const { add, remove, update, value: measurements } = useGrowthMeasurements();
	const { update: updateTooth, value: teeth } = useTeething();

	return (
		<>
			<div className="w-full space-y-8">
				<div>
					<h2 className="text-xl font-semibold mb-4 text-center">
						<fbt desc="teethingTitle">Teething Progress</fbt>
					</h2>
					<TeethingProgress />
				</div>

				<hr className="border-t" />

				<div>
					<div className="flex justify-between items-center mb-4">
						<h2 className="text-xl font-semibold">
							<fbt desc="historyTitle">History</fbt>
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

					<GrowthHistoryList
						measurements={measurements}
						onMeasurementDelete={remove}
						onMeasurementUpdate={update}
						onToothUpdate={updateTooth}
						teeth={teeth}
					/>
				</div>
			</div>

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
