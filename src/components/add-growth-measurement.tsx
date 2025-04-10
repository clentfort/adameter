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
import { useTranslate } from '@/utils/translate';
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

	const t = useTranslate();

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
						{t('addMeasurement')}
					</Button>
				</DialogTrigger>
			)}
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>
						{measurement ? t('editMeasurement') : t('newMeasurement')}
					</DialogTitle>
				</DialogHeader>
				<div className="grid gap-4 py-4">
					<div className="space-y-2">
						<Label htmlFor="date">{t('date')}</Label>
						<Input
							id="date"
							onChange={(e) => setDate(e.target.value)}
							type="date"
							value={date}
						/>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="weight">{t('weight')} (g)</Label>
							<Input
								id="weight"
								onChange={(e) => setWeight(e.target.value)}
								placeholder={t('weightExample')}
								type="number"
								value={weight}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="height">{t('height')} (cm)</Label>
							<Input
								id="height"
								onChange={(e) => setHeight(e.target.value)}
								placeholder={t('heightExample')}
								step="0.1"
								type="number"
								value={height}
							/>
						</div>
					</div>

					{error && <div className="text-sm text-red-500">{error}</div>}

					<div className="space-y-2">
						<Label htmlFor="notes">{t('notes')} (optional)</Label>
						<Textarea
							id="notes"
							onChange={(e) => setNotes(e.target.value)}
							placeholder={t('notesPlaceholder')}
							rows={3}
							value={notes}
						/>
					</div>
				</div>
				<DialogFooter>
					<Button onClick={handleSave} type="submit">
						{t('save')}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
