'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { fbt } from 'fbtee';
import React, { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Autocomplete } from '@/components/autocomplete';
import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { MedicationAdministration } from '@/types/medication';
import { MedicationRegimen } from '@/types/medication-regimen';
import { dateToDateInputValue } from '@/utils/date-to-date-input-value';
import { dateToTimeInputValue } from '@/utils/date-to-time-input-value';
import { MedicationAutocompleteOptionData } from '../types/medication-autocomplete-option';
import { calculateFrecencySuggestions } from '../utils/frecency-calculator';
import {
	MedicationAdministrationFormData,
	medicationAdministrationSchema,
} from '../validation/medication-administration-schema';

interface MedicationAdministrationFormProps {
	allAdministrations: readonly MedicationAdministration[];
	initialData?: MedicationAdministration;
	isOpen: boolean;
	onClose: () => void;
	onSubmit: (data: MedicationAdministrationFormData, id?: string) => void;
	regimens: readonly MedicationRegimen[];
}

export const MedicationAdministrationForm: React.FC<
	MedicationAdministrationFormProps
> = ({
	allAdministrations,
	initialData,
	isOpen,
	onClose,
	onSubmit,
	regimens,
}) => {
	const [datePart, setDatePart] = useState<string>(() =>
		dateToDateInputValue(
			initialData?.timestamp ? new Date(initialData.timestamp) : new Date(),
		),
	);
	const [timePart, setTimePart] = useState<string>(() =>
		dateToTimeInputValue(
			initialData?.timestamp ? new Date(initialData.timestamp) : new Date(),
		),
	);

	const form = useForm<MedicationAdministrationFormData>({
		defaultValues: {
			administrationStatus: initialData?.administrationStatus || 'On Time',
			details: initialData?.details || '',
			dosageAmount: initialData?.dosageAmount ?? Number.NaN,
			dosageUnit: initialData?.dosageUnit || '',
			medicationName: initialData?.medicationName || '',
			regimenId: initialData?.regimenId || undefined,
			timestamp: initialData?.timestamp || new Date().toISOString(),
		},
		resolver: zodResolver(medicationAdministrationSchema),
	});

	useEffect(() => {
		const newTimestamp = new Date(
			`${datePart}T${timePart}:00.000Z`,
		).toISOString();
		form.setValue('timestamp', newTimestamp, {
			shouldDirty: true,
			shouldValidate: true,
		});
	}, [datePart, timePart, form]);

	useEffect(() => {
		if (isOpen) {
			const initialTimestamp = initialData?.timestamp
				? new Date(initialData.timestamp)
				: new Date();
			setDatePart(dateToDateInputValue(initialTimestamp));
			setTimePart(dateToTimeInputValue(initialTimestamp));

			form.reset({
				administrationStatus: initialData?.administrationStatus || 'On Time',
				details: initialData?.details || '',
				dosageAmount: initialData?.dosageAmount ?? Number.NaN,
				dosageUnit: initialData?.dosageUnit || '',
				medicationName: initialData?.medicationName || '',
				regimenId: initialData?.regimenId || undefined,
				timestamp: initialTimestamp.toISOString(),
			});
		}
	}, [initialData, form, isOpen]);

	const medicationOptions = useMemo(() => {
		const regimenOptions: MedicationAutocompleteOptionData[] = regimens.map(
			(reg) => ({
				dosageAmount: reg.dosageAmount,
				dosageUnit: reg.dosageUnit,
				id: `regimen-${reg.id}`,
				isRegimen: true,
				label: reg.name,
				medicationName: reg.name,
				regimenId: reg.id,
			}),
		);

		const frecencyOptions = calculateFrecencySuggestions(allAdministrations);

		const frecencyOnlyOptions = frecencyOptions.filter(
			(frecOpt) =>
				!regimenOptions.some(
					(regOpt) =>
						regOpt.medicationName.toLowerCase() ===
							frecOpt.medicationName.toLowerCase() &&
						regOpt.dosageAmount === frecOpt.dosageAmount &&
						regOpt.dosageUnit.toLowerCase() ===
							frecOpt.dosageUnit.toLowerCase(),
				),
		);

		return [...regimenOptions, ...frecencyOnlyOptions];
	}, [regimens, allAdministrations]);

	const handleFormSubmit = (data: MedicationAdministrationFormData) => {
		onSubmit(data, initialData?.id);
		onClose();
	};

	if (!isOpen) {
		return null;
	}

	return (
		<Dialog onOpenChange={(open) => !open && onClose()} open={isOpen}>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>
						{initialData ? (
							<fbt desc="Dialog title for editing a medication entry">
								Edit Medication Entry
							</fbt>
						) : (
							<fbt desc="Dialog title for adding a new medication entry">
								Add Medication Entry
							</fbt>
						)}
					</DialogTitle>
					<DialogDescription>
						{initialData ? (
							<fbt desc="Dialog description for editing a medication entry">
								Update the details of this medication administration.
							</fbt>
						) : (
							<fbt desc="Dialog description for adding a new medication entry">
								Log a new medication administration.
							</fbt>
						)}
					</DialogDescription>
				</DialogHeader>
				<form
					className="space-y-4 max-h-[70vh] overflow-y-auto p-1 pr-3"
					onSubmit={form.handleSubmit(handleFormSubmit)}
				>
					<div className="space-y-1">
						<Label htmlFor="medicationName">
							<fbt desc="Label for medication name input">Medication Name</fbt>
						</Label>
						<Controller
							control={form.control}
							name="medicationName"
							render={({ field }) => (
								<Autocomplete
									inputClassName="w-full" // Ensure input takes full width
									onOptionSelect={(option) => {
										form.setValue('medicationName', option.medicationName, {
											shouldDirty: true,
											shouldValidate: true,
										});
										form.setValue('dosageAmount', option.dosageAmount, {
											shouldDirty: true,
										});
										form.setValue('dosageUnit', option.dosageUnit, {
											shouldDirty: true,
										});
										form.setValue('regimenId', option.regimenId, {
											shouldDirty: true,
										});
									}}
									onValueChange={(value) => {
										field.onChange(value);
										const matchedOption = medicationOptions.find(
											(opt) => opt.label === value,
										);
										if (!matchedOption) {
											form.setValue('dosageAmount', Number.NaN, {
												shouldDirty: true,
											});
											form.setValue('dosageUnit', '', { shouldDirty: true });
											form.setValue('regimenId', undefined, {
												shouldDirty: true,
											});
										}
									}}
									options={medicationOptions}
									placeholder={fbt(
										'Select or type medication...',
										'Placeholder for medication name autocomplete',
									).toString()}
									renderOption={(option) => (
										<div className="flex justify-between w-full">
											<span>{option.medicationName}</span>
											<span className="text-xs text-muted-foreground ml-2">
												{option.dosageAmount} {option.dosageUnit}
												{option.isRegimen && ' (Regimen)'}
											</span>
										</div>
									)}
									value={field.value}
								/>
							)}
						/>
						{form.formState.errors.medicationName && (
							<p className="text-sm text-red-500">
								{form.formState.errors.medicationName.message}
							</p>
						)}
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-1">
							<Label htmlFor="dosageAmount">
								<fbt desc="Label for dosage amount input">Dosage Amount</fbt>
							</Label>
							<Input
								id="dosageAmount"
								step="any"
								type="number"
								{...form.register('dosageAmount', { valueAsNumber: true })}
								onChange={(e) => {
									const num = Number.parseFloat(e.target.value);
									form.setValue(
										'dosageAmount',
										Number.isNaN(num) ? Number.NaN : num,
										{ shouldDirty: true, shouldValidate: true },
									);
								}}
								value={form.watch('dosageAmount') || ''}
							/>
							{form.formState.errors.dosageAmount && (
								<p className="text-sm text-red-500">
									{form.formState.errors.dosageAmount.message}
								</p>
							)}
						</div>
						<div className="space-y-1">
							<Label htmlFor="dosageUnit">
								<fbt desc="Label for dosage unit input">Unit</fbt>
							</Label>
							<Input
								id="dosageUnit"
								{...form.register('dosageUnit')}
								placeholder={fbt(
									'e.g., ml, mg, drops',
									'Placeholder for dosage unit input',
								).toString()}
							/>
							{form.formState.errors.dosageUnit && (
								<p className="text-sm text-red-500">
									{form.formState.errors.dosageUnit.message}
								</p>
							)}
						</div>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-1">
							<Label htmlFor="adminDate">
								<fbt common>Date</fbt>
							</Label>
							<Input
								id="adminDate"
								onChange={(e) => setDatePart(e.target.value)}
								type="date"
								value={datePart}
							/>
						</div>
						<div className="space-y-1">
							<Label htmlFor="adminTime">
								<fbt common>Time</fbt>
							</Label>
							<Input
								id="adminTime"
								onChange={(e) => setTimePart(e.target.value)}
								type="time"
								value={timePart}
							/>
						</div>
					</div>
					<input type="hidden" {...form.register('timestamp')} />
					{form.formState.errors.timestamp && (
						<p className="text-sm text-red-500">
							{form.formState.errors.timestamp.message}
						</p>
					)}

					<div className="space-y-1">
						<Label>
							<fbt desc="Label for administration status radio group">
								Administration Status
							</fbt>
						</Label>
						<Controller
							control={form.control}
							name="administrationStatus"
							render={({ field }) => (
								<RadioGroup
									className="flex space-x-4 pt-1"
									onValueChange={field.onChange}
									value={field.value}
								>
									{(['On Time', 'Missed', 'Adjusted'] as const).map(
										(status) => (
											<div className="flex items-center space-x-2" key={status}>
												<RadioGroupItem
													id={`status-${status}`}
													value={status}
												/>
												<Label htmlFor={`status-${status}`}>{status}</Label>
											</div>
										),
									)}
								</RadioGroup>
							)}
						/>
						{form.formState.errors.administrationStatus && (
							<p className="text-sm text-red-500">
								{form.formState.errors.administrationStatus.message}
							</p>
						)}
					</div>

					<div className="space-y-1">
						<Label htmlFor="details">
							<fbt desc="Label for optional details/notes textarea">
								Details/Notes (Optional)
							</fbt>
						</Label>
						<Textarea
							id="details"
							{...form.register('details')}
							placeholder={fbt(
								'e.g., child spit out some, given with food',
								'Placeholder for medication administration notes',
							).toString()}
						/>
					</div>

					<DialogFooter>
						<Button onClick={onClose} type="button" variant="outline">
							<fbt common>Cancel</fbt>
						</Button>
						<Button disabled={form.formState.isSubmitting} type="submit">
							{initialData ? (
								<fbt desc="Button text to save changes to an existing medication entry">
									Save Changes
								</fbt>
							) : (
								<fbt desc="Button text to save a new medication entry">
									Save Entry
								</fbt>
							)}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
};
