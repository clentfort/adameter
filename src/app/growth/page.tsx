'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useUpsertGrowthMeasurement } from '@/hooks/use-growth-measurements';
import MeasurementForm from './components/growth-form';
import IndexedGrowthHistoryList from './components/indexed-growth-history-list';
import TeethingDialog from './components/teething-dialog';

export default function GrowthPage() {
	const [isAddEntryDialogOpen, setIsAddEntryDialogOpen] = useState(false);
	const [isTeethingDialogOpen, setIsTeethingDialogOpen] = useState(false);
	const upsertGrowthMeasurement = useUpsertGrowthMeasurement();

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

					<IndexedGrowthHistoryList />
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
