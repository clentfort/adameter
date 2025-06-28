'use client';

import { PlusCircle } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useMedication } from '@/hooks/use-medication';
import MedicationForm from './components/medication-form';
import MedicationHistoryList from './components/medication-history-list';
import '@/i18n';

export default function MedicationPage() {
	const [isAddEntryDialogOpen, setIsAddEntryDialogOpen] = useState(false);
	const { add } = useMedication();

	return (
		<>
			<div className="w-full">
				{/* Potentially add a tracker component here in the future if needed */}
				{/* For now, directly show the history and add button */}
				<div className="w-full mt-2 sm:mt-4">
					<div className="flex justify-between items-center mb-4">
						<h2 className="text-xl font-semibold">
							<fbt desc="Title for the medication history section">
								Medication Log
							</fbt>
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
					<MedicationHistoryList />
				</div>
			</div>

			{isAddEntryDialogOpen && (
				<MedicationForm
					onClose={() => setIsAddEntryDialogOpen(false)}
					onSave={(newMedication) => {
						add(newMedication);
						setIsAddEntryDialogOpen(false);
					}}
					title={
						<fbt desc="Title for the dialog to add a new medication entry">
							Add Medication Entry
						</fbt>
					}
				/>
			)}
		</>
	);
}
