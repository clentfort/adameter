'use client';

import { Ruler } from 'lucide-react';
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
						<Ruler className="h-6 w-6 mr-2" />
						<fbt desc="Growth button label">Growth</fbt>
					</Button>
				</div>

				<div>
					<div className="flex justify-between items-center mb-4">
						<h2 className="text-xl font-semibold">
							<fbt desc="historyTitle">History</fbt>
						</h2>
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
