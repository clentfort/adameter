import type { GrowthMeasurement } from '@/types/growth';
import { growthSchema, type GrowthFormValues } from '@/types/growth';
import { zodResolver } from '@hookform/resolvers/zod';
import { fbt } from 'fbtee';
import { ReactNode, useEffect } from 'react';
import { useForm } from 'react-hook-form';
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
	onSave: (measurement: GrowthMeasurement) => void;
	title: ReactNode;
}

interface AddGrowthFormProps {
	onClose: () => void;
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
	const measurement = 'measurement' in props ? props.measurement : undefined;

	const {
		formState: { errors, isValid },
		handleSubmit,
		register,
		reset,
	} = useForm<GrowthFormValues>({
		defaultValues: {
			date: dateToDateInputValue(measurement?.date ?? new Date()),
			headCircumference: measurement?.headCircumference?.toString() ?? '',
			height: measurement?.height?.toString() ?? '',
			notes: measurement?.notes ?? '',
			weight: measurement?.weight?.toString() ?? '',
		},
		mode: 'onChange',
		resolver: zodResolver(growthSchema),
	});

	useEffect(() => {
		if (measurement) {
			reset({
				date: dateToDateInputValue(measurement.date),
				headCircumference: measurement.headCircumference?.toString() ?? '',
				height: measurement.height?.toString() ?? '',
				notes: measurement.notes ?? '',
				weight: measurement.weight?.toString() ?? '',
			});
		}
	}, [measurement, reset]);

	const onSubmit = (values: GrowthFormValues) => {
		const newMeasurement: GrowthMeasurement = {
			...measurement,
			date: new Date(`${values.date}T12:00:00`).toISOString(),
			headCircumference: values.headCircumference
				? Number.parseFloat(values.headCircumference)
				: undefined,
			height: values.height ? Number.parseFloat(values.height) : undefined,
			id: measurement?.id || Date.now().toString(),
			notes: values.notes || undefined,
			weight: values.weight ? Number.parseFloat(values.weight) : undefined,
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
				<form onSubmit={handleSubmit(onSubmit)}>
					<div className="grid gap-4 py-4">
						<div className="space-y-2">
							<Label htmlFor="date">
								<fbt common>Date</fbt>
							</Label>
							<Input id="date" type="date" {...register('date')} />
						</div>

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

						{errors.root && (
							<div className="text-sm text-red-500">{errors.root.message}</div>
						)}
						{errors.weight && !errors.root && (
							<div className="text-sm text-red-500">
								<fbt desc="Message shown when no weight, height, or head circumference is provided. At least one is required">
									Please enter at least a weight, height, or head
									circumference.
								</fbt>
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
					<DialogFooter>
						<Button onClick={onClose} type="button" variant="outline">
							<fbt common>Cancel</fbt>
						</Button>
						<Button type="submit">
							<fbt common>Save</fbt>
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
