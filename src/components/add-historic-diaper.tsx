'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogFooter,
	DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import type { DiaperChange } from '@/types/diaper';
import { PlusCircle } from 'lucide-react';
import { useTranslate } from '@/utils/translate';

// Simplified diaper brands
const DIAPER_BRANDS = [
	{ value: 'pampers', label: 'Pampers' },
	{ value: 'huggies', label: 'Huggies' },
	{ value: 'lillydoo', label: 'Lillydoo' },
	{ value: 'dm', label: 'dm' },
	{ value: 'rossmann', label: 'Rossmann' },
	{ value: 'stoffwindel', label: 'Stoffwindel' },
	{ value: 'lidl', label: 'Lidl' },
	{ value: 'aldi', label: 'Aldi' },
	{ value: 'andere', label: 'Andere' },
];

interface AddHistoricDiaperProps {
	onDiaperAdd: (change: DiaperChange) => void;
	diaperChanges: DiaperChange[];
}

export default function AddHistoricDiaper({
	onDiaperAdd,
	diaperChanges = [],
}: AddHistoricDiaperProps) {
	const [open, setOpen] = useState(false);
	const [date, setDate] = useState('');
	const [time, setTime] = useState('');
	const [diaperType, setDiaperType] = useState<'urine' | 'stool'>('urine');
	const [diaperBrand, setDiaperBrand] = useState('');
	const [temperature, setTemperature] = useState('');
	const [hasLeakage, setHasLeakage] = useState(false);
	const [abnormalities, setAbnormalities] = useState('');

	const t = useTranslate();

	// Get the last used brand from the most recent diaper change
	const lastUsedBrand =
		diaperChanges.length > 0 && diaperChanges[0].diaperBrand
			? diaperChanges[0].diaperBrand
			: '';

	// Set default values for today's date and current time
	const setDefaultValues = () => {
		const now = new Date();
		const formattedDate = now.toISOString().split('T')[0];
		const formattedTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

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
			id: Date.now().toString(),
			timestamp: timestamp.toISOString(),
			containsUrine: true, // Always true, as stool usually comes with urine
			containsStool: diaperType === 'stool',
			diaperBrand: diaperBrand || undefined,
			temperature: temperature ? Number.parseFloat(temperature) : undefined,
			leakage: hasLeakage || undefined,
			abnormalities: abnormalities || undefined,
		};

		onDiaperAdd(change);
		setOpen(false);
	};

	const isAbnormalTemperature = (temp: number) => {
		return temp < 36.5 || temp > 37.5;
	};

	return (
		<Dialog
			open={open}
			onOpenChange={(newOpen) => {
				setOpen(newOpen);
				if (newOpen) {
					setDefaultValues();
				}
			}}
		>
			<DialogTrigger asChild>
				<Button variant="outline" size="sm">
					<PlusCircle className="h-4 w-4 mr-1" />
					{t('addEntry')}
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>{t('addHistoricDiaper')}</DialogTitle>
				</DialogHeader>
				<div className="grid gap-4 py-4">
					<div className="space-y-2">
						<Label>{t('diaperType')}</Label>
						<RadioGroup
							value={diaperType}
							onValueChange={(value) =>
								setDiaperType(value as 'urine' | 'stool')
							}
							className="flex gap-4"
						>
							<div className="flex items-center space-x-2">
								<RadioGroupItem
									value="urine"
									id="urine"
									className="text-yellow-500 border-yellow-500"
								/>
								<Label htmlFor="urine" className="text-yellow-700">
									<span className="text-lg mr-1">💧</span> {t('urineOnly')}
								</Label>
							</div>
							<div className="flex items-center space-x-2">
								<RadioGroupItem
									value="stool"
									id="stool"
									className="text-amber-700 border-amber-700"
								/>
								<Label htmlFor="stool" className="text-amber-800">
									<span className="text-lg mr-1">💩</span> {t('stool')}
								</Label>
							</div>
						</RadioGroup>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="date">{t('date')}</Label>
							<Input
								id="date"
								type="date"
								value={date}
								onChange={(e) => setDate(e.target.value)}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="time">{t('time')}</Label>
							<Input
								id="time"
								type="time"
								value={time}
								onChange={(e) => setTime(e.target.value)}
							/>
						</div>
					</div>

					{/* Diaper brand first */}
					<div className="space-y-2">
						<Label htmlFor="diaper-brand">{t('diaperBrand')}</Label>
						<Select value={diaperBrand} onValueChange={setDiaperBrand}>
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
						<Label htmlFor="temperature">{t('temperature')} (°C)</Label>
						<Input
							id="temperature"
							type="number"
							step="0.1"
							placeholder={t('temperatureExample')}
							value={temperature}
							onChange={(e) => setTemperature(e.target.value)}
							className={
								temperature &&
								isAbnormalTemperature(Number.parseFloat(temperature))
									? 'border-red-500'
									: ''
							}
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
							id="leakage"
							checked={hasLeakage}
							onCheckedChange={setHasLeakage}
						/>
						<Label htmlFor="leakage">{t('leakage')}</Label>
					</div>

					<div className="space-y-2">
						<Label htmlFor="abnormalities">{t('abnormalities')}</Label>
						<Textarea
							id="abnormalities"
							placeholder={t('abnormalitiesExample')}
							value={abnormalities}
							onChange={(e) => setAbnormalities(e.target.value)}
						/>
					</div>
				</div>
				<DialogFooter>
					<Button variant="outline" onClick={() => setOpen(false)}>
						{t('cancel')}
					</Button>
					<Button onClick={handleSubmit}>{t('save')}</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
