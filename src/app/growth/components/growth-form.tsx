import type { GrowthMeasurement } from '@/types/growth';
import { fbt } from 'fbtee';
import { ReactNode, useState } from 'react';
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
import { Textarea } from '@/components/ui/textarea';
import { useUnitSystem } from '@/hooks/use-unit-system';
import { dateToDateInputValue } from '@/utils/date-to-date-input-value';
import {
	cmToInches,
	gramsToLbsOz,
	inchesToCm,
	lbsOzToGrams,
} from '@/utils/unit-conversions';

interface EditGrowthFormProps {
	measurement: GrowthMeasurement;
	onClose: () => void;
	// Optional for editing existing measurement
	onSave: (measurement: GrowthMeasurement) => void;
	title: ReactNode;
}

interface AddGrowthFormProps {
	onClose: () => void;
	// Optional for editing existing measurement
	onSave: (measurement: GrowthMeasurement) => void;
	title: ReactNode;
}

type MeasurementFormProps = EditGrowthFormProps | AddGrowthFormProps;

export default function MeasurementForm({
	onClose,
	onSave,
	title,
	...props
}: MeasurementFormProps) {
	const unitSystem = useUnitSystem();
	const [date, setDate] = useState(
		dateToDateInputValue(
			'measurement' in props ? props.measurement.date : new Date(),
		),
	);

	// Weight state
	const [weight, setWeight] = useState(() => {
		const val = 'measurement' in props ? props.measurement.weight : undefined;
		if (val === undefined) return '';
		return unitSystem === 'metric' ? val.toString() : '';
	});
	const [weightLbs, setWeightLbs] = useState(() => {
		const val = 'measurement' in props ? props.measurement.weight : undefined;
		if (val === undefined || unitSystem === 'metric') return '';
		return gramsToLbsOz(val).lbs.toString();
	});
	const [weightOz, setWeightOz] = useState(() => {
		const val = 'measurement' in props ? props.measurement.weight : undefined;
		if (val === undefined || unitSystem === 'metric') return '';
		return gramsToLbsOz(val).oz.toString();
	});

	// Height/Length state
	const [height, setHeight] = useState(() => {
		const val = 'measurement' in props ? props.measurement.height : undefined;
		if (val === undefined) return '';
		return unitSystem === 'metric'
			? val.toString()
			: cmToInches(val).toString();
	});
	const [headCircumference, setHeadCircumference] = useState(() => {
		const val =
			'measurement' in props ? props.measurement.headCircumference : undefined;
		if (val === undefined) return '';
		return unitSystem === 'metric'
			? val.toString()
			: cmToInches(val).toString();
	});
	const [notes, setNotes] = useState(
		'measurement' in props ? props.measurement.notes : '',
	);
	const [error, setError] = useState('');

	const handleSave = () => {
		// Validate that at least one of weight or height is provided
		const hasWeight =
			unitSystem === 'metric' ? !!weight : !!weightLbs || !!weightOz;
		if (!hasWeight && !height && !headCircumference) {
			setError(
				fbt(
					'Please enter at least a weight, height, or head circumference.',
					'Message shown when no weight, height, or head circumference is provided. At least one is required',
				),
			);
			return;
		}

		setError('');

		const measurement = 'measurement' in props ? props.measurement : undefined;

		const weightInGrams =
			unitSystem === 'metric'
				? weight
					? Number.parseFloat(weight)
					: undefined
				: weightLbs || weightOz
					? lbsOzToGrams(
							Number.parseFloat(weightLbs || '0'),
							Number.parseFloat(weightOz || '0'),
						)
					: undefined;

		const heightInCm =
			height && !Number.isNaN(Number.parseFloat(height))
				? unitSystem === 'metric'
					? Number.parseFloat(height)
					: inchesToCm(Number.parseFloat(height))
				: undefined;

		const headCircumferenceInCm =
			headCircumference && !Number.isNaN(Number.parseFloat(headCircumference))
				? unitSystem === 'metric'
					? Number.parseFloat(headCircumference)
					: inchesToCm(Number.parseFloat(headCircumference))
				: undefined;

		const newMeasurement: GrowthMeasurement = {
			...measurement,
			date: new Date(`${date}T12:00:00`).toISOString(),
			headCircumference: headCircumferenceInCm,
			height: heightInCm,
			id: measurement?.id || Date.now().toString(),

			notes: notes || undefined,
			// Use noon to avoid timezone issues
			weight: weightInGrams,
		};

		onSave(newMeasurement);
		onClose();
	};

	return (
		<Dialog onOpenChange={(open) => !open && onClose()} open={true}>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
				</DialogHeader>
				<div className="grid gap-4 py-4">
					<div className="space-y-2">
						<Label htmlFor="date">
							<fbt common>Date</fbt>
						</Label>
						<Input
							id="date"
							onChange={(e) => setDate(e.target.value)}
							type="date"
							value={date}
						/>
					</div>

					<div className="grid grid-cols-1 gap-4">
						{unitSystem === 'metric' ? (
							<div className="space-y-2">
								<Label htmlFor="weight">
									<fbt desc="Label for a body weight input">Weight (g)</fbt>
								</Label>
								<Input
									id="weight"
									onChange={(e) => setWeight(e.target.value)}
									placeholder={fbt(
										'e.g. 3500',
										'Placeholder for a weight input',
									)}
									type="number"
									value={weight}
								/>
							</div>
						) : (
							<div className="space-y-2">
								<Label>
									<fbt desc="Label for a body weight input in lbs and oz">
										Weight (lb oz)
									</fbt>
								</Label>
								<div className="grid grid-cols-2 gap-2">
									<Input
										id="weight-lbs"
										onChange={(e) => setWeightLbs(e.target.value)}
										placeholder={fbt('lb', 'Abbreviation for pounds')}
										type="number"
										value={weightLbs}
									/>
									<Input
										id="weight-oz"
										onChange={(e) => setWeightOz(e.target.value)}
										placeholder={fbt('oz', 'Abbreviation for ounces')}
										type="number"
										value={weightOz}
									/>
								</div>
							</div>
						)}
						<div className="space-y-2">
							<Label htmlFor="height">
								{unitSystem === 'metric' ? (
									<fbt desc="Label for a body height input">Height (cm)</fbt>
								) : (
									<fbt desc="Label for a body height input">Height (in)</fbt>
								)}
							</Label>
							<Input
								id="height"
								onChange={(e) => setHeight(e.target.value)}
								placeholder={
									unitSystem === 'metric'
										? fbt('e.g. 50', 'Placeholder for a height input')
										: fbt('e.g. 20', 'Placeholder for a height input')
								}
								step="0.1"
								type="number"
								value={height}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="headCircumference">
								{unitSystem === 'metric' ? (
									<fbt desc="Label for a head circumference input">
										Head Circumference (cm)
									</fbt>
								) : (
									<fbt desc="Label for a head circumference input">
										Head Circumference (in)
									</fbt>
								)}
							</Label>
							<Input
								id="headCircumference"
								onChange={(e) => setHeadCircumference(e.target.value)}
								placeholder={
									unitSystem === 'metric'
										? fbt(
												'e.g. 35',
												'Placeholder for a head circumference input',
											)
										: fbt(
												'e.g. 14',
												'Placeholder for a head circumference input',
											)
								}
								step="0.1"
								type="number"
								value={headCircumference}
							/>
						</div>
					</div>

					{error && <div className="text-sm text-red-500">{error}</div>}

					<div className="space-y-2">
						<Label htmlFor="notes">
							<fbt desc="Label for an optional notes textarea">
								Notes (optional)
							</fbt>{' '}
							(optional)
						</Label>
						<Textarea
							id="notes"
							onChange={(e) => setNotes(e.target.value)}
							placeholder={fbt(
								'Additional information',
								'Placeholder for a text input for notes',
							)}
							rows={3}
							value={notes}
						/>
					</div>
				</div>
				<DialogFooter>
					<Button onClick={handleSave} type="submit">
						<fbt common>Save</fbt>
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
