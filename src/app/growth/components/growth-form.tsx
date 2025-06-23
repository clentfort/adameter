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
import { dateToDateInputValue } from '@/utils/date-to-date-input-value';

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
	const [date, setDate] = useState(
		dateToDateInputValue(
			'measurement' in props ? props.measurement.date : new Date(),
		),
	);
	const [weight, setWeight] = useState(
		'measurement' in props ? props.measurement.weight?.toString() : '',
	);
	const [height, setHeight] = useState(
		'measurement' in props ? props.measurement.height?.toString() : '',
	);
	const [headCircumference, setHeadCircumference] = useState(
		'measurement' in props
			? props.measurement.headCircumference?.toString()
			: '',
	);
	const [notes, setNotes] = useState(
		'measurement' in props ? props.measurement.notes : '',
	);
	const [error, setError] = useState('');

	const handleSave = () => {
		// Validate that at least one of weight or height is provided
		if (!weight && !height && !headCircumference) {
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

		const newMeasurement: GrowthMeasurement = {
			...measurement,
			date: new Date(`${date}T12:00:00`).toISOString(),
			height: height ? Number.parseFloat(height) : undefined,
			headCircumference: headCircumference
				? Number.parseFloat(headCircumference)
				: undefined,
			id: measurement?.id || Date.now().toString(),

			notes: notes || undefined,
			// Use noon to avoid timezone issues
			weight: weight ? Number.parseFloat(weight) : undefined,
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
						<div className="space-y-2">
							<Label htmlFor="weight">
								<fbt desc="Label for a body weight input">Weight (g)</fbt>
							</Label>
							<Input
								id="weight"
								onChange={(e) => setWeight(e.target.value)}
								placeholder={fbt('e.g. 3500', 'Placeholder for a weight input')}
								type="number"
								value={weight}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="height">
								<fbt desc="Label for a body height input">Height (cm)</fbt>
							</Label>
							<Input
								id="height"
								onChange={(e) => setHeight(e.target.value)}
								placeholder={fbt('e.g. 50', 'Placeholder for a height input')}
								step="0.1"
								type="number"
								value={height}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="headCircumference">
								<fbt desc="Label for a head circumference input">
									Head Circumference (cm)
								</fbt>
							</Label>
							<Input
								id="headCircumference"
								onChange={(e) => setHeadCircumference(e.target.value)}
								placeholder={fbt('e.g. 35', 'Placeholder for a head circumference input')}
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
