import type { ReactNode } from 'react';
import type {
	GrowthFormData,
	GrowthFormValues,
	GrowthMeasurement,
} from '@/types/growth';
import { fbt } from 'fbtee';
import { DateTimeInputs } from '@/components/form/date-time-inputs';
import { EntityFormDialog } from '@/components/form/entity-form-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useEntityForm } from '@/hooks/use-entity-form';
import { growthFormToDataSchema } from '@/types/growth';
import { dateToDateInputValue } from '@/utils/date-to-date-input-value';

interface EditGrowthFormProps {
	measurement: GrowthMeasurement;
	onClose: () => void;
	onSave: (measurement: GrowthMeasurement) => void;
	title: ReactNode;
}

interface AddGrowthFormProps {
	onClose: () => void;
	onSave: (measurement: GrowthMeasurement) => void;
	title: ReactNode;
}

type MeasurementFormProps = EditGrowthFormProps | AddGrowthFormProps;

function getDefaultValues(
	measurement: GrowthMeasurement | undefined,
): GrowthFormValues {
	return {
		date: dateToDateInputValue(measurement?.date ?? new Date()),
		headCircumference: measurement?.headCircumference?.toString() ?? '',
		height: measurement?.height?.toString() ?? '',
		notes: measurement?.notes ?? '',
		weight: measurement?.weight?.toString() ?? '',
	};
}

export default function MeasurementForm({
	onClose,
	onSave,
	title,
	...props
}: MeasurementFormProps) {
	const measurement = 'measurement' in props ? props.measurement : undefined;

	const form = useEntityForm<GrowthFormValues, undefined, GrowthFormData>(
		growthFormToDataSchema,
		() => getDefaultValues(measurement),
		[measurement],
	);

	const {
		formState: { errors },
		register,
	} = form;

	const handleSave = (parsedValues: GrowthFormData) => {
		const newMeasurement: GrowthMeasurement = {
			...measurement,
			date: parsedValues.date,
			headCircumference: parsedValues.headCircumference,
			height: parsedValues.height,
			id: measurement?.id || Date.now().toString(),
			notes: parsedValues.notes,
			weight: parsedValues.weight,
		};

		onSave(newMeasurement);
		onClose();
	};

	return (
		<EntityFormDialog
			form={form}
			onClose={onClose}
			onSave={handleSave}
			title={title}
		>
			<div className="grid gap-4 py-4">
				<DateTimeInputs
					dateField="date"
					dateId="date"
					errors={errors}
					register={register}
				/>

				<div className="grid grid-cols-1 gap-4">
					<div className="space-y-2">
						<Label htmlFor="weight">
							<fbt desc="Label for a body weight input">Weight (g)</fbt>
						</Label>
						<Input
							id="weight"
							placeholder={fbt('e.g. 3500', 'Placeholder for a weight input')}
							type="number"
							{...register('weight')}
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="height">
							<fbt desc="Label for a body height input">Height (cm)</fbt>
						</Label>
						<Input
							id="height"
							placeholder={fbt('e.g. 50', 'Placeholder for a height input')}
							step="0.1"
							type="number"
							{...register('height')}
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
							placeholder={fbt(
								'e.g. 35',
								'Placeholder for a head circumference input',
							)}
							step="0.1"
							type="number"
							{...register('headCircumference')}
						/>
					</div>
				</div>

				{errors.weight && (
					<div className="text-sm text-red-500">
						{errors.weight.message === 'AT_LEAST_ONE_REQUIRED' ? (
							<fbt desc="Message shown when no weight, height, or head circumference is provided. At least one is required">
								Please enter at least a weight, height, or head circumference.
							</fbt>
						) : (
							errors.weight.message
						)}
					</div>
				)}

				{errors.height && errors.height.message !== 'AT_LEAST_ONE_REQUIRED' && (
					<div className="text-sm text-red-500">{errors.height.message}</div>
				)}

				{errors.headCircumference &&
					errors.headCircumference.message !== 'AT_LEAST_ONE_REQUIRED' && (
						<div className="text-sm text-red-500">
							{errors.headCircumference.message}
						</div>
					)}

				<div className="space-y-2">
					<Label htmlFor="notes">
						<fbt desc="Label for an optional notes textarea">
							Notes (optional)
						</fbt>
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
