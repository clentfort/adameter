import type { Tooth } from '@/types/teething';
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
import { Textarea } from '@/components/ui/textarea';
import { dateToDateInputValue } from '@/utils/date-to-date-input-value';

interface TeethingFormProps {
	onClose: () => void;
	onSave: (tooth: Tooth) => void;
	tooth: Tooth;
	toothName: string;
}

export default function TeethingForm({
	onClose,
	onSave,
	tooth,
	toothName,
}: TeethingFormProps) {
	const [date, setDate] = useState(
		dateToDateInputValue(tooth.date ? new Date(tooth.date) : new Date()),
	);
	const [notes, setNotes] = useState(tooth.notes || '');

	const handleSave = () => {
		onSave({
			...tooth,
			date: new Date(`${date}T12:00:00`).toISOString(),
			notes: notes || undefined,
		});
		onClose();
	};

	const handleClear = () => {
		onSave({
			...tooth,
			date: undefined,
			notes: undefined,
		});
		onClose();
	};

	return (
		<Dialog onOpenChange={(open) => !open && onClose()} open={true}>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>
						<fbt desc="Edit teething progress title">
							Edit Teething: <fbt:param name="toothName">{toothName}</fbt:param>{' '}
							(
							<fbt:param name="fdi">{tooth.toothId}</fbt:param>)
						</fbt>
					</DialogTitle>
				</DialogHeader>
				<div className="grid gap-4 py-4">
					<div className="space-y-2">
						<Label htmlFor="date">
							<fbt desc="Date of eruption">Eruption Date</fbt>
						</Label>
						<Input
							id="date"
							onChange={(e) => setDate(e.target.value)}
							type="date"
							value={date}
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="notes">
							<fbt common>Notes</fbt>
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
				<DialogFooter className="flex justify-between sm:justify-between">
					<Button onClick={handleClear} variant="outline">
						<fbt desc="Clear teething data">Clear</fbt>
					</Button>
					<Button onClick={handleSave} type="submit">
						<fbt common>Save</fbt>
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
