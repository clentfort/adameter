'use client';

import type { DiaperChange } from '@/types/diaper';
import { PlusCircle } from 'lucide-react';
import { useState } from 'react';
import ReactConfetti from 'react-confetti';
import { Button } from '@/components/ui/button';
import {
	useDiaperChangesSnapshot,
	useSortedDiaperChangeListEntries,
	useUpsertDiaperChange,
} from '@/hooks/use-diaper-changes';
import DiaperForm from './components/diaper-form';
import DiaperHistoryList from './components/diaper-history-list';
import DiaperTracker from './components/diaper-tracker';
import { useLastUsedDiaperProduct } from './hooks/use-last-used-diaper-product';

export default function DiaperPage() {
	const [isAddEntryDialogOpen, setIsAddEntryDialogOpen] = useState(false);
	const [showConfetti, setShowConfetti] = useState(false);

	const diaperChanges = useDiaperChangesSnapshot();
	const diaperChangeEntries = useSortedDiaperChangeListEntries();
	const upsertDiaperChange = useUpsertDiaperChange();
	const lastUsedDiaperProduct = useLastUsedDiaperProduct();

	const checkAndTriggerConfetti = (
		change: DiaperChange,
		totalChanges: number,
	) => {
		if (
			totalChanges % 100 === 0 ||
			(change.notes && change.notes.includes('🎉'))
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
						<DiaperHistoryList diaperChangeEntries={diaperChangeEntries} />
					</div>
				</div>
			</div>

			{isAddEntryDialogOpen && (
				<DiaperForm
					onClose={() => setIsAddEntryDialogOpen(false)}
					onSave={(change) => {
						upsertDiaperChange(change);
						const currentTotalChanges = diaperChanges.length;
						checkAndTriggerConfetti(change, currentTotalChanges);
						setIsAddEntryDialogOpen(false);
					}}
					presetDiaperProductId={lastUsedDiaperProduct}
					title={
						<fbt desc="Title of the dialog to manually add a previous diaper change">
							Add Diaper Entry
						</fbt>
					}
				/>
			)}
		</>
	);
}
