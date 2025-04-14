'use client';

import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
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
import type { DiaperChange } from '@/types/diaper';
import { formatISO } from 'date-fns';
import { PlusCircle } from 'lucide-react';
import { useState } from 'react';
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

interface AddHistoricDiaperProps {
	diaperChanges: DiaperChange[];
	onDiaperAdd: (change: DiaperChange) => void;
}

export default function AddHistoricDiaper({
	diaperChanges = [],
	onDiaperAdd,
}: AddHistoricDiaperProps) {
	const [open, setOpen] = useState(false);
	const [date, setDate] = useState('');
	const [time, setTime] = useState('');
	const [diaperType, setDiaperType] = useState<'urine' | 'stool'>('urine');
	const [diaperBrand, setDiaperBrand] = useState('');
	const [temperature, setTemperature] = useState('');
	const [hasLeakage, setHasLeakage] = useState(false);
	const [abnormalities, setAbnormalities] = useState('');

	// Get the last used brand from the most recent diaper change
	const lastUsedBrand =
		diaperChanges.length > 0 && diaperChanges[0].diaperBrand
			? diaperChanges[0].diaperBrand
			: '';

	// Set default values for today's date and current time
	const setDefaultValues = () => {
		const now = new Date();
		const formattedDate = formatISO(now, { representation: 'date' });
		const formattedTime = formatISO(now, { representation: 'time' }).slice(
			0,
			5,
		);

		setDate(formattedDate);
		setTime(formattedTime);
		setDiaperType('urine');

		// Check if the last brand is in our predefined list
		const isPredefinedBrand = DIAPER_BRANDS.some(
			(brand) => brand.value === lastUsedBrand,
		);
		if (lastUsedBrand && !isPredefinedBrand) {
			setDiaperBrand('andere');
		} else {
			setDiaperBrand(lastUsedBrand || '');
		}

		setTemperature('');
		setHasLeakage(false);
		setAbnormalities('');
	};

	const handleSubmit = () => {
		if (!date || !time) return;

		const [year, month, day] = date.split('-').map(Number);
		const [hours, minutes] = time.split(':').map(Number);
		const timestamp = new Date(year, month - 1, day, hours, minutes);

		const change: DiaperChange = {
			abnormalities: abnormalities || undefined,

			// Always true, as stool usually comes with urine
			containsStool: diaperType === 'stool',

			containsUrine: true,
			diaperBrand: diaperBrand || undefined,
			id: Date.now().toString(),
			leakage: hasLeakage || undefined,
			temperature: temperature ? Number.parseFloat(temperature) : undefined,
			timestamp: timestamp.toISOString(),
		};

		onDiaperAdd(change);
		setOpen(false);
	};

	return (
		<Dialog
			onOpenChange={(newOpen) => {
				setOpen(newOpen);
				if (newOpen) {
					setDefaultValues();
				}
			}}
			open={open}
		>
			<DialogTrigger asChild>
				<Button size="sm" variant="outline">
					<PlusCircle className="h-4 w-4 mr-1" />
					<fbt desc="addEntry">Add Entry</fbt>
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>
						<fbt desc="addHistoricDiaper">Add Historic Diaper Change</fbt>
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
									id="urine"
									value="urine"
								/>
								<Label className="text-yellow-700" htmlFor="urine">
									<span className="text-lg mr-1">💧</span>{' '}
									<fbt desc="urineOnly">Urine Only</fbt>
								</Label>
							</div>
							<div className="flex items-center space-x-2">
								<RadioGroupItem
									className="text-amber-700 border-amber-700"
									id="stool"
									value="stool"
								/>
								<Label className="text-amber-800" htmlFor="stool">
									<span className="text-lg mr-1">💩</span>{' '}
									<fbt desc="stool">Stool</fbt>
								</Label>
							</div>
						</RadioGroup>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="date">
								<fbt desc="date">Date</fbt>
							</Label>
							<Input
								id="date"
								onChange={(e) => setDate(e.target.value)}
								type="date"
								value={date}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="time">
								<fbt desc="time">Time</fbt>
							</Label>
							<Input
								id="time"
								onChange={(e) => setTime(e.target.value)}
								type="time"
								value={time}
							/>
						</div>
					</div>

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
							<fbt desc="temperature">Temperature (°C)</fbt> (°C)
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
							placeholder=<fbt desc="temperatureExample">e.g. 37.2</fbt>
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
							placeholder=<fbt desc="abnormalitiesExample">
								e.g. redness, rash, etc.
							</fbt>
							value={abnormalities}
						/>
					</div>
				</div>
				<DialogFooter>
					<Button onClick={() => setOpen(false)} variant="outline">
						<fbt desc="cancel">Cancel</fbt>
					</Button>
					<Button onClick={handleSubmit}>
						<fbt common>Save</fbt>
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
