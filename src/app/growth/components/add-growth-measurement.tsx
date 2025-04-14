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
import { Textarea } from '@/components/ui/textarea';
import type { GrowthMeasurement } from '@/types/growth';
import { PlusCircle } from 'lucide-react';
import { useState } from 'react';

interface AddGrowthMeasurementProps {
	measurement?: GrowthMeasurement;
	onClose?: () => void;
	// Optional for editing existing measurement
	onSave: (measurement: GrowthMeasurement) => void;
}

export default function AddGrowthMeasurement({
	measurement,
	onClose,
	onSave,
}: AddGrowthMeasurementProps) {
	const [open, setOpen] = useState(!!measurement);
	const [date, setDate] = useState(
		measurement?.date
			? new Date(measurement.date).toISOString().split('T')[0]
			: new Date().toISOString().split('T')[0],
	);
	const [weight, setWeight] = useState(measurement?.weight?.toString() || '');
	const [height, setHeight] = useState(measurement?.height?.toString() || '');
	const [notes, setNotes] = useState(measurement?.notes || '');
	const [error, setError] = useState('');

	const handleSave = () => {
		// Validate that at least one of weight or height is provided
		if (!weight && !height) {
			setError(t('validationError'));
			return;
		}

		setError('');

		const newMeasurement: GrowthMeasurement = {
			date: new Date(`${date}T12:00:00`).toISOString(),
			height: height ? Number.parseFloat(height) : undefined,
			id: measurement?.id || Date.now().toString(),

			notes: notes || undefined,
			// Use noon to avoid timezone issues
			weight: weight ? Number.parseFloat(weight) : undefined,
		};

		onSave(newMeasurement);
		setOpen(false);
		if (onClose) onClose();
	};

	const handleOpenChange = (newOpen: boolean) => {
		setOpen(newOpen);
		if (!newOpen && onClose) onClose();
	};

	return (
		<Dialog onOpenChange={handleOpenChange} open={open}>
			{!measurement && (
				<DialogTrigger asChild>
					<Button onClick={() => setOpen(true)} size="sm" variant="outline">
						<PlusCircle className="h-4 w-4 mr-1" />
						<fbt desc="addMeasurement">Add Measurement</fbt>
					</Button>
				</DialogTrigger>
			)}
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>
						{measurement ? (
							<fbt desc="editMeasurement">Edit Measurement</fbt>
						) : (
							<fbt desc="newMeasurement">Add New Measurement</fbt>
						)}
					</DialogTitle>
				</DialogHeader>
				<div className="grid gap-4 py-4">
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

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="weight">
								<fbt desc="weight">Weight (g)</fbt> (g)
							</Label>
							<Input
								id="weight"
								onChange={(e) => setWeight(e.target.value)}
								placeholder=<fbt desc="weightExample">e.g. 3500</fbt>
								type="number"
								value={weight}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="height">
								<fbt desc="height">Height (cm)</fbt> (cm)
							</Label>
							<Input
								id="height"
								onChange={(e) => setHeight(e.target.value)}
								placeholder=<fbt desc="heightExample">e.g. 50</fbt>
								step="0.1"
								type="number"
								value={height}
							/>
						</div>
					</div>

					{error && <div className="text-sm text-red-500">{error}</div>}

					<div className="space-y-2">
						<Label htmlFor="notes">
							<fbt desc="notes">Notes (optional)</fbt> (optional)
						</Label>
						<Textarea
							id="notes"
							onChange={(e) => setNotes(e.target.value)}
							placeholder=<fbt desc="notesPlaceholder">
								Additional information
							</fbt>
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
