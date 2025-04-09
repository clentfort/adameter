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
import { useTranslate } from '@/utils/translate';
import { PlusCircle } from 'lucide-react';
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

	const isAbnormalTemperature = (temp: number) => {
		return temp < 36.5 || temp > 37.5;
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
									<span className="text-lg mr-1">💧</span> {t('urineOnly')}
								</Label>
							</div>
							<div className="flex items-center space-x-2">
								<RadioGroupItem
									className="text-amber-700 border-amber-700"
									id="stool"
									value="stool"
								/>
								<Label className="text-amber-800" htmlFor="stool">
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
								onChange={(e) => setDate(e.target.value)}
								type="date"
								value={date}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="time">{t('time')}</Label>
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
						<Label htmlFor="temperature">{t('temperature')} (°C)</Label>
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
					<Button onClick={() => setOpen(false)} variant="outline">
						{t('cancel')}
					</Button>
					<Button onClick={handleSubmit}>{t('save')}</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
