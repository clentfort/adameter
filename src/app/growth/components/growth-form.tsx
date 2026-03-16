import type { ReactNode } from 'react';
import type {
	GrowthFormData,
	GrowthFormValues,
	GrowthMeasurement,
} from '@/types/growth';
import { fbt } from 'fbtee';
import { useMemo } from 'react';
import { DateTimeInputs } from '@/components/form/date-time-inputs';
import { EntityFormDialog } from '@/components/form/entity-form-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useEntityForm } from '@/hooks/use-entity-form';
import { useUnitSystem } from '@/hooks/use-unit-system';
import { growthFormToDataSchema } from '@/types/growth';
import { dateToDateInputValue } from '@/utils/date-to-date-input-value';
import {
	cmToInches,
	gramsToLbs,
	inchesToCm,
	lbsToGrams,
} from '@/utils/unit-conversions';

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
	const unitSystem = useUnitSystem();
	const isImperial = unitSystem === 'imperial';

	const defaultValues = useMemo(() => {
		const values = getDefaultValues(measurement);
		if (isImperial) {
			if (values.weight) {
				const grams = Number.parseFloat(values.weight);
				if (!Number.isNaN(grams)) {
					values.weight = gramsToLbs(grams).toFixed(1);
				}
			}
			if (values.height) {
				const cm = Number.parseFloat(values.height);
				if (!Number.isNaN(cm)) {
					values.height = cmToInches(cm).toFixed(1);
				}
			}
			if (values.headCircumference) {
				const cm = Number.parseFloat(values.headCircumference);
				if (!Number.isNaN(cm)) {
					values.headCircumference = cmToInches(cm).toFixed(1);
				}
			}
		}
		return values;
	}, [measurement, isImperial]);

	const form = useEntityForm<GrowthFormValues, undefined, GrowthFormData>(
		growthFormToDataSchema,
		defaultValues,
	);

	const {
		formState: { errors },
		register,
	} = form;

	const handleSave = (parsedValues: GrowthFormData) => {
		let weight = parsedValues.weight;
		let height = parsedValues.height;
		let headCircumference = parsedValues.headCircumference;

		if (isImperial) {
			if (weight != null) {
				weight = Math.round(lbsToGrams(weight));
			}
			if (height != null) {
				height = Math.round(inchesToCm(height) * 10) / 10;
			}
			if (headCircumference != null) {
				headCircumference = Math.round(inchesToCm(headCircumference) * 10) / 10;
			}
		}

		const newMeasurement: GrowthMeasurement = {
			...measurement,
			date: parsedValues.date,
			headCircumference,
			height,
			id: measurement?.id || Date.now().toString(),
			notes: parsedValues.notes,
			weight,
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
							{isImperial ? (
								<fbt desc="Label for a body weight input in pounds">
									Weight (lbs)
								</fbt>
							) : (
								<fbt desc="Label for a body weight input in grams">
									Weight (g)
								</fbt>
							)}
						</Label>
						<Input
							id="weight"
							placeholder={
								isImperial
									? fbt('e.g. 7.7', 'Placeholder for a weight input in pounds')
									: fbt('e.g. 3500', 'Placeholder for a weight input in grams')
							}
							step={isImperial ? '0.1' : undefined}
							type="number"
							{...register('weight')}
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="height">
							{isImperial ? (
								<fbt desc="Label for a body height input in inches">
									Height (in)
								</fbt>
							) : (
								<fbt desc="Label for a body height input in centimeters">
									Height (cm)
								</fbt>
							)}
						</Label>
						<Input
							id="height"
							placeholder={
								isImperial
									? fbt('e.g. 19.7', 'Placeholder for a height input in inches')
									: fbt(
											'e.g. 50',
											'Placeholder for a height input in centimeters',
										)
							}
							step="0.1"
							type="number"
							{...register('height')}
						/>
					</div>
					<div className="space-y-2">
						<Label htmlFor="headCircumference">
							{isImperial ? (
								<fbt desc="Label for a head circumference input in inches">
									Head Circumference (in)
								</fbt>
							) : (
								<fbt desc="Label for a head circumference input in centimeters">
									Head Circumference (cm)
								</fbt>
							)}
						</Label>
						<Input
							id="headCircumference"
							placeholder={
								isImperial
									? fbt(
											'e.g. 13.8',
											'Placeholder for a head circumference input in inches',
										)
									: fbt(
											'e.g. 35',
											'Placeholder for a head circumference input in centimeters',
										)
							}
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
