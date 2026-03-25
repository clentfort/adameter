'use client';

import type { DiaperChange } from '@/types/diaper';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import ReactConfetti from 'react-confetti';
import HistoryHeader from '@/components/history-header';
import { useUpsertDiaperChange } from '@/hooks/use-diaper-changes';
import { useDiaperChangesTotal } from '@/hooks/use-tinybase-metrics';
import DiaperForm from './components/diaper-form';
import DiaperHistoryList from './components/diaper-history-list';
import DiaperTracker from './components/diaper-tracker';
import { useLastUsedDiaperProduct } from './hooks/use-last-used-diaper-product';

export default function DiaperPage() {
	const [isAddEntryDialogOpen, setIsAddEntryDialogOpen] = useState(false);
	const [showConfetti, setShowConfetti] = useState(false);

	const totalChanges = useDiaperChangesTotal();
	const upsertDiaperChange = useUpsertDiaperChange();
	const lastUsedDiaperProduct = useLastUsedDiaperProduct();
	const router = useRouter();
	const searchParams = useSearchParams();

	const handleRangeChange = (from: string, to: string) => {
		const params = new URLSearchParams(searchParams.toString());
		params.set('from', from);
		params.set('to', to);
		router.replace(`/diaper?${params.toString()}`, { scroll: false });
	};

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
						<HistoryHeader
							from={searchParams.get('from')}
							onAddEntry={() => setIsAddEntryDialogOpen(true)}
							onRangeChange={handleRangeChange}
							title={
								<fbt desc="Descedingly ordered history of events (i.e. diaper changes or feeding sessions)">
									History
								</fbt>
							}
							to={searchParams.get('to')}
						/>
						<DiaperHistoryList />
					</div>
				</div>
			</div>

			{isAddEntryDialogOpen && (
				<DiaperForm
					onClose={() => setIsAddEntryDialogOpen(false)}
					onSave={(change) => {
						upsertDiaperChange(change);
						checkAndTriggerConfetti(change, totalChanges);
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
