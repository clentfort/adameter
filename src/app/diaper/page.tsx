'use client';

import { PlusCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import ConfettiCelebration from '@/components/confetti-celebration';
import { Button } from '@/components/ui/button';
import { useDiaperChanges } from '@/hooks/use-diaper-changes';
import { useLastUsedDiaperBrand } from '@/hooks/use-last-used-diaper-brand';
import DiaperForm from './components/diaper-form';
import DiaperHistoryList from './components/diaper-history-list';
import DiaperTracker from './components/diaper-tracker';

export default function DiaperPage() {
	const [isAddEntryDialogOpen, setIsAddEntryDialogOpen] = useState(false);
	const [showConfetti, setShowConfetti] = useState(false);

	const { add } = useDiaperChanges();
	const lastUsedDiaperBrand = useLastUsedDiaperBrand();

	useEffect(() => {
		if (showConfetti) {
			const timer = setTimeout(() => setShowConfetti(false), 5000); // Hide confetti after 5 seconds
			return () => clearTimeout(timer);
		}
	}, [showConfetti]);

	return (
		<>
			<ConfettiCelebration show={showConfetti} />
			<div className="w-full">
				<div className="w-full">
					<DiaperTracker />

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
						<DiaperHistoryList />
					</div>
				</div>
			</div>

			{isAddEntryDialogOpen && (
				<DiaperForm
					onClose={() => setIsAddEntryDialogOpen(false)}
					onSave={(change) => {
						const newLength = add(change);
						// The add function from useArrayState (which useEncryptedArrayState wraps)
						// returns the new length of the array, or void if the item already exists.
						if (
							(typeof newLength === 'number' && newLength % 100 === 0) ||
							(change.notes && change.notes.includes('🎉'))
						) {
							setShowConfetti(true);
						}
						setIsAddEntryDialogOpen(false);
					}}
					presetDiaperBrand={lastUsedDiaperBrand}
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
