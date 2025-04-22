import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useDiaperChanges } from '@/hooks/use-diaper-changes';
import { useLastUsedDiaperBrand } from '@/hooks/use-last-used-diaper-brand';
import DiaperForm from './diaper-form';

export default function DiaperTracker() {
	const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
	const [selectedType, setSelectedType] = useState<'urine' | 'stool' | null>(
		null,
	);
	const { add } = useDiaperChanges();
	const [lastUsedDiaperBrand] = useLastUsedDiaperBrand();

	const handleQuickChange = (type: 'urine' | 'stool') => {
		setSelectedType(type);
		setIsDetailsDialogOpen(true);
	};

	return (
		<div className="w-full">
			<div className="grid grid-cols-2 gap-4">
				<Button
					className="h-24 text-lg w-full bg-yellow-400 hover:bg-yellow-500 text-yellow-900"
					onClick={() => handleQuickChange('urine')}
					size="lg"
				>
					<span className="text-2xl mr-2">💧</span>{' '}
					<fbt desc="Label for a button that tracks a urine only diaper">
						Urine Only
					</fbt>
				</Button>
				<Button
					className="h-24 text-lg w-full bg-amber-700 hover:bg-amber-800 text-white"
					onClick={() => handleQuickChange('stool')}
					size="lg"
				>
					<span className="text-2xl mr-2">💩</span>{' '}
					<fbt desc="Label for a button that tracks a urine and stool diaper">
						Stool
					</fbt>
				</Button>
			</div>
			{isDetailsDialogOpen && (
				<DiaperForm
					onClose={() => setIsDetailsDialogOpen(false)}
					onSave={(change) => {
						setIsDetailsDialogOpen(false);
						add(change);
					}}
					presetDiaperBrand={lastUsedDiaperBrand}
					presetType={selectedType ?? undefined}
					reducedOptions
					title={
						<fbt desc="Title for the diaper change details dialog">
							<fbt:param name="diaperType">
								{selectedType === 'urine' ? (
									<fbt common>Urine</fbt>
								) : (
									<fbt common>Stool</fbt>
								)}
							</fbt:param>{' '}
							Diaper - Details
						</fbt>
					}
				/>
			)}
		</div>
	);
}
