'use client';

import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import type { DiaperChange } from '@/types/diaper';
import { useTranslate } from '@/utils/translate';
import { useState } from 'react';

// Simplified diaper brands
const DIAPER_BRANDS = [
	{ label: 'Pampers', value: 'pampers' },
	{ label: 'Huggies', value: 'huggies' },
	{ label: 'Lillydoo', value: 'lillydoo' },
	{ label: 'dm', value: 'dm' },
	{ label: 'Rossmann', value: 'rossmann' },
	{ label: 'Stoffwindel', value: 'stoffwindel' },
	{ label: 'Lidl', value: 'lidl' },
	{ label: 'Aldi', value: 'aldi' },
	{ label: 'Andere', value: 'andere' },
];

interface DiaperTrackerProps {
	diaperChanges: DiaperChange[];
	onDiaperChange: (change: DiaperChange) => void;
}

export default function DiaperTracker({
	diaperChanges = [],
	onDiaperChange,
}: DiaperTrackerProps) {
	const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
	const [selectedType, setSelectedType] = useState<'urine' | 'stool' | null>(
		null,
	);
	const [diaperBrand, setDiaperBrand] = useState('');
	const [temperature, setTemperature] = useState('');
	const [hasLeakage, setHasLeakage] = useState(false);
	const [abnormalities, setAbnormalities] = useState('');

	// Get the last used brand from the most recent diaper change
	const lastUsedBrand =
		diaperChanges.length > 0 && diaperChanges[0].diaperBrand
			? diaperChanges[0].diaperBrand
			: '';

	const t = useTranslate();

	const handleQuickChange = (type: 'urine' | 'stool') => {
		setSelectedType(type);
		// Set the last used brand when opening the dialog
		setDiaperBrand(lastUsedBrand);
		setIsDetailsDialogOpen(true);
	};

	const handleSave = () => {
		if (!selectedType) return;

		const now = new Date();
		const change: DiaperChange = {
			abnormalities: abnormalities || undefined,

			// Stool usually also contains urine
			containsStool: selectedType === 'stool',

			containsUrine: selectedType === 'urine' || selectedType === 'stool',
			diaperBrand: diaperBrand || undefined,
			id: Date.now().toString(),
			leakage: hasLeakage || undefined,
			temperature: temperature ? Number.parseFloat(temperature) : undefined,
			timestamp: now.toISOString(),
		};

		onDiaperChange(change);
		resetForm();
	};

	const resetForm = () => {
		setSelectedType(null);
		setDiaperBrand('');
		setTemperature('');
		setHasLeakage(false);
		setAbnormalities('');
		setIsDetailsDialogOpen(false);
	};

	const isAbnormalTemperature = (temp: number) => {
		return temp < 36.5 || temp > 37.5;
	};

	return (
		<div className="w-full">
			<div className="grid grid-cols-2 gap-4">
				<Button
					className="h-24 text-lg w-full bg-yellow-400 hover:bg-yellow-500 text-yellow-900"
					onClick={() => handleQuickChange('urine')}
					size="lg"
				>
					<span className="text-2xl mr-2">💧</span> {t('urineOnly')}
				</Button>
				<Button
					className="h-24 text-lg w-full bg-amber-700 hover:bg-amber-800 text-white"
					onClick={() => handleQuickChange('stool')}
					size="lg"
				>
					<span className="text-2xl mr-2">💩</span> {t('stool')}
				</Button>
			</div>

			<Dialog onOpenChange={setIsDetailsDialogOpen} open={isDetailsDialogOpen}>
				<DialogContent className="sm:max-w-[425px]">
					<DialogHeader>
						<DialogTitle>
							{selectedType === 'urine' ? t('urineDetails') : t('stoolDetails')}{' '}
							- Details
						</DialogTitle>
					</DialogHeader>
					<div className="grid gap-4 py-4">
						{/* Diaper brand first */}
						<div className="space-y-2">
							<Label htmlFor="diaper-brand">{t('diaperBrand')}</Label>
							<Select onValueChange={setDiaperBrand} value={diaperBrand}>
								<SelectTrigger>
									<SelectValue placeholder={t('selectDiaperBrand')} />
								</SelectTrigger>
								<SelectContent>
									{DIAPER_BRANDS.map((brand) => (
										<SelectItem key={brand.value} value={brand.value}>
											{brand.label}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						{/* Temperature second */}
						<div className="space-y-2">
							<Label htmlFor="temperature">{t('temperature')}</Label>
							<Input
								className={
									temperature &&
									isAbnormalTemperature(Number.parseFloat(temperature))
										? 'border-red-500'
										: ''
								}
								id="temperature"
								onChange={(e) => setTemperature(e.target.value)}
								placeholder={t('temperatureExample')}
								step="0.1"
								type="number"
								value={temperature}
							/>
							{temperature &&
								isAbnormalTemperature(Number.parseFloat(temperature)) && (
									<p className="text-xs text-red-500 mt-1">
										{t('temperatureWarning')}
									</p>
								)}
						</div>

						{/* Leakage and abnormalities last */}
						<div className="flex items-center space-x-2">
							<Switch
								checked={hasLeakage}
								id="leakage"
								onCheckedChange={setHasLeakage}
							/>
							<Label htmlFor="leakage">{t('leakage')}</Label>
						</div>

						<div className="space-y-2">
							<Label htmlFor="abnormalities">{t('abnormalities')}</Label>
							<Textarea
								id="abnormalities"
								onChange={(e) => setAbnormalities(e.target.value)}
								placeholder={t('abnormalitiesExample')}
								value={abnormalities}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button onClick={resetForm} variant="outline">
							{t('cancel')}
						</Button>
						<Button onClick={handleSave}>{t('save')}</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
