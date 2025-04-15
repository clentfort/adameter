'use client';

import { PlusCircle } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAppState } from '@/hooks/use-app-state';
import DiaperForm from './components/diaper-form';
import DiaperHistoryList from './components/diaper-history-list';
import DiaperTracker from './components/diaper-tracker';

export default function DiaperPage() {
	const [isAddEntryDialogOpen, setIsAddEntryDialogOpen] = useState(false);
	const {
		addDiaperChange,
		deleteDiaperChange,
		diaperChanges,
		updateDiaperChange,
	} = useAppState();

	return (
		<>
			<div className="w-full">
				<div className="w-full">
					<DiaperTracker
						diaperChanges={diaperChanges}
						onDiaperChange={addDiaperChange}
					/>

					<div className="w-full mt-8">
						<div className="flex justify-between items-center mb-4">
							<h2 className="text-xl font-semibold">
								<fbt desc="Descedingly ordered history of events (i.e. diaper changes or feeding sessions)">
									History
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
						<DiaperHistoryList
							changes={diaperChanges}
							onDiaperDelete={deleteDiaperChange}
							onDiaperUpdate={updateDiaperChange}
						/>
					</div>
				</div>
			</div>

			{isAddEntryDialogOpen && (
				<DiaperForm
					onClose={() => setIsAddEntryDialogOpen(false)}
					onSave={(change) => {
						addDiaperChange(change);
						setIsAddEntryDialogOpen(false);
					}}
					presetDiaperBrand={diaperChanges[0]?.diaperBrand}
					title={
						<fbt desc="Title of the dialog to manually add a previous diaper change">
							Add Diaper Change
						</fbt>
					}
				/>
			)}
		</>
	);
}
