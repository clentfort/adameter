import type { DiaperChange } from '@/types/diaper';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useUpsertDiaperChange } from '@/hooks/use-diaper-changes';
import { useDiaperChangesTotal } from '@/hooks/use-tinybase-metrics';
import { useLastUsedDiaperProduct } from '../hooks/use-last-used-diaper-product';
import DiaperForm from './diaper-form';

interface DiaperTrackerProps {
	checkAndTriggerConfetti: (change: DiaperChange, totalChanges: number) => void;
}

export default function DiaperTracker({
	checkAndTriggerConfetti,
}: DiaperTrackerProps) {
	const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
	const [selectedType, setSelectedType] = useState<'urine' | 'stool' | null>(
		null,
	);
	const totalChanges = useDiaperChangesTotal();
	const upsertDiaperChange = useUpsertDiaperChange();
	const lastUsedDiaperProduct = useLastUsedDiaperProduct();

	const handleQuickChange = (type: 'urine' | 'stool') => {
		setSelectedType(type);
		setIsDetailsDialogOpen(true);
	};

	return (
		<div className="w-full">
			<div className="grid grid-cols-2 gap-4">
				<Button
					className="h-24 text-lg w-full"
					data-testid="quick-urine-button"
					onClick={() => handleQuickChange('urine')}
					size="lg"
				>
					<span className="text-2xl mr-2">💧</span>{' '}
					<fbt desc="Label for a button that tracks a urine diaper">Urine</fbt>
				</Button>
				<Button
					className="h-24 text-lg w-full"
					data-testid="quick-stool-button"
					onClick={() => handleQuickChange('stool')}
					size="lg"
				>
					<span className="text-2xl mr-2">💩</span>{' '}
					<fbt desc="Label for a button that tracks a stool diaper">Stool</fbt>
				</Button>
			</div>
			{isDetailsDialogOpen && (
				<DiaperForm
					onClose={() => setIsDetailsDialogOpen(false)}
					onSave={(change) => {
						setIsDetailsDialogOpen(false);
						upsertDiaperChange(change);
						checkAndTriggerConfetti(change, totalChanges);
					}}
					presetDiaperProductId={lastUsedDiaperProduct}
					presetType={selectedType ?? undefined}
					title={
						<fbt desc="Title for the diaper change entry dialog">
							Add Diaper Entry
						</fbt>
					}
				/>
			)}
		</div>
	);
}
