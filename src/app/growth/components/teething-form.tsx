import type {
	TeethingFormData,
	TeethingFormValues,
	Tooth,
} from '@/types/teething';
import { fbt } from 'fbtee';
import { DateTimeInputs } from '@/components/form/date-time-inputs';
import { EntityFormDialog } from '@/components/form/entity-form-dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useEntityForm } from '@/hooks/use-entity-form';
import { teethingFormToDataSchema } from '@/types/teething';
import { dateToDateInputValue } from '@/utils/date-to-date-input-value';

interface TeethingFormProps {
	onClose: () => void;
	onSave: (tooth: Tooth) => void;
	tooth: Tooth;
	toothName: string;
}

function getDefaultValues(tooth: Tooth): TeethingFormValues {
	return {
		date: dateToDateInputValue(tooth.date ? new Date(tooth.date) : new Date()),
		notes: tooth.notes ?? '',
	};
}

export default function TeethingForm({
	onClose,
	onSave,
	tooth,
	toothName,
}: TeethingFormProps) {
	const form = useEntityForm<
		TeethingFormValues,
		undefined,
		TeethingFormData
	>(teethingFormToDataSchema, () => getDefaultValues(tooth), [tooth]);

	const { register } = form;

	const handleSave = (parsedValues: TeethingFormData) => {
		onSave({
			...tooth,
			date: parsedValues.date,
			notes: parsedValues.notes,
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
		<EntityFormDialog
			footer={
				<div className="flex justify-between w-full mt-6">
					<Button onClick={handleClear} type="button" variant="outline">
						<fbt desc="Clear teething data">Clear</fbt>
					</Button>
					<Button data-testid="save-button" type="submit">
						<fbt common>Save</fbt>
					</Button>
				</div>
			}
			form={form}
			onClose={onClose}
			onSave={handleSave}
			title={
				<fbt desc="Edit teething progress title">
					Edit Teething: <fbt:param name="toothName">{toothName}</fbt:param> (
					<fbt:param name="fdi">{tooth.toothId}</fbt:param>)
				</fbt>
			}
		>
			<div className="grid gap-4 py-4">
				<DateTimeInputs
					dateField="date"
					dateId="date"
					dateLabel={<fbt desc="Date of eruption">Eruption Date</fbt>}
					register={register}
				/>

				<div className="space-y-2">
					<Label htmlFor="notes">
						<fbt common>Notes</fbt>
					</Label>
					<Textarea
						id="notes"
						placeholder={fbt(
							'Additional information',
							'Placeholder for a text input for notes',
						)}
						rows={3}
						{...register('notes')}
					/>
				</div>
			</div>
		</EntityFormDialog>
	);
}
