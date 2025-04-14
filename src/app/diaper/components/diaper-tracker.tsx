'use client';

import type { DiaperChange } from '@/types/diaper';
import { fbt } from 'fbtee';
import { useState } from 'react';
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
import { isAbnormalTemperature } from '../utils/is-abnormal-temperature';

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

	return (
		<div className="w-full">
			<div className="grid grid-cols-2 gap-4">
				<Button
					className="h-24 text-lg w-full bg-yellow-400 hover:bg-yellow-500 text-yellow-900"
					onClick={() => handleQuickChange('urine')}
					size="lg"
				>
					<span className="text-2xl mr-2">💧</span>{' '}
					<fbt desc="urineOnly">Urine Only</fbt>
				</Button>
				<Button
					className="h-24 text-lg w-full bg-amber-700 hover:bg-amber-800 text-white"
					onClick={() => handleQuickChange('stool')}
					size="lg"
				>
					<span className="text-2xl mr-2">💩</span>{' '}
					<fbt desc="stool">Stool</fbt>
				</Button>
			</div>
			<Dialog onOpenChange={setIsDetailsDialogOpen} open={isDetailsDialogOpen}>
				<DialogContent className="sm:max-w-[425px]">
					<DialogHeader>
						<DialogTitle>
							{selectedType === 'urine' ? (
								<fbt desc="urineDetails">Urine Diaper - Details</fbt>
							) : (
								<fbt desc="stoolDetails">Stool Diaper - Details</fbt>
							)}{' '}
							- Details
						</DialogTitle>
					</DialogHeader>
					<div className="grid gap-4 py-4">
						{/* Diaper brand first */}
						<div className="space-y-2">
							<Label htmlFor="diaper-brand">
								<fbt desc="diaperBrand">Diaper Brand</fbt>
							</Label>
							<Select onValueChange={setDiaperBrand} value={diaperBrand}>
								<SelectTrigger>
									<SelectValue
										placeholder=<fbt desc="selectDiaperBrand">
											Select Diaper Brand
										</fbt>
									/>
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
							<Label htmlFor="temperature">
								<fbt desc="temperature">Temperature (°C)</fbt>
							</Label>
							<Input
								className={
									temperature &&
									isAbnormalTemperature(Number.parseFloat(temperature))
										? 'border-red-500'
										: ''
								}
								id="temperature"
								onChange={(e) => setTemperature(e.target.value)}
								placeholder={
									fbt('e.g. 37.2', 'temperatureExample') // Example temperature
								}
								step="0.1"
								type="number"
								value={temperature}
							/>
							{temperature &&
								isAbnormalTemperature(Number.parseFloat(temperature)) && (
									<p className="text-xs text-red-500 mt-1">
										<fbt desc="temperatureWarning">
											Warning: Temperature outside normal range (36.5°C -
											37.5°C)
										</fbt>
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
							<Label htmlFor="leakage">
								<fbt desc="leakage">Diaper leaked</fbt>
							</Label>
						</div>

						<div className="space-y-2">
							<Label htmlFor="abnormalities">
								<fbt desc="abnormalities">Abnormalities</fbt>
							</Label>
							<Textarea
								id="abnormalities"
								onChange={(e) => setAbnormalities(e.target.value)}
								placeholder={
									fbt('e.g. redness, rash, etc.', 'abnormalitiesExample') // Example abnormalities
								}
								value={abnormalities}
							/>
						</div>
					</div>
					<DialogFooter>
						<Button onClick={resetForm} variant="outline">
							<fbt common>Cancel</fbt>
						</Button>
						<Button onClick={handleSave}>
							<fbt common>Save</fbt>
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
