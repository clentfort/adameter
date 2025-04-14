'use client';

import type { DiaperChange } from '@/types/diaper';
import { format } from 'date-fns';
import { fbt } from 'fbtee';
import { useEffect, useState } from 'react';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
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

interface EditDiaperDialogProps {
	change: DiaperChange;
	onClose: () => void;
	onUpdate: (change: DiaperChange) => void;
}

export default function EditDiaperDialog({
	change,
	onClose,
	onUpdate,
}: EditDiaperDialogProps) {
	const [date, setDate] = useState('');
	const [time, setTime] = useState('');
	const [diaperType, setDiaperType] = useState<'urine' | 'stool'>('urine');
	const [diaperBrand, setDiaperBrand] = useState('');
	const [temperature, setTemperature] = useState('');
	const [hasLeakage, setHasLeakage] = useState(false);
	const [abnormalities, setAbnormalities] = useState('');

	useEffect(() => {
		const changeDate = new Date(change.timestamp);
		setDate(format(changeDate, 'yyyy-MM-dd'));
		setTime(format(changeDate, 'HH:mm'));
		setDiaperType(change.containsStool ? 'stool' : 'urine');

		// Check if the brand is in our predefined list
		const isPredefinedBrand = DIAPER_BRANDS.some(
			(brand) => brand.value === change.diaperBrand,
		);
		if (change.diaperBrand && !isPredefinedBrand) {
			setDiaperBrand('andere');
		} else {
			setDiaperBrand(change.diaperBrand || '');
		}

		setTemperature(change.temperature ? change.temperature.toString() : '');
		setHasLeakage(change.leakage || false);
		setAbnormalities(change.abnormalities || '');
	}, [change]);

	const handleSubmit = () => {
		if (!date || !time) return;

		const [year, month, day] = date.split('-').map(Number);
		const [hours, minutes] = time.split(':').map(Number);
		const timestamp = new Date(year, month - 1, day, hours, minutes);

		const updatedChange: DiaperChange = {
			...change,

			abnormalities: abnormalities || undefined,

			// Always true, as stool usually comes with urine
			containsStool: diaperType === 'stool',
			containsUrine: true,
			diaperBrand: diaperBrand || undefined,
			leakage: hasLeakage || undefined,
			temperature: temperature ? Number.parseFloat(temperature) : undefined,
			timestamp: timestamp.toISOString(),
		};

		onUpdate(updatedChange);
		onClose();
	};

	return (
		<Dialog onOpenChange={(open) => !open && onClose()} open={true}>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>
						<fbt desc="editDiaperEntry">Edit Diaper Entry</fbt>
					</DialogTitle>
				</DialogHeader>
				<div className="grid gap-4 py-4">
					<div className="space-y-2">
						<Label>
							<fbt desc="diaperType">Diaper Type</fbt>
						</Label>
						<RadioGroup
							className="flex gap-4"
							onValueChange={(value) =>
								setDiaperType(value as 'urine' | 'stool')
							}
							value={diaperType}
						>
							<div className="flex items-center space-x-2">
								<RadioGroupItem
									className="text-yellow-500 border-yellow-500"
									id="edit-urine"
									value="urine"
								/>
								<Label className="text-yellow-700" htmlFor="edit-urine">
									<span className="text-lg mr-1">💧</span>{' '}
									<fbt desc="urineOnly">Urine Only</fbt>
								</Label>
							</div>
							<div className="flex items-center space-x-2">
								<RadioGroupItem
									className="text-amber-700 border-amber-700"
									id="edit-stool"
									value="stool"
								/>
								<Label className="text-amber-800" htmlFor="edit-stool">
									<span className="text-lg mr-1">💩</span>{' '}
									<fbt desc="stool">Stool</fbt>
								</Label>
							</div>
						</RadioGroup>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="edit-date">
								<fbt desc="date">Date</fbt>
							</Label>
							<Input
								id="edit-date"
								onChange={(e) => setDate(e.target.value)}
								type="date"
								value={date}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="edit-time">
								<fbt desc="time">Time</fbt>
							</Label>
							<Input
								id="edit-time"
								onChange={(e) => setTime(e.target.value)}
								type="time"
								value={time}
							/>
						</div>
					</div>

					{/* Diaper brand first */}
					<div className="space-y-2">
						<Label htmlFor="edit-diaper-brand">
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
						<Label htmlFor="edit-temperature">
							<fbt desc="temperature">Temperature (°C)</fbt>
						</Label>
						<Input
							className={
								temperature &&
								isAbnormalTemperature(Number.parseFloat(temperature))
									? 'border-red-500'
									: ''
							}
							id="edit-temperature"
							onChange={(e) => setTemperature(e.target.value)}
							placeholder={fbt('e.g. 37.2', 'temperatureExample')}
							step="0.1"
							type="number"
							value={temperature}
						/>
						{temperature &&
							isAbnormalTemperature(Number.parseFloat(temperature)) && (
								<p className="text-xs text-red-500 mt-1">
									<fbt desc="temperatureWarning">
										Warning: Temperature outside normal range (36.5°C - 37.5°C)
									</fbt>
								</p>
							)}
					</div>

					{/* Leakage and abnormalities last */}
					<div className="flex items-center space-x-2">
						<Switch
							checked={hasLeakage}
							id="edit-leakage"
							onCheckedChange={setHasLeakage}
						/>
						<Label htmlFor="edit-leakage">
							<fbt desc="leakage">Diaper leaked</fbt>
						</Label>
					</div>

					<div className="space-y-2">
						<Label htmlFor="edit-abnormalities">
							<fbt desc="abnormalities">Abnormalities</fbt>
						</Label>
						<Textarea
							id="edit-abnormalities"
							onChange={(e) => setAbnormalities(e.target.value)}
							placeholder={fbt(
								'e.g. redness, rash, etc.',
								'abnormalitiesExample',
							)}
							value={abnormalities}
						/>
					</div>
				</div>
				<DialogFooter>
					<Button onClick={onClose} variant="outline">
						<fbt common>Cancel</fbt>
					</Button>
					<Button onClick={handleSubmit}>
						<fbt common>Save</fbt>
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
