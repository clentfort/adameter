'use client';

import type { DiaperChange } from '@/types/diaper';
import { PlusCircle } from 'lucide-react';
import { useState } from 'react';
import ReactConfetti from 'react-confetti';
import { Button } from '@/components/ui/button';
import { useDiaperChanges } from '@/hooks/use-diaper-changes';
import { useLastUsedDiaperBrand } from '@/hooks/use-last-used-diaper-brand';
import DiaperForm from './components/diaper-form';
import DiaperHistoryList from './components/diaper-history-list';
import DiaperTracker from './components/diaper-tracker';

export default function DiaperPage() {
	const [isAddEntryDialogOpen, setIsAddEntryDialogOpen] = useState(false);
	const [showConfetti, setShowConfetti] = useState(false);

	const diaperChanges = useDiaperChanges();
	const { add } = diaperChanges;
	const lastUsedDiaperBrand = useLastUsedDiaperBrand();

	const checkAndTriggerConfetti = (
		change: DiaperChange,
		totalChanges: number,
	) => {
		if (
			totalChanges % 100 === 0 ||
			(change.abnormalities && change.abnormalities.includes('🎉'))
		) {
			setShowConfetti(true);
		}
	};

	const handleConfettiComplete = (
		confettiInstance?: { reset: () => void } | null,
	) => {
		setShowConfetti(false);
		if (confettiInstance && typeof confettiInstance.reset === 'function') {
			confettiInstance.reset();
		}
	};

	return (
		<>
			{showConfetti && (
				<ReactConfetti
					onConfettiComplete={handleConfettiComplete}
					recycle={false}
				/>
			)}
			<div className="w-full">
				<div className="w-full">
					<DiaperTracker checkAndTriggerConfetti={checkAndTriggerConfetti} />

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
						add(change);
						const currentTotalChanges = diaperChanges.value.length;
						checkAndTriggerConfetti(change, currentTotalChanges);
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
